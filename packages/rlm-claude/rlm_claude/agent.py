"""
RLM Agent Integration - Call RLM from the Beethoven voice agent

Provides:
- RLMAgent: Standalone agent that uses RLM for deep analysis
- Integration helpers for the main Beethoven agent
"""

import os
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


@dataclass
class AgentResponse:
    """Response from the RLM agent."""
    answer: str
    thinking_time: float
    tokens_used: int
    cost: float
    source: str = "rlm"


class RLMAgent:
    """
    Standalone RLM-powered agent for deep analysis tasks.
    
    Can be called from:
    - Beethoven voice agent (for complex questions)
    - CLI
    - API endpoints
    """
    
    def __init__(
        self,
        project_root: Optional[Path] = None,
        model: str = "anthropic/claude-sonnet-4.5",
    ):
        self.project_root = Path(project_root or "/Users/tomas/apps/beethoven")
        self.model = model
        self._rlm = None
    
    def _get_rlm(self):
        """Lazy load RLM instance."""
        if self._rlm is None:
            from .core import BeethovenRLM
            self._rlm = BeethovenRLM(
                project_root=self.project_root,
                model=self.model,
                verbose=False,  # Quiet for agent use
            )
        return self._rlm
    
    async def answer(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """
        Answer a question using RLM deep analysis.
        
        Args:
            question: The question to answer
            context: Optional context (e.g., current lesson, student info)
            
        Returns:
            AgentResponse with the answer
        """
        rlm = self._get_rlm()
        
        # Add context to the question if provided
        full_question = question
        if context:
            context_str = "\n".join(f"- {k}: {v}" for k, v in context.items())
            full_question = f"Context:\n{context_str}\n\nQuestion: {question}"
        
        # Run in thread pool (RLM is sync)
        result = await asyncio.to_thread(rlm.query, full_question)
        
        return AgentResponse(
            answer=result.answer,
            thinking_time=result.execution_time,
            tokens_used=result.input_tokens + result.output_tokens,
            cost=result.estimated_cost,
        )
    
    def answer_sync(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """Synchronous version of answer()."""
        rlm = self._get_rlm()
        
        full_question = question
        if context:
            context_str = "\n".join(f"- {k}: {v}" for k, v in context.items())
            full_question = f"Context:\n{context_str}\n\nQuestion: {question}"
        
        result = rlm.query(full_question)
        
        return AgentResponse(
            answer=result.answer,
            thinking_time=result.execution_time,
            tokens_used=result.input_tokens + result.output_tokens,
            cost=result.estimated_cost,
        )


# === Integration with Beethoven Agent ===

def should_use_rlm(question: str) -> bool:
    """
    Determine if a question should be routed to RLM for deep analysis.
    
    Returns True for questions that need:
    - Code understanding
    - Architecture explanation
    - Multi-file analysis
    - Historical context
    """
    # Keywords that suggest deep analysis is needed
    deep_analysis_keywords = [
        "how does",
        "explain the architecture",
        "what files",
        "where is",
        "find the code",
        "analyze",
        "all the",
        "every",
        "complete",
        "entire",
        "full",
        "whole codebase",
        "across the project",
        "implementation",
        "how is.*implemented",
        "flow",
        "pipeline",
        "trace",
        "debug",
    ]
    
    question_lower = question.lower()
    
    for keyword in deep_analysis_keywords:
        if keyword in question_lower:
            return True
    
    # Questions about specific technical concepts
    technical_terms = [
        "convex", "livekit", "zep", "cartesia", "deepgram",
        "authentication", "session", "database", "schema",
        "component", "hook", "api", "endpoint", "websocket"
    ]
    
    for term in technical_terms:
        if term in question_lower and ("how" in question_lower or "what" in question_lower):
            return True
    
    return False


class SmartRouter:
    """
    Routes questions to the appropriate handler:
    - Simple questions → Fast LLM (OpenRouter)
    - Complex/code questions → RLM (deep analysis)
    - Personal questions → Zep (memory)
    """
    
    def __init__(self):
        self._rlm_agent: Optional[RLMAgent] = None
    
    def _get_rlm_agent(self) -> RLMAgent:
        """Lazy load RLM agent."""
        if self._rlm_agent is None:
            self._rlm_agent = RLMAgent()
        return self._rlm_agent
    
    async def route(
        self,
        question: str,
        fast_llm_handler,
        zep_retriever=None,
        context: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """
        Route a question to the appropriate handler.
        
        Args:
            question: The user's question
            fast_llm_handler: Function to call for simple questions
            zep_retriever: Optional Zep retriever for memory queries
            context: Optional context dict
            
        Returns:
            AgentResponse
        """
        import time
        start = time.time()
        
        # Check if this needs deep analysis
        if should_use_rlm(question):
            rlm = self._get_rlm_agent()
            return await rlm.answer(question, context)
        
        # Check if this is a memory query
        memory_keywords = ["remember", "last time", "previously", "before", "told you"]
        if zep_retriever and any(kw in question.lower() for kw in memory_keywords):
            # Use Zep for memory retrieval
            facts = await zep_retriever.search(question)
            if facts:
                # Combine with fast LLM for response
                context_with_memory = context or {}
                context_with_memory["memory"] = facts
                answer = await fast_llm_handler(question, context_with_memory)
                return AgentResponse(
                    answer=answer,
                    thinking_time=time.time() - start,
                    tokens_used=0,  # Unknown
                    cost=0.001,  # Estimate
                    source="zep+llm",
                )
        
        # Default: use fast LLM
        answer = await fast_llm_handler(question, context)
        return AgentResponse(
            answer=answer,
            thinking_time=time.time() - start,
            tokens_used=0,
            cost=0.001,
            source="fast_llm",
        )


# === Convenience Functions ===

_default_agent: Optional[RLMAgent] = None

def get_rlm_agent() -> RLMAgent:
    """Get the default RLM agent singleton."""
    global _default_agent
    if _default_agent is None:
        _default_agent = RLMAgent()
    return _default_agent


async def ask_rlm(question: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Simple async function to ask RLM a question.
    
    Usage:
        answer = await ask_rlm("How does the voice pipeline work?")
    """
    agent = get_rlm_agent()
    response = await agent.answer(question, context)
    return response.answer


def ask_rlm_sync(question: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Simple sync function to ask RLM a question.
    
    Usage:
        answer = ask_rlm_sync("How does authentication work?")
    """
    agent = get_rlm_agent()
    response = agent.answer_sync(question, context)
    return response.answer
