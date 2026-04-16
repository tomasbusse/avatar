import { AccessToken, AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

/**
 * Landing-page LiveKit token route.
 *
 * - Creates an anonymous room with `landing-<uuid>` prefix (main.py routes
 *   this prefix to run_landing_agent, which wires Bithuman + Gemini Live).
 * - No auth required — the landing is public.
 * - Passes avatar customization via dispatch metadata (system prompt, voice).
 * - Reuses the single `beethoven-teacher` agent worker (no separate dispatch name).
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

    const metadata = JSON.stringify({
      site: "simmonds-landing",
      avatarName: avatar?.name,
      voice,
      systemPrompt,
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
