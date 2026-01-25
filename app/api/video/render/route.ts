/**
 * Video Render API - Remotion Lambda Integration
 *
 * Takes a completed avatar video and renders it with
 * Remotion overlays (intro, outro, slides, lower third, ticker)
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
  videoCreationId: string;
  slides?: Array<{
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    startTime: number;
    duration: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: RenderRequest = await request.json();
    const { videoCreationId } = body;

    if (!videoCreationId) {
      return NextResponse.json(
        { error: "videoCreationId is required" },
        { status: 400 }
      );
    }

    // Get video details from Convex
    const video = await getConvexClient().query(api.videoCreation.getById, {
      videoCreationId: videoCreationId as Id<"videoCreation">,
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.finalOutput?.r2Url) {
      return NextResponse.json(
        { error: "Avatar video not yet completed. Generate avatar video first." },
        { status: 400 }
      );
    }

    // Build Remotion render props
    const renderProps = {
      avatarVideoUrl: video.finalOutput.r2Url,
      avatarVideoDuration: (video.finalOutput.duration || 30000) / 1000,
      slides: body.slides || generateSlidesFromScript(video.scriptContent || ""),
      lowerThird: {
        name: video.avatar?.name || "Presenter",
        title: video.avatar?.persona?.role || "Host",
        show: video.videoConfig.includeLowerThird,
      },
      config: {
        style: video.videoConfig.style,
        aspectRatio: video.videoConfig.aspectRatio,
        includeIntro: video.videoConfig.includeIntro,
        includeOutro: video.videoConfig.includeOutro,
        includeLowerThird: video.videoConfig.includeLowerThird,
        includeTicker: video.videoConfig.includeTicker,
        tickerText: extractTickerText(video.scriptContent || ""),
      },
      brandName: "SLS NEWS",
      primaryColor: "#1e40af",
      secondaryColor: "#3b82f6",
    };

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

    // Set AWS credentials for Remotion Lambda
    process.env.AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;

    // Trigger Remotion Lambda render with retry logic for rate limits
    const { renderMediaOnLambda } = await import("@remotion/lambda/client");

    const region = (process.env.REMOTION_AWS_REGION || "eu-central-1") as "eu-central-1";

    // Retry logic for rate limit errors
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry with exponential backoff: 2s, 4s, 8s
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        const { renderId, bucketName } = await renderMediaOnLambda({
          region,
          functionName: process.env.REMOTION_FUNCTION_NAME!,
          serveUrl: process.env.REMOTION_SERVE_URL!,
          composition: "NewsBroadcast",
          inputProps: renderProps,
          codec: "h264",
          downloadBehavior: {
            type: "download",
            fileName: `video-${videoCreationId}.mp4`,
          },
          // Use fewer concurrent lambdas to avoid rate limits on new AWS accounts
          maxRetries: 3,
          framesPerLambda: 120, // Fewer chunks = fewer concurrent lambdas
        });

        return NextResponse.json({
          success: true,
          renderId,
          bucketName,
          videoCreationId,
          message: "Render started. Poll /api/video/render/[renderId] for progress.",
          attempt: attempt + 1,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMsg = lastError.message.toLowerCase();

        // Only retry on rate limit errors
        if (!errorMsg.includes("rate") && !errorMsg.includes("throttl") && !errorMsg.includes("limit")) {
          throw lastError;
        }

        console.log(`Rate limit hit, attempt ${attempt + 1}/${maxRetries}, retrying...`);
      }
    }

    // All retries exhausted
    throw lastError || new Error("Rate limit exceeded after retries");
  } catch (error) {
    console.error("Render API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Render failed" },
      { status: 500 }
    );
  }
}

/**
 * Generate slides from script content
 * Simple heuristic: split by paragraphs, create slides for key points
 */
function generateSlidesFromScript(script: string): Array<{
  id: string;
  title: string;
  content: string;
  startTime: number;
  duration: number;
}> {
  const paragraphs = script.split(/\n\n+/).filter((p) => p.trim().length > 50);

  if (paragraphs.length === 0) return [];

  // Estimate reading speed: ~150 words per minute
  const wordsPerSecond = 150 / 60;
  let currentTime = 5; // Start slides after intro

  return paragraphs.slice(0, 5).map((paragraph, index) => {
    const words = paragraph.split(/\s+/).length;
    const duration = Math.max(5, Math.min(15, words / wordsPerSecond));
    const slide = {
      id: `slide-${index + 1}`,
      title: extractTitle(paragraph),
      content: paragraph.substring(0, 200) + (paragraph.length > 200 ? "..." : ""),
      startTime: currentTime,
      duration,
    };
    currentTime += duration + 2; // Gap between slides
    return slide;
  });
}

/**
 * Extract a title from paragraph text
 */
function extractTitle(text: string): string {
  // Try to find a sentence that looks like a title
  const firstSentence = text.split(/[.!?]/)[0].trim();
  if (firstSentence.length < 60) {
    return firstSentence;
  }
  // Otherwise, extract key words
  const words = firstSentence.split(/\s+/).slice(0, 6).join(" ");
  return words + "...";
}

/**
 * Extract ticker text from script
 */
function extractTickerText(script: string): string {
  // Get first few sentences for the ticker
  const sentences = script.split(/[.!?]/).filter((s) => s.trim().length > 20);
  return sentences
    .slice(0, 3)
    .map((s) => s.trim())
    .join(" • ");
}
