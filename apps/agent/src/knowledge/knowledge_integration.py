"""Knowledge Integration Module.

Combines lesson-specific and general knowledge for the avatar agent.
Provides a unified interface for fast knowledge lookup.

Two-Tier Architecture:
1. In-Memory General Knowledge (<1ms) - Grammar rules, vocabulary, common mistakes
2. Lesson-Specific Content (on-demand) - Exercises, slides, lesson-specific vocab
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

from .lesson_manager import LessonKnowledgeManager
from .general_knowledge import GeneralKnowledgeBase, get_general_knowledge

logger = logging.getLogger("beethoven-agent.knowledge-integration")


@dataclass
class KnowledgeContext:
    """Context to inject into LLM for knowledge-augmented responses."""
    grammar_context: str = ""
    vocabulary_context: str = ""
    mistake_correction: str = ""
    lesson_context: str = ""
    session_progress: str = ""

    def to_string(self) -> str:
        """Combine all context into a single string for LLM."""
        parts = []
        if self.grammar_context:
            parts.append(self.grammar_context)
        if self.vocabulary_context:
            parts.append(self.vocabulary_context)
        if self.mistake_correction:
            parts.append(self.mistake_correction)
        if self.lesson_context:
            parts.append(self.lesson_context)
        if self.session_progress:
            parts.append(self.session_progress)
        return "\n\n".join(parts) if parts else ""


class KnowledgeIntegration:
    """Unified knowledge access for the avatar agent.

    Combines:
    - General knowledge (in-memory, <1ms lookup)
    - Lesson-specific knowledge (cached from Convex)
    - Response cache (pre-computed answers)

    Usage:
        knowledge = KnowledgeIntegration(convex_client)
        await knowledge.initialize(avatar_id, session_id, student_id)

        # On each user message:
        context = await knowledge.get_context_for_query(user_text)
        # Inject context.to_string() into LLM prompt
    """

    def __init__(self, convex_client):
        self.convex = convex_client
        self.general = get_general_knowledge()
        self.lesson_manager = LessonKnowledgeManager(convex_client)
        self._initialized = False
        self._avatar_id: Optional[str] = None
        self._session_id: Optional[str] = None
        self._student_id: Optional[str] = None
        self._current_slide: Optional[str] = None

    async def initialize(
        self,
        avatar_id: str,
        session_id: Optional[str] = None,
        student_id: Optional[str] = None
    ) -> None:
        """Initialize all knowledge systems at session start.

        This loads:
        1. General knowledge into memory (grammar, vocab, mistakes)
        2. Lesson index for quick matching
        """
        self._avatar_id = avatar_id
        self._session_id = session_id
        self._student_id = student_id

        # Load general knowledge (fast, from built-in defaults if needed)
        await self.general.load_from_convex(self.convex)
        logger.info(f"General knowledge loaded: {self.general.stats}")

        # Load lesson index for this avatar
        await self.lesson_manager.load_index(avatar_id)
        logger.info(f"Lesson index loaded: {len(self.lesson_manager.index)} lessons")

        self._initialized = True
        logger.info(f"Knowledge integration initialized for avatar {avatar_id}")

    def set_current_slide(self, slide_id: str) -> None:
        """Update current slide context."""
        self._current_slide = slide_id

    async def get_context_for_query(
        self,
        user_text: str,
        include_lesson: bool = True,
        include_grammar: bool = True,
        include_vocabulary: bool = True,
        check_mistakes: bool = True,
    ) -> KnowledgeContext:
        """Get relevant knowledge context for a user query.

        This is the main method called on each user message.
        Returns context to inject into the LLM prompt.

        Latency breakdown:
        - Grammar lookup: <1ms
        - Vocabulary lookup: <1ms
        - Mistake check: <2ms
        - Lesson matching: <5ms
        - Lesson content fetch: 10-50ms (if cache miss)
        """
        context = KnowledgeContext()

        if not self._initialized:
            logger.warning("Knowledge integration not initialized!")
            return context

        # 1. Check for grammar questions (<1ms)
        if include_grammar:
            grammar_rules = self.general.lookup_grammar(user_text)
            if grammar_rules:
                context.grammar_context = self.general.format_grammar_for_context(grammar_rules)
                logger.debug(f"Found {len(grammar_rules)} relevant grammar rules")

        # 2. Check for vocabulary questions (<1ms)
        if include_vocabulary:
            # Look for vocabulary terms in the query
            words = user_text.lower().split()
            vocab_entries = []
            for word in words:
                if len(word) > 3:  # Skip short words
                    entry = self.general.lookup_vocabulary(word)
                    if entry:
                        vocab_entries.append(entry)

            if vocab_entries:
                context.vocabulary_context = self.general.format_vocabulary_for_context(vocab_entries)
                logger.debug(f"Found {len(vocab_entries)} vocabulary entries")

        # 3. Check for common German speaker mistakes (<2ms)
        if check_mistakes:
            mistakes = self.general.check_for_mistakes(user_text)
            if mistakes:
                # Only include the most relevant mistake
                context.mistake_correction = self.general.format_mistake_correction(mistakes[0])
                logger.info(f"Detected common mistake: {mistakes[0].id}")

        # 4. Check for lesson-specific content (5-50ms)
        if include_lesson and self.lesson_manager.index:
            matching_lessons = self.lesson_manager.match_query(user_text)
            if matching_lessons:
                # Get full content for the best match
                best_match = matching_lessons[0]
                content = await self.lesson_manager.get_content(best_match.content_id)
                if content:
                    context.lesson_context = self.lesson_manager.format_for_context(content)
                    logger.debug(f"Matched lesson: {best_match.title}")

        return context

    async def get_quick_answer(self, user_text: str) -> Optional[str]:
        """Try to get a fast answer without LLM.

        Returns pre-computed or rule-based answer if available.
        This is for ultra-low latency responses.
        """
        # Check for common mistake to correct
        mistakes = self.general.check_for_mistakes(user_text)
        if mistakes and mistakes[0].frequency == "very_common":
            return self.general.format_mistake_correction(mistakes[0])

        # Check for simple vocabulary definition
        vocab = self.general.lookup_vocabulary(user_text.strip())
        if vocab and len(user_text.split()) <= 3:  # Single word or short phrase
            return (
                f"**{vocab.term}** ({vocab.term_de}) - {vocab.part_of_speech}\n"
                f"{vocab.definition}\n"
                f"*Example: {vocab.example_sentence}*"
            )

        return None

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about loaded knowledge."""
        return {
            "initialized": self._initialized,
            "general_knowledge": self.general.stats,
            "lessons_loaded": len(self.lesson_manager.index),
            "lesson_cache_size": len(self.lesson_manager.content_cache),
        }


# Global instance for the current session
_knowledge_integration: Optional[KnowledgeIntegration] = None


async def initialize_knowledge(
    convex_client,
    avatar_id: str,
    session_id: Optional[str] = None,
    student_id: Optional[str] = None
) -> KnowledgeIntegration:
    """Initialize the global knowledge integration instance."""
    global _knowledge_integration
    _knowledge_integration = KnowledgeIntegration(convex_client)
    await _knowledge_integration.initialize(avatar_id, session_id, student_id)
    return _knowledge_integration


def get_knowledge_integration() -> Optional[KnowledgeIntegration]:
    """Get the global knowledge integration instance."""
    return _knowledge_integration
