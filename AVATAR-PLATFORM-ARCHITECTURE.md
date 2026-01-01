# Avatar Platform Architecture

## Vision

A **modular AI avatar platform** where any avatar can be configured with:
- **Personality** - Who they are (traits, style, tone)
- **Identity** - Their backstory (history, credentials, anecdotes)
- **Knowledge** - What they know (domain expertise, documents, RAG)
- **Memory** - What they remember (conversations, user context, relationships)

This is NOT an English teaching app. It's infrastructure for deploying AI personalities across:
- Language tutoring
- Medical consultation
- Therapy support
- Corporate training
- Customer service
- Any human-like AI interaction

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AVATAR CONFIGURATION                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Personality │  │  Identity   │  │  Knowledge  │  │   Memory    │        │
│  │   System    │  │   System    │  │    Base     │  │   (Zep)     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                      ┌────────────▼────────────┐                            │
│                      │   System Prompt Engine   │                            │
│                      │   (Assembles context)    │                            │
│                      └────────────┬────────────┘                            │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                           RUNTIME LAYER                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   VAD    │  │   STT    │  │   LLM    │  │   TTS    │  │  Avatar  │      │
│  │ (Silero) │  │(Deepgram)│  │ (Claude) │  │(Cartesia)│  │ (Video)  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Personality System

### What It Defines
The personality system shapes HOW the avatar communicates, not WHAT it knows.

### Schema

```typescript
// convex/schema.ts
personality: defineTable({
  // Identity
  personalityId: v.string(),          // "warm-professor", "clinical-doctor"
  name: v.string(),                   // Display name
  
  // Core Traits (1-10 scale)
  traits: v.object({
    warmth: v.number(),               // Cold (1) ↔ Warm (10)
    formality: v.number(),            // Casual (1) ↔ Formal (10)
    patience: v.number(),             // Brief (1) ↔ Patient/Thorough (10)
    encouragement: v.number(),        // Neutral (1) ↔ Highly Encouraging (10)
    humor: v.number(),                // Serious (1) ↔ Humorous (10)
    directness: v.number(),           // Indirect (1) ↔ Direct (10)
    empathy: v.number(),              // Analytical (1) ↔ Empathetic (10)
  }),
  
  // Communication Style
  style: v.object({
    sentenceLength: v.union(
      v.literal("short"),             // Brief, punchy
      v.literal("medium"),            // Balanced
      v.literal("long")               // Detailed, flowing
    ),
    vocabulary: v.union(
      v.literal("simple"),            // Plain language
      v.literal("professional"),      // Industry-appropriate
      v.literal("academic")           // Scholarly
    ),
    useAnalogies: v.boolean(),        // Uses metaphors/examples
    askQuestions: v.union(
      v.literal("rarely"),
      v.literal("sometimes"),
      v.literal("frequently")
    ),
  }),
  
  // Behavioral Patterns
  behaviors: v.object({
    greetingStyle: v.string(),        // How they open conversations
    farewellStyle: v.string(),        // How they end conversations
    errorHandling: v.string(),        // How they handle mistakes
    uncertaintyExpression: v.string(),// How they express doubt
    praiseStyle: v.string(),          // How they give positive feedback
    correctionStyle: v.string(),      // How they correct errors
  }),
  
  // Voice Characteristics (for TTS tuning)
  voiceHints: v.object({
    pace: v.union(v.literal("slow"), v.literal("medium"), v.literal("fast")),
    energy: v.union(v.literal("calm"), v.literal("moderate"), v.literal("energetic")),
    emotionRange: v.union(v.literal("reserved"), v.literal("moderate"), v.literal("expressive")),
  }),
  
  // Metadata
  domain: v.optional(v.string()),     // "education", "medical", "therapy"
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### Example Personalities

```json
{
  "personalityId": "emma-warm-teacher",
  "name": "Warm English Teacher",
  "traits": {
    "warmth": 9,
    "formality": 4,
    "patience": 9,
    "encouragement": 10,
    "humor": 6,
    "directness": 5,
    "empathy": 8
  },
  "style": {
    "sentenceLength": "medium",
    "vocabulary": "professional",
    "useAnalogies": true,
    "askQuestions": "frequently"
  },
  "behaviors": {
    "greetingStyle": "Warm and personal, asks how they're doing",
    "farewellStyle": "Encouraging, mentions progress made",
    "errorHandling": "Gentle correction, finds the positive first",
    "uncertaintyExpression": "Honest but reassuring",
    "praiseStyle": "Specific and genuine, celebrates small wins",
    "correctionStyle": "Sandwich method - positive, correction, positive"
  }
}
```

```json
{
  "personalityId": "dr-clinical-advisor",
  "name": "Clinical Medical Advisor",
  "traits": {
    "warmth": 5,
    "formality": 8,
    "patience": 7,
    "encouragement": 4,
    "humor": 2,
    "directness": 9,
    "empathy": 6
  },
  "style": {
    "sentenceLength": "medium",
    "vocabulary": "professional",
    "useAnalogies": true,
    "askQuestions": "frequently"
  },
  "behaviors": {
    "greetingStyle": "Professional, gets to the point quickly",
    "farewellStyle": "Clear next steps, offers to answer more questions",
    "errorHandling": "Factual correction with explanation",
    "uncertaintyExpression": "Clear about limitations, suggests professional consultation",
    "praiseStyle": "Acknowledgment of good questions/decisions",
    "correctionStyle": "Direct but not harsh, evidence-based"
  }
}
```

---

## 2. Identity System (Backstory/History)

### Purpose
Makes the avatar feel like a real person with a life story. Users connect more deeply with avatars that have history, credentials, and personal anecdotes.

### Schema

```typescript
identity: defineTable({
  // Link to avatar
  avatarId: v.id("avatars"),
  
  // Basic Identity
  fullName: v.string(),               // "Professor Emma Richardson"
  preferredName: v.string(),          // "Emma"
  title: v.string(),                  // "Dr.", "Professor", "Coach"
  pronouns: v.optional(v.string()),   // "she/her"
  
  // Professional Background
  credentials: v.array(v.object({
    degree: v.string(),               // "PhD in Applied Linguistics"
    institution: v.string(),          // "University of Oxford"
    year: v.number(),                 // 2008
    details: v.optional(v.string()),  // "Thesis on second language acquisition"
  })),
  
  // Career History
  careerHistory: v.array(v.object({
    role: v.string(),                 // "Senior Lecturer"
    organization: v.string(),         // "Cambridge Language Institute"
    yearStart: v.number(),
    yearEnd: v.optional(v.number()),  // null = current
    highlights: v.array(v.string()),  // Notable achievements
  })),
  
  // Personal Background (makes them relatable)
  personalBackground: v.object({
    nationality: v.optional(v.string()),
    birthplace: v.optional(v.string()),
    currentLocation: v.optional(v.string()),
    languages: v.array(v.object({
      language: v.string(),
      proficiency: v.string(),
      story: v.optional(v.string()),  // "I learned German when I lived in Munich..."
    })),
    hobbies: v.optional(v.array(v.string())),
    familyContext: v.optional(v.string()),  // "I have two kids who..."
  }),
  
  // Anecdotes (stories they can reference)
  anecdotes: v.array(v.object({
    topic: v.string(),                // "learning_struggles"
    story: v.string(),                // "When I was learning German, I once..."
    context: v.string(),              // When to use this anecdote
    emotions: v.array(v.string()),    // ["empathy", "humor", "encouragement"]
  })),
  
  // Teaching Philosophy (or professional philosophy)
  philosophy: v.object({
    coreBeliefs: v.array(v.string()), // "Everyone can learn if given the right approach"
    approachDescription: v.string(),  // How they approach their work
    influences: v.optional(v.array(v.string())), // People/ideas that shaped them
  }),
  
  // Generated Biography (for display)
  shortBio: v.string(),               // 2-3 sentences
  fullBio: v.string(),                // Full paragraph
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### Example Identity

```json
{
  "fullName": "Professor Emma Catherine Richardson",
  "preferredName": "Emma",
  "title": "Professor",
  "credentials": [
    {
      "degree": "PhD in Applied Linguistics",
      "institution": "University of Oxford",
      "year": 2008,
      "details": "Thesis: 'Cognitive Strategies in Adult Second Language Acquisition'"
    },
    {
      "degree": "MA in TESOL",
      "institution": "University of Cambridge",
      "year": 2004
    },
    {
      "degree": "BA in Modern Languages",
      "institution": "University of Edinburgh",
      "year": 2002
    }
  ],
  "careerHistory": [
    {
      "role": "Professor of Language Education",
      "organization": "Oxford Language Centre",
      "yearStart": 2018,
      "yearEnd": null,
      "highlights": [
        "Developed the 'Adaptive Language Method'",
        "Published 3 textbooks on business English",
        "Trained over 200 language teachers"
      ]
    },
    {
      "role": "Senior Lecturer",
      "organization": "Cambridge English Academy",
      "yearStart": 2010,
      "yearEnd": 2018,
      "highlights": [
        "Created corporate training programs for BMW and Siemens",
        "95% student satisfaction rating"
      ]
    }
  ],
  "personalBackground": {
    "nationality": "British",
    "birthplace": "Edinburgh, Scotland",
    "currentLocation": "Oxford, England",
    "languages": [
      {
        "language": "English",
        "proficiency": "Native"
      },
      {
        "language": "German",
        "proficiency": "C2 - Near native",
        "story": "I spent three years in Munich during my postdoc research. My landlord spoke no English, so I had to learn quickly - including all the Bavarian dialect!"
      },
      {
        "language": "French",
        "proficiency": "B2 - Upper intermediate",
        "story": "I studied French in university. I still mix up past tenses sometimes, which reminds me that even language teachers make mistakes!"
      }
    ],
    "hobbies": ["hiking in the Cotswolds", "playing piano", "reading historical fiction"],
    "familyContext": "I have a 12-year-old daughter who's learning Spanish - watching her learn reminds me why I love teaching."
  },
  "anecdotes": [
    {
      "topic": "making_mistakes",
      "story": "When I first moved to Munich, I tried to say 'I'm hot' (mir ist heiß) but accidentally said 'ich bin heiß' which means 'I'm attractive'. The whole café laughed! I still remember that embarrassment - it taught me that mistakes are how we learn.",
      "context": "Use when student makes an embarrassing mistake",
      "emotions": ["humor", "empathy", "encouragement"]
    },
    {
      "topic": "persistence",
      "story": "One of my students in Cambridge, Thomas, struggled for two years with the present perfect. We must have practiced it a hundred times. Then one day it just clicked. He went on to become a translator at the EU. That's what persistence looks like.",
      "context": "Use when student is frustrated with slow progress",
      "emotions": ["encouragement", "hope"]
    }
  ],
  "philosophy": {
    "coreBeliefs": [
      "Every person can become fluent with the right approach",
      "Mistakes are not failures, they're stepping stones",
      "Language learning should feel like a conversation, not a test",
      "Small daily progress beats occasional intensive study"
    ],
    "approachDescription": "I believe in meeting each learner where they are. Some people need structure, others need freedom. My job is to figure out what works for you specifically."
  },
  "shortBio": "Professor Emma Richardson is an Oxford-based language education specialist with over 15 years of experience teaching business English to German-speaking professionals.",
  "fullBio": "Professor Emma Catherine Richardson holds a PhD in Applied Linguistics from Oxford, where she developed groundbreaking research on adult language acquisition. After eight years at Cambridge English Academy - where she created award-winning corporate training programs for companies like BMW and Siemens - she returned to Oxford to lead the Language Education department. Fluent in German from her three years in Munich, Emma brings both academic rigor and personal experience to her teaching. Outside the classroom, she enjoys hiking the Cotswolds and watching her daughter struggle with Spanish conjugations ('it reminds me why I do this work'). Her teaching philosophy centers on the belief that everyone can achieve fluency with the right personalized approach."
}
```

---

## 3. Knowledge Base System

### Purpose
Give the avatar access to domain-specific knowledge beyond what's in the LLM's training data.

### Architecture Options

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE BASE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: Convex + Vector Search (Already have this)           │
│  ─────────────────────────────────────────────────              │
│  ✅ You already have Convex with vector search                  │
│  ✅ Good for structured content (lessons, templates)            │
│  ⚠️  Less sophisticated for complex retrieval                   │
│                                                                  │
│  Option B: Zep Knowledge Base (Recommended)                      │
│  ──────────────────────────────────────                         │
│  ✅ Native RAG for conversations                                │
│  ✅ Entity extraction + relationship mapping                    │
│  ✅ Temporal awareness (knows when things were said)            │
│  ✅ Integrates with memory system                               │
│                                                                  │
│  Option C: Hybrid (Best of Both)                                 │
│  ──────────────────────────────                                 │
│  • Convex: Structured data (lessons, user profiles, config)     │
│  • Zep: Conversation memory + document knowledge                │
│  • Query both and merge results                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended: Hybrid Architecture

```typescript
knowledgeBase: defineTable({
  avatarId: v.id("avatars"),
  
  // Knowledge Sources
  sources: v.array(v.object({
    sourceId: v.string(),
    type: v.union(
      v.literal("document"),          // PDFs, docs
      v.literal("video_transcript"),   // YouTube, training videos
      v.literal("structured_data"),    // JSON, database entries
      v.literal("faq"),               // Q&A pairs
      v.literal("glossary"),          // Term definitions
      v.literal("procedure"),         // Step-by-step guides
      v.literal("case_study"),        // Examples and scenarios
      v.literal("external_api")       // Dynamic data sources
    ),
    name: v.string(),
    description: v.string(),
    contentUrl: v.optional(v.string()),
    embeddings: v.optional(v.string()), // Reference to vector store
    lastUpdated: v.number(),
    priority: v.number(),             // Higher = more relevant
  })),
  
  // Domain Configuration
  domain: v.object({
    primaryTopic: v.string(),         // "business_english", "medical_diagnosis"
    subtopics: v.array(v.string()),
    expertise: v.array(v.string()),   // Specific areas of deep knowledge
    limitations: v.array(v.string()), // What the avatar should NOT advise on
  }),
  
  // Retrieval Settings
  retrievalSettings: v.object({
    maxContextChunks: v.number(),     // How many chunks to retrieve
    similarityThreshold: v.number(),  // Min relevance score
    preferRecent: v.boolean(),        // Weight recent knowledge higher
    includeMetadata: v.boolean(),     // Include source info in response
  }),
})
```

### Knowledge Categories by Use Case

```
┌─────────────────────────────────────────────────────────────────┐
│  LANGUAGE TEACHING                                               │
│  ────────────────                                               │
│  • Grammar rules and explanations                                │
│  • Vocabulary lists with examples                                │
│  • Common errors and corrections                                 │
│  • Pronunciation guides                                          │
│  • Cultural context                                              │
│  • Industry-specific terminology                                 │
│  • Exam preparation materials                                    │
├─────────────────────────────────────────────────────────────────┤
│  MEDICAL CONSULTATION                                            │
│  ────────────────────                                           │
│  • Symptom databases                                             │
│  • Treatment guidelines                                          │
│  • Drug interaction information                                  │
│  • Diagnostic decision trees                                     │
│  • Patient education materials                                   │
│  • Red flag indicators (when to refer)                           │
│  ⚠️ Disclaimer requirements                                     │
├─────────────────────────────────────────────────────────────────┤
│  THERAPY SUPPORT                                                 │
│  ───────────────                                                │
│  • CBT techniques and exercises                                  │
│  • Coping strategies                                             │
│  • Mindfulness scripts                                           │
│  • Crisis resources                                              │
│  • Progress tracking frameworks                                  │
│  ⚠️ Boundary awareness (when to refer to human)                 │
├─────────────────────────────────────────────────────────────────┤
│  CORPORATE TRAINING                                              │
│  ──────────────────                                             │
│  • Company policies and procedures                               │
│  • Product documentation                                         │
│  • Sales playbooks                                               │
│  • Compliance requirements                                       │
│  • Best practices guides                                         │
│  • FAQ libraries                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Memory System (Zep Integration)

### Why Zep?

Zep provides:
- **Long-term memory** - Remembers across sessions
- **Entity extraction** - Automatically identifies people, places, topics
- **Fact synthesis** - Creates facts from conversations
- **Semantic search** - Finds relevant memories
- **Temporal awareness** - Knows when things happened
- **User graphs** - Maps relationships between entities

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ZEP MEMORY ARCHITECTURE                      │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Session   │ ──▶ │    Zep      │ ──▶ │   Memory    │       │
│  │  Messages   │     │  Processor  │     │   Store     │       │
│  └─────────────┘     └──────┬──────┘     └─────────────┘       │
│                             │                                    │
│                   ┌─────────▼─────────┐                         │
│                   │  Entity Extractor │                         │
│                   └─────────┬─────────┘                         │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│  ┌──────▼──────┐    ┌───────▼───────┐   ┌──────▼──────┐       │
│  │   Facts     │    │   Entities    │   │  Episodes   │       │
│  │ "User is B1 │    │ "John - user" │   │ "Lesson on  │       │
│  │  level"     │    │ "BMW - work"  │   │  Jan 15"    │       │
│  └─────────────┘    └───────────────┘   └─────────────┘       │
│                                                                  │
│  RETRIEVAL AT RUNTIME                                           │
│  ────────────────────                                           │
│  Context: "How am I doing with conditionals?"                    │
│  Zep returns:                                                    │
│  • Fact: "User struggles with third conditional"                │
│  • Fact: "User works at BMW in engineering"                     │
│  • Episode: "Last session covered second conditional"           │
│  • Entity: "User prefers examples from automotive industry"     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Zep Schema/Integration

```typescript
// Types for Zep integration
interface ZepUserMemory {
  userId: string;              // Maps to your user ID
  sessionId: string;           // Current conversation
  
  // Retrieved context
  facts: ZepFact[];            // Extracted facts about user
  entities: ZepEntity[];       // People, places, things mentioned
  relevantMemories: ZepMemory[]; // Past conversations
}

interface ZepFact {
  fact: string;                // "User's English level is B1"
  createdAt: Date;
  rating: number;              // Confidence/relevance
}

interface ZepEntity {
  name: string;                // "BMW"
  type: string;                // "organization"
  summary: string;             // "User's employer, automotive company"
  relationships: string[];     // How it connects to other entities
}
```

### Memory Categories to Track

```typescript
memoryCategories: {
  // User Profile (persistent)
  profile: {
    level: string,             // "B1", "B2", etc.
    nativeLanguage: string,
    goals: string[],
    preferredTopics: string[],
    communicationStyle: string,
    timezone: string,
    sessionFrequency: string,
  },
  
  // Learning Progress (for education)
  progress: {
    strongAreas: string[],
    weakAreas: string[],
    currentFocus: string,
    masteredTopics: string[],
    strugglingTopics: string[],
    mistakePatterns: string[],
  },
  
  // Personal Context (for relationship building)
  personal: {
    workplace: string,
    industry: string,
    role: string,
    interests: string[],
    family: string,
    upcomingEvents: string[],  // "Business trip to London next month"
  },
  
  // Session History
  sessions: {
    totalSessions: number,
    lastSession: Date,
    recentTopics: string[],
    unfinishedTopics: string[],
    pendingFollowups: string[],
  },
  
  // Emotional State
  emotional: {
    currentMood: string,
    frustrationTriggers: string[],
    motivators: string[],
    confidenceLevel: string,
  }
}
```

---

## 5. System Prompt Engine

### Purpose
Assembles all configuration into a coherent system prompt at runtime.

### Assembly Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT ASSEMBLY                        │
│                                                                  │
│  ┌─────────────┐                                                │
│  │ Personality │ ──▶ "You are warm, patient, encouraging..."    │
│  └─────────────┘                                                │
│         │                                                        │
│  ┌──────▼──────┐                                                │
│  │  Identity   │ ──▶ "Your name is Emma Richardson, PhD from   │
│  └─────────────┘      Oxford. You spent 3 years in Munich..."   │
│         │                                                        │
│  ┌──────▼──────┐                                                │
│  │  Knowledge  │ ──▶ "You have expertise in: business English,  │
│  └─────────────┘      grammar, pronunciation..."                 │
│         │                                                        │
│  ┌──────▼──────┐                                                │
│  │   Memory    │ ──▶ "The user is B1 level, works at BMW,      │
│  │   (Zep)     │      struggled with conditionals last time..." │
│  └─────────────┘                                                │
│         │                                                        │
│  ┌──────▼──────┐                                                │
│  │   Domain    │ ──▶ "You are teaching English. Focus on..."   │
│  │   Rules     │                                                 │
│  └─────────────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐       │
│  │            ASSEMBLED SYSTEM PROMPT                   │       │
│  │  (Sent to LLM at start of each conversation)        │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### System Prompt Template

```typescript
function assembleSystemPrompt(config: AvatarConfig): string {
  return `
# IDENTITY

You are ${config.identity.fullName} (${config.identity.preferredName}).
${config.identity.shortBio}

## Your Background
${generateBackgroundSection(config.identity)}

## Your Credentials
${config.identity.credentials.map(c => `- ${c.degree}, ${c.institution} (${c.year})`).join('\n')}

# PERSONALITY

## Core Traits
${generateTraitDescription(config.personality.traits)}

## Communication Style
- Sentence length: ${config.personality.style.sentenceLength}
- Vocabulary level: ${config.personality.style.vocabulary}
- Use analogies: ${config.personality.style.useAnalogies ? 'Yes, frequently' : 'Occasionally'}
- Ask questions: ${config.personality.style.askQuestions}

## Behavioral Patterns
- Greeting style: ${config.personality.behaviors.greetingStyle}
- How you handle mistakes: ${config.personality.behaviors.errorHandling}
- How you give praise: ${config.personality.behaviors.praiseStyle}
- How you correct: ${config.personality.behaviors.correctionStyle}

# USER CONTEXT (from memory)

## About This User
${config.memory.profile ? generateUserProfile(config.memory.profile) : 'New user - learn about them.'}

## Recent History
${config.memory.sessions ? generateSessionHistory(config.memory.sessions) : 'First session.'}

## Key Facts
${config.memory.facts ? config.memory.facts.map(f => `- ${f.fact}`).join('\n') : 'None yet.'}

# DOMAIN RULES

${config.domainRules}

# ANECDOTES YOU CAN USE

${config.identity.anecdotes.map(a => `
**${a.topic}**: ${a.story}
(Use when: ${a.context})
`).join('\n')}

# IMPORTANT GUIDELINES

1. Stay in character as ${config.identity.preferredName} at all times
2. Reference your background naturally when relevant
3. Remember and reference what you know about this user
4. ${config.personality.behaviors.errorHandling}
5. ${config.personality.behaviors.praiseStyle}
`;
}
```

---

## 6. Voice Quality Improvements

### Issue: Words Being Cut Off

This is a common TTS issue with streaming. Solutions:

```typescript
// TTS Configuration for Cartesia
ttsSettings: {
  // Add silence padding at end
  endPaddingMs: 300,           // 300ms silence after speech
  
  // Sentence boundary detection
  chunkBySentence: true,       // Don't cut mid-sentence
  minChunkLength: 50,          // Minimum characters per chunk
  
  // Speed/clarity tradeoff
  speed: 0.95,                 // Slightly slower = clearer
  stability: 0.8,              // Higher = more consistent
  
  // Model selection
  model: "sonic-3",            // Latest model
  language: "de",              // Primary language
  
  // Emotion settings
  emotion: "neutral",          // or "warm", "enthusiastic"
  emotionIntensity: 0.5,
}
```

### LLM Output Formatting

Tell the LLM to format output for better TTS:

```
SPEECH OUTPUT RULES:
1. Complete every sentence - never trail off with "..."
2. Pause markers: Use "..." for deliberate pauses
3. No abbreviations - say "for example" not "e.g."
4. Numbers: Write out "twenty-three" not "23"
5. End statements clearly - don't let sentences hang
6. Use punctuation to indicate natural pauses
```

---

## 7. Admin Configuration Interface

### Avatar Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  CREATE NEW AVATAR                                Step 1 of 5   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 1: BASIC IDENTITY                                 │   │
│  │  ───────────────────────                                │   │
│  │                                                          │   │
│  │  Name: [Professor Emma Richardson          ]            │   │
│  │  Preferred Name: [Emma                     ]            │   │
│  │  Title: [Professor ▼]                                   │   │
│  │                                                          │   │
│  │  Primary Domain:                                         │   │
│  │  ○ Language Teaching                                     │   │
│  │  ○ Medical Consultation                                  │   │
│  │  ○ Therapy Support                                       │   │
│  │  ○ Corporate Training                                    │   │
│  │  ○ Custom: [________________]                           │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                           [Back] [Next: Personality →]          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CREATE NEW AVATAR                                Step 2 of 5   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 2: PERSONALITY                                    │   │
│  │  ───────────────────                                    │   │
│  │                                                          │   │
│  │  Warmth                                                  │   │
│  │  Cold ─────────────────●───────── Warm                  │   │
│  │                        7                                 │   │
│  │                                                          │   │
│  │  Formality                                               │   │
│  │  Casual ───────●─────────────────── Formal              │   │
│  │               4                                          │   │
│  │                                                          │   │
│  │  Patience                                                │   │
│  │  Brief ──────────────────●──────── Thorough             │   │
│  │                          8                               │   │
│  │                                                          │   │
│  │  [Use Preset: Warm Teacher ▼]  [AI Generate from Domain] │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                           [← Back] [Next: Backstory →]          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CREATE NEW AVATAR                                Step 3 of 5   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 3: BACKSTORY & CREDENTIALS                        │   │
│  │  ───────────────────────────────                        │   │
│  │                                                          │   │
│  │  [AI Generate Complete Backstory]                       │   │
│  │                                                          │   │
│  │  Or fill manually:                                       │   │
│  │                                                          │   │
│  │  Education:                                              │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ PhD Applied Linguistics - Oxford (2008)           │  │   │
│  │  │ MA TESOL - Cambridge (2004)                       │  │   │
│  │  │ [+ Add Credential]                                │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Career History:                                         │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Professor - Oxford Language Centre (2018-present) │  │   │
│  │  │ [+ Add Position]                                  │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Personal Story:                                         │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Lived in Munich for 3 years, learned German...    │  │   │
│  │  │                                                    │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                           [← Back] [Next: Knowledge →]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Roadmap

### Phase 1: Core Configuration System (Week 1-2)
- [ ] Define Convex schemas for personality, identity, knowledge
- [ ] Build admin UI for avatar configuration
- [ ] Create system prompt assembly engine
- [ ] Add personality presets library

### Phase 2: Zep Memory Integration (Week 2-3)
- [ ] Set up Zep account and API
- [ ] Create user memory wrapper
- [ ] Implement memory retrieval at session start
- [ ] Add memory updates during/after sessions
- [ ] Test cross-session memory persistence

### Phase 3: Knowledge Base (Week 3-4)
- [ ] Design knowledge ingestion pipeline
- [ ] Implement document processing (PDF, video transcripts)
- [ ] Set up RAG retrieval
- [ ] Create admin interface for knowledge management
- [ ] Test domain-specific retrieval

### Phase 4: Voice Quality (Week 4)
- [ ] Implement sentence-boundary detection
- [ ] Add end-of-speech padding
- [ ] Fine-tune TTS settings
- [ ] Test with various content types

### Phase 5: Integration Testing (Week 5)
- [ ] End-to-end testing with complete avatar config
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deploy to production

---

## 9. Database Schema (Complete)

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // AVATAR CONFIGURATION
  // ============================================
  
  avatars: defineTable({
    // Identity
    avatarId: v.string(),
    slug: v.string(),
    name: v.string(),
    isActive: v.boolean(),
    isDefault: v.boolean(),
    
    // Link to configuration
    personalityId: v.id("personalities"),
    identityId: v.id("identities"),
    knowledgeBaseId: v.optional(v.id("knowledgeBases")),
    
    // Voice
    voice: v.object({
      provider: v.union(v.literal("cartesia"), v.literal("elevenlabs")),
      voiceId: v.string(),
      language: v.string(),
      speed: v.number(),
      settings: v.optional(v.any()),
    }),
    
    // Appearance
    appearance: v.object({
      avatarImage: v.string(),
      thumbnailImage: v.string(),
      accentColor: v.optional(v.string()),
    }),
    
    // Domain
    domain: v.string(), // "language_teaching", "medical", "therapy", etc.
    domainConfig: v.optional(v.any()),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_domain", ["domain"])
    .index("by_active", ["isActive"]),

  personalities: defineTable({
    personalityId: v.string(),
    name: v.string(),
    description: v.string(),
    
    traits: v.object({
      warmth: v.number(),
      formality: v.number(),
      patience: v.number(),
      encouragement: v.number(),
      humor: v.number(),
      directness: v.number(),
      empathy: v.number(),
    }),
    
    style: v.object({
      sentenceLength: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
      vocabulary: v.union(v.literal("simple"), v.literal("professional"), v.literal("academic")),
      useAnalogies: v.boolean(),
      askQuestions: v.union(v.literal("rarely"), v.literal("sometimes"), v.literal("frequently")),
    }),
    
    behaviors: v.object({
      greetingStyle: v.string(),
      farewellStyle: v.string(),
      errorHandling: v.string(),
      uncertaintyExpression: v.string(),
      praiseStyle: v.string(),
      correctionStyle: v.string(),
    }),
    
    voiceHints: v.object({
      pace: v.union(v.literal("slow"), v.literal("medium"), v.literal("fast")),
      energy: v.union(v.literal("calm"), v.literal("moderate"), v.literal("energetic")),
      emotionRange: v.union(v.literal("reserved"), v.literal("moderate"), v.literal("expressive")),
    }),
    
    isPreset: v.boolean(),
    domain: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_personalityId", ["personalityId"])
    .index("by_preset", ["isPreset"]),

  identities: defineTable({
    fullName: v.string(),
    preferredName: v.string(),
    title: v.string(),
    pronouns: v.optional(v.string()),
    
    credentials: v.array(v.object({
      degree: v.string(),
      institution: v.string(),
      year: v.number(),
      details: v.optional(v.string()),
    })),
    
    careerHistory: v.array(v.object({
      role: v.string(),
      organization: v.string(),
      yearStart: v.number(),
      yearEnd: v.optional(v.number()),
      highlights: v.array(v.string()),
    })),
    
    personalBackground: v.object({
      nationality: v.optional(v.string()),
      birthplace: v.optional(v.string()),
      currentLocation: v.optional(v.string()),
      languages: v.array(v.object({
        language: v.string(),
        proficiency: v.string(),
        story: v.optional(v.string()),
      })),
      hobbies: v.optional(v.array(v.string())),
      familyContext: v.optional(v.string()),
    }),
    
    anecdotes: v.array(v.object({
      topic: v.string(),
      story: v.string(),
      context: v.string(),
      emotions: v.array(v.string()),
    })),
    
    philosophy: v.object({
      coreBeliefs: v.array(v.string()),
      approachDescription: v.string(),
      influences: v.optional(v.array(v.string())),
    }),
    
    shortBio: v.string(),
    fullBio: v.string(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  knowledgeBases: defineTable({
    avatarId: v.optional(v.id("avatars")),
    name: v.string(),
    description: v.string(),
    
    sources: v.array(v.object({
      sourceId: v.string(),
      type: v.union(
        v.literal("document"),
        v.literal("video_transcript"),
        v.literal("structured_data"),
        v.literal("faq"),
        v.literal("glossary"),
        v.literal("procedure"),
        v.literal("case_study"),
        v.literal("external_api")
      ),
      name: v.string(),
      description: v.string(),
      contentUrl: v.optional(v.string()),
      vectorStoreRef: v.optional(v.string()),
      lastUpdated: v.number(),
      priority: v.number(),
    })),
    
    domain: v.object({
      primaryTopic: v.string(),
      subtopics: v.array(v.string()),
      expertise: v.array(v.string()),
      limitations: v.array(v.string()),
    }),
    
    retrievalSettings: v.object({
      maxContextChunks: v.number(),
      similarityThreshold: v.number(),
      preferRecent: v.boolean(),
      includeMetadata: v.boolean(),
    }),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ============================================
  // ZEP MEMORY SYNC
  // ============================================
  
  userMemorySync: defineTable({
    userId: v.string(),
    zepUserId: v.string(),
    lastSyncedAt: v.number(),
    
    // Cached facts for quick access
    cachedFacts: v.optional(v.array(v.object({
      fact: v.string(),
      category: v.string(),
      confidence: v.number(),
      createdAt: v.number(),
    }))),
    
    // User profile summary
    profileSummary: v.optional(v.object({
      level: v.optional(v.string()),
      goals: v.optional(v.array(v.string())),
      preferences: v.optional(v.any()),
      strongAreas: v.optional(v.array(v.string())),
      weakAreas: v.optional(v.array(v.string())),
    })),
  })
    .index("by_userId", ["userId"])
    .index("by_zepUserId", ["zepUserId"]),

  // ============================================
  // SESSIONS & ANALYTICS
  // ============================================
  
  sessions: defineTable({
    sessionId: v.string(),
    userId: v.string(),
    avatarId: v.id("avatars"),
    
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    
    // Session context
    topic: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    
    // Metrics
    metrics: v.optional(v.object({
      messageCount: v.number(),
      userSpeakingTime: v.number(),
      avatarSpeakingTime: v.number(),
      topicsDiscussed: v.array(v.string()),
      memoryUpdates: v.number(),
    })),
    
    // Notes for next session
    followUpItems: v.optional(v.array(v.string())),
    
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_avatarId", ["avatarId"])
    .index("by_sessionId", ["sessionId"]),
});
```

---

## Summary

This architecture transforms Emma from a "teaching app" into a **configurable AI avatar platform** where:

1. **Personality** is defined by trait sliders and behavioral patterns
2. **Identity** is a complete backstory with credentials, history, and anecdotes
3. **Knowledge** comes from RAG over domain-specific documents
4. **Memory** (via Zep) provides persistent user context across sessions

The same infrastructure can deploy:
- Emma the English teacher
- Dr. Schmidt the medical advisor
- Alex the therapy companion
- Jordan the corporate trainer

All with different personalities, histories, knowledge bases, and memory patterns - but the same underlying platform.
