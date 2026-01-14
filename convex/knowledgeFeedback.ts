import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Knowledge Feedback Storage
 *
 * Stores and retrieves usage feedback from avatar interactions
 * to improve knowledge base content over time.
 */

// ============================================
// MUTATIONS
// ============================================

/**
 * Record batch of usage events
 */
export const recordUsageEvents = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    events: v.array(
      v.object({
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const event of args.events) {
      await ctx.db.insert("knowledgeFeedback", {
        knowledgeBaseId: args.knowledgeBaseId,
        ...event,
        createdAt: now,
      });
    }

    return { success: true, recordedCount: args.events.length };
  },
});

/**
 * Record a single content effectiveness update
 */
export const updateContentEffectiveness = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    helpful: v.boolean(),
    followUp: v.boolean(),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) throw new Error("Content not found");

    // Get or create effectiveness record
    const existing = await ctx.db
      .query("contentEffectiveness")
      .withIndex("by_content", (q) => q.eq("contentId", args.contentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lookupCount: existing.lookupCount + 1,
        helpfulCount: args.helpful ? existing.helpfulCount + 1 : existing.helpfulCount,
        followUpCount: args.followUp ? existing.followUpCount + 1 : existing.followUpCount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("contentEffectiveness", {
        contentId: args.contentId,
        knowledgeBaseId: content.knowledgeBaseId,
        lookupCount: 1,
        helpfulCount: args.helpful ? 1 : 0,
        followUpCount: args.followUp ? 1 : 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Record a knowledge gap
 */
export const recordGap = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    query: v.string(),
    queryType: v.string(),
    sessionId: v.string(),
    lessonTopic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if this gap already exists
    const normalizedQuery = args.query.toLowerCase().trim();

    const existingGap = await ctx.db
      .query("knowledgeGaps")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
      .filter((q) => q.eq(q.field("normalizedQuery"), normalizedQuery))
      .first();

    if (existingGap) {
      const combinedTopics = args.lessonTopic
        ? [...existingGap.relatedTopics, args.lessonTopic]
        : existingGap.relatedTopics;
      const uniqueTopics = Array.from(new Set(combinedTopics));

      await ctx.db.patch(existingGap._id, {
        occurrenceCount: existingGap.occurrenceCount + 1,
        lastSeen: Date.now(),
        relatedTopics: uniqueTopics,
      });
    } else {
      await ctx.db.insert("knowledgeGaps", {
        knowledgeBaseId: args.knowledgeBaseId,
        query: args.query,
        normalizedQuery,
        queryType: args.queryType,
        occurrenceCount: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        relatedTopics: args.lessonTopic ? [args.lessonTopic] : [],
        resolved: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Mark a gap as resolved (content was added)
 */
export const resolveGap = mutation({
  args: {
    gapId: v.id("knowledgeGaps"),
    contentId: v.optional(v.id("knowledgeContent")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gapId, {
      resolved: true,
      resolvedAt: Date.now(),
      resolvedWithContentId: args.contentId,
    });

    return { success: true };
  },
});

// ============================================
// QUERIES
// ============================================

/**
 * Get usage statistics for a knowledge base
 */
export const getUsageStats = query({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("knowledgeFeedback")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startTime),
          q.lte(q.field("timestamp"), args.endTime)
        )
      )
      .collect();

    const totalLookups = events.length;
    const successfulLookups = events.filter((e) => e.found).length;
    const successRate = totalLookups > 0 ? successfulLookups / totalLookups : 0;

    const lookupTimes = events
      .filter((e) => e.rlmLookupTime !== undefined)
      .map((e) => e.rlmLookupTime!);
    const avgLookupTime =
      lookupTimes.length > 0
        ? lookupTimes.reduce((a, b) => a + b, 0) / lookupTimes.length
        : 0;

    const helpfulEvents = events.filter((e) => e.studentFoundHelpful !== undefined);
    const avgHelpfulness =
      helpfulEvents.length > 0
        ? helpfulEvents.filter((e) => e.studentFoundHelpful).length / helpfulEvents.length
        : 0.5;

    return {
      totalLookups,
      successRate,
      avgLookupTime,
      avgHelpfulness,
      events: events.map((e) => ({
        type: e.type,
        timestamp: e.timestamp,
        sessionId: e.sessionId,
        query: e.query,
        queryType: e.queryType,
        found: e.found,
        contentId: e.contentId?.toString(),
        contentTitle: e.contentTitle,
        rlmLookupTime: e.rlmLookupTime,
        usedInResponse: e.usedInResponse,
        studentFoundHelpful: e.studentFoundHelpful,
        studentAskedFollowUp: e.studentAskedFollowUp,
        lessonTopic: e.lessonTopic,
        studentLevel: e.studentLevel,
      })),
    };
  },
});

/**
 * Get knowledge gaps for a knowledge base
 */
export const getGaps = query({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    includeResolved: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("knowledgeGaps")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId));

    if (!args.includeResolved) {
      query = query.filter((q) => q.eq(q.field("resolved"), false));
    }

    const gaps = await query.collect();

    // Sort by occurrence count descending
    gaps.sort((a, b) => b.occurrenceCount - a.occurrenceCount);

    return args.limit ? gaps.slice(0, args.limit) : gaps;
  },
});

/**
 * Get content effectiveness rankings
 */
export const getContentEffectiveness = query({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const effectiveness = await ctx.db
      .query("contentEffectiveness")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
      .collect();

    // Calculate effectiveness scores
    const scored = effectiveness.map((e) => {
      const helpfulRate = e.lookupCount > 0 ? e.helpfulCount / e.lookupCount : 0;
      const followUpRate = e.lookupCount > 0 ? e.followUpCount / e.lookupCount : 0;
      const score = Math.round((helpfulRate * 0.7 + (1 - followUpRate) * 0.3) * 100);

      return {
        ...e,
        helpfulRate,
        followUpRate,
        effectivenessScore: score,
        needsImprovement: score < 60 || e.lookupCount > 10 && helpfulRate < 0.5,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.effectivenessScore - a.effectivenessScore);

    return args.limit ? scored.slice(0, args.limit) : scored;
  },
});

/**
 * Get feedback summary for dashboard
 */
export const getFeedbackSummary = query({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get recent events
    const recentEvents = await ctx.db
      .query("knowledgeFeedback")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
      .filter((q) => q.gte(q.field("timestamp"), weekAgo))
      .collect();

    // Get unresolved gaps
    const gaps = await ctx.db
      .query("knowledgeGaps")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
      .filter((q) => q.eq(q.field("resolved"), false))
      .collect();

    // Calculate metrics
    const totalLookups = recentEvents.length;
    const successfulLookups = recentEvents.filter((e) => e.found).length;
    const gapEvents = recentEvents.filter((e) => e.type === "gap").length;

    return {
      period: "last_7_days",
      totalLookups,
      successRate: totalLookups > 0 ? successfulLookups / totalLookups : 0,
      gapCount: gapEvents,
      unresolvedGaps: gaps.length,
      topGaps: gaps
        .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
        .slice(0, 5)
        .map((g) => ({
          query: g.query,
          count: g.occurrenceCount,
        })),
    };
  },
});
