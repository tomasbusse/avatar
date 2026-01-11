import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
      return NextResponse.json(
        { error: "STT service not configured" },
        { status: 500 }
      );
    }

    // Get audio file from request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    // Convert blob to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Call Deepgram API
    const response = await fetch(
      `${DEEPGRAM_API_URL}?model=nova-2&language=en&smart_format=true&punctuate=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${deepgramApiKey}`,
          "Content-Type": "audio/webm", // Or audio/mp3 depending on recording format
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Deepgram API error:", errorText);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Extract transcript from Deepgram response
    const transcript =
      result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    // Extract confidence score
    const confidence =
      result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    // Extract words with timing (useful for detailed analysis)
    const words =
      result.results?.channels?.[0]?.alternatives?.[0]?.words || [];

    return NextResponse.json({
      success: true,
      transcript,
      confidence,
      words,
      duration: result.metadata?.duration || 0,
    });
  } catch (error) {
    console.error("Entry test STT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
