import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Error Pattern Tracking
 *
 * Tracks student mistakes to help the avatar address recurring issues.
 */

// Get active error patterns for a student
export const getActive = query({
  args: {
    studentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("errorPatterns")
      .withIndex("by_student_resolved", (q) =>
        q.eq("studentId", args.studentId).eq("resolved", false)
      )
      .order("desc")
      .take(args.limit ?? 10);
  },
});

// Get all error patterns for a student
export const getByStudent = query({
  args: {
    studentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("errorPatterns")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

// Record a new error
export const recordError = mutation({
  args: {
    studentId: v.string(),
    errorText: v.string(),
    correction: v.string(),
    errorType: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if similar pattern already exists
    const existingPatterns = await ctx.db
      .query("errorPatterns")
      .withIndex("by_student_type", (q) =>
        q.eq("studentId", args.studentId).eq("errorType", args.errorType)
      )
      .collect();

    // Simple similarity check - could be enhanced with LLM
    const similar = existingPatterns.find(
      (p) =>
        p.errorText.toLowerCase().includes(args.errorText.toLowerCase().slice(0, 20)) ||
        args.errorText.toLowerCase().includes(p.errorText.toLowerCase().slice(0, 20))
    );

    if (similar) {
      // Update existing pattern
      await ctx.db.patch(similar._id, {
        occurrences: similar.occurrences + 1,
        lastOccurredAt: now,
        updatedAt: now,
      });
      return { success: true, patternId: similar._id, isNew: false };
    }

    // Create new pattern
    const pattern = `${args.errorType}: ${args.errorText.slice(0, 50)}...`;
    const patternId = await ctx.db.insert("errorPatterns", {
      studentId: args.studentId,
      pattern,
      errorType: args.errorType,
      errorText: args.errorText,
      correction: args.correction,
      occurrences: 1,
      lastOccurredAt: now,
      resolved: false,
      sessionId: args.sessionId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, patternId, isNew: true };
  },
});

// Mark a pattern as resolved
export const markResolved = mutation({
  args: {
    patternId: v.id("errorPatterns"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.patternId, {
      resolved: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Get error statistics for a student
export const getStats = query({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const patterns = await ctx.db
      .query("errorPatterns")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const byType: Record<string, number> = {};
    let totalErrors = 0;
    let resolvedCount = 0;

    for (const p of patterns) {
      byType[p.errorType] = (byType[p.errorType] || 0) + p.occurrences;
      totalErrors += p.occurrences;
      if (p.resolved) resolvedCount++;
    }

    return {
      totalPatterns: patterns.length,
      totalErrors,
      resolvedPatterns: resolvedCount,
      activePatterns: patterns.length - resolvedCount,
      byType,
    };
  },
});
