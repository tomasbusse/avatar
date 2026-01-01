# Beethoven Platform - Comprehensive Implementation Plan

## Overview

**Product**: AI Avatar Teaching Platform (Preply with AI avatars)
**Initial Market**: German speakers learning English
**Key Feature**: Real-time video avatar conversations with Beyond Presence
**Database**: Convex (beethoven/healthy-snail-919)

---

## Tech Stack Decision

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14 (App Router) | Stable, excellent DX, Vercel deployment |
| **Styling** | Tailwind CSS + shadcn/ui | Fast iteration, consistent design system |
| **Database** | Convex | Real-time, serverless, your existing setup |
| **Auth** | Clerk | Already configured, Convex integration |
| **Real-time** | LiveKit Cloud | Managed WebRTC, global edge, auto-scaling |
| **Agent** | Python + LiveKit Agents SDK | Official SDK, most stable for voice agents |
| **Avatar** | Beyond Presence (primary) | <100ms latency, LiveKit native integration |
| **TTS** | Cartesia Sonic | 90ms first-byte, streaming, German voices |
| **STT** | Deepgram Nova-3 | Best accuracy, streaming, multilingual |
| **LLM** | OpenRouter → Claude 3.5 Sonnet | Unified API, fallback support |
| **Deployment** | Vercel (web) + Fly.io (agent) | Simple, scalable, cost-effective |

---

## Project Structure

```
beethoven/
├── apps/
│   ├── web/                      # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/           # Auth pages (sign-in, sign-up)
│   │   │   ├── (dashboard)/      # Protected dashboard routes
│   │   │   │   ├── dashboard/    # Student home
│   │   │   │   ├── lesson/[id]/  # Active lesson room
│   │   │   │   ├── practice/     # Quick practice
│   │   │   │   ├── progress/     # Progress tracking
│   │   │   │   └── settings/     # User settings
│   │   │   ├── (marketing)/      # Public pages
│   │   │   │   ├── page.tsx      # Landing page
│   │   │   │   └── pricing/      # Pricing page
│   │   │   ├── (admin)/          # Admin dashboard
│   │   │   │   ├── admin/        # Admin home
│   │   │   │   ├── admin/users/  # User management
│   │   │   │   ├── admin/avatars/# Avatar management
│   │   │   │   ├── admin/lessons/# Lesson management
│   │   │   │   └── admin/analytics/
│   │   │   ├── api/              # API routes
│   │   │   │   ├── livekit/      # LiveKit token generation
│   │   │   │   └── webhooks/     # Clerk, Stripe webhooks
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/               # shadcn components
│   │   │   ├── lesson/           # Lesson room components
│   │   │   │   ├── VideoRoom.tsx
│   │   │   │   ├── AvatarVideo.tsx
│   │   │   │   ├── StudentVideo.tsx
│   │   │   │   ├── SlidePanel.tsx
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   ├── ControlBar.tsx
│   │   │   │   └── TranscriptPanel.tsx
│   │   │   ├── dashboard/        # Dashboard components
│   │   │   ├── admin/            # Admin components
│   │   │   └── shared/           # Shared components
│   │   ├── lib/
│   │   │   ├── livekit.ts        # LiveKit client utilities
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── hooks/
│   │   │   ├── use-lesson.ts
│   │   │   ├── use-avatar.ts
│   │   │   └── use-progress.ts
│   │   └── styles/
│   │
│   └── agent/                    # Python LiveKit Agent
│       ├── src/
│       │   ├── agents/
│       │   │   ├── avatar_agent.py    # Main agent orchestrator
│       │   │   └── session_manager.py
│       │   ├── providers/
│       │   │   ├── __init__.py
│       │   │   ├── llm/
│       │   │   │   ├── openrouter.py
│       │   │   │   └── base.py
│       │   │   ├── tts/
│       │   │   │   ├── cartesia.py
│       │   │   │   └── base.py
│       │   │   ├── stt/
│       │   │   │   ├── deepgram.py
│       │   │   │   └── base.py
│       │   │   └── avatar/
│       │   │       ├── beyond_presence.py
│       │   │       └── base.py
│       │   ├── bilingual/
│       │   │   ├── engine.py
│       │   │   └── detector.py
│       │   ├── teaching/
│       │   │   ├── curriculum.py
│       │   │   └── slides.py
│       │   └── utils/
│       │       ├── convex_client.py
│       │       └── config.py
│       ├── main.py               # Agent entrypoint
│       ├── requirements.txt
│       ├── Dockerfile
│       └── fly.toml
│
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── _generated/
│   ├── users.ts                  # User functions
│   ├── students.ts               # Student profiles
│   ├── avatars.ts                # Avatar configurations
│   ├── lessons.ts                # Lesson templates
│   ├── sessions.ts               # Learning sessions
│   ├── progress.ts               # Progress tracking
│   ├── vocabulary.ts             # Vocabulary & SRS
│   ├── slideSets.ts              # Slide management
│   ├── subscriptions.ts          # Subscription management
│   ├── analytics.ts              # Usage analytics
│   ├── http.ts                   # HTTP endpoints (webhooks)
│   └── auth.config.ts            # Clerk config
│
├── packages/
│   └── shared/                   # Shared types/utilities
│       ├── types/
│       │   ├── user.ts
│       │   ├── avatar.ts
│       │   ├── lesson.ts
│       │   └── session.ts
│       └── constants/
│
├── .env.local                    # Local environment
├── .env.example                  # Environment template
├── package.json
├── turbo.json                    # Turborepo config
└── README.md
```

---

## Database Schema (Convex)

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ============================================
  // USERS & AUTH
  // ============================================
  
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(
      v.literal('admin'),
      v.literal('moderator'),
      v.literal('student'),
      v.literal('guest')
    ),
    status: v.union(
      v.literal('active'),
      v.literal('suspended'),
      v.literal('banned'),
      v.literal('pending')
    ),
    lastLoginAt: v.optional(v.number()),
    loginCount: v.number(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email'])
    .index('by_role', ['role'])
    .index('by_status', ['status']),

  // ============================================
  // STUDENTS
  // ============================================
  
  students: defineTable({
    userId: v.id('users'),
    
    // Language profile
    nativeLanguage: v.string(),           // "de"
    targetLanguage: v.string(),           // "en"
    currentLevel: v.string(),             // "A1", "A2", "B1", "B2", "C1", "C2"
    targetLevel: v.optional(v.string()),
    
    // Learning goals
    learningGoal: v.union(
      v.literal('career'),
      v.literal('travel'),
      v.literal('exam'),
      v.literal('personal'),
      v.literal('academic')
    ),
    focusAreas: v.optional(v.array(v.string())), // ["business", "grammar", "speaking"]
    
    // Progress stats
    totalLessonsCompleted: v.number(),
    totalMinutesPracticed: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastLessonAt: v.optional(v.number()),
    
    // Preferences
    preferences: v.object({
      bilingualMode: v.union(
        v.literal('adaptive'),
        v.literal('code_switching'),
        v.literal('strict_separation'),
        v.literal('target_only')
      ),
      lessonDuration: v.number(),          // Default: 30
      reminderTime: v.optional(v.string()),
      preferredAvatarId: v.optional(v.id('avatars')),
      voiceSpeed: v.optional(v.number()),  // 0.8 - 1.2
    }),
    
    // Onboarding
    onboardingCompleted: v.boolean(),
    assessmentCompleted: v.boolean(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_level', ['currentLevel'])
    .index('by_streak', ['currentStreak']),

  // ============================================
  // AVATARS
  // ============================================
  
  avatars: defineTable({
    // Identity
    name: v.string(),                      // "Emma"
    slug: v.string(),                      // "emma-teacher"
    description: v.string(),
    
    // Avatar provider config
    avatarProvider: v.object({
      type: v.union(
        v.literal('beyond_presence'),
        v.literal('hedra'),
        v.literal('tavus')
      ),
      avatarId: v.string(),                // Provider's avatar ID
      settings: v.optional(v.object({
        resolution: v.optional(v.string()),
        fps: v.optional(v.number()),
        background: v.optional(v.string()),
      })),
    }),
    
    // Voice config
    voiceProvider: v.object({
      type: v.union(
        v.literal('cartesia'),
        v.literal('elevenlabs'),
        v.literal('openai')
      ),
      voiceId: v.string(),
      language: v.string(),
      settings: v.object({
        speed: v.number(),
        pitch: v.optional(v.number()),
        stability: v.optional(v.number()),
      }),
      // Different voice per language (optional)
      languageVoices: v.optional(v.object({
        en: v.optional(v.string()),
        de: v.optional(v.string()),
      })),
    }),
    
    // LLM config
    llmConfig: v.object({
      provider: v.union(
        v.literal('openrouter'),
        v.literal('anthropic'),
        v.literal('openai')
      ),
      model: v.string(),                   // "anthropic/claude-3.5-sonnet"
      temperature: v.number(),
      maxTokens: v.number(),
      // Fast model for simple responses
      fastModel: v.optional(v.string()),   // "anthropic/claude-3-haiku"
    }),
    
    // Persona
    persona: v.object({
      role: v.string(),                    // "English Teacher"
      personality: v.string(),             // "Warm, patient, encouraging"
      expertise: v.array(v.string()),      // ["Business English", "Grammar"]
      teachingStyle: v.union(
        v.literal('socratic'),
        v.literal('direct'),
        v.literal('supportive'),
        v.literal('challenging')
      ),
      backstory: v.optional(v.string()),
    }),
    
    // Bilingual config
    bilingualConfig: v.object({
      supportedLanguages: v.array(v.string()), // ["en", "de"]
      defaultMode: v.union(
        v.literal('adaptive'),
        v.literal('code_switching'),
        v.literal('strict_separation'),
        v.literal('target_only')
      ),
      germanThresholds: v.object({
        A1: v.number(),                    // 70 (% German support)
        A2: v.number(),                    // 50
        B1: v.number(),                    // 20
        B2: v.number(),                    // 5
        C1: v.number(),                    // 0
        C2: v.number(),                    // 0
      }),
    }),
    
    // System prompts
    systemPrompts: v.object({
      base: v.string(),
      levelAdaptations: v.optional(v.object({
        A1: v.optional(v.string()),
        A2: v.optional(v.string()),
        B1: v.optional(v.string()),
        B2: v.optional(v.string()),
        C1: v.optional(v.string()),
        C2: v.optional(v.string()),
      })),
    }),
    
    // Behavior rules
    behaviorRules: v.object({
      maxResponseLength: v.number(),       // words
      preferShortResponses: v.boolean(),
      askQuestionsFrequency: v.union(
        v.literal('always'),
        v.literal('often'),
        v.literal('sometimes'),
        v.literal('rarely')
      ),
      waitForStudentResponse: v.boolean(),
      maxWaitTimeSeconds: v.number(),
    }),
    
    // Appearance
    appearance: v.object({
      avatarImage: v.string(),             // Profile image URL
      thumbnailImage: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      accentColor: v.optional(v.string()),
    }),
    
    // Status
    isActive: v.boolean(),
    isDefault: v.boolean(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_active', ['isActive'])
    .index('by_default', ['isDefault']),

  // ============================================
  // LESSONS
  // ============================================
  
  lessons: defineTable({
    // Identity
    lessonId: v.string(),                  // "BE-001"
    slug: v.string(),                      // "business-emails-intro"
    
    // Content (bilingual)
    title_en: v.string(),
    title_de: v.string(),
    description_en: v.optional(v.string()),
    description_de: v.optional(v.string()),
    
    // Categorization
    category: v.string(),                  // "business", "grammar", "vocabulary"
    subcategory: v.optional(v.string()),   // "emails", "present-perfect"
    tags: v.optional(v.array(v.string())),
    
    // Level & duration
    level: v.string(),                     // "B1"
    estimatedMinutes: v.number(),          // 30
    
    // Learning objectives
    objectives_en: v.array(v.string()),
    objectives_de: v.array(v.string()),
    
    // Associated content
    slideSetId: v.optional(v.id('slideSets')),
    vocabularyIds: v.optional(v.array(v.id('vocabularyItems'))),
    
    // Prerequisites
    prerequisiteLessons: v.optional(v.array(v.id('lessons'))),
    
    // Status
    status: v.union(
      v.literal('draft'),
      v.literal('published'),
      v.literal('archived')
    ),
    
    // Order in curriculum
    order: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_lesson_id', ['lessonId'])
    .index('by_category', ['category'])
    .index('by_level', ['level'])
    .index('by_status', ['status'])
    .index('by_order', ['order']),

  // ============================================
  // SLIDE SETS
  // ============================================
  
  slideSets: defineTable({
    name: v.string(),
    lessonId: v.optional(v.id('lessons')),
    
    slides: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal('title'),
        v.literal('content'),
        v.literal('vocabulary'),
        v.literal('grammar'),
        v.literal('exercise'),
        v.literal('summary'),
        v.literal('image')
      ),
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      content_de: v.optional(v.string()),  // German translation
      items: v.optional(v.array(v.object({
        term: v.string(),
        definition: v.optional(v.string()),
        example: v.optional(v.string()),
      }))),
      imageUrl: v.optional(v.string()),
      notes: v.optional(v.string()),       // Teacher notes
    })),
    
    // Theme
    theme: v.object({
      backgroundColor: v.string(),
      textColor: v.string(),
      accentColor: v.string(),
      fontFamily: v.optional(v.string()),
    }),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_lesson', ['lessonId']),

  // ============================================
  // SESSIONS (Learning Sessions)
  // ============================================
  
  sessions: defineTable({
    // Participants
    studentId: v.id('students'),
    avatarId: v.id('avatars'),
    lessonId: v.optional(v.id('lessons')),
    
    // LiveKit
    roomName: v.string(),
    roomSid: v.optional(v.string()),
    
    // Timing
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    
    // Status
    status: v.union(
      v.literal('waiting'),
      v.literal('active'),
      v.literal('paused'),
      v.literal('completed'),
      v.literal('abandoned')
    ),
    
    // Session type
    type: v.union(
      v.literal('structured_lesson'),
      v.literal('quick_practice'),
      v.literal('free_conversation'),
      v.literal('vocabulary_review'),
      v.literal('pronunciation_drill')
    ),
    
    // Transcript
    transcript: v.optional(v.array(v.object({
      role: v.union(v.literal('student'), v.literal('avatar'), v.literal('system')),
      content: v.string(),
      timestamp: v.number(),
      language: v.optional(v.string()),
    }))),
    
    // Slide progress
    currentSlideIndex: v.optional(v.number()),
    
    // Metrics
    metrics: v.optional(v.object({
      wordsSpoken: v.number(),
      newVocabulary: v.number(),
      errorsCorreected: v.number(),
      germanSupportUsed: v.number(),
      avgResponseLatency: v.optional(v.number()),
    })),
    
    // Feedback
    rating: v.optional(v.number()),        // 1-5
    feedback: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_avatar', ['avatarId'])
    .index('by_lesson', ['lessonId'])
    .index('by_room', ['roomName'])
    .index('by_status', ['status'])
    .index('by_started', ['startedAt']),

  // ============================================
  // PROGRESS TRACKING
  // ============================================
  
  progress: defineTable({
    studentId: v.id('students'),
    
    // Skill tracking
    skillType: v.union(
      v.literal('vocabulary'),
      v.literal('grammar'),
      v.literal('speaking'),
      v.literal('listening'),
      v.literal('pronunciation')
    ),
    skillName: v.string(),                 // "present_perfect", "business_vocab"
    
    // Progress metrics
    level: v.number(),                     // 0-100
    experiencePoints: v.number(),
    
    // Spaced repetition
    lastPracticed: v.number(),
    nextReview: v.optional(v.number()),
    reviewCount: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_skill', ['skillType', 'skillName'])
    .index('by_next_review', ['nextReview']),

  // ============================================
  // VOCABULARY
  // ============================================
  
  vocabularyItems: defineTable({
    // Content
    term_en: v.string(),
    term_de: v.string(),
    pronunciation: v.optional(v.string()), // IPA
    partOfSpeech: v.optional(v.string()),  // "noun", "verb", etc.
    example_en: v.optional(v.string()),
    example_de: v.optional(v.string()),
    
    // Categorization
    category: v.optional(v.string()),
    level: v.string(),                     // "A1", "B1", etc.
    tags: v.optional(v.array(v.string())),
    
    // Audio (optional pre-generated)
    audioUrl: v.optional(v.string()),
    
    createdAt: v.number(),
  })
    .index('by_term', ['term_en'])
    .index('by_level', ['level'])
    .index('by_category', ['category']),

  // Student's vocabulary (personal SRS)
  studentVocabulary: defineTable({
    studentId: v.id('students'),
    vocabularyItemId: v.id('vocabularyItems'),
    
    // SRS data
    learnedAt: v.number(),
    lastReviewed: v.optional(v.number()),
    nextReview: v.number(),
    reviewCount: v.number(),
    masteryLevel: v.number(),              // 0-5 (SM-2 algorithm)
    easeFactor: v.number(),                // SM-2 ease factor
    
    // Performance
    correctCount: v.number(),
    incorrectCount: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_vocab', ['vocabularyItemId'])
    .index('by_next_review', ['studentId', 'nextReview'])
    .index('by_mastery', ['studentId', 'masteryLevel']),

  // ============================================
  // SUBSCRIPTIONS
  // ============================================
  
  subscriptions: defineTable({
    userId: v.id('users'),
    
    // Plan
    tier: v.union(
      v.literal('free'),
      v.literal('essential'),
      v.literal('premium'),
      v.literal('business')
    ),
    
    // Stripe
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    
    // Status
    status: v.union(
      v.literal('active'),
      v.literal('canceled'),
      v.literal('past_due'),
      v.literal('trialing'),
      v.literal('paused')
    ),
    
    // Dates
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    
    // Usage limits
    lessonsUsedThisMonth: v.number(),
    lessonsLimit: v.number(),              // -1 = unlimited
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_stripe_customer', ['stripeCustomerId'])
    .index('by_status', ['status']),

  // ============================================
  // ANALYTICS
  // ============================================
  
  analyticsEvents: defineTable({
    // Who
    userId: v.optional(v.id('users')),
    studentId: v.optional(v.id('students')),
    sessionId: v.optional(v.id('sessions')),
    
    // What
    event: v.string(),                     // "lesson_started", "vocab_learned"
    properties: v.optional(v.any()),
    
    // When/Where
    timestamp: v.number(),
    source: v.optional(v.string()),        // "web", "mobile"
    
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_event', ['event'])
    .index('by_timestamp', ['timestamp']),

  // ============================================
  // RATE LIMITING
  // ============================================
  
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    windowStart: v.number(),
    expiresAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_expires', ['expiresAt']),

  // ============================================
  // AUDIT LOG
  // ============================================
  
  auditLog: defineTable({
    userId: v.optional(v.id('users')),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_action', ['action'])
    .index('by_created', ['createdAt']),
});
```

---

## UI Design System

### Design Philosophy
- **Minimalist**: Clean, uncluttered interfaces
- **Dark-first**: Dark mode primary, light mode supported
- **Accessible**: WCAG 2.1 AA compliant
- **Responsive**: Mobile-first approach

### Color Palette

```css
/* globals.css - Design Tokens */

:root {
  /* Background */
  --bg-primary: #0a0a0b;
  --bg-secondary: #111113;
  --bg-tertiary: #1a1a1d;
  --bg-elevated: #232326;
  
  /* Text */
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;
  --text-muted: #52525b;
  
  /* Accent */
  --accent-primary: #3b82f6;      /* Blue */
  --accent-secondary: #8b5cf6;    /* Purple */
  --accent-success: #22c55e;      /* Green */
  --accent-warning: #f59e0b;      /* Amber */
  --accent-error: #ef4444;        /* Red */
  
  /* Avatar theme */
  --avatar-ring: #3b82f6;
  --avatar-bg: #1e3a5f;
  
  /* Borders */
  --border-default: #27272a;
  --border-hover: #3f3f46;
  
  /* Video room */
  --room-bg: #000000;
  --room-controls: rgba(0, 0, 0, 0.8);
}

/* Light mode overrides */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f4f4f5;
  --bg-elevated: #ffffff;
  
  --text-primary: #09090b;
  --text-secondary: #52525b;
  --text-tertiary: #71717a;
  
  --border-default: #e4e4e7;
  --border-hover: #d4d4d8;
}
```

### Typography

```css
/* Font Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Component Examples

#### Lesson Room Layout (Video Conference Style)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │                             │  │                                 │  │
│  │                             │  │         SLIDE PANEL             │  │
│  │     AVATAR VIDEO            │  │                                 │  │
│  │     (Beyond Presence)       │  │    ┌───────────────────────┐   │  │
│  │                             │  │    │                       │   │  │
│  │                             │  │    │   Slide Content       │   │  │
│  │                             │  │    │                       │   │  │
│  │   ┌─────────────────────┐   │  │    └───────────────────────┘   │  │
│  │   │ Student Video (PiP) │   │  │                                 │  │
│  │   │      (optional)     │   │  │    Vocabulary List              │  │
│  │   └─────────────────────┘   │  │    • word 1 - definition       │  │
│  │                             │  │    • word 2 - definition       │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         TRANSCRIPT                               │   │
│  │  Emma: "Let's practice the present perfect tense today."        │   │
│  │  You: "I have been to Berlin last year."                        │   │
│  │  Emma: "Good try! We say 'I went to Berlin last year' for..."   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🎤 Unmuted  │  📹 Video On  │  📊 Slides  │  💬 Chat  │  ❌ End  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Basic infrastructure and auth working

#### Tasks:
1. **Project Setup**
   - [ ] Initialize Next.js 14 with App Router
   - [ ] Configure Tailwind + shadcn/ui
   - [ ] Set up Convex connection to beethoven database
   - [ ] Configure Clerk authentication
   - [ ] Set up environment variables

2. **Database Schema**
   - [ ] Deploy full schema to Convex
   - [ ] Create seed data scripts
   - [ ] Test indexes and queries

3. **Basic Auth Flow**
   - [ ] Sign up / Sign in pages
   - [ ] Protected routes middleware
   - [ ] User sync with Clerk webhooks

4. **Basic Layout**
   - [ ] App shell (sidebar, header)
   - [ ] Dashboard page (placeholder)
   - [ ] Settings page (placeholder)

#### Deliverables:
- Working auth flow
- Database schema deployed
- Basic app structure

---

### Phase 2: Avatar & LiveKit Integration (Week 3-4)
**Goal**: Video room working with Beyond Presence avatar

#### Tasks:
1. **LiveKit Setup**
   - [ ] Create LiveKit token generation API route
   - [ ] Set up LiveKit React components
   - [ ] Configure room settings

2. **Python Agent (Basic)**
   - [ ] Set up Python project structure
   - [ ] Configure LiveKit Agents SDK
   - [ ] Create basic agent that joins room
   - [ ] Integrate Deepgram STT
   - [ ] Integrate Cartesia TTS
   - [ ] Basic text response (echo test)

3. **Beyond Presence Integration**
   - [ ] Set up Beyond Presence SDK
   - [ ] Connect avatar to agent audio output
   - [ ] Configure avatar settings

4. **Video Room UI**
   - [ ] Create VideoRoom component
   - [ ] Avatar video display (large)
   - [ ] Student video PiP (optional)
   - [ ] Control bar (mute, video, end)
   - [ ] Connection status indicators

#### Deliverables:
- Working video room
- Avatar speaking with lip-sync
- Basic voice interaction

---

### Phase 3: LLM & Conversation (Week 5-6)
**Goal**: Intelligent avatar conversations

#### Tasks:
1. **LLM Integration**
   - [ ] Set up OpenRouter client
   - [ ] Create avatar system prompts
   - [ ] Implement streaming responses
   - [ ] Add conversation memory (session)

2. **Bilingual Engine**
   - [ ] Implement language detection
   - [ ] Create switching logic
   - [ ] Configure German support thresholds
   - [ ] Test code-switching

3. **Conversation Flow**
   - [ ] Implement turn-taking
   - [ ] Add interruption handling
   - [ ] Create natural pauses
   - [ ] Handle long silences

4. **Transcript UI**
   - [ ] Real-time transcript display
   - [ ] Language indicators
   - [ ] Scroll behavior

#### Deliverables:
- Natural conversations with avatar
- Working bilingual support
- Live transcript

---

### Phase 4: Lessons & Content (Week 7-8)
**Goal**: Structured learning experience

#### Tasks:
1. **Lesson System**
   - [ ] Create lesson CRUD functions
   - [ ] Build lesson browser UI
   - [ ] Implement lesson selection
   - [ ] Create default lesson templates (10)

2. **Slide System**
   - [ ] Create slide renderer
   - [ ] Implement slide navigation (voice + UI)
   - [ ] Avatar-slide synchronization
   - [ ] Slide panel UI

3. **Session Management**
   - [ ] Start/end session flow
   - [ ] Session state persistence
   - [ ] Resume capability
   - [ ] Session history

4. **Teaching Logic**
   - [ ] Implement lesson flow (intro, content, practice, summary)
   - [ ] Add curriculum context to prompts
   - [ ] Create exercise types
   - [ ] Implement feedback loops

#### Deliverables:
- Working lesson system
- Synchronized slides
- 10 lesson templates

---

### Phase 5: Progress & Dashboard (Week 9-10)
**Goal**: Complete student experience

#### Tasks:
1. **Student Dashboard**
   - [ ] Progress overview
   - [ ] Recent sessions
   - [ ] Streak tracker
   - [ ] Level indicator
   - [ ] Recommended lessons

2. **Progress Tracking**
   - [ ] Implement skill tracking
   - [ ] Create level calculations
   - [ ] Session metrics storage
   - [ ] Progress charts

3. **Vocabulary System**
   - [ ] SRS algorithm (SM-2)
   - [ ] Vocabulary review mode
   - [ ] Vocabulary added from lessons
   - [ ] Flashcard UI

4. **Onboarding**
   - [ ] Welcome flow
   - [ ] Level assessment
   - [ ] Goal selection
   - [ ] Avatar introduction

#### Deliverables:
- Complete dashboard
- Progress tracking
- Vocabulary trainer
- Onboarding flow

---

### Phase 6: Admin & Polish (Week 11-12)
**Goal**: Admin tools and production readiness

#### Tasks:
1. **Admin Dashboard**
   - [ ] User management
   - [ ] Avatar management
   - [ ] Lesson management
   - [ ] Analytics overview

2. **Avatar Management**
   - [ ] Avatar CRUD
   - [ ] Voice configuration
   - [ ] Prompt editing
   - [ ] Test conversation

3. **Lesson Editor**
   - [ ] Lesson CRUD
   - [ ] Slide editor (WYSIWYG)
   - [ ] Vocabulary linking
   - [ ] Preview mode

4. **Production Hardening**
   - [ ] Error boundaries
   - [ ] Loading states
   - [ ] Offline handling
   - [ ] Rate limiting
   - [ ] Analytics events

5. **Deployment**
   - [ ] Vercel deployment (web)
   - [ ] Fly.io deployment (agent)
   - [ ] Environment configuration
   - [ ] Domain setup

#### Deliverables:
- Admin dashboard
- Production deployment
- Full feature set

---

## Environment Variables

```bash
# .env.local

# ============================================
# CONVEX
# ============================================
NEXT_PUBLIC_CONVEX_URL=https://healthy-snail-919.convex.cloud
CONVEX_DEPLOYMENT=beethoven:healthy-snail-919

# ============================================
# CLERK
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# ============================================
# LIVEKIT
# ============================================
LIVEKIT_API_KEY=APIoVaLnRaykVS5
LIVEKIT_API_SECRET=iJz5nKj2LVr1TzW8Cptb95OSswnWhD1Z8i05sQudHbI
NEXT_PUBLIC_LIVEKIT_URL=wss://james-8d2cxs4p.livekit.cloud

# ============================================
# BEYOND PRESENCE
# ============================================
BEY_API_KEY=sk-Sx4JHRg3ZOFC8-lSf5wd0jKiBaw53lj5O7GsCWqAtVk
BEY_AVATAR_ID=b9be11b8-89fb-4227-8f86-4a881393cbdb

# ============================================
# AI PROVIDERS
# ============================================
OPENROUTER_API_KEY=sk-or-v1-...
CARTESIA_API_KEY=sk_car_...
DEEPGRAM_API_KEY=...

# ============================================
# OPTIONAL / FUTURE
# ============================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## File Templates

### Key Files to Create First

#### 1. `apps/web/app/layout.tsx`
```tsx
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from '@/components/providers/convex-provider';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={inter.className}>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

#### 2. `apps/web/app/api/livekit/token/route.ts`
```tsx
import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roomName, participantName } = await req.json();

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: userId,
      name: participantName,
    }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return NextResponse.json({ token: await token.toJwt() });
}
```

#### 3. `apps/agent/main.py`
```python
import asyncio
import os
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import deepgram, cartesia, openai
from livekit.plugins import bey

async def entrypoint(ctx: JobContext):
    """Main entrypoint for the avatar agent."""
    
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Wait for a participant to join
    participant = await ctx.wait_for_participant()
    
    # Initialize the agent
    agent = Agent(
        instructions="""You are Emma, a friendly and patient English teacher.
        You help German speakers learn English through conversation.
        Keep responses concise (under 100 words) for natural conversation flow.
        If the student struggles, offer help in German.
        Always be encouraging and supportive."""
    )
    
    # Create session with providers
    session = AgentSession(
        stt=deepgram.STT(
            model="nova-2",
            language="multi",  # Auto-detect German/English
        ),
        llm=openai.LLM.with_openrouter(
            model="anthropic/claude-3.5-sonnet",
            temperature=0.7,
        ),
        tts=cartesia.TTS(
            voice="german-female-emma",  # Configure in Cartesia
            language="en",
        ),
    )
    
    # Initialize Beyond Presence avatar
    avatar = bey.AvatarSession(
        avatar_id=os.environ["BEY_AVATAR_ID"],
    )
    
    # Start the voice agent
    await session.start(
        agent=agent,
        room=ctx.room,
        participant=participant,
    )
    
    # Start the avatar
    await avatar.start(session, room=ctx.room)
    
    # Wait for session to end
    await session.wait()


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
```

---

## API Routes Summary

| Route | Method | Description |
|-------|--------|-------------|
| `/api/livekit/token` | POST | Generate LiveKit room token |
| `/api/webhooks/clerk` | POST | Clerk user events |
| `/api/webhooks/stripe` | POST | Stripe subscription events |

---

## Convex Functions Summary

### Queries
- `users.getCurrentUser` - Get authenticated user
- `users.getUser` - Get user by ID
- `students.getStudent` - Get student profile
- `students.getProgress` - Get learning progress
- `avatars.getAvatar` - Get avatar config
- `avatars.getDefaultAvatar` - Get default avatar
- `lessons.listLessons` - List lessons with filters
- `lessons.getLesson` - Get lesson by ID
- `sessions.getSession` - Get session details
- `sessions.listStudentSessions` - Student's session history
- `vocabulary.getDueVocabulary` - Get words due for review

### Mutations
- `users.upsertUser` - Create/update user (webhook)
- `students.updateProfile` - Update student profile
- `students.updateProgress` - Update learning progress
- `sessions.createSession` - Start new session
- `sessions.updateSession` - Update session state
- `sessions.endSession` - End session with metrics
- `vocabulary.addVocabulary` - Add word to student's list
- `vocabulary.updateReview` - Update SRS data after review

---

## Deployment Commands

```bash
# Web (Vercel)
vercel --prod

# Agent (Fly.io)
cd apps/agent
fly deploy

# Convex
npx convex deploy
```

---

## Next Steps

After reviewing this plan:

1. **Confirm** the structure and approach work for you
2. **I'll start implementation** with Phase 1 (Foundation)
3. We'll iterate through each phase

**Questions before starting:**

1. Should I begin implementing Phase 1 now?
2. Any modifications to the schema or structure?
3. Preference on avatar personality (keeping "Emma" or different name)?
