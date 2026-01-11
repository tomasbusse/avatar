# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Beethoven (Emma AI Platform)** is an AI-powered language learning platform that uses photorealistic AI avatar teachers to provide personalized English lessons to German speakers. The platform features real-time voice/video conversations with AI avatars that can code-switch between English and German, synchronized slide presentations, and sub-1-second response latency.

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Convex (real-time database with serverless functions)
- **Authentication**: Clerk
- **Real-time Communication**: LiveKit (WebRTC for audio/video)
- **AI Avatar Backend**: Python (LiveKit Agents SDK)
- **Avatar Providers**: Beyond Presence (Hedra), with abstraction for Tavus, others
- **Voice**: Cartesia Sonic-3 TTS, Deepgram Nova-3 STT
- **LLM**: Multi-provider support (OpenRouter, Anthropic Claude, OpenAI, Gemini)
- **Vision**: Gemini 2.5 Flash (< 200ms for image analysis)

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend (Web App)                                 │
│  - Student dashboard, lesson UI, progress tracking          │
│  - LiveKit Client SDK (WebRTC)                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼ WebRTC
┌─────────────────────────────────────────────────────────────┐
│  LiveKit Cloud (Real-time Infrastructure)                   │
│  - Audio/Video routing, < 50ms edge network                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Python Agent Server (LiveKit Agents SDK)                   │
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
5. **Real-time Sync**: Convex provides real-time database sync to frontend, no REST APIs needed

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

The Python agent is located in `/james-voice-agent/agent/` (note: this is separate from the empty `/agent/` directory).

```bash
# Navigate to agent directory
cd james-voice-agent/agent

# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the agent
python james_agent.py
```

### Database Commands

```bash
# Deploy Convex schema changes
npm run convex:deploy

# Clear development database (USE WITH CAUTION)
npx convex data clear

# Import/export data
npx convex data export --path ./backup.json
npx convex data import --path ./backup.json
```

### Linting and Type Checking

```bash
# Run ESLint
npm run lint

# Type check TypeScript
npx tsc --noEmit

# Auto-fix linting issues
npm run lint -- --fix
```

## Project Structure

```
beethoven/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes (sign-in, sign-up)
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Student dashboard
│   │   ├── lesson/[id]/          # Lesson session UI with LiveKit
│   │   ├── practice/             # Quick practice modes
│   │   ├── progress/             # Progress tracking & analytics
│   │   └── settings/             # User settings
│   ├── api/                      # API routes
│   │   ├── livekit/              # LiveKit token generation
│   │   ├── webhooks/             # Clerk webhooks
│   │   └── presentations/        # Presentation upload/processing
│   ├── layout.tsx                # Root layout (Clerk, Convex providers)
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles (Tailwind)
│
├── components/
│   ├── layout/                   # Navigation, headers, sidebars
│   ├── lesson/                   # Lesson session components
│   │   ├── LiveKitRoom.tsx       # LiveKit integration
│   │   ├── AvatarDisplay.tsx     # Avatar video rendering
│   │   ├── SlideViewer.tsx       # Synchronized slide display
│   │   └── TranscriptPanel.tsx   # Live transcript
│   ├── providers/                # React context providers
│   ├── shared/                   # Shared components
│   └── ui/                       # shadcn/ui components (Button, Card, etc.)
│
├── convex/                       # Convex backend (TypeScript)
│   ├── _generated/               # Auto-generated Convex types
│   ├── schema.ts                 # Database schema definition
│   ├── users.ts                  # User management functions
│   ├── students.ts               # Student profile functions
│   ├── avatars.ts                # Avatar CRUD operations
│   ├── lessons.ts                # Lesson management
│   ├── sessions.ts               # Session tracking
│   ├── presentations.ts          # Presentation/slide management
│   ├── auth.config.ts            # Clerk integration
│   └── http.ts                   # HTTP actions (webhooks, etc.)
│
├── james-voice-agent/agent/      # Python LiveKit Agent (MAIN AGENT CODE)
│   ├── james_agent.py            # Main agent entry point
│   ├── context_builder.py        # Context/memory management
│   ├── content_extractor.py      # Slide/document processing
│   ├── convex_client.py          # Convex database client
│   └── requirements.txt          # Python dependencies
│
├── lib/                          # Utilities and helpers
│   ├── convex.ts                 # Convex client setup
│   ├── clerk.ts                  # Clerk utilities
│   └── utils.ts                  # General utilities
│
├── hooks/                        # React hooks
│
├── public/                       # Static assets
│
├── .env.local                    # Environment variables (not in git)
├── .env.example                  # Example environment variables
├── package.json                  # Node dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── middleware.ts                 # Next.js middleware (Clerk auth)
```

## Important Implementation Details

### Avatar Configuration System

Each avatar is completely self-contained with its own configuration stored in the `avatars` table in Convex. Key configuration includes:

- **LLM Provider & Model**: Per-avatar (e.g., Emma uses Claude Sonnet, Dr. Schmidt uses GPT-4)
- **Voice Provider & Settings**: Different voices, speeds, languages per avatar
- **Avatar Provider**: Hedra, Beyond Presence, Tavus - swappable
- **Bilingual Behavior**: 4 modes with different German/English switching rules
- **Persona & Personality**: Teaching style, expertise, backstory
- **System Prompts**: Base + level-specific adaptations

When creating or modifying avatars, always update the `convex/avatars.ts` file and ensure the Python agent can read the configuration.

### Bilingual Code-Switching Modes

The platform supports true bilingual teaching with 4 distinct modes:

1. **Adaptive** (default): Start in English, switch to German when student struggles
2. **Code-Switching**: Natural mixing of both languages (like real bilinguals)
3. **Strict Separation**: Clear boundaries with announced switches
4. **Target-Only**: English immersion, no German

The bilingual engine in the Python agent detects struggle through:
- Long pauses (> 5 seconds)
- Hesitation markers ("ähm", "uhh")
- Confusion phrases ("Was?", "I don't understand")
- Student explicitly switching to German

### Latency Optimization Strategy

Target: **< 1 second** total pipeline latency

Pipeline breakdown:
- **STT (Deepgram Nova-3)**: 80-120ms
- **LLM Processing**: 200-400ms (streaming)
- **TTS First Chunk (Cartesia)**: 80-150ms
- **Avatar Render**: 80-100ms
- **Network (LiveKit)**: 20-50ms
- **Total**: 460-820ms ✅

Critical optimizations:
- Stream everything (STT, LLM, TTS, avatar)
- Start TTS before LLM completes (sentence-level streaming)
- Use fast models where appropriate (Haiku, GPT-4o-mini)
- Edge deployment via LiveKit Cloud

### Slide Synchronization

Slides are controlled by the avatar agent via natural language detection or explicit commands. The agent can:
- Advance slides: "Let's look at the next slide", "nächste Folie"
- Go back: "Let's review the previous slide", "zurück"
- Jump to specific slides: "Let's go to slide 3", "Folie drei"

Slides are stored in `slideSets` table and synchronized to the frontend in real-time via LiveKit data channel.

### Session Management

Each learning session creates a `sessions` record with:
- Real-time transcript storage
- Current slide tracking
- Metrics (words spoken, new vocabulary, errors corrected)
- German support usage tracking

Sessions can be of different types:
- `structured_lesson`: Full 30-min lesson with slides
- `quick_practice`: 10-min focused practice
- `free_conversation`: Unstructured chat
- `vocabulary_review`: Spaced repetition flashcards
- `presentation`: User uploads slides for discussion

### Provider Abstraction Layer

The Python agent uses a factory pattern for all AI providers:

```python
# Example: Switching LLM providers per avatar
llm_config = avatar["llmConfig"]
llm = ProviderFactory.create_llm(
    provider=llm_config["provider"],  # "anthropic", "openai", "gemini", "openrouter"
    model=llm_config["model"],
    temperature=llm_config["temperature"]
)
```

This allows:
- Different avatars to use different LLMs
- Easy switching between providers
- A/B testing of models
- Fallback providers for reliability

## Environment Variables Reference

Required environment variables (see `.env.example`):

**Convex:**
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `CONVEX_DEPLOYMENT`: Deployment name

**Clerk (Authentication):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public key
- `CLERK_SECRET_KEY`: Secret key
- `CLERK_WEBHOOK_SECRET`: Webhook signing secret

**LiveKit (Real-time):**
- `LIVEKIT_API_KEY`: API key
- `LIVEKIT_API_SECRET`: API secret
- `NEXT_PUBLIC_LIVEKIT_URL`: WebSocket URL

**AI Providers (Python Agent):**
- `OPENROUTER_API_KEY`: Multi-LLM routing
- `ANTHROPIC_API_KEY`: Claude models
- `OPENAI_API_KEY`: GPT models
- `GEMINI_API_KEY`: Google Gemini (vision)
- `CARTESIA_API_KEY`: Voice synthesis
- `DEEPGRAM_API_KEY`: Speech recognition
- `BEY_API_KEY`: Beyond Presence (avatar)
- `HEDRA_API_KEY`: Hedra (alternative avatar)

**Optional:**
- `STRIPE_SECRET_KEY`: Payment processing
- `STRIPE_WEBHOOK_SECRET`: Stripe webhooks

## Testing

### Manual Testing Workflow

1. **Start all services** (Convex, Next.js, Python agent)
2. **Create a test avatar** in Convex dashboard or via seed script
3. **Create a test student account** via sign-up flow
4. **Start a lesson session** from dashboard
5. **Test bilingual switching** by struggling or explicitly requesting German
6. **Test slide navigation** via voice commands
7. **Check session metrics** in database after completion

### Key Areas to Test

- **Latency**: Measure end-to-end response time (should be < 1s)
- **Bilingual Switching**: Verify German is used appropriately based on mode
- **Slide Sync**: Ensure slides change in sync with avatar speech
- **Avatar Video**: Check lip-sync quality and latency
- **Session Persistence**: Verify transcripts and metrics are saved

## Troubleshooting

### Common Issues

**LiveKit connection fails:**
- Check `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`
- Verify Python agent is running and connected to LiveKit
- Check browser console for WebRTC errors

**Convex functions not working:**
- Ensure `npm run convex:dev` is running
- Check Convex dashboard for function logs
- Verify schema matches with `npx convex dev --typecheck`

**Avatar not appearing:**
- Check `BEY_API_KEY` is valid
- Verify avatar ID exists in Beyond Presence dashboard
- Check Python agent logs for errors

**High latency (> 2 seconds):**
- Check network latency to LiveKit edge
- Verify using fast LLM models (not Opus or o1)
- Check TTS provider settings (streaming enabled)
- Look for Python agent bottlenecks in logs

**Bilingual mode not working:**
- Verify avatar's `bilingualConfig` in Convex
- Check student's `preferences.bilingualMode`
- Ensure German voice ID is configured

## Key Files to Review When Making Changes

**Modifying database schema:**
- `convex/schema.ts` - Define tables and indexes
- All `convex/*.ts` files - Update queries/mutations
- Python agent - Update Convex client code

**Adding new avatar providers:**
- `james-voice-agent/agent/providers/avatar/` - Create new provider class
- `convex/schema.ts` - Add to `avatarProvider.type` union
- Update avatar configuration UI

**Changing LLM providers:**
- `james-voice-agent/agent/providers/llm/` - Add provider implementation
- `convex/schema.ts` - Add to `llmConfig.provider` union
- Update provider factory

**Modifying bilingual behavior:**
- `james-voice-agent/agent/bilingual/` - Bilingual engine logic
- `convex/schema.ts` - Update `bilingualConfig` schema
- System prompts in avatar configuration

## RLM Deep Analysis Tools (MCP)

You have access to RLM (Recursive Language Model) tools via MCP for deep codebase analysis. These tools can analyze the entire codebase (10M+ tokens) by programmatically exploring code rather than stuffing everything into context.

### Available Tools

| Tool | Speed | Use For |
|------|-------|---------|
| `quick_search` | Instant | Find files/code by regex pattern |
| `list_structure` | Instant | See project directory layout |
| `analyze_codebase` | 30-90s | Deep multi-file analysis questions |

### When to Use RLM vs Regular Tools

**Use `quick_search` or `list_structure` for:**
- Finding where something is defined
- Locating files by name or content
- Getting project structure overview
- Simple grep-style searches

**Use `analyze_codebase` for:**
- "How does X flow through the entire codebase?"
- "Trace data from UI → Convex → Python agent"
- "Explain the architecture patterns used"
- "Find all places that need updating for feature Y"
- Questions requiring understanding across 10+ files

**DON'T use `analyze_codebase` for:**
- Questions about a single file (just read it)
- Simple searches (use `quick_search`)
- Real-time responses needed (takes 30-90 seconds)
- When regular grep/find would suffice

### Example Usage

```
# Fast: Find all files mentioning "bilingual"
Use quick_search with path="/Users/tomas/apps/beethoven" and pattern="bilingual"

# Fast: See project structure
Use list_structure with path="/Users/tomas/apps/beethoven"

# Deep: Understand voice pipeline end-to-end
Use analyze_codebase with path="/Users/tomas/apps/beethoven" and question="Trace how voice input flows from the browser through LiveKit to the Python agent, gets processed by STT, sent to LLM, converted to TTS, and rendered by the avatar. Include all relevant files and latency considerations."
```

### Cost Awareness

`analyze_codebase` costs ~$0.10-0.50 per call (Sonnet 4.5). Use fast tools first, RLM only when needed.

---

## References

**Key Documentation:**
- [Beethoven Platform PRD](./beethoven-platform-prd.md) - Full product requirements
- [Enhanced Architecture](./ENHANCED-ARCHITECTURE.md) - Detailed technical architecture
- [LiveKit Agents SDK](https://docs.livekit.io/agents/) - Python agent framework
- [Convex Docs](https://docs.convex.dev/) - Database and backend
- [Next.js 14 Docs](https://nextjs.org/docs) - Frontend framework
- [Clerk Docs](https://clerk.com/docs) - Authentication

**Important Context:**
- Initial market: German speakers learning English
- Target: < 1 second response latency
- Business model: Freemium (€19 Essential, €39 Premium, €99 Business)
- Vision provider: Gemini 2.5 Flash (< 200ms for image analysis)

---

## Stable AI Avatar Configuration

**Config Name:** `stable-ai-avatar` (2026-01-09)

A working, simplified 2-participant configuration. See `apps/agent/STABLE_CONFIG.md` for full details.

**Key Points:**
- `maxParticipants: 2` (1 student + 1 avatar)
- livekit-agents v1.3.10 API:
  - `ChatMessage(content=[text])` - content as LIST
  - `turn_ctx.items.insert()` - use `items` not `messages`
- Screen share and game loading work without stopping avatar
- No multi-participant broadcast needed
