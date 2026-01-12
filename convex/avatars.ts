import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAvatar = query({
  args: { avatarId: v.id("avatars") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.avatarId);
  },
});

export const getAvatarBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("avatars")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const listActiveAvatars = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("avatars")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get the first active avatar as a fallback (replaces getDefaultAvatar)
export const getFirstActiveAvatar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("avatars")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});

export const createAvatar = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    profileImage: v.optional(v.string()),
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
        emotion: v.optional(v.union(
          v.string(),  // Legacy: "neutral"
          v.array(v.string())  // New: ["positivity:medium"]
        )),
      }),
      languageVoices: v.optional(
        v.object({
          en: v.optional(v.string()),
          de: v.optional(v.string()),
        })
      ),
    }),
    sttConfig: v.optional(
      v.object({
        provider: v.union(v.literal("deepgram")),
        model: v.string(),
        language: v.optional(v.string()),
        settings: v.optional(
          v.object({
            smartFormat: v.optional(v.boolean()),
            endpointing: v.optional(v.number()),
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
    visionConfig: v.optional(
      v.object({
        enabled: v.boolean(),
        visionLLMModel: v.optional(v.string()),
        captureMode: v.optional(
          v.union(
            v.literal("on_demand"),
            v.literal("always"),
            v.literal("smart")
          )
        ),
        captureWebcam: v.optional(v.boolean()),
        captureScreen: v.optional(v.boolean()),
      })
    ),
    // Structured personality (traits, style, behaviors)
    personality: v.optional(v.any()),
    // Full identity (fullName, credentials, careerHistory, anecdotes, philosophy)
    identity: v.optional(v.any()),
    // Knowledge base configuration
    knowledgeConfig: v.optional(v.any()),
    // Memory configuration
    memoryConfig: v.optional(v.any()),
    // Session timer configuration
    sessionConfig: v.optional(
      v.object({
        defaultDurationMinutes: v.optional(v.number()),
        wrapUpBufferMinutes: v.optional(v.number()),
        autoEnd: v.optional(v.boolean()),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Not authorized");
    }

    const now = Date.now();

    return await ctx.db.insert("avatars", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAvatar = mutation({
  args: {
    avatarId: v.id("avatars"),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.avatarId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

// Dev helper: Link knowledge base to avatar (no auth required for dev)
export const linkKnowledgeBase = mutation({
  args: {
    avatarId: v.id("avatars"),
    knowledgeBaseId: v.id("knowledgeBases"),
  },
  handler: async (ctx, args) => {
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) throw new Error("Avatar not found");

    const existingConfig = avatar.knowledgeConfig ?? {
      knowledgeBaseIds: [],
      domain: { primaryTopic: "", subtopics: [], expertise: [], limitations: [] },
      ragSettings: { enabled: false, triggerKeywords: [], maxContextChunks: 3, similarityThreshold: 0.7 },
    };
    const existingIds = existingConfig.knowledgeBaseIds || [];

    // Add knowledge base if not already linked
    if (!existingIds.includes(args.knowledgeBaseId)) {
      existingIds.push(args.knowledgeBaseId);
    }

    await ctx.db.patch(args.avatarId, {
      knowledgeConfig: {
        knowledgeBaseIds: existingIds,
        domain: existingConfig.domain.primaryTopic ? existingConfig.domain : {
          primaryTopic: "English Grammar",
          subtopics: ["Modal Verbs", "Tenses"],
          expertise: ["Grammar Teaching"],
          limitations: [],
        },
        ragSettings: existingConfig.ragSettings.enabled !== undefined ? existingConfig.ragSettings : {
          enabled: true,
          triggerKeywords: ["grammar", "modal", "tense", "exercise", "vocabulary"],
          maxContextChunks: 3,
          similarityThreshold: 0.7,
          preferRecent: false,
        },
      },
      updatedAt: Date.now(),
    });

    return { success: true, knowledgeBaseIds: existingIds };
  },
});

// ============================================
// LIFE STORY & SESSION START MUTATIONS
// ============================================

// Update avatar's life story document and/or summary
export const updateLifeStory = mutation({
  args: {
    avatarId: v.id("avatars"),
    lifeStoryDocument: v.optional(v.string()),
    lifeStorySummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Not authorized");
    }

    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) throw new Error("Avatar not found");

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.lifeStoryDocument !== undefined) {
      updates.lifeStoryDocument = args.lifeStoryDocument;
    }

    if (args.lifeStorySummary !== undefined) {
      updates.lifeStorySummary = args.lifeStorySummary;
    }

    await ctx.db.patch(args.avatarId, updates);

    return { success: true };
  },
});

// Update avatar's session start configuration
export const updateSessionStartConfig = mutation({
  args: {
    avatarId: v.id("avatars"),
    sessionStartConfig: v.object({
      behavior: v.union(
        v.literal("speak_first"),
        v.literal("wait_for_student"),
        v.literal("contextual")
      ),
      openingGreeting: v.optional(v.string()),
      greetingVariations: v.optional(v.array(v.string())),
      openingTopics: v.optional(v.array(v.string())),
      warmUpDuration: v.optional(v.number()),
      mentionPreviousSession: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Not authorized");
    }

    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) throw new Error("Avatar not found");

    await ctx.db.patch(args.avatarId, {
      sessionStartConfig: args.sessionStartConfig,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Query to get avatar's life story and session config
export const getAvatarLifeStory = query({
  args: { avatarId: v.id("avatars") },
  handler: async (ctx, args) => {
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) return null;

    return {
      _id: avatar._id,
      name: avatar.name,
      lifeStoryDocument: avatar.lifeStoryDocument,
      lifeStorySummary: avatar.lifeStorySummary,
      sessionStartConfig: avatar.sessionStartConfig,
    };
  },
});

// ============================================
// AVATAR DELETION WITH CASCADE
// ============================================

// Query to get information about what will be deleted when avatar is removed
// This is useful for showing a confirmation dialog to the admin
export const getAvatarDeletionInfo = query({
  args: { avatarId: v.id("avatars") },
  handler: async (ctx, args) => {
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) return null;

    // Count sessions using this avatar
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .collect();

    // Count active sessions (sessions that are currently in progress)
    const activeSessions = sessions.filter(
      (s) => s.status === "active" || s.status === "waiting"
    );

    // Count structured lessons using this avatar
    const structuredLessons = await ctx.db
      .query("structuredLessons")
      .collect();
    const lessonsUsingAvatar = structuredLessons.filter(
      (lesson) => lesson.avatarId === args.avatarId
    );

    // Count students with this avatar as preferred
    const students = await ctx.db.query("students").collect();
    const studentsWithPreference = students.filter(
      (s) => s.preferences?.preferredAvatarId === args.avatarId
    );

    // Count groups with this as default avatar
    const groups = await ctx.db.query("groups").collect();
    const groupsWithDefault = groups.filter(
      (g) => g.defaultAvatarId === args.avatarId
    );

    // Count entry test templates using this avatar
    const entryTestTemplates = await ctx.db.query("entryTestTemplates").collect();
    const templatesUsingAvatar = entryTestTemplates.filter(
      (t) => t.deliveryConfig?.avatarId === args.avatarId
    );

    return {
      avatar: {
        _id: avatar._id,
        name: avatar.name,
      },
      counts: {
        totalSessions: sessions.length,
        activeSessions: activeSessions.length,
        structuredLessons: lessonsUsingAvatar.length,
        studentsWithPreference: studentsWithPreference.length,
        groupsWithDefault: groupsWithDefault.length,
        entryTestTemplates: templatesUsingAvatar.length,
      },
      // Prevent deletion if there are active sessions
      canDelete: activeSessions.length === 0,
      blockingReason:
        activeSessions.length > 0
          ? `Cannot delete: ${activeSessions.length} active session(s) in progress`
          : null,
    };
  },
});

// Delete avatar with cascade - removes all related data
export const deleteAvatar = mutation({
  args: {
    avatarId: v.id("avatars"),
    // Require explicit confirmation for safety
    confirmDelete: v.boolean(),
    // Force delete: mark any "active" sessions as "abandoned" first
    // Use this for cleaning up orphaned sessions that weren't properly closed
    forceDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Not authorized - admin access required");
    }

    if (!args.confirmDelete) {
      throw new Error("Deletion not confirmed");
    }

    // Get the avatar
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) {
      throw new Error("Avatar not found");
    }

    // Check for active sessions
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "active"), q.eq(q.field("status"), "waiting"))
      )
      .collect();

    // If forceDelete is enabled, mark active sessions as abandoned
    if (activeSessions.length > 0) {
      if (args.forceDelete) {
        const now = Date.now();
        for (const session of activeSessions) {
          const durationMinutes = session.startedAt
            ? Math.round((now - session.startedAt) / 60000)
            : 0;
          await ctx.db.patch(session._id, {
            status: "abandoned",
            endedAt: now,
            durationMinutes,
            feedback: "Force-ended: Avatar deleted by admin",
            updatedAt: now,
          });
        }
      } else {
        throw new Error(
          `Cannot delete avatar: ${activeSessions.length} active session(s) in progress. ` +
            `Use forceDelete option to mark them as abandoned, or wait for them to complete.`
        );
      }
    }

    // Track deletion counts for response
    const deletionCounts = {
      sessions: 0,
      structuredLessons: 0,
      studentsUpdated: 0,
      groupsUpdated: 0,
      entryTestTemplatesUpdated: 0,
    };

    // 1. Delete all sessions using this avatar
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
      deletionCounts.sessions++;
    }

    // 2. Delete all structured lessons using this avatar
    const structuredLessons = await ctx.db
      .query("structuredLessons")
      .collect();

    for (const lesson of structuredLessons) {
      if (lesson.avatarId === args.avatarId) {
        // Also delete lesson enrollments for this lesson
        const enrollments = await ctx.db
          .query("lessonEnrollments")
          .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
          .collect();

        for (const enrollment of enrollments) {
          await ctx.db.delete(enrollment._id);
        }

        await ctx.db.delete(lesson._id);
        deletionCounts.structuredLessons++;
      }
    }

    // 3. Clear preferredAvatarId from students who had this avatar
    const students = await ctx.db.query("students").collect();

    for (const student of students) {
      if (student.preferences?.preferredAvatarId === args.avatarId) {
        await ctx.db.patch(student._id, {
          preferences: {
            ...student.preferences,
            preferredAvatarId: undefined,
          },
          updatedAt: Date.now(),
        });
        deletionCounts.studentsUpdated++;
      }
    }

    // 4. Clear defaultAvatarId from groups
    const groups = await ctx.db.query("groups").collect();

    for (const group of groups) {
      if (group.defaultAvatarId === args.avatarId) {
        await ctx.db.patch(group._id, {
          defaultAvatarId: undefined,
          updatedAt: Date.now(),
        });
        deletionCounts.groupsUpdated++;
      }
    }

    // 5. Clear avatarId from entry test templates
    const entryTestTemplates = await ctx.db.query("entryTestTemplates").collect();

    for (const template of entryTestTemplates) {
      if (template.deliveryConfig?.avatarId === args.avatarId) {
        await ctx.db.patch(template._id, {
          deliveryConfig: {
            ...template.deliveryConfig,
            avatarId: undefined,
          },
          updatedAt: Date.now(),
        });
        deletionCounts.entryTestTemplatesUpdated++;
      }
    }

    // 6. Finally, delete the avatar itself
    await ctx.db.delete(args.avatarId);

    return {
      success: true,
      deletedAvatar: avatar.name,
      deletionCounts,
      message: `Avatar "${avatar.name}" and all related data have been deleted.`,
    };
  },
});

// ============================================
// PROFILE IMAGE UPLOAD
// ============================================

export const generateProfileImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveProfileImage = mutation({
  args: {
    avatarId: v.id("avatars"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) {
      throw new Error("Avatar not found");
    }

    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get storage URL");
    }

    // Update the avatar with the new profile image URL
    await ctx.db.patch(args.avatarId, {
      profileImage: url,
      updatedAt: Date.now(),
    });

    return { success: true, url };
  },
});

// Get storage URL for uploaded file (used during avatar creation before avatar exists)
export const getStorageUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get storage URL");
    }
    return url;
  },
});
