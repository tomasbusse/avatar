import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// TYPES
// ============================================

const deliveryModeValidator = v.union(
  v.literal("web_only"),
  v.literal("audio_avatar"),
  v.literal("video_avatar")
);

const sessionStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("paused"),
  v.literal("completed"),
  v.literal("abandoned")
);

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateInstanceId(): string {
  return `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRoomName(): string {
  return `entry-test-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
}

// ============================================
// QUERIES
// ============================================

// Get a session by ID
export const getSession = query({
  args: { sessionId: v.id("entryTestSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// Get session by LiveKit room name (for agent lookup)
export const getSessionByRoom = query({
  args: { roomName: v.string() },
  handler: async (ctx, args) => {
    // Find session with matching room name using index
    return await ctx.db
      .query("entryTestSessions")
      .withIndex("by_room", (q) => q.eq("liveKitRoomName", args.roomName))
      .first();
  },
});

// Get session with full question content for test-taking UI
export const getSessionWithQuestions = query({
  args: { sessionId: v.id("entryTestSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    // Get template
    const template = await ctx.db.get(session.templateId);
    if (!template) {
      return null;
    }

    // Get all questions for this session and merge content
    const questionInstances = await Promise.all(
      session.questionInstances.map(async (instance) => {
        const question = await ctx.db.get(instance.questionBankId);
        return {
          instanceId: instance.instanceId,
          questionBankId: instance.questionBankId,
          sectionId: instance.sectionId,
          orderInSection: instance.order,
          type: question?.type ?? "grammar_mcq",
          cefrLevel: question?.cefrLevel ?? "B1",
          content: question?.content ?? {},
          audioStorageId: question?.audioStorageId,
        };
      })
    );

    // Get avatar if configured
    let avatar = null;
    if (template.deliveryConfig.avatarId) {
      avatar = await ctx.db.get(template.deliveryConfig.avatarId);
    }

    return {
      ...session,
      questionInstances,
      template,
      avatar,
    };
  },
});

// Get active session for student (in_progress or paused)
export const getActiveSessionForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    // Check for in_progress session first
    const inProgress = await ctx.db
      .query("entryTestSessions")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", args.studentId).eq("status", "in_progress")
      )
      .first();

    if (inProgress) {
      return inProgress;
    }

    // Check for paused session
    const paused = await ctx.db
      .query("entryTestSessions")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", args.studentId).eq("status", "paused")
      )
      .first();

    return paused;
  },
});

// List all sessions for a student
export const listStudentSessions = query({
  args: {
    studentId: v.id("students"),
    status: v.optional(sessionStatusValidator),
  },
  handler: async (ctx, args) => {
    let sessions;

    if (args.status) {
      sessions = await ctx.db
        .query("entryTestSessions")
        .withIndex("by_student_status", (q) =>
          q.eq("studentId", args.studentId).eq("status", args.status!)
        )
        .collect();
    } else {
      sessions = await ctx.db
        .query("entryTestSessions")
        .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
        .collect();
    }

    // Sort by creation date descending
    sessions.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with template info
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const template = await ctx.db.get(session.templateId);
        return {
          ...session,
          templateTitle: template?.title ?? "Unknown",
          templateLevelRange: template?.targetLevelRange,
        };
      })
    );

    return enrichedSessions;
  },
});

// Get completed session results
export const getSessionResults = query({
  args: { sessionId: v.id("entryTestSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    // Get template
    const template = await ctx.db.get(session.templateId);

    // Get student
    const student = await ctx.db.get(session.studentId);

    // If not completed, return basic info
    if (session.status !== "completed") {
      return {
        status: session.status,
        templateId: session.templateId,
        templateTitle: template?.title,
        answers: session.answers,
      };
    }

    // Format section scores for display
    const sectionScores = session.sectionScores?.map((score) => ({
      sectionId: score.sectionId,
      sectionType: score.sectionType,
      percentageScore: score.percentScore,
      cefrLevel: score.cefrLevel,
      correctCount: Math.round((score.rawScore / score.maxScore) * score.maxScore),
      totalQuestions: score.maxScore,
    }));

    // Format overall result
    const overallResult = session.overallResult
      ? {
          cefrLevel: session.overallResult.recommendedLevel,
          percentageScore: session.overallResult.percentScore,
          confidenceScore: session.overallResult.confidenceScore,
          strengths: session.overallResult.strengths,
          weaknesses: session.overallResult.weaknesses,
        }
      : null;

    return {
      status: session.status,
      templateId: session.templateId,
      templateTitle: template?.title,
      sections: template?.sections,
      answers: session.answers,
      sectionScores,
      overallResult,
      analytics: session.analytics,
      completedAt: session.completedAt,
    };
  },
});

// List sessions for a template (admin)
export const listTemplateSessions = query({
  args: {
    templateId: v.id("entryTestTemplates"),
    status: v.optional(sessionStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let sessions = await ctx.db
      .query("entryTestSessions")
      .withIndex("by_template", (q) => q.eq("templateId", args.templateId))
      .collect();

    if (args.status) {
      sessions = sessions.filter((s) => s.status === args.status);
    }

    // Sort by creation date descending
    sessions.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (args.limit) {
      sessions = sessions.slice(0, args.limit);
    }

    // Enrich with student info
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const student = await ctx.db.get(session.studentId);
        const user = await ctx.db.get(session.userId);
        return {
          ...session,
          studentName: user
            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
            : "Unknown",
        };
      })
    );

    return enrichedSessions;
  },
});

// ============================================
// MUTATIONS
// ============================================

// Start a new test session
export const startTest = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    deliveryMode: deliveryModeValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user and student
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!student) {
      throw new Error("Student profile not found");
    }

    // Check for existing active session
    const existingActive = await ctx.db
      .query("entryTestSessions")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", student._id).eq("status", "in_progress")
      )
      .first();

    if (existingActive) {
      throw new Error("You already have an active test session. Please complete or abandon it first.");
    }

    // Get template
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    if (template.status !== "published") {
      throw new Error("Template is not published");
    }

    // Validate delivery mode meets minimum
    const modeOrder = ["web_only", "audio_avatar", "video_avatar"];
    const minModeIndex = modeOrder.indexOf(template.deliveryConfig.minimumMode);
    const selectedModeIndex = modeOrder.indexOf(args.deliveryMode);

    if (selectedModeIndex < minModeIndex) {
      throw new Error(`This test requires at least ${template.deliveryConfig.minimumMode} mode`);
    }

    if (selectedModeIndex > minModeIndex && !template.deliveryConfig.allowUpgrade) {
      throw new Error("Upgrading delivery mode is not allowed for this test");
    }

    // Select questions for each section
    const questionInstances: Array<{
      instanceId: string;
      sectionId: string;
      questionBankId: Id<"entryTestQuestionBank">;
      order: number;
    }> = [];

    const questionOrder: Record<string, string[]> = {};

    for (const section of template.sections) {
      // Get approved questions matching this section's filter
      const allApproved = await ctx.db
        .query("entryTestQuestionBank")
        .withIndex("by_curation_status", (q) => q.eq("curationStatus", "approved"))
        .collect();

      let matching = allApproved.filter(
        (q) =>
          section.questionBankFilter.types.includes(q.type) &&
          section.questionBankFilter.levels.includes(q.cefrLevel)
      );

      // Filter by tags if specified
      if (section.questionBankFilter.tags && section.questionBankFilter.tags.length > 0) {
        matching = matching.filter((q) =>
          section.questionBankFilter.tags!.some((tag) => q.tags.includes(tag))
        );
      }

      // Check we have enough questions
      if (matching.length < section.questionCount) {
        throw new Error(
          `Not enough questions for section "${section.title}". Need ${section.questionCount}, have ${matching.length}.`
        );
      }

      // Shuffle and select
      const shuffled = matching.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, section.questionCount);

      const sectionInstanceIds: string[] = [];

      selected.forEach((q, index) => {
        const instanceId = generateInstanceId();
        sectionInstanceIds.push(instanceId);

        questionInstances.push({
          instanceId,
          sectionId: section.id,
          questionBankId: q._id,
          order: index,
        });
      });

      questionOrder[section.id] = sectionInstanceIds;
    }

    // Generate LiveKit room name if avatar mode
    const liveKitRoomName =
      args.deliveryMode !== "web_only" ? generateRoomName() : undefined;

    const now = Date.now();

    // Create session
    const sessionId = await ctx.db.insert("entryTestSessions", {
      templateId: args.templateId,
      studentId: student._id,
      userId: user._id,
      status: "in_progress",
      deliveryMode: args.deliveryMode,
      liveKitRoomName,
      currentState: {
        currentSectionIndex: 0,
        currentQuestionIndex: 0,
        sectionOrder: template.sections.map((s) => s.id),
        questionOrder,
      },
      questionInstances,
      answers: [],
      avatarFeedbackDelivered: false,
      startedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return {
      sessionId,
      roomName: liveKitRoomName,
    };
  },
});

// Resume an existing test session
export const resumeTest = mutation({
  args: { sessionId: v.id("entryTestSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "paused") {
      throw new Error("Session is not paused");
    }

    // Update analytics
    const analytics = session.analytics ?? {
      totalTimeSeconds: 0,
      averageTimePerQuestion: 0,
      audioReplaysUsed: 0,
      pauseCount: 0,
      resumeCount: 0,
    };

    await ctx.db.patch(args.sessionId, {
      status: "in_progress",
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
      analytics: {
        ...analytics,
        resumeCount: analytics.resumeCount + 1,
      },
    });

    return {
      currentState: session.currentState,
      roomName: session.liveKitRoomName,
    };
  },
});

// Submit an answer
export const submitAnswer = mutation({
  args: {
    sessionId: v.id("entryTestSessions"),
    instanceId: v.string(),
    answer: v.any(),
    timeSpentSeconds: v.number(),
    audioReplaysUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "in_progress") {
      throw new Error("Session is not in progress");
    }

    // Find the question instance
    const instance = session.questionInstances.find(
      (qi) => qi.instanceId === args.instanceId
    );
    if (!instance) {
      throw new Error("Question instance not found");
    }

    // Check if already answered
    const existingAnswer = session.answers.find(
      (a) => a.instanceId === args.instanceId
    );
    if (existingAnswer) {
      throw new Error("Question already answered");
    }

    // Add answer
    const newAnswer = {
      instanceId: args.instanceId,
      answer: args.answer,
      answeredAt: Date.now(),
      timeSpentSeconds: args.timeSpentSeconds,
      audioReplaysUsed: args.audioReplaysUsed,
    };

    const updatedAnswers = [...session.answers, newAnswer];

    // Determine next question
    const currentState = session.currentState;
    const currentSectionId = currentState.sectionOrder[currentState.currentSectionIndex];
    const sectionQuestions = currentState.questionOrder[currentSectionId] || [];

    let nextSectionIndex = currentState.currentSectionIndex;
    let nextQuestionIndex = currentState.currentQuestionIndex + 1;
    let sectionComplete = false;
    let testComplete = false;

    if (nextQuestionIndex >= sectionQuestions.length) {
      // Move to next section
      sectionComplete = true;
      nextSectionIndex++;
      nextQuestionIndex = 0;

      if (nextSectionIndex >= currentState.sectionOrder.length) {
        // Test complete
        testComplete = true;
      }
    }

    const newState = {
      ...currentState,
      currentSectionIndex: nextSectionIndex,
      currentQuestionIndex: nextQuestionIndex,
    };

    await ctx.db.patch(args.sessionId, {
      answers: updatedAnswers,
      currentState: newState,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Get next question if not complete
    let nextQuestion = null;
    if (!testComplete) {
      const nextSectionId = currentState.sectionOrder[nextSectionIndex];
      const nextQuestionIds = currentState.questionOrder[nextSectionId] || [];
      const nextInstanceId = nextQuestionIds[nextQuestionIndex];

      if (nextInstanceId) {
        const nextInstance = session.questionInstances.find(
          (qi) => qi.instanceId === nextInstanceId
        );
        if (nextInstance) {
          nextQuestion = await ctx.db.get(nextInstance.questionBankId);
        }
      }
    }

    return {
      nextQuestion,
      sectionComplete,
      testComplete,
      currentSectionIndex: nextSectionIndex,
      currentQuestionIndex: nextQuestionIndex,
    };
  },
});

// Submit speaking response (audio recording)
export const submitSpeakingResponse = mutation({
  args: {
    sessionId: v.id("entryTestSessions"),
    instanceId: v.string(),
    audioStorageId: v.id("_storage"),
    timeSpentSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "in_progress") {
      throw new Error("Session is not in progress");
    }

    // Add answer with audio reference
    const newAnswer = {
      instanceId: args.instanceId,
      answer: null, // Transcript will be added after processing
      audioRecordingStorageId: args.audioStorageId,
      answeredAt: Date.now(),
      timeSpentSeconds: args.timeSpentSeconds,
    };

    const updatedAnswers = [...session.answers, newAnswer];

    // Update state same as regular answer
    const currentState = session.currentState;
    const currentSectionId = currentState.sectionOrder[currentState.currentSectionIndex];
    const sectionQuestions = currentState.questionOrder[currentSectionId] || [];

    let nextSectionIndex = currentState.currentSectionIndex;
    let nextQuestionIndex = currentState.currentQuestionIndex + 1;

    if (nextQuestionIndex >= sectionQuestions.length) {
      nextSectionIndex++;
      nextQuestionIndex = 0;
    }

    const newState = {
      ...currentState,
      currentSectionIndex: nextSectionIndex,
      currentQuestionIndex: nextQuestionIndex,
    };

    await ctx.db.patch(args.sessionId, {
      answers: updatedAnswers,
      currentState: newState,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Pause test
export const pauseTest = mutation({
  args: { sessionId: v.id("entryTestSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "in_progress") {
      throw new Error("Session is not in progress");
    }

    // Update analytics
    const analytics = session.analytics ?? {
      totalTimeSeconds: 0,
      averageTimePerQuestion: 0,
      audioReplaysUsed: 0,
      pauseCount: 0,
      resumeCount: 0,
    };

    await ctx.db.patch(args.sessionId, {
      status: "paused",
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
      analytics: {
        ...analytics,
        pauseCount: analytics.pauseCount + 1,
      },
    });

    return { success: true };
  },
});

// Complete test and trigger scoring
export const completeTest = mutation({
  args: { sessionId: v.id("entryTestSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "in_progress") {
      throw new Error("Session is not in progress");
    }

    const now = Date.now();

    // Calculate total time
    const totalTimeSeconds = session.startedAt
      ? Math.floor((now - session.startedAt) / 1000)
      : 0;

    // Calculate average time per question
    const totalAnswers = session.answers.length;
    const averageTimePerQuestion =
      totalAnswers > 0
        ? session.answers.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / totalAnswers
        : 0;

    // Calculate total audio replays
    const audioReplaysUsed = session.answers.reduce(
      (sum, a) => sum + (a.audioReplaysUsed ?? 0),
      0
    );

    const existingAnalytics = session.analytics ?? {
      pauseCount: 0,
      resumeCount: 0,
    };

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      completedAt: now,
      lastActivityAt: now,
      updatedAt: now,
      analytics: {
        ...existingAnalytics,
        totalTimeSeconds,
        averageTimePerQuestion,
        audioReplaysUsed,
      },
    });

    // Note: Actual scoring would be done asynchronously via an action
    // For now, we just mark as complete

    return { success: true };
  },
});

// Abandon test
export const abandonTest = mutation({
  args: {
    sessionId: v.id("entryTestSessions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status === "completed" || session.status === "abandoned") {
      throw new Error("Session is already finished");
    }

    await ctx.db.patch(args.sessionId, {
      status: "abandoned",
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Apply recommended level to student profile
export const applyRecommendedLevel = mutation({
  args: { sessionId: v.id("entryTestSessions") },
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

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "completed") {
      throw new Error("Test is not completed");
    }

    if (!session.overallResult) {
      throw new Error("Test results not yet calculated");
    }

    if (session.overallResult.levelApplied) {
      throw new Error("Level has already been applied");
    }

    // Update student's current level
    await ctx.db.patch(session.studentId, {
      currentLevel: session.overallResult.recommendedLevel,
      assessmentCompleted: true,
      updatedAt: Date.now(),
    });

    // Mark level as applied
    await ctx.db.patch(args.sessionId, {
      overallResult: {
        ...session.overallResult,
        levelApplied: true,
        levelAppliedAt: Date.now(),
        levelAppliedBy: user._id,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update transcript for speaking response (called after Deepgram processing)
export const updateSpeakingTranscript = mutation({
  args: {
    sessionId: v.id("entryTestSessions"),
    instanceId: v.string(),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const answerIndex = session.answers.findIndex(
      (a) => a.instanceId === args.instanceId
    );

    if (answerIndex === -1) {
      throw new Error("Answer not found");
    }

    const updatedAnswers = [...session.answers];
    updatedAnswers[answerIndex] = {
      ...updatedAnswers[answerIndex],
      transcript: args.transcript,
    };

    await ctx.db.patch(args.sessionId, {
      answers: updatedAnswers,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update progress (used by avatar agent to sync navigation state)
export const updateProgress = mutation({
  args: {
    sessionId: v.id("entryTestSessions"),
    currentSectionIndex: v.number(),
    currentQuestionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "in_progress") {
      throw new Error("Session is not in progress");
    }

    await ctx.db.patch(args.sessionId, {
      currentState: {
        ...session.currentState,
        currentSectionIndex: args.currentSectionIndex,
        currentQuestionIndex: args.currentQuestionIndex,
      },
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Record an answer from the avatar agent (includes pre-calculated score)
export const recordAnswer = mutation({
  args: {
    sessionId: v.id("entryTestSessions"),
    instanceId: v.string(),
    answer: v.any(),
    isCorrect: v.optional(v.boolean()),
    score: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    feedback: v.optional(v.string()),
    timeSpentSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "in_progress") {
      throw new Error("Session is not in progress");
    }

    // Check if already answered
    const existingAnswer = session.answers.find(
      (a) => a.instanceId === args.instanceId
    );
    if (existingAnswer) {
      throw new Error("Question already answered");
    }

    // Add answer with scoring info
    const newAnswer = {
      instanceId: args.instanceId,
      answer: args.answer,
      answeredAt: Date.now(),
      timeSpentSeconds: args.timeSpentSeconds,
      isCorrect: args.isCorrect,
      score: args.score,
      maxScore: args.maxScore,
      feedback: args.feedback,
    };

    const updatedAnswers = [...session.answers, newAnswer];

    await ctx.db.patch(args.sessionId, {
      answers: updatedAnswers,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Store section scores and overall result (called by scoring action)
export const storeResults = mutation({
  args: {
    sessionId: v.id("entryTestSessions"),
    sectionScores: v.array(
      v.object({
        sectionId: v.string(),
        sectionType: v.string(),
        rawScore: v.number(),
        maxScore: v.number(),
        percentScore: v.number(),
        cefrLevel: v.string(),
        aiEvaluation: v.optional(v.any()),
      })
    ),
    overallResult: v.object({
      recommendedLevel: v.string(),
      confidenceScore: v.number(),
      totalScore: v.number(),
      maxPossibleScore: v.number(),
      percentScore: v.number(),
      strengths: v.array(v.string()),
      weaknesses: v.array(v.string()),
      levelApplied: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      sectionScores: args.sectionScores,
      overallResult: args.overallResult,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
