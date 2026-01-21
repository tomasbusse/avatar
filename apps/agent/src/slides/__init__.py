"""
Slide navigation module for silent slide control via markers.
"""

from .slide_command_processor import (
    SlideCommand,
    SlideCommandProcessor,
    SlideCommandTTSWrapper,
    SLIDE_NAVIGATION_PROMPT,
)

__all__ = [
    "SlideCommand",
    "SlideCommandProcessor",
    "SlideCommandTTSWrapper",
    "SLIDE_NAVIGATION_PROMPT",
]
