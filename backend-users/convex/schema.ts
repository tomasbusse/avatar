// Convex schema for scalable user management
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Users table - handles millions of users with proper indexing
  users: defineTable({
    // Clerk integration
    clerkId: v.string(),

    // Basic info
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),

    // Role management
    role: v.union(
      v.literal('admin'),
      v.literal('moderator'),
      v.literal('user'),
      v.literal('guest')
    ),

    // Status
    status: v.union(
      v.literal('active'),
      v.literal('suspended'),
      v.literal('banned'),
      v.literal('pending')
    ),

    // Metadata
    lastLoginAt: v.optional(v.number()),
    loginCount: v.number(),
    metadata: v.optional(v.any()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    // Indexes for fast queries at scale
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email'])
    .index('by_role', ['role'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt'])
    .index('by_role_status', ['role', 'status']),

  // Audit log for user actions
  userAuditLog: defineTable({
    userId: v.id('users'),
    action: v.string(),
    performedBy: v.optional(v.id('users')),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_action', ['action'])
    .index('by_created', ['createdAt']),

  // Rate limiting table
  rateLimits: defineTable({
    key: v.string(), // e.g., "ip:192.168.1.1" or "user:user_123"
    count: v.number(),
    windowStart: v.number(),
    expiresAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_expires', ['expiresAt']),
});
