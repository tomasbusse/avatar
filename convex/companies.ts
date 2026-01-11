import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// QUERIES
// ============================================

export const listCompanies = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        cursor: v.optional(v.string()),
        numItems: v.optional(v.number()),
      })
    ),
    filters: v.optional(
      v.object({
        subscriptionStatus: v.optional(
          v.union(
            v.literal("active"),
            v.literal("trial"),
            v.literal("suspended"),
            v.literal("cancelled")
          )
        ),
        subscriptionTier: v.optional(
          v.union(
            v.literal("free"),
            v.literal("starter"),
            v.literal("professional"),
            v.literal("enterprise")
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const numItems = args.paginationOpts?.numItems ?? 50;

    let query;
    if (args.filters?.subscriptionStatus) {
      query = ctx.db
        .query("companies")
        .withIndex("by_status", (q) =>
          q.eq("subscriptionStatus", args.filters!.subscriptionStatus!)
        );
    } else {
      query = ctx.db.query("companies");
    }

    const results = await query.order("desc").paginate({
      cursor: args.paginationOpts?.cursor ?? null,
      numItems,
    });

    // Filter by tier if specified (post-query filter since no index)
    let companies = results.page;
    if (args.filters?.subscriptionTier) {
      companies = companies.filter(
        (c) => c.subscriptionTier === args.filters!.subscriptionTier
      );
    }

    return {
      companies,
      nextCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

export const getCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.companyId);
  },
});

export const getCompanyBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getCompanyStats = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) return null;

    // Count groups for this company
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const activeGroups = groups.filter((g) => g.status === "active");

    // Count users with company-scoped role assignments
    const roleAssignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_scope", (q) =>
        q.eq("scope", "company").eq("scopeId", args.companyId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const uniqueUserIds = new Set(roleAssignments.map((a) => a.userId));

    // Count active group members across all groups
    let activeStudents = 0;
    for (const group of activeGroups) {
      const members = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
      activeStudents += members.length;
    }

    return {
      groupCount: groups.length,
      activeGroupCount: activeGroups.length,
      userCount: uniqueUserIds.size,
      activeStudents,
      maxStudents: company.maxStudents ?? null,
      maxGroups: company.maxGroups ?? null,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

export const createCompany = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise")
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("trial"),
      v.literal("suspended"),
      v.literal("cancelled")
    ),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
    maxGroups: v.optional(v.number()),
    settings: v.optional(
      v.object({
        defaultLanguage: v.optional(v.string()),
        timezone: v.optional(v.string()),
        customBranding: v.optional(v.boolean()),
      })
    ),
    rbacSettings: v.optional(
      v.object({
        customRolesEnabled: v.optional(v.boolean()),
        maxCustomRoles: v.optional(v.number()),
        allowSelfEnrollment: v.optional(v.boolean()),
        requireApprovalForNewUsers: v.optional(v.boolean()),
        defaultNewUserRole: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can create companies");
    }

    // Check slug uniqueness
    const existingSlug = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existingSlug) {
      throw new Error("Company slug already exists");
    }

    const now = Date.now();

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      subscriptionTier: args.subscriptionTier,
      subscriptionStatus: args.subscriptionStatus,
      logoUrl: args.logoUrl,
      website: args.website,
      billingEmail: args.billingEmail,
      maxStudents: args.maxStudents,
      maxGroups: args.maxGroups,
      settings: args.settings ?? {
        defaultLanguage: "en",
        timezone: "Europe/Berlin",
        customBranding: false,
      },
      rbacSettings: {
        customRolesEnabled: false,
        maxCustomRoles: 5,
        allowSelfEnrollment: false,
        requireApprovalForNewUsers: true,
        defaultNewUserRole: "student",
        ...args.rbacSettings,
      },
      createdBy: currentUser._id,
      createdAt: now,
      updatedAt: now,
    });

    return companyId;
  },
});

export const updateCompany = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    subscriptionTier: v.optional(
      v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("professional"),
        v.literal("enterprise")
      )
    ),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("trial"),
        v.literal("suspended"),
        v.literal("cancelled")
      )
    ),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
    maxGroups: v.optional(v.number()),
    settings: v.optional(
      v.object({
        defaultLanguage: v.optional(v.string()),
        timezone: v.optional(v.string()),
        customBranding: v.optional(v.boolean()),
      })
    ),
    rbacSettings: v.optional(
      v.object({
        customRolesEnabled: v.optional(v.boolean()),
        maxCustomRoles: v.optional(v.number()),
        allowSelfEnrollment: v.optional(v.boolean()),
        requireApprovalForNewUsers: v.optional(v.boolean()),
        defaultNewUserRole: v.optional(v.string()),
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
      throw new Error("Only admins can update companies");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");

    const { companyId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(args.companyId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteCompany = mutation({
  args: {
    companyId: v.id("companies"),
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
      throw new Error("Only admins can delete companies");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");

    // Check if company has groups
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .first();

    if (groups && !args.force) {
      throw new Error(
        "Company has groups. Use force=true to delete anyway, or archive groups first."
      );
    }

    // Check if company has role assignments
    const roleAssignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_scope", (q) =>
        q.eq("scope", "company").eq("scopeId", args.companyId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (roleAssignments && !args.force) {
      throw new Error(
        "Company has active role assignments. Remove assignments first or use force=true."
      );
    }

    // If force, deactivate all role assignments first
    if (args.force) {
      const allAssignments = await ctx.db
        .query("userRoleAssignments")
        .withIndex("by_scope", (q) =>
          q.eq("scope", "company").eq("scopeId", args.companyId)
        )
        .collect();

      for (const assignment of allAssignments) {
        await ctx.db.patch(assignment._id, { isActive: false });
      }

      // Archive all groups
      const allGroups = await ctx.db
        .query("groups")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      for (const group of allGroups) {
        await ctx.db.patch(group._id, { status: "archived" });
      }
    }

    // Delete the company
    await ctx.db.delete(args.companyId);

    return { success: true };
  },
});

// ============================================
// COMPANY ADMIN ASSIGNMENT
// ============================================

export const assignCompanyAdmin = mutation({
  args: {
    companyId: v.id("companies"),
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
      throw new Error("Only admins can assign company admins");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    // Check if already has company_admin role for this company
    const existing = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("roleId"), "company_admin"),
          q.eq(q.field("scope"), "company"),
          q.eq(q.field("scopeId"), args.companyId),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (existing) {
      throw new Error("User is already a company admin for this company");
    }

    const now = Date.now();

    // Create role assignment
    const assignmentId = await ctx.db.insert("userRoleAssignments", {
      userId: args.userId,
      roleId: "company_admin",
      scope: "company",
      scopeId: args.companyId,
      assignedBy: currentUser._id,
      assignedAt: now,
      isActive: true,
      notes: args.notes,
    });

    // Audit log
    await ctx.db.insert("roleAuditLog", {
      action: "role_assigned",
      userId: args.userId,
      roleId: "company_admin",
      roleName: "Company Admin",
      scope: "company",
      scopeId: args.companyId,
      scopeName: company.name,
      performedBy: currentUser._id,
      performedByName: `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() || currentUser.email,
      notes: args.notes,
      createdAt: now,
    });

    return { success: true, assignmentId };
  },
});

// ============================================
// COMPANY DETAILS WITH NESTED DATA
// ============================================

/**
 * Get full company details including groups, students, and admins.
 * Used for the company detail page.
 */
export const getCompanyWithDetails = query({
  args: { companyId: v.id("companies") },
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

    const company = await ctx.db.get(args.companyId);
    if (!company) return null;

    // Get all groups for this company
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // Enrich groups with member counts and leads
    const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        const leadMember = members.find((m) => m.role === "lead");
        let leadName: string | null = null;
        if (leadMember) {
          const student = await ctx.db.get(leadMember.studentId);
          if (student?.userId) {
            const leadUser = await ctx.db.get(student.userId);
            if (leadUser) {
              leadName =
                `${leadUser.firstName ?? ""} ${leadUser.lastName ?? ""}`.trim() ||
                leadUser.email;
            }
          }
        }

        return {
          ...group,
          memberCount: members.length,
          leadName,
        };
      })
    );

    // Get all unique students across all groups
    const allStudentIds = new Set<string>();
    for (const group of groups) {
      const members = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const member of members) {
        allStudentIds.add(member.studentId.toString());
      }
    }

    // Get users for these students with their group memberships
    const students = [];
    for (const studentIdStr of Array.from(allStudentIds)) {
      const student = await ctx.db.get(studentIdStr as Id<"students">);
      if (student) {
        const user = await ctx.db.get(student.userId);
        if (user) {
          // Get which groups this student is in
          const studentGroups = await ctx.db
            .query("groupMembers")
            .withIndex("by_student", (q) => q.eq("studentId", student._id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

          // Only include groups from this company
          const companyGroupIds = new Set(groups.map((g) => g._id.toString()));
          const studentCompanyGroups = studentGroups.filter((sg) =>
            companyGroupIds.has(sg.groupId.toString())
          );

          students.push({
            studentId: student._id,
            userId: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            status: user.status,
            currentLevel: student.currentLevel,
            groupIds: studentCompanyGroups.map((sg) => sg.groupId),
            groupCount: studentCompanyGroups.length,
          });
        }
      }
    }

    // Get company admins (users with company_admin role for this company)
    const adminAssignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_scope", (q) =>
        q.eq("scope", "company").eq("scopeId", args.companyId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("roleId"), "company_admin"),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    const admins = [];
    for (const assignment of adminAssignments) {
      const user = await ctx.db.get(assignment.userId);
      if (user) {
        admins.push({
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          assignedAt: assignment.assignedAt,
        });
      }
    }

    return {
      ...company,
      groups: enrichedGroups,
      students,
      admins,
      stats: {
        groupCount: groups.length,
        activeGroupCount: groups.filter((g) => g.status === "active").length,
        studentCount: students.length,
        adminCount: admins.length,
      },
    };
  },
});

// ============================================
// ADDITIONAL COMPANY QUERIES
// ============================================

/**
 * Get all groups for a company with member counts
 */
export const getCompanyGroups = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // Enrich with member counts
    const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
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
 * Get all students in a company (across all groups) with their group info
 */
export const getCompanyStudents = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get all groups in company
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const groupIds = new Set(groups.map((g) => g._id.toString()));
    const groupNameMap = new Map(groups.map((g) => [g._id.toString(), g.name]));

    // Get all members of those groups
    const studentIdToGroups = new Map<
      string,
      Array<{ groupId: Id<"groups">; groupName: string; role: string }>
    >();

    for (const group of groups) {
      const members = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const member of members) {
        const key = member.studentId.toString();
        if (!studentIdToGroups.has(key)) {
          studentIdToGroups.set(key, []);
        }
        studentIdToGroups.get(key)!.push({
          groupId: group._id,
          groupName: group.name,
          role: member.role ?? "member",
        });
      }
    }

    // Fetch student and user details
    const students = [];
    const entries = Array.from(studentIdToGroups.entries());
    for (const [studentIdStr, groupInfo] of entries) {
      const student = await ctx.db.get(studentIdStr as Id<"students">);
      if (student) {
        const user = student.userId ? await ctx.db.get(student.userId) : null;
        students.push({
          _id: student._id,
          userId: student.userId,
          email: user?.email ?? null,
          firstName: user?.firstName ?? null,
          lastName: user?.lastName ?? null,
          imageUrl: user?.imageUrl ?? null,
          status: user?.status ?? "pending",
          currentLevel: student.currentLevel,
          groups: groupInfo,
        });
      }
    }

    return students;
  },
});

/**
 * Get students NOT in any group of this company (available to add)
 */
export const getAvailableStudentsForCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get all groups in company
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // Get all students already in company groups
    const companyStudentIds = new Set<string>();
    for (const group of groups) {
      const members = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const member of members) {
        companyStudentIds.add(member.studentId.toString());
      }
    }

    // Get all students not in company
    const allStudents = await ctx.db.query("students").collect();
    const availableStudents = allStudents.filter(
      (s) => !companyStudentIds.has(s._id.toString())
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
