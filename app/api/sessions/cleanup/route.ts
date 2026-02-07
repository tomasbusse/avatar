import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex-client";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();
import { api } from "@/convex/_generated/api";

/**
 * Session cleanup endpoint for browser close events (beacon API)
 *
 * This endpoint is called via navigator.sendBeacon when:
 * - User closes the browser tab
 * - User navigates away from the lesson page
 * - Browser is refreshed/closed unexpectedly
 *
 * Requires authentication - sendBeacon includes cookies for same-origin requests.
 * Users can only clean up their own sessions (verified via Convex user lookup).
 * Admins can clean up any session.
 *
 * Uses Convex HTTP client since this runs outside React context
 */

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the beacon data
    const text = await req.text();
    const { roomName, reason } = JSON.parse(text);

    if (!roomName) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Look up the Convex user to verify ownership or admin role
    const convex = getConvex();
    const user = await convex.query(api.users.getUserByClerkId, { clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    // For non-admin users, verify the session belongs to them
    // Data model: session.studentId -> students table -> student.userId -> users table
    if (user.role !== "admin") {
      const session = await convex.query(api.sessions.getSessionByRoom, { roomName });
      if (session) {
        const student = await convex.query(api.students.getStudentById, { studentId: session.studentId });
        if (!student || student.userId !== user._id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    console.log(`[Session Cleanup] Beacon received for room: ${roomName}, reason: ${reason}, user: ${userId}`);

    // Call the Convex mutation to end the session
    const result = await convex.mutation(api.sessions.endSessionByRoom, {
      roomName,
      reason: reason || "browser_closed",
    });

    console.log(`[Session Cleanup] Result:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Session Cleanup] Error:", error);
    // Return 200 for beacon - errors don't matter to the closing browser
    return NextResponse.json({ success: false, error: String(error) });
  }
}
