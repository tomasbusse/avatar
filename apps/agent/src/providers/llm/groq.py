"""Groq LLM provider for the Beethoven agent.

Groq offers ultra-fast inference at ~40ms time-to-first-token.
Supports Llama 3.3 70B and other models with exceptional speed.
Uses shared OpenAICompatibleStream base class.
"""

import logging
import os
from typing import Any, Dict, List, Optional

import httpx

from livekit.agents import APIConnectOptions
from livekit.agents.llm import (
    ChatContext,
    LLM,
    LLMStream,
    FunctionTool,
)

try:
    from livekit.agents.llm import RawFunctionTool
except ImportError:
    RawFunctionTool = FunctionTool

from .base import OpenAICompatibleStream

logger = logging.getLogger("beethoven-agent.groq")

# Available Groq models - optimized for speed
GROQ_MODELS = [
    "llama-3.3-70b-versatile",  # Best balance of speed and quality
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",     # Fastest, good for simple tasks
    "mixtral-8x7b-32768",       # Good for longer context
]


class GroqLLM(LLM):
    """Groq LLM implementation for LiveKit Agents v1.2+.

    Groq provides ultra-fast LLM inference:
    - ~40ms time-to-first-token
    - High throughput streaming
    - Llama 3.3 70B and other models
    """

    def __init__(
        self,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: Optional[str] = None,
    ):
        super().__init__()
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self._base_url = "https://api.groq.com/openai/v1"
        self._client = httpx.AsyncClient(timeout=60.0)

        if not self._api_key:
            logger.warning("GROQ_API_KEY not set - Groq LLM will not work")

    def chat(
        self,
        *,
        chat_ctx: ChatContext,
        tools: Optional[List[FunctionTool | RawFunctionTool]] = None,
        conn_options: APIConnectOptions = APIConnectOptions(),
        parallel_tool_calls: Any = None,
        tool_choice: Any = None,
        extra_kwargs: Any = None,
    ) -> "LLMStream":
        """Send chat completion request to Groq."""
        return GroqStream(
            llm_instance=self,
            client=self._client,
            api_key=self._api_key,
            base_url=self._base_url,
            model=self._model,
            chat_ctx=chat_ctx,
            tools=tools or [],
            conn_options=conn_options,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
        )


class GroqStream(OpenAICompatibleStream):
    """Streaming response from Groq."""

    def _get_provider_name(self) -> str:
        return "Groq"
