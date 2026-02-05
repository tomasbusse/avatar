import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// QUERIES
// ============================================

/**
 * List all teachers with user/avatar enrichment.
 * Supports optional filters by status and company.
 */
export const listTeachers = query({
  args: {
    filters: v.optional(
      v.object({
        status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
        companyId: v.optional(v.id("companies")),
        globalOnly: v.optional(v.boolean()), // Only global teachers (no company)
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin status
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can list teachers");
    }

    let teachersQuery;

    if (args.filters?.status) {
      teachersQuery = ctx.db
        .query("teachers")
        .withIndex("by_status", (q) => q.eq("status", args.filters!.status!));
    } else if (args.filters?.companyId) {
      teachersQuery = ctx.db
        .query("teachers")
        .withIndex("by_company", (q) => q.eq("companyId", args.filters!.companyId));
    } else if (args.filters?.globalOnly) {
      teachersQuery = ctx.db
        .query("teachers")
        .withIndex("by_company", (q) => q.eq("companyId", undefined));
    } else {
      teachersQuery = ctx.db.query("teachers");
    }

    const teachers = await teachersQuery.collect();

    // Post-filter for globalOnly if combined with status filter
    let filteredTeachers = teachers;
    if (args.filters?.status && args.filters?.globalOnly) {
      filteredTeachers = teachers.filter((t) => t.companyId === undefined);
    }

    // Enrich with user, company, and avatar data
    const enrichedTeachers = await Promise.all(
      filteredTeachers.map(async (teacher) => {
        const user = await ctx.db.get(teacher.userId);
        const company = teacher.companyId
          ? await ctx.db.get(teacher.companyId)
          : null;

        // Get avatar details
        const avatars = await Promise.all(
          teacher.avatarIds.map(async (avatarId) => {
            const avatar = await ctx.db.get(avatarId);
            return avatar
              ? {
                  _id: avatar._id,
                  name: avatar.name,
                  slug: avatar.slug,
                  profileImage: avatar.profileImage,
                }
              : null;
          })
        );

        const createdByUser = await ctx.db.get(teacher.createdBy);

        return {
          ...teacher,
          user: user
            ? {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
              }
            : null,
          company: company
            ? {
                _id: company._id,
                name: company.name,
                slug: company.slug,
              }
            : null,
          avatars: avatars.filter((a) => a !== null),
          createdByUser: createdByUser
            ? {
                firstName: createdByUser.firstName,
                lastName: createdByUser.lastName,
              }
            : null,
        };
      })
    );

    return enrichedTeachers;
  },
});

/**
 * Get a single teacher with full details.
 */
export const getTeacher = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) return null;

    const user = await ctx.db.get(teacher.userId);
    const company = teacher.companyId
      ? await ctx.db.get(teacher.companyId)
      : null;

    const avatars = await Promise.all(
      teacher.avatarIds.map(async (avatarId) => {
        const avatar = await ctx.db.get(avatarId);
        return avatar
          ? {
              _id: avatar._id,
              name: avatar.name,
              slug: avatar.slug,
              profileImage: avatar.profileImage,
              description: avatar.description,
            }
          : null;
      })
    );

    return {
      ...teacher,
      user,
      company,
      avatars: avatars.filter((a) => a !== null),
    };
  },
});

/**
 * Get users who are not already teachers.
 * Used for the create teacher dialog.
 */
export const getAvailableUsersForTeacher = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin status
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can access this");
    }

    // Get all existing teacher user IDs
    const teachers = await ctx.db.query("teachers").collect();
    const teacherUserIds = new Set(teachers.map((t) => t.userId.toString()));

    // Get all active users
    const users = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter out users who are already teachers
    let availableUsers = users.filter(
      (user) => !teacherUserIds.has(user._id.toString())
    );

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      availableUsers = availableUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          (user.firstName &&
            user.firstName.toLowerCase().includes(searchLower)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchLower))
      );
    }

    return availableUsers.map((user) => ({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    }));
  },
});

/**
 * Get all avatars for assignment.
 */
export const getAllAvatarsForAssignment = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const avatars = await ctx.db.query("avatars").collect();

    return avatars.map((avatar) => ({
      _id: avatar._id,
      name: avatar.name,
      slug: avatar.slug,
      profileImage: avatar.profileImage,
      description: avatar.description,
    }));
  },
});

/**
 * Get the current user's teacher profile with avatar and company details.
 * Used by the teacher dashboard.
 */
export const getMyTeacherProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!teacher || teacher.status !== "active") return null;

    const company = teacher.companyId
      ? await ctx.db.get(teacher.companyId)
      : null;

    const avatars = await Promise.all(
      teacher.avatarIds.map(async (avatarId) => {
        const avatar = await ctx.db.get(avatarId);
        return avatar
          ? {
              _id: avatar._id,
              name: avatar.name,
              slug: avatar.slug,
              profileImage: avatar.profileImage,
              description: avatar.description,
            }
          : null;
      })
    );

    return {
      ...teacher,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
      company: company
        ? { _id: company._id, name: company.name, slug: company.slug }
        : null,
      avatars: avatars.filter((a) => a !== null),
    };
  },
});

/**
 * Get dashboard stats for the current teacher.
 */
export const getTeacherDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!teacher || teacher.status !== "active") return null;

    // Count practices created by this user
    const practices = await ctx.db
      .query("conversationPractice")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Count games created by this user
    const games = await ctx.db
      .query("wordGames")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Count placement tests created by this user
    const allTests = await ctx.db.query("placementTests").collect();
    const tests = allTests.filter(
      (t) => t.createdBy !== undefined && t.createdBy === user._id
    );

    // Count total sessions across teacher's practices
    let totalSessions = 0;
    for (const practice of practices) {
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_conversation_practice", (q) =>
          q.eq("conversationPracticeId", practice._id)
        )
        .collect();
      totalSessions += sessions.length;
    }

    return {
      practicesCount: practices.length,
      gamesCount: games.length,
      testsCount: tests.length,
      totalSessions,
      avatarsCount: teacher.avatarIds.length,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new teacher from an existing user.
 */
export const createTeacher = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")),
    avatarIds: v.optional(v.array(v.id("avatars"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin status
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can create teachers");
    }

    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already a teacher
    const existingTeacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingTeacher) {
      throw new Error("User is already a teacher");
    }

    // Check if company exists (if provided)
    if (args.companyId) {
      const company = await ctx.db.get(args.companyId);
      if (!company) {
        throw new Error("Company not found");
      }
    }

    // Validate avatar IDs
    if (args.avatarIds && args.avatarIds.length > 0) {
      for (const avatarId of args.avatarIds) {
        const avatar = await ctx.db.get(avatarId);
        if (!avatar) {
          throw new Error(`Avatar not found: ${avatarId}`);
        }
      }
    }

    const now = Date.now();

    const teacherId = await ctx.db.insert("teachers", {
      userId: args.userId,
      companyId: args.companyId,
      avatarIds: args.avatarIds || [],
      status: "active",
      notes: args.notes,
      createdBy: currentUser._id,
      createdAt: now,
      updatedAt: now,
    });

    return teacherId;
  },
});

/**
 * Update a teacher's status and/or notes.
 */
export const updateTeacher = mutation({
  args: {
    teacherId: v.id("teachers"),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin status
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update teachers");
    }

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) {
      updates.status = args.status;
    }

    if (args.notes !== undefined) {
      updates.notes = args.notes;
    }

    await ctx.db.patch(args.teacherId, updates);

    return args.teacherId;
  },
});

/**
 * Update a teacher's avatar assignments.
 */
export const updateTeacherAvatars = mutation({
  args: {
    teacherId: v.id("teachers"),
    avatarIds: v.array(v.id("avatars")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin status
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update teacher avatars");
    }

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Validate avatar IDs
    for (const avatarId of args.avatarIds) {
      const avatar = await ctx.db.get(avatarId);
      if (!avatar) {
        throw new Error(`Avatar not found: ${avatarId}`);
      }
    }

    await ctx.db.patch(args.teacherId, {
      avatarIds: args.avatarIds,
      updatedAt: Date.now(),
    });

    return args.teacherId;
  },
});

/**
 * Delete a teacher record.
 */
export const deleteTeacher = mutation({
  args: {
    teacherId: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin status
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can delete teachers");
    }

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    await ctx.db.delete(args.teacherId);

    return { success: true };
  },
});
