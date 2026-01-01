// Convex user management functions - scalable to millions of users
import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { Id } from './_generated/dataModel';

// ============ QUERIES ============

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
  },
});

// List users with pagination (handles millions of users)
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
            v.literal('admin'),
            v.literal('moderator'),
            v.literal('user'),
            v.literal('guest')
          )
        ),
        status: v.optional(
          v.union(
            v.literal('active'),
            v.literal('suspended'),
            v.literal('banned'),
            v.literal('pending')
          )
        ),
        search: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if requester is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (!currentUser || !['admin', 'moderator'].includes(currentUser.role)) {
      throw new Error('Not authorized');
    }

    const numItems = args.paginationOpts?.numItems ?? 50;

    // Use appropriate index based on filters
    let query;
    if (args.filters?.role && args.filters?.status) {
      query = ctx.db
        .query('users')
        .withIndex('by_role_status', (q) =>
          q.eq('role', args.filters!.role!).eq('status', args.filters!.status!)
        );
    } else if (args.filters?.role) {
      query = ctx.db
        .query('users')
        .withIndex('by_role', (q) => q.eq('role', args.filters!.role!));
    } else if (args.filters?.status) {
      query = ctx.db
        .query('users')
        .withIndex('by_status', (q) => q.eq('status', args.filters!.status!));
    } else {
      query = ctx.db.query('users').withIndex('by_created');
    }

    // Paginate results
    const results = await query.order('desc').paginate({
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

// Count users (for dashboard stats)
export const countUsers = query({
  args: {
    role: v.optional(
      v.union(
        v.literal('admin'),
        v.literal('moderator'),
        v.literal('user'),
        v.literal('guest')
      )
    ),
    status: v.optional(
      v.union(
        v.literal('active'),
        v.literal('suspended'),
        v.literal('banned'),
        v.literal('pending')
      )
    ),
  },
  handler: async (ctx, args) => {
    let query;
    if (args.role) {
      query = ctx.db
        .query('users')
        .withIndex('by_role', (q) => q.eq('role', args.role!));
    } else if (args.status) {
      query = ctx.db
        .query('users')
        .withIndex('by_status', (q) => q.eq('status', args.status!));
    } else {
      query = ctx.db.query('users');
    }

    const users = await query.collect();
    return users.length;
  },
});

// ============ MUTATIONS ============

// Create or update user from Clerk webhook
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
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
    } else {
      // Create new user
      return await ctx.db.insert('users', {
        clerkId: args.clerkId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        role: 'user',
        status: 'active',
        lastLoginAt: now,
        loginCount: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update user role (admin only)
export const updateUserRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(
      v.literal('admin'),
      v.literal('moderator'),
      v.literal('user'),
      v.literal('guest')
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can change roles');
    }

    // Prevent demoting yourself
    if (args.userId === currentUser._id && args.role !== 'admin') {
      throw new Error('Cannot demote yourself');
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert('userAuditLog', {
      userId: args.userId,
      action: 'role_changed',
      performedBy: currentUser._id,
      details: { newRole: args.role },
      createdAt: Date.now(),
    });
  },
});

// Update user status (admin/moderator)
export const updateUserStatus = mutation({
  args: {
    userId: v.id('users'),
    status: v.union(
      v.literal('active'),
      v.literal('suspended'),
      v.literal('banned'),
      v.literal('pending')
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (!currentUser || !['admin', 'moderator'].includes(currentUser.role)) {
      throw new Error('Not authorized');
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error('User not found');

    // Moderators can't ban admins
    if (currentUser.role === 'moderator' && targetUser.role === 'admin') {
      throw new Error('Moderators cannot change admin status');
    }

    await ctx.db.patch(args.userId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert('userAuditLog', {
      userId: args.userId,
      action: 'status_changed',
      performedBy: currentUser._id,
      details: { newStatus: args.status, reason: args.reason },
      createdAt: Date.now(),
    });
  },
});

// Delete user (admin only)
export const deleteUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can delete users');
    }

    // Can't delete yourself
    if (args.userId === currentUser._id) {
      throw new Error('Cannot delete yourself');
    }

    // Log before deletion
    await ctx.db.insert('userAuditLog', {
      userId: args.userId,
      action: 'user_deleted',
      performedBy: currentUser._id,
      createdAt: Date.now(),
    });

    await ctx.db.delete(args.userId);
  },
});

// Delete user by Clerk ID (for webhook)
export const deleteUserByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// Check if user is admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    return user?.role === 'admin';
  },
});

// Get user audit log
export const getUserAuditLog = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (!currentUser || !['admin', 'moderator'].includes(currentUser.role)) {
      throw new Error('Not authorized');
    }

    return await ctx.db
      .query('userAuditLog')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(args.limit ?? 50);
  },
});
