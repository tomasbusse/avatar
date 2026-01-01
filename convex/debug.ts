import { v } from "convex/values";
import { query } from "./_generated/server";

// Debug: List all structured lessons
export const listAllLessons = query({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db.query("structuredLessons").collect();
    return lessons.map((l) => ({
      _id: l._id,
      title: l.title,
      shareToken: l.shareToken,
      presentationId: l.presentationId,
      knowledgeContentId: l.knowledgeContentId,
    }));
  },
});

// Debug: List all presentations with status
export const listAllPresentations = query({
  args: {},
  handler: async (ctx) => {
    const presentations = await ctx.db.query("presentations").collect();
    return presentations.map((p) => ({
      _id: p._id,
      name: p.name,
      status: p.status,
      totalSlides: p.totalSlides,
      slidesArrayLength: p.slides?.length ?? 0,
      isReady: p.status === "ready" && (p.slides?.length ?? 0) > 0,
    }));
  },
});

// Debug: Trace the entire presentation loading flow for a structured lesson
export const traceStructuredLessonFlow = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    // 1. Find the structured lesson
    const lesson = await ctx.db
      .query("structuredLessons")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!lesson) {
      return { error: "Lesson not found", shareToken: args.shareToken };
    }

    // 2. Check direct presentationId
    let presentationSource = "none";
    let presentationId = lesson.presentationId;

    if (presentationId) {
      presentationSource = "direct_on_lesson";
    }

    // 3. Check knowledge content for presentationId
    let knowledgeContent = null;
    if (!presentationId && lesson.knowledgeContentId) {
      knowledgeContent = await ctx.db.get(lesson.knowledgeContentId);
      if (knowledgeContent?.presentationId) {
        presentationId = knowledgeContent.presentationId;
        presentationSource = "from_knowledge_content";
      }
    }

    // 4. Get the presentation if we have an ID
    let presentation = null;
    if (presentationId) {
      presentation = await ctx.db.get(presentationId);
    }

    // 5. Find recent sessions for this lesson
    const recentSessions = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("structuredLessonId"), lesson._id))
      .order("desc")
      .take(3);

    const sessionsInfo = recentSessions.map((s) => ({
      _id: s._id,
      roomName: s.roomName,
      status: s.status,
      type: s.type,
      presentationId: s.presentationId,
      presentationMode: s.presentationMode,
      createdAt: new Date(s.createdAt).toISOString(),
    }));

    return {
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        shareToken: lesson.shareToken,
        sessionType: lesson.sessionType,
        presentationId: lesson.presentationId,
        knowledgeContentId: lesson.knowledgeContentId,
        avatarId: lesson.avatarId,
      },
      knowledgeContent: knowledgeContent
        ? {
            _id: knowledgeContent._id,
            title: knowledgeContent.title,
            presentationId: knowledgeContent.presentationId,
          }
        : null,
      presentationResolution: {
        source: presentationSource,
        finalPresentationId: presentationId,
      },
      presentation: presentation
        ? {
            _id: presentation._id,
            name: presentation.name,
            status: presentation.status,
            totalSlides: presentation.totalSlides,
            slidesArrayLength: presentation.slides?.length ?? 0,
            errorMessage: presentation.errorMessage,
          }
        : null,
      recentSessions: sessionsInfo,
    };
  },
});

// Debug: Check a specific session's presentation state
export const debugSessionPresentation = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return { error: "Session not found" };
    }

    // Get presentation from either location
    const presentationId =
      session.presentationMode?.presentationId || session.presentationId;
    let presentation = null;
    let slides: Array<{
      index: number;
      storageId: string;
      url: string | null;
    }> | null = null;

    if (presentationId) {
      presentation = await ctx.db.get(presentationId);
      if (presentation?.slides) {
        slides = await Promise.all(
          presentation.slides.slice(0, 3).map(async (slide, i) => ({
            index: i,
            storageId: slide.storageId,
            url: await ctx.storage.getUrl(slide.storageId),
          }))
        );
      }
    }

    return {
      session: {
        _id: session._id,
        roomName: session.roomName,
        status: session.status,
        type: session.type,
        presentationId: session.presentationId,
        presentationMode: session.presentationMode,
        structuredLessonId: session.structuredLessonId,
      },
      presentation: presentation
        ? {
            _id: presentation._id,
            name: presentation.name,
            status: presentation.status,
            totalSlides: presentation.totalSlides,
            slidesCount: presentation.slides?.length ?? 0,
          }
        : null,
      sampleSlides: slides,
    };
  },
});

// Debug: Check a presentation's readiness
export const debugPresentation = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      return { error: "Presentation not found" };
    }

    // Get URLs for first 3 slides
    const slideSamples = await Promise.all(
      (presentation.slides || []).slice(0, 3).map(async (slide, i) => ({
        index: i,
        storageId: slide.storageId,
        url: await ctx.storage.getUrl(slide.storageId),
      }))
    );

    return {
      _id: presentation._id,
      name: presentation.name,
      status: presentation.status,
      errorMessage: presentation.errorMessage,
      totalSlides: presentation.totalSlides,
      slidesArrayLength: presentation.slides?.length ?? 0,
      hasSlideContent: !!presentation.slideContent,
      slideContentLength: presentation.slideContent?.length ?? 0,
      slideSamples,
      isReady:
        presentation.status === "ready" &&
        (presentation.slides?.length ?? 0) > 0,
    };
  },
});

// Debug: Get session by room name
export const debugSessionByRoom = query({
  args: { roomName: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_room", (q) => q.eq("roomName", args.roomName))
      .unique();

    if (!session) {
      return { error: "Session not found", roomName: args.roomName };
    }

    // Get presentation from either location
    const presentationId =
      session.presentationMode?.presentationId || session.presentationId;
    let presentation = null;

    if (presentationId) {
      presentation = await ctx.db.get(presentationId);
    }

    return {
      session: {
        _id: session._id,
        roomName: session.roomName,
        status: session.status,
        type: session.type,
        presentationId: session.presentationId,
        presentationMode: session.presentationMode,
      },
      presentation: presentation
        ? {
            _id: presentation._id,
            name: presentation.name,
            status: presentation.status,
            totalSlides: presentation.totalSlides,
            slidesCount: presentation.slides?.length ?? 0,
            isReady:
              presentation.status === "ready" &&
              (presentation.slides?.length ?? 0) > 0,
          }
        : null,
    };
  },
});
