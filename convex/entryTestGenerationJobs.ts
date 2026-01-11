import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

const jobTypeValidator = v.union(
  v.literal("question_batch"),
  v.literal("section"),
  v.literal("full_template")
);

const jobStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed")
);

// ============================================
// QUERIES
// ============================================

// Get a single job by ID
export const getJob = query({
  args: { jobId: v.id("entryTestGenerationJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

// List recent jobs
export const listJobs = query({
  args: {
    status: v.optional(jobStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    let jobs;

    if (args.status) {
      jobs = await ctx.db
        .query("entryTestGenerationJobs")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      jobs = await ctx.db
        .query("entryTestGenerationJobs")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }

    // Apply limit
    const limit = args.limit ?? 50;
    return jobs.slice(0, limit);
  },
});

// Get active jobs (pending or processing)
export const getActiveJobs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const pendingJobs = await ctx.db
      .query("entryTestGenerationJobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const processingJobs = await ctx.db
      .query("entryTestGenerationJobs")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .collect();

    return [...pendingJobs, ...processingJobs].sort(
      (a, b) => b.createdAt - a.createdAt
    );
  },
});

// Get job count by status
export const getJobCounts = query({
  args: {},
  handler: async (ctx) => {
    const allJobs = await ctx.db.query("entryTestGenerationJobs").collect();

    const counts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: allJobs.length,
    };

    for (const job of allJobs) {
      counts[job.status]++;
    }

    return counts;
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create a new generation job
export const createJob = mutation({
  args: {
    type: jobTypeValidator,
    targetTemplateId: v.optional(v.id("entryTestTemplates")),
    parameters: v.object({
      questionType: v.optional(questionTypeValidator),
      cefrLevel: v.optional(cefrLevelValidator),
      count: v.number(),
      topic: v.optional(v.string()),
      customPrompt: v.optional(v.string()),
    }),
    model: v.string(),
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

    const jobId = await ctx.db.insert("entryTestGenerationJobs", {
      type: args.type,
      targetTemplateId: args.targetTemplateId,
      parameters: args.parameters,
      model: args.model,
      status: "pending",
      progress: 0,
      generatedQuestionIds: [],
      createdBy: user._id,
      createdAt: now,
    });

    return jobId;
  },
});

// Update job status
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("entryTestGenerationJobs"),
    status: jobStatusValidator,
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.progress !== undefined) {
      updates.progress = args.progress;
    }

    if (args.error !== undefined) {
      updates.error = args.error;
    }

    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.jobId, updates);

    return { success: true };
  },
});

// Add generated questions to job
export const addGeneratedQuestions = mutation({
  args: {
    jobId: v.id("entryTestGenerationJobs"),
    questionIds: v.array(v.id("entryTestQuestionBank")),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const existingIds = job.generatedQuestionIds;
    const newIds = [...existingIds, ...args.questionIds];

    await ctx.db.patch(args.jobId, {
      generatedQuestionIds: newIds,
    });

    return { success: true, totalQuestions: newIds.length };
  },
});

// Complete job with token usage
export const completeJob = mutation({
  args: {
    jobId: v.id("entryTestGenerationJobs"),
    tokenUsage: v.object({
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalCost: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    await ctx.db.patch(args.jobId, {
      status: "completed",
      progress: 100,
      tokenUsage: args.tokenUsage,
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

// Fail job with error
export const failJob = mutation({
  args: {
    jobId: v.id("entryTestGenerationJobs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a job
export const deleteJob = mutation({
  args: { jobId: v.id("entryTestGenerationJobs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    // Only allow deleting completed or failed jobs
    if (job.status === "pending" || job.status === "processing") {
      throw new Error("Cannot delete an active job");
    }

    await ctx.db.delete(args.jobId);

    return { success: true };
  },
});

// Retry a failed job (creates a new job with same parameters)
export const retryJob = mutation({
  args: { jobId: v.id("entryTestGenerationJobs") },
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

    const oldJob = await ctx.db.get(args.jobId);
    if (!oldJob) {
      throw new Error("Job not found");
    }

    if (oldJob.status !== "failed") {
      throw new Error("Can only retry failed jobs");
    }

    // Create new job with same parameters
    const newJobId = await ctx.db.insert("entryTestGenerationJobs", {
      type: oldJob.type,
      targetTemplateId: oldJob.targetTemplateId,
      parameters: oldJob.parameters,
      model: oldJob.model,
      status: "pending",
      progress: 0,
      generatedQuestionIds: [],
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return newJobId;
  },
});
