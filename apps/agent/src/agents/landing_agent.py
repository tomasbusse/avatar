"""
Landing Page Avatar Agent

Simple anonymous-user avatar for the simmonds.online landing page.

Stack:
- Bithuman — CPU-based local avatar render (.imx model, sub-100ms)
- Deepgram STT + OpenRouter LLM + Cartesia TTS — same pipeline as the real
  lesson agent (main.py), so the landing demo uses the avatar's actual
  configured voice (e.g. George Patterson's "Classy British Man" Cartesia
  voice) instead of a generic fallback.
- Falls back to Gemini Live (speech-to-speech) only when the dispatched
  room metadata carries no `voiceProvider.voiceId` — Cartesia voices are
  unreachable on that path, so it's a degraded fallback, not the default.
- No memory, no lessons, no vision — just conversational chat

Dispatched by the Next.js /api/livekit/landing-token route with room names
prefixed `landing-`. main.py routes those rooms to run_landing_agent.

Required env:
  BITHUMAN_API_SECRET    — plugin reads this automatically
  DEEPGRAM_API_KEY       — STT
  OPENROUTER_API_KEY     — LLM
  CARTESIA_API_KEY       — TTS
  GOOGLE_API_KEY         — Gemini Live auth (fallback path only)
Optional env:
  BITHUMAN_MODEL_PATH    — path to .imx file (takes precedence over figure id)
  BITHUMAN_FIGURE_ID     — bitHuman console figure id (e.g. A29JHY3755)
  BITHUMAN_MODEL         — 'essence' | 'expression'
  GEMINI_MODEL           — defaults to gemini-2.5-flash-native-audio-preview-12-2025
  GEMINI_VOICE_FEMALE    — fallback-path voice name (e.g. Aoede)
"""

from __future__ import annotations

import json
import logging
import os

from livekit.agents import JobContext
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import bithuman, cartesia, deepgram, google, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from ..providers.llm.openrouter import OpenRouterLLM

logger = logging.getLogger("landing-agent")

DEFAULT_SYSTEM_PROMPT_TEMPLATE = (
    "You are {name}, a friendly AI English language coach for Simmonds "
    "Language Services. You help website visitors with quick English questions "
    "and give them a taste of what a real lesson feels like. Keep replies "
    "conversational and short — 1–3 sentences. If they ask about pricing, courses, "
    "or booking, invite them to contact james@englisch-lehrer.com or call "
    "+49 511 47 39 339. Match the language the visitor uses (English or German)."
)

DEFAULT_AVATAR_NAME = "your AI coach"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
DEFAULT_LLM_MODEL = "anthropic/claude-3.5-sonnet"
DEFAULT_CARTESIA_VOICE = "95856005-0332-41b0-935f-352e296aa0df"


def _parse_metadata(ctx: JobContext) -> dict:
    raw = None
    if ctx.job and getattr(ctx.job, "metadata", None):
        raw = ctx.job.metadata
    elif ctx.room and getattr(ctx.room, "metadata", None):
        raw = ctx.room.metadata
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        logger.warning("Invalid landing metadata: %s", raw)
        return {}


def _build_cartesia_session(voice_provider: dict, llm_config: dict) -> AgentSession:
    """STT + LLM + TTS pipeline using the avatar's real configured voice."""
    voice_id = voice_provider.get("voiceId") or DEFAULT_CARTESIA_VOICE
    tts_model = voice_provider.get("model", "sonic-3")
    language = voice_provider.get("language", "en")
    settings = voice_provider.get("settings") or {}

    stt = deepgram.STT(model="nova-3", language=language, smart_format=True)
    tts = cartesia.TTS(
        model=tts_model,
        voice=voice_id,
        language=language,
        sample_rate=24000,
    )
    llm_instance = OpenRouterLLM(
        model=llm_config.get("model") or DEFAULT_LLM_MODEL,
        temperature=settings.get("temperature", 0.7),
    )

    logger.info("🔊 Landing voice: cartesia model=%s voice=%s", tts_model, voice_id)

    return AgentSession(
        stt=stt,
        tts=tts,
        llm=llm_instance,
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )


def _build_gemini_fallback_session(meta: dict) -> AgentSession:
    """Gemini Live speech-to-speech fallback — used only when the avatar has
    no configured Cartesia voice. Cartesia voices can't be plugged into this
    path, so this is a degraded experience, not a default."""
    voice = (
        meta.get("voice")
        or os.environ.get("GEMINI_VOICE_FEMALE")
        or "Aoede"
    )
    gemini_model = os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
    logger.warning(
        "🔊 Landing voice: no voiceProvider in metadata — falling back to "
        "Gemini Live voice=%s model=%s", voice, gemini_model,
    )
    return AgentSession(
        llm=google.beta.realtime.RealtimeModel(model=gemini_model, voice=voice),
    )


async def run_landing_agent(ctx: JobContext) -> None:
    """Entry point for landing-page avatar sessions (room name `landing-*`)."""
    await ctx.connect()

    meta = _parse_metadata(ctx)
    avatar_name = meta.get("avatarName") or DEFAULT_AVATAR_NAME
    system_prompt = meta.get("systemPrompt") or DEFAULT_SYSTEM_PROMPT_TEMPLATE.format(name=avatar_name)
    voice_provider = meta.get("voiceProvider") or {}
    llm_config = meta.get("llmConfig") or {}

    logger.info("🎭 Landing session start | room=%s avatar=%s", ctx.room.name, avatar_name)

    if voice_provider.get("voiceId"):
        session = _build_cartesia_session(voice_provider, llm_config)
    else:
        session = _build_gemini_fallback_session(meta)

    # ------------------------------------------------------------------
    # Bithuman avatar — auth via BITHUMAN_API_SECRET env
    # Model source priority: explicit .imx path → figure id → plugin default
    # ------------------------------------------------------------------
    avatar_kwargs: dict = {
        # bitHuman rotated its runtime-token signer (2026-07); the livekit
        # plugin still defaults to the retired auth.api.bithuman.ai host, so
        # pin the current endpoint explicitly (env-overridable, empty-safe).
        "api_url": os.environ.get("BITHUMAN_API_URL")
        or "https://api.bithuman.ai/v1/runtime-tokens/request",
    }
    if model_path := os.environ.get("BITHUMAN_MODEL_PATH"):
        avatar_kwargs["model_path"] = model_path
    elif figure_id := os.environ.get("BITHUMAN_FIGURE_ID"):
        # Prefer a local .imx for the figure (proven CPU essence path) over the
        # bitHuman CLOUD avatar_id spawn, which is currently unreliable. Reads
        # FIGURE_ID (which the job subprocess sees) rather than a MODEL_PATH env
        # that may not propagate. Mirrors the intenga agent's auto-resolve.
        _model_dir = os.environ.get(
            "BITHUMAN_MODEL_DIR", "/opt/livebroadcast/app/agents/bithuman_models"
        )
        _local_imx = os.path.join(_model_dir, f"{figure_id}.imx")
        if os.path.exists(_local_imx):
            avatar_kwargs["model_path"] = _local_imx
        else:
            avatar_kwargs["avatar_id"] = figure_id
    if runtime := os.environ.get("BITHUMAN_MODEL"):
        avatar_kwargs["model"] = runtime

    avatar = bithuman.AvatarSession(**avatar_kwargs)
    await avatar.start(session, room=ctx.room)

    await session.start(
        room=ctx.room,
        agent=Agent(instructions=system_prompt),
    )

    logger.info("✅ Landing session ready | room=%s", ctx.room.name)
