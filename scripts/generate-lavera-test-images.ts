#!/usr/bin/env npx tsx
/**
 * Generate Lavera Placement Test Images using Replicate Flux Pro
 *
 * This script generates professional, photorealistic images for the Lavera placement test.
 * Images are for speaking prompts and visual context - NO cartoon/comic/illustration style.
 *
 * Usage: npx tsx scripts/generate-lavera-test-images.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// Load environment
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  console.error("Missing REPLICATE_API_TOKEN in .env.local");
  console.error("Add: REPLICATE_API_TOKEN=r8_...");
  process.exit(1);
}

// Output directory for images
const OUTPUT_DIR = path.join(process.cwd(), "public", "tests", "lavera");

// Use Flux Pro for high quality photorealistic images
const MODEL = "black-forest-labs/flux-pro";

// Lavera test images - all MUST be photorealistic, professional, no cartoons
const laveraTestImages = [
  // Speaking prompt images - workplace scenarios
  {
    filename: "natural-cosmetics-lab.webp",
    prompt:
      "Professional photograph of a modern natural cosmetics laboratory. A scientist in a white lab coat examining organic plant extracts in test tubes. Clean, bright workspace with glass bottles of essential oils and dried herbs visible. Natural lighting through large windows. High quality editorial photography, photorealistic, 4K, sharp focus.",
  },
  {
    filename: "sustainability-meeting.webp",
    prompt:
      "Professional editorial photograph of a diverse business team having a sustainability meeting in a modern eco-friendly office. Conference table with recycled materials visible. Plants and natural wood elements in the background. Natural daylight, professional attire. Photorealistic, high quality, 4K resolution.",
  },
  {
    filename: "organic-farm-supplier.webp",
    prompt:
      "Professional photograph of an organic olive farm in the Mediterranean. A farmer showing olive trees to a business professional taking notes. Golden hour lighting, authentic rural setting. High quality documentary style photography, photorealistic, sharp focus, 4K.",
  },
  {
    filename: "customer-service-desk.webp",
    prompt:
      "Professional photograph of a customer service representative at a natural cosmetics store helping a customer choose skincare products. Modern retail environment with clean product displays. Natural lighting, friendly interaction. Photorealistic editorial photography, 4K quality.",
  },
  {
    filename: "packaging-production.webp",
    prompt:
      "Professional photograph of a modern eco-friendly packaging production line. Workers in clean uniforms operating machines that produce recyclable cosmetic containers. Industrial setting with natural light. High quality documentary photography, photorealistic, 4K resolution.",
  },
  {
    filename: "product-launch-presentation.webp",
    prompt:
      "Professional photograph of a marketing team presenting a new natural skincare product launch. Modern conference room with a large screen showing product images. Diverse professional team, business attire. Corporate photography style, photorealistic, 4K quality.",
  },

  // Additional context images
  {
    filename: "lavera-hero-banner.webp",
    prompt:
      "Professional product photography of natural cosmetic ingredients arranged artistically. Fresh green leaves, organic honey, aloe vera gel, olive oil bottle, and lavender flowers on a clean white marble surface. Soft natural lighting, high-end beauty brand aesthetic. Photorealistic, studio quality, 4K resolution.",
  },
  {
    filename: "quality-control-testing.webp",
    prompt:
      "Professional photograph of a quality control specialist testing natural cosmetic products in a laboratory. Modern equipment, samples in glass containers. Clean white lab coat, professional environment. Scientific documentary style, photorealistic, 4K quality.",
  },
];

/**
 * Make HTTP request
 */
async function httpRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, data });
        }
      });
    });

    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

/**
 * Download image from URL to local file
 */
async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    const download = (downloadUrl: string) => {
      https
        .get(downloadUrl, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              download(redirectUrl);
              return;
            }
          }
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
    };

    download(url);
  });
}

/**
 * Sleep utility
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate image using Flux Pro on Replicate
 */
async function generateImage(prompt: string, filename: string): Promise<string> {
  console.log(`\n[Generating] ${filename}`);
  console.log(`   Prompt: ${prompt.substring(0, 80)}...`);

  try {
    // Create prediction
    const createResponse = await httpRequest(
      `https://api.replicate.com/v1/models/${MODEL}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            aspect_ratio: "16:9",
            output_format: "webp",
            output_quality: 90,
            guidance: 3.5, // For Flux Pro
          },
        }),
      }
    );

    if (createResponse.status !== 201) {
      console.error(`   [Error] Failed to create prediction:`, createResponse.data);
      throw new Error(`Failed to create prediction: ${JSON.stringify(createResponse.data)}`);
    }

    const prediction = createResponse.data as {
      id: string;
      status: string;
      output?: string[];
      error?: string;
      urls: { get: string };
    };

    console.log(`   [Created] Prediction ID: ${prediction.id}`);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 120; // 120 seconds max for Flux Pro

    while (result.status !== "succeeded" && result.status !== "failed" && attempts < maxAttempts) {
      await sleep(1000);
      attempts++;

      const pollResponse = await httpRequest(prediction.urls.get, {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      result = pollResponse.data as typeof prediction;
      process.stdout.write(`\r   [Status] ${result.status} (${attempts}s)`);
    }

    console.log(""); // newline after status updates

    if (result.status === "failed") {
      throw new Error(`Prediction failed: ${result.error}`);
    }

    if (!result.output) {
      throw new Error("No output from prediction");
    }

    // Handle both array and string output formats
    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      console.error("   [Debug] Output:", JSON.stringify(result.output));
      throw new Error(`Invalid image URL: ${imageUrl}`);
    }

    console.log(`   [URL] ${imageUrl.substring(0, 80)}...`);

    // Download the image
    const filepath = path.join(OUTPUT_DIR, filename);
    await downloadImage(imageUrl, filepath);

    const stats = fs.statSync(filepath);
    console.log(`   [Saved] ${filepath} (${Math.round(stats.size / 1024)} KB)`);

    return filepath;
  } catch (error) {
    console.error(`   [Error] Failed to generate ${filename}:`, error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Lavera Placement Test Image Generator");
  console.log("Model: Flux Pro (photorealistic quality)");
  console.log("=".repeat(60));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`[Created directory] ${OUTPUT_DIR}`);
  }

  // Check which images already exist
  const existingImages = fs.existsSync(OUTPUT_DIR) ? fs.readdirSync(OUTPUT_DIR) : [];
  console.log(`\n[Found] ${existingImages.length} existing images`);

  // Filter to only generate missing images
  const imagesToGenerate = laveraTestImages.filter(
    (img) => !existingImages.includes(img.filename)
  );

  if (imagesToGenerate.length === 0) {
    console.log("\n[Complete] All images already exist!");
    console.log("\nTo regenerate, delete the images from:");
    console.log(`   ${OUTPUT_DIR}`);
    return;
  }

  console.log(`\n[Queue] Generating ${imagesToGenerate.length} images...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const image of imagesToGenerate) {
    try {
      await generateImage(image.prompt, image.filename);
      successCount++;

      // Rate limit: wait between requests
      if (imagesToGenerate.indexOf(image) < imagesToGenerate.length - 1) {
        console.log("   [Wait] 3s before next generation...");
        await sleep(3000);
      }
    } catch (error) {
      errorCount++;
      console.error(`[Failed] ${image.filename}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Generation Complete!");
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log("=".repeat(60));

  // List all images
  console.log("\n[Output directory]:");
  const finalImages = fs.existsSync(OUTPUT_DIR) ? fs.readdirSync(OUTPUT_DIR) : [];
  for (const img of finalImages) {
    const stats = fs.statSync(path.join(OUTPUT_DIR, img));
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   - ${img} (${sizeKB} KB)`);
  }

  console.log("\n[Usage] Images available at: /tests/lavera/[filename]");
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
