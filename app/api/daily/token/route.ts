import { NextRequest, NextResponse } from "next/server";

const PIPECAT_AGENT_URL =
  process.env.PIPECAT_AGENT_URL || "http://178.104.79.17:7890";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { avatar } = body;

    const systemPrompts = avatar?.systemPrompts || {};
    const basePrompt =
      systemPrompts.base ||
      `You are ${avatar?.identity?.preferredName || "Ludwig"}, a helpful assistant.`;

    const isFemale =
      avatar?.personality?.gender === "female" ||
      avatar?.identity?.gender === "female";
    const voice = isFemale ? "Aoede" : "Sadaltager";

    const avatarId = avatar?.avatarProvider?.avatarId || "";
    console.log(`[daily/token] Creating session: voice=${voice}, avatarId=${avatarId}, agent=${PIPECAT_AGENT_URL}`);

    const res = await fetch(`${PIPECAT_AGENT_URL}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site: "beethoven",
        systemPrompt: basePrompt,
        voice,
        avatarId,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[daily/token] Pipecat agent error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const { roomUrl, token } = await res.json();
    console.log(`[daily/token] Session created: room=${roomUrl}`);
    return NextResponse.json({ roomUrl, token });
  } catch (error) {
    console.error("Error creating Daily session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
