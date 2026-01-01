"""OpenRouter LLM provider for the Beethoven agent.

Updated for LiveKit Agents SDK v1.2+
"""

import json
import logging
import os
import uuid
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("beethoven-agent.openrouter")
from livekit.agents import llm, APIConnectOptions
from livekit.agents.llm import (
    ChatContext,
    ChatChunk,
    ChoiceDelta,
    LLM,
    LLMStream,
    FunctionTool,
)
# Check for 'RawFunctionTool' availability (agent v1.2+) or define fallback
try:
    from livekit.agents.llm import RawFunctionTool
except ImportError:
    # Fallback for older SDK versions if needed, though RawFunctionTool is expected
    RawFunctionTool = FunctionTool  


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
            llm=self,
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


class OpenRouterStream(LLMStream):
    """Streaming response from OpenRouter for LiveKit Agents v1.2+."""

    def __init__(
        self,
        llm: LLM,
        client: httpx.AsyncClient,
        api_key: str,
        base_url: str,
        model: str,
        chat_ctx: ChatContext,
        tools: List[FunctionTool | RawFunctionTool],
        conn_options: APIConnectOptions,
        temperature: float,
        max_tokens: int,
    ):
        super().__init__(llm, chat_ctx=chat_ctx, tools=tools, conn_options=conn_options)
        self._client = client
        self._api_key = api_key
        self._base_url = base_url
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens

    def _build_messages(self) -> List[Dict[str, Any]]:
        """Convert ChatContext to OpenRouter message format, including images for vision models."""
        messages = []
        # Updated vision check to support more multimodal models
        vision_keywords = ["gemini", "google", "claude-3", "gpt-4", "gpt-4o", "pixtral", "llama-3.2-vision"]
        is_vision_model = any(keyword in self._model.lower() for keyword in vision_keywords)
        
        for item in self._chat_ctx.items:
            role = str(item.role)
            if role not in ("system", "user", "assistant"):
                continue

            # Handle content that may include images
            if isinstance(item.content, str):
                messages.append({"role": role, "content": item.content})
            elif isinstance(item.content, list):
                # Multimodal content list
                content_parts = []
                for part in item.content:
                    if isinstance(part, str):
                        content_parts.append({"type": "text", "text": part})
                    elif hasattr(part, "text"):
                        content_parts.append({"type": "text", "text": part.text})
                    elif hasattr(part, "image"):
                        # ImageContent - convert frame to base64 for API
                        if is_vision_model:
                            try:
                                import base64
                                import io
                                from PIL import Image
                                from livekit import rtc
                                
                                frame = part.image
                                # Handle both raw frames and PIL images
                                if hasattr(frame, "convert") and hasattr(frame, "width") and not hasattr(frame, "save"):
                                    img_buffer = frame.convert(rtc.VideoBufferType.RGBA)
                                    pil_img = Image.frombytes("RGBA", (img_buffer.width, img_buffer.height), img_buffer.data)
                                else:
                                    pil_img = frame
                                
                                # Resize and encode
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
                    # If only text parts, simplify for non-vision models
                    if all(p.get("type") == "text" for p in content_parts):
                        text = " ".join(p["text"] for p in content_parts)
                        messages.append({"role": role, "content": text})
                    else:
                        messages.append({"role": role, "content": content_parts})

        return messages

    async def _run(self) -> None:
        """Execute the streaming request."""
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://beethoven.app",
            "X-Title": "Beethoven AI Teacher",
        }

        messages = self._build_messages()

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": self._temperature,
            "max_tokens": self._max_tokens,
            "stream": True,
        }

        try:
            logger.info(f"📤 [LLM] Sending request to OpenRouter (model: {self._model})")
            async with self._client.stream(
                "POST",
                f"{self._base_url}/chat/completions",
                headers=headers,
                json=payload,
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(f"❌ [LLM] OpenRouter error {response.status_code}: {error_text.decode()}")
                    raise Exception(f"OpenRouter API error: {response.status_code}")

                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue

                    data = line[6:]
                    if data == "[DONE]":
                        break

                    try:
                        chunk = json.loads(data)
                        choices = chunk.get("choices", [])
                        if not choices:
                            continue

                        delta = choices[0].get("delta", {})
                        content = delta.get("content", "")

                        if content:
                            chat_chunk = ChatChunk(
                                id=chunk.get("id", str(uuid.uuid4())),
                                delta=ChoiceDelta(
                                    role="assistant",
                                    content=content,
                                )
                            )
                            self._event_ch.send_nowait(chat_chunk)
                    except json.JSONDecodeError:
                        continue
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ [LLM] HTTP error: {e}")
            raise Exception(f"OpenRouter API error: {e.response.status_code}") from e
        except Exception as e:
            logger.error(f"❌ [LLM] Request failed: {e}")
            raise Exception(f"OpenRouter request failed: {e}") from e
