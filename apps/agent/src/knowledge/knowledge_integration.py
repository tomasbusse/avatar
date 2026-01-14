"""Knowledge Integration Module.

Combines lesson-specific and general knowledge for the avatar agent.
Provides a unified interface for fast knowledge lookup.

Three-Tier Architecture:
1. RLM Structured Knowledge (<10ms) - Web-scraped grammar, vocabulary, mistakes
2. In-Memory General Knowledge (<1ms) - Built-in grammar rules, vocabulary, common mistakes
3. Lesson-Specific Content (on-demand) - Exercises, slides, lesson-specific vocab

RLM vs General Knowledge:
- RLM: Dynamically loaded from scraped web content, topic-specific
- General: Built-in baseline knowledge, always available
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

from .lesson_manager import LessonKnowledgeManager
from .general_knowledge import GeneralKnowledgeBase, get_general_knowledge
from .rlm_knowledge import RLMKnowledgeProvider, get_rlm_provider, load_rlm_from_convex

logger = logging.getLogger("beethoven-agent.knowledge-integration")


@dataclass
class KnowledgeContext:
    """Context to inject into LLM for knowledge-augmented responses."""
    rlm_grammar_context: str = ""  # RLM-sourced grammar (priority 1)
    rlm_vocabulary_context: str = ""  # RLM-sourced vocabulary (priority 1)
    rlm_mistake_context: str = ""  # RLM-sourced mistake correction (priority 1)
    grammar_context: str = ""  # Built-in grammar (priority 2)
    vocabulary_context: str = ""  # Built-in vocabulary (priority 2)
    mistake_correction: str = ""  # Built-in mistake correction (priority 2)
    lesson_context: str = ""
    session_progress: str = ""

    def to_string(self) -> str:
        """Combine all context into a single string for LLM.

        Priority order:
        1. RLM structured knowledge (topic-specific, scraped from web)
        2. Built-in general knowledge (baseline grammar/vocab)
        3. Lesson-specific content
        """
        parts = []
        # RLM context first (most relevant, topic-specific)
        if self.rlm_grammar_context:
            parts.append(self.rlm_grammar_context)
        if self.rlm_vocabulary_context:
            parts.append(self.rlm_vocabulary_context)
        if self.rlm_mistake_context:
            parts.append(self.rlm_mistake_context)
        # Built-in context (only if RLM didn't provide it)
        if self.grammar_context and not self.rlm_grammar_context:
            parts.append(self.grammar_context)
        if self.vocabulary_context and not self.rlm_vocabulary_context:
            parts.append(self.vocabulary_context)
        if self.mistake_correction and not self.rlm_mistake_context:
            parts.append(self.mistake_correction)
        # Lesson context
        if self.lesson_context:
            parts.append(self.lesson_context)
        if self.session_progress:
            parts.append(self.session_progress)
        return "\n\n".join(parts) if parts else ""

    @property
    def has_rlm_context(self) -> bool:
        """Check if any RLM context was found."""
        return bool(self.rlm_grammar_context or self.rlm_vocabulary_context or self.rlm_mistake_context)


class KnowledgeIntegration:
    """Unified knowledge access for the avatar agent.

    Combines (in priority order):
    - RLM structured knowledge (<10ms, topic-specific from web scraping)
    - General knowledge (in-memory, <1ms lookup, built-in)
    - Lesson-specific knowledge (cached from Convex)

    Usage:
        knowledge = KnowledgeIntegration(convex_client)
        await knowledge.initialize(avatar_id, session_id, student_id)

        # On each user message:
        context = await knowledge.get_context_for_query(user_text)
        # Inject context.to_string() into LLM prompt
    """

    def __init__(self, convex_client):
        self.convex = convex_client
        self.rlm = get_rlm_provider()  # RLM structured knowledge (priority 1)
        self.general = get_general_knowledge()  # Built-in knowledge (priority 2)
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
        1. RLM structured knowledge from linked knowledge bases
        2. General knowledge into memory (grammar, vocab, mistakes)
        3. Lesson index for quick matching
        """
        self._avatar_id = avatar_id
        self._session_id = session_id
        self._student_id = student_id

        # Load RLM structured knowledge from avatar's knowledge bases
        self.rlm = await load_rlm_from_convex(self.convex, avatar_id)
        if self.rlm.is_loaded():
            logger.info(f"RLM knowledge loaded: {self.rlm.stats}")
        else:
            logger.info("No RLM knowledge available for this avatar")

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

        Priority order:
        1. RLM structured knowledge (<10ms) - topic-specific from web scraping
        2. Built-in general knowledge (<1ms) - baseline grammar/vocab
        3. Lesson-specific content (5-50ms) - on-demand from Convex

        Latency breakdown:
        - RLM lookup: <10ms
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

        # TIER 1: RLM Structured Knowledge (<10ms)
        # Check RLM first - it has topic-specific knowledge from web scraping
        if self.rlm.is_loaded():
            # RLM Grammar lookup
            if include_grammar:
                rlm_grammar = self.rlm.lookup_grammar(user_text)
                if rlm_grammar:
                    context.rlm_grammar_context = self.rlm.format_grammar_for_context(rlm_grammar)
                    logger.debug(f"RLM: Found {len(rlm_grammar)} grammar rules")

            # RLM Vocabulary lookup
            if include_vocabulary:
                words = user_text.lower().split()
                rlm_vocab_entries = []
                for word in words:
                    if len(word) > 3:
                        entry = self.rlm.lookup_vocabulary(word)
                        if entry:
                            rlm_vocab_entries.append(entry)

                if rlm_vocab_entries:
                    context.rlm_vocabulary_context = self.rlm.format_vocabulary_for_context(rlm_vocab_entries)
                    logger.debug(f"RLM: Found {len(rlm_vocab_entries)} vocabulary entries")

            # RLM Mistake check
            if check_mistakes:
                rlm_mistakes = self.rlm.check_mistakes(user_text)
                if rlm_mistakes:
                    context.rlm_mistake_context = self.rlm.format_mistake_for_context(rlm_mistakes[0])
                    logger.info(f"RLM: Detected mistake pattern: {rlm_mistakes[0].category}")

        # TIER 2: Built-in General Knowledge (<1ms)
        # Only use if RLM didn't provide the same type of context
        if include_grammar and not context.rlm_grammar_context:
            grammar_rules = self.general.lookup_grammar(user_text)
            if grammar_rules:
                context.grammar_context = self.general.format_grammar_for_context(grammar_rules)
                logger.debug(f"General: Found {len(grammar_rules)} relevant grammar rules")

        if include_vocabulary and not context.rlm_vocabulary_context:
            words = user_text.lower().split()
            vocab_entries = []
            for word in words:
                if len(word) > 3:
                    entry = self.general.lookup_vocabulary(word)
                    if entry:
                        vocab_entries.append(entry)

            if vocab_entries:
                context.vocabulary_context = self.general.format_vocabulary_for_context(vocab_entries)
                logger.debug(f"General: Found {len(vocab_entries)} vocabulary entries")

        if check_mistakes and not context.rlm_mistake_context:
            mistakes = self.general.check_for_mistakes(user_text)
            if mistakes:
                context.mistake_correction = self.general.format_mistake_correction(mistakes[0])
                logger.info(f"General: Detected common mistake: {mistakes[0].id}")

        # TIER 3: Lesson-specific content (5-50ms)
        if include_lesson and self.lesson_manager.index:
            matching_lessons = self.lesson_manager.match_query(user_text)
            if matching_lessons:
                best_match = matching_lessons[0]
                content = await self.lesson_manager.get_content(best_match.content_id)
                if content:
                    context.lesson_context = self.lesson_manager.format_for_context(content)
                    logger.debug(f"Lesson: Matched {best_match.title}")

        # Log context source summary
        if context.has_rlm_context:
            logger.info("Context sourced from RLM structured knowledge")
        elif context.grammar_context or context.vocabulary_context or context.mistake_correction:
            logger.info("Context sourced from built-in general knowledge")

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
            "rlm_knowledge": self.rlm.stats if self.rlm.is_loaded() else {"loaded": False},
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
