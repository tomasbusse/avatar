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

    const res = await fetch(`${PIPECAT_AGENT_URL}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site: "beethoven",
        systemPrompt: basePrompt,
        voice,
        avatarId: avatar?.avatarProvider?.avatarId || "",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Pipecat agent error:", text);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const { roomUrl, token } = await res.json();
    return NextResponse.json({ roomUrl, token });
  } catch (error) {
    console.error("Error creating Daily session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
