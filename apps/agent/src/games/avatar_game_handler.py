"""Avatar Game Handler - Integrates games with avatar conversation.

This module shows how to detect game triggers in conversation
and manage game state during a lesson session.

Example flow:
1. Student asks to play a game or teacher triggers one
2. Avatar loads game and starts explaining
3. During game, avatar context includes game state
4. Avatar evaluates answers and gives feedback
5. Game ends with celebration/summary
"""

import logging
import re
from typing import Optional, Tuple, List

from .game_context import GameContextManager, GameState

logger = logging.getLogger("beethoven-agent.avatar-game-handler")


class AvatarGameHandler:
    """Handles game-related interactions for the avatar.

    This class:
    - Detects when student wants to play a game
    - Manages game lifecycle
    - Generates context for LLM prompts
    - Processes student answers
    """

    # Trigger phrases that indicate student wants to play a game
    GAME_TRIGGERS_EN = [
        r"play\s+(?:a\s+)?game",
        r"let'?s\s+play",
        r"can\s+we\s+play",
        r"start\s+(?:a\s+)?game",
        r"want\s+to\s+play",
        r"do\s+(?:an?\s+)?exercise",
        r"practice\s+(?:with\s+)?(?:a\s+)?game",
    ]

    GAME_TRIGGERS_DE = [
        r"spiel(?:en)?",
        r"lass\s+uns\s+spielen",
        r"können\s+wir\s+spielen",
        r"übung(?:en)?",
        r"quiz",
    ]

    # Hint request patterns
    HINT_TRIGGERS = [
        r"(?:give\s+me\s+a\s+)?hint",
        r"help\s+(?:me)?",
        r"i'?m\s+stuck",
        r"don'?t\s+know",
        r"keine\s+ahnung",
        r"hilf(?:e)?\s+mir",
        r"tipp",
    ]

    # Skip/quit patterns
    SKIP_TRIGGERS = [
        r"skip\s+(?:this)?",
        r"next\s+(?:one|question)",
        r"move\s+on",
        r"überspringen",
        r"nächste",
    ]

    QUIT_TRIGGERS = [
        r"quit\s+(?:the\s+)?game",
        r"stop\s+(?:the\s+)?game",
        r"end\s+(?:the\s+)?game",
        r"i'?m\s+done",
        r"aufhören",
        r"stopp?",
    ]

    def __init__(self, convex_client):
        self.game_manager = GameContextManager(convex_client)
        self.convex = convex_client
        self._pending_game_id: Optional[str] = None

    async def process_message(
        self,
        user_message: str,
        available_games: Optional[List[dict]] = None
    ) -> Tuple[str, Optional[dict]]:
        """Process user message for game-related intents.

        Returns:
            Tuple of (action_type, action_data)

            action_type can be:
            - "none": No game action needed
            - "start_game": Should start a game
            - "answer": Student gave an answer
            - "hint": Student requested a hint
            - "skip": Student wants to skip
            - "quit": Student wants to quit
            - "game_complete": Game just finished

        The avatar uses action_type to decide how to respond.
        """
        msg_lower = user_message.lower().strip()

        # If game is active, check for game-specific actions
        if self.game_manager.is_game_active():
            # Check for quit
            if self._matches_pattern(msg_lower, self.QUIT_TRIGGERS):
                summary = self.game_manager.end_game()
                return ("quit", summary)

            # Check for skip
            if self._matches_pattern(msg_lower, self.SKIP_TRIGGERS):
                # Move to next item without counting as wrong
                self.game_manager._advance_to_next_item()
                return ("skip", {"next_item": self.game_manager.current_game.current_item})

            # Check for hint request
            if self._matches_pattern(msg_lower, self.HINT_TRIGGERS):
                hint = self.game_manager.use_hint()
                return ("hint", {"hint": hint})

            # Check if game is complete
            if self.game_manager.current_game.current_item_index >= self.game_manager.current_game.total_items:
                summary = self.game_manager.get_game_summary()
                self.game_manager.end_game()
                return ("game_complete", summary)

            # Otherwise, treat as answer
            feedback = self.game_manager.evaluate_answer(user_message)
            return ("answer", feedback)

        # No active game - check for game start triggers
        if self._matches_pattern(msg_lower, self.GAME_TRIGGERS_EN + self.GAME_TRIGGERS_DE):
            # Find a suitable game from available games
            game_to_start = await self._select_game(available_games, msg_lower)
            if game_to_start:
                return ("start_game", {"game_id": game_to_start["_id"], "game": game_to_start})

        return ("none", None)

    def _matches_pattern(self, text: str, patterns: List[str]) -> bool:
        """Check if text matches any of the patterns."""
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    async def _select_game(
        self,
        available_games: Optional[List[dict]],
        user_message: str
    ) -> Optional[dict]:
        """Select an appropriate game based on context."""
        if not available_games:
            # Fetch from Convex if not provided
            available_games = await self.convex.query(
                "wordGames:listGames",
                {"status": "published", "limit": 10}
            )

        if not available_games:
            return None

        # Try to match game type from user message
        type_keywords = {
            "sentence": "sentence_builder",
            "fill": "fill_in_blank",
            "blank": "fill_in_blank",
            "match": "matching_pairs",
            "scramble": "word_scramble",
            "choice": "multiple_choice",
            "quiz": "multiple_choice",
            "flash": "flashcards",
            "hangman": "hangman",
            "crossword": "crossword",
        }

        for keyword, game_type in type_keywords.items():
            if keyword in user_message.lower():
                matching = [g for g in available_games if g.get("type") == game_type]
                if matching:
                    return matching[0]

        # Default: return first available game
        return available_games[0]

    async def start_game(self, game_id: str, session_id: Optional[str] = None) -> GameState:
        """Start a game and return initial state."""
        state = await self.game_manager.load_game(game_id, session_id)

        # Record game session in Convex
        if session_id:
            await self.convex.mutation(
                "wordGames:startGameSession",
                {
                    "gameId": game_id,
                    "sessionId": session_id,
                }
            )

        return state

    def get_game_context_for_prompt(self) -> str:
        """Get current game context to inject into LLM prompt.

        Call this before each LLM inference to include game state.
        """
        return self.game_manager.get_conversation_context()

    def is_game_active(self) -> bool:
        """Check if a game is currently running."""
        return self.game_manager.is_game_active()

    def get_current_game(self) -> Optional[GameState]:
        """Get current game state."""
        return self.game_manager.current_game


# ============================================
# EXAMPLE USAGE IN MAIN AGENT
# ============================================

"""
Example integration in main.py:

```python
from src.games import AvatarGameHandler, get_game_context

class BeethovenAgent:
    def __init__(self, convex_client):
        self.convex = convex_client
        self.game_handler = AvatarGameHandler(convex_client)

    async def handle_user_message(self, message: str) -> str:
        # 1. Check for game-related actions
        action_type, action_data = await self.game_handler.process_message(message)

        if action_type == "start_game":
            # Start the game
            game = await self.game_handler.start_game(action_data["game_id"])
            # Avatar introduces the game
            return f"Let's play {game.title}! {game.instructions}"

        elif action_type == "answer":
            # Student answered - generate appropriate response
            if action_data["correct"]:
                return action_data["celebration"]
            else:
                hint = action_data.get("hint")
                if hint:
                    return f"{action_data['encouragement']} Here's a hint: {hint}"
                return action_data["encouragement"]

        elif action_type == "hint":
            if action_data["hint"]:
                return f"Here's a hint: {action_data['hint']}"
            return "Sorry, no more hints available. You can do this!"

        elif action_type == "skip":
            return "Okay, let's try the next one!"

        elif action_type == "quit":
            summary = action_data
            return f"{summary['celebration_message']} You got {summary['correct_answers']} out of {summary['total_items']} correct!"

        elif action_type == "game_complete":
            summary = action_data
            return f"🎉 Game complete! {summary['celebration_message']}"

        # 2. No game action - proceed with normal LLM response
        # Include game context if game is active
        extra_context = self.game_handler.get_game_context_for_prompt()

        # Generate LLM response with game context
        response = await self.llm.generate(
            message=message,
            system_prompt=self.base_prompt + extra_context
        )

        return response
```

The key integration points are:
1. Call process_message() on every user message
2. Handle game actions (start, answer, hint, skip, quit, complete)
3. Include get_game_context_for_prompt() in LLM system prompt
4. Sync game state to Convex for persistence
"""
