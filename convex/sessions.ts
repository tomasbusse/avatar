import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const createSession = mutation({
  args: {
    avatarId: v.id("avatars"),
    lessonId: v.optional(v.id("lessons")),
    roomName: v.string(),
    type: v.union(
      v.literal("structured_lesson"),
      v.literal("quick_practice"),
      v.literal("free_conversation"),
      v.literal("vocabulary_review"),
      v.literal("pronunciation_drill"),
      v.literal("presentation")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!student) throw new Error("Student profile not found");

    const now = Date.now();

    return await ctx.db.insert("sessions", {
      studentId: student._id,
      avatarId: args.avatarId,
      lessonId: args.lessonId,
      roomName: args.roomName,
      startedAt: now,
      status: "waiting",
      type: args.type,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const getSessionByRoom = query({
  args: { roomName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_room", (q) => q.eq("roomName", args.roomName))
      .unique();
  },
});

export const updateSessionStatus = mutation({
  args: {
    sessionId: v.id("sessions"),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const endSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    metrics: v.optional(
      v.object({
        wordsSpoken: v.number(),
        newVocabulary: v.number(),
        errorsCorreected: v.number(),
        germanSupportUsed: v.number(),
        avgResponseLatency: v.optional(v.number()),
      })
    ),
    rating: v.optional(v.number()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const now = Date.now();
    const durationMinutes = Math.round((now - session.startedAt) / 60000);

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endedAt: now,
      durationMinutes,
      metrics: args.metrics,
      rating: args.rating,
      feedback: args.feedback,
      updatedAt: now,
    });

    const student = await ctx.db.get(session.studentId);
    if (student) {
      await ctx.db.patch(student._id, {
        totalLessonsCompleted: student.totalLessonsCompleted + 1,
        totalMinutesPracticed: student.totalMinutesPracticed + durationMinutes,
        lastLessonAt: now,
        updatedAt: now,
      });
    }
  },
});

// End session by room name - called by Python agent when LiveKit room closes
export const endSessionByRoom = mutation({
  args: {
    roomName: v.string(),
    reason: v.optional(v.string()), // "completed", "participant_left", "room_closed", etc.
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_room", (q) => q.eq("roomName", args.roomName))
      .unique();

    if (!session) {
      // Session might have already been ended - this is fine
      return { success: false, message: "Session not found or already ended" };
    }

    // Only end if session is still active/waiting
    if (session.status !== "active" && session.status !== "waiting") {
      return {
        success: false,
        message: `Session already ${session.status}`,
      };
    }

    const now = Date.now();
    const durationMinutes = session.startedAt
      ? Math.round((now - session.startedAt) / 60000)
      : 0;

    // Mark as completed (or abandoned if something went wrong)
    const reason = args.reason || "completed";
    const status = reason === "completed" ? "completed" : "completed";

    await ctx.db.patch(session._id, {
      status,
      endedAt: now,
      durationMinutes,
      feedback: reason !== "completed" ? `Session ended: ${reason}` : undefined,
      updatedAt: now,
    });

    // Update student stats
    const student = await ctx.db.get(session.studentId);
    if (student && durationMinutes > 0) {
      await ctx.db.patch(student._id, {
        totalLessonsCompleted: student.totalLessonsCompleted + 1,
        totalMinutesPracticed: student.totalMinutesPracticed + durationMinutes,
        lastLessonAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      sessionId: session._id,
      durationMinutes,
      status,
    };
  },
});

export const addTranscriptEntry = mutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.union(v.literal("student"), v.literal("avatar"), v.literal("system")),
    content: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const entry = {
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      language: args.language,
    };

    const transcript = session.transcript ?? [];
    transcript.push(entry);

    await ctx.db.patch(args.sessionId, {
      transcript,
      updatedAt: Date.now(),
    });
  },
});

export const listStudentSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!student) return [];

    return await ctx.db
      .query("sessions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(args.limit ?? 10);
  },
});

// Start presentation mode for a session
export const startPresentationMode = mutation({
  args: {
    sessionId: v.id("sessions"),
    presentationId: v.id("presentations"),
    controlledBy: v.optional(
      v.union(
        v.literal("avatar"),
        v.literal("student"),
        v.literal("shared")
      )
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) throw new Error("Presentation not found");

    await ctx.db.patch(args.sessionId, {
      presentationMode: {
        active: true,
        presentationId: args.presentationId,
        currentSlideIndex: 0,
        startedAt: Date.now(),
        controlledBy: args.controlledBy ?? "shared",
      },
      updatedAt: Date.now(),
    });

    return { success: true, totalSlides: presentation.totalSlides };
  },
});

// Update current slide index in presentation mode
export const updateSlideIndex = mutation({
  args: {
    sessionId: v.id("sessions"),
    slideIndex: v.number(),
    triggeredBy: v.optional(
      v.union(v.literal("avatar"), v.literal("student"))
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.presentationMode?.active) {
      throw new Error("Presentation mode not active");
    }

    // Get presentation to validate slide index
    const presentation = await ctx.db.get(session.presentationMode.presentationId!);
    if (!presentation) throw new Error("Presentation not found");

    // Clamp slide index to valid range
    const validIndex = Math.max(0, Math.min(args.slideIndex, presentation.totalSlides - 1));

    await ctx.db.patch(args.sessionId, {
      presentationMode: {
        ...session.presentationMode,
        currentSlideIndex: validIndex,
      },
      updatedAt: Date.now(),
    });

    return { slideIndex: validIndex, totalSlides: presentation.totalSlides };
  },
});

// End presentation mode for a session
export const endPresentationMode = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      presentationMode: {
        active: false,
        presentationId: session.presentationMode?.presentationId,
        currentSlideIndex: session.presentationMode?.currentSlideIndex ?? 0,
        startedAt: session.presentationMode?.startedAt,
        controlledBy: session.presentationMode?.controlledBy,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get session with presentation content (for avatar context)
export const getSessionWithPresentation = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    let presentation = null;
    if (session.presentationMode?.presentationId) {
      presentation = await ctx.db.get(session.presentationMode.presentationId);

      // Get fresh slide URLs
      if (presentation) {
        const slidesWithUrls = await Promise.all(
          presentation.slides.map(async (slide) => ({
            ...slide,
            url: await ctx.storage.getUrl(slide.storageId),
          }))
        );
        presentation = { ...presentation, slides: slidesWithUrls };
      }
    }

    return {
      session,
      presentation,
      currentSlide: presentation?.slideContent?.[session.presentationMode?.currentSlideIndex ?? 0],
    };
  },
});

// Create a session from a structured lesson (for public lesson links)
// Supports both authenticated users and anonymous guests
export const createFromStructuredLesson = mutation({
  args: {
    structuredLessonId: v.id("structuredLessons"),
    roomName: v.string(),
    guestName: v.optional(v.string()), // For anonymous users
  },
  handler: async (ctx, args) => {
    // Get the structured lesson
    const structuredLesson = await ctx.db.get(args.structuredLessonId);
    if (!structuredLesson) {
      throw new Error("Structured lesson not found");
    }

    // Check authentication requirements
    const identity = await ctx.auth.getUserIdentity();

    if (structuredLesson.requiresAuth && !identity) {
      throw new Error("Authentication required for this lesson");
    }

    let studentId;

    if (identity) {
      // Authenticated user - get or create student profile
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!user) {
        throw new Error("User not found");
      }

      let student = await ctx.db
        .query("students")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      // Auto-create student profile if needed
      if (!student) {
        const now = Date.now();
        studentId = await ctx.db.insert("students", {
          userId: user._id,
          nativeLanguage: "de",
          targetLanguage: "en",
          currentLevel: "A2",
          learningGoal: "personal",
          totalLessonsCompleted: 0,
          totalMinutesPracticed: 0,
          currentStreak: 0,
          longestStreak: 0,
          preferences: {
            bilingualMode: "adaptive",
            lessonDuration: 30,
          },
          onboardingCompleted: false,
          assessmentCompleted: false,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        studentId = student._id;
      }
    } else {
      // Anonymous user - create a temporary guest student profile
      // Note: In production, you might want to handle this differently
      // For now, we create a guest user and student profile
      const now = Date.now();
      const guestName = args.guestName || `Guest_${Date.now().toString(36)}`;

      // Create guest user
      const guestUserId = await ctx.db.insert("users", {
        clerkId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: `guest_${Date.now()}@guest.local`,
        firstName: guestName,
        role: "guest",
        status: "active",
        loginCount: 1,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      });

      // Create guest student
      studentId = await ctx.db.insert("students", {
        userId: guestUserId,
        nativeLanguage: "de",
        targetLanguage: "en",
        currentLevel: "A2",
        learningGoal: "personal",
        totalLessonsCompleted: 0,
        totalMinutesPracticed: 0,
        currentStreak: 0,
        longestStreak: 0,
        preferences: {
          bilingualMode: "adaptive",
          lessonDuration: 30,
        },
        onboardingCompleted: false,
        assessmentCompleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    const now = Date.now();

    // Determine presentation ID (either from lesson or from knowledge content)
    let presentationId = structuredLesson.presentationId;

    // If no direct presentationId, check if knowledge content has one
    if (!presentationId && structuredLesson.knowledgeContentId) {
      const knowledgeContent = await ctx.db.get(structuredLesson.knowledgeContentId);
      if (knowledgeContent?.presentationId) {
        presentationId = knowledgeContent.presentationId;
      }
    }

    // Create the session with pre-configured presentation mode
    const sessionId = await ctx.db.insert("sessions", {
      studentId,
      avatarId: structuredLesson.avatarId,
      presentationId: presentationId,
      structuredLessonId: args.structuredLessonId,
      roomName: args.roomName,
      guestName: args.guestName, // Store guest name for open access lessons
      startedAt: now,
      status: "waiting",
      type: structuredLesson.sessionType,
      // Pre-configure presentation mode if we have a presentation
      presentationMode: presentationId
        ? {
            active: true,
            presentationId: presentationId,
            currentSlideIndex: 0,
            startedAt: now,
            controlledBy: "avatar", // Avatar controls slides in structured lessons
          }
        : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Increment the session count on the structured lesson
    await ctx.db.patch(args.structuredLessonId, {
      totalSessions: structuredLesson.totalSessions + 1,
      updatedAt: now,
    });

    return {
      sessionId,
      presentationId,
      avatarId: structuredLesson.avatarId,
      hasPresentation: !!presentationId,
    };
  },
});

// ============================================
// GAME MODE MUTATIONS
// ============================================

// Start game mode for a session
export const startGameMode = mutation({
  args: {
    sessionId: v.id("sessions"),
    gameId: v.id("wordGames"),
    controlledBy: v.optional(
      v.union(
        v.literal("avatar"),
        v.literal("student"),
        v.literal("shared")
      )
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Create a game session record
    const now = Date.now();
    const gameSessionId = await ctx.db.insert("gameSessions", {
      gameId: args.gameId,
      sessionId: args.sessionId,
      studentId: session.studentId,
      status: "in_progress",
      gameState: {},
      currentItemIndex: 0,
      totalItems: 1, // Will be updated by the frontend
      correctAnswers: 0,
      incorrectAnswers: 0,
      hintsUsed: 0,
      startedAt: now,
      events: [],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.sessionId, {
      gameMode: {
        active: true,
        gameId: args.gameId,
        gameSessionId,
        currentItemIndex: 0,
        startedAt: now,
        controlledBy: args.controlledBy ?? "shared",
      },
      updatedAt: now,
    });

    return {
      success: true,
      gameSessionId,
      gameType: game.type,
      gameTitle: game.title,
    };
  },
});

// Update current item index in game mode
export const updateGameItemIndex = mutation({
  args: {
    sessionId: v.id("sessions"),
    itemIndex: v.number(),
    triggeredBy: v.optional(
      v.union(v.literal("avatar"), v.literal("student"))
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.gameMode?.active) {
      throw new Error("Game mode not active");
    }

    await ctx.db.patch(args.sessionId, {
      gameMode: {
        ...session.gameMode,
        currentItemIndex: args.itemIndex,
      },
      updatedAt: Date.now(),
    });

    // Also update the game session record
    if (session.gameMode.gameSessionId) {
      await ctx.db.patch(session.gameMode.gameSessionId, {
        currentItemIndex: args.itemIndex,
        updatedAt: Date.now(),
      });
    }

    return { itemIndex: args.itemIndex };
  },
});

// Update game session progress
export const updateGameProgress = mutation({
  args: {
    sessionId: v.id("sessions"),
    correctAnswers: v.number(),
    incorrectAnswers: v.number(),
    hintsUsed: v.number(),
    itemIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.gameMode?.gameSessionId) {
      throw new Error("No game session");
    }

    await ctx.db.patch(session.gameMode.gameSessionId, {
      correctAnswers: args.correctAnswers,
      incorrectAnswers: args.incorrectAnswers,
      hintsUsed: args.hintsUsed,
      currentItemIndex: args.itemIndex,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// End game mode for a session
export const endGameMode = mutation({
  args: {
    sessionId: v.id("sessions"),
    stars: v.optional(v.number()),
    scorePercent: v.optional(v.number()),
    totalCorrect: v.optional(v.number()),
    totalItems: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const now = Date.now();

    // Update game session record if exists
    if (session.gameMode?.gameSessionId) {
      const gameSession = await ctx.db.get(session.gameMode.gameSessionId);
      if (gameSession) {
        await ctx.db.patch(session.gameMode.gameSessionId, {
          status: "completed",
          completedAt: now,
          totalTimeSeconds: Math.round((now - gameSession.startedAt) / 1000),
          stars: args.stars,
          scorePercent: args.scorePercent,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.sessionId, {
      gameMode: {
        active: false,
        gameId: session.gameMode?.gameId,
        gameSessionId: session.gameMode?.gameSessionId,
        currentItemIndex: session.gameMode?.currentItemIndex ?? 0,
        startedAt: session.gameMode?.startedAt,
        controlledBy: session.gameMode?.controlledBy,
      },
      updatedAt: now,
    });

    return { success: true };
  },
});

// Get session with game content (for avatar context)
export const getSessionWithGame = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    let game = null;
    let gameSession = null;

    if (session.gameMode?.gameId) {
      game = await ctx.db.get(session.gameMode.gameId);
    }

    if (session.gameMode?.gameSessionId) {
      gameSession = await ctx.db.get(session.gameMode.gameSessionId);
    }

    return {
      session,
      game,
      gameSession,
      currentItemIndex: session.gameMode?.currentItemIndex ?? 0,
    };
  },
});

// =============================================================================
// SESSION CLEANUP - Fix orphaned sessions that weren't properly closed
// =============================================================================

/**
 * Clean up stale sessions that have been "active" or "waiting" for too long.
 * These are orphaned sessions where the room closed but endSession was never called.
 */
export const cleanupStaleSessions = mutation({
  args: {
    maxAgeHours: v.optional(v.number()), // Default: 24 hours
    dryRun: v.optional(v.boolean()), // If true, just return count without modifying
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Only admins can cleanup sessions");
    }

    const maxAgeHours = args.maxAgeHours ?? 24;
    const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const dryRun = args.dryRun ?? false;

    // Find all sessions that are still "active" or "waiting" but older than cutoff
    const staleSessions = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "waiting")
          ),
          q.lt(q.field("startedAt"), cutoffTime)
        )
      )
      .collect();

    if (dryRun) {
      return {
        dryRun: true,
        staleSessionCount: staleSessions.length,
        oldestSession: staleSessions.length > 0
          ? new Date(Math.min(...staleSessions.map((s) => s.startedAt))).toISOString()
          : null,
        message: `Found ${staleSessions.length} stale sessions older than ${maxAgeHours} hours`,
      };
    }

    // Mark all stale sessions as abandoned
    const now = Date.now();
    for (const session of staleSessions) {
      const durationMinutes = Math.round((now - session.startedAt) / 60000);
      await ctx.db.patch(session._id, {
        status: "abandoned",
        endedAt: now,
        durationMinutes,
        updatedAt: now,
      });
    }

    return {
      dryRun: false,
      cleanedCount: staleSessions.length,
      message: `Marked ${staleSessions.length} stale sessions as abandoned`,
    };
  },
});

/**
 * Force-end a specific session (admin only).
 * Useful for manually closing stuck sessions.
 */
export const forceEndSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Only admins can force-end sessions");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    if (session.status === "completed" || session.status === "abandoned") {
      return { success: false, message: "Session already ended" };
    }

    const now = Date.now();
    const durationMinutes = Math.round((now - session.startedAt) / 60000);

    await ctx.db.patch(args.sessionId, {
      status: "abandoned",
      endedAt: now,
      durationMinutes,
      updatedAt: now,
      // Store reason in feedback field
      feedback: args.reason ? `Force-ended: ${args.reason}` : "Force-ended by admin",
    });

    return { success: true, message: "Session force-ended" };
  },
});

/**
 * Internal mutation for cron job - cleans up stale sessions without auth.
 * Called automatically by the daily cron job at 6:00 AM UTC.
 */
export const cleanupStaleSessionsCron = internalMutation({
  args: {},
  handler: async (ctx) => {
    const maxAgeHours = 24; // Sessions older than 24 hours
    const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;

    // Find all sessions that are still "active" or "waiting" but older than cutoff
    const staleSessions = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "waiting")
          ),
          q.lt(q.field("startedAt"), cutoffTime)
        )
      )
      .collect();

    if (staleSessions.length === 0) {
      console.log("[Cron] No stale sessions to clean up");
      return { cleanedCount: 0 };
    }

    // Mark all stale sessions as abandoned
    const now = Date.now();
    for (const session of staleSessions) {
      const durationMinutes = Math.round((now - session.startedAt) / 60000);
      await ctx.db.patch(session._id, {
        status: "abandoned",
        endedAt: now,
        durationMinutes,
        feedback: "Auto-cleaned by daily cron job",
        updatedAt: now,
      });
    }

    console.log(`[Cron] Cleaned up ${staleSessions.length} stale sessions`);
    return { cleanedCount: staleSessions.length };
  },
});

// ============================================
// AVATAR-BASED SESSION MANAGEMENT
// ============================================

/**
 * Get all active/waiting sessions for a specific avatar
 * Used by admin UI to show sessions before avatar deletion
 */
export const getActiveSessionsByAvatar = query({
  args: {
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "waiting")
        )
      )
      .collect();

    // Include student info for display
    const sessionsWithStudents = await Promise.all(
      sessions.map(async (session) => {
        const student = await ctx.db.get(session.studentId);
        const user = student ? await ctx.db.get(student.userId) : null;
        return {
          ...session,
          studentName: session.guestName || user?.firstName || "Unknown",
          durationMinutes: session.startedAt
            ? Math.round((Date.now() - session.startedAt) / 60000)
            : 0,
        };
      })
    );

    return sessionsWithStudents;
  },
});

/**
 * End all active sessions for a specific avatar
 * Admin only - used for cleanup before avatar deletion
 */
export const endSessionsForAvatar = mutation({
  args: {
    avatarId: v.id("avatars"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const now = Date.now();
    const reason = args.reason || "admin_cleanup";

    // Get all active/waiting sessions for this avatar
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "waiting")
        )
      )
      .collect();

    // End each session
    for (const session of activeSessions) {
      const durationMinutes = session.startedAt
        ? Math.round((now - session.startedAt) / 60000)
        : 0;

      await ctx.db.patch(session._id, {
        status: "abandoned",
        endedAt: now,
        durationMinutes,
        feedback: `Session ended by admin: ${reason}`,
        updatedAt: now,
      });
    }

    return {
      endedCount: activeSessions.length,
      avatarId: args.avatarId,
    };
  },
});

/**
 * Cleanup stale sessions for a specific avatar
 * Sessions older than 1 hour with status waiting/active are considered stale
 */
export const cleanupStaleSessionsForAvatar = mutation({
  args: {
    avatarId: v.id("avatars"),
    maxAgeMinutes: v.optional(v.number()), // Default: 60 minutes
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const now = Date.now();
    const maxAgeMinutes = args.maxAgeMinutes ?? 60; // Default 1 hour
    const staleThreshold = now - maxAgeMinutes * 60 * 1000;

    // Get stale sessions for this avatar
    const staleSessions = await ctx.db
      .query("sessions")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "waiting")
          ),
          q.lt(q.field("startedAt"), staleThreshold)
        )
      )
      .collect();

    // End each stale session
    for (const session of staleSessions) {
      const durationMinutes = session.startedAt
        ? Math.round((now - session.startedAt) / 60000)
        : 0;

      await ctx.db.patch(session._id, {
        status: "abandoned",
        endedAt: now,
        durationMinutes,
        feedback: `Stale session cleanup (inactive for ${maxAgeMinutes}+ minutes)`,
        updatedAt: now,
      });
    }

    return {
      cleanedCount: staleSessions.length,
      avatarId: args.avatarId,
    };
  },
});

/**
 * Delete all historical (completed/abandoned) sessions for an avatar.
 * This permanently removes session records - use with caution.
 * Active/waiting sessions are NOT deleted.
 */
export const deleteHistoricalSessionsForAvatar = mutation({
  args: {
    avatarId: v.id("avatars"),
    confirmDelete: v.boolean(), // Require explicit confirmation
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    if (!args.confirmDelete) {
      throw new Error("Deletion not confirmed");
    }

    // Get all completed/abandoned sessions for this avatar
    const historicalSessions = await ctx.db
      .query("sessions")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "completed"),
          q.eq(q.field("status"), "abandoned")
        )
      )
      .collect();

    // Delete each session
    for (const session of historicalSessions) {
      await ctx.db.delete(session._id);
    }

    return {
      deletedCount: historicalSessions.length,
      avatarId: args.avatarId,
    };
  },
});

/**
 * Get session statistics for an avatar (for UI display)
 */
export const getSessionStatsForAvatar = query({
  args: {
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .collect();

    return {
      total: sessions.length,
      active: sessions.filter((s) => s.status === "active").length,
      waiting: sessions.filter((s) => s.status === "waiting").length,
      completed: sessions.filter((s) => s.status === "completed").length,
      abandoned: sessions.filter((s) => s.status === "abandoned").length,
      historical: sessions.filter(
        (s) => s.status === "completed" || s.status === "abandoned"
      ).length,
    };
  },
});

// ============================================
// SESSION WITH MATERIAL CONTEXT
// ============================================

/**
 * Get session with full material context for avatar initialization.
 * Returns session data plus:
 * - Available slides with metadata (titles, types, teaching prompts)
 * - Timer configuration (from avatar or lesson override)
 * - Structured lesson info if applicable
 */
export const getSessionWithMaterialContext = query({
  args: {
    sessionId: v.optional(v.id("sessions")),
    roomName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get session by ID or room name
    let session = null;
    if (args.sessionId) {
      session = await ctx.db.get(args.sessionId);
    } else if (args.roomName) {
      const roomName = args.roomName; // Narrow type for TypeScript
      session = await ctx.db
        .query("sessions")
        .withIndex("by_room", (q) => q.eq("roomName", roomName))
        .unique();
    }

    if (!session) return null;

    // Get the avatar for session config
    const avatar = await ctx.db.get(session.avatarId);
    if (!avatar) return null;

    // Get structured lesson if exists
    let structuredLesson = null;
    let knowledgeContent = null;
    let wordGame = null;
    let slideMetadata: Array<{
      index: number;
      title: string | undefined;
      type: string;
      teachingPrompt: string | undefined;
    }> = [];

    if (session.structuredLessonId) {
      structuredLesson = await ctx.db.get(session.structuredLessonId);

      // Get knowledge content for slide metadata
      if (structuredLesson?.knowledgeContentId) {
        knowledgeContent = await ctx.db.get(structuredLesson.knowledgeContentId);

        // Extract slide metadata from HTML slides
        if (knowledgeContent?.htmlSlides) {
          slideMetadata = knowledgeContent.htmlSlides.map((slide) => ({
            index: slide.index,
            title: slide.title,
            type: slide.type,
            teachingPrompt: slide.teachingPrompt,
          }));
        }
      }

      // Get word game if linked to lesson
      if (structuredLesson?.wordGameId) {
        const game = await ctx.db.get(structuredLesson.wordGameId);
        if (game) {
          wordGame = {
            _id: game._id,
            title: game.title,
            slug: game.slug,
            type: game.type,
            category: game.category,
            level: game.level,
            description: game.description,
            instructions: game.instructions,
          };
        }
      }
    }

    // Determine timer configuration (lesson overrides avatar defaults)
    let timerConfig = null;
    const avatarDuration = avatar.sessionConfig?.defaultDurationMinutes;
    const lessonDuration = structuredLesson?.durationMinutes;
    const targetDuration = lessonDuration ?? avatarDuration;

    if (targetDuration) {
      const avatarBuffer = avatar.sessionConfig?.wrapUpBufferMinutes ?? 2;
      const lessonBuffer = structuredLesson?.wrapUpBufferMinutes;
      const wrapUpBuffer = lessonBuffer ?? avatarBuffer;

      timerConfig = {
        targetDurationMinutes: targetDuration,
        wrapUpBufferMinutes: wrapUpBuffer,
        autoEnd: avatar.sessionConfig?.autoEnd ?? true,
      };
    }

    return {
      session,
      avatar: {
        _id: avatar._id,
        name: avatar.name,
        sessionConfig: avatar.sessionConfig,
      },
      structuredLesson: structuredLesson
        ? {
            _id: structuredLesson._id,
            title: structuredLesson.title,
            description: structuredLesson.description,
            durationMinutes: structuredLesson.durationMinutes,
            wrapUpBufferMinutes: structuredLesson.wrapUpBufferMinutes,
          }
        : null,
      materialContext: {
        hasSlides: slideMetadata.length > 0,
        slideCount: slideMetadata.length,
        slides: slideMetadata,
        knowledgeContentId: knowledgeContent?._id ?? null,
        // Word game info
        hasGame: !!wordGame,
        game: wordGame,
      },
      timerConfig,
    };
  },
});

/**
 * Update session timer config (e.g., when wrap-up starts)
 */
export const updateSessionTimerConfig = mutation({
  args: {
    sessionId: v.id("sessions"),
    timerConfig: v.object({
      targetDurationMinutes: v.number(),
      wrapUpBufferMinutes: v.number(),
      wrapUpStartedAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      timerConfig: args.timerConfig,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// ADMIN: ACTIVE SESSION MANAGEMENT
// ============================================

/**
 * Get all active sessions across the platform (admin only)
 * Used in admin dashboard to monitor and manage live sessions
 */
export const getAllActiveSessions = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all sessions with status 'active' or 'waiting' or 'in_progress'
    const activeSessions = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .order("desc")
      .collect();

    // Enrich with avatar and student info
    const enrichedSessions = await Promise.all(
      activeSessions.map(async (session) => {
        const avatar = session.avatarId ? await ctx.db.get(session.avatarId) : null;
        const student = session.studentId ? await ctx.db.get(session.studentId) : null;
        const user = student?.userId ? await ctx.db.get(student.userId) : null;
        const lesson = session.structuredLessonId
          ? await ctx.db.get(session.structuredLessonId)
          : null;

        const durationMinutes = session.startedAt
          ? Math.round((now - session.startedAt) / 60000)
          : session.createdAt
            ? Math.round((now - session.createdAt) / 60000)
            : 0;

        return {
          _id: session._id,
          roomName: session.roomName,
          status: session.status,
          type: session.type,
          createdAt: session.createdAt,
          startedAt: session.startedAt,
          durationMinutes,
          avatarName: avatar?.name || "Unknown",
          studentName: session.guestName || user?.firstName || "Unknown",
          lessonTitle: lesson?.title || null,
          isGuest: session.isGuest || false,
        };
      })
    );

    return enrichedSessions;
  },
});

// ============================================
// WEB SEARCH RESULTS
// ============================================

/**
 * Update web search results for a session
 * Called when user joins or when admin clicks "Fetch Now"
 */
export const updateWebSearchResults = mutation({
  args: {
    sessionId: v.id("sessions"),
    webSearchResults: v.object({
      fetchedAt: v.number(),
      query: v.string(),
      answer: v.optional(v.string()),
      searchDepth: v.optional(v.string()), // "basic" | "advanced" | "detailed"
      llmRewrittenContent: v.optional(v.string()), // LLM-rewritten clean journalist prose
      results: v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          content: v.string(),
          rawContent: v.optional(v.string()), // Full article content (detailed mode)
          publishedDate: v.optional(v.string()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      webSearchResults: args.webSearchResults,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get web search results for a session (used by agent)
 */
export const getWebSearchResults = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    return session.webSearchResults ?? null;
  },
});

