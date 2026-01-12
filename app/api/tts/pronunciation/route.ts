import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const CARTESIA_API_URL = "https://api.cartesia.ai/tts/bytes";

// Default voice for vocabulary pronunciation (clear, neutral American English)
const DEFAULT_VOICE_ID = "79a125e8-cd45-4c13-8a67-188112f4dd22"; // "British Lady" for clear pronunciation

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, language = "en" } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Limit text length to prevent abuse
    if (text.length > 200) {
      return NextResponse.json({ error: "Text too long (max 200 characters)" }, { status: 400 });
    }

    const cartesiaApiKey = process.env.CARTESIA_API_KEY;
    if (!cartesiaApiKey) {
      return NextResponse.json({ error: "TTS service not configured" }, { status: 500 });
    }

    // Select model based on language
    const modelId = language === "de" ? "sonic-german" : "sonic-english";

    const response = await fetch(CARTESIA_API_URL, {
      method: "POST",
      headers: {
        "X-API-Key": cartesiaApiKey,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: modelId,
        transcript: text.trim(),
        voice: {
          mode: "id",
          id: DEFAULT_VOICE_ID,
        },
        output_format: {
          container: "mp3",
          bit_rate: 128000,
          sample_rate: 44100,
        },
        // Speak clearly for vocabulary learning
        language: language,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS Pronunciation] Cartesia API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate audio" },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        // Cache for 1 hour - same pronunciation can be reused
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[TTS Pronunciation] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
