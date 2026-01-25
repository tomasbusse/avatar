/**
 * Render Status API - Poll Remotion Lambda render progress
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { uploadFromUrl, generateVideoKey, getSignedDownloadUrl } from "@/lib/r2";

export const runtime = "nodejs";

// Lazy-init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ renderId: string }> }
) {
  try {
    const { renderId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const videoCreationId = searchParams.get("videoCreationId");
    const bucketName = searchParams.get("bucketName");

    if (!renderId) {
      return NextResponse.json(
        { error: "Render ID is required" },
        { status: 400 }
      );
    }

    // Set AWS credentials for Remotion Lambda
    process.env.AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;

    // Import Remotion Lambda client
    const { getRenderProgress } = await import("@remotion/lambda/client");

    const region = (process.env.REMOTION_AWS_REGION || "eu-central-1") as "eu-central-1";

    // Get render progress
    const progress = await getRenderProgress({
      renderId,
      bucketName: bucketName || process.env.REMOTION_BUCKET_NAME!,
      region,
      functionName: process.env.REMOTION_FUNCTION_NAME!,
    });

    // Handle different states
    if (progress.fatalErrorEncountered) {
      // Render failed
      if (videoCreationId) {
        await getConvexClient().mutation(api.videoCreation.markFailed, {
          videoCreationId: videoCreationId as Id<"videoCreation">,
          errorMessage: progress.errors?.[0]?.message || "Render failed",
        });
      }

      return NextResponse.json({
        status: "failed",
        progress: 0,
        error: progress.errors?.[0]?.message || "Render failed",
      });
    }

    if (progress.done) {
      // Render complete - get output URL and upload to R2
      const outputUrl = progress.outputFile;

      if (!outputUrl) {
        return NextResponse.json({
          status: "failed",
          error: "No output file generated",
        });
      }

      // If we have a videoCreationId, upload to R2 and update Convex
      if (videoCreationId) {
        try {
          // Generate R2 key for final rendered video
          const r2Key = generateVideoKey(videoCreationId, "rendered", "mp4");

          // Upload from Lambda output to R2
          const result = await uploadFromUrl(r2Key, outputUrl, {
            contentType: "video/mp4",
            metadata: {
              videoCreationId,
              source: "remotion-lambda",
              renderId,
            },
          });

          // Get signed URL
          const r2Url = await getSignedDownloadUrl(r2Key, 86400 * 7); // 7 days

          // Update Convex with final rendered video
          await getConvexClient().mutation(api.videoCreation.completeRemotionRender, {
            videoCreationId: videoCreationId as Id<"videoCreation">,
            renderedOutput: {
              r2Key,
              r2Url: result.publicUrl || r2Url,
              duration: progress.outputSizeInBytes
                ? Math.round((progress.outputSizeInBytes / 500000) * 1000)
                : 0,
              fileSize: progress.outputSizeInBytes || 0,
              renderedAt: Date.now(),
            },
          });

          return NextResponse.json({
            status: "complete",
            progress: 100,
            videoUrl: result.publicUrl || r2Url,
            r2Key,
            fileSize: progress.outputSizeInBytes,
            renderTimeMs: progress.timeToFinish,
          });
        } catch (uploadError) {
          console.error("R2 upload error:", uploadError);
          return NextResponse.json({
            status: "complete",
            progress: 100,
            videoUrl: outputUrl, // Return Lambda URL as fallback
            warning: "Failed to upload to R2, using temporary URL",
          });
        }
      }

      return NextResponse.json({
        status: "complete",
        progress: 100,
        videoUrl: outputUrl,
        renderTimeMs: progress.timeToFinish,
      });
    }

    // Still rendering - return progress
    const overallProgress = progress.overallProgress * 100;

    return NextResponse.json({
      status: "rendering",
      progress: Math.round(overallProgress),
      framesRendered: progress.framesRendered,
      chunks: progress.chunks,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Status check failed";
    console.error("Render status error:", errorMessage);

    // Check if it's a rate limit error - return 429 instead of 500
    const isRateLimit = errorMessage.toLowerCase().includes("rate") ||
                        errorMessage.toLowerCase().includes("throttl");

    // Check if render not found - might be expired or never existed
    const isNotFound = errorMessage.toLowerCase().includes("not found") ||
                       errorMessage.toLowerCase().includes("does not exist");

    if (isRateLimit) {
      return NextResponse.json(
        {
          status: "rate_limited",
          error: "Rate limit exceeded. Please wait and try again.",
          retryAfter: 5,
        },
        { status: 429 }
      );
    }

    if (isNotFound) {
      return NextResponse.json(
        {
          status: "not_found",
          error: "Render not found. It may have expired or failed to start.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
