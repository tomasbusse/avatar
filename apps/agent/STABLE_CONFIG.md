# Stable AI Avatar Configuration

**Config Name:** `stable-ai-avatar`
**Date:** 2026-01-09
**Status:** Working

## Overview

Simplified 2-participant configuration (1 student + 1 avatar) with reliable screen share and game support.

## Key Settings

### Room Configuration
- `maxParticipants: 2` (student + avatar agent)
- No multi-participant broadcast
- Direct avatar notification only

### Agent Configuration (livekit-agents v1.3.10)
```python
# ChatMessage API (v1.3+)
ChatMessage(role="system", content=[text])  # content must be a LIST

# ChatContext API (v1.3+)
turn_ctx.items.insert(-1, msg)  # use 'items' not 'messages'
```

### Voice Pipeline
- **STT:** Deepgram Nova-3 (endpointing=300ms)
- **TTS:** Cartesia Sonic-3
- **VAD:** Silero VAD
- **Turn Detection:** STT-based

### AgentSession Settings
```python
AgentSession(
    stt=stt,
    tts=tts,
    llm=llm_instance,
    turn_detection="stt",
    min_endpointing_delay=0.2,
    max_endpointing_delay=0.8,
    allow_interruptions=True,
    preemptive_generation=True,
)
```

## What's Working

- Avatar loads once, no reload issues
- Screen share works without stopping avatar
- Game loading works without errors
- Vision enabled (avatar can see screen share)
- Low latency responses

## Key Files

| File | Purpose |
|------|---------|
| `apps/agent/main.py` | Agent logic, ChatMessage/ChatContext fixes |
| `app/api/livekit/token/route.ts` | Room creation, agent dispatch, maxParticipants |
| `components/lesson/teaching-room.tsx` | Simplified 2-participant UI |

## Fixes Applied

1. **ChatMessage API** - Changed from `content=string` to `content=[string]`
2. **ChatContext API** - Changed from `.messages` to `.items`
3. **Agent Dispatch** - Check actual participants before dispatching, delete stale dispatches
4. **Room Config** - maxParticipants: 2
5. **UI Simplified** - Removed multi-participant display and broadcast functions

## To Restore This Config

If something breaks, ensure:
1. `turn_ctx.items.insert()` not `turn_ctx.messages.insert()`
2. `ChatMessage(content=[text])` not `ChatMessage(content=text)`
3. `maxParticipants: 2` in token route
4. No broadcast functions being called
