import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Scraping Jobs Management
 *
 * Manages web scraping jobs that generate knowledge bases from
 * online content using Tavily search and AI synthesis.
 */

// ============================================
// QUERIES
// ============================================

// Get all scraping jobs
export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("scrapingJobs").order("desc");

    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }

    const jobs = await q.collect();
    return args.limit ? jobs.slice(0, args.limit) : jobs;
  },
});

// Get a scraping job by ID
export const getById = query({
  args: { id: v.id("scrapingJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get scraping job by knowledge base ID
export const getByKnowledgeBase = query({
  args: { knowledgeBaseId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scrapingJobs")
      .withIndex("by_knowledge_base", (q) =>
        q.eq("knowledgeBaseId", args.knowledgeBaseId)
      )
      .first();
  },
});

// Get active/running jobs
export const getActiveJobs = query({
  args: {},
  handler: async (ctx) => {
    const activeStatuses = ["pending", "discovering", "scraping", "synthesizing", "optimizing"];
    const allJobs = await ctx.db.query("scrapingJobs").order("desc").collect();
    return allJobs.filter((job) => activeStatuses.includes(job.status));
  },
});

// Get job progress summary (for SSE updates)
export const getProgress = query({
  args: { id: v.id("scrapingJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return null;

    const totalSubtopics = job.subtopics.length;
    const completedSubtopics = job.subtopics.filter(
      (s) => s.status === "completed"
    ).length;
    const failedSubtopics = job.subtopics.filter(
      (s) => s.status === "failed"
    ).length;

    return {
      id: job._id,
      topic: job.topic,
      status: job.status,
      progress: job.progress,
      subtopics: job.subtopics,
      totalSubtopics,
      completedSubtopics,
      failedSubtopics,
      percentage: totalSubtopics > 0
        ? Math.round((completedSubtopics / totalSubtopics) * 100)
        : 0,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create a new scraping job
export const create = mutation({
  args: {
    topic: v.string(),
    mode: v.union(v.literal("simple"), v.literal("advanced")),
    knowledgeBaseId: v.id("knowledgeBases"),
    subtopics: v.optional(v.array(v.string())), // For advanced mode
    config: v.object({
      scale: v.optional(v.union(
        v.literal("quick"),
        v.literal("standard"),
        v.literal("comprehensive"),
        v.literal("book")
      )),
      depth: v.number(),
      maxSourcesPerSubtopic: v.number(),
      includeExercises: v.boolean(),
      targetLevel: v.optional(v.string()),
      language: v.string(),
      tags: v.optional(v.array(v.string())),
      referenceUrls: v.optional(v.array(v.string())),
      broadSearch: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If advanced mode with subtopics, initialize them
    const initialSubtopics = args.subtopics
      ? args.subtopics.map((name) => ({
          name,
          status: "pending" as const,
          sourceCount: 0,
          wordCount: 0,
        }))
      : [];

    const jobId = await ctx.db.insert("scrapingJobs", {
      topic: args.topic,
      mode: args.mode,
      knowledgeBaseId: args.knowledgeBaseId,
      status: args.mode === "simple" ? "discovering" : "scraping",
      subtopics: initialSubtopics,
      progress: {
        discoveredCount: initialSubtopics.length,
        scrapedCount: 0,
        synthesizedCount: 0,
        totalSources: 0,
        totalWords: 0,
      },
      config: args.config,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Update the knowledge base with the job reference
    await ctx.db.patch(args.knowledgeBaseId, {
      scrapingJobId: jobId,
      generationType: "scraped",
      updatedAt: now,
    });

    return { success: true, jobId };
  },
});

// Update job status
export const updateStatus = mutation({
  args: {
    id: v.id("scrapingJobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("discovering"),
      v.literal("scraping"),
      v.literal("synthesizing"),
      v.literal("optimizing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.errorMessage) {
      updates.errorMessage = args.errorMessage;
    }

    if (args.status === "completed" || args.status === "failed" || args.status === "cancelled") {
      updates.completedAt = now;
    }

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

// Set discovered subtopics (for simple mode after discovery phase)
export const setSubtopics = mutation({
  args: {
    id: v.id("scrapingJobs"),
    subtopics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    const subtopicObjects = args.subtopics.map((name) => ({
      name,
      status: "pending" as const,
      sourceCount: 0,
      wordCount: 0,
    }));

    await ctx.db.patch(args.id, {
      subtopics: subtopicObjects,
      status: "scraping",
      progress: {
        ...job.progress,
        discoveredCount: args.subtopics.length,
      },
      updatedAt: Date.now(),
    });

    return { success: true, count: args.subtopics.length };
  },
});

// Update a specific subtopic's status
export const updateSubtopic = mutation({
  args: {
    id: v.id("scrapingJobs"),
    subtopicName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("scraping"),
      v.literal("synthesizing"),
      v.literal("optimizing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    sourceCount: v.optional(v.number()),
    wordCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    const updatedSubtopics = job.subtopics.map((st) => {
      if (st.name === args.subtopicName) {
        return {
          ...st,
          status: args.status,
          sourceCount: args.sourceCount ?? st.sourceCount,
          wordCount: args.wordCount ?? st.wordCount,
          errorMessage: args.errorMessage,
        };
      }
      return st;
    });

    // Update overall progress
    const scrapedCount = updatedSubtopics.filter(
      (s) => s.status === "completed" || s.status === "synthesizing" || s.status === "optimizing"
    ).length;
    const synthesizedCount = updatedSubtopics.filter(
      (s) => s.status === "completed" || s.status === "optimizing"
    ).length;
    const optimizedCount = updatedSubtopics.filter(
      (s) => s.status === "completed"
    ).length;

    const totalSources = updatedSubtopics.reduce(
      (acc, s) => acc + (s.sourceCount || 0),
      0
    );
    const totalWords = updatedSubtopics.reduce(
      (acc, s) => acc + (s.wordCount || 0),
      0
    );

    await ctx.db.patch(args.id, {
      subtopics: updatedSubtopics,
      progress: {
        ...job.progress,
        scrapedCount,
        synthesizedCount,
        optimizedCount,
        totalSources,
        totalWords,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update overall progress
export const updateProgress = mutation({
  args: {
    id: v.id("scrapingJobs"),
    progress: v.object({
      discoveredCount: v.optional(v.number()),
      scrapedCount: v.optional(v.number()),
      synthesizedCount: v.optional(v.number()),
      optimizedCount: v.optional(v.number()),
      totalSources: v.optional(v.number()),
      totalWords: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    await ctx.db.patch(args.id, {
      progress: {
        ...job.progress,
        ...args.progress,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Cancel a running job
export const cancel = mutation({
  args: { id: v.id("scrapingJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    const activeStatuses = ["pending", "discovering", "scraping", "synthesizing", "optimizing"];
    if (!activeStatuses.includes(job.status)) {
      throw new Error("Job is not running");
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a job and optionally its associated knowledge base content
export const remove = mutation({
  args: {
    id: v.id("scrapingJobs"),
    deleteKnowledgeBase: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    // If requested, delete the associated knowledge base
    if (args.deleteKnowledgeBase) {
      const kb = await ctx.db.get(job.knowledgeBaseId);
      if (kb) {
        // Delete all content for this KB
        const contents = await ctx.db
          .query("knowledgeContent")
          .withIndex("by_knowledge_base", (q) =>
            q.eq("knowledgeBaseId", job.knowledgeBaseId)
          )
          .collect();

        for (const content of contents) {
          await ctx.db.delete(content._id);
        }

        await ctx.db.delete(job.knowledgeBaseId);
      }
    } else {
      // Just remove the job reference from the KB
      await ctx.db.patch(job.knowledgeBaseId, {
        scrapingJobId: undefined,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================
// INTERNAL MUTATIONS (for background processing)
// ============================================

// Internal: Mark job as started
export const internalStart = internalMutation({
  args: { id: v.id("scrapingJobs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Internal: Complete job
export const internalComplete = internalMutation({
  args: {
    id: v.id("scrapingJobs"),
    status: v.union(v.literal("completed"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: args.status,
      completedAt: now,
      updatedAt: now,
      errorMessage: args.errorMessage,
    });

    // Update knowledge base status
    const job = await ctx.db.get(args.id);
    if (job) {
      await ctx.db.patch(job.knowledgeBaseId, {
        status: args.status === "completed" ? "active" : "error",
        errorMessage: args.errorMessage,
        updatedAt: now,
      });
    }
  },
});
