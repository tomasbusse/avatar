/**
 * Educational Video Generator - Avatar Generation API
 *
 * Takes audio from R2 and generates an AI avatar video via Hedra.
 * Stores the result back to R2 and updates Convex.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { uploadFile, getSignedDownloadUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for avatar generation

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
 * Create an asset in Hedra
 */
async function createHedraAsset(
  filename: string,
  type: "audio" | "image"
): Promise<string> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) {
    throw new Error("HEDRA_API_KEY not configured");
  }

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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hedra create asset failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Upload file to Hedra asset
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hedra upload failed: ${response.status} - ${error}`);
  }
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
 * Start Hedra video generation
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

  const response = await fetch(`${HEDRA_API_BASE}/generations`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hedra generation start failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Poll Hedra for generation status
 */
async function pollHedraStatus(jobId: string): Promise<{
  status: string;
  videoUrl?: string;
  error?: string;
}> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) {
    throw new Error("HEDRA_API_KEY not configured");
  }

  // Note: Hedra API uses /generations/{id}/status endpoint
  const response = await fetch(`${HEDRA_API_BASE}/generations/${jobId}/status`, {
    headers: {
      "X-API-Key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hedra status check failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (data.status === "completed" || data.status === "complete") {
    return {
      status: "completed",
      videoUrl: data.download_url || data.url || data.video_url,
    };
  } else if (data.status === "failed" || data.status === "error") {
    return {
      status: "failed",
      error: data.error_message || data.error || data.message || "Generation failed",
    };
  }

  return { status: data.status };
}

/**
 * Wait for Hedra generation to complete with polling
 */
async function waitForHedraCompletion(
  jobId: string,
  maxWaitMs: number = 240000, // 4 minutes max
  pollIntervalMs: number = 5000 // Check every 5 seconds
): Promise<{ videoUrl: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await pollHedraStatus(jobId);

    if (result.status === "completed" && result.videoUrl) {
      return { videoUrl: result.videoUrl };
    }

    if (result.status === "failed") {
      throw new Error(result.error || "Hedra generation failed");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Hedra generation timed out");
}

/**
 * Download video from URL and upload to R2
 */
async function downloadAndUploadToR2(
  videoUrl: string,
  videoId: string
): Promise<{ r2Key: string; r2Url: string; duration: number }> {
  // Download video
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download avatar video: ${response.status}`);
  }

  const videoBuffer = Buffer.from(await response.arrayBuffer());

  // Upload to R2 using shared utilities
  const timestamp = Date.now();
  const r2Key = `educational-videos/${videoId}/avatar-${timestamp}.mp4`;

  await uploadFile(r2Key, videoBuffer, {
    contentType: "video/mp4",
  });

  // Get a longer-lived signed URL (7 days)
  const r2Url = await getSignedDownloadUrl(r2Key, 86400 * 7);

  // Estimate duration from file size (~1MB per 10 seconds at 720p)
  const estimatedDuration = Math.round(videoBuffer.length / 100000);

  return { r2Key, r2Url, duration: estimatedDuration };
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
    console.log("Uploading audio to Hedra...");
    const audioAssetId = await uploadAudioFromUrl(audioUrl);
    console.log(`  Audio asset ID: ${audioAssetId}`);

    // Step 2: Determine avatar/character ID
    let finalCharacterId = characterId;
    if (!finalCharacterId && characterImageUrl) {
      console.log("Uploading avatar image to Hedra...");
      finalCharacterId = await uploadImageFromUrl(characterImageUrl);
      console.log(`  Image asset ID: ${finalCharacterId}`);
    }

    // Step 3: Start Hedra generation
    console.log("Starting Hedra video generation...");
    const hedraJobId = await startHedraGeneration(audioAssetId, finalCharacterId!, {
      resolution,
      aspectRatio,
      textPrompt,
    });
    console.log(`  Hedra job ID: ${hedraJobId}`);

    // Step 4: Wait for completion (poll)
    console.log("Waiting for Hedra generation to complete...");
    const { videoUrl } = await waitForHedraCompletion(hedraJobId);
    console.log(`  Hedra video URL: ${videoUrl}`);

    // Step 5: Download and upload to R2
    console.log("Uploading avatar video to R2...");
    const { r2Key, r2Url, duration } = await downloadAndUploadToR2(videoUrl, videoId);
    console.log(`  R2 key: ${r2Key}`);

    // Step 6: Store avatar output in Convex
    await getConvexClient().mutation(api.educationalVideos.storeAvatarOutput, {
      videoId: videoId as Id<"educationalVideos">,
      avatarOutput: {
        r2Key,
        r2Url,
        duration,
        hedraJobId,
      },
    });

    return NextResponse.json({
      success: true,
      avatarOutput: {
        r2Key,
        r2Url,
        duration,
        hedraJobId,
      },
      message: "Avatar video generated successfully",
    });
  } catch (error) {
    console.error("Error generating avatar:", error);

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
        error: "Failed to generate avatar video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
