import { AccessToken, AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

/**
 * Landing-page LiveKit token route.
 *
 * - Creates an anonymous room with `landing-<uuid>` prefix and dispatches the
 *   `beethoven-teacher` agent with `site: "beethoven"` metadata.
 * - The avatar server in /apps/video-generator (agents/agent.py) routes any room
 *   whose metadata `site` is in EXTERNAL_SITES (englisch-lehrer | beethoven | intenga)
 *   to handle_external_site(), which wires Bithuman + Gemini Live. Beethoven's own
 *   apps/agent worker also serves `landing-*` rooms via run_landing_agent (prefix-based,
 *   ignores `site`) — so whichever worker holds the `beethoven-teacher` dispatch speaks.
 * - No auth required — the landing is public.
 * - Passes full avatar customization via dispatch metadata (prompts, identity, voice).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { avatar } = body as { avatar?: Record<string, unknown> };

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error("[landing-token] LiveKit not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const httpUrl = wsUrl.replace("wss://", "https://").replace("ws://", "http://");
    const roomName = `landing-${randomUUID()}`;
    const identity = `visitor-${randomUUID()}`;

    const personality = (avatar?.personality as Record<string, unknown>) || {};
    const identityInfo = (avatar?.identity as Record<string, unknown>) || {};
    // Gemini Live fallback voice — only used by the agent when the avatar has
    // no configured Cartesia voiceProvider (Cartesia voices can't be plugged
    // into Gemini Live). The avatar's real voiceProvider is forwarded below.
    const isFemale =
      personality.gender === "female" || identityInfo.gender === "female";
    const voice = isFemale
      ? process.env.GEMINI_VOICE_FEMALE || "Aoede"
      : process.env.GEMINI_VOICE_MALE || "Alnilam";

    const systemPrompts = (avatar?.systemPrompts as Record<string, unknown>) || {};
    const systemPrompt =
      (systemPrompts.base as string | undefined) ||
      (avatar?.persona as string | undefined) ||
      undefined;

    // `site: "beethoven"` routes this room to the video-generator avatar server's
    // handle_external_site() (its EXTERNAL_SITES = englisch-lehrer | beethoven | intenga),
    // which starts the Bithuman + Gemini Live session. Beethoven's own apps/agent landing
    // worker routes by the `landing-` room prefix and ignores `site`, so this value is safe
    // for both workers. Forward the full avatar config the external-site handler reads
    // (systemPrompts.base, identity, personality, behaviorRules, levelAdaptation) plus the
    // flat `systemPrompt` that run_landing_agent reads.
    const metadata = JSON.stringify({
      site: "beethoven",
      avatarName: avatar?.name,
      voice,
      systemPrompt,
      systemPrompts: avatar?.systemPrompts,
      identity: avatar?.identity,
      personality: avatar?.personality,
      behaviorRules: avatar?.behaviorRules,
      levelAdaptation: avatar?.levelAdaptation,
      avatarProvider: avatar?.avatarProvider,
      // The avatar's real configured voice (e.g. Cartesia "Classy British
      // Man"). run_landing_agent uses this for STT+LLM+Cartesia-TTS and only
      // falls back to the generic Gemini `voice` above when this is absent.
      voiceProvider: avatar?.voiceProvider,
      llmConfig: avatar?.llmConfig,
      bithumanFigureId: process.env.BITHUMAN_FIGURE_ID,
    });

    const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
    try {
      await roomService.createRoom({
        name: roomName,
        metadata,
        emptyTimeout: 60 * 5,
        maxParticipants: 3,
      });
    } catch (err) {
      console.error("[landing-token] Room create failed:", (err as Error)?.message);
    }

    try {
      const dispatch = new AgentDispatchClient(httpUrl, apiKey, apiSecret);
      await dispatch.createDispatch(roomName, "beethoven-teacher", { metadata });
    } catch (err) {
      const msg = (err as Error)?.message || "";
      if (!msg.includes("already exists")) {
        console.error("[landing-token] Dispatch failed:", msg);
      }
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: "Landing Visitor",
      ttl: 15 * 60,
    });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();

    return NextResponse.json({
      roomName,
      token,
      livekitUrl: wsUrl,
    });
  } catch (error) {
    console.error("[landing-token] Error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
