import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// CITY SERVICE PAGES
// ============================================

// Get a city service page by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("cityServicePages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return page;
  },
});

// Get published page by slug (for frontend)
export const getPublishedBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("cityServicePages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!page || page.status !== "published") {
      return null;
    }

    // Filter to only published sections
    const publishedSections = page.sections
      .filter((s) => s.isPublished)
      .sort((a, b) => a.order - b.order);

    return {
      ...page,
      sections: publishedSections,
    };
  },
});

// List all city pages
export const list = query({
  args: {
    city: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    let pages;

    if (args.city) {
      pages = await ctx.db
        .query("cityServicePages")
        .withIndex("by_city", (q) => q.eq("city", args.city!))
        .collect();
    } else if (args.status) {
      pages = await ctx.db
        .query("cityServicePages")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      pages = await ctx.db.query("cityServicePages").collect();
    }

    return pages.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// Create a new city service page
export const create = mutation({
  args: {
    city: v.string(),
    service: v.string(),
    title: v.string(),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    sections: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("hero"),
        v.literal("content"),
        v.literal("services"),
        v.literal("features"),
        v.literal("faq"),
        v.literal("cta"),
        v.literal("contact")
      ),
      order: v.number(),
      isPublished: v.boolean(),
      content: v.any(),
    })),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const slug = `${args.city}/${args.service}`;

    // Check if page already exists
    const existing = await ctx.db
      .query("cityServicePages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error(`Page already exists: ${slug}`);
    }

    const id = await ctx.db.insert("cityServicePages", {
      city: args.city,
      service: args.service,
      slug,
      title: args.title,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      sections: args.sections,
      status: args.status || "draft",
      publishedAt: args.status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { id, slug };
  },
});

// Update a city service page
export const update = mutation({
  args: {
    id: v.id("cityServicePages"),
    title: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Page not found");
    }

    const patchData: any = {
      ...updates,
      updatedAt: now,
    };

    // Set publishedAt if publishing for the first time
    if (updates.status === "published" && existing.status !== "published") {
      patchData.publishedAt = now;
    }

    await ctx.db.patch(id, patchData);
    return { success: true };
  },
});

// Update a specific section within a page
export const updateSection = mutation({
  args: {
    pageId: v.id("cityServicePages"),
    sectionId: v.string(),
    content: v.optional(v.any()),
    isPublished: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const sections = page.sections.map((section) => {
      if (section.id === args.sectionId) {
        return {
          ...section,
          ...(args.content !== undefined && { content: args.content }),
          ...(args.isPublished !== undefined && { isPublished: args.isPublished }),
          ...(args.order !== undefined && { order: args.order }),
        };
      }
      return section;
    });

    await ctx.db.patch(args.pageId, {
      sections,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Add a new section to a page
export const addSection = mutation({
  args: {
    pageId: v.id("cityServicePages"),
    section: v.object({
      id: v.string(),
      type: v.union(
        v.literal("hero"),
        v.literal("content"),
        v.literal("services"),
        v.literal("features"),
        v.literal("faq"),
        v.literal("cta"),
        v.literal("contact")
      ),
      order: v.number(),
      isPublished: v.boolean(),
      content: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const sections = [...page.sections, args.section];

    await ctx.db.patch(args.pageId, {
      sections,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a section from a page
export const deleteSection = mutation({
  args: {
    pageId: v.id("cityServicePages"),
    sectionId: v.string(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const sections = page.sections.filter((s) => s.id !== args.sectionId);

    await ctx.db.patch(args.pageId, {
      sections,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Reorder sections
export const reorderSections = mutation({
  args: {
    pageId: v.id("cityServicePages"),
    sectionOrders: v.array(v.object({
      id: v.string(),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const orderMap = new Map(args.sectionOrders.map((s) => [s.id, s.order]));
    const sections = page.sections.map((section) => ({
      ...section,
      order: orderMap.get(section.id) ?? section.order,
    }));

    await ctx.db.patch(args.pageId, {
      sections,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a city service page
export const deletePage = mutation({
  args: { id: v.id("cityServicePages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Get all unique cities
export const getCities = query({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db.query("cityServicePages").collect();
    const cities = new Set(pages.map((p) => p.city));
    return Array.from(cities).sort();
  },
});

// Publish a page
export const publish = mutation({
  args: { id: v.id("cityServicePages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    if (!page) {
      throw new Error("Page not found");
    }

    await ctx.db.patch(args.id, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Unpublish a page
export const unpublish = mutation({
  args: { id: v.id("cityServicePages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    if (!page) {
      throw new Error("Page not found");
    }

    await ctx.db.patch(args.id, {
      status: "draft",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
