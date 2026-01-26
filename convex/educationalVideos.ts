import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// EDUCATIONAL VIDEOS - Standalone video generator
// ============================================

/**
 * Generate a random share token
 */
function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// QUERIES
// ============================================

/**
 * List educational videos for the current user
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    templateType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    let videos = await ctx.db
      .query("educationalVideos")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Filter by status if specified
    if (args.status) {
      videos = videos.filter((v) => v.status === args.status);
    }

    // Filter by template type if specified
    if (args.templateType) {
      videos = videos.filter((v) => v.templateType === args.templateType);
    }

    // Sort by createdAt descending
    videos.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (args.limit) {
      videos = videos.slice(0, args.limit);
    }

    return videos;
  },
});

/**
 * Get an educational video by ID
 */
export const getById = query({
  args: { videoId: v.id("educationalVideos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      return null;
    }

    // Get template info if available
    let template = null;
    if (video.templateId) {
      template = await ctx.db.get(video.templateId);
    }

    return { ...video, template };
  },
});

/**
 * Get an educational video by share token (for public access)
 */
export const getByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("educationalVideos")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!video) {
      return null;
    }

    // Check access mode
    if (video.accessMode === "private") {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      if (!user || user._id !== video.createdBy) {
        return null;
      }
    }

    return video;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new educational video
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    templateId: v.optional(v.id("videoTemplates")),
    templateType: v.union(
      v.literal("news_broadcast"),
      v.literal("grammar_lesson"),
      v.literal("vocabulary_lesson"),
      v.literal("conversation_practice")
    ),
    sourceConfig: v.object({
      mode: v.union(
        v.literal("url_scrape"),
        v.literal("topic_input"),
        v.literal("manual")
      ),
      urls: v.optional(v.array(v.string())),
      topic: v.optional(v.string()),
      targetLevel: v.string(),
      targetDuration: v.optional(v.number()),
      nativeLanguage: v.optional(v.string()),
    }),
    voiceConfig: v.object({
      provider: v.union(v.literal("cartesia"), v.literal("elevenlabs")),
      voiceId: v.string(),
      voiceName: v.optional(v.string()),
      language: v.optional(v.string()),
      settings: v.optional(
        v.object({
          speed: v.optional(v.number()),
          emotion: v.optional(v.string()),
        })
      ),
    }),
    avatarConfig: v.object({
      provider: v.union(v.literal("hedra"), v.literal("beyond_presence")),
      characterId: v.string(),
      characterName: v.optional(v.string()),
      characterImageUrl: v.optional(v.string()),
    }),
    videoSettings: v.object({
      aspectRatio: v.union(v.literal("16:9"), v.literal("9:16")),
      resolution: v.union(
        v.literal("1080p"),
        v.literal("720p"),
        v.literal("4K")
      ),
      includeIntro: v.boolean(),
      includeOutro: v.boolean(),
      includeLowerThird: v.boolean(),
      includeProgressBar: v.optional(v.boolean()),
      lowerThird: v.optional(
        v.object({
          name: v.string(),
          title: v.string(),
        })
      ),
      brandOverrides: v.optional(
        v.object({
          primaryColor: v.optional(v.string()),
          secondaryColor: v.optional(v.string()),
          accentColor: v.optional(v.string()),
        })
      ),
    }),
    accessMode: v.optional(
      v.union(v.literal("private"), v.literal("unlisted"), v.literal("public"))
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
    const shareToken = generateShareToken();

    const videoId = await ctx.db.insert("educationalVideos", {
      title: args.title,
      description: args.description,
      templateId: args.templateId,
      templateType: args.templateType,
      sourceConfig: args.sourceConfig,
      voiceConfig: args.voiceConfig,
      avatarConfig: args.avatarConfig,
      videoSettings: args.videoSettings,
      status: "draft",
      shareToken,
      accessMode: args.accessMode ?? "private",
      totalViews: 0,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return { videoId, shareToken };
  },
});

/**
 * Update an educational video
 */
export const update = mutation({
  args: {
    videoId: v.id("educationalVideos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sourceConfig: v.optional(v.any()),
    lessonContent: v.optional(v.any()),
    voiceConfig: v.optional(v.any()),
    avatarConfig: v.optional(v.any()),
    videoSettings: v.optional(v.any()),
    accessMode: v.optional(
      v.union(v.literal("private"), v.literal("unlisted"), v.literal("public"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.sourceConfig !== undefined) updates.sourceConfig = args.sourceConfig;
    if (args.lessonContent !== undefined)
      updates.lessonContent = args.lessonContent;
    if (args.voiceConfig !== undefined) updates.voiceConfig = args.voiceConfig;
    if (args.avatarConfig !== undefined) updates.avatarConfig = args.avatarConfig;
    if (args.videoSettings !== undefined)
      updates.videoSettings = args.videoSettings;
    if (args.accessMode !== undefined) updates.accessMode = args.accessMode;

    await ctx.db.patch(args.videoId, updates);
    return { success: true };
  },
});

/**
 * Update video status
 */
export const updateStatus = mutation({
  args: {
    videoId: v.id("educationalVideos"),
    status: v.union(
      v.literal("draft"),
      v.literal("content_generating"),
      v.literal("content_ready"),
      v.literal("audio_generating"),
      v.literal("audio_ready"),
      v.literal("avatar_generating"),
      v.literal("avatar_ready"),
      v.literal("rendering"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    errorStep: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.errorMessage !== undefined) updates.errorMessage = args.errorMessage;
    if (args.errorStep !== undefined) updates.errorStep = args.errorStep;

    await ctx.db.patch(args.videoId, updates);
    return { success: true };
  },
});

/**
 * Store generated lesson content
 */
export const storeLessonContent = mutation({
  args: {
    videoId: v.id("educationalVideos"),
    lessonContent: v.object({
      objective: v.string(),
      vocabulary: v.array(
        v.object({
          word: v.string(),
          phonetic: v.optional(v.string()),
          definition: v.string(),
          germanTranslation: v.string(),
          exampleSentence: v.string(),
          audioUrl: v.optional(v.string()),
        })
      ),
      slides: v.array(
        v.object({
          id: v.string(),
          type: v.union(
            v.literal("title"),
            v.literal("summary"),
            v.literal("key_concept"),
            v.literal("bullet_points"),
            v.literal("vocabulary"),
            v.literal("grammar_rule"),
            v.literal("comparison"),
            v.literal("question"),
            v.literal("practice"),
            v.literal("discussion")
          ),
          title: v.optional(v.string()),
          content: v.optional(v.string()),
          items: v.optional(v.array(v.string())),
          narration: v.string(),
          durationSeconds: v.optional(v.number()),
        })
      ),
      questions: v.array(
        v.object({
          question: v.string(),
          type: v.optional(
            v.union(
              v.literal("multiple_choice"),
              v.literal("true_false"),
              v.literal("fill_blank"),
              v.literal("open_ended")
            )
          ),
          options: v.optional(v.array(v.string())),
          correctAnswer: v.optional(v.string()),
          explanation: v.optional(v.string()),
        })
      ),
      keyTakeaways: v.array(v.string()),
      fullScript: v.string(),
      estimatedDuration: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoId, {
      lessonContent: args.lessonContent,
      status: "content_ready",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Store audio output
 */
export const storeAudioOutput = mutation({
  args: {
    videoId: v.id("educationalVideos"),
    audioOutput: v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      fileSize: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoId, {
      audioOutput: args.audioOutput,
      status: "audio_ready",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Store avatar output
 */
export const storeAvatarOutput = mutation({
  args: {
    videoId: v.id("educationalVideos"),
    avatarOutput: v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      hedraJobId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoId, {
      avatarOutput: args.avatarOutput,
      status: "avatar_ready",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Store final rendered output
 */
export const storeFinalOutput = mutation({
  args: {
    videoId: v.id("educationalVideos"),
    finalOutput: v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      fileSize: v.optional(v.number()),
      renderedAt: v.number(),
      thumbnailUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoId, {
      finalOutput: args.finalOutput,
      status: "completed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an educational video
 */
export const remove = mutation({
  args: { videoId: v.id("educationalVideos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.delete(args.videoId);
    return { success: true };
  },
});

/**
 * Increment view count
 */
export const incrementViews = mutation({
  args: { videoId: v.id("educationalVideos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoId, {
      totalViews: (video.totalViews ?? 0) + 1,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Regenerate share token
 */
export const regenerateShareToken = mutation({
  args: { videoId: v.id("educationalVideos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const newToken = generateShareToken();

    await ctx.db.patch(args.videoId, {
      shareToken: newToken,
      updatedAt: Date.now(),
    });

    return { shareToken: newToken };
  },
});

/**
 * Get video generation status (for polling)
 */
export const getGenerationStatus = query({
  args: { videoId: v.id("educationalVideos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      return null;
    }

    return {
      status: video.status,
      hasContent: !!video.lessonContent,
      hasAudio: !!video.audioOutput,
      hasAvatar: !!video.avatarOutput,
      hasFinal: !!video.finalOutput,
      audioOutput: video.audioOutput,
      avatarOutput: video.avatarOutput,
      finalOutput: video.finalOutput,
      errorMessage: video.errorMessage,
      errorStep: video.errorStep,
    };
  },
});
