"""OpenRouter LLM provider for the Beethoven agent.

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

    def _build_tools(self) -> List[Dict[str, Any]]:
        """Convert FunctionTool objects to OpenAI-compatible tool format.

        Handles both FunctionTool objects AND plain methods (which may arrive when
        SDK internals pass bound methods instead of FunctionTool wrappers).
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
                tool_type = type(tool).__name__
                logger.debug(f"🔧 [TOOLS] Tool {i}: type={tool_type}")

                name = None
                description = ""
                parameters = {"type": "object", "properties": {}, "required": []}

                # Case 1: FunctionTool with .info attribute (SDK's proper format)
                if hasattr(tool, "info"):
                    info = tool.info
                    name = getattr(info, "name", None)
                    description = getattr(info, "description", "") or ""

                    # Try raw_schema first (RawFunctionTool)
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
                    # Get the underlying function
                    func = tool.__func__
                    name = func.__name__
                    description = (func.__doc__ or "").split("\n\n")[0].strip()  # First paragraph

                    # Build parameters from signature
                    sig = inspect.signature(func)
                    props, req = self._params_from_signature(sig)
                    parameters = {"type": "object", "properties": props, "required": req}

                    # Try to extract better param descriptions from docstring
                    if func.__doc__ and "Args:" in func.__doc__:
                        props = self._enrich_params_from_docstring(props, func.__doc__)
                        parameters["properties"] = props

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
            # Skip self, ctx, context, cls
            if pname in ("self", "ctx", "context", "cls"):
                continue

            # Determine type from annotation
            param_type = "string"  # Default
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

            # Check if required (no default)
            if param.default == inspect.Parameter.empty:
                required.append(pname)

        return props, required

    def _enrich_params_from_docstring(self, props: dict, docstring: str) -> dict:
        """Extract parameter descriptions from Google-style docstring Args section."""
        import re

        # Find Args section
        args_match = re.search(r"Args:\s*\n(.*?)(?:\n\n|\nReturns:|\nRaises:|\Z)", docstring, re.DOTALL)
        if not args_match:
            return props

        args_text = args_match.group(1)

        # Parse each argument line
        for line in args_text.split("\n"):
            line = line.strip()
            if not line:
                continue
            # Match "param_name: description" or "param_name (type): description"
            match = re.match(r"(\w+)(?:\s*\([^)]+\))?:\s*(.+)", line)
            if match:
                param_name, desc = match.groups()
                if param_name in props:
                    props[param_name]["description"] = desc.strip()

        return props

    async def _run(self) -> None:
        """Execute the streaming request with retry logic for transient errors."""
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://beethoven.app",
            "X-Title": "Beethoven AI Teacher",
        }

        messages = self._build_messages()
        tools = self._build_tools()

        # Debug: Log the system prompt length
        for msg in messages:
            if msg.get("role") == "system":
                content = msg.get("content", "")
                if isinstance(content, str):
                    print(f"🔍 [DEBUG] System prompt length: {len(content)} chars", flush=True)
                    if "Current News" in content:
                        print(f"🔍 [DEBUG] ✅ System prompt CONTAINS 'Current News' section", flush=True)
                    else:
                        print(f"🔍 [DEBUG] ❌ System prompt DOES NOT contain 'Current News' section", flush=True)

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
                    logger.info(f"🔄 [LLM] Retry attempt {attempt}/{MAX_RETRIES} after {wait_time:.2f}s")
                    await asyncio.sleep(wait_time)

                logger.info(f"📤 [LLM] Sending request to OpenRouter (model: {self._model})")
                async with self._client.stream(
                    "POST",
                    f"{self._base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        error_msg = error_text.decode()
                        logger.error(f"❌ [LLM] OpenRouter error {response.status_code}: {error_msg}")

                        # Check if retryable
                        if response.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES:
                            last_error = Exception(f"OpenRouter API error: {response.status_code}")
                            continue  # Retry

                        raise Exception(f"OpenRouter API error: {response.status_code}")

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
                                    call_id=tc_data.get("id") or str(uuid.uuid4()),
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
                logger.error(f"❌ [LLM] HTTP error: {e}")
                if e.response.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES:
                    last_error = e
                    continue
                raise Exception(f"OpenRouter API error: {e.response.status_code}") from e
            except httpx.TimeoutException as e:
                logger.warning(f"⏱️ [LLM] Timeout on attempt {attempt + 1}: {e}")
                if attempt < MAX_RETRIES:
                    last_error = e
                    continue
                raise Exception(f"OpenRouter request timed out after {MAX_RETRIES + 1} attempts") from e
            except Exception as e:
                # For other exceptions, don't retry
                logger.error(f"❌ [LLM] Request failed: {e}")
                raise Exception(f"OpenRouter request failed: {e}") from e

        # All retries exhausted
        if last_error:
            logger.error(f"❌ [LLM] All {MAX_RETRIES + 1} attempts failed")
            raise Exception(f"OpenRouter request failed after {MAX_RETRIES + 1} attempts: {last_error}") from last_error
