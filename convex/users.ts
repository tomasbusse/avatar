import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const debugListAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const debugListStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
  },
});

export const debugListMemories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("memories").collect();
  },
});

export const createCurrentUserAsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, { role: "admin", updatedAt: Date.now() });
      return { success: true, userId: existingUser._id, action: "promoted" };
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      firstName: identity.givenName,
      lastName: identity.familyName,
      imageUrl: identity.pictureUrl,
      role: "admin",
      status: "active",
      lastLoginAt: now,
      loginCount: 1,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, userId, action: "created" };
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists by clerkId
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        lastLoginAt: now,
        loginCount: existingUser.loginCount + 1,
        updatedAt: now,
      });
      return existingUser._id;
    }

    // Check for pending user with same email (admin-created user waiting for signup)
    const pendingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (pendingUser) {
      // Link Clerk account to pending user and activate
      await ctx.db.patch(pendingUser._id, {
        clerkId: args.clerkId,
        firstName: args.firstName ?? pendingUser.firstName,
        lastName: args.lastName ?? pendingUser.lastName,
        imageUrl: args.imageUrl,
        status: "active",
        lastLoginAt: now,
        loginCount: 1,
        updatedAt: now,
      });
      return pendingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      role: "student",
      status: "active",
      lastLoginAt: now,
      loginCount: 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Admin mutation to create a user manually (without Clerk signup).
 * The user will be in "pending" status until they sign up via Clerk.
 */
export const createUserByAdmin = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("moderator"),
        v.literal("student"),
        v.literal("guest")
      )
    ),
    // Optional: create student profile
    createStudentProfile: v.optional(v.boolean()),
    studentConfig: v.optional(
      v.object({
        nativeLanguage: v.optional(v.string()),
        targetLanguage: v.optional(v.string()),
        currentLevel: v.optional(v.string()),
        learningGoal: v.optional(
          v.union(
            v.literal("career"),
            v.literal("travel"),
            v.literal("exam"),
            v.literal("personal"),
            v.literal("academic")
          )
        ),
      })
    ),
    // Optional: assign to company/group
    companyId: v.optional(v.id("companies")),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can create users");
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error(`User with email ${args.email} already exists`);
    }

    const now = Date.now();

    // Create user with pending status (no clerkId yet)
    const userId = await ctx.db.insert("users", {
      clerkId: undefined,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role ?? "student",
      status: "pending",
      invitedBy: currentUser._id,
      invitedAt: now,
      loginCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    let studentId: Id<"students"> | undefined;

    // Optionally create student profile
    if (args.createStudentProfile) {
      const config = args.studentConfig ?? {};
      studentId = await ctx.db.insert("students", {
        userId,
        nativeLanguage: config.nativeLanguage ?? "de",
        targetLanguage: config.targetLanguage ?? "en",
        currentLevel: config.currentLevel ?? "A1",
        learningGoal: config.learningGoal ?? "career",
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

      // If group is specified, add to group
      if (args.groupId) {
        const group = await ctx.db.get(args.groupId);
        if (!group) throw new Error("Group not found");
        if (group.status !== "active") throw new Error("Cannot add to archived group");

        // Check capacity
        if (group.capacity) {
          const memberCount = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId!))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

          if (memberCount.length >= group.capacity) {
            throw new Error(`Group has reached maximum capacity (${group.capacity})`);
          }
        }

        await ctx.db.insert("groupMembers", {
          groupId: args.groupId,
          studentId,
          role: "member",
          joinedAt: now,
          status: "active",
        });

        // Assign student role for this company
        await ctx.db.insert("userRoleAssignments", {
          userId,
          roleId: "student",
          scope: "company",
          scopeId: group.companyId,
          assignedBy: currentUser._id,
          assignedAt: now,
          isActive: true,
        });
      }
    }

    // If only company is specified (no group), assign company role
    if (args.companyId && !args.groupId) {
      await ctx.db.insert("userRoleAssignments", {
        userId,
        roleId: "student",
        scope: "company",
        scopeId: args.companyId,
        assignedBy: currentUser._id,
        assignedAt: now,
        isActive: true,
      });
    }

    return { userId, studentId };
  },
});

export const deleteUserByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

/**
 * Track user login events (called from session.created webhook).
 * Updates lastLoginAt and increments loginCount for analytics.
 */
export const trackLogin = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      const now = Date.now();
      await ctx.db.patch(user._id, {
        lastLoginAt: now,
        loginCount: (user.loginCount ?? 0) + 1,
        updatedAt: now,
      });
    }
  },
});

// Bootstrap admin - use once then remove
export const setAdminByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        role: "admin",
        updatedAt: Date.now(),
      });
      return { success: true, userId: user._id };
    }
    return { success: false, error: "User not found" };
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user?.role === "admin";
  },
});

export const listUsers = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        cursor: v.optional(v.string()),
        numItems: v.optional(v.number()),
      })
    ),
    filters: v.optional(
      v.object({
        role: v.optional(
          v.union(
            v.literal("admin"),
            v.literal("moderator"),
            v.literal("student"),
            v.literal("guest")
          )
        ),
        status: v.optional(
          v.union(
            v.literal("active"),
            v.literal("suspended"),
            v.literal("banned"),
            v.literal("pending")
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || !["admin", "moderator"].includes(currentUser.role)) {
      throw new Error("Not authorized");
    }

    const numItems = args.paginationOpts?.numItems ?? 50;

    let query;
    if (args.filters?.role) {
      query = ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.filters!.role!));
    } else if (args.filters?.status) {
      query = ctx.db
        .query("users")
        .withIndex("by_status", (q) => q.eq("status", args.filters!.status!));
    } else {
      query = ctx.db.query("users");
    }

    const results = await query.order("desc").paginate({
      cursor: args.paginationOpts?.cursor ?? null,
      numItems,
    });

    return {
      users: results.page,
      nextCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("student"),
      v.literal("guest")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can change user roles");
    }

    // Prevent admin from removing their own admin role
    if (currentUser._id === args.userId && args.role !== "admin") {
      throw new Error("Cannot remove your own admin role");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const makeFirstAdmin = mutation({
  args: { 
    email: v.string(),
    clerkId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if any admin exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();

    if (existingAdmin) {
      throw new Error("An admin already exists. Use setUserRole instead.");
    }

    // Find user by email
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    // If user doesn't exist and clerkId provided, create them
    if (!user && args.clerkId) {
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: "admin",
        status: "active",
        lastLoginAt: now,
        loginCount: 1,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, userId, created: true };
    }

    if (!user) {
      throw new Error(`User with email ${args.email} not found. Provide clerkId to create.`);
    }

    await ctx.db.patch(user._id, {
      role: "admin",
      updatedAt: Date.now(),
    });

    return { success: true, userId: user._id };
  },
});

// ============================================
// RBAC-ENHANCED USER QUERIES
// ============================================

export const listUsersWithRoles = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        cursor: v.optional(v.string()),
        numItems: v.optional(v.number()),
      })
    ),
    filters: v.optional(
      v.object({
        role: v.optional(
          v.union(
            v.literal("admin"),
            v.literal("moderator"),
            v.literal("student"),
            v.literal("guest")
          )
        ),
        status: v.optional(
          v.union(
            v.literal("active"),
            v.literal("suspended"),
            v.literal("banned"),
            v.literal("pending")
          )
        ),
        rbacRoleId: v.optional(v.string()),
        companyId: v.optional(v.id("companies")),
        groupId: v.optional(v.id("groups")),
        search: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || !["admin", "moderator"].includes(currentUser.role)) {
      throw new Error("Not authorized");
    }

    const numItems = args.paginationOpts?.numItems ?? 50;

    // Build base query
    let query;
    if (args.filters?.role) {
      query = ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.filters!.role!));
    } else if (args.filters?.status) {
      query = ctx.db
        .query("users")
        .withIndex("by_status", (q) => q.eq("status", args.filters!.status!));
    } else {
      query = ctx.db.query("users");
    }

    const results = await query.order("desc").paginate({
      cursor: args.paginationOpts?.cursor ?? null,
      numItems,
    });

    // Enrich users with RBAC role info
    const enrichedUsers = await Promise.all(
      results.page.map(async (user) => {
        // Get active role assignments
        const roleAssignments = await ctx.db
          .query("userRoleAssignments")
          .withIndex("by_user_active", (q) =>
            q.eq("userId", user._id).eq("isActive", true)
          )
          .collect();

        // Enrich role assignments with role names and scope names
        const rbacRoles = await Promise.all(
          roleAssignments.map(async (assignment) => {
            const role = await ctx.db
              .query("roles")
              .withIndex("by_role_id", (q) => q.eq("id", assignment.roleId))
              .first();

            let scopeName: string | undefined;
            if (assignment.scope === "company" && assignment.scopeId) {
              const company = await ctx.db.get(
                assignment.scopeId as unknown as Id<"companies">
              );
              scopeName = company?.name;
            } else if (assignment.scope === "group" && assignment.scopeId) {
              const group = await ctx.db.get(
                assignment.scopeId as unknown as Id<"groups">
              );
              scopeName = group?.name;
            }

            return {
              assignmentId: assignment._id,
              roleId: assignment.roleId,
              roleName: role?.name ?? assignment.roleId,
              scope: assignment.scope,
              scopeId: assignment.scopeId,
              scopeName,
            };
          })
        );

        // Get student profile if exists
        const student = await ctx.db
          .query("students")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        return {
          ...user,
          rbacRoles,
          studentProfile: student
            ? {
                _id: student._id,
                currentLevel: student.currentLevel,
                nativeLanguage: student.nativeLanguage,
              }
            : null,
        };
      })
    );

    // Apply post-query filters
    let filteredUsers = enrichedUsers;

    // Search filter
    if (args.filters?.search) {
      const search = args.filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.email?.toLowerCase().includes(search) ||
          u.firstName?.toLowerCase().includes(search) ||
          u.lastName?.toLowerCase().includes(search)
      );
    }

    // RBAC role filter
    if (args.filters?.rbacRoleId) {
      filteredUsers = filteredUsers.filter((u) =>
        u.rbacRoles.some((r) => r.roleId === args.filters!.rbacRoleId)
      );
    }

    // Company filter
    if (args.filters?.companyId) {
      filteredUsers = filteredUsers.filter((u) =>
        u.rbacRoles.some(
          (r) =>
            r.scope === "company" && r.scopeId === args.filters!.companyId
        )
      );
    }

    // Group filter
    if (args.filters?.groupId) {
      filteredUsers = filteredUsers.filter((u) =>
        u.rbacRoles.some(
          (r) => r.scope === "group" && r.scopeId === args.filters!.groupId
        )
      );
    }

    return {
      users: filteredUsers,
      nextCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

export const getUserWithRoles = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || !["admin", "moderator"].includes(currentUser.role)) {
      throw new Error("Not authorized");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get role assignments
    const roleAssignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    // Enrich with role names and scope info
    const rbacRoles = await Promise.all(
      roleAssignments.map(async (assignment) => {
        const role = await ctx.db
          .query("roles")
          .withIndex("by_role_id", (q) => q.eq("id", assignment.roleId))
          .first();

        let scopeName: string | undefined;
        if (assignment.scope === "company" && assignment.scopeId) {
          const company = await ctx.db.get(
            assignment.scopeId as unknown as Id<"companies">
          );
          scopeName = company?.name;
        } else if (assignment.scope === "group" && assignment.scopeId) {
          const group = await ctx.db.get(
            assignment.scopeId as unknown as Id<"groups">
          );
          scopeName = group?.name;
        }

        return {
          assignmentId: assignment._id,
          roleId: assignment.roleId,
          roleName: role?.name ?? assignment.roleId,
          scope: assignment.scope,
          scopeId: assignment.scopeId,
          scopeName,
          assignedAt: assignment.assignedAt,
          notes: assignment.notes,
        };
      })
    );

    // Get student profile
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Get companies user belongs to
    const companyRoles = rbacRoles.filter((r) => r.scope === "company");
    const companies = await Promise.all(
      companyRoles.map(async (r) => {
        if (!r.scopeId) return null;
        return await ctx.db.get(r.scopeId as unknown as Id<"companies">);
      })
    );

    // Get groups user belongs to
    const groupRoles = rbacRoles.filter((r) => r.scope === "group");
    const groups = await Promise.all(
      groupRoles.map(async (r) => {
        if (!r.scopeId) return null;
        return await ctx.db.get(r.scopeId as unknown as Id<"groups">);
      })
    );

    return {
      ...user,
      rbacRoles,
      studentProfile: student,
      companies: companies.filter(Boolean),
      groups: groups.filter(Boolean),
    };
  },
});

/**
 * Get users with student profiles who can be added to a specific group.
 * Returns users who have a student profile but are NOT already members of the group.
 */
export const listUsersAvailableForGroup = query({
  args: {
    groupId: v.id("groups"),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || !["admin", "moderator"].includes(currentUser.role)) {
      throw new Error("Not authorized");
    }

    // Get group to verify it exists
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    // Get current group members (student IDs)
    const existingMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const memberStudentIds = new Set(
      existingMembers.map((m) => m.studentId.toString())
    );

    // Get all students
    const students = await ctx.db.query("students").collect();

    // Filter and enrich
    const availableUsers = [];
    for (const student of students) {
      // Skip if already a member
      if (memberStudentIds.has(student._id.toString())) continue;

      const user = await ctx.db.get(student.userId);
      if (!user) continue;

      // Search filter
      if (args.search) {
        const search = args.search.toLowerCase();
        const matches =
          user.email.toLowerCase().includes(search) ||
          user.firstName?.toLowerCase().includes(search) ||
          user.lastName?.toLowerCase().includes(search);
        if (!matches) continue;
      }

      availableUsers.push({
        userId: user._id,
        studentId: student._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        status: user.status,
        currentLevel: student.currentLevel,
      });
    }

    return availableUsers.slice(0, args.limit ?? 50);
  },
});

// ============================================
// USER CRUD OPERATIONS
// ============================================

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("moderator"),
        v.literal("student"),
        v.literal("guest")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("banned"),
        v.literal("pending")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update users");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Prevent admin from removing their own admin role
    if (currentUser._id === args.userId && args.role && args.role !== "admin") {
      throw new Error("Cannot remove your own admin role");
    }

    // Prevent changing own status
    if (currentUser._id === args.userId && args.status && args.status !== "active") {
      throw new Error("Cannot suspend or ban yourself");
    }

    // Check for email uniqueness if changing email
    if (args.email && args.email !== user.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();
      if (existingUser && existingUser._id !== args.userId) {
        throw new Error("Email already in use by another user");
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.email !== undefined) updates.email = args.email;
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.role !== undefined) updates.role = args.role;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.userId, updates);

    return { success: true };
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can delete users");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Prevent deleting yourself
    if (currentUser._id === args.userId) {
      throw new Error("Cannot delete yourself");
    }

    if (args.hardDelete) {
      // Hard delete: Remove user and all related data
      // Delete role assignments
      const roleAssignments = await ctx.db
        .query("userRoleAssignments")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      for (const assignment of roleAssignments) {
        await ctx.db.delete(assignment._id);
      }

      // Delete student profile
      const student = await ctx.db
        .query("students")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();
      if (student) {
        // Remove from groups
        const groupMemberships = await ctx.db
          .query("groupMembers")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .collect();
        for (const membership of groupMemberships) {
          await ctx.db.delete(membership._id);
        }
        await ctx.db.delete(student._id);
      }

      // Delete user
      await ctx.db.delete(args.userId);
    } else {
      // Soft delete: Set status to banned
      await ctx.db.patch(args.userId, {
        status: "banned",
        updatedAt: Date.now(),
      });

      // Deactivate role assignments
      const roleAssignments = await ctx.db
        .query("userRoleAssignments")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      for (const assignment of roleAssignments) {
        await ctx.db.patch(assignment._id, { isActive: false });
      }
    }

    return { success: true, hardDeleted: args.hardDelete ?? false };
  },
});

export const bulkDeleteUsers = mutation({
  args: {
    userIds: v.array(v.id("users")),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can delete users");
    }

    // Prevent deleting yourself
    if (args.userIds.includes(currentUser._id)) {
      throw new Error("Cannot delete yourself");
    }

    const results: { userId: Id<"users">; success: boolean; error?: string }[] = [];

    for (const userId of args.userIds) {
      try {
        const user = await ctx.db.get(userId);
        if (!user) {
          results.push({ userId, success: false, error: "User not found" });
          continue;
        }

        if (args.hardDelete) {
          // Hard delete: Remove user and all related data
          // Delete role assignments
          const roleAssignments = await ctx.db
            .query("userRoleAssignments")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
          for (const assignment of roleAssignments) {
            await ctx.db.delete(assignment._id);
          }

          // Delete student profile
          const student = await ctx.db
            .query("students")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
          if (student) {
            // Remove from groups
            const groupMemberships = await ctx.db
              .query("groupMembers")
              .withIndex("by_student", (q) => q.eq("studentId", student._id))
              .collect();
            for (const membership of groupMemberships) {
              await ctx.db.delete(membership._id);
            }
            await ctx.db.delete(student._id);
          }

          // Delete user
          await ctx.db.delete(userId);
        } else {
          // Soft delete: Set status to banned
          await ctx.db.patch(userId, {
            status: "banned",
            updatedAt: Date.now(),
          });

          // Deactivate role assignments
          const roleAssignments = await ctx.db
            .query("userRoleAssignments")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
          for (const assignment of roleAssignments) {
            await ctx.db.patch(assignment._id, { isActive: false });
          }
        }

        results.push({ userId, success: true });
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return {
      success: failCount === 0,
      successCount,
      failCount,
      results,
      hardDeleted: args.hardDelete ?? false,
    };
  },
});
