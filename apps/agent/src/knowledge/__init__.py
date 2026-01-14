"""Knowledge management for avatar lesson content and general knowledge.

Three-tier knowledge system:
1. RLM Structured Knowledge (<10ms) - Web-scraped, topic-specific
2. General Knowledge (<1ms) - Built-in grammar, vocabulary, mistakes
3. Lesson Content (on-demand) - Exercises, slides, curriculum
"""

from .lesson_manager import (
    LessonKnowledgeManager,
    ExerciseTracker,
    VocabularyDriller,
    LessonIndex,
    ExerciseState,
    VocabDrillState,
)
from .general_knowledge import (
    GeneralKnowledgeBase,
    GrammarRule,
    VocabularyEntry,
    CommonMistake,
    get_general_knowledge,
)
from .rlm_knowledge import (
    RLMKnowledgeProvider,
    RLMGrammarRule,
    RLMVocabularyEntry,
    RLMMistakePattern,
    get_rlm_provider,
    load_rlm_from_convex,
)
from .knowledge_integration import (
    KnowledgeIntegration,
    KnowledgeContext,
    initialize_knowledge,
    get_knowledge_integration,
)
from .tavily_search import (
    TavilySearchProvider,
    WebSearchConfig,
    SearchResult,
    SearchResponse,
    get_tavily_provider,
    search_web,
    format_search_for_context,
)

__all__ = [
    # Lesson-specific knowledge
    "LessonKnowledgeManager",
    "ExerciseTracker",
    "VocabularyDriller",
    "LessonIndex",
    "ExerciseState",
    "VocabDrillState",
    # General knowledge base
    "GeneralKnowledgeBase",
    "GrammarRule",
    "VocabularyEntry",
    "CommonMistake",
    "get_general_knowledge",
    # RLM structured knowledge (web-scraped)
    "RLMKnowledgeProvider",
    "RLMGrammarRule",
    "RLMVocabularyEntry",
    "RLMMistakePattern",
    "get_rlm_provider",
    "load_rlm_from_convex",
    # Knowledge integration
    "KnowledgeIntegration",
    "KnowledgeContext",
    "initialize_knowledge",
    "get_knowledge_integration",
    # Web search (Tavily)
    "TavilySearchProvider",
    "WebSearchConfig",
    "SearchResult",
    "SearchResponse",
    "get_tavily_provider",
    "search_web",
    "format_search_for_context",
]
