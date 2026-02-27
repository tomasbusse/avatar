"""Mercury (Inception Labs) LLM provider for the Beethoven agent.

Mercury 2 is a reasoning dLLM (diffusion-based LLM) achieving ~1000+ tok/s,
5x faster than leading speed-optimized models. Uses extended thinking/chain-of-thought
reasoning internally. OpenAI-compatible API, 128k context window.
Models: mercury-2 (reasoning), mercury-coder (code-optimized).
No vision support.
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

logger = logging.getLogger("beethoven-agent.mercury")

MERCURY_MODELS = [
    {"id": "mercury-2", "name": "Mercury 2 (Thinking/Reasoning dLLM)"},
    {"id": "mercury", "name": "Mercury (Fast dLLM - voice agents)"},
    {"id": "mercury-coder", "name": "Mercury Coder (Code-optimized)"},
]


class MercuryLLM(LLM):
    """Mercury LLM via Inception Labs API (OpenAI-compatible)."""

    def __init__(
        self,
        model: str = "mercury-2",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: Optional[str] = None,
    ):
        super().__init__()
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._api_key = api_key or os.environ.get("INCEPTION_API_KEY", "")
        self._base_url = "https://api.inceptionlabs.ai/v1"
        self._client = httpx.AsyncClient(timeout=60.0)

        if not self._api_key:
            logger.warning("INCEPTION_API_KEY not set - Mercury LLM will not work")

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
        return MercuryStream(
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


class MercuryStream(OpenAICompatibleStream):
    """Streaming response from Mercury."""

    def _get_provider_name(self) -> str:
        return "Mercury"
