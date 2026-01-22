#!/usr/bin/env npx tsx
/**
 * Batch Script: Generate HTML Slides for Existing Knowledge Content
 *
 * This script finds all knowledge content entries that have structured JSON content
 * but are missing HTML slides, and generates them.
 *
 * Usage: npx tsx scripts/generate-html-slides-batch.ts [--dry-run]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  generateHtmlSlides,
  validateHtmlSlides,
  getSlideStats,
  generateGrammarSlides,
  isGrammarKnowledgeContent,
} from "../lib/html-slides";
import { LessonContent } from "../lib/types/lesson-content";

// Load environment
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Missing NEXT_PUBLIC_CONVEX_URL environment variable");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

interface KnowledgeContent {
  _id: Id<"knowledgeContent">;
  title: string;
  processingStatus: string;
  jsonContent?: unknown;
  htmlSlides?: unknown[];
}

/**
 * Check if jsonContent has the expected LessonContent structure
 * (with metadata and content wrapper fields)
 */
function isValidLessonContent(jsonContent: unknown): jsonContent is LessonContent {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return false;
  }
  const obj = jsonContent as Record<string, unknown>;
  // LessonContent has `metadata` and `content` top-level keys
  if (!obj.metadata || typeof obj.metadata !== 'object') {
    return false;
  }
  if (!obj.content || typeof obj.content !== 'object') {
    return false;
  }
  const metadata = obj.metadata as Record<string, unknown>;
  // Must have title in metadata
  if (!metadata.title || typeof metadata.title !== 'string') {
    return false;
  }
  return true;
}

async function generateSlidesForContent(
  content: KnowledgeContent,
  dryRun: boolean
): Promise<{ success: boolean; slideCount?: number; error?: string; skipped?: boolean; contentType?: string }> {
  try {
    let slides;
    let contentType: string;

    // Try LessonContent structure first (from web scraping)
    if (isValidLessonContent(content.jsonContent)) {
      contentType = "lesson";
      const lessonContent = content.jsonContent;
      slides = generateHtmlSlides(lessonContent, {
        maxVocabPerSlide: 6,
        maxExerciseItemsPerSlide: 4,
        includeDeutsch: true,
      });
    }
    // Try Grammar Knowledge structure (from grammar import)
    else if (isGrammarKnowledgeContent(content.jsonContent)) {
      contentType = "grammar";
      slides = generateGrammarSlides(content.jsonContent, content.title, {
        maxRulesPerSlide: 3,
        maxExercisesPerSlide: 4,
      });
    }
    // Unknown structure
    else {
      return {
        success: false,
        skipped: true,
        error: "JSON structure not compatible (neither LessonContent nor GrammarKnowledge)"
      };
    }

    // Validate slides
    const validation = validateHtmlSlides(slides);
    if (!validation.valid) {
      return { success: false, error: `Validation failed: ${validation.errors.join(", ")}` };
    }

    if (dryRun) {
      const stats = getSlideStats(slides);
      console.log(`   [${contentType}] Would generate ${slides.length} slides (${JSON.stringify(stats)})`);
      return { success: true, slideCount: slides.length, contentType };
    }

    // Store slides in Convex
    await convex.mutation(api.knowledgeBases.updateHtmlSlides, {
      contentId: content._id,
      htmlSlides: slides.map((slide) => ({
        index: slide.index,
        html: slide.html,
        title: slide.title,
        type: slide.type,
        speakerNotes: slide.speakerNotes,
        teachingPrompt: slide.teachingPrompt,
      })),
    });

    return { success: true, slideCount: slides.length, contentType };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("\n🖼️  HTML Slides Batch Generator");
  console.log("================================");
  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  // Get all completed content
  console.log("📊 Fetching knowledge content from Convex...");
  const allContent = await convex.query(api.knowledgeBases.getAllContent, {});

  if (!allContent || allContent.length === 0) {
    console.log("ℹ️  No completed content found in knowledge base");
    return;
  }

  console.log(`   Found ${allContent.length} completed content entries\n`);

  // Filter for content that needs slides
  const contentNeedingSlides = allContent.filter((content: KnowledgeContent) => {
    // Must have JSON content
    if (!content.jsonContent) {
      return false;
    }
    // Must not already have HTML slides
    if (content.htmlSlides && Array.isArray(content.htmlSlides) && content.htmlSlides.length > 0) {
      return false;
    }
    return true;
  });

  if (contentNeedingSlides.length === 0) {
    console.log("✅ All content already has HTML slides - nothing to do!");
    return;
  }

  console.log(`🔧 Found ${contentNeedingSlides.length} entries needing HTML slides:\n`);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let totalSlides = 0;

  for (let i = 0; i < contentNeedingSlides.length; i++) {
    const content = contentNeedingSlides[i];
    console.log(`[${i + 1}/${contentNeedingSlides.length}] "${content.title}"`);
    console.log(`   ID: ${content._id}`);

    const result = await generateSlidesForContent(content, dryRun);

    if (result.success) {
      const typeLabel = result.contentType ? ` [${result.contentType}]` : "";
      console.log(`   ✅${typeLabel} ${dryRun ? "Would generate" : "Generated"} ${result.slideCount} slides`);
      successCount++;
      totalSlides += result.slideCount || 0;
    } else if (result.skipped) {
      console.log(`   ⏭️  Skipped: ${result.error}`);
      skippedCount++;
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      failCount++;
    }
    console.log("");
  }

  // Summary
  console.log("\n================================");
  console.log("📈 Summary:");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped (incompatible format): ${skippedCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📊 Total slides ${dryRun ? "to generate" : "generated"}: ${totalSlides}`);

  if (dryRun && successCount > 0) {
    console.log("\n💡 Run without --dry-run to generate slides");
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
