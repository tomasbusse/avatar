import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// TYPES
// ============================================

const questionTypeValidator = v.union(
  v.literal("reading_comprehension"),
  v.literal("grammar_mcq"),
  v.literal("grammar_fill_blank"),
  v.literal("vocabulary_mcq"),
  v.literal("vocabulary_matching"),
  v.literal("listening_mcq"),
  v.literal("listening_fill_blank"),
  v.literal("writing_prompt"),
  v.literal("speaking_prompt")
);

const cefrLevelValidator = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
  v.literal("C1"),
  v.literal("C2")
);

const curationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected")
);

// ============================================
// QUERIES
// ============================================

// List questions with filters
export const listQuestions = query({
  args: {
    type: v.optional(questionTypeValidator),
    level: v.optional(cefrLevelValidator),
    curationStatus: v.optional(curationStatusValidator),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { questions: [], total: 0 };
    }

    // Build query based on most selective filter first
    let questions;

    if (args.type && args.level) {
      questions = await ctx.db
        .query("entryTestQuestionBank")
        .withIndex("by_type_level", (q) =>
          q.eq("type", args.type!).eq("cefrLevel", args.level!)
        )
        .collect();
    } else if (args.type) {
      questions = await ctx.db
        .query("entryTestQuestionBank")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    } else if (args.level) {
      questions = await ctx.db
        .query("entryTestQuestionBank")
        .withIndex("by_level", (q) => q.eq("cefrLevel", args.level!))
        .collect();
    } else if (args.curationStatus) {
      questions = await ctx.db
        .query("entryTestQuestionBank")
        .withIndex("by_curation_status", (q) => q.eq("curationStatus", args.curationStatus!))
        .collect();
    } else {
      questions = await ctx.db.query("entryTestQuestionBank").collect();
    }

    // Apply additional filters
    if (args.curationStatus && !(!args.type && !args.level)) {
      questions = questions.filter((q) => q.curationStatus === args.curationStatus);
    }

    if (args.tags && args.tags.length > 0) {
      questions = questions.filter((q) =>
        args.tags!.some((tag) => q.tags.includes(tag))
      );
    }

    // Sort by creation date descending
    questions.sort((a, b) => b.createdAt - a.createdAt);

    const total = questions.length;

    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    questions = questions.slice(offset, offset + limit);

    return { questions, total };
  },
});

// Get a single question by ID
export const getQuestion = query({
  args: { questionId: v.id("entryTestQuestionBank") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});

// Get question statistics
export const getQuestionStats = query({
  args: { questionId: v.id("entryTestQuestionBank") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      return null;
    }

    // Get all test sessions that used this question
    const allSessions = await ctx.db.query("entryTestSessions").collect();

    let timesUsed = 0;
    let timesCorrect = 0;
    let timesIncorrect = 0;
    let totalTimeSpent = 0;

    for (const session of allSessions) {
      const instance = session.questionInstances.find(
        (qi) => qi.questionBankId === args.questionId
      );

      if (instance) {
        timesUsed++;

        const answer = session.answers.find((a) => a.instanceId === instance.instanceId);
        if (answer) {
          totalTimeSpent += answer.timeSpentSeconds;

          // For objective questions, check if correct
          // This is simplified - actual scoring would be more complex
          if (answer.answer !== undefined && answer.answer !== null) {
            // Assuming we have a way to determine correctness
            // This would need to be expanded based on question type
          }
        }
      }
    }

    return {
      timesUsed,
      timesCorrect,
      timesIncorrect,
      correctRate: timesUsed > 0 ? timesCorrect / timesUsed : 0,
      averageTimeSeconds: timesUsed > 0 ? totalTimeSpent / timesUsed : 0,
      usageCount: question.usageCount,
      averageScore: question.averageScore,
      discriminationIndex: question.discriminationIndex,
    };
  },
});

// Get pending questions count
export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db
      .query("entryTestQuestionBank")
      .withIndex("by_curation_status", (q) => q.eq("curationStatus", "pending"))
      .collect();

    return questions.length;
  },
});

// Get questions by type and level for test generation
export const getQuestionsForTest = query({
  args: {
    types: v.array(v.string()),
    levels: v.array(v.string()),
    tags: v.optional(v.array(v.string())),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    // Get approved questions
    const allApproved = await ctx.db
      .query("entryTestQuestionBank")
      .withIndex("by_curation_status", (q) => q.eq("curationStatus", "approved"))
      .collect();

    // Filter by type and level
    let matching = allApproved.filter(
      (q) => args.types.includes(q.type) && args.levels.includes(q.cefrLevel)
    );

    // Filter by tags if specified
    if (args.tags && args.tags.length > 0) {
      matching = matching.filter((q) =>
        args.tags!.some((tag) => q.tags.includes(tag))
      );
    }

    // Shuffle and take requested count
    const shuffled = matching.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, args.count);
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create a question manually
export const createQuestion = mutation({
  args: {
    type: questionTypeValidator,
    cefrLevel: cefrLevelValidator,
    tags: v.array(v.string()),
    content: v.any(),
    audioStorageId: v.optional(v.id("_storage")),
    audioText: v.optional(v.string()),
    deliveryMode: v.optional(
      v.union(v.literal("text"), v.literal("audio"), v.literal("avatar"))
    ),
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

    const now = Date.now();

    const questionId = await ctx.db.insert("entryTestQuestionBank", {
      type: args.type,
      cefrLevel: args.cefrLevel,
      tags: args.tags,
      content: args.content,
      audioStorageId: args.audioStorageId,
      audioText: args.audioText,
      deliveryMode: args.deliveryMode,
      generatedBy: "manual",
      curationStatus: "approved", // Manual questions are auto-approved
      curatedBy: user._id,
      curatedAt: now,
      usageCount: 0,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return questionId;
  },
});

// Create an AI-generated question (pending approval)
export const createAIQuestion = mutation({
  args: {
    type: questionTypeValidator,
    cefrLevel: cefrLevelValidator,
    tags: v.array(v.string()),
    content: v.any(),
    generationModel: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
    audioText: v.optional(v.string()),
    deliveryMode: v.optional(
      v.union(v.literal("text"), v.literal("audio"), v.literal("avatar"))
    ),
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

    const now = Date.now();

    const questionId = await ctx.db.insert("entryTestQuestionBank", {
      type: args.type,
      cefrLevel: args.cefrLevel,
      tags: args.tags,
      content: args.content,
      audioStorageId: args.audioStorageId,
      audioText: args.audioText,
      deliveryMode: args.deliveryMode,
      generatedBy: "ai",
      generationModel: args.generationModel,
      curationStatus: "pending",
      usageCount: 0,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return questionId;
  },
});

// Update question content
export const updateQuestion = mutation({
  args: {
    questionId: v.id("entryTestQuestionBank"),
    content: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
    cefrLevel: v.optional(cefrLevelValidator),
    audioStorageId: v.optional(v.id("_storage")),
    audioText: v.optional(v.string()),
    deliveryMode: v.optional(
      v.union(v.literal("text"), v.literal("audio"), v.literal("avatar"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.content !== undefined) {
      updates.content = args.content;
    }
    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }
    if (args.cefrLevel !== undefined) {
      updates.cefrLevel = args.cefrLevel;
    }
    if (args.audioStorageId !== undefined) {
      updates.audioStorageId = args.audioStorageId;
    }
    if (args.audioText !== undefined) {
      updates.audioText = args.audioText;
    }
    if (args.deliveryMode !== undefined) {
      updates.deliveryMode = args.deliveryMode;
    }

    await ctx.db.patch(args.questionId, updates);

    return { success: true };
  },
});

// Approve a pending question
export const approveQuestion = mutation({
  args: { questionId: v.id("entryTestQuestionBank") },
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

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    if (question.curationStatus !== "pending") {
      throw new Error("Question is not pending approval");
    }

    await ctx.db.patch(args.questionId, {
      curationStatus: "approved",
      curatedBy: user._id,
      curatedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Reject a pending question
export const rejectQuestion = mutation({
  args: {
    questionId: v.id("entryTestQuestionBank"),
    reason: v.optional(v.string()),
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

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    if (question.curationStatus !== "pending") {
      throw new Error("Question is not pending approval");
    }

    await ctx.db.patch(args.questionId, {
      curationStatus: "rejected",
      curatedBy: user._id,
      curatedAt: Date.now(),
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Bulk approve questions
export const bulkApprove = mutation({
  args: { questionIds: v.array(v.id("entryTestQuestionBank")) },
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

    const now = Date.now();
    let approved = 0;

    for (const questionId of args.questionIds) {
      const question = await ctx.db.get(questionId);
      if (question && question.curationStatus === "pending") {
        await ctx.db.patch(questionId, {
          curationStatus: "approved",
          curatedBy: user._id,
          curatedAt: now,
          updatedAt: now,
        });
        approved++;
      }
    }

    return { approved };
  },
});

// Bulk reject questions
export const bulkReject = mutation({
  args: {
    questionIds: v.array(v.id("entryTestQuestionBank")),
    reason: v.optional(v.string()),
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

    const now = Date.now();
    let rejected = 0;

    for (const questionId of args.questionIds) {
      const question = await ctx.db.get(questionId);
      if (question && question.curationStatus === "pending") {
        await ctx.db.patch(questionId, {
          curationStatus: "rejected",
          curatedBy: user._id,
          curatedAt: now,
          rejectionReason: args.reason,
          updatedAt: now,
        });
        rejected++;
      }
    }

    return { rejected };
  },
});

// Delete a question
export const deleteQuestion = mutation({
  args: { questionId: v.id("entryTestQuestionBank") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    // Check if question has been used in any tests
    if (question.usageCount > 0) {
      throw new Error("Cannot delete a question that has been used in tests");
    }

    await ctx.db.delete(args.questionId);

    return { success: true };
  },
});

// Update usage statistics after a test
export const updateUsageStats = mutation({
  args: {
    questionId: v.id("entryTestQuestionBank"),
    wasCorrect: v.boolean(),
  },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      return;
    }

    const newUsageCount = question.usageCount + 1;

    // Calculate new average score
    const currentTotal = (question.averageScore ?? 0) * question.usageCount;
    const newScore = args.wasCorrect ? 100 : 0;
    const newAverage = (currentTotal + newScore) / newUsageCount;

    await ctx.db.patch(args.questionId, {
      usageCount: newUsageCount,
      averageScore: newAverage,
      updatedAt: Date.now(),
    });
  },
});

// Get all unique tags
export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("entryTestQuestionBank").collect();

    const tagSet = new Set<string>();
    for (const question of questions) {
      for (const tag of question.tags) {
        tagSet.add(tag);
      }
    }

    return Array.from(tagSet).sort();
  },
});

// Get questions for section filter - used by question picker dialog
export const getQuestionsForSectionFilter = query({
  args: {
    types: v.array(v.string()),
    levels: v.array(v.string()),
    tags: v.optional(v.array(v.string())),
    searchText: v.optional(v.string()),
    excludeIds: v.optional(v.array(v.id("entryTestQuestionBank"))),
  },
  handler: async (ctx, args) => {
    // Get approved questions
    const allApproved = await ctx.db
      .query("entryTestQuestionBank")
      .withIndex("by_curation_status", (q) => q.eq("curationStatus", "approved"))
      .collect();

    // Filter by type and level
    let matching = allApproved.filter(
      (q) => args.types.includes(q.type) && args.levels.includes(q.cefrLevel)
    );

    // Filter by tags if specified
    if (args.tags && args.tags.length > 0) {
      matching = matching.filter((q) =>
        args.tags!.some((tag) => q.tags.includes(tag))
      );
    }

    // Exclude already-selected questions
    if (args.excludeIds && args.excludeIds.length > 0) {
      const excludeSet = new Set(args.excludeIds);
      matching = matching.filter((q) => !excludeSet.has(q._id));
    }

    // Text search in content
    if (args.searchText && args.searchText.trim()) {
      const searchLower = args.searchText.toLowerCase().trim();
      matching = matching.filter((q) => {
        const content = q.content as Record<string, unknown>;
        // Search in common content fields
        const searchableFields = [
          content.question,
          content.sentence,
          content.passage,
          content.prompt,
          content.audioText,
        ].filter(Boolean);

        return searchableFields.some((field) =>
          String(field).toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by creation date descending
    matching.sort((a, b) => b.createdAt - a.createdAt);

    return matching;
  },
});

// Get multiple questions by their IDs
export const getQuestionsByIds = query({
  args: {
    questionIds: v.array(v.id("entryTestQuestionBank")),
  },
  handler: async (ctx, args) => {
    const questions = await Promise.all(
      args.questionIds.map((id) => ctx.db.get(id))
    );

    // Return in the same order as requested, filtering out nulls
    return questions.filter(Boolean);
  },
});
