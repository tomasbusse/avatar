import { NextRequest, NextResponse } from "next/server";
import { AccessToken, VideoGrant, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";
import { currentUser } from "@clerk/nextjs/server";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_WS_URL = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

/**
 * Generate a LiveKit token for video recording session
 * This token allows the admin to join the recording room and view the avatar
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check LiveKit configuration
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { roomName, videoCreationId, participantName } = body as {
      roomName: string;
      videoCreationId: string;
      participantName?: string;
    };

    if (!roomName || !videoCreationId) {
      return NextResponse.json(
        { error: "roomName and videoCreationId are required" },
        { status: 400 }
      );
    }

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `admin-${user.id}`,
      name: participantName || user.firstName || "Admin",
      // Include video creation metadata for the agent
      metadata: JSON.stringify({
        role: "admin",
        videoCreationId,
        isRecordingSession: true,
      }),
    });

    // Grant room permissions (can join, subscribe to tracks, but not publish)
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
      canPublish: false, // Admin doesn't need to publish - just view avatar
      canPublishData: true, // For control signals
    };

    at.addGrant(grant);

    // Token expires in 2 hours (plenty of time for recording)
    const token = await at.toJwt();

    // Dispatch agent to the recording room
    if (LIVEKIT_API_KEY && LIVEKIT_API_SECRET && LIVEKIT_WS_URL) {
      const livekitUrl = LIVEKIT_WS_URL.replace('wss://', 'https://').replace('ws://', 'http://');

      try {
        const roomService = new RoomServiceClient(livekitUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

        // Create room with metadata for video recording
        const roomMetadata = JSON.stringify({
          videoCreationId,
          isRecordingSession: true,
          mode: "video_recording",
        });

        try {
          await roomService.createRoom({
            name: roomName,
            metadata: roomMetadata,
            emptyTimeout: 60 * 30, // 30 minutes for recording
            maxParticipants: 2, // Admin viewer + avatar agent
          });
          console.log("🎬 [RECORDING] Created recording room:", roomName);
        } catch (roomError: any) {
          if (roomError?.message?.includes("already exists")) {
            console.log("🎬 [RECORDING] Room already exists:", roomName);
            await roomService.updateRoomMetadata(roomName, roomMetadata);
          } else {
            throw roomError;
          }
        }

        // Dispatch the beethoven-teacher agent to the recording room
        const agentDispatch = new AgentDispatchClient(livekitUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

        try {
          await agentDispatch.createDispatch(roomName, "beethoven-teacher", {
            metadata: roomMetadata,
          });
          console.log("🤖 [RECORDING] Dispatched beethoven-teacher to room:", roomName);
        } catch (dispatchError: any) {
          if (dispatchError?.message?.includes("already exists") || dispatchError?.code === 409) {
            console.log("🤖 [RECORDING] Agent dispatch already exists for room:", roomName);
          } else {
            console.error("🤖 [RECORDING] Agent dispatch error:", dispatchError?.message);
          }
        }
      } catch (error: any) {
        console.error("🎬 [RECORDING] Room/dispatch setup error:", error?.message);
        // Don't fail the token generation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      token,
      roomName,
      identity: `admin-${user.id}`,
    });
  } catch (error) {
    console.error("Recording token error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Generate a LiveKit token for the avatar agent during recording
 * This is called by the Python agent when joining a recording session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get("roomName");
    const videoCreationId = searchParams.get("videoCreationId");
    const apiKey = searchParams.get("apiKey");

    // Simple API key validation for agent authentication
    // In production, use a proper authentication mechanism
    const expectedApiKey = process.env.INTERNAL_API_KEY;
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    if (!roomName || !videoCreationId) {
      return NextResponse.json(
        { error: "roomName and videoCreationId are required" },
        { status: 400 }
      );
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 500 }
      );
    }

    // Create access token for the avatar agent
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: "avatar-agent",
      name: "Avatar",
      metadata: JSON.stringify({
        role: "avatar",
        videoCreationId,
        isRecordingSession: true,
      }),
    });

    // Agent needs full publish permissions
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishData: true,
    };

    at.addGrant(grant);
    const token = await at.toJwt();

    return NextResponse.json({
      success: true,
      token,
      roomName,
      identity: "avatar-agent",
    });
  } catch (error) {
    console.error("Agent token error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
