/**
 * Remotion Render Server
 *
 * A simple Express server that handles video render requests.
 * Deploy this to Render.com as a background worker or web service.
 */

const express = require("express");
const cors = require("cors");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3001;
const OUTPUT_DIR = process.env.OUTPUT_DIR || "/tmp/renders";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Store render jobs in memory (in production, use Redis or a database)
const renderJobs = new Map();

// Bundle the Remotion project once on startup
let bundled = null;
let bundlePromise = null;

async function getBundled() {
  if (bundled) return bundled;
  if (bundlePromise) return bundlePromise;

  console.log("[Server] Bundling Remotion project...");
  bundlePromise = bundle({
    entryPoint: path.resolve(__dirname, "src/index.ts"),
    // Enable if you have a webpack override
    // webpackOverride: (config) => config,
  });

  bundled = await bundlePromise;
  console.log("[Server] Bundle complete:", bundled);
  return bundled;
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", jobs: renderJobs.size });
});

// Start a render job
app.post("/render", async (req, res) => {
  try {
    const {
      compositionId,
      inputProps,
      codec = "h264",
      outputFormat = "mp4",
    } = req.body;

    if (!compositionId) {
      return res.status(400).json({ error: "compositionId is required" });
    }

    // Generate a unique job ID
    const jobId = crypto.randomUUID();
    const outputPath = path.join(OUTPUT_DIR, `${jobId}.${outputFormat === "mp4" ? "mp4" : outputFormat}`);

    // Initialize job status
    renderJobs.set(jobId, {
      status: "queued",
      progress: 0,
      compositionId,
      createdAt: Date.now(),
      outputPath,
    });

    res.json({
      jobId,
      status: "queued",
      message: "Render job queued. Poll /render/:jobId for status.",
    });

    // Start rendering in the background
    processRender(jobId, compositionId, inputProps, codec, outputPath);
  } catch (error) {
    console.error("[Server] Error starting render:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get render job status
app.get("/render/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = renderJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({
    jobId,
    ...job,
    // Don't expose the full file path
    outputPath: job.status === "complete" ? `/download/${jobId}` : undefined,
  });
});

// Download completed render
app.get("/download/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = renderJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (job.status !== "complete") {
    return res.status(400).json({ error: "Render not complete" });
  }

  if (!fs.existsSync(job.outputPath)) {
    return res.status(404).json({ error: "Output file not found" });
  }

  res.download(job.outputPath, `video-${jobId}.mp4`);
});

// Process render in background
async function processRender(jobId, compositionId, inputProps, codec, outputPath) {
  try {
    // Update status to rendering
    const job = renderJobs.get(jobId);
    job.status = "bundling";
    renderJobs.set(jobId, job);

    // Get the bundle
    const bundleLocation = await getBundled();

    job.status = "preparing";
    renderJobs.set(jobId, job);

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    job.status = "rendering";
    job.durationInFrames = composition.durationInFrames;
    job.fps = composition.fps;
    renderJobs.set(jobId, job);

    console.log(`[Render ${jobId}] Starting render: ${compositionId}, ${composition.durationInFrames} frames`);

    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec,
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        const jobUpdate = renderJobs.get(jobId);
        if (jobUpdate) {
          jobUpdate.progress = Math.round(progress * 100);
          jobUpdate.framesRendered = Math.round(progress * composition.durationInFrames);
          renderJobs.set(jobId, jobUpdate);
        }
      },
    });

    // Get file stats
    const stats = fs.statSync(outputPath);

    // Update job as complete
    const completedJob = renderJobs.get(jobId);
    completedJob.status = "complete";
    completedJob.progress = 100;
    completedJob.completedAt = Date.now();
    completedJob.fileSize = stats.size;
    completedJob.renderTimeMs = completedJob.completedAt - completedJob.createdAt;
    renderJobs.set(jobId, completedJob);

    console.log(`[Render ${jobId}] Complete! Size: ${stats.size} bytes, Time: ${completedJob.renderTimeMs}ms`);

    // Clean up old jobs after 1 hour
    setTimeout(() => {
      const oldJob = renderJobs.get(jobId);
      if (oldJob && fs.existsSync(oldJob.outputPath)) {
        fs.unlinkSync(oldJob.outputPath);
      }
      renderJobs.delete(jobId);
      console.log(`[Render ${jobId}] Cleaned up`);
    }, 60 * 60 * 1000);
  } catch (error) {
    console.error(`[Render ${jobId}] Error:`, error);
    const job = renderJobs.get(jobId);
    if (job) {
      job.status = "failed";
      job.error = error.message;
      job.completedAt = Date.now();
      renderJobs.set(jobId, job);
    }
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Remotion render server running on port ${PORT}`);
  console.log(`[Server] Output directory: ${OUTPUT_DIR}`);

  // Pre-bundle on startup
  getBundled().catch((err) => {
    console.error("[Server] Failed to bundle on startup:", err);
  });
});
