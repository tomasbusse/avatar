/**
 * Generate Cambridge Test Images using Replicate Flux
 *
 * Usage: REPLICATE_API_TOKEN=... npx tsx scripts/generate-cambridge-images.ts
 */

import Replicate from "replicate";
import * as fs from "fs";
import * as path from "path";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  console.error("REPLICATE_API_TOKEN environment variable is not set");
  process.exit(1);
}

const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

const OUTPUT_DIR = path.join(process.cwd(), "public/tests/cambridge");

// Image prompts for Cambridge Entry Test
const IMAGE_PROMPTS = [
  {
    filename: "test-banner.webp",
    prompt: "Modern professional banner for English language assessment, abstract geometric shapes in blue gradient (#1e40af to #3b82f6), subtle education icons like books and speech bubbles, clean corporate design, minimal text area, wide format, professional and welcoming atmosphere, 4k quality",
  },
  {
    filename: "workplace-greeting.webp",
    prompt: "Two diverse business professionals shaking hands in a bright modern office lobby, one man and one woman, professional attire, warm welcoming smiles, natural lighting from large windows, contemporary office design with plants, corporate setting, photorealistic, 4k quality",
  },
  {
    filename: "office-directions.webp",
    prompt: "Friendly receptionist at modern office information desk pointing and giving directions to a visitor, clear wayfinding signage visible in background, bright professional lobby, diverse workforce, helpful interaction, contemporary corporate interior, photorealistic, 4k quality",
  },
  {
    filename: "customer-service.webp",
    prompt: "Customer service representative helping a customer at a modern help desk, professional woman assisting a man with paperwork or computer, friendly interaction, bright office environment, diverse professionals, corporate setting with clean design, photorealistic, 4k quality",
  },
  {
    filename: "computer-work.webp",
    prompt: "Professional person focused on working at computer desk in modern open-plan office, multiple monitors, concentrated expression, contemporary workspace with ergonomic setup, natural lighting, plants visible, diverse workplace setting, photorealistic, 4k quality",
  },
  {
    filename: "team-meeting.webp",
    prompt: "Diverse team of 5 professionals having collaborative meeting in glass-walled conference room, mixed gender and ethnicity, engaged discussion around table with laptops, modern office with city view, bright natural light, contemporary corporate environment, photorealistic, 4k quality",
  },
  {
    filename: "eco-office.webp",
    prompt: "Sustainable modern office workspace with abundant indoor plants, natural wood furniture, employees working at desks, large windows with natural light, green walls, eco-friendly design elements, biophilic office design, diverse workers, photorealistic, 4k quality",
  },
  {
    filename: "presentation.webp",
    prompt: "Executive giving professional presentation to board members in modern boardroom, large screen display with charts, confident speaker gesturing, attentive audience of diverse executives seated at long table, contemporary corporate meeting room, photorealistic, 4k quality",
  },
  {
    filename: "video-conference.webp",
    prompt: "Professional on video conference call with multiple international participants visible on large screen, modern home office or meeting room setup, diverse faces on screen representing global team, laptop and professional setup, contemporary remote work environment, photorealistic, 4k quality",
  },
  {
    filename: "strategy-planning.webp",
    prompt: "Senior executives in strategic planning session around large boardroom table, documents and charts spread out, tablets and laptops visible, serious focused discussion, diverse leadership team, floor-to-ceiling windows with city skyline, premium corporate environment, photorealistic, 4k quality",
  },
];

async function downloadImage(url: string, filepath: string): Promise<void> {
  // Use fetch for simpler handling
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

async function generateImage(prompt: string, filename: string): Promise<void> {
  console.log(`\nGenerating: ${filename}`);
  console.log(`Prompt: ${prompt.substring(0, 80)}...`);

  try {
    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 90,
          num_outputs: 1,
        }
      }
    );

    // Output can be array of URLs or FileOutput objects
    const outputs = output as Array<string | { url: () => string }>;
    if (outputs && outputs.length > 0) {
      const firstOutput = outputs[0];
      // Handle both string URLs and FileOutput objects
      const imageUrl = typeof firstOutput === 'string'
        ? firstOutput
        : (firstOutput as any).url?.() || String(firstOutput);
      const filepath = path.join(OUTPUT_DIR, filename);

      console.log(`Downloading from: ${imageUrl}`);
      await downloadImage(imageUrl, filepath);
      console.log(`✓ Saved: ${filepath}`);
    } else {
      console.error(`✗ No output for ${filename}`);
    }
  } catch (error) {
    console.error(`✗ Error generating ${filename}:`, error);
    throw error;
  }
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  console.log("=".repeat(60));
  console.log("Cambridge Entry Test Image Generator");
  console.log("Using Replicate Flux Schnell");
  console.log("=".repeat(60));
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Images to generate: ${IMAGE_PROMPTS.length}`);

  let successCount = 0;
  let failCount = 0;

  for (const { filename, prompt } of IMAGE_PROMPTS) {
    try {
      await generateImage(prompt, filename);
      successCount++;
    } catch (error) {
      failCount++;
      console.error(`Failed to generate ${filename}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Complete! Success: ${successCount}, Failed: ${failCount}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
