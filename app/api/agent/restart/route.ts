import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get action from request body
    const body = await request.json().catch(() => ({}));
    const action = body.action || "restart";

    if (!["start", "stop", "restart"].includes(action)) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Send command to Convex
    await convex.mutation(api.agentControl.sendCommand, {
      command: action as "start" | "stop" | "restart",
    });

    return NextResponse.json({
      success: true,
      message: `Command '${action}' sent to agent`,
    });
  } catch (error: any) {
    console.error("Agent control error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to control agent" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get status from Convex
    const status = await convex.query(api.agentControl.getStatus);

    return NextResponse.json({
      running: status?.running || false,
      pid: status?.pid || null,
      logs: status?.logs || "No logs available",
      lastUpdate: status?.lastUpdate || 0,
    });
  } catch (error: any) {
    console.error("Agent status check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
