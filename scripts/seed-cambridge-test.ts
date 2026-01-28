/**
 * Seed script to insert the Cambridge Entry Test into Convex
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-cambridge-test.ts
 *
 * Or run with:
 *   npx convex run placementTests:create --args '...'
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { cambridgeEntryTest } from "../lib/test-data/cambridge-entry-test";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  process.exit(1);
}

async function seedCambridgeTest() {
  const client = new ConvexHttpClient(CONVEX_URL!);

  console.log("Checking if Cambridge test already exists...");

  // Check if test already exists
  const existing = await client.query(api.placementTests.getBySlug, { slug: "cambridge" });

  if (existing) {
    console.log("Cambridge test already exists! Updating...");
    await client.mutation(api.placementTests.update, {
      id: existing._id,
      title: "Cambridge English Entry Test",
      config: cambridgeEntryTest,
      status: "published",
      resultEmails: {
        sendToCandidate: true,
        hrEmails: ["james@englisch-lehrer.com"],
      },
    });
    console.log("Test updated successfully!");
    console.log(`Test URL: /tests/cambridge`);
    return;
  }

  console.log("Creating new Cambridge test...");

  const testId = await client.mutation(api.placementTests.create, {
    title: "Cambridge English Entry Test",
    slug: "cambridge",
    companyName: "Cambridge Assessment",
    config: cambridgeEntryTest,
    status: "published",
    resultEmails: {
      sendToCandidate: true,
      hrEmails: ["james@englisch-lehrer.com"],
    },
  });

  console.log(`Test created successfully with ID: ${testId}`);
  console.log(`Test URL: /tests/cambridge`);
}

seedCambridgeTest()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding test:", error);
    process.exit(1);
  });
