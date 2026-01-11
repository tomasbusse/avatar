import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate a random share token (8 characters, alphanumeric)
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

// Get a structured lesson by its share token (public access)
export const getByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const lesson = await ctx.db
      .query("structuredLessons")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!lesson) {
      return null;
    }

    // Get the avatar
    const avatar = await ctx.db.get(lesson.avatarId);

    // Get content source
    let knowledgeContent = null;
    let presentation = null;

    if (lesson.knowledgeContentId) {
      knowledgeContent = await ctx.db.get(lesson.knowledgeContentId);
    }

    if (lesson.presentationId) {
      presentation = await ctx.db.get(lesson.presentationId);
    }

    return {
      ...lesson,
      avatar,
      knowledgeContent,
      presentation,
    };
  },
});

// List lessons created by the current user
export const listMyLessons = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const lessons = await ctx.db
      .query("structuredLessons")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .collect();

    // Enrich with avatar info
    const enrichedLessons = await Promise.all(
      lessons.map(async (lesson) => {
        const avatar = await ctx.db.get(lesson.avatarId);
        return {
          ...lesson,
          avatar,
        };
      })
    );

    return enrichedLessons;
  },
});

// List public lessons (for browsing)
export const listPublicLessons = query({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db
      .query("structuredLessons")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(50);

    // Enrich with avatar info
    const enrichedLessons = await Promise.all(
      lessons.map(async (lesson) => {
        const avatar = await ctx.db.get(lesson.avatarId);
        return {
          ...lesson,
          avatar,
        };
      })
    );

    return enrichedLessons;
  },
});

// Get a single lesson by ID (for editing - requires ownership)
export const getById = query({
  args: { lessonId: v.id("structuredLessons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      return null;
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Check ownership (or admin role)
    if (!user || (lesson.createdBy !== user._id && user.role !== "admin")) {
      return null;
    }

    // Get related data
    const avatar = await ctx.db.get(lesson.avatarId);
    let knowledgeContent = null;
    let presentation = null;

    if (lesson.knowledgeContentId) {
      knowledgeContent = await ctx.db.get(lesson.knowledgeContentId);
    }

    if (lesson.presentationId) {
      presentation = await ctx.db.get(lesson.presentationId);
    }

    return {
      ...lesson,
      avatar,
      knowledgeContent,
      presentation,
    };
  },
});

// Get a lesson for session participants (no ownership check)
// Validates that the session is linked to this lesson
export const getForSession = query({
  args: {
    lessonId: v.id("structuredLessons"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    // Verify the session exists and is linked to this lesson
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.structuredLessonId !== args.lessonId) {
      return null;
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      return null;
    }

    // Get related data
    const avatar = await ctx.db.get(lesson.avatarId);
    let knowledgeContent = null;
    let presentation = null;
    let wordGame = null;

    if (lesson.knowledgeContentId) {
      knowledgeContent = await ctx.db.get(lesson.knowledgeContentId);
    }

    if (lesson.presentationId) {
      presentation = await ctx.db.get(lesson.presentationId);
    }

    if (lesson.wordGameId) {
      wordGame = await ctx.db.get(lesson.wordGameId);
    }

    return {
      ...lesson,
      avatar,
      knowledgeContent,
      presentation,
      wordGame,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create a new structured lesson
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    knowledgeContentId: v.optional(v.id("knowledgeContent")),
    presentationId: v.optional(v.id("presentations")),
    wordGameId: v.optional(v.id("wordGames")),
    avatarId: v.id("avatars"),
    sessionType: v.union(
      v.literal("structured_lesson"),
      v.literal("presentation")
    ),
    isPublic: v.boolean(),
    requiresAuth: v.boolean(),
    welcomeMessage: v.optional(v.string()),
    // Session duration override
    durationMinutes: v.optional(v.number()),
    wrapUpBufferMinutes: v.optional(v.number()),
    enrollmentSettings: v.optional(
      v.object({
        allowSelfEnrollment: v.optional(v.boolean()),
        maxEnrollments: v.optional(v.number()),
        enrollmentDeadline: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate unique share token
    let shareToken = generateShareToken();
    let existing = await ctx.db
      .query("structuredLessons")
      .withIndex("by_share_token", (q) => q.eq("shareToken", shareToken))
      .first();

    // Regenerate if collision (very unlikely)
    while (existing) {
      shareToken = generateShareToken();
      existing = await ctx.db
        .query("structuredLessons")
        .withIndex("by_share_token", (q) => q.eq("shareToken", shareToken))
        .first();
    }

    const now = Date.now();
    const lessonId = await ctx.db.insert("structuredLessons", {
      title: args.title,
      description: args.description,
      knowledgeContentId: args.knowledgeContentId,
      presentationId: args.presentationId,
      wordGameId: args.wordGameId,
      avatarId: args.avatarId,
      sessionType: args.sessionType,
      shareToken,
      isPublic: args.isPublic,
      requiresAuth: args.requiresAuth,
      welcomeMessage: args.welcomeMessage,
      // Session duration override
      durationMinutes: args.durationMinutes,
      wrapUpBufferMinutes: args.wrapUpBufferMinutes,
      enrollmentSettings: args.enrollmentSettings,
      totalSessions: 0,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return { lessonId, shareToken };
  },
});

// Update a structured lesson
export const update = mutation({
  args: {
    lessonId: v.id("structuredLessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    knowledgeContentId: v.optional(v.id("knowledgeContent")),
    presentationId: v.optional(v.id("presentations")),
    wordGameId: v.optional(v.id("wordGames")),
    avatarId: v.optional(v.id("avatars")),
    sessionType: v.optional(
      v.union(v.literal("structured_lesson"), v.literal("presentation"))
    ),
    isPublic: v.optional(v.boolean()),
    requiresAuth: v.optional(v.boolean()),
    welcomeMessage: v.optional(v.string()),
    // Session duration override
    durationMinutes: v.optional(v.number()),
    wrapUpBufferMinutes: v.optional(v.number()),
    // Allow explicitly clearing content sources
    clearKnowledgeContent: v.optional(v.boolean()),
    clearPresentation: v.optional(v.boolean()),
    clearWordGame: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Check ownership
    if (!user || (lesson.createdBy !== user._id && user.role !== "admin")) {
      throw new Error("Not authorized");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.knowledgeContentId !== undefined)
      updates.knowledgeContentId = args.knowledgeContentId;
    if (args.presentationId !== undefined)
      updates.presentationId = args.presentationId;
    if (args.wordGameId !== undefined)
      updates.wordGameId = args.wordGameId;
    if (args.avatarId !== undefined) updates.avatarId = args.avatarId;
    if (args.sessionType !== undefined) updates.sessionType = args.sessionType;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.requiresAuth !== undefined)
      updates.requiresAuth = args.requiresAuth;
    if (args.welcomeMessage !== undefined)
      updates.welcomeMessage = args.welcomeMessage;
    if (args.durationMinutes !== undefined)
      updates.durationMinutes = args.durationMinutes;
    if (args.wrapUpBufferMinutes !== undefined)
      updates.wrapUpBufferMinutes = args.wrapUpBufferMinutes;

    // Handle clearing content sources
    if (args.clearKnowledgeContent) updates.knowledgeContentId = undefined;
    if (args.clearPresentation) updates.presentationId = undefined;
    if (args.clearWordGame) updates.wordGameId = undefined;

    await ctx.db.patch(args.lessonId, updates);

    return { success: true };
  },
});

// Regenerate share token
export const regenerateToken = mutation({
  args: { lessonId: v.id("structuredLessons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Check ownership
    if (!user || (lesson.createdBy !== user._id && user.role !== "admin")) {
      throw new Error("Not authorized");
    }

    // Generate new unique token
    let shareToken = generateShareToken();
    let existing = await ctx.db
      .query("structuredLessons")
      .withIndex("by_share_token", (q) => q.eq("shareToken", shareToken))
      .first();

    while (existing) {
      shareToken = generateShareToken();
      existing = await ctx.db
        .query("structuredLessons")
        .withIndex("by_share_token", (q) => q.eq("shareToken", shareToken))
        .first();
    }

    await ctx.db.patch(args.lessonId, {
      shareToken,
      updatedAt: Date.now(),
    });

    return { shareToken };
  },
});

// Delete a structured lesson
export const remove = mutation({
  args: { lessonId: v.id("structuredLessons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Check ownership
    if (!user || (lesson.createdBy !== user._id && user.role !== "admin")) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.lessonId);

    return { success: true };
  },
});

// Increment session count (called when a session is created from this lesson)
export const incrementSessionCount = mutation({
  args: { lessonId: v.id("structuredLessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    await ctx.db.patch(args.lessonId, {
      totalSessions: lesson.totalSessions + 1,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Internal: Fix lesson presentation link (no auth required - for admin use via CLI)
export const fixLessonPresentation = mutation({
  args: {
    lessonId: v.id("structuredLessons"),
    presentationId: v.id("presentations"),
    knowledgeContentId: v.optional(v.id("knowledgeContent")),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const updates: Record<string, unknown> = {
      presentationId: args.presentationId,
      updatedAt: Date.now(),
    };

    if (args.knowledgeContentId) {
      updates.knowledgeContentId = args.knowledgeContentId;
    }

    await ctx.db.patch(args.lessonId, updates);

    return { success: true };
  },
});
