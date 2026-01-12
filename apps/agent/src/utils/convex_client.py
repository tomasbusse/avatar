"""Convex client for the Beethoven agent."""

import asyncio
import logging
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger("convex-client")


class ConvexClient:
    """HTTP client for Convex functions."""

    def __init__(self, convex_url: str):
        self.convex_url = convex_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=30.0)

    async def query(self, function_name: str, args: Dict[str, Any] = None) -> Any:
        """Execute a Convex query function."""
        try:
            response = await self.client.post(
                f"{self.convex_url}/api/query",
                json={
                    "path": function_name,
                    "args": args or {},
                },
            )
            response.raise_for_status()
            return response.json().get("value")
        except Exception as e:
            logger.error(f"Convex query error: {e}")
            return None

    async def mutation(self, function_name: str, args: Dict[str, Any] = None) -> Any:
        """Execute a Convex mutation function."""
        try:
            response = await self.client.post(
                f"{self.convex_url}/api/mutation",
                json={
                    "path": function_name,
                    "args": args or {},
                },
            )
            response.raise_for_status()
            return response.json().get("value")
        except Exception as e:
            logger.error(f"Convex mutation error: {e}")
            return None

    async def get_first_active_avatar(self) -> Dict[str, Any]:
        """Get the first active avatar as a fallback (replaces default avatar)."""
        result = await self.query("avatars:getFirstActiveAvatar")
        logger.info(f"Raw avatar config from Convex: {result}")
        
        if result:
            # Map camelCase (Convex) to snake_case (Python)
            avatar_provider = result.get("avatarProvider", {})
            voice_provider = result.get("voiceProvider", {})
            llm_config = result.get("llmConfig", {})
            
            avatar_settings = avatar_provider.get("settings", {})
            vision_config = result.get("visionConfig", {})

            config = {
                "_id": result.get("_id"),  # Include Convex ID for lesson manager
                "name": result.get("name", "Ludwig"),
                "system_prompt": result.get("systemPrompts", {}).get("base", ""),
                "llm_provider": llm_config.get("provider", "openrouter"),  # CRITICAL: Include provider
                "llm_model": llm_config.get("model", "anthropic/claude-3.5-sonnet"),
                "llm_temperature": llm_config.get("temperature", 0.7),
                "voice_config": {
                    "voice_id": voice_provider.get("voiceId", ""),
                    "model": voice_provider.get("model", "sonic-2"),  # TTS model (e.g., "sonic-3")
                    "language": voice_provider.get("language", "en"),
                    "speed": voice_provider.get("settings", {}).get("speed", 1.0),
                    "emotion": voice_provider.get("settings", {}).get("emotion", ["positivity:medium"]),
                    # Language mode: english, german, or bilingual
                    "language_mode": voice_provider.get("languageMode", "english"),
                    "bilingual_default": voice_provider.get("bilingualDefault", "en"),
                },
                "avatar_provider": {
                    "type": avatar_provider.get("type", "beyond_presence"),
                    "avatar_id": avatar_provider.get("avatarId", ""),
                    "resolution": avatar_settings.get("resolution", "480p"),
                    "fps": avatar_settings.get("fps", 24),
                    "background": avatar_settings.get("background"),
                },
                "vision_config": {
                    "enabled": vision_config.get("enabled", False),
                    "vision_llm_model": vision_config.get("visionLLMModel", "google/gemini-flash-1.5"),
                    "capture_mode": vision_config.get("captureMode", "smart"),
                    "capture_webcam": vision_config.get("captureWebcam", True),
                    "capture_screen": vision_config.get("captureScreen", True),
                },
                # FULL AVATAR DATA
                "personality": result.get("personality", {}),
                "identity": result.get("identity", {}),
                "systemPrompts": result.get("systemPrompts", {}),
                "persona": result.get("persona", {}),
                "behaviorRules": result.get("behaviorRules", {}),
                "bilingualConfig": result.get("bilingualConfig", {}),
                "knowledgeConfig": result.get("knowledgeConfig", {}),
                "memoryConfig": result.get("memoryConfig", {}),
                # LIFE STORY & SESSION START (Human-like Identity)
                "lifeStoryDocument": result.get("lifeStoryDocument"),
                "lifeStorySummary": result.get("lifeStorySummary"),
                "sessionStartConfig": result.get("sessionStartConfig", {}),
            }
            logger.info(f"Mapped avatar config: {config}")
            return config
        return {}


    async def get_session_by_room(self, room_name: str) -> Optional[Dict[str, Any]]:
        """Get session by room name."""
        return await self.query("sessions:getSessionByRoom", {"roomName": room_name})

    async def get_avatar_by_id(self, avatar_id: str) -> Dict[str, Any]:
        """Get avatar config by Convex document ID."""
        result = await self.query("avatars:getAvatar", {"avatarId": avatar_id})
        logger.info(f"Raw avatar from Convex (ID={avatar_id}): {result}")
        
        if result:
            # Map camelCase (Convex) to snake_case (Python)
            avatar_provider = result.get("avatarProvider", {})
            avatar_settings = avatar_provider.get("settings", {})
            voice_provider = result.get("voiceProvider", {})
            llm_config = result.get("llmConfig", {})
            vision_config = result.get("visionConfig", {})
            
            config = {
                "_id": result.get("_id"),  # Include Convex ID for lesson manager
                "name": result.get("name", "Ludwig"),
                "system_prompt": result.get("systemPrompts", {}).get("base", ""),
                "llm_provider": llm_config.get("provider", "openrouter"),  # CRITICAL: Include provider
                "llm_model": llm_config.get("model", "anthropic/claude-3.5-sonnet"),
                "llm_temperature": llm_config.get("temperature", 0.7),
                "voice_config": {
                    "voice_id": voice_provider.get("voiceId", ""),
                    "model": voice_provider.get("model", "sonic-2"),  # TTS model (e.g., "sonic-3")
                    "language": voice_provider.get("language", "en"),
                    "speed": voice_provider.get("settings", {}).get("speed", 1.0),
                    "emotion": voice_provider.get("settings", {}).get("emotion", ["positivity:medium"]),
                    # Language mode: english, german, or bilingual
                    "language_mode": voice_provider.get("languageMode", "english"),
                    "bilingual_default": voice_provider.get("bilingualDefault", "en"),
                },
                "avatar_provider": {
                    "type": avatar_provider.get("type", "beyond_presence"),
                    "avatar_id": avatar_provider.get("avatarId", ""),
                    # Avatar video settings from admin
                    "resolution": avatar_settings.get("resolution", "480p"),
                    "fps": avatar_settings.get("fps", 24),
                    "background": avatar_settings.get("background"),
                },
                # Vision config for webcam/screen capture
                "vision_config": {
                    "enabled": vision_config.get("enabled", False),
                    "vision_llm_model": vision_config.get("visionLLMModel", "google/gemini-flash-1.5"),
                    "capture_mode": vision_config.get("captureMode", "smart"),
                    "capture_webcam": vision_config.get("captureWebcam", True),
                    "capture_screen": vision_config.get("captureScreen", True),
                },
                # FULL AVATAR DATA - personality, identity, knowledge, memory
                "personality": result.get("personality", {}),
                "identity": result.get("identity", {}),
                "systemPrompts": result.get("systemPrompts", {}),
                "persona": result.get("persona", {}),
                "behaviorRules": result.get("behaviorRules", {}),
                "bilingualConfig": result.get("bilingualConfig", {}),
                "knowledgeConfig": result.get("knowledgeConfig", {}),
                "memoryConfig": result.get("memoryConfig", {}),
                # LIFE STORY & SESSION START (Human-like Identity)
                "lifeStoryDocument": result.get("lifeStoryDocument"),
                "lifeStorySummary": result.get("lifeStorySummary"),
                "sessionStartConfig": result.get("sessionStartConfig", {}),
            }
            logger.info(f"Mapped avatar config: {config}")
            return config
        return {}

    async def add_transcript_entry(
        self,
        session_id: str,
        role: str,
        content: str,
        language: Optional[str] = None,
    ) -> bool:
        """Add a transcript entry to the session."""
        try:
            await self.mutation(
                "sessions:addTranscriptEntry",
                {
                    "sessionId": session_id,
                    "role": role,
                    "content": content,
                    "language": language,
                },
            )
            return True
        except Exception as e:
            logger.error(f"Failed to add transcript entry: {e}")
            return False

    async def update_session_status(self, room_name: str, status: str) -> bool:
        """Update session status."""
        try:
            await self.mutation(
                "sessions:updateSessionStatus",
                {"roomName": room_name, "status": status},
            )
            return True
        except Exception as e:
            logger.error(f"Failed to update session status: {e}")
            return False

    async def end_session(self, room_name: str, reason: str = "completed") -> bool:
        """
        Properly end a session - marks it as completed with duration.
        Call this when the LiveKit room closes or participant leaves.
        """
        try:
            result = await self.mutation(
                "sessions:endSessionByRoom",
                {"roomName": room_name, "reason": reason},
            )
            logger.info(f"Session ended for room {room_name}: {result}")
            return True
        except Exception as e:
            logger.error(f"Failed to end session for room {room_name}: {e}")
            return False

    # ==========================================
    # MEMORY METHODS - Student context retrieval
    # ==========================================

    async def get_student_memories(
        self, student_id: str, limit: int = 20
    ) -> list[Dict[str, Any]]:
        """Get memories for a student, ordered by importance."""
        result = await self.query(
            "memories:getByStudentId",
            {"studentId": student_id, "limit": limit},
        )
        return result or []

    async def get_memories_by_type(
        self, student_id: str, memory_type: str, limit: int = 10
    ) -> list[Dict[str, Any]]:
        """Get memories of a specific type (personal_fact, preference, struggle, etc.)."""
        result = await self.query(
            "memories:getByType",
            {"studentId": student_id, "type": memory_type, "limit": limit},
        )
        return result or []

    async def get_critical_memories(
        self, student_id: str, limit: int = 10
    ) -> list[Dict[str, Any]]:
        """Get high-importance memories for prompt injection."""
        result = await self.query(
            "memories:getByImportance",
            {"studentId": student_id, "importance": "critical", "limit": limit},
        )
        critical = result or []

        # Also get high importance if we have room
        if len(critical) < limit:
            high_result = await self.query(
                "memories:getByImportance",
                {"studentId": student_id, "importance": "high", "limit": limit - len(critical)},
            )
            critical.extend(high_result or [])

        return critical

    async def get_recent_session_summaries(
        self, student_id: str, limit: int = 5
    ) -> list[Dict[str, Any]]:
        """Get recent session summaries for context."""
        result = await self.query(
            "memories:getRecentSessions",
            {"studentId": student_id, "limit": limit},
        )
        return result or []

    async def get_error_patterns(
        self, student_id: str, limit: int = 10
    ) -> list[Dict[str, Any]]:
        """Get active (unresolved) error patterns for the student."""
        result = await self.query(
            "errorPatterns:getActive",
            {"studentId": student_id, "limit": limit},
        )
        return result or []

    async def get_user_memory_sync(
        self, user_id: str, avatar_slug: str
    ) -> Optional[Dict[str, Any]]:
        """Get cached memory sync data for fast context."""
        result = await self.query(
            "memories:getUserMemorySync",
            {"userId": user_id, "avatarSlug": avatar_slug},
        )
        return result

    async def get_upcoming_events_past_due(
        self, student_id: str, limit: int = 3
    ) -> list[Dict[str, Any]]:
        """
        Get upcoming events that have passed but haven't been followed up on.
        Used to generate personalized greetings like "How was your holiday?"
        """
        result = await self.query(
            "memories:getUpcomingEventsPastDue",
            {"studentId": student_id, "limit": limit},
        )
        return result or []

    async def mark_event_followed_up(self, memory_id: str) -> bool:
        """Mark an upcoming event memory as followed up."""
        try:
            await self.mutation(
                "memories:markFollowedUp",
                {"memoryId": memory_id},
            )
            return True
        except Exception as e:
            logger.error(f"Failed to mark event as followed up: {e}")
            return False

    async def get_student_context(
        self, student_id: str, avatar_slug: str = None
    ) -> Dict[str, Any]:
        """
        Get complete student context for session start.
        Fetches memories, errors, recent sessions, and past-due events in parallel.
        """
        # Fetch all context in parallel for speed
        memories_task = self.get_critical_memories(student_id, limit=15)
        errors_task = self.get_error_patterns(student_id, limit=5)
        sessions_task = self.get_recent_session_summaries(student_id, limit=3)
        past_due_task = self.get_upcoming_events_past_due(student_id, limit=3)

        memories, errors, sessions, past_due_events = await asyncio.gather(
            memories_task, errors_task, sessions_task, past_due_task
        )

        # Also try to get cached profile if available
        profile = None
        if avatar_slug:
            sync_data = await self.get_user_memory_sync(student_id, avatar_slug)
            if sync_data:
                profile = sync_data.get("profileSummary")

        return {
            "memories": memories,
            "error_patterns": errors,
            "recent_sessions": sessions,
            "past_due_events": past_due_events,  # Events to ask about (e.g., "How was your holiday?")
            "profile": profile,
            "has_history": len(memories) > 0 or len(sessions) > 0,
        }

    def format_memory_context(self, context: Dict[str, Any]) -> str:
        """
        Format student context into a string for system prompt injection.
        Returns empty string if no context available.
        """
        if not context.get("has_history"):
            return ""

        parts = []

        # Add profile summary if available
        profile = context.get("profile")
        if profile:
            parts.append("## Student Profile")
            if profile.get("level"):
                parts.append(f"- Level: {profile['level']}")
            if profile.get("goals"):
                parts.append(f"- Goals: {', '.join(profile['goals'])}")
            if profile.get("strongAreas"):
                parts.append(f"- Strong areas: {', '.join(profile['strongAreas'])}")
            if profile.get("weakAreas"):
                parts.append(f"- Needs work on: {', '.join(profile['weakAreas'])}")
            if profile.get("personalFacts"):
                parts.append(f"- Personal: {', '.join(profile['personalFacts'][:3])}")
            parts.append("")

        # Add key memories
        memories = context.get("memories", [])
        if memories:
            parts.append("## What You Know About This Student")
            for mem in memories[:10]:
                mem_type = mem.get("type", "fact")
                content = mem.get("content", "")
                importance = mem.get("importance", "medium")
                if importance in ["critical", "high"]:
                    parts.append(f"- [{mem_type}] {content}")
                else:
                    parts.append(f"- {content}")
            parts.append("")

        # Add error patterns to focus on
        errors = context.get("error_patterns", [])
        if errors:
            parts.append("## Recurring Mistakes to Address")
            for err in errors[:5]:
                pattern = err.get("pattern", "")
                occurrences = err.get("occurrences", 1)
                parts.append(f"- {pattern} (occurred {occurrences}x)")
            parts.append("")

        # Add recent session context
        sessions = context.get("recent_sessions", [])
        if sessions:
            parts.append("## Recent Sessions")
            for sess in sessions[:3]:
                content = sess.get("content", "")
                parts.append(f"- {content}")
            parts.append("")

        return "\n".join(parts)

    # ==========================================
    # MEMORY STORAGE METHODS - Post-session
    # ==========================================

    async def create_memory(
        self,
        student_id: str,
        memory_type: str,
        content: str,
        importance: str = "medium",
        topic: str = None,
        tags: list[str] = None,
        session_id: str = None,
        avatar_slug: str = None,
        event_date: int = None,
    ) -> Optional[str]:
        """Create a new memory for a student.

        Args:
            event_date: For 'upcoming' type memories, the timestamp (ms) of the event.
        """
        try:
            args = {
                "studentId": student_id,
                "type": memory_type,
                "content": content,
                "importance": importance,
                "topic": topic,
                "tags": tags or [],
                "sessionId": session_id,
                "avatarSlug": avatar_slug,
                "source": "auto_extracted",
            }
            # Only include eventDate for upcoming type memories
            if memory_type == "upcoming" and event_date:
                args["eventDate"] = event_date

            result = await self.mutation("memories:create", args)
            return result
        except Exception as e:
            logger.error(f"Failed to create memory: {e}")
            return None

    async def record_error_pattern(
        self,
        student_id: str,
        error_text: str,
        correction: str,
        error_type: str,
        session_id: str = None,
    ) -> bool:
        """Record an error pattern for the student."""
        try:
            await self.mutation(
                "errorPatterns:recordError",
                {
                    "studentId": student_id,
                    "errorText": error_text,
                    "correction": correction,
                    "errorType": error_type,
                    "sessionId": session_id,
                },
            )
            return True
        except Exception as e:
            logger.error(f"Failed to record error pattern: {e}")
            return False

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
