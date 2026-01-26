import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// VOICE LIBRARY - Standalone voice configurations
// ============================================

/**
 * List all voices in the library
 */
export const list = query({
  args: {
    provider: v.optional(v.union(v.literal("cartesia"), v.literal("elevenlabs"))),
    language: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let voices = await ctx.db.query("voiceLibrary").collect();

    if (args.provider) {
      voices = voices.filter((v) => v.provider === args.provider);
    }

    if (args.language) {
      voices = voices.filter((v) => v.language === args.language);
    }

    if (args.activeOnly !== false) {
      voices = voices.filter((v) => v.isActive);
    }

    return voices.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get a voice by ID
 */
export const getById = query({
  args: { voiceId: v.id("voiceLibrary") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.voiceId);
  },
});

/**
 * Create a new voice in the library
 */
export const create = mutation({
  args: {
    name: v.string(),
    provider: v.union(v.literal("cartesia"), v.literal("elevenlabs")),
    voiceId: v.string(),
    language: v.string(),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("neutral"))
    ),
    description: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    defaultSettings: v.optional(
      v.object({
        speed: v.optional(v.number()),
        pitch: v.optional(v.number()),
        emotion: v.optional(v.string()),
      })
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const id = await ctx.db.insert("voiceLibrary", {
      name: args.name,
      provider: args.provider,
      voiceId: args.voiceId,
      language: args.language,
      gender: args.gender,
      description: args.description,
      previewUrl: args.previewUrl,
      defaultSettings: args.defaultSettings,
      tags: args.tags,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { voiceId: id };
  },
});

/**
 * Update a voice in the library
 */
export const update = mutation({
  args: {
    voiceId: v.id("voiceLibrary"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    defaultSettings: v.optional(
      v.object({
        speed: v.optional(v.number()),
        pitch: v.optional(v.number()),
        emotion: v.optional(v.string()),
      })
    ),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const voice = await ctx.db.get(args.voiceId);
    if (!voice) {
      throw new Error("Voice not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.previewUrl !== undefined) updates.previewUrl = args.previewUrl;
    if (args.defaultSettings !== undefined)
      updates.defaultSettings = args.defaultSettings;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.voiceId, updates);
    return { success: true };
  },
});

/**
 * Delete a voice from the library
 */
export const remove = mutation({
  args: { voiceId: v.id("voiceLibrary") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.voiceId);
    return { success: true };
  },
});

/**
 * Seed default voices (Cartesia voices for English/German)
 */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.query("voiceLibrary").collect();
    if (existing.length > 0) {
      return { message: "Voices already seeded", count: existing.length };
    }

    const now = Date.now();

    // Default Cartesia voices for educational content
    const defaultVoices = [
      {
        name: "Emma (English Teacher)",
        provider: "cartesia" as const,
        voiceId: "694f9389-aac1-45b6-b726-9d9369183238", // Cartesia voice ID
        language: "en",
        gender: "female" as const,
        description:
          "Warm, professional female voice ideal for educational content",
        tags: ["professional", "warm", "educational", "british"],
        defaultSettings: {
          speed: 0.95,
          emotion: "friendly",
        },
      },
      {
        name: "James (News Anchor)",
        provider: "cartesia" as const,
        voiceId: "a0e99841-438c-4a64-b679-ae501e7d6091",
        language: "en",
        gender: "male" as const,
        description: "Clear, authoritative male voice for news-style content",
        tags: ["professional", "news", "authoritative", "american"],
        defaultSettings: {
          speed: 1.0,
          emotion: "confident",
        },
      },
      {
        name: "Sophie (German Teacher)",
        provider: "cartesia" as const,
        voiceId: "65b25c5d-ff07-4687-a04c-da2f43ef6fa9",
        language: "de",
        gender: "female" as const,
        description: "Native German voice for bilingual content",
        tags: ["professional", "educational", "german", "native"],
        defaultSettings: {
          speed: 0.9,
          emotion: "friendly",
        },
      },
    ];

    const ids = [];
    for (const voice of defaultVoices) {
      const id = await ctx.db.insert("voiceLibrary", {
        ...voice,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }

    return { message: "Voices seeded successfully", count: ids.length };
  },
});
