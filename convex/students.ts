import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getStudent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    return await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const getStudentById = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.studentId);
  },
});

export const createStudent = mutation({
  args: {
    nativeLanguage: v.string(),
    targetLanguage: v.string(),
    currentLevel: v.string(),
    learningGoal: v.union(
      v.literal("career"),
      v.literal("travel"),
      v.literal("exam"),
      v.literal("personal"),
      v.literal("academic")
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

    const existing = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) throw new Error("Student profile already exists");

    const now = Date.now();

    return await ctx.db.insert("students", {
      userId: user._id,
      nativeLanguage: args.nativeLanguage,
      targetLanguage: args.targetLanguage,
      currentLevel: args.currentLevel,
      learningGoal: args.learningGoal,
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
  },
});

export const updateStudent = mutation({
  args: {
    studentId: v.id("students"),
    currentLevel: v.optional(v.string()),
    targetLevel: v.optional(v.string()),
    learningGoal: v.optional(
      v.union(
        v.literal("career"),
        v.literal("travel"),
        v.literal("exam"),
        v.literal("personal"),
        v.literal("academic")
      )
    ),
    focusAreas: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { studentId, ...updates } = args;
    await ctx.db.patch(studentId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updatePreferences = mutation({
  args: {
    bilingualMode: v.optional(
      v.union(
        v.literal("adaptive"),
        v.literal("code_switching"),
        v.literal("strict_separation"),
        v.literal("target_only")
      )
    ),
    lessonDuration: v.optional(v.number()),
    reminderTime: v.optional(v.string()),
    preferredAvatarId: v.optional(v.id("avatars")),
    voiceSpeed: v.optional(v.number()),
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

    if (!student) throw new Error("Student not found");

    const currentPrefs = student.preferences;
    await ctx.db.patch(student._id, {
      preferences: {
        ...currentPrefs,
        ...(args.bilingualMode && { bilingualMode: args.bilingualMode }),
        ...(args.lessonDuration && { lessonDuration: args.lessonDuration }),
        ...(args.reminderTime !== undefined && {
          reminderTime: args.reminderTime,
        }),
        ...(args.preferredAvatarId !== undefined && {
          preferredAvatarId: args.preferredAvatarId,
        }),
        ...(args.voiceSpeed !== undefined && { voiceSpeed: args.voiceSpeed }),
      },
      updatedAt: Date.now(),
    });
  },
});

export const completeOnboarding = mutation({
  args: {
    currentLevel: v.string(),
    learningGoal: v.union(
      v.literal("career"),
      v.literal("travel"),
      v.literal("exam"),
      v.literal("personal"),
      v.literal("academic")
    ),
    focusAreas: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();

    if (!existingStudent) {
      await ctx.db.insert("students", {
        userId: user._id,
        nativeLanguage: "de",
        targetLanguage: "en",
        currentLevel: args.currentLevel,
        learningGoal: args.learningGoal,
        focusAreas: args.focusAreas,
        totalLessonsCompleted: 0,
        totalMinutesPracticed: 0,
        currentStreak: 0,
        longestStreak: 0,
        preferences: {
          bilingualMode: "adaptive",
          lessonDuration: 30,
        },
        onboardingCompleted: true,
        assessmentCompleted: false,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existingStudent._id, {
        currentLevel: args.currentLevel,
        learningGoal: args.learningGoal,
        focusAreas: args.focusAreas,
        onboardingCompleted: true,
        updatedAt: now,
      });
    }
  },
});

export const incrementStreak = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const newStreak = student.currentStreak + 1;
    await ctx.db.patch(args.studentId, {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, student.longestStreak),
      lastLessonAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const resetStreak = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      currentStreak: 0,
      updatedAt: Date.now(),
    });
  },
});
