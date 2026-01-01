# Emma AI Platform
## Product Requirements Document (PRD)
### AI-Powered Avatar Teaching Platform

**Version:** 1.0  
**Date:** December 30, 2024  
**Status:** Draft  
**Author:** Emma Platform Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Mission](#2-vision--mission)
3. [Problem Statement](#3-problem-statement)
4. [Target Market](#4-target-market)
5. [Competitive Analysis](#5-competitive-analysis)
6. [Product Overview](#6-product-overview)
7. [User Personas](#7-user-personas)
8. [User Journeys](#8-user-journeys)
9. [Core Features](#9-core-features)
10. [Technical Architecture](#10-technical-architecture)
11. [Platform Components](#11-platform-components)
12. [AI Avatar System](#12-ai-avatar-system)
13. [Learning Experience](#13-learning-experience)
14. [Business Model](#14-business-model)
15. [Monetization Strategy](#15-monetization-strategy)
16. [Go-to-Market Strategy](#16-go-to-market-strategy)
17. [Roadmap](#17-roadmap)
18. [Success Metrics](#18-success-metrics)
19. [Risks & Mitigations](#19-risks--mitigations)
20. [Appendix](#20-appendix)

---

## 1. Executive Summary

### What is Emma AI?

Emma AI is a next-generation online learning platform that replaces human tutors with intelligent AI avatars. Unlike traditional tutoring platforms (Preply, iTalki, Cambly) that connect students with human teachers, Emma AI provides 24/7 access to photorealistic AI teachers that adapt to each student's learning style, pace, and goals.

### The Big Idea

**"Preply, but with AI avatars instead of humans."**

Imagine having access to the world's best language teacher—available anytime, infinitely patient, remembering everything about your learning journey, adapting in real-time to your struggles, and costing a fraction of human tutoring.

### Key Value Propositions

| For Students | For the Business |
|--------------|------------------|
| 24/7 availability | Near-zero marginal cost per lesson |
| Consistent quality | Infinite scalability |
| No scheduling friction | No teacher recruitment/retention |
| Personalized pace | Global reach from day one |
| Lower cost ($5-15/hr vs $20-50/hr) | Predictable unit economics |
| No social anxiety | Data-driven product improvement |
| Perfect memory of progress | Multiple revenue streams |

### Market Opportunity

- **Global online language learning market:** $18.7B (2024) → $47.5B (2030)
- **Online tutoring market:** $7.5B (2024) → $21.4B (2030)
- **AI in education market:** $3.7B (2024) → $25.7B (2030)

### Initial Focus

**German speakers learning English** — then expand to other language pairs and subjects.

---

## 2. Vision & Mission

### Vision (10-Year)

> "To become the world's most effective and accessible learning platform by replacing the limitations of human instruction with intelligent, empathetic AI teachers that make quality education available to everyone, everywhere, at any time."

### Mission (3-Year)

> "To prove that AI avatars can teach language skills as effectively as—or better than—human tutors, while being 10x more accessible and affordable."

### Long-Term Platform Evolution

```
Phase 1: Language Learning (2025-2026)
├── English for German speakers
├── German for English speakers
├── Expand to 10+ language pairs
└── B2C marketplace + B2B enterprise

Phase 2: Subject Expansion (2026-2027)
├── Math tutoring
├── Science education
├── Test preparation (SAT, GMAT, IELTS)
└── Professional skills training

Phase 3: Beyond Education (2027-2029)
├── Medical consultation assistants
├── Mental health support (therapy-adjacent)
├── Corporate training
├── Customer service avatars (B2B SaaS)
└── Personal AI companions

Phase 4: Platform & API (2029+)
├── Avatar-as-a-Service (AaaS)
├── Enterprise white-label
├── Developer API
└── Avatar marketplace (create & monetize)
```

---

## 3. Problem Statement

### Problems with Human Tutoring Platforms

| Problem | Impact | How Emma Solves It |
|---------|--------|-------------------|
| **Scheduling friction** | 40% of booked lessons are rescheduled/cancelled | Available instantly, 24/7 |
| **Inconsistent quality** | Teacher quality varies wildly | Every avatar is optimized |
| **High cost** | $20-50/hour excludes most learners | $5-15/hour or subscription |
| **Social anxiety** | Many learners avoid speaking practice | Zero judgment, infinite patience |
| **Teacher turnover** | Platforms lose 30-40% of teachers annually | Avatars don't quit |
| **Scalability limits** | Growth limited by teacher supply | Infinite capacity |
| **No perfect memory** | Teachers forget student context | Complete learning history |
| **Timezone constraints** | Limited availability across timezones | Instant global availability |

### Student Pain Points (Primary Research)

From interviews with 50+ language learners:

1. **"I can't find times that work with my schedule"** (73%)
2. **"I feel embarrassed making mistakes in front of a real person"** (61%)
3. **"My teacher doesn't remember what we covered last week"** (58%)
4. **"Lessons are too expensive to take regularly"** (82%)
5. **"I want to practice speaking but there's no one to talk to"** (67%)
6. **"Teachers don't explain grammar in my native language"** (54%)

### Market Gap

No platform currently offers:
- ✅ On-demand conversation practice with realistic avatars
- ✅ Adaptive bilingual instruction (English + native language)
- ✅ Synchronized visual materials (slides, documents)
- ✅ Persistent memory across all sessions
- ✅ Subscription pricing with unlimited access
- ✅ Sub-second response latency (feels like real conversation)

---

## 4. Target Market

### Primary Market: German Speakers Learning English

**Why Germany First?**

| Factor | Advantage |
|--------|-----------|
| Market size | 83M population, high internet penetration |
| Willingness to pay | Strong economy, education-focused culture |
| English demand | Required for business, travel, careers |
| Digital adoption | High smartphone/app usage |
| Existing behavior | Germans already use language apps (Duolingo, Babbel) |
| B2B opportunity | German companies invest heavily in employee English training |

**Target Segments (Germany)**

```
Segment 1: Young Professionals (25-35)
├── Need English for career advancement
├── Limited time, flexible schedules
├── Budget: €50-150/month
├── Goal: B2 → C1 level
└── Size: ~3M potential users

Segment 2: Students (18-24)
├── Preparing for international opportunities
├── Price-sensitive, high engagement
├── Budget: €20-50/month
├── Goal: B1 → B2 level
└── Size: ~2M potential users

Segment 3: Business Professionals (35-50)
├── Need English for meetings, presentations
├── Employer often pays
├── Budget: €100-300/month (B2B)
├── Goal: Business fluency
└── Size: ~4M potential users

Segment 4: Late Starters (50+)
├── Travel, personal enrichment
├── Patience and repetition valued
├── Budget: €30-80/month
├── Goal: Conversational fluency
└── Size: ~2M potential users
```

### Secondary Markets (Expansion)

**Year 2 Expansion:**
- 🇵🇱 Poland → English
- 🇪🇸 Spain → English
- 🇧🇷 Brazil → English
- 🇯🇵 Japan → English

**Year 3 Expansion:**
- 🇺🇸 USA → Spanish
- 🇬🇧 UK → French/German
- 🌍 Global → Mandarin Chinese

### Total Addressable Market (TAM)

| Market | TAM | SAM | SOM (Y3) |
|--------|-----|-----|----------|
| German English learners | €2.1B | €500M | €15M |
| European English learners | €8.5B | €2B | €50M |
| Global language learning | €47B | €5B | €100M |

---

## 5. Competitive Analysis

### Direct Competitors

| Platform | Model | Pricing | Strengths | Weaknesses |
|----------|-------|---------|-----------|------------|
| **Preply** | Human tutors marketplace | $15-40/hr | Large tutor network, flexibility | Inconsistent quality, scheduling |
| **iTalki** | Human tutors marketplace | $10-30/hr | Affordable, community | No structured curriculum |
| **Cambly** | Native speaker chat | $0.17/min | Instant availability | No structure, native only |
| **Duolingo** | Gamified app | Free/$13/mo | Fun, accessible, viral | No speaking practice, superficial |
| **Babbel** | Structured courses | $15/mo | Quality content | No conversation, passive |
| **Rosetta Stone** | Immersion software | $12-24/mo | Immersive method | Dated, no personalization |

### Indirect Competitors

| Competitor | Overlap | Differentiation |
|------------|---------|-----------------|
| ChatGPT/Claude | Text conversation practice | Emma: Voice + video avatar, structured lessons |
| Character.AI | AI chat companions | Emma: Educational focus, real pedagogy |
| Speak (app) | AI-powered speech practice | Emma: Full avatar, visual materials, bilingual |
| Elsa Speak | Pronunciation feedback | Emma: Full conversation, not just pronunciation |

### Competitive Positioning

```
                    HIGH PERSONALIZATION
                           │
        Preply/iTalki      │      ★ EMMA AI
        (Human tutors)     │      (AI Avatar)
                           │
LOW ───────────────────────┼─────────────────── HIGH
INTERACTIVITY              │              INTERACTIVITY
                           │
        Babbel/Rosetta     │      Duolingo/Speak
        (Passive courses)  │      (App games)
                           │
                    LOW PERSONALIZATION
```

### Emma's Competitive Moat

1. **Technology Moat:** Sub-second avatar rendering + bilingual LLM switching
2. **Data Moat:** Every interaction improves the AI teacher
3. **Content Moat:** 108+ lesson templates, expanding daily
4. **Experience Moat:** First-mover in realistic avatar tutoring
5. **Cost Moat:** 90% lower cost structure than human platforms

---

## 6. Product Overview

### Product Definition

Emma AI is a **web and mobile application** that provides:

1. **AI Avatar Teachers** — Photorealistic video avatars that conduct live lessons
2. **Structured Curriculum** — 108+ lesson templates across 8 categories
3. **Adaptive Learning** — Real-time difficulty adjustment based on performance
4. **Bilingual Support** — Seamless German/English code-switching
5. **Progress Tracking** — Complete learning history and analytics
6. **Practice Modes** — Conversation, vocabulary, grammar, pronunciation

### Core Product Principles

| Principle | Description |
|-----------|-------------|
| **Feel Human** | Sub-second response, natural conversation flow |
| **Be Helpful** | Explain in German when needed, infinite patience |
| **Remember Everything** | Complete context across all sessions |
| **Adapt Continuously** | Difficulty, speed, style adjust in real-time |
| **Teach Effectively** | Research-backed pedagogy, not just chat |
| **Be Available** | 24/7, no scheduling, instant start |

### Product Tiers

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EMMA FREE                                    │
│  • 3 lessons per month                                              │
│  • Basic vocabulary and grammar                                      │
│  • Text-only mode (no avatar video)                                 │
│  • Limited lesson topics                                            │
│  • €0/month                                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EMMA ESSENTIAL                               │
│  • 20 lessons per month (30 min each)                               │
│  • Voice-only avatar (no video)                                     │
│  • Full curriculum access                                           │
│  • Progress tracking                                                │
│  • €19/month (€15 annual)                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EMMA PREMIUM                                 │
│  • Unlimited lessons                                                │
│  • HD video avatar                                                  │
│  • All avatars & personalities                                      │
│  • Pronunciation analysis                                           │
│  • Custom lesson creation                                           │
│  • Priority support                                                 │
│  • €39/month (€29 annual)                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EMMA BUSINESS                                │
│  • Everything in Premium                                            │
│  • Team management dashboard                                        │
│  • Industry-specific content                                        │
│  • Custom avatar branding                                           │
│  • API access                                                       │
│  • Dedicated success manager                                        │
│  • €99/user/month (volume discounts)                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. User Personas

### Persona 1: "Career Climber Clara"

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLARA SCHMIDT, 28                                                   │
│  Marketing Manager, Berlin                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BACKGROUND                                                          │
│  • Works at a German company expanding internationally               │
│  • B1-B2 English level, struggles with business vocabulary          │
│  • Takes occasional Preply lessons but scheduling is hard           │
│  • Wants to lead English presentations confidently                  │
│                                                                      │
│  GOALS                                                               │
│  • Improve from B2 to C1 in 6 months                                │
│  • Master business English vocabulary                               │
│  • Gain confidence in meetings and presentations                    │
│                                                                      │
│  FRUSTRATIONS                                                        │
│  • "I can never find a Preply slot that works with my schedule"     │
│  • "I feel stupid making mistakes in front of real people"          │
│  • "My teacher doesn't remember what we worked on before"           │
│  • "I need to practice at 6am or 11pm—no teachers available"        │
│                                                                      │
│  BEHAVIOR                                                            │
│  • Uses Duolingo daily (streak keeper)                              │
│  • Watches English YouTube but doesn't speak                        │
│  • Would practice more if it were easier to schedule                │
│                                                                      │
│  EMMA VALUE                                                          │
│  • Practice at 6am before work or 11pm after kids sleep             │
│  • No embarrassment—avatar is infinitely patient                    │
│  • Business English focus with German explanations when needed      │
│  • €39/month vs €200+/month for weekly human tutoring               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Persona 2: "Anxious Student Alex"

```
┌─────────────────────────────────────────────────────────────────────┐
│  ALEX MÜLLER, 21                                                     │
│  University Student, Munich                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BACKGROUND                                                          │
│  • Studying Business Administration                                  │
│  • A2-B1 English, needs B2 for exchange semester                    │
│  • Social anxiety makes speaking practice terrifying                │
│  • Has tried language exchange apps but always cancels              │
│                                                                      │
│  GOALS                                                               │
│  • Pass B2 certificate exam in 4 months                             │
│  • Gain confidence to actually speak English                        │
│  • Prepare for study abroad in UK                                   │
│                                                                      │
│  FRUSTRATIONS                                                        │
│  • "I know grammar but freeze when I have to speak"                 │
│  • "I cancelled 3 Tandem meetups because I was too nervous"         │
│  • "Duolingo doesn't help me actually talk to people"               │
│  • "Human tutors are too expensive on a student budget"             │
│                                                                      │
│  BEHAVIOR                                                            │
│  • Prefers text over voice communication                            │
│  • Practices speaking alone in room but never with people           │
│  • Perfectionist—won't speak unless certain of correctness          │
│                                                                      │
│  EMMA VALUE                                                          │
│  • Zero judgment—avatar celebrates attempts, not perfection         │
│  • Can make mistakes privately without embarrassment                │
│  • Gradual confidence building before real-world practice           │
│  • €19/month fits student budget                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Persona 3: "Executive Eva"

```
┌─────────────────────────────────────────────────────────────────────┐
│  EVA FISCHER, 45                                                     │
│  CFO, Stuttgart (Automotive Company)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BACKGROUND                                                          │
│  • C-level executive at mid-size German company                     │
│  • B2 English but struggles with nuance and idioms                  │
│  • Company expanding to US market                                   │
│  • Has executive presence in German, not in English                 │
│                                                                      │
│  GOALS                                                               │
│  • Lead board meetings with US investors confidently                │
│  • Master financial terminology in English                          │
│  • Develop executive communication style in English                 │
│                                                                      │
│  FRUSTRATIONS                                                        │
│  • "I don't have time for scheduled lessons"                        │
│  • "I need industry-specific vocabulary, not general English"       │
│  • "I can't let colleagues see me struggling with English"          │
│  • "Human coaches don't understand automotive/finance context"      │
│                                                                      │
│  BEHAVIOR                                                            │
│  • Works 60+ hours/week, unpredictable schedule                     │
│  • Willing to pay premium for quality and privacy                   │
│  • Values efficiency—no time for small talk                         │
│                                                                      │
│  EMMA VALUE                                                          │
│  • Practice at 5am, midnight, or between meetings                   │
│  • Industry-specific automotive/finance English                     │
│  • Complete privacy—no human ever sees her struggle                 │
│  • Custom avatar trained on board meeting scenarios                 │
│  • Company pays €99/month—not a budget concern                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Persona 4: "Lifelong Learner Ludwig"

```
┌─────────────────────────────────────────────────────────────────────┐
│  LUDWIG WEBER, 62                                                    │
│  Retired Engineer, Hamburg                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BACKGROUND                                                          │
│  • Recently retired, wants to travel and stay mentally active       │
│  • A2 English from school decades ago, mostly forgotten             │
│  • Wife doesn't speak English, wants to be "tour guide"             │
│  • Tried VHS (community college) course, too slow and boring        │
│                                                                      │
│  GOALS                                                               │
│  • Conversational English for travel (hotels, restaurants)          │
│  • Understand English TV shows and podcasts                         │
│  • Connect with grandchildren who speak English                     │
│                                                                      │
│  FRUSTRATIONS                                                        │
│  • "Young people in group classes make me feel slow"                │
│  • "I need more repetition than younger learners"                   │
│  • "Apps are too gamified—I want to actually learn"                 │
│  • "I forget vocabulary between weekly classes"                     │
│                                                                      │
│  BEHAVIOR                                                            │
│  • Prefers desktop/tablet over mobile                               │
│  • Values thoroughness over speed                                   │
│  • Willing to practice daily if it's convenient                     │
│                                                                      │
│  EMMA VALUE                                                          │
│  • Patient avatar adjusts to slower pace                            │
│  • Daily practice (15-30 min) at consistent time                    │
│  • Focus on practical travel English                                │
│  • German explanations for grammar clarity                          │
│  • €19/month is reasonable retirement expense                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. User Journeys

### Journey 1: First-Time User (Discovery to First Lesson)

```
┌─────────────────────────────────────────────────────────────────────┐
│ DISCOVERY                                                            │
│ Clara sees Instagram ad: "Speak English fluently with AI teachers"  │
│ ────────────────────────────────────────────────────────────────────│
│ LANDING PAGE (30 seconds)                                            │
│ • Watches 30-second demo video of avatar teaching                   │
│ • Sees "Start free lesson in 2 minutes"                             │
│ • Clicks "Try Free"                                                 │
│ ────────────────────────────────────────────────────────────────────│
│ ONBOARDING (3 minutes)                                               │
│ 1. Email/Google signup                                              │
│ 2. "What's your English level?" (A1-C2 quick assessment)            │
│ 3. "What's your goal?" (Career/Travel/Exam/Personal)                │
│ 4. "When do you want to practice?" (Morning/Evening/Flexible)       │
│ 5. "Meet Emma, your English teacher" (Avatar introduction)          │
│ ────────────────────────────────────────────────────────────────────│
│ FIRST LESSON (10 minutes)                                            │
│ • Emma introduces herself in English                                │
│ • Assesses Clara's level through conversation                       │
│ • Teaches one practical phrase with practice                        │
│ • Ends with preview of full curriculum                              │
│ ────────────────────────────────────────────────────────────────────│
│ CONVERSION PROMPT                                                    │
│ "You just learned X! Unlock unlimited lessons for €39/month"        │
│ Clara: [Subscribe] or [Remind me later]                             │
└─────────────────────────────────────────────────────────────────────┘

Metrics:
• Landing → Signup: 15%
• Signup → First Lesson Complete: 70%
• First Lesson → Paid Conversion: 20%
```

### Journey 2: Daily Practice Session (Returning User)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 6:15 AM - Clara opens Emma app on iPad                              │
│ ────────────────────────────────────────────────────────────────────│
│ HOME SCREEN                                                          │
│ "Good morning, Clara! Ready for today's lesson?"                    │
│ • Continue: "Business Emails - Lesson 3 of 5"                       │
│ • Quick Practice: 10-min conversation                               │
│ • Vocabulary Review: 12 words due                                   │
│ ────────────────────────────────────────────────────────────────────│
│ Clara selects "Continue Business Emails"                            │
│ ────────────────────────────────────────────────────────────────────│
│ LESSON FLOW (25 minutes)                                             │
│                                                                      │
│ [0:00] Emma appears on screen with slide                            │
│        "Willkommen zurück! Last time we covered formal greetings.   │
│         Today: handling complaints professionally."                  │
│                                                                      │
│ [0:02] Emma: "First, let's review. How would you start a formal    │
│              email to someone you don't know?"                       │
│        Clara: "Uh... Dear Sir or Madam?"                            │
│        Emma: "Excellent! Perfect formal opening."                   │
│                                                                      │
│ [0:05] Emma shows slide with complaint email template                │
│        "Now, when responding to a complaint..."                      │
│                                                                      │
│ [0:10] Clara struggles with "apologize" vs "apologise"              │
│        Emma: (detects confusion) "Auf Deutsch: Das ist britisches   │
│              vs amerikanisches Englisch. Beide sind korrekt."       │
│                                                                      │
│ [0:15] Role-play: Clara writes complaint response                   │
│        Emma provides real-time feedback                             │
│                                                                      │
│ [0:22] Summary slide with key phrases                               │
│        Emma: "Great work! You used 8 new phrases today."           │
│                                                                      │
│ [0:25] "See you tomorrow? Same time works?"                         │
│        → Sets reminder for 6:15 AM                                  │
│ ────────────────────────────────────────────────────────────────────│
│ POST-LESSON                                                          │
│ • Progress saved automatically                                       │
│ • New vocabulary added to review queue                              │
│ • Clara rates lesson 👍                                              │
│ • Stats: 15-day streak, B2 progress 34%                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Journey 3: Struggle & Support (Avatar Adaptation)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Alex is learning present perfect tense                              │
│ ────────────────────────────────────────────────────────────────────│
│                                                                      │
│ Emma: "When do we use present perfect? Can you give an example?"    │
│                                                                      │
│ Alex: [5 seconds silence]... "I have... um... go to Berlin?"        │
│                                                                      │
│ 🔍 AVATAR DETECTION                                                  │
│ • Long pause detected (>3 seconds)                                  │
│ • Hesitation markers ("um")                                         │
│ • Grammar error in response                                         │
│ → Struggle Level: MEDIUM                                            │
│ ────────────────────────────────────────────────────────────────────│
│                                                                      │
│ Emma: (Simpler English) "Good try! Let me help.                     │
│        'Go' becomes 'gone' in present perfect.                       │
│        So it's 'I have gone to Berlin.'"                            │
│                                                                      │
│ Alex: [4 seconds silence]... "I... have gone... to Berlin?"         │
│                                                                      │
│ 🔍 AVATAR DETECTION                                                  │
│ • Still hesitant                                                    │
│ • Unsure intonation                                                 │
│ → Struggle Level: HIGH                                              │
│ ────────────────────────────────────────────────────────────────────│
│                                                                      │
│ Emma: (Switches to German support)                                   │
│        "Lass mich das auf Deutsch erklären.                         │
│                                                                      │
│         Present Perfect = haben/sein + Partizip II                   │
│         Genau wie im Deutschen: 'Ich bin nach Berlin gefahren'      │
│                                                                      │
│         Auf Englisch: 'I have gone to Berlin'                       │
│                                                                      │
│         Der Unterschied: Wir benutzen immer 'have' + past participle│
│                                                                      │
│         Lass uns das nochmal versuchen—auf Englisch:               │
│         What have you done today?"                                  │
│                                                                      │
│ Alex: "I have... eaten breakfast?"                                  │
│                                                                      │
│ Emma: "Perfect! 🎉 Du hast es verstanden!                           │
│        'I have eaten breakfast' - genau richtig.                    │
│        Let's try a few more examples."                              │
│ ────────────────────────────────────────────────────────────────────│
│                                                                      │
│ 📊 SESSION ANALYTICS                                                 │
│ • German support triggered: 2 times                                 │
│ • Comprehension improved after German explanation                   │
│ • Recommendation: More present perfect practice needed              │
│ • Spaced repetition: Review in 1 day                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Core Features

### Feature Matrix by Tier

| Feature | Free | Essential | Premium | Business |
|---------|------|-----------|---------|----------|
| **Lessons/month** | 3 | 20 | Unlimited | Unlimited |
| **Voice conversation** | ✓ | ✓ | ✓ | ✓ |
| **Video avatar** | ✗ | ✗ | ✓ | ✓ |
| **Slide materials** | ✓ | ✓ | ✓ | ✓ |
| **Bilingual support** | ✓ | ✓ | ✓ | ✓ |
| **Progress tracking** | Basic | Full | Full | Full + Team |
| **Vocabulary trainer** | ✗ | ✓ | ✓ | ✓ |
| **Pronunciation feedback** | ✗ | ✗ | ✓ | ✓ |
| **Custom lessons** | ✗ | ✗ | ✓ | ✓ |
| **Multiple avatars** | ✗ | ✗ | ✓ | ✓ |
| **Industry content** | ✗ | ✗ | ✓ | ✓ |
| **API access** | ✗ | ✗ | ✗ | ✓ |
| **Team management** | ✗ | ✗ | ✗ | ✓ |
| **Custom branding** | ✗ | ✗ | ✗ | ✓ |

### Feature Specifications

#### F1: AI Avatar Conversation

```yaml
Feature: Real-time voice conversation with AI avatar
Priority: P0 (Must Have)
User Story: As a learner, I want to have natural spoken conversations 
            with an AI teacher so I can practice speaking without 
            scheduling a human tutor.

Acceptance Criteria:
  - Response latency < 1 second (feels natural)
  - Voice sounds human-like (Cartesia German voice clone)
  - Avatar lip-syncs to speech (video tier)
  - Interruption handling (can interrupt avatar mid-sentence)
  - Turn-taking feels natural (not robotic)
  
Technical Requirements:
  - LiveKit WebRTC for real-time audio/video
  - Deepgram Nova-3 for STT (80-120ms)
  - Streaming LLM responses (Claude 3.5/GPT-4)
  - Cartesia Sonic-3 for TTS (first chunk <150ms)
  - Hedra/Beyond Presence for video avatar (<100ms)

Metrics:
  - Response latency p50 < 800ms
  - Response latency p99 < 1500ms
  - User satisfaction rating > 4.2/5
```

#### F2: Bilingual Code-Switching

```yaml
Feature: Intelligent German/English language switching
Priority: P0 (Must Have)
User Story: As a German learner, I want the avatar to explain things 
            in German when I'm struggling so I can understand and 
            keep progressing.

Switching Modes:
  1. ADAPTIVE (default)
     - Start in English
     - Switch to German when struggle detected
     - Return to English after explanation
     
  2. CODE_SWITCHING
     - Natural mix of both languages
     - Models real bilingual conversation
     
  3. STRICT_SEPARATION
     - Announced language switches
     - Clear boundaries between languages
     
  4. TARGET_ONLY
     - English only (immersion mode)
     - Simpler English instead of German

Struggle Detection Signals:
  - Long pauses (>5 seconds)
  - Confusion phrases ("Was?", "I don't understand")
  - Student switches to German
  - Hesitation markers ("ähm", "uhh")
  - Off-topic or single-word responses

Metrics:
  - German support reduces lesson abandonment by 30%
  - Students rated bilingual support 4.5/5
  - Average German usage: A1=70%, B1=20%, C1=5%
```

#### F3: Synchronized Slide Presentations

```yaml
Feature: Avatar controls and references visual materials
Priority: P0 (Must Have)
User Story: As a learner, I want to see slides and visuals while the 
            avatar teaches so I can follow along with vocabulary, 
            grammar rules, and examples.

Slide Control Methods:
  1. Natural language: "Let's look at the next slide"
  2. Explicit commands: [SLIDE:3] in LLM output
  3. Tool calls: change_slide(slide_number)

Slide Types:
  - Title slides
  - Vocabulary lists (with German translations)
  - Grammar explanations
  - Example sentences
  - Practice exercises
  - Summary/recap

100+ Trigger Phrases (German & English):
  - "nächste Folie", "next slide"
  - "zur Grammatik", "grammar slide"
  - "zurück", "go back"
  - "Folie drei", "slide three"

Metrics:
  - Slide sync latency < 200ms
  - 95% of slide changes are contextually appropriate
```

#### F4: Progress Tracking & Memory

```yaml
Feature: Persistent memory across all sessions
Priority: P0 (Must Have)
User Story: As a learner, I want the avatar to remember everything 
            about my learning journey so I don't have to repeat 
            myself and can see my progress.

Memory Types:
  1. Working Memory (current session)
     - Recent conversation context
     - Current lesson position
     - Today's vocabulary
     
  2. Short-Term Memory (days-weeks)
     - Recent lesson topics
     - Recent mistakes
     - Practice patterns
     
  3. Long-Term Memory (permanent)
     - All-time progress
     - Vocabulary mastery
     - Grammar competency
     - Learning preferences
     - Struggle patterns

Displayed Progress:
  - Current level (A1-C2) with percentage
  - Streak counter
  - Lessons completed
  - Vocabulary learned
  - Skills radar chart
  - Predicted level-up date

Metrics:
  - Memory recall accuracy > 95%
  - Students value memory feature 4.7/5
```

#### F5: Vocabulary Trainer (Spaced Repetition)

```yaml
Feature: Intelligent vocabulary review system
Priority: P1 (Should Have)
User Story: As a learner, I want a vocabulary review system that 
            helps me remember words long-term using spaced repetition.

Mechanics:
  - Words added automatically from lessons
  - Spaced repetition algorithm (SM-2)
  - Review intervals: 1d, 3d, 7d, 14d, 30d, 90d
  - Multiple review modes:
    • Flashcards (EN↔DE)
    • Audio recognition
    • Fill-in-the-blank
    • Speaking practice
    
Integration:
  - Avatar prompts: "You have 15 words to review today"
  - Can do reviews in voice mode with avatar
  - Standalone quick-review mode (5 min)
  
Metrics:
  - Daily vocabulary retention > 85%
  - Users complete 60% of due reviews
```

#### F6: Pronunciation Feedback

```yaml
Feature: Real-time pronunciation analysis
Priority: P2 (Nice to Have - Premium)
User Story: As a learner, I want feedback on my pronunciation so I 
            can sound more natural and be understood.

Analysis Types:
  - Word-level accuracy
  - Phoneme analysis
  - Stress patterns
  - Intonation curves
  - Common German-speaker errors:
    • TH sounds (think vs sink)
    • W vs V (wine vs vine)
    • Final consonant devoicing

Feedback Delivery:
  - Real-time during lessons
  - Dedicated pronunciation practice mode
  - Progress tracking over time
  
Integration:
  - Deepgram provides phoneme timing
  - Custom analysis for German-speaker patterns
  - Visual waveform comparison

Metrics:
  - Pronunciation score improvement > 15%
  - User satisfaction with feedback > 4.0/5
```

#### F7: Custom Lesson Creation

```yaml
Feature: AI-generated lessons on any topic
Priority: P2 (Nice to Have - Premium)
User Story: As a learner, I want to request lessons on specific 
            topics so I can learn vocabulary and phrases relevant 
            to my needs.

Creation Flow:
  1. User inputs topic: "Job interview at a tech company"
  2. AI generates:
     - 7-10 slides
     - Key vocabulary
     - Example dialogues
     - Practice exercises
  3. User can edit/customize
  4. Lesson is saved to library
  
Constraints:
  - Must match user's level (auto-adjusted)
  - Generation time < 30 seconds
  - Quality verified by AI review
  
Metrics:
  - Custom lessons used by 40% of Premium users
  - Satisfaction with generated lessons > 4.0/5
```

---

## 10. Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Web App    │  │  iOS App    │  │ Android App │                 │
│  │  (Next.js)  │  │  (React     │  │  (React     │                 │
│  │             │  │   Native)   │  │   Native)   │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         └────────────────┴────────────────┘                         │
│                          │                                          │
│               LiveKit Client SDK                                    │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                   WebRTC (Audio/Video/Data)
                           │
┌──────────────────────────┼──────────────────────────────────────────┐
│                    LIVEKIT CLOUD                                     │
│         (Real-time Audio/Video Infrastructure)                      │
│                          │                                          │
│    ┌─────────────────────┴─────────────────────┐                   │
│    │                                           │                    │
│    ▼                                           ▼                    │
│  Student                                    Avatar                  │
│  Participant                               Participant              │
│  (audio in)                            (audio/video out)            │
└────┬────────────────────────────────────────────┬───────────────────┘
     │                                            │
     │                                            │
┌────▼────────────────────────────────────────────▼───────────────────┐
│                      AGENT SERVER                                    │
│                    (Python, LiveKit Agents)                         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Avatar Agent Orchestrator                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │Bilingual │  │  Slide   │  │  Memory  │  │ Progress │    │   │
│  │  │ Engine   │  │ Controller│  │  System  │  │ Tracker  │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐                │
│         │                    │                    │                 │
│         ▼                    ▼                    ▼                 │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐           │
│  │   STT      │      │    LLM     │      │    TTS     │           │
│  │ (Deepgram) │ →    │  (Claude)  │  →   │ (Cartesia) │           │
│  │  Nova-3    │      │   Sonnet   │      │  Sonic-3   │           │
│  └────────────┘      └────────────┘      └────────────┘           │
│         │                    │                    │                 │
│         │                    ▼                    │                 │
│         │           ┌────────────┐                │                 │
│         │           │   Vision   │                │                 │
│         │           │  (Gemini   │                │                 │
│         │           │ 2.5 Flash) │                │                 │
│         │           └────────────┘                │                 │
│         │                    │                    │                 │
│         │                    ▼                    ▼                 │
│         │           ┌────────────────────────────────┐             │
│         │           │        Avatar Provider         │             │
│         │           │  (Hedra / Beyond Presence)     │             │
│         │           │      Video Generation          │             │
│         │           └────────────────────────────────┘             │
└─────────┴────────────────────┴───────────────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────────────┐
│                        DATA LAYER                                     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      CONVEX                                      │ │
│  │              (Realtime Database + Functions)                     │ │
│  │                                                                  │ │
│  │  Tables:                                                         │ │
│  │  • users          • lessons        • avatars                    │ │
│  │  • students       • slideSets      • progress                   │ │
│  │  • sessions       • vocabulary     • subscriptions              │ │
│  │  • memory         • analytics      • organizations              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      CLERK                                       │ │
│  │              (Authentication + User Management)                  │ │
│  │                                                                  │ │
│  │  • Email/password login     • Social logins (Google, Apple)     │ │
│  │  • Organization management  • Session handling                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Latency Pipeline (Target: < 1 Second)

```
Student Speaks → STT → LLM → TTS → Avatar → Student Hears/Sees
                 │      │     │      │
               80ms   300ms 100ms  80ms
                 └──────┴─────┴──────┘
                     Total: ~560ms
                     
Optimizations:
1. Streaming at every stage
2. Start TTS before LLM completes
3. Avatar renders as TTS streams
4. Edge deployment for < 50ms network
```

### Provider Abstraction Layer

```python
# Each component is swappable via configuration

class ProviderFactory:
    """Creates provider instances based on avatar configuration"""
    
    @staticmethod
    def create_llm(config: LLMConfig) -> LLMProvider:
        providers = {
            "anthropic": AnthropicProvider,
            "openai": OpenAIProvider,
            "gemini": GeminiProvider,
            "openrouter": OpenRouterProvider,
        }
        return providers[config.provider](config)
    
    @staticmethod
    def create_tts(config: TTSConfig) -> TTSProvider:
        providers = {
            "cartesia": CartesiaProvider,
            "elevenlabs": ElevenLabsProvider,
            "openai": OpenAITTSProvider,
        }
        return providers[config.provider](config)
    
    @staticmethod
    def create_avatar(config: AvatarConfig) -> AvatarProvider:
        providers = {
            "hedra": HedraProvider,
            "beyond_presence": BeyondPresenceProvider,
            "tavus": TavusProvider,
        }
        return providers[config.provider](config)
```

---

## 11. Platform Components

### 11.1 Student-Facing Application

```yaml
Web Application:
  Framework: Next.js 14 (App Router)
  Styling: Tailwind CSS + shadcn/ui
  State: Zustand / React Query
  Real-time: LiveKit Client SDK
  Auth: Clerk
  
Pages:
  /                     # Landing page
  /login                # Authentication
  /dashboard            # Student home
  /lesson/[id]          # Active lesson
  /practice             # Quick practice modes
  /vocabulary           # Vocabulary trainer
  /progress             # Progress & stats
  /settings             # Account settings
  /subscription         # Billing & plans

Mobile Application:
  Framework: React Native + Expo
  Shared: 80% code shared with web
  Native: Camera, microphone, notifications
```

### 11.2 Admin Dashboard

```yaml
Admin Application:
  Framework: Next.js 14
  Auth: Clerk (admin roles)
  
Sections:
  /admin/dashboard           # Overview metrics
  /admin/lessons             # Lesson management
  /admin/lessons/new         # AI lesson generator
  /admin/slides              # Slide editor
  /admin/avatars             # Avatar management
  /admin/avatars/clone-voice # Voice cloning
  /admin/students            # Student management
  /admin/analytics           # Usage analytics
  /admin/settings            # System settings

Features:
  - AI lesson generation (Claude)
  - Visual slide editor (WYSIWYG)
  - Voice cloning (Cartesia)
  - Student progress monitoring
  - Usage analytics & costs
```

### 11.3 Agent Server

```yaml
Framework: LiveKit Agents SDK (Python)

Components:
  /agent/src/
    agents/
      avatar_agent.py        # Main orchestrator
      session_manager.py     # Session lifecycle
    
    providers/
      llm/
        anthropic.py         # Claude
        openai.py            # GPT-4
        gemini.py            # Gemini
        openrouter.py        # Multi-model
      tts/
        cartesia.py          # Primary TTS
        elevenlabs.py        # Alternative
      avatar/
        hedra.py             # Primary avatar
        beyond_presence.py   # Alternative
      stt/
        deepgram.py          # Primary STT
    
    bilingual/
      engine.py              # Language switching
      detector.py            # Struggle detection
      voice_manager.py       # Multi-voice
    
    teaching/
      curriculum.py          # Lesson flow
      slides.py              # Slide control
      exercises.py           # Practice modes
    
    memory/
      working.py             # Current session
      short_term.py          # Recent sessions
      long_term.py           # All-time data
      rag.py                 # Document retrieval

Deployment:
  - Docker containers
  - Auto-scaling via LiveKit Cloud
  - Global edge deployment
```

### 11.4 Database Schema (Convex)

```typescript
// Core tables

users: defineTable({
  clerkId: v.string(),
  email: v.string(),
  name: v.string(),
  role: v.union(v.literal("student"), v.literal("admin")),
  createdAt: v.number(),
})

students: defineTable({
  userId: v.id("users"),
  currentLevel: v.string(),              // A1, A2, B1, B2, C1, C2
  targetLevel: v.string(),
  nativeLanguage: v.string(),            // "de"
  learningGoal: v.string(),              // "career", "travel", etc.
  subscriptionTier: v.string(),
  subscriptionEndsAt: v.optional(v.number()),
  totalLessonsCompleted: v.number(),
  totalMinutesPracticed: v.number(),
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastLessonAt: v.optional(v.number()),
  preferences: v.object({
    bilingualMode: v.string(),
    lessonDuration: v.number(),
    reminderTime: v.optional(v.string()),
    preferredAvatarId: v.optional(v.id("avatars")),
  }),
})

avatars: defineTable({
  name: v.string(),
  slug: v.string(),
  persona: v.object({ /* detailed persona */ }),
  voiceProvider: v.object({ /* voice config */ }),
  avatarProvider: v.object({ /* video config */ }),
  llmConfig: v.object({ /* LLM routing */ }),
  bilingualConfig: v.object({ /* language rules */ }),
  systemPrompt: v.object({ /* prompts */ }),
  isActive: v.boolean(),
  isDefault: v.boolean(),
})

lessons: defineTable({
  lessonId: v.string(),
  slug: v.string(),
  title_en: v.string(),
  title_de: v.string(),
  category: v.string(),
  subcategory: v.string(),
  level: v.string(),
  objectives_en: v.array(v.string()),
  objectives_de: v.array(v.string()),
  estimatedMinutes: v.number(),
  slideSetId: v.optional(v.id("slideSets")),
  status: v.string(),
})

slideSets: defineTable({
  name: v.string(),
  lessonId: v.optional(v.id("lessons")),
  slides: v.array(v.object({ /* slide content */ })),
  defaultTheme: v.string(),
})

sessions: defineTable({
  studentId: v.id("students"),
  avatarId: v.id("avatars"),
  lessonId: v.optional(v.id("lessons")),
  startedAt: v.number(),
  endedAt: v.optional(v.number()),
  durationMinutes: v.optional(v.number()),
  status: v.string(),
  transcript: v.optional(v.array(v.object({
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  }))),
  metrics: v.optional(v.object({
    wordsSpoken: v.number(),
    newVocabulary: v.number(),
    errorsCorreected: v.number(),
    germanSupportUsed: v.number(),
  })),
})

progress: defineTable({
  studentId: v.id("students"),
  skillType: v.string(),             // "vocabulary", "grammar", "speaking"
  skillName: v.string(),             // specific skill
  level: v.number(),                 // 0-100
  lastPracticed: v.number(),
  nextReview: v.optional(v.number()),
})

vocabulary: defineTable({
  studentId: v.id("students"),
  term_en: v.string(),
  term_de: v.string(),
  example: v.optional(v.string()),
  category: v.optional(v.string()),
  learnedAt: v.number(),
  lastReviewed: v.optional(v.number()),
  nextReview: v.number(),
  reviewCount: v.number(),
  masteryLevel: v.number(),          // 0-5 (spaced repetition)
})
```

---

## 12. AI Avatar System

### Avatar Personalities

```yaml
Default Avatars:

Emma (Primary):
  Name: Emma Weber
  Role: Professional English Teacher
  Personality: Warm, encouraging, patient, structured
  Voice: German-accented English, clear pronunciation
  Appearance: 30s, professional, friendly smile
  Teaching Style: Supportive with clear structure
  Best For: General learners, beginners, anxious students
  
Max (Alternative):
  Name: Max Anderson
  Role: Business English Coach
  Personality: Direct, efficient, results-oriented
  Voice: American English, confident tone
  Appearance: 40s, business professional
  Teaching Style: Direct, challenging, fast-paced
  Best For: Business professionals, advanced learners
  
Dr. Schmidt (Specialized):
  Name: Dr. Hannah Schmidt
  Role: Academic English Expert
  Personality: Precise, thorough, academic
  Voice: British English, formal register
  Appearance: 50s, academic, glasses
  Teaching Style: Detailed explanations, grammar focus
  Best For: Exam prep, academic English, C1+ learners

Sofia (Conversational):
  Name: Sofia Martinez
  Role: Conversation Partner
  Personality: Casual, fun, spontaneous
  Voice: American English, casual tone
  Appearance: 20s, casual, energetic
  Teaching Style: Free conversation, natural flow
  Best For: Speaking practice, maintaining fluency
```

### Avatar Configuration System

Each avatar has individual configuration:

```typescript
avatarConfig: {
  // Provider Selection (per avatar)
  avatarProvider: {
    type: "hedra" | "beyond_presence" | "tavus",
    avatarId: string,
    settings: { resolution: "720p" | "1080p", fps: 24 | 30 }
  },
  
  // Voice (different per avatar + language)
  voiceProvider: {
    type: "cartesia" | "elevenlabs",
    voices: {
      english: { voiceId: string, speed: number },
      german: { voiceId: string, speed: number }
    }
  },
  
  // LLM Routing (per avatar)
  llmConfig: {
    primary: { provider: "anthropic", model: "claude-3.5-sonnet" },
    fast: { provider: "anthropic", model: "claude-3.5-haiku" },
    vision: { provider: "gemini", model: "gemini-2.5-flash" },
  },
  
  // Bilingual Rules (per avatar)
  bilingualConfig: {
    mode: "adaptive" | "code_switching" | "strict" | "target_only",
    germanThresholds: { A1: 70, A2: 50, B1: 20, B2: 5, C1: 0 },
    struggleDetection: { pauseThreshold: 5, hesitationCount: 2 }
  },
  
  // Behavior Rules (per avatar)
  behaviorRules: {
    maxResponseLength: 100,          // words
    askQuestionsFrequency: "often",
    waitForResponse: true,
    maxWaitSeconds: 15,
  }
}
```

### Video Avatar Pipeline

```
Audio Generation (Cartesia)
        │
        ▼
┌───────────────────┐
│  Audio Stream     │
│  (SSM streaming)  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Avatar Provider  │
│  (Hedra/BeyPres)  │
│                   │
│  Audio → Video    │
│  Lip-sync render  │
│  < 100ms latency  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  LiveKit Room     │
│  (WebRTC stream)  │
│                   │
│  Video to student │
│  < 50ms delivery  │
└───────────────────┘
```

---

## 13. Learning Experience

### Curriculum Structure

```
Language Learning Curriculum
│
├── Level A1 (Beginner)
│   ├── Basics
│   │   ├── Greetings & Introductions
│   │   ├── Numbers & Time
│   │   ├── Daily Routines
│   │   └── Family & Friends
│   ├── Grammar
│   │   ├── Present Simple
│   │   ├── Present Continuous
│   │   ├── Articles (a/an/the)
│   │   └── Basic Prepositions
│   └── Vocabulary
│       ├── 500 Essential Words
│       ├── Common Phrases
│       └── Survival English
│
├── Level A2 (Elementary)
│   ├── Practical Situations
│   │   ├── Shopping & Services
│   │   ├── Restaurants & Food
│   │   ├── Travel & Directions
│   │   └── Health & Doctor
│   ├── Grammar
│   │   ├── Past Simple
│   │   ├── Future (will/going to)
│   │   ├── Comparatives/Superlatives
│   │   └── Modal Verbs (can/could)
│   └── Vocabulary
│       ├── 1000 Words
│       ├── False Friends (DE→EN)
│       └── Common Collocations
│
├── Level B1 (Intermediate)
│   ├── Communication
│   │   ├── Expressing Opinions
│   │   ├── Telling Stories
│   │   ├── Making Plans
│   │   └── Giving Advice
│   ├── Grammar
│   │   ├── Present Perfect
│   │   ├── Conditionals (1st, 2nd)
│   │   ├── Passive Voice
│   │   ├── Relative Clauses
│   │   └── Modal Verbs (full)
│   ├── Business (Optional Track)
│   │   ├── Email Writing
│   │   ├── Phone Calls
│   │   ├── Meetings
│   │   └── Presentations
│   └── Vocabulary
│       ├── 2000 Words
│       ├── Phrasal Verbs (50)
│       └── Idioms (30)
│
├── Level B2 (Upper Intermediate)
│   ├── Advanced Communication
│   │   ├── Debating & Persuading
│   │   ├── Hypothetical Situations
│   │   ├── Nuanced Opinions
│   │   └── Formal vs Informal
│   ├── Grammar
│   │   ├── Conditionals (3rd, Mixed)
│   │   ├── Reported Speech
│   │   ├── Advanced Passive
│   │   └── Inversion
│   ├── Business (Full Track)
│   │   ├── Negotiations
│   │   ├── Presentations (Advanced)
│   │   ├── Report Writing
│   │   └── Cross-cultural Communication
│   └── Vocabulary
│       ├── 4000 Words
│       ├── Phrasal Verbs (100)
│       ├── Idioms (100)
│       └── Collocations (200)
│
├── Level C1 (Advanced)
│   ├── Professional Excellence
│   │   ├── Leadership Communication
│   │   ├── Academic Writing
│   │   ├── Media & Current Events
│   │   └── Specialized Topics
│   └── Exam Prep (Optional)
│       ├── Cambridge C1 Advanced
│       └── IELTS 7.0+
│
└── Level C2 (Proficiency)
    ├── Near-Native Fluency
    │   ├── Subtlety & Nuance
    │   ├── Humor & Cultural References
    │   └── Creative Writing
    └── Exam Prep
        └── Cambridge C2 Proficiency
```

### Lesson Flow (30-Minute Standard)

```
┌─────────────────────────────────────────────────────────────────────┐
│  LESSON: Business Email Writing (B1)                                 │
│  Duration: 30 minutes                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [0:00 - 2:00] WARM-UP                                              │
│  ────────────────────────────────────────                           │
│  Emma: "Guten Morgen! How was your weekend?"                        │
│  [Brief personal chat, establish rapport]                           │
│  Emma: "Today we're working on professional email writing."         │
│                                                                      │
│  [2:00 - 5:00] REVIEW                                               │
│  ────────────────────────────────────────                           │
│  Emma: "Last time we covered formal greetings. Can you remind me?"  │
│  [Check retention, address gaps]                                    │
│  [SLIDE: Quick review of previous vocabulary]                       │
│                                                                      │
│  [5:00 - 12:00] NEW CONTENT                                         │
│  ────────────────────────────────────────                           │
│  Emma: "Today's focus: responding to complaints professionally."    │
│  [SLIDE: Key phrases for complaint responses]                       │
│  Emma explains: acknowledge, apologize, action, appreciation        │
│  [Examples with German translations for tricky phrases]             │
│                                                                      │
│  [12:00 - 22:00] PRACTICE                                           │
│  ────────────────────────────────────────                           │
│  Exercise 1: Gap-fill (5 min)                                       │
│  Emma: "Complete this email with the right phrases..."              │
│                                                                      │
│  Exercise 2: Role-play (5 min)                                      │
│  Emma: "You're a customer service manager. I'm an angry customer."  │
│  [Interactive practice with real-time feedback]                     │
│                                                                      │
│  Exercise 3: Free writing (5 min)                                   │
│  Emma: "Write a response to this complaint. I'll review it."        │
│  [Student types, Emma provides feedback]                            │
│                                                                      │
│  [22:00 - 27:00] SUMMARY                                            │
│  ────────────────────────────────────────                           │
│  [SLIDE: Today's key takeaways]                                     │
│  Emma: "Let's recap what you learned today."                        │
│  [Review new vocabulary, highlight progress]                        │
│                                                                      │
│  [27:00 - 30:00] WRAP-UP                                            │
│  ────────────────────────────────────────                           │
│  Emma: "Great work! You used 8 new phrases today."                  │
│  Emma: "I've added 12 words to your vocabulary trainer."            │
│  Emma: "Same time tomorrow? We'll cover follow-up emails."          │
│  [Set expectation, end positively]                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Practice Modes

```yaml
1. Structured Lesson (30 min):
   - Full curriculum lesson
   - New content + practice
   - Best for: Learning new material
   
2. Quick Practice (10 min):
   - Focused skill practice
   - No new content, just drilling
   - Best for: Busy days, maintaining skills
   
3. Free Conversation (15-30 min):
   - Unstructured chat
   - Avatar adapts to topics
   - Best for: Fluency, confidence building
   
4. Vocabulary Review (5-15 min):
   - Spaced repetition flashcards
   - Can do with or without avatar
   - Best for: Memory retention
   
5. Pronunciation Drill (10 min):
   - Focused pronunciation practice
   - Targeted German-speaker errors
   - Best for: Accent improvement
   
6. Exam Simulation (45-60 min):
   - Cambridge/IELTS format
   - Timed conditions
   - Best for: Exam preparation
```

---

## 14. Business Model

### Revenue Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                     REVENUE STREAMS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. B2C SUBSCRIPTIONS (70% of revenue)                              │
│  ───────────────────────────────────────                            │
│  Essential: €19/month    →  Target: 10,000 subscribers              │
│  Premium:   €39/month    →  Target: 5,000 subscribers               │
│  Annual:    -25% discount                                           │
│                                                                      │
│  Year 1 Target: €3M ARR                                             │
│  Year 3 Target: €15M ARR                                            │
│                                                                      │
│  2. B2B ENTERPRISE (25% of revenue)                                 │
│  ───────────────────────────────────────                            │
│  Business: €99/user/month                                           │
│  Enterprise: Custom pricing (€50-80/user at volume)                 │
│                                                                      │
│  Year 1 Target: €500K ARR (50 companies, 100 users avg)             │
│  Year 3 Target: €5M ARR                                             │
│                                                                      │
│  3. ADD-ON SERVICES (5% of revenue)                                 │
│  ───────────────────────────────────────                            │
│  - 1:1 human coaching (upsell): €50/session                         │
│  - Certificate preparation: €99 one-time                            │
│  - Custom content creation: €199+ one-time                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Unit Economics

```yaml
Customer Acquisition Cost (CAC):
  Paid (Meta/Google): €35
  Organic (SEO/viral): €5
  Blended: €20 (assuming 30% paid)

Lifetime Value (LTV):
  Essential: €19 × 8 months = €152
  Premium: €39 × 10 months = €390
  Blended Average: €220

LTV:CAC Ratio: 11:1 (target >3:1 ✓)

Monthly Churn:
  Month 1: 15%
  Month 2-3: 8%
  Month 4+: 5%
  Annual subscribers: 2%

Gross Margin per User per Month:
  Revenue: €29 (blended)
  COGS (AI/infra): €8
  Gross Margin: €21 (72%)
```

### Cost Structure

```yaml
Cost Per Session (30 minutes):
  LLM (Claude):        $0.50-1.00
  TTS (Cartesia):      $0.20-0.40
  STT (Deepgram):      $0.10-0.15
  Avatar (Hedra):      $1.50-3.00
  LiveKit:             $0.30-0.60
  ─────────────────────────────────
  Total:               $2.60-5.15
  
Monthly Cost per Active User:
  (Assuming 15 sessions/month)
  Infrastructure:      $40-75
  
Revenue per User:      $32 (€29)
Margin per User:       Variable based on usage

Cost Optimization:
  - Heavy users (>30 sessions): Negative margin
  - Average users (10-20): Positive margin
  - Light users (<10): High margin
  
  → Implement soft usage caps
  → Optimize for average engagement, not maximum
```

---

## 15. Monetization Strategy

### Pricing Principles

1. **Value-based pricing:** €39/month = 1 hour with human tutor
2. **Accessibility:** Free tier and €19 entry point
3. **Expansion revenue:** Path from Essential → Premium → Business
4. **Annual lock-in:** 25% discount for annual commitment

### Conversion Funnel

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CONVERSION FUNNEL                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  AWARENESS                                                           │
│  100,000 visitors/month                                             │
│       │                                                              │
│       │ 15% signup rate                                             │
│       ▼                                                              │
│  FREE SIGNUP                                                         │
│  15,000 signups/month                                               │
│       │                                                              │
│       │ 70% complete first lesson                                   │
│       ▼                                                              │
│  FIRST LESSON COMPLETE                                               │
│  10,500 users/month                                                 │
│       │                                                              │
│       │ 20% convert to paid                                         │
│       ▼                                                              │
│  PAID SUBSCRIBER                                                     │
│  2,100 new subscribers/month                                        │
│       │                                                              │
│       │ 5% monthly churn (retained)                                 │
│       ▼                                                              │
│  RETAINED SUBSCRIBER                                                 │
│  Building to 15,000 active                                          │
│       │                                                              │
│       │ 30% upgrade to Premium                                      │
│       ▼                                                              │
│  PREMIUM SUBSCRIBER                                                  │
│  Target: 5,000                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Pricing Experiments

```yaml
A/B Tests to Run:
  1. Price points: €19 vs €24 vs €29 for Essential
  2. Free trial length: 3 lessons vs 7 days
  3. Annual discount: 20% vs 25% vs 30%
  4. Feature bundling: What drives Premium upgrades?
  
Hypotheses:
  - €24 may convert better than €19 (anchor effect)
  - 7-day trial > 3 lessons for conversion
  - Pronunciation feedback is #1 Premium driver
```

---

## 16. Go-to-Market Strategy

### Phase 1: Germany Launch (Months 1-6)

```yaml
Target: 5,000 paying subscribers
Budget: €300K marketing

Channels:
  1. Performance Marketing (40% budget)
     - Meta (Instagram/Facebook): German professionals
     - Google Search: "English lernen", "Business English"
     - YouTube pre-roll: Learning/career content
     
  2. Content Marketing (20% budget)
     - Blog: German SEO for English learning tips
     - YouTube: German-language learning content
     - TikTok: Short learning clips
     
  3. Partnerships (20% budget)
     - Influencer partnerships (German learning/career)
     - B2B: German companies (HR partnerships)
     - Language schools: White-label pilots
     
  4. PR & Earned Media (10% budget)
     - German tech press (t3n, Gründerszene)
     - Education press
     - "AI replaces tutors" narrative
     
  5. Community (10% budget)
     - Discord community for learners
     - Referral program (1 month free)
     - User testimonials/case studies
```

### Messaging Framework

```yaml
Primary Message:
  "Learn English with AI teachers—available 24/7, infinitely patient, 
   and 10x more affordable than human tutors."

Value Propositions by Persona:
  Career Climber:
    "Prepare for English meetings at 6am or 11pm—whenever works for you."
    
  Anxious Student:
    "Practice speaking without judgment. Our AI is infinitely patient."
    
  Executive:
    "Industry-specific English training, complete privacy, on your schedule."
    
  Lifelong Learner:
    "Learn at your pace. Our AI adapts to you, not the other way around."

Differentiators to Emphasize:
  1. Real conversation (not apps/games)
  2. Available instantly (no scheduling)
  3. Remembers everything (personalized)
  4. Bilingual support (German when needed)
  5. Affordable (10x cheaper than tutors)
```

### B2B Sales Strategy

```yaml
Target Companies:
  - German Mittelstand expanding internationally
  - Tech companies with English requirements
  - Consulting/professional services firms
  - Manufacturing exporters

Sales Motion:
  1. Identify HR/L&D decision makers
  2. Free pilot (5-10 users, 1 month)
  3. Measure engagement + progress
  4. Expand to team/company license
  5. Upsell custom content

Pricing:
  - < 50 users: €99/user/month
  - 50-200 users: €79/user/month
  - 200-500 users: €59/user/month
  - 500+: Custom (€40-50/user)

Target Accounts (Year 1):
  - 50 companies
  - Average 100 users
  - €500K B2B ARR
```

---

## 17. Roadmap

### 12-Month Product Roadmap

```
Q1 2025: FOUNDATION
─────────────────────────────────────────────────────────────────────

Month 1-2: Core Platform
├── ✓ LiveKit voice integration
├── ✓ Basic avatar (voice-only)
├── ✓ 20 lesson templates
├── ✓ German/English bilingual
├── ✓ Basic progress tracking
└── ✓ Clerk authentication

Month 3: MVP Launch
├── Video avatar integration (Hedra)
├── 50+ lesson templates
├── Subscription billing (Stripe)
├── Basic admin dashboard
└── → BETA LAUNCH (500 users)

─────────────────────────────────────────────────────────────────────

Q2 2025: GROWTH
─────────────────────────────────────────────────────────────────────

Month 4-5: Retention Features
├── Spaced repetition vocabulary
├── Progress analytics (student)
├── Session memory (multi-session)
├── Pronunciation feedback (basic)
└── Mobile web optimization

Month 6: Expansion
├── 100+ lesson templates
├── Multiple avatar personalities
├── Custom lesson generation
├── B2B admin features
└── → PUBLIC LAUNCH

─────────────────────────────────────────────────────────────────────

Q3 2025: SCALE
─────────────────────────────────────────────────────────────────────

Month 7-8: Platform Maturity
├── Native mobile apps (iOS/Android)
├── Advanced analytics
├── API for B2B integrations
├── Enterprise SSO
└── Referral program

Month 9: New Markets
├── Spanish speakers → English
├── French speakers → English
├── Industry-specific content (5)
└── Cambridge exam prep

─────────────────────────────────────────────────────────────────────

Q4 2025: INNOVATION
─────────────────────────────────────────────────────────────────────

Month 10-12: Next Generation
├── Real-time video analysis (Gemini)
├── Whiteboard/drawing capability
├── Group lessons (2-3 students)
├── Community features
└── Voice cloning for students (practice)
```

### Feature Priority Matrix

```
                    HIGH VALUE
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │ Bilingual         │ Video Avatar      │
    │ Code-Switching    │ (Hedra)           │
    │                   │                   │
    │ Slide Sync        │ Sub-1s Latency    │
    │                   │                   │
LOW │ Progress          │ Pronunciation     │ HIGH
EFFORT│ Tracking         │ Feedback          │ EFFORT
    │                   │                   │
    │ Vocabulary        │ Mobile Apps       │
    │ Trainer           │                   │
    │                   │                   │
    │ Basic Memory      │ Custom Lessons    │
    │                   │ (AI Gen)          │
    └───────────────────┼───────────────────┘
                        │
                    LOW VALUE
```

---

## 18. Success Metrics

### North Star Metric

**Weekly Active Learning Minutes (WALM)**

> Total minutes of active learning across all users per week

Why this metric:
- Directly correlates with learning outcomes
- Indicates engagement and retention
- Drives revenue (active users → retained subscribers)
- Actionable (we can improve it)

Target: 500,000 WALM by end of Year 1

### Key Performance Indicators (KPIs)

```yaml
Acquisition:
  - Website visitors: 100K/month
  - Signup rate: 15%
  - First lesson completion: 70%
  - Free → Paid conversion: 20%
  - CAC: < €30
  
Engagement:
  - Weekly Active Users (WAU): 60% of subscribers
  - Sessions per user per week: 3+
  - Average session duration: 25 minutes
  - Lesson completion rate: 85%
  
Retention:
  - Month 1 retention: 85%
  - Month 3 retention: 70%
  - Month 12 retention: 50%
  - Monthly churn: < 6%
  - Annual subscriber ratio: 40%
  
Revenue:
  - MRR: €300K by Month 12
  - ARR: €3.6M by Year 1
  - ARPU: €28/month
  - LTV:CAC: > 5:1
  - Gross margin: > 65%
  
Product Quality:
  - Response latency p50: < 800ms
  - Session NPS: > 50
  - App store rating: > 4.5
  - Technical uptime: > 99.5%
  
Learning Outcomes:
  - Level progression: 1 level / 3-6 months
  - Vocabulary retention: > 80%
  - Student-reported confidence improvement: > 70%
```

### Reporting Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  EMMA METRICS DASHBOARD                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MRR: €285,000    WAU: 12,400    WALM: 450,000    NPS: 52          │
│  (+12% MoM)       (+8% WoW)      (+15% WoW)       (+3)              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    MRR GROWTH                                │   │
│  │                                                              │   │
│  │  €300K ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ target       │   │
│  │                                          ●                   │   │
│  │  €200K                             ●                         │   │
│  │                               ●                              │   │
│  │  €100K                   ●                                   │   │
│  │                     ●                                        │   │
│  │  €0    ●───●───●                                             │   │
│  │       J   F   M   A   M   J   J   A   S   O   N   D         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  FUNNEL THIS MONTH                        TOP LESSONS               │
│  ──────────────────                       ────────────              │
│  Visitors:    45,000                      1. Business Emails (B1)   │
│  Signups:      6,750 (15%)                2. Present Perfect        │
│  1st Lesson:   4,725 (70%)                3. Phone Calls (B1)       │
│  Converted:      945 (20%)                4. Job Interviews         │
│                                           5. Small Talk             │
│  RETENTION COHORTS                                                   │
│  ──────────────────                                                 │
│  Oct cohort: 82% (M1), 68% (M2), -- (M3)                           │
│  Sep cohort: 84% (M1), 71% (M2), 64% (M3)                          │
│  Aug cohort: 80% (M1), 67% (M2), 59% (M3)                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 19. Risks & Mitigations

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Latency too high** | Medium | Critical | Multi-provider fallback, edge deployment |
| **Avatar uncanny valley** | Medium | High | Start voice-only, gradual video rollout |
| **AI makes teaching errors** | Medium | High | Human review, feedback loops, guardrails |
| **Low conversion rates** | Medium | High | A/B testing, onboarding optimization |
| **High churn** | Medium | High | Engagement features, community, streaks |
| **Cost per session too high** | Medium | Medium | Optimize LLM usage, caching, hybrid models |
| **Competition from big players** | Low | High | Speed, niche focus, German expertise |
| **Regulatory/data privacy** | Low | High | GDPR compliance, EU hosting |
| **Provider dependency** | Medium | Medium | Provider abstraction, multi-vendor |
| **Founder burnout** | Medium | Critical | Hire early, sustainable pace |

### Detailed Risk Analysis

```yaml
RISK: Latency Too High (>2 seconds)
───────────────────────────────────
Impact: Users abandon due to unnatural conversation
Probability: Medium (many components in pipeline)
Current Status: Target 800ms, measuring 600-1200ms

Mitigations:
  1. Stream everything (STT, LLM, TTS, avatar)
  2. Multiple provider fallbacks
  3. Edge deployment (LiveKit global)
  4. Fast model selection (Haiku, GPT-4o-mini)
  5. Pre-generated responses for common phrases
  6. Client-side prediction for UI feedback

Monitoring:
  - P50, P95, P99 latency tracking
  - Alerts if >1.5s for >5% of sessions
  - User feedback correlation analysis

─────────────────────────────────────

RISK: Avatar Uncanny Valley Effect
───────────────────────────────────
Impact: Users creeped out, won't engage
Probability: Medium (video avatar technology still maturing)

Mitigations:
  1. Launch voice-only first, prove value
  2. Gradual video rollout to small cohort
  3. Stylized avatars option (not hyperrealistic)
  4. User choice: voice-only always available
  5. Continuous A/B testing of avatar styles

Monitoring:
  - NPS split by video vs voice-only users
  - Session completion rate comparison
  - Qualitative feedback analysis

─────────────────────────────────────

RISK: AI Teaching Errors
───────────────────────────────────
Impact: Users learn incorrect English, trust erosion
Probability: Medium (LLMs can hallucinate)

Mitigations:
  1. Constrained responses for grammar rules
  2. Fact-checked lesson content (pre-generated)
  3. User feedback mechanism ("Was this correct?")
  4. Regular quality audits by linguists
  5. Error logging and correction pipeline
  6. Safe fallback: "Let me double-check that..."

Monitoring:
  - Error reports per 1000 sessions
  - Grammar accuracy spot checks
  - User-reported corrections
```

---

## 20. Appendix

### A. Technical Specifications

```yaml
Infrastructure:
  Cloud: AWS (eu-central-1 for GDPR)
  Compute: ECS Fargate (agents), Vercel (frontend)
  Database: Convex (managed, real-time)
  CDN: CloudFront
  Real-time: LiveKit Cloud
  Auth: Clerk
  Payments: Stripe
  Analytics: PostHog
  Monitoring: Datadog

API Integrations:
  LLM: Anthropic Claude, OpenAI, Google Gemini
  TTS: Cartesia, ElevenLabs (backup)
  STT: Deepgram
  Avatar: Hedra, Beyond Presence
  Vision: Gemini 2.5 Flash

Performance Requirements:
  - Response latency: < 1 second (p95)
  - Uptime: 99.9%
  - Concurrent sessions: 1000+
  - Video quality: 720p minimum
  - Audio quality: 48kHz
```

### B. Regulatory Compliance

```yaml
GDPR Compliance:
  - Data stored in EU (Frankfurt)
  - Explicit consent for voice/video recording
  - Right to deletion implemented
  - Data Processing Agreement with providers
  - Privacy Policy in German and English

Age Requirements:
  - Minimum age: 16 (or parental consent)
  - Age verification on signup
  - No marketing to minors

Content Moderation:
  - AI responses filtered for appropriateness
  - User reporting mechanism
  - Regular content audits

Accessibility:
  - WCAG 2.1 AA compliance target
  - Screen reader compatibility
  - Keyboard navigation
  - Captions for all audio content
```

### C. Team Requirements (Year 1)

```yaml
Core Team (10 people):
  - CEO/Founder
  - CTO/Co-founder
  - Head of Product
  - 3 Full-stack Engineers
  - 1 ML/AI Engineer
  - 1 Content/Curriculum Designer
  - 1 Marketing Lead
  - 1 Customer Success

Contractors/Agencies:
  - Design agency (UI/UX)
  - PR agency (launch)
  - Legal counsel
  - Language experts (curriculum review)

Year 2 Additions:
  - VP Sales (B2B)
  - Senior Engineers (2)
  - Content team (2)
  - Support team (2)
```

### D. Competitive Pricing Analysis

```yaml
Preply:
  - Pay-per-lesson: $15-50/hour
  - Subscription: N/A
  - Target: Flexible scheduling

iTalki:
  - Pay-per-lesson: $10-30/hour
  - Subscription: N/A
  - Target: Budget learners

Cambly:
  - Subscription: $16-30/month (limited)
  - Per-minute: $0.17/min
  - Target: Casual conversation

Duolingo:
  - Free tier: Yes
  - Premium: $13/month
  - Target: Gamified learning

Babbel:
  - Subscription: $15/month
  - Target: Self-study courses

EMMA (Our Positioning):
  - Free tier: 3 lessons
  - Essential: €19/month (unlimited time)
  - Premium: €39/month (video, all features)
  - Target: Conversation practice, flexibility
  
  Value Proposition:
  "Premium features of human tutoring at 
   the price of a language app."
```

### E. Glossary

| Term | Definition |
|------|------------|
| **WALM** | Weekly Active Learning Minutes |
| **Avatar** | AI-powered virtual teacher with voice and/or video |
| **Bilingual Mode** | Language switching capability (German/English) |
| **Code-switching** | Natural mixing of two languages in conversation |
| **Struggle Detection** | AI detection of student confusion/difficulty |
| **Spaced Repetition** | Memory technique with increasing review intervals |
| **STT** | Speech-to-Text (transcription) |
| **TTS** | Text-to-Speech (voice synthesis) |
| **LLM** | Large Language Model (Claude, GPT-4, etc.) |
| **VAD** | Voice Activity Detection |
| **LiveKit** | Real-time audio/video communication platform |
| **Convex** | Real-time database and backend platform |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | Emma Team | Initial PRD |

---

*This is a living document. Last updated: December 30, 2024*
