#!/usr/bin/env npx tsx
/**
 * Generate Blog Featured Images using Replicate Flux Pro
 *
 * This script generates professional featured images for all blog posts
 * using the Flux Pro model on Replicate.
 *
 * Usage: npx tsx scripts/generate-blog-images.ts
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
const OUTPUT_DIR = path.join(process.cwd(), "public", "images", "blog");

// Use Flux Schnell for faster generation (Flux Pro requires more credits)
const MODEL = "black-forest-labs/flux-schnell";

// Blog posts that need images
const blogImagePrompts = [
  // English posts
  {
    slug: "master-english-prepositions",
    locale: "en",
    filename: "prepositions-featured.webp",
    prompt:
      "A creative minimalist illustration of English prepositions IN, ON, AT floating in 3D space with colorful geometric shapes demonstrating their meaning - a sphere inside a box (in), a cube on a surface (on), a point marker at a location (at). Modern educational design, soft gradient background in blue and mint green, professional language learning aesthetic, clean typography hints, no text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "business-english-phrases-professionals",
    locale: "en",
    filename: "business-phrases-featured.webp",
    prompt:
      "A sophisticated modern illustration of international business professionals in a meeting room, diverse team collaborating around a sleek conference table with laptops and notebooks. Clean corporate aesthetic, warm professional lighting, glass walls showing city skyline. Stylized minimalist art style, muted colors with accents of navy blue and gold. No text. 16:9 aspect ratio, high quality professional look.",
  },
  {
    slug: "interactive-games-learn-english",
    locale: "en",
    filename: "interactive-games-featured.webp",
    prompt:
      "A vibrant playful illustration of language learning through games - colorful word tiles, matching cards, puzzle pieces forming English words, game controllers and sparkles. Modern flat design style with depth, cheerful purple, teal and orange color palette. Educational gaming concept, fun and engaging atmosphere. No text visible. 16:9 aspect ratio, high quality digital art.",
  },

  // German posts (unique topics)
  {
    slug: "tipps-geschaefts-emails-englisch",
    locale: "de",
    filename: "business-emails-featured.webp",
    prompt:
      "A clean modern illustration of professional email communication - a sleek laptop showing an email interface, floating envelope icons, professional workspace with coffee cup and plant. Minimalist design, soft blues and whites, corporate yet warm feeling. Email productivity concept. No text visible. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "present-perfect-leitfaden",
    locale: "de",
    filename: "present-perfect-featured.webp",
    prompt:
      "An elegant educational illustration showing the concept of time and grammar - a timeline connecting past to present with flowing lines, clock elements, hourglass with sand flowing. Abstract representation of verb tenses. Soft purple and gold color scheme, modern minimalist style. Language learning aesthetic. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "wichtige-phrasen-erstes-geschaeftstreffen",
    locale: "de",
    filename: "first-meeting-featured.webp",
    prompt:
      "A warm professional illustration of a first business meeting - two people shaking hands in a modern office, welcoming atmosphere, contemporary furniture, large windows with natural light. Confident and friendly mood. Soft earth tones with blue accents. Professional networking concept. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "business-vokabular-interaktive-spiele",
    locale: "de",
    filename: "business-vocab-games-featured.webp",
    prompt:
      "A dynamic illustration combining business and gaming elements - floating business vocabulary flashcards, pie charts, briefcase icons mixed with game elements like progress bars, achievement stars, and colorful buttons. Modern gamification design. Teal, coral and white color palette. Educational business concept. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "deutsche-geschaeftskultur-verstehen",
    locale: "de",
    filename: "german-business-culture-featured.webp",
    prompt:
      "A sophisticated illustration representing German business culture - a stylized Frankfurt skyline with modern glass buildings, subtle German flag colors integrated elegantly, professional handshake silhouette, clock showing punctuality. Clean geometric design, navy blue and gold accents. Cross-cultural business concept. No text. 16:9 aspect ratio, high quality.",
  },

  // Additional English posts
  {
    slug: "business-email-tips",
    locale: "en",
    filename: "email-tips-featured.webp",
    prompt:
      "A modern illustration of professional email writing - a sleek laptop with an email composition window, floating icons of checkmarks, pen, and document. Professional workspace setting with minimalist decor. Clean blue and white color scheme with gold accents. Business communication concept. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "present-perfect-guide",
    locale: "en",
    filename: "present-perfect-en-featured.webp",
    prompt:
      "An educational illustration showing time concepts - a flowing ribbon connecting past events to the present moment, abstract clock face, calendar pages floating. Grammar and language learning theme. Warm purple and amber colors, modern minimalist style. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "essential-phrases-first-german-meeting",
    locale: "en",
    filename: "first-german-meeting-featured.webp",
    prompt:
      "A professional illustration of cross-cultural business meeting - diverse professionals greeting each other warmly in a modern German office, subtle German design elements, Brandenburg Gate silhouette visible through window. Welcoming atmosphere. Neutral tones with blue and gold accents. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "master-business-vocabulary-interactive-games",
    locale: "en",
    filename: "business-vocab-en-featured.webp",
    prompt:
      "A colorful illustration of gamified vocabulary learning - floating word cards, progress bars, star achievements, briefcase and chart icons mixed with playful game elements. Modern flat design with depth. Teal, orange and white color palette. Professional learning through games concept. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "email-etiquette-for-professionals",
    locale: "en",
    filename: "email-etiquette-featured.webp",
    prompt:
      "An elegant illustration of professional email communication etiquette - a laptop showing a polished email, floating etiquette symbols like handshake, checkmark, clock, professional dress code silhouette. Sophisticated corporate aesthetic. Navy blue, white and silver color scheme. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "german-business-culture",
    locale: "en",
    filename: "german-culture-en-featured.webp",
    prompt:
      "A modern illustration of German business culture for English speakers - stylized German cityscape with famous landmarks subtle in background, professional meeting scene, punctuality clock motif, efficiency symbols. Clean geometric design. Navy, gold and white colors. Cultural awareness concept. No text. 16:9 aspect ratio, high quality.",
  },
  {
    slug: "mastering-business-english-presentations",
    locale: "en",
    filename: "presentations-featured.webp",
    prompt:
      "A dynamic illustration of business presentations - a confident professional silhouette presenting to an audience, projection screen with chart, speech bubbles, podium. Modern corporate setting with good lighting. Inspiring atmosphere. Blue, orange and white color scheme. Professional speaking concept. No text. 16:9 aspect ratio, high quality.",
  },
];

// Shared images (same image for EN and DE versions)
const sharedImages = [
  {
    filename: "prepositions-featured.webp",
    usedBy: ["master-english-prepositions", "englische-praepositionen-meistern"],
  },
  {
    filename: "business-phrases-featured.webp",
    usedBy: ["business-english-phrases-professionals", "business-english-phrasen-fuer-profis"],
  },
  {
    filename: "interactive-games-featured.webp",
    usedBy: ["interactive-games-learn-english", "interaktive-spiele-englisch-lernen"],
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
 * Generate image using Flux on Replicate with direct API
 */
async function generateImage(prompt: string, filename: string): Promise<string> {
  console.log(`\n🎨 Generating: ${filename}`);
  console.log(`   Prompt: ${prompt.substring(0, 60)}...`);

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
          },
        }),
      }
    );

    if (createResponse.status !== 201) {
      console.error(`   ❌ Failed to create prediction:`, createResponse.data);
      throw new Error(`Failed to create prediction: ${JSON.stringify(createResponse.data)}`);
    }

    const prediction = createResponse.data as {
      id: string;
      status: string;
      output?: string[];
      error?: string;
      urls: { get: string };
    };

    console.log(`   📦 Prediction created: ${prediction.id}`);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    while (result.status !== "succeeded" && result.status !== "failed" && attempts < maxAttempts) {
      await sleep(1000);
      attempts++;

      const pollResponse = await httpRequest(prediction.urls.get, {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      result = pollResponse.data as typeof prediction;
      process.stdout.write(`\r   ⏳ Status: ${result.status} (${attempts}s)`);
    }

    console.log(""); // newline after status updates

    if (result.status === "failed") {
      throw new Error(`Prediction failed: ${result.error}`);
    }

    if (!result.output || result.output.length === 0) {
      throw new Error("No output from prediction");
    }

    const imageUrl = result.output[0];
    console.log(`   🔗 Image URL: ${imageUrl.substring(0, 60)}...`);

    // Download the image
    const filepath = path.join(OUTPUT_DIR, filename);
    await downloadImage(imageUrl, filepath);

    const stats = fs.statSync(filepath);
    console.log(`   ✅ Saved: ${filepath} (${Math.round(stats.size / 1024)} KB)`);

    return filepath;
  } catch (error) {
    console.error(`   ❌ Error generating ${filename}:`, error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🖼️  Blog Image Generator using Flux\n");
  console.log(`📦 Model: ${MODEL}`);
  console.log("=".repeat(50));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }

  // Check which images already exist
  const existingImages = fs.readdirSync(OUTPUT_DIR);
  console.log(`\n📋 Found ${existingImages.length} existing images`);

  // Filter to only generate missing images
  const imagesToGenerate = blogImagePrompts.filter(
    (img) => !existingImages.includes(img.filename)
  );

  if (imagesToGenerate.length === 0) {
    console.log("\n✅ All images already exist! Nothing to generate.");
    console.log("\nTo regenerate, delete the images from:");
    console.log(`   ${OUTPUT_DIR}`);
    return;
  }

  console.log(`\n🎯 Generating ${imagesToGenerate.length} images...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const image of imagesToGenerate) {
    try {
      await generateImage(image.prompt, image.filename);
      successCount++;

      // Rate limit: wait between requests
      if (imagesToGenerate.indexOf(image) < imagesToGenerate.length - 1) {
        console.log("   ⏳ Waiting 2s before next generation...");
        await sleep(2000);
      }
    } catch (error) {
      errorCount++;
      console.error(`Failed to generate ${image.filename}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Generation Complete!");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log("=".repeat(50));

  // List all generated images
  console.log("\n📁 Images in output directory:");
  const finalImages = fs.readdirSync(OUTPUT_DIR);
  for (const img of finalImages) {
    const stats = fs.statSync(path.join(OUTPUT_DIR, img));
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   - ${img} (${sizeKB} KB)`);
  }

  // Print usage information
  console.log("\n💡 Usage in blog posts:");
  console.log('   featuredImageUrl: "/images/blog/[filename]"');
  console.log("\n📝 Image to slug mapping:");
  for (const img of blogImagePrompts) {
    console.log(`   ${img.filename} → ${img.slug}`);
  }

  // Print shared image info
  console.log("\n🔗 Shared images (use same image for EN/DE):");
  for (const shared of sharedImages) {
    console.log(`   ${shared.filename}:`);
    for (const slug of shared.usedBy) {
      console.log(`     - ${slug}`);
    }
  }
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
