import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LessonContent } from "@/lib/types/lesson-content";
import {
  generateHtmlSlides,
  validateHtmlSlides,
  getSlideStats,
} from "@/lib/html-slides";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Missing contentId" },
        { status: 400 }
      );
    }

    console.log("🖼️ HTML Slides generation started for:", contentId);

    // Get content from Convex
    const content = await convex.query(api.knowledgeBases.getContentById, {
      contentId: contentId as Id<"knowledgeContent">,
    });

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (!content.jsonContent) {
      return NextResponse.json(
        { error: "No structured content available for HTML slide generation" },
        { status: 400 }
      );
    }

    const lessonContent = content.jsonContent as LessonContent;

    // Generate HTML slides
    console.log("🎨 Generating HTML slides from structured content...");
    const startTime = Date.now();

    const slides = generateHtmlSlides(lessonContent, {
      maxVocabPerSlide: 6,
      maxExerciseItemsPerSlide: 4,
      includeDeutsch: true,
    });

    const generationTime = Date.now() - startTime;
    console.log(`✅ Generated ${slides.length} slides in ${generationTime}ms`);

    // Validate slides
    const validation = validateHtmlSlides(slides);
    if (!validation.valid) {
      console.error("Slide validation failed:", validation.errors);
      return NextResponse.json(
        { error: "Slide validation failed", details: validation.errors },
        { status: 500 }
      );
    }

    // Get stats for logging
    const stats = getSlideStats(slides);
    console.log("📊 Slide stats:", stats);

    // Store slides in Convex
    await convex.mutation(api.knowledgeBases.updateHtmlSlides, {
      contentId: contentId as Id<"knowledgeContent">,
      htmlSlides: slides.map((slide) => ({
        index: slide.index,
        html: slide.html,
        title: slide.title,
        type: slide.type,
        speakerNotes: slide.speakerNotes,
        teachingPrompt: slide.teachingPrompt,
      })),
    });

    console.log("✅ HTML slides stored in knowledgeContent");

    return NextResponse.json({
      success: true,
      slideCount: slides.length,
      stats,
      generationTimeMs: generationTime,
    });
  } catch (error) {
    console.error("HTML slide generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "HTML slide generation failed" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve HTML slides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json(
        { error: "Missing contentId" },
        { status: 400 }
      );
    }

    const content = await convex.query(api.knowledgeBases.getContentById, {
      contentId: contentId as Id<"knowledgeContent">,
    });

    if (!content?.htmlSlides) {
      return NextResponse.json(
        { error: "HTML slides not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      slideCount: content.htmlSlides.length,
      slides: content.htmlSlides,
      generatedAt: content.htmlSlidesGeneratedAt,
    });
  } catch (error) {
    console.error("HTML slides retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to get HTML slides" },
      { status: 500 }
    );
  }
}
