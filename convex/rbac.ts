import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// SYSTEM ROLES DEFINITION
// ============================================

const SYSTEM_ROLES = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Platform administrator with full access to all resources",
    type: "system" as const,
    permissions: ["*"], // Wildcard for all permissions
    isActive: true,
  },
  {
    id: "company_admin",
    name: "Company Admin",
    description: "Organization administrator with full company access",
    type: "system" as const,
    permissions: [
      "users.view_company", "users.create", "users.edit", "users.delete", "users.assign_roles",
      "companies.view_own", "companies.edit", "companies.manage_subscription", "companies.create_custom_roles",
      "groups.create", "groups.view_all", "groups.edit", "groups.delete", "groups.add_members", "groups.remove_members",
      "courses.create", "courses.view_company", "courses.edit_own", "courses.edit_all", "courses.delete", "courses.publish",
      "lessons.create", "lessons.edit_own", "lessons.edit_all", "lessons.delete",
      "enrollments.assign_group", "enrollments.assign_individual", "enrollments.view_all",
      "analytics.view_company", "analytics.view_group", "analytics.view_own", "reports.export",
      "avatars.view", "avatars.assign", "sessions.create", "sessions.view_own", "sessions.view_all",
    ],
    inheritsFrom: "teacher",
    isActive: true,
  },
  {
    id: "teacher",
    name: "Teacher / Content Creator",
    description: "Creates and manages learning content",
    type: "system" as const,
    permissions: [
      "companies.view_own",
      "groups.create", "groups.view_all", "groups.edit", "groups.add_members", "groups.remove_members",
      "courses.create", "courses.view_company", "courses.edit_own", "courses.publish",
      "lessons.create", "lessons.edit_own",
      "enrollments.assign_group", "enrollments.assign_individual", "enrollments.view_group",
      "analytics.view_group", "analytics.view_own",
      "avatars.view", "avatars.assign", "sessions.create", "sessions.view_own",
    ],
    inheritsFrom: "student",
    isActive: true,
  },
  {
    id: "group_lead",
    name: "Group Lead",
    description: "Manages specific group(s) and views group progress",
    type: "system" as const,
    permissions: [
      "companies.view_own",
      "groups.view_own", "groups.edit", "groups.add_members", "groups.remove_members",
      "courses.view_enrolled",
      "enrollments.view_group",
      "analytics.view_group", "analytics.view_own",
      "avatars.view", "sessions.create", "sessions.view_own",
    ],
    inheritsFrom: "student",
    isActive: true,
  },
  {
    id: "student",
    name: "Student",
    description: "Learner enrolled in courses",
    type: "system" as const,
    permissions: [
      "courses.view_enrolled",
      "enrollments.self_enroll",
      "analytics.view_own",
      "avatars.view", "sessions.create", "sessions.view_own",
    ],
    inheritsFrom: "guest",
    isActive: true,
  },
  {
    id: "guest",
    name: "Guest",
    description: "Limited access user, typically trial users",
    type: "system" as const,
    permissions: [
      "analytics.view_own",
      "avatars.view",
    ],
    isActive: true,
  },
];

// ============================================
// PERMISSIONS DEFINITION
// ============================================

const PERMISSIONS = [
  // User Management
  { key: "users.view_all", name: "View All Users", description: "View all platform users", category: "users" as const, defaultRoles: ["super_admin"] },
  { key: "users.view_company", name: "View Company Users", description: "View users in own company", category: "users" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "users.create", name: "Create Users", description: "Create new users", category: "users" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "users.edit", name: "Edit Users", description: "Edit user profiles", category: "users" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "users.delete", name: "Delete Users", description: "Delete/deactivate users", category: "users" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "users.assign_roles", name: "Assign Roles", description: "Assign roles to users", category: "users" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "users.impersonate", name: "Impersonate Users", description: "Login as another user", category: "users" as const, defaultRoles: ["super_admin"] },

  // Company Management
  { key: "companies.create", name: "Create Companies", description: "Create new companies", category: "companies" as const, defaultRoles: ["super_admin"] },
  { key: "companies.view_all", name: "View All Companies", description: "View all companies", category: "companies" as const, defaultRoles: ["super_admin"] },
  { key: "companies.view_own", name: "View Own Company", description: "View own company", category: "companies" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead"] },
  { key: "companies.edit", name: "Edit Company", description: "Edit company settings", category: "companies" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "companies.delete", name: "Delete Company", description: "Delete company", category: "companies" as const, defaultRoles: ["super_admin"] },
  { key: "companies.manage_subscription", name: "Manage Subscription", description: "Manage billing/subscription", category: "companies" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "companies.create_custom_roles", name: "Create Custom Roles", description: "Create custom roles for company", category: "companies" as const, defaultRoles: ["super_admin", "company_admin"] },

  // Group Management
  { key: "groups.create", name: "Create Groups", description: "Create new groups", category: "groups" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "groups.view_all", name: "View All Groups", description: "View all groups in company", category: "groups" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "groups.view_own", name: "View Own Groups", description: "View assigned groups", category: "groups" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead"] },
  { key: "groups.edit", name: "Edit Groups", description: "Edit group settings", category: "groups" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead"] },
  { key: "groups.delete", name: "Delete Groups", description: "Delete/archive groups", category: "groups" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "groups.add_members", name: "Add Group Members", description: "Add students to groups", category: "groups" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead"] },
  { key: "groups.remove_members", name: "Remove Group Members", description: "Remove students from groups", category: "groups" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead"] },

  // Content Management
  { key: "courses.create", name: "Create Courses", description: "Create new courses", category: "content" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "courses.view_all", name: "View All Courses", description: "View all courses", category: "content" as const, defaultRoles: ["super_admin"] },
  { key: "courses.view_company", name: "View Company Courses", description: "View company courses", category: "content" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "courses.view_enrolled", name: "View Enrolled Courses", description: "View enrolled courses", category: "content" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead", "student"] },
  { key: "courses.edit_own", name: "Edit Own Courses", description: "Edit own courses", category: "content" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "courses.edit_all", name: "Edit All Courses", description: "Edit any course", category: "content" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "courses.delete", name: "Delete Courses", description: "Delete courses", category: "content" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "courses.publish", name: "Publish Courses", description: "Publish courses", category: "content" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "lessons.create", name: "Create Lessons", description: "Create new lessons", category: "content" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "lessons.edit_own", name: "Edit Own Lessons", description: "Edit own lessons", category: "content" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "lessons.edit_all", name: "Edit All Lessons", description: "Edit any lesson", category: "content" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "lessons.delete", name: "Delete Lessons", description: "Delete lessons", category: "content" as const, defaultRoles: ["super_admin", "company_admin"] },

  // Enrollment & Assignment
  { key: "enrollments.assign_group", name: "Assign to Groups", description: "Assign content to groups", category: "enrollments" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "enrollments.assign_individual", name: "Assign to Individuals", description: "Assign content to individuals", category: "enrollments" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "enrollments.self_enroll", name: "Self Enroll", description: "Self-enroll in courses", category: "enrollments" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead", "student"] },
  { key: "enrollments.view_all", name: "View All Enrollments", description: "View all enrollments", category: "enrollments" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "enrollments.view_group", name: "View Group Enrollments", description: "View group enrollments", category: "enrollments" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead"] },

  // Analytics & Reporting
  { key: "analytics.view_platform", name: "View Platform Analytics", description: "View platform-wide analytics", category: "analytics" as const, defaultRoles: ["super_admin"] },
  { key: "analytics.view_company", name: "View Company Analytics", description: "View company analytics", category: "analytics" as const, defaultRoles: ["super_admin", "company_admin"] },
  { key: "analytics.view_group", name: "View Group Analytics", description: "View group progress", category: "analytics" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead"] },
  { key: "analytics.view_own", name: "View Own Analytics", description: "View personal progress", category: "analytics" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead", "student", "guest"] },
  { key: "reports.export", name: "Export Reports", description: "Export analytics reports", category: "analytics" as const, defaultRoles: ["super_admin", "company_admin"] },

  // Avatar & Session
  { key: "avatars.view", name: "View Avatars", description: "View available avatars", category: "avatars" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead", "student", "guest"] },
  { key: "avatars.create", name: "Create Avatars", description: "Create new avatars", category: "avatars" as const, defaultRoles: ["super_admin"] },
  { key: "avatars.edit", name: "Edit Avatars", description: "Edit avatar configurations", category: "avatars" as const, defaultRoles: ["super_admin"] },
  { key: "avatars.assign", name: "Assign Avatars", description: "Assign avatars to students", category: "avatars" as const, defaultRoles: ["super_admin", "company_admin", "teacher"] },
  { key: "sessions.create", name: "Create Sessions", description: "Start learning sessions", category: "sessions" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead", "student"] },
  { key: "sessions.view_own", name: "View Own Sessions", description: "View own session history", category: "sessions" as const, defaultRoles: ["super_admin", "company_admin", "teacher", "group_lead", "student"] },
  { key: "sessions.view_all", name: "View All Sessions", description: "View all session data", category: "sessions" as const, defaultRoles: ["super_admin", "company_admin"] },
];

// ============================================
// SEED FUNCTIONS
// ============================================

export const seedRolesAndPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if already seeded
    const existingRoles = await ctx.db.query("roles").first();
    if (existingRoles) {
      return { success: false, message: "Roles already seeded" };
    }

    // Seed roles
    for (const role of SYSTEM_ROLES) {
      await ctx.db.insert("roles", {
        ...role,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Seed permissions
    for (const permission of PERMISSIONS) {
      await ctx.db.insert("permissions", {
        ...permission,
        isActive: true,
      });
    }

    return {
      success: true,
      message: `Seeded ${SYSTEM_ROLES.length} roles and ${PERMISSIONS.length} permissions`
    };
  },
});

// ============================================
// PERMISSION RESOLUTION
// ============================================

interface RoleAssignment {
  roleId: string;
  scope: "global" | "company" | "group";
  scopeId?: string;
  isActive: boolean;
}

/**
 * Resolve all permissions for a set of role assignments,
 * including inherited permissions from parent roles.
 */
export async function resolvePermissions(
  ctx: { db: any },
  roleAssignments: RoleAssignment[]
): Promise<string[]> {
  const permissions = new Set<string>();
  const processedRoles = new Set<string>();

  async function processRole(roleId: string): Promise<void> {
    if (processedRoles.has(roleId)) return;
    processedRoles.add(roleId);

    const role = await ctx.db
      .query("roles")
      .withIndex("by_role_id", (q: any) => q.eq("id", roleId))
      .first();

    if (!role || !role.isActive) return;

    // Add this role's permissions
    for (const perm of role.permissions) {
      permissions.add(perm);
    }

    // Process inherited role
    if (role.inheritsFrom) {
      await processRole(role.inheritsFrom);
    }
  }

  // Process all role assignments
  for (const assignment of roleAssignments) {
    if (assignment.isActive) {
      await processRole(assignment.roleId);
    }
  }

  return Array.from(permissions);
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export const getMyPermissions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { permissions: [], roles: [], isAuthenticated: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return { permissions: [], roles: [], isAuthenticated: true, userId: null };

    // Get active role assignments
    const roleAssignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true)
      )
      .collect();

    // Resolve permissions
    const permissions = await resolvePermissions(ctx, roleAssignments);

    // Get role names
    const roleIds = Array.from(new Set(roleAssignments.map(a => a.roleId)));
    const roles = await Promise.all(
      roleIds.map(async (roleId) => {
        const role = await ctx.db
          .query("roles")
          .withIndex("by_role_id", (q) => q.eq("id", roleId))
          .first();
        return role?.name || roleId;
      })
    );

    return {
      permissions,
      roles,
      isAuthenticated: true,
      userId: user._id,
      // Also include legacy role for backwards compatibility
      legacyRole: user.role,
    };
  },
});

export const listSystemRoles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("roles")
      .withIndex("by_type", (q) => q.eq("type", "system"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const listPermissions = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("permissions")
        .withIndex("by_category", (q) => q.eq("category", args.category as any))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
    return await ctx.db
      .query("permissions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// ============================================
// ROLE ASSIGNMENT FUNCTIONS
// ============================================

export const assignRoleToUser = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.string(),
    scope: v.union(v.literal("global"), v.literal("company"), v.literal("group")),
    scopeId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("User not found");

    // Check if current user can assign roles (must be admin)
    // For now, check legacy role. Later will check RBAC permission.
    if (currentUser.role !== "admin") {
      throw new Error("Only admins can assign roles");
    }

    // Validate role exists
    const role = await ctx.db
      .query("roles")
      .withIndex("by_role_id", (q) => q.eq("id", args.roleId))
      .first();

    if (!role || !role.isActive) {
      throw new Error("Role not found or inactive");
    }

    // Check for existing active assignment
    const existing = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("roleId"), args.roleId),
          q.eq(q.field("scope"), args.scope),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (existing) {
      throw new Error("Role already assigned");
    }

    const now = Date.now();

    // Create assignment
    const assignmentId = await ctx.db.insert("userRoleAssignments", {
      userId: args.userId,
      roleId: args.roleId,
      scope: args.scope,
      scopeId: args.scopeId,
      assignedBy: currentUser._id,
      assignedAt: now,
      isActive: true,
      notes: args.notes,
    });

    // Get scope name for audit log
    let scopeName: string | undefined;
    if (args.scope === "company" && args.scopeId) {
      const company = await ctx.db.get(args.scopeId as Id<"companies">);
      scopeName = company?.name;
    } else if (args.scope === "group" && args.scopeId) {
      const group = await ctx.db.get(args.scopeId as Id<"groups">);
      scopeName = group?.name;
    }

    // Audit log
    await ctx.db.insert("roleAuditLog", {
      action: "role_assigned",
      userId: args.userId,
      roleId: args.roleId,
      roleName: role.name,
      scope: args.scope,
      scopeId: args.scopeId,
      scopeName,
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

export const revokeRoleFromUser = mutation({
  args: {
    assignmentId: v.id("userRoleAssignments"),
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
      throw new Error("Only admins can revoke roles");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    // Prevent revoking own super_admin role
    if (assignment.userId === currentUser._id && assignment.roleId === "super_admin") {
      throw new Error("Cannot revoke your own Super Admin role");
    }

    const now = Date.now();

    await ctx.db.patch(args.assignmentId, {
      isActive: false,
      notes: args.reason
        ? `${assignment.notes || ""}\nRevoked: ${args.reason}`
        : assignment.notes,
    });

    // Get role info for audit log
    const role = await ctx.db
      .query("roles")
      .withIndex("by_role_id", (q) => q.eq("id", assignment.roleId))
      .first();

    // Get scope name for audit log
    let scopeName: string | undefined;
    if (assignment.scope === "company" && assignment.scopeId) {
      const company = await ctx.db.get(assignment.scopeId as Id<"companies">);
      scopeName = company?.name;
    } else if (assignment.scope === "group" && assignment.scopeId) {
      const group = await ctx.db.get(assignment.scopeId as Id<"groups">);
      scopeName = group?.name;
    }

    // Audit log
    await ctx.db.insert("roleAuditLog", {
      action: "role_revoked",
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleName: role?.name ?? assignment.roleId,
      scope: assignment.scope,
      scopeId: assignment.scopeId,
      scopeName,
      performedBy: currentUser._id,
      performedByName:
        `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
        currentUser.email,
      notes: args.reason,
      createdAt: now,
    });

    return { success: true };
  },
});

export const getUserRoleAssignments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Enrich with role details
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const role = await ctx.db
          .query("roles")
          .withIndex("by_role_id", (q) => q.eq("id", assignment.roleId))
          .first();
        return {
          ...assignment,
          roleName: role?.name || assignment.roleId,
          roleDescription: role?.description,
        };
      })
    );

    return enriched;
  },
});

// ============================================
// HELPER: Promote existing admin to super_admin
// ============================================

export const promoteToSuperAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // Must be an existing admin
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can promote to Super Admin");
    }

    // Check if super_admin role exists
    const superAdminRole = await ctx.db
      .query("roles")
      .withIndex("by_role_id", (q) => q.eq("id", "super_admin"))
      .first();

    if (!superAdminRole) {
      throw new Error("Super Admin role not found. Run seedRolesAndPermissions first.");
    }

    // Create assignment
    const assignmentId = await ctx.db.insert("userRoleAssignments", {
      userId: args.userId,
      roleId: "super_admin",
      scope: "global",
      assignedBy: currentUser._id,
      assignedAt: Date.now(),
      isActive: true,
      notes: "Promoted from legacy admin role",
    });

    return { success: true, assignmentId };
  },
});

// Internal mutation for seeding - assigns super_admin to users with legacy admin role
export const seedSuperAdminAssignments = mutation({
  args: {},
  handler: async (ctx) => {
    // Find all users with legacy admin role
    const adminUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    if (adminUsers.length === 0) {
      return { success: false, message: "No admin users found" };
    }

    const assignments = [];
    for (const user of adminUsers) {
      // Check if already has super_admin assignment
      const existing = await ctx.db
        .query("userRoleAssignments")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("roleId"), "super_admin"),
            q.eq(q.field("isActive"), true)
          )
        )
        .first();

      if (existing) continue;

      // Create super_admin assignment
      const assignmentId = await ctx.db.insert("userRoleAssignments", {
        userId: user._id,
        roleId: "super_admin",
        scope: "global",
        assignedBy: user._id, // Self-assigned during seed
        assignedAt: Date.now(),
        isActive: true,
        notes: "Auto-assigned from legacy admin role during RBAC migration",
      });

      assignments.push({ userId: user._id, email: user.email, assignmentId });
    }

    return {
      success: true,
      message: `Assigned super_admin to ${assignments.length} users`,
      assignments,
    };
  },
});

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkAssignRole = mutation({
  args: {
    userIds: v.array(v.id("users")),
    roleId: v.string(),
    scope: v.union(v.literal("global"), v.literal("company"), v.literal("group")),
    scopeId: v.optional(v.string()),
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
      throw new Error("Only admins can bulk assign roles");
    }

    // Validate role exists
    const role = await ctx.db
      .query("roles")
      .withIndex("by_role_id", (q) => q.eq("id", args.roleId))
      .first();

    if (!role || !role.isActive) {
      throw new Error("Role not found or inactive");
    }

    const now = Date.now();
    let assigned = 0;
    let failed = 0;

    // Get scope name for audit log
    let scopeName: string | undefined;
    if (args.scope === "company" && args.scopeId) {
      const company = await ctx.db.get(args.scopeId as Id<"companies">);
      scopeName = company?.name;
    } else if (args.scope === "group" && args.scopeId) {
      const group = await ctx.db.get(args.scopeId as Id<"groups">);
      scopeName = group?.name;
    }

    for (const userId of args.userIds) {
      try {
        // Check if already has this role
        const existing = await ctx.db
          .query("userRoleAssignments")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .filter((q) =>
            q.and(
              q.eq(q.field("roleId"), args.roleId),
              q.eq(q.field("scope"), args.scope),
              q.eq(q.field("isActive"), true)
            )
          )
          .first();

        if (existing) {
          failed++;
          continue;
        }

        // Create assignment
        await ctx.db.insert("userRoleAssignments", {
          userId,
          roleId: args.roleId,
          scope: args.scope,
          scopeId: args.scopeId,
          assignedBy: currentUser._id,
          assignedAt: now,
          isActive: true,
          notes: args.notes,
        });

        assigned++;
      } catch {
        failed++;
      }
    }

    // Single audit log entry for bulk operation
    await ctx.db.insert("roleAuditLog", {
      action: "bulk_assign",
      userId: args.userIds[0], // First user as reference
      roleId: args.roleId,
      roleName: role.name,
      scope: args.scope,
      scopeId: args.scopeId,
      scopeName,
      performedBy: currentUser._id,
      performedByName:
        `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
        currentUser.email,
      notes: `Bulk assigned to ${assigned} users (${failed} failed). ${args.notes || ""}`,
      metadata: { totalUsers: args.userIds.length, assigned, failed },
      createdAt: now,
    });

    return { success: true, assigned, failed };
  },
});

// ============================================
// PERMISSION CHECK HELPERS
// ============================================

export const checkPermission = query({
  args: {
    permission: v.string(),
    scope: v.optional(v.union(v.literal("company"), v.literal("group"))),
    scopeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return false;

    // Get user's role assignments
    const assignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true)
      )
      .collect();

    // Resolve permissions
    const permissions = await resolvePermissions(ctx, assignments);

    // Check for wildcard (super_admin)
    if (permissions.includes("*")) return true;

    // Check specific permission
    if (!permissions.includes(args.permission)) return false;

    // If scope check is required, verify scope access
    if (args.scope && args.scopeId) {
      const scopedAssignment = assignments.find(
        (a) => a.scope === args.scope && a.scopeId === args.scopeId
      );

      // Global scope assignments apply to all scopes
      const globalAssignment = assignments.find((a) => a.scope === "global");

      return !!(scopedAssignment || globalAssignment);
    }

    return true;
  },
});

// ============================================
// AUDIT LOG QUERIES
// ============================================

export const listAuditLog = query({
  args: {
    userId: v.optional(v.id("users")),
    roleId: v.optional(v.string()),
    action: v.optional(
      v.union(
        v.literal("role_assigned"),
        v.literal("role_revoked"),
        v.literal("role_expired"),
        v.literal("bulk_assign")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can view audit logs");
    }

    let query;
    if (args.userId) {
      query = ctx.db
        .query("roleAuditLog")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!));
    } else if (args.roleId) {
      query = ctx.db
        .query("roleAuditLog")
        .withIndex("by_role", (q) => q.eq("roleId", args.roleId!));
    } else if (args.action) {
      query = ctx.db
        .query("roleAuditLog")
        .withIndex("by_action", (q) => q.eq("action", args.action!));
    } else {
      query = ctx.db.query("roleAuditLog").withIndex("by_created");
    }

    const logs = await query
      .order("desc")
      .take(args.limit ?? 100);

    // Enrich with user info
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return {
          ...log,
          userName: user
            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
              user.email
            : "Unknown",
          userEmail: user?.email,
        };
      })
    );

    return enrichedLogs;
  },
});

// ============================================
// AUTO-ASSIGN STUDENT ROLE ON USER CREATION
// ============================================

// ============================================
// ROLE CRUD OPERATIONS
// ============================================

export const createRole = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    inheritsFrom: v.optional(v.string()),
    type: v.optional(v.union(v.literal("system"), v.literal("company_custom"))),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can create roles");
    }

    // Check if role ID already exists
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_role_id", (q) => q.eq("id", args.id))
      .first();

    if (existing) {
      throw new Error("Role ID already exists");
    }

    const now = Date.now();

    const roleId = await ctx.db.insert("roles", {
      id: args.id,
      name: args.name,
      description: args.description,
      permissions: args.permissions,
      inheritsFrom: args.inheritsFrom,
      type: args.type || "company_custom",
      companyId: args.companyId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, roleId };
  },
});

export const updateRole = mutation({
  args: {
    roleId: v.id("roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    inheritsFrom: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update roles");
    }

    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");

    // Prevent editing core system roles permissions (but allow name/description changes)
    const coreSystemRoles = ["super_admin", "company_admin", "teacher", "group_lead", "student", "guest"];
    if (coreSystemRoles.includes(role.id) && args.permissions) {
      throw new Error("Cannot modify permissions of core system roles");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.permissions !== undefined) updates.permissions = args.permissions;
    if (args.inheritsFrom !== undefined) updates.inheritsFrom = args.inheritsFrom;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.roleId, updates);

    return { success: true };
  },
});

export const deleteRole = mutation({
  args: {
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can delete roles");
    }

    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");

    // Prevent deleting system roles
    if (role.type === "system") {
      throw new Error("Cannot delete system roles");
    }

    // Check if any users have this role assigned
    const assignments = await ctx.db
      .query("userRoleAssignments")
      .filter((q) =>
        q.and(
          q.eq(q.field("roleId"), role.id),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (assignments) {
      throw new Error("Cannot delete role that is assigned to users. Revoke assignments first.");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.roleId, { isActive: false, updatedAt: Date.now() });

    return { success: true };
  },
});

export const listAllRoles = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("roles");

    if (!args.includeInactive) {
      return await query.filter((q) => q.eq(q.field("isActive"), true)).collect();
    }

    return await query.collect();
  },
});

export const assignStudentRoleToNewUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if student role exists
    const studentRole = await ctx.db
      .query("roles")
      .withIndex("by_role_id", (q) => q.eq("id", "student"))
      .first();

    if (!studentRole) {
      // Role not seeded yet, skip
      return { success: false, message: "Student role not found" };
    }

    // Check if already has any role
    const existingAssignment = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingAssignment) {
      return { success: false, message: "User already has a role" };
    }

    const now = Date.now();

    // Assign student role with global scope
    const assignmentId = await ctx.db.insert("userRoleAssignments", {
      userId: args.userId,
      roleId: "student",
      scope: "global",
      assignedBy: args.userId, // Self-assigned
      assignedAt: now,
      isActive: true,
      notes: "Auto-assigned on signup",
    });

    // Audit log
    await ctx.db.insert("roleAuditLog", {
      action: "role_assigned",
      userId: args.userId,
      roleId: "student",
      roleName: "Student",
      scope: "global",
      performedBy: args.userId,
      performedByName: "System",
      notes: "Auto-assigned on signup",
      createdAt: now,
    });

    return { success: true, assignmentId };
  },
});
