#!/usr/bin/env npx tsx
/**
 * Seed script for blog categories
 *
 * Creates the initial blog categories for the SLS blog:
 * 1. Grammar (BookOpen, sls-teal)
 * 2. Business English (Briefcase, sls-olive)
 * 3. Interactive Learning (Gamepad2, sls-orange)
 * 4. Vocabulary (Languages, sls-chartreuse)
 * 5. Learning Tips (Lightbulb, sls-beige)
 *
 * Usage: npx tsx scripts/seed-blog-categories.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Missing required environment variable: NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

/**
 * Blog categories to seed
 */
const blogCategories = [
  {
    slug: "grammar",
    name: { en: "Grammar", de: "Grammatik" },
    description: {
      en: "Master English grammar rules with clear explanations and practical examples",
      de: "Englische Grammatikregeln meistern mit klaren Erklärungen und praktischen Beispielen",
    },
    icon: "BookOpen",
    color: "sls-teal",
    order: 0,
  },
  {
    slug: "business-english",
    name: { en: "Business English", de: "Wirtschaftsenglisch" },
    description: {
      en: "Professional language skills for meetings, emails, and international business",
      de: "Professionelle Sprachkenntnisse für Meetings, E-Mails und internationale Geschäfte",
    },
    icon: "Briefcase",
    color: "sls-olive",
    order: 1,
  },
  {
    slug: "games",
    name: { en: "Interactive Learning", de: "Interaktives Lernen" },
    description: {
      en: "Learn English through fun games and interactive exercises",
      de: "Englisch lernen durch Spiele und interaktive Übungen",
    },
    icon: "Gamepad2",
    color: "sls-orange",
    order: 2,
  },
  {
    slug: "vocabulary",
    name: { en: "Vocabulary", de: "Wortschatz" },
    description: {
      en: "Expand your English vocabulary with themed word lists and memory techniques",
      de: "Erweitern Sie Ihren englischen Wortschatz mit thematischen Wortlisten und Gedächtnistechniken",
    },
    icon: "Languages",
    color: "sls-chartreuse",
    order: 3,
  },
  {
    slug: "tips",
    name: { en: "Learning Tips", de: "Lerntipps" },
    description: {
      en: "Study strategies, motivation tips, and advice for effective language learning",
      de: "Lernstrategien, Motivationstipps und Ratschläge für effektives Sprachenlernen",
    },
    icon: "Lightbulb",
    color: "sls-beige",
    order: 4,
  },
];

async function seedBlogCategories() {
  console.log("\n🏷️  Starting blog categories seeding...\n");

  let successCount = 0;

  // First, check existing categories
  const existingCategories = await convex.query(api.blogCategories.list);
  const existingSlugs = new Set(existingCategories.map((c) => c.slug));

  for (const category of blogCategories) {
    console.log(`📁 Processing category: "${category.name.en}"...`);

    try {
      if (existingSlugs.has(category.slug)) {
        console.log(`   ⏭️  Category "${category.slug}" already exists, skipping.`);
        continue;
      }

      // Create the category
      await convex.mutation(api.blogCategories.create, {
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        order: category.order,
      });

      console.log(`   ✅ Created: "${category.name.en}" (${category.slug})`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error creating "${category.name.en}":`, error);
    }
  }

  console.log(`\n✨ Seeding complete! Created ${successCount}/${blogCategories.length} categories.\n`);

  // List all categories for verification
  const allCategories = await convex.query(api.blogCategories.list);
  console.log("📋 Current categories in database:");
  for (const cat of allCategories) {
    console.log(`   - ${cat.name.en} (${cat.slug}) - Order: ${cat.order}`);
  }
  console.log("");
}

// Run the seed function
seedBlogCategories().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
