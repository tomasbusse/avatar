// Rate limiting for Convex - prevents abuse at scale
import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100; // 100 requests per minute per key

// Check rate limit
export const checkRateLimit = mutation({
  args: {
    key: v.string(), // e.g., "ip:192.168.1.1" or "user:user_123"
    limit: v.optional(v.number()),
    windowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowMs = args.windowMs ?? WINDOW_MS;
    const limit = args.limit ?? MAX_REQUESTS;
    const windowStart = now - windowMs;

    // Get existing rate limit record
    const existing = await ctx.db
      .query('rateLimits')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();

    if (!existing) {
      // First request - create record
      await ctx.db.insert('rateLimits', {
        key: args.key,
        count: 1,
        windowStart: now,
        expiresAt: now + windowMs,
      });
      return { allowed: true, remaining: limit - 1 };
    }

    // Check if window has expired
    if (existing.windowStart < windowStart) {
      // Reset window
      await ctx.db.patch(existing._id, {
        count: 1,
        windowStart: now,
        expiresAt: now + windowMs,
      });
      return { allowed: true, remaining: limit - 1 };
    }

    // Check if limit exceeded
    if (existing.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: existing.expiresAt - now,
      };
    }

    // Increment count
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
    });

    return {
      allowed: true,
      remaining: limit - existing.count - 1,
    };
  },
});

// Clean up expired rate limit records (run periodically)
export const cleanupRateLimits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('rateLimits')
      .withIndex('by_expires')
      .filter((q) => q.lt(q.field('expiresAt'), now))
      .collect();

    for (const record of expired) {
      await ctx.db.delete(record._id);
    }

    return { deleted: expired.length };
  },
});

// Get current rate limit status
export const getRateLimitStatus = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('rateLimits')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();

    if (!record) {
      return { count: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS };
    }

    const now = Date.now();
    if (record.expiresAt < now) {
      return { count: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS };
    }

    return {
      count: record.count,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - record.count,
      resetsAt: record.expiresAt,
    };
  },
});
