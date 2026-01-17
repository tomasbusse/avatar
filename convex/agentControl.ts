import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store agent status and commands
export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const status = await ctx.db
      .query("agentControl")
      .order("desc")
      .first();
    return status || { running: false, pid: null, logs: "", lastUpdate: 0 };
  },
});

export const updateStatus = mutation({
  args: {
    running: v.boolean(),
    pid: v.union(v.string(), v.null()),
    logs: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete old status entries
    const oldEntries = await ctx.db.query("agentControl").collect();
    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
    }
    // Insert new status
    await ctx.db.insert("agentControl", {
      ...args,
      lastUpdate: Date.now(),
      pendingCommand: null,
    });
  },
});

export const sendCommand = mutation({
  args: {
    command: v.union(v.literal("start"), v.literal("stop"), v.literal("restart")),
  },
  handler: async (ctx, args) => {
    const status = await ctx.db.query("agentControl").order("desc").first();
    if (status) {
      await ctx.db.patch(status._id, { pendingCommand: args.command });
    } else {
      await ctx.db.insert("agentControl", {
        running: false,
        pid: null,
        logs: "",
        lastUpdate: Date.now(),
        pendingCommand: args.command,
      });
    }
    return { success: true, command: args.command };
  },
});

export const getPendingCommand = query({
  args: {},
  handler: async (ctx) => {
    const status = await ctx.db.query("agentControl").order("desc").first();
    return status?.pendingCommand || null;
  },
});

export const clearCommand = mutation({
  args: {},
  handler: async (ctx) => {
    const status = await ctx.db.query("agentControl").order("desc").first();
    if (status) {
      await ctx.db.patch(status._id, { pendingCommand: null });
    }
  },
});
