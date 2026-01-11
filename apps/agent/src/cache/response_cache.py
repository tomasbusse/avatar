"""Pre-computed response cache for ultra-low latency responses.

For predictable lesson content, we can skip the LLM entirely by caching
responses to common questions/triggers. This saves 200-400ms per response.

Use cases:
- Slide explanations (pre-generated when lesson is created)
- Common student questions ("What does X mean?")
- Greetings and transitions
- Error corrections for known mistakes
"""

import logging
import re
from typing import Optional, Dict, Any
from dataclasses import dataclass
from difflib import SequenceMatcher

logger = logging.getLogger("beethoven-agent.response-cache")


@dataclass
class CachedResponse:
    """A pre-computed response."""
    trigger: str           # What the student says (or pattern)
    response: str          # Pre-written response
    is_pattern: bool       # If True, trigger is a regex pattern
    context: str = ""      # Optional context requirement (e.g., "slide_3")
    priority: int = 0      # Higher priority matches first
    audio_url: str = ""    # Optional pre-generated TTS audio URL


class ResponseCache:
    """Cache for pre-computed responses to skip LLM inference.

    Latency impact:
    - Without cache: STT → LLM (200-400ms) → TTS
    - With cache hit: STT → Lookup (5ms) → TTS

    Savings: 195-395ms per cached response!
    """

    def __init__(self):
        self._responses: list[CachedResponse] = []
        self._current_context: str = ""
        self._similarity_threshold: float = 0.75  # For fuzzy matching

    def set_context(self, context: str):
        """Set current context (e.g., current slide ID)."""
        self._current_context = context
        logger.debug(f"[CACHE] Context set to: {context}")

    def add_response(
        self,
        trigger: str,
        response: str,
        is_pattern: bool = False,
        context: str = "",
        priority: int = 0,
        audio_url: str = "",
    ):
        """Add a pre-computed response to the cache."""
        self._responses.append(CachedResponse(
            trigger=trigger.lower() if not is_pattern else trigger,
            response=response,
            is_pattern=is_pattern,
            context=context,
            priority=priority,
            audio_url=audio_url,
        ))
        self._responses.sort(key=lambda x: -x.priority)  # Higher priority first

    def load_lesson_responses(self, lesson_data: Dict[str, Any]):
        """Load pre-computed responses from lesson data.

        Expected format in lesson:
        {
            "cachedResponses": [
                {
                    "trigger": "what does this mean",
                    "response": "This slide shows...",
                    "context": "slide_1"
                },
                {
                    "trigger": "hello|hi|hey",
                    "response": "Hello! Welcome to today's lesson.",
                    "isPattern": true,
                    "priority": 10
                }
            ]
        }
        """
        cached = lesson_data.get("cachedResponses", [])
        for item in cached:
            self.add_response(
                trigger=item.get("trigger", ""),
                response=item.get("response", ""),
                is_pattern=item.get("isPattern", False),
                context=item.get("context", ""),
                priority=item.get("priority", 0),
                audio_url=item.get("audioUrl", ""),
            )
        logger.info(f"[CACHE] Loaded {len(cached)} pre-computed responses from lesson")

    def load_slide_explanations(self, slides: list[Dict[str, Any]]):
        """Auto-generate cache entries for slide explanations.

        When a student asks "explain this" or "what's on this slide",
        we can return the pre-written explanation without LLM.
        """
        explanation_triggers = [
            "explain this",
            "what does this mean",
            "what's on this slide",
            "can you explain",
            "i don't understand",
            "was bedeutet das",  # German
            "erkläre das",       # German
        ]

        for i, slide in enumerate(slides):
            slide_id = slide.get("id", f"slide_{i}")
            explanation = slide.get("explanation") or slide.get("notes", "")

            if explanation:
                for trigger in explanation_triggers:
                    self.add_response(
                        trigger=trigger,
                        response=explanation,
                        context=slide_id,
                        priority=5,
                    )

        logger.info(f"[CACHE] Generated {len(slides)} slide explanation cache entries")

    def _similarity(self, a: str, b: str) -> float:
        """Calculate similarity ratio between two strings."""
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def lookup(self, user_input: str) -> Optional[CachedResponse]:
        """Look up a pre-computed response for the given input.

        Returns None if no match found (fall back to LLM).

        Matching strategy:
        1. Exact match (fastest)
        2. Pattern match (regex)
        3. Fuzzy match (similarity threshold)
        """
        input_lower = user_input.lower().strip()

        for cached in self._responses:
            # Check context match if specified
            if cached.context and cached.context != self._current_context:
                continue

            # Strategy 1: Exact match
            if not cached.is_pattern and cached.trigger == input_lower:
                logger.info(f"[CACHE] ⚡ Exact match for: '{user_input[:50]}...'")
                return cached

            # Strategy 2: Pattern match
            if cached.is_pattern:
                try:
                    if re.search(cached.trigger, input_lower, re.IGNORECASE):
                        logger.info(f"[CACHE] ⚡ Pattern match for: '{user_input[:50]}...'")
                        return cached
                except re.error:
                    continue

            # Strategy 3: Fuzzy match
            if not cached.is_pattern:
                similarity = self._similarity(input_lower, cached.trigger)
                if similarity >= self._similarity_threshold:
                    logger.info(f"[CACHE] ⚡ Fuzzy match ({similarity:.0%}) for: '{user_input[:50]}...'")
                    return cached

        logger.debug(f"[CACHE] No match for: '{user_input[:50]}...'")
        return None

    def clear(self):
        """Clear all cached responses."""
        self._responses.clear()
        self._current_context = ""
        logger.info("[CACHE] Cleared response cache")

    @property
    def size(self) -> int:
        """Number of cached responses."""
        return len(self._responses)


# Global cache instance
_response_cache: Optional[ResponseCache] = None


def get_response_cache() -> ResponseCache:
    """Get or create the global response cache."""
    global _response_cache
    if _response_cache is None:
        _response_cache = ResponseCache()
    return _response_cache
