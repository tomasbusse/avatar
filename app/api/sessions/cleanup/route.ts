import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * Session cleanup endpoint for browser close events (beacon API)
 *
 * This endpoint is called via navigator.sendBeacon when:
 * - User closes the browser tab
 * - User navigates away from the lesson page
 * - Browser is refreshed/closed unexpectedly
 *
 * Uses Convex HTTP client since this runs outside React context
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    // Parse the beacon data
    const text = await req.text();
    const { roomName, reason } = JSON.parse(text);

    if (!roomName) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    console.log(`[Session Cleanup] Beacon received for room: ${roomName}, reason: ${reason}`);

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
