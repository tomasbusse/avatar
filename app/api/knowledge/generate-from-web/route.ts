import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  runMultiAgentJob,
  OrchestratorConfig,
  GenerationScale,
  SCALE_PRESETS,
} from "@/lib/knowledge/agents";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();

export interface GenerateRequest {
  topic: string;
  mode: "simple" | "advanced";
  subtopics?: string[];
  scale?: GenerationScale;
  depth?: 1 | 2 | 3;
  maxSourcesPerSubtopic?: number;
  includeExercises?: boolean;
  targetLevel?: string;
  language?: string;
  tags?: string[];
  referenceUrls?: string[];
  broadSearch?: boolean;
}

export interface GenerateResponse {
  success: boolean;
  jobId: string;
  knowledgeBaseId: string;
  estimatedMinutes: number;
  message?: string;
  error?: string;
}

/**
 * POST /api/knowledge/generate-from-web
 *
 * Starts a web scraping job to generate a knowledge base from online content.
 * Returns immediately with jobId for progress tracking.
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    const body: GenerateRequest = await request.json();

    // Validate required fields
    if (!body.topic || body.topic.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Topic is required (min 3 characters)", jobId: "", knowledgeBaseId: "", estimatedMinutes: 0 },
        { status: 400 }
      );
    }

    const mode = body.mode || "simple";
    if (mode === "advanced" && (!body.subtopics || body.subtopics.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Advanced mode requires at least one subtopic", jobId: "", knowledgeBaseId: "", estimatedMinutes: 0 },
        { status: 400 }
      );
    }

    // Get scale preset if specified
    const scalePreset = body.scale ? SCALE_PRESETS[body.scale] : null;

    // Configuration with defaults (now uses multi-agent orchestrator)
    const config: OrchestratorConfig = {
      scale: body.scale,
      depth: body.depth || (body.scale === "quick" ? 1 : body.scale === "standard" ? 2 : 3),
      maxSourcesPerSubtopic: scalePreset?.sources || body.maxSourcesPerSubtopic || 5,
      includeExercises: body.includeExercises ?? true,
      targetLevel: body.targetLevel,
      language: body.language || "multi",
      tags: body.tags,
      referenceUrls: body.referenceUrls,
      broadSearch: body.broadSearch ?? (body.scale === "comprehensive" || body.scale === "book"),
    };

    const convex = getConvex();

    // Step 1: Create knowledge base
    const kbResult = await convex.mutation(api.knowledgeBases.create, {
      name: body.topic,
      description: `Auto-generated knowledge base for: ${body.topic}`,
      domain: {
        primaryTopic: body.topic,
        language: config.language as "en" | "de" | "multi",
      },
    });

    const knowledgeBaseId = kbResult.id as Id<"knowledgeBases">;

    // Step 2: Create scraping job
    const jobResult = await convex.mutation(api.scrapingJobs.create, {
      topic: body.topic,
      mode,
      knowledgeBaseId,
      subtopics: body.subtopics,
      config,
    });

    const jobId = jobResult.jobId as Id<"scrapingJobs">;

    // Step 3: Start the multi-agent job in the background
    // We don't await this - it runs async with 3 specialized agents
    runMultiAgentJob(
      convex,
      jobId,
      knowledgeBaseId,
      body.topic,
      config,
      body.subtopics
    ).catch((error) => {
      console.error("Background multi-agent job failed:", error);
      // Error handling is done in the orchestrator
    });

    // Estimate time based on scale or config
    const estimatedSubtopics = mode === "advanced"
      ? body.subtopics!.length
      : scalePreset?.subtopics || config.depth * 5;
    const minutesPerSubtopic = (body.scale === "book" || body.scale === "comprehensive") ? 3 : 2;
    const estimatedMinutes = Math.ceil(estimatedSubtopics * minutesPerSubtopic);

    return NextResponse.json({
      success: true,
      jobId: jobId.toString(),
      knowledgeBaseId: knowledgeBaseId.toString(),
      estimatedMinutes,
      message: `Started generating knowledge base. Estimated time: ${estimatedMinutes} minutes.`,
    });
  } catch (error) {
    console.error("Generate from web error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start generation",
        jobId: "",
        knowledgeBaseId: "",
        estimatedMinutes: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/knowledge/generate-from-web?jobId=xxx
 *
 * Get the current status of a scraping job.
 */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const convex = getConvex();
    const progress = await convex.query(api.scrapingJobs.getProgress, {
      id: jobId as Id<"scrapingJobs">,
    });

    if (!progress) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Get job status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge/generate-from-web?jobId=xxx
 *
 * Cancel a running scraping job.
 */
export async function DELETE(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const convex = getConvex();
    await convex.mutation(api.scrapingJobs.cancel, {
      id: jobId as Id<"scrapingJobs">,
    });

    return NextResponse.json({ success: true, message: "Job cancelled" });
  } catch (error) {
    console.error("Cancel job error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel job" },
      { status: 500 }
    );
  }
}
