import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// R2 client setup
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || "beethoven-videos";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      videoId,
      script,
      voiceId,
      voiceProvider = "cartesia",
      voiceSettings = {},
    } = body;

    // Validate required fields
    if (!videoId || !script || !voiceId) {
      return NextResponse.json(
        {
          error: "Missing required fields: videoId, script, voiceId",
        },
        { status: 400 }
      );
    }

    // Update status to generating audio
    await convex.mutation(api.educationalVideos.updateStatus, {
      videoId: videoId as Id<"educationalVideos">,
      status: "audio_generating",
    });

    let audioBuffer: Buffer;
    let duration: number;

    if (voiceProvider === "cartesia") {
      // Cartesia TTS API
      const cartesiaResponse = await fetch(
        "https://api.cartesia.ai/tts/bytes",
        {
          method: "POST",
          headers: {
            "X-API-Key": process.env.CARTESIA_API_KEY!,
            "Cartesia-Version": "2024-06-10",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model_id: "sonic-2",
            transcript: script,
            voice: {
              mode: "id",
              id: voiceId,
            },
            output_format: {
              container: "mp3",
              encoding: "mp3",
              sample_rate: 44100,
            },
            language: voiceSettings.language || "en",
            // Emotion control if provided
            ...(voiceSettings.emotion && {
              __experimental_controls: {
                emotion: voiceSettings.emotion,
              },
            }),
          }),
        }
      );

      if (!cartesiaResponse.ok) {
        const error = await cartesiaResponse.text();
        console.error("Cartesia API error:", error);
        throw new Error(`Cartesia TTS failed: ${error}`);
      }

      const audioArrayBuffer = await cartesiaResponse.arrayBuffer();
      audioBuffer = Buffer.from(audioArrayBuffer);

      // Estimate duration from audio size (~128kbps MP3)
      // fileSize (bytes) / (bitrate (kbps) * 1000 / 8) = duration (seconds)
      duration = audioBuffer.length / (128 * 1000 / 8);
    } else {
      throw new Error(`Unsupported voice provider: ${voiceProvider}`);
    }

    // Upload to R2
    const timestamp = Date.now();
    const r2Key = `educational-videos/${videoId}/audio-${timestamp}.mp3`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: audioBuffer,
        ContentType: "audio/mpeg",
      })
    );

    const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;

    // Store audio output in Convex
    await convex.mutation(api.educationalVideos.storeAudioOutput, {
      videoId: videoId as Id<"educationalVideos">,
      audioOutput: {
        r2Key,
        r2Url,
        duration,
        fileSize: audioBuffer.length,
      },
    });

    return NextResponse.json({
      success: true,
      audioOutput: {
        r2Key,
        r2Url,
        duration,
        fileSize: audioBuffer.length,
      },
      message: "Audio generated successfully",
    });
  } catch (error) {
    console.error("Error generating audio:", error);

    // Try to update status to failed if we have videoId
    try {
      const body = await request.clone().json();
      if (body.videoId) {
        await convex.mutation(api.educationalVideos.updateStatus, {
          videoId: body.videoId as Id<"educationalVideos">,
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Audio generation failed",
          errorStep: "audio_generation",
        });
      }
    } catch {
      // Ignore errors in error handling
    }

    return NextResponse.json(
      {
        error: "Failed to generate audio",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
