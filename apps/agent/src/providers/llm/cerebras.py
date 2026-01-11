"""Cerebras LLM provider for the Beethoven agent.

Cerebras offers ultra-fast inference at 2,314 tokens/sec - 70x faster than competitors.
Uses OpenAI-compatible API format.

Updated for LiveKit Agents SDK v1.2+
"""

import asyncio
import json
import logging
import os
import random
import uuid
from typing import Any, Dict, List, Optional

import httpx

# Retry configuration for transient errors
MAX_RETRIES = 3
INITIAL_BACKOFF = 0.5  # seconds
MAX_BACKOFF = 4.0  # seconds
RETRYABLE_STATUS_CODES = {500, 502, 503, 504, 429}

logger = logging.getLogger("beethoven-agent.cerebras")
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
    RawFunctionTool = FunctionTool


# Available Cerebras models - optimized for speed
CEREBRAS_MODELS = [
    {"id": "llama-3.3-70b", "name": "Llama 3.3 70B (Fastest)"},
    {"id": "llama-3.1-70b", "name": "Llama 3.1 70B"},
    {"id": "llama-3.1-8b", "name": "Llama 3.1 8B (Ultra Fast)"},
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
        model: str = "llama-3.3-70b",
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


class CerebrasStream(LLMStream):
    """Streaming response from Cerebras for LiveKit Agents v1.2+."""

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
        """Convert ChatContext to Cerebras message format.

        Note: Cerebras currently only supports text - no vision/multimodal.
        """
        messages = []

        for item in self._chat_ctx.items:
            role = str(item.role)
            if role not in ("system", "user", "assistant"):
                continue

            # Handle content - extract text only (Cerebras doesn't support vision)
            if isinstance(item.content, str):
                messages.append({"role": role, "content": item.content})
            elif isinstance(item.content, list):
                # Multimodal content - extract text parts only
                text_parts = []
                for part in item.content:
                    if isinstance(part, str):
                        text_parts.append(part)
                    elif hasattr(part, "text"):
                        text_parts.append(part.text)
                    # Skip image content - Cerebras doesn't support vision

                if text_parts:
                    messages.append({"role": role, "content": " ".join(text_parts)})

        return messages

    def _build_tools(self) -> List[Dict[str, Any]]:
        """Convert FunctionTool objects to OpenAI-compatible tool format.

        Note: Cerebras uses OpenAI-compatible API format for function calling.
        Handles both FunctionTool objects AND plain methods.
        """
        import inspect
        import types

        logger.info(f"🔧 [TOOLS] _build_tools called with {len(self._tools) if self._tools else 0} tools")
        if not self._tools:
            logger.info(f"🔧 [TOOLS] No tools available in self._tools")
            return []

        tools = []
        for i, tool in enumerate(self._tools):
            try:
                name = None
                description = ""
                parameters = {"type": "object", "properties": {}, "required": []}

                # Case 1: FunctionTool with .info attribute (SDK's proper format)
                if hasattr(tool, "info"):
                    info = tool.info
                    name = getattr(info, "name", None)
                    description = getattr(info, "description", "") or ""

                    if hasattr(info, "raw_schema") and info.raw_schema:
                        raw = info.raw_schema
                        parameters = raw.get("parameters", parameters)
                    elif hasattr(info, "parameters") and info.parameters:
                        parameters = info.parameters
                    elif hasattr(tool, "_callable"):
                        sig = inspect.signature(tool._callable)
                        props, req = self._params_from_signature(sig)
                        parameters = {"type": "object", "properties": props, "required": req}

                # Case 2: Plain bound method (when SDK passes methods instead of FunctionTool)
                elif isinstance(tool, types.MethodType):
                    func = tool.__func__
                    name = func.__name__
                    description = (func.__doc__ or "").split("\n\n")[0].strip()

                    sig = inspect.signature(func)
                    props, req = self._params_from_signature(sig)
                    parameters = {"type": "object", "properties": props, "required": req}
                    logger.info(f"🔧 [TOOLS] Tool {i}: extracted from method '{name}'")

                # Case 3: Plain function
                elif callable(tool):
                    name = getattr(tool, "__name__", f"tool_{i}")
                    description = (getattr(tool, "__doc__", "") or "").split("\n\n")[0].strip()

                    try:
                        sig = inspect.signature(tool)
                        props, req = self._params_from_signature(sig)
                        parameters = {"type": "object", "properties": props, "required": req}
                    except (ValueError, TypeError):
                        pass

                if name:
                    tool_def = {
                        "type": "function",
                        "function": {
                            "name": name,
                            "description": description,
                            "parameters": parameters
                        }
                    }
                    tools.append(tool_def)
                    logger.info(f"🔧 [TOOLS] Added tool: {name}")
                else:
                    logger.warning(f"🔧 [TOOLS] Tool {i} has no name, skipping")

            except Exception as te:
                logger.error(f"🔧 [TOOLS] Failed to add tool {i}: {te}")

        if tools:
            tool_names = [t['function']['name'] for t in tools]
            logger.info(f"🔧 [TOOLS] Sending {len(tools)} tools to LLM: {tool_names}")
        return tools

    def _params_from_signature(self, sig) -> tuple:
        """Extract parameter properties and required list from a function signature."""
        import inspect

        props = {}
        required = []
        for pname, param in sig.parameters.items():
            if pname in ("self", "ctx", "context", "cls"):
                continue

            param_type = "string"
            if param.annotation != inspect.Parameter.empty:
                ann = param.annotation
                if ann == str or getattr(ann, "__name__", "") == "str":
                    param_type = "string"
                elif ann == int or getattr(ann, "__name__", "") == "int":
                    param_type = "integer"
                elif ann == float or getattr(ann, "__name__", "") == "float":
                    param_type = "number"
                elif ann == bool or getattr(ann, "__name__", "") == "bool":
                    param_type = "boolean"

            props[pname] = {"type": param_type}

            if param.default == inspect.Parameter.empty:
                required.append(pname)

        return props, required

    async def _run(self) -> None:
        """Execute the streaming request with retry logic for transient errors."""
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        messages = self._build_messages()
        tools = self._build_tools()

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": self._temperature,
            "max_tokens": self._max_tokens,
            "stream": True,
        }

        # Add tools if available
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"  # Let the model decide when to use tools

        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                if attempt > 0:
                    # Exponential backoff with jitter
                    backoff = min(INITIAL_BACKOFF * (2 ** (attempt - 1)), MAX_BACKOFF)
                    jitter = random.uniform(0, backoff * 0.1)
                    wait_time = backoff + jitter
                    logger.info(f"[CEREBRAS] Retry attempt {attempt}/{MAX_RETRIES} after {wait_time:.2f}s")
                    await asyncio.sleep(wait_time)

                logger.info(f"[CEREBRAS] Sending request (model: {self._model})")
                async with self._client.stream(
                    "POST",
                    f"{self._base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        error_msg = error_text.decode()
                        logger.error(f"[CEREBRAS] Error {response.status_code}: {error_msg}")

                        # Check if retryable
                        if response.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES:
                            last_error = Exception(f"Cerebras API error: {response.status_code}")
                            continue  # Retry

                        raise Exception(f"Cerebras API error: {response.status_code}")

                    # Successful response - process the stream
                    # Track accumulated tool call data across chunks
                    tool_call_accumulator = {}  # tool_call_id -> {name, arguments}

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
                            tool_calls = delta.get("tool_calls", [])

                            # Handle regular content
                            if content:
                                chat_chunk = ChatChunk(
                                    id=chunk.get("id", str(uuid.uuid4())),
                                    delta=ChoiceDelta(
                                        role="assistant",
                                        content=content,
                                    )
                                )
                                self._event_ch.send_nowait(chat_chunk)

                            # Handle tool calls (streamed in parts)
                            for tc in tool_calls:
                                tc_index = tc.get("index", 0)
                                tc_id = tc.get("id")
                                tc_function = tc.get("function", {})

                                if tc_index not in tool_call_accumulator:
                                    tool_call_accumulator[tc_index] = {
                                        "id": tc_id,
                                        "name": "",
                                        "arguments": ""
                                    }

                                if tc_id:
                                    tool_call_accumulator[tc_index]["id"] = tc_id
                                if tc_function.get("name"):
                                    tool_call_accumulator[tc_index]["name"] = tc_function["name"]
                                if tc_function.get("arguments"):
                                    tool_call_accumulator[tc_index]["arguments"] += tc_function["arguments"]

                        except json.JSONDecodeError:
                            continue

                    # After stream completes, emit any accumulated tool calls
                    for tc_index, tc_data in tool_call_accumulator.items():
                        if tc_data.get("name"):
                            logger.info(f"🔧 [TOOLS] LLM called function: {tc_data['name']}")
                            logger.info(f"🔧 [TOOLS] Arguments: {tc_data['arguments']}")

                            # Create a FunctionToolCall to emit
                            try:
                                from livekit.agents.llm import FunctionToolCall
                                tool_call = FunctionToolCall(
                                    id=tc_data.get("id") or str(uuid.uuid4()),
                                    name=tc_data["name"],
                                    arguments=tc_data["arguments"]
                                )
                                # Send as a chat chunk with tool_calls
                                chat_chunk = ChatChunk(
                                    id=str(uuid.uuid4()),
                                    delta=ChoiceDelta(
                                        role="assistant",
                                        content="",
                                        tool_calls=[tool_call],
                                    )
                                )
                                self._event_ch.send_nowait(chat_chunk)
                            except Exception as e:
                                logger.error(f"🔧 [TOOLS] Failed to emit tool call: {e}")

                    # Success - exit retry loop
                    return

            except httpx.HTTPStatusError as e:
                logger.error(f"[CEREBRAS] HTTP error: {e}")
                if e.response.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES:
                    last_error = e
                    continue
                raise Exception(f"Cerebras API error: {e.response.status_code}") from e
            except httpx.TimeoutException as e:
                logger.warning(f"[CEREBRAS] Timeout on attempt {attempt + 1}: {e}")
                if attempt < MAX_RETRIES:
                    last_error = e
                    continue
                raise Exception(f"Cerebras request timed out after {MAX_RETRIES + 1} attempts") from e
            except Exception as e:
                # For other exceptions, don't retry
                logger.error(f"[CEREBRAS] Request failed: {e}")
                raise Exception(f"Cerebras request failed: {e}") from e

        # All retries exhausted
        if last_error:
            logger.error(f"[CEREBRAS] All {MAX_RETRIES + 1} attempts failed")
            raise Exception(f"Cerebras request failed after {MAX_RETRIES + 1} attempts: {last_error}") from last_error
