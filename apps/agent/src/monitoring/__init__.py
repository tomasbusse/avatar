"""
Sentry Integration for Beethoven Agent

Provides:
- Error tracking with custom contexts
- Performance monitoring with distributed tracing
- Custom breadcrumbs for conversation flow
- Metric collection for latency and quality
"""

import os
import logging
import functools
import time
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
from contextlib import contextmanager
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Type variable for decorator
F = TypeVar('F', bound=Callable[..., Any])


@dataclass
class SentryContext:
    """Context manager for Sentry spans and breadcrumbs."""
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    room_name: Optional[str] = None
    avatar_name: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)


class SentryIntegration:
    """
    Sentry integration for the Beethoven agent.
    
    Handles:
    - SDK initialization with BEADS config
    - Distributed tracing across voice pipeline
    - Custom metrics for latency tracking
    - Breadcrumb logging for conversation flow
    """
    
    _instance: Optional['SentryIntegration'] = None
    _initialized: bool = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    
    def __init__(self):
        if SentryIntegration._initialized:
            return
        self._sentry_sdk = None
        self._context = SentryContext()
        self._metrics_enabled = False
        
    def initialize(
        self,
        dsn: Optional[str] = None,
        environment: str = "development",
        release: str = "local",
        traces_sample_rate: float = 1.0,
        profiles_sample_rate: float = 0.5,
        integrations: Optional[List[str]] = None,
        **kwargs
    ) -> bool:
        """Initialize Sentry SDK with configuration."""
        if SentryIntegration._initialized:
            logger.info("🔭 Sentry already initialized")
            return True
            
        dsn = dsn or os.environ.get("SENTRY_DSN")
        if not dsn:
            logger.warning("⚠️ SENTRY_DSN not set - Sentry disabled")
            return False
            
        try:
            import sentry_sdk
            from sentry_sdk.integrations.asyncio import AsyncioIntegration
            from sentry_sdk.integrations.logging import LoggingIntegration
            
            # Build integrations list
            sdk_integrations = [
                AsyncioIntegration(),
                LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
            ]
            
            # Add optional integrations
            if integrations:
                if "httpx" in integrations:
                    try:
                        from sentry_sdk.integrations.httpx import HttpxIntegration
                        sdk_integrations.append(HttpxIntegration())
                    except ImportError:
                        pass
                if "aiohttp" in integrations:
                    try:
                        from sentry_sdk.integrations.aiohttp import AioHttpIntegration
                        sdk_integrations.append(AioHttpIntegration())
                    except ImportError:
                        pass
            
            sentry_sdk.init(
                dsn=dsn,
                environment=environment,
                release=release,
                traces_sample_rate=traces_sample_rate,
                profiles_sample_rate=profiles_sample_rate,
                integrations=sdk_integrations,
                send_default_pii=False,
                **kwargs
            )
            
            self._sentry_sdk = sentry_sdk
            SentryIntegration._initialized = True
            
            logger.info(f"✅ Sentry initialized: env={environment}, release={release}")
            return True
            
        except ImportError:
            logger.warning("⚠️ sentry-sdk not installed - Sentry disabled")
            return False
        except Exception as e:
            logger.error(f"❌ Sentry init failed: {e}")
            return False

            
    def set_context(
        self,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        room_name: Optional[str] = None,
        avatar_name: Optional[str] = None,
        **extra
    ) -> None:
        """Set session context for all subsequent operations."""
        if session_id:
            self._context.session_id = session_id
        if user_id:
            self._context.user_id = user_id
        if room_name:
            self._context.room_name = room_name
        if avatar_name:
            self._context.avatar_name = avatar_name
        self._context.extra.update(extra)
        
        if self._sentry_sdk:
            self._sentry_sdk.set_tag("session_id", session_id or "")
            self._sentry_sdk.set_tag("room_name", room_name or "")
            self._sentry_sdk.set_tag("avatar_name", avatar_name or "")
            if user_id:
                self._sentry_sdk.set_user({"id": user_id})
                
    def capture_exception(self, error: Exception, **extra_context) -> Optional[str]:
        """Capture an exception with additional context."""
        if not self._sentry_sdk:
            logger.error(f"Exception (Sentry disabled): {error}")
            return None
            
        with self._sentry_sdk.push_scope() as scope:
            scope.set_context("session", {
                "session_id": self._context.session_id,
                "room_name": self._context.room_name,
                "avatar_name": self._context.avatar_name,
            })
            for key, value in extra_context.items():
                scope.set_extra(key, value)
            
            return self._sentry_sdk.capture_exception(error)
            
    def capture_message(self, message: str, level: str = "info", **extra) -> Optional[str]:
        """Capture a message with context."""
        if not self._sentry_sdk:
            logger.log(getattr(logging, level.upper(), logging.INFO), message)
            return None
            
        return self._sentry_sdk.capture_message(message, level=level, **extra)
        
    def add_breadcrumb(
        self,
        category: str,
        message: str,
        level: str = "info",
        data: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add a breadcrumb for debugging context."""
        if self._sentry_sdk:
            self._sentry_sdk.add_breadcrumb(
                category=category,
                message=message,
                level=level,
                data=data or {},
            )

            
    @contextmanager
    def start_transaction(self, name: str, op: str = "agent"):
        """Start a Sentry transaction (distributed trace root)."""
        if not self._sentry_sdk:
            yield None
            return
            
        transaction = self._sentry_sdk.start_transaction(name=name, op=op)
        transaction.set_tag("session_id", self._context.session_id or "")
        transaction.set_tag("room_name", self._context.room_name or "")
        
        try:
            yield transaction
        except Exception as e:
            transaction.set_status("internal_error")
            raise
        finally:
            transaction.finish()
            
    @contextmanager
    def start_span(self, op: str, description: str = ""):
        """Start a Sentry span (child of current transaction)."""
        if not self._sentry_sdk:
            yield None
            return
            
        with self._sentry_sdk.start_span(op=op, description=description) as span:
            yield span


class BreadcrumbLogger:
    """
    Convenience class for logging conversation breadcrumbs.
    
    Usage:
        BreadcrumbLogger.user_input("Hello teacher!")
        BreadcrumbLogger.agent_response("text", "Hi! How can I help?")
        BreadcrumbLogger.tool_call("retrieve_lesson", {"lesson_id": "123"})
    """
    
    @staticmethod
    def user_input(text: str, duration_ms: Optional[float] = None) -> None:
        """Log user speech input."""
        sentry = get_sentry()
        sentry.add_breadcrumb(
            category="conversation",
            message=f"User: {text[:100]}{'...' if len(text) > 100 else ''}",
            level="info",
            data={"type": "user_input", "length": len(text), "duration_ms": duration_ms}
        )
        
    @staticmethod
    def agent_response(response_type: str, text: str, latency_ms: Optional[float] = None) -> None:
        """Log agent response."""
        sentry = get_sentry()
        sentry.add_breadcrumb(
            category="conversation",
            message=f"Agent ({response_type}): {text[:100]}{'...' if len(text) > 100 else ''}",
            level="info",
            data={"type": "agent_response", "response_type": response_type, "latency_ms": latency_ms}
        )
        
    @staticmethod
    def tool_call(tool_name: str, params: Dict[str, Any], result: Optional[str] = None) -> None:
        """Log tool/action invocation."""
        sentry = get_sentry()
        sentry.add_breadcrumb(
            category="tool",
            message=f"Tool: {tool_name}",
            level="info",
            data={"tool": tool_name, "params": params, "result": result}
        )
        
    @staticmethod
    def rag_retrieval(query: str, num_chunks: int, latency_ms: float) -> None:
        """Log RAG retrieval."""
        sentry = get_sentry()
        sentry.add_breadcrumb(
            category="rag",
            message=f"RAG: {num_chunks} chunks ({latency_ms:.0f}ms)",
            level="info",
            data={"query": query[:50], "num_chunks": num_chunks, "latency_ms": latency_ms}
        )
        
    @staticmethod
    def vision_analysis(source: str, latency_ms: float) -> None:
        """Log vision model analysis."""
        sentry = get_sentry()
        sentry.add_breadcrumb(
            category="vision",
            message=f"Vision: {source} ({latency_ms:.0f}ms)",
            level="info",
            data={"source": source, "latency_ms": latency_ms}
        )
        
    @staticmethod
    def error(error_type: str, message: str, **data) -> None:
        """Log an error breadcrumb."""
        sentry = get_sentry()
        sentry.add_breadcrumb(
            category="error",
            message=f"{error_type}: {message}",
            level="error",
            data=data
        )



def trace_action(action_name: str, op: str = "agent.action") -> Callable[[F], F]:
    """
    Decorator to trace an action with Sentry spans.
    
    Usage:
        @trace_action("retrieve_lesson", op="agent.rag")
        async def retrieve_lesson(self, lesson_id: str):
            ...
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            sentry = get_sentry()
            start_time = time.time()
            
            with sentry.start_span(op=op, description=action_name) as span:
                try:
                    # Add parameters as span data
                    if span:
                        span.set_data("action", action_name)
                        span.set_data("kwargs", {k: str(v)[:100] for k, v in kwargs.items()})
                    
                    result = await func(*args, **kwargs)
                    
                    # Record success
                    latency_ms = (time.time() - start_time) * 1000
                    if span:
                        span.set_data("latency_ms", latency_ms)
                        span.set_status("ok")
                    
                    BreadcrumbLogger.tool_call(action_name, kwargs, str(result)[:100] if result else None)
                    
                    return result
                    
                except Exception as e:
                    if span:
                        span.set_status("internal_error")
                    sentry.capture_exception(e, action=action_name, kwargs=kwargs)
                    raise
                    
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            sentry = get_sentry()
            start_time = time.time()
            
            with sentry.start_span(op=op, description=action_name) as span:
                try:
                    if span:
                        span.set_data("action", action_name)
                    
                    result = func(*args, **kwargs)
                    
                    latency_ms = (time.time() - start_time) * 1000
                    if span:
                        span.set_data("latency_ms", latency_ms)
                        span.set_status("ok")
                    
                    return result
                    
                except Exception as e:
                    if span:
                        span.set_status("internal_error")
                    sentry.capture_exception(e, action=action_name)
                    raise
                    
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        return sync_wrapper  # type: ignore
        
    return decorator


# Singleton accessor
_sentry_instance: Optional[SentryIntegration] = None


def get_sentry() -> SentryIntegration:
    """Get the Sentry integration singleton."""
    global _sentry_instance
    if _sentry_instance is None:
        _sentry_instance = SentryIntegration()
    return _sentry_instance


def init_sentry_from_beads() -> bool:
    """Initialize Sentry from BEADS configuration."""
    try:
        from src.beads import get_beads_config
        config = get_beads_config()
        
        sentry_config = config.signals.sentry
        if not sentry_config.enabled:
            logger.info("🔭 Sentry disabled in BEADS config")
            return False
            
        sentry = get_sentry()
        return sentry.initialize(
            dsn=sentry_config.dsn,
            environment=sentry_config.environment,
            release=sentry_config.release,
            traces_sample_rate=sentry_config.performance.get("traces_sample_rate", 1.0),
            profiles_sample_rate=sentry_config.performance.get("profiles_sample_rate", 0.5),
            integrations=sentry_config.integrations,
        )
    except Exception as e:
        logger.error(f"❌ Failed to init Sentry from BEADS: {e}")
        return False
