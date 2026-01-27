/**
 * Seed script to import the Lavera placement test into Convex
 *
 * Run with: npx tsx scripts/seed-lavera-placement-test.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { laveraPlacementTest } from "../app/tests/lavera/test-data";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("ERROR: NEXT_PUBLIC_CONVEX_URL environment variable not set");
  console.error("Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

async function main() {
  console.log("🚀 Seeding Lavera Placement Test to Convex...");
  console.log(`📍 Convex URL: ${CONVEX_URL}`);

  const client = new ConvexHttpClient(CONVEX_URL!);

  // Check if test already exists
  try {
    const existing = await client.query(api.placementTests.getBySlug, { slug: "lavera" });

    if (existing) {
      console.log("⚠️  Test with slug 'lavera' already exists!");
      console.log(`   ID: ${existing._id}`);
      console.log(`   Title: ${existing.title}`);
      console.log(`   Status: ${existing.status}`);

      const readline = await import("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question("Do you want to update the existing test? (y/n): ", resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== "y") {
        console.log("❌ Aborted. No changes made.");
        process.exit(0);
      }

      // Update existing test
      console.log("📝 Updating existing test...");
      await client.mutation(api.placementTests.update, {
        id: existing._id,
        title: laveraPlacementTest.title,
        config: laveraPlacementTest as unknown as Record<string, unknown>,
        companyName: laveraPlacementTest.company.name,
      });

      console.log("✅ Test updated successfully!");
      process.exit(0);
    }
  } catch (error) {
    // Test doesn't exist, continue to create
  }

  // Create new test
  console.log("📝 Creating new test...");

  try {
    const testId = await client.mutation(api.placementTests.create, {
      title: laveraPlacementTest.title,
      slug: "lavera",
      companyName: laveraPlacementTest.company.name,
      companyLogo: laveraPlacementTest.company.logo,
      config: laveraPlacementTest as unknown as Record<string, unknown>,
      status: "published", // Publish immediately since it's already live
      resultEmails: {
        sendToCandidate: true,
        hrEmails: ["hr@lavera.com"], // Configure as needed
      },
    });

    console.log("✅ Test created successfully!");
    console.log(`   ID: ${testId}`);
    console.log(`   Slug: lavera`);
    console.log(`   Questions: ${laveraPlacementTest.questions.length}`);
    console.log(`   Status: published`);
    console.log(`\n🔗 Test available at: /tests/lavera`);
  } catch (error) {
    console.error("❌ Failed to create test:", error);
    process.exit(1);
  }
}

main();
