"""Cerebras LLM provider for the Beethoven agent.

Cerebras offers ultra-fast inference at 2,314 tokens/sec - 70x faster than competitors.
Uses OpenAI-compatible API format via shared OpenAICompatibleStream base class.

Updated for LiveKit Agents SDK v1.2+
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

logger = logging.getLogger("beethoven-agent.cerebras")

# Available Cerebras models - optimized for speed
# gpt-oss-120b: ~120B param, production, best quality
# llama3.1-8b: ~2300 tok/s, production, ultra-fast conversation
# Note: llama-3.3-70b deprecated Feb 16 2026, llama-3.1-70b removed
CEREBRAS_MODELS = [
    {"id": "llama3.1-8b", "name": "Llama 3.1 8B (Ultra Fast - 2300 tok/s)"},
    {"id": "gpt-oss-120b", "name": "GPT-OSS 120B (Best Quality)"},
]


class CerebrasLLM(LLM):
    """Cerebras LLM implementation for LiveKit Agents v1.2+.

    Cerebras provides ultra-fast LLM inference:
    - 2,314 tokens/sec (70x faster than Bedrock)
    - 170ms time-to-first-token with Llama 3.3 70B
    - OpenAI-compatible API
    """

    def __init__(
        self,
        model: str = "llama3.1-8b",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: Optional[str] = None,
    ):
        super().__init__()
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._api_key = api_key or os.environ.get("CEREBRAS_API_KEY", "")
        self._base_url = "https://api.cerebras.ai/v1"
        self._client = httpx.AsyncClient(timeout=60.0)

        if not self._api_key:
            logger.warning("CEREBRAS_API_KEY not set - Cerebras LLM will not work")

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
        """Send chat completion request to Cerebras."""
        return CerebrasStream(
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


class CerebrasStream(OpenAICompatibleStream):
    """Streaming response from Cerebras."""

    def _get_provider_name(self) -> str:
        return "Cerebras"
