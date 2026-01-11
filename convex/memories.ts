import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ==========================================
// USER MEMORY SYNC - Cached profile data
// ==========================================

/**
 * Get cached memory sync data for a user-avatar pair.
 * This provides fast access to student profile without expensive queries.
 */
export const getUserMemorySync = query({
  args: {
    userId: v.string(),
    avatarSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const sync = await ctx.db
      .query("userMemorySync")
      .withIndex("by_user_avatar", (q) =>
        q.eq("userId", args.userId).eq("avatarSlug", args.avatarSlug)
      )
      .first();

    return sync;
  },
});

/**
 * Update or create user memory sync data.
 * Called after sessions to cache profile summaries.
 */
export const upsertUserMemorySync = mutation({
  args: {
    userId: v.string(),
    avatarSlug: v.string(),
    profileSummary: v.optional(
      v.object({
        level: v.optional(v.string()),
        goals: v.optional(v.array(v.string())),
        preferences: v.optional(v.array(v.string())),
        strongAreas: v.optional(v.array(v.string())),
        weakAreas: v.optional(v.array(v.string())),
        personalFacts: v.optional(v.array(v.string())),
        recentTopics: v.optional(v.array(v.string())),
        lastSessionSummary: v.optional(v.string()),
      })
    ),
    sessionCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userMemorySync")
      .withIndex("by_user_avatar", (q) =>
        q.eq("userId", args.userId).eq("avatarSlug", args.avatarSlug)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        profileSummary: args.profileSummary ?? existing.profileSummary,
        sessionCount: args.sessionCount ?? (existing.sessionCount ?? 0) + 1,
        lastSyncedAt: now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("userMemorySync", {
        userId: args.userId,
        avatarSlug: args.avatarSlug,
        zepUserId: `student:${args.userId}:${args.avatarSlug}`,
        profileSummary: args.profileSummary,
        sessionCount: args.sessionCount ?? 1,
        lastSyncedAt: now,
        createdAt: now,
      });
      return id;
    }
  },
});

/**
 * Memory Management Functions
 *
 * Memories are automatically extracted during conversations,
 * but can also be manually added, viewed, and edited.
 */

// Get all memories for a student
export const getByStudentId = query({
  args: {
    studentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .order("desc")
      .take(args.limit ?? 50);

    return memories;
  },
});

// Get memories by type
export const getByType = query({
  args: {
    studentId: v.string(),
    type: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .filter((q) =>
        q.and(
          q.eq(q.field("studentId"), args.studentId),
          q.eq(q.field("type"), args.type)
        )
      )
      .order("desc")
      .take(args.limit ?? 20);

    return memories;
  },
});

// Get memories by importance
export const getByImportance = query({
  args: {
    studentId: v.string(),
    importance: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .filter((q) =>
        q.and(
          q.eq(q.field("studentId"), args.studentId),
          q.eq(q.field("importance"), args.importance)
        )
      )
      .order("desc")
      .take(args.limit ?? 20);

    return memories;
  },
});

// Get recent session summaries
export const getRecentSessions = query({
  args: {
    studentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("memories")
      .filter((q) =>
        q.and(
          q.eq(q.field("studentId"), args.studentId),
          q.eq(q.field("type"), "session_summary")
        )
      )
      .order("desc")
      .take(args.limit ?? 5);

    return sessions;
  },
});

// Create a new memory
export const create = mutation({
  args: {
    studentId: v.string(),
    type: v.string(),
    content: v.string(),
    topic: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    importance: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    avatarSlug: v.optional(v.string()),
    source: v.optional(v.string()), // "auto_extracted", "manual", "session_summary"
    eventDate: v.optional(v.number()), // For "upcoming" type - when the event occurs
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const memoryId = await ctx.db.insert("memories", {
      studentId: args.studentId,
      type: args.type,
      content: args.content,
      topic: args.topic,
      tags: args.tags ?? [],
      importance: args.importance ?? "medium",
      sessionId: args.sessionId,
      avatarSlug: args.avatarSlug,
      source: args.source ?? "manual",
      eventDate: args.eventDate,
      followedUp: args.type === "upcoming" ? false : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return memoryId;
  },
});

// Update a memory
export const update = mutation({
  args: {
    memoryId: v.id("memories"),
    content: v.optional(v.string()),
    importance: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { memoryId, ...updates } = args;

    await ctx.db.patch(memoryId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a memory
export const remove = mutation({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.memoryId);
    return { success: true };
  },
});

// Search memories by content (basic search)
export const search = query({
  args: {
    studentId: v.string(),
    query: v.string(),
    types: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all memories for student
    let memories = await ctx.db
      .query("memories")
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .order("desc")
      .take(100);

    // Filter by type if specified
    if (args.types && args.types.length > 0) {
      memories = memories.filter(m => args.types!.includes(m.type));
    }

    // Simple keyword search
    const queryLower = args.query.toLowerCase();
    const matched = memories.filter(m =>
      m.content.toLowerCase().includes(queryLower) ||
      (m.topic && m.topic.toLowerCase().includes(queryLower)) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(queryLower)))
    );

    return matched.slice(0, args.limit ?? 10);
  },
});

// Add a manual memory (for admin/testing)
export const addManualMemory = mutation({
  args: {
    studentId: v.string(),
    type: v.union(
      v.literal("personal_fact"),
      v.literal("preference"),
      v.literal("struggle"),
      v.literal("achievement"),
      v.literal("emotional"),
      v.literal("upcoming"),
      v.literal("interest"),
      v.literal("goal"),
      v.literal("session_summary"),
      v.literal("learning_observation")
    ),
    content: v.string(),
    importance: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const memoryId = await ctx.db.insert("memories", {
      studentId: args.studentId,
      type: args.type,
      content: args.content,
      importance: args.importance,
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, memoryId };
  },
});

// ==========================================
// UPCOMING EVENTS - For personalized greetings
// ==========================================

/**
 * Get upcoming events that have passed but haven't been followed up on.
 * Used to generate personalized greetings like "How was your holiday?"
 */
export const getUpcomingEventsPastDue = query({
  args: {
    studentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all upcoming type memories for this student
    const upcomingMemories = await ctx.db
      .query("memories")
      .withIndex("by_student_type", (q) =>
        q.eq("studentId", args.studentId).eq("type", "upcoming")
      )
      .filter((q) =>
        q.and(
          // Has an event date
          q.neq(q.field("eventDate"), undefined),
          // Event date is in the past
          q.lt(q.field("eventDate"), now),
          // Hasn't been followed up on yet
          q.or(
            q.eq(q.field("followedUp"), false),
            q.eq(q.field("followedUp"), undefined)
          )
        )
      )
      .order("desc")
      .take(args.limit ?? 3);

    return upcomingMemories;
  },
});

/**
 * Mark an upcoming event memory as followed up.
 * Called after the avatar asks about the event.
 */
export const markFollowedUp = mutation({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, {
      followedUp: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});
