"""
Tavily Web Search Integration for Conversation Practice.

Provides real-time web search capabilities for avatars to discuss
current events, news, and other web-based information.
"""

import os
import logging
import asyncio
from typing import Optional, Literal
from dataclasses import dataclass, field
from datetime import datetime, timedelta

try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except ImportError:
    TAVILY_AVAILABLE = False
    TavilyClient = None

logger = logging.getLogger(__name__)


@dataclass
class WebSearchConfig:
    """Configuration for web search behavior."""
    search_depth: Literal["basic", "advanced"] = "basic"
    max_results: int = 5
    include_domains: list[str] = field(default_factory=list)
    exclude_domains: list[str] = field(default_factory=list)
    topic: Literal["general", "news", "finance"] = "general"
    custom_queries: list[str] = field(default_factory=list)
    refresh_interval_minutes: int = 30

    @classmethod
    def from_dict(cls, data: Optional[dict]) -> "WebSearchConfig":
        """Create config from dictionary (from Convex)."""
        if not data:
            return cls()
        return cls(
            search_depth=data.get("searchDepth", "basic"),
            max_results=data.get("maxResults", 5),
            include_domains=data.get("includeDomains", []),
            exclude_domains=data.get("excludeDomains", []),
            topic=data.get("topic", "general"),
            custom_queries=data.get("customQueries", []),
            refresh_interval_minutes=data.get("refreshIntervalMinutes", 30),
        )


@dataclass
class SearchResult:
    """A single search result."""
    title: str
    url: str
    content: str
    score: float
    published_date: Optional[str] = None


@dataclass
class SearchResponse:
    """Response from a search query."""
    query: str
    results: list[SearchResult]
    answer: Optional[str] = None  # Tavily's AI-generated answer
    searched_at: datetime = field(default_factory=datetime.now)

    def to_context_string(self, max_length: int = 2000) -> str:
        """Convert search results to a context string for LLM."""
        parts = []

        if self.answer:
            parts.append(f"Summary: {self.answer}")
            parts.append("")

        for i, result in enumerate(self.results[:5], 1):
            result_text = f"{i}. {result.title}"
            if result.published_date:
                result_text += f" ({result.published_date})"
            result_text += f"\n   {result.content[:300]}..."
            parts.append(result_text)

        full_text = "\n".join(parts)

        # Truncate if too long
        if len(full_text) > max_length:
            full_text = full_text[:max_length - 3] + "..."

        return full_text


class TavilySearchProvider:
    """Provider for Tavily web search."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("TAVILY_API_KEY")
        self._client: Optional[TavilyClient] = None
        self._cache: dict[str, SearchResponse] = {}
        self._cache_ttl = timedelta(minutes=10)

        if not TAVILY_AVAILABLE:
            logger.warning("Tavily package not installed. Run: pip install tavily-python")
        elif not self.api_key:
            logger.warning("TAVILY_API_KEY not set. Web search will be disabled.")

    @property
    def is_available(self) -> bool:
        """Check if Tavily is available and configured."""
        return TAVILY_AVAILABLE and bool(self.api_key)

    def _get_client(self) -> Optional[TavilyClient]:
        """Get or create Tavily client."""
        if not self.is_available:
            return None
        if self._client is None:
            self._client = TavilyClient(api_key=self.api_key)
        return self._client

    def _get_cache_key(self, query: str, config: WebSearchConfig) -> str:
        """Generate cache key for a search."""
        domains = ",".join(sorted(config.include_domains))
        return f"{query}|{config.search_depth}|{config.topic}|{domains}"

    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached result is still valid."""
        if cache_key not in self._cache:
            return False
        cached = self._cache[cache_key]
        return datetime.now() - cached.searched_at < self._cache_ttl

    async def search(
        self,
        query: str,
        config: Optional[WebSearchConfig] = None,
    ) -> Optional[SearchResponse]:
        """
        Perform a web search using Tavily.

        Args:
            query: The search query
            config: Search configuration

        Returns:
            SearchResponse with results, or None if search failed
        """
        if not self.is_available:
            logger.warning("Tavily not available, skipping web search")
            return None

        config = config or WebSearchConfig()
        cache_key = self._get_cache_key(query, config)

        # Check cache
        if self._is_cache_valid(cache_key):
            logger.debug(f"Using cached search results for: {query}")
            return self._cache[cache_key]

        client = self._get_client()
        if not client:
            return None

        try:
            # Run search in thread pool (Tavily client is sync)
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.search(
                    query=query,
                    search_depth=config.search_depth,
                    max_results=config.max_results,
                    include_domains=config.include_domains if config.include_domains else None,
                    exclude_domains=config.exclude_domains if config.exclude_domains else None,
                    topic=config.topic,
                    include_answer=True,
                )
            )

            # Parse response
            results = []
            for result in response.get("results", []):
                results.append(SearchResult(
                    title=result.get("title", ""),
                    url=result.get("url", ""),
                    content=result.get("content", ""),
                    score=result.get("score", 0.0),
                    published_date=result.get("published_date"),
                ))

            search_response = SearchResponse(
                query=query,
                results=results,
                answer=response.get("answer"),
            )

            # Cache result
            self._cache[cache_key] = search_response

            logger.info(f"Web search completed: '{query}' - {len(results)} results")
            return search_response

        except Exception as e:
            logger.error(f"Web search failed for '{query}': {e}")
            return None

    async def search_multiple(
        self,
        queries: list[str],
        config: Optional[WebSearchConfig] = None,
    ) -> dict[str, Optional[SearchResponse]]:
        """
        Perform multiple searches concurrently.

        Args:
            queries: List of search queries
            config: Search configuration

        Returns:
            Dictionary mapping queries to their results
        """
        tasks = [self.search(q, config) for q in queries]
        results = await asyncio.gather(*tasks)
        return dict(zip(queries, results))

    def clear_cache(self):
        """Clear all cached search results."""
        self._cache.clear()
        logger.debug("Search cache cleared")


# Singleton instance
_provider: Optional[TavilySearchProvider] = None


def get_tavily_provider() -> TavilySearchProvider:
    """Get the singleton Tavily provider instance."""
    global _provider
    if _provider is None:
        _provider = TavilySearchProvider()
    return _provider


async def search_web(
    query: str,
    config: Optional[WebSearchConfig] = None,
) -> Optional[SearchResponse]:
    """
    Convenience function for web search.

    Args:
        query: The search query
        config: Search configuration

    Returns:
        SearchResponse with results, or None if search failed
    """
    provider = get_tavily_provider()
    return await provider.search(query, config)


def format_search_for_context(
    response: Optional[SearchResponse],
    prefix: str = "Current Information",
) -> str:
    """
    Format search results for inclusion in LLM context.

    Args:
        response: The search response
        prefix: Header prefix for the context block

    Returns:
        Formatted string ready for LLM context
    """
    if not response or not response.results:
        return ""

    context = response.to_context_string()
    return f"\n[{prefix} from web search: '{response.query}']\n{context}\n"
