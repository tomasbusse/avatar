"""Configuration management for the Beethoven agent."""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    """Agent configuration loaded from environment variables."""

    # Pydantic v2 config using model_config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore unknown env vars
    )

    # LiveKit
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_url: str = ""

    # Beyond Presence
    bey_api_key: Optional[str] = None
    bey_avatar_id: Optional[str] = None

    # AI Providers
    openrouter_api_key: str = ""
    deepgram_api_key: str = ""
    cartesia_api_key: str = ""

    # Convex
    convex_url: str = ""

    # Zep Cloud (RAG)
    zep_api_key: Optional[str] = None

    # Sentry
    sentry_dsn: Optional[str] = None
    sentry_environment: str = "development"
    sentry_release: Optional[str] = None

    # Logging
    log_level: str = "INFO"


def get_config() -> Config:
    """Get the application configuration."""
    return Config()
