#!/usr/bin/env npx tsx
/**
 * Update Blog Posts with Featured Images
 *
 * This script updates all blog posts in Convex to include their
 * featured image URLs.
 *
 * Usage: npx tsx scripts/update-blog-images.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// Mapping of blog slugs to their featured images
const imageMapping: Record<string, string> = {
  // English posts
  "master-english-prepositions": "/images/blog/prepositions-featured.webp",
  "business-english-phrases-professionals": "/images/blog/business-phrases-featured.webp",
  "interactive-games-learn-english": "/images/blog/interactive-games-featured.webp",
  "business-email-tips": "/images/blog/email-tips-featured.webp",
  "present-perfect-guide": "/images/blog/present-perfect-en-featured.webp",
  "essential-phrases-first-german-meeting": "/images/blog/first-german-meeting-featured.webp",
  "master-business-vocabulary-interactive-games": "/images/blog/business-vocab-en-featured.webp",
  "email-etiquette-for-professionals": "/images/blog/email-etiquette-featured.webp",
  "german-business-culture": "/images/blog/german-culture-en-featured.webp",
  "mastering-business-english-presentations": "/images/blog/presentations-featured.webp",

  // German posts (using same images where topics match)
  "englische-praepositionen-meistern": "/images/blog/prepositions-featured.webp",
  "business-english-phrasen-fuer-profis": "/images/blog/business-phrases-featured.webp",
  "interaktive-spiele-englisch-lernen": "/images/blog/interactive-games-featured.webp",
  "tipps-geschaefts-emails-englisch": "/images/blog/business-emails-featured.webp",
  "present-perfect-leitfaden": "/images/blog/present-perfect-featured.webp",
  "wichtige-phrasen-erstes-geschaeftstreffen": "/images/blog/first-meeting-featured.webp",
  "business-vokabular-interaktive-spiele": "/images/blog/business-vocab-games-featured.webp",
  "deutsche-geschaeftskultur-verstehen": "/images/blog/german-business-culture-featured.webp",

  // German posts (share with English equivalents)
  "email-etikette-fuer-profis": "/images/blog/email-etiquette-featured.webp",
  "business-english-praesentationen-meistern": "/images/blog/presentations-featured.webp",
};

async function updateBlogImages() {
  console.log("🖼️  Updating Blog Posts with Featured Images\n");
  console.log("=".repeat(50));

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  // Process both locales
  for (const locale of ["en", "de"]) {
    console.log(`\n📍 Processing ${locale.toUpperCase()} posts...`);

    // Get all posts for this locale
    const posts = await convex.query(api.landing.getBlogPosts, { locale });

    for (const post of posts) {
      const imageUrl = imageMapping[post.slug];

      if (!imageUrl) {
        console.log(`   ⏭️  No image mapping for: ${post.slug}`);
        skipped++;
        continue;
      }

      // Check if already has featured image
      if (post.featuredImageUrl === imageUrl) {
        console.log(`   ✓  Already set: ${post.slug}`);
        skipped++;
        continue;
      }

      try {
        // Update the post with the featured image
        await convex.mutation(api.landing.updateBlogPost, {
          id: post._id,
          featuredImageUrl: imageUrl,
        });

        console.log(`   ✅ Updated: ${post.slug} → ${imageUrl}`);
        updated++;
      } catch (error) {
        console.error(`   ❌ Error updating ${post.slug}:`, error);
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Update Complete!");
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❓ Not found: ${notFound}`);
  console.log("=".repeat(50));

  // List final status
  console.log("\n📋 Final Blog Post Status:");
  for (const locale of ["en", "de"]) {
    const posts = await convex.query(api.landing.getBlogPosts, { locale });
    console.log(`\n   ${locale.toUpperCase()} (${posts.length} posts):`);
    for (const post of posts) {
      const hasImage = post.featuredImageUrl ? "🖼️" : "⬜";
      console.log(`   ${hasImage} ${post.slug}`);
    }
  }
}

// Run
updateBlogImages().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
