import { v } from "convex/values";
import { GenericMutationCtx } from "convex/server";
import { mutation, query } from "./_generated/server";
import { Id, DataModel } from "./_generated/dataModel";

// ============================================
// QUERIES
// ============================================

/**
 * List all games with optional filters
 */
export const listGames = query({
  args: {
    type: v.optional(v.string()),
    level: v.optional(v.string()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let gamesQuery = ctx.db.query("wordGames");

    // Apply status filter if provided
    if (args.status) {
      gamesQuery = gamesQuery.filter((q) =>
        q.eq(q.field("status"), args.status)
      );
    }

    let games = await gamesQuery.order("desc").collect();

    // Apply additional filters in memory (Convex doesn't support multiple index filters)
    if (args.type) {
      games = games.filter((g) => g.type === args.type);
    }
    if (args.level) {
      games = games.filter((g) => g.level === args.level);
    }
    if (args.category) {
      games = games.filter((g) => g.category === args.category);
    }

    // Apply limit
    if (args.limit) {
      games = games.slice(0, args.limit);
    }

    return games;
  },
});

/**
 * Get single game by ID
 */
export const getGame = query({
  args: { gameId: v.id("wordGames") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

/**
 * Get single game by slug
 */
export const getGameBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wordGames")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Get games linked to a lesson
 */
export const getGamesForLesson = query({
  args: { lessonId: v.id("structuredLessons") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("gameLessonLinks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    // Fetch actual games
    const games = await Promise.all(
      links.map(async (link) => {
        const game = await ctx.db.get(link.gameId);
        return {
          ...link,
          game,
        };
      })
    );

    // Sort by order
    return games.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get games available for a session (via the linked structured lesson)
 * Used by the teaching room Materials panel
 */
export const getGamesForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session?.structuredLessonId) return [];

    // Store lessonId in a const to help TypeScript narrow the type
    const lessonId = session.structuredLessonId;

    // Get game links via gameLessonLinks table
    const links = await ctx.db
      .query("gameLessonLinks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .collect();

    // Fetch game details
    const games = await Promise.all(
      links.map(async (link) => {
        const game = await ctx.db.get(link.gameId);
        if (!game || game.status !== "published") return null;
        return {
          ...game,
          linkId: link._id,
          order: link.order,
          triggerType: link.triggerType,
        };
      })
    );

    // Filter out nulls and sort by order
    return games
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },
});

/**
 * Get active game session for student
 */
export const getActiveGameSession = query({
  args: {
    studentId: v.id("students"),
    gameId: v.optional(v.id("wordGames")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("gameSessions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("status"), "in_progress"));

    if (args.gameId) {
      query = query.filter((q) => q.eq(q.field("gameId"), args.gameId));
    }

    return await query.first();
  },
});

/**
 * Get game session by ID
 */
export const getGameSession = query({
  args: { gameSessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) return null;

    // Also fetch the game details
    const game = await ctx.db.get(session.gameId);

    return {
      ...session,
      game,
    };
  },
});

/**
 * Get student's game history
 */
export const getStudentGameHistory = query({
  args: {
    studentId: v.id("students"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("gameSessions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc");

    const sessions = await query.take(args.limit || 50);

    // Fetch game details for each session
    const history = await Promise.all(
      sessions.map(async (session) => {
        const game = await ctx.db.get(session.gameId);
        return {
          ...session,
          game,
        };
      })
    );

    return history;
  },
});

/**
 * Get game analytics
 */
export const getGameAnalytics = query({
  args: {
    gameId: v.optional(v.id("wordGames")),
    studentId: v.optional(v.id("students")),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("gameAnalytics");

    if (args.gameId) {
      query = query.filter((q) => q.eq(q.field("gameId"), args.gameId));
    }

    if (args.studentId) {
      query = query.filter((q) => q.eq(q.field("studentId"), args.studentId));
    }

    if (args.period) {
      query = query.filter((q) => q.eq(q.field("period"), args.period));
    }

    return await query.collect();
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create new game
 */
export const createGame = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.string(),
    type: v.union(
      v.literal("sentence_builder"),
      v.literal("fill_in_blank"),
      v.literal("word_ordering"),
      v.literal("matching_pairs"),
      v.literal("vocabulary_matching"),
      v.literal("word_scramble"),
      v.literal("multiple_choice"),
      v.literal("flashcards"),
      v.literal("hangman"),
      v.literal("crossword")
    ),
    category: v.union(
      v.literal("grammar"),
      v.literal("vocabulary"),
      v.literal("mixed")
    ),
    level: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2"),
      v.literal("C1"),
      v.literal("C2")
    ),
    tags: v.optional(v.array(v.string())),
    config: v.any(),
    hints: v.array(v.string()),
    difficultyConfig: v.object({
      hintsAvailable: v.number(),
      distractorDifficulty: v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard")
      ),
      timeMultiplier: v.optional(v.number()),
    }),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))
    ),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate slug if not provided
    const slug =
      args.slug ||
      args.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) +
        "-" +
        now.toString(36);

    // Check if slug is unique
    const existing = await ctx.db
      .query("wordGames")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error(`Game with slug "${slug}" already exists`);
    }

    const gameId = await ctx.db.insert("wordGames", {
      title: args.title,
      slug,
      description: args.description,
      instructions: args.instructions,
      type: args.type,
      category: args.category,
      level: args.level,
      tags: args.tags,
      config: args.config,
      hints: args.hints,
      difficultyConfig: args.difficultyConfig,
      status: args.status || "draft",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      stats: {
        totalPlays: 0,
        completionRate: 0,
        averageStars: 0,
        averageTimeSeconds: 0,
      },
    });

    return gameId;
  },
});

/**
 * Update game
 */
export const updateGame = mutation({
  args: {
    gameId: v.id("wordGames"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    level: v.optional(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("grammar"),
        v.literal("vocabulary"),
        v.literal("mixed")
      )
    ),
    tags: v.optional(v.array(v.string())),
    config: v.optional(v.any()),
    hints: v.optional(v.array(v.string())),
    difficultyConfig: v.optional(
      v.object({
        hintsAvailable: v.number(),
        distractorDifficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard")
        ),
        timeMultiplier: v.optional(v.number()),
      })
    ),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))
    ),
  },
  handler: async (ctx, args) => {
    const { gameId, ...updates } = args;

    const game = await ctx.db.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(gameId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    return gameId;
  },
});

/**
 * Delete game
 */
export const deleteGame = mutation({
  args: { gameId: v.id("wordGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Delete associated game-lesson links
    const links = await ctx.db
      .query("gameLessonLinks")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    // Delete the game
    await ctx.db.delete(args.gameId);

    return { success: true };
  },
});

/**
 * Duplicate game
 */
export const duplicateGame = mutation({
  args: {
    gameId: v.id("wordGames"),
    newTitle: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const now = Date.now();
    const newTitle = args.newTitle || `${game.title} (Copy)`;
    const newSlug =
      newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) +
      "-" +
      now.toString(36);

    const newGameId = await ctx.db.insert("wordGames", {
      title: newTitle,
      slug: newSlug,
      description: game.description,
      instructions: game.instructions,
      type: game.type,
      category: game.category,
      level: game.level,
      tags: game.tags,
      config: game.config,
      hints: game.hints,
      difficultyConfig: game.difficultyConfig,
      status: "draft",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      stats: {
        totalPlays: 0,
        completionRate: 0,
        averageStars: 0,
        averageTimeSeconds: 0,
      },
    });

    return newGameId;
  },
});

/**
 * Link game to lesson
 */
export const linkGameToLesson = mutation({
  args: {
    gameId: v.id("wordGames"),
    lessonId: v.id("structuredLessons"),
    triggerType: v.union(
      v.literal("slide"),
      v.literal("avatar"),
      v.literal("student"),
      v.literal("checkpoint")
    ),
    triggerConfig: v.object({
      slideIndex: v.optional(v.number()),
      afterMinutes: v.optional(v.number()),
      keywords: v.optional(v.array(v.string())),
    }),
    isRequired: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get current links for this lesson
    const existingLinks = await ctx.db
      .query("gameLessonLinks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    // Enforce 20-game limit
    if (existingLinks.length >= 20) {
      throw new Error("Maximum of 20 games per lesson reached");
    }

    // Check if this game is already linked
    const alreadyLinked = existingLinks.some(
      (link) => link.gameId === args.gameId
    );
    if (alreadyLinked) {
      throw new Error("This game is already linked to this lesson");
    }

    const maxOrder =
      existingLinks.length > 0
        ? Math.max(...existingLinks.map((l) => l.order))
        : -1;

    const linkId = await ctx.db.insert("gameLessonLinks", {
      gameId: args.gameId,
      lessonId: args.lessonId,
      triggerType: args.triggerType,
      triggerConfig: args.triggerConfig,
      isRequired: args.isRequired,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    return linkId;
  },
});

/**
 * Unlink game from lesson
 */
export const unlinkGameFromLesson = mutation({
  args: {
    linkId: v.id("gameLessonLinks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.linkId);
    return { success: true };
  },
});

/**
 * Update game-lesson link
 */
export const updateGameLessonLink = mutation({
  args: {
    linkId: v.id("gameLessonLinks"),
    triggerType: v.optional(
      v.union(
        v.literal("slide"),
        v.literal("avatar"),
        v.literal("student"),
        v.literal("checkpoint")
      )
    ),
    triggerConfig: v.optional(
      v.object({
        slideIndex: v.optional(v.number()),
        afterMinutes: v.optional(v.number()),
        keywords: v.optional(v.array(v.string())),
      })
    ),
    isRequired: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { linkId, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(linkId, cleanUpdates);
    return linkId;
  },
});

// ============================================
// GAME SESSION MUTATIONS
// ============================================

/**
 * Start game session
 */
export const startGameSession = mutation({
  args: {
    gameId: v.id("wordGames"),
    studentId: v.id("students"),
    sessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Check for existing in-progress session
    const existing = await ctx.db
      .query("gameSessions")
      .withIndex("by_student_game", (q) =>
        q.eq("studentId", args.studentId).eq("gameId", args.gameId)
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .first();

    if (existing) {
      // Return existing session
      return existing._id;
    }

    // Calculate total items based on game type
    let totalItems = 1;
    const config = game.config as Record<string, unknown>;
    if (config.items && Array.isArray(config.items)) {
      totalItems = config.items.length;
    } else if (config.pairs && Array.isArray(config.pairs)) {
      totalItems = config.pairs.length;
    } else if (config.cards && Array.isArray(config.cards)) {
      totalItems = config.cards.length;
    }

    const now = Date.now();

    const gameSessionId = await ctx.db.insert("gameSessions", {
      gameId: args.gameId,
      studentId: args.studentId,
      sessionId: args.sessionId,
      status: "in_progress",
      gameState: {}, // Will be populated by frontend
      currentItemIndex: 0,
      totalItems,
      correctAnswers: 0,
      incorrectAnswers: 0,
      hintsUsed: 0,
      startedAt: now,
      events: [
        {
          type: "game_started",
          timestamp: now,
          data: { gameType: game.type },
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    return gameSessionId;
  },
});

/**
 * Update game session state
 */
export const updateGameSession = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    gameState: v.optional(v.any()),
    currentItemIndex: v.optional(v.number()),
    correctAnswers: v.optional(v.number()),
    incorrectAnswers: v.optional(v.number()),
    hintsUsed: v.optional(v.number()),
    event: v.optional(
      v.object({
        type: v.string(),
        data: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.gameState !== undefined) {
      updates.gameState = args.gameState;
    }
    if (args.currentItemIndex !== undefined) {
      updates.currentItemIndex = args.currentItemIndex;
    }
    if (args.correctAnswers !== undefined) {
      updates.correctAnswers = args.correctAnswers;
    }
    if (args.incorrectAnswers !== undefined) {
      updates.incorrectAnswers = args.incorrectAnswers;
    }
    if (args.hintsUsed !== undefined) {
      updates.hintsUsed = args.hintsUsed;
    }

    // Add event to log
    if (args.event) {
      updates.events = [
        ...session.events,
        {
          type: args.event.type,
          timestamp: Date.now(),
          data: args.event.data,
        },
      ];
    }

    await ctx.db.patch(args.gameSessionId, updates);
    return args.gameSessionId;
  },
});

/**
 * Complete game session
 */
export const completeGameSession = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    stars: v.number(),
    scorePercent: v.number(),
    finalState: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    const now = Date.now();
    const totalTimeSeconds = Math.round((now - session.startedAt) / 1000);

    await ctx.db.patch(args.gameSessionId, {
      status: "completed",
      stars: args.stars,
      scorePercent: args.scorePercent,
      gameState: args.finalState || session.gameState,
      completedAt: now,
      totalTimeSeconds,
      updatedAt: now,
      events: [
        ...session.events,
        {
          type: "game_completed",
          timestamp: now,
          data: {
            stars: args.stars,
            scorePercent: args.scorePercent,
            totalTimeSeconds,
          },
        },
      ],
    });

    // Update game stats
    await updateGameStats(ctx, session.gameId);

    return args.gameSessionId;
  },
});

/**
 * Abandon game session
 */
export const abandonGameSession = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    const now = Date.now();
    const totalTimeSeconds = Math.round((now - session.startedAt) / 1000);

    await ctx.db.patch(args.gameSessionId, {
      status: "abandoned",
      completedAt: now,
      totalTimeSeconds,
      updatedAt: now,
      events: [
        ...session.events,
        {
          type: "game_abandoned",
          timestamp: now,
          data: {
            progress: Math.round(
              (session.currentItemIndex / session.totalItems) * 100
            ),
          },
        },
      ],
    });

    return args.gameSessionId;
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update game statistics based on completed sessions
 */
async function updateGameStats(
  ctx: GenericMutationCtx<DataModel>,
  gameId: Id<"wordGames">
): Promise<void> {
  const sessions = await ctx.db
    .query("gameSessions")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .collect();

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalPlays = sessions.length;
  const completionRate =
    totalPlays > 0 ? (completedSessions.length / totalPlays) * 100 : 0;

  const starsSum = completedSessions.reduce((sum, s) => sum + (s.stars || 0), 0);
  const averageStars =
    completedSessions.length > 0 ? starsSum / completedSessions.length : 0;

  const timeSum = completedSessions.reduce(
    (sum, s) => sum + (s.totalTimeSeconds || 0),
    0
  );
  const averageTimeSeconds =
    completedSessions.length > 0 ? timeSum / completedSessions.length : 0;

  await ctx.db.patch(gameId, {
    stats: {
      totalPlays,
      completionRate: Math.round(completionRate * 100) / 100,
      averageStars: Math.round(averageStars * 100) / 100,
      averageTimeSeconds: Math.round(averageTimeSeconds),
    },
    updatedAt: Date.now(),
  });
}

/**
 * Generate a secure random token for shareable links
 */
function generateShareToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate a unique participant ID
 */
function generateParticipantId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================
// MULTIPLAYER / SHAREABLE SESSION FUNCTIONS
// ============================================

/**
 * Create a shareable multiplayer session
 */
export const createShareableSession = mutation({
  args: {
    gameId: v.id("wordGames"),
    hostUserId: v.id("users"),
    hostDisplayName: v.string(),
    gameMode: v.optional(
      v.union(
        v.literal("collaborative"),
        v.literal("competitive"),
        v.literal("turn_based")
      )
    ),
    expiresInHours: v.optional(v.number()), // Default 24 hours
    allowSelfStart: v.optional(v.boolean()), // Students can start without host
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "published") {
      throw new Error("Can only share published games");
    }

    // Generate unique token
    let shareToken = generateShareToken();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await ctx.db
        .query("gameSessions")
        .withIndex("by_share_token", (q) => q.eq("shareToken", shareToken))
        .first();
      if (!existing) break;
      shareToken = generateShareToken();
      attempts++;
    }

    if (attempts >= 5) {
      throw new Error("Failed to generate unique token");
    }

    // Calculate total items
    let totalItems = 1;
    const config = game.config as Record<string, unknown>;
    if (config.items && Array.isArray(config.items)) {
      totalItems = config.items.length;
    } else if (config.pairs && Array.isArray(config.pairs)) {
      totalItems = config.pairs.length;
    } else if (config.cards && Array.isArray(config.cards)) {
      totalItems = config.cards.length;
    }

    const now = Date.now();
    const expiresInMs = (args.expiresInHours || 24) * 60 * 60 * 1000;
    const hostParticipantId = generateParticipantId();

    const gameSessionId = await ctx.db.insert("gameSessions", {
      gameId: args.gameId,
      status: "waiting",
      gameState: {},
      currentItemIndex: 0,
      totalItems,
      correctAnswers: 0,
      incorrectAnswers: 0,
      hintsUsed: 0,
      startedAt: now,
      events: [
        {
          type: "session_created",
          timestamp: now,
          data: { hostUserId: args.hostUserId, gameMode: args.gameMode },
        },
      ],
      createdAt: now,
      updatedAt: now,
      // Multiplayer fields
      isMultiplayer: true,
      shareToken,
      hostUserId: args.hostUserId,
      participants: [
        {
          participantId: hostParticipantId,
          displayName: args.hostDisplayName,
          userId: args.hostUserId,
          joinedAt: now,
          isHost: true,
          isActive: true,
          lastSeenAt: now,
        },
      ],
      sharedState: {
        gameMode: args.gameMode || "collaborative",
        syncedItemIndex: 0,
      },
      allowSelfStart: args.allowSelfStart !== false, // Default to true
      tokenExpiresAt: now + expiresInMs,
    });

    return {
      gameSessionId,
      shareToken,
      shareUrl: `/games/play/${shareToken}`,
      expiresAt: now + expiresInMs,
    };
  },
});

/**
 * Get session by share token (public - no auth required)
 */
export const getSessionByToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.tokenExpiresAt && session.tokenExpiresAt < Date.now()) {
      return { error: "expired", session: null };
    }

    // Check if session is ended
    if (session.status === "completed" || session.status === "abandoned") {
      return { error: "ended", session: null };
    }

    // Fetch game details
    const game = await ctx.db.get(session.gameId);

    return {
      error: null,
      session: {
        ...session,
        game,
      },
    };
  },
});

/**
 * Join a shared session (public - guests can join)
 */
export const joinSharedSession = mutation({
  args: {
    shareToken: v.string(),
    displayName: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.tokenExpiresAt && session.tokenExpiresAt < Date.now()) {
      throw new Error("Session has expired");
    }

    if (session.status === "completed" || session.status === "abandoned") {
      throw new Error("Session has ended");
    }

    const participants = session.participants || [];

    // Check if user already joined
    const existingParticipant = participants.find(
      (p) =>
        (args.userId && p.userId === args.userId) ||
        p.displayName === args.displayName
    );

    if (existingParticipant) {
      // Update last seen and mark active
      const updatedParticipants = participants.map((p) =>
        p.participantId === existingParticipant.participantId
          ? { ...p, isActive: true, lastSeenAt: Date.now() }
          : p
      );

      await ctx.db.patch(session._id, {
        participants: updatedParticipants,
        updatedAt: Date.now(),
      });

      return {
        participantId: existingParticipant.participantId,
        isRejoining: true,
      };
    }

    // Add new participant
    const participantId = generateParticipantId();
    const now = Date.now();

    const newParticipant = {
      participantId,
      displayName: args.displayName,
      userId: args.userId,
      joinedAt: now,
      isHost: false,
      isActive: true,
      lastSeenAt: now,
    };

    await ctx.db.patch(session._id, {
      participants: [...participants, newParticipant],
      events: [
        ...session.events,
        {
          type: "participant_joined",
          timestamp: now,
          data: { participantId, displayName: args.displayName },
        },
      ],
      updatedAt: now,
    });

    return {
      participantId,
      isRejoining: false,
    };
  },
});

/**
 * Start the multiplayer game (host only)
 */
export const startMultiplayerGame = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    hostUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.hostUserId !== args.hostUserId) {
      throw new Error("Only the host can start the game");
    }

    if (session.status !== "waiting") {
      throw new Error("Game has already started");
    }

    const now = Date.now();

    await ctx.db.patch(args.gameSessionId, {
      status: "in_progress",
      startedAt: now,
      events: [
        ...session.events,
        {
          type: "game_started",
          timestamp: now,
          data: {
            participantCount: session.participants?.length || 1,
            startedBy: "host",
          },
        },
      ],
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Start the game as a participant (when allowSelfStart is enabled)
 */
export const selfStartGame = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.allowSelfStart) {
      throw new Error("Self-start is not enabled for this session");
    }

    if (session.status !== "waiting") {
      throw new Error("Game has already started");
    }

    // Verify participant exists
    const participant = session.participants?.find(
      (p) => p.participantId === args.participantId
    );
    if (!participant) {
      throw new Error("Participant not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.gameSessionId, {
      status: "in_progress",
      startedAt: now,
      events: [
        ...session.events,
        {
          type: "game_started",
          timestamp: now,
          data: {
            participantCount: session.participants?.length || 1,
            startedBy: args.participantId,
          },
        },
      ],
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Update shared game state (for real-time sync)
 */
export const updateSharedGameState = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    participantId: v.string(),
    syncedItemIndex: v.optional(v.number()),
    answers: v.optional(v.any()),
    currentTurn: v.optional(v.string()),
    gameState: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify participant exists
    const participant = session.participants?.find(
      (p) => p.participantId === args.participantId
    );
    if (!participant) {
      throw new Error("Participant not found");
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      updatedAt: now,
    };

    // Update shared state
    if (
      args.syncedItemIndex !== undefined ||
      args.answers !== undefined ||
      args.currentTurn !== undefined
    ) {
      updates.sharedState = {
        ...session.sharedState,
        ...(args.syncedItemIndex !== undefined && {
          syncedItemIndex: args.syncedItemIndex,
        }),
        ...(args.answers !== undefined && { answers: args.answers }),
        ...(args.currentTurn !== undefined && { currentTurn: args.currentTurn }),
      };
    }

    // Update game state
    if (args.gameState !== undefined) {
      updates.gameState = args.gameState;
    }

    // Update current item index
    if (args.syncedItemIndex !== undefined) {
      updates.currentItemIndex = args.syncedItemIndex;
    }

    // Update participant's last seen
    updates.participants = session.participants?.map((p) =>
      p.participantId === args.participantId
        ? { ...p, lastSeenAt: now, isActive: true }
        : p
    );

    await ctx.db.patch(args.gameSessionId, updates);

    return { success: true };
  },
});

/**
 * Update participant heartbeat (for presence tracking)
 */
export const updateParticipantPresence = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const now = Date.now();
    const updatedParticipants = session.participants?.map((p) =>
      p.participantId === args.participantId
        ? { ...p, lastSeenAt: now, isActive: true }
        : p
    );

    await ctx.db.patch(args.gameSessionId, {
      participants: updatedParticipants,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Update cursor position for a participant
 */
export const updateCursorPosition = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    participantId: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const now = Date.now();
    const currentCursors = session.sharedState?.cursors || {};

    await ctx.db.patch(args.gameSessionId, {
      sharedState: {
        ...session.sharedState,
        cursors: {
          ...currentCursors,
          [args.participantId]: {
            x: args.x,
            y: args.y,
            lastUpdate: now,
          },
        },
      },
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Update player input (what they're typing) for real-time sync
 */
export const updatePlayerInput = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    participantId: v.string(),
    value: v.string(),
    itemIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const now = Date.now();
    const currentInputs = session.sharedState?.inputs || {};

    await ctx.db.patch(args.gameSessionId, {
      sharedState: {
        ...session.sharedState,
        inputs: {
          ...currentInputs,
          [args.participantId]: {
            value: args.value,
            itemIndex: args.itemIndex,
            lastUpdate: now,
          },
        },
      },
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Update element positions for drag-and-drop sync
 */
export const updateElementPositions = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    participantId: v.string(),
    itemIndex: v.number(),
    positions: v.array(
      v.object({
        id: v.string(),
        x: v.number(),
        y: v.number(),
        slot: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if this participant has control
    const controlMode = session.sharedState?.controlMode || "free";
    const controlledBy = session.sharedState?.controlledBy;

    if (controlMode === "single" && controlledBy && controlledBy !== args.participantId) {
      return { success: false, error: "No control" };
    }

    if (controlMode === "host_only") {
      const isHost = session.participants?.find(
        (p) => p.participantId === args.participantId
      )?.isHost;
      if (!isHost) {
        return { success: false, error: "Host only" };
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.gameSessionId, {
      sharedState: {
        ...session.sharedState,
        elements: {
          itemIndex: args.itemIndex,
          positions: args.positions,
          lastUpdate: now,
          updatedBy: args.participantId,
        },
      },
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Update crossword grid state for real-time sync
 */
export const updateCrosswordGrid = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    participantId: v.string(),
    itemIndex: v.number(),
    gridState: v.string(), // JSON stringified grid
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if this participant has control
    const controlMode = session.sharedState?.controlMode || "free";
    const controlledBy = session.sharedState?.controlledBy;

    if (controlMode === "single" && controlledBy && controlledBy !== args.participantId) {
      return { success: false, error: "No control" };
    }

    if (controlMode === "host_only") {
      const isHost = session.participants?.find(
        (p) => p.participantId === args.participantId
      )?.isHost;
      if (!isHost) {
        return { success: false, error: "Host only" };
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.gameSessionId, {
      sharedState: {
        ...session.sharedState,
        crosswordGrid: {
          itemIndex: args.itemIndex,
          gridState: args.gridState,
          lastUpdate: now,
          updatedBy: args.participantId,
        },
      },
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Grant control to a specific participant
 */
export const grantControl = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    hostParticipantId: v.string(),
    targetParticipantId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify caller is host
    const caller = session.participants?.find(
      (p) => p.participantId === args.hostParticipantId
    );
    if (!caller?.isHost) {
      throw new Error("Only host can grant control");
    }

    const now = Date.now();

    await ctx.db.patch(args.gameSessionId, {
      sharedState: {
        ...session.sharedState,
        controlledBy: args.targetParticipantId,
        controlMode: "single",
      },
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Set control mode for the session
 */
export const setControlMode = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    hostParticipantId: v.string(),
    controlMode: v.union(
      v.literal("host_only"),
      v.literal("single"),
      v.literal("free")
    ),
    controlledBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify caller is host
    const caller = session.participants?.find(
      (p) => p.participantId === args.hostParticipantId
    );
    if (!caller?.isHost) {
      throw new Error("Only host can change control mode");
    }

    const now = Date.now();

    // Build sharedState update - only include controlledBy if it has a value
    const sharedStateUpdate: Record<string, unknown> = {
      ...session.sharedState,
      controlMode: args.controlMode,
    };

    if (args.controlledBy) {
      sharedStateUpdate.controlledBy = args.controlledBy;
    } else {
      // Remove controlledBy when switching to free mode
      delete sharedStateUpdate.controlledBy;
    }

    await ctx.db.patch(args.gameSessionId, {
      sharedState: sharedStateUpdate,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Leave a shared session
 */
export const leaveSharedSession = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const participant = session.participants?.find(
      (p) => p.participantId === args.participantId
    );

    if (!participant) {
      throw new Error("Participant not found");
    }

    const now = Date.now();

    // If host leaves, end the session
    if (participant.isHost) {
      await ctx.db.patch(args.gameSessionId, {
        status: "abandoned",
        completedAt: now,
        events: [
          ...session.events,
          {
            type: "host_left",
            timestamp: now,
            data: {},
          },
        ],
        updatedAt: now,
      });
      return { sessionEnded: true };
    }

    // Mark participant as inactive
    const updatedParticipants = session.participants?.map((p) =>
      p.participantId === args.participantId
        ? { ...p, isActive: false, lastSeenAt: now }
        : p
    );

    await ctx.db.patch(args.gameSessionId, {
      participants: updatedParticipants,
      events: [
        ...session.events,
        {
          type: "participant_left",
          timestamp: now,
          data: { participantId: args.participantId },
        },
      ],
      updatedAt: now,
    });

    return { sessionEnded: false };
  },
});

/**
 * End shared session (host only)
 */
export const endSharedSession = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    hostUserId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.hostUserId !== args.hostUserId) {
      throw new Error("Only the host can end the session");
    }

    const now = Date.now();
    const totalTimeSeconds = Math.round((now - session.startedAt) / 1000);

    await ctx.db.patch(args.gameSessionId, {
      status: "completed",
      completedAt: now,
      totalTimeSeconds,
      events: [
        ...session.events,
        {
          type: "session_ended",
          timestamp: now,
          data: { reason: args.reason || "host_ended" },
        },
      ],
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Revoke a share token (make link invalid)
 */
export const revokeShareToken = mutation({
  args: {
    gameSessionId: v.id("gameSessions"),
    hostUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.gameSessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.hostUserId !== args.hostUserId) {
      throw new Error("Only the host can revoke the token");
    }

    await ctx.db.patch(args.gameSessionId, {
      tokenExpiresAt: Date.now(), // Expire immediately
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get active shared sessions for a host
 */
export const getHostSharedSessions = query({
  args: {
    hostUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_host", (q) => q.eq("hostUserId", args.hostUserId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .collect();

    // Fetch game details for each session
    const sessionsWithGames = await Promise.all(
      sessions.map(async (session) => {
        const game = await ctx.db.get(session.gameId);
        return {
          ...session,
          game,
          activeParticipants:
            session.participants?.filter((p) => p.isActive).length || 0,
        };
      })
    );

    return sessionsWithGames;
  },
});
