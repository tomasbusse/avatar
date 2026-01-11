import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// MUTATIONS
// ============================================

/**
 * Assign a lesson to an individual student (admin action)
 */
export const assignToStudent = mutation({
  args: {
    lessonId: v.id("structuredLessons"),
    studentId: v.id("students"),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify lesson exists
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Verify student exists
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Check for existing enrollment
    const existing = await ctx.db
      .query("lessonEnrollments")
      .withIndex("by_student_lesson", (q) =>
        q.eq("studentId", args.studentId).eq("lessonId", args.lessonId)
      )
      .first();

    if (existing && existing.status !== "dropped") {
      throw new Error("Student is already enrolled in this lesson");
    }

    // Create enrollment
    const enrollmentId = await ctx.db.insert("lessonEnrollments", {
      lessonId: args.lessonId,
      studentId: args.studentId,
      type: "admin_assigned",
      status: "enrolled",
      assignedBy: user._id,
      enrolledAt: Date.now(),
      dueDate: args.dueDate,
      notes: args.notes,
    });

    return { enrollmentId };
  },
});

/**
 * Assign a lesson to an entire group (creates enrollment for each member)
 */
export const assignToGroup = mutation({
  args: {
    lessonId: v.id("structuredLessons"),
    groupId: v.id("groups"),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify lesson exists
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Verify group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Get all active group members
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Create group-level enrollment record
    await ctx.db.insert("lessonEnrollments", {
      lessonId: args.lessonId,
      groupId: args.groupId,
      type: "group_assigned",
      status: "enrolled",
      assignedBy: user._id,
      enrolledAt: Date.now(),
      dueDate: args.dueDate,
      notes: args.notes,
    });

    // Create individual enrollments for each member
    const enrollmentIds: Id<"lessonEnrollments">[] = [];
    for (const member of members) {
      // Check for existing enrollment
      const existing = await ctx.db
        .query("lessonEnrollments")
        .withIndex("by_student_lesson", (q) =>
          q.eq("studentId", member.studentId).eq("lessonId", args.lessonId)
        )
        .first();

      if (!existing || existing.status === "dropped") {
        const enrollmentId = await ctx.db.insert("lessonEnrollments", {
          lessonId: args.lessonId,
          studentId: member.studentId,
          groupId: args.groupId, // Track which group assignment this came from
          type: "group_assigned",
          status: "enrolled",
          assignedBy: user._id,
          enrolledAt: Date.now(),
          dueDate: args.dueDate,
          notes: args.notes,
        });
        enrollmentIds.push(enrollmentId);
      }
    }

    return { enrollmentCount: enrollmentIds.length, enrollmentIds };
  },
});

/**
 * Student self-enrolls in a lesson
 */
export const selfEnroll = mutation({
  args: {
    lessonId: v.id("structuredLessons"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user and student profile
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

    // Verify lesson exists and allows self-enrollment
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const settings = lesson.enrollmentSettings;
    if (!settings?.allowSelfEnrollment) {
      throw new Error("Self-enrollment is not allowed for this lesson");
    }

    // Check enrollment deadline
    if (settings.enrollmentDeadline && Date.now() > settings.enrollmentDeadline) {
      throw new Error("Enrollment deadline has passed");
    }

    // Check enrollment limit
    if (settings.maxEnrollments) {
      const enrollmentCount = await ctx.db
        .query("lessonEnrollments")
        .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
        .filter((q) => q.neq(q.field("status"), "dropped"))
        .collect();

      if (enrollmentCount.length >= settings.maxEnrollments) {
        throw new Error("Lesson has reached maximum enrollment capacity");
      }
    }

    // Check for existing enrollment
    const existing = await ctx.db
      .query("lessonEnrollments")
      .withIndex("by_student_lesson", (q) =>
        q.eq("studentId", student._id).eq("lessonId", args.lessonId)
      )
      .first();

    if (existing && existing.status !== "dropped") {
      throw new Error("You are already enrolled in this lesson");
    }

    // Create enrollment
    const enrollmentId = await ctx.db.insert("lessonEnrollments", {
      lessonId: args.lessonId,
      studentId: student._id,
      type: "self_enrolled",
      status: "enrolled",
      enrolledAt: Date.now(),
    });

    return { enrollmentId };
  },
});

/**
 * Remove enrollment (unenroll)
 */
export const unenroll = mutation({
  args: {
    enrollmentId: v.id("lessonEnrollments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    // Update status to dropped
    await ctx.db.patch(args.enrollmentId, {
      status: "dropped",
    });

    return { success: true };
  },
});

/**
 * Update enrollment progress
 */
export const updateProgress = mutation({
  args: {
    enrollmentId: v.id("lessonEnrollments"),
    progress: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("in_progress"), v.literal("completed"))
    ),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    const updates: Partial<{
      progress: number;
      status: "in_progress" | "completed";
      lastAccessedAt: number;
      completedAt: number;
    }> = {
      lastAccessedAt: Date.now(),
    };

    if (args.progress !== undefined) {
      updates.progress = args.progress;
    }

    if (args.status) {
      updates.status = args.status;
      if (args.status === "completed") {
        updates.completedAt = Date.now();
      }
    }

    await ctx.db.patch(args.enrollmentId, updates);

    return { success: true };
  },
});

/**
 * Mark enrollment as completed
 */
export const markCompleted = mutation({
  args: {
    enrollmentId: v.id("lessonEnrollments"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    await ctx.db.patch(args.enrollmentId, {
      status: "completed",
      progress: 100,
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Start a lesson (update status to in_progress)
 */
export const startLesson = mutation({
  args: {
    lessonId: v.id("structuredLessons"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user and student profile
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

    // Find enrollment
    const enrollment = await ctx.db
      .query("lessonEnrollments")
      .withIndex("by_student_lesson", (q) =>
        q.eq("studentId", student._id).eq("lessonId", args.lessonId)
      )
      .first();

    if (!enrollment) {
      // Check if lesson allows self-enrollment and auto-enroll
      const lesson = await ctx.db.get(args.lessonId);
      if (lesson?.enrollmentSettings?.allowSelfEnrollment) {
        const enrollmentId = await ctx.db.insert("lessonEnrollments", {
          lessonId: args.lessonId,
          studentId: student._id,
          type: "self_enrolled",
          status: "in_progress",
          enrolledAt: Date.now(),
          lastAccessedAt: Date.now(),
        });
        return { enrollmentId, autoEnrolled: true };
      }
      throw new Error("Not enrolled in this lesson");
    }

    if (enrollment.status === "dropped") {
      throw new Error("Enrollment has been dropped");
    }

    // Update to in_progress if not already completed
    if (enrollment.status !== "completed") {
      await ctx.db.patch(enrollment._id, {
        status: "in_progress",
        lastAccessedAt: Date.now(),
      });
    }

    return { enrollmentId: enrollment._id, autoEnrolled: false };
  },
});

// ============================================
// QUERIES
// ============================================

/**
 * Get student's enrolled lessons
 */
export const getStudentEnrollments = query({
  args: {
    studentId: v.optional(v.id("students")),
    status: v.optional(
      v.union(
        v.literal("enrolled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("dropped")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    let studentId = args.studentId;

    // If no studentId provided, get current user's student profile
    if (!studentId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user) {
        return [];
      }

      const student = await ctx.db
        .query("students")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!student) {
        return [];
      }

      studentId = student._id;
    }

    // Get enrollments
    let enrollmentsQuery = ctx.db
      .query("lessonEnrollments")
      .withIndex("by_student", (q) => q.eq("studentId", studentId));

    const enrollments = await enrollmentsQuery.collect();

    // Filter by status if provided
    const filteredEnrollments = args.status
      ? enrollments.filter((e) => e.status === args.status)
      : enrollments.filter((e) => e.status !== "dropped");

    // Fetch lesson details for each enrollment
    const enrichedEnrollments = await Promise.all(
      filteredEnrollments.map(async (enrollment) => {
        const lesson = await ctx.db.get(enrollment.lessonId);
        if (!lesson) {
          return null;
        }

        // Get avatar info
        const avatar = await ctx.db.get(lesson.avatarId);

        return {
          ...enrollment,
          lesson: {
            _id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            sessionType: lesson.sessionType,
            shareToken: lesson.shareToken,
          },
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

    return enrichedEnrollments.filter((e) => e !== null);
  },
});

/**
 * Get lesson enrollees (for admin)
 */
export const getLessonEnrollees = query({
  args: {
    lessonId: v.id("structuredLessons"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get all enrollments for this lesson
    const enrollments = await ctx.db
      .query("lessonEnrollments")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .filter((q) => q.neq(q.field("status"), "dropped"))
      .collect();

    // Fetch student details for each enrollment
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        if (!enrollment.studentId) {
          // Group-level enrollment record
          if (enrollment.groupId) {
            const group = await ctx.db.get(enrollment.groupId);
            return {
              ...enrollment,
              isGroupRecord: true,
              group: group
                ? {
                    _id: group._id,
                    name: group.name,
                  }
                : null,
            };
          }
          return null;
        }

        const student = await ctx.db.get(enrollment.studentId);
        if (!student) {
          return null;
        }

        const user = await ctx.db.get(student.userId);

        return {
          ...enrollment,
          student: {
            _id: student._id,
            currentLevel: student.currentLevel,
          },
          user: user
            ? {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
        };
      })
    );

    return enrichedEnrollments.filter((e) => e !== null);
  },
});

/**
 * Get available lessons for self-enrollment
 */
export const getAvailableLessons = query({
  args: {
    studentId: v.optional(v.id("students")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    let studentId = args.studentId;

    // If no studentId provided, get current user's student profile
    if (!studentId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user) {
        return [];
      }

      const student = await ctx.db
        .query("students")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!student) {
        return [];
      }

      studentId = student._id;
    }

    // Get all public lessons
    const publicLessons = await ctx.db
      .query("structuredLessons")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Get student's current enrollments
    const enrollments = await ctx.db
      .query("lessonEnrollments")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .filter((q) => q.neq(q.field("status"), "dropped"))
      .collect();

    const enrolledLessonIds = new Set(enrollments.map((e) => e.lessonId));

    // Filter to lessons that allow self-enrollment and aren't already enrolled
    const availableLessons = publicLessons.filter((lesson) => {
      // Already enrolled
      if (enrolledLessonIds.has(lesson._id)) {
        return false;
      }

      // Check enrollment settings
      const settings = lesson.enrollmentSettings;
      if (!settings?.allowSelfEnrollment) {
        return false;
      }

      // Check deadline
      if (settings.enrollmentDeadline && Date.now() > settings.enrollmentDeadline) {
        return false;
      }

      return true;
    });

    // Enrich with avatar info
    const enrichedLessons = await Promise.all(
      availableLessons.map(async (lesson) => {
        const avatar = await ctx.db.get(lesson.avatarId);

        // Get current enrollment count for capacity check
        const enrollmentCount = await ctx.db
          .query("lessonEnrollments")
          .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
          .filter((q) => q.neq(q.field("status"), "dropped"))
          .collect();

        const settings = lesson.enrollmentSettings;
        const isFull = settings?.maxEnrollments
          ? enrollmentCount.length >= settings.maxEnrollments
          : false;

        return {
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          sessionType: lesson.sessionType,
          shareToken: lesson.shareToken,
          enrollmentSettings: lesson.enrollmentSettings,
          enrollmentCount: enrollmentCount.length,
          isFull,
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

    return enrichedLessons.filter((l) => !l.isFull);
  },
});

/**
 * Get enrollment for a specific student and lesson
 */
export const getEnrollment = query({
  args: {
    lessonId: v.id("structuredLessons"),
    studentId: v.optional(v.id("students")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    let studentId = args.studentId;

    // If no studentId provided, get current user's student profile
    if (!studentId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user) {
        return null;
      }

      const student = await ctx.db
        .query("students")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!student) {
        return null;
      }

      studentId = student._id;
    }

    const enrollment = await ctx.db
      .query("lessonEnrollments")
      .withIndex("by_student_lesson", (q) =>
        q.eq("studentId", studentId).eq("lessonId", args.lessonId)
      )
      .first();

    return enrollment;
  },
});

/**
 * List all lessons with enrollment stats (for admin)
 */
export const listLessonsWithEnrollments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get all structured lessons
    const lessons = await ctx.db.query("structuredLessons").collect();

    // Enrich with enrollment counts
    const enrichedLessons = await Promise.all(
      lessons.map(async (lesson) => {
        const enrollments = await ctx.db
          .query("lessonEnrollments")
          .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
          .collect();

        const activeEnrollments = enrollments.filter(
          (e) => e.status !== "dropped"
        );
        const completedEnrollments = enrollments.filter(
          (e) => e.status === "completed"
        );
        const inProgressEnrollments = enrollments.filter(
          (e) => e.status === "in_progress"
        );

        const avatar = await ctx.db.get(lesson.avatarId);

        return {
          ...lesson,
          stats: {
            totalEnrollments: activeEnrollments.length,
            completed: completedEnrollments.length,
            inProgress: inProgressEnrollments.length,
            enrolled: activeEnrollments.filter((e) => e.status === "enrolled").length,
          },
          avatar: avatar
            ? {
                _id: avatar._id,
                name: avatar.name,
              }
            : null,
        };
      })
    );

    return enrichedLessons;
  },
});
