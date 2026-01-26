/**
 * Educational Video Generator - Simple Render API (Render.com)
 *
 * Uses a self-hosted Remotion server on Render.com instead of AWS Lambda.
 * Much simpler setup, no rate limits, more reliable.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SLS_BRAND } from "@/lib/video-generator/brand-config";
import { getSignedDownloadUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lazy-init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

// Render.com server URL (set this in environment variables)
const RENDER_SERVER_URL = process.env.REMOTION_RENDER_SERVER_URL || "http://localhost:3001";

interface RenderRequest {
  videoId: string;
}

export async function POST(request: NextRequest) {
  let videoId: string | undefined;

  try {
    const body: RenderRequest = await request.json();
    videoId = body.videoId;

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    // Get video details from Convex
    const video = await getConvexClient().query(api.educationalVideos.getById, {
      videoId: videoId as Id<"educationalVideos">,
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.avatarOutput?.r2Url) {
      return NextResponse.json(
        { error: "Avatar video not yet completed. Generate avatar video first." },
        { status: 400 }
      );
    }

    if (!video.lessonContent) {
      return NextResponse.json(
        { error: "Lesson content not yet generated." },
        { status: 400 }
      );
    }

    // Determine composition based on template type
    const compositionId =
      video.templateType === "grammar_lesson" ? "GrammarLesson" : "NewsLesson";

    // Use public R2 URL if available (much faster than signed URLs)
    let avatarVideoUrl = video.avatarOutput.r2Url;
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

    if (R2_PUBLIC_URL && video.avatarOutput.r2Key) {
      // Use public URL for faster access (no signing overhead, CDN-backed)
      avatarVideoUrl = `${R2_PUBLIC_URL}/${video.avatarOutput.r2Key}`;
      console.log(`[RenderSimple] Using public R2 URL: ${avatarVideoUrl}`);
    } else if (video.avatarOutput.r2Key) {
      // Fall back to signed URL
      try {
        avatarVideoUrl = await getSignedDownloadUrl(video.avatarOutput.r2Key, 86400);
        console.log(`[RenderSimple] Generated fresh signed URL for avatar video`);
      } catch (err) {
        console.warn(`[RenderSimple] Could not refresh signed URL, using stored URL:`, err);
      }
    }

    // Build Remotion render props based on template type
    const baseProps = {
      avatarVideoUrl,
      avatarVideoDuration: video.avatarOutput.duration,
      level: video.sourceConfig.targetLevel,
      lessonTitle: video.title,
      lessonContent: video.lessonContent,
      lowerThird: {
        name: video.videoSettings.lowerThird?.name || "Emma",
        title: video.videoSettings.lowerThird?.title || "English Teacher",
        show: video.videoSettings.includeLowerThird,
      },
      config: {
        templateType: video.templateType,
        aspectRatio: video.videoSettings.aspectRatio,
        includeIntro: video.videoSettings.includeIntro,
        includeOutro: video.videoSettings.includeOutro,
        includeLowerThird: video.videoSettings.includeLowerThird,
        includeProgressBar: video.videoSettings.includeProgressBar ?? true,
        includeComprehensionQuestions: true,
        includeVocabularyHighlights: video.templateType === "news_broadcast",
      },
      brandConfig: {
        primaryColor: video.videoSettings.brandOverrides?.primaryColor || SLS_BRAND.colors.primary,
        accentColor: video.videoSettings.brandOverrides?.accentColor || SLS_BRAND.colors.accent,
        lightColor: SLS_BRAND.colors.light,
        lightestColor: SLS_BRAND.colors.lightest,
      },
    };

    // Add template-specific props
    let inputProps;
    if (video.templateType === "grammar_lesson") {
      inputProps = {
        ...baseProps,
        lessonSubtitle: video.description || "Master this grammar concept",
      };
    } else {
      inputProps = {
        ...baseProps,
        newsHeadline: video.title,
        sourceCredits: video.sourceConfig.urls || [],
      };
    }

    // Update status to rendering
    await getConvexClient().mutation(api.educationalVideos.updateStatus, {
      videoId: videoId as Id<"educationalVideos">,
      status: "rendering",
    });

    // Check if Render.com server is configured
    if (!process.env.REMOTION_RENDER_SERVER_URL) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: "Remotion Render Server not configured. Please deploy to Render.com first.",
        inputProps,
        setupSteps: [
          "1. Push my-video folder to a Git repository",
          "2. Create a new Web Service on Render.com",
          "3. Connect to your repository and select the my-video folder",
          "4. Choose 'Docker' as the environment",
          "5. Select at least 'Standard' plan (2GB RAM)",
          "6. Add REMOTION_RENDER_SERVER_URL to Vercel env vars",
        ],
      });
    }

    // Start render on Render.com server
    console.log(`[RenderSimple] Starting render on ${RENDER_SERVER_URL}...`);

    const renderResponse = await fetch(`${RENDER_SERVER_URL}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        compositionId,
        inputProps,
        codec: "h264",
        outputFormat: "mp4",
      }),
    });

    if (!renderResponse.ok) {
      const error = await renderResponse.text();
      throw new Error(`Render server error: ${renderResponse.status} - ${error}`);
    }

    const renderResult = await renderResponse.json();
    console.log(`[RenderSimple] Render started: ${renderResult.jobId}`);

    // Store the job ID in Convex
    await getConvexClient().mutation(api.educationalVideos.storeRenderJobId, {
      videoId: videoId as Id<"educationalVideos">,
      renderJobId: renderResult.jobId,
      renderServer: "render.com",
    });

    return NextResponse.json({
      success: true,
      jobId: renderResult.jobId,
      videoId,
      compositionId,
      message: "Render started. Poll /api/video-generator/render-simple/[jobId] for progress.",
    });
  } catch (error) {
    console.error("[RenderSimple] Error:", error);

    // Update status to failed
    if (videoId) {
      try {
        await getConvexClient().mutation(api.educationalVideos.updateStatus, {
          videoId: videoId as Id<"educationalVideos">,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Render failed",
          errorStep: "rendering",
        });
      } catch {
        // Ignore errors in error handling
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Render failed" },
      { status: 500 }
    );
  }
}
