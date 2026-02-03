import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to get current month in "YYYY-MM" format (UTC)
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get monthly usage stats for a practice
 * Returns current month usage and limit status
 */
export const getMonthlyUsage = query({
  args: { practiceId: v.id("conversationPractice") },
  handler: async (ctx, args) => {
    const practice = await ctx.db.get(args.practiceId);
    if (!practice) return null;

    const currentMonth = getCurrentMonth();
    const monthlyUsage = practice.monthlyUsage ?? [];
    const currentMonthData = monthlyUsage.find((m) => m.month === currentMonth);

    const limits = practice.usageLimits;
    const isEnabled = limits?.enabled ?? false;
    const monthlyLimit = limits?.monthlyMinutesLimit;
    const guestLimit = limits?.guestMonthlyMinutesLimit;

    const totalMinutes = currentMonthData?.totalMinutes ?? 0;
    const guestMinutes = currentMonthData?.guestMinutes ?? 0;
    const authenticatedMinutes = currentMonthData?.authenticatedMinutes ?? 0;
    const sessionCount = currentMonthData?.sessionCount ?? 0;

    // Calculate percentages and status
    let usagePercent = 0;
    let guestUsagePercent = 0;
    let limitReached = false;
    let guestLimitReached = false;
    let warningReached = false;
    let guestWarningReached = false;

    if (monthlyLimit && monthlyLimit > 0) {
      usagePercent = Math.round((totalMinutes / monthlyLimit) * 100);
      limitReached = totalMinutes >= monthlyLimit;

      const warningThreshold = limits?.warningThresholdPercent ?? 80;
      warningReached = usagePercent >= warningThreshold;
    }

    if (guestLimit && guestLimit > 0) {
      guestUsagePercent = Math.round((guestMinutes / guestLimit) * 100);
      guestLimitReached = guestMinutes >= guestLimit;

      const warningThreshold = limits?.warningThresholdPercent ?? 80;
      guestWarningReached = guestUsagePercent >= warningThreshold;
    }

    // Calculate remaining minutes
    const remainingMinutes = monthlyLimit ? Math.max(0, monthlyLimit - totalMinutes) : null;
    const guestRemainingMinutes = guestLimit ? Math.max(0, guestLimit - guestMinutes) : null;

    return {
      month: currentMonth,
      totalMinutes,
      authenticatedMinutes,
      guestMinutes,
      sessionCount,
      // Limits
      limits: {
        enabled: isEnabled,
        monthlyMinutesLimit: monthlyLimit ?? null,
        guestMonthlyMinutesLimit: guestLimit ?? null,
        limitBehavior: limits?.limitBehavior ?? "block",
        warningThresholdPercent: limits?.warningThresholdPercent ?? 80,
      },
      // Status
      usagePercent,
      guestUsagePercent,
      limitReached,
      guestLimitReached,
      warningReached,
      guestWarningReached,
      remainingMinutes,
      guestRemainingMinutes,
      // Reset date (first of next month)
      resetDate: getResetDate(),
    };
  },
});

/**
 * Get usage history for the last N months
 */
export const getUsageHistory = query({
  args: {
    practiceId: v.id("conversationPractice"),
    months: v.optional(v.number()), // Default 6 months
  },
  handler: async (ctx, args) => {
    const practice = await ctx.db.get(args.practiceId);
    if (!practice) return [];

    const monthsToFetch = args.months ?? 6;
    const monthlyUsage = practice.monthlyUsage ?? [];

    // Sort by month descending and take the requested number
    return [...monthlyUsage]
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, monthsToFetch);
  },
});

/**
 * Check if a new session is allowed based on usage limits
 * Called before creating a session
 */
export const checkSessionAllowed = query({
  args: {
    practiceId: v.id("conversationPractice"),
    isGuest: v.boolean(),
  },
  handler: async (ctx, args) => {
    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      return { allowed: false, reason: "Practice not found" };
    }

    const limits = practice.usageLimits;

    // If limits not enabled, always allow
    if (!limits?.enabled) {
      return { allowed: true };
    }

    const currentMonth = getCurrentMonth();
    const monthlyUsage = practice.monthlyUsage ?? [];
    const currentMonthData = monthlyUsage.find((m) => m.month === currentMonth);

    const totalMinutes = currentMonthData?.totalMinutes ?? 0;
    const guestMinutes = currentMonthData?.guestMinutes ?? 0;

    // Check guest-specific limit first if this is a guest session
    if (args.isGuest && limits.guestMonthlyMinutesLimit) {
      if (guestMinutes >= limits.guestMonthlyMinutesLimit) {
        const behavior = limits.limitBehavior ?? "block";
        if (behavior === "block") {
          return {
            allowed: false,
            reason: "Guest monthly usage limit reached",
            resetDate: getResetDate(),
            usedMinutes: guestMinutes,
            limitMinutes: limits.guestMonthlyMinutesLimit,
          };
        } else if (behavior === "warn") {
          return {
            allowed: true,
            warning: "Guest monthly usage limit reached - session may be limited",
            usedMinutes: guestMinutes,
            limitMinutes: limits.guestMonthlyMinutesLimit,
          };
        }
      }
    }

    // Check total limit
    if (limits.monthlyMinutesLimit) {
      if (totalMinutes >= limits.monthlyMinutesLimit) {
        const behavior = limits.limitBehavior ?? "block";
        if (behavior === "block") {
          return {
            allowed: false,
            reason: "Monthly usage limit reached",
            resetDate: getResetDate(),
            usedMinutes: totalMinutes,
            limitMinutes: limits.monthlyMinutesLimit,
          };
        } else if (behavior === "warn") {
          return {
            allowed: true,
            warning: "Monthly usage limit reached - session may be limited",
            usedMinutes: totalMinutes,
            limitMinutes: limits.monthlyMinutesLimit,
          };
        }
      }
    }

    // Check warning threshold
    if (limits.monthlyMinutesLimit && limits.warningThresholdPercent) {
      const usagePercent = (totalMinutes / limits.monthlyMinutesLimit) * 100;
      if (usagePercent >= limits.warningThresholdPercent) {
        const remainingMinutes = limits.monthlyMinutesLimit - totalMinutes;
        return {
          allowed: true,
          warning: `${Math.round(usagePercent)}% of monthly limit used (${remainingMinutes} minutes remaining)`,
          usedMinutes: totalMinutes,
          limitMinutes: limits.monthlyMinutesLimit,
          remainingMinutes,
        };
      }
    }

    return { allowed: true };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Update the monthly usage rollup for a practice
 * Called when a session ends
 */
export const updateMonthlyUsageRollup = internalMutation({
  args: {
    practiceId: v.id("conversationPractice"),
    durationMinutes: v.number(),
    isGuest: v.boolean(),
  },
  handler: async (ctx, args) => {
    const practice = await ctx.db.get(args.practiceId);
    if (!practice) return;

    const currentMonth = getCurrentMonth();
    const monthlyUsage = practice.monthlyUsage ?? [];
    const now = Date.now();

    // Find or create current month entry
    const existingIndex = monthlyUsage.findIndex((m) => m.month === currentMonth);

    if (existingIndex >= 0) {
      // Update existing month
      monthlyUsage[existingIndex] = {
        ...monthlyUsage[existingIndex],
        totalMinutes: monthlyUsage[existingIndex].totalMinutes + args.durationMinutes,
        authenticatedMinutes: args.isGuest
          ? monthlyUsage[existingIndex].authenticatedMinutes
          : monthlyUsage[existingIndex].authenticatedMinutes + args.durationMinutes,
        guestMinutes: args.isGuest
          ? monthlyUsage[existingIndex].guestMinutes + args.durationMinutes
          : monthlyUsage[existingIndex].guestMinutes,
        sessionCount: monthlyUsage[existingIndex].sessionCount + 1,
        updatedAt: now,
      };
    } else {
      // Create new month entry
      monthlyUsage.push({
        month: currentMonth,
        totalMinutes: args.durationMinutes,
        authenticatedMinutes: args.isGuest ? 0 : args.durationMinutes,
        guestMinutes: args.isGuest ? args.durationMinutes : 0,
        sessionCount: 1,
        updatedAt: now,
      });
    }

    // Keep only last 12 months of data
    const sortedUsage = monthlyUsage
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    await ctx.db.patch(args.practiceId, {
      monthlyUsage: sortedUsage,
      updatedAt: now,
    });
  },
});

/**
 * Update usage limits configuration for a practice
 * Admin only
 */
export const updateUsageLimits = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
    usageLimits: v.object({
      monthlyMinutesLimit: v.optional(v.number()),
      guestMonthlyMinutesLimit: v.optional(v.number()),
      limitBehavior: v.optional(
        v.union(v.literal("block"), v.literal("warn"), v.literal("auto_end"))
      ),
      warningThresholdPercent: v.optional(v.number()),
      enabled: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    await ctx.db.patch(args.practiceId, {
      usageLimits: args.usageLimits,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Recalculate monthly usage from session history
 * Use this to fix inconsistencies or after data migration
 */
export const recalculateMonthlyUsage = mutation({
  args: {
    practiceId: v.id("conversationPractice"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const practice = await ctx.db.get(args.practiceId);
    if (!practice) {
      throw new Error("Practice not found");
    }

    // Get all sessions for this practice
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_conversation_practice", (q) =>
        q.eq("conversationPracticeId", args.practiceId)
      )
      .collect();

    // Group sessions by month and calculate usage
    const usageByMonth: Record<
      string,
      {
        totalMinutes: number;
        authenticatedMinutes: number;
        guestMinutes: number;
        sessionCount: number;
      }
    > = {};

    for (const session of sessions) {
      // Only count completed sessions with duration
      if (
        (session.status === "completed" || session.status === "abandoned") &&
        session.durationMinutes &&
        session.durationMinutes > 0
      ) {
        const sessionDate = new Date(session.startedAt);
        const month = `${sessionDate.getUTCFullYear()}-${String(sessionDate.getUTCMonth() + 1).padStart(2, "0")}`;

        if (!usageByMonth[month]) {
          usageByMonth[month] = {
            totalMinutes: 0,
            authenticatedMinutes: 0,
            guestMinutes: 0,
            sessionCount: 0,
          };
        }

        usageByMonth[month].totalMinutes += session.durationMinutes;
        usageByMonth[month].sessionCount += 1;

        if (session.isGuest) {
          usageByMonth[month].guestMinutes += session.durationMinutes;
        } else {
          usageByMonth[month].authenticatedMinutes += session.durationMinutes;
        }
      }
    }

    // Convert to array format and sort
    const now = Date.now();
    const monthlyUsage = Object.entries(usageByMonth)
      .map(([month, data]) => ({
        month,
        ...data,
        updatedAt: now,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    await ctx.db.patch(args.practiceId, {
      monthlyUsage,
      updatedAt: now,
    });

    return {
      success: true,
      monthsProcessed: monthlyUsage.length,
      totalSessionsProcessed: sessions.filter(
        (s) =>
          (s.status === "completed" || s.status === "abandoned") &&
          s.durationMinutes &&
          s.durationMinutes > 0
      ).length,
    };
  },
});

// ============================================
// HELPERS
// ============================================

/**
 * Get the reset date (first day of next month) in ISO format
 */
function getResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return nextMonth.toISOString().split("T")[0];
}
