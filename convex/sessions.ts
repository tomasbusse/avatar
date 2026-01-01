import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
