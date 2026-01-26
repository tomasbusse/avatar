/**
 * Educational Video Generator - Simple Render Status API (Render.com)
 *
 * Polls the Render.com Remotion server for render progress.
 * When complete, downloads the video and uploads to R2.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { uploadFromUrl, getSignedDownloadUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Lazy-init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

// Render.com server URL
const RENDER_SERVER_URL = process.env.REMOTION_RENDER_SERVER_URL || "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Check render status on Render.com server
    const statusResponse = await fetch(`${RENDER_SERVER_URL}/render/${jobId}`);

    if (!statusResponse.ok) {
      if (statusResponse.status === 404) {
        return NextResponse.json(
          { status: "not_found", error: "Render job not found" },
          { status: 404 }
        );
      }
      const error = await statusResponse.text();
      throw new Error(`Status check failed: ${statusResponse.status} - ${error}`);
    }

    const status = await statusResponse.json();

    // If complete, download and upload to R2
    if (status.status === "complete" && videoId) {
      console.log(`[RenderSimple] Render complete, uploading to R2...`);

      try {
        // Download the video from Render.com server
        const downloadUrl = `${RENDER_SERVER_URL}/download/${jobId}`;

        // Generate R2 key
        const timestamp = Date.now();
        const r2Key = `educational-videos/${videoId}/final-${timestamp}.mp4`;

        // Upload from Render.com to R2
        const result = await uploadFromUrl(r2Key, downloadUrl, {
          contentType: "video/mp4",
          metadata: {
            videoId,
            source: "render.com",
            jobId,
          },
        });

        // Get signed URL (valid for 7 days)
        const r2Url = await getSignedDownloadUrl(r2Key, 86400 * 7);

        // Update Convex with final rendered video
        await getConvexClient().mutation(api.educationalVideos.storeFinalOutput, {
          videoId: videoId as Id<"educationalVideos">,
          finalOutput: {
            r2Key,
            r2Url: result.publicUrl || r2Url,
            duration: Math.round((status.durationInFrames || 0) / (status.fps || 30)),
            fileSize: status.fileSize || 0,
            renderedAt: Date.now(),
          },
        });

        console.log(`[RenderSimple] Upload complete: ${r2Key}`);

        return NextResponse.json({
          status: "complete",
          progress: 100,
          videoUrl: result.publicUrl || r2Url,
          r2Key,
          fileSize: status.fileSize,
          renderTimeMs: status.renderTimeMs,
        });
      } catch (uploadError) {
        console.error("[RenderSimple] R2 upload error:", uploadError);
        // Return the Render.com download URL as fallback
        return NextResponse.json({
          status: "complete",
          progress: 100,
          videoUrl: `${RENDER_SERVER_URL}/download/${jobId}`,
          warning: "Failed to upload to R2, using temporary URL",
          renderTimeMs: status.renderTimeMs,
        });
      }
    }

    // If failed, update Convex
    if (status.status === "failed" && videoId) {
      await getConvexClient().mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: status.error || "Render failed",
        errorStep: "rendering",
      });

      return NextResponse.json({
        status: "failed",
        error: status.error,
      });
    }

    // Still rendering - return progress
    return NextResponse.json({
      status: status.status,
      progress: status.progress || 0,
      framesRendered: status.framesRendered,
      durationInFrames: status.durationInFrames,
      fps: status.fps,
    });
  } catch (error) {
    console.error("[RenderSimple] Status check error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Status check failed",
      },
      { status: 500 }
    );
  }
}
