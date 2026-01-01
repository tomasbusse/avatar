# LiveKit Avatar Integration - Debug Guide

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  LiveKit Cloud  │◀────│  Python Agent   │
│  (localhost:3000)│     │  (Germany 2)    │     │  (main.py dev)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   User Camera/Mic        Room Tracks           Beyond Presence
   Video Preview          Audio/Video             Avatar Video
```

## Components

### 1. Python Agent (`apps/agent/main.py`)

**Key Configuration:**
```python
# Agent name for explicit dispatch
WorkerOptions(
    entrypoint_fnc=entrypoint,
    prewarm_fnc=prewarm,
    agent_name="beethoven-teacher",  # Must match token dispatch
)
```

**Beyond Presence Avatar:**
```python
from livekit.plugins import bey

avatar_session = bey.AvatarSession(avatar_id=bey_avatar_id)
await avatar_session.start(session, room=ctx.room)
```

**Environment Variables (apps/agent/.env):**
```
LIVEKIT_URL=wss://james-8d2cxs4p.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
BEY_API_KEY=...
BEY_AVATAR_ID=...
DEEPGRAM_API_KEY=...
OPENROUTER_API_KEY=...
CARTESIA_API_KEY=...
```

### 2. Token API (`app/api/livekit/token/route.ts`)

**Agent Dispatch in Token:**
```typescript
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";

at.roomConfig = new RoomConfiguration({
  agents: [
    new RoomAgentDispatch({
      agentName: "beethoven-teacher",  // Must match Python agent_name
    }),
  ],
});
```

### 3. Frontend Components

**LessonRoom (`components/lesson/lesson-room.tsx`):**
```typescript
import { useVoiceAssistant } from "@livekit/components-react";

// Get avatar video track (handles worker participant mapping)
const { videoTrack: avatarVideoTrack, agent } = useVoiceAssistant();

// Get local camera for preview
const localTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
const localVideoTrack = localTracks.find(
  (track) => track.participant.identity === localParticipant.identity
);
```

## How Avatar Video Works

Beyond Presence creates **two participants** in the room:

1. **Agent Participant** - The Python logic runner (no video)
2. **Avatar Worker** - Beyond Presence bot that publishes video

The Avatar Worker has attribute: `lk.publish_on_behalf = <agent_identity>`

**useVoiceAssistant** hook automatically finds this mapping.

## Running the System

### Terminal 1: Convex
```bash
cd /Users/tomas/apps/beethoven
npx convex dev
```

### Terminal 2: Next.js
```bash
cd /Users/tomas/apps/beethoven
npm run dev
```

### Terminal 3: Python Agent
```bash
cd /Users/tomas/apps/beethoven/apps/agent
source venv/bin/activate
set -a && source .env && set +a
python main.py dev
```

## Expected Log Output

### Python Agent (successful connection):
```
INFO livekit.agents - starting worker {"version": "1.2.18"}
INFO livekit.agents - registered worker {"id": "AW_xxx", "region": "Germany 2"}
INFO beethoven-agent - Agent starting for room: lesson-xxx
INFO beethoven-agent - 🟢 PARTICIPANT CONNECTED: user_xxx
INFO beethoven-agent - ✅ TRACK SUBSCRIBED ... KIND_AUDIO 🎤
INFO beethoven-agent - Beyond Presence avatar connected: xxx
```

### Browser Console (successful connection):
```
🎤 LOCAL TRACK PUBLISHED: {kind: "audio", source: "microphone"}
🎤 LOCAL TRACK PUBLISHED: {kind: "video", source: "camera"}
✅ REMOTE TRACK SUBSCRIBED: {participantIdentity: "bey-avatar-agent", kind: "video"}
```

## Debugging Checklist

### Avatar Not Appearing

1. **Check Python agent is running:**
   ```bash
   ps aux | grep "python main.py"
   ```

2. **Check agent registered with correct name:**
   Look for: `registered worker {"id": "AW_xxx"}`

3. **Check agent receives dispatch:**
   Look for: `Agent starting for room: lesson-xxx`

4. **Check Beyond Presence connects:**
   Look for: `Beyond Presence avatar connected`

5. **Check frontend receives video track:**
   Browser console: `✅ REMOTE TRACK SUBSCRIBED ... kind: "video"`

### Agent Not Joining Room

1. **Verify agent_name matches:**
   - Python: `agent_name="beethoven-teacher"`
   - Token: `agentName: "beethoven-teacher"`

2. **Check token includes RoomAgentDispatch:**
   ```typescript
   at.roomConfig = new RoomConfiguration({
     agents: [new RoomAgentDispatch({ agentName: "beethoven-teacher" })]
   });
   ```

### Audio Not Working

1. **Check browser permissions:** Allow microphone
2. **Check track published:** `🎤 LOCAL TRACK PUBLISHED: {kind: "audio"}`
3. **Check agent subscribed:** `✅ TRACK SUBSCRIBED ... KIND_AUDIO`
4. **Check Deepgram API key is valid**

## Key Files

| File | Purpose |
|------|---------|
| `apps/agent/main.py` | Python agent entry point |
| `apps/agent/.env` | Agent environment variables |
| `app/api/livekit/token/route.ts` | Token generation with agent dispatch |
| `components/lesson/lesson-room.tsx` | Main lesson UI with avatar video |
| `components/lesson/teaching-room.tsx` | Presentation mode UI |

## API Keys Required

| Service | Env Variable | Used For |
|---------|--------------|----------|
| LiveKit | `LIVEKIT_API_KEY/SECRET` | Room access |
| Beyond Presence | `BEY_API_KEY` | Avatar video |
| Deepgram | `DEEPGRAM_API_KEY` | Speech-to-text |
| Cartesia | `CARTESIA_API_KEY` | Text-to-speech |
| OpenRouter | `OPENROUTER_API_KEY` | LLM responses |

## Current Status

- [x] Agent dispatch configured
- [x] Token includes RoomAgentDispatch
- [x] Frontend uses useVoiceAssistant for avatar track
- [x] Local camera preview working
- [x] TTS preview fixed (sonic-english model)
- [ ] End-to-end test: User speaks → Agent responds with avatar video

## Next Debug Steps

1. Join a lesson and check browser console for track events
2. Check Python agent terminal for participant/track logs
3. Verify Beyond Presence avatar session starts
4. If no avatar video, check `agent` from useVoiceAssistant is not null
