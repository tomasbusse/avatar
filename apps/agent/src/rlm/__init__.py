"""
RLM - Reasoning Language Model

Provides structured reasoning capabilities for the Beethoven agent:
- Chain-of-Thought (CoT) reasoning
- Step-Back Prompting
- Self-Consistency
- ReAct pattern

Integrates with Sentry for performance monitoring.
"""

import logging
import time
from enum import Enum
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


class ReasoningMode(Enum):
    """Available reasoning modes."""
    CHAIN_OF_THOUGHT = "chain_of_thought"
    STEP_BACK = "step_back"
    SELF_CONSISTENCY = "self_consistency"
    REACT = "react"
    DIRECT = "direct"  # No reasoning, direct response


@dataclass
class ReasoningResult:
    """Result of a reasoning operation."""
    query: str
    mode: ReasoningMode
    reasoning_steps: List[str] = field(default_factory=list)
    conclusion: str = ""
    confidence: float = 0.0
    latency_ms: float = 0.0
    tokens_used: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
