/**
 * Educational Video Generator - Remotion Lambda Render API
 *
 * Takes a completed avatar video and renders it with
 * Remotion overlays (intro, outro, slides, lower third, progress bar)
 * using the educational video compositions.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SLS_BRAND } from "@/lib/video-generator/brand-config";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for long renders

// Lazy-init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

// Check if Remotion Lambda is configured
function isRemotionConfigured(): boolean {
  return !!(
    process.env.REMOTION_AWS_ACCESS_KEY_ID &&
    process.env.REMOTION_AWS_SECRET_ACCESS_KEY &&
    process.env.REMOTION_SERVE_URL &&
    process.env.REMOTION_FUNCTION_NAME
  );
}

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
    const composition =
      video.templateType === "grammar_lesson" ? "GrammarLesson" : "NewsLesson";

    // Build Remotion render props based on template type
    const baseProps = {
      avatarVideoUrl: video.avatarOutput.r2Url,
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
    let renderProps;
    if (video.templateType === "grammar_lesson") {
      renderProps = {
        ...baseProps,
        lessonSubtitle: video.description || "Master this grammar concept",
      };
    } else {
      // news_broadcast or other types
      renderProps = {
        ...baseProps,
        newsHeadline: video.title,
        sourceCredits: video.sourceConfig.urls || [],
      };
    }

    // Check if Remotion Lambda is configured
    if (!isRemotionConfigured()) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: "Remotion Lambda not configured. Please set up AWS credentials.",
        renderProps,
        setupSteps: [
          "1. Add REMOTION_AWS_ACCESS_KEY_ID to .env.local",
          "2. Add REMOTION_AWS_SECRET_ACCESS_KEY to .env.local",
          "3. Add REMOTION_SERVE_URL to .env.local",
          "4. Add REMOTION_FUNCTION_NAME to .env.local",
        ],
        documentation: "https://www.remotion.dev/docs/lambda/setup",
      });
    }

    // Update status to rendering
    await getConvexClient().mutation(api.educationalVideos.updateStatus, {
      videoId: videoId as Id<"educationalVideos">,
      status: "rendering",
    });

    // Set AWS credentials for Remotion Lambda
    process.env.AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;

    // Trigger Remotion Lambda render
    const { renderMediaOnLambda } = await import("@remotion/lambda/client");

    const region = (process.env.REMOTION_AWS_REGION || "eu-central-1") as "eu-central-1";

    // Retry logic for rate limit errors
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry with exponential backoff
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        const { renderId, bucketName } = await renderMediaOnLambda({
          region,
          functionName: process.env.REMOTION_FUNCTION_NAME?.replace('240sec', '900sec') || 'remotion-render-4-0-409-mem2048mb-disk2048mb-900sec',
          serveUrl: process.env.REMOTION_SERVE_URL!,
          composition,
          inputProps: renderProps,
          codec: "h264",
          downloadBehavior: {
            type: "download",
            fileName: `educational-video-${videoId}.mp4`,
          },
          maxRetries: 3,
          framesPerLambda: 240, // More frames per lambda = fewer concurrent lambdas
          rendererFunctionName: null, // Use same function for rendering
          concurrencyPerLambda: 1, // Limit concurrency to avoid rate limits
        });

        return NextResponse.json({
          success: true,
          renderId,
          bucketName,
          videoId,
          composition,
          message: "Render started. Poll /api/video-generator/render/[renderId] for progress.",
          attempt: attempt + 1,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMsg = lastError.message.toLowerCase();

        // Only retry on rate limit errors
        if (
          !errorMsg.includes("rate") &&
          !errorMsg.includes("throttl") &&
          !errorMsg.includes("limit")
        ) {
          throw lastError;
        }

        console.log(`Rate limit hit, attempt ${attempt + 1}/${maxRetries}, retrying...`);
      }
    }

    // All retries exhausted
    throw lastError || new Error("Rate limit exceeded after retries");
  } catch (error) {
    console.error("Render API error:", error);

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
