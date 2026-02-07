"""OpenRouter LLM provider for the Beethoven agent.

Updated for LiveKit Agents SDK v1.2+
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

logger = logging.getLogger("beethoven-agent.openrouter")


class OpenRouterLLM(LLM):
    """OpenRouter LLM implementation for LiveKit Agents v1.2+."""

    def __init__(
        self,
        model: str = "anthropic/claude-3.5-sonnet",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: Optional[str] = None,
    ):
        super().__init__()
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._api_key = api_key or os.environ.get("OPENROUTER_API_KEY", "")
        self._base_url = "https://openrouter.ai/api/v1"
        self._client = httpx.AsyncClient(timeout=60.0)

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
        """Send chat completion request to OpenRouter."""
        return OpenRouterStream(
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


class OpenRouterStream(OpenAICompatibleStream):
    """Streaming response from OpenRouter with vision support."""

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://beethoven.app",
            "X-Title": "Beethoven AI Teacher",
        }

    def _get_provider_name(self) -> str:
        return "OpenRouter"

    @property
    def _supports_vision(self) -> bool:
        vision_keywords = ["gemini", "google", "claude-3", "gpt-4", "gpt-4o", "pixtral", "llama-3.2-vision"]
        return any(keyword in self._model.lower() for keyword in vision_keywords)

    def _build_messages(self) -> List[Dict[str, Any]]:
        """Convert ChatContext to OpenRouter message format, including images for vision models."""
        messages = []
        is_vision_model = self._supports_vision

        for item in self._chat_ctx.items:
            role = str(item.role)
            if role not in ("system", "user", "assistant"):
                continue

            if isinstance(item.content, str):
                messages.append({"role": role, "content": item.content})
            elif isinstance(item.content, list):
                content_parts = []
                for part in item.content:
                    if isinstance(part, str):
                        content_parts.append({"type": "text", "text": part})
                    elif hasattr(part, "text"):
                        content_parts.append({"type": "text", "text": part.text})
                    elif hasattr(part, "image"):
                        if is_vision_model:
                            try:
                                import base64
                                import io
                                from PIL import Image
                                from livekit import rtc

                                frame = part.image
                                if hasattr(frame, "convert") and hasattr(frame, "width") and not hasattr(frame, "save"):
                                    img_buffer = frame.convert(rtc.VideoBufferType.RGBA)
                                    pil_img = Image.frombytes("RGBA", (img_buffer.width, img_buffer.height), img_buffer.data)
                                else:
                                    pil_img = frame

                                pil_img.thumbnail((768, 768))
                                buf = io.BytesIO()
                                pil_img.convert("RGB").save(buf, format="JPEG", quality=80)
                                b64_image = base64.b64encode(buf.getvalue()).decode("utf-8")

                                content_parts.append({
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}
                                })
                            except Exception as e:
                                logger.error(f"Failed to process image content: {e}")

                if content_parts:
                    if all(p.get("type") == "text" for p in content_parts):
                        text = " ".join(p["text"] for p in content_parts)
                        messages.append({"role": role, "content": text})
                    else:
                        messages.append({"role": role, "content": content_parts})

        return messages
