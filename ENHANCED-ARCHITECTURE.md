# Emma AI Platform - Enhanced Architecture

## Key Requirements Update

Based on the latest requirements, we need:

| Requirement | Implementation |
|-------------|----------------|
| **< 1 second latency** | Optimized pipeline, parallel processing, edge deployment |
| **Gemini 2.5 Flash for vision** | Fast multimodal processing for images/video |
| **Individual avatar configuration** | Each avatar with own LLM, voice, personality, rules |
| **Provider abstraction** | Swap Hedra/Beyond Presence/Tavus/future providers |
| **Multi-LLM support** | Route to Claude/GPT-4/Gemini per avatar |
| **Fluent bilingual** | True code-switching, not just fallback German |

---

## Sub-1-Second Latency Architecture

### Latency Budget Breakdown

```
TOTAL BUDGET: < 1000ms

┌──────────────────────────────────────────────────────────────┐
│                    LATENCY PIPELINE                          │
├──────────────────────────────────────────────────────────────┤
│  STT (Deepgram Nova-3)      │  80-120ms  │ Streaming mode    │
│  LLM Processing             │  200-400ms │ Fast models       │
│  TTS First Chunk (Cartesia) │  80-150ms  │ Streaming SSM     │
│  Avatar Render (Hedra)      │  80-100ms  │ < 100ms SLA       │
│  Network (LiveKit)          │  20-50ms   │ Edge routing      │
├──────────────────────────────────────────────────────────────┤
│  TOTAL                      │  460-820ms │ ✅ Under 1 second │
└──────────────────────────────────────────────────────────────┘
```

### Optimization Strategies

1. **Streaming Everything**
   - STT: Stream partial transcripts
   - LLM: Stream tokens as generated
   - TTS: Stream audio chunks
   - Avatar: Render as audio arrives

2. **Parallel Processing**
   - Start TTS before LLM completes (sentence-level)
   - Pre-warm avatar render pipeline
   - Cache common phrases/responses

3. **Fast Model Selection**
   - Primary: Claude 3.5 Haiku (teaching)
   - Vision: Gemini 2.5 Flash (fastest multimodal)
   - Fallback: GPT-4 Turbo (complex reasoning)

4. **Edge Deployment**
   - LiveKit Cloud global edge network
   - Regional avatar worker deployment
   - CDN for static assets

---

## Provider Abstraction Layer

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR                            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ LLM Router  │  │ TTS Router  │  │ Avatar      │             │
│  │             │  │             │  │ Router      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   LLM ADAPTERS  │ │   TTS ADAPTERS  │ │ AVATAR ADAPTERS │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ • Claude        │ │ • Cartesia      │ │ • Hedra         │
│ • OpenAI GPT    │ │ • ElevenLabs    │ │ • Beyond        │
│ • Gemini        │ │ • PlayHT        │ │   Presence      │
│ • OpenRouter    │ │ • OpenAI TTS    │ │ • Tavus         │
│ • DeepSeek      │ │                 │ │ • Synthesia     │
│ • Local (Ollama)│ │                 │ │ • VASA-1 (fut.) │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Provider Interface Definitions

```python
# agent/src/providers/base.py

from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional
from dataclasses import dataclass

# ============================================
# LLM PROVIDER INTERFACE
# ============================================

@dataclass
class LLMConfig:
    """Configuration for an LLM provider"""
    provider: str  # "anthropic", "openai", "gemini", "openrouter"
    model: str     # "claude-3-5-sonnet-20241022", "gpt-4-turbo", etc.
    temperature: float = 0.7
    max_tokens: int = 1024
    api_key: Optional[str] = None
    base_url: Optional[str] = None  # For OpenRouter or custom endpoints
    
    # Advanced settings
    streaming: bool = True
    timeout: float = 30.0
    retry_attempts: int = 3

@dataclass
class LLMMessage:
    role: str  # "system", "user", "assistant"
    content: str | list  # str or multimodal content list

@dataclass
class LLMResponse:
    content: str
    tokens_used: int
    model: str
    latency_ms: float
    finish_reason: str

class LLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    async def complete(
        self,
        messages: list[LLMMessage],
        config: LLMConfig,
    ) -> LLMResponse:
        """Generate a completion (non-streaming)"""
        pass
    
    @abstractmethod
    async def stream(
        self,
        messages: list[LLMMessage],
        config: LLMConfig,
    ) -> AsyncIterator[str]:
        """Stream tokens as they're generated"""
        pass
    
    @abstractmethod
    async def complete_with_vision(
        self,
        messages: list[LLMMessage],
        images: list[bytes],
        config: LLMConfig,
    ) -> LLMResponse:
        """Process messages with images"""
        pass


# ============================================
# TTS PROVIDER INTERFACE
# ============================================

@dataclass
class TTSConfig:
    """Configuration for a TTS provider"""
    provider: str  # "cartesia", "elevenlabs", "openai"
    voice_id: str
    language: str = "en"
    speed: float = 1.0
    pitch: float = 1.0
    
    # Provider-specific
    model: Optional[str] = None  # "sonic-3", "eleven_turbo_v2"
    stability: Optional[float] = None
    similarity_boost: Optional[float] = None

class TTSProvider(ABC):
    """Abstract base class for TTS providers"""
    
    @abstractmethod
    async def synthesize(
        self,
        text: str,
        config: TTSConfig,
    ) -> bytes:
        """Synthesize text to audio (complete)"""
        pass
    
    @abstractmethod
    async def stream(
        self,
        text: str,
        config: TTSConfig,
    ) -> AsyncIterator[bytes]:
        """Stream audio chunks as they're generated"""
        pass
    
    @abstractmethod
    async def get_voices(self) -> list[dict]:
        """List available voices"""
        pass


# ============================================
# AVATAR PROVIDER INTERFACE
# ============================================

@dataclass
class AvatarConfig:
    """Configuration for an avatar provider"""
    provider: str  # "hedra", "beyond_presence", "tavus"
    avatar_id: str
    
    # Video settings
    resolution: str = "1080p"
    fps: int = 30
    background: Optional[str] = None
    
    # Provider-specific
    gestures_enabled: bool = True
    emotion_detection: bool = False
    lip_sync_quality: str = "high"

class AvatarProvider(ABC):
    """Abstract base class for avatar providers"""
    
    @abstractmethod
    async def create_session(
        self,
        config: AvatarConfig,
        room: 'LiveKitRoom',
    ) -> 'AvatarSession':
        """Create an avatar session in a LiveKit room"""
        pass
    
    @abstractmethod
    async def send_audio(
        self,
        session: 'AvatarSession',
        audio: bytes,
    ) -> None:
        """Send audio to the avatar for lip-sync rendering"""
        pass
    
    @abstractmethod
    async def stop_session(
        self,
        session: 'AvatarSession',
    ) -> None:
        """Stop the avatar session"""
        pass
    
    @abstractmethod
    async def interrupt(
        self,
        session: 'AvatarSession',
    ) -> None:
        """Handle interruption (stop current render)"""
        pass


# ============================================
# VISION PROVIDER INTERFACE
# ============================================

@dataclass
class VisionConfig:
    """Configuration for vision processing"""
    provider: str  # "gemini", "openai", "anthropic"
    model: str     # "gemini-2.5-flash", "gpt-4-vision", "claude-3-5-sonnet"
    max_tokens: int = 512
    
    # Processing options
    detail: str = "auto"  # "low", "high", "auto"
    max_image_size: int = 4096

class VisionProvider(ABC):
    """Abstract base class for vision providers"""
    
    @abstractmethod
    async def analyze_image(
        self,
        image: bytes,
        prompt: str,
        config: VisionConfig,
    ) -> str:
        """Analyze an image and return description/response"""
        pass
    
    @abstractmethod
    async def analyze_video_frame(
        self,
        frame: bytes,
        context: str,
        config: VisionConfig,
    ) -> str:
        """Analyze a video frame with context"""
        pass
```

### Provider Implementations

```python
# agent/src/providers/llm/anthropic_provider.py

from anthropic import AsyncAnthropic
from ..base import LLMProvider, LLMConfig, LLMMessage, LLMResponse
import time

class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)
    
    async def complete(
        self,
        messages: list[LLMMessage],
        config: LLMConfig,
    ) -> LLMResponse:
        start = time.time()
        
        response = await self.client.messages.create(
            model=config.model,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            messages=[{"role": m.role, "content": m.content} for m in messages],
        )
        
        return LLMResponse(
            content=response.content[0].text,
            tokens_used=response.usage.input_tokens + response.usage.output_tokens,
            model=config.model,
            latency_ms=(time.time() - start) * 1000,
            finish_reason=response.stop_reason,
        )
    
    async def stream(
        self,
        messages: list[LLMMessage],
        config: LLMConfig,
    ):
        async with self.client.messages.stream(
            model=config.model,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            messages=[{"role": m.role, "content": m.content} for m in messages],
        ) as stream:
            async for text in stream.text_stream:
                yield text
    
    async def complete_with_vision(
        self,
        messages: list[LLMMessage],
        images: list[bytes],
        config: LLMConfig,
    ) -> LLMResponse:
        # Build multimodal content
        content = []
        for img in images:
            import base64
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": base64.b64encode(img).decode(),
                }
            })
        content.append({"type": "text", "text": messages[-1].content})
        
        start = time.time()
        response = await self.client.messages.create(
            model=config.model,
            max_tokens=config.max_tokens,
            messages=[{"role": "user", "content": content}],
        )
        
        return LLMResponse(
            content=response.content[0].text,
            tokens_used=response.usage.input_tokens + response.usage.output_tokens,
            model=config.model,
            latency_ms=(time.time() - start) * 1000,
            finish_reason=response.stop_reason,
        )


# agent/src/providers/llm/gemini_provider.py

import google.generativeai as genai
from ..base import LLMProvider, LLMConfig, LLMMessage, LLMResponse
import time

class GeminiProvider(LLMProvider):
    """Gemini provider - optimized for vision with 2.5 Flash"""
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
    
    async def complete(
        self,
        messages: list[LLMMessage],
        config: LLMConfig,
    ) -> LLMResponse:
        model = genai.GenerativeModel(config.model)
        start = time.time()
        
        # Convert messages to Gemini format
        history = []
        for msg in messages[:-1]:
            history.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [msg.content]
            })
        
        chat = model.start_chat(history=history)
        response = await chat.send_message_async(messages[-1].content)
        
        return LLMResponse(
            content=response.text,
            tokens_used=response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else 0,
            model=config.model,
            latency_ms=(time.time() - start) * 1000,
            finish_reason="stop",
        )
    
    async def stream(
        self,
        messages: list[LLMMessage],
        config: LLMConfig,
    ):
        model = genai.GenerativeModel(config.model)
        response = await model.generate_content_async(
            messages[-1].content,
            stream=True,
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    
    async def complete_with_vision(
        self,
        messages: list[LLMMessage],
        images: list[bytes],
        config: LLMConfig,
    ) -> LLMResponse:
        """
        Gemini 2.5 Flash - FASTEST vision model
        Target: < 200ms for image analysis
        """
        model = genai.GenerativeModel(config.model)  # "gemini-2.5-flash-preview-05-20"
        start = time.time()
        
        # Build multimodal content
        from PIL import Image
        import io
        
        parts = []
        for img_bytes in images:
            img = Image.open(io.BytesIO(img_bytes))
            parts.append(img)
        parts.append(messages[-1].content)
        
        response = await model.generate_content_async(parts)
        
        return LLMResponse(
            content=response.text,
            tokens_used=getattr(response, 'usage_metadata', {}).get('total_token_count', 0),
            model=config.model,
            latency_ms=(time.time() - start) * 1000,
            finish_reason="stop",
        )


# agent/src/providers/llm/openrouter_provider.py

from openai import AsyncOpenAI
from ..base import LLMProvider, LLMConfig, LLMMessage, LLMResponse
import time

class OpenRouterProvider(LLMProvider):
    """
    OpenRouter - Route to 338+ models dynamically
    Supports: Claude, GPT, Gemini, DeepSeek, Qwen, etc.
    """
    
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        )
    
    async def complete(
        self,
        messages: list[LLMMessage],
        config: LLMConfig,
    ) -> LLMResponse:
        start = time.time()
        
        response = await self.client.chat.completions.create(
            model=config.model,  # e.g., "anthropic/claude-3-5-sonnet", "deepseek/deepseek-v3"
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            messages=[{"role": m.role, "content": m.content} for m in messages],
        )
        
        return LLMResponse(
            content=response.choices[0].message.content,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            model=config.model,
            latency_ms=(time.time() - start) * 1000,
            finish_reason=response.choices[0].finish_reason,
        )
    
    async def stream(
        self,
        messages: list[LLMMessage],
        config: LLMConfig,
    ):
        stream = await self.client.chat.completions.create(
            model=config.model,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            stream=True,
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    async def complete_with_vision(
        self,
        messages: list[LLMMessage],
        images: list[bytes],
        config: LLMConfig,
    ) -> LLMResponse:
        import base64
        
        content = []
        for img in images:
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64.b64encode(img).decode()}"
                }
            })
        content.append({"type": "text", "text": messages[-1].content})
        
        start = time.time()
        response = await self.client.chat.completions.create(
            model=config.model,  # "google/gemini-2.5-flash", "openai/gpt-4o"
            max_tokens=config.max_tokens,
            messages=[{"role": "user", "content": content}],
        )
        
        return LLMResponse(
            content=response.choices[0].message.content,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            model=config.model,
            latency_ms=(time.time() - start) * 1000,
            finish_reason=response.choices[0].finish_reason,
        )
```

### Avatar Provider Implementations

```python
# agent/src/providers/avatar/hedra_provider.py

from livekit.plugins import bey as hedra
from ..base import AvatarProvider, AvatarConfig
from livekit.agents.voice import AgentSession

class HedraProvider(AvatarProvider):
    """
    Hedra (via BeyondPresence/Bey SDK)
    - $0.05/min
    - < 100ms latency
    - Native LiveKit integration
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def create_session(
        self,
        config: AvatarConfig,
        room,
    ):
        session = hedra.AvatarSession(
            avatar_id=config.avatar_id,
            # Additional settings
        )
        return session
    
    async def start(
        self,
        session,
        agent_session: AgentSession,
        room,
    ):
        await session.start(agent_session, room=room)
    
    async def send_audio(self, session, audio: bytes):
        # Hedra handles audio automatically through AgentSession
        pass
    
    async def stop_session(self, session):
        await session.stop()
    
    async def interrupt(self, session):
        # Handled via LiveKit RPC
        pass


# agent/src/providers/avatar/beyond_presence_provider.py

from ..base import AvatarProvider, AvatarConfig
import aiohttp

class BeyondPresenceProvider(AvatarProvider):
    """
    Beyond Presence Genesis
    - Higher quality avatars
    - Custom avatar creation
    - < 100ms latency
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.bey.dev"
    
    async def create_session(
        self,
        config: AvatarConfig,
        room,
    ):
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/v1/sessions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "avatar_id": config.avatar_id,
                    "room_name": room.name,
                    "resolution": config.resolution,
                }
            ) as response:
                data = await response.json()
                return data["session_id"]
    
    async def send_audio(self, session_id: str, audio: bytes):
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{self.base_url}/v1/sessions/{session_id}/audio",
                headers={"Authorization": f"Bearer {self.api_key}"},
                data=audio,
            )
    
    async def stop_session(self, session_id: str):
        async with aiohttp.ClientSession() as session:
            await session.delete(
                f"{self.base_url}/v1/sessions/{session_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
    
    async def interrupt(self, session_id: str):
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{self.base_url}/v1/sessions/{session_id}/interrupt",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
```

---

## Individual Avatar Configuration

### Enhanced Avatar Schema

```typescript
// convex/schema.ts - Enhanced avatar table

avatars: defineTable({
  // Identity
  name: v.string(),                    // "Emma", "Dr. Schmidt"
  slug: v.string(),                    // "emma-teacher", "dr-schmidt"
  
  // ============================================
  // PROVIDER CONFIGURATION
  // ============================================
  
  avatarProvider: v.object({
    type: v.union(
      v.literal("hedra"),
      v.literal("beyond_presence"),
      v.literal("tavus"),
      v.literal("synthesia"),
      v.literal("custom")
    ),
    avatarId: v.string(),              // Provider's avatar ID
    apiKeyRef: v.optional(v.string()), // Reference to secrets manager
    settings: v.optional(v.any()),     // Provider-specific settings
  }),
  
  voiceProvider: v.object({
    type: v.union(
      v.literal("cartesia"),
      v.literal("elevenlabs"),
      v.literal("openai"),
      v.literal("playht")
    ),
    voiceId: v.string(),
    language: v.string(),              // Primary language code
    settings: v.object({
      speed: v.number(),               // 0.5 - 2.0
      pitch: v.optional(v.number()),
      stability: v.optional(v.number()),
      similarity: v.optional(v.number()),
    }),
  }),
  
  // ============================================
  // LLM CONFIGURATION (per-avatar!)
  // ============================================
  
  llmConfig: v.object({
    // Primary LLM for teaching
    primary: v.object({
      provider: v.union(
        v.literal("anthropic"),
        v.literal("openai"),
        v.literal("gemini"),
        v.literal("openrouter"),
        v.literal("deepseek")
      ),
      model: v.string(),               // "claude-3-5-sonnet-20241022"
      temperature: v.number(),
      maxTokens: v.number(),
    }),
    
    // Vision LLM (for image/video analysis)
    vision: v.object({
      provider: v.union(
        v.literal("gemini"),           // Preferred: fastest
        v.literal("openai"),
        v.literal("anthropic")
      ),
      model: v.string(),               // "gemini-2.5-flash-preview-05-20"
      maxTokens: v.number(),
    }),
    
    // Optional: Fast model for simple queries
    fast: v.optional(v.object({
      provider: v.string(),
      model: v.string(),               // "claude-3-5-haiku", "gpt-4o-mini"
      temperature: v.number(),
    })),
    
    // Optional: Reasoning model for complex tasks
    reasoning: v.optional(v.object({
      provider: v.string(),
      model: v.string(),               // "o1-preview", "claude-3-opus"
      maxTokens: v.number(),
    })),
  }),
  
  // ============================================
  // PERSONA & PERSONALITY
  // ============================================
  
  persona: v.object({
    role: v.string(),                  // "English Teacher", "Medical Advisor"
    personality: v.string(),           // "Warm, patient, encouraging"
    expertise: v.array(v.string()),    // ["Business English", "Grammar"]
    backstory: v.optional(v.string()), // Bio for context
    
    // Teaching style
    teachingStyle: v.union(
      v.literal("socratic"),           // Ask questions
      v.literal("direct"),             // Give answers
      v.literal("supportive"),         // Encourage exploration
      v.literal("challenging")         // Push limits
    ),
  }),
  
  // ============================================
  // BILINGUAL CONFIGURATION
  // ============================================
  
  bilingualConfig: v.object({
    // Languages this avatar speaks fluently
    languages: v.array(v.object({
      code: v.string(),                // "en", "de", "es"
      proficiency: v.union(
        v.literal("native"),
        v.literal("fluent"),
        v.literal("professional")
      ),
      voiceId: v.optional(v.string()), // Different voice per language
    })),
    
    // Language switching behavior
    switchingMode: v.union(
      v.literal("adaptive"),           // Based on student struggle
      v.literal("code_switching"),     // Natural mixing
      v.literal("strict_separation"),  // Keep languages separate
      v.literal("target_only")         // Only target language
    ),
    
    // When to switch languages
    switchingRules: v.object({
      struggleThreshold: v.number(),   // 1-5, sensitivity
      allowStudentTrigger: v.boolean(),// Student can request switch
      germanForGrammar: v.boolean(),   // German for grammar explanations
      germanForVocabulary: v.boolean(),// German for vocab definitions
    }),
  }),
  
  // ============================================
  // BEHAVIOR RULES (Custom per-avatar)
  // ============================================
  
  behaviorRules: v.object({
    // Response formatting
    maxResponseLength: v.number(),     // Max tokens per response
    preferShortResponses: v.boolean(), // For voice optimization
    
    // Interaction rules
    askQuestionsFrequency: v.union(
      v.literal("always"),
      v.literal("often"),
      v.literal("sometimes"),
      v.literal("rarely")
    ),
    waitForStudentResponse: v.boolean(),
    maxWaitTimeSeconds: v.number(),
    
    // Content rules
    allowedTopics: v.optional(v.array(v.string())),
    prohibitedTopics: v.optional(v.array(v.string())),
    
    // Escalation
    escalateToHumanThreshold: v.optional(v.number()),
    escalationTopics: v.optional(v.array(v.string())),
  }),
  
  // ============================================
  // SYSTEM PROMPTS (Bilingual)
  // ============================================
  
  systemPrompts: v.object({
    // Base personality prompt
    base_en: v.string(),
    base_de: v.optional(v.string()),
    
    // Level-specific adaptations
    levelAdaptations: v.optional(v.object({
      A1: v.optional(v.string()),
      A2: v.optional(v.string()),
      B1: v.optional(v.string()),
      B2: v.optional(v.string()),
      C1: v.optional(v.string()),
      C2: v.optional(v.string()),
    })),
    
    // Context-specific prompts
    contextPrompts: v.optional(v.object({
      greeting: v.optional(v.string()),
      farewell: v.optional(v.string()),
      encouragement: v.optional(v.string()),
      correction: v.optional(v.string()),
      explanation: v.optional(v.string()),
    })),
  }),
  
  // ============================================
  // KNOWLEDGE & RAG
  // ============================================
  
  knowledgeConfig: v.object({
    // Linked knowledge bases
    knowledgeBaseIds: v.array(v.id("knowledgeBases")),
    
    // RAG behavior
    ragEnabled: v.boolean(),
    confidenceThreshold: v.number(),   // 0-1, below = escalate
    citeSources: v.boolean(),          // Mention where info came from
    
    // Avatar-specific knowledge
    specializedKnowledge: v.optional(v.string()), // Extra context
  }),
  
  // ============================================
  // APPEARANCE & BRANDING
  // ============================================
  
  appearance: v.object({
    avatarImage: v.string(),           // Profile image URL
    thumbnailImage: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
  }),
  
  // Status
  isActive: v.boolean(),
  isDefault: v.boolean(),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.id("users")),
})
  .index("by_slug", ["slug"])
  .index("by_active", ["isActive"]),
```

---

## Fluent Bilingual System

### True Code-Switching vs Fallback

```python
# agent/src/bilingual/language_engine.py

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, List
import re

class BilingualMode(Enum):
    ADAPTIVE = "adaptive"           # Switch based on student need
    CODE_SWITCHING = "code_switching"  # Natural language mixing
    STRICT_SEPARATION = "strict_separation"
    TARGET_ONLY = "target_only"

@dataclass
class LanguageContext:
    student_level: str              # A1-C2
    primary_language: str           # "en"
    support_language: str           # "de"
    mode: BilingualMode
    current_topic: str
    struggle_count: int = 0

class BilingualEngine:
    """
    True bilingual engine that enables natural code-switching
    and context-appropriate language mixing.
    """
    
    # Phrases that trigger each language
    GERMAN_TRIGGERS = [
        "auf deutsch",
        "was bedeutet",
        "ich verstehe nicht",
        "kannst du das erklären",
        "hilfe",
        "wie sagt man",
    ]
    
    ENGLISH_TRIGGERS = [
        "in english",
        "let's continue",
        "i understand",
        "got it",
    ]
    
    def __init__(self, config: dict):
        self.mode = BilingualMode(config.get("switchingMode", "adaptive"))
        self.switching_rules = config.get("switchingRules", {})
        self.languages = config.get("languages", [])
    
    def get_language_prompt_section(
        self,
        context: LanguageContext,
    ) -> str:
        """
        Generate the language instruction section of the system prompt
        based on mode and context.
        """
        
        if self.mode == BilingualMode.TARGET_ONLY:
            return self._target_only_prompt(context)
        
        elif self.mode == BilingualMode.STRICT_SEPARATION:
            return self._strict_separation_prompt(context)
        
        elif self.mode == BilingualMode.CODE_SWITCHING:
            return self._code_switching_prompt(context)
        
        else:  # ADAPTIVE
            return self._adaptive_prompt(context)
    
    def _adaptive_prompt(self, context: LanguageContext) -> str:
        """
        Adaptive mode: Start in target language, switch when needed
        """
        level_german_percent = {
            "A1": 70, "A2": 50, "B1": 20, "B2": 5, "C1": 0, "C2": 0
        }
        german_percent = level_german_percent.get(context.student_level, 20)
        
        return f"""
## LANGUAGE ADAPTATION (Adaptive Mode)

Your student is at level {context.student_level}. 

DEFAULT BEHAVIOR:
- Conduct {100 - german_percent}% of the lesson in English
- Use German for {german_percent}% (explanations, encouragement, complex concepts)

WHEN TO USE GERMAN:
1. Student explicitly asks: "Auf Deutsch bitte", "Was bedeutet...?"
2. Student shows confusion: Long pauses, wrong answers, hesitation
3. Complex grammar explanations (if configured)
4. New vocabulary definitions (provide German translation)

WHEN TO RETURN TO ENGLISH:
1. After explaining a concept, always try the English version
2. When student demonstrates understanding
3. When student says "I understand" or "Got it"

CRITICAL RULES:
- Never stay in German for more than 2-3 sentences
- Always provide the English version after German explanation
- Encourage English attempts, even with mistakes
- German is a scaffold, not the default

EXAMPLE INTERACTION:
Student: "Ich verstehe nicht was 'deadline' bedeutet"
Emma: "Kein Problem! 'Deadline' bedeutet 'Abgabetermin' oder 'Frist'. 
       Zum Beispiel: 'The deadline for this project is Friday.'
       Das heißt: 'Die Frist für dieses Projekt ist Freitag.'
       Can you use 'deadline' in a sentence now?"
"""
    
    def _code_switching_prompt(self, context: LanguageContext) -> str:
        """
        Code-switching mode: Natural mixing of languages
        """
        return f"""
## LANGUAGE BEHAVIOR (Code-Switching Mode)

You are a FLUENTLY BILINGUAL teacher who naturally mixes German and English,
just like a real bilingual person would in conversation.

NATURAL CODE-SWITCHING EXAMPLES:
- "So, let's practice the Konjunktiv II - oder wie wir sagen, the conditional."
- "Your pronunciation is getting besser every day!"
- "Remember, 'false friends' like 'Gift' - nicht poison, sondern 'present' auf Englisch."

WHEN TO CODE-SWITCH:
1. When a German word is more precise or familiar
2. For cultural concepts that don't translate well
3. To emphasize important points
4. When the student code-switches to you

BALANCE:
- Target: 70-80% English, 20-30% German naturally mixed
- This feels conversational and authentic
- It models how bilingual speakers actually communicate

DON'T:
- Switch mid-word (awkward)
- Switch every sentence (feels forced)
- Use German for things easily said in English
"""
    
    def _strict_separation_prompt(self, context: LanguageContext) -> str:
        """
        Strict separation: Clear language boundaries
        """
        return f"""
## LANGUAGE BEHAVIOR (Strict Separation Mode)

Keep languages clearly separated. When you need to use German,
announce the switch explicitly.

STRUCTURE:
- Primary instruction: English
- German block: Clearly marked, then back to English

EXAMPLE:
"Let's look at the present perfect tense.

[Auf Deutsch] Das Present Perfect verbindet die Vergangenheit mit der 
Gegenwart. Wir benutzen es für Erfahrungen und Ereignisse, die noch 
relevant sind. [/Auf Deutsch]

Now, in English, let's practice with some examples..."

USE GERMAN FOR:
- Grammar rule explanations (marked blocks)
- Vocabulary definitions (word = Wort)
- Concept clarifications when student is confused
"""
    
    def _target_only_prompt(self, context: LanguageContext) -> str:
        """
        Target-only: Only use target language (English)
        """
        return f"""
## LANGUAGE BEHAVIOR (Target Language Only)

Conduct the ENTIRE lesson in English. Do not use German.

If the student speaks German or asks for German:
- Acknowledge their question in English
- Provide simpler English explanations
- Use examples, gestures descriptions, synonyms
- Break down complex words into simpler ones

EXCEPTION: Life-or-death emergency situations only.

This immersive approach is appropriate for:
- Advanced students (C1/C2)
- Students who requested full immersion
- Specific lesson types designed for immersion
"""
    
    def detect_language_request(self, text: str) -> Optional[str]:
        """
        Detect if student is requesting a language switch
        """
        text_lower = text.lower()
        
        for trigger in self.GERMAN_TRIGGERS:
            if trigger in text_lower:
                return "de"
        
        for trigger in self.ENGLISH_TRIGGERS:
            if trigger in text_lower:
                return "en"
        
        return None
    
    def should_switch_to_german(
        self,
        context: LanguageContext,
        student_response: str,
        response_quality: dict,
    ) -> bool:
        """
        Determine if we should switch to German based on context
        """
        # Direct request
        if self.detect_language_request(student_response) == "de":
            return True
        
        # Check struggle indicators
        struggle_score = 0
        
        if response_quality.get("long_pause", False):
            struggle_score += 1
        
        if response_quality.get("confusion_markers", False):
            struggle_score += 2
        
        if response_quality.get("off_topic", False):
            struggle_score += 1
        
        if response_quality.get("german_words", 0) > 2:
            struggle_score += 1
        
        threshold = self.switching_rules.get("struggleThreshold", 3)
        
        return struggle_score >= threshold
```

### Bilingual Voice Configuration

```python
# agent/src/bilingual/voice_manager.py

from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class BilingualVoice:
    """Voice configuration for bilingual output"""
    english_voice_id: str
    german_voice_id: str
    provider: str
    
    # Voice settings per language
    english_settings: dict
    german_settings: dict
    
class BilingualVoiceManager:
    """
    Manages voice synthesis for bilingual output.
    Can use different voices for different languages.
    """
    
    def __init__(self, config: dict, tts_provider):
        self.provider = tts_provider
        
        # Voice configuration per language
        self.voices: Dict[str, dict] = {}
        
        for lang in config.get("languages", []):
            self.voices[lang["code"]] = {
                "voice_id": lang.get("voiceId") or config.get("voiceId"),
                "settings": lang.get("settings", {}),
            }
    
    async def synthesize(
        self,
        text: str,
        language: str,
    ) -> bytes:
        """
        Synthesize text in the specified language using
        the appropriate voice.
        """
        voice_config = self.voices.get(language, self.voices.get("en"))
        
        return await self.provider.synthesize(
            text=text,
            voice_id=voice_config["voice_id"],
            **voice_config["settings"],
        )
    
    async def synthesize_bilingual(
        self,
        segments: list[dict],  # [{"text": "...", "lang": "en"}, ...]
    ) -> bytes:
        """
        Synthesize a sequence of bilingual segments,
        potentially switching voices between segments.
        """
        audio_chunks = []
        
        for segment in segments:
            audio = await self.synthesize(
                text=segment["text"],
                language=segment["lang"],
            )
            audio_chunks.append(audio)
        
        # Concatenate audio chunks
        return b"".join(audio_chunks)
```

---

## Gemini 2.5 Flash Vision Integration

```python
# agent/src/vision/gemini_vision.py

import google.generativeai as genai
from PIL import Image
import io
import time
from typing import Optional
from dataclasses import dataclass

@dataclass
class VisionAnalysis:
    description: str
    objects_detected: list[str]
    text_detected: Optional[str]
    teaching_context: str
    latency_ms: float

class GeminiVisionProcessor:
    """
    Gemini 2.5 Flash for ultra-fast vision processing.
    Target: < 200ms per image analysis
    """
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
        
        # Teaching-focused analysis prompt
        self.base_prompt = """
You are Emma, an AI English teacher analyzing what your student is showing you.

ANALYZE THIS IMAGE and provide:
1. BRIEF description (1-2 sentences)
2. Key objects/text you see
3. How this relates to the current lesson
4. A natural teaching response

Be conversational, not clinical. You're a teacher, not a robot.
Respond in the language the student is currently using.

CURRENT LESSON CONTEXT: {context}
"""
    
    async def analyze_image(
        self,
        image_bytes: bytes,
        lesson_context: str = "General English practice",
        language: str = "en",
    ) -> VisionAnalysis:
        """
        Analyze an image and return teaching-relevant insights.
        """
        start_time = time.time()
        
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        prompt = self.base_prompt.format(context=lesson_context)
        if language == "de":
            prompt += "\n\nRespond in German (Deutsch)."
        
        # Generate analysis
        response = await self.model.generate_content_async([
            prompt,
            image,
        ])
        
        latency = (time.time() - start_time) * 1000
        
        # Parse response
        return VisionAnalysis(
            description=response.text,
            objects_detected=[],  # Could parse from response
            text_detected=None,   # Could use OCR
            teaching_context=lesson_context,
            latency_ms=latency,
        )
    
    async def analyze_document(
        self,
        image_bytes: bytes,
        analysis_type: str = "grammar",
    ) -> dict:
        """
        Analyze a document (worksheet, essay, etc.) for teaching feedback.
        """
        image = Image.open(io.BytesIO(image_bytes))
        
        prompts = {
            "grammar": """
Analyze this student's written work for grammar errors.
List each error with:
- The error
- Why it's wrong
- The correction
- A brief explanation

Be encouraging but thorough.
""",
            "vocabulary": """
Analyze this image for vocabulary learning opportunities.
Identify words/concepts that could be taught.
Suggest related vocabulary to expand the student's knowledge.
""",
            "pronunciation": """
If there's text visible, identify words that might be 
challenging for German speakers to pronounce.
Note any false friends or common pronunciation pitfalls.
""",
        }
        
        prompt = prompts.get(analysis_type, prompts["grammar"])
        response = await self.model.generate_content_async([prompt, image])
        
        return {
            "analysis": response.text,
            "type": analysis_type,
        }
    
    async def analyze_video_frame(
        self,
        frame_bytes: bytes,
        context: str,
        previous_frames: list[str] = None,
    ) -> str:
        """
        Analyze a video frame with temporal context.
        """
        image = Image.open(io.BytesIO(frame_bytes))
        
        prompt = f"""
Analyze this video frame from a teaching session.
Context: {context}

Previous observations: {previous_frames or 'None'}

What's happening? Any teaching opportunities?
Keep response brief (1-2 sentences) as this is real-time.
"""
        
        response = await self.model.generate_content_async([prompt, image])
        return response.text
```

---

## Complete Avatar Agent Implementation

```python
# agent/src/avatar_agent.py

import os
import asyncio
from typing import Optional, Dict, Any
from dataclasses import dataclass
from livekit.agents import JobContext
from livekit.agents.voice import Agent, AgentSession

from .providers.factory import ProviderFactory
from .bilingual.language_engine import BilingualEngine, LanguageContext, BilingualMode
from .vision.gemini_vision import GeminiVisionProcessor
from .knowledge.rag_engine import RAGEngine
from .slides.slide_controller import SlideController

@dataclass
class AvatarAgentConfig:
    """Complete configuration for an avatar agent instance"""
    avatar_id: str
    avatar_data: dict  # From Convex
    lesson_data: dict
    student_data: dict
    room_name: str

class AvatarAgent:
    """
    Main avatar agent class that orchestrates all components.
    Each avatar has its own configuration for:
    - LLM provider and model
    - Voice provider and settings
    - Avatar provider and settings
    - Bilingual behavior
    - Personality and rules
    """
    
    def __init__(self, config: AvatarAgentConfig):
        self.config = config
        self.avatar = config.avatar_data
        self.lesson = config.lesson_data
        self.student = config.student_data
        
        # Initialize provider factory
        self.providers = ProviderFactory()
        
        # Initialize components based on avatar config
        self._init_llm_providers()
        self._init_voice_provider()
        self._init_avatar_provider()
        self._init_bilingual_engine()
        self._init_vision_processor()
        self._init_rag_engine()
        self._init_slide_controller()
    
    def _init_llm_providers(self):
        """Initialize LLM providers from avatar config"""
        llm_config = self.avatar.get("llmConfig", {})
        
        # Primary LLM (teaching)
        primary = llm_config.get("primary", {})
        self.primary_llm = self.providers.create_llm(
            provider=primary.get("provider", "anthropic"),
            model=primary.get("model", "claude-3-5-sonnet-20241022"),
            temperature=primary.get("temperature", 0.7),
        )
        
        # Vision LLM (Gemini 2.5 Flash)
        vision = llm_config.get("vision", {})
        self.vision_llm = self.providers.create_llm(
            provider=vision.get("provider", "gemini"),
            model=vision.get("model", "gemini-2.5-flash-preview-05-20"),
        )
        
        # Fast LLM (optional - for quick responses)
        if "fast" in llm_config:
            fast = llm_config["fast"]
            self.fast_llm = self.providers.create_llm(
                provider=fast.get("provider"),
                model=fast.get("model"),
            )
        else:
            self.fast_llm = None
    
    def _init_voice_provider(self):
        """Initialize voice provider from avatar config"""
        voice_config = self.avatar.get("voiceProvider", {})
        
        self.voice = self.providers.create_tts(
            provider=voice_config.get("type", "cartesia"),
            voice_id=voice_config.get("voiceId"),
            language=voice_config.get("language", "en"),
            settings=voice_config.get("settings", {}),
        )
    
    def _init_avatar_provider(self):
        """Initialize video avatar provider"""
        avatar_config = self.avatar.get("avatarProvider", {})
        
        self.video_avatar = self.providers.create_avatar(
            provider=avatar_config.get("type", "hedra"),
            avatar_id=avatar_config.get("avatarId"),
            settings=avatar_config.get("settings", {}),
        )
    
    def _init_bilingual_engine(self):
        """Initialize bilingual language engine"""
        bilingual_config = self.avatar.get("bilingualConfig", {})
        self.bilingual = BilingualEngine(bilingual_config)
    
    def _init_vision_processor(self):
        """Initialize Gemini 2.5 Flash vision"""
        self.vision = GeminiVisionProcessor(
            api_key=os.getenv("GEMINI_API_KEY")
        )
    
    def _init_rag_engine(self):
        """Initialize RAG knowledge base"""
        knowledge_config = self.avatar.get("knowledgeConfig", {})
        
        if knowledge_config.get("ragEnabled", True):
            self.rag = RAGEngine(
                knowledge_base_ids=knowledge_config.get("knowledgeBaseIds", []),
                confidence_threshold=knowledge_config.get("confidenceThreshold", 0.7),
            )
        else:
            self.rag = None
    
    def _init_slide_controller(self):
        """Initialize slide controller"""
        if self.lesson.get("slideSetId"):
            self.slides = SlideController(
                slide_set_id=self.lesson["slideSetId"]
            )
        else:
            self.slides = None
    
    def _build_system_prompt(self) -> str:
        """
        Build the complete system prompt from avatar configuration.
        Combines base prompt, level adaptations, bilingual rules, etc.
        """
        prompts = self.avatar.get("systemPrompts", {})
        persona = self.avatar.get("persona", {})
        behavior = self.avatar.get("behaviorRules", {})
        
        # Start with base prompt
        base = prompts.get("base_en", "You are a helpful teaching assistant.")
        
        # Add persona
        prompt = f"""
{base}

## YOUR IDENTITY
Name: {self.avatar.get("name", "Emma")}
Role: {persona.get("role", "English Teacher")}
Personality: {persona.get("personality", "Warm, patient, encouraging")}
Expertise: {", ".join(persona.get("expertise", []))}
Teaching Style: {persona.get("teachingStyle", "supportive")}

## STUDENT CONTEXT
Level: {self.student.get("currentLevel", "B1")}
Name: {self.student.get("name", "Student")}
Preferred explanation language: {self.student.get("preferences", {}).get("explanationLanguage", "german_when_needed")}

## CURRENT LESSON
Topic: {self.lesson.get("title_en", "General Practice")}
Objectives: {", ".join(self.lesson.get("objectives_en", []))}
"""
        
        # Add bilingual rules
        context = LanguageContext(
            student_level=self.student.get("currentLevel", "B1"),
            primary_language="en",
            support_language="de",
            mode=BilingualMode(
                self.avatar.get("bilingualConfig", {}).get("switchingMode", "adaptive")
            ),
            current_topic=self.lesson.get("title_en", ""),
        )
        prompt += self.bilingual.get_language_prompt_section(context)
        
        # Add level-specific adaptations
        level_adaptations = prompts.get("levelAdaptations", {})
        level_prompt = level_adaptations.get(self.student.get("currentLevel", "B1"))
        if level_prompt:
            prompt += f"\n\n## LEVEL-SPECIFIC INSTRUCTIONS\n{level_prompt}"
        
        # Add behavior rules
        prompt += f"""

## BEHAVIOR RULES
- Maximum response length: {behavior.get("maxResponseLength", 150)} words
- Prefer short responses: {behavior.get("preferShortResponses", True)}
- Question frequency: {behavior.get("askQuestionsFrequency", "often")}
- Wait for student response: {behavior.get("waitForStudentResponse", True)}
- Max wait time: {behavior.get("maxWaitTimeSeconds", 10)} seconds
"""
        
        # Add knowledge/RAG instructions
        if self.rag:
            prompt += """

## KNOWLEDGE BASE ACCESS
You have access to a knowledge base. Use the `query_knowledge` tool when:
- Student asks about grammar rules
- Student asks about vocabulary meanings
- You need to verify factual information
- You're explaining cultural concepts

Always cite your sources naturally in conversation.
"""
        
        # Add slide instructions
        if self.slides:
            prompt += """

## SLIDE CONTROL
You can control slides during the lesson:
- Use `next_slide` to advance
- Use `previous_slide` to go back
- Use `change_slide(n)` to jump to slide n
- Naturally reference slide content in your teaching
"""
        
        return prompt
    
    async def start(self, ctx: JobContext):
        """Start the avatar agent in a LiveKit room"""
        
        await ctx.connect()
        
        # Build system prompt
        system_prompt = self._build_system_prompt()
        
        # Create agent with configured LLM
        agent = Agent(
            instructions=system_prompt,
        )
        
        # Create agent session with configured providers
        session = AgentSession(
            llm=self.primary_llm,
            tts=self.voice,
            # STT configured globally or per-avatar
        )
        
        # Register event handlers
        @session.on("user_message")
        async def on_user_message(message: str):
            await self._handle_user_message(message, session)
        
        @ctx.room.on("data_received")
        async def on_data(data: bytes, participant, topic: str):
            if topic == "images":
                await self._handle_image(data, session)
        
        # Start the voice agent
        await session.start(agent=agent, room=ctx.room)
        
        # Start the video avatar
        if self.video_avatar:
            await self.video_avatar.start(session, room=ctx.room)
        
        # Wait for session to end
        await session.wait()
    
    async def _handle_user_message(self, message: str, session: AgentSession):
        """Handle incoming user message with bilingual logic"""
        
        # Check for language switch request
        language_request = self.bilingual.detect_language_request(message)
        if language_request:
            # Update context and notify
            pass
        
        # Check for slide commands
        if self.slides and self._is_slide_command(message):
            await self._handle_slide_command(message, session)
    
    async def _handle_image(self, image_bytes: bytes, session: AgentSession):
        """Handle image upload using Gemini 2.5 Flash"""
        
        # Analyze with Gemini (fast!)
        analysis = await self.vision.analyze_image(
            image_bytes=image_bytes,
            lesson_context=self.lesson.get("title_en", ""),
            language="en",  # or detect from context
        )
        
        # Generate teaching response based on analysis
        # This uses the primary LLM with the vision context
        response = await self.primary_llm.complete([
            {"role": "system", "content": self._build_system_prompt()},
            {"role": "user", "content": f"[Student showed an image: {analysis.description}]\n\nProvide a helpful teaching response about what they showed you."},
        ])
        
        # Speak the response
        await session.say(response.content)
    
    def _is_slide_command(self, message: str) -> bool:
        """Check if message contains slide navigation intent"""
        slide_keywords = [
            "next slide", "previous slide", "go back",
            "nächste folie", "vorherige folie", "zurück",
            "slide", "folie",
        ]
        return any(kw in message.lower() for kw in slide_keywords)
    
    async def _handle_slide_command(self, message: str, session: AgentSession):
        """Handle slide navigation commands"""
        if not self.slides:
            return
        
        if "next" in message.lower() or "nächste" in message.lower():
            await self.slides.next_slide(session.room)
        elif "previous" in message.lower() or "vorherige" in message.lower():
            await self.slides.previous_slide(session.room)
        # ... more commands
```

---

## Provider Factory

```python
# agent/src/providers/factory.py

import os
from typing import Optional
from .llm.anthropic_provider import AnthropicProvider
from .llm.gemini_provider import GeminiProvider
from .llm.openrouter_provider import OpenRouterProvider
from .tts.cartesia_provider import CartesiaProvider
from .avatar.hedra_provider import HedraProvider
from .avatar.beyond_presence_provider import BeyondPresenceProvider

class ProviderFactory:
    """
    Factory for creating provider instances.
    Centralizes API key management and provider instantiation.
    """
    
    def __init__(self):
        # Load API keys from environment
        self.api_keys = {
            "anthropic": os.getenv("ANTHROPIC_API_KEY"),
            "openai": os.getenv("OPENAI_API_KEY"),
            "gemini": os.getenv("GEMINI_API_KEY"),
            "openrouter": os.getenv("OPENROUTER_API_KEY"),
            "cartesia": os.getenv("CARTESIA_API_KEY"),
            "elevenlabs": os.getenv("ELEVENLABS_API_KEY"),
            "hedra": os.getenv("HEDRA_API_KEY"),
            "beyond_presence": os.getenv("BEY_API_KEY"),
        }
        
        # Cache provider instances
        self._llm_cache = {}
        self._tts_cache = {}
        self._avatar_cache = {}
    
    def create_llm(
        self,
        provider: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        """Create an LLM provider instance"""
        cache_key = f"{provider}:{model}"
        
        if cache_key not in self._llm_cache:
            api_key = self.api_keys.get(provider)
            
            if provider == "anthropic":
                self._llm_cache[cache_key] = AnthropicProvider(api_key)
            elif provider == "gemini":
                self._llm_cache[cache_key] = GeminiProvider(api_key)
            elif provider == "openrouter":
                self._llm_cache[cache_key] = OpenRouterProvider(api_key)
            elif provider == "openai":
                from .llm.openai_provider import OpenAIProvider
                self._llm_cache[cache_key] = OpenAIProvider(api_key)
            else:
                raise ValueError(f"Unknown LLM provider: {provider}")
        
        return self._llm_cache[cache_key]
    
    def create_tts(
        self,
        provider: str,
        voice_id: str,
        language: str = "en",
        settings: dict = None,
    ):
        """Create a TTS provider instance"""
        api_key = self.api_keys.get(provider)
        
        if provider == "cartesia":
            return CartesiaProvider(api_key, voice_id, language, settings or {})
        elif provider == "elevenlabs":
            from .tts.elevenlabs_provider import ElevenLabsProvider
            return ElevenLabsProvider(api_key, voice_id, settings or {})
        else:
            raise ValueError(f"Unknown TTS provider: {provider}")
    
    def create_avatar(
        self,
        provider: str,
        avatar_id: str,
        settings: dict = None,
    ):
        """Create an avatar provider instance"""
        api_key = self.api_keys.get(provider)
        
        if provider == "hedra":
            return HedraProvider(api_key)
        elif provider == "beyond_presence":
            return BeyondPresenceProvider(api_key)
        else:
            raise ValueError(f"Unknown avatar provider: {provider}")
```

---

## Updated Environment Variables

```bash
# .env.example

# ============================================
# LIVEKIT
# ============================================
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud

# ============================================
# LLM PROVIDERS (configure per avatar)
# ============================================
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-v1-...

# ============================================
# VOICE PROVIDERS
# ============================================
CARTESIA_API_KEY=your_cartesia_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# ============================================
# AVATAR PROVIDERS
# ============================================
HEDRA_API_KEY=your_hedra_key
BEY_API_KEY=your_beyond_presence_key
TAVUS_API_KEY=your_tavus_key

# ============================================
# SPEECH RECOGNITION
# ============================================
DEEPGRAM_API_KEY=your_deepgram_key

# ============================================
# DATABASE
# ============================================
CONVEX_DEPLOYMENT=your-deployment
CONVEX_URL=https://your-deployment.convex.cloud

# ============================================
# AUTH
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

---

## Summary of Key Changes

| Area | Original | Updated |
|------|----------|---------|
| **Latency Target** | < 2 seconds | **< 1 second** |
| **Vision Model** | Claude 3.5 Sonnet | **Gemini 2.5 Flash** |
| **Avatar Config** | Generic | **Per-avatar individual** |
| **Avatar Providers** | Hedra only | **Abstracted (Hedra, Beyond Presence, etc.)** |
| **LLM Providers** | Claude only | **Per-avatar routing (Claude, GPT, Gemini, OpenRouter)** |
| **Bilingual Mode** | Fallback German | **True code-switching + 4 modes** |
| **Voice per Language** | Single voice | **Different voice per language** |

---

## Next Implementation Steps

1. **Create provider abstraction layer** (`/agent/src/providers/`)
2. **Implement Gemini 2.5 Flash vision** (`/agent/src/vision/`)
3. **Build bilingual engine** (`/agent/src/bilingual/`)
4. **Update Convex schema** with enhanced avatar config
5. **Create AvatarAgent class** that orchestrates everything
6. **Build admin UI** for avatar configuration
7. **Test latency** - target < 1 second end-to-end
