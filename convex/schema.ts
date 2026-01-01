import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("student"),
      v.literal("guest")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("banned"),
      v.literal("pending")
    ),
    lastLoginAt: v.optional(v.number()),
    loginCount: v.number(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"]),

  students: defineTable({
    userId: v.id("users"),
    nativeLanguage: v.string(),
    targetLanguage: v.string(),
    currentLevel: v.string(),
    targetLevel: v.optional(v.string()),
    learningGoal: v.union(
      v.literal("career"),
      v.literal("travel"),
      v.literal("exam"),
      v.literal("personal"),
      v.literal("academic")
    ),
    focusAreas: v.optional(v.array(v.string())),
    totalLessonsCompleted: v.number(),
    totalMinutesPracticed: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastLessonAt: v.optional(v.number()),
    preferences: v.object({
      bilingualMode: v.union(
        v.literal("adaptive"),
        v.literal("code_switching"),
        v.literal("strict_separation"),
        v.literal("target_only")
      ),
      lessonDuration: v.number(),
      reminderTime: v.optional(v.string()),
      preferredAvatarId: v.optional(v.id("avatars")),
      voiceSpeed: v.optional(v.number()),
    }),
    onboardingCompleted: v.boolean(),
    assessmentCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_level", ["currentLevel"])
    .index("by_streak", ["currentStreak"]),

  avatars: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    avatarProvider: v.object({
      type: v.union(
        v.literal("beyond_presence"),
        v.literal("hedra"),
        v.literal("tavus")
      ),
      avatarId: v.string(),
      settings: v.optional(
        v.object({
          resolution: v.optional(v.string()),
          fps: v.optional(v.number()),
          background: v.optional(v.string()),
        })
      ),
    }),
    voiceProvider: v.object({
      type: v.union(
        v.literal("cartesia"),
        v.literal("elevenlabs"),
        v.literal("openai")
      ),
      voiceId: v.string(),
      language: v.string(),
      model: v.optional(v.string()),
      settings: v.object({
        speed: v.number(),
        pitch: v.optional(v.number()),
        stability: v.optional(v.number()),
        emotion: v.optional(v.string()),
      }),
      languageVoices: v.optional(
        v.object({
          en: v.optional(v.string()),
          de: v.optional(v.string()),
        })
      ),
    }),
    llmConfig: v.object({
      provider: v.union(
        v.literal("openrouter"),
        v.literal("anthropic"),
        v.literal("openai")
      ),
      model: v.string(),
      temperature: v.number(),
      maxTokens: v.number(),
      fastModel: v.optional(v.string()),
    }),
    // Vision configuration for webcam/screen capture
    visionConfig: v.optional(
      v.object({
        enabled: v.boolean(),
        visionLLMModel: v.optional(v.string()), // Model for image analysis (e.g., gemini-flash-1.5)
        captureMode: v.optional(
          v.union(
            v.literal("on_demand"),   // Only when user asks or shows something
            v.literal("always"),      // Every turn
            v.literal("smart")        // AI decides when to look
          )
        ),
        captureWebcam: v.optional(v.boolean()),
        captureScreen: v.optional(v.boolean()),
      })
    ),
    persona: v.object({
      role: v.string(),
      personality: v.string(),
      expertise: v.array(v.string()),
      teachingStyle: v.union(
        v.literal("socratic"),
        v.literal("direct"),
        v.literal("supportive"),
        v.literal("challenging")
      ),
      backstory: v.optional(v.string()),
    }),
    bilingualConfig: v.object({
      supportedLanguages: v.array(v.string()),
      defaultMode: v.union(
        v.literal("adaptive"),
        v.literal("code_switching"),
        v.literal("strict_separation"),
        v.literal("target_only")
      ),
      germanThresholds: v.object({
        A1: v.number(),
        A2: v.number(),
        B1: v.number(),
        B2: v.number(),
        C1: v.number(),
        C2: v.number(),
      }),
    }),
    systemPrompts: v.object({
      base: v.string(),
      levelAdaptations: v.optional(
        v.object({
          A1: v.optional(v.string()),
          A2: v.optional(v.string()),
          B1: v.optional(v.string()),
          B2: v.optional(v.string()),
          C1: v.optional(v.string()),
          C2: v.optional(v.string()),
        })
      ),
    }),
    behaviorRules: v.object({
      maxResponseLength: v.number(),
      preferShortResponses: v.boolean(),
      askQuestionsFrequency: v.union(
        v.literal("always"),
        v.literal("often"),
        v.literal("sometimes"),
        v.literal("rarely")
      ),
      waitForStudentResponse: v.boolean(),
      maxWaitTimeSeconds: v.number(),
    }),
    appearance: v.object({
      avatarImage: v.string(),
      thumbnailImage: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      accentColor: v.optional(v.string()),
    }),
    // NEW: Structured Personality System (optional for backward compatibility)
    personality: v.optional(
      v.object({
        // Core Traits (1-10 scale)
        traits: v.object({
          warmth: v.number(), // Cold (1) to Warm (10)
          formality: v.number(), // Casual (1) to Formal (10)
          patience: v.number(), // Brief (1) to Thorough (10)
          encouragement: v.number(), // Neutral (1) to Highly Encouraging (10)
          humor: v.number(), // Serious (1) to Humorous (10)
          directness: v.number(), // Indirect (1) to Direct (10)
          empathy: v.number(), // Analytical (1) to Empathetic (10)
        }),
        // Communication Style
        style: v.object({
          sentenceLength: v.union(
            v.literal("short"),
            v.literal("medium"),
            v.literal("long")
          ),
          vocabulary: v.union(
            v.literal("simple"),
            v.literal("professional"),
            v.literal("academic")
          ),
          useAnalogies: v.boolean(),
          askQuestions: v.union(
            v.literal("rarely"),
            v.literal("sometimes"),
            v.literal("frequently")
          ),
        }),
        // Behavioral Patterns
        behaviors: v.object({
          greetingStyle: v.string(),
          farewellStyle: v.string(),
          errorHandling: v.string(),
          uncertaintyExpression: v.string(),
          praiseStyle: v.string(),
          correctionStyle: v.string(),
        }),
        // Voice Hints (for TTS tuning)
        voiceHints: v.optional(
          v.object({
            pace: v.union(
              v.literal("slow"),
              v.literal("medium"),
              v.literal("fast")
            ),
            energy: v.union(
              v.literal("calm"),
              v.literal("moderate"),
              v.literal("energetic")
            ),
            emotionRange: v.union(
              v.literal("reserved"),
              v.literal("moderate"),
              v.literal("expressive")
            ),
          })
        ),
      })
    ),
    // NEW: Extended Identity with Anecdotes
    identity: v.optional(
      v.object({
        fullName: v.string(),
        preferredName: v.string(),
        title: v.optional(v.string()),
        pronouns: v.optional(v.string()),
        // Credentials
        credentials: v.optional(
          v.array(
            v.object({
              degree: v.string(),
              institution: v.string(),
              year: v.number(),
              details: v.optional(v.string()),
            })
          )
        ),
        // Career History
        careerHistory: v.optional(
          v.array(
            v.object({
              role: v.string(),
              organization: v.string(),
              yearStart: v.number(),
              yearEnd: v.optional(v.number()), // null = current
              highlights: v.array(v.string()),
            })
          )
        ),
        // Personal Background
        personalBackground: v.optional(
          v.object({
            nationality: v.optional(v.string()),
            birthplace: v.optional(v.string()),
            currentLocation: v.optional(v.string()),
            languages: v.optional(
              v.array(
                v.object({
                  language: v.string(),
                  proficiency: v.string(),
                  story: v.optional(v.string()), // Personal anecdote
                })
              )
            ),
            hobbies: v.optional(v.array(v.string())),
            familyContext: v.optional(v.string()),
          })
        ),
        // Anecdotes - Stories the avatar can reference naturally
        anecdotes: v.optional(
          v.array(
            v.object({
              topic: v.string(), // "making_mistakes", "persistence"
              story: v.string(), // The actual anecdote
              context: v.string(), // When to use
              emotions: v.array(v.string()), // ["humor", "empathy"]
            })
          )
        ),
        // Philosophy
        philosophy: v.optional(
          v.object({
            coreBeliefs: v.array(v.string()),
            approachDescription: v.string(),
            influences: v.optional(v.array(v.string())),
          })
        ),
        // Bios
        shortBio: v.optional(v.string()),
        fullBio: v.optional(v.string()),
      })
    ),
    // NEW: Knowledge Base Configuration
    knowledgeConfig: v.optional(
      v.object({
        knowledgeBaseIds: v.optional(v.array(v.id("knowledgeBases"))),
        domain: v.object({
          primaryTopic: v.string(),
          subtopics: v.array(v.string()),
          expertise: v.array(v.string()),
          limitations: v.array(v.string()),
        }),
        ragSettings: v.object({
          enabled: v.boolean(),
          triggerKeywords: v.array(v.string()),
          maxContextChunks: v.number(),
          similarityThreshold: v.number(),
          preferRecent: v.optional(v.boolean()),
        }),
      })
    ),
    // NEW: Memory Configuration
    memoryConfig: v.optional(
      v.object({
        autoExtractFacts: v.boolean(),
        trackingCategories: v.array(
          v.union(
            v.literal("profile"),
            v.literal("progress"),
            v.literal("personal"),
            v.literal("emotional"),
            v.literal("sessions")
          )
        ),
        shortTermRetentionDays: v.number(),
        longTermThreshold: v.optional(
          v.union(
            v.literal("critical"),
            v.literal("high"),
            v.literal("medium")
          )
        ),
      })
    ),
    // ============================================
    // LIFE STORY & SESSION START (Human-like Identity)
    // ============================================

    // Full markdown life story document (comprehensive background)
    lifeStoryDocument: v.optional(v.string()),

    // Condensed summary for system prompt (auto-generated or manual, ~500 words max)
    lifeStorySummary: v.optional(v.string()),

    // Session Start Configuration - how the avatar begins conversations
    sessionStartConfig: v.optional(
      v.object({
        // How session begins
        behavior: v.union(
          v.literal("speak_first"),      // Avatar greets immediately
          v.literal("wait_for_student"), // Wait for student to speak
          v.literal("contextual")        // Depends on time of day, etc.
        ),

        // Opening greeting template (supports variables)
        // Variables: {studentName}, {timeOfDay}, {lessonTopic}, {previousLesson}
        openingGreeting: v.optional(v.string()),

        // Fallback greetings if no template (used randomly)
        greetingVariations: v.optional(v.array(v.string())),

        // Suggested first topics (avatar can bring these up)
        openingTopics: v.optional(v.array(v.string())),

        // How long before transitioning to lesson content (seconds)
        warmUpDuration: v.optional(v.number()),

        // Whether to reference previous sessions
        mentionPreviousSession: v.optional(v.boolean()),
      })
    ),
    isActive: v.boolean(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"])
    .index("by_default", ["isDefault"]),

  lessons: defineTable({
    lessonId: v.string(),
    slug: v.string(),
    title_en: v.string(),
    title_de: v.string(),
    description_en: v.optional(v.string()),
    description_de: v.optional(v.string()),
    category: v.string(),
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    level: v.string(),
    estimatedMinutes: v.number(),
    objectives_en: v.array(v.string()),
    objectives_de: v.array(v.string()),
    slideSetId: v.optional(v.id("slideSets")),
    presentationId: v.optional(v.id("presentations")), // Auto-load presentation with lesson
    vocabularyIds: v.optional(v.array(v.id("vocabularyItems"))),
    prerequisiteLessons: v.optional(v.array(v.id("lessons"))),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_lesson_id", ["lessonId"])
    .index("by_category", ["category"])
    .index("by_level", ["level"])
    .index("by_status", ["status"])
    .index("by_order", ["order"]),

  slideSets: defineTable({
    name: v.string(),
    lessonId: v.optional(v.id("lessons")),
    slides: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("title"),
          v.literal("content"),
          v.literal("vocabulary"),
          v.literal("grammar"),
          v.literal("exercise"),
          v.literal("summary"),
          v.literal("image")
        ),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        content_de: v.optional(v.string()),
        items: v.optional(
          v.array(
            v.object({
              term: v.string(),
              definition: v.optional(v.string()),
              example: v.optional(v.string()),
            })
          )
        ),
        imageUrl: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
    theme: v.object({
      backgroundColor: v.string(),
      textColor: v.string(),
      accentColor: v.string(),
      fontFamily: v.optional(v.string()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_lesson", ["lessonId"]),

  presentations: defineTable({
    name: v.string(),
    originalFileName: v.string(),
    originalFileType: v.string(),
    uploadedBy: v.id("users"),
    slides: v.array(
      v.object({
        index: v.number(),
        storageId: v.id("_storage"),
        url: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
      })
    ),
    totalSlides: v.number(),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),

    // Link to knowledge base for RAG
    knowledgeBaseId: v.optional(v.id("knowledgeBases")),

    // Per-slide extracted content (text, speaker notes)
    slideContent: v.optional(
      v.array(
        v.object({
          index: v.number(),
          title: v.optional(v.string()),
          bodyText: v.optional(v.string()),
          speakerNotes: v.optional(v.string()),
          bulletPoints: v.optional(v.array(v.string())),
        })
      )
    ),

    // Text extraction status
    textExtractionStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["uploadedBy"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_knowledge_base", ["knowledgeBaseId"]),

  sessions: defineTable({
    studentId: v.id("students"),
    avatarId: v.id("avatars"),
    lessonId: v.optional(v.id("lessons")),
    presentationId: v.optional(v.id("presentations")),
    structuredLessonId: v.optional(v.id("structuredLessons")),
    roomName: v.string(),
    roomSid: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
    type: v.union(
      v.literal("structured_lesson"),
      v.literal("quick_practice"),
      v.literal("free_conversation"),
      v.literal("vocabulary_review"),
      v.literal("pronunciation_drill"),
      v.literal("presentation")
    ),
    transcript: v.optional(
      v.array(
        v.object({
          role: v.union(
            v.literal("student"),
            v.literal("avatar"),
            v.literal("system")
          ),
          content: v.string(),
          timestamp: v.number(),
          language: v.optional(v.string()),
        })
      )
    ),
    currentSlideIndex: v.optional(v.number()),

    // Presentation teaching mode state
    presentationMode: v.optional(
      v.object({
        active: v.boolean(),
        presentationId: v.optional(v.id("presentations")),
        currentSlideIndex: v.number(),
        startedAt: v.optional(v.number()),
        controlledBy: v.optional(
          v.union(
            v.literal("avatar"),
            v.literal("student"),
            v.literal("shared")
          )
        ),
      })
    ),

    metrics: v.optional(
      v.object({
        wordsSpoken: v.number(),
        newVocabulary: v.number(),
        errorsCorreected: v.number(),
        germanSupportUsed: v.number(),
        avgResponseLatency: v.optional(v.number()),
      })
    ),
    rating: v.optional(v.number()),
    feedback: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_avatar", ["avatarId"])
    .index("by_lesson", ["lessonId"])
    .index("by_presentation", ["presentationId"])
    .index("by_room", ["roomName"])
    .index("by_status", ["status"])
    .index("by_started", ["startedAt"])
    .index("by_structured_lesson", ["structuredLessonId"]),

  progress: defineTable({
    studentId: v.id("students"),
    skillType: v.union(
      v.literal("vocabulary"),
      v.literal("grammar"),
      v.literal("speaking"),
      v.literal("listening"),
      v.literal("pronunciation")
    ),
    skillName: v.string(),
    level: v.number(),
    experiencePoints: v.number(),
    lastPracticed: v.number(),
    nextReview: v.optional(v.number()),
    reviewCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_skill", ["skillType", "skillName"])
    .index("by_next_review", ["nextReview"]),

  vocabularyItems: defineTable({
    term_en: v.string(),
    term_de: v.string(),
    pronunciation: v.optional(v.string()),
    partOfSpeech: v.optional(v.string()),
    example_en: v.optional(v.string()),
    example_de: v.optional(v.string()),
    category: v.optional(v.string()),
    level: v.string(),
    tags: v.optional(v.array(v.string())),
    audioUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_term", ["term_en"])
    .index("by_level", ["level"])
    .index("by_category", ["category"]),

  studentVocabulary: defineTable({
    studentId: v.id("students"),
    vocabularyItemId: v.id("vocabularyItems"),
    learnedAt: v.number(),
    lastReviewed: v.optional(v.number()),
    nextReview: v.number(),
    reviewCount: v.number(),
    masteryLevel: v.number(),
    easeFactor: v.number(),
    correctCount: v.number(),
    incorrectCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_vocab", ["vocabularyItemId"])
    .index("by_next_review", ["studentId", "nextReview"])
    .index("by_mastery", ["studentId", "masteryLevel"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    tier: v.union(
      v.literal("free"),
      v.literal("essential"),
      v.literal("premium"),
      v.literal("business")
    ),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("paused")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    lessonsUsedThisMonth: v.number(),
    lessonsLimit: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_status", ["status"]),

  analyticsEvents: defineTable({
    userId: v.optional(v.id("users")),
    studentId: v.optional(v.id("students")),
    sessionId: v.optional(v.id("sessions")),
    event: v.string(),
    properties: v.optional(v.any()),
    timestamp: v.number(),
    source: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["event"])
    .index("by_timestamp", ["timestamp"]),

  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    windowStart: v.number(),
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_expires", ["expiresAt"]),

  auditLog: defineTable({
    userId: v.optional(v.id("users")),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // KNOWLEDGE BASE SYSTEM
  // ============================================

  knowledgeBases: defineTable({
    name: v.string(),
    description: v.string(),
    // Document sources
    sources: v.array(
      v.object({
        sourceId: v.string(),
        type: v.union(
          v.literal("document"),
          v.literal("video_transcript"),
          v.literal("structured_data"),
          v.literal("faq"),
          v.literal("glossary"),
          v.literal("procedure"),
          v.literal("case_study")
        ),
        name: v.string(),
        description: v.optional(v.string()),
        storageId: v.optional(v.id("_storage")),
        vectorStoreRef: v.optional(v.string()), // Zep user ID for this KB
        chunkCount: v.optional(v.number()),
        lastUpdated: v.number(),
        priority: v.number(),
      })
    ),
    // Domain configuration
    domain: v.object({
      primaryTopic: v.string(),
      subtopics: v.array(v.string()),
      language: v.union(v.literal("en"), v.literal("de"), v.literal("multi")),
    }),
    // Retrieval settings
    retrievalSettings: v.object({
      embeddingModel: v.string(),
      chunkSize: v.number(),
      chunkOverlap: v.number(),
      maxContextChunks: v.number(),
      similarityThreshold: v.number(),
      preferRecent: v.boolean(),
      includeMetadata: v.boolean(),
    }),
    // Processing status
    status: v.union(
      v.literal("pending"),
      v.literal("indexing"),
      v.literal("active"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // USER MEMORY SYNC (Zep Integration)
  // ============================================

  userMemorySync: defineTable({
    userId: v.string(), // Clerk ID
    avatarSlug: v.string(), // Avatar context
    zepUserId: v.string(), // Zep user ID: "student:{userId}:{avatarSlug}"
    lastSyncedAt: v.number(),
    // Cached facts for quick access (synced from Zep periodically)
    cachedFacts: v.optional(
      v.array(
        v.object({
          fact: v.string(),
          category: v.string(), // "personal", "progress", "preference"
          importance: v.string(), // "critical", "high", "medium", "low"
          createdAt: v.number(),
        })
      )
    ),
    // Profile summary for quick context building without Zep call
    profileSummary: v.optional(
      v.object({
        level: v.optional(v.string()),
        goals: v.optional(v.array(v.string())),
        preferences: v.optional(v.any()),
        strongAreas: v.optional(v.array(v.string())),
        weakAreas: v.optional(v.array(v.string())),
        personalFacts: v.optional(v.array(v.string())), // "works at BMW"
        recentTopics: v.optional(v.array(v.string())),
        lastSessionSummary: v.optional(v.string()),
      })
    ),
    // Session count for this avatar
    sessionCount: v.optional(v.number()),
  })
    .index("by_user_avatar", ["userId", "avatarSlug"])
    .index("by_zep_user", ["zepUserId"])
    .index("by_synced", ["lastSyncedAt"]),

  // ============================================
  // MEMORIES (Extracted facts from conversations)
  // ============================================

  memories: defineTable({
    studentId: v.string(), // Student identifier
    type: v.string(), // "personal_fact", "preference", "struggle", "achievement", etc.
    content: v.string(), // The actual memory content
    topic: v.optional(v.string()), // Related topic
    tags: v.optional(v.array(v.string())), // Tags for categorization
    importance: v.string(), // "critical", "high", "medium", "low"
    confidence: v.optional(v.number()), // 0-1 confidence score
    sessionId: v.optional(v.string()), // Session where memory was created
    avatarSlug: v.optional(v.string()), // Avatar that created this memory
    source: v.optional(v.string()), // "auto_extracted", "manual", "session_summary"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_student_type", ["studentId", "type"])
    .index("by_student_importance", ["studentId", "importance"])
    .index("by_session", ["sessionId"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // ERROR PATTERNS (Student mistake tracking)
  // ============================================

  errorPatterns: defineTable({
    studentId: v.string(),
    pattern: v.string(), // e.g., "confuses present perfect with simple past"
    errorType: v.string(), // "grammar", "vocabulary", "pronunciation", etc.
    errorText: v.string(), // The actual error
    correction: v.string(), // The correction given
    occurrences: v.number(), // How many times this error occurred
    lastOccurredAt: v.number(),
    resolved: v.boolean(), // Whether student has mastered this
    sessionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_student_type", ["studentId", "errorType"])
    .index("by_student_resolved", ["studentId", "resolved"]),

  // ============================================
  // KNOWLEDGE CONTENT (Processed documents as markdown)
  // ============================================

  knowledgeContent: defineTable({
    knowledgeBaseId: v.id("knowledgeBases"),
    sourceId: v.string(), // Links to source in knowledgeBases.sources
    title: v.string(),
    content: v.string(), // Markdown content for display
    contentType: v.union(
      v.literal("text"),
      v.literal("pdf"),
      v.literal("powerpoint"),
      v.literal("markdown"),
      v.literal("youtube"),
      v.literal("webpage")
    ),
    originalFileName: v.optional(v.string()),
    originalUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")), // Original file storage

    // Structured JSON content for avatar navigation
    jsonContent: v.optional(v.any()), // LessonContent JSON schema

    // PDF generation
    pdfStorageId: v.optional(v.id("_storage")), // Generated PDF storage
    pdfUrl: v.optional(v.string()), // Cached PDF URL
    pdfGeneratedAt: v.optional(v.number()),

    // PPTX generation - links to presentations table
    presentationId: v.optional(v.id("presentations")),
    pptxGeneratedAt: v.optional(v.number()),

    // HTML slides for interactive rendering
    htmlSlides: v.optional(v.array(v.object({
      index: v.number(),
      html: v.string(), // Self-contained HTML with inline CSS
      title: v.optional(v.string()),
      type: v.union(
        v.literal("title"),
        v.literal("objectives"),
        v.literal("content"),
        v.literal("grammar"),
        v.literal("vocabulary"),
        v.literal("exercise"),
        v.literal("summary")
      ),
      speakerNotes: v.optional(v.string()),
      teachingPrompt: v.optional(v.string()), // Instructions for avatar
    }))),
    htmlSlidesGeneratedAt: v.optional(v.number()),

    // Public access / sharing
    isPublic: v.optional(v.boolean()),
    shareToken: v.optional(v.string()), // Short token for public URLs

    metadata: v.optional(v.object({
      pageCount: v.optional(v.number()),
      slideCount: v.optional(v.number()),
      duration: v.optional(v.string()), // For videos
      author: v.optional(v.string()),
      wordCount: v.optional(v.number()),
      usedOcr: v.optional(v.boolean()),
      aiCleaned: v.optional(v.boolean()),
      // Structured content metrics
      exerciseCount: v.optional(v.number()),
      vocabularyCount: v.optional(v.number()),
      grammarRuleCount: v.optional(v.number()),
      level: v.optional(v.string()), // CEFR level: A1-C2
    })),
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("structuring"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("generating_pdf"),
      v.literal("generating_pptx"),
      v.literal("generating_html_slides")
    ),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_knowledge_base", ["knowledgeBaseId"])
    .index("by_source", ["sourceId"])
    .index("by_status", ["processingStatus"])
    .index("by_share_token", ["shareToken"])
    .index("by_public", ["isPublic"]),

  // ============================================
  // EXERCISE PROGRESS (Track student exercise attempts)
  // ============================================

  exerciseProgress: defineTable({
    sessionId: v.id("sessions"),
    studentId: v.id("students"),
    contentId: v.id("knowledgeContent"),
    exerciseId: v.string(), // e.g., "ex-1" from JSON content
    itemId: v.string(), // Current item e.g., "item-3"
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("skipped")
    ),
    attempts: v.array(
      v.object({
        answer: v.string(),
        correct: v.boolean(),
        timestamp: v.number(),
      })
    ),
    score: v.optional(v.number()), // 0-100
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_session", ["sessionId"])
    .index("by_student", ["studentId"])
    .index("by_content_exercise", ["contentId", "exerciseId"]),

  // ============================================
  // VOCABULARY PROGRESS (SM-2 Spaced Repetition)
  // ============================================

  vocabularyProgress: defineTable({
    studentId: v.id("students"),
    contentId: v.id("knowledgeContent"),
    vocabId: v.string(), // e.g., "vocab-1" from JSON content
    term: v.string(),
    termDe: v.string(),
    // SM-2 Spaced Repetition Data
    repetitions: v.number(), // Times correctly recalled in a row
    easeFactor: v.number(), // SM-2 ease factor (default 2.5)
    interval: v.number(), // Days until next review
    nextReview: v.number(), // Timestamp of next review
    lastReviewed: v.optional(v.number()),
    // Statistics
    correctCount: v.number(),
    incorrectCount: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_next_review", ["studentId", "nextReview"])
    .index("by_vocab", ["studentId", "contentId", "vocabId"]),

  // ============================================
  // STRUCTURED LESSONS (Shareable lesson links)
  // ============================================

  structuredLessons: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    // Content source - either from knowledge base or direct presentation
    knowledgeContentId: v.optional(v.id("knowledgeContent")),
    presentationId: v.optional(v.id("presentations")),
    // Avatar to teach this lesson
    avatarId: v.id("avatars"),
    // Session type when student joins
    sessionType: v.union(
      v.literal("structured_lesson"),
      v.literal("presentation")
    ),
    // Sharing configuration
    shareToken: v.string(), // Unique token for public URL
    isPublic: v.boolean(), // Whether lesson is publicly discoverable
    requiresAuth: v.boolean(), // Whether authentication is required to join
    // Customization
    welcomeMessage: v.optional(v.string()),
    // Analytics
    totalSessions: v.number(), // Count of sessions created from this lesson
    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_share_token", ["shareToken"])
    .index("by_creator", ["createdBy"])
    .index("by_public", ["isPublic"]),
});
