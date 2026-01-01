"""
Beethoven AI Avatar Agent
LiveKit voice agent with Beyond Presence avatar integration
Updated for LiveKit Agents SDK v1.2+ with vision support
"""

import asyncio
import logging
import os
from typing import Optional

from dotenv import load_dotenv
from livekit import rtc

load_dotenv()
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    get_job_context,
)
from livekit.agents import ChatContext, ChatMessage
from livekit.agents.voice import Agent, AgentSession
from livekit.agents.llm import ImageContent
from livekit.plugins import deepgram, cartesia, bey

from src.providers.llm.openrouter import OpenRouterLLM
from src.utils.config import Config
from src.utils.convex_client import ConvexClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("beethoven-agent")


class BeethovenTeacher(Agent):
    """Custom agent for English teaching with bilingual support and vision."""

    def __init__(self, instructions: str, convex: ConvexClient, room_name: str):
        super().__init__(instructions=instructions)
        self._convex = convex
        self._room_name = room_name
        self._latest_frame: Optional[rtc.VideoFrame] = None
        self._video_stream: Optional[rtc.VideoStream] = None
        self._tasks: list = []

    async def on_enter(self) -> None:
        """Called when the agent starts - set up video capture and greeting."""
        logger.info("Agent entered, setting up video capture and generating greeting")

        # Set up video capture for presentation slides
        await self._setup_video_capture()

        # Send initial greeting
        self.session.generate_reply(
            instructions="Greet the user warmly and introduce yourself as their English teacher. If you can see a presentation slide, briefly acknowledge it."
        )

    async def _setup_video_capture(self) -> None:
        """Set up video stream to capture presentation slides."""
        room = get_job_context().room

        # Look for existing video tracks (screen share preferred, then camera)
        for participant in room.remote_participants.values():
            screen_share = None
            camera = None

            for pub in participant.track_publications.values():
                if pub.track and pub.track.kind == rtc.TrackKind.KIND_VIDEO:
                    if pub.source == rtc.TrackSource.SOURCE_SCREENSHARE:
                        screen_share = pub.track
                    elif pub.source == rtc.TrackSource.SOURCE_CAMERA:
                        camera = pub.track

            # Prefer screen share (presentation) over camera
            if screen_share:
                self._create_video_stream(screen_share)
                logger.info("Subscribed to screen share track")
                break
            elif camera:
                self._create_video_stream(camera)
                logger.info("Subscribed to camera track")
                break

        # Watch for new video tracks (especially screen share for presentations)
        @room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.RemoteTrackPublication,
            participant: rtc.RemoteParticipant,
        ):
            if track.kind == rtc.TrackKind.KIND_VIDEO:
                # Prefer screen share over camera
                if publication.source == rtc.TrackSource.SOURCE_SCREENSHARE:
                    logger.info("New screen share track detected - switching to it")
                    self._create_video_stream(track)
                elif self._video_stream is None and publication.source == rtc.TrackSource.SOURCE_CAMERA:
                    # Only use camera if we don't have a video stream yet
                    logger.info("New camera track detected")
                    self._create_video_stream(track)

    def _create_video_stream(self, track: rtc.Track) -> None:
        """Create a video stream to continuously capture the latest frame."""
        # Close any existing stream
        if self._video_stream is not None:
            self._video_stream.close()

        # Create new stream
        self._video_stream = rtc.VideoStream(track)

        async def read_stream():
            try:
                async for event in self._video_stream:
                    # Store the latest frame (for use when LLM needs it)
                    self._latest_frame = event.frame
            except Exception as e:
                logger.error(f"Video stream error: {e}")

        # Start reading in background
        task = asyncio.create_task(read_stream())
        task.add_done_callback(
            lambda t: self._tasks.remove(t) if t in self._tasks else None
        )
        self._tasks.append(task)

    async def on_user_turn_completed(
        self, turn_ctx: ChatContext, new_message: ChatMessage
    ) -> None:
        """
        Called when user finishes speaking.
        Append the latest video frame to provide visual context to the LLM.
        """
        if self._latest_frame:
            logger.info("Appending video frame to message for visual context")
            new_message.content.append(ImageContent(image=self._latest_frame))
            # Don't clear the frame - keep it for subsequent turns
            # self._latest_frame = None


async def entrypoint(ctx: JobContext):
    """Main entrypoint for the avatar agent."""

    config = Config()
    convex = ConvexClient(config.convex_url)

    logger.info(f"Agent starting for room: {ctx.room.name}")

    # Subscribe to both audio AND video (for presentation slides)
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)

    # === DEBUGGING: Track subscription logging ===
    @ctx.room.on("participant_connected")
    def on_participant_connected(participant: rtc.RemoteParticipant):
        print(f"DEBUG: 🟢 Participant connected: {participant.identity}")
        logger.info(f"🟢 [ROOM] participant_connected: {participant.identity} (SID: {participant.sid})")

    @ctx.room.on("track_published")
    def on_track_published(publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        print(f"DEBUG: 📢 Track published by {participant.identity}: {publication.kind}")
        logger.info(f"📢 [ROOM] track_published by {participant.identity}: {publication.kind} ({publication.source})")

    @ctx.room.on("track_subscribed")
    def on_track_subscribed_debug(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        print(f"DEBUG: ✅ Track subscribed from {participant.identity}: {track.kind}")
        logger.info(f"✅ [ROOM] track_subscribed from {participant.identity}: {track.kind} (Source: {publication.source})")
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            print(f"DEBUG: 🎤 AUDIO confirmed - Agent is now LISTENING to {participant.identity}")
            logger.info(f"   🎤 AUDIO confirmed - Agent is now LISTENING to {participant.identity}")

    @ctx.room.on("track_unsubscribed")
    def on_track_unsubscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        print(f"DEBUG: ❌ Track unsubscribed: {participant.identity}")
        logger.info(f"❌ [ROOM] track_unsubscribed: {participant.identity}")

    # Log existing participants (in case they joined before agent)
    logger.info(f"📊 [ROOM] Current participants: {len(ctx.room.remote_participants)}")
    for pid, participant in ctx.room.remote_participants.items():
        logger.info(f"   - {participant.identity} is present")
    # === END DEBUGGING ===

    # Get avatar configuration from Convex
    try:
        avatar_config = await convex.get_default_avatar()
        logger.info(f"Successfully fetched avatar config from Convex")
    except Exception as e:
        logger.error(f"Failed to fetch avatar config from Convex: {e}")
        avatar_config = {}

    system_prompt = build_system_prompt(avatar_config)

    # Initialize STT (Deepgram Nova-2)
    logger.info(f"Initializing STT (Deepgram Nova-2)")
    print(f"DEBUG: Initializing STT (Deepgram Nova-2)")
    stt = deepgram.STT(
        model="nova-2",
        language="en",
    )

    # Initialize LLM (OpenRouter with Claude - vision capable)
    llm_instance = OpenRouterLLM(
        model=avatar_config.get("llm_model", "anthropic/claude-3.5-sonnet"),
        temperature=avatar_config.get("llm_temperature", 0.7),
    )

    # Initialize TTS (Cartesia Sonic-3)
    voice_config = avatar_config.get("voice_config", {})
    logger.info(f"Initializing TTS (model=sonic-3, voice={voice_config.get('voice_id', 'default')})")
    tts = cartesia.TTS(
        model="sonic-3",
        voice=voice_config.get("voice_id", "1463a4e1-56a1-4b41-b257-728d56e93605"),
        language=voice_config.get("language", "en"),
        speed=voice_config.get("speed", 1.0),
    )

    # Create the agent session with STT-based turn detection
    session = AgentSession(
        stt=stt,
        llm=llm_instance,
        tts=tts,
        turn_detection="stt",
        allow_interruptions=True,
        min_endpointing_delay=0.8, # Slightly increased for stability
        max_endpointing_delay=3.0,
    )

    async def add_transcript(role: str, content: str):
        # Find session ID if not already cached
        session = await convex.get_session_by_room(ctx.room.name)
        if session:
            await convex.add_transcript_entry(
                session_id=session["_id"],
                role=role,
                content=content,
            )

    @session.on("user_started_speaking")
    def on_user_started_speaking():
        print(f"DEBUG: 🗣️ VAD triggered - User started speaking")
        logger.info(f"🗣️ [VAD] User started speaking")

    @session.on("user_stopped_speaking")
    def on_user_stopped_speaking():
        print(f"DEBUG: 🤫 VAD triggered - User stopped speaking")
        logger.info(f"🤫 [VAD] User stopped speaking")

    @session.on("user_input_transcribed")
    def on_user_speech(event):
        if event.transcript:
            logger.info(f"🎯 [STT] '{event.transcript}' (final={event.is_final}, lang={event.language})")
            if event.is_final:
                asyncio.create_task(add_transcript("student", event.transcript))

    @session.on("conversation_item_added")
    def on_conversation_item(event):
        item = event.item
        if item.role == "assistant" and item.text_content:
            logger.info(f"💬 [LLM] Response: {item.text_content[:100]}...")
            asyncio.create_task(add_transcript("avatar", item.text_content))

    @session.on("agent_state_changed")
    def on_agent_state(event):
        logger.info(f"🤖 [AGENT] State: {event.old_state} → {event.new_state}")

    # Initialize Beyond Presence avatar if configured
    bey_config = avatar_config.get("avatar_provider", {})
    bey_avatar_id = bey_config.get("avatar_id") or config.bey_avatar_id

    if config.bey_api_key and bey_avatar_id:
        try:
            logger.info(f"🎬 [AVATAR] Starting Beyond Presence session (ID: {bey_avatar_id})")
            avatar_session = bey.AvatarSession(avatar_id=bey_avatar_id)
            await avatar_session.start(session, room=ctx.room)
            logger.info(f"✅ [AVATAR] Beyond Presence avatar worker successfully connected")
        except Exception as e:
            logger.error(f"❌ [AVATAR] Failed to start Beyond Presence: {e}")
            logger.exception(e)

    # Create the custom agent with system prompt
    agent = BeethovenTeacher(
        instructions=system_prompt,
        convex=convex,
        room_name=ctx.room.name,
    )

    # Start the session
    logger.info("🚀 [SESSION] Starting agent session...")
    await session.start(agent=agent, room=ctx.room)
    logger.info("✨ [SESSION] Agent session is now active and ready")


def build_system_prompt(avatar_config: dict) -> str:
    """Build the system prompt based on avatar configuration."""

    base_prompt = avatar_config.get("system_prompt", "")
    if base_prompt:
        return base_prompt

    return """You are Ludwig, a friendly and patient English teacher helping German speakers learn English.

## Your Personality
- Warm, encouraging, and patient
- You celebrate small wins and progress
- You gently correct mistakes without being discouraging
- You adapt your teaching style to the student's level

## Vision & Presentation Teaching
- You can see presentation slides shared by the student
- When you see a slide, reference its content naturally in your teaching
- Describe what you see to help the student understand: "I can see on this slide..."
- Ask questions about the content shown on slides
- If you see vocabulary, grammar rules, or exercises on slides, help teach them
- Connect the visual content to your conversation

## Teaching Approach
- Keep responses conversational and concise (under 100 words for natural flow)
- Use simple vocabulary for beginners, gradually introduce complexity
- When the student struggles, offer help in German
- Ask follow-up questions to keep the conversation going
- Provide examples when explaining grammar concepts
- When teaching from slides:
  - Read important text aloud
  - Explain vocabulary in context
  - Ask comprehension questions
  - Have the student practice using new words

## Bilingual Support
- Default to English
- If the student speaks German or asks for help in German, respond helpfully in German
- Use German to clarify difficult concepts, then return to English
- For A1-A2 students, use more German support (30-50%)
- For B1+ students, minimize German unless requested

## Conversation Guidelines
- Start with a warm greeting and small talk
- Listen actively and respond to what the student says
- If a presentation is shared, acknowledge it and begin teaching from it
- Correct major errors gently: "Good try! We usually say..."
- Praise good usage: "Great use of the present perfect!"
- End conversations with encouragement and suggestions for next steps

## Things to Avoid
- Long monologues
- Overly formal language
- Ignoring student errors completely
- Being condescending about mistakes
- Ignoring visual content when slides are shared

Remember: Your goal is to make learning English feel like a friendly conversation, not a formal lesson. 
When slides are available, use them to enhance your teaching - but keep the interaction natural and conversational."""


def prewarm(proc: JobProcess):
    """Prewarm the agent process (no VAD prewarming due to Python 3.14 incompatibility)."""
    # Note: silero VAD requires onnxruntime which doesn't support Python 3.14 yet
    # Using STT-based turn detection instead
    pass


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="beethoven-teacher",
        )
    )
