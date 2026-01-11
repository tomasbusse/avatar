"""Knowledge management for avatar lesson content and general knowledge."""

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
