"""Zep Cloud retriever for ultra-fast RAG (<200ms latency)."""

import asyncio
import logging
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

logger = logging.getLogger("zep-retriever")


@dataclass
class RetrievedChunk:
    """A chunk of text retrieved from Zep."""
    text: str
    score: float
    metadata: Dict[str, Any]
    source: str  # e.g., "lesson_slides", "vocabulary", "grammar"


class ZepRetriever:
    """
    Zep Cloud client wrapper for ultra-fast knowledge retrieval.

    Features:
    - 200ms P95 latency
    - Built-in embeddings (no local model needed)
    - Graph RAG for connected knowledge
    - Memory/context management
    """

    def __init__(self, api_key: str):
        """Initialize Zep client.

        Args:
            api_key: Zep Cloud API key
        """
        self.api_key = api_key
        self._client = None
        self._initialized = False

    async def initialize(self) -> bool:
        """Initialize the Zep async client.

        Returns:
            True if initialization successful, False otherwise
        """
        if self._initialized:
            return True

        try:
            from zep_cloud.client import AsyncZep
            self._client = AsyncZep(api_key=self.api_key)
            self._initialized = True
            logger.info("Zep client initialized successfully")
            return True
        except ImportError:
            logger.error("zep-cloud package not installed. Run: pip install zep-cloud")
            return False
        except Exception as e:
            logger.error(f"Failed to initialize Zep client: {e}")
            return False

    async def search(
        self,
        query: str,
        collection_ids: List[str],
        limit: int = 3,
        min_score: float = 0.7,
    ) -> List[RetrievedChunk]:
        """
        Search for relevant content across knowledge base collections.

        Args:
            query: The user's question/query
            collection_ids: List of Zep collection IDs to search
            limit: Maximum number of results per collection
            min_score: Minimum relevance score (0-1)

        Returns:
            List of RetrievedChunk objects sorted by relevance
        """
        if not self._initialized:
            await self.initialize()

        if not self._client:
            logger.warning("Zep client not available, skipping RAG")
            return []

        all_chunks: List[RetrievedChunk] = []

        # Search all collections in parallel
        search_tasks = [
            self._search_collection(query, coll_id, limit)
            for coll_id in collection_ids
        ]

        results = await asyncio.gather(*search_tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Search error: {result}")
                continue
            all_chunks.extend(result)

        # Filter by minimum score and sort by relevance
        filtered = [c for c in all_chunks if c.score >= min_score]
        filtered.sort(key=lambda x: x.score, reverse=True)

        # Return top results across all collections
        return filtered[:limit]

    async def _search_collection(
        self,
        query: str,
        collection_id: str,
        limit: int,
    ) -> List[RetrievedChunk]:
        """Search a single Zep collection."""
        try:
            # Zep Cloud document search
            results = await self._client.document.search(
                collection_name=collection_id,
                text=query,
                limit=limit,
            )

            chunks = []
            for doc in results.results:
                chunks.append(RetrievedChunk(
                    text=doc.content,
                    score=doc.score or 0.0,
                    metadata=doc.metadata or {},
                    source=collection_id,
                ))

            return chunks

        except Exception as e:
            logger.error(f"Error searching collection {collection_id}: {e}")
            return []

    async def add_documents(
        self,
        collection_id: str,
        documents: List[Dict[str, Any]],
    ) -> bool:
        """
        Add documents to a Zep collection.

        Args:
            collection_id: The Zep collection name
            documents: List of documents with 'content' and 'metadata' keys

        Returns:
            True if successful, False otherwise
        """
        if not self._initialized:
            await self.initialize()

        if not self._client:
            return False

        try:
            from zep_cloud.types import Document

            # Ensure collection exists
            try:
                await self._client.document.get_collection(collection_id)
            except Exception:
                # Create collection if it doesn't exist
                await self._client.document.add_collection(
                    name=collection_id,
                    description=f"Knowledge base: {collection_id}",
                )
                logger.info(f"Created new Zep collection: {collection_id}")

            # Convert to Zep Document format
            zep_docs = [
                Document(
                    content=doc["content"],
                    metadata=doc.get("metadata", {}),
                    document_id=doc.get("id"),
                )
                for doc in documents
            ]

            # Add documents (Zep handles chunking and embedding)
            await self._client.document.add_documents(
                collection_name=collection_id,
                documents=zep_docs,
            )

            logger.info(f"Added {len(documents)} documents to {collection_id}")
            return True

        except Exception as e:
            logger.error(f"Error adding documents to {collection_id}: {e}")
            return False

    async def delete_collection(self, collection_id: str) -> bool:
        """Delete a Zep collection."""
        if not self._initialized:
            await self.initialize()

        if not self._client:
            return False

        try:
            await self._client.document.delete_collection(collection_id)
            logger.info(f"Deleted Zep collection: {collection_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting collection {collection_id}: {e}")
            return False

    def format_context(self, chunks: List[RetrievedChunk]) -> str:
        """
        Format retrieved chunks into a context string for the LLM.

        Args:
            chunks: List of retrieved chunks

        Returns:
            Formatted context string
        """
        if not chunks:
            return ""

        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            source_info = chunk.metadata.get("source_type", chunk.source)
            context_parts.append(
                f"[Source {i} - {source_info}]:\n{chunk.text}"
            )

        return "\n\n".join(context_parts)
