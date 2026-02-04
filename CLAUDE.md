# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Beethoven (Emma AI Platform)** is an AI-powered language learning platform that uses photorealistic AI avatar teachers to provide personalized English lessons to German speakers. The platform features real-time voice/video conversations with AI avatars that can code-switch between English and German, synchronized slide presentations, and sub-1-second response latency.

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Convex (real-time database with serverless functions)
- **Authentication**: Clerk
- **Real-time Communication**: LiveKit (WebRTC for audio/video)
- **AI Avatar Backend**: Python (LiveKit Agents SDK v1.3.7+)
- **Avatar Providers**: Beyond Presence, Hedra (abstracted, swappable)
- **Voice**: Cartesia Sonic-3 TTS, Deepgram Nova-3 STT
- **LLM**: Multi-provider (OpenRouter, Anthropic, OpenAI, Groq, Cerebras)
- **Vision**: Gemini Flash (< 200ms for image analysis)
- **RAG**: Zep Cloud for retrieval-augmented generation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend (Web App)                                 │
│  - Student dashboard, lesson UI, progress tracking          │
│  - LiveKit Client SDK (WebRTC)                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ WebRTC
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  LiveKit Cloud (Real-time Infrastructure)                   │
│  - Audio/Video routing, < 50ms edge network                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Python Agent (apps/agent/)                                 │
│  - Avatar orchestration, bilingual engine                   │
│  - STT (Deepgram) → LLM → TTS (Cartesia) → Avatar          │
│  - Target latency: < 1 second total pipeline                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Convex (Database + Backend)                                │
│  - Real-time sync, serverless functions                     │
│  - Avatar configs, lessons, student progress                │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Provider Abstraction**: All AI services (LLM, TTS, Avatar) use abstracted providers that can be swapped without code changes
2. **Per-Avatar Configuration**: Each avatar has individual LLM, voice, personality, and bilingual settings stored in Convex
3. **Sub-Second Latency**: Entire pipeline optimized for < 1 second response time via streaming at every stage
4. **True Bilingual**: Code-switching engine supports 4 modes (adaptive, code_switching, strict_separation, target_only)
5. **Real-time Sync**: Convex provides real-time database sync to frontend

## Common Development Tasks

### Running the Application Locally

```bash
# Install dependencies
npm install

# Start Convex backend (in one terminal)
npm run convex:dev

# Start Next.js frontend (in another terminal)
npm run dev

# Access at http://localhost:3000
```

### Python Agent Server

The Python agent is located in `apps/agent/` (requires Python ≤3.13).

```bash
cd apps/agent

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the agent
python main.py dev
```

### Database Commands

```bash
npm run convex:dev          # Development mode with hot reload
npm run convex:deploy       # Deploy schema changes to production
npx convex data clear       # Clear development database (USE WITH CAUTION)
```

### Linting and Type Checking

```bash
npm run lint                # Run ESLint
npm run lint -- --fix       # Auto-fix linting issues
npx tsc --noEmit            # Type check TypeScript
```

### Running Tests

```bash
npm test                    # Run all Jest tests
npm run test:watch          # Run tests in watch mode
```

## Project Structure

```
beethoven/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth routes (sign-in, sign-up)
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── admin/                # Admin panel (users, avatars, lessons, etc.)
│   │   ├── dashboard/            # Student dashboard
│   │   ├── entry-test/           # Placement test UI
│   │   ├── lessons/              # Lesson list
│   │   └── settings/             # User settings
│   ├── [locale]/                 # i18n public pages (landing, blog, services)
│   ├── api/                      # API routes
│   │   └── livekit/token/        # LiveKit token generation & agent dispatch
│   ├── lesson/[sessionId]/       # Lesson session UI with LiveKit
│   └── practice/[sessionId]/     # Conversation practice UI
│
├── apps/agent/                   # Python LiveKit Agent (MAIN AGENT)
│   ├── main.py                   # Agent entry point
│   ├── requirements.txt          # Python dependencies
│   └── src/
│       ├── providers/            # LLM, TTS, STT, Avatar providers
│       ├── knowledge/            # RAG, RLM knowledge integration
│       ├── slides/               # Slide command processor
│       ├── games/                # Avatar game handler
│       ├── memory/               # Session memory extraction
│       └── monitoring/           # Sentry integration
│
├── components/
│   ├── lesson/                   # Lesson session components
│   │   ├── teaching-room.tsx     # Main lesson room UI
│   │   └── slide-viewer.tsx      # Synchronized slide display
│   └── ui/                       # shadcn/ui components
│
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── users.ts                  # User management
│   ├── avatars.ts                # Avatar CRUD
│   ├── sessions.ts               # Session tracking
│   └── http.ts                   # HTTP actions (webhooks)
│
└── lib/                          # Utilities and helpers
```

## Important Implementation Details

### LiveKit Agents API (v1.3.7+)

Critical API patterns for the Python agent:

```python
# ChatMessage API - content must be a LIST
ChatMessage(role="system", content=[text])  # NOT content=text

# ChatContext API - use 'items' not 'messages'
turn_ctx.items.insert(-1, msg)  # NOT turn_ctx.messages
```

### Room Configuration

- `maxParticipants: 2` (1 student + 1 avatar)
- Token route handles agent dispatch automatically
- See `apps/agent/STABLE_CONFIG.md` for working configuration reference

### Bilingual Code-Switching Modes

1. **Adaptive** (default): English first, switch to German when student struggles
2. **Code-Switching**: Natural mixing of both languages
3. **Strict Separation**: Clear boundaries with announced switches
4. **Target-Only**: English immersion only

### Latency Pipeline Target: < 1 second

- STT (Deepgram Nova-3): 80-120ms
- LLM Processing: 200-400ms (streaming)
- TTS First Chunk (Cartesia): 80-150ms
- Avatar Render: 80-100ms
- Network (LiveKit): 20-50ms

## Environment Variables

Required variables (see `.env.example` for template):

**Core Services:**
- `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT` - Convex database
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` - Authentication
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` - Real-time communication

**AI Providers (Python Agent):**
- `OPENROUTER_API_KEY` - Multi-LLM routing
- `CARTESIA_API_KEY` - Voice synthesis
- `DEEPGRAM_API_KEY` - Speech recognition
- `BEY_API_KEY`, `BEY_AVATAR_ID` - Beyond Presence avatar

**Optional:**
- `TAVILY_API_KEY` - Web search
- `R2_*` - Cloudflare R2 for video storage
- `RESEND_API_KEY` - Email sending

## Key Files for Common Changes

**Modifying database schema:**
- `convex/schema.ts` - Define tables and indexes
- Related `convex/*.ts` files - Update queries/mutations
- Python agent `src/utils/convex_client.py` - Update client code

**Avatar configuration:**
- `convex/avatars.ts` - Avatar CRUD operations
- `apps/agent/src/providers/` - Provider implementations

**Lesson/Session flow:**
- `app/api/livekit/token/route.ts` - Token generation and agent dispatch
- `components/lesson/teaching-room.tsx` - Lesson UI
- `apps/agent/main.py` - Agent logic

## RLM Deep Analysis Tools (MCP)

You have access to RLM tools via MCP for analyzing this codebase:

| Tool | Speed | Use For |
|------|-------|---------|
| `quick_search` | Instant | Find files/code by regex pattern |
| `list_structure` | Instant | See project directory layout |
| `analyze_codebase` | 30-90s | Deep multi-file analysis |

**Use `analyze_codebase` for:**
- "How does X flow through the entire codebase?"
- "Trace data from UI → Convex → Python agent"
- Questions requiring understanding across 10+ files

**DON'T use it for:**
- Simple searches (use `quick_search`)
- Single file questions (just read it)

Cost: ~$0.10-0.50 per `analyze_codebase` call.

---

## References

- [LiveKit Agents SDK](https://docs.livekit.io/agents/) - Python agent framework
- [Convex Docs](https://docs.convex.dev/) - Database and backend
- [Next.js 14 Docs](https://nextjs.org/docs) - Frontend framework
- [Clerk Docs](https://clerk.com/docs) - Authentication

**Important Context:**
- Initial market: German speakers learning English
- Target: < 1 second response latency
- Business model: Freemium (€19 Essential, €39 Premium, €99 Business)
