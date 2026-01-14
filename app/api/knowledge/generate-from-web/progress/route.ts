import { NextRequest } from "next/server";
import { getConvexClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * GET /api/knowledge/generate-from-web/progress?jobId=xxx
 *
 * Server-Sent Events endpoint for real-time progress updates.
 * Polls the job status every 2 seconds and sends updates to the client.
 */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!jobId) {
    return new Response("jobId is required", { status: 400 });
  }

  const convex = getConvexClient();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: object) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      let lastStatus = "";
      let lastPercentage = -1;
      let pollCount = 0;
      const maxPolls = 300; // 10 minutes max (300 * 2 seconds)

      const poll = async () => {
        try {
          pollCount++;

          const progress = await convex.query(api.scrapingJobs.getProgress, {
            id: jobId as Id<"scrapingJobs">,
          });

          if (!progress) {
            sendEvent({
              type: "error",
              message: "Job not found",
            });
            controller.close();
            return;
          }

          // Send update if status or percentage changed
          if (progress.status !== lastStatus || progress.percentage !== lastPercentage) {
            lastStatus = progress.status;
            lastPercentage = progress.percentage;

            // Determine current phase
            let phase = "Initializing";
            let currentSubtopic = "";

            if (progress.status === "discovering") {
              phase = "Discovering subtopics";
            } else if (progress.status === "scraping") {
              phase = "Scraping web content";
              const scraping = progress.subtopics.find((s: { status: string }) => s.status === "scraping");
              currentSubtopic = scraping?.name || "";
            } else if (progress.status === "synthesizing") {
              phase = "Synthesizing content";
              const synth = progress.subtopics.find((s: { status: string }) => s.status === "synthesizing");
              currentSubtopic = synth?.name || "";
            } else if (progress.status === "optimizing") {
              phase = "Optimizing for avatar retrieval";
              const opt = progress.subtopics.find((s: { status: string }) => s.status === "optimizing");
              currentSubtopic = opt?.name || "";
            } else if (progress.status === "completed") {
              phase = "Complete";
            } else if (progress.status === "failed") {
              phase = "Failed";
            } else if (progress.status === "cancelled") {
              phase = "Cancelled";
            }

            sendEvent({
              type: progress.status === "completed" ? "complete" :
                    progress.status === "failed" ? "error" :
                    progress.status === "cancelled" ? "cancelled" : "progress",
              phase,
              status: progress.status,
              currentSubtopic,
              progress: {
                current: progress.completedSubtopics,
                total: progress.totalSubtopics,
                percentage: progress.percentage,
              },
              subtopics: progress.subtopics,
              stats: {
                totalSources: progress.progress.totalSources,
                totalWords: progress.progress.totalWords,
              },
              errorMessage: progress.errorMessage,
            });
          }

          // Check if job is complete
          if (
            progress.status === "completed" ||
            progress.status === "failed" ||
            progress.status === "cancelled"
          ) {
            controller.close();
            return;
          }

          // Check max polls
          if (pollCount >= maxPolls) {
            sendEvent({
              type: "error",
              message: "Polling timeout - job taking too long",
            });
            controller.close();
            return;
          }

          // Schedule next poll
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await poll();
        } catch (error) {
          console.error("SSE poll error:", error);
          sendEvent({
            type: "error",
            message: error instanceof Error ? error.message : "Polling error",
          });
          controller.close();
        }
      };

      // Start polling
      await poll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
