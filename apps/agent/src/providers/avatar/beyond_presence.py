"""Beyond Presence avatar integration for LiveKit."""

import asyncio
import logging
import os
from typing import Optional
import httpx

logger = logging.getLogger("beyond-presence")


class BeyondPresenceAvatar:
    """Beyond Presence avatar controller for real-time lip-sync video."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        avatar_id: Optional[str] = None,
        base_url: str = "https://api.bey.dev",
    ):
        self.api_key = api_key or os.environ.get("BEY_API_KEY", "")
        self.avatar_id = avatar_id or os.environ.get("BEY_AVATAR_ID", "")
        self.base_url = base_url
        self._client = httpx.AsyncClient(timeout=30.0)
        self._session_id: Optional[str] = None
        self._room = None
        self._connected = False

    async def connect(self, room) -> bool:
        """Connect the avatar to a LiveKit room."""
        if not self.api_key or not self.avatar_id:
            logger.warning("Beyond Presence credentials not configured")
            return False

        try:
            self._room = room

            # Convert wss:// to https:// for LiveKit API endpoint
            livekit_url = os.environ.get("LIVEKIT_URL", "").replace("wss://", "https://")
            logger.info(f"Connecting Beyond Presence to LiveKit: {livekit_url} (room: {room.name})")

            # Start avatar session
            response = await self._client.post(
                f"{self.base_url}/v1/avatars/{self.avatar_id}/sessions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "livekit": {
                        "room_name": room.name,
                        "server_url": livekit_url,
                    },
                    "settings": {
                        "resolution": "720p",
                        "fps": 30,
                        "background": "transparent",
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            self._session_id = data.get("session_id")
            self._connected = True

            logger.info(f"Beyond Presence avatar session started: {self._session_id}")
            return True

        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to start avatar session: {e.response.status_code}")
            return False
        except Exception as e:
            logger.error(f"Avatar connection error: {e}")
            return False

    async def disconnect(self) -> bool:
        """Disconnect the avatar session."""
        if not self._session_id:
            return True

        try:
            response = await self._client.delete(
                f"{self.base_url}/v1/sessions/{self._session_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            response.raise_for_status()
            self._connected = False
            self._session_id = None
            logger.info("Beyond Presence avatar session ended")
            return True

        except Exception as e:
            logger.error(f"Avatar disconnect error: {e}")
            return False

    async def set_emotion(self, emotion: str) -> bool:
        """Set the avatar's emotional state."""
        if not self._session_id:
            return False

        try:
            response = await self._client.post(
                f"{self.base_url}/v1/sessions/{self._session_id}/emotion",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"emotion": emotion},
            )
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Failed to set emotion: {e}")
            return False

    @property
    def is_connected(self) -> bool:
        """Check if the avatar is connected."""
        return self._connected

    @property
    def session_id(self) -> Optional[str]:
        """Get the current session ID."""
        return self._session_id
