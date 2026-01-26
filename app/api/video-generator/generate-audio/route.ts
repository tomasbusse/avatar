/**
 * Educational Video Generator - Audio Generation API
 *
 * Uses Cartesia TTS for generating voiceover audio.
 * Features exponential backoff retry for rate limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { uploadFile, getSignedDownloadUrl } from "@/lib/r2";
import { withRetry, requestSpacer } from "@/lib/video-generator/rate-limiter";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes for audio generation

// Lazy init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

export async function POST(request: NextRequest) {
  let videoId: string | undefined;

  try {
    const body = await request.json();

    const {
      videoId: vid,
      script,
      voiceId,
      voiceProvider = "cartesia",
      voiceSettings = {},
    } = body;

    videoId = vid;

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
    await getConvexClient().mutation(api.educationalVideos.updateStatus, {
      videoId: videoId as Id<"educationalVideos">,
      status: "audio_generating",
    });

    let audioBuffer: Buffer;
    let duration: number;

    if (voiceProvider === "cartesia") {
      // Space requests to avoid burst rate limits (minimum 1s between Cartesia requests)
      await requestSpacer.space("cartesia", 1000);

      // Cartesia TTS API with retry logic
      const cartesiaResponse = await withRetry(
        async () => {
          const response = await fetch(
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

          // Handle rate limits as retryable
          if (response.status === 429 || response.status === 503 || response.status === 502) {
            const error = await response.text();
            throw new Error(`Cartesia rate limit (${response.status}): ${error.slice(0, 200)}`);
          }

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cartesia TTS failed (${response.status}): ${error}`);
          }

          return response;
        },
        {
          maxRetries: 3,
          baseDelayMs: 2000,
          maxDelayMs: 30000,
          onRetry: (attempt, delay, error) => {
            console.log(`[Cartesia] Retry ${attempt}/3, waiting ${delay}ms: ${error.message.slice(0, 100)}`);
          },
        }
      );

      const audioArrayBuffer = await cartesiaResponse.arrayBuffer();
      audioBuffer = Buffer.from(audioArrayBuffer);

      // Estimate duration from audio size (~128kbps MP3)
      // fileSize (bytes) / (bitrate (kbps) * 1000 / 8) = duration (seconds)
      duration = audioBuffer.length / (128 * 1000 / 8);
    } else {
      throw new Error(`Unsupported voice provider: ${voiceProvider}`);
    }

    // Upload to R2 using shared utilities
    const timestamp = Date.now();
    const r2Key = `educational-videos/${videoId}/audio-${timestamp}.mp3`;

    console.log(`[Audio] Uploading ${audioBuffer.length} bytes to R2...`);
    await uploadFile(r2Key, audioBuffer, {
      contentType: "audio/mpeg",
    });

    // Get a longer-lived signed URL (7 days)
    const r2Url = await getSignedDownloadUrl(r2Key, 86400 * 7);

    // Store audio output in Convex
    await getConvexClient().mutation(api.educationalVideos.storeAudioOutput, {
      videoId: videoId as Id<"educationalVideos">,
      audioOutput: {
        r2Key,
        r2Url,
        duration,
        fileSize: audioBuffer.length,
      },
    });

    console.log(`[Audio] Success: ${r2Key}, duration: ${duration}s`);

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
    console.error("[Audio] Error:", error);

    // Update status to failed
    if (videoId) {
      try {
        await getConvexClient().mutation(api.educationalVideos.updateStatus, {
          videoId: videoId as Id<"educationalVideos">,
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Audio generation failed",
          errorStep: "audio_generation",
        });
      } catch {
        // Ignore errors in error handling
      }
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
