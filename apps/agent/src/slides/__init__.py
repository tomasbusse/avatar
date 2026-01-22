"""
Slide and game navigation module for silent control via markers.
"""

from .slide_command_processor import (
    SlideCommand,
    SlideCommandProcessor,
    SlideCommandTTSWrapper,
    GameCommand,
    GameCommandProcessor,
    DocumentCommand,
    DocumentCommandProcessor,
    SLIDE_NAVIGATION_PROMPT,
    GAME_NAVIGATION_PROMPT,
    DOCUMENT_LOADING_PROMPT,
    NAVIGATION_PROMPT,
)

__all__ = [
    "SlideCommand",
    "SlideCommandProcessor",
    "SlideCommandTTSWrapper",
    "GameCommand",
    "GameCommandProcessor",
    "DocumentCommand",
    "DocumentCommandProcessor",
    "SLIDE_NAVIGATION_PROMPT",
    "GAME_NAVIGATION_PROMPT",
    "DOCUMENT_LOADING_PROMPT",
    "NAVIGATION_PROMPT",
]
