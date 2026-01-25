import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate a random share token
function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate a unique room name for recording
function generateRoomName(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `video-${timestamp}-${random}`;
}

// ============================================
// QUERIES
// ============================================

/**
 * List all video creation instances for the current user
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("recording"),
        v.literal("recorded"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
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
      .query("videoCreation")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Filter by status if specified
    if (args.status) {
      videos = videos.filter((v) => v.recordingStatus === args.status);
    }

    // Sort by createdAt descending
    videos.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (args.limit) {
      videos = videos.slice(0, args.limit);
    }

    // Get avatar info for each video
    const withAvatars = await Promise.all(
      videos.map(async (video) => {
        const avatar = await ctx.db.get(video.avatarId);
        return {
          ...video,
          avatar: avatar
            ? {
                _id: avatar._id,
                name: avatar.name,
                appearance: avatar.appearance,
              }
            : null,
        };
      })
    );

    return withAvatars;
  },
});

/**
 * Get a video creation by ID
 */
export const getById = query({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      return null;
    }

    const avatar = await ctx.db.get(video.avatarId);

    return {
      ...video,
      avatar: avatar
        ? {
            _id: avatar._id,
            name: avatar.name,
            slug: avatar.slug,
            appearance: avatar.appearance,
            persona: avatar.persona,
          }
        : null,
    };
  },
});

/**
 * Get video creation by share token (for public access)
 */
export const getByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videoCreation")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!video) {
      return null;
    }

    // Check access mode
    if (video.accessMode === "private") {
      // Must be authenticated and be the creator
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

    const avatar = await ctx.db.get(video.avatarId);

    return {
      video: {
        _id: video._id,
        title: video.title,
        description: video.description,
        recordingStatus: video.recordingStatus,
        finalOutput: video.finalOutput,
        totalViews: video.totalViews,
        createdAt: video.createdAt,
      },
      avatar: avatar
        ? {
            _id: avatar._id,
            name: avatar.name,
            appearance: avatar.appearance,
          }
        : null,
    };
  },
});

/**
 * Get video creation with full context for recording agent
 */
export const getForRecording = query({
  args: { roomName: v.string() },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videoCreation")
      .filter((q) => q.eq(q.field("roomName"), args.roomName))
      .first();

    if (!video) {
      return null;
    }

    const avatar = await ctx.db.get(video.avatarId);

    return {
      video: {
        _id: video._id,
        title: video.title,
        mode: video.mode,
        scriptContent: video.scriptContent,
        processedContent: video.processedContent,
        videoConfig: video.videoConfig,
        recordingStatus: video.recordingStatus,
        // Provider overrides for recording
        avatarProviderConfig: video.avatarProviderConfig,
        voiceProviderConfig: video.voiceProviderConfig,
      },
      avatar,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new video creation instance
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    mode: v.union(
      v.literal("url_scrape"),
      v.literal("text_input"),
      v.literal("template_based")
    ),
    avatarId: v.id("avatars"),
    sourceUrl: v.optional(v.string()),
    sourceUrls: v.optional(v.array(v.string())),
    scriptContent: v.optional(v.string()),
    templateId: v.optional(v.string()),
    // Avatar provider overrides
    avatarProviderConfig: v.optional(
      v.object({
        hedraAvatarId: v.optional(v.string()),
        hedraAvatarImageUrl: v.optional(v.string()),
        hedraBaseCreativeId: v.optional(v.string()),
        beyAvatarId: v.optional(v.string()),
      })
    ),
    // Voice provider overrides
    voiceProviderConfig: v.optional(
      v.object({
        cartesiaVoiceId: v.optional(v.string()),
        elevenLabsVoiceId: v.optional(v.string()),
      })
    ),
    videoConfig: v.object({
      style: v.union(v.literal("news_broadcast"), v.literal("simple")),
      duration: v.optional(v.number()),
      aspectRatio: v.union(v.literal("16:9"), v.literal("9:16")),
      includeIntro: v.boolean(),
      includeOutro: v.boolean(),
      includeLowerThird: v.boolean(),
      includeTicker: v.boolean(),
      brandingPreset: v.optional(v.string()),
      lowerThirdConfig: v.optional(
        v.object({
          name: v.optional(v.string()),
          title: v.optional(v.string()),
          style: v.optional(
            v.union(v.literal("minimal"), v.literal("news"), v.literal("corporate"))
          ),
        })
      ),
      tickerConfig: v.optional(
        v.object({
          text: v.optional(v.string()),
          speed: v.optional(v.number()),
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

    // Verify avatar exists
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) {
      throw new Error("Avatar not found");
    }

    const now = Date.now();
    const shareToken = generateShareToken();

    const videoId = await ctx.db.insert("videoCreation", {
      title: args.title,
      description: args.description,
      mode: args.mode,
      sourceUrl: args.sourceUrl,
      sourceUrls: args.sourceUrls,
      scriptContent: args.scriptContent,
      templateId: args.templateId,
      avatarId: args.avatarId,
      avatarProviderConfig: args.avatarProviderConfig,
      voiceProviderConfig: args.voiceProviderConfig,
      videoConfig: args.videoConfig,
      recordingStatus: "pending",
      shareToken,
      accessMode: args.accessMode ?? "private",
      createdBy: user._id,
      totalViews: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      videoCreationId: videoId,
      shareToken,
    };
  },
});

/**
 * Update a video creation instance
 */
export const update = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceUrls: v.optional(v.array(v.string())),
    scriptContent: v.optional(v.string()),
    avatarId: v.optional(v.id("avatars")),
    // Avatar provider overrides
    avatarProviderConfig: v.optional(
      v.object({
        hedraAvatarId: v.optional(v.string()),
        hedraAvatarImageUrl: v.optional(v.string()),
        hedraBaseCreativeId: v.optional(v.string()),
        beyAvatarId: v.optional(v.string()),
      })
    ),
    // Voice provider overrides
    voiceProviderConfig: v.optional(
      v.object({
        cartesiaVoiceId: v.optional(v.string()),
        elevenLabsVoiceId: v.optional(v.string()),
      })
    ),
    videoConfig: v.optional(v.any()),
    accessMode: v.optional(
      v.union(v.literal("private"), v.literal("unlisted"), v.literal("public"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.sourceUrl !== undefined) updates.sourceUrl = args.sourceUrl;
    if (args.sourceUrls !== undefined) updates.sourceUrls = args.sourceUrls;
    if (args.scriptContent !== undefined) updates.scriptContent = args.scriptContent;
    if (args.avatarId !== undefined) {
      const avatar = await ctx.db.get(args.avatarId);
      if (!avatar) {
        throw new Error("Avatar not found");
      }
      updates.avatarId = args.avatarId;
    }
    if (args.avatarProviderConfig !== undefined)
      updates.avatarProviderConfig = args.avatarProviderConfig;
    if (args.voiceProviderConfig !== undefined)
      updates.voiceProviderConfig = args.voiceProviderConfig;
    if (args.videoConfig !== undefined) updates.videoConfig = args.videoConfig;
    if (args.accessMode !== undefined) updates.accessMode = args.accessMode;

    await ctx.db.patch(args.videoCreationId, updates);
    return { success: true };
  },
});

/**
 * Delete a video creation instance
 */
export const remove = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.delete(args.videoCreationId);
    return { success: true };
  },
});

/**
 * Store processed content from URL scraping
 */
export const storeProcessedContent = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    processedContent: v.object({
      title: v.string(),
      content: v.string(),
      summary: v.optional(v.string()),
      keyPoints: v.optional(v.array(v.string())),
      source: v.optional(v.string()),
      sources: v.optional(v.array(v.string())),
      fetchedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      processedContent: args.processedContent,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Start recording - creates room and updates status
 */
export const startRecording = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.recordingStatus !== "pending" && video.recordingStatus !== "failed") {
      throw new Error(`Cannot start recording from status: ${video.recordingStatus}`);
    }

    const roomName = generateRoomName();

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "recording",
      roomName,
      errorMessage: undefined,
      updatedAt: Date.now(),
    });

    return { roomName };
  },
});

/**
 * Complete recording - stores raw recording info
 */
export const completeRecording = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    rawRecording: v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      fileSize: v.number(),
      recordedAt: v.number(),
      egressId: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "recorded",
      rawRecording: args.rawRecording,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Start processing - initiates Remotion render
 */
export const startProcessing = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.recordingStatus !== "recorded") {
      throw new Error(`Cannot process from status: ${video.recordingStatus}`);
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "processing",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Complete processing - stores final output info
 */
export const completeProcessing = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    finalOutput: v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      fileSize: v.number(),
      renderedAt: v.number(),
      thumbnailUrl: v.optional(v.string()),
      thumbnailKey: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "completed",
      finalOutput: args.finalOutput,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark recording or processing as failed
 */
export const markFailed = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "failed",
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Regenerate share token
 */
export const regenerateShareToken = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const newToken = generateShareToken();

    await ctx.db.patch(args.videoCreationId, {
      shareToken: newToken,
      updatedAt: Date.now(),
    });

    return { shareToken: newToken };
  },
});

/**
 * Increment view count
 */
export const incrementViews = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      totalViews: video.totalViews + 1,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reset to pending (for re-recording)
 */
export const resetToPending = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "pending",
      roomName: undefined,
      rawRecording: undefined,
      errorMessage: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Admin reset to pending (no auth required, for fixing stuck recordings)
 */
export const adminResetToPending = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "pending",
      roomName: undefined,
      rawRecording: undefined,
      errorMessage: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Admin: Reset a failed video back to completed status
 * Used when Remotion render fails but raw video is still valid
 */
export const adminResetToCompleted = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    // Only allow reset if finalOutput exists (raw video is ready)
    if (!video.finalOutput) {
      throw new Error("Cannot reset to completed - no final output exists");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "completed",
      errorMessage: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// BATCH GENERATION MUTATIONS (Simple Flow)
// ============================================

/**
 * Start batch generation - called when TTS audio is being generated
 */
export const startBatchGeneration = mutation({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.recordingStatus !== "pending" && video.recordingStatus !== "failed") {
      throw new Error(`Cannot start batch generation from status: ${video.recordingStatus}`);
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "generating_audio",
      batchGeneration: {
        startedAt: Date.now(),
        progress: 0,
      },
      errorMessage: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update batch generation with Hedra job info
 */
export const updateBatchGenerationJob = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    hedraJobId: v.string(),
    audioAssetId: v.optional(v.string()),
    audioDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "generating_video",
      batchGeneration: {
        ...video.batchGeneration,
        hedraJobId: args.hedraJobId,
        audioAssetId: args.audioAssetId,
        audioDuration: args.audioDuration,
        progress: 10,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update batch generation progress
 */
export const updateBatchGenerationProgress = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    progress: v.number(),
    hedraVideoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    const updates: Record<string, unknown> = {
      batchGeneration: {
        ...video.batchGeneration,
        progress: args.progress,
        hedraVideoUrl: args.hedraVideoUrl || video.batchGeneration?.hedraVideoUrl,
      },
      updatedAt: Date.now(),
    };

    // If we have a video URL, we're ready to upload
    if (args.hedraVideoUrl) {
      updates.recordingStatus = "uploading";
    }

    await ctx.db.patch(args.videoCreationId, updates);

    return { success: true };
  },
});

/**
 * Complete batch generation - video has been uploaded to R2
 */
export const completeBatchGeneration = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    finalOutput: v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      fileSize: v.number(),
      renderedAt: v.number(),
      thumbnailUrl: v.optional(v.string()),
      thumbnailKey: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "completed",
      finalOutput: args.finalOutput,
      batchGeneration: {
        ...video.batchGeneration,
        progress: 100,
        completedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get batch generation status (for polling)
 */
export const getBatchGenerationStatus = query({
  args: { videoCreationId: v.id("videoCreation") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      return null;
    }

    return {
      status: video.recordingStatus,
      progress: video.batchGeneration?.progress || 0,
      hedraJobId: video.batchGeneration?.hedraJobId,
      hedraVideoUrl: video.batchGeneration?.hedraVideoUrl,
      finalOutput: video.finalOutput,
      errorMessage: video.errorMessage,
    };
  },
});

/**
 * Complete Remotion render - final polished video has been uploaded to R2
 */
export const completeRemotionRender = mutation({
  args: {
    videoCreationId: v.id("videoCreation"),
    renderedOutput: v.object({
      r2Key: v.string(),
      r2Url: v.string(),
      duration: v.number(),
      fileSize: v.number(),
      renderedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoCreationId);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.videoCreationId, {
      recordingStatus: "completed",
      renderedOutput: args.renderedOutput,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
