/**
 * Video Generation Status API
 *
 * Polls Hedra job status and handles:
 * - Progress updates
 * - Video completion with R2 upload
 * - Error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { uploadFromUrl, generateVideoKey, getSignedDownloadUrl } from "@/lib/r2";

// Convex client for mutations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Hedra API
const HEDRA_API_BASE = "https://api.hedra.com/web-app/public";

interface HedraStatus {
  status: "pending" | "processing" | "complete" | "error";
  progress?: number;
  url?: string;
  video_url?: string;
  error?: string;
}

/**
 * Check Hedra generation status
 */
async function checkHedraStatus(jobId: string): Promise<HedraStatus> {
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

  return response.json();
}

/**
 * Download video from Hedra and upload to R2
 */
async function uploadVideoToR2(
  hedraVideoUrl: string,
  videoCreationId: string
): Promise<{
  r2Key: string;
  r2Url: string;
  fileSize: number;
}> {
  // Generate a unique key for the video
  const r2Key = generateVideoKey(videoCreationId, "final", "mp4");

  // Upload from Hedra URL to R2
  const result = await uploadFromUrl(r2Key, hedraVideoUrl, {
    contentType: "video/mp4",
    metadata: {
      videoCreationId,
      source: "hedra-batch",
    },
  });

  // Get a long-lived signed URL (24 hours)
  const r2Url = await getSignedDownloadUrl(r2Key, 86400);

  return {
    r2Key,
    r2Url: result.publicUrl || r2Url,
    fileSize: result.size,
  };
}

/**
 * Estimate video duration from file size (rough approximation)
 * ~500KB per second for 720p video
 */
function estimateDuration(fileSize: number): number {
  return Math.round((fileSize / 500000) * 1000); // Return in ms
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const videoCreationId = searchParams.get("videoCreationId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Check Hedra status
    const hedraStatus = await checkHedraStatus(jobId);
    const videoUrl = hedraStatus.url || hedraStatus.video_url;

    // Map progress (Hedra uses 0-100, we normalize)
    let progress = hedraStatus.progress || 0;
    if (hedraStatus.status === "pending") progress = 5;
    else if (hedraStatus.status === "processing") progress = Math.max(10, progress);
    else if (hedraStatus.status === "complete") progress = 90; // Not 100 until R2 upload

    // Update Convex with progress if we have a videoCreationId
    if (videoCreationId && hedraStatus.status === "processing") {
      try {
        await convex.mutation(api.videoCreation.updateBatchGenerationProgress, {
          videoCreationId: videoCreationId as Id<"videoCreation">,
          progress,
        });
      } catch (e) {
        console.warn("Failed to update progress:", e);
      }
    }

    // Handle error status
    if (hedraStatus.status === "error") {
      const errorMessage = hedraStatus.error || "Hedra generation failed";

      if (videoCreationId) {
        await convex.mutation(api.videoCreation.markFailed, {
          videoCreationId: videoCreationId as Id<"videoCreation">,
          errorMessage,
        });
      }

      return NextResponse.json({
        status: "failed",
        progress: 0,
        error: errorMessage,
      });
    }

    // Handle pending/processing
    if (hedraStatus.status !== "complete" || !videoUrl) {
      return NextResponse.json({
        status: hedraStatus.status,
        progress,
        videoUrl: null,
      });
    }

    // Video is complete! Upload to R2 if we have a videoCreationId
    if (videoCreationId) {
      try {
        // Update progress to show uploading
        await convex.mutation(api.videoCreation.updateBatchGenerationProgress, {
          videoCreationId: videoCreationId as Id<"videoCreation">,
          progress: 90,
          hedraVideoUrl: videoUrl,
        });

        // Upload to R2
        console.log("Uploading video to R2...");
        const { r2Key, r2Url, fileSize } = await uploadVideoToR2(videoUrl, videoCreationId);
        console.log(`  Uploaded: ${r2Key} (${fileSize} bytes)`);

        // Complete the batch generation in Convex
        const duration = estimateDuration(fileSize);
        await convex.mutation(api.videoCreation.completeBatchGeneration, {
          videoCreationId: videoCreationId as Id<"videoCreation">,
          finalOutput: {
            r2Key,
            r2Url,
            duration,
            fileSize,
            renderedAt: Date.now(),
          },
        });

        return NextResponse.json({
          status: "complete",
          progress: 100,
          videoUrl: r2Url,
          r2Key,
          fileSize,
          duration,
        });
      } catch (uploadError) {
        console.error("R2 upload error:", uploadError);

        // Mark as failed but include the Hedra URL for manual recovery
        await convex.mutation(api.videoCreation.markFailed, {
          videoCreationId: videoCreationId as Id<"videoCreation">,
          errorMessage: `R2 upload failed: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}. Hedra URL: ${videoUrl}`,
        });

        return NextResponse.json({
          status: "failed",
          progress: 90,
          error: "Failed to upload to storage",
          hedraVideoUrl: videoUrl, // Include Hedra URL for manual download
        });
      }
    }

    // No videoCreationId - just return the Hedra URL
    return NextResponse.json({
      status: "complete",
      progress: 100,
      videoUrl,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Status check failed",
      },
      { status: 500 }
    );
  }
}
