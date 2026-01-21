"""
Slide & Game Command Processor - Detects and strips silent navigation markers.

The avatar can include these markers in responses to control slides and games without speaking them.
Markers are stripped before TTS so the student never hears them.

Supported Slide Markers:
    [NEXT] or [SLIDE:NEXT] or [>>>]     - Go to next slide
    [PREV] or [BACK] or [<<<]           - Go to previous slide
    [SLIDE:3] or [GOTO:3]               - Go to specific slide number

Supported Game Markers:
    [GAME:NEXT] or [G>>>]               - Go to next game item
    [GAME:PREV] or [G<<<]               - Go to previous game item
    [GAME:3] or [ITEM:3]                - Go to specific game item number
    [GAME:HINT]                         - Show hint for current item

Examples:
    "Great job! [NEXT] Now on this slide, we see..." → speaks "Great job! Now on this slide, we see..."
    "Let me explain that again. [PREV] As you can see here..." → goes back, speaks cleanly
    "Try the next exercise! [GAME:NEXT] Now look at this sentence..." → advances game item
    "Let's go back to that one. [GAME:PREV] Remember the rule we learned..." → goes back in game
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


@dataclass
class GameCommand:
    """Represents a detected game navigation command."""
    action: str  # "next", "prev", "goto", "hint"
    item_index: Optional[int] = None  # Only for "goto" (0-indexed internally)
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


class GameCommandProcessor:
    """
    Detects and strips silent game navigation markers from text.

    Usage:
        processor = GameCommandProcessor()
        clean_text, commands = processor.process("Let's try the next one! [GAME:NEXT] Here we have...")
        # clean_text = "Let's try the next one! Here we have..."
        # commands = [GameCommand(action="next", item_index=None, position=26)]
    """

    # Game markers - these get stripped from text completely
    PATTERNS = {
        # Next game item patterns
        "next": re.compile(
            r'\[GAME:NEXT\]|\[G>>>\]|\[GAME→\]|\[GNEXT\]',
            re.IGNORECASE
        ),
        # Previous game item patterns
        "prev": re.compile(
            r'\[GAME:PREV\]|\[G<<<\]|\[GAME←\]|\[GPREV\]|\[GAME:BACK\]',
            re.IGNORECASE
        ),
        # Goto specific game item patterns - captures the number
        "goto": re.compile(
            r'\[GAME:(\d+)\]|\[ITEM:(\d+)\]|\[G(\d+)\]',
            re.IGNORECASE
        ),
        # Hint pattern
        "hint": re.compile(
            r'\[GAME:HINT\]|\[HINT\]|\[GHINT\]',
            re.IGNORECASE
        ),
    }

    # Combined pattern for stripping all game markers
    ALL_MARKERS = re.compile(
        r'\[GAME:NEXT\]|\[G>>>\]|\[GAME→\]|\[GNEXT\]|'
        r'\[GAME:PREV\]|\[G<<<\]|\[GAME←\]|\[GPREV\]|\[GAME:BACK\]|'
        r'\[GAME:\d+\]|\[ITEM:\d+\]|\[G\d+\]|'
        r'\[GAME:HINT\]|\[HINT\]|\[GHINT\]',
        re.IGNORECASE
    )

    def process(self, text: str) -> Tuple[str, List[GameCommand]]:
        """
        Process text to extract game commands and clean the text.

        Args:
            text: Input text potentially containing game markers

        Returns:
            Tuple of (cleaned_text, list_of_commands)
        """
        commands: List[GameCommand] = []

        # Find all goto commands first (they have item numbers)
        for match in self.PATTERNS["goto"].finditer(text):
            # Extract item number from whichever group matched
            item_num = None
            for group in match.groups():
                if group and group.isdigit():
                    item_num = int(group)
                    break

            if item_num:
                # Convert 1-indexed (user-facing) to 0-indexed (internal)
                commands.append(GameCommand(
                    action="goto",
                    item_index=item_num - 1,
                    position=match.start()
                ))
                logger.debug(f"[GAME] Detected GOTO item {item_num} at position {match.start()}")

        # Find next commands
        for match in self.PATTERNS["next"].finditer(text):
            commands.append(GameCommand(
                action="next",
                position=match.start()
            ))
            logger.debug(f"[GAME] Detected NEXT at position {match.start()}")

        # Find prev commands
        for match in self.PATTERNS["prev"].finditer(text):
            commands.append(GameCommand(
                action="prev",
                position=match.start()
            ))
            logger.debug(f"[GAME] Detected PREV at position {match.start()}")

        # Find hint commands
        for match in self.PATTERNS["hint"].finditer(text):
            commands.append(GameCommand(
                action="hint",
                position=match.start()
            ))
            logger.debug(f"[GAME] Detected HINT at position {match.start()}")

        # Sort commands by position (for proper timing if needed)
        commands.sort(key=lambda c: c.position)

        # Strip all markers from text
        cleaned = self.ALL_MARKERS.sub('', text)

        # Clean up extra whitespace that may result from stripping
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        if commands:
            logger.info(f"[GAME] Processed text: {len(commands)} command(s) found, stripped markers")

        return cleaned, commands

    def has_commands(self, text: str) -> bool:
        """Quick check if text contains any game markers."""
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

### Available Slide Markers:
- `[NEXT]` or `[>>>]` - Advance to the next slide
- `[PREV]` or `[<<<]` - Go back to the previous slide
- `[SLIDE:3]` or `[GOTO:3]` - Jump to a specific slide (e.g., slide 3)

### Usage Guidelines:
1. Place markers at natural transition points in your speech
2. You can use multiple markers in one response if needed
3. The marker should come BEFORE the content about that slide

### Slide Examples:

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

GAME_NAVIGATION_PROMPT = """
## Silent Game Navigation

You can control the interactive game exercises using SILENT MARKERS in your speech. These markers are automatically stripped before your voice is synthesized - the student will NEVER hear them.

### Available Game Markers:
- `[GAME:NEXT]` or `[G>>>]` - Advance to the next exercise/item
- `[GAME:PREV]` or `[G<<<]` - Go back to the previous exercise/item
- `[GAME:3]` or `[ITEM:3]` - Jump to a specific exercise (e.g., exercise 3)
- `[GAME:HINT]` or `[HINT]` - Show a hint for the current exercise

### Usage Guidelines:
1. Place markers at natural transition points when discussing exercises
2. Use `[GAME:NEXT]` when the student completes an exercise correctly
3. Use `[GAME:PREV]` if they need to review an earlier exercise
4. Use `[HINT]` when they're struggling and need help

### Game Examples:

**Moving to next exercise:**
"Perfect! That's exactly right! [GAME:NEXT] Now let's try the next sentence..."

**Going back to practice more:**
"Let's practice that one more time. [GAME:PREV] Look at this sentence again..."

**Jumping to a specific exercise:**
"Let me show you a similar example. [GAME:3] In this exercise, notice how..."

**Providing a hint:**
"I can see you're thinking about this. [HINT] Here's a clue to help you..."

**After completing an exercise:**
"Well done! [GAME:NEXT] Here's your next challenge..."

### Important:
- NEVER say "game" or "exercise" commands out loud - use the markers instead
- Don't say things like "I'm moving to exercise 3" - just use [GAME:3] and continue naturally
- The transitions should feel smooth and encouraging
"""

# Combined prompt for both slides and games
NAVIGATION_PROMPT = SLIDE_NAVIGATION_PROMPT + "\n" + GAME_NAVIGATION_PROMPT


# For easy testing
if __name__ == "__main__":
    slide_processor = SlideCommandProcessor()
    game_processor = GameCommandProcessor()

    print("=" * 70)
    print("SLIDE COMMAND PROCESSOR TEST")
    print("=" * 70)

    slide_test_cases = [
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

    for text in slide_test_cases:
        clean, commands = slide_processor.process(text)
        print(f"\nInput:   {text}")
        print(f"Clean:   {clean}")
        print(f"Commands: {[(c.action, c.slide_number) for c in commands]}")

    print("\n" + "=" * 70)
    print("GAME COMMAND PROCESSOR TEST")
    print("=" * 70)

    game_test_cases = [
        "Perfect! [GAME:NEXT] Now let's try the next sentence.",
        "Let's go back. [GAME:PREV] Look at this one again.",
        "[GAME:3] In this exercise, notice how the words are arranged.",
        "That's tricky! [HINT] Here's a clue for you.",
        "Well done! [G>>>] Here's your next challenge.",
        "[ITEM:5] Let me show you this example.",
        "Great work! [GAME:NEXT] [GAME:NEXT] Let's skip ahead two.",
        "This sentence has no game markers.",
    ]

    for text in game_test_cases:
        clean, commands = game_processor.process(text)
        print(f"\nInput:   {text}")
        print(f"Clean:   {clean}")
        print(f"Commands: {[(c.action, c.item_index) for c in commands]}")
