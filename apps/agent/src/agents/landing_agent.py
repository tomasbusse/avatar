"""
Landing Page Avatar Agent

Simple anonymous-user avatar for the simmonds.online landing page.

Stack:
- Bithuman — CPU-based local avatar render (.imx model, sub-100ms)
- Gemini Live — realtime voice + LLM in one stream (STT, thinking, TTS)
- No memory, no lessons, no vision — just conversational chat

Dispatched by the Next.js /api/livekit/landing-token route with room names
prefixed `landing-`. main.py routes those rooms to run_landing_agent.

Required env:
  BITHUMAN_API_SECRET    — plugin reads this automatically
  GOOGLE_API_KEY         — Gemini Live auth
Optional env:
  BITHUMAN_MODEL_PATH    — path to .imx file (takes precedence over figure id)
  BITHUMAN_FIGURE_ID     — bitHuman console figure id (e.g. A29JHY3755)
  BITHUMAN_MODEL         — 'essence' | 'expression'
  GEMINI_MODEL           — defaults to gemini-2.5-flash-native-audio-preview-12-2025
  GEMINI_VOICE_FEMALE    — default voice name (e.g. Aoede)
"""

from __future__ import annotations

import json
import logging
import os

from livekit.agents import JobContext
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import bithuman, google

logger = logging.getLogger("landing-agent")

DEFAULT_SYSTEM_PROMPT = (
    "You are Helena Clarke, a friendly AI English language coach for Simmonds "
    "Language Services. You help website visitors with quick English questions "
    "and give them a taste of what a real lesson feels like. Keep replies "
    "conversational and short — 1–3 sentences. If they ask about pricing, courses, "
    "or booking, invite them to contact james@englisch-lehrer.com or call "
    "+49 511 47 39 339. Match the language the visitor uses (English or German)."
)

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"


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


async def run_landing_agent(ctx: JobContext) -> None:
    """Entry point for landing-page avatar sessions (room name `landing-*`)."""
    await ctx.connect()

    meta = _parse_metadata(ctx)
    system_prompt = meta.get("systemPrompt") or DEFAULT_SYSTEM_PROMPT
    voice = (
        meta.get("voice")
        or os.environ.get("GEMINI_VOICE_FEMALE")
        or "Aoede"
    )
    gemini_model = os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

    logger.info(
        "🎭 Landing session start | room=%s voice=%s model=%s",
        ctx.room.name, voice, gemini_model,
    )

    # ------------------------------------------------------------------
    # Gemini Live realtime model — handles STT, reasoning, and TTS in one
    # ------------------------------------------------------------------
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model=gemini_model,
            voice=voice,
            instructions=system_prompt,
        ),
    )

    # ------------------------------------------------------------------
    # Bithuman avatar — auth via BITHUMAN_API_SECRET env
    # Model source priority: explicit .imx path → figure id → plugin default
    # ------------------------------------------------------------------
    avatar_kwargs: dict = {}
    if model_path := os.environ.get("BITHUMAN_MODEL_PATH"):
        avatar_kwargs["model_path"] = model_path
    elif figure_id := os.environ.get("BITHUMAN_FIGURE_ID"):
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
