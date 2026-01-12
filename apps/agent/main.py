"""
Beethoven Agent - Ultra Low Latency Voice + Vision
- Fast LLM for conversation
- Vision LLM: Gemini for image analysis
- Deepgram STT (streaming)
- Cartesia TTS (low-latency)
- Beyond Presence Avatar
"""

import asyncio
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
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, llm, function_tool, RunContext
from livekit.agents.voice import AgentSession, Agent, room_io
from livekit.agents.llm import ChatMessage, ChatRole
from livekit.plugins import deepgram, cartesia, bey, silero, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from src.utils.config import Config
from src.utils.convex_client import ConvexClient
from src.providers.llm.openrouter import OpenRouterLLM
from src.providers.llm.cerebras import CerebrasLLM
from src.providers.llm.groq import GroqLLM
from src.rag import ZepRetriever, RAGCache
from src.knowledge import LessonKnowledgeManager, search_web, WebSearchConfig, format_search_for_context
from src.memory import process_session_end
from src.agents import EntryTestAgent, create_entry_test_session
from src.games import AvatarGameHandler

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
# BILINGUAL LANGUAGE DETECTION - Detect German/English from transcript
# =============================================================================
def detect_language(text: str) -> str:
    """
    Detect language from text using simple heuristics.
    Returns "de" for German, "en" for English.

    For production, consider using STT's language tags or langdetect library.
    """
    text_lower = text.lower()

    # German indicators (common words, umlauts, patterns)
    german_words = [
        'ich', 'du', 'wir', 'sie', 'er', 'es', 'ist', 'sind', 'haben', 'habe',
        'was', 'wie', 'warum', 'wann', 'wo', 'der', 'die', 'das', 'ein', 'eine',
        'und', 'oder', 'aber', 'nicht', 'kann', 'kannst', 'muss', 'müssen',
        'verstehe', 'verstehen', 'bitte', 'danke', 'ja', 'nein', 'gut', 'schlecht',
        'sehr', 'auch', 'noch', 'schon', 'immer', 'nie', 'heute', 'morgen', 'gestern',
        'hallo', 'guten', 'tag', 'auf', 'wiedersehen', 'tschüss', 'sprechen', 'deutsch',
        'englisch', 'lernen', 'üben', 'hilfe', 'frage', 'antwort', 'richtig', 'falsch',
        'ähm', 'äh', 'hmm', 'öhm',  # German filler words
    ]

    german_score = 0
    words = text_lower.split()

    # Check for German words
    for word in words:
        # Strip punctuation
        clean_word = ''.join(c for c in word if c.isalnum() or c in 'äöüß')
        if clean_word in german_words:
            german_score += 2

    # Check for German-specific characters (umlauts, ß)
    if any(c in text_lower for c in 'äöüß'):
        german_score += 3

    # Calculate ratio
    word_count = len(words)
    if word_count > 0:
        german_ratio = german_score / word_count
        # If significant German detected (>30% score or 3+ indicators)
        if german_ratio > 0.3 or german_score >= 3:
            return "de"

    return "en"


def switch_tts_language(tts, language: str, language_settings: dict) -> bool:
    """
    Switch TTS language using update_options().
    Returns True if language was switched.
    """
    try:
        settings = language_settings.get(language, {})
        speed = settings.get("speed", 1.0)
        emotion = settings.get("emotion", "Enthusiastic" if language == "en" else "Calm")

        # Use update_options to switch language without recreating connection
        tts.update_options(
            language=language,
            speed=speed,
            emotion=[emotion] if emotion else None,
        )
        logger.info(f"🌍 TTS language switched to: {language} (speed={speed}, emotion={emotion})")
        return True
    except Exception as e:
        logger.warning(f"⚠️ Failed to switch TTS language: {e}")
        return False


# =============================================================================
# SESSION TIMER - Auto wrap-up and session end management
# =============================================================================
class SessionTimer:
    """
    Monitors session elapsed time and triggers callbacks for wrap-up and expiry.

    Usage:
        timer = SessionTimer(
            target_duration_minutes=30,
            wrap_up_buffer_minutes=2,
            on_wrap_up=async_wrap_up_callback,
            on_expired=async_expired_callback
        )
        await timer.start()
    """

    def __init__(
        self,
        target_duration_minutes: int,
        wrap_up_buffer_minutes: int = 2,
        on_wrap_up: Optional[callable] = None,
        on_expired: Optional[callable] = None,
        convex_client: Optional["ConvexClient"] = None,
        session_id: Optional[str] = None,
    ):
        self._target_minutes = target_duration_minutes
        self._wrap_up_buffer = wrap_up_buffer_minutes
        self._on_wrap_up = on_wrap_up
        self._on_expired = on_expired
        self._convex_client = convex_client
        self._session_id = session_id

        self._start_time: Optional[float] = None
        self._wrap_up_triggered = False
        self._expired_triggered = False
        self._running = False
        self._task: Optional[asyncio.Task] = None

        logger.info(f"⏱️ [TIMER] Initialized: {target_duration_minutes}min target, {wrap_up_buffer_minutes}min buffer")

    @property
    def elapsed_seconds(self) -> float:
        """Get elapsed time since session start in seconds."""
        if not self._start_time:
            return 0
        return time.time() - self._start_time

    @property
    def elapsed_minutes(self) -> float:
        """Get elapsed time in minutes."""
        return self.elapsed_seconds / 60

    @property
    def remaining_minutes(self) -> float:
        """Get remaining time in minutes (can be negative if expired)."""
        return self._target_minutes - self.elapsed_minutes

    @property
    def wrap_up_time_minutes(self) -> float:
        """When wrap-up should start (in minutes from start)."""
        return self._target_minutes - self._wrap_up_buffer

    @property
    def is_in_wrap_up(self) -> bool:
        """Whether we're in the wrap-up period."""
        return self.elapsed_minutes >= self.wrap_up_time_minutes and not self._expired_triggered

    @property
    def is_expired(self) -> bool:
        """Whether session time has expired."""
        return self.elapsed_minutes >= self._target_minutes

    def get_status(self) -> Dict[str, Any]:
        """Get current timer status for function tool response."""
        return {
            "elapsed_minutes": round(self.elapsed_minutes, 1),
            "remaining_minutes": round(max(0, self.remaining_minutes), 1),
            "target_minutes": self._target_minutes,
            "wrap_up_buffer_minutes": self._wrap_up_buffer,
            "is_in_wrap_up": self.is_in_wrap_up,
            "is_expired": self.is_expired,
            "wrap_up_triggered": self._wrap_up_triggered,
        }

    async def start(self):
        """Start the timer monitoring loop."""
        if self._running:
            logger.warning("⏱️ [TIMER] Already running")
            return

        self._start_time = time.time()
        self._running = True
        self._task = asyncio.create_task(self._monitor_loop())
        logger.info(f"⏱️ [TIMER] Started at {datetime.now().strftime('%H:%M:%S')}")

    async def stop(self):
        """Stop the timer monitoring loop."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info(f"⏱️ [TIMER] Stopped after {self.elapsed_minutes:.1f} minutes")

    async def _monitor_loop(self):
        """Background loop that checks time every 10 seconds."""
        try:
            while self._running:
                await asyncio.sleep(10)  # Check every 10 seconds

                # Check for wrap-up trigger
                if not self._wrap_up_triggered and self.elapsed_minutes >= self.wrap_up_time_minutes:
                    self._wrap_up_triggered = True
                    logger.info(f"⏱️ [TIMER] WRAP-UP triggered at {self.elapsed_minutes:.1f} min")

                    # Update session in Convex with wrap-up timestamp
                    if self._convex_client and self._session_id:
                        try:
                            await self._convex_client.mutation(
                                "sessions:updateSessionTimerConfig",
                                {
                                    "sessionId": self._session_id,
                                    "timerConfig": {
                                        "targetDurationMinutes": self._target_minutes,
                                        "wrapUpBufferMinutes": self._wrap_up_buffer,
                                        "wrapUpStartedAt": int(time.time() * 1000),
                                    }
                                }
                            )
                        except Exception as e:
                            logger.error(f"⏱️ [TIMER] Failed to update Convex: {e}")

                    # Trigger wrap-up callback
                    if self._on_wrap_up:
                        try:
                            await self._on_wrap_up()
                        except Exception as e:
                            logger.error(f"⏱️ [TIMER] Wrap-up callback error: {e}")

                # Check for expiry trigger
                if not self._expired_triggered and self.elapsed_minutes >= self._target_minutes:
                    self._expired_triggered = True
                    logger.info(f"⏱️ [TIMER] EXPIRED at {self.elapsed_minutes:.1f} min")

                    # Trigger expired callback
                    if self._on_expired:
                        try:
                            await self._on_expired()
                        except Exception as e:
                            logger.error(f"⏱️ [TIMER] Expired callback error: {e}")

                    # Stop monitoring after expiry is handled
                    break

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"⏱️ [TIMER] Monitor loop error: {e}")
        finally:
            self._running = False


# Global session timer instance (set in entrypoint)
_session_timer: Optional[SessionTimer] = None

# Global material context (slides, games) for function tools
_material_context: Optional[dict] = None


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
                # Frontend sends fields directly in payload, not nested under "game"
                self._game_info = {
                    "id": payload.get("gameId"),
                    "type": payload.get("gameType"),
                    "title": payload.get("title"),
                    "level": payload.get("level"),
                }
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

    # =========================================================================
    # FUNCTION TOOLS - TEMPORARILY DISABLED
    # =========================================================================
    # These tools allow the LLM to control slides/games via function calling.
    # Disabled to simplify agent and reduce latency. Re-enable when needed.
    #
    # Tools disabled:
    #   - load_lesson_slides: Load and display slides
    #   - get_session_timer: Check remaining lesson time
    #   - load_word_game: Start a vocabulary/grammar game
    #
    # To re-enable: Uncomment the @function_tool decorators and method bodies
    # =========================================================================

    # @function_tool()
    # async def load_lesson_slides(
    #     self,
    #     context: RunContext,
    #     knowledge_content_id: str,
    # ) -> dict:
    #     """Load and display lesson slides on the student's screen."""
    #     if not self._lesson_manager:
    #         return {"success": False, "error": "Lesson manager not available"}
    #     try:
    #         slide_data = await self._lesson_manager.get_slides_for_loading(knowledge_content_id)
    #         if not slide_data:
    #             return {"success": False, "error": "No slides found"}
    #         data = json.dumps(slide_data).encode('utf-8')
    #         await self._room.local_participant.publish_data(data, reliable=True)
    #         return {"success": True, "slideCount": slide_data.get("slideCount", 0)}
    #     except Exception as e:
    #         return {"success": False, "error": str(e)}

    # @function_tool()
    # async def get_session_timer(self, context: RunContext) -> dict:
    #     """Get the current session timer status."""
    #     global _session_timer
    #     if not _session_timer:
    #         return {"hasTimer": False}
    #     status = _session_timer.get_status()
    #     status["hasTimer"] = True
    #     return status

    # @function_tool()
    # async def load_word_game(
    #     self,
    #     context: RunContext,
    #     game_title: str,
    # ) -> dict:
    #     """Load and display a word game on the student's screen."""
    #     global _material_context
    #     if not _material_context:
    #         return {"success": False, "error": "No games available"}
    #     mat_ctx = _material_context.get("materialContext", {})
    #     game = mat_ctx.get("game")
    #     if not game:
    #         return {"success": False, "error": "No game linked"}
    #     try:
    #         game_data = {
    #             "type": "load_game",
    #             "gameId": str(game.get("_id", "")),
    #             "title": game.get("title", ""),
    #             "gameType": game.get("type", ""),
    #         }
    #         data = json.dumps(game_data).encode('utf-8')
    #         await self._room.local_participant.publish_data(data, reliable=True)
    #         self._game_info = game
    #         self._game_active = True
    #         return {"success": True, "message": f"Game loaded: {game.get('title', '')}"}
    #     except Exception as e:
    #         return {"success": False, "error": str(e)}

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
                        rag_text = f"[RELEVANT KNOWLEDGE FROM YOUR MATERIALS]\n{context}\n[END KNOWLEDGE]\n\nUse this information naturally in your response if relevant to the student's question."
                        rag_system_msg = ChatMessage(
                            role="system",
                            content=[rag_text]  # content must be a list in livekit-agents v1.3+
                        )
                        # Insert before the user message in chat context
                        # In livekit-agents v1.3+, use 'items' not 'messages'
                        turn_ctx.items.insert(-1, rag_system_msg)
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
                                lesson_text = f"[RELEVANT LESSON MATERIAL]\n{context}\n[Use this content to guide your teaching response]"
                                lesson_msg = ChatMessage(
                                    role="system",
                                    content=[lesson_text]  # content must be a list in livekit-agents v1.3+
                                )
                                # Insert before the user message
                                # In livekit-agents v1.3+, use 'items' not 'messages'
                                turn_ctx.items.insert(-1, lesson_msg)
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
                role="system",
                content=[game_context]  # content must be a list in livekit-agents v1.3+
            )
            # In livekit-agents v1.3+, use 'items' not 'messages'
            turn_ctx.items.insert(-1, game_msg)
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


def build_system_prompt(avatar_config: Dict[str, Any], memory_context: str = "") -> str:
    """
    Build a SIMPLE, focused system prompt.

    Key insight: Simpler prompts = better, more natural responses.
    Complex rule sets overwhelm the LLM and create robotic behavior.

    Args:
        avatar_config: Avatar configuration from Convex
        memory_context: Formatted memory context about the student (optional)
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

    # Add bilingual instructions if configured
    # Check both voice_config (Convex client format) and voiceProvider (room metadata format)
    voice_config = avatar_config.get("voice_config", {})
    voice_provider = avatar_config.get("voiceProvider", {})
    language_mode = voice_config.get("language_mode") or voice_provider.get("languageMode") or "english"
    bilingual_default = voice_config.get("bilingual_default") or voice_provider.get("bilingualDefault") or "en"
    bilingual_config = avatar_config.get("bilingualConfig", {})

    # LOG BILINGUAL CONFIG FOR DEBUGGING
    logger.info("=" * 60)
    logger.info(f"🌍 BILINGUAL CONFIG DEBUG:")
    logger.info(f"   voice_config keys: {list(voice_config.keys())}")
    logger.info(f"   voiceProvider keys: {list(voice_provider.keys())}")
    logger.info(f"   languageMode: {language_mode}")
    logger.info(f"   bilingualDefault: {bilingual_default}")
    logger.info(f"   bilingualConfig keys: {list(bilingual_config.keys())}")
    logger.info(f"   bilingualConfig.systemPrompt exists: {'systemPrompt' in bilingual_config}")
    if 'systemPrompt' in bilingual_config:
        logger.info(f"   Custom systemPrompt length: {len(bilingual_config.get('systemPrompt', ''))}")
    logger.info("=" * 60)

    if language_mode == "bilingual":
        # Use custom bilingual prompt if configured, otherwise use default
        custom_bilingual_prompt = bilingual_config.get("systemPrompt")
        if custom_bilingual_prompt:
            prompt_parts.append(custom_bilingual_prompt)
            logger.info(f"🌍 Added custom bilingual instructions ({len(custom_bilingual_prompt)} chars)")
        else:
            # Fallback to default bilingual instructions - different for German vs English default
            if bilingual_default == "de":
                # German-first teaching: Speak German, teach English vocabulary
                prompt_parts.append("""
# SPRACHE - ZWEISPRACHIGER MODUS (German-first)
Du bist eine deutschsprachige Englischlehrerin. Du SPRICHST DEUTSCH als Hauptsprache.

WICHTIGE REGELN:
1. ALLE Begrüßungen, Smalltalk und Erklärungen auf DEUTSCH
2. Englisch NUR für Vokabeln, Beispielsätze und Aussprache-Übungen
3. Wenn du englische Wörter oder Sätze lehrst, erkläre sie auf Deutsch
4. Beginne IMMER auf Deutsch: "Hallo! Schön dich zu sehen. Was möchtest du heute lernen?"

BEISPIEL für eine typische Interaktion:
- Du: "Hallo! Heute üben wir Begrüßungen auf Englisch."
- Du: "Auf Englisch sagt man 'Hello' oder 'Hi'. Kannst du das nachsprechen?"
- Schüler antwortet auf Englisch oder Deutsch
- Du: "Super gemacht! Das war sehr gut. Jetzt probieren wir 'How are you?'"

NIEMALS komplett auf Englisch wechseln, außer der Schüler bittet ausdrücklich darum.
Wenn der Schüler Englisch spricht, antworte trotzdem auf Deutsch mit Lob und Korrekturen.""")
                logger.info(f"🌍 Added German-first bilingual instructions (teach English, speak German)")
            else:
                # English-first teaching: Speak English, use German for support
                prompt_parts.append("""
# Language - BILINGUAL MODE (English-first)
You are an English teacher who can also speak German for support.

IMPORTANT RULES:
1. Speak primarily in ENGLISH for teaching
2. Use GERMAN only when the student struggles or asks for clarification
3. Start conversations in English: "Hello! Great to see you. What would you like to learn today?"
4. If student speaks German, respond in English but acknowledge their German

EXAMPLE interaction:
- You: "Hello! Today we'll practice greetings."
- Student responds in German
- You: "Good try! In English we say 'Hello' or 'Hi'. Can you repeat that?"

Switch to German explanations only if the student seems confused or explicitly asks.""")
                logger.info(f"🌍 Added English-first bilingual instructions (teach English, German for support)")
    elif language_mode == "german":
        prompt_parts.append("""
# Language - GERMAN MODE
Speak only in German. All your responses should be in German.
Du sprichst nur Deutsch. Alle deine Antworten sollten auf Deutsch sein.""")
        logger.info(f"🇩🇪 Added German-only instructions")

    # Add memory context if available (student-specific knowledge)
    if memory_context:
        prompt_parts.append(f"""
# What You Remember About This Student
{memory_context}

Use this knowledge naturally in conversation. Reference things you know about them when relevant, but don't be creepy about it.
If they've struggled with something before, gently revisit it. If they have personal facts, you can mention them naturally.""")
        logger.info(f"🧠 Added memory context to prompt ({len(memory_context)} chars)")

    full_prompt = "\n\n".join(prompt_parts)
    logger.info(f"📝 System prompt: {len(full_prompt)} chars (simplified)")

    # LOG FULL PROMPT FOR DEBUGGING - shows exactly what Helena receives
    logger.info("=" * 80)
    logger.info("📋 FULL SYSTEM PROMPT GIVEN TO LLM:")
    logger.info("=" * 80)
    for i, line in enumerate(full_prompt.split('\n')):
        logger.info(f"  {line}")
    logger.info("=" * 80)
    logger.info("📋 END OF SYSTEM PROMPT")
    logger.info("=" * 80)

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


async def fetch_web_search_context(
    session_data: Optional[Dict[str, Any]],
    convex_url: str
) -> str:
    """
    Fetch web search context for conversation practice sessions.

    PREFERRED: Uses pre-fetched web search results from session (fetched at join time).
    FALLBACK: If no pre-fetched results, performs live Tavily search.

    Args:
        session_data: Session data from Convex
        convex_url: Convex API URL

    Returns:
        Formatted web search context string, or empty string if not applicable
    """
    if not session_data:
        logger.info("🔍 Web search: No session data available")
        print("🔍 [DEBUG] Web search: No session data available", flush=True)
        return ""

    # Check if this is a conversation_practice session
    session_type = session_data.get("type")
    practice_id = session_data.get("conversationPracticeId")

    print(f"🔍 [DEBUG] Web search check - session_type: {session_type}, practice_id: {practice_id}", flush=True)
    logger.info(f"🔍 Web search check - session_type: {session_type}, practice_id: {practice_id}")

    if session_type != "conversation_practice" or not practice_id:
        logger.info(f"🔍 Web search skipped - not a conversation_practice session (type={session_type})")
        return ""

    try:
        convex = ConvexClient(convex_url)
        room_name = session_data.get("roomName", "")

        # Fetch conversation practice with web search config
        practice_data = await convex.query(
            "conversationPractice:getForAgent",
            {"roomName": room_name}
        )
        await convex.close()

        if not practice_data:
            logger.info("🔍 No practice data found for web search")
            return ""

        practice = practice_data.get("practice", {})
        session_info = practice_data.get("session", {})

        # ============================================================
        # Use pre-fetched web search results from session
        # Content is fetched by admin and stored in practice record
        # Avatar does NOT fetch content itself - it only uses pre-fetched
        # ============================================================
        pre_fetched = session_info.get("webSearchResults")
        if not pre_fetched:
            # No pre-fetched content - check if web search is enabled
            web_search_enabled = practice.get("webSearchEnabled", False)
            if web_search_enabled:
                logger.warning("🔍 Web search enabled but no pre-fetched content found!")
                logger.warning("🔍 Admin should click 'Fetch Now' to load content for avatar")
            return ""

        # Check content age - warn if > 3 days old
        fetched_at = pre_fetched.get("fetchedAt", 0)
        age_days = (int(time.time() * 1000) - fetched_at) / (1000 * 60 * 60 * 24)
        if age_days > 3:
            logger.warning(f"🔍 Pre-fetched content is {age_days:.1f} days old (> 3 days)")
            logger.warning("🔍 Consider refreshing content via admin 'Fetch Now' button")

        logger.info(f"🔍 Found pre-fetched web search results (age: {age_days:.1f} days)")
        query = pre_fetched.get("query", "")
        answer = pre_fetched.get("answer")
        search_depth = pre_fetched.get("searchDepth", "basic")
        llm_rewritten = pre_fetched.get("llmRewrittenContent")
        results = pre_fetched.get("results", [])

        if not results and not llm_rewritten:
            logger.info("🔍 Pre-fetched results are empty")
            return ""

        # ================================================================
        # BEST: Use LLM-rewritten content (clean journalist prose)
        # This is available in detailed mode and provides clean text
        # ================================================================
        if llm_rewritten:
            print(f"🔍 [DEBUG] Using LLM-rewritten content ({len(llm_rewritten)} chars)", flush=True)
            logger.info(f"🔍 Using LLM-rewritten content ({len(llm_rewritten)} chars)")
            web_prompt = f"""
# Current News from Today
The following current news has been professionally summarized for discussion:

{llm_rewritten}

Use this information naturally in conversation to help the student practice discussing current events in English. The content has been cleaned and formatted for easy discussion."""
            return web_prompt

        # ================================================================
        # FALLBACK: Use raw results if no LLM-rewritten content
        # ================================================================
        # Check if we have detailed (full article) content
        has_full_articles = any(r.get("rawContent") for r in results)
        is_detailed = search_depth == "detailed" or has_full_articles

        # Format the pre-fetched results into context string
        context_parts = []
        if answer:
            context_parts.append(f"Summary: {answer}")
            context_parts.append("")

        for i, result in enumerate(results[:5], 1):
            result_text = f"{i}. {result.get('title', 'Untitled')}"
            if result.get("publishedDate"):
                result_text += f" ({result.get('publishedDate')})"
            result_text += f"\n   Source: {result.get('url', 'Unknown')}"

            # Use rawContent (full article) if available, otherwise use snippet
            raw_content = result.get("rawContent")
            if raw_content and is_detailed:
                # For detailed mode, include full article content (limit to 5000 chars per article)
                article_content = raw_content[:5000]
                if len(raw_content) > 5000:
                    article_content += "... [article truncated]"
                result_text += f"\n\n   {article_content}"
            else:
                # Standard mode: just use the snippet
                content = result.get("content", "")[:300]
                result_text += f"\n   {content}..."

            context_parts.append(result_text)

        combined_context = "\n".join(context_parts)

        mode_desc = "detailed with full articles" if is_detailed else "basic snippets"
        web_prompt = f"""
# Current Information from Web Search
The following current information has been retrieved to help you discuss recent events:

[Current Information from web search: '{query}' ({mode_desc})]
{combined_context}

You can reference this information naturally in conversation when relevant to the topic. Help the student practice discussing current events in English. You have {"detailed article content" if is_detailed else "brief snippets"} to draw from."""

        logger.info(f"🔍 Using pre-fetched web search context ({len(combined_context)} chars, {len(results)} results, {mode_desc})")
        return web_prompt

        # NOTE: Live Tavily search has been removed
        # Avatar only uses pre-fetched content that admin loads via "Fetch Now"
        # This ensures consistent content across all sessions and reduces API costs

    except Exception as e:
        logger.warning(f"⚠️ Failed to fetch web search context: {e}")
        return ""


async def fetch_conversation_practice_context(session_data: Optional[Dict[str, Any]], convex_url: str) -> tuple[str, Optional[str]]:
    """
    Fetch conversation practice materials (transcript, knowledge content) for the prompt.

    Args:
        session_data: Session data from Convex
        convex_url: Convex deployment URL

    Returns:
        Tuple of (prompt_context, student_name) - context string for LLM prompt and guest name if available
    """
    if not session_data:
        return "", None

    session_type = session_data.get("type")
    practice_id = session_data.get("conversationPracticeId")

    if session_type != "conversation_practice" or not practice_id:
        return "", None

    try:
        convex = ConvexClient(convex_url)
        room_name = session_data.get("roomName", "")

        # Fetch conversation practice with all materials
        practice_data = await convex.query(
            "conversationPractice:getForAgent",
            {"roomName": room_name}
        )
        await convex.close()

        if not practice_data:
            logger.info("📝 No practice data found")
            return "", None

        practice = practice_data.get("practice", {})
        session_info = practice_data.get("session", {})
        knowledge_content = practice_data.get("knowledgeContent", [])

        # Get student/guest name
        student_name = session_info.get("guestName")
        mode = practice.get("mode", "free_conversation")
        subject = practice.get("subject", "")

        prompt_parts = []

        # Add practice mode context
        mode_description = {
            "free_conversation": "free-form English conversation practice",
            "transcript_based": "discussion of transcript content",
            "knowledge_based": "discussion using knowledge base materials",
            "topic_guided": f"guided conversation about {subject}" if subject else "topic-guided conversation",
        }.get(mode, "conversation practice")

        prompt_parts.append(f"""
# Conversation Practice Session
This is a {mode_description} session.""")

        # Add student name if available
        if student_name:
            prompt_parts.append(f"""
## Student Information
The student's name is **{student_name}**. Address them by name occasionally to create a personal connection.
Use their name naturally in conversation - for greetings, encouragement, and when asking questions.""")

        # Add subject/topic if specified
        if subject:
            prompt_parts.append(f"""
## Conversation Topic
Focus the conversation on: **{subject}**
Guide the discussion around this topic while keeping it natural and engaging.""")

        # Add transcript content if in transcript mode
        transcript = practice.get("transcript")
        if transcript and mode == "transcript_based":
            transcript_content = transcript.get("content", "")
            if transcript_content:
                # Truncate if very long (max ~3000 chars for prompt)
                if len(transcript_content) > 3000:
                    transcript_content = transcript_content[:3000] + "\n\n[Transcript truncated for brevity...]"

                prompt_parts.append(f"""
## Transcript to Discuss
The following transcript has been provided for discussion:

---
{transcript_content}
---

Use this transcript as the basis for conversation. Ask the student questions about it, discuss key points, explain difficult vocabulary, and help them express their thoughts about the content in English.""")

        # Add knowledge base content if in knowledge mode
        if knowledge_content and mode == "knowledge_based":
            kb_section = """
## Knowledge Base Materials
The following reference materials are available for this conversation:
"""
            for idx, content in enumerate(knowledge_content[:5], 1):  # Limit to 5 items
                title = content.get("title", f"Document {idx}")
                text = content.get("content", "")
                kb_name = content.get("knowledgeBaseName", "")

                # Truncate long content
                if len(text) > 1000:
                    text = text[:1000] + "..."

                kb_section += f"""
### {idx}. {title}"""
                if kb_name:
                    kb_section += f" (from: {kb_name})"
                kb_section += f"""
{text}
"""

            kb_section += """
Use these materials to guide the conversation. Help the student understand and discuss the content in English."""
            prompt_parts.append(kb_section)

        if len(prompt_parts) > 1:  # More than just the header
            combined_context = "\n".join(prompt_parts)
            logger.info(f"📝 Added conversation practice context ({len(combined_context)} chars, mode: {mode}, student: {student_name})")
            return combined_context, student_name
        else:
            return "", student_name

    except Exception as e:
        logger.warning(f"⚠️ Failed to fetch conversation practice context: {e}")
        return "", None


def get_opening_greeting(
    avatar_config: Dict[str, Any],
    student_info: Optional[Dict[str, Any]] = None,
    memory_context: Optional[Dict[str, Any]] = None
) -> tuple[Optional[str], list[str]]:
    """
    Build the avatar's opening greeting based on sessionStartConfig.

    Uses memory context to personalize greetings for returning students.
    Checks for past-due events (like completed holidays) to ask about.

    Returns:
        tuple of (greeting_text, list of memory IDs to mark as followed up)
    """
    session_config = avatar_config.get("sessionStartConfig", {})
    memory_ids_to_followup = []

    # Check if avatar should speak first
    behavior = session_config.get("behavior", "speak_first")
    if behavior != "speak_first":
        return None, []

    # Check if this is a returning student with history
    has_history = memory_context and memory_context.get("has_history", False)
    recent_sessions = memory_context.get("recent_sessions", []) if memory_context else []
    past_due_events = memory_context.get("past_due_events", []) if memory_context else []

    # Get greeting template or variation
    greeting = session_config.get("openingGreeting")

    if not greeting:
        # Try variations
        variations = session_config.get("greetingVariations", [])
        if variations:
            greeting = random.choice(variations)
        else:
            # Default greeting - personalize for returning students
            avatar_name = avatar_config.get("name", "Emma")

            # Check bilingual config - use German greetings if bilingual_default is "de"
            voice_config = avatar_config.get("voice_config", {})
            voice_provider = avatar_config.get("voiceProvider", {})
            language_mode = voice_config.get("language_mode") or voice_provider.get("languageMode") or "english"
            bilingual_default = voice_config.get("bilingual_default") or voice_provider.get("bilingualDefault") or "en"
            use_german = (language_mode == "bilingual" and bilingual_default == "de") or language_mode == "german"

            logger.info(f"🎤 Greeting language check: mode={language_mode}, default={bilingual_default}, use_german={use_german}")

            # Check for past-due events to ask about (e.g., "How was your holiday?")
            if past_due_events and len(past_due_events) > 0:
                event = past_due_events[0]
                event_content = event.get("content", "")
                memory_ids_to_followup.append(event.get("_id"))

                # Generate contextual follow-up question based on the event type
                event_lower = event_content.lower()
                if any(word in event_lower for word in ["holiday", "vacation", "trip", "travel", "urlaub", "reise"]):
                    if use_german:
                        greeting = f"Willkommen zurück! Du hattest erwähnt: {event_content}. Wie war es? Erzähl mir davon!"
                    else:
                        greeting = f"Welcome back! I remember you mentioned {event_content}. How was it? I'd love to hear about your trip!"
                elif any(word in event_lower for word in ["presentation", "meeting", "conference", "vortrag"]):
                    if use_german:
                        greeting = f"Willkommen zurück! Du hattest {event_content} erwähnt. Wie ist es gelaufen?"
                    else:
                        greeting = f"Welcome back! You mentioned {event_content} last time. How did it go?"
                elif any(word in event_lower for word in ["exam", "test", "prüfung"]):
                    if use_german:
                        greeting = f"Willkommen zurück! Wie ist deine Prüfung gelaufen? Wie war {event_content}?"
                    else:
                        greeting = f"Welcome back! I hope your exam went well. How did {event_content} go?"
                elif any(word in event_lower for word in ["birthday", "anniversary", "celebration", "geburtstag"]):
                    if use_german:
                        greeting = f"Willkommen zurück! Wie war {event_content}? Ich hoffe, du hattest eine tolle Feier!"
                    else:
                        greeting = f"Welcome back! How was {event_content}? I hope you had a wonderful celebration!"
                else:
                    # Generic follow-up
                    if use_german:
                        greeting = f"Willkommen zurück! Letztes Mal hast du {event_content} erwähnt. Wie ist es gelaufen?"
                    else:
                        greeting = f"Welcome back! Last time you mentioned {event_content}. How did that go?"
            elif has_history:
                # Personalized greeting for returning student (no specific event to ask about)
                if use_german:
                    greeting = f"Willkommen zurück! Schön dich wiederzusehen. Wie geht es dir seit unserem letzten Gespräch?"
                else:
                    greeting = f"Welcome back! Great to see you again. How have you been since our last session?"
            else:
                # First-time student greeting
                if use_german:
                    greeting = f"Hallo! Ich bin {avatar_name}. Schön dich kennenzulernen! Wie geht es dir heute?"
                else:
                    greeting = f"Hello! I'm {avatar_name}. Great to see you today. How are you doing?"

    # Replace variables
    student_name = ""
    if student_info:
        student_name = student_info.get("name", student_info.get("firstName", ""))

    time_of_day = get_time_of_day()

    # Build previous lesson summary from memory
    previous_lesson = ""
    if recent_sessions and len(recent_sessions) > 0:
        last_session = recent_sessions[0]
        previous_lesson = last_session.get("content", "")[:100]  # Truncate if too long

    # Variable substitution
    greeting = greeting.replace("{studentName}", student_name)
    greeting = greeting.replace("{timeOfDay}", time_of_day)
    greeting = greeting.replace("{lessonTopic}", "")  # Can be filled from session context
    greeting = greeting.replace("{previousLesson}", previous_lesson)

    # Clean up any empty variable remnants
    greeting = greeting.replace("  ", " ").strip()

    return greeting, memory_ids_to_followup


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

    # Pre-load Silero VAD model for faster first-response (v1.3+ with Python 3.13)
    # This is now possible with Python 3.13 and onnxruntime support
    proc.userdata["silero_vad"] = silero.VAD.load()
    logger.info("🎤 Silero VAD loaded for accurate speech detection")

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

    # NOTE: MultilingualModel turn detector is created per-session (requires job context)
    # It cannot be pre-loaded in prewarm like VAD/STT/TTS

    logger.info("✅ Prewarm complete - Silero VAD/STT/TTS ready")


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


async def run_entry_test_agent(ctx: JobContext, session_id: str, config: Config):
    """Run the entry test agent for a test session."""
    logger.info(f"📝 Starting entry test agent for session: {session_id}")

    # Initialize Convex client
    convex = ConvexClient(config.convex_url)

    # Create entry test agent
    agent = EntryTestAgent(
        session_id=session_id,
        convex_client=convex,
        config=config,
    )

    # Initialize (load data from Convex)
    if not await agent.initialize():
        logger.error("❌ Failed to initialize entry test agent")
        await convex.close()
        return

    # Set up STT
    stt = deepgram.STT(
        model="nova-2",
        language="en",
    )

    # Set up TTS - use template's avatar voice if available
    tts = cartesia.TTS(
        model="sonic-english",
        voice="a0e99841-438c-4a64-b679-ae501e7d6091",  # Professional female voice
    )

    # Wait for participant
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()
    logger.info(f"🎓 Student connected: {participant.identity}")

    # Start with intro message
    intro = await agent.generate_intro_message()

    # Create a voice agent session
    voice_session = AgentSession(
        stt=stt,
        tts=tts,
        llm=None,  # We handle responses manually
    )

    # Main loop: ask questions and process answers
    try:
        # Wait for confirmation to start
        logger.info("🎙️ Playing intro and waiting for student to be ready...")

        # Synthesize and play intro
        audio_stream = tts.synthesize(intro)
        # In practice, you'd send this to the room via LiveKit

        # Enter test loop
        while agent.state != agent.__class__.TestState.TEST_COMPLETE:
            # Generate the next prompt based on state
            if agent.state == agent.__class__.TestState.SECTION_INTRO:
                prompt = await agent.generate_section_intro()
                agent.state = agent.__class__.TestState.ASKING_QUESTION
            elif agent.state == agent.__class__.TestState.ASKING_QUESTION:
                prompt = await agent.generate_question_prompt()
                agent.question_start_time = time.time()
                agent.state = agent.__class__.TestState.WAITING_RESPONSE
            else:
                prompt = ""

            if prompt:
                logger.info(f"🎙️ Speaking: {prompt[:100]}...")
                # Synthesize and speak
                # audio = await tts.synthesize(prompt)
                # (In practice, send via LiveKit data channel)

            # Wait for student response (simplified - in practice use STT stream)
            # For now, this is a placeholder - you'd integrate with LiveKit's
            # voice agent pipeline more fully

            # Check if we need to advance
            if agent.state == agent.__class__.TestState.TEST_COMPLETE:
                break

            # Simple delay for demo purposes
            await asyncio.sleep(1)

        # Complete the test
        results = await agent.complete_test()
        results_message = await agent.generate_results_message(results)
        logger.info(f"📊 Test complete: {results_message}")

        # Synthesize results
        # audio = await tts.synthesize(results_message)

    except Exception as e:
        logger.error(f"Entry test error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await convex.close()


async def entrypoint(ctx: JobContext):
    """Main entrypoint - with dual-LLM vision support."""

    global _config
    config = _config or Config()

    room_name = ctx.room.name
    logger.info(f"🚀 Agent starting for room: {room_name}")

    # ==========================================================================
    # ENTRY TEST DETECTION - Handle entry tests with specialized agent
    # ==========================================================================
    if room_name.startswith("entry-test-"):
        logger.info("📝 Entry test session detected - using EntryTestAgent")

        # Get session ID from room metadata
        room_metadata_str = ctx.room.metadata
        entry_test_session_id = None

        if room_metadata_str:
            try:
                room_metadata = json.loads(room_metadata_str)
                entry_test_session_id = room_metadata.get("sessionId")
            except json.JSONDecodeError:
                pass

        if not entry_test_session_id:
            # Try to find session by room name in Convex
            convex = ConvexClient(config.convex_url)
            try:
                session = await convex.query(
                    "entryTestSessions:getSessionByRoom",
                    {"roomName": room_name}
                )
                if session:
                    entry_test_session_id = str(session.get("_id"))
            except Exception as e:
                logger.error(f"Failed to find entry test session: {e}")
            await convex.close()

        if entry_test_session_id:
            await run_entry_test_agent(ctx, entry_test_session_id, config)
        else:
            logger.error("❌ Entry test session ID not found!")
        return

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
            avatar_config = await convex.get_first_active_avatar()

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

    # ==========================================================================
    # MATERIAL CONTEXT - Get slides and timer config for session
    # ==========================================================================
    material_context = None
    timer_config = None
    if session_data:
        try:
            context_convex = ConvexClient(config.convex_url)
            material_context = await context_convex.query(
                "sessions:getSessionWithMaterialContext",
                {"roomName": room_name}
            )
            await context_convex.close()

            if material_context:
                global _material_context
                _material_context = material_context  # Store for function tools

                # Extract timer config and material info
                timer_config = material_context.get("timerConfig")
                mat_ctx = material_context.get("materialContext", {})
                slide_count = mat_ctx.get("slideCount", 0)
                has_game = mat_ctx.get("hasGame", False)
                game = mat_ctx.get("game")
                game_title = game.get("title", "") if game else ""
                logger.info(f"📚 Material context: {slide_count} slides, game: {game_title or 'none'}, timer: {timer_config}")
                logger.info(f"📚 Full material context: hasGame={has_game}, game={game}")
            else:
                logger.warning(f"📚 No material context returned for room: {room_name}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to fetch material context: {e}")

    if not avatar_config:
        logger.error("❌ No avatar config found!")
        return

    logger.info(f"⚙️ Loaded avatar: {avatar_config.get('name', 'Unknown')}")

    # ==========================================================================
    # MEMORY RETRIEVAL - Fetch student context for personalization
    # ==========================================================================
    student_memory_context = None
    formatted_memory = ""
    if session_data and session_data.get("studentId"):
        try:
            student_id = str(session_data["studentId"])
            # Get avatar slug for memory sync lookup
            avatar_slug = avatar_config.get("slug") or avatar_config.get("name", "").lower().replace(" ", "-")

            logger.info(f"🧠 Fetching memories for student: {student_id}, avatar: {avatar_slug}")

            memory_convex = ConvexClient(config.convex_url)
            student_memory_context = await memory_convex.get_student_context(student_id, avatar_slug)

            if student_memory_context and student_memory_context.get("has_history"):
                # Format memory for system prompt injection (do this before closing client)
                formatted_memory = memory_convex.format_memory_context(student_memory_context)
                logger.info(f"🧠 Retrieved student context: {len(student_memory_context.get('memories', []))} memories, {len(student_memory_context.get('error_patterns', []))} error patterns")
            else:
                logger.info(f"🧠 New student (no previous history)")

            await memory_convex.close()

        except Exception as e:
            logger.warning(f"⚠️ Failed to fetch student memories: {e}")
            student_memory_context = None
            formatted_memory = ""

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

    # Get LLM model and provider - handle BOTH formats:
    # 1. Room metadata: nested llmConfig object
    # 2. Convex client: flat llm_model key (after transformation)
    llm_config = avatar_config.get("llmConfig", {})
    llm_provider = "openrouter"  # Default provider
    if llm_config and llm_config.get("model"):
        # Room metadata format (nested)
        llm_model = llm_config.get("model")
        llm_provider = llm_config.get("provider", "openrouter")
        logger.info(f"🧠 LLM Config from avatar (nested): provider={llm_provider}, model={llm_model}, temp={llm_config.get('temperature')}")
    else:
        # Convex client format (flat)
        llm_model = avatar_config.get("llm_model", "anthropic/claude-3.5-sonnet")
        llm_temp = avatar_config.get("llm_temperature", 0.7)
        llm_provider = avatar_config.get("llm_provider", "openrouter")
        logger.info(f"🧠 LLM Config from avatar (flat): provider={llm_provider}, model={llm_model}, temp={llm_temp}")

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
    stt_settings = stt_config.get("settings", {})
    stt_endpointing = stt_settings.get("endpointing", 300)  # Default reduced from 600 to 300ms for faster response
    stt_smart_format = stt_settings.get("smartFormat", True)

    # Get language mode from voice_config (mapped from voiceProvider by convex_client)
    # Also check voiceProvider for room metadata format
    voice_config_for_lang = avatar_config.get("voice_config", {})
    voice_provider_for_lang = avatar_config.get("voiceProvider", {})

    # Try voice_config first (Convex client format), then voiceProvider (room metadata format)
    language_mode = voice_config_for_lang.get("language_mode") or voice_provider_for_lang.get("languageMode") or "english"
    bilingual_default = voice_config_for_lang.get("bilingual_default") or voice_provider_for_lang.get("bilingualDefault") or "en"

    # Map language mode to STT language setting
    # - "english" → "en" (English only)
    # - "german" → "de" (German only)
    # - "bilingual" → "multi" (auto-detect German + English with per-word language tags)
    stt_language_map = {
        "english": "en",
        "german": "de",
        "bilingual": "multi"
    }
    stt_language = stt_language_map.get(language_mode, "en")

    # Use lower endpointing for bilingual mode (better for code-switching)
    if language_mode == "bilingual" and stt_endpointing > 200:
        stt_endpointing = 200  # Faster turn detection for code-switching

    logger.info(f"🎤 STT Config: mode={language_mode}, language={stt_language}, model={stt_model}, endpointing={stt_endpointing}ms")

    stt = deepgram.STT(
        model=stt_model,
        language=stt_language,
        smart_format=stt_smart_format,
        interim_results=True,
        endpointing_ms=stt_endpointing,
        filler_words=language_mode == "bilingual",  # Capture "um", "ähm" for better turn detection in bilingual mode
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

    # Map language mode to TTS language setting
    # - "english" → "en"
    # - "german" → "de"
    # - "bilingual" → uses bilingual_default (en or de), can switch at runtime
    # Note: bilingual_default is already defined above in the STT section

    tts_language_map = {
        "english": "en",
        "german": "de",
        "bilingual": bilingual_default  # Use the configured default for bilingual mode
    }
    tts_language = tts_language_map.get(language_mode, "en")

    # Get per-language settings for bilingual mode (check both voice_config and voiceProvider)
    language_settings = voice_config_for_lang.get("language_settings") or voice_provider.get("languageSettings") or {}
    en_settings = language_settings.get("en", {})
    de_settings = language_settings.get("de", {})

    if voice_id.startswith("aura-"):
        logger.info(f"🔊 Using Deepgram TTS: {voice_id}")
        base_tts = deepgram.TTS(model=voice_id)
    else:
        cartesia_voice = voice_id or "1463a4e1-56a1-4b41-b257-728d56e93605"
        logger.info(f"🔊 Using Cartesia TTS: model={tts_model}, voice={cartesia_voice}, language={tts_language}, mode={language_mode}")
        base_tts = cartesia.TTS(
            model=tts_model,
            voice=cartesia_voice,
            language=tts_language,
            sample_rate=24000,
        )

    # Use base TTS directly (slide navigation handled via LLM tool calls)
    tts = base_tts

    # Store language mode and settings for runtime language switching (bilingual mode)
    ctx.proc.userdata["language_mode"] = language_mode
    ctx.proc.userdata["bilingual_default"] = bilingual_default
    ctx.proc.userdata["language_settings"] = {
        "en": {"speed": en_settings.get("speed", tts_speed), "emotion": en_settings.get("emotion", "Enthusiastic")},
        "de": {"speed": de_settings.get("speed", tts_speed * 0.95), "emotion": de_settings.get("emotion", "Calm")},
    }
    if language_mode == "bilingual":
        logger.info(f"🔊 TTS initialized: mode={language_mode}, default={bilingual_default}, can switch at runtime")
    else:
        logger.info(f"🔊 TTS initialized: language={tts_language}, mode={language_mode}")
    
    # Initialize LLM (for conversation) - support multiple providers
    # Latency comparison: Groq ~40ms, Cerebras ~35ms, OpenRouter ~200-400ms
    logger.info(f"🧠 Using LLM: provider={llm_provider}, model={llm_model}")
    if llm_provider == "groq":
        logger.info(f"⚡ Using Groq for ultra-fast inference (~40ms TTFT)")
        llm_instance = GroqLLM(
            model=llm_model,
            temperature=0.7,
        )
    elif llm_provider == "cerebras":
        logger.info(f"⚡ Using Cerebras for ultra-fast inference (2,314 tok/s)")
        llm_instance = CerebrasLLM(
            model=llm_model,
            temperature=0.7,
        )
    else:
        # Default to OpenRouter for all other providers (Claude, GPT, etc.)
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
    
    # Create agent session - OPTIMIZED for low latency with v1.3+ features
    # Using prewarmed Silero VAD + MultilingualModel turn detector for best-in-class performance
    vad = ctx.proc.userdata.get("silero_vad") or silero.VAD.load()
    # MultilingualModel created per-session (supports German + English turn detection)
    turn_detector = MultilingualModel()

    session = AgentSession(
        stt=stt,
        tts=tts,
        llm=llm_instance,
        vad=vad,                         # Silero VAD for accurate speech detection
        turn_detection=turn_detector,    # MultilingualModel for intelligent turn detection
        min_endpointing_delay=0.15,      # FASTER - reduced from 0.2 for quicker response
        max_endpointing_delay=0.6,       # FASTER - reduced from 0.8 for snappier turns
        allow_interruptions=True,        # Let user interrupt if needed
        preemptive_generation=True,      # Start TTS/LLM before turn ends (saves 150-300ms)
    )
    
    # Track current TTS language for bilingual mode
    current_tts_language = {"lang": tts_language}  # Use dict for mutability in closure

    # Event logging with latency tracking + BILINGUAL LANGUAGE SWITCHING
    @session.on("user_input_transcribed")
    def on_speech(event):
        if event.is_final and event.transcript:
            _latency_tracker.mark("stt_transcript_final")
            logger.info(f"🎯 HEARD: '{event.transcript}'")

            # BILINGUAL MODE: Detect language and switch TTS if needed
            if language_mode == "bilingual":
                detected_lang = detect_language(event.transcript)
                if detected_lang != current_tts_language["lang"]:
                    logger.info(f"🌍 Language detected: {detected_lang} (was: {current_tts_language['lang']})")
                    language_settings = ctx.proc.userdata.get("language_settings", {})
                    if switch_tts_language(tts, detected_lang, language_settings):
                        current_tts_language["lang"] = detected_lang
                else:
                    logger.debug(f"🌍 Language unchanged: {detected_lang}")

        elif not event.is_final:
            # First interim result marks when user started speaking
            if "user_speech_start" not in _latency_tracker._timings:
                _latency_tracker.reset()
                _latency_tracker.mark("user_speech_start")

    # ==========================================================================
    # SPEAKING STATE WATCHDOG - Recovery for stuck avatar/missing playback_finished
    # ==========================================================================
    speaking_state_start = {"time": None, "watchdog_task": None}
    SPEAKING_TIMEOUT_SECONDS = 30  # Max time to wait for playback_finished

    async def _speaking_watchdog():
        """Monitor speaking state and recover if stuck too long (no playback_finished)."""
        await asyncio.sleep(SPEAKING_TIMEOUT_SECONDS)
        if speaking_state_start["time"] is not None:
            elapsed = time.time() - speaking_state_start["time"]
            logger.warning(f"⚠️ SPEAKING WATCHDOG: Agent stuck in speaking state for {elapsed:.1f}s - avatar may have disconnected")
            logger.warning(f"⚠️ This usually means Beyond Presence didn't send playback_finished event")
            # The watchdog doesn't forcibly transition state (which could cause issues),
            # but logs warnings to help diagnose. The user can restart the session.

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
            # Start speaking watchdog timer
            speaking_state_start["time"] = time.time()
            if speaking_state_start["watchdog_task"]:
                speaking_state_start["watchdog_task"].cancel()
            speaking_state_start["watchdog_task"] = asyncio.create_task(_speaking_watchdog())
        elif event.old_state == "speaking" and event.new_state == "listening":
            _latency_tracker.mark("tts_end")
            # Clear watchdog - successful transition
            speaking_state_start["time"] = None
            if speaking_state_start["watchdog_task"]:
                speaking_state_start["watchdog_task"].cancel()
                speaking_state_start["watchdog_task"] = None

    @session.on("agent_started_speaking")
    def on_agent_speaking(event):
        _latency_tracker.mark("agent_speaking_start")
        logger.info(f"🗣️ Agent started speaking")

    @session.on("agent_stopped_speaking")
    def on_agent_stopped(event):
        _latency_tracker.mark("agent_speaking_end")
        logger.info(f"🤫 Agent stopped speaking")

    # ==========================================================================
    # TRANSCRIPT COLLECTION - For memory extraction at session end
    # ==========================================================================
    session_transcript = []  # Collect messages for memory extraction

    @session.on("user_input_transcribed")
    def collect_user_message(event):
        if event.is_final and event.transcript:
            session_transcript.append({
                "role": "user",
                "content": event.transcript
            })

    @session.on("agent_speech_committed")
    def collect_agent_message(event):
        if hasattr(event, 'content') and event.content:
            session_transcript.append({
                "role": "assistant",
                "content": event.content
            })

    # ==========================================================================
    # SESSION CLOSE HANDLER - Memory extraction when session ends
    # ==========================================================================
    async def _handle_session_close_async(event):
        """Async handler for session close - extract memories and generate summary."""
        logger.info(f"🔚 Session closing (transcript: {len(session_transcript)} messages)")

        # CRITICAL: End the session in Convex to prevent orphaned "active" sessions
        try:
            end_convex = ConvexClient(config.convex_url)
            room_name = ctx.room.name
            await end_convex.end_session(room_name, reason="session_closed")
            await end_convex.close()
            logger.info(f"✅ Session ended in Convex for room: {room_name}")
        except Exception as e:
            logger.error(f"❌ Failed to end session in Convex: {e}")

        # Only process if we have enough conversation
        if len(session_transcript) < 4:
            logger.info("Session too short for memory extraction")
            return

        # Need student_id and config for memory storage
        if not session_data or not session_data.get("studentId"):
            logger.warning("No student ID - skipping memory extraction")
            return

        try:
            student_id = str(session_data["studentId"])
            session_id = str(session_data.get("_id", ""))
            avatar_slug = avatar_config.get("slug") or avatar_config.get("name", "").lower().replace(" ", "-")

            # Get API key for LLM calls
            openrouter_key = os.environ.get("OPENROUTER_API_KEY")
            if not openrouter_key:
                logger.warning("No OPENROUTER_API_KEY - skipping memory extraction")
                return

            # Create Convex client for storing memories
            memory_convex = ConvexClient(config.convex_url)

            # Process session end (extract facts + generate summary)
            results = await process_session_end(
                transcript=session_transcript,
                student_id=student_id,
                session_id=session_id,
                avatar_slug=avatar_slug,
                convex_client=memory_convex,
                api_key=openrouter_key,
            )

            await memory_convex.close()

            logger.info(f"🧠 Memory extraction complete: {results['extracted_facts']} facts, summary: {bool(results['summary'])}")

            if results.get("errors"):
                logger.warning(f"Memory extraction errors: {results['errors']}")

        except Exception as e:
            logger.error(f"❌ Memory extraction failed: {e}")
            import traceback
            traceback.print_exc()

    @session.on("close")
    def on_session_close(event):
        """Sync callback that dispatches to async handler."""
        asyncio.create_task(_handle_session_close_async(event))

    # Get Beyond Presence avatar settings
    avatar_provider = avatar_config.get("avatar_provider", {})
    avatar_id = avatar_provider.get("avatar_id")
    avatar_name = avatar_config.get("name", "Ludwig")

    logger.info(f"📺 Avatar configured: {avatar_name} (will start after session)")

    # Track avatar mode for session (will be set after avatar start attempt)
    audio_only_mode = False
    avatar_error_reason = None

    # Create agent with instructions - build rich prompt from personality/identity
    # Include memory context for returning students
    system_prompt = build_system_prompt(avatar_config, memory_context=formatted_memory)
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

    # Add material context (predefined slides and games) if available
    if material_context and material_context.get("materialContext"):
        mat_ctx = material_context["materialContext"]
        slides = mat_ctx.get("slides", [])
        slide_count = len(slides)
        game = mat_ctx.get("game")

        material_parts = []

        # Add slides info
        if slide_count > 0:
            slides_section = f"""
## Lesson Slides ({slide_count} slides available)
You can display these slides to the student using the load_lesson_slides tool.
Just say the slide topic name naturally - for example: load_lesson_slides(knowledge_content_id="modal_verbs").

Slides overview:"""
            for slide in slides:
                title = slide.get("title", f"Slide {slide.get('index', 0) + 1}")
                slide_type = slide.get("type", "content")
                teaching_prompt = slide.get("teachingPrompt", "")
                slides_section += f"\n- Slide {slide.get('index', 0) + 1}: {title}"
                if teaching_prompt:
                    slides_section += f" - {teaching_prompt}"
            material_parts.append(slides_section)

        # Add game info
        if game:
            game_type_friendly = {
                "sentence_builder": "Sentence Builder - drag and drop words to build sentences",
                "fill_in_blank": "Fill in the Blank - complete sentences with missing words",
                "word_ordering": "Word Ordering - arrange words in correct order",
                "matching_pairs": "Matching Pairs - match related items together",
                "word_scramble": "Word Scramble - unscramble letters to form words",
                "multiple_choice": "Multiple Choice - select the correct answer",
                "flashcards": "Flashcards - review vocabulary with flip cards",
                "hangman": "Hangman - guess letters to reveal the word",
                "crossword": "Crossword - fill in the puzzle with correct words",
            }.get(game.get("type", ""), game.get("type", ""))

            game_section = f"""
## Interactive Game Available
You have an interactive game to use with this lesson:

- **"{game.get('title', 'Practice Game')}"** ({game_type_friendly})
  Level: {game.get('level', 'Mixed')} | Category: {game.get('category', 'mixed').title()}

To start the game, use: load_word_game(game_title="{game.get('title', '')}")
The game will appear on the student's screen. Encourage them to try it and offer help as needed."""
            material_parts.append(game_section)

        if material_parts:
            material_prompt = "\n\n# Pre-Loaded Lesson Materials\nThis lesson includes the following materials:\n" + "\n".join(material_parts)
            material_prompt += "\n\nUse these materials naturally during your lesson. Don't read technical IDs aloud - refer to materials by their names."
            final_prompt = final_prompt + material_prompt
            logger.info(f"📚 Added material context to prompt ({slide_count} slides, game: {'yes' if game else 'no'})")

    # ==========================================================================
    # CONVERSATION PRACTICE CONTEXT - Transcript, KB content, student name
    # ==========================================================================
    practice_context, practice_student_name = await fetch_conversation_practice_context(session_data, config.convex_url)
    if practice_context:
        final_prompt = final_prompt + practice_context
        logger.info(f"📝 Added conversation practice context to prompt")

    # ==========================================================================
    # WEB SEARCH CONTEXT - For conversation practice with Tavily
    # ==========================================================================
    print(f"🔍 [DEBUG] About to fetch web search context. Session data type: {session_data.get('type') if session_data else 'None'}", flush=True)
    web_search_context = await fetch_web_search_context(session_data, config.convex_url)
    if web_search_context:
        final_prompt = final_prompt + web_search_context
        print(f"🔍 [DEBUG] ✅ Added {len(web_search_context)} chars of web search context to prompt", flush=True)
        logger.info(f"🔍 Added web search context to prompt")
    else:
        print(f"🔍 [DEBUG] ❌ No web search context returned", flush=True)

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
    # With noise cancellation and optimized room options
    await session.start(
        room=ctx.room,
        agent=agent,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=noise_cancellation.BVC(),  # Background Voice Cancellation
            ),
        ),
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

    # ==========================================================================
    # SESSION TIMER - Start timer if configured
    # ==========================================================================
    global _session_timer
    if timer_config and timer_config.get("targetDurationMinutes"):
        target_minutes = timer_config["targetDurationMinutes"]
        wrap_up_buffer = timer_config.get("wrapUpBufferMinutes", 2)
        auto_end = timer_config.get("autoEnd", True)
        session_id_str = str(session_data.get("_id", "")) if session_data else None

        # Create wrap-up callback - avatar speaks summary
        async def on_wrap_up():
            """Called when wrap-up period starts."""
            remaining = _session_timer.remaining_minutes if _session_timer else 0
            wrap_up_message = f"We're approaching the end of our lesson - we have about {int(remaining)} minutes left. Let me quickly summarize what we've covered today and see if you have any final questions."
            logger.info(f"⏱️ [TIMER] Speaking wrap-up message")
            try:
                await session.say(wrap_up_message, allow_interruptions=True)
            except Exception as e:
                logger.error(f"⏱️ [TIMER] Failed to speak wrap-up: {e}")

        # Create expiry callback - avatar closes session
        async def on_expired():
            """Called when session time expires."""
            closing_message = "That's our time for today! You did great work. Keep practicing and I'll see you next time. Goodbye!"
            logger.info(f"⏱️ [TIMER] Speaking closing message")
            try:
                await session.say(closing_message, allow_interruptions=False)
                # Give time for the closing message to be spoken
                await asyncio.sleep(5)
                # End the session
                if auto_end:
                    logger.info(f"⏱️ [TIMER] Auto-ending session")
                    end_convex = ConvexClient(config.convex_url)
                    await end_convex.end_session(room_name, reason="timer_expired")
                    await end_convex.close()
            except Exception as e:
                logger.error(f"⏱️ [TIMER] Failed to close session: {e}")

        # Create timer with Convex client for status updates
        timer_convex = ConvexClient(config.convex_url)
        _session_timer = SessionTimer(
            target_duration_minutes=target_minutes,
            wrap_up_buffer_minutes=wrap_up_buffer,
            on_wrap_up=on_wrap_up,
            on_expired=on_expired,
            convex_client=timer_convex,
            session_id=session_id_str,
        )
        await _session_timer.start()
        logger.info(f"⏱️ [TIMER] Session timer active: {target_minutes}min (wrap-up at {target_minutes - wrap_up_buffer}min)")
    else:
        logger.info(f"⏱️ [TIMER] No session timer configured (unlimited duration)")

    # Deliver opening greeting immediately (if speak_first behavior)
    # Pass memory context for personalized greetings to returning students
    # Pass student info for conversation practice sessions (guest name)
    # Returns tuple of (greeting, memory_ids_to_mark_as_followed_up)
    student_info_for_greeting = {"name": practice_student_name} if practice_student_name else None
    opening_greeting, memory_ids_to_followup = get_opening_greeting(
        avatar_config,
        student_info=student_info_for_greeting,
        memory_context=student_memory_context
    )
    logger.info(f"🎤 Opening greeting: {opening_greeting[:80] if opening_greeting else 'None'}...")
    if memory_ids_to_followup:
        logger.info(f"📅 Following up on {len(memory_ids_to_followup)} past-due events")

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

                # Mark events as followed up after successfully delivering the greeting
                if memory_ids_to_followup:
                    try:
                        followup_convex = ConvexClient(config.convex_url)
                        for memory_id in memory_ids_to_followup:
                            if memory_id:
                                await followup_convex.mark_event_followed_up(memory_id)
                                logger.info(f"✅ Marked event {memory_id} as followed up")
                        await followup_convex.close()
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to mark events as followed up: {e}")

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
            num_idle_processes=1,  # CRITICAL: Only 1 to prevent duplicate job handling
        )
    )
