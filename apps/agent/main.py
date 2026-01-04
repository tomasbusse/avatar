"""
Beethoven Agent - Ultra Low Latency Voice + Vision
- Fast LLM for conversation
- Vision LLM: Gemini for image analysis
- Deepgram STT (streaming)
- Cartesia TTS (low-latency)
- Beyond Presence Avatar
"""

import logging
import io
import base64
import json
import os
import random
import re
import httpx
import time
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# =============================================================================
# SENTRY INITIALIZATION - Initialize early for maximum error coverage
# =============================================================================
from src.monitoring import get_sentry, BreadcrumbLogger

sentry = get_sentry()
sentry.initialize(
    dsn=os.environ.get("SENTRY_DSN"),
    environment=os.environ.get("SENTRY_ENVIRONMENT", "development"),
    release=os.environ.get("SENTRY_RELEASE", "beethoven-agent@1.0.0"),
    traces_sample_rate=1.0,  # 100% in dev, reduce to 0.1-0.2 in prod
    profiles_sample_rate=0.5,
    integrations=["httpx", "asyncio", "logging"],
)

from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, llm
from livekit.agents.voice import AgentSession, Agent
from livekit.agents.llm import ChatMessage, ChatRole
from livekit.plugins import deepgram, cartesia, bey

from src.utils.config import Config
from src.utils.convex_client import ConvexClient
from src.providers.llm.openrouter import OpenRouterLLM
from src.rag import ZepRetriever, RAGCache
from src.knowledge import LessonKnowledgeManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("beethoven-agent")

# Global config loaded once at startup
_config = None


# =============================================================================
# LATENCY TRACKING - Diagnose pipeline bottlenecks
# =============================================================================
class LatencyTracker:
    """
    Tracks timing across the speech pipeline to identify bottlenecks.

    Pipeline stages:
    1. User speaks → STT processes (stt_start → stt_end)
    2. STT transcript → LLM processes (llm_start → llm_first_token → llm_end)
    3. LLM response → TTS synthesizes (tts_start → tts_first_audio → tts_end)
    4. Total: user_speech_end → first_audio_played
    """

    def __init__(self):
        self.reset()
        self._turn_count = 0

    def reset(self):
        """Reset all timers for a new turn."""
        self._timings = {}
        self._turn_start = None

    def mark(self, event: str):
        """Mark a timing event."""
        now = time.time()
        self._timings[event] = now

        if event == "user_speech_start":
            self._turn_start = now
            self._turn_count += 1
            logger.info(f"⏱️ [LATENCY] Turn {self._turn_count} started")

    def get_elapsed(self, from_event: str, to_event: str) -> Optional[float]:
        """Get elapsed time between two events in ms."""
        if from_event in self._timings and to_event in self._timings:
            return (self._timings[to_event] - self._timings[from_event]) * 1000
        return None

    def get_total_latency(self) -> Optional[float]:
        """Get total latency from user speech end to first audio played."""
        return self.get_elapsed("user_speech_end", "tts_first_audio")

    def log_summary(self):
        """Log a summary of all timing measurements."""
        if not self._timings:
            return

        summary_parts = [f"⏱️ [LATENCY] Turn {self._turn_count} Summary:"]

        # STT timing
        stt_time = self.get_elapsed("user_speech_end", "stt_transcript_final")
        if stt_time:
            summary_parts.append(f"  STT: {stt_time:.0f}ms")

        # LLM timing
        llm_start = self.get_elapsed("stt_transcript_final", "llm_start")
        llm_first = self.get_elapsed("llm_start", "llm_first_token")
        llm_total = self.get_elapsed("llm_start", "llm_end")
        if llm_first:
            summary_parts.append(f"  LLM first token: {llm_first:.0f}ms")
        if llm_total:
            summary_parts.append(f"  LLM total: {llm_total:.0f}ms")

        # TTS timing
        tts_first = self.get_elapsed("llm_first_token", "tts_first_audio")
        tts_total = self.get_elapsed("tts_start", "tts_end")
        if tts_first:
            summary_parts.append(f"  TTS first audio: {tts_first:.0f}ms")
        if tts_total:
            summary_parts.append(f"  TTS total: {tts_total:.0f}ms")

        # Total response latency (most important metric)
        total = self.get_elapsed("user_speech_end", "tts_first_audio")
        if total:
            status = "✅" if total < 1000 else "⚠️" if total < 2000 else "❌"
            summary_parts.append(f"  {status} TOTAL LATENCY: {total:.0f}ms")

        # Log all at once
        logger.info("\n".join(summary_parts))


# Global latency tracker instance
_latency_tracker = LatencyTracker()


# =============================================================================
# BEETHOVENTEACHER - Custom Agent with Vision Support (james_agent pattern)
# =============================================================================
class BeethovenTeacher(Agent):
    """
    Custom agent that captures video frames during each turn and injects them
    into the message as llm.ImageContent for vision-capable models (Gemini).

    Also handles RAG context injection for knowledge base queries.

    This follows the james_agent pattern where vision happens in on_user_turn_completed,
    NOT in a background loop.
    """

    def __init__(
        self,
        room: rtc.Room,
        llm_model: str = "google/gemini-2.5-flash-lite",
        rag_retriever: Optional["ZepRetriever"] = None,
        rag_cache: Optional["RAGCache"] = None,
        knowledge_base_ids: Optional[list] = None,
        lesson_manager: Optional["LessonKnowledgeManager"] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self._room = room
        self._llm_model = llm_model
        self._is_vision_model = any(kw in llm_model.lower() for kw in ["gemini", "google", "gpt-4o", "claude-3"])

        # RAG components (Zep semantic search)
        self._rag_retriever = rag_retriever
        self._rag_cache = rag_cache
        self._knowledge_base_ids = knowledge_base_ids or []

        # Lesson knowledge manager (structured JSON access)
        self._lesson_manager = lesson_manager

        # Frame buffering (essential for low-FPS screen shares)
        self._latest_frames = {} # track_sid -> rtc.VideoFrame
        self._track_info = {}    # track_sid -> {"source": str, "identity": str}
        self._current_doc_image = None # For high-quality document images from data packets

        # Game state tracking
        self._game_active = False
        self._game_info = None  # Current game config (type, title, etc.)
        self._game_state = None  # Progress (currentItem, correctAnswers, etc.)
        self._game_screenshot = None  # Latest game screenshot for vision

        logger.info(f"[BEETHOVENTEACHER] Initialized with model={llm_model}, vision={self._is_vision_model}")
        logger.info(f"[BEETHOVENTEACHER] RAG enabled: {bool(rag_retriever)}, KBs: {len(self._knowledge_base_ids)}")
        logger.info(f"[BEETHOVENTEACHER] Lesson manager: {bool(lesson_manager)}, Lessons: {len(lesson_manager.index) if lesson_manager else 0}")

        # Listen for tracks
        self._room.on("track_subscribed", self._on_track_subscribed)
        self._room.on("data_received", self._on_data_received)

        # Track existing tracks
        for participant in self._room.remote_participants.values():
            for pub in participant.track_publications.values():
                if pub.track and pub.kind == rtc.TrackKind.KIND_VIDEO:
                    self._start_track_capture(pub.track, pub, participant)

    def _on_track_subscribed(self, track: rtc.Track, pub: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        if track.kind == rtc.TrackKind.KIND_VIDEO:
            self._start_track_capture(track, pub, participant)

    def _start_track_capture(self, track: rtc.VideoTrack, pub: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        if "avatar" in participant.identity.lower() or "bey" in participant.identity.lower():
            return
            
        source_name = "webcam"
        if pub.source == rtc.TrackSource.SOURCE_SCREENSHARE:
            source_name = "screen"
            
        self._track_info[track.sid] = {
            "source": source_name,
            "identity": participant.identity
        }
        
        # Start background capture task
        import asyncio
        asyncio.create_task(self._capture_loop(track))
        logger.info(f"[VISION] Started background capture for {source_name} from {participant.identity}")

    async def _capture_loop(self, track: rtc.VideoTrack):
        try:
            video_stream = rtc.VideoStream(track)
            async for event in video_stream:
                self._latest_frames[track.sid] = event.frame
            await video_stream.aclose()
        except Exception as e:
            logger.error(f"[VISION] Capture loop error for {track.sid}: {e}")
        finally:
            self._latest_frames.pop(track.sid, None)
            self._track_info.pop(track.sid, None)

    def _on_data_received(self, dp: rtc.DataPacket):
        try:
            payload = json.loads(dp.data.decode('utf-8'))
            msg_type = payload.get("type")

            if msg_type == "document_image":
                self._current_doc_image = payload.get("image")
                logger.info(f"[VISION] Received high-quality document image via data channel")
            elif msg_type == "slide_screenshot":
                # Handle HTML slide screenshots the same way as document images
                self._current_doc_image = payload.get("imageBase64")
                slide_index = payload.get("slideIndex", 0)
                logger.info(f"[VISION] Received slide screenshot for slide {slide_index}")

            # Game-related messages
            elif msg_type == "game_loaded":
                self._game_active = True
                self._game_info = payload.get("game", {})
                self._game_state = {
                    "currentItemIndex": 0,
                    "totalItems": payload.get("totalItems", 1),
                    "correctAnswers": 0,
                    "incorrectAnswers": 0,
                }
                game_title = self._game_info.get("title", "Unknown")
                game_type = self._game_info.get("type", "unknown")
                logger.info(f"🎮 [GAME] Game loaded: '{game_title}' (type: {game_type}, items: {self._game_state['totalItems']})")

            elif msg_type == "game_state":
                if self._game_active:
                    self._game_state = {
                        "currentItemIndex": payload.get("currentItemIndex", 0),
                        "totalItems": payload.get("totalItems", 1),
                        "correctAnswers": payload.get("correctAnswers", 0),
                        "incorrectAnswers": payload.get("incorrectAnswers", 0),
                    }
                    logger.info(f"🎮 [GAME] State update: item {self._game_state['currentItemIndex']+1}/{self._game_state['totalItems']}, correct: {self._game_state['correctAnswers']}")

            elif msg_type == "game_screenshot":
                # High-quality screenshot of current game state for vision
                self._game_screenshot = payload.get("imageBase64")
                logger.info(f"🎮 [VISION] Received game screenshot")

            elif msg_type == "game_complete":
                final_score = payload.get("correctAnswers", 0)
                total = payload.get("totalItems", 1)
                stars = payload.get("stars", 0)
                logger.info(f"🎮 [GAME] Complete! Score: {final_score}/{total}, Stars: {stars}")
                # Keep game info for completion feedback, but mark as no longer active
                self._game_active = False
                self._game_state = {
                    "completed": True,
                    "finalScore": final_score,
                    "totalItems": total,
                    "stars": stars,
                }

            elif msg_type == "game_ended":
                logger.info(f"🎮 [GAME] Game ended/closed")
                self._game_active = False
                self._game_info = None
                self._game_state = None
                self._game_screenshot = None

        except Exception as e:
            logger.error(f"[DATA] Error processing data packet: {e}")

    async def send_game_command(self, command: str, **kwargs):
        """
        Send a game command to the frontend.
        Commands: hint, next, prev, goto, highlight
        """
        try:
            msg = {"type": "game_command", "command": command, **kwargs}
            data = json.dumps(msg).encode('utf-8')
            await self._room.local_participant.publish_data(data, reliable=True)
            logger.info(f"🎮 [GAME] Sent command: {command} {kwargs}")
        except Exception as e:
            logger.error(f"🎮 [GAME] Failed to send command: {e}")

    def _get_game_context(self) -> Optional[str]:
        """
        Build context string about the current game state for LLM injection.
        """
        if not self._game_active or not self._game_info:
            return None

        game_type = self._game_info.get("type", "unknown")
        game_title = self._game_info.get("title", "")
        instructions = self._game_info.get("instructions", "")

        # Build game type description
        game_type_desc = {
            "sentence_builder": "Sentence Builder - drag and drop words to build correct sentences",
            "word_scramble": "Word Scramble - unscramble letters to form the correct word",
            "hangman": "Hangman - guess letters to reveal the hidden word",
        }.get(game_type, game_type)

        context_parts = [
            f"[ACTIVE GAME: {game_type_desc}]",
            f"Title: {game_title}" if game_title else "",
            f"Instructions: {instructions}" if instructions else "",
        ]

        if self._game_state:
            current = self._game_state.get("currentItemIndex", 0) + 1
            total = self._game_state.get("totalItems", 1)
            correct = self._game_state.get("correctAnswers", 0)
            incorrect = self._game_state.get("incorrectAnswers", 0)
            context_parts.extend([
                f"Progress: Question {current} of {total}",
                f"Score: {correct} correct, {incorrect} incorrect",
            ])

            # Check for completion
            if self._game_state.get("completed"):
                stars = self._game_state.get("stars", 0)
                context_parts.append(f"🎉 GAME COMPLETED! Final score: {correct}/{total}, Stars: {'⭐' * stars}")

        context_parts.append(
            "\nYour role: Watch the student play, encourage them, provide hints if they struggle (3+ wrong attempts), "
            "and celebrate their successes. You can see the game via screenshot. Be supportive and positive!"
        )

        return "\n".join(filter(None, context_parts))

    async def on_user_turn_completed(
        self,
        turn_ctx: llm.ChatContext,
        new_message: llm.ChatMessage
    ) -> None:
        """
        Called when user finishes speaking.
        1. Injects RAG context from knowledge bases
        2. Uses the latest buffered video frames and high-quality document images.
        """
        # === RAG CONTEXT INJECTION ===
        if self._rag_retriever and self._knowledge_base_ids:
            try:
                # Get user's query text
                user_text = ""
                if isinstance(new_message.content, str):
                    user_text = new_message.content
                elif isinstance(new_message.content, list):
                    for item in new_message.content:
                        if isinstance(item, str):
                            user_text += item
                        elif hasattr(item, "text"):
                            user_text += item.text

                if user_text.strip():
                    import time
                    start_time = time.time()

                    # Try cache first
                    chunks = None
                    if self._rag_cache:
                        chunks, was_cached = await self._rag_cache.get_or_fetch(
                            user_text,
                            self._knowledge_base_ids,
                            lambda: self._rag_retriever.search(
                                user_text,
                                self._knowledge_base_ids,
                                limit=3,
                                min_score=0.7
                            )
                        )
                        if was_cached:
                            logger.info(f"📚 [RAG] Cache hit ({time.time() - start_time:.3f}s)")
                    else:
                        chunks = await self._rag_retriever.search(
                            user_text,
                            self._knowledge_base_ids,
                            limit=3,
                            min_score=0.7
                        )

                    elapsed = time.time() - start_time

                    if chunks:
                        # Format context and inject as system message
                        context = self._rag_retriever.format_context(chunks)
                        rag_system_msg = ChatMessage(
                            role=ChatRole.SYSTEM,
                            content=f"[RELEVANT KNOWLEDGE FROM YOUR MATERIALS]\n{context}\n[END KNOWLEDGE]\n\nUse this information naturally in your response if relevant to the student's question."
                        )
                        # Insert before the user message in chat context
                        turn_ctx.messages.insert(-1, rag_system_msg)
                        logger.info(f"📚 [RAG] Injected {len(chunks)} chunks ({elapsed:.3f}s)")
                    else:
                        logger.debug(f"📚 [RAG] No relevant chunks found ({elapsed:.3f}s)")

            except Exception as e:
                logger.error(f"📚 [RAG] Error: {e}")

        # === LESSON CONTENT INJECTION ===
        if self._lesson_manager and self._lesson_manager.index:
            try:
                # Get user's query text
                user_text = ""
                if isinstance(new_message.content, str):
                    user_text = new_message.content
                elif isinstance(new_message.content, list):
                    for item in new_message.content:
                        if isinstance(item, str):
                            user_text += item
                        elif hasattr(item, "text"):
                            user_text += item.text

                if user_text.strip():
                    import time
                    start_time = time.time()

                    # Pattern match against lesson index
                    matches = self._lesson_manager.match_query(user_text)

                    if matches:
                        # Determine focus from query
                        text_lower = user_text.lower()
                        focus = "all"
                        if any(w in text_lower for w in ["exercise", "übung", "practice", "quiz"]):
                            focus = "exercises"
                        elif any(w in text_lower for w in ["grammar", "grammatik", "rule", "tense"]):
                            focus = "grammar"
                        elif any(w in text_lower for w in ["vocab", "word", "vokabel", "wort"]):
                            focus = "vocabulary"

                        # Fetch and inject content for top match
                        for match in matches[:1]:
                            json_content = await self._lesson_manager.get_content(match.content_id)
                            if json_content:
                                context = self._lesson_manager.format_for_context(json_content, focus)
                                lesson_msg = ChatMessage(
                                    role=ChatRole.SYSTEM,
                                    content=f"[RELEVANT LESSON MATERIAL]\n{context}\n[Use this content to guide your teaching response]"
                                )
                                # Insert before the user message
                                turn_ctx.messages.insert(-1, lesson_msg)
                                elapsed = time.time() - start_time
                                logger.info(f"📖 [LESSON] Injected '{match.title}' ({focus}) in {elapsed:.3f}s")
                    else:
                        logger.debug(f"📖 [LESSON] No matching lesson content found")

            except Exception as e:
                logger.error(f"📖 [LESSON] Error: {e}")

        # === GAME CONTEXT INJECTION ===
        game_context = self._get_game_context()
        if game_context:
            game_msg = ChatMessage(
                role=ChatRole.SYSTEM,
                content=game_context
            )
            turn_ctx.messages.insert(-1, game_msg)
            logger.info(f"🎮 [GAME] Injected game context into conversation")

        # === VISION PROCESSING ===
        if not self._is_vision_model:
            return

        captured_images = []

        # 1. Add tracked video frames (webcam/screen)
        # We use a copy of the dict to avoid modification during iteration
        for track_sid, frame in list(self._latest_frames.items()):
            info = self._track_info.get(track_sid, {"source": "webcam", "identity": "unknown"})
            captured_images.append({
                "image": frame,
                "source": info["source"],
                "identity": info["identity"]
            })

        # 2. Add high-quality document/game image if available
        doc_image_content = None
        # Prefer game screenshot when game is active, otherwise use document image
        if self._game_screenshot:
            doc_image_content = self._game_screenshot
            logger.debug(f"[VISION] Using game screenshot for vision")
        elif self._current_doc_image:
            doc_image_content = self._current_doc_image
        
        # Inject images into the message if we have any
        if captured_images or doc_image_content:
            try:
                # Sort: screen share first (most important), then webcam
                captured_images.sort(key=lambda x: 0 if x["source"] == "screen" else 1)
                
                # Build vision content list
                vision_contents = []
                
                # Keep original text content
                if isinstance(new_message.content, list):
                    vision_contents = [c for c in new_message.content if not isinstance(c, llm.ImageContent)]
                else:
                    vision_contents = [new_message.content]
                
                # Add high-quality doc image first
                if doc_image_content:
                    try:
                        import base64
                        from PIL import Image as PILImage
                        import io
                        
                        # Handle base64 data URL
                        if isinstance(doc_image_content, str) and "," in doc_image_content:
                            docbase64 = doc_image_content.split(",")[1]
                        else:
                            docbase64 = doc_image_content
                        
                        if isinstance(docbase64, str):
                            img_bytes = base64.b64decode(docbase64)
                            pil_img = PILImage.open(io.BytesIO(img_bytes))
                            vision_contents.append(llm.ImageContent(image=pil_img))
                            logger.info(f"[VISION] ✅ Injected high-quality document image")
                    except Exception as de:
                         logger.error(f"[VISION] Failed to decode doc image: {de}")

                # Add captured frames as ImageContent
                for img_data in captured_images:
                    vision_contents.append(llm.ImageContent(image=img_data["image"]))
                    logger.info(f"[VISION] ✅ Injected {img_data['source']} frame from {img_data['identity']}")
                
                # MUTATE the message content
                new_message.content = vision_contents
                logger.info(f"[VISION] Total images attached: {len([c for c in vision_contents if isinstance(c, llm.ImageContent)])}")
                
            except Exception as ve:
                logger.error(f"[VISION] Failed to attach frames: {ve}")


def build_system_prompt(avatar_config: Dict[str, Any]) -> str:
    """
    Build a SIMPLE, focused system prompt.

    Key insight: Simpler prompts = better, more natural responses.
    Complex rule sets overwhelm the LLM and create robotic behavior.
    """
    avatar_name = avatar_config.get("name", "Emma")
    logger.info(f"🔨 Building simplified system prompt for: {avatar_name}")

    # Get core identity - just the essentials
    identity = avatar_config.get("identity", {})
    short_bio = identity.get("shortBio", "a friendly English teacher")

    # Get personality essence - keep it simple
    personality = avatar_config.get("personality", {})
    style = personality.get("style", {})
    if isinstance(style, dict):
        style_desc = style.get("vocabulary", "warm and encouraging")
    else:
        style_desc = str(style) if style else "warm and encouraging"

    # Get base system prompt if exists (this is the main custom instruction)
    system_prompts = avatar_config.get("systemPrompts", {})
    base_prompt = system_prompts.get("base", "")

    # Build SIMPLE prompt - this is intentionally short
    prompt_parts = [f"You are {avatar_name}, {short_bio}.", f"Your style: {style_desc}"]

    if base_prompt:
        prompt_parts.append(base_prompt)

    # Add essential conversation guidelines - keep it minimal
    prompt_parts.append("""
IMPORTANT:
- Be conversational and natural - like talking to a friend
- Keep responses SHORT (1-2 sentences usually, more only if explaining something)
- Never repeat yourself or rephrase what you just said
- Listen carefully and respond to what was actually said""")

    full_prompt = "\n\n".join(prompt_parts)
    logger.info(f"📝 System prompt: {len(full_prompt)} chars (simplified)")

    return full_prompt.strip()


def get_time_of_day() -> str:
    """Get the current time of day for greeting templates."""
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def get_opening_greeting(avatar_config: Dict[str, Any], student_info: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """
    Build the avatar's opening greeting based on sessionStartConfig.

    Returns None if behavior is not speak_first.
    """
    session_config = avatar_config.get("sessionStartConfig", {})

    # Check if avatar should speak first
    behavior = session_config.get("behavior", "speak_first")
    if behavior != "speak_first":
        return None

    # Get greeting template or variation
    greeting = session_config.get("openingGreeting")

    if not greeting:
        # Try variations
        variations = session_config.get("greetingVariations", [])
        if variations:
            greeting = random.choice(variations)
        else:
            # Default greeting
            avatar_name = avatar_config.get("name", "Emma")
            greeting = f"Hello! I'm {avatar_name}. Great to see you today. How are you doing?"

    # Replace variables
    student_name = ""
    if student_info:
        student_name = student_info.get("name", student_info.get("firstName", ""))

    time_of_day = get_time_of_day()

    # Variable substitution
    greeting = greeting.replace("{studentName}", student_name)
    greeting = greeting.replace("{timeOfDay}", time_of_day)
    greeting = greeting.replace("{lessonTopic}", "")  # Can be filled from session context
    greeting = greeting.replace("{previousLesson}", "")  # Can be filled from memory

    # Clean up any empty variable remnants
    greeting = greeting.replace("  ", " ").strip()

    return greeting


def check_api_credentials_background():
    """
    Validate API credentials in background thread.
    This helps catch quota/auth problems without blocking prewarm.
    """
    import threading

    def _check():
        issues = []
        timeout = 2.0  # Reduced timeout for faster checks

        # Check Beyond Presence API
        bey_api_key = os.environ.get("BEY_API_KEY")
        if bey_api_key:
            try:
                response = httpx.get(
                    "https://api.bey.dev/latest/avatar",
                    headers={"x-api-key": bey_api_key, "Content-Type": "application/json"},
                    timeout=timeout
                )
                if response.status_code in (200, 404):
                    logger.info("✅ Beyond Presence API: OK")
                elif response.status_code == 402:
                    logger.warning("⚠️ BEYOND PRESENCE QUOTA EXCEEDED - https://www.beyondpresence.ai/")
                    issues.append("bey_quota")
                elif response.status_code in (401, 403):
                    logger.error("❌ Beyond Presence: Invalid API key")
                    issues.append("bey_auth")
            except Exception as e:
                logger.debug(f"Beyond Presence check: {e}")

        # Check Cartesia TTS API
        cartesia_api_key = os.environ.get("CARTESIA_API_KEY")
        if cartesia_api_key:
            try:
                response = httpx.get(
                    "https://api.cartesia.ai/voices",
                    headers={"X-API-Key": cartesia_api_key, "Cartesia-Version": "2024-06-10"},
                    timeout=timeout
                )
                if response.status_code == 200:
                    logger.info("✅ Cartesia TTS API: OK")
                elif response.status_code == 402:
                    logger.warning("⚠️ CARTESIA QUOTA EXCEEDED - https://play.cartesia.ai/settings")
                    issues.append("cartesia_quota")
                elif response.status_code in (401, 403):
                    logger.error("❌ Cartesia: Invalid API key")
                    issues.append("cartesia_auth")
            except Exception as e:
                logger.debug(f"Cartesia check: {e}")

        # Check Deepgram STT API
        deepgram_api_key = os.environ.get("DEEPGRAM_API_KEY")
        if deepgram_api_key:
            try:
                response = httpx.get(
                    "https://api.deepgram.com/v1/projects",
                    headers={"Authorization": f"Token {deepgram_api_key}"},
                    timeout=timeout
                )
                if response.status_code == 200:
                    logger.info("✅ Deepgram STT API: OK")
                elif response.status_code == 402:
                    logger.warning("⚠️ DEEPGRAM QUOTA EXCEEDED")
                    issues.append("deepgram_quota")
                elif response.status_code == 401:
                    logger.error("❌ Deepgram: Invalid API key")
                    issues.append("deepgram_auth")
            except Exception as e:
                logger.debug(f"Deepgram check: {e}")

        if issues:
            logger.warning(f"⚠️ API issues: {', '.join(issues)}")

    # Run in background thread so prewarm doesn't block
    thread = threading.Thread(target=_check, daemon=True)
    thread.start()


def prewarm(proc: JobProcess):
    """
    Prewarm function - runs when worker starts, BEFORE any jobs.
    Pre-loads expensive resources to reduce first-response latency.
    """
    global _config
    logger.info("🔥 Prewarming agent process...")

    # Check API credentials in background (non-blocking)
    check_api_credentials_background()

    # Load config once
    _config = Config()

    # Note: Using Deepgram's server-side VAD instead of Silero for Python 3.14 compatibility
    # Deepgram Nova-3 has excellent built-in voice activity detection
    logger.info("🎤 Using Deepgram server-side VAD (no Silero required)")

    # Pre-initialize STT with REDUCED endpointing for faster responses
    proc.userdata["deepgram_stt"] = deepgram.STT(
        model="nova-3",              # Best quality
        language="multi",            # Bilingual EN/DE support
        smart_format=True,
        interim_results=True,
        endpointing_ms=300,          # REDUCED from 600ms to 300ms for faster turn detection
    )
    logger.info("🎙️ STT loaded (Deepgram Nova-3, endpointing=300ms)")

    # Pre-create TTS instances with better defaults
    proc.userdata["cartesia_tts"] = cartesia.TTS(
        model="sonic-3",             # Upgraded from sonic-2 for lower latency
        voice="1463a4e1-56a1-4b41-b257-728d56e93605",
        language="en",
        sample_rate=24000,
    )

    proc.userdata["deepgram_tts"] = deepgram.TTS(
        model="aura-asteria-en",
    )
    logger.info("🔊 TTS loaded (Cartesia sonic-3)")

    # Initialize RAG components if Zep API key is available
    import os
    zep_api_key = os.environ.get("ZEP_API_KEY")
    if zep_api_key:
        proc.userdata["rag_retriever"] = ZepRetriever(api_key=zep_api_key)
        proc.userdata["rag_cache"] = RAGCache(max_size=100, ttl_seconds=300)
        logger.info("📚 RAG retriever initialized (Zep Cloud)")
    else:
        logger.info("⚠️ ZEP_API_KEY not set - RAG disabled")

    logger.info("✅ Prewarm complete - VAD/STT/TTS ready")


async def analyze_with_vision_llm(
    api_key: str,
    vision_model: str,
    frame: Any, # Can be rtc.VideoFrame or PIL.Image
    user_text: str,
) -> Optional[str]:
    """
    Call the Vision LLM (e.g., Gemini) with an image frame.
    Returns a text description of what the model sees.
    """
    try:
        from PIL import Image
        
        if hasattr(frame, "convert") and hasattr(frame, "width") and not hasattr(frame, "save"):
            # It's an rtc.VideoFrame
            img_buffer = frame.convert(rtc.VideoBufferType.RGBA)
            pil_img = Image.frombytes("RGBA", (img_buffer.width, img_buffer.height), img_buffer.data)
        else:
            # It's already a PIL Image (or similar)
            pil_img = frame
        
        # Resize if too large
        max_size = 768
        if pil_img.width > max_size or pil_img.height > max_size:
            pil_img.thumbnail((max_size, max_size))
        
        # Convert to JPEG
        buf = io.BytesIO()
        pil_img.convert("RGB").save(buf, format="JPEG", quality=80)
        b64_image = base64.b64encode(buf.getvalue()).decode("utf-8")
        
        # Call OpenRouter with the vision model
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://beethoven.app",
                    "X-Title": "Beethoven AI Teacher",
                },
                json={
                    "model": vision_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that describes what you see in images. Be concise and focus on educational content like slides, diagrams, or text. Keep descriptions under 100 words. If you see an avatar or a video feed of a teacher, IGNORE IT and focus on the student or the slides."
                        },
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": f"The student said: '{user_text}'. What do you see in this image?"},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}}
                            ]
                        }
                    ],
                    "max_tokens": 200,
                    "temperature": 0.3,
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                description = data["choices"][0]["message"]["content"]
                logger.info(f"👁️ Vision LLM response: {description[:100]}...")
                return description
            else:
                logger.error(f"Vision LLM error: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Failed to analyze image: {e}")
        return None


async def capture_webcam_frame(room: rtc.Room) -> Optional[rtc.VideoFrame]:
    """Capture a single frame from user's webcam if available."""
    # logger.info(f"🔍 Searching for webcam in room with {len(room.remote_participants)} remote participants")
    if not room.remote_participants:
        # logger.error("No remote participants found in room")
        pass

    for participant in room.remote_participants.values():
        if participant.identity == "bey-avatar-agent":
            continue
            
        # logger.info(f"👤 Checking participant: {participant.identity} tracks: {len(participant.track_publications)}")
        for pub in participant.track_publications.values():
            if pub.track and pub.source == rtc.TrackSource.SOURCE_CAMERA:
                logger.info(f"👁️ Capturing webcam frame from {participant.identity}")
                stream = rtc.VideoStream(pub.track)
                async for event in stream:
                    await stream.aclose()
                    return event.frame
                await stream.aclose()
            elif pub.track:
                # logger.error(f"   Found track but source is {pub.source} (not CAMERA)")
                pass
    return None


async def capture_screen_frame(room: rtc.Room) -> Optional[rtc.VideoFrame]:
    """Capture a single frame from screen share if available."""
    for participant in room.remote_participants.values():
        if participant.identity == "bey-avatar-agent":
            continue
        for pub in participant.track_publications.values():
            if pub.track and pub.source == rtc.TrackSource.SOURCE_SCREENSHARE:
                logger.info(f"👁️ Capturing screen share frame from {participant.identity}")
                stream = rtc.VideoStream(pub.track)
                async for event in stream:
                    await stream.aclose()
                    return event.frame
                await stream.aclose()
    return None


async def entrypoint(ctx: JobContext):
    """Main entrypoint - with dual-LLM vision support."""

    global _config
    config = _config or Config()

    room_name = ctx.room.name
    logger.info(f"🚀 Agent starting for room: {room_name}")

    # First try to get avatar config from room metadata (passed from token API)
    avatar_config = None
    room_metadata_str = ctx.room.metadata

    if room_metadata_str:
        try:
            room_metadata = json.loads(room_metadata_str)
            if room_metadata.get("avatar"):
                avatar_config = room_metadata["avatar"]
                logger.info(f"✅ Got avatar config from room metadata: {avatar_config.get('name', 'Unknown')}")

                # CRITICAL: Log llmConfig and voiceProvider immediately
                logger.info(f"   ⚡ [CRITICAL] llmConfig: {avatar_config.get('llmConfig')}")
                logger.info(f"   ⚡ [CRITICAL] voiceProvider: {avatar_config.get('voiceProvider')}")
                logger.info(f"   ⚡ [CRITICAL] All avatar keys: {list(avatar_config.keys())}")

                # Detailed logging for personality and identity
                personality = avatar_config.get('personality')
                identity = avatar_config.get('identity')
                system_prompts = avatar_config.get('systemPrompts')

                logger.info(f"   📝 Personality: {bool(personality)} - {personality if personality else 'None'}")
                logger.info(f"   🪪 Identity: {bool(identity)} - {identity if identity else 'None'}")
                logger.info(f"   📜 SystemPrompts: {bool(system_prompts)} - base: {system_prompts.get('base', 'None')[:100] if system_prompts else 'None'}...")
                logger.info(f"   🎭 Persona: {avatar_config.get('persona')}")
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ Failed to parse room metadata: {e}")

    # Fallback to Convex if no avatar in metadata
    # Also fetch session data for structured lesson detection
    session_data = None
    if not avatar_config:
        logger.info("📡 No avatar in room metadata, falling back to Convex...")
        convex = ConvexClient(config.convex_url)

        session_data = await convex.get_session_by_room(room_name)
        if session_data and session_data.get("avatarId"):
            avatar_id = session_data["avatarId"]
            avatar_config = await convex.get_avatar_by_id(avatar_id)
        else:
            avatar_config = await convex.get_default_avatar()

        await convex.close()
    else:
        # Even with avatar from metadata, fetch session data for structured lesson check
        convex = ConvexClient(config.convex_url)
        session_data = await convex.get_session_by_room(room_name)
        await convex.close()

    # Check for structured lesson with pre-loaded presentation
    is_structured_lesson = False
    if session_data:
        presentation_mode = session_data.get("presentationMode", {})
        is_structured_lesson = presentation_mode.get("active", False)
        if is_structured_lesson:
            logger.info("🎓 Structured lesson detected with pre-loaded presentation")

    if not avatar_config:
        logger.error("❌ No avatar config found!")
        return

    logger.info(f"⚙️ Loaded avatar: {avatar_config.get('name', 'Unknown')}")

    # Fetch available presentations from Convex for the load_presentation tool
    available_presentations = []
    try:
        fetch_convex = ConvexClient(config.convex_url)
        presentations_result = await fetch_convex.query("presentations:getAllReadyPresentations", {})
        await fetch_convex.close()

        if presentations_result:
            available_presentations = presentations_result
            logger.info(f"📊 Loaded {len(available_presentations)} available presentations")
            for p in available_presentations:
                logger.info(f"   - {p.get('name')} (ID: {p.get('id')}, {p.get('totalSlides', 0)} slides)")
    except Exception as e:
        logger.warning(f"⚠️ Could not load presentations: {e}")

    # Initialize lesson knowledge manager for structured content access
    lesson_manager = None
    avatar_id = avatar_config.get("_id")
    if avatar_id:
        try:
            # Create a persistent Convex client for the session
            session_convex = ConvexClient(config.convex_url)
            lesson_manager = LessonKnowledgeManager(session_convex)
            await lesson_manager.load_index(avatar_id)
            logger.info(f"📖 Lesson manager initialized with {len(lesson_manager.index)} lessons")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize lesson manager: {e}")
            lesson_manager = None
    else:
        logger.info("📖 No avatar ID - lesson manager skipped")

    # Get LLM model - handle BOTH formats:
    # 1. Room metadata: nested llmConfig object
    # 2. Convex client: flat llm_model key (after transformation)
    llm_config = avatar_config.get("llmConfig", {})
    if llm_config and llm_config.get("model"):
        # Room metadata format (nested)
        llm_model = llm_config.get("model")
        logger.info(f"🧠 LLM Config from avatar (nested): model={llm_model}, temp={llm_config.get('temperature')}")
    else:
        # Convex client format (flat)
        llm_model = avatar_config.get("llm_model", "anthropic/claude-3.5-sonnet")
        llm_temp = avatar_config.get("llm_temperature", 0.7)
        logger.info(f"🧠 LLM Config from avatar (flat): model={llm_model}, temp={llm_temp}")

    # Get Vision config (nested object in schema)
    vision_config = avatar_config.get("visionConfig", {}) or avatar_config.get("vision_config", {})
    vision_enabled = vision_config.get("enabled", False)
    # Schema uses visionLLMModel (camelCase)
    vision_llm_model = vision_config.get("visionLLMModel") or vision_config.get("vision_llm_model", "google/gemini-2.5-flash-preview-05-20")
    # Schema uses captureMode (camelCase)
    capture_mode = vision_config.get("captureMode") or vision_config.get("capture_mode", "smart")

    logger.info(f"👁️ Vision config: enabled={vision_enabled}, model={vision_llm_model}, mode={capture_mode}")
    logger.info(f"   Raw vision_config: {vision_config}")
    
    # CRITICAL: If vision is enabled, ensure we use a vision-capable model
    if vision_enabled:
        vision_keywords = ["gemini", "google", "claude-3", "gpt-4", "gpt-4o", "pixtral", "llama-3.2-vision"]
        is_vision_capable = any(keyword in llm_model.lower() for keyword in vision_keywords)
        
        if not is_vision_capable:
            logger.info(f"🔄 Vision enabled but LLM ({llm_model}) is likely not vision-capable. Switching to {vision_llm_model}")
            llm_model = vision_llm_model
    
    # Connect to room
    if vision_enabled:
        await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
        logger.info(f"✅ Connected (subscribing to all tracks for vision)")
        logger.info(f"👁️ Vision LLM: {vision_llm_model}")
        
        # Log participants and tracks
        logger.info(f"👥 Participants in room: {len(ctx.room.remote_participants)}")
        for p in ctx.room.remote_participants.values():
            logger.info(f"   - {p.identity} (Tracks: {len(p.track_publications)})")
            for pub in p.track_publications.values():
                logger.info(f"     * {pub.sid}: {pub.source} (Subscribed: {pub.subscribed})")
    else:
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        logger.info(f"✅ Connected (audio only)")
    
    # Initialize STT - configurable via avatar sttConfig (nested object in schema)
    stt_config = avatar_config.get("sttConfig", {})
    stt_model = stt_config.get("model", "nova-3")
    stt_language = stt_config.get("language", "en")
    stt_settings = stt_config.get("settings", {})
    stt_endpointing = stt_settings.get("endpointing", 300)  # Default reduced from 600 to 300ms for faster response
    stt_smart_format = stt_settings.get("smartFormat", True)

    logger.info(f"🎤 STT Config from avatar: model={stt_model}, language={stt_language}, endpointing={stt_endpointing}ms")

    stt = deepgram.STT(
        model=stt_model,
        language=stt_language if stt_language != "en" else "multi",  # Use multi for bilingual support
        smart_format=stt_smart_format,
        interim_results=True,
        endpointing_ms=stt_endpointing,
    )
    
    # Initialize TTS - handle BOTH formats:
    # 1. Room metadata: nested voiceProvider object
    # 2. Convex client: flat voice_config object (after transformation)
    voice_provider = avatar_config.get("voiceProvider", {})
    voice_config = avatar_config.get("voice_config", {})

    if voice_provider and voice_provider.get("voiceId"):
        # Room metadata format (nested)
        voice_settings = voice_provider.get("settings", {})
        voice_id = voice_provider.get("voiceId", "")
        tts_model = voice_provider.get("model", "sonic-2")
        tts_speed = voice_settings.get("speed", 1.0)
        tts_emotion = voice_settings.get("emotion", ["positivity:medium"])
        logger.info(f"🔊 Voice Provider (nested): model={tts_model}, voice={voice_id}")
    else:
        # Convex client format (flat)
        voice_id = voice_config.get("voice_id", "")
        tts_model = voice_config.get("model", "sonic-2")
        tts_speed = voice_config.get("speed", 1.0)
        tts_emotion = voice_config.get("emotion", ["positivity:medium"])
        logger.info(f"🔊 Voice Provider (flat): model={tts_model}, voice={voice_id}")

    # Create slide command callback for TTS wrapper
    async def send_slide_command(cmd_type: str, slide_num: Optional[int] = None):
        """Send slide command via data channel when TTS detects markers."""
        try:
            if cmd_type == "next":
                msg = {"type": "slide_command", "command": "next"}
            elif cmd_type == "prev":
                msg = {"type": "slide_command", "command": "prev"}
            elif cmd_type == "goto" and slide_num:
                msg = {"type": "slide_command", "command": "goto", "slideIndex": slide_num - 1}
            else:
                return

            data = json.dumps(msg).encode('utf-8')
            await ctx.room.local_participant.publish_data(data, reliable=True)
            logger.info(f"📤 [SLIDE] Command sent via TTS wrapper: {msg}")
        except Exception as e:
            logger.error(f"❌ [SLIDE] Failed to send command: {e}")

    if voice_id.startswith("aura-"):
        logger.info(f"🔊 Using Deepgram TTS: {voice_id}")
        base_tts = deepgram.TTS(model=voice_id)
    else:
        cartesia_voice = voice_id or "1463a4e1-56a1-4b41-b257-728d56e93605"
        logger.info(f"🔊 Using Cartesia TTS: model={tts_model}, voice={cartesia_voice}")
        base_tts = cartesia.TTS(
            model=tts_model,
            voice=cartesia_voice,
            language="en",
            sample_rate=24000,
        )

    # Use base TTS directly (slide navigation handled via LLM tool calls)
    tts = base_tts
    logger.info("🔊 TTS initialized (slide nav via tool calls)")
    
    # Initialize LLM (for conversation)
    logger.info(f"🧠 Using LLM: {llm_model}")
    llm_instance = OpenRouterLLM(
        model=llm_model,
        temperature=0.7,
    )
    
    # Track state for vision
    has_screen_share = False
    has_webcam = False
    last_vision_description = ""
    
    if vision_enabled:
        # Log existing participants and their tracks
        async def log_video_tracks():
            logger.info(f"📊 Room has {len(ctx.room.remote_participants)} remote participant(s)")
            for participant in ctx.room.remote_participants.values():
                logger.info(f"👤 Participant: {participant.identity}")
                for pub in participant.track_publications.values():
                    source_name = "camera" if pub.source == rtc.TrackSource.SOURCE_CAMERA else (
                        "screen" if pub.source == rtc.TrackSource.SOURCE_SCREENSHARE else str(pub.source)
                    )
                    kind_name = "video" if pub.kind == rtc.TrackKind.KIND_VIDEO else "audio"
                    logger.info(f"   📹 Track: {source_name}/{kind_name}, subscribed={pub.subscribed}, track={pub.track is not None}")
        
        # Run initial check after a short delay
        import asyncio
        asyncio.create_task(asyncio.sleep(2.0))
        asyncio.create_task(log_video_tracks())
        
        @ctx.room.on("track_published")
        def on_track_published(publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            nonlocal has_screen_share, has_webcam
            source_name = "camera" if publication.source == rtc.TrackSource.SOURCE_CAMERA else (
                "screen" if publication.source == rtc.TrackSource.SOURCE_SCREENSHARE else str(publication.source)
            )
            logger.info(f"📡 Track published: {source_name} from {participant.identity}")
            if publication.source == rtc.TrackSource.SOURCE_SCREENSHARE:
                has_screen_share = True
            elif publication.source == rtc.TrackSource.SOURCE_CAMERA:
                has_webcam = True
                logger.info(f"📹 WEBCAM detected from {participant.identity}!")
        
        @ctx.room.on("track_unpublished")
        def on_track_unpublished(publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            nonlocal has_screen_share, has_webcam
            if publication.source == rtc.TrackSource.SOURCE_SCREENSHARE:
                has_screen_share = False
                logger.info(f"📺 Screen share ended by {participant.identity}")
            elif publication.source == rtc.TrackSource.SOURCE_CAMERA:
                has_webcam = False
                logger.info(f"📹 Webcam ended by {participant.identity}")
        
        @ctx.room.on("track_subscribed")
        def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            source_name = "camera" if publication.source == rtc.TrackSource.SOURCE_CAMERA else (
                "screen" if publication.source == rtc.TrackSource.SOURCE_SCREENSHARE else str(publication.source)
            )
            logger.info(f"✅ Subscribed to {source_name} track from {participant.identity}")

        @ctx.room.on("data_received")
        def on_data_received(data: rtc.DataPacket):
            try:
                decoded = data.data.decode('utf-8')
                msg = json.loads(decoded)
                
                if msg.get("type") == "presentation_ready" or msg.get("type") == "slide_changed":
                    event_type = msg.get("type")
                    logger.info(f"📄 Event received: {event_type} for {msg.get('presentationId')}")

                        
            except Exception as e:
                logger.error(f"Data packet error: {e}")
    
    # Create agent session - OPTIMIZED for low latency
    # Using STT endpointing for turn detection (Python 3.14 compatible, no Silero)
    session = AgentSession(
        stt=stt,
        tts=tts,
        llm=llm_instance,
        turn_detection="stt",          # Use STT endpointing for turn detection
        min_endpointing_delay=0.3,     # REDUCED from 0.5 - faster turn completion
        max_endpointing_delay=1.0,     # REDUCED from 1.5 - don't wait too long
        allow_interruptions=True,      # Let user interrupt if needed
    )
    
    # Event logging with latency tracking
    @session.on("user_input_transcribed")
    def on_speech(event):
        if event.is_final and event.transcript:
            _latency_tracker.mark("stt_transcript_final")
            logger.info(f"🎯 HEARD: '{event.transcript}'")
        elif not event.is_final:
            # First interim result marks when user started speaking
            if "user_speech_start" not in _latency_tracker._timings:
                _latency_tracker.reset()
                _latency_tracker.mark("user_speech_start")

    @session.on("agent_state_changed")
    def on_state(event):
        logger.info(f"🤖 STATE: {event.old_state} → {event.new_state}")
        # Track key state transitions for latency
        if event.new_state == "thinking":
            _latency_tracker.mark("user_speech_end")
            _latency_tracker.mark("llm_start")
        elif event.new_state == "speaking":
            _latency_tracker.mark("tts_first_audio")
            # Log summary when avatar starts speaking (full pipeline complete)
            _latency_tracker.log_summary()
        elif event.old_state == "speaking" and event.new_state == "listening":
            _latency_tracker.mark("tts_end")

    @session.on("agent_started_speaking")
    def on_agent_speaking(event):
        _latency_tracker.mark("agent_speaking_start")
        logger.info(f"🗣️ Agent started speaking")

    @session.on("agent_stopped_speaking")
    def on_agent_stopped(event):
        _latency_tracker.mark("agent_speaking_end")
        logger.info(f"🤫 Agent stopped speaking")
    
    # Get Beyond Presence avatar settings
    avatar_provider = avatar_config.get("avatar_provider", {})
    avatar_id = avatar_provider.get("avatar_id")
    avatar_name = avatar_config.get("name", "Ludwig")

    logger.info(f"📺 Avatar configured: {avatar_name} (will start after session)")

    # Track avatar mode for session (will be set after avatar start attempt)
    audio_only_mode = False
    avatar_error_reason = None

    # Create agent with instructions - build rich prompt from personality/identity
    system_prompt = build_system_prompt(avatar_config)
    logger.info(f"📝 Built system prompt ({len(system_prompt)} chars)")

    if vision_enabled:
        vision_prompt = "\n\n# Vision\nYou can see visual content the student shares with you. When you receive visual information, incorporate it naturally into your teaching. You have access to webcam and screen share images attached to each user message."
        final_prompt = system_prompt + vision_prompt
    else:
        final_prompt = system_prompt

    # Add lesson material summary if available
    if lesson_manager and lesson_manager.index:
        lesson_summary = lesson_manager.get_summary()
        lesson_prompt = f"\n\n# Available Lesson Materials\n{lesson_summary}\n\nWhen the student asks about exercises, grammar, or vocabulary from these materials, use the specific content to guide your teaching. The relevant lesson content will be injected into the conversation when matched."
        final_prompt = final_prompt + lesson_prompt
        logger.info(f"📖 Added lesson summary to prompt ({len(lesson_summary)} chars)")

    # Add available presentations to the prompt
    if available_presentations:
        presentations_prompt = "\n\n# Available Presentations\nYou can display these presentations on the whiteboard to teach from. Use the load_presentation tool to show a presentation to the student:\n"
        for p in available_presentations:
            presentations_prompt += f"- \"{p.get('name', 'Untitled')}\" (ID: {p.get('id')}, {p.get('totalSlides', 0)} slides)\n"
        presentations_prompt += "\nTo show a presentation, call load_presentation(presentation_id=\"<ID>\"). Both you and the student will see the slides, and you can navigate with next_slide, prev_slide, and goto_slide tools.\n"
        final_prompt = final_prompt + presentations_prompt
        logger.info(f"📊 Added {len(available_presentations)} presentations to prompt")

    # Add structured lesson teaching mode prompt if session has pre-loaded presentation
    if is_structured_lesson:
        structured_lesson_prompt = """

# Teaching Mode: Structured Lesson
A presentation has been pre-loaded and is already visible to the student on slide 1.
You are conducting a structured lesson from this presentation.

## Lesson Flow:
1. **Greeting & Warm-up (30-60 seconds)**
   - Greet the student warmly and naturally
   - Brief small talk to establish rapport (How are you today? etc.)
   - Build comfort before diving into content

2. **Introduction to Lesson**
   - Transition naturally: "Let's take a look at what we'll be learning today..."
   - Reference slide 1 which is already visible
   - Give a brief overview of what's ahead

3. **Teaching from Slides**
   - Use next_slide, prev_slide, and goto_slide to navigate
   - Explain each slide clearly and engagingly
   - Ask questions to check understanding
   - Encourage the student to speak and practice

4. **Interactive Teaching**
   - Pause for student responses
   - Correct errors gently and constructively
   - Praise effort and progress
   - Use examples and analogies

## Key Behaviors:
- The slides are ALREADY VISIBLE to the student - don't offer to "show" or "load" them
- Navigate slides naturally as you teach: "Let's move to the next slide..."
- Reference visual elements on the slides when explaining
- Keep a conversational, encouraging tone
- Check understanding before moving on: "Does that make sense?" or "Any questions about this?"
"""
        final_prompt = final_prompt + structured_lesson_prompt
        logger.info("🎓 Added structured lesson teaching mode to prompt")

    # NOTE: Slide navigation removed - focusing on ultra-low latency

    # Get RAG components from prewarm
    rag_retriever = ctx.proc.userdata.get("rag_retriever")
    rag_cache = ctx.proc.userdata.get("rag_cache")

    # Get knowledge base IDs from avatar config
    knowledge_config = avatar_config.get("knowledgeConfig", {})
    knowledge_base_ids = knowledge_config.get("knowledgeBaseIds", [])

    # Convert Zep collection names from knowledge base IDs
    # Format: kb_{convex_id} for each knowledge base
    zep_collection_ids = [f"kb_{kb_id}" for kb_id in knowledge_base_ids] if knowledge_base_ids else []

    if rag_retriever and zep_collection_ids:
        logger.info(f"📚 RAG enabled with {len(zep_collection_ids)} knowledge bases")
    elif rag_retriever:
        logger.info(f"📚 RAG retriever ready but no knowledge bases configured for this avatar")

    # NOTE: Slide control tools removed for now - focusing on ultra-low latency speech

    # Use BeethovenTeacher (with vision/RAG/lesson hooks) if vision is enabled, otherwise plain Agent
    if vision_enabled:
        agent = BeethovenTeacher(
            room=ctx.room,
            llm_model=llm_model,
            instructions=final_prompt,
            rag_retriever=rag_retriever,
            rag_cache=rag_cache,
            knowledge_base_ids=zep_collection_ids,
            lesson_manager=lesson_manager,
        )
        logger.info(f"🎓 Using BeethovenTeacher with vision (model: {llm_model})")
        if lesson_manager:
            logger.info(f"📖 Lesson manager attached with {len(lesson_manager.index)} lessons")
    else:
        agent = Agent(instructions=final_prompt)
    
    # Start the session FIRST (before avatar, so audio pipeline is ready)
    await session.start(
        room=ctx.room,
        agent=agent
    )

    logger.info(f"✨ Session started (Vision: {'ON' if vision_enabled else 'OFF'})")

    # NOW start the avatar (after session is ready, so TTS audio can flow to avatar)
    if config.bey_api_key and avatar_id:
        try:
            logger.info(f"📺 Starting avatar: {avatar_name}")
            avatar = bey.AvatarSession(
                avatar_id=avatar_id,
                avatar_participant_name=avatar_name,
            )
            await avatar.start(session, room=ctx.room)
            logger.info(f"✅ Avatar '{avatar_name}' connected!")
        except Exception as e:
            error_str = str(e).lower()

            # Check for quota/payment errors (402 Payment Required)
            if "402" in error_str or "payment" in error_str or "quota" in error_str or "credit" in error_str or "limit" in error_str:
                logger.warning(f"⚠️ BEYOND PRESENCE QUOTA EXCEEDED - Switching to audio-only mode")
                logger.warning(f"💳 Please check your Beyond Presence account credits at https://app.beyondpresence.ai/billing")
                audio_only_mode = True
                avatar_error_reason = "quota_exceeded"
            # Check for authentication errors
            elif "401" in error_str or "unauthorized" in error_str or "invalid" in error_str and "key" in error_str:
                logger.error(f"🔑 BEYOND PRESENCE AUTH ERROR - Invalid API key. Switching to audio-only mode")
                audio_only_mode = True
                avatar_error_reason = "auth_error"
            # Check for rate limiting
            elif "429" in error_str or "rate" in error_str:
                logger.warning(f"⏱️ BEYOND PRESENCE RATE LIMITED - Switching to audio-only mode")
                audio_only_mode = True
                avatar_error_reason = "rate_limited"
            # General avatar failure
            else:
                logger.error(f"❌ Avatar failed: {e}")
                logger.exception(e)
                audio_only_mode = True
                avatar_error_reason = "unknown_error"

            if audio_only_mode:
                logger.info(f"🎧 Continuing session in AUDIO-ONLY mode (no avatar video)")
    else:
        logger.warning(f"⚠️ Missing API Key or Avatar ID - Running in audio-only mode")
        audio_only_mode = True
        avatar_error_reason = "missing_config"

    # Store audio-only state in job context for potential use
    if audio_only_mode:
        ctx.userdata["audio_only_mode"] = True
        ctx.userdata["avatar_error_reason"] = avatar_error_reason
        logger.info(f"📋 Session state: audio_only_mode={audio_only_mode}, reason={avatar_error_reason}")

    logger.info(f"✨ Agent '{avatar_name}' ready (Vision: {'ON' if vision_enabled else 'OFF'})")

    # Deliver opening greeting immediately (if speak_first behavior)
    opening_greeting = get_opening_greeting(avatar_config)
    logger.info(f"🎤 Opening greeting: {opening_greeting[:80] if opening_greeting else 'None'}...")

    if opening_greeting:
        try:
            import asyncio
            # Small delay to ensure avatar is fully connected
            await asyncio.sleep(0.5)
            logger.info(f"🎤 Calling session.say() with greeting...")
            # Use asyncio.wait_for to prevent hanging forever
            try:
                await asyncio.wait_for(
                    session.say(opening_greeting, allow_interruptions=True),
                    timeout=10.0  # 10 second timeout for greeting
                )
                logger.info(f"👋 Delivered opening greeting: '{opening_greeting[:50]}...'")
            except asyncio.TimeoutError:
                logger.warning(f"⏱️ Opening greeting timed out after 10s - continuing without greeting")
        except Exception as e:
            logger.error(f"❌ Failed to deliver opening greeting: {e}")
            logger.exception(e)
    else:
        logger.info(f"⏳ No opening greeting (behavior != speak_first)")

    # Note: Vision capture now happens in BeethovenTeacher.on_user_turn_completed
    # No need for background loop - this follows the james_agent pattern


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="beethoven-teacher",
            num_idle_processes=2,
        )
    )
