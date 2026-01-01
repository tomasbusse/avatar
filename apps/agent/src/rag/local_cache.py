"""Local LRU cache for RAG queries to reduce latency and API calls."""

import asyncio
import hashlib
import logging
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any, Callable, List, Optional, Tuple

logger = logging.getLogger("rag-cache")


@dataclass
class CacheEntry:
    """A cached RAG result."""
    result: Any
    timestamp: float
    hit_count: int = 0


class RAGCache:
    """
    Thread-safe LRU cache for RAG query results.

    Features:
    - TTL-based expiration (default 5 minutes)
    - LRU eviction when max size reached
    - Query normalization for better hit rate
    - Thread-safe with asyncio lock
    """

    def __init__(
        self,
        max_size: int = 100,
        ttl_seconds: float = 300.0,  # 5 minutes
    ):
        """
        Initialize the cache.

        Args:
            max_size: Maximum number of entries
            ttl_seconds: Time-to-live for entries in seconds
        """
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = asyncio.Lock()
        self._stats = {"hits": 0, "misses": 0, "evictions": 0}

    def _normalize_query(self, query: str) -> str:
        """Normalize query for better cache hits."""
        # Lowercase, strip whitespace, collapse multiple spaces
        normalized = " ".join(query.lower().strip().split())
        return normalized

    def _make_key(
        self,
        query: str,
        collection_ids: List[str],
    ) -> str:
        """Create a cache key from query and collections."""
        normalized = self._normalize_query(query)
        collections_str = ",".join(sorted(collection_ids))
        key_data = f"{normalized}:{collections_str}"
        return hashlib.sha256(key_data.encode()).hexdigest()[:16]

    async def get(
        self,
        query: str,
        collection_ids: List[str],
    ) -> Optional[Any]:
        """
        Get cached result for a query.

        Args:
            query: The search query
            collection_ids: List of collection IDs

        Returns:
            Cached result if found and valid, None otherwise
        """
        key = self._make_key(query, collection_ids)

        async with self._lock:
            entry = self._cache.get(key)

            if entry is None:
                self._stats["misses"] += 1
                return None

            # Check TTL
            if time.time() - entry.timestamp > self.ttl_seconds:
                del self._cache[key]
                self._stats["misses"] += 1
                return None

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            entry.hit_count += 1
            self._stats["hits"] += 1

            logger.debug(f"Cache hit for query (key={key[:8]}...)")
            return entry.result

    async def set(
        self,
        query: str,
        collection_ids: List[str],
        result: Any,
    ) -> None:
        """
        Cache a query result.

        Args:
            query: The search query
            collection_ids: List of collection IDs
            result: The result to cache
        """
        key = self._make_key(query, collection_ids)

        async with self._lock:
            # Evict oldest entries if at capacity
            while len(self._cache) >= self.max_size:
                oldest_key, _ = self._cache.popitem(last=False)
                self._stats["evictions"] += 1
                logger.debug(f"Evicted cache entry: {oldest_key[:8]}...")

            self._cache[key] = CacheEntry(
                result=result,
                timestamp=time.time(),
            )

    async def get_or_fetch(
        self,
        query: str,
        collection_ids: List[str],
        fetch_fn: Callable[[], Any],
    ) -> Tuple[Any, bool]:
        """
        Get from cache or fetch if not cached.

        Args:
            query: The search query
            collection_ids: List of collection IDs
            fetch_fn: Async function to call if cache miss

        Returns:
            Tuple of (result, was_cached)
        """
        cached = await self.get(query, collection_ids)
        if cached is not None:
            return cached, True

        # Fetch and cache
        result = await fetch_fn()
        await self.set(query, collection_ids, result)
        return result, False

    async def clear(self) -> None:
        """Clear all cached entries."""
        async with self._lock:
            self._cache.clear()
            logger.info("RAG cache cleared")

    async def invalidate_collection(self, collection_id: str) -> int:
        """
        Invalidate all entries that include a specific collection.

        Args:
            collection_id: The collection ID to invalidate

        Returns:
            Number of entries invalidated
        """
        # Since our key is a hash, we need to track collection membership
        # For now, just clear all cache when a collection changes
        async with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = self._stats["hits"] + self._stats["misses"]
        hit_rate = self._stats["hits"] / total if total > 0 else 0
        return {
            **self._stats,
            "size": len(self._cache),
            "hit_rate": f"{hit_rate:.1%}",
        }
