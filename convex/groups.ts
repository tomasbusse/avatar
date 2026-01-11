import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// QUERIES
// ============================================

export const listGroups = query({
  args: {
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
    paginationOpts: v.optional(
      v.object({
        cursor: v.optional(v.string()),
        numItems: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const numItems = args.paginationOpts?.numItems ?? 50;

    let query;
    if (args.companyId) {
      query = ctx.db
        .query("groups")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId!));
    } else {
      query = ctx.db.query("groups");
    }

    const results = await query.order("desc").paginate({
      cursor: args.paginationOpts?.cursor ?? null,
      numItems,
    });

    // Filter by status if specified
    let groups = results.page;
    if (args.status) {
      groups = groups.filter((g) => g.status === args.status);
    }

    // Enrich with company name and member count
    const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
        const company = await ctx.db.get(group.companyId);
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        // Find lead
        const leadMember = members.find((m) => m.role === "lead");
        let leadUser = null;
        if (leadMember) {
          const student = await ctx.db.get(leadMember.studentId);
          if (student?.userId) {
            leadUser = await ctx.db.get(student.userId);
          }
        }

        return {
          ...group,
          companyName: company?.name ?? "Unknown",
          memberCount: members.length,
          leadName: leadUser
            ? `${leadUser.firstName ?? ""} ${leadUser.lastName ?? ""}`.trim() ||
              leadUser.email
            : null,
        };
      })
    );

    return {
      groups: enrichedGroups,
      nextCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const company = await ctx.db.get(group.companyId);
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      ...group,
      companyName: company?.name ?? "Unknown",
      memberCount: members.length,
    };
  },
});

export const getGroupMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Enrich with student and user info
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const student = await ctx.db.get(member.studentId);
        let user = null;
        if (student?.userId) {
          user = await ctx.db.get(student.userId);
        }

        return {
          ...member,
          student: student
            ? {
                _id: student._id,
                currentLevel: student.currentLevel,
                nativeLanguage: student.nativeLanguage,
              }
            : null,
          user: user
            ? {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );

    return enrichedMembers;
  },
});

// ============================================
// MUTATIONS
// ============================================

export const createGroup = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    targetLevel: v.optional(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      )
    ),
    capacity: v.optional(v.number()),
    defaultAvatarId: v.optional(v.id("avatars")),
    settings: v.optional(
      v.object({
        allowPeerInteraction: v.optional(v.boolean()),
        showLeaderboard: v.optional(v.boolean()),
        notifyOnProgress: v.optional(v.boolean()),
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

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can create groups");
    }

    // Verify company exists
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");

    // Check max groups limit
    if (company.maxGroups) {
      const existingGroups = await ctx.db
        .query("groups")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (existingGroups.length >= company.maxGroups) {
        throw new Error(
          `Company has reached maximum group limit (${company.maxGroups})`
        );
      }
    }

    // Check slug uniqueness within company
    const existingSlug = await ctx.db
      .query("groups")
      .withIndex("by_company_slug", (q) =>
        q.eq("companyId", args.companyId).eq("slug", args.slug)
      )
      .first();

    if (existingSlug) {
      throw new Error("Group slug already exists in this company");
    }

    const now = Date.now();

    const groupId = await ctx.db.insert("groups", {
      companyId: args.companyId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      targetLevel: args.targetLevel,
      capacity: args.capacity,
      defaultAvatarId: args.defaultAvatarId,
      status: "active",
      settings: args.settings ?? {
        allowPeerInteraction: true,
        showLeaderboard: true,
        notifyOnProgress: true,
      },
      createdBy: currentUser._id,
      createdAt: now,
      updatedAt: now,
    });

    return groupId;
  },
});

export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    targetLevel: v.optional(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      )
    ),
    capacity: v.optional(v.number()),
    defaultAvatarId: v.optional(v.id("avatars")),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
    settings: v.optional(
      v.object({
        allowPeerInteraction: v.optional(v.boolean()),
        showLeaderboard: v.optional(v.boolean()),
        notifyOnProgress: v.optional(v.boolean()),
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

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update groups");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const { groupId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(args.groupId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const archiveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can archive groups");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    await ctx.db.patch(args.groupId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    // Deactivate all group-scoped role assignments
    const roleAssignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_scope", (q) =>
        q.eq("scope", "group").eq("scopeId", args.groupId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const assignment of roleAssignments) {
      await ctx.db.patch(assignment._id, { isActive: false });
    }

    return { success: true };
  },
});

export const deleteGroup = mutation({
  args: {
    groupId: v.id("groups"),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can delete groups");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    // Check for active members
    const activeMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (activeMembers && !args.force) {
      throw new Error(
        "Group has active members. Remove members first or use force=true."
      );
    }

    // If force, remove all members
    if (args.force) {
      const allMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .collect();

      for (const member of allMembers) {
        await ctx.db.delete(member._id);
      }

      // Deactivate role assignments
      const roleAssignments = await ctx.db
        .query("userRoleAssignments")
        .withIndex("by_scope", (q) =>
          q.eq("scope", "group").eq("scopeId", args.groupId)
        )
        .collect();

      for (const assignment of roleAssignments) {
        await ctx.db.patch(assignment._id, { isActive: false });
      }
    }

    await ctx.db.delete(args.groupId);

    return { success: true };
  },
});

// ============================================
// MEMBER MANAGEMENT
// ============================================

export const addMemberToGroup = mutation({
  args: {
    groupId: v.id("groups"),
    studentId: v.id("students"),
    role: v.optional(v.union(v.literal("member"), v.literal("lead"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can add group members");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (group.status !== "active") {
      throw new Error("Cannot add members to archived group");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    // Check if already a member
    const existingMember = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_student", (q) =>
        q.eq("groupId", args.groupId).eq("studentId", args.studentId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingMember) {
      throw new Error("Student is already a member of this group");
    }

    // Check capacity
    if (group.capacity) {
      const currentMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (currentMembers.length >= group.capacity) {
        throw new Error(
          `Group has reached maximum capacity (${group.capacity})`
        );
      }
    }

    const memberId = await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      studentId: args.studentId,
      role: args.role ?? "member",
      joinedAt: Date.now(),
      status: "active",
    });

    // If role is lead, also assign group_lead RBAC role
    if (args.role === "lead" && student.userId) {
      const company = await ctx.db.get(group.companyId);

      // Check if already has group_lead role for this group
      const existingRole = await ctx.db
        .query("userRoleAssignments")
        .withIndex("by_user", (q) => q.eq("userId", student.userId!))
        .filter((q) =>
          q.and(
            q.eq(q.field("roleId"), "group_lead"),
            q.eq(q.field("scope"), "group"),
            q.eq(q.field("scopeId"), args.groupId),
            q.eq(q.field("isActive"), true)
          )
        )
        .first();

      if (!existingRole) {
        const now = Date.now();
        await ctx.db.insert("userRoleAssignments", {
          userId: student.userId,
          roleId: "group_lead",
          scope: "group",
          scopeId: args.groupId,
          assignedBy: currentUser._id,
          assignedAt: now,
          isActive: true,
          notes: "Assigned as group lead",
        });

        // Audit log
        await ctx.db.insert("roleAuditLog", {
          action: "role_assigned",
          userId: student.userId,
          roleId: "group_lead",
          roleName: "Group Lead",
          scope: "group",
          scopeId: args.groupId,
          scopeName: group.name,
          performedBy: currentUser._id,
          performedByName:
            `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
            currentUser.email,
          notes: "Assigned as group lead when added to group",
          createdAt: now,
        });
      }
    }

    return memberId;
  },
});

export const removeMemberFromGroup = mutation({
  args: {
    groupId: v.id("groups"),
    studentId: v.id("students"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can remove group members");
    }

    const member = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_student", (q) =>
        q.eq("groupId", args.groupId).eq("studentId", args.studentId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!member) {
      throw new Error("Member not found in this group");
    }

    const now = Date.now();

    await ctx.db.patch(member._id, {
      status: "removed",
      removedAt: now,
      removedReason: args.reason,
    });

    // If was a lead, revoke group_lead role
    if (member.role === "lead") {
      const student = await ctx.db.get(args.studentId);
      if (student?.userId) {
        const roleAssignment = await ctx.db
          .query("userRoleAssignments")
          .withIndex("by_user", (q) => q.eq("userId", student.userId!))
          .filter((q) =>
            q.and(
              q.eq(q.field("roleId"), "group_lead"),
              q.eq(q.field("scope"), "group"),
              q.eq(q.field("scopeId"), args.groupId),
              q.eq(q.field("isActive"), true)
            )
          )
          .first();

        if (roleAssignment) {
          await ctx.db.patch(roleAssignment._id, { isActive: false });

          const group = await ctx.db.get(args.groupId);

          // Audit log
          await ctx.db.insert("roleAuditLog", {
            action: "role_revoked",
            userId: student.userId,
            roleId: "group_lead",
            roleName: "Group Lead",
            scope: "group",
            scopeId: args.groupId,
            scopeName: group?.name ?? "Unknown",
            performedBy: currentUser._id,
            performedByName:
              `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
              currentUser.email,
            notes: args.reason ?? "Removed from group",
            createdAt: now,
          });
        }
      }
    }

    return { success: true };
  },
});

export const updateMemberRole = mutation({
  args: {
    groupId: v.id("groups"),
    studentId: v.id("students"),
    role: v.union(v.literal("member"), v.literal("lead")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update member roles");
    }

    const member = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_student", (q) =>
        q.eq("groupId", args.groupId).eq("studentId", args.studentId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!member) {
      throw new Error("Member not found in this group");
    }

    const previousRole = member.role;

    await ctx.db.patch(member._id, { role: args.role });

    const student = await ctx.db.get(args.studentId);
    const group = await ctx.db.get(args.groupId);
    const now = Date.now();

    // Handle RBAC role changes
    if (student?.userId) {
      if (args.role === "lead" && previousRole !== "lead") {
        // Promoting to lead - assign group_lead role
        const existingRole = await ctx.db
          .query("userRoleAssignments")
          .withIndex("by_user", (q) => q.eq("userId", student.userId!))
          .filter((q) =>
            q.and(
              q.eq(q.field("roleId"), "group_lead"),
              q.eq(q.field("scope"), "group"),
              q.eq(q.field("scopeId"), args.groupId),
              q.eq(q.field("isActive"), true)
            )
          )
          .first();

        if (!existingRole) {
          await ctx.db.insert("userRoleAssignments", {
            userId: student.userId,
            roleId: "group_lead",
            scope: "group",
            scopeId: args.groupId,
            assignedBy: currentUser._id,
            assignedAt: now,
            isActive: true,
            notes: "Promoted to group lead",
          });

          await ctx.db.insert("roleAuditLog", {
            action: "role_assigned",
            userId: student.userId,
            roleId: "group_lead",
            roleName: "Group Lead",
            scope: "group",
            scopeId: args.groupId,
            scopeName: group?.name ?? "Unknown",
            performedBy: currentUser._id,
            performedByName:
              `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
              currentUser.email,
            notes: "Promoted to group lead",
            createdAt: now,
          });
        }
      } else if (args.role === "member" && previousRole === "lead") {
        // Demoting from lead - revoke group_lead role
        const roleAssignment = await ctx.db
          .query("userRoleAssignments")
          .withIndex("by_user", (q) => q.eq("userId", student.userId!))
          .filter((q) =>
            q.and(
              q.eq(q.field("roleId"), "group_lead"),
              q.eq(q.field("scope"), "group"),
              q.eq(q.field("scopeId"), args.groupId),
              q.eq(q.field("isActive"), true)
            )
          )
          .first();

        if (roleAssignment) {
          await ctx.db.patch(roleAssignment._id, { isActive: false });

          await ctx.db.insert("roleAuditLog", {
            action: "role_revoked",
            userId: student.userId,
            roleId: "group_lead",
            roleName: "Group Lead",
            scope: "group",
            scopeId: args.groupId,
            scopeName: group?.name ?? "Unknown",
            performedBy: currentUser._id,
            performedByName:
              `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
              currentUser.email,
            notes: "Demoted from group lead",
            createdAt: now,
          });
        }
      }
    }

    return { success: true };
  },
});

// ============================================
// GROUP LEAD ASSIGNMENT
// ============================================

export const assignGroupLead = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can assign group leads");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    // Check if already has group_lead role for this group
    const existing = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("roleId"), "group_lead"),
          q.eq(q.field("scope"), "group"),
          q.eq(q.field("scopeId"), args.groupId),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (existing) {
      throw new Error("User is already a group lead for this group");
    }

    const now = Date.now();
    const company = await ctx.db.get(group.companyId);

    // Create role assignment
    const assignmentId = await ctx.db.insert("userRoleAssignments", {
      userId: args.userId,
      roleId: "group_lead",
      scope: "group",
      scopeId: args.groupId,
      assignedBy: currentUser._id,
      assignedAt: now,
      isActive: true,
      notes: args.notes,
    });

    // Audit log
    await ctx.db.insert("roleAuditLog", {
      action: "role_assigned",
      userId: args.userId,
      roleId: "group_lead",
      roleName: "Group Lead",
      scope: "group",
      scopeId: args.groupId,
      scopeName: group.name,
      performedBy: currentUser._id,
      performedByName:
        `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
        currentUser.email,
      notes: args.notes,
      createdAt: now,
    });

    return { success: true, assignmentId };
  },
});

// ============================================
// CREATE USER AND ADD TO GROUP
// ============================================

/**
 * Create a new user with student profile and add them to a group in one operation.
 * The user will be in "pending" status until they sign up via Clerk.
 */
export const createUserAndAddToGroup = mutation({
  args: {
    groupId: v.id("groups"),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("member"), v.literal("lead"))),
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

    // Verify group exists and is active
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    if (group.status !== "active") throw new Error("Cannot add to archived group");

    // Check capacity
    if (group.capacity) {
      const currentMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (currentMembers.length >= group.capacity) {
        throw new Error(`Group has reached maximum capacity (${group.capacity})`);
      }
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error(
        `User with email ${args.email} already exists. Use "Add Existing User" instead.`
      );
    }

    const now = Date.now();
    const config = args.studentConfig ?? {};

    // 1. Create user with pending status
    const userId = await ctx.db.insert("users", {
      clerkId: undefined,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "student",
      status: "pending",
      invitedBy: currentUser._id,
      invitedAt: now,
      loginCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Create student profile
    const studentId = await ctx.db.insert("students", {
      userId,
      nativeLanguage: config.nativeLanguage ?? "de",
      targetLanguage: config.targetLanguage ?? "en",
      currentLevel: config.currentLevel ?? group.targetLevel ?? "A1",
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

    // 3. Add to group
    const memberRole = args.role ?? "member";
    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      studentId,
      role: memberRole,
      joinedAt: now,
      status: "active",
    });

    // 4. Assign student role for this company
    await ctx.db.insert("userRoleAssignments", {
      userId,
      roleId: "student",
      scope: "company",
      scopeId: group.companyId,
      assignedBy: currentUser._id,
      assignedAt: now,
      isActive: true,
    });

    // 5. If assigned as lead, also assign group_lead role
    if (memberRole === "lead") {
      await ctx.db.insert("userRoleAssignments", {
        userId,
        roleId: "group_lead",
        scope: "group",
        scopeId: args.groupId,
        assignedBy: currentUser._id,
        assignedAt: now,
        isActive: true,
      });

      // Audit log for lead assignment
      await ctx.db.insert("roleAuditLog", {
        action: "role_assigned",
        userId,
        roleId: "group_lead",
        roleName: "Group Lead",
        scope: "group",
        scopeId: args.groupId,
        scopeName: group.name,
        performedBy: currentUser._id,
        performedByName:
          `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
          currentUser.email,
        notes: "Assigned as lead on user creation",
        createdAt: now,
      });
    }

    return { userId, studentId };
  },
});

// ============================================
// ADDITIONAL QUERIES FOR GROUP MANAGEMENT
// ============================================

/**
 * Get students NOT in a specific group (for add member dialog)
 */
export const getAvailableStudentsForGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get existing members of this group
    const existingMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const memberStudentIds = new Set(existingMembers.map((m) => m.studentId));

    // Get all students
    const allStudents = await ctx.db.query("students").collect();

    // Filter out students already in the group
    const availableStudents = allStudents.filter(
      (s) => !memberStudentIds.has(s._id)
    );

    // Enrich with user info
    const enrichedStudents = await Promise.all(
      availableStudents.map(async (student) => {
        const user = student.userId ? await ctx.db.get(student.userId) : null;
        return {
          ...student,
          user: user
            ? {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );

    return enrichedStudents;
  },
});

/**
 * Bulk add multiple students to a group
 */
export const bulkAddMembersToGroup = mutation({
  args: {
    groupId: v.id("groups"),
    studentIds: v.array(v.id("students")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can add group members");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (group.status !== "active") {
      throw new Error("Cannot add members to archived group");
    }

    // Check capacity
    if (group.capacity) {
      const currentMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (currentMembers.length + args.studentIds.length > group.capacity) {
        throw new Error(
          `Adding ${args.studentIds.length} members would exceed group capacity (${group.capacity})`
        );
      }
    }

    const now = Date.now();
    let addedCount = 0;

    for (const studentId of args.studentIds) {
      // Check if already a member
      const existingMember = await ctx.db
        .query("groupMembers")
        .withIndex("by_group_student", (q) =>
          q.eq("groupId", args.groupId).eq("studentId", studentId)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (!existingMember) {
        await ctx.db.insert("groupMembers", {
          groupId: args.groupId,
          studentId,
          role: "member",
          joinedAt: now,
          status: "active",
        });
        addedCount++;
      }
    }

    return { success: true, addedCount };
  },
});

/**
 * Get groups not assigned to any company (orphaned groups)
 */
export const getUnassignedGroups = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const allGroups = await ctx.db.query("groups").collect();

    // Filter groups without a companyId
    const unassignedGroups = allGroups.filter((g) => !g.companyId);

    // Enrich with member count
    const enrichedGroups = await Promise.all(
      unassignedGroups.map(async (group) => {
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        return {
          ...group,
          memberCount: members.length,
        };
      })
    );

    return enrichedGroups;
  },
});

/**
 * Assign an existing group to a company
 */
export const assignGroupToCompany = mutation({
  args: {
    groupId: v.id("groups"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can assign groups to companies");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");

    // Check max groups limit
    if (company.maxGroups) {
      const existingGroups = await ctx.db
        .query("groups")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (existingGroups.length >= company.maxGroups) {
        throw new Error(
          `Company has reached maximum group limit (${company.maxGroups})`
        );
      }
    }

    await ctx.db.patch(args.groupId, {
      companyId: args.companyId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a group from a company (unassign)
 */
export const unassignGroupFromCompany = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can unassign groups from companies");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    await ctx.db.patch(args.groupId, {
      companyId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
