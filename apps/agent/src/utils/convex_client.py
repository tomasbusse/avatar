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

    async def get_default_avatar(self) -> Dict[str, Any]:
        """Get the default avatar configuration."""
        result = await self.query("avatars:getDefaultAvatar")
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
                "llm_model": llm_config.get("model", "anthropic/claude-3.5-sonnet"),
                "llm_temperature": llm_config.get("temperature", 0.7),
                "voice_config": {
                    "voice_id": voice_provider.get("voiceId", ""),
                    "language": voice_provider.get("language", "en"),
                    "speed": voice_provider.get("settings", {}).get("speed", 1.0),
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
                "llm_model": llm_config.get("model", "anthropic/claude-3.5-sonnet"),
                "llm_temperature": llm_config.get("temperature", 0.7),
                "voice_config": {
                    "voice_id": voice_provider.get("voiceId", ""),
                    "language": voice_provider.get("language", "en"),
                    "speed": voice_provider.get("settings", {}).get("speed", 1.0),
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

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
