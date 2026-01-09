import { auth } from "@clerk/nextjs/server";
import { AccessToken, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    const body = await req.json();
    const { roomName, participantName, sessionId, avatar, isGuest, guestId } = body;

    // Allow authenticated users OR guests with a guestId/sessionId
    const effectiveUserId = userId || (isGuest && (guestId || `guest_${sessionId}`));

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: "Unauthorized - must be authenticated or provide guest credentials" },
        { status: 401 }
      );
    }

    // CRITICAL DEBUG: Log ALL avatar keys to see what's being received
    console.log("🎟️ [TOKEN] Generating token for:", {
      roomName,
      participantName,
      userId: effectiveUserId,
      isGuest: !userId,
      hasAvatar: !!avatar,
      avatarId: avatar?._id,
      avatarName: avatar?.name,
      avatarKeys: avatar ? Object.keys(avatar) : [],
    });

    // Log critical config fields explicitly
    if (avatar) {
      console.log("⚡ [TOKEN] CRITICAL CONFIG:", {
        llmConfig: avatar.llmConfig,
        voiceProvider: avatar.voiceProvider,
        visionConfig: avatar.visionConfig,
        sttConfig: avatar.sttConfig,
      });
    }

    if (!roomName) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitWsUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    // RoomServiceClient and AgentDispatchClient need HTTP URL, not WebSocket
    // Convert wss:// to https:// for server SDK calls
    const livekitUrl = livekitWsUrl?.replace('wss://', 'https://').replace('ws://', 'http://');

    if (!apiKey || !apiSecret) {
      console.error("LiveKit credentials not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Build room metadata with full avatar configuration
    // Note: Python agent uses snake_case, so we include both formats
    const roomMetadata = JSON.stringify({
      sessionId,
      userId: effectiveUserId,
      isGuest: !userId,
      avatar: avatar ? {
        // Core identity
        _id: avatar._id,
        name: avatar.name,
        slug: avatar.slug,
        description: avatar.description,

        // Voice configuration (camelCase + snake_case for Python)
        voiceProvider: avatar.voiceProvider,
        voice_config: {
          voice_id: avatar.voiceProvider?.voiceId,
          voice_id_english: avatar.voiceProvider?.voiceIdEnglish,
          voice_id_german: avatar.voiceProvider?.voiceIdGerman,
        },

        // LLM configuration (camelCase + snake_case for Python)
        llmConfig: avatar.llmConfig,
        llm_model: avatar.llmConfig?.model,

        // Structured personality (traits, style, behaviors)
        personality: avatar.personality,

        // Full identity (name, credentials, career, anecdotes, philosophy)
        identity: avatar.identity,

        // Legacy persona (for backward compat)
        persona: avatar.persona,

        // System prompts and behavior
        systemPrompts: avatar.systemPrompts,
        behaviorRules: avatar.behaviorRules,
        bilingualConfig: avatar.bilingualConfig,

        // Knowledge and memory configuration
        knowledgeConfig: avatar.knowledgeConfig,
        memoryConfig: avatar.memoryConfig,

        // Vision configuration (CRITICAL for seeing user)
        visionConfig: avatar.visionConfig,
        vision_config: avatar.visionConfig ? {
          enabled: avatar.visionConfig.enabled,
          vision_llm_model: avatar.visionConfig.visionLLMModel || "google/gemini-2.5-flash-preview-05-20",
          capture_mode: avatar.visionConfig.captureMode || "smart",
          capture_webcam: avatar.visionConfig.captureWebcam ?? true,
          capture_screen: avatar.visionConfig.captureScreen ?? true,
        } : { enabled: false },

        // Avatar provider settings (camelCase + snake_case for Python)
        avatarProvider: avatar.avatarProvider,
        avatar_provider: avatar.avatarProvider,
      } : undefined,
    });

    // ==========================================================================
    // ROOM MANAGEMENT - ALWAYS update metadata to ensure correct avatar
    // ==========================================================================
    // CACHING STRATEGY:
    // - Room metadata is NOT cached - always updated to reflect current avatar
    // - This prevents stale avatar configs when user switches avatars
    // - Agent dispatch metadata is also updated for consistency
    // ==========================================================================
    if (livekitUrl) {
      console.log("🔗 [LIVEKIT] Using URL:", livekitUrl);
      const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

      try {
        // Try to create room with metadata
        await roomService.createRoom({
          name: roomName,
          metadata: roomMetadata,
          emptyTimeout: 60 * 10, // 10 minutes
          maxParticipants: 10,
        });

        console.log("🏠 [ROOM] Created room with avatar metadata:", {
          roomName,
          avatarName: avatar?.name,
          beyAvatarId: avatar?.avatarProvider?.avatarId,
        });
      } catch (roomError: any) {
        // Room already exists - MUST update metadata to use current avatar!
        if (roomError?.message?.includes("already exists")) {
          console.log("🏠 [ROOM] Room exists, updating metadata for avatar:", avatar?.name);
          try {
            // CRITICAL: Update room metadata to ensure correct avatar is used
            await roomService.updateRoomMetadata(roomName, roomMetadata);
            console.log("✅ [ROOM] Metadata updated with current avatar config");
          } catch (updateError: any) {
            console.error("❌ [ROOM] Failed to update metadata:", updateError?.message);
          }
        } else {
          console.error("🏠 [ROOM] Room creation error:", {
            message: roomError?.message,
            code: roomError?.code,
          });
        }
      }

      // Dispatch agent to room with current metadata
      try {
        const agentDispatch = new AgentDispatchClient(livekitUrl, apiKey, apiSecret);
        await agentDispatch.createDispatch(roomName, "beethoven-teacher", {
          metadata: roomMetadata,
        });
        console.log("🤖 [AGENT] Dispatched beethoven-teacher to room:", roomName);
      } catch (dispatchError: any) {
        // Agent might already be dispatched - this is fine
        if (!dispatchError?.message?.includes("already exists")) {
          console.error("🤖 [AGENT] Dispatch error:", {
            message: dispatchError?.message,
            code: dispatchError?.code,
          });
        }
      }
    } else {
      console.warn("⚠️ [LIVEKIT] No LiveKit URL configured, skipping room creation");
    }

    const TOKEN_TTL_HOURS = 6;
    const at = new AccessToken(apiKey, apiSecret, {
      identity: effectiveUserId,
      name: participantName || "Student",
      ttl: TOKEN_TTL_HOURS * 60 * 60,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      agent: true, // Allow agent to join
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
