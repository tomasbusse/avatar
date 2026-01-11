"""Game Context Integration for Avatar Agent.

Provides game-aware conversation capabilities for the avatar.
The avatar can guide students through games, give hints, and celebrate progress.

Latency: <5ms for context generation (no LLM needed for game logic)
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger("beethoven-agent.game-context")


class GameType(Enum):
    SENTENCE_BUILDER = "sentence_builder"
    FILL_IN_BLANK = "fill_in_blank"
    WORD_ORDERING = "word_ordering"
    MATCHING_PAIRS = "matching_pairs"
    WORD_SCRAMBLE = "word_scramble"
    MULTIPLE_CHOICE = "multiple_choice"
    FLASHCARDS = "flashcards"
    HANGMAN = "hangman"
    CROSSWORD = "crossword"


@dataclass
class GameState:
    """Current state of an active game."""
    game_id: str
    game_type: GameType
    title: str
    instructions: str
    level: str  # A1, A2, B1, B2, C1, C2

    # Current progress
    current_item_index: int = 0
    total_items: int = 0
    correct_answers: int = 0
    incorrect_answers: int = 0
    hints_used: int = 0
    hints_available: int = 3

    # Current item being worked on
    current_item: Dict[str, Any] = field(default_factory=dict)
    hints: List[str] = field(default_factory=list)

    # Game config (full data)
    config: Dict[str, Any] = field(default_factory=dict)


class GameContextManager:
    """Manages game state and generates context for avatar conversations.

    Usage:
        game_mgr = GameContextManager(convex_client)

        # When game starts
        await game_mgr.load_game(game_id, session_id)

        # On each turn
        context = game_mgr.get_conversation_context()
        # Inject into LLM prompt

        # When student answers
        response = game_mgr.evaluate_answer(student_answer)
        # Avatar uses this to respond appropriately
    """

    def __init__(self, convex_client):
        self.convex = convex_client
        self.current_game: Optional[GameState] = None
        self._game_session_id: Optional[str] = None

    async def load_game(self, game_id: str, session_id: Optional[str] = None) -> GameState:
        """Load a game and initialize state."""
        game_data = await self.convex.query(
            "wordGames:getGame",
            {"gameId": game_id}
        )

        if not game_data:
            raise ValueError(f"Game not found: {game_id}")

        config = game_data.get("config", {})
        items = self._extract_items(config, game_data.get("type"))

        self.current_game = GameState(
            game_id=game_id,
            game_type=GameType(game_data.get("type", "multiple_choice")),
            title=game_data.get("title", ""),
            instructions=game_data.get("instructions", ""),
            level=game_data.get("level", "A1"),
            total_items=len(items),
            hints=game_data.get("hints", []),
            hints_available=game_data.get("difficultyConfig", {}).get("hintsAvailable", 3),
            config=config,
            current_item=items[0] if items else {},
        )

        self._game_session_id = session_id
        logger.info(f"Loaded game: {self.current_game.title} ({self.current_game.game_type.value})")

        return self.current_game

    def _extract_items(self, config: Dict, game_type: str) -> List[Dict]:
        """Extract items from game config based on type."""
        if "items" in config:
            return config["items"]
        elif "pairs" in config:
            return config["pairs"]
        elif "cards" in config:
            return config["cards"]
        elif "words" in config:
            return [{"word": w} for w in config["words"]]
        return []

    def get_conversation_context(self) -> str:
        """Generate context for the LLM about the current game state.

        This is injected into the avatar's system prompt so it knows
        what game is active and can guide the student.
        """
        if not self.current_game:
            return ""

        g = self.current_game

        # Build context based on game type
        context_parts = [
            f"[ACTIVE GAME: {g.title}]",
            f"Type: {g.game_type.value}",
            f"Level: {g.level}",
            f"Progress: {g.current_item_index + 1}/{g.total_items}",
            f"Score: {g.correct_answers} correct, {g.incorrect_answers} incorrect",
            f"",
            f"Instructions to give student: {g.instructions}",
        ]

        # Add current item details based on game type
        item_context = self._format_current_item()
        if item_context:
            context_parts.append("")
            context_parts.append("CURRENT ITEM:")
            context_parts.append(item_context)

        # Add available hints (for avatar to use strategically)
        if g.hints and g.hints_used < g.hints_available:
            context_parts.append("")
            context_parts.append(f"HINTS AVAILABLE ({g.hints_available - g.hints_used} remaining):")
            for i, hint in enumerate(g.hints[:3]):
                context_parts.append(f"  {i+1}. {hint}")

        # Add teaching guidance
        context_parts.append("")
        context_parts.append(self._get_teaching_guidance())

        return "\n".join(context_parts)

    def _format_current_item(self) -> str:
        """Format current item details for context."""
        if not self.current_game or not self.current_game.current_item:
            return ""

        item = self.current_game.current_item
        game_type = self.current_game.game_type

        if game_type == GameType.SENTENCE_BUILDER:
            words = item.get("words", [])
            return f"Words to arrange: {', '.join(words)}\nCorrect sentence: {item.get('correctSentence', '')}"

        elif game_type == GameType.FILL_IN_BLANK:
            return f"Sentence: {item.get('sentence', '')}\nCorrect answer: {item.get('correctAnswer', '')}"

        elif game_type == GameType.WORD_ORDERING:
            words = item.get("words", [])
            return f"Words: {', '.join(words)}\nCorrect order forms: {item.get('correctSentence', '')}"

        elif game_type == GameType.MATCHING_PAIRS:
            return f"Match: {item.get('term', '')} ↔ {item.get('definition', '')}"

        elif game_type == GameType.WORD_SCRAMBLE:
            return f"Scrambled: {item.get('scrambled', '')}\nAnswer: {item.get('word', '')}"

        elif game_type == GameType.MULTIPLE_CHOICE:
            options = item.get("options", [])
            options_str = "\n".join([f"  {chr(65+i)}. {opt}" for i, opt in enumerate(options)])
            return f"Question: {item.get('question', '')}\nOptions:\n{options_str}\nCorrect: {item.get('correctAnswer', '')}"

        elif game_type == GameType.FLASHCARDS:
            return f"Front: {item.get('front', '')}\nBack: {item.get('back', '')}"

        elif game_type == GameType.HANGMAN:
            return f"Word to guess: {item.get('word', '')} (Don't reveal this!)\nHint: {item.get('hint', '')}"

        elif game_type == GameType.CROSSWORD:
            clues = item.get("clues", [])
            clues_str = "\n".join([f"  {c.get('number', '')}: {c.get('clue', '')}" for c in clues[:5]])
            return f"Clues:\n{clues_str}"

        return str(item)

    def _get_teaching_guidance(self) -> str:
        """Get contextual teaching guidance for the avatar."""
        if not self.current_game:
            return ""

        g = self.current_game

        # Adaptive guidance based on performance
        if g.incorrect_answers > g.correct_answers and g.current_item_index > 2:
            return """TEACHING GUIDANCE:
Student is struggling. Be encouraging and offer hints proactively.
Consider switching to German briefly to explain difficult concepts.
Break down the problem into smaller steps."""

        elif g.correct_answers > 3 and g.incorrect_answers == 0:
            return """TEACHING GUIDANCE:
Student is doing great! Keep the energy up with positive reinforcement.
You can increase the challenge by asking follow-up questions.
"Can you use this word in a different sentence?" """

        else:
            return """TEACHING GUIDANCE:
Guide the student through the game naturally.
Wait for their answer before providing feedback.
If they're stuck, offer a hint after 10+ seconds of silence."""

    def evaluate_answer(self, student_answer: str) -> Dict[str, Any]:
        """Evaluate student's answer and return feedback for the avatar.

        Returns structured feedback the avatar can use to respond naturally.
        """
        if not self.current_game or not self.current_game.current_item:
            return {"error": "No active game"}

        item = self.current_game.current_item
        game_type = self.current_game.game_type

        # Get correct answer based on game type
        correct_answer = self._get_correct_answer(item, game_type)

        # Normalize for comparison
        student_normalized = student_answer.lower().strip()
        correct_normalized = correct_answer.lower().strip()

        # Check correctness (with fuzzy matching for typos)
        is_correct = self._check_answer(student_normalized, correct_normalized)

        # Build feedback
        if is_correct:
            self.current_game.correct_answers += 1
            feedback = {
                "correct": True,
                "celebration": self._get_celebration_phrase(),
                "explanation": item.get("explanation", ""),
                "can_continue": self.current_game.current_item_index < self.current_game.total_items - 1,
            }
            # Move to next item
            self._advance_to_next_item()
        else:
            self.current_game.incorrect_answers += 1
            feedback = {
                "correct": False,
                "encouragement": self._get_encouragement_phrase(),
                "hint": self._get_next_hint() if self.current_game.hints_used < self.current_game.hints_available else None,
                "correct_answer": correct_answer,  # Avatar decides whether to reveal
                "try_again": True,
            }

        return feedback

    def _get_correct_answer(self, item: Dict, game_type: GameType) -> str:
        """Extract correct answer from item based on game type."""
        if game_type == GameType.SENTENCE_BUILDER:
            return item.get("correctSentence", "")
        elif game_type == GameType.FILL_IN_BLANK:
            return item.get("correctAnswer", "")
        elif game_type == GameType.WORD_ORDERING:
            return item.get("correctSentence", "")
        elif game_type == GameType.MATCHING_PAIRS:
            return item.get("definition", "")
        elif game_type == GameType.WORD_SCRAMBLE:
            return item.get("word", "")
        elif game_type == GameType.MULTIPLE_CHOICE:
            return item.get("correctAnswer", "")
        elif game_type == GameType.FLASHCARDS:
            return item.get("back", "")
        elif game_type == GameType.HANGMAN:
            return item.get("word", "")
        return ""

    def _check_answer(self, student: str, correct: str) -> bool:
        """Check if answer is correct, allowing minor typos."""
        if student == correct:
            return True

        # Allow for common variations
        if student.replace("'", "'") == correct.replace("'", "'"):
            return True

        # Simple Levenshtein for typo tolerance (max 1 error for short, 2 for long)
        max_errors = 1 if len(correct) < 8 else 2
        return self._levenshtein(student, correct) <= max_errors

    @staticmethod
    def _levenshtein(s1: str, s2: str) -> int:
        """Calculate Levenshtein distance."""
        if len(s1) < len(s2):
            return GameContextManager._levenshtein(s2, s1)
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

    def _advance_to_next_item(self) -> None:
        """Move to the next game item."""
        if not self.current_game:
            return

        self.current_game.current_item_index += 1
        items = self._extract_items(self.current_game.config, self.current_game.game_type.value)

        if self.current_game.current_item_index < len(items):
            self.current_game.current_item = items[self.current_game.current_item_index]
        else:
            self.current_game.current_item = {}

    def _get_next_hint(self) -> Optional[str]:
        """Get the next available hint."""
        if not self.current_game or not self.current_game.hints:
            return None

        if self.current_game.hints_used < len(self.current_game.hints):
            hint = self.current_game.hints[self.current_game.hints_used]
            self.current_game.hints_used += 1
            return hint
        return None

    def _get_celebration_phrase(self) -> str:
        """Get a contextual celebration phrase."""
        if not self.current_game:
            return "Well done!"

        streak = self.current_game.correct_answers

        if streak >= 5:
            return "Fantastisch! You're on fire! 🔥"
        elif streak >= 3:
            return "Excellent! You're getting really good at this!"
        elif streak == 1:
            return "That's right! Good job!"
        else:
            return "Correct! Keep it up!"

    def _get_encouragement_phrase(self) -> str:
        """Get a contextual encouragement phrase."""
        if not self.current_game:
            return "Try again!"

        attempts = self.current_game.incorrect_answers

        if attempts >= 3:
            return "Das ist schwierig, oder? Let me help you..."
        elif attempts == 2:
            return "Not quite. Would you like a hint?"
        else:
            return "Almost! Try one more time."

    def get_game_summary(self) -> Dict[str, Any]:
        """Get summary when game ends."""
        if not self.current_game:
            return {}

        g = self.current_game
        total = g.correct_answers + g.incorrect_answers
        accuracy = (g.correct_answers / total * 100) if total > 0 else 0

        # Calculate stars (1-3)
        if accuracy >= 90:
            stars = 3
        elif accuracy >= 70:
            stars = 2
        else:
            stars = 1

        return {
            "game_title": g.title,
            "items_completed": g.current_item_index,
            "total_items": g.total_items,
            "correct_answers": g.correct_answers,
            "incorrect_answers": g.incorrect_answers,
            "accuracy": round(accuracy, 1),
            "stars": stars,
            "hints_used": g.hints_used,
            "celebration_message": self._get_final_message(stars, accuracy),
        }

    def _get_final_message(self, stars: int, accuracy: float) -> str:
        """Get final celebration message based on performance."""
        if stars == 3:
            return "Outstanding! Du bist ein Superstar! ⭐⭐⭐"
        elif stars == 2:
            return "Great job! You're making excellent progress! ⭐⭐"
        else:
            return "Good effort! Practice makes perfect. Keep going! ⭐"

    def use_hint(self) -> Optional[str]:
        """Manually trigger a hint (when student asks for help)."""
        return self._get_next_hint()

    def is_game_active(self) -> bool:
        """Check if a game is currently active."""
        return self.current_game is not None

    def end_game(self) -> Dict[str, Any]:
        """End the current game and return summary."""
        summary = self.get_game_summary()
        self.current_game = None
        self._game_session_id = None
        return summary


# Convenience function
_game_context: Optional[GameContextManager] = None


def get_game_context(convex_client=None) -> GameContextManager:
    """Get or create the global game context manager."""
    global _game_context
    if _game_context is None and convex_client:
        _game_context = GameContextManager(convex_client)
    return _game_context
