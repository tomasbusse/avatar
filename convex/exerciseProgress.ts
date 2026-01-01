import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Exercise Progress Tracking
 *
 * Tracks student progress through exercises from lesson content.
 * Records attempts, scores, and completion status.
 */

// Start an exercise
export const startExercise = mutation({
  args: {
    sessionId: v.id("sessions"),
    studentId: v.id("students"),
    contentId: v.id("knowledgeContent"),
    exerciseId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if progress already exists for this session+exercise
    const existing = await ctx.db
      .query("exerciseProgress")
      .withIndex("by_content_exercise", (q) =>
        q.eq("contentId", args.contentId).eq("exerciseId", args.exerciseId)
      )
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new exercise progress
    return await ctx.db.insert("exerciseProgress", {
      sessionId: args.sessionId,
      studentId: args.studentId,
      contentId: args.contentId,
      exerciseId: args.exerciseId,
      itemId: "item-1", // Start with first item
      status: "in_progress",
      attempts: [],
      startedAt: Date.now(),
    });
  },
});

// Record an attempt on an exercise item
export const recordAttempt = mutation({
  args: {
    progressId: v.id("exerciseProgress"),
    itemId: v.string(),
    answer: v.string(),
    correct: v.boolean(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db.get(args.progressId);
    if (!progress) throw new Error("Progress not found");

    const attempts = [
      ...progress.attempts,
      {
        answer: args.answer,
        correct: args.correct,
        timestamp: Date.now(),
      },
    ];

    await ctx.db.patch(args.progressId, {
      itemId: args.itemId,
      attempts,
    });

    return { success: true };
  },
});

// Complete an exercise with final score
export const completeExercise = mutation({
  args: {
    progressId: v.id("exerciseProgress"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.progressId, {
      status: "completed",
      score: args.score,
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

// Skip an exercise
export const skipExercise = mutation({
  args: {
    progressId: v.id("exerciseProgress"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.progressId, {
      status: "skipped",
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get all progress for a session
export const getSessionProgress = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exerciseProgress")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Get student's exercise history
export const getStudentProgress = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exerciseProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(50); // Last 50 exercises
  },
});

// Get progress for a specific exercise
export const getExerciseProgress = query({
  args: {
    sessionId: v.id("sessions"),
    contentId: v.id("knowledgeContent"),
    exerciseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exerciseProgress")
      .withIndex("by_content_exercise", (q) =>
        q.eq("contentId", args.contentId).eq("exerciseId", args.exerciseId)
      )
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
  },
});

// Get exercise stats for a student
export const getStudentExerciseStats = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const allProgress = await ctx.db
      .query("exerciseProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const completed = allProgress.filter((p) => p.status === "completed");
    const totalScore = completed.reduce((sum, p) => sum + (p.score || 0), 0);
    const averageScore = completed.length > 0 ? totalScore / completed.length : 0;

    const totalAttempts = allProgress.reduce(
      (sum, p) => sum + p.attempts.length,
      0
    );
    const correctAttempts = allProgress.reduce(
      (sum, p) => sum + p.attempts.filter((a) => a.correct).length,
      0
    );

    return {
      totalExercises: allProgress.length,
      completedExercises: completed.length,
      skippedExercises: allProgress.filter((p) => p.status === "skipped").length,
      averageScore: Math.round(averageScore),
      totalAttempts,
      correctAttempts,
      accuracy:
        totalAttempts > 0
          ? Math.round((correctAttempts / totalAttempts) * 100)
          : 0,
    };
  },
});
