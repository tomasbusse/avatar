"""
Slide Command Processor - Detects and strips silent slide navigation markers.

The avatar can include these markers in responses to control slides without speaking them.
Markers are stripped before TTS so the student never hears them.

Supported Markers:
    [NEXT] or [SLIDE:NEXT] or [>>>]     - Go to next slide
    [PREV] or [BACK] or [<<<]           - Go to previous slide
    [SLIDE:3] or [GOTO:3]               - Go to specific slide number

Examples:
    "Great job! [NEXT] Now on this slide, we see..." → speaks "Great job! Now on this slide, we see..."
    "Let me explain that again. [PREV] As you can see here..." → goes back, speaks cleanly
    "For the grammar rules, [SLIDE:5] this slide shows..." → jumps to slide 5
"""

import re
import logging
from typing import Optional, Tuple, List, Callable, Awaitable
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SlideCommand:
    """Represents a detected slide navigation command."""
    action: str  # "next", "prev", "goto"
    slide_number: Optional[int] = None  # Only for "goto"
    position: int = 0  # Character position in original text (for timing)


class SlideCommandProcessor:
    """
    Detects and strips silent slide navigation markers from text.

    Usage:
        processor = SlideCommandProcessor()
        clean_text, commands = processor.process("Let's continue! [NEXT] Here we see...")
        # clean_text = "Let's continue! Here we see..."
        # commands = [SlideCommand(action="next", slide_number=None, position=17)]
    """

    # Silent markers - these get stripped from text completely
    # Expanded set for flexibility
    PATTERNS = {
        # Next slide patterns
        "next": re.compile(
            r'\[NEXT\]|\[SLIDE:NEXT\]|\[>>>\]|\[→\]|\[FORWARD\]',
            re.IGNORECASE
        ),
        # Previous slide patterns
        "prev": re.compile(
            r'\[PREV\]|\[BACK\]|\[SLIDE:PREV\]|\[<<<\]|\[←\]|\[PREVIOUS\]',
            re.IGNORECASE
        ),
        # Goto specific slide patterns - captures the number
        "goto": re.compile(
            r'\[SLIDE:(\d+)\]|\[GOTO:(\d+)\]|\[S(\d+)\]|\[#(\d+)\]',
            re.IGNORECASE
        ),
    }

    # Combined pattern for stripping all markers
    ALL_MARKERS = re.compile(
        r'\[NEXT\]|\[SLIDE:NEXT\]|\[>>>\]|\[→\]|\[FORWARD\]|'
        r'\[PREV\]|\[BACK\]|\[SLIDE:PREV\]|\[<<<\]|\[←\]|\[PREVIOUS\]|'
        r'\[SLIDE:\d+\]|\[GOTO:\d+\]|\[S\d+\]|\[#\d+\]',
        re.IGNORECASE
    )

    def process(self, text: str) -> Tuple[str, List[SlideCommand]]:
        """
        Process text to extract slide commands and clean the text.

        Args:
            text: Input text potentially containing slide markers

        Returns:
            Tuple of (cleaned_text, list_of_commands)
        """
        commands: List[SlideCommand] = []

        # Find all goto commands first (they have slide numbers)
        for match in self.PATTERNS["goto"].finditer(text):
            # Extract slide number from whichever group matched
            slide_num = None
            for group in match.groups():
                if group and group.isdigit():
                    slide_num = int(group)
                    break

            if slide_num:
                commands.append(SlideCommand(
                    action="goto",
                    slide_number=slide_num,
                    position=match.start()
                ))
                logger.debug(f"[SLIDE] Detected GOTO slide {slide_num} at position {match.start()}")

        # Find next commands
        for match in self.PATTERNS["next"].finditer(text):
            commands.append(SlideCommand(
                action="next",
                position=match.start()
            ))
            logger.debug(f"[SLIDE] Detected NEXT at position {match.start()}")

        # Find prev commands
        for match in self.PATTERNS["prev"].finditer(text):
            commands.append(SlideCommand(
                action="prev",
                position=match.start()
            ))
            logger.debug(f"[SLIDE] Detected PREV at position {match.start()}")

        # Sort commands by position (for proper timing if needed)
        commands.sort(key=lambda c: c.position)

        # Strip all markers from text
        cleaned = self.ALL_MARKERS.sub('', text)

        # Clean up extra whitespace that may result from stripping
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        if commands:
            logger.info(f"[SLIDE] Processed text: {len(commands)} command(s) found, stripped markers")

        return cleaned, commands

    def has_commands(self, text: str) -> bool:
        """Quick check if text contains any slide markers."""
        return bool(self.ALL_MARKERS.search(text))


class SlideCommandTTSWrapper:
    """
    Wraps a TTS instance to intercept text, strip slide markers,
    and execute slide commands via callback.

    Usage:
        async def send_command(action, slide_num):
            await room.publish_data(...)

        wrapped_tts = SlideCommandTTSWrapper(
            tts=cartesia_tts,
            command_callback=send_command
        )

        # Use wrapped_tts in AgentSession instead of raw TTS
    """

    def __init__(
        self,
        tts,  # Base TTS instance (Cartesia, Deepgram, etc.)
        command_callback: Callable[[str, Optional[int]], Awaitable[None]],
        processor: Optional[SlideCommandProcessor] = None
    ):
        self.tts = tts
        self.command_callback = command_callback
        self.processor = processor or SlideCommandProcessor()

        # Copy any attributes from the underlying TTS for compatibility
        self._copy_tts_attributes()

    def _copy_tts_attributes(self):
        """Copy common TTS attributes for compatibility."""
        # Copy sample_rate, capabilities, etc. if they exist
        for attr in ['sample_rate', 'capabilities', 'num_channels']:
            if hasattr(self.tts, attr):
                setattr(self, attr, getattr(self.tts, attr))

    async def synthesize(self, text: str, **kwargs):
        """
        Synthesize speech, stripping slide commands first.
        """
        # Process for slide commands
        clean_text, commands = self.processor.process(text)

        # Execute slide commands (don't await - fire and forget for speed)
        for cmd in commands:
            try:
                await self.command_callback(cmd.action, cmd.slide_number)
            except Exception as e:
                logger.error(f"[SLIDE] Failed to execute command {cmd.action}: {e}")

        # Synthesize cleaned text
        if clean_text:
            return await self.tts.synthesize(clean_text, **kwargs)
        return None

    def stream(self, text: str, **kwargs):
        """
        Stream TTS synthesis, stripping slide commands first.
        This is an async generator that yields audio chunks.
        """
        return self._stream_with_commands(text, **kwargs)

    async def _stream_with_commands(self, text: str, **kwargs):
        """Internal async generator for streaming with command handling."""
        import asyncio

        # Process for slide commands
        clean_text, commands = self.processor.process(text)

        # Fire slide commands immediately (non-blocking)
        for cmd in commands:
            asyncio.create_task(self._execute_command(cmd))

        # Stream cleaned text
        if clean_text:
            async for chunk in self.tts.stream(clean_text, **kwargs):
                yield chunk

    async def _execute_command(self, cmd: SlideCommand):
        """Execute a single slide command."""
        try:
            await self.command_callback(cmd.action, cmd.slide_number)
        except Exception as e:
            logger.error(f"[SLIDE] Failed to execute command {cmd.action}: {e}")

    def update_options(self, **kwargs):
        """Pass through to underlying TTS."""
        if hasattr(self.tts, 'update_options'):
            return self.tts.update_options(**kwargs)

    def __getattr__(self, name):
        """Delegate unknown attributes to underlying TTS."""
        return getattr(self.tts, name)


# =============================================================================
# SYSTEM PROMPT ADDITION
# =============================================================================

SLIDE_NAVIGATION_PROMPT = """
## Silent Slide Navigation

You can control the presentation slides using SILENT MARKERS in your speech. These markers are automatically stripped before your voice is synthesized - the student will NEVER hear them.

### Available Markers:
- `[NEXT]` or `[>>>]` - Advance to the next slide
- `[PREV]` or `[<<<]` - Go back to the previous slide
- `[SLIDE:3]` or `[GOTO:3]` - Jump to a specific slide (e.g., slide 3)

### Usage Guidelines:
1. Place markers at natural transition points in your speech
2. You can use multiple markers in one response if needed
3. The marker should come BEFORE the content about that slide

### Examples:

**Moving forward:**
"Excellent work on that exercise! [NEXT] Now, looking at this slide, we can see the grammar rules for the present perfect tense..."

**Going back to clarify:**
"I see you're a bit confused. [PREV] Let me explain that previous point again. Notice how..."

**Jumping to a specific slide:**
"Actually, let me show you something. [SLIDE:5] This slide has a great example of what I mean..."

**Natural conversation without slides:**
"That's a great question! The difference between 'since' and 'for' is..." (no marker needed)

### Important:
- NEVER say "slide" commands out loud - use the markers instead
- Don't say things like "I'm now showing slide 3" - just use [SLIDE:3] and describe the content
- The transitions should feel natural to the student
"""


# For easy testing
if __name__ == "__main__":
    processor = SlideCommandProcessor()

    test_cases = [
        "Great job! [NEXT] Now on this slide, we see the grammar rules.",
        "Let me go back [PREV] to explain that again.",
        "[SLIDE:3] This slide shows the vocabulary list.",
        "Perfect! [>>>] Moving on, we have exercises here.",
        "Let's review [<<<] the previous concept.",
        "[GOTO:5] Here you can see the summary.",
        "Let me show you [SLIDE:2] this example and then [NEXT] the next one.",
        "This sentence has no markers at all.",
        "[S4] Short form marker test.",
        "[#7] Hash form marker test.",
    ]

    print("=" * 70)
    print("SLIDE COMMAND PROCESSOR TEST")
    print("=" * 70)

    for text in test_cases:
        clean, commands = processor.process(text)
        print(f"\nInput:   {text}")
        print(f"Clean:   {clean}")
        print(f"Commands: {[(c.action, c.slide_number) for c in commands]}")
