import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Vocabulary Progress with SM-2 Spaced Repetition
 *
 * Implements the SuperMemo SM-2 algorithm for vocabulary retention.
 * Tracks each word's review schedule and adjusts based on recall quality.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// Get vocabulary items due for review
export const getDueVocabulary = query({
  args: {
    studentId: v.id("students"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dueItems = await ctx.db
      .query("vocabularyProgress")
      .withIndex("by_next_review", (q) =>
        q.eq("studentId", args.studentId).lte("nextReview", now)
      )
      .take(args.limit || 10);
    return dueItems;
  },
});

// Record a vocabulary review with SM-2 algorithm
export const recordVocabReview = mutation({
  args: {
    studentId: v.id("students"),
    contentId: v.id("knowledgeContent"),
    vocabId: v.string(),
    term: v.string(),
    termDe: v.string(),
    quality: v.number(), // 0-5 (SM-2 quality rating)
  },
  handler: async (ctx, args) => {
    // Find existing progress or create new
    const existing = await ctx.db
      .query("vocabularyProgress")
      .withIndex("by_vocab", (q) =>
        q
          .eq("studentId", args.studentId)
          .eq("contentId", args.contentId)
          .eq("vocabId", args.vocabId)
      )
      .first();

    const now = Date.now();

    // Default values for new items
    let repetitions = existing?.repetitions || 0;
    let easeFactor = existing?.easeFactor || 2.5;
    let interval = existing?.interval || 1;
    let correctCount = existing?.correctCount || 0;
    let incorrectCount = existing?.incorrectCount || 0;

    // SM-2 Algorithm
    const isCorrect = args.quality >= 3;

    if (isCorrect) {
      // Correct response - increase interval
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      correctCount += 1;
    } else {
      // Incorrect - reset to beginning
      repetitions = 0;
      interval = 1;
      incorrectCount += 1;
    }

    // Update ease factor based on quality
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = Math.max(
      1.3,
      easeFactor +
        (0.1 - (5 - args.quality) * (0.08 + (5 - args.quality) * 0.02))
    );

    const nextReview = now + interval * DAY_MS;

    if (existing) {
      // Update existing progress
      await ctx.db.patch(existing._id, {
        repetitions,
        easeFactor,
        interval,
        nextReview,
        lastReviewed: now,
        correctCount,
        incorrectCount,
      });
    } else {
      // Create new progress
      await ctx.db.insert("vocabularyProgress", {
        studentId: args.studentId,
        contentId: args.contentId,
        vocabId: args.vocabId,
        term: args.term,
        termDe: args.termDe,
        repetitions,
        easeFactor,
        interval,
        nextReview,
        lastReviewed: now,
        correctCount,
        incorrectCount,
      });
    }

    return {
      success: true,
      nextReviewIn: `${interval} day(s)`,
      isCorrect,
      easeFactor: Math.round(easeFactor * 100) / 100,
    };
  },
});

// Get all vocabulary progress for a student
export const getStudentVocabulary = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vocabularyProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
  },
});

// Get vocabulary stats for a student
export const getStudentVocabStats = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const allVocab = await ctx.db
      .query("vocabularyProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const now = Date.now();
    const dueCount = allVocab.filter((v) => v.nextReview <= now).length;
    const masteredCount = allVocab.filter((v) => v.repetitions >= 5).length;
    const learningCount = allVocab.filter(
      (v) => v.repetitions > 0 && v.repetitions < 5
    ).length;
    const newCount = allVocab.filter((v) => v.repetitions === 0).length;

    const totalCorrect = allVocab.reduce((sum, v) => sum + v.correctCount, 0);
    const totalIncorrect = allVocab.reduce(
      (sum, v) => sum + v.incorrectCount,
      0
    );
    const totalAttempts = totalCorrect + totalIncorrect;

    return {
      totalWords: allVocab.length,
      dueForReview: dueCount,
      mastered: masteredCount,
      learning: learningCount,
      newWords: newCount,
      accuracy:
        totalAttempts > 0
          ? Math.round((totalCorrect / totalAttempts) * 100)
          : 0,
      averageEaseFactor:
        allVocab.length > 0
          ? Math.round(
              (allVocab.reduce((sum, v) => sum + v.easeFactor, 0) /
                allVocab.length) *
                100
            ) / 100
          : 2.5,
    };
  },
});

// Get vocabulary progress for a specific content
export const getContentVocabulary = query({
  args: {
    studentId: v.id("students"),
    contentId: v.id("knowledgeContent"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vocabularyProgress")
      .withIndex("by_vocab", (q) =>
        q.eq("studentId", args.studentId).eq("contentId", args.contentId)
      )
      .collect();
  },
});

// Reset a vocabulary item (for when student wants to relearn)
export const resetVocabularyItem = mutation({
  args: {
    studentId: v.id("students"),
    contentId: v.id("knowledgeContent"),
    vocabId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vocabularyProgress")
      .withIndex("by_vocab", (q) =>
        q
          .eq("studentId", args.studentId)
          .eq("contentId", args.contentId)
          .eq("vocabId", args.vocabId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReview: Date.now(),
      });
    }

    return { success: true };
  },
});

// Bulk add vocabulary from lesson content
export const initializeVocabularyFromContent = mutation({
  args: {
    studentId: v.id("students"),
    contentId: v.id("knowledgeContent"),
    vocabulary: v.array(
      v.object({
        vocabId: v.string(),
        term: v.string(),
        termDe: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let added = 0;
    let skipped = 0;

    for (const vocab of args.vocabulary) {
      // Check if already exists
      const existing = await ctx.db
        .query("vocabularyProgress")
        .withIndex("by_vocab", (q) =>
          q
            .eq("studentId", args.studentId)
            .eq("contentId", args.contentId)
            .eq("vocabId", vocab.vocabId)
        )
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Create new entry
      await ctx.db.insert("vocabularyProgress", {
        studentId: args.studentId,
        contentId: args.contentId,
        vocabId: vocab.vocabId,
        term: vocab.term,
        termDe: vocab.termDe,
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReview: now, // Due immediately for first review
        correctCount: 0,
        incorrectCount: 0,
      });
      added++;
    }

    return { success: true, added, skipped };
  },
});
