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

    console.log("[TOKEN] Generating token:", {
      roomName,
      avatarName: avatar?.name,
      sessionType: isGuest ? "guest" : "authenticated",
    });

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
    // Determine Gemini voice based on avatar gender (Ludwig is male)
    const isFemale = avatar?.personality?.gender === "female" || avatar?.identity?.gender === "female";
    const geminiVoice = isFemale
      ? (process.env.GEMINI_VOICE_FEMALE || "Aoede")
      : (process.env.GEMINI_VOICE_MALE || "Alnilam");

    const roomMetadata = JSON.stringify({
      site: "beethoven",
      llmProvider: "gemini-live",
      voice: geminiVoice,
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
        sessionStartConfig: avatar.sessionStartConfig,
        bilingualConfig: avatar.bilingualConfig,

        // Knowledge and memory configuration
        knowledgeConfig: avatar.knowledgeConfig,
        memoryConfig: avatar.memoryConfig,

        // Vision configuration (CRITICAL for seeing user)
        visionConfig: avatar.visionConfig,
        vision_config: avatar.visionConfig ? {
          enabled: avatar.visionConfig.enabled,
          vision_llm_model: avatar.visionConfig.visionLLMModel || "google/gemini-3-flash-preview",
          capture_mode: avatar.visionConfig.captureMode || "smart",
          capture_webcam: avatar.visionConfig.captureWebcam ?? true,
          capture_screen: avatar.visionConfig.captureScreen ?? true,
          analysis_interval: avatar.visionConfig.analysisInterval ?? 1.5,
          enable_tool_calling: avatar.visionConfig.enableToolCalling ?? true,
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
      console.log("[LIVEKIT] Using URL:", livekitUrl);
      const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

      try {
        // Try to create room with metadata
        await roomService.createRoom({
          name: roomName,
          metadata: roomMetadata,
          emptyTimeout: 60 * 10, // 10 minutes
          maxParticipants: 4, // 1 student + 1 agent + 1 bey-avatar + buffer
        });

        console.log("[ROOM] Created room:", roomName, "avatar:", avatar?.name);
      } catch (roomError: any) {
        // Room already exists - MUST update metadata to use current avatar!
        if (roomError?.message?.includes("already exists")) {
          console.log("[ROOM] Room exists, updating metadata for avatar:", avatar?.name);
          try {
            // CRITICAL: Update room metadata to ensure correct avatar is used
            await roomService.updateRoomMetadata(roomName, roomMetadata);
            console.log("[ROOM] Metadata updated with current avatar config");
          } catch (updateError: any) {
            console.error("[ROOM] Failed to update metadata:", updateError?.message);
          }
        } else {
          console.error("[ROOM] Room creation error:", roomError?.message);
        }
      }

      // Dispatch agent to room - Only dispatch if agent is NOT already in the room
      // IMPORTANT: Do NOT delete existing dispatches - this causes double-agent issues
      try {
        const agentDispatch = new AgentDispatchClient(livekitUrl, apiKey, apiSecret);

        // Check if agent is actually in the room as a participant
        let agentInRoom = false;
        try {
          const participants = await roomService.listParticipants(roomName);
          agentInRoom = participants.some(p =>
            p.identity?.includes("beethoven") || p.identity?.includes("bey-avatar")
          );
          if (agentInRoom) {
            console.log("[AGENT] Agent already in room, skipping dispatch:", roomName);
          }
        } catch (listError: any) {
          // Room might not exist yet, which is fine
          console.log("[AGENT] Could not list participants (room may not exist yet)");
        }

        // Only create dispatch if agent is not already in room
        if (!agentInRoom) {
          try {
            await agentDispatch.createDispatch(roomName, "", {
              metadata: roomMetadata,
            });
            console.log("[AGENT] Dispatched beethoven-teacher to room:", roomName);
          } catch (createError: any) {
            // If dispatch already exists, that's fine - don't delete it
            if (createError?.message?.includes("already exists") || createError?.code === 409) {
              console.log("[AGENT] Dispatch already exists for room (keeping it):", roomName);
            } else {
              throw createError;
            }
          }
        }
      } catch (dispatchError: any) {
        // Log error but don't fail token generation
        console.error("[AGENT] Dispatch error:", dispatchError?.message);
      }
    } else {
      console.warn("[LIVEKIT] No LiveKit URL configured, skipping room creation");
    }

    const TOKEN_TTL_HOURS = 1;
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
