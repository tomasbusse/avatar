import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate a random share token
function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// QUERIES
// ============================================

/**
 * List all conversation practice instances for the current user
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    mode: v.optional(
      v.union(
        v.literal("free_conversation"),
        v.literal("transcript_based"),
        v.literal("knowledge_based"),
        v.literal("topic_guided")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    let query = ctx.db
      .query("conversationPractice")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id));

    const practices = await query.collect();

    // Filter by mode if specified
    let filtered = args.mode
      ? practices.filter((p) => p.mode === args.mode)
      : practices;

    // Sort by createdAt descending
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Get avatar info for each practice
    const withAvatars = await Promise.all(
      filtered.map(async (practice) => {
        const avatar = await ctx.db.get(practice.avatarId);
        return {
          ...practice,
          avatar: avatar
            ? {
                _id: avatar._id,
                name: avatar.name,
                appearance: avatar.appearance,
              }
            : null,
        };
      })
    );

    return withAvatars;
  },
});

/**
 * Get a conversation practice by ID
 */
export const getById = query({
  args: { practiceId: v.id("conversationPractice") },
  handler: async (ctx, args) => {
    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      return null;
    }

    const avatar = await ctx.db.get(practice.avatarId);

    return {
      ...practice,
      avatar: avatar
        ? {
            _id: avatar._id,
            name: avatar.name,
            slug: avatar.slug,
            appearance: avatar.appearance,
            persona: avatar.persona,
          }
        : null,
    };
  },
});

/**
 * Get conversation practice by share token (for public access)
 */
export const getByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const practice = await ctx.db
      .query("conversationPractice")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!practice) {
      return null;
    }

    // Get avatar with appearance info
    const avatar = await ctx.db.get(practice.avatarId);

    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();

    return {
      practice: {
        _id: practice._id,
        title: practice.title,
        description: practice.description,
        mode: practice.mode,
        subject: practice.subject,
        accessMode: practice.accessMode ?? "both",
        requiresAuth: practice.requiresAuth,
        entryFlowConfig: practice.entryFlowConfig,
        guestSettings: practice.guestSettings,
        behaviorConfig: practice.behaviorConfig,
        // Web search configuration
        webSearchEnabled: practice.webSearchEnabled,
        webSearchConfig: practice.webSearchConfig,
        // Include transcript summary/topics for landing page
        transcriptSummary: practice.transcript?.summary,
        transcriptTopics: practice.transcript?.topics,
        transcriptKeyPoints: practice.transcript?.keyPoints,
      },
      avatar: avatar
        ? {
            _id: avatar._id,
            name: avatar.name,
            appearance: avatar.appearance,
            profileImage: avatar.profileImage,
          }
        : null,
      isAuthenticated: !!identity,
    };
  },
});

/**
 * Get conversation practice with full context for agent
 */
export const getForAgent = query({
  args: { roomName: v.string() },
  handler: async (ctx, args) => {
    // Get session by room name
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_room", (q) => q.eq("roomName", args.roomName))
      .first();

    if (!session || !session.conversationPracticeId) {
      return null;
    }

    const practice = await ctx.db.get(session.conversationPracticeId);
    if (!practice) {
      return null;
    }

    const avatar = await ctx.db.get(practice.avatarId);

    // Get knowledge content - either from direct content IDs or from knowledge bases
    let knowledgeContent: Array<{
      _id: Id<"knowledgeContent">;
      title: string;
      content: string;
      knowledgeBaseName?: string;
    }> = [];

    // Fetch from direct knowledgeContentIds if specified
    if (practice.knowledgeContentIds) {
      for (const contentId of practice.knowledgeContentIds) {
        const content = await ctx.db.get(contentId);
        if (content) {
          knowledgeContent.push({
            _id: content._id,
            title: content.title,
            content: content.content,
          });
        }
      }
    }

    // Fetch content from knowledge bases if specified
    if (practice.knowledgeBaseIds && practice.knowledgeBaseIds.length > 0) {
      for (const kbId of practice.knowledgeBaseIds) {
        const kb = await ctx.db.get(kbId);
        if (!kb) continue;

        // Get all content for this knowledge base
        const kbContent = await ctx.db
          .query("knowledgeContent")
          .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", kbId))
          .collect();

        for (const content of kbContent) {
          knowledgeContent.push({
            _id: content._id,
            title: content.title,
            content: content.content,
            knowledgeBaseName: kb.name,
          });
        }
      }
    }

    return {
      practice: {
        _id: practice._id,
        title: practice.title,
        mode: practice.mode,
        subject: practice.subject,
        transcript: practice.transcript,
        behaviorConfig: practice.behaviorConfig,
        webSearchEnabled: practice.webSearchEnabled,
        webSearchConfig: practice.webSearchConfig,
      },
      avatar,
      knowledgeContent,
      session: {
        _id: session._id,
        guestName: session.guestName,
        isGuest: session.isGuest,
        studentId: session.studentId,
        webSearchResults: session.webSearchResults,
      },
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new conversation practice instance
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    mode: v.union(
      v.literal("free_conversation"),
      v.literal("transcript_based"),
      v.literal("knowledge_based"),
      v.literal("topic_guided")
    ),
    subject: v.optional(v.string()),
    avatarId: v.id("avatars"),
    behaviorConfig: v.object({
      conversationStyle: v.union(
        v.literal("discussion"),
        v.literal("quiz"),
        v.literal("review"),
        v.literal("q_and_a"),
        v.literal("mixed")
      ),
      difficultyAdaptation: v.boolean(),
      allowTopicDrift: v.boolean(),
      targetDurationMinutes: v.optional(v.number()),
    }),
    webSearchEnabled: v.optional(v.boolean()),
    webSearchConfig: v.optional(
      v.object({
        searchDepth: v.optional(v.union(v.literal("basic"), v.literal("advanced"), v.literal("detailed"))),
        maxResults: v.optional(v.number()),
        includeDomains: v.optional(v.array(v.string())),
        excludeDomains: v.optional(v.array(v.string())),
        topic: v.optional(v.union(v.literal("general"), v.literal("news"), v.literal("finance"))),
        customQueries: v.optional(v.array(v.string())),
        refreshIntervalMinutes: v.optional(v.number()),
      })
    ),
    knowledgeBaseIds: v.optional(v.array(v.id("knowledgeBases"))),
    knowledgeContentIds: v.optional(v.array(v.id("knowledgeContent"))),
    // Entry flow config
    entryFlowConfig: v.optional(
      v.object({
        startButton: v.optional(
          v.object({
            text: v.optional(v.string()),
            variant: v.optional(
              v.union(
                v.literal("primary"),
                v.literal("gradient"),
                v.literal("outline"),
                v.literal("glow")
              )
            ),
            showAvatarPreview: v.optional(v.boolean()),
            animation: v.optional(
              v.union(
                v.literal("none"),
                v.literal("pulse"),
                v.literal("breathe"),
                v.literal("shimmer")
              )
            ),
          })
        ),
        waitingScreen: v.optional(
          v.object({
            text: v.optional(v.string()),
            subtext: v.optional(v.string()),
            animation: v.optional(
              v.union(
                v.literal("pulse"),
                v.literal("dots"),
                v.literal("wave"),
                v.literal("rings")
              )
            ),
            showAvatarImage: v.optional(v.boolean()),
            estimatedWaitSeconds: v.optional(v.number()),
          })
        ),
      })
    ),
    // Access settings
    accessMode: v.optional(
      v.union(
        v.literal("authenticated_only"),
        v.literal("public_link"),
        v.literal("both")
      )
    ),
    guestSettings: v.optional(
      v.object({
        collectName: v.optional(v.boolean()),
        collectEmail: v.optional(v.boolean()),
        nameRequired: v.optional(v.boolean()),
        emailRequired: v.optional(v.boolean()),
        termsRequired: v.optional(v.boolean()),
        termsText: v.optional(v.string()),
        welcomeNote: v.optional(v.string()),
      })
    ),
    isPublic: v.optional(v.boolean()),
    requiresAuth: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify avatar exists
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) {
      throw new Error("Avatar not found");
    }

    const now = Date.now();
    const shareToken = generateShareToken();

    const practiceId = await ctx.db.insert("conversationPractice", {
      title: args.title,
      description: args.description,
      mode: args.mode,
      subject: args.subject,
      avatarId: args.avatarId,
      behaviorConfig: args.behaviorConfig,
      webSearchEnabled: args.webSearchEnabled ?? false,
      webSearchConfig: args.webSearchConfig,
      knowledgeBaseIds: args.knowledgeBaseIds,
      knowledgeContentIds: args.knowledgeContentIds,
      entryFlowConfig: args.entryFlowConfig,
      accessMode: args.accessMode ?? "both",
      guestSettings: args.guestSettings,
      shareToken,
      isPublic: args.isPublic ?? false,
      requiresAuth: args.requiresAuth ?? false,
      createdBy: user._id,
      totalSessions: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      practiceId,
      shareToken,
    };
  },
});

/**
 * Upload transcript to a conversation practice
 */
export const uploadTranscript = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
    content: v.string(),
    sourceType: v.union(
      v.literal("paste"),
      v.literal("file_upload"),
      v.literal("auto_generated")
    ),
    sourceMetadata: v.optional(
      v.object({
        originalFileName: v.optional(v.string()),
        recordingDate: v.optional(v.number()),
        recordingPlatform: v.optional(v.string()),
        duration: v.optional(v.string()),
        speakerCount: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    // Update the practice with transcript
    await ctx.db.patch(args.practiceId, {
      mode: "transcript_based",
      transcript: {
        content: args.content,
        sourceType: args.sourceType,
        sourceMetadata: args.sourceMetadata,
        processingStatus: "raw",
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update transcript processing status and add AI-generated summary/key points
 */
export const updateTranscriptProcessing = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
    processingStatus: v.union(
      v.literal("raw"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("summarized")
    ),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
    topics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const practice = await ctx.db.get(args.practiceId);
    if (!practice || !practice.transcript) {
      throw new Error("Practice or transcript not found");
    }

    await ctx.db.patch(args.practiceId, {
      transcript: {
        ...practice.transcript,
        processingStatus: args.processingStatus,
        summary: args.summary ?? practice.transcript.summary,
        keyPoints: args.keyPoints ?? practice.transcript.keyPoints,
        topics: args.topics ?? practice.transcript.topics,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update a conversation practice instance
 */
export const update = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    avatarId: v.optional(v.id("avatars")),
    behaviorConfig: v.optional(
      v.object({
        conversationStyle: v.union(
          v.literal("discussion"),
          v.literal("quiz"),
          v.literal("review"),
          v.literal("q_and_a"),
          v.literal("mixed")
        ),
        difficultyAdaptation: v.boolean(),
        allowTopicDrift: v.boolean(),
        targetDurationMinutes: v.optional(v.number()),
      })
    ),
    webSearchEnabled: v.optional(v.boolean()),
    webSearchConfig: v.optional(
      v.object({
        searchDepth: v.optional(v.union(v.literal("basic"), v.literal("advanced"), v.literal("detailed"))),
        maxResults: v.optional(v.number()),
        includeDomains: v.optional(v.array(v.string())),
        excludeDomains: v.optional(v.array(v.string())),
        topic: v.optional(v.union(v.literal("general"), v.literal("news"), v.literal("finance"))),
        customQueries: v.optional(v.array(v.string())),
        refreshIntervalMinutes: v.optional(v.number()),
      })
    ),
    entryFlowConfig: v.optional(v.any()),
    accessMode: v.optional(
      v.union(
        v.literal("authenticated_only"),
        v.literal("public_link"),
        v.literal("both")
      )
    ),
    guestSettings: v.optional(v.any()),
    isPublic: v.optional(v.boolean()),
    requiresAuth: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.avatarId !== undefined) {
      // Verify avatar exists
      const avatar = await ctx.db.get(args.avatarId);
      if (!avatar) {
        throw new Error("Avatar not found");
      }
      updates.avatarId = args.avatarId;
    }
    if (args.behaviorConfig !== undefined)
      updates.behaviorConfig = args.behaviorConfig;
    if (args.webSearchEnabled !== undefined)
      updates.webSearchEnabled = args.webSearchEnabled;
    if (args.webSearchConfig !== undefined)
      updates.webSearchConfig = args.webSearchConfig;
    if (args.entryFlowConfig !== undefined)
      updates.entryFlowConfig = args.entryFlowConfig;
    if (args.accessMode !== undefined) updates.accessMode = args.accessMode;
    if (args.guestSettings !== undefined)
      updates.guestSettings = args.guestSettings;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.requiresAuth !== undefined)
      updates.requiresAuth = args.requiresAuth;

    await ctx.db.patch(args.practiceId, updates);
    return { success: true };
  },
});

/**
 * Delete a conversation practice instance
 */
export const remove = mutation({
  args: { practiceId: v.id("conversationPractice") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    await ctx.db.delete(args.practiceId);
    return { success: true };
  },
});

/**
 * Regenerate share token
 */
export const regenerateShareToken = mutation({
  args: { practiceId: v.id("conversationPractice") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const newToken = generateShareToken();

    await ctx.db.patch(args.practiceId, {
      shareToken: newToken,
      updatedAt: Date.now(),
    });

    return { shareToken: newToken };
  },
});

/**
 * Increment session count
 */
export const incrementSessionCount = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
    isGuest: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    const updates: Record<string, unknown> = {
      totalSessions: practice.totalSessions + 1,
      updatedAt: Date.now(),
    };

    // Update guest stats if this is a guest session
    if (args.isGuest) {
      updates.publicLinkStats = {
        totalGuestSessions:
          (practice.publicLinkStats?.totalGuestSessions ?? 0) + 1,
        lastGuestSessionAt: Date.now(),
      };
    }

    await ctx.db.patch(args.practiceId, updates);
    return { success: true };
  },
});

/**
 * Create a session for conversation practice
 */
export const createSession = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
    roomName: v.string(),
    guestName: v.optional(v.string()),
    guestMetadata: v.optional(
      v.object({
        email: v.optional(v.string()),
        customFields: v.optional(v.any()),
        acceptedTermsAt: v.optional(v.number()),
        referrer: v.optional(v.string()),
      })
    ),
    // Pre-fetched web search results (fetched at join time)
    webSearchResults: v.optional(
      v.object({
        fetchedAt: v.number(),
        query: v.string(),
        answer: v.optional(v.string()),
        searchDepth: v.optional(v.string()), // "basic" | "advanced" | "detailed"
        llmRewrittenContent: v.optional(v.string()), // LLM-rewritten clean journalist prose
        results: v.array(
          v.object({
            title: v.string(),
            url: v.string(),
            content: v.string(),
            rawContent: v.optional(v.string()), // Full article content (detailed mode)
            publishedDate: v.optional(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    // Check access permissions
    if (practice.accessMode === "authenticated_only" && !identity) {
      throw new Error("Authentication required");
    }

    let studentId: Id<"students"> | undefined;
    const isGuest = !identity;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (user) {
        const student = await ctx.db
          .query("students")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();
        studentId = student?._id;
      }
    }

    // If no student found, create a placeholder for guest
    if (!studentId) {
      // Get or create a guest user
      let guestUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) =>
          q.eq("email", args.guestMetadata?.email ?? "guest@practice.local")
        )
        .first();

      if (!guestUser) {
        const guestUserId = await ctx.db.insert("users", {
          email: args.guestMetadata?.email ?? "guest@practice.local",
          role: "guest",
          status: "active",
          loginCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        guestUser = await ctx.db.get(guestUserId);
      }

      // Create guest student
      const guestStudentId = await ctx.db.insert("students", {
        userId: guestUser!._id,
        nativeLanguage: "de",
        targetLanguage: "en",
        currentLevel: "B1",
        learningGoal: "personal",
        totalLessonsCompleted: 0,
        totalMinutesPracticed: 0,
        currentStreak: 0,
        longestStreak: 0,
        preferences: {
          bilingualMode: "adaptive",
          lessonDuration: 15,
        },
        onboardingCompleted: false,
        assessmentCompleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      studentId = guestStudentId;
    }

    const now = Date.now();

    // Use prefetched content from practice if available, otherwise use passed webSearchResults
    // This allows admin to pre-fetch content that all sessions will use
    const webSearchContent = practice.prefetchedContent ?? args.webSearchResults;

    // Create session
    const sessionId = await ctx.db.insert("sessions", {
      studentId: studentId!,
      avatarId: practice.avatarId,
      conversationPracticeId: args.practiceId,
      roomName: args.roomName,
      guestName: args.guestName,
      isGuest,
      guestMetadata: args.guestMetadata,
      webSearchResults: webSearchContent,
      startedAt: now,
      status: "waiting",
      type: "conversation_practice",
      timerConfig: practice.behaviorConfig.targetDurationMinutes
        ? {
            targetDurationMinutes: practice.behaviorConfig.targetDurationMinutes,
            wrapUpBufferMinutes: 2,
          }
        : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Increment session count
    await ctx.db.patch(args.practiceId, {
      totalSessions: practice.totalSessions + 1,
      publicLinkStats: isGuest
        ? {
            totalGuestSessions:
              (practice.publicLinkStats?.totalGuestSessions ?? 0) + 1,
            lastGuestSessionAt: now,
          }
        : practice.publicLinkStats,
      updatedAt: now,
    });

    return {
      sessionId,
      roomName: args.roomName,
    };
  },
});

// ============================================
// PREFETCHED CONTENT MANAGEMENT
// ============================================

/**
 * Store prefetched web search content for a practice
 * Called when admin clicks "Fetch Now" to pre-load content
 * This content is then copied to sessions when users join
 */
export const storePrefetchedContent = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
    prefetchedContent: v.object({
      fetchedAt: v.number(),
      query: v.string(),
      answer: v.optional(v.string()),
      searchDepth: v.optional(v.string()),
      llmRewrittenContent: v.optional(v.string()),
      results: v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          content: v.string(),
          rawContent: v.optional(v.string()),
          publishedDate: v.optional(v.string()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    await ctx.db.patch(args.practiceId, {
      prefetchedContent: args.prefetchedContent,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Clear prefetched content from a practice
 * Used when admin wants to reset/clear the pre-loaded content
 */
export const clearPrefetchedContent = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    await ctx.db.patch(args.practiceId, {
      prefetchedContent: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get prefetched content for a practice (used by agent to check if refresh needed)
 */
export const getPrefetchedContent = query({
  args: {
    practiceId: v.id("conversationPractice"),
  },
  handler: async (ctx, args) => {
    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      return null;
    }

    return practice.prefetchedContent ?? null;
  },
});
