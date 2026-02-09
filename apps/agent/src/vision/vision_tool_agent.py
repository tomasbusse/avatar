"""
VisionToolAgent - Async vision + tool-calling agent using Gemini 3 Flash.

Runs ASYNCHRONOUSLY alongside the main speaking LLM and NEVER blocks the
conversation pipeline. Observes video frames, describes what it sees, and
uses tools to control slides/materials.
"""

import asyncio
import base64
import io
import json
import logging
import time
from typing import Any, Dict, List, Optional

import httpx
from livekit import rtc

logger = logging.getLogger("beethoven-agent.vision-tool-agent")

# ---------------------------------------------------------------------------
# Tool definitions (OpenAI-compatible function calling format)
# ---------------------------------------------------------------------------

VISION_TOOLS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "next_slide",
            "description": "Advance to the next slide in the current presentation.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "prev_slide",
            "description": "Go back to the previous slide.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "goto_slide",
            "description": "Jump to a specific slide number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "slide_number": {
                        "type": "integer",
                        "description": "The 1-based slide number to jump to.",
                    }
                },
                "required": ["slide_number"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "load_content",
            "description": "Load lesson content or slides by content ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "content_id": {
                        "type": "string",
                        "description": "The ID of the content/presentation to load.",
                    }
                },
                "required": ["content_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "load_game",
            "description": "Load an interactive game by game ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "game_id": {
                        "type": "string",
                        "description": "The ID of the game to load.",
                    }
                },
                "required": ["game_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_materials",
            "description": "Show the materials panel to the student.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "close_materials",
            "description": "Close the materials panel.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


# ---------------------------------------------------------------------------
# System prompt template
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT_TEMPLATE = """\
You are the visual intelligence system for an AI English teacher named {avatar_name}.
You can SEE the student's webcam, screen share, and the lesson slides/whiteboard.

Your job:
1. OBSERVE: Describe what you see (student's expression, slide content, game state)
2. ACT: Use tools to control slides and load materials when appropriate (if tools are enabled)
3. REPORT: Provide concise visual context to the speaking avatar

{tools_section}

Current state:
- Slide: {current_slide}/{total_slides}
{material_section}

RULES:
- Only change slides when the speaking avatar has finished discussing the current slide
- If you see the student looks confused, report it (don't change slides)
- When a game is active, observe the student's answers and report progress
- Keep descriptions concise (under 100 words)
- Focus on educationally relevant observations\
"""


class VisionToolAgent:
    """Async vision agent that runs Gemini 3 Flash for observation and tool calling.

    This agent runs in its own async loop and never blocks the speaking LLM pipeline.
    It periodically analyzes video frames, produces text context for the speaking LLM,
    and executes tool calls (slide navigation, material loading) via the LiveKit
    data channel.
    """

    def __init__(
        self,
        *,
        api_key: str,
        room: rtc.Room,
        avatar_name: str = "Emma",
        vision_model: str = "google/gemini-3-flash-preview",
        analysis_interval: float = 1.5,
        material_context: Optional[Dict[str, Any]] = None,
        session_materials: Optional[Dict[str, Any]] = None,
        available_presentations: Optional[List[Dict[str, Any]]] = None,
        lesson_manager: Optional[Any] = None,
        enable_tool_calling: bool = True,
    ):
        # API / model config
        self._api_key = api_key
        self._vision_model = vision_model
        self._avatar_name = avatar_name
        self._analysis_interval = analysis_interval
        self._enable_tool_calling = enable_tool_calling

        # LiveKit room for data channel publishing
        self._room = room

        # Teaching context
        self._material_context = material_context or {}
        self._session_materials = session_materials or {}
        self._available_presentations = available_presentations or []
        self._lesson_manager = lesson_manager

        # Slide state (updated externally via update_slide_state)
        self.current_slide: int = 0
        self.total_slides: int = 0

        # Frame storage: track_sid -> (frame, source_label)
        self._frames: Dict[str, Any] = {}
        self._frame_timestamps: Dict[str, float] = {}
        # High-quality document / slide image (base64 string)
        self._doc_image: Optional[str] = None

        # Output: latest vision context readable by speaking LLM
        self.vision_context: str = ""
        self.last_analysis_time: float = 0.0

        # Loop control
        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None

        # HTTP client (reused across calls)
        self._client: Optional[httpx.AsyncClient] = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Start the background analysis loop."""
        if self.is_running:
            return
        self.is_running = True
        self._client = httpx.AsyncClient(timeout=30.0)
        self._task = asyncio.create_task(self._run_loop())
        logger.info("[VisionToolAgent] Started analysis loop (interval=%.1fs)", self._analysis_interval)

    async def stop(self) -> None:
        """Stop the analysis loop and clean up."""
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        if self._client:
            await self._client.aclose()
            self._client = None
        logger.info("[VisionToolAgent] Stopped analysis loop")

    # ------------------------------------------------------------------
    # External update methods (called from main agent)
    # ------------------------------------------------------------------

    def update_frame(self, track_sid: str, frame: Any, source: str) -> None:
        """Update the latest frame from the capture loop."""
        self._frames[track_sid] = (frame, source)
        self._frame_timestamps[track_sid] = time.time()

    def update_doc_image(self, image_data: str) -> None:
        """Update high-quality document/slide image (base64 string)."""
        self._doc_image = image_data

    def update_slide_state(self, current: int, total: int) -> None:
        """Update the current slide position."""
        self.current_slide = current
        self.total_slides = total

    def get_vision_context(self) -> str:
        """Return the latest vision context string for the speaking LLM."""
        return self.vision_context

    # ------------------------------------------------------------------
    # Background analysis loop
    # ------------------------------------------------------------------

    async def _run_loop(self) -> None:
        """Main async loop that periodically calls _analyze_once."""
        while self.is_running:
            try:
                await self._analyze_once()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("[VisionToolAgent] Analysis loop error: %s", e, exc_info=True)
            await asyncio.sleep(self._analysis_interval)

    # ------------------------------------------------------------------
    # Single analysis cycle
    # ------------------------------------------------------------------

    async def _analyze_once(self) -> None:
        """Run a single vision analysis cycle."""
        images = self._collect_images()
        if not images:
            return  # Nothing to analyze

        system_prompt = self._build_system_prompt()
        user_content: List[Dict[str, Any]] = [
            {"type": "text", "text": "Describe what you see and take any appropriate actions."}
        ]
        user_content.extend(images)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        if not self._client:
            return

        try:
            response = await self._client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://simmonds.online",
                    "X-Title": "Simmonds Online English - Vision Agent",
                },
                json={
                    "model": self._vision_model,
                    "messages": messages,
                    **({"tools": VISION_TOOLS} if self._enable_tool_calling else {}),
                    "max_tokens": 300,
                    "temperature": 0.3,
                },
            )

            if response.status_code != 200:
                logger.warning(
                    "[VisionToolAgent] API error %d: %s",
                    response.status_code,
                    response.text[:200],
                )
                return

            data = response.json()
            choice = data["choices"][0]
            message = choice["message"]

            # Extract text content (vision description)
            content = message.get("content")
            if content:
                self.vision_context = content
                logger.info("[VisionToolAgent] Context updated: %s", content[:80])

            # Execute any tool calls
            tool_calls = message.get("tool_calls")
            if tool_calls:
                for tc in tool_calls:
                    fn = tc["function"]
                    tool_name = fn["name"]
                    try:
                        tool_args = json.loads(fn.get("arguments", "{}"))
                    except json.JSONDecodeError:
                        tool_args = {}
                    await self._execute_tool_call(tool_name, tool_args)

            self.last_analysis_time = time.time()

        except httpx.TimeoutException:
            logger.warning("[VisionToolAgent] API request timed out")
        except Exception as e:
            logger.error("[VisionToolAgent] API call failed: %s", e, exc_info=True)

    # ------------------------------------------------------------------
    # Image collection helpers
    # ------------------------------------------------------------------

    def _collect_images(self) -> List[Dict[str, Any]]:
        """Collect available images for analysis, preferring high-quality doc images."""
        images: List[Dict[str, Any]] = []
        now = time.time()

        # 1. High-quality document/slide image (highest priority)
        if self._doc_image:
            b64 = self._doc_image
            # Handle both raw base64 and data-url prefixed strings
            if not b64.startswith("data:"):
                b64 = f"data:image/jpeg;base64,{b64}"
            images.append({
                "type": "image_url",
                "image_url": {"url": b64},
            })

        # 2. Video frames (webcam / screen share) - only if fresh (< 5s)
        for track_sid, (frame, source) in list(self._frames.items()):
            ts = self._frame_timestamps.get(track_sid, 0)
            if now - ts > 5.0:
                continue  # Stale frame
            b64 = self._frame_to_base64(frame)
            if b64:
                images.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                })

        return images

    @staticmethod
    def _frame_to_base64(frame: Any) -> Optional[str]:
        """Convert an rtc.VideoFrame (or PIL Image) to a base64 JPEG string."""
        try:
            from PIL import Image

            if hasattr(frame, "convert") and hasattr(frame, "width") and not hasattr(frame, "save"):
                # It's an rtc.VideoFrame
                img_buffer = frame.convert(rtc.VideoBufferType.RGBA)
                pil_img = Image.frombytes(
                    "RGBA", (img_buffer.width, img_buffer.height), img_buffer.data
                )
            elif hasattr(frame, "save"):
                # Already a PIL Image
                pil_img = frame
            else:
                return None

            # Resize to keep API payload small
            max_size = 768
            if pil_img.width > max_size or pil_img.height > max_size:
                pil_img.thumbnail((max_size, max_size))

            buf = io.BytesIO()
            pil_img.convert("RGB").save(buf, format="JPEG", quality=80)
            return base64.b64encode(buf.getvalue()).decode("utf-8")
        except Exception as e:
            logger.error("[VisionToolAgent] Frame conversion failed: %s", e)
            return None

    # ------------------------------------------------------------------
    # System prompt builder
    # ------------------------------------------------------------------

    def _build_system_prompt(self) -> str:
        """Build the system prompt with current context."""
        material_lines: List[str] = []

        # Available presentations
        if self._available_presentations:
            material_lines.append("Available presentations:")
            for p in self._available_presentations:
                pid = p.get("_id") or p.get("id", "?")
                title = p.get("title", "Untitled")
                material_lines.append(f"  - {title} (id: {pid})")

        # Session materials (content + games)
        contents = self._session_materials.get("contents") or self._session_materials.get("content") or []
        games = self._session_materials.get("games") or []

        if contents:
            material_lines.append("Available content:")
            for c in contents:
                cid = c.get("_id") or c.get("id", "?")
                title = c.get("title", "Untitled")
                material_lines.append(f"  - {title} (id: {cid})")

        if games:
            material_lines.append("Available games:")
            for g in games:
                gid = g.get("_id") or g.get("id", "?")
                title = g.get("title", "Untitled")
                material_lines.append(f"  - {title} (id: {gid})")

        material_section = "\n".join(material_lines) if material_lines else "No materials loaded."

        tools_section = (
            "You have these tools available:\n"
            "- next_slide, prev_slide, goto_slide - Navigate the presentation\n"
            "- load_content, load_game - Load new materials\n"
            "- show_materials, close_materials - Toggle materials panel"
            if self._enable_tool_calling
            else "Tool calling is DISABLED. Only observe and report - do not attempt tool calls."
        )

        return _SYSTEM_PROMPT_TEMPLATE.format(
            avatar_name=self._avatar_name,
            current_slide=self.current_slide,
            total_slides=self.total_slides,
            material_section=material_section,
            tools_section=tools_section,
        )

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    async def _execute_tool_call(self, tool_name: str, args: Dict[str, Any]) -> None:
        """Execute a tool call by publishing the appropriate data channel command."""
        try:
            if tool_name == "next_slide":
                msg = {"type": "slide_command", "command": "next"}
            elif tool_name == "prev_slide":
                msg = {"type": "slide_command", "command": "prev"}
            elif tool_name == "goto_slide":
                slide_number = args.get("slide_number", 1)
                msg = {"type": "slide_command", "command": "goto", "slideIndex": slide_number - 1}
            elif tool_name == "load_content":
                content_id = args.get("content_id", "")
                if not content_id:
                    logger.warning("[VisionToolAgent] load_content called without content_id")
                    return
                msg = {"type": "load_content", "contentId": content_id}
            elif tool_name == "load_game":
                game_id = args.get("game_id", "")
                if not game_id:
                    logger.warning("[VisionToolAgent] load_game called without game_id")
                    return
                msg = {"type": "load_game", "gameId": game_id}
            elif tool_name == "show_materials":
                msg = {"type": "show_materials_prompt"}
            elif tool_name == "close_materials":
                msg = {"type": "close_materials"}
            else:
                logger.warning("[VisionToolAgent] Unknown tool: %s", tool_name)
                return

            data = json.dumps(msg).encode("utf-8")
            await self._room.local_participant.publish_data(data, reliable=True)
            logger.info("[VisionToolAgent] Tool executed: %s -> %s", tool_name, msg)

        except Exception as e:
            logger.error("[VisionToolAgent] Tool execution failed (%s): %s", tool_name, e)
