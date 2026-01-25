import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()), // Optional - allows admin-created users before Clerk signup
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
    // Invitation tracking for admin-created users
    invitedBy: v.optional(v.id("users")),
    invitedAt: v.optional(v.number()),
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

  // ============================================
  // RBAC - ROLES
  // ============================================
  roles: defineTable({
    // Unique identifier (e.g., "super_admin", "company_admin", "custom_role_123")
    id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    // Classification
    type: v.union(v.literal("system"), v.literal("company_custom")),
    companyId: v.optional(v.id("companies")), // For custom roles
    // Permissions
    permissions: v.array(v.string()),
    inheritsFrom: v.optional(v.string()), // Role ID to inherit from
    // Status
    isActive: v.boolean(),
    isDefault: v.optional(v.boolean()), // Default role for new users in company
    // Metadata
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_role_id", ["id"])
    .index("by_type", ["type"])
    .index("by_company", ["companyId"])
    .index("by_active", ["isActive"]),

  // ============================================
  // RBAC - USER ROLE ASSIGNMENTS
  // ============================================
  userRoleAssignments: defineTable({
    userId: v.id("users"),
    roleId: v.string(), // References roles.id
    // Scope
    scope: v.union(
      v.literal("global"),
      v.literal("company"),
      v.literal("group")
    ),
    scopeId: v.optional(v.string()), // Company or Group ID for scoped roles
    // Assignment metadata
    assignedBy: v.id("users"),
    assignedAt: v.number(),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_role", ["roleId"])
    .index("by_scope", ["scope", "scopeId"])
    .index("by_expiring", ["expiresAt"]),

  // ============================================
  // RBAC - PERMISSION DEFINITIONS (Reference Table)
  // ============================================
  permissions: defineTable({
    key: v.string(), // e.g., "courses.create"
    name: v.string(), // Human-readable name
    description: v.string(),
    category: v.union(
      v.literal("users"),
      v.literal("companies"),
      v.literal("groups"),
      v.literal("content"),
      v.literal("enrollments"),
      v.literal("analytics"),
      v.literal("avatars"),
      v.literal("sessions")
    ),
    defaultRoles: v.array(v.string()), // Role IDs that have this by default
    isActive: v.boolean(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),

  // ============================================
  // COMPANIES
  // ============================================
  companies: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    website: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise")
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("trial"),
      v.literal("suspended"),
      v.literal("cancelled")
    ),
    trialEndsAt: v.optional(v.number()),
    settings: v.optional(
      v.object({
        defaultLanguage: v.optional(v.string()),
        timezone: v.optional(v.string()),
        allowSelfEnrollment: v.optional(v.boolean()),
        requireApproval: v.optional(v.boolean()),
        customBranding: v.optional(v.boolean()),
      })
    ),
    // RBAC Settings
    rbacSettings: v.optional(
      v.object({
        customRolesEnabled: v.boolean(),
        maxCustomRoles: v.number(),
        allowSelfEnrollment: v.boolean(),
        requireApprovalForNewUsers: v.boolean(),
        defaultNewUserRole: v.optional(v.string()),
      })
    ),
    maxStudents: v.optional(v.number()),
    maxGroups: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["subscriptionStatus"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // GROUPS
  // ============================================
  groups: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    defaultAvatarId: v.optional(v.id("avatars")),
    targetLevel: v.optional(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      )
    ),
    capacity: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("archived")),
    // Group leads (users with Group Lead role for this group)
    leadUserIds: v.optional(v.array(v.id("users"))),
    settings: v.optional(
      v.object({
        allowPeerInteraction: v.optional(v.boolean()),
        showLeaderboard: v.optional(v.boolean()),
        notifyOnProgress: v.optional(v.boolean()),
      })
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_slug", ["companyId", "slug"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // GROUP MEMBERS
  // ============================================
  groupMembers: defineTable({
    groupId: v.id("groups"),
    studentId: v.id("students"),
    role: v.union(v.literal("member"), v.literal("lead")),
    joinedAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("removed")
    ),
    removedAt: v.optional(v.number()),
    removedReason: v.optional(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_student", ["studentId"])
    .index("by_group_student", ["groupId", "studentId"])
    .index("by_status", ["status"]),

  // ============================================
  // RBAC AUDIT LOG
  // ============================================
  roleAuditLog: defineTable({
    action: v.union(
      v.literal("role_assigned"),
      v.literal("role_revoked"),
      v.literal("role_expired"),
      v.literal("bulk_assign")
    ),
    userId: v.id("users"),
    roleId: v.string(),
    roleName: v.string(),
    scope: v.union(
      v.literal("global"),
      v.literal("company"),
      v.literal("group")
    ),
    scopeId: v.optional(v.string()),
    scopeName: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    performedByName: v.optional(v.string()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["roleId"])
    .index("by_action", ["action"])
    .index("by_performed_by", ["performedBy"])
    .index("by_created", ["createdAt"]),

  avatars: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    profileImage: v.optional(v.string()), // URL to avatar profile image for loading placeholder
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
          aspectRatio: v.optional(v.union(
            v.literal("1:1"),      // Square
            v.literal("3:4"),      // Portrait (default)
            v.literal("4:3"),      // Landscape
            v.literal("16:9"),     // Widescreen
            v.literal("9:16")      // Vertical/Mobile
          )),
          objectFit: v.optional(v.union(
            v.literal("cover"),    // Crop to fill container (default)
            v.literal("contain"),  // Show entire video with letterboxing
            v.literal("fill")      // Stretch to fit (may distort)
          )),
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
      // Language mode: english (default), german, or bilingual
      languageMode: v.optional(
        v.union(
          v.literal("english"),    // English only (STT: en, TTS: en)
          v.literal("german"),     // German only (STT: de, TTS: de)
          v.literal("bilingual")   // German + English (STT: multi, TTS: switches)
        )
      ),
      // Default language for bilingual mode (which language TTS starts in)
      bilingualDefault: v.optional(
        v.union(
          v.literal("en"),  // Start in English, can switch to German
          v.literal("de")   // Start in German, can switch to English
        )
      ),
      settings: v.object({
        speed: v.number(),
        pitch: v.optional(v.number()),
        stability: v.optional(v.number()),
        emotion: v.optional(v.union(
          v.string(),  // Legacy: "neutral"
          v.array(v.string())  // New: ["positivity:medium"]
        )),
      }),
      // Per-language TTS settings (used when languageMode is "bilingual")
      languageSettings: v.optional(
        v.object({
          en: v.optional(
            v.object({
              speed: v.optional(v.number()),
              emotion: v.optional(v.string()),
            })
          ),
          de: v.optional(
            v.object({
              speed: v.optional(v.number()),
              emotion: v.optional(v.string()),
            })
          ),
        })
      ),
      languageVoices: v.optional(
        v.object({
          en: v.optional(v.string()),
          de: v.optional(v.string()),
        })
      ),
    }),
    // Voice Configuration Library - Multiple named voices for this avatar
    // Allows managing multiple Cartesia voice IDs with custom names and language tags
    voiceConfigs: v.optional(
      v.array(
        v.object({
          id: v.string(), // Unique identifier within this avatar (e.g., "emma_en", "emma_de")
          name: v.string(), // Display name (e.g., "Emma English", "Emma German")
          voiceId: v.string(), // Cartesia voice ID (e.g., "1463a4e1-56a1-4b41-b257-728d56e93605")
          language: v.string(), // Language code: "en", "de", "es", etc.
          provider: v.optional(v.union(
            v.literal("cartesia"),
            v.literal("elevenlabs"),
            v.literal("openai")
          )), // Default: cartesia
          model: v.optional(v.string()), // TTS model: "sonic-2", "sonic-3", etc.
          isDefault: v.optional(v.boolean()), // Is this the default voice for its language?
          settings: v.optional(
            v.object({
              speed: v.optional(v.number()),
              pitch: v.optional(v.number()),
              emotion: v.optional(v.union(
                v.string(),
                v.array(v.string())
              )),
            })
          ),
          description: v.optional(v.string()), // Optional notes about the voice
          createdAt: v.optional(v.number()),
        })
      )
    ),
    // STT (Speech-to-Text) configuration
    sttConfig: v.optional(
      v.object({
        provider: v.union(v.literal("deepgram")),
        model: v.string(),  // "nova-3", "nova-2"
        language: v.optional(v.string()),  // "en", "de", "multi"
        settings: v.optional(
          v.object({
            smartFormat: v.optional(v.boolean()),
            endpointing: v.optional(v.number()),  // milliseconds
          })
        ),
      })
    ),
    llmConfig: v.object({
      provider: v.union(
        v.literal("openrouter"),
        v.literal("anthropic"),
        v.literal("openai"),
        v.literal("cerebras")
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
      // Custom system prompt for bilingual mode (injected when languageMode is "bilingual")
      systemPrompt: v.optional(v.string()),
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
    // Session Duration Configuration
    sessionConfig: v.optional(
      v.object({
        defaultDurationMinutes: v.optional(v.number()), // 10, 20, 30, 60 or null for no limit
        wrapUpBufferMinutes: v.optional(v.number()), // Default 2 minutes before end
        autoEnd: v.optional(v.boolean()), // Whether to auto-end after wrap-up
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

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
    guestName: v.optional(v.string()), // For anonymous/guest users in open access lessons
    // Extended guest metadata (for conversation practice)
    isGuest: v.optional(v.boolean()),
    guestMetadata: v.optional(
      v.object({
        email: v.optional(v.string()),
        customFields: v.optional(v.any()), // Custom field responses
        acceptedTermsAt: v.optional(v.number()), // Timestamp of terms acceptance
        referrer: v.optional(v.string()), // Where they came from
        userAgent: v.optional(v.string()), // Browser info
      })
    ),
    // Link to conversation practice instance
    conversationPracticeId: v.optional(v.id("conversationPractice")),
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
      v.literal("presentation"),
      v.literal("conversation_practice") // Conversation practice sessions
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

    // Game teaching mode state
    gameMode: v.optional(
      v.object({
        active: v.boolean(),
        gameId: v.optional(v.id("wordGames")),
        gameSessionId: v.optional(v.id("gameSessions")),
        currentItemIndex: v.number(),
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
    // Session Timer Configuration
    timerConfig: v.optional(
      v.object({
        targetDurationMinutes: v.number(), // Target duration for this session
        wrapUpBufferMinutes: v.number(), // When to start wrap-up before end
        wrapUpStartedAt: v.optional(v.number()), // Timestamp when wrap-up was triggered
      })
    ),
    // Pre-fetched web search results (Tavily)
    webSearchResults: v.optional(
      v.object({
        fetchedAt: v.number(), // When the search was performed
        query: v.string(), // The search query used
        answer: v.optional(v.string()), // Tavily's synthesized answer
        searchDepth: v.optional(v.string()), // "basic" | "advanced" | "detailed"
        llmRewrittenContent: v.optional(v.string()), // LLM-rewritten clean journalist prose (detailed mode)
        results: v.array(
          v.object({
            title: v.string(),
            url: v.string(),
            content: v.string(), // Summary/snippet
            rawContent: v.optional(v.string()), // Full article content (detailed mode)
            publishedDate: v.optional(v.string()),
          })
        ),
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
    .index("by_structured_lesson", ["structuredLessonId"])
    .index("by_conversation_practice", ["conversationPracticeId"])
    .index("by_guest", ["isGuest"]),

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
    // Vector store reference (e.g., Zep user ID for the entire KB)
    vectorStoreRef: v.optional(v.string()),
    // Generation type - whether content was uploaded or scraped from web
    generationType: v.optional(v.union(
      v.literal("uploaded"),
      v.literal("scraped")
    )),
    // Link to scraping job if this KB was generated from web
    scrapingJobId: v.optional(v.id("scrapingJobs")),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_generation_type", ["generationType"]),

  // ============================================
  // USER MEMORY SYNC (Zep Integration)
  // ============================================

  userMemorySync: defineTable({
    userId: v.string(), // Clerk ID
    avatarSlug: v.string(), // Avatar context
    zepUserId: v.string(), // Zep user ID: "student:{userId}:{avatarSlug}"
    createdAt: v.optional(v.number()), // When this sync record was first created
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
    type: v.string(), // "personal_fact", "preference", "struggle", "achievement", "upcoming", etc.
    content: v.string(), // The actual memory content
    topic: v.optional(v.string()), // Related topic
    tags: v.optional(v.array(v.string())), // Tags for categorization
    importance: v.string(), // "critical", "high", "medium", "low"
    confidence: v.optional(v.number()), // 0-1 confidence score
    sessionId: v.optional(v.string()), // Session where memory was created
    avatarSlug: v.optional(v.string()), // Avatar that created this memory
    source: v.optional(v.string()), // "auto_extracted", "manual", "session_summary"
    // For "upcoming" type memories - tracks when the event occurs
    eventDate: v.optional(v.number()), // Timestamp of when event is scheduled
    followedUp: v.optional(v.boolean()), // Whether we've asked about this event after it passed
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_student_type", ["studentId", "type"])
    .index("by_student_importance", ["studentId", "importance"])
    .index("by_session", ["sessionId"])
    .index("by_created", ["createdAt"])
    .index("by_upcoming_events", ["studentId", "type", "eventDate"]),

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
    // RLM-optimized data for fast avatar retrieval (<10ms lookups)
    rlmOptimized: v.optional(v.object({
      // Grammar index for fast lookup by keyword
      grammarIndex: v.optional(v.any()), // { [keyword: string]: GrammarRule[] }
      // Vocabulary maps for O(1) lookup
      vocabularyByTerm: v.optional(v.any()),    // { [term: string]: VocabularyItem }
      vocabularyByTermDe: v.optional(v.any()),  // { [termDe: string]: VocabularyItem }
      vocabularyByLevel: v.optional(v.any()),   // { [level: string]: VocabularyItem[] }
      // Mistake detection patterns
      mistakePatterns: v.optional(v.array(v.object({
        pattern: v.string(),        // Regex or keyword pattern
        mistakeType: v.string(),    // Error category
        correction: v.string(),     // How to correct it
        explanation: v.string(),    // Why it's wrong
      }))),
      // Topic keywords for matching
      topicKeywords: v.optional(v.array(v.string())),
      // Version for cache invalidation
      version: v.optional(v.string()),
      optimizedAt: v.optional(v.number()),
      // Quick reference cards for common questions
      quickReference: v.optional(v.array(v.object({
        id: v.string(),
        trigger: v.string(),        // What question/context triggers this
        response: v.string(),       // Concise response
        expandedResponse: v.optional(v.string()), // Detailed response if needed
      }))),
      // Exercise index by type for targeted practice
      exerciseIndex: v.optional(v.any()), // { [type: string]: string[] }
    })),
    // Web scraping sources (when content was scraped from web)
    webSources: v.optional(v.array(v.object({
      url: v.string(),
      title: v.string(),
      domain: v.string(),
      scrapedAt: v.number(),
      relevanceScore: v.optional(v.number()),
    }))),
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("structuring"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("generating_pdf"),
      v.literal("generating_pptx"),
      v.literal("generating_html_slides"),
      v.literal("optimizing_rlm")  // New status for RLM optimization phase
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
  // SCRAPING JOBS (Web scraping for knowledge generation)
  // ============================================

  scrapingJobs: defineTable({
    // Basic info
    topic: v.string(),
    mode: v.union(v.literal("simple"), v.literal("advanced")),
    knowledgeBaseId: v.id("knowledgeBases"),

    // Status tracking
    status: v.union(
      v.literal("pending"),
      v.literal("discovering"),    // Finding subtopics (simple mode)
      v.literal("scraping"),       // Tavily search + web fetch
      v.literal("synthesizing"),   // AI synthesis to structured content
      v.literal("optimizing"),     // RLM optimization
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),

    // Subtopics progress
    subtopics: v.array(v.object({
      name: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("scraping"),
        v.literal("synthesizing"),
        v.literal("optimizing"),
        v.literal("completed"),
        v.literal("failed")
      ),
      sourceCount: v.optional(v.number()),
      wordCount: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
    })),

    // Overall progress
    progress: v.object({
      discoveredCount: v.number(),
      scrapedCount: v.number(),
      synthesizedCount: v.number(),
      optimizedCount: v.optional(v.number()),
      totalSources: v.number(),
      totalWords: v.number(),
    }),

    // Configuration
    config: v.object({
      scale: v.optional(v.union(
        v.literal("quick"),
        v.literal("standard"),
        v.literal("comprehensive"),
        v.literal("book")
      )),                                   // Scale preset
      depth: v.number(),                    // 1-3 depth level
      maxSourcesPerSubtopic: v.number(),    // Sources to scrape per subtopic
      includeExercises: v.boolean(),        // Generate exercises
      targetLevel: v.optional(v.string()),  // CEFR level: A1-C2
      language: v.string(),                 // en, de, or multi
      tags: v.optional(v.array(v.string())), // Categorization tags
      referenceUrls: v.optional(v.array(v.string())), // Specific URLs to include
      broadSearch: v.optional(v.boolean()), // If true, don't limit to quality domains
    }),

    // Metadata
    errorMessage: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_knowledge_base", ["knowledgeBaseId"])
    .index("by_created", ["createdAt"]),

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
    // Content source - either from knowledge base, presentation, or word game
    knowledgeContentId: v.optional(v.id("knowledgeContent")),
    presentationId: v.optional(v.id("presentations")),
    wordGameId: v.optional(v.id("wordGames")),
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
    // Enrollment settings
    enrollmentSettings: v.optional(
      v.object({
        allowSelfEnrollment: v.optional(v.boolean()), // Can students self-enroll?
        maxEnrollments: v.optional(v.number()), // Enrollment limit
        enrollmentDeadline: v.optional(v.number()), // Deadline timestamp
      })
    ),
    // Customization
    welcomeMessage: v.optional(v.string()),
    // Analytics
    totalSessions: v.number(), // Count of sessions created from this lesson
    // Session duration configuration
    durationMinutes: v.optional(v.number()), // Override avatar default (10, 20, 30, 60)
    wrapUpBufferMinutes: v.optional(v.number()), // Override avatar default
    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_share_token", ["shareToken"])
    .index("by_creator", ["createdBy"])
    .index("by_public", ["isPublic"]),

  // ============================================
  // LESSON ENROLLMENTS
  // ============================================
  lessonEnrollments: defineTable({
    lessonId: v.id("structuredLessons"),

    // Assignment target (one of these)
    studentId: v.optional(v.id("students")),
    groupId: v.optional(v.id("groups")),

    // Enrollment type
    type: v.union(
      v.literal("admin_assigned"), // Admin assigned directly
      v.literal("group_assigned"), // Inherited from group
      v.literal("self_enrolled") // Student enrolled themselves
    ),

    // Status tracking
    status: v.union(
      v.literal("enrolled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("dropped")
    ),

    // Progress tracking
    progress: v.optional(v.number()), // 0-100 percentage
    lastAccessedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),

    // Metadata
    assignedBy: v.optional(v.id("users")), // For admin assignments
    enrolledAt: v.number(),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_lesson", ["lessonId"])
    .index("by_student", ["studentId"])
    .index("by_group", ["groupId"])
    .index("by_student_lesson", ["studentId", "lessonId"])
    .index("by_status", ["status"]),

  // ============================================
  // WORD GAMES SYSTEM
  // ============================================

  // Word Games - Game definitions
  wordGames: defineTable({
    // Identity
    title: v.string(),
    slug: v.string(), // URL-friendly identifier
    description: v.optional(v.string()),
    instructions: v.string(), // Shown to student

    // Classification
    type: v.union(
      v.literal("sentence_builder"),
      v.literal("fill_in_blank"),
      v.literal("word_ordering"),
      v.literal("matching_pairs"),
      v.literal("vocabulary_matching"),
      v.literal("word_scramble"),
      v.literal("multiple_choice"),
      v.literal("flashcards"),
      v.literal("hangman"),
      v.literal("crossword")
    ),
    category: v.union(
      v.literal("grammar"),
      v.literal("vocabulary"),
      v.literal("mixed")
    ),
    level: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2"),
      v.literal("C1"),
      v.literal("C2")
    ),
    tags: v.optional(v.array(v.string())),

    // Game Configuration (type-specific JSON)
    config: v.any(), // GameConfig union type

    // Difficulty Settings
    difficultyConfig: v.object({
      hintsAvailable: v.number(),
      distractorDifficulty: v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard")
      ),
      timeMultiplier: v.optional(v.number()),
    }),

    // Hints (generic across all types)
    hints: v.array(v.string()),

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),

    // Knowledge Base Link (for games generated from KB content)
    knowledgeContentId: v.optional(v.id("knowledgeContent")),

    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Analytics aggregates (updated periodically)
    stats: v.optional(
      v.object({
        totalPlays: v.number(),
        completionRate: v.number(),
        averageStars: v.number(),
        averageTimeSeconds: v.number(),
      })
    ),
  })
    .index("by_slug", ["slug"])
    .index("by_type", ["type"])
    .index("by_level", ["level"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_created", ["createdAt"])
    .index("by_knowledge_content", ["knowledgeContentId"]),

  // Game-Lesson Links
  gameLessonLinks: defineTable({
    gameId: v.id("wordGames"),
    lessonId: v.id("structuredLessons"),
    triggerType: v.union(
      v.literal("slide"),
      v.literal("avatar"),
      v.literal("student"),
      v.literal("checkpoint")
    ),
    triggerConfig: v.object({
      slideIndex: v.optional(v.number()),
      afterMinutes: v.optional(v.number()),
      keywords: v.optional(v.array(v.string())),
    }),
    isRequired: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_lesson", ["lessonId"])
    .index("by_lesson_order", ["lessonId", "order"]),

  // Content-Lesson Links (multiple knowledge content items per lesson)
  contentLessonLinks: defineTable({
    contentId: v.id("knowledgeContent"),
    lessonId: v.id("structuredLessons"),
    // How this content is triggered
    triggerType: v.union(
      v.literal("student"),    // Student chooses from Materials panel
      v.literal("avatar"),     // Avatar triggers based on conversation
      v.literal("scheduled")   // Auto-trigger at specific time
    ),
    triggerConfig: v.object({
      afterMinutes: v.optional(v.number()),  // For scheduled trigger
      keywords: v.optional(v.array(v.string())),  // For avatar trigger
    }),
    order: v.number(),  // Display order in Materials panel
    createdAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_lesson", ["lessonId"])
    .index("by_lesson_order", ["lessonId", "order"]),

  // Game Sessions (individual play instances)
  gameSessions: defineTable({
    // References
    gameId: v.id("wordGames"),
    sessionId: v.optional(v.id("sessions")), // Lesson session if applicable
    studentId: v.optional(v.id("students")), // Optional for guest multiplayer

    // State
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("abandoned"),
      v.literal("waiting") // For multiplayer waiting room
    ),

    // Game State (for resume capability)
    gameState: v.any(), // Current game state JSON

    // Progress
    currentItemIndex: v.number(), // For multi-item games
    totalItems: v.number(),
    correctAnswers: v.number(),
    incorrectAnswers: v.number(),
    hintsUsed: v.number(),

    // Scoring
    stars: v.optional(v.number()), // 0-3, set on completion
    scorePercent: v.optional(v.number()), // 0-100

    // Timing
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    totalTimeSeconds: v.optional(v.number()),

    // Detailed Event Log (for analytics)
    events: v.array(
      v.object({
        type: v.string(), // "answer", "hint", "scaffold"
        timestamp: v.number(),
        data: v.any(),
      })
    ),

    // ============================================
    // MULTIPLAYER FIELDS
    // ============================================
    isMultiplayer: v.optional(v.boolean()),
    shareToken: v.optional(v.string()), // Unique token for shareable link
    hostUserId: v.optional(v.id("users")), // Teacher/creator who shared

    // Participants (guests don't need accounts)
    participants: v.optional(
      v.array(
        v.object({
          participantId: v.string(), // Unique ID for this participant
          displayName: v.string(),
          userId: v.optional(v.id("users")), // If logged in
          joinedAt: v.number(),
          isHost: v.boolean(),
          isActive: v.boolean(), // For tracking disconnects
          lastSeenAt: v.number(),
        })
      )
    ),

    // Shared game state for real-time sync
    sharedState: v.optional(
      v.object({
        currentTurn: v.optional(v.string()), // participantId for turn-based games
        answers: v.optional(v.any()), // Collected answers from all participants
        syncedItemIndex: v.optional(v.number()), // Which item everyone sees
        gameMode: v.optional(
          v.union(
            v.literal("collaborative"), // Work together
            v.literal("competitive"), // Race/score
            v.literal("turn_based") // Take turns
          )
        ),
        // Cursor positions for each participant
        cursors: v.optional(
          v.record(
            v.string(), // participantId
            v.object({
              x: v.number(),
              y: v.number(),
              lastUpdate: v.number(),
            })
          )
        ),
        // Live inputs from each participant (what they're typing)
        inputs: v.optional(
          v.record(
            v.string(), // participantId
            v.object({
              value: v.string(), // Current input value
              itemIndex: v.number(), // Which game item they're on
              lastUpdate: v.number(),
            })
          )
        ),
        // Element positions for drag-and-drop sync (sentence builder, word ordering, etc.)
        elements: v.optional(
          v.object({
            itemIndex: v.number(), // Which game item
            positions: v.array(
              v.object({
                id: v.string(), // Element ID (e.g., word index)
                x: v.number(),
                y: v.number(),
                slot: v.optional(v.number()), // Target slot index if dropped
              })
            ),
            lastUpdate: v.number(),
            updatedBy: v.string(), // participantId who made the change
          })
        ),
        // Control system - who can interact with the game
        controlledBy: v.optional(v.string()), // participantId or null for everyone
        controlMode: v.optional(
          v.union(
            v.literal("host_only"), // Only host can interact
            v.literal("single"), // One person at a time (controlled by host)
            v.literal("free") // Everyone can interact
          )
        ),
        // Crossword grid state (JSON stringified 2D array)
        crosswordGrid: v.optional(
          v.object({
            itemIndex: v.number(),
            gridState: v.string(), // JSON stringified grid
            lastUpdate: v.number(),
            updatedBy: v.string(),
          })
        ),
      })
    ),

    // Session settings
    allowSelfStart: v.optional(v.boolean()), // Students can start without host

    // Token expiration
    tokenExpiresAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_student", ["studentId"])
    .index("by_session", ["sessionId"])
    .index("by_status", ["status"])
    .index("by_student_game", ["studentId", "gameId"])
    .index("by_started", ["startedAt"])
    .index("by_share_token", ["shareToken"]) // Fast lookup for join links
    .index("by_host", ["hostUserId"]),

  // Game Analytics Aggregates (for dashboard)
  gameAnalytics: defineTable({
    // Scope
    gameId: v.optional(v.id("wordGames")), // null = global
    studentId: v.optional(v.id("students")), // null = all students
    period: v.union(
      v.literal("all_time"),
      v.literal("monthly"),
      v.literal("weekly"),
      v.literal("daily")
    ),
    periodStart: v.optional(v.number()), // For non-all_time periods

    // Metrics
    totalSessions: v.number(),
    completedSessions: v.number(),
    abandonedSessions: v.number(),
    totalStars: v.number(),
    averageStars: v.number(),
    averageTimeSeconds: v.number(),
    totalHintsUsed: v.number(),
    averageHintsPerGame: v.number(),

    // Per-type breakdown (if gameId is null)
    byType: v.optional(
      v.object({
        sentence_builder: v.optional(v.number()),
        fill_in_blank: v.optional(v.number()),
        word_ordering: v.optional(v.number()),
        matching_pairs: v.optional(v.number()),
        word_scramble: v.optional(v.number()),
        multiple_choice: v.optional(v.number()),
        flashcards: v.optional(v.number()),
        hangman: v.optional(v.number()),
        crossword: v.optional(v.number()),
      })
    ),

    // Per-level breakdown
    byLevel: v.optional(
      v.object({
        A1: v.optional(v.number()),
        A2: v.optional(v.number()),
        B1: v.optional(v.number()),
        B2: v.optional(v.number()),
        C1: v.optional(v.number()),
        C2: v.optional(v.number()),
      })
    ),

    updatedAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_student", ["studentId"])
    .index("by_period", ["period", "periodStart"]),

  // ============================================
  // PDF WORKSHEETS SYSTEM
  // ============================================

  pdfWorksheets: defineTable({
    // Basic info
    title: v.string(),
    description: v.optional(v.string()),

    // Classification
    cefrLevel: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2"),
      v.literal("C1"),
      v.literal("C2")
    ),
    category: v.union(
      v.literal("grammar"),
      v.literal("vocabulary"),
      v.literal("reading"),
      v.literal("writing"),
      v.literal("mixed")
    ),

    // PDF Source
    sourceType: v.union(
      v.literal("upload"),    // Uploaded PDF
      v.literal("template"),  // Created from template
      v.literal("blank")      // Created from scratch
    ),
    templateId: v.optional(v.string()), // Template ID if sourceType is "template"

    // PDF Storage
    originalPdfStorageId: v.optional(v.id("_storage")), // Original uploaded PDF
    renderedPdfStorageId: v.optional(v.id("_storage")), // PDF with fields rendered (for print)

    // Page Configuration
    pageSize: v.object({
      width: v.number(),  // mm (A4 = 210)
      height: v.number(), // mm (A4 = 297)
    }),
    pageCount: v.number(),

    // Pages with extracted/generated content
    pages: v.array(
      v.object({
        index: v.number(),
        imageStorageId: v.optional(v.id("_storage")), // Page rendered as image for background
        extractedText: v.optional(v.string()), // OCR extracted text
        ocrConfidence: v.optional(v.number()), // 0-1 OCR confidence score
      })
    ),

    // Form Fields
    fields: v.array(
      v.object({
        id: v.string(),
        pageIndex: v.number(),
        type: v.union(
          v.literal("text_input"),      // Short text answer
          v.literal("multiple_choice"), // Radio buttons
          v.literal("checkbox"),        // Multiple select
          v.literal("matching"),        // Match pairs (rendered as numbered items for print)
          v.literal("drag_drop"),       // Drag and drop (rendered as fill-in-blank for print)
          v.literal("long_text")        // Paragraph answer
        ),
        // Position on page (relative coordinates 0-1)
        position: v.object({
          x: v.number(),
          y: v.number(),
          width: v.number(),
          height: v.number(),
        }),
        // Field configuration
        label: v.optional(v.string()),
        placeholder: v.optional(v.string()),
        required: v.optional(v.boolean()),
        // Answer configuration for auto-grading
        correctAnswers: v.array(v.string()), // Multiple acceptable answers
        caseSensitive: v.optional(v.boolean()),
        points: v.optional(v.number()), // Points for this field (default 1)
        // Type-specific config
        config: v.optional(v.any()), // MultipleChoiceConfig, MatchingConfig, etc.
      })
    ),

    // Grading Configuration
    gradingConfig: v.object({
      passingScore: v.number(), // Percentage to pass (e.g., 70)
      showCorrectAnswers: v.boolean(), // Show correct answers after submission
      maxAttempts: v.optional(v.number()), // null = unlimited
    }),

    // Sharing
    shareToken: v.string(), // Unique token for public URL
    isPublic: v.boolean(),

    // Status
    status: v.union(
      v.literal("processing"), // PDF being processed/OCR
      v.literal("draft"),      // Not yet published
      v.literal("published"),  // Available to students
      v.literal("archived")    // Hidden from listing
    ),
    processingError: v.optional(v.string()),

    // OCR + AI Structuring (New workflow)
    processingStage: v.optional(
      v.union(
        v.literal("uploading"),        // File being uploaded
        v.literal("ocr_extracting"),   // OCR in progress
        v.literal("ai_structuring"),   // Claude structuring content
        v.literal("ready"),            // Ready for editing
        v.literal("generating_pdf"),   // Exporting to PDF
        v.literal("failed")            // Processing failed
      )
    ),
    ocrText: v.optional(v.string()),   // Raw OCR extracted text
    jsonContent: v.optional(v.any()),  // WorksheetContent structured JSON

    // Collaboration
    lockedBy: v.optional(v.id("users")), // User currently editing
    lockedAt: v.optional(v.number()),
    lockedFields: v.optional(v.array(v.string())), // Field IDs being edited

    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Version tracking (for future use)
    version: v.optional(v.number()),
  })
    .index("by_share_token", ["shareToken"])
    .index("by_creator", ["createdBy"])
    .index("by_status", ["status"])
    .index("by_level", ["cefrLevel"])
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"])
    .index("by_created", ["createdAt"]),

  // PDF Worksheet Analytics (Anonymous aggregation)
  pdfWorksheetAnalytics: defineTable({
    worksheetId: v.id("pdfWorksheets"),

    // Aggregated metrics
    totalSubmissions: v.number(),
    completedSubmissions: v.number(),
    averageScore: v.number(), // 0-100
    averageTimeSeconds: v.number(),
    passRate: v.number(), // Percentage who passed

    // Per-field analytics
    fieldAnalytics: v.array(
      v.object({
        fieldId: v.string(),
        totalAttempts: v.number(),
        correctAttempts: v.number(),
        averageScore: v.number(),
        commonIncorrectAnswers: v.optional(v.array(
          v.object({
            answer: v.string(),
            count: v.number(),
          })
        )),
      })
    ),

    // Score distribution (buckets)
    scoreDistribution: v.optional(
      v.object({
        bucket_0_20: v.number(),
        bucket_21_40: v.number(),
        bucket_41_60: v.number(),
        bucket_61_80: v.number(),
        bucket_81_100: v.number(),
      })
    ),

    // Time period
    period: v.union(
      v.literal("all_time"),
      v.literal("monthly"),
      v.literal("weekly")
    ),
    periodStart: v.optional(v.number()),

    updatedAt: v.number(),
  })
    .index("by_worksheet", ["worksheetId"])
    .index("by_period", ["period", "periodStart"]),

  // PDF User Templates (Personal saved templates)
  pdfUserTemplates: defineTable({
    userId: v.id("users"),
    worksheetId: v.id("pdfWorksheets"), // Source worksheet to use as template

    name: v.string(),
    description: v.optional(v.string()),

    // Template metadata
    category: v.union(
      v.literal("grammar"),
      v.literal("vocabulary"),
      v.literal("reading"),
      v.literal("writing"),
      v.literal("mixed")
    ),
    recommendedLevel: v.optional(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      )
    ),

    // Usage tracking
    usageCount: v.number(),
    lastUsedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_usage", ["usageCount"]),

  // ============================================
  // CONVERSATION PRACTICE SYSTEM
  // ============================================

  conversationPractice: defineTable({
    // Basic info
    title: v.string(),
    description: v.optional(v.string()),

    // Content mode
    mode: v.union(
      v.literal("free_conversation"), // No context - open practice
      v.literal("transcript_based"), // Based on uploaded transcript
      v.literal("knowledge_based"), // Based on existing KB content
      v.literal("topic_guided") // Guided by topic/scenario
    ),

    // Transcript content (for mode: "transcript_based")
    transcript: v.optional(
      v.object({
        content: v.string(), // The full transcript text
        sourceType: v.union(
          v.literal("paste"), // Pasted text
          v.literal("file_upload"), // Uploaded .txt/.vtt/.srt
          v.literal("auto_generated") // From platform recording
        ),
        sourceMetadata: v.optional(
          v.object({
            originalFileName: v.optional(v.string()),
            recordingDate: v.optional(v.number()),
            recordingPlatform: v.optional(v.string()), // "zoom", "teams", "meet"
            duration: v.optional(v.string()),
            speakerCount: v.optional(v.number()),
          })
        ),
        processingStatus: v.union(
          v.literal("raw"), // As uploaded
          v.literal("processing"), // Being processed
          v.literal("processed"), // Cleaned/formatted
          v.literal("summarized") // Also has summary
        ),
        summary: v.optional(v.string()), // AI-generated summary
        keyPoints: v.optional(v.array(v.string())), // Extracted key points
        topics: v.optional(v.array(v.string())), // Detected topics
      })
    ),

    // Topic/subject for guided conversations
    subject: v.optional(v.string()),

    // Existing KB integration (for mode: "knowledge_based")
    knowledgeBaseIds: v.optional(v.array(v.id("knowledgeBases"))),
    knowledgeContentIds: v.optional(v.array(v.id("knowledgeContent"))),

    // Avatar configuration
    avatarId: v.id("avatars"),

    // Conversation behavior configuration
    behaviorConfig: v.object({
      conversationStyle: v.union(
        v.literal("discussion"), // Open discussion about content
        v.literal("quiz"), // Quiz student on content
        v.literal("review"), // Review/summarize content
        v.literal("q_and_a"), // Student asks questions
        v.literal("mixed") // Avatar adapts based on student
      ),
      difficultyAdaptation: v.boolean(), // Adapt to student level
      allowTopicDrift: v.boolean(), // Allow going off-topic
      targetDurationMinutes: v.optional(v.number()),
    }),

    // Web search capability (optional) - uses Tavily
    webSearchEnabled: v.optional(v.boolean()),
    webSearchConfig: v.optional(
      v.object({
        // Search depth: basic (faster), advanced (more thorough), or detailed (full article content)
        searchDepth: v.optional(v.union(v.literal("basic"), v.literal("advanced"), v.literal("detailed"))),
        // Maximum number of results to fetch
        maxResults: v.optional(v.number()),
        // Specific domains to include (e.g., ["bbc.com", "reuters.com"])
        includeDomains: v.optional(v.array(v.string())),
        // Domains to exclude from results
        excludeDomains: v.optional(v.array(v.string())),
        // Search topic focus: general, news, or finance
        topic: v.optional(v.union(v.literal("general"), v.literal("news"), v.literal("finance"))),
        // Custom search queries to run (in addition to conversation context)
        customQueries: v.optional(v.array(v.string())),
        // How often to refresh search results (in minutes)
        refreshIntervalMinutes: v.optional(v.number()),
      })
    ),

    // Pre-fetched web search content (stored when admin clicks "Fetch Now")
    // This is copied to session when user joins, avatar uses this content
    prefetchedContent: v.optional(
      v.object({
        fetchedAt: v.number(), // When the content was fetched
        query: v.string(), // The search query used
        answer: v.optional(v.string()), // Tavily's synthesized answer
        searchDepth: v.optional(v.string()), // "basic" | "advanced" | "detailed"
        llmRewrittenContent: v.optional(v.string()), // Clean journalist prose (detailed mode)
        results: v.array(
          v.object({
            title: v.string(),
            url: v.string(),
            content: v.string(),
            rawContent: v.optional(v.string()),
            publishedDate: v.optional(v.string()),
          })
        ),
      })
    ),

    // Entry Flow UI Configuration
    entryFlowConfig: v.optional(
      v.object({
        // Start Button Customization
        startButton: v.optional(
          v.object({
            text: v.optional(v.string()), // Default: "Start Conversation"
            variant: v.optional(
              v.union(
                v.literal("primary"), // Solid primary color
                v.literal("gradient"), // Gradient background
                v.literal("outline"), // Outlined style
                v.literal("glow") // With glow effect
              )
            ),
            showAvatarPreview: v.optional(v.boolean()), // Show avatar thumbnail
            animation: v.optional(
              v.union(
                v.literal("none"),
                v.literal("pulse"),
                v.literal("breathe"), // Subtle scale animation
                v.literal("shimmer") // Shimmer effect
              )
            ),
          })
        ),

        // Waiting Screen Configuration
        waitingScreen: v.optional(
          v.object({
            text: v.optional(v.string()), // Default: "{avatarName} is preparing..."
            subtext: v.optional(v.string()), // Secondary text below main
            animation: v.optional(
              v.union(
                v.literal("pulse"), // Default gentle pulse
                v.literal("dots"), // Three bouncing dots
                v.literal("wave"), // Wave animation
                v.literal("rings") // Concentric rings
              )
            ),
            showAvatarImage: v.optional(v.boolean()), // Show avatar during wait
            estimatedWaitSeconds: v.optional(v.number()), // Show countdown
          })
        ),
      })
    ),

    // Access Mode Configuration
    accessMode: v.optional(
      v.union(
        v.literal("authenticated_only"), // Must be logged in
        v.literal("public_link"), // Works without login
        v.literal("both") // Both methods work
      )
    ),

    // Guest Settings (for public_link mode)
    guestSettings: v.optional(
      v.object({
        collectName: v.optional(v.boolean()), // Ask for name before start
        collectEmail: v.optional(v.boolean()), // Ask for email (optional)
        nameRequired: v.optional(v.boolean()), // Is name mandatory?
        emailRequired: v.optional(v.boolean()), // Is email mandatory?
        customFields: v.optional(
          // Additional custom fields
          v.array(
            v.object({
              id: v.string(),
              label: v.string(),
              type: v.union(v.literal("text"), v.literal("select")),
              required: v.boolean(),
              options: v.optional(v.array(v.string())), // For select type
            })
          )
        ),
        termsRequired: v.optional(v.boolean()), // Must accept terms
        termsText: v.optional(v.string()), // Custom terms text
        welcomeNote: v.optional(v.string()), // Shown before start
      })
    ),

    // Sharing & access
    shareToken: v.string(),
    isPublic: v.boolean(),
    requiresAuth: v.boolean(),

    // Ownership
    createdBy: v.id("users"),

    // Stats
    totalSessions: v.number(),

    // Public link tracking (anonymous analytics)
    publicLinkStats: v.optional(
      v.object({
        totalGuestSessions: v.number(),
        lastGuestSessionAt: v.optional(v.number()),
      })
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_share_token", ["shareToken"])
    .index("by_creator", ["createdBy"])
    .index("by_mode", ["mode"])
    .index("by_public", ["isPublic"])
    .index("by_avatar", ["avatarId"]),

  // ============================================
  // ENTRY TEST SYSTEM (Cambridge English Assessment)
  // ============================================

  // Entry Test Templates - Hierarchical test definitions
  entryTestTemplates: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),

    // Target CEFR range this test assesses
    targetLevelRange: v.object({
      min: v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      ),
      max: v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      ),
    }),

    // Hierarchical ownership
    ownership: v.object({
      type: v.union(
        v.literal("platform"), // Official platform templates
        v.literal("company"),  // Company-specific templates
        v.literal("group")     // Group-specific templates
      ),
      companyId: v.optional(v.id("companies")),
      groupId: v.optional(v.id("groups")),
      parentTemplateId: v.optional(v.id("entryTestTemplates")), // Template this was derived from
    }),

    // Test sections configuration
    sections: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("reading"),
          v.literal("grammar"),
          v.literal("vocabulary"),
          v.literal("listening"),
          v.literal("writing"),
          v.literal("speaking")
        ),
        title: v.string(),
        instructions_en: v.string(),
        instructions_de: v.optional(v.string()),
        questionCount: v.number(),
        questionBankFilter: v.object({
          types: v.array(v.string()), // QuestionType values
          levels: v.array(v.string()), // CEFR levels
          tags: v.optional(v.array(v.string())),
        }),
        // Question selection mode: auto (use filter) or manual (use selectedQuestionIds)
        selectionMode: v.optional(
          v.union(v.literal("auto"), v.literal("manual"))
        ),
        // Manually selected question IDs (used when selectionMode is "manual")
        selectedQuestionIds: v.optional(
          v.array(v.id("entryTestQuestionBank"))
        ),
        weight: v.number(), // Weight for overall CEFR calculation (0-1)
        order: v.number(),
      })
    ),

    // Delivery configuration
    deliveryConfig: v.object({
      minimumMode: v.union(
        v.literal("web_only"),
        v.literal("audio_avatar"),
        v.literal("video_avatar")
      ),
      allowUpgrade: v.boolean(),
      avatarId: v.optional(v.id("avatars")),
    }),

    // Audio configuration for listening questions
    audioConfig: v.optional(
      v.object({
        maxReplays: v.number(),
        voiceId: v.optional(v.string()),
        speed: v.optional(v.number()),
      })
    ),

    // Feedback configuration
    feedbackConfig: v.object({
      showScoreImmediately: v.boolean(),
      avatarFeedbackLevel: v.union(
        v.literal("none"),
        v.literal("score_only"),
        v.literal("personalized"),
        v.literal("learning_path"),
        v.literal("full_debrief")
      ),
      showSectionBreakdown: v.boolean(),
      showCorrectAnswers: v.boolean(),
    }),

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    version: v.number(),

    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_ownership_type", ["ownership.type"])
    .index("by_company", ["ownership.companyId"])
    .index("by_group", ["ownership.groupId"]),

  // Entry Test Question Bank - Curated questions for tests
  entryTestQuestionBank: defineTable({
    // Question type
    type: v.union(
      v.literal("reading_comprehension"),
      v.literal("grammar_mcq"),
      v.literal("grammar_fill_blank"),
      v.literal("vocabulary_mcq"),
      v.literal("vocabulary_matching"),
      v.literal("listening_mcq"),
      v.literal("listening_fill_blank"),
      v.literal("writing_prompt"),
      v.literal("speaking_prompt")
    ),

    // CEFR level
    cefrLevel: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2"),
      v.literal("C1"),
      v.literal("C2")
    ),

    // Categorization
    tags: v.array(v.string()),

    // Question content (structure varies by type)
    content: v.any(), // Type-specific content object

    // For listening questions - pre-generated audio
    audioStorageId: v.optional(v.id("_storage")),
    audioText: v.optional(v.string()), // Text that was converted to audio

    // Delivery mode - how the question is presented to the student
    // text: Student reads the question (default for grammar, vocabulary, reading, writing)
    // audio: TTS audio plays the question (default for listening)
    // avatar: Video avatar (Beyond Presence) presents the question (default for speaking)
    deliveryMode: v.optional(
      v.union(v.literal("text"), v.literal("audio"), v.literal("avatar"))
    ),

    // Generation metadata
    generatedBy: v.union(v.literal("ai"), v.literal("manual")),
    generationModel: v.optional(v.string()),

    // Curation status
    curationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    curatedBy: v.optional(v.id("users")),
    curatedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),

    // Usage statistics
    usageCount: v.number(),
    averageScore: v.optional(v.number()),
    discriminationIndex: v.optional(v.number()), // How well question differentiates levels

    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_level", ["cefrLevel"])
    .index("by_type_level", ["type", "cefrLevel"])
    .index("by_curation_status", ["curationStatus"])
    .index("by_created", ["createdAt"]),

  // Entry Test Sessions - Individual test attempts
  entryTestSessions: defineTable({
    templateId: v.id("entryTestTemplates"),
    studentId: v.id("students"),
    userId: v.id("users"),

    // Session status
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("abandoned")
    ),

    // Delivery mode used
    deliveryMode: v.union(
      v.literal("web_only"),
      v.literal("audio_avatar"),
      v.literal("video_avatar")
    ),

    // LiveKit room for avatar modes
    liveKitRoomName: v.optional(v.string()),

    // Current state for resume capability
    currentState: v.object({
      currentSectionIndex: v.number(),
      currentQuestionIndex: v.number(),
      sectionOrder: v.array(v.string()), // Section IDs in order
      questionOrder: v.any(), // Map of sectionId -> array of questionIds
    }),

    // Question instances for this test (snapshot for consistency)
    questionInstances: v.array(
      v.object({
        instanceId: v.string(),
        sectionId: v.string(),
        questionBankId: v.id("entryTestQuestionBank"),
        order: v.number(),
      })
    ),

    // Student answers
    answers: v.array(
      v.object({
        instanceId: v.string(),
        answer: v.any(), // Answer value varies by question type
        audioRecordingStorageId: v.optional(v.id("_storage")), // For speaking questions
        transcript: v.optional(v.string()), // Deepgram transcript for speaking
        answeredAt: v.number(),
        timeSpentSeconds: v.number(),
        audioReplaysUsed: v.optional(v.number()), // For listening questions
      })
    ),

    // Section scores (populated after completion)
    sectionScores: v.optional(
      v.array(
        v.object({
          sectionId: v.string(),
          sectionType: v.string(),
          rawScore: v.number(),
          maxScore: v.number(),
          percentScore: v.number(),
          cefrLevel: v.string(),
          aiEvaluation: v.optional(v.any()), // LLM evaluation details for writing/speaking
        })
      )
    ),

    // Overall result (populated after completion)
    overallResult: v.optional(
      v.object({
        recommendedLevel: v.string(),
        confidenceScore: v.number(),
        totalScore: v.number(),
        maxPossibleScore: v.number(),
        percentScore: v.number(),
        strengths: v.array(v.string()),
        weaknesses: v.array(v.string()),
        levelApplied: v.boolean(),
        levelAppliedAt: v.optional(v.number()),
        levelAppliedBy: v.optional(v.id("users")),
      })
    ),

    // Analytics
    analytics: v.optional(
      v.object({
        totalTimeSeconds: v.number(),
        averageTimePerQuestion: v.number(),
        audioReplaysUsed: v.number(),
        pauseCount: v.number(),
        resumeCount: v.number(),
        browserInfo: v.optional(v.string()),
        deviceType: v.optional(v.string()),
      })
    ),

    // Avatar feedback
    avatarFeedbackDelivered: v.boolean(),

    // Timestamps
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    lastActivityAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_template", ["templateId"])
    .index("by_status", ["status"])
    .index("by_student_status", ["studentId", "status"])
    .index("by_last_activity", ["lastActivityAt"])
    .index("by_room", ["liveKitRoomName"]),

  // Entry Test Generation Jobs - Track AI question generation
  entryTestGenerationJobs: defineTable({
    // Job type
    type: v.union(
      v.literal("question_batch"),
      v.literal("section"),
      v.literal("full_template")
    ),

    // Target template (optional)
    targetTemplateId: v.optional(v.id("entryTestTemplates")),

    // Generation parameters
    parameters: v.object({
      questionType: v.optional(v.string()),
      cefrLevel: v.optional(v.string()),
      count: v.number(),
      topic: v.optional(v.string()),
      customPrompt: v.optional(v.string()),
    }),

    // Model used
    model: v.string(),

    // Job status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.number(), // 0-100

    // Generated questions
    generatedQuestionIds: v.array(v.id("entryTestQuestionBank")),

    // Error information
    error: v.optional(v.string()),

    // Token usage
    tokenUsage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalCost: v.optional(v.number()),
      })
    ),

    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_template", ["targetTemplateId"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // LANDING PAGE / MARKETING SITE CONTENT
  // ============================================

  // Site configuration (global settings, featured avatar, etc.)
  siteConfig: defineTable({
    key: v.string(), // e.g., "landing_hero_avatar", "default_locale"
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Page content sections (hero, services, USPs, etc.)
  landingContent: defineTable({
    locale: v.string(), // "de" | "en"
    page: v.string(), // "home" | "about" | "services" | "pricing" | "contact"
    section: v.string(), // "hero" | "services" | "usps" | "cta" | etc.
    content: v.any(), // Section-specific content object
    order: v.optional(v.number()), // For ordering sections
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_locale_page", ["locale", "page"])
    .index("by_locale_page_section", ["locale", "page", "section"]),

  // FAQ items for landing pages
  landingFaq: defineTable({
    locale: v.string(), // "de" | "en"
    question: v.string(),
    answer: v.string(),
    category: v.string(), // "general" | "services" | "pricing" | "methodology"
    order: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_locale", ["locale"])
    .index("by_locale_category", ["locale", "category"])
    .index("by_locale_published", ["locale", "isPublished"]),

  // Testimonials
  landingTestimonials: defineTable({
    locale: v.string(),
    name: v.string(),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    quote: v.string(),
    imageUrl: v.optional(v.string()),
    rating: v.optional(v.number()), // 1-5
    isFeatured: v.boolean(),
    order: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_locale", ["locale"])
    .index("by_featured", ["isFeatured"]),

  // Blog categories for organizing blog posts
  blogCategories: defineTable({
    slug: v.string(),
    name: v.object({
      en: v.string(),
      de: v.string(),
    }),
    description: v.object({
      en: v.string(),
      de: v.string(),
    }),
    icon: v.string(),
    color: v.string(),
    order: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  // Blog posts (supports both legacy markdown and new block-based content)
  blogPosts: defineTable({
    locale: v.string(),
    slug: v.string(),
    categoryId: v.optional(v.id("blogCategories")), // Reference to blogCategories table
    title: v.string(),
    excerpt: v.string(),
    content: v.optional(v.string()), // Legacy markdown content (optional for backward compatibility)
    author: v.string(),
    authorImageUrl: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    featuredImageUrl: v.optional(v.string()),
    readTimeMinutes: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    publishedAt: v.optional(v.number()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),

    // New block-based content system
    contentBlocks: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      order: v.number(),
      config: v.any(), // Flexible config object for each block type
    }))),
    contentVersion: v.optional(v.number()), // 1 = legacy markdown, 2 = content blocks

    // AI generation metadata
    aiGenerated: v.optional(v.boolean()),
    aiGenerationPrompt: v.optional(v.string()),
    aiSuggestedGames: v.optional(v.array(v.string())), // Game IDs suggested by AI

    // Enhanced SEO
    seoKeywords: v.optional(v.array(v.string())),
    structuredData: v.optional(v.any()), // JSON-LD schema

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_locale_slug", ["locale", "slug"])
    .index("by_locale_status", ["locale", "status"])
    .index("by_locale_category", ["locale", "category"])
    .index("by_published", ["publishedAt"])
    .index("by_content_version", ["contentVersion"])
    .index("by_categoryId", ["categoryId"]),

  // Contact form submissions
  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    message: v.string(),
    locale: v.string(),
    source: v.optional(v.string()), // Page where form was submitted
    status: v.union(v.literal("new"), v.literal("read"), v.literal("replied"), v.literal("archived")),
    notes: v.optional(v.string()), // Internal notes
    // Reply tracking
    repliedAt: v.optional(v.number()),
    replySubject: v.optional(v.string()),
    replyBody: v.optional(v.string()),
    replyMethod: v.optional(v.union(v.literal("manual"), v.literal("ai"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // CITY SERVICE PAGES (SEO Landing Pages)
  // ============================================

  // City-specific service pages (e.g., /hannover/business-englisch)
  cityServicePages: defineTable({
    // URL structure: /{city}/{service} -> e.g., hannover/business-englisch
    city: v.string(), // e.g., "hannover", "berlin"
    service: v.string(), // e.g., "business-englisch", "firmenkurse"
    slug: v.string(), // Full path: "hannover/business-englisch"

    // Page metadata
    title: v.string(), // "Business Englischkurse in Hannover"
    metaTitle: v.optional(v.string()), // SEO title
    metaDescription: v.optional(v.string()), // SEO description

    // Content sections (stored as structured blocks)
    sections: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("hero"),
        v.literal("content"),
        v.literal("services"),
        v.literal("features"),
        v.literal("faq"),
        v.literal("cta"),
        v.literal("contact")
      ),
      order: v.number(),
      isPublished: v.boolean(),
      content: v.any(), // Section-specific content object
    })),

    // Publishing
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    publishedAt: v.optional(v.number()),

    // Tracking
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_city", ["city"])
    .index("by_city_service", ["city", "service"])
    .index("by_status", ["status"]),

  // ============================================
  // KNOWLEDGE FEEDBACK SYSTEM
  // ============================================

  // Usage events from avatar interactions
  knowledgeFeedback: defineTable({
    knowledgeBaseId: v.id("knowledgeBases"),
    type: v.union(
      v.literal("lookup"),
      v.literal("retrieval"),
      v.literal("fallback"),
      v.literal("gap")
    ),
    timestamp: v.number(),
    sessionId: v.string(),
    studentId: v.optional(v.string()),
    query: v.string(),
    queryType: v.union(
      v.literal("grammar"),
      v.literal("vocabulary"),
      v.literal("exercise"),
      v.literal("general")
    ),
    found: v.boolean(),
    contentId: v.optional(v.id("knowledgeContent")),
    contentTitle: v.optional(v.string()),
    rlmLookupTime: v.optional(v.number()),
    usedInResponse: v.boolean(),
    studentFoundHelpful: v.optional(v.boolean()),
    studentAskedFollowUp: v.optional(v.boolean()),
    lessonTopic: v.optional(v.string()),
    studentLevel: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_knowledge_base", ["knowledgeBaseId"])
    .index("by_session", ["sessionId"])
    .index("by_content", ["contentId"])
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"]),

  // Content effectiveness tracking
  contentEffectiveness: defineTable({
    contentId: v.id("knowledgeContent"),
    knowledgeBaseId: v.id("knowledgeBases"),
    lookupCount: v.number(),
    helpfulCount: v.number(),
    followUpCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_knowledge_base", ["knowledgeBaseId"]),

  // Knowledge gaps identified from avatar interactions
  knowledgeGaps: defineTable({
    knowledgeBaseId: v.id("knowledgeBases"),
    query: v.string(),
    normalizedQuery: v.string(),
    queryType: v.string(),
    occurrenceCount: v.number(),
    firstSeen: v.number(),
    lastSeen: v.number(),
    relatedTopics: v.array(v.string()),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolvedWithContentId: v.optional(v.id("knowledgeContent")),
    createdAt: v.number(),
  })
    .index("by_knowledge_base", ["knowledgeBaseId"])
    .index("by_resolved", ["resolved"])
    .index("by_occurrence", ["occurrenceCount"]),

  // Agent control - for remote start/stop/restart of Python agent
  agentControl: defineTable({
    running: v.boolean(),
    pid: v.union(v.string(), v.null()),
    logs: v.string(),
    lastUpdate: v.number(),
    pendingCommand: v.union(
      v.literal("start"),
      v.literal("stop"),
      v.literal("restart"),
      v.null()
    ),
  }),

  // ============================================
  // TEACHERS
  // ============================================
  // Teachers can be allocated one or more avatars.
  // Teachers can be company-scoped or global (companyId = null).
  teachers: defineTable({
    userId: v.id("users"), // Reference to user
    companyId: v.optional(v.id("companies")), // null = global teacher
    avatarIds: v.array(v.id("avatars")), // Multiple avatars allowed
    status: v.union(v.literal("active"), v.literal("inactive")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"])
    .index("by_status", ["status"]),

  // ============================================
  // VIDEO CREATION SYSTEM
  // ============================================

  videoCreation: defineTable({
    // Basic Info
    title: v.string(),
    description: v.optional(v.string()),

    // Content Mode
    mode: v.union(
      v.literal("url_scrape"),      // Scrape URL for content
      v.literal("text_input"),      // Direct text/script input
      v.literal("template_based")   // Use predefined template
    ),

    // Content Source
    sourceUrl: v.optional(v.string()),           // For url_scrape mode
    scriptContent: v.optional(v.string()),       // For text_input mode
    templateId: v.optional(v.string()),          // For template_based mode

    // Scraped/Processed Content
    processedContent: v.optional(v.object({
      title: v.string(),
      content: v.string(),
      summary: v.optional(v.string()),
      keyPoints: v.optional(v.array(v.string())),
      source: v.optional(v.string()),
      fetchedAt: v.number(),
    })),

    // Avatar Configuration
    avatarId: v.id("avatars"),

    // Avatar Provider Overrides (optional - falls back to avatar defaults)
    avatarProviderConfig: v.optional(v.object({
      // Hedra configuration
      hedraAvatarId: v.optional(v.string()),       // Hedra avatar ID
      hedraBaseCreativeId: v.optional(v.string()), // Hedra base creative ID
      // Beyond Presence configuration
      beyAvatarId: v.optional(v.string()),         // Beyond Presence avatar ID
    })),

    // Voice Provider Overrides (optional - falls back to avatar defaults)
    voiceProviderConfig: v.optional(v.object({
      // Cartesia configuration
      cartesiaVoiceId: v.optional(v.string()),     // Cartesia voice ID
      // ElevenLabs configuration
      elevenLabsVoiceId: v.optional(v.string()),   // ElevenLabs voice ID
    })),

    // Video Configuration
    videoConfig: v.object({
      style: v.union(
        v.literal("news_broadcast"),  // Full graphics: lower third, ticker, logo
        v.literal("simple")           // Minimal: just avatar with optional logo
      ),
      duration: v.optional(v.number()),  // Target duration in seconds
      aspectRatio: v.union(
        v.literal("16:9"),    // Landscape (YouTube, TV)
        v.literal("9:16")     // Portrait (TikTok, Reels, Shorts)
      ),
      includeIntro: v.boolean(),
      includeOutro: v.boolean(),
      includeLowerThird: v.boolean(),
      includeTicker: v.boolean(),
      brandingPreset: v.optional(v.string()),
      // Lower third customization
      lowerThirdConfig: v.optional(v.object({
        name: v.optional(v.string()),
        title: v.optional(v.string()),
        style: v.optional(v.union(
          v.literal("minimal"),
          v.literal("news"),
          v.literal("corporate")
        )),
      })),
      // Ticker customization
      tickerConfig: v.optional(v.object({
        text: v.optional(v.string()),
        speed: v.optional(v.number()),
      })),
    }),

    // Recording State
    recordingStatus: v.union(
      v.literal("pending"),
      v.literal("recording"),
      v.literal("recorded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),

    // LiveKit Room for recording
    roomName: v.optional(v.string()),

    // Raw Recording (from LiveKit)
    rawRecording: v.optional(v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      fileSize: v.number(),
      recordedAt: v.number(),
      egressId: v.string(),
    })),

    // Final Output (from Remotion)
    finalOutput: v.optional(v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      fileSize: v.number(),
      renderedAt: v.number(),
      thumbnailUrl: v.optional(v.string()),
      thumbnailKey: v.optional(v.string()),
    })),

    // Sharing (same pattern as conversationPractice)
    shareToken: v.string(),
    accessMode: v.union(
      v.literal("private"),
      v.literal("unlisted"),
      v.literal("public")
    ),

    // Ownership & Stats
    createdBy: v.id("users"),
    totalViews: v.number(),

    // Error tracking
    errorMessage: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_share_token", ["shareToken"])
    .index("by_creator", ["createdBy"])
    .index("by_status", ["recordingStatus"])
    .index("by_created", ["createdAt"]),
});
