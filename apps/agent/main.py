"""
Beethoven Agent - With Dual-LLM Vision Support
- Voice LLM: Fast conversation (Haiku)
- Vision LLM: Image analysis (Gemini) - called on demand
- LiveKit connection with prewarming
- Deepgram STT (streaming)
- Cartesia/Deepgram TTS (low-latency)
- Beyond Presence Avatar
"""

import logging
import io
import base64
import json
import random
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, Annotated
from dotenv import load_dotenv

load_dotenv()

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
        except:
            pass
    
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
        
        # 2. Add high-quality document image if available
        # Note: In james_agent, doc_image is often a base64 string
        doc_image_content = None
        if self._current_doc_image:
             doc_image_content = self._current_doc_image
             # Note: We keep it for the current turn, but it can be updated via data packets
        
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
    Build a rich system prompt from avatar configuration including
    personality, identity, system prompts, and behavior rules.

    Priority order:
    1. Life Story Summary (most human-like identity)
    2. Structured Identity (credentials, career, philosophy)
    3. Personality traits and style
    4. System prompts and behavior rules
    5. Bilingual config
    6. Session start behavior
    """
    sections = []
    avatar_name = avatar_config.get("name", "Teacher")
    logger.info(f"🔨 Building system prompt for: {avatar_name}")

    # 1. LIFE STORY SUMMARY (highest priority for human-like identity)
    life_story_summary = avatar_config.get("lifeStorySummary")
    if life_story_summary:
        life_story_section = f"# Your Complete Background\n{life_story_summary}"
        sections.append(life_story_section)
        logger.info(f"   ✅ Added life story summary ({len(life_story_summary)} chars)")
    else:
        logger.info(f"   ⚠️ No life story summary")

    # 2. Core Identity (handle Convex format)
    identity = avatar_config.get("identity", {})
    if identity:
        identity_section = f"# Your Identity\n"
        if identity.get("fullName"):
            identity_section += f"You are {identity['fullName']}"
            if identity.get("title"):
                identity_section += f", {identity['title']}"
            identity_section += ".\n"
        else:
            identity_section += f"You are {avatar_name}.\n"

        if identity.get("shortBio"):
            identity_section += f"{identity['shortBio']}\n"

        # Credentials - list of {degree, institution, year}
        credentials = identity.get("credentials", [])
        if credentials and isinstance(credentials, list):
            identity_section += "Credentials:\n"
            for cred in credentials[:3]:
                if isinstance(cred, dict):
                    identity_section += f"- {cred.get('degree', '')} from {cred.get('institution', '')} ({cred.get('year', '')})\n"
                else:
                    identity_section += f"- {cred}\n"

        # Career History - list of {role, organization, yearStart, yearEnd, highlights}
        career = identity.get("careerHistory", [])
        if career and isinstance(career, list):
            identity_section += "Experience:\n"
            for job in career[:3]:
                if isinstance(job, dict):
                    identity_section += f"- {job.get('role', '')} at {job.get('organization', '')}\n"
                else:
                    identity_section += f"- {job}\n"

        # Philosophy
        philosophy = identity.get("philosophy", {})
        if philosophy:
            if isinstance(philosophy, dict):
                if philosophy.get("approachDescription"):
                    identity_section += f"Teaching Philosophy: {philosophy['approachDescription']}\n"
                beliefs = philosophy.get("coreBeliefs", [])
                if beliefs:
                    identity_section += "Core Beliefs:\n"
                    for belief in beliefs[:4]:
                        identity_section += f"- {belief}\n"
            else:
                identity_section += f"Teaching Philosophy: {philosophy}\n"

        # Anecdotes - list of {topic, story, context, emotions}
        anecdotes = identity.get("anecdotes", [])
        if anecdotes and isinstance(anecdotes, list):
            identity_section += "Personal Stories (use naturally in conversation):\n"
            for anecdote in anecdotes[:3]:
                if isinstance(anecdote, dict) and anecdote.get("story"):
                    topic = anecdote.get("topic", "")
                    story = anecdote.get("story", "")
                    context = anecdote.get("context", "")
                    identity_section += f"- [{topic}] {story}"
                    if context:
                        identity_section += f" (Use: {context})"
                    identity_section += "\n"
                elif isinstance(anecdote, str):
                    identity_section += f"- {anecdote}\n"

        sections.append(identity_section)
        logger.info(f"   ✅ Added identity section ({len(identity_section)} chars)")
    else:
        sections.append(f"# Your Identity\nYou are {avatar_name}, a friendly English teacher.\n")
        logger.info(f"   ⚠️ No identity - using default")

    # 2. Personality (handle both old list format and new Convex dict format)
    personality = avatar_config.get("personality", {})
    if personality:
        personality_section = "# Your Personality\n"

        # Traits - can be dict (Convex) or list (legacy)
        traits = personality.get("traits", {})
        if isinstance(traits, dict) and traits:
            # Convex format: {warmth: 9, patience: 8, humor: 6, ...}
            trait_strs = [f"{k}: {v}/10" for k, v in traits.items() if isinstance(v, (int, float))]
            if trait_strs:
                personality_section += f"Personality Traits: {', '.join(trait_strs)}\n"
        elif isinstance(traits, list) and traits:
            personality_section += f"Personality Traits: {', '.join(traits)}\n"

        # Style - can be dict or string
        style = personality.get("style", {})
        if isinstance(style, dict) and style:
            style_items = []
            if style.get("vocabulary"): style_items.append(f"vocabulary: {style['vocabulary']}")
            if style.get("sentenceLength"): style_items.append(f"sentences: {style['sentenceLength']}")
            if style.get("askQuestions"): style_items.append(f"asks questions {style['askQuestions']}")
            if style_items:
                personality_section += f"Teaching Style: {', '.join(style_items)}\n"
        elif isinstance(style, str) and style:
            personality_section += f"Teaching Style: {style}\n"

        # Behaviors - can be dict (Convex) or list (legacy)
        behaviors = personality.get("behaviors", {})
        if isinstance(behaviors, dict) and behaviors:
            personality_section += f"Key Behaviors:\n"
            for key, value in behaviors.items():
                if value:
                    personality_section += f"- {key}: {value}\n"
        elif isinstance(behaviors, list) and behaviors:
            personality_section += f"Key Behaviors:\n"
            for behavior in behaviors[:5]:
                personality_section += f"- {behavior}\n"

        # Voice hints - can be dict or string
        voice_hints = personality.get("voiceHints", {})
        if isinstance(voice_hints, dict) and voice_hints:
            hints = [f"{k}: {v}" for k, v in voice_hints.items() if v]
            if hints:
                personality_section += f"Voice/Tone: {', '.join(hints)}\n"
        elif isinstance(voice_hints, str) and voice_hints:
            personality_section += f"Voice/Tone: {voice_hints}\n"

        sections.append(personality_section)
        logger.info(f"   ✅ Added personality section ({len(personality_section)} chars)")
    else:
        logger.info(f"   ⚠️ No personality data")

    # 3. System Prompts
    system_prompts = avatar_config.get("systemPrompts", {})
    if system_prompts:
        if system_prompts.get("base"):
            sections.append(f"# Instructions\n{system_prompts['base']}")
            logger.info(f"   ✅ Added base system prompt ({len(system_prompts['base'])} chars)")

        if system_prompts.get("lesson"):
            sections.append(f"# Lesson Mode\n{system_prompts['lesson']}")
            logger.info(f"   ✅ Added lesson prompt")

    # 4. Behavior Rules
    behavior_rules = avatar_config.get("behaviorRules", {})
    if behavior_rules:
        rules_section = "# Behavior Rules\n"

        if behavior_rules.get("maxResponseLength"):
            rules_section += f"- Keep responses under {behavior_rules['maxResponseLength']} words\n"

        if behavior_rules.get("errorCorrectionStyle"):
            rules_section += f"- Error correction style: {behavior_rules['errorCorrectionStyle']}\n"

        if behavior_rules.get("encouragementLevel"):
            rules_section += f"- Encouragement level: {behavior_rules['encouragementLevel']}\n"

        if behavior_rules.get("customRules") and isinstance(behavior_rules['customRules'], list):
            for rule in behavior_rules['customRules'][:5]:
                rules_section += f"- {rule}\n"

        sections.append(rules_section)

    # 5. Bilingual Config
    bilingual = avatar_config.get("bilingualConfig", {})
    if bilingual and bilingual.get("enabled"):
        bilingual_section = "# Bilingual Teaching\n"
        mode = bilingual.get("mode", "adaptive")
        bilingual_section += f"Mode: {mode}\n"

        if mode == "adaptive":
            bilingual_section += "Switch to German when the student struggles. Otherwise use English.\n"
        elif mode == "code_switching":
            bilingual_section += "Mix German and English naturally, like a bilingual speaker.\n"
        elif mode == "strict_separation":
            bilingual_section += "Announce clearly when switching languages.\n"

        sections.append(bilingual_section)

    # 6. Session Start Behavior
    session_config = avatar_config.get("sessionStartConfig", {})
    if session_config:
        behavior = session_config.get("behavior", "speak_first")
        if behavior == "speak_first":
            session_section = """# Session Start Behavior
When the session begins, greet the student warmly and immediately.
Do NOT wait for them to speak first - you initiate the conversation.
Keep your opening brief and friendly, then smoothly transition to checking in on how they're doing."""
            sections.append(session_section)
            logger.info(f"   ✅ Added session start behavior: speak_first")
        elif behavior == "wait_for_student":
            session_section = """# Session Start Behavior
Wait for the student to speak first before responding.
Be attentive and ready to engage once they initiate the conversation."""
            sections.append(session_section)
            logger.info(f"   ✅ Added session start behavior: wait_for_student")
        elif behavior == "contextual":
            session_section = """# Session Start Behavior
Adapt your greeting based on context - time of day, whether this is a returning student, etc.
Be natural and personable in how you start the conversation."""
            sections.append(session_section)
            logger.info(f"   ✅ Added session start behavior: contextual")

    # 7. Legacy persona (fallback)
    if not identity and not personality and not life_story_summary:
        persona = avatar_config.get("persona", "")
        if persona:
            sections.append(f"# Your Persona\n{persona}")

    # Combine all sections
    full_prompt = "\n\n".join(sections)

    # Add default behavior if prompt is too short
    if len(full_prompt) < 50:
        full_prompt = f"You are {avatar_name}, a friendly and patient English teacher for German speakers. Keep responses conversational and under 50 words."

    return full_prompt


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


def prewarm(proc: JobProcess):
    """
    Prewarm function - runs when worker starts, BEFORE any jobs.
    Pre-loads expensive resources to reduce first-response latency.
    """
    global _config
    logger.info("🔥 Prewarming agent process...")

    # Load config once
    _config = Config()

    # Pre-initialize plugins (loads models, establishes connections)
    proc.userdata["deepgram_stt"] = deepgram.STT(
        model="nova-2",
        language="en",
        smart_format=True,
        interim_results=True,
    )

    # Pre-create TTS instances
    proc.userdata["cartesia_tts"] = cartesia.TTS(
        model="sonic-english",
        voice="1463a4e1-56a1-4b41-b257-728d56e93605",
        language="en",
    )

    proc.userdata["deepgram_tts"] = deepgram.TTS(
        model="aura-asteria-en",
    )

    # Initialize RAG components if Zep API key is available
    import os
    zep_api_key = os.environ.get("ZEP_API_KEY")
    if zep_api_key:
        proc.userdata["rag_retriever"] = ZepRetriever(api_key=zep_api_key)
        proc.userdata["rag_cache"] = RAGCache(max_size=100, ttl_seconds=300)
        logger.info("📚 RAG retriever initialized (Zep Cloud)")
    else:
        logger.info("⚠️ ZEP_API_KEY not set - RAG disabled")

    logger.info("✅ Prewarm complete - STT/TTS ready")


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

    # Get LLM model (for conversation)
    # Default to Sonnet 3.5 if not specified, much better than Haiku
    llm_model = avatar_config.get("llm_model", "anthropic/claude-3.5-sonnet")
    
    # Get Vision config
    vision_config = avatar_config.get("vision_config", {})
    vision_enabled = vision_config.get("enabled", False)
    vision_llm_model = vision_config.get("vision_llm_model", "google/gemini-2.5-flash-preview-05-20")
    capture_mode = vision_config.get("capture_mode", "smart")

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
    
    # Initialize STT
    stt = ctx.proc.userdata.get("deepgram_stt") or deepgram.STT(
        model="nova-2",
        language="en",
        interim_results=True,
    )
    
    # Initialize TTS
    voice_config = avatar_config.get("voice_config", {})
    voice_id = voice_config.get("voice_id", "")
    
    if voice_id.startswith("aura-"):
        logger.info(f"🔊 Using Deepgram TTS: {voice_id}")
        tts = deepgram.TTS(model=voice_id)
    else:
        cartesia_voice = voice_id or "1463a4e1-56a1-4b41-b257-728d56e93605"
        logger.info(f"🔊 Using Cartesia TTS: {cartesia_voice}")
        tts = cartesia.TTS(
            model="sonic-english",
            voice=cartesia_voice,
            language="en",
        )
    
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
                    
                    if event_type == "presentation_ready":
                        # Add system message to guide the agent into presentation mode
                        if session.chat_ctx:
                            teaching_instruction = (
                                "STUDENT UPLOADED A PRESENTATION: You can now see the slides via your vision input. "
                                "Greet the student, acknowledge the document, and begin teaching based on slide 1."
                            )
                            session.chat_ctx.messages.append(ChatMessage(role=ChatRole.SYSTEM, content=teaching_instruction))
                            logger.info("🎓 Injected presentation teaching instruction")
                        
                        # Immediate greeting
                        asyncio.create_task(agent.say("I see you've uploaded a presentation! Let's take a look at it together.", allow_interruptions=True))

                        
            except Exception as e:
                logger.error(f"Data packet error: {e}")
    
    # Create agent session
    session = AgentSession(
        stt=stt,
        tts=tts,
        llm=llm_instance,
        turn_detection="stt",
        min_endpointing_delay=0.3,
        max_endpointing_delay=1.0,
    )
    
    # Event logging
    @session.on("user_input_transcribed")
    def on_speech(event):
        if event.is_final and event.transcript:
            logger.info(f"🎯 HEARD: '{event.transcript}'")
    
    @session.on("agent_state_changed")
    def on_state(event):
        logger.info(f"🤖 STATE: {event.old_state} → {event.new_state}")
    
    # Get Beyond Presence avatar settings
    avatar_provider = avatar_config.get("avatar_provider", {})
    avatar_id = avatar_provider.get("avatar_id")
    avatar_name = avatar_config.get("name", "Ludwig")
    
    logger.info(f"📺 Starting avatar: {avatar_name}")
    
    # Initialize avatar
    if config.bey_api_key and avatar_id:
        try:
            avatar = bey.AvatarSession(
                avatar_id=avatar_id,
                avatar_participant_name=avatar_name,
            )
            await avatar.start(session, room=ctx.room)
            logger.info(f"✅ Avatar '{avatar_name}' connected!")
        except Exception as e:
            logger.error(f"❌ Avatar failed: {e}")
            logger.exception(e)
    else:
        logger.error(f"❌ Missing API Key or Avatar ID")
    
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

    # Define presentation control tools (need access to room)
    available_presentation_ids = {p.get('id') for p in available_presentations if p.get('id')}
    presentation_tools = []

    if available_presentations:
        async def send_data_message(message: Dict[str, Any]):
            """Helper to send data channel messages to frontend."""
            try:
                data = json.dumps(message).encode('utf-8')
                await ctx.room.local_participant.publish_data(data, reliable=True)
                logger.info(f"📤 Sent data message: {message.get('type')}")
            except Exception as e:
                logger.error(f"❌ Failed to send data message: {e}")

        @llm.function_tool(description="Load and display a presentation on the whiteboard to teach from. Use this when the student asks to see a presentation or when you want to teach using slides.")
        async def load_presentation(
            presentation_id: Annotated[str, "The ID of the presentation to load"]
        ) -> str:
            """Load a presentation for teaching."""
            if presentation_id not in available_presentation_ids:
                return f"Presentation ID '{presentation_id}' not found. Available presentations: {[p.get('name') for p in available_presentations]}"

            await send_data_message({
                "type": "load_presentation",
                "presentationId": presentation_id
            })

            pres_name = next((p.get('name') for p in available_presentations if p.get('id') == presentation_id), 'Unknown')
            return f"Loading presentation '{pres_name}'. The slides will appear on the whiteboard. You can now teach from the presentation using next_slide, prev_slide, and goto_slide."

        @llm.function_tool(description="Move to the next slide in the current presentation.")
        async def next_slide() -> str:
            """Advance to the next slide."""
            await send_data_message({"type": "slide_command", "command": "next"})
            return "Moving to next slide."

        @llm.function_tool(description="Go back to the previous slide in the current presentation.")
        async def prev_slide() -> str:
            """Go back to the previous slide."""
            await send_data_message({"type": "slide_command", "command": "prev"})
            return "Moving to previous slide."

        @llm.function_tool(description="Jump to a specific slide number in the current presentation.")
        async def goto_slide(
            slide_number: Annotated[int, "The slide number to jump to (1-based)"]
        ) -> str:
            """Jump to a specific slide."""
            await send_data_message({"type": "slide_command", "command": "goto", "slideIndex": slide_number - 1})
            return f"Jumping to slide {slide_number}."

        presentation_tools = [load_presentation, next_slide, prev_slide, goto_slide]
        logger.info(f"🛠️ Registered {len(presentation_tools)} presentation control tools")

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
            tools=presentation_tools if presentation_tools else None,
        )
        logger.info(f"🎓 Using BeethovenTeacher with vision (model: {llm_model})")
        if lesson_manager:
            logger.info(f"📖 Lesson manager attached with {len(lesson_manager.index)} lessons")
    else:
        agent = Agent(
            instructions=final_prompt,
            tools=presentation_tools if presentation_tools else None,
        )
    
    # Start the session
    await session.start(
        room=ctx.room,
        agent=agent
    )

    logger.info(f"✨ Agent '{avatar_name}' ready (Vision: {'ON' if vision_enabled else 'OFF'})")

    # Deliver opening greeting immediately (if speak_first behavior)
    opening_greeting = get_opening_greeting(avatar_config)
    if opening_greeting:
        import asyncio
        # Small delay to ensure avatar is fully connected
        await asyncio.sleep(0.5)
        await session.say(opening_greeting, allow_interruptions=True)
        logger.info(f"👋 Delivered opening greeting: '{opening_greeting[:50]}...'")
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
