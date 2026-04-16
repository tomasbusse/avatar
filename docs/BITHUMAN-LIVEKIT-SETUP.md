# Bithuman + Gemini Live + LiveKit — Landing Avatar Setup

Reusable recipe for a public-facing landing-page avatar powered by:

- **Bithuman** — CPU-based local avatar render (no GPU needed, sub-100ms latency)
- **Gemini Live** — realtime voice/LLM (handles STT, reasoning, TTS in one stream)
- **Self-hosted LiveKit** — WebRTC transport (one process per session = isolated, reliable)

This is the exact stack used on simmonds.online. Same recipe works for any Next.js site that can dispatch to a LiveKit Agents worker.

---

## Architecture

```
Browser (Next.js)  →  /api/livekit/landing-token   →  Hetzner LiveKit
     │                      │                              │
     │                      ├─ creates room  landing-<uuid>│
     │                      └─ dispatches "beethoven-teacher" agent
     ▼                                                     ▼
  <LandingAvatarRoom>  ◀─── WebRTC audio+video ───  Python agent worker
                                                     ├─ Bithuman (local CPU render)
                                                     └─ Gemini Live (cloud realtime model)
```

**Key insight:** Bithuman runs locally on the *same server* as the LiveKit agent worker. The CPU load for one session = (Bithuman inference + Gemini Live WebSocket). Concurrency scales linearly with CPU cores available.

---

## 1. Accounts & Keys

1. **Bithuman** — create an account at <https://www.bithuman.ai>, pick or design an avatar figure, note its **figure id** (e.g. `A29JHY3755`), and copy the **API secret** from the developer page.
2. **Google AI Studio** — enable Gemini Live, create a **`GOOGLE_API_KEY`**.
3. **LiveKit self-hosted** — already running on Hetzner (`wss://news.englisch-lehrer.com`). Credentials in `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`.

---

## 2. Environment Variables

Add to **local** (`.env.local`, `apps/agent/.env`) **and Vercel** (all three envs: Production, Preview, Development):

```bash
# Bithuman
BITHUMAN_API_SECRET=...   # required — plugin reads this env var automatically
BITHUMAN_FIGURE_ID=...    # bithuman console figure id → used as avatar_id in plugin
# BITHUMAN_MODEL_PATH=./models/my-avatar.imx   # optional override — path to .imx file
# BITHUMAN_MODEL=expression  # optional — 'essence' or 'expression' runtime variant

# Gemini Live
GOOGLE_API_KEY=...                  # required
GEMINI_VOICE_FEMALE=Aoede           # default female voice
GEMINI_VOICE_MALE=Alnilam           # default male voice
# GEMINI_MODEL=gemini-2.5-flash-native-audio-preview-12-2025  # optional override

# LiveKit (shared across all features)
LIVEKIT_URL=wss://your-livekit.example.com
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit.example.com
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

Push to Vercel with the CLI:

```bash
for env in production preview development; do
  echo -n "$BITHUMAN_API_SECRET" | vercel env add BITHUMAN_API_SECRET $env
  echo -n "$BITHUMAN_FIGURE_ID"  | vercel env add BITHUMAN_FIGURE_ID  $env
  echo -n "$GOOGLE_API_KEY"      | vercel env add GOOGLE_API_KEY      $env
done
```

---

## 3. Python agent (runs on Hetzner next to LiveKit)

### 3.1 Requirements

In `apps/agent/requirements.txt`:

```
livekit-agents>=1.3.7
livekit-plugins-bithuman>=1.2.0
livekit-plugins-google>=1.3.0
```

Then on the Hetzner box:

```bash
cd apps/agent
pip install -r requirements.txt
```

### 3.2 Landing agent module

File: **`apps/agent/src/agents/landing_agent.py`**

- Reads all config from env (no hard-coded creds).
- Auth via `BITHUMAN_API_SECRET` is picked up automatically by the plugin.
- Avatar source priority: `BITHUMAN_MODEL_PATH` (local `.imx`) → `BITHUMAN_FIGURE_ID` (cloud-resolved) → plugin default.

Core code:

```python
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import bithuman, google

session = AgentSession(
    llm=google.beta.realtime.RealtimeModel(
        model="gemini-2.5-flash-native-audio-preview-12-2025",
        voice="Aoede",
        instructions=SYSTEM_PROMPT,
    ),
)

avatar = bithuman.AvatarSession(
    avatar_id="A29JHY3755",     # or model_path="./avatar.imx"
    # model="expression",        # optional runtime variant
)

await avatar.start(session, room=ctx.room)
await session.start(room=ctx.room, agent=Agent(instructions=SYSTEM_PROMPT))
```

### 3.3 Dispatch routing

In `apps/agent/main.py`, route rooms whose name starts with `landing-` to the landing agent — before the lesson/entry-test logic:

```python
if room_name.startswith("landing-"):
    await run_landing_agent(ctx)
    return
```

The single `beethoven-teacher` worker can handle both lesson rooms and landing rooms — the prefix is the switch.

### 3.4 Restart on Hetzner

```bash
# SSH to Hetzner → project → restart the agent process
cd ~/beethoven/apps/agent
pip install -r requirements.txt
sudo systemctl restart beethoven-agent   # or: pm2 restart / docker-compose up -d
```

---

## 4. Next.js — Token route

File: **`app/api/livekit/landing-token/route.ts`**

- **No auth** — landing is public.
- Creates a unique room `landing-<uuid>`, dispatches `beethoven-teacher` (same worker name as lessons).
- Passes system prompt + voice + `BITHUMAN_FIGURE_ID` via dispatch metadata so the agent can personalize.

```ts
const roomName = `landing-${randomUUID()}`;
await roomService.createRoom({ name: roomName, metadata, emptyTimeout: 300, maxParticipants: 3 });
await dispatch.createDispatch(roomName, "beethoven-teacher", { metadata });
const token = await new AccessToken(apiKey, apiSecret, {
  identity: `visitor-${randomUUID()}`,
  name: "Landing Visitor",
  ttl: 15 * 60,
}).addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true }).toJwt();
return { roomName, token, livekitUrl };
```

---

## 5. Next.js — Avatar component

File: **`components/landing/LandingAvatarRoom.tsx`**

Uses `@livekit/components-react` primitives:

```tsx
<LiveKitRoom token={token} serverUrl={serverUrl} connect audio video={false}>
  <RoomAudioRenderer />
  <AvatarVideoDisplay />
  ...controls...
</LiveKitRoom>
```

`AvatarVideoDisplay` uses `useTracks([{ source: Track.Source.Camera }])` and picks the first remote (non-local) video track — that's the Bithuman avatar stream.

---

## 6. Convex schema (optional)

If you store avatars in Convex, add `"bithuman"` to the provider union:

```ts
avatarProvider: v.object({
  type: v.union(
    v.literal("bithuman"),
    v.literal("beyond_presence"),
    v.literal("hedra"),
    v.literal("tavus"),
  ),
  avatarId: v.string(),   // use the bitHuman figure id here
  ...
})
```

Then `npx convex deploy --yes`.

---

## 7. Porting to another website

Everything above is **site-agnostic** except:

| What to change | Where |
| --- | --- |
| System prompt / persona | `DEFAULT_SYSTEM_PROMPT` in `landing_agent.py` — or pass per-request via `systemPrompt` in the token route metadata |
| Gemini voice | `GEMINI_VOICE_FEMALE` / `GEMINI_VOICE_MALE` env vars, or per-request override |
| Bithuman figure | `BITHUMAN_FIGURE_ID` env var (one per environment) or pass `bithumanFigureId` in dispatch metadata to override per-session |
| Room prefix | Change `landing-` in both `main.py` and the token route if you want to run multiple independent products from one worker |

**Shared LiveKit + agent worker:** you can point multiple Vercel sites at the same Hetzner LiveKit + Python agent. Each site just needs its own token route passing its own metadata. The agent routes by the `site` field in dispatch metadata if you need per-site behavior.

---

## 8. Verification checklist

1. `vercel env ls | grep -E "BITHUMAN|GOOGLE_API"` — confirm all three envs have both secrets.
2. Python agent starts cleanly with `pip install -r requirements.txt && python main.py dev` — no import errors for `livekit.plugins.bithuman` or `livekit.plugins.google`.
3. Hit `POST /api/livekit/landing-token` — should return `{ roomName, token, livekitUrl }`.
4. Open the site, click the avatar start button, watch agent logs for `🏠 Landing session detected` and `✅ Landing session ready`.
5. Verify first audio response arrives within ~1.5s of finishing speaking (Gemini Live latency target).

---

## 9. Cost notes

- **LiveKit transport**: $0 (self-hosted on Hetzner).
- **Bithuman**: per plan on bithuman.ai — avatar rendering happens locally, so no per-minute inference cost on their side.
- **Gemini Live**: Google charges per audio-minute in and out — check current AI Studio pricing.
- **Hetzner**: no additional cost; CPU headroom determines concurrent session cap.

To estimate concurrency: `concurrent_sessions ≈ available_CPU_cores / (bithuman_inference_cost_per_session)`. Measure with a single session running, look at `top` on the Hetzner box, then divide available cores.
