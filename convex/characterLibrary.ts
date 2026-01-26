import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// CHARACTER LIBRARY - Standalone avatar/character configurations
// ============================================

/**
 * List all characters in the library
 */
export const list = query({
  args: {
    provider: v.optional(
      v.union(
        v.literal("hedra"),
        v.literal("beyond_presence"),
        v.literal("tavus")
      )
    ),
    style: v.optional(
      v.union(
        v.literal("professional"),
        v.literal("casual"),
        v.literal("news_anchor"),
        v.literal("teacher")
      )
    ),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let characters = await ctx.db.query("characterLibrary").collect();

    if (args.provider) {
      characters = characters.filter((c) => c.provider === args.provider);
    }

    if (args.style) {
      characters = characters.filter((c) => c.style === args.style);
    }

    if (args.activeOnly !== false) {
      characters = characters.filter((c) => c.isActive);
    }

    return characters.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get a character by ID
 */
export const getById = query({
  args: { characterId: v.id("characterLibrary") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.characterId);
  },
});

/**
 * Create a new character in the library
 */
export const create = mutation({
  args: {
    name: v.string(),
    provider: v.union(
      v.literal("hedra"),
      v.literal("beyond_presence"),
      v.literal("tavus")
    ),
    characterId: v.string(),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    style: v.optional(
      v.union(
        v.literal("professional"),
        v.literal("casual"),
        v.literal("news_anchor"),
        v.literal("teacher")
      )
    ),
    providerConfig: v.optional(
      v.object({
        hedraBaseCreativeId: v.optional(v.string()),
        beyAvatarId: v.optional(v.string()),
        tavusPersonaId: v.optional(v.string()),
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

    const id = await ctx.db.insert("characterLibrary", {
      name: args.name,
      provider: args.provider,
      characterId: args.characterId,
      imageUrl: args.imageUrl,
      description: args.description,
      style: args.style,
      providerConfig: args.providerConfig,
      tags: args.tags,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { characterId: id };
  },
});

/**
 * Update a character in the library
 */
export const update = mutation({
  args: {
    characterId: v.id("characterLibrary"),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    style: v.optional(
      v.union(
        v.literal("professional"),
        v.literal("casual"),
        v.literal("news_anchor"),
        v.literal("teacher")
      )
    ),
    providerConfig: v.optional(
      v.object({
        hedraBaseCreativeId: v.optional(v.string()),
        beyAvatarId: v.optional(v.string()),
        tavusPersonaId: v.optional(v.string()),
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

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
    if (args.description !== undefined) updates.description = args.description;
    if (args.style !== undefined) updates.style = args.style;
    if (args.providerConfig !== undefined)
      updates.providerConfig = args.providerConfig;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.characterId, updates);
    return { success: true };
  },
});

/**
 * Delete a character from the library
 */
export const remove = mutation({
  args: { characterId: v.id("characterLibrary") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.characterId);
    return { success: true };
  },
});

/**
 * Seed default characters (Hedra characters)
 */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.query("characterLibrary").collect();
    if (existing.length > 0) {
      return { message: "Characters already seeded", count: existing.length };
    }

    const now = Date.now();

    // Default Hedra characters
    const defaultCharacters = [
      {
        name: "Emma",
        provider: "hedra" as const,
        characterId: "emma-teacher-v1", // Placeholder - replace with actual Hedra ID
        description: "Professional female English teacher avatar",
        style: "teacher" as const,
        tags: ["female", "professional", "teacher", "educational"],
        providerConfig: {
          hedraBaseCreativeId: "emma-base-v1",
        },
      },
      {
        name: "James",
        provider: "hedra" as const,
        characterId: "james-anchor-v1", // Placeholder - replace with actual Hedra ID
        description: "Male news anchor style presenter",
        style: "news_anchor" as const,
        tags: ["male", "professional", "news", "presenter"],
        providerConfig: {
          hedraBaseCreativeId: "james-base-v1",
        },
      },
      {
        name: "Sophie",
        provider: "hedra" as const,
        characterId: "sophie-casual-v1", // Placeholder - replace with actual Hedra ID
        description: "Friendly female avatar for casual content",
        style: "casual" as const,
        tags: ["female", "friendly", "casual", "approachable"],
        providerConfig: {
          hedraBaseCreativeId: "sophie-base-v1",
        },
      },
    ];

    const ids = [];
    for (const character of defaultCharacters) {
      const id = await ctx.db.insert("characterLibrary", {
        ...character,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }

    return { message: "Characters seeded successfully", count: ids.length };
  },
});
