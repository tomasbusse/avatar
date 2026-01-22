import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get games from student's enrolled lessons
 * Returns games linked to lessons the student is enrolled in, with their best scores
 */
export const getGamesFromEnrolledLessons = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Get student profile
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!student) {
      return [];
    }

    // Get student's enrollments (active ones)
    const enrollments = await ctx.db
      .query("lessonEnrollments")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .filter((q) => q.neq(q.field("status"), "dropped"))
      .collect();

    if (enrollments.length === 0) {
      return [];
    }

    // Get lesson IDs
    const lessonIds = enrollments.map((e) => e.lessonId);

    // Get all game-lesson links for these lessons
    const allLinks: Array<{
      gameId: Id<"wordGames">;
      lessonId: Id<"structuredLessons">;
      order: number;
    }> = [];

    for (const lessonId of lessonIds) {
      const links = await ctx.db
        .query("gameLessonLinks")
        .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
        .collect();
      allLinks.push(...links);
    }

    if (allLinks.length === 0) {
      return [];
    }

    // Get unique game IDs
    const uniqueGameIds = Array.from(new Set(allLinks.map((l) => l.gameId)));

    // Get all published games at once (for proper typing)
    const allGames = await ctx.db
      .query("wordGames")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Create a map for quick lookup
    const gameMap = new Map(allGames.map((g) => [g._id.toString(), g]));

    // Fetch games and student's best scores
    const gamesWithScores = await Promise.all(
      uniqueGameIds.map(async (gameId) => {
        const game = gameMap.get(gameId.toString());
        if (!game) {
          return null;
        }

        // Get student's best session for this game
        const sessions = await ctx.db
          .query("gameSessions")
          .withIndex("by_student_game", (q) =>
            q.eq("studentId", student._id).eq("gameId", gameId)
          )
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        // Find best score
        const bestSession = sessions.reduce(
          (best, session) => {
            if (!best || (session.stars ?? 0) > (best.stars ?? 0)) {
              return session;
            }
            return best;
          },
          null as (typeof sessions)[0] | null
        );

        // Find the lesson this game is linked to (for context)
        const link = allLinks.find((l) => l.gameId === gameId);
        let lessonTitle: string | null = null;
        let lessonIdForGame: Id<"structuredLessons"> | null = null;

        if (link) {
          const enrollment = enrollments.find((e) => e.lessonId === link.lessonId);
          if (enrollment) {
            const lesson = await ctx.db.get(enrollment.lessonId);
            if (lesson && "title" in lesson) {
              lessonTitle = lesson.title;
              lessonIdForGame = enrollment.lessonId;
            }
          }
        }

        return {
          _id: game._id,
          title: game.title,
          slug: game.slug,
          type: game.type,
          level: game.level,
          category: game.category,
          description: game.description,
          // Score info
          bestStars: bestSession?.stars ?? null,
          bestScore: bestSession?.scorePercent ?? null,
          lastPlayedAt: bestSession?.completedAt ?? null,
          timesPlayed: sessions.length,
          // Lesson context
          lessonTitle,
          lessonId: lessonIdForGame,
        };
      })
    );

    // Filter out null values and apply limit
    const validGames = gamesWithScores.filter(
      (g): g is NonNullable<typeof g> => g !== null
    );

    // Sort by: unplayed first, then by most recent play
    validGames.sort((a, b) => {
      // Unplayed games first
      if (a.timesPlayed === 0 && b.timesPlayed > 0) return -1;
      if (b.timesPlayed === 0 && a.timesPlayed > 0) return 1;

      // Then by most recent play
      if (a.lastPlayedAt && b.lastPlayedAt) {
        return b.lastPlayedAt - a.lastPlayedAt;
      }
      return 0;
    });

    return args.limit ? validGames.slice(0, args.limit) : validGames;
  },
});

/**
 * Get most recent in-progress enrollment for continue learning card
 */
export const getMostRecentInProgressEnrollment = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Get student profile
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!student) {
      return null;
    }

    // Get in-progress enrollments first, then enrolled ones
    const inProgressEnrollments = await ctx.db
      .query("lessonEnrollments")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .order("desc")
      .take(1);

    let enrollment = inProgressEnrollments[0];

    // If no in-progress, get most recent enrolled
    if (!enrollment) {
      const enrolledEnrollments = await ctx.db
        .query("lessonEnrollments")
        .withIndex("by_student", (q) => q.eq("studentId", student._id))
        .filter((q) => q.eq(q.field("status"), "enrolled"))
        .order("desc")
        .take(1);

      enrollment = enrolledEnrollments[0];
    }

    if (!enrollment) {
      return null;
    }

    // Fetch lesson details from structuredLessons
    const lesson = await ctx.db
      .query("structuredLessons")
      .filter((q) => q.eq(q.field("_id"), enrollment.lessonId))
      .first();

    if (!lesson) {
      return null;
    }

    return {
      _id: enrollment._id,
      status: enrollment.status,
      progress: enrollment.progress,
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        shareToken: lesson.shareToken,
        sessionType: lesson.sessionType,
      },
    };
  },
});
