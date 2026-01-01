# Minimal Agent Architecture (Responsive & Lip-Syncd)

## Overview
This document describes the minimal working state of the Beethoven Agent, which successfully achieves:
1.  **Responsive Conversation**: Fast turn-taking using Deepgram STT and OpenRouter LLM.
2.  **Lip-Sync Accuracy**: Using Deepgram Aura TTS (native PCM) or Cartesia (with `sonic-english`) to ensure the Beyond Presence avatar can process the audio for lip animations.
3.  **Dynamic Configuration**: Fetching Avatar ID and Voice ID from Convex DB to support user customization.

## Key Components

### 1. Minimal `main.py`
The agent logic is stripped down to the specific `livekit-agents` pipeline without complex pre-warming or custom VAD logic that was causing issues in Python 3.14.

### 2. LLM Fixes (OpenRouter)
The `OpenRouterLLM` implementation had to be patched to match the `ChatChunk` structure of the installed `livekit-agents` library:
- **Issue**: Pydantic validation error `id field required`.
- **Fix**: Flattened `ChatChunk` structure using `id` and `delta` fields directly, rather than the nested `choices` list often used in OpenAI-compatible payloads.

```python
chat_chunk = ChatChunk(
    id=chunk.get("id", str(uuid.uuid4())),
    delta=ChoiceDelta(
        role="assistant",
        content=content,
    )
)
```

### 3. TTS & Lip Sync Strategy
The primary blocker for lip-sync was audio format compatibility between the TTS provider and the Beyond Presence avatar.

*   **Solution**: We implemented a dynamic switch in `main.py`:
    *   **Deepgram Aura**: Used if `voice_id` starts with `aura-`. This provides robust lip-sync out of the box.
    *   **Cartesia**: Used for other IDs. We default to `sonic-english` (approx 24kHz) rather than `sonic-3` (44kHz+) to maximize compatibility with the avatar's audio processor.

### 4. Configuration Flow
1.  **Convex Client**: Fetches `avatars:getDefaultAvatar`.
2.  **Mapping**: Maps camelCase (Convex) to snake_case (Python).
3.  **Dynamic Init**:
    *   **Voice**: Selects TTS provider based on `voice_id`.
    *   **Avatar**: Passes `avatar_id` to `bey.AvatarSession`.

## How to Run
```bash
cd apps/agent
source venv/bin/activate
python main.py dev
```

## Future Re-integration
To return to the full feature set, we should incrementally add:
1.  **Vision**: Capture video frames and pass to LLM (already in `main_backup.py`, just needs clean porting).
2.  **Transcripts**: Re-enable `add_transcript` calls to save conversation history to Convex.
3.  **RAG/Context**: Re-add Convex vector search context to system prompt.
