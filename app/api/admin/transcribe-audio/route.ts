import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen";

// Supported audio MIME types
const SUPPORTED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/mp4",
  "audio/ogg",
  "audio/flac",
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
      return NextResponse.json(
        { error: "Transcription service not configured" },
        { status: 500 }
      );
    }

    // Get audio file from request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file required" },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB for longer audio files)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }

    // Convert blob to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Determine content type
    let contentType = audioFile.type || "audio/webm";
    if (!SUPPORTED_AUDIO_TYPES.includes(contentType)) {
      // Try to infer from common extensions if type is generic
      contentType = "audio/webm";
    }

    // Call Deepgram API with multi-language support (English + German)
    // Using nova-2 model for better accuracy
    const params = new URLSearchParams({
      model: "nova-2",
      language: "multi", // Auto-detect English/German
      smart_format: "true",
      punctuate: "true",
      paragraphs: "true",
      diarize: "true", // Speaker diarization for multi-speaker content
      utterances: "true",
    });

    const response = await fetch(`${DEEPGRAM_API_URL}?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        "Content-Type": contentType,
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Deepgram API error:", errorText);
      return NextResponse.json(
        { error: "Transcription failed. Please try again." },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Extract transcript from Deepgram response
    const transcript =
      result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    // Extract confidence score (0-1)
    const confidence =
      result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    // Extract duration in seconds
    const duration = result.metadata?.duration || 0;

    // Extract detected language(s)
    const detectedLanguage =
      result.results?.channels?.[0]?.detected_language || "en";

    // Extract paragraphs if available (for better formatting)
    const paragraphs =
      result.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs;

    // Format transcript with paragraphs if available
    let formattedTranscript = transcript;
    if (paragraphs && paragraphs.length > 0) {
      formattedTranscript = paragraphs
        .map(
          (p: { sentences?: Array<{ text: string }> }) =>
            p.sentences?.map((s) => s.text).join(" ") || ""
        )
        .filter(Boolean)
        .join("\n\n");
    }

    // Format duration as MM:SS or HH:MM:SS
    const formatDuration = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return NextResponse.json({
      success: true,
      transcript: formattedTranscript || transcript,
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
      duration: formatDuration(duration),
      durationSeconds: duration,
      detectedLanguage,
      wordCount: transcript.split(/\s+/).filter(Boolean).length,
    });
  } catch (error) {
    console.error("Audio transcription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
