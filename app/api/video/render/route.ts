/**
 * Video Render API - Remotion Composition
 *
 * Takes a completed avatar video and renders it with
 * Remotion overlays (intro, outro, slides, lower third, ticker)
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const runtime = "nodejs";

// Lazy-init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

interface RenderRequest {
  videoCreationId: string;
  // Optional overrides
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
        { error: "Avatar video not yet completed" },
        { status: 400 }
      );
    }

    // Build Remotion render props
    const renderProps = {
      avatarVideoUrl: video.finalOutput.r2Url,
      avatarVideoDuration: (video.finalOutput.duration || 30000) / 1000, // Convert ms to seconds
      slides: body.slides || [], // TODO: Generate slides from script content
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
        tickerText: video.scriptContent?.substring(0, 200) || "", // Use first part of script as ticker
      },
      brandName: "SLS NEWS",
      primaryColor: "#1e40af",
      secondaryColor: "#3b82f6",
    };

    // For now, return the render props that would be sent to Remotion Lambda
    // TODO: Integrate with Remotion Lambda for actual rendering
    return NextResponse.json({
      success: true,
      message:
        "Remotion render props prepared. Integration with Remotion Lambda coming soon.",
      videoCreationId,
      avatarVideoUrl: video.finalOutput.r2Url,
      renderProps,
      nextSteps: [
        "1. Set up Remotion Lambda (npm install @remotion/lambda)",
        "2. Deploy Remotion bundle to AWS",
        "3. Call renderMediaOnLambda with these props",
        "4. Poll for completion and save final video to R2",
      ],
    });
  } catch (error) {
    console.error("Render API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Render failed" },
      { status: 500 }
    );
  }
}
