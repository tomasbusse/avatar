import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up stale sessions every day at 6:00 AM UTC
// This catches any sessions that weren't properly ended (e.g., network issues, crashes)
crons.daily(
  "cleanup stale sessions",
  { hourUTC: 6, minuteUTC: 0 },
  internal.sessions.cleanupStaleSessionsCron
);

export default crons;
