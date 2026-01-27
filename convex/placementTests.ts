import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

/**
 * Get all placement tests
 */
export const list = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    let tests;
    if (args.status) {
      tests = await ctx.db
        .query("placementTests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      tests = await ctx.db
        .query("placementTests")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }
    return tests;
  },
});

/**
 * Get a single placement test by ID
 */
export const getById = query({
  args: { id: v.id("placementTests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a placement test by slug (for public test pages)
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const test = await ctx.db
      .query("placementTests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return test;
  },
});

/**
 * Get a published placement test by slug (for public access)
 */
export const getPublishedBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const test = await ctx.db
      .query("placementTests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (test && test.status === "published") {
      return test;
    }
    return null;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new placement test
 */
export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    companyName: v.optional(v.string()),
    companyLogo: v.optional(v.string()),
    config: v.any(),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    resultEmails: v.optional(v.object({
      sendToCandidate: v.boolean(),
      hrEmails: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("placementTests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(`A test with slug "${args.slug}" already exists`);
    }

    const now = Date.now();
    return await ctx.db.insert("placementTests", {
      title: args.title,
      slug: args.slug,
      companyName: args.companyName,
      companyLogo: args.companyLogo,
      config: args.config,
      status: args.status || "draft",
      resultEmails: args.resultEmails,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a placement test
 */
export const update = mutation({
  args: {
    id: v.id("placementTests"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companyLogo: v.optional(v.string()),
    config: v.optional(v.any()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    resultEmails: v.optional(v.object({
      sendToCandidate: v.boolean(),
      hrEmails: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Test not found");
    }

    // If changing slug, check it doesn't conflict
    if (args.slug && args.slug !== existing.slug) {
      const slugConflict = await ctx.db
        .query("placementTests")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .first();

      if (slugConflict) {
        throw new Error(`A test with slug "${args.slug}" already exists`);
      }
    }

    const updates: Partial<typeof existing> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.companyName !== undefined) updates.companyName = args.companyName;
    if (args.companyLogo !== undefined) updates.companyLogo = args.companyLogo;
    if (args.config !== undefined) updates.config = args.config;
    if (args.status !== undefined) updates.status = args.status;
    if (args.resultEmails !== undefined) updates.resultEmails = args.resultEmails;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Delete a placement test
 */
export const remove = mutation({
  args: { id: v.id("placementTests") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Publish a placement test
 */
export const publish = mutation({
  args: { id: v.id("placementTests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "published",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Unpublish (set to draft) a placement test
 */
export const unpublish = mutation({
  args: { id: v.id("placementTests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "draft",
      updatedAt: Date.now(),
    });
  },
});
