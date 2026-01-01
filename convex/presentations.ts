import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const createPresentation = mutation({
  args: {
    name: v.string(),
    originalFileName: v.string(),
    originalFileType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    return await ctx.db.insert("presentations", {
      name: args.name,
      originalFileName: args.originalFileName,
      originalFileType: args.originalFileType,
      uploadedBy: user._id,
      slides: [],
      totalSlides: 0,
      status: "uploading",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation for server-side PPTX generation (no auth required)
export const createPresentationInternal = mutation({
  args: {
    name: v.string(),
    originalFileName: v.string(),
    originalFileType: v.string(),
    uploadedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // If no uploadedBy provided, try to get a default admin user
    let uploadedBy = args.uploadedBy;
    if (!uploadedBy) {
      const adminUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .first();
      if (adminUser) {
        uploadedBy = adminUser._id;
      }
    }

    if (!uploadedBy) {
      throw new Error("No user available to create presentation");
    }

    const now = Date.now();
    return await ctx.db.insert("presentations", {
      name: args.name,
      originalFileName: args.originalFileName,
      originalFileType: args.originalFileType,
      uploadedBy: uploadedBy,
      slides: [],
      totalSlides: 0,
      status: "uploading",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePresentationStatus = mutation({
  args: {
    presentationId: v.id("presentations"),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.presentationId, {
      status: args.status,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

export const addSlideToPresentation = mutation({
  args: {
    presentationId: v.id("presentations"),
    slideIndex: v.number(),
    storageId: v.id("_storage"),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    const url = await ctx.storage.getUrl(args.storageId);

    const newSlide = {
      index: args.slideIndex,
      storageId: args.storageId,
      url: url ?? undefined,
      width: args.width,
      height: args.height,
    };

    const slides = [...presentation.slides, newSlide].sort((a, b) => a.index - b.index);

    await ctx.db.patch(args.presentationId, {
      slides,
      totalSlides: slides.length,
      updatedAt: Date.now(),
    });
  },
});

// Internal version without auth for server-side use
export const addSlideToPresentationInternal = mutation({
  args: {
    presentationId: v.id("presentations"),
    slideIndex: v.number(),
    storageId: v.id("_storage"),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    const url = await ctx.storage.getUrl(args.storageId);

    const newSlide = {
      index: args.slideIndex,
      storageId: args.storageId,
      url: url ?? undefined,
      width: args.width,
      height: args.height,
    };

    const slides = [...presentation.slides, newSlide].sort((a, b) => a.index - b.index);

    await ctx.db.patch(args.presentationId, {
      slides,
      totalSlides: slides.length,
      updatedAt: Date.now(),
    });
  },
});

export const finalizePresentation = mutation({
  args: {
    presentationId: v.id("presentations"),
    totalSlides: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    const allSlidesReady = presentation.slides.length === args.totalSlides;

    await ctx.db.patch(args.presentationId, {
      status: allSlidesReady ? "ready" : "failed",
      totalSlides: args.totalSlides,
      errorMessage: allSlidesReady ? undefined : "Not all slides were processed",
      updatedAt: Date.now(),
    });

    return { success: allSlidesReady };
  },
});

// Internal version without auth for server-side use
export const finalizePresentationInternal = mutation({
  args: {
    presentationId: v.id("presentations"),
    totalSlides: v.number(),
  },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    const allSlidesReady = presentation.slides.length === args.totalSlides;

    await ctx.db.patch(args.presentationId, {
      status: allSlidesReady ? "ready" : "failed",
      totalSlides: args.totalSlides,
      errorMessage: allSlidesReady ? undefined : "Not all slides were processed",
      updatedAt: Date.now(),
    });

    return { success: allSlidesReady };
  },
});

export const getPresentation = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.presentationId);
  },
});

export const getUserPresentations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("presentations")
      .withIndex("by_user", (q) => q.eq("uploadedBy", user._id))
      .order("desc")
      .collect();
  },
});

export const deletePresentation = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    for (const slide of presentation.slides) {
      await ctx.storage.delete(slide.storageId);
    }

    await ctx.db.delete(args.presentationId);
  },
});

export const getSlideUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Update slide content after PPTX text extraction
export const updateSlideContent = mutation({
  args: {
    presentationId: v.id("presentations"),
    slideContent: v.array(
      v.object({
        index: v.number(),
        title: v.optional(v.string()),
        bodyText: v.optional(v.string()),
        speakerNotes: v.optional(v.string()),
        bulletPoints: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    await ctx.db.patch(args.presentationId, {
      slideContent: args.slideContent,
      textExtractionStatus: "completed",
      updatedAt: Date.now(),
    });
  },
});

// Update text extraction status
export const updateTextExtractionStatus = mutation({
  args: {
    presentationId: v.id("presentations"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    await ctx.db.patch(args.presentationId, {
      textExtractionStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Get presentation with full content for avatar context
export const getPresentationWithContent = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      return null;
    }

    // Get fresh URLs for all slides
    const slidesWithUrls = await Promise.all(
      presentation.slides.map(async (slide) => ({
        ...slide,
        url: await ctx.storage.getUrl(slide.storageId),
      }))
    );

    return {
      ...presentation,
      slides: slidesWithUrls,
    };
  },
});

// Link presentation to knowledge base for RAG
export const linkToKnowledgeBase = mutation({
  args: {
    presentationId: v.id("presentations"),
    knowledgeBaseId: v.id("knowledgeBases"),
  },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    await ctx.db.patch(args.presentationId, {
      knowledgeBaseId: args.knowledgeBaseId,
      updatedAt: Date.now(),
    });
  },
});

// Get all ready presentations for a knowledge base (for avatar to load)
export const getPresentationsByKnowledgeBase = query({
  args: { knowledgeBaseId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    // Query presentations linked to this knowledge base that are ready
    const presentations = await ctx.db
      .query("presentations")
      .withIndex("by_knowledge_base", (q) =>
        q.eq("knowledgeBaseId", args.knowledgeBaseId)
      )
      .filter((q) => q.eq(q.field("status"), "ready"))
      .collect();

    return presentations.map((p) => ({
      id: p._id,
      name: p.name,
      totalSlides: p.totalSlides,
      createdAt: p.createdAt,
    }));
  },
});

// Get all ready presentations (for avatars without specific knowledge base)
export const getAllReadyPresentations = query({
  args: {},
  handler: async (ctx) => {
    const presentations = await ctx.db
      .query("presentations")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .collect();

    return presentations.map((p) => ({
      id: p._id,
      name: p.name,
      totalSlides: p.totalSlides,
      createdAt: p.createdAt,
    }));
  },
});
