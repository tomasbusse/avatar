/**
 * Educational Video Generator - Avatar Generation API
 *
 * Takes audio from R2 and generates an AI avatar video via Hedra.
 * Uses async pattern: starts job and returns immediately, frontend polls for status.
 * Features exponential backoff retry for rate limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { withRetry, requestSpacer } from "@/lib/video-generator/rate-limiter";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes for starting the job (increased for retries)

// Lazy-init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

// Hedra API
const HEDRA_API_BASE = "https://api.hedra.com/web-app/public";
const DEFAULT_HEDRA_MODEL = "d1dd37a3-e39a-4854-a298-6510289f9cf2";

interface GenerateAvatarRequest {
  videoId: string;
  audioUrl: string;
  characterId: string;
  characterImageUrl?: string;
  resolution?: "540p" | "720p" | "1080p";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  textPrompt?: string;
}

/**
 * Create an asset in Hedra with retry logic
 */
async function createHedraAsset(
  filename: string,
  type: "audio" | "image"
): Promise<string> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) {
    throw new Error("HEDRA_API_KEY not configured");
  }

  // Space requests to Hedra (minimum 2s between requests)
  await requestSpacer.space("hedra", 2000);

  return withRetry(
    async () => {
      const response = await fetch(`${HEDRA_API_BASE}/assets`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: filename,
          type: type,
        }),
      });

      // Handle rate limits as retryable
      if (response.status === 429 || response.status === 503) {
        const error = await response.text();
        throw new Error(`Hedra rate limit (${response.status}): ${error.slice(0, 200)}`);
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hedra create asset failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.id;
    },
    {
      maxRetries: 3,
      baseDelayMs: 3000,
      maxDelayMs: 30000,
      onRetry: (attempt, delay, error) => {
        console.log(`[Hedra] Create asset retry ${attempt}/3, waiting ${delay}ms`);
      },
    }
  );
}

/**
 * Upload file to Hedra asset with retry logic
 */
async function uploadHedraAsset(
  assetId: string,
  buffer: Buffer,
  filename: string
): Promise<void> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) {
    throw new Error("HEDRA_API_KEY not configured");
  }

  // Space requests to Hedra
  await requestSpacer.space("hedra", 2000);

  return withRetry(
    async () => {
      const formData = new FormData();
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer]);
      formData.append("file", blob, filename);

      const response = await fetch(`${HEDRA_API_BASE}/assets/${assetId}/upload`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      // Handle rate limits as retryable
      if (response.status === 429 || response.status === 503) {
        const error = await response.text();
        throw new Error(`Hedra rate limit (${response.status}): ${error.slice(0, 200)}`);
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hedra upload failed: ${response.status} - ${error}`);
      }
    },
    {
      maxRetries: 3,
      baseDelayMs: 3000,
      maxDelayMs: 30000,
      onRetry: (attempt, delay, error) => {
        console.log(`[Hedra] Upload retry ${attempt}/3, waiting ${delay}ms`);
      },
    }
  );
}

/**
 * Upload image from URL to Hedra
 */
async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  const filename = `avatar_${Date.now()}.jpg`;
  const assetId = await createHedraAsset(filename, "image");
  await uploadHedraAsset(assetId, buffer, filename);

  return assetId;
}

/**
 * Upload audio from URL to Hedra
 */
async function uploadAudioFromUrl(audioUrl: string): Promise<string> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  const filename = `audio_${Date.now()}.mp3`;
  const assetId = await createHedraAsset(filename, "audio");
  await uploadHedraAsset(assetId, buffer, filename);

  return assetId;
}

/**
 * Start Hedra video generation with retry logic
 */
async function startHedraGeneration(
  audioId: string,
  characterId: string,
  options: {
    resolution?: string;
    aspectRatio?: string;
    textPrompt?: string;
  }
): Promise<string> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) {
    throw new Error("HEDRA_API_KEY not configured");
  }

  // Space requests to Hedra
  await requestSpacer.space("hedra", 2000);

  const payload = {
    type: "video",
    ai_model_id: DEFAULT_HEDRA_MODEL,
    audio_id: audioId,
    start_keyframe_id: characterId,
    generated_video_inputs: {
      text_prompt: options.textPrompt || "A professional teacher speaking clearly to the camera with a friendly expression",
      resolution: options.resolution || "720p",
      aspect_ratio: options.aspectRatio || "16:9",
    },
  };

  return withRetry(
    async () => {
      const response = await fetch(`${HEDRA_API_BASE}/generations`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Handle rate limits as retryable
      if (response.status === 429 || response.status === 503) {
        const error = await response.text();
        throw new Error(`Hedra rate limit (${response.status}): ${error.slice(0, 200)}`);
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hedra generation start failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.id;
    },
    {
      maxRetries: 3,
      baseDelayMs: 5000, // Longer delay for generation starts
      maxDelayMs: 60000,
      onRetry: (attempt, delay, error) => {
        console.log(`[Hedra] Generation start retry ${attempt}/3, waiting ${delay}ms`);
      },
    }
  );
}

export async function POST(request: NextRequest) {
  let videoId: string | undefined;

  try {
    const body: GenerateAvatarRequest = await request.json();
    const {
      videoId: vid,
      audioUrl,
      characterId,
      characterImageUrl,
      resolution = "720p",
      aspectRatio = "16:9",
      textPrompt,
    } = body;

    videoId = vid;

    // Validate required fields
    if (!videoId || !audioUrl) {
      return NextResponse.json(
        { error: "Missing required fields: videoId, audioUrl" },
        { status: 400 }
      );
    }

    if (!characterId && !characterImageUrl) {
      return NextResponse.json(
        { error: "Either characterId or characterImageUrl is required" },
        { status: 400 }
      );
    }

    // Check for required env vars
    if (!process.env.HEDRA_API_KEY) {
      return NextResponse.json(
        { error: "HEDRA_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Update status to avatar generating
    await getConvexClient().mutation(api.educationalVideos.updateStatus, {
      videoId: videoId as Id<"educationalVideos">,
      status: "avatar_generating",
    });

    // Step 1: Upload audio to Hedra
    console.log("[Avatar] Uploading audio to Hedra...");
    const audioAssetId = await uploadAudioFromUrl(audioUrl);
    console.log(`[Avatar] Audio asset ID: ${audioAssetId}`);

    // Step 2: Determine avatar/character ID
    let finalCharacterId = characterId;
    if (!finalCharacterId && characterImageUrl) {
      console.log("[Avatar] Uploading avatar image to Hedra...");
      finalCharacterId = await uploadImageFromUrl(characterImageUrl);
      console.log(`[Avatar] Image asset ID: ${finalCharacterId}`);
    }

    // Step 3: Start Hedra generation (async - don't wait)
    console.log("[Avatar] Starting Hedra video generation...");
    const hedraJobId = await startHedraGeneration(audioAssetId, finalCharacterId!, {
      resolution,
      aspectRatio,
      textPrompt,
    });
    console.log(`[Avatar] Hedra job started: ${hedraJobId}`);

    // Step 4: Store the job ID in Convex so we can poll later
    await getConvexClient().mutation(api.educationalVideos.storeHedraJobId, {
      videoId: videoId as Id<"educationalVideos">,
      hedraJobId,
    });

    // Return immediately - frontend will poll for status
    return NextResponse.json({
      success: true,
      hedraJobId,
      videoId,
      message: "Avatar generation started. Poll /api/video-generator/avatar-status for progress.",
    });
  } catch (error) {
    console.error("[Avatar] Error:", error);

    // Update status to failed
    if (videoId) {
      try {
        await getConvexClient().mutation(api.educationalVideos.updateStatus, {
          videoId: videoId as Id<"educationalVideos">,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Avatar generation failed",
          errorStep: "avatar_generation",
        });
      } catch {
        // Ignore errors in error handling
      }
    }

    return NextResponse.json(
      {
        error: "Failed to start avatar generation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
