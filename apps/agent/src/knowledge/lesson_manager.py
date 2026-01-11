"""
Lesson Knowledge Manager

Manages structured lesson content for avatar teaching.
Provides direct JSON access to exercises, vocabulary, and grammar rules.
"""

import logging
import random
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger("lesson-manager")


@dataclass
class LessonIndex:
    """Lightweight index of a lesson for quick matching."""
    content_id: str
    title: str
    topic: str
    level: str
    exercise_count: int
    vocabulary_count: int
    grammar_count: int
    keywords: List[str]


@dataclass
class ExerciseState:
    """Tracks current exercise state within a session."""
    progress_id: Optional[str] = None
    content_id: Optional[str] = None
    exercise_id: Optional[str] = None
    exercise_title: Optional[str] = None
    current_item_index: int = 0
    items: List[Dict] = field(default_factory=list)
    attempts: List[Dict] = field(default_factory=list)


@dataclass
class VocabDrillState:
    """State for vocabulary drilling session."""
    mode: str  # "en_to_de", "de_to_en", "definition", "mixed"
    content_id: Optional[str] = None
    items: List[Dict] = field(default_factory=list)
    current_index: int = 0
    results: List[Dict] = field(default_factory=list)


class LessonKnowledgeManager:
    """Manages structured lesson content for avatar."""

    def __init__(self, convex_client):
        self.convex = convex_client
        self.index: List[LessonIndex] = []
        self.content_cache: Dict[str, Any] = {}  # content_id -> full jsonContent
        self.avatar_id: Optional[str] = None

    async def load_index(self, avatar_id: str) -> None:
        """Load lesson index at session start."""
        self.avatar_id = avatar_id
        try:
            index_data = await self.convex.query(
                "knowledgeBases:getAvatarLessonIndex",
                {"avatarId": avatar_id}
            )

            if not index_data:
                logger.info(f"No lesson content found for avatar {avatar_id}")
                return

            self.index = [
                LessonIndex(
                    content_id=item["_id"],
                    title=item.get("title", ""),
                    topic=item.get("topic", "") or "",
                    level=item.get("level", "") or "",
                    exercise_count=item.get("exerciseCount", 0),
                    vocabulary_count=item.get("vocabularyCount", 0),
                    grammar_count=item.get("grammarCount", 0),
                    keywords=item.get("keywords", []),
                )
                for item in index_data
            ]

            logger.info(f"Loaded lesson index: {len(self.index)} lessons for avatar {avatar_id}")
            for lesson in self.index:
                logger.info(f"  - {lesson.title} ({lesson.level}): {lesson.exercise_count} exercises, {lesson.vocabulary_count} vocab")
        except Exception as e:
            logger.error(f"Failed to load lesson index: {e}")

    def match_query(self, user_text: str) -> List[LessonIndex]:
        """Find lessons matching user query using pattern matching."""
        text_lower = user_text.lower()
        matches = []

        # Pattern triggers for different content types
        triggers = {
            "exercise": ["exercise", "übung", "practice", "test", "quiz", "question"],
            "grammar": ["grammar", "grammatik", "rule", "tense", "modal", "verb", "conjugat"],
            "vocabulary": ["vocabulary", "vocab", "word", "vokabel", "wort", "term"],
        }

        for lesson in self.index:
            score = 0

            # Check keyword matches
            for keyword in lesson.keywords:
                if keyword and keyword in text_lower:
                    score += 2

            # Check trigger matches
            for category, words in triggers.items():
                if any(w in text_lower for w in words):
                    if category == "exercise" and lesson.exercise_count > 0:
                        score += 3
                    elif category == "grammar" and lesson.grammar_count > 0:
                        score += 3
                    elif category == "vocabulary" and lesson.vocabulary_count > 0:
                        score += 3

            if score > 0:
                matches.append((score, lesson))

        # Sort by score and return top matches
        matches.sort(key=lambda x: x[0], reverse=True)
        return [m[1] for m in matches[:2]]  # Max 2 lessons

    async def get_content(self, content_id: str) -> Optional[Dict]:
        """Get full JSON content, using cache if available."""
        if content_id in self.content_cache:
            return self.content_cache[content_id]

        try:
            content = await self.convex.query(
                "knowledgeBases:getContentById",
                {"contentId": content_id}
            )

            if content and content.get("jsonContent"):
                self.content_cache[content_id] = content["jsonContent"]
                return content["jsonContent"]
        except Exception as e:
            logger.error(f"Failed to get content {content_id}: {e}")

        return None

    def format_for_context(self, json_content: Dict, focus: str = "all") -> str:
        """Format JSON content for LLM context injection."""
        parts = []
        content = json_content.get("content", {})
        metadata = json_content.get("metadata", {})

        parts.append(f"[LESSON: {metadata.get('title', 'Untitled')}]")
        parts.append(f"Level: {metadata.get('level', 'Unknown')}")
        parts.append(f"Topic: {metadata.get('topic', 'Unknown')}")

        # Include relevant sections based on focus
        if focus in ["all", "exercises"] and content.get("exercises"):
            parts.append("\n## EXERCISES:")
            for ex in content["exercises"]:
                parts.append(f"\n### {ex.get('title', 'Exercise')}")
                parts.append(f"Type: {ex.get('type', 'unknown')}")
                parts.append(f"Instructions: {ex.get('instructions', '')}")
                for item in ex.get("items", [])[:5]:  # Limit items
                    parts.append(f"- Q: {item.get('question', '')}")
                    parts.append(f"  A: {item.get('correctAnswer', '')}")
                    if item.get("explanation"):
                        parts.append(f"  Explanation: {item['explanation']}")

        if focus in ["all", "grammar"] and content.get("grammarRules"):
            parts.append("\n## GRAMMAR RULES:")
            for rule in content["grammarRules"]:
                parts.append(f"\n### {rule.get('name', 'Rule')}")
                parts.append(f"Category: {rule.get('category', 'general')}")
                parts.append(f"Formula: {rule.get('formula', '')}")
                parts.append(f"Explanation: {rule.get('rule', '')}")
                for ex in rule.get("examples", [])[:3]:
                    parts.append(f"  Correct: {ex.get('correct', '')}")
                    if ex.get("incorrect"):
                        parts.append(f"  Incorrect: {ex['incorrect']}")
                    if ex.get("explanation"):
                        parts.append(f"  Why: {ex['explanation']}")

        if focus in ["all", "vocabulary"] and content.get("vocabulary"):
            parts.append("\n## VOCABULARY:")
            for vocab in content["vocabulary"][:15]:  # Limit vocab
                parts.append(f"- {vocab.get('term', '')} ({vocab.get('termDe', '')})")
                parts.append(f"  Definition: {vocab.get('definition', '')}")
                if vocab.get("exampleSentence"):
                    parts.append(f"  Example: {vocab['exampleSentence']}")

        parts.append("\n[END LESSON]")
        return "\n".join(parts)

    def get_summary(self) -> str:
        """Get a summary of available lessons for system prompt."""
        if not self.index:
            return "No lesson materials loaded."

        lines = ["You have access to the following lesson materials:"]
        for lesson in self.index:
            lines.append(f"- {lesson.title} ({lesson.level}): {lesson.topic}")
            details = []
            if lesson.exercise_count:
                details.append(f"{lesson.exercise_count} exercises")
            if lesson.grammar_count:
                details.append(f"{lesson.grammar_count} grammar rules")
            if lesson.vocabulary_count:
                details.append(f"{lesson.vocabulary_count} vocabulary")
            if details:
                lines.append(f"  Contains: {', '.join(details)}")
        return "\n".join(lines)

    async def get_slide_metadata(self, content_id: str) -> Optional[Dict]:
        """
        Get slide metadata for a knowledge content item.

        Returns:
            {
                "contentId": str,
                "title": str,
                "slideCount": int,
                "slides": [
                    {
                        "index": int,
                        "title": str,
                        "type": str,
                        "teachingPrompt": str
                    }
                ]
            }
        """
        try:
            content = await self.convex.query(
                "knowledgeBases:getContentById",
                {"contentId": content_id}
            )

            if not content:
                logger.warning(f"Content not found: {content_id}")
                return None

            html_slides = content.get("htmlSlides", [])
            if not html_slides:
                logger.info(f"No HTML slides in content: {content_id}")
                return None

            slides = []
            for slide in html_slides:
                slides.append({
                    "index": slide.get("index", 0),
                    "title": slide.get("title", f"Slide {slide.get('index', 0) + 1}"),
                    "type": slide.get("type", "content"),
                    "teachingPrompt": slide.get("teachingPrompt", ""),
                })

            return {
                "contentId": content_id,
                "title": content.get("title", "Untitled"),
                "slideCount": len(slides),
                "slides": slides,
            }

        except Exception as e:
            logger.error(f"Failed to get slide metadata: {e}")
            return None

    async def get_slides_for_loading(self, content_id: str) -> Optional[Dict]:
        """
        Get full slide data for loading into the whiteboard.

        Returns data suitable for sending to frontend via data channel.
        """
        try:
            content = await self.convex.query(
                "knowledgeBases:getContentById",
                {"contentId": content_id}
            )

            if not content:
                return None

            html_slides = content.get("htmlSlides", [])
            if not html_slides:
                return None

            return {
                "type": "load_slides",
                "contentId": content_id,
                "title": content.get("title", "Untitled"),
                "slides": html_slides,
                "slideCount": len(html_slides),
            }

        except Exception as e:
            logger.error(f"Failed to get slides for loading: {e}")
            return None

    async def get_session_summary(self, session_id: str) -> Dict:
        """Get comprehensive progress summary for context."""
        try:
            progress = await self.convex.query(
                "exerciseProgress:getSessionProgress",
                {"sessionId": session_id}
            )

            if not progress:
                return {
                    "exercises_started": 0,
                    "exercises_completed": 0,
                    "average_score": 0,
                }

            completed = [p for p in progress if p.get("status") == "completed"]
            scores = [p.get("score", 0) for p in completed if p.get("score") is not None]

            return {
                "exercises_started": len(progress),
                "exercises_completed": len(completed),
                "average_score": sum(scores) / len(scores) if scores else 0,
            }
        except Exception as e:
            logger.error(f"Failed to get session summary: {e}")
            return {"exercises_started": 0, "exercises_completed": 0, "average_score": 0}

    def format_progress_for_context(self, summary: Dict) -> str:
        """Format progress summary for LLM context."""
        return f"""[SESSION PROGRESS]
Exercises started: {summary['exercises_started']}
Exercises completed: {summary['exercises_completed']}
Average score: {summary['average_score']:.0f}%
"""


class ExerciseTracker:
    """Manages exercise flow and scoring."""

    def __init__(self, convex_client, session_id: str, student_id: str):
        self.convex = convex_client
        self.session_id = session_id
        self.student_id = student_id
        self.current: Optional[ExerciseState] = None

    async def start_exercise(
        self, content_id: str, exercise_id: str, exercise_title: str, items: List[Dict]
    ) -> str:
        """Start a new exercise, return progress ID."""
        try:
            progress_id = await self.convex.mutation(
                "exerciseProgress:startExercise",
                {
                    "sessionId": self.session_id,
                    "studentId": self.student_id,
                    "contentId": content_id,
                    "exerciseId": exercise_id,
                }
            )
            self.current = ExerciseState(
                progress_id=progress_id,
                content_id=content_id,
                exercise_id=exercise_id,
                exercise_title=exercise_title,
                items=items,
            )
            logger.info(f"Started exercise {exercise_id} with {len(items)} items")
            return progress_id
        except Exception as e:
            logger.error(f"Failed to start exercise: {e}")
            raise

    def get_current_item(self) -> Optional[Dict]:
        """Get the current exercise item."""
        if not self.current or self.current.current_item_index >= len(self.current.items):
            return None
        return self.current.items[self.current.current_item_index]

    def is_active(self) -> bool:
        """Check if an exercise is currently active."""
        return self.current is not None and self.current.current_item_index < len(self.current.items)

    async def check_answer(self, student_answer: str) -> Dict:
        """Check student's answer, return result with feedback."""
        if not self.current:
            return {"error": "No active exercise"}

        item = self.get_current_item()
        if not item:
            return {"error": "No more items"}

        # Check correctness (fuzzy matching)
        correct_answer = item.get("correctAnswer", "").strip().lower()
        acceptable = [a.strip().lower() for a in item.get("acceptableAnswers", [])]
        acceptable.append(correct_answer)

        student_lower = student_answer.strip().lower()
        is_correct = student_lower in acceptable

        # Record attempt
        try:
            await self.convex.mutation(
                "exerciseProgress:recordAttempt",
                {
                    "progressId": self.current.progress_id,
                    "itemId": item.get("id", "unknown"),
                    "answer": student_answer,
                    "correct": is_correct,
                }
            )
        except Exception as e:
            logger.error(f"Failed to record attempt: {e}")

        self.current.attempts.append({
            "item_id": item.get("id", "unknown"),
            "answer": student_answer,
            "correct": is_correct,
        })

        result = {
            "correct": is_correct,
            "correct_answer": item.get("correctAnswer"),
            "explanation": item.get("explanation", ""),
            "hint": item.get("hint", "") if not is_correct else None,
        }

        # Move to next item if correct
        if is_correct:
            self.current.current_item_index += 1
            result["has_next"] = self.current.current_item_index < len(self.current.items)
            if not result["has_next"]:
                result["exercise_complete"] = True
                result["score"] = self._calculate_score()

        return result

    def _calculate_score(self) -> int:
        """Calculate exercise score (0-100)."""
        if not self.current or not self.current.items:
            return 0

        # Count first correct attempts per item
        first_correct = {}
        for attempt in self.current.attempts:
            item_id = attempt.get("item_id")
            if item_id not in first_correct and attempt.get("correct"):
                first_correct[item_id] = True

        correct = len(first_correct)
        total = len(self.current.items)
        return int((correct / total) * 100) if total > 0 else 0

    async def complete(self) -> Dict:
        """Complete current exercise and save score."""
        if not self.current:
            return {"error": "No active exercise"}

        score = self._calculate_score()

        try:
            await self.convex.mutation(
                "exerciseProgress:completeExercise",
                {
                    "progressId": self.current.progress_id,
                    "score": score,
                }
            )
        except Exception as e:
            logger.error(f"Failed to complete exercise: {e}")

        result = {
            "completed": True,
            "score": score,
            "total_items": len(self.current.items),
            "correct_answers": sum(1 for a in self.current.attempts if a.get("correct")),
        }
        self.current = None
        return result

    def format_current_for_context(self) -> str:
        """Format current exercise state for LLM context."""
        if not self.current:
            return ""

        item = self.get_current_item()
        if not item:
            return "[All exercise items completed]"

        attempts_on_current = len([
            a for a in self.current.attempts
            if a.get("item_id") == item.get("id")
        ])

        return f"""[CURRENT EXERCISE: {self.current.exercise_title or self.current.exercise_id}]
Item {self.current.current_item_index + 1} of {len(self.current.items)}
Question: {item.get('question', '')}
Type: {item.get('type', 'unknown')}
Previous attempts on this item: {attempts_on_current}
Correct answer (for your reference): {item.get('correctAnswer', '')}
"""


class VocabularyDriller:
    """Manages vocabulary drilling with spaced repetition."""

    def __init__(self, convex_client, student_id: str):
        self.convex = convex_client
        self.student_id = student_id
        self.current: Optional[VocabDrillState] = None

    async def get_due_vocabulary(self, limit: int = 10) -> List[Dict]:
        """Get vocabulary items due for review."""
        try:
            return await self.convex.query(
                "vocabularyProgress:getDueVocabulary",
                {"studentId": self.student_id, "limit": limit}
            )
        except Exception as e:
            logger.error(f"Failed to get due vocabulary: {e}")
            return []

    def start_drill(
        self, vocabulary: List[Dict], content_id: Optional[str] = None, mode: str = "mixed"
    ) -> Dict:
        """Start a vocabulary drill session."""
        items = vocabulary.copy()
        random.shuffle(items)

        self.current = VocabDrillState(
            mode=mode,
            content_id=content_id,
            items=items,
        )

        if not items:
            return {"error": "No vocabulary items to drill"}

        return {
            "started": True,
            "total_items": len(items),
            "mode": mode,
            "first_item": self._format_question(items[0], mode),
        }

    def is_active(self) -> bool:
        """Check if a drill is currently active."""
        return (
            self.current is not None
            and self.current.current_index < len(self.current.items)
        )

    def _format_question(self, vocab: Dict, mode: str) -> Dict:
        """Format a vocab item as a drill question."""
        if mode == "mixed":
            mode = random.choice(["en_to_de", "de_to_en", "definition"])

        if mode == "en_to_de":
            return {
                "question": f"What is the German translation of: **{vocab.get('term', '')}**?",
                "answer": vocab.get("termDe", ""),
                "hint": (vocab.get("definition", "") or "")[:50] + "..." if vocab.get("definition") else None,
                "mode": mode,
            }
        elif mode == "de_to_en":
            return {
                "question": f"What is the English translation of: **{vocab.get('termDe', '')}**?",
                "answer": vocab.get("term", ""),
                "hint": vocab.get("partOfSpeech", ""),
                "mode": mode,
            }
        else:  # definition
            return {
                "question": f"What word matches this definition: {vocab.get('definition', '')}?",
                "answer": vocab.get("term", ""),
                "hint": f"German: {vocab.get('termDe', '')}",
                "mode": mode,
            }

    async def check_answer(self, student_answer: str) -> Dict:
        """Check vocabulary drill answer."""
        if not self.current:
            return {"error": "No active drill"}

        if self.current.current_index >= len(self.current.items):
            return {"error": "Drill already completed"}

        item = self.current.items[self.current.current_index]
        question = self._format_question(item, self.current.mode)

        # Fuzzy matching
        correct_answer = question["answer"].strip().lower()
        student_lower = student_answer.strip().lower()

        # Allow for minor typos (Levenshtein distance <= 2 for words > 5 chars)
        is_correct = student_lower == correct_answer or (
            len(correct_answer) > 5 and
            self._levenshtein(student_lower, correct_answer) <= 2
        )

        # Calculate SM-2 quality (0-5)
        if is_correct:
            quality = 5 if student_lower == correct_answer else 4
        else:
            quality = 2

        # Record to Convex
        content_id = self.current.content_id or item.get("contentId")
        if content_id:
            try:
                await self.convex.mutation(
                    "vocabularyProgress:recordVocabReview",
                    {
                        "studentId": self.student_id,
                        "contentId": content_id,
                        "vocabId": item.get("id", item.get("vocabId", "")),
                        "term": item.get("term", ""),
                        "termDe": item.get("termDe", ""),
                        "quality": quality,
                    }
                )
            except Exception as e:
                logger.error(f"Failed to record vocab review: {e}")

        self.current.results.append({
            "vocab_id": item.get("id", item.get("vocabId", "")),
            "correct": is_correct,
            "quality": quality,
        })

        result = {
            "correct": is_correct,
            "correct_answer": question["answer"],
            "example": item.get("exampleSentence", ""),
        }

        # Move to next
        self.current.current_index += 1
        if self.current.current_index < len(self.current.items):
            next_item = self.current.items[self.current.current_index]
            result["next_question"] = self._format_question(next_item, self.current.mode)
            result["progress"] = f"{self.current.current_index + 1}/{len(self.current.items)}"
        else:
            result["drill_complete"] = True
            result["summary"] = self._get_summary()
            self.current = None

        return result

    def _get_summary(self) -> Dict:
        """Get drill session summary."""
        if not self.current:
            return {}
        correct = sum(1 for r in self.current.results if r.get("correct"))
        total = len(self.current.results)
        return {
            "total": total,
            "correct": correct,
            "accuracy": f"{(correct / total) * 100:.0f}%" if total > 0 else "0%",
        }

    @staticmethod
    def _levenshtein(s1: str, s2: str) -> int:
        """Calculate Levenshtein distance between two strings."""
        if len(s1) < len(s2):
            return VocabularyDriller._levenshtein(s2, s1)
        if len(s2) == 0:
            return len(s1)

        prev_row = list(range(len(s2) + 1))
        for i, c1 in enumerate(s1):
            curr_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = prev_row[j + 1] + 1
                deletions = curr_row[j] + 1
                substitutions = prev_row[j] + (c1 != c2)
                curr_row.append(min(insertions, deletions, substitutions))
            prev_row = curr_row

        return prev_row[-1]

    def format_for_context(self) -> str:
        """Format current drill state for LLM."""
        if not self.current:
            return ""

        if self.current.current_index >= len(self.current.items):
            return "[Vocabulary drill complete]"

        item = self.current.items[self.current.current_index]
        q = self._format_question(item, self.current.mode)

        return f"""[VOCABULARY DRILL]
Mode: {self.current.mode}
Progress: {self.current.current_index + 1}/{len(self.current.items)}
Current Question: {q['question']}
Correct Answer (for your reference): {q['answer']}
Hint available: {"Yes" if q.get('hint') else "No"}
"""
