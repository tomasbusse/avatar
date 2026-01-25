/**
 * Video Generation API - Simple Batch Flow
 *
 * This endpoint handles the complete video generation pipeline:
 * 1. Generate TTS audio from text via Cartesia
 * 2. Upload audio to Hedra
 * 3. Start Hedra video generation with avatar character
 * 4. Return job ID for polling
 *
 * Bypasses LiveKit entirely - no rooms, no agents, no WebRTC
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Convex client for mutations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Cartesia API
const CARTESIA_API_URL = "https://api.cartesia.ai/tts/bytes";
const DEFAULT_CARTESIA_MODEL = "sonic-3";
const DEFAULT_CARTESIA_VOICE = "a0e99841-438c-4a64-b679-ae501e7d6091";

// Hedra API
const HEDRA_API_BASE = "https://api.hedra.com/web-app/public";
const DEFAULT_HEDRA_MODEL = "d1dd37a3-e39a-4854-a298-6510289f9cf2";

interface GenerateRequest {
  text: string;
  voiceId?: string;
  characterId?: string;
  avatarImageUrl?: string;
  resolution?: "540p" | "720p" | "1080p";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  videoCreationId?: string;
  textPrompt?: string;
}

/**
 * Generate TTS audio via Cartesia
 */
async function generateTTSAudio(
  text: string,
  voiceId: string,
  speed?: number
): Promise<{ audioBuffer: Buffer; duration: number }> {
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    throw new Error("CARTESIA_API_KEY not configured");
  }

  const payload = {
    model_id: DEFAULT_CARTESIA_MODEL,
    transcript: text,
    voice: {
      mode: "id",
      id: voiceId,
      __experimental_controls: speed ? { speed } : undefined,
    },
    language: "en",
    output_format: {
      container: "wav",
      sample_rate: 44100,
      encoding: "pcm_s16le",
    },
  };

  const response = await fetch(CARTESIA_API_URL, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Cartesia-Version": "2024-06-10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cartesia API error: ${response.status} - ${error}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  // Estimate duration: (bytes - 44 header) / (sample_rate * 2 bytes) * 1000 ms
  const estimatedDuration = ((audioBuffer.length - 44) / (44100 * 2)) * 1000;

  return {
    audioBuffer,
    duration: Math.round(estimatedDuration),
  };
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
  // Create blob from buffer - use ArrayBuffer directly
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
  // Download image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  // Create asset
  const filename = `avatar_${Date.now()}.jpg`;
  const assetId = await createHedraAsset(filename, "image");

  // Upload
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
      text_prompt: options.textPrompt || "A person speaking clearly to the camera",
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

export async function POST(request: NextRequest) {
  // Store videoCreationId for error handling
  let videoCreationId: string | undefined;

  try {
    // Early validation of required environment variables
    const missingEnvVars: string[] = [];
    if (!process.env.CARTESIA_API_KEY) missingEnvVars.push("CARTESIA_API_KEY");
    if (!process.env.HEDRA_API_KEY) missingEnvVars.push("HEDRA_API_KEY");
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) missingEnvVars.push("NEXT_PUBLIC_CONVEX_URL");

    if (missingEnvVars.length > 0) {
      console.error("Missing environment variables:", missingEnvVars);
      return NextResponse.json(
        { error: `Server configuration error: Missing ${missingEnvVars.join(", ")}` },
        { status: 500 }
      );
    }

    const body: GenerateRequest = await request.json();
    const {
      text,
      voiceId = DEFAULT_CARTESIA_VOICE,
      characterId,
      avatarImageUrl,
      resolution = "720p",
      aspectRatio = "16:9",
      videoCreationId: vid,
      textPrompt,
    } = body;

    videoCreationId = vid;

    // Validate required fields
    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (!characterId && !avatarImageUrl) {
      return NextResponse.json(
        { error: "Either characterId or avatarImageUrl is required" },
        { status: 400 }
      );
    }

    // Update Convex status if we have a videoCreationId
    if (videoCreationId) {
      await convex.mutation(api.videoCreation.startBatchGeneration, {
        videoCreationId: videoCreationId as Id<"videoCreation">,
      });
    }

    // Step 1: Generate TTS audio
    console.log("Generating TTS audio...");
    const { audioBuffer, duration: audioDuration } = await generateTTSAudio(
      text,
      voiceId
    );
    console.log(`  Audio generated: ${audioBuffer.length} bytes, ~${audioDuration}ms`);

    // Step 2: Upload audio to Hedra
    console.log("Uploading audio to Hedra...");
    const audioFilename = `audio_${Date.now()}.wav`;
    const audioAssetId = await createHedraAsset(audioFilename, "audio");
    await uploadHedraAsset(audioAssetId, audioBuffer, audioFilename);
    console.log(`  Audio asset ID: ${audioAssetId}`);

    // Step 3: Determine avatar/character ID
    let finalCharacterId = characterId;
    if (!finalCharacterId && avatarImageUrl) {
      console.log("Uploading avatar image to Hedra...");
      finalCharacterId = await uploadImageFromUrl(avatarImageUrl);
      console.log(`  Image asset ID: ${finalCharacterId}`);
    }

    // Step 4: Start Hedra generation
    console.log("Starting Hedra video generation...");
    const hedraJobId = await startHedraGeneration(audioAssetId, finalCharacterId!, {
      resolution,
      aspectRatio,
      textPrompt,
    });
    console.log(`  Hedra job ID: ${hedraJobId}`);

    // Update Convex with job info
    if (videoCreationId) {
      await convex.mutation(api.videoCreation.updateBatchGenerationJob, {
        videoCreationId: videoCreationId as Id<"videoCreation">,
        hedraJobId,
        audioAssetId,
        audioDuration,
      });
    }

    // Estimate video duration based on audio
    const estimatedVideoDuration = Math.round(audioDuration / 1000);

    return NextResponse.json({
      success: true,
      jobId: hedraJobId,
      audioAssetId,
      characterId: finalCharacterId,
      audioDuration,
      estimatedVideoDuration,
      videoCreationId,
    });
  } catch (error) {
    console.error("Video generation error:", error);

    // Update Convex with error if we have a videoCreationId
    if (videoCreationId) {
      try {
        await convex.mutation(api.videoCreation.markFailed, {
          videoCreationId: videoCreationId as Id<"videoCreation">,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      } catch (e) {
        console.error("Failed to update Convex error status:", e);
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Video generation failed",
      },
      { status: 500 }
    );
  }
}
