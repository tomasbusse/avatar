"""
RLM-Claude: Deep Codebase Analysis for Beethoven

Provides:
- BeethovenRLM: Main class for codebase queries
- CodebaseIndexer: Indexes files for efficient analysis
- ClaudeMdGenerator: Auto-generates CLAUDE.md
- RLMAgent: Agent integration for voice/chat
- SmartRouter: Routes questions to appropriate handler
"""

from .core import BeethovenRLM
from .indexer import CodebaseIndexer
from .generator import ClaudeMdGenerator
from .agent import (
    RLMAgent,
    SmartRouter,
    AgentResponse,
    should_use_rlm,
    get_rlm_agent,
    ask_rlm,
    ask_rlm_sync,
)

__all__ = [
    # Core
    "BeethovenRLM",
    "CodebaseIndexer", 
    "ClaudeMdGenerator",
    # Agent
    "RLMAgent",
    "SmartRouter",
    "AgentResponse",
    "should_use_rlm",
    "get_rlm_agent",
    "ask_rlm",
    "ask_rlm_sync",
]

__version__ = "0.1.0"
