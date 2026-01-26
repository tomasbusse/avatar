import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// VIDEO TEMPLATES - Reusable template configurations
// ============================================

// Default SLS brand configuration (NO BLUE)
const DEFAULT_BRAND_CONFIG = {
  primaryColor: "#003F37",      // Dark teal/green
  secondaryColor: "#4F5338",    // Olive green
  accentColor: "#B25627",       // Burnt orange
  lightColor: "#E3C6AB",        // Warm beige
  lightestColor: "#FFE8CD",     // Cream
  fontFamily: "Blinker",
};

/**
 * List all active video templates
 */
export const list = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("news_broadcast"),
        v.literal("grammar_lesson"),
        v.literal("vocabulary_lesson"),
        v.literal("conversation_practice")
      )
    ),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db.query("videoTemplates").collect();

    if (args.type) {
      templates = templates.filter((t) => t.type === args.type);
    }

    if (args.activeOnly !== false) {
      templates = templates.filter((t) => t.isActive);
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get a video template by ID
 */
export const getById = query({
  args: { templateId: v.id("videoTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

/**
 * Get a video template by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videoTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Create a new video template
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("news_broadcast"),
      v.literal("grammar_lesson"),
      v.literal("vocabulary_lesson"),
      v.literal("conversation_practice")
    ),
    defaultStructure: v.optional(
      v.object({
        includeIntro: v.boolean(),
        includeOutro: v.boolean(),
        includeLowerThird: v.boolean(),
        includeProgressBar: v.boolean(),
        includeVocabularyHighlights: v.boolean(),
        includeComprehensionQuestions: v.boolean(),
      })
    ),
    brandConfig: v.optional(
      v.object({
        primaryColor: v.string(),
        secondaryColor: v.string(),
        accentColor: v.string(),
        lightColor: v.string(),
        lightestColor: v.string(),
        fontFamily: v.string(),
      })
    ),
    templateConfig: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check for duplicate slug
    const existing = await ctx.db
      .query("videoTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(`Template with slug "${args.slug}" already exists`);
    }

    const now = Date.now();

    // Default structure based on template type
    const defaultStructure = args.defaultStructure ?? {
      includeIntro: true,
      includeOutro: true,
      includeLowerThird: args.type === "news_broadcast",
      includeProgressBar: args.type !== "news_broadcast",
      includeVocabularyHighlights: args.type !== "conversation_practice",
      includeComprehensionQuestions: true,
    };

    const templateId = await ctx.db.insert("videoTemplates", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      type: args.type,
      defaultStructure,
      brandConfig: args.brandConfig ?? DEFAULT_BRAND_CONFIG,
      templateConfig: args.templateConfig,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { templateId };
  },
});

/**
 * Update a video template
 */
export const update = mutation({
  args: {
    templateId: v.id("videoTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    defaultStructure: v.optional(
      v.object({
        includeIntro: v.boolean(),
        includeOutro: v.boolean(),
        includeLowerThird: v.boolean(),
        includeProgressBar: v.boolean(),
        includeVocabularyHighlights: v.boolean(),
        includeComprehensionQuestions: v.boolean(),
      })
    ),
    brandConfig: v.optional(
      v.object({
        primaryColor: v.string(),
        secondaryColor: v.string(),
        accentColor: v.string(),
        lightColor: v.string(),
        lightestColor: v.string(),
        fontFamily: v.string(),
      })
    ),
    templateConfig: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.defaultStructure !== undefined)
      updates.defaultStructure = args.defaultStructure;
    if (args.brandConfig !== undefined) updates.brandConfig = args.brandConfig;
    if (args.templateConfig !== undefined)
      updates.templateConfig = args.templateConfig;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.templateId, updates);
    return { success: true };
  },
});

/**
 * Delete a video template
 */
export const remove = mutation({
  args: { templateId: v.id("videoTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.templateId);
    return { success: true };
  },
});

/**
 * Seed default templates (admin only)
 */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Check if templates already exist
    const existing = await ctx.db.query("videoTemplates").collect();
    if (existing.length > 0) {
      return { message: "Templates already seeded", count: existing.length };
    }

    const defaultTemplates = [
      {
        name: "News Broadcast Lesson",
        slug: "news_broadcast",
        description:
          "Transform news content into engaging ESL lessons with news-style graphics, vocabulary highlights, and comprehension questions.",
        type: "news_broadcast" as const,
        defaultStructure: {
          includeIntro: true,
          includeOutro: true,
          includeLowerThird: true,
          includeProgressBar: false,
          includeVocabularyHighlights: true,
          includeComprehensionQuestions: true,
        },
        templateConfig: {
          includeNewsTicker: true,
          includeDiscussionPrompts: true,
        },
      },
      {
        name: "Grammar Lesson (PPP Method)",
        slug: "grammar_lesson",
        description:
          "Structured grammar lessons following the Presentation-Practice-Production (PPP) methodology with clear rules and exercises.",
        type: "grammar_lesson" as const,
        defaultStructure: {
          includeIntro: true,
          includeOutro: true,
          includeLowerThird: true,
          includeProgressBar: true,
          includeVocabularyHighlights: true,
          includeComprehensionQuestions: true,
        },
        templateConfig: {
          presentationPercent: 33,
          practicePercent: 33,
          productionPercent: 34,
        },
      },
      {
        name: "Vocabulary Lesson",
        slug: "vocabulary_lesson",
        description:
          "Focused vocabulary lessons with definitions, translations, example sentences, and spaced repetition techniques.",
        type: "vocabulary_lesson" as const,
        defaultStructure: {
          includeIntro: true,
          includeOutro: true,
          includeLowerThird: true,
          includeProgressBar: true,
          includeVocabularyHighlights: true,
          includeComprehensionQuestions: true,
        },
      },
      {
        name: "Conversation Practice",
        slug: "conversation_practice",
        description:
          "Interactive conversation scenarios for practicing real-world English communication skills.",
        type: "conversation_practice" as const,
        defaultStructure: {
          includeIntro: true,
          includeOutro: true,
          includeLowerThird: true,
          includeProgressBar: false,
          includeVocabularyHighlights: false,
          includeComprehensionQuestions: false,
        },
      },
    ];

    const ids = [];
    for (const template of defaultTemplates) {
      const id = await ctx.db.insert("videoTemplates", {
        ...template,
        brandConfig: DEFAULT_BRAND_CONFIG,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }

    return { message: "Templates seeded successfully", count: ids.length };
  },
});
