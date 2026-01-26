/**
 * Educational Video Generator - Avatar Status Polling API
 *
 * Polls Hedra for generation status. When complete, downloads video
 * and uploads to R2, then updates Convex.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { uploadFile, getSignedDownloadUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute max

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
  console.log(`[AvatarStatus] Hedra response:`, JSON.stringify(data));

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
 * Download video from URL and upload to R2
 */
async function downloadAndUploadToR2(
  videoUrl: string,
  videoId: string
): Promise<{ r2Key: string; r2Url: string; duration: number }> {
  console.log(`[AvatarStatus] Downloading video from: ${videoUrl}`);

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download avatar video: ${response.status}`);
  }

  const videoBuffer = Buffer.from(await response.arrayBuffer());
  console.log(`[AvatarStatus] Downloaded ${videoBuffer.length} bytes`);

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

  console.log(`[AvatarStatus] Uploaded to R2: ${r2Key}`);

  return { r2Key, r2Url, duration: estimatedDuration };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");
    const hedraJobId = searchParams.get("hedraJobId");

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    // Get video from Convex to find hedraJobId if not provided
    const video = await getConvexClient().query(api.educationalVideos.getById, {
      videoId: videoId as Id<"educationalVideos">,
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const jobId = hedraJobId || video.pendingHedraJobId;

    if (!jobId) {
      return NextResponse.json(
        { error: "No pending Hedra job found" },
        { status: 400 }
      );
    }

    // Poll Hedra status
    const result = await pollHedraStatus(jobId);

    if (result.status === "completed" && result.videoUrl) {
      // Download and upload to R2
      console.log(`[AvatarStatus] Generation complete, uploading to R2...`);
      const { r2Key, r2Url, duration } = await downloadAndUploadToR2(result.videoUrl, videoId);

      // Store avatar output in Convex
      await getConvexClient().mutation(api.educationalVideos.storeAvatarOutput, {
        videoId: videoId as Id<"educationalVideos">,
        avatarOutput: {
          r2Key,
          r2Url,
          duration,
          hedraJobId: jobId,
        },
      });

      return NextResponse.json({
        status: "completed",
        avatarOutput: {
          r2Key,
          r2Url,
          duration,
          hedraJobId: jobId,
        },
      });
    }

    if (result.status === "failed") {
      // Update video status to failed
      await getConvexClient().mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: result.error || "Hedra generation failed",
        errorStep: "avatar_generation",
      });

      return NextResponse.json({
        status: "failed",
        error: result.error,
      });
    }

    // Still processing
    return NextResponse.json({
      status: result.status,
      hedraJobId: jobId,
      message: "Avatar generation in progress",
    });
  } catch (error) {
    console.error("[AvatarStatus] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to check avatar status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
