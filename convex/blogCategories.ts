import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

/**
 * List all blog categories sorted by order
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("blogCategories")
      .withIndex("by_order")
      .collect();
    return categories;
  },
});

/**
 * Get a single category by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("blogCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return category;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new blog category
 */
export const create = mutation({
  args: {
    slug: v.string(),
    name: v.object({
      en: v.string(),
      de: v.string(),
    }),
    description: v.object({
      en: v.string(),
      de: v.string(),
    }),
    icon: v.string(),
    color: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("blogCategories", {
      slug: args.slug,
      name: args.name,
      description: args.description,
      icon: args.icon,
      color: args.color,
      order: args.order,
    });
    return { id };
  },
});

/**
 * Update an existing blog category
 */
export const update = mutation({
  args: {
    id: v.id("blogCategories"),
    slug: v.optional(v.string()),
    name: v.optional(
      v.object({
        en: v.string(),
        de: v.string(),
      })
    ),
    description: v.optional(
      v.object({
        en: v.string(),
        de: v.string(),
      })
    ),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(id, cleanUpdates);
    }

    return { success: true };
  },
});

/**
 * Delete a blog category
 */
export const remove = mutation({
  args: { id: v.id("blogCategories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
