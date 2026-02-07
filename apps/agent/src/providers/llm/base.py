"""Shared base class for OpenAI-compatible LLM streaming providers.

Consolidates common logic from OpenRouter, Cerebras, and Groq providers.
All three use the same OpenAI-compatible chat completions API with SSE streaming.
"""

import asyncio
import inspect
import json
import logging
import random
import types
import uuid
from typing import Any, Dict, List, Optional

import httpx

from livekit.agents import llm, APIConnectOptions
from livekit.agents.llm import (
    ChatContext,
    ChatChunk,
    ChoiceDelta,
    LLM,
    LLMStream,
    FunctionTool,
)

try:
    from livekit.agents.llm import RawFunctionTool
except ImportError:
    RawFunctionTool = FunctionTool

# Retry configuration for transient errors
MAX_RETRIES = 3
INITIAL_BACKOFF = 0.5  # seconds
MAX_BACKOFF = 4.0  # seconds
RETRYABLE_STATUS_CODES = {500, 502, 503, 504, 429}

logger = logging.getLogger("beethoven-agent.llm-base")


class OpenAICompatibleStream(LLMStream):
    """Base streaming response class for OpenAI-compatible LLM APIs.

    Subclasses only need to override:
    - _get_headers() for provider-specific auth/headers
    - _get_provider_name() for logging
    - _supports_vision (property) if the provider supports vision
    - _build_messages() if the provider needs custom message handling (e.g., vision)
    """

    def __init__(
        self,
        llm_instance: LLM,
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
        super().__init__(llm_instance, chat_ctx=chat_ctx, tools=tools, conn_options=conn_options)
        self._client = client
        self._api_key = api_key
        self._base_url = base_url
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens

    def _get_headers(self) -> Dict[str, str]:
        """Return provider-specific HTTP headers. Override in subclasses."""
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    def _get_provider_name(self) -> str:
        """Return provider name for logging. Override in subclasses."""
        return "LLM"

    @property
    def _supports_vision(self) -> bool:
        """Whether this provider supports vision/multimodal content."""
        return False

    def _build_messages(self) -> List[Dict[str, Any]]:
        """Convert ChatContext to OpenAI-compatible message format.

        Text-only by default. OpenRouter overrides this to add vision support.
        """
        messages = []

        for item in self._chat_ctx.items:
            role = str(item.role)
            if role not in ("system", "user", "assistant"):
                continue

            if isinstance(item.content, str):
                messages.append({"role": role, "content": item.content})
            elif isinstance(item.content, list):
                text_parts = []
                for part in item.content:
                    if isinstance(part, str):
                        text_parts.append(part)
                    elif hasattr(part, "text"):
                        text_parts.append(part.text)
                    # Skip image content by default

                if text_parts:
                    messages.append({"role": role, "content": " ".join(text_parts)})

        return messages

    def _build_tools(self) -> List[Dict[str, Any]]:
        """Convert FunctionTool objects to OpenAI-compatible tool format.

        Handles FunctionTool objects, plain methods, and plain callables.
        """
        provider = self._get_provider_name()
        logger.info(f"[{provider}] _build_tools called with {len(self._tools) if self._tools else 0} tools")
        if not self._tools:
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

                # Case 2: Plain bound method
                elif isinstance(tool, types.MethodType):
                    func = tool.__func__
                    name = func.__name__
                    description = (func.__doc__ or "").split("\n\n")[0].strip()

                    sig = inspect.signature(func)
                    props, req = self._params_from_signature(sig)
                    parameters = {"type": "object", "properties": props, "required": req}

                    if func.__doc__ and "Args:" in func.__doc__:
                        props = self._enrich_params_from_docstring(props, func.__doc__)
                        parameters["properties"] = props

                    logger.info(f"[{provider}] Tool {i}: extracted from method '{name}'")

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
                    logger.info(f"[{provider}] Added tool: {name}")
                else:
                    logger.warning(f"[{provider}] Tool {i} has no name, skipping")

            except Exception as te:
                logger.error(f"[{provider}] Failed to add tool {i}: {te}")

        if tools:
            tool_names = [t['function']['name'] for t in tools]
            logger.info(f"[{provider}] Sending {len(tools)} tools to LLM: {tool_names}")
        return tools

    def _params_from_signature(self, sig) -> tuple:
        """Extract parameter properties and required list from a function signature."""
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

    def _enrich_params_from_docstring(self, props: dict, docstring: str) -> dict:
        """Extract parameter descriptions from Google-style docstring Args section."""
        import re

        args_match = re.search(r"Args:\s*\n(.*?)(?:\n\n|\nReturns:|\nRaises:|\Z)", docstring, re.DOTALL)
        if not args_match:
            return props

        args_text = args_match.group(1)

        for line in args_text.split("\n"):
            line = line.strip()
            if not line:
                continue
            match = re.match(r"(\w+)(?:\s*\([^)]+\))?:\s*(.+)", line)
            if match:
                param_name, desc = match.groups()
                if param_name in props:
                    props[param_name]["description"] = desc.strip()

        return props

    async def _run(self) -> None:
        """Execute the streaming request with retry logic for transient errors."""
        provider = self._get_provider_name()
        headers = self._get_headers()

        messages = self._build_messages()
        tools = self._build_tools()

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": self._temperature,
            "max_tokens": self._max_tokens,
            "stream": True,
        }

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                if attempt > 0:
                    backoff = min(INITIAL_BACKOFF * (2 ** (attempt - 1)), MAX_BACKOFF)
                    jitter = random.uniform(0, backoff * 0.1)
                    wait_time = backoff + jitter
                    logger.info(f"[{provider}] Retry attempt {attempt}/{MAX_RETRIES} after {wait_time:.2f}s")
                    await asyncio.sleep(wait_time)

                logger.info(f"[{provider}] Sending request (model: {self._model})")
                async with self._client.stream(
                    "POST",
                    f"{self._base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        error_msg = error_text.decode()
                        logger.error(f"[{provider}] Error {response.status_code}: {error_msg}")

                        if response.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES:
                            last_error = Exception(f"{provider} API error: {response.status_code}")
                            continue

                        raise Exception(f"{provider} API error: {response.status_code}")

                    # Process the stream
                    tool_call_accumulator = {}

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

                            if content:
                                chat_chunk = ChatChunk(
                                    id=chunk.get("id", str(uuid.uuid4())),
                                    delta=ChoiceDelta(
                                        role="assistant",
                                        content=content,
                                    )
                                )
                                self._event_ch.send_nowait(chat_chunk)

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

                    # Emit accumulated tool calls
                    for tc_index, tc_data in tool_call_accumulator.items():
                        if tc_data.get("name"):
                            logger.info(f"[{provider}] LLM called function: {tc_data['name']}")
                            logger.info(f"[{provider}] Arguments: {tc_data['arguments']}")

                            try:
                                from livekit.agents.llm import FunctionToolCall
                                tool_call = FunctionToolCall(
                                    call_id=tc_data.get("id") or str(uuid.uuid4()),
                                    name=tc_data["name"],
                                    arguments=tc_data["arguments"]
                                )
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
                                logger.error(f"[{provider}] Failed to emit tool call: {e}")

                    return

            except httpx.HTTPStatusError as e:
                logger.error(f"[{provider}] HTTP error: {e}")
                if e.response.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES:
                    last_error = e
                    continue
                raise Exception(f"{provider} API error: {e.response.status_code}") from e
            except httpx.TimeoutException as e:
                logger.warning(f"[{provider}] Timeout on attempt {attempt + 1}: {e}")
                if attempt < MAX_RETRIES:
                    last_error = e
                    continue
                raise Exception(f"{provider} request timed out after {MAX_RETRIES + 1} attempts") from e
            except Exception as e:
                logger.error(f"[{provider}] Request failed: {e}")
                raise Exception(f"{provider} request failed: {e}") from e

        if last_error:
            logger.error(f"[{provider}] All {MAX_RETRIES + 1} attempts failed")
            raise Exception(f"{provider} request failed after {MAX_RETRIES + 1} attempts: {last_error}") from last_error
