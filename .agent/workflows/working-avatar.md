---
description: Working Avatar System - How avatars are loaded from admin config to room
---

# Working Avatar System (Fixed 2025-12-30)

## Overview
The avatar system dynamically loads the correct avatar for each room based on the session configuration.

## Flow

1. **Admin Page** (`/admin/avatars`)
   - User clicks "Start Lesson" on an avatar
   - URL: `/lesson/new?avatar={convex_document_id}`

2. **Lesson Page** (`/lesson/[sessionId]/page.tsx`)
   - Creates a session in Convex with `avatarId` (Convex document ID)
   - Generates a unique `roomName`
   - Session stored with: `{ avatarId, roomName, studentId, ... }`

3. **Agent** (`apps/agent/main.py`)
   - Receives room join event from LiveKit
   - Calls `convex.get_session_by_room(room_name)` → gets session with `avatarId`
   - Calls `convex.get_avatar_by_id(avatarId)` → gets full avatar config
   - Extracts `avatar_config["avatar_provider"]["avatar_id"]` (Beyond Presence UUID)
   - Starts Beyond Presence avatar with that UUID

## Key Files

- `apps/agent/main.py` - Agent entrypoint
- `apps/agent/src/utils/convex_client.py` - Convex queries
- `convex/sessions.ts` - Session CRUD (getSessionByRoom)
- `convex/avatars.ts` - Avatar CRUD (getAvatar)
- `app/(dashboard)/lesson/[sessionId]/page.tsx` - Creates session

## Important: Two Types of Avatar IDs

1. **Convex Document ID**: `jd7dfzxxmg2a770srk1m6h72as7y9v90` - Used to reference avatar in database
2. **Beyond Presence UUID**: `1c7a7291-ee28-4800-8f34-acfbfc2d07c0` - Used to start the actual avatar

The agent must convert from Convex ID → Beyond Presence UUID by fetching the avatar document.

## TTS Configuration

- **Cartesia** (default): Use `sonic-english` model for lip-sync compatibility
- **Deepgram Aura**: Use `aura-*` voice IDs (e.g., `aura-asteria-en`)

Voice is loaded from `avatar_config["voice_config"]["voice_id"]`.

## Vision Configuration (Added 2025-12-30)

Vision allows the avatar to see the student's webcam or screen share.

### Schema Fields (in `visionConfig`)
- `enabled`: boolean - Enable/disable vision
- `captureMode`: "smart" | "always" | "on_demand"
- `captureWebcam`: boolean - See student's face
- `captureScreen`: boolean - See slides/documents

### Requirements
- Requires **Gemini model** (google/gemini-*) for vision to work
- Vision config stored in `avatar_config["vision_config"]`

### Agent Usage
```python
vision_config = avatar_config.get("vision_config", {})
if vision_config.get("enabled") and "gemini" in llm_model:
    # Capture frames from student's video tracks
    for participant in room.remote_participants.values():
        for track_pub in participant.track_publications.values():
            if track_pub.track and track_pub.kind == rtc.TrackKind.KIND_VIDEO:
                video_stream = rtc.VideoStream(track_pub.track)
                async for event in video_stream:
                    # Pass event.frame to Gemini as ImageContent
                    break
```

## Debugging

Check agent logs for:
```
DEBUG: Session for {room_name}: {session}
DEBUG: Avatar Config: {avatar_config}
🎯 Admin Config Avatar ID: {beyond_presence_uuid}
🎬 Starting Beyond Presence avatar: {beyond_presence_uuid}
✅ Avatar connected!
```

If avatar fails:
- Check `BEY_API_KEY` in `.env`
- Verify the Beyond Presence avatar ID exists in your Beyond Presence account
- Check avatar is active in Bey dashboard
