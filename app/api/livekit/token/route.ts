import { auth } from "@clerk/nextjs/server";
import { AccessToken, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { roomName, participantName, sessionId, avatar } = body;

    console.log("🎟️ [TOKEN] Generating token for:", {
      roomName,
      participantName,
      userId,
      hasAvatar: !!avatar,
      avatarId: avatar?._id,
      avatarName: avatar?.name,
    });

    // Detailed logging for identity/personality
    if (avatar) {
      console.log("📝 [TOKEN] Avatar details:", {
        name: avatar.name,
        hasPersonality: !!avatar.personality,
        personalityKeys: avatar.personality ? Object.keys(avatar.personality) : [],
        hasIdentity: !!avatar.identity,
        identityKeys: avatar.identity ? Object.keys(avatar.identity) : [],
        hasSystemPrompts: !!avatar.systemPrompts,
        systemPromptsBase: avatar.systemPrompts?.base?.substring(0, 100) + "...",
        hasVisionConfig: !!avatar.visionConfig,
        visionEnabled: avatar.visionConfig?.enabled,
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
    const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

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
      userId,
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

    // Create or update room with metadata
    if (livekitUrl) {
      try {
        const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

        // Create room with metadata (or update if exists)
        await roomService.createRoom({
          name: roomName,
          metadata: roomMetadata,
          emptyTimeout: 60 * 10, // 10 minutes
          maxParticipants: 10,
        });

        console.log("🏠 [ROOM] Created/updated room with avatar metadata:", {
          roomName,
          hasAvatar: !!avatar,
          hasPersonality: !!avatar?.personality,
          hasIdentity: !!avatar?.identity,
          hasVisionConfig: !!avatar?.visionConfig,
          visionEnabled: avatar?.visionConfig?.enabled,
        });

        // Dispatch agent to room
        try {
          const agentDispatch = new AgentDispatchClient(livekitUrl, apiKey, apiSecret);
          await agentDispatch.createDispatch(roomName, "beethoven-teacher", {
            metadata: roomMetadata,
          });
          console.log("🤖 [AGENT] Dispatched beethoven-teacher to room:", roomName);
        } catch (dispatchError) {
          console.error("🤖 [AGENT] Dispatch error:", dispatchError);
        }
      } catch (roomError) {
        // Room might already exist, which is fine
        console.log("🏠 [ROOM] Room creation note:", roomError);
      }
    }

    const TOKEN_TTL_HOURS = 6;
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
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
