import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getDefaultAvatar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("avatars")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();
  },
});

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

export const createAvatar = mutation({
  args: {
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
    isDefault: v.optional(v.boolean()),
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

    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("avatars")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();

      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { isDefault: false });
      }
    }

    return await ctx.db.insert("avatars", {
      ...args,
      isActive: true,
      isDefault: args.isDefault ?? false,
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

export const setDefaultAvatar = mutation({
  args: { avatarId: v.id("avatars") },
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

    const existingDefault = await ctx.db
      .query("avatars")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();

    if (existingDefault) {
      await ctx.db.patch(existingDefault._id, { isDefault: false });
    }

    await ctx.db.patch(args.avatarId, {
      isDefault: true,
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

    const existingConfig = avatar.knowledgeConfig || {};
    const existingIds = existingConfig.knowledgeBaseIds || [];

    // Add knowledge base if not already linked
    if (!existingIds.includes(args.knowledgeBaseId)) {
      existingIds.push(args.knowledgeBaseId);
    }

    await ctx.db.patch(args.avatarId, {
      knowledgeConfig: {
        ...existingConfig,
        knowledgeBaseIds: existingIds,
        domain: existingConfig.domain || {
          primaryTopic: "English Grammar",
          subtopics: ["Modal Verbs", "Tenses"],
          expertise: ["Grammar Teaching"],
          limitations: [],
        },
        ragSettings: existingConfig.ragSettings || {
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
