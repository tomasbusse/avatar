"""Groq LLM provider for the Beethoven agent.

Groq offers ultra-fast inference at ~40ms time-to-first-token.
Supports Llama 3.3 70B and other models with exceptional speed.
"""

import os
import logging
from typing import AsyncIterable

import httpx
from livekit.agents.llm import LLM, LLMStream, ChatContext, ChatChunk, ChoiceDelta

logger = logging.getLogger("beethoven-agent.groq")

MAX_RETRIES = 2
TIMEOUT = 30.0

# Available Groq models - optimized for speed
GROQ_MODELS = [
    "llama-3.3-70b-versatile",  # Best balance of speed and quality
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",     # Fastest, good for simple tasks
    "mixtral-8x7b-32768",       # Good for longer context
]


class GroqLLM(LLM):
    """Groq LLM implementation for LiveKit Agents.

    Groq provides ultra-fast LLM inference:
    - ~40ms time-to-first-token
    - High throughput streaming
    - Llama 3.3 70B and other models
    """

    def __init__(
        self,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        api_key: str | None = None,
    ):
        super().__init__()
        self._model = model
        self._temperature = temperature
        self._api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self._base_url = "https://api.groq.com/openai/v1"

        if not self._api_key:
            logger.warning("GROQ_API_KEY not set - Groq LLM will not work")

    def chat(
        self,
        *,
        chat_ctx: ChatContext,
        parallel_tool_calls: bool | None = None,
        tool_choice: str | None = None,
    ) -> "GroqStream":
        """Send chat completion request to Groq."""
        return GroqStream(
            chat_ctx=chat_ctx,
            api_key=self._api_key,
            base_url=self._base_url,
            temperature=self._temperature,
            model=self._model,
        )


class GroqStream(LLMStream):
    """Streaming response from Groq for LiveKit Agents."""

    def __init__(
        self,
        chat_ctx: ChatContext,
        api_key: str,
        base_url: str,
        temperature: float,
        model: str,
    ):
        super().__init__(chat_ctx=chat_ctx, fnc_ctx=None, conn_options=None)
        self._api_key = api_key
        self._base_url = base_url
        self._temperature = temperature
        self._model = model

    def _convert_messages(self, chat_ctx: ChatContext) -> list[dict]:
        """Convert ChatContext to Groq message format.

        Note: Groq currently only supports text - no vision/multimodal.
        """
        messages = []
        for msg in chat_ctx.messages:
            role = msg.role.value if hasattr(msg.role, 'value') else str(msg.role)

            # Handle content - extract text only (Groq doesn't support vision yet)
            if isinstance(msg.content, str):
                content = msg.content
            elif isinstance(msg.content, list):
                # Extract text parts only
                text_parts = []
                for part in msg.content:
                    if isinstance(part, str):
                        text_parts.append(part)
                    elif hasattr(part, 'text'):
                        text_parts.append(part.text)
                    # Skip image content - Groq doesn't support vision
                content = " ".join(text_parts) if text_parts else ""
            else:
                content = str(msg.content) if msg.content else ""

            if content:
                messages.append({"role": role, "content": content})

        return messages

    async def _run(self) -> AsyncIterable[ChatChunk]:
        """Execute the streaming request to Groq."""
        messages = self._convert_messages(self._chat_ctx)

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": self._temperature,
            "stream": True,
        }

        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                if attempt > 0:
                    import asyncio
                    wait_time = 0.5 * (2 ** (attempt - 1))
                    logger.info(f"[GROQ] Retry attempt {attempt}/{MAX_RETRIES} after {wait_time:.2f}s")
                    await asyncio.sleep(wait_time)

                logger.info(f"[GROQ] Sending request (model: {self._model})")

                async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                    async with client.stream(
                        "POST",
                        f"{self._base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self._api_key}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    ) as response:
                        if response.status_code != 200:
                            error_msg = await response.aread()
                            logger.error(f"[GROQ] Error {response.status_code}: {error_msg}")
                            if response.status_code in (429, 500, 502, 503, 504):
                                last_error = Exception(f"Groq API error: {response.status_code}")
                                continue
                            else:
                                raise Exception(f"Groq API error: {response.status_code}")

                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    break

                                try:
                                    import json
                                    chunk = json.loads(data)
                                    choices = chunk.get("choices", [])
                                    if choices:
                                        delta = choices[0].get("delta", {})
                                        content = delta.get("content", "")
                                        if content:
                                            yield ChatChunk(
                                                choices=[
                                                    ChoiceDelta(
                                                        delta=ChoiceDelta.Content(
                                                            role="assistant",
                                                            content=content
                                                        ),
                                                        index=0,
                                                    )
                                                ]
                                            )
                                except json.JSONDecodeError:
                                    continue

                        return  # Success

            except httpx.HTTPStatusError as e:
                logger.error(f"[GROQ] HTTP error: {e}")
                if e.response.status_code in (429, 500, 502, 503, 504):
                    last_error = e
                    continue
                raise Exception(f"Groq API error: {e.response.status_code}") from e
            except httpx.TimeoutException as e:
                logger.warning(f"[GROQ] Timeout on attempt {attempt + 1}: {e}")
                last_error = e
                continue
            except Exception as e:
                logger.error(f"[GROQ] Request failed: {e}")
                raise Exception(f"Groq request failed: {e}") from e

        # All retries exhausted
        if last_error:
            logger.error(f"[GROQ] All {MAX_RETRIES + 1} attempts failed")
            raise Exception(f"Groq request failed after {MAX_RETRIES + 1} attempts: {last_error}") from last_error
