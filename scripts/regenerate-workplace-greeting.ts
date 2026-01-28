import Replicate from "replicate";
import * as fs from "fs";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  console.error("REPLICATE_API_TOKEN not set");
  process.exit(1);
}

const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

async function generateImage() {
  console.log("Generating workplace-greeting.webp with Nano Banana Pro...");

  // Using Google Nano Banana Pro model
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt:
        "Two diverse business professionals shaking hands in a bright modern office lobby, professional attire, warm welcoming smiles, natural lighting from large windows, contemporary office design with plants, corporate setting, photorealistic, high quality",
      aspect_ratio: "16:9",
      resolution: "2K",
      output_format: "png",
      safety_filter_level: "block_only_high",
    },
  });

  // Debug: log the output structure
  console.log("Output type:", typeof output);
  console.log("Output:", JSON.stringify(output, null, 2));

  // Handle different output formats from Replicate
  let imageUrl: string;
  if (typeof output === "string") {
    imageUrl = output;
  } else if (Array.isArray(output)) {
    const firstOutput = output[0];
    imageUrl =
      typeof firstOutput === "string"
        ? firstOutput
        : (firstOutput as any).url?.() || String(firstOutput);
  } else if (output && typeof output === "object") {
    // Could be a single FileOutput or object with url property
    imageUrl = (output as any).url?.() || (output as any).url || String(output);
  } else {
    throw new Error(`Unexpected output format: ${typeof output}`);
  }

  console.log("Downloading from:", imageUrl);

  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(
    "public/tests/cambridge/workplace-greeting.webp",
    Buffer.from(buffer)
  );
  console.log("Saved: public/tests/cambridge/workplace-greeting.webp");
}

generateImage().catch(console.error);
