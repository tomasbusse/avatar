import { auth } from "@clerk/nextjs/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-client";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();
import { api } from "@/convex/_generated/api";

// GET - List all active LiveKit rooms
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitHost = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitHost) {
      return NextResponse.json(
        { error: "LiveKit configuration missing" },
        { status: 500 }
      );
    }

    // Extract host without wss:// prefix
    const hostUrl = livekitHost.replace("wss://", "https://");
    const roomService = new RoomServiceClient(hostUrl, apiKey, apiSecret);

    const rooms = await roomService.listRooms();

    // Format room data
    const roomData = rooms.map((room) => ({
      name: room.name,
      sid: room.sid,
      numParticipants: room.numParticipants,
      creationTime: room.creationTime ? Number(room.creationTime) * 1000 : null,
      metadata: room.metadata,
    }));

    return NextResponse.json({ rooms: roomData });
  } catch (error) {
    console.error("Error listing rooms:", error);
    return NextResponse.json(
      { error: "Failed to list rooms" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a LiveKit room and end the Convex session
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomName, sessionId } = await req.json();

    if (!roomName) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitHost = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitHost) {
      return NextResponse.json(
        { error: "LiveKit configuration missing" },
        { status: 500 }
      );
    }

    // Extract host without wss:// prefix
    const hostUrl = livekitHost.replace("wss://", "https://");
    const roomService = new RoomServiceClient(hostUrl, apiKey, apiSecret);

    // Delete the LiveKit room
    try {
      await roomService.deleteRoom(roomName);
      console.log(`[LiveKit] Room deleted: ${roomName}`);
    } catch (lkError: any) {
      // Room may not exist in LiveKit, that's okay
      console.warn(`[LiveKit] Room deletion warning: ${lkError.message}`);
    }

    // Also end the Convex session if sessionId provided
    if (sessionId) {
      try {
        // Use the Clerk session token for Convex auth
        const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
        if (authToken) {
          getConvex().setAuth(authToken);
        }

        await getConvex().mutation(api.sessions.forceEndSession, {
          sessionId,
          reason: "admin_force_end",
        });
        console.log(`[Convex] Session ended: ${sessionId}`);
      } catch (convexError: any) {
        console.warn(`[Convex] Session end warning: ${convexError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Room ${roomName} deleted`,
    });
  } catch (error: any) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete room" },
      { status: 500 }
    );
  }
}
