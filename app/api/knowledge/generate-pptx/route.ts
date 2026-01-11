import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-client";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import PptxGenJS from "pptxgenjs";
import { LessonContent } from "@/lib/types/lesson-content";
import { SLS_COLORS_HEX } from "@/lib/brand-colors";


// SLS Brand Color scheme for presentations
const COLORS = {
  primary: SLS_COLORS_HEX.teal,         // Dark teal - headers, title slides
  secondary: SLS_COLORS_HEX.olive,      // Olive - secondary elements
  accent: SLS_COLORS_HEX.chartreuse,    // Yellow-green - highlights
  action: SLS_COLORS_HEX.orange,        // Orange - calls to action
  warning: SLS_COLORS_HEX.cream,        // Cream - grammar backgrounds
  warningText: SLS_COLORS_HEX.orange,   // Orange - grammar text accents
  muted: SLS_COLORS_HEX.olive,          // Olive - muted text
  background: SLS_COLORS_HEX.beige,     // Beige - section backgrounds
  backgroundLight: SLS_COLORS_HEX.cream, // Cream - light backgrounds
  white: SLS_COLORS_HEX.white,
  black: SLS_COLORS_HEX.textDark,
};

async function generatePptxFromContent(lessonContent: LessonContent): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.layout = "LAYOUT_16x9";
  pptx.title = lessonContent.metadata.title;
  pptx.author = "Emma AI Platform";
  pptx.subject = lessonContent.metadata.topic;

  // Define master slide layouts
  pptx.defineSlideMaster({
    title: "TITLE_SLIDE",
    background: { color: COLORS.primary },
    objects: [],
  });

  pptx.defineSlideMaster({
    title: "CONTENT_SLIDE",
    background: { color: COLORS.white },
    objects: [
      // Header bar
      {
        rect: {
          x: 0,
          y: 0,
          w: "100%",
          h: 0.6,
          fill: { color: COLORS.primary },
        },
      },
    ],
  });

  // Slide 1: Title Slide
  const titleSlide = pptx.addSlide({ masterName: "TITLE_SLIDE" });
  titleSlide.addText(lessonContent.metadata.title, {
    x: 0.5,
    y: 2.0,
    w: "90%",
    h: 1.5,
    fontSize: 44,
    fontFace: "Calibri",
    color: COLORS.white,
    bold: true,
    align: "center",
  });

  titleSlide.addText(
    `Level: ${lessonContent.metadata.level} | ${lessonContent.metadata.estimatedMinutes} minutes`,
    {
      x: 0.5,
      y: 3.5,
      w: "90%",
      h: 0.5,
      fontSize: 18,
      fontFace: "Calibri",
      color: COLORS.white,
      align: "center",
    }
  );

  titleSlide.addText(lessonContent.metadata.topic, {
    x: 0.5,
    y: 4.0,
    w: "90%",
    h: 0.5,
    fontSize: 20,
    fontFace: "Calibri",
    color: COLORS.white,
    align: "center",
    italic: true,
  });

  // Slide 2: Learning Objectives
  if (lessonContent.content.learningObjectives.length > 0) {
    const objSlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });
    objSlide.addText("Learning Objectives", {
      x: 0.5,
      y: 0.1,
      w: "90%",
      h: 0.5,
      fontSize: 20,
      fontFace: "Calibri",
      color: COLORS.white,
      bold: true,
    });

    const objectives = lessonContent.content.learningObjectives.map((obj, i) => ({
      text: obj.objective,
      options: { bullet: { type: "number" as const }, indentLevel: 0 },
    }));

    objSlide.addText(objectives, {
      x: 0.5,
      y: 1.0,
      w: "90%",
      h: 4.0,
      fontSize: 18,
      fontFace: "Calibri",
      color: COLORS.black,
      lineSpacing: 28,
    });
  }

  // Slide 3: Introduction
  if (lessonContent.content.introduction?.content) {
    const introSlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });
    introSlide.addText("Introduction", {
      x: 0.5,
      y: 0.1,
      w: "90%",
      h: 0.5,
      fontSize: 20,
      fontFace: "Calibri",
      color: COLORS.white,
      bold: true,
    });

    // Clean markdown from content
    const cleanContent = lessonContent.content.introduction.content
      .replace(/[#*_`]/g, "")
      .trim();

    introSlide.addText(cleanContent, {
      x: 0.5,
      y: 1.0,
      w: "90%",
      h: 4.0,
      fontSize: 16,
      fontFace: "Calibri",
      color: COLORS.black,
      valign: "top",
    });
  }

  // Grammar Rules slides
  for (const rule of lessonContent.content.grammarRules) {
    const grammarSlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });

    grammarSlide.addText(`Grammar: ${rule.name}`, {
      x: 0.5,
      y: 0.1,
      w: "90%",
      h: 0.5,
      fontSize: 20,
      fontFace: "Calibri",
      color: COLORS.white,
      bold: true,
    });

    // Grammar box background
    grammarSlide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 0.9,
      w: 9,
      h: 2.0,
      fill: { color: COLORS.warning },
      line: { color: "FCD34D", width: 1 },
    });

    // Rule explanation
    const cleanRule = rule.rule.replace(/[#*_`]/g, "").trim();
    grammarSlide.addText(cleanRule, {
      x: 0.7,
      y: 1.0,
      w: 8.6,
      h: 0.8,
      fontSize: 14,
      fontFace: "Calibri",
      color: COLORS.warningText,
    });

    // Formula if present
    if (rule.formula) {
      grammarSlide.addText(rule.formula, {
        x: 0.7,
        y: 1.8,
        w: 8.6,
        h: 0.5,
        fontSize: 16,
        fontFace: "Courier New",
        color: COLORS.primary,
        bold: true,
      });
    }

    // Examples
    if (rule.examples.length > 0) {
      const exampleTexts = rule.examples.slice(0, 4).map((ex) => ({
        text: `${ex.correct}${ex.incorrect ? ` (Not: ${ex.incorrect})` : ""}`,
        options: { bullet: { type: "bullet" as const, code: "2713" }, indentLevel: 0 },
      }));

      grammarSlide.addText(exampleTexts, {
        x: 0.5,
        y: 3.2,
        w: 9,
        h: 2.0,
        fontSize: 14,
        fontFace: "Calibri",
        color: COLORS.black,
        lineSpacing: 22,
      });
    }
  }

  // Exercise slides
  for (let i = 0; i < lessonContent.content.exercises.length; i++) {
    const exercise = lessonContent.content.exercises[i];
    const exSlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });

    exSlide.addText(`Exercise ${i + 1}: ${exercise.title}`, {
      x: 0.5,
      y: 0.1,
      w: "90%",
      h: 0.5,
      fontSize: 20,
      fontFace: "Calibri",
      color: COLORS.white,
      bold: true,
    });

    // Instructions
    const cleanInstructions = exercise.instructions.replace(/[#*_`]/g, "").trim();
    exSlide.addText(cleanInstructions, {
      x: 0.5,
      y: 0.9,
      w: 9,
      h: 0.6,
      fontSize: 14,
      fontFace: "Calibri",
      color: COLORS.muted,
      italic: true,
    });

    // Exercise items (limit to first 5)
    const items = exercise.items.slice(0, 5).map((item, j) => ({
      text: `${j + 1}. ${item.question}`,
      options: { indentLevel: 0 },
    }));

    exSlide.addText(items, {
      x: 0.5,
      y: 1.6,
      w: 9,
      h: 3.5,
      fontSize: 16,
      fontFace: "Calibri",
      color: COLORS.black,
      lineSpacing: 28,
    });
  }

  // Vocabulary slide(s)
  if (lessonContent.content.vocabulary.length > 0) {
    const vocabChunks = chunkArray(lessonContent.content.vocabulary, 6);

    for (let chunkIndex = 0; chunkIndex < vocabChunks.length; chunkIndex++) {
      const vocabSlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });

      vocabSlide.addText(
        `Vocabulary${vocabChunks.length > 1 ? ` (${chunkIndex + 1}/${vocabChunks.length})` : ""}`,
        {
          x: 0.5,
          y: 0.1,
          w: "90%",
          h: 0.5,
          fontSize: 20,
          fontFace: "Calibri",
          color: COLORS.white,
          bold: true,
        }
      );

      // Create vocabulary table
      const tableRows: PptxGenJS.TableRow[] = [
        [
          { text: "English", options: { bold: true, fill: { color: COLORS.background } } },
          { text: "German", options: { bold: true, fill: { color: COLORS.background } } },
          { text: "Example", options: { bold: true, fill: { color: COLORS.background } } },
        ],
      ];

      for (const vocab of vocabChunks[chunkIndex]) {
        tableRows.push([
          { text: vocab.term, options: { bold: true } },
          { text: vocab.termDe },
          { text: vocab.exampleSentence || "", options: { fontSize: 11 } },
        ]);
      }

      vocabSlide.addTable(tableRows, {
        x: 0.5,
        y: 0.9,
        w: 9,
        h: 4.0,
        fontSize: 12,
        fontFace: "Calibri",
        color: COLORS.black,
        border: { type: "solid", color: "E5E7EB", pt: 1 },
        colW: [2.5, 2.5, 4],
        rowH: 0.5,
        valign: "middle",
      });
    }
  }

  // Summary slide
  if (lessonContent.content.summary?.content) {
    const summarySlide = pptx.addSlide({ masterName: "CONTENT_SLIDE" });

    summarySlide.addText("Summary", {
      x: 0.5,
      y: 0.1,
      w: "90%",
      h: 0.5,
      fontSize: 20,
      fontFace: "Calibri",
      color: COLORS.white,
      bold: true,
    });

    // Summary box
    summarySlide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 0.9,
      w: 9,
      h: 3.5,
      fill: { color: COLORS.background },
      line: { color: "E5E7EB", width: 1 },
    });

    const cleanSummary = lessonContent.content.summary.content.replace(/[#*_`]/g, "").trim();
    summarySlide.addText(cleanSummary, {
      x: 0.7,
      y: 1.1,
      w: 8.6,
      h: 3.1,
      fontSize: 16,
      fontFace: "Calibri",
      color: COLORS.black,
      valign: "top",
    });
  }

  // End slide
  const endSlide = pptx.addSlide({ masterName: "TITLE_SLIDE" });
  endSlide.addText("Thank You!", {
    x: 0.5,
    y: 2.0,
    w: "90%",
    h: 1.0,
    fontSize: 44,
    fontFace: "Calibri",
    color: COLORS.white,
    bold: true,
    align: "center",
  });

  endSlide.addText("Generated by Emma AI Platform", {
    x: 0.5,
    y: 3.2,
    w: "90%",
    h: 0.5,
    fontSize: 16,
    fontFace: "Calibri",
    color: COLORS.white,
    align: "center",
    italic: true,
  });

  // Generate PowerPoint file
  const pptxBuffer = await pptx.write({ outputType: "nodebuffer" });
  return pptxBuffer as Buffer;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json({ error: "Missing contentId" }, { status: 400 });
    }

    console.log("📊 PPTX Generation started for:", contentId);

    // Get content from Convex
    const content = await getConvex().query(api.knowledgeBases.getContentById, {
      contentId: contentId as Id<"knowledgeContent">,
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (!content.jsonContent) {
      return NextResponse.json(
        { error: "No structured content available for PPTX generation" },
        { status: 400 }
      );
    }

    const lessonContent = content.jsonContent as LessonContent;

    // Update status to generating
    await getConvex().mutation(api.knowledgeBases.updateProcessingStatus, {
      contentId: contentId as Id<"knowledgeContent">,
      status: "generating_pptx",
    });

    // Step 1: Generate PPTX
    console.log("🎨 Generating PPTX slides...");
    const pptxBuffer = await generatePptxFromContent(lessonContent);
    console.log(`✅ PPTX generated: ${pptxBuffer.length} bytes`);

    // Step 2: Upload PPTX to Convex storage
    const uploadUrl = await getConvex().mutation(api.knowledgeBases.generateUploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      },
      body: new Uint8Array(pptxBuffer),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const { storageId } = await uploadResponse.json();
    console.log("✅ PPTX uploaded to storage:", storageId);

    // Create slides array - one entry per slide (we need to estimate or count actual slides)
    const slideCount = estimateSlideCount(lessonContent);
    const slideContent = generateSlideContent(lessonContent);

    // Get the knowledge base to find the user who created it (optional)
    const knowledgeBase = await getConvex().query(api.knowledgeBases.getById, {
      id: content.knowledgeBaseId,
    });

    // Create the presentation via internal mutation (no auth required)
    // If no createdBy, the mutation will find an admin user as fallback
    const presentationId = await getConvex().mutation(api.presentations.createPresentationInternal, {
      name: lessonContent.metadata.title,
      originalFileName: `${lessonContent.metadata.title}.pptx`,
      originalFileType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      uploadedBy: knowledgeBase?.createdBy,
    });

    // Add slide to presentation (single slide representing entire PPTX)
    await getConvex().mutation(api.presentations.addSlideToPresentationInternal, {
      presentationId: presentationId as Id<"presentations">,
      slideIndex: 0,
      storageId: storageId as Id<"_storage">,
    });

    // Update slide content for avatar context
    await getConvex().mutation(api.presentations.updateSlideContent, {
      presentationId: presentationId as Id<"presentations">,
      slideContent: slideContent,
    });

    // Finalize presentation
    await getConvex().mutation(api.presentations.finalizePresentationInternal, {
      presentationId: presentationId as Id<"presentations">,
      totalSlides: slideCount,
    });

    // Step 4: Link presentation to knowledge content
    await getConvex().mutation(api.knowledgeBases.updatePresentationLink, {
      contentId: contentId as Id<"knowledgeContent">,
      presentationId: presentationId as Id<"presentations">,
    });

    console.log("✅ PPTX stored and linked to content");

    return NextResponse.json({
      success: true,
      presentationId,
      storageId,
      slideCount,
      size: pptxBuffer.length,
    });
  } catch (error) {
    console.error("PPTX generation error:", error);

    // Try to update status to failed
    try {
      const { contentId } = await request.json().catch(() => ({}));
      if (contentId) {
        await getConvex().mutation(api.knowledgeBases.updateProcessingStatus, {
          contentId: contentId as Id<"knowledgeContent">,
          status: "failed",
        });
      }
    } catch {
      // Ignore update failure
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PPTX generation failed" },
      { status: 500 }
    );
  }
}

function estimateSlideCount(lesson: LessonContent): number {
  let count = 1; // Title slide
  count += lesson.content.learningObjectives.length > 0 ? 1 : 0; // Objectives
  count += lesson.content.introduction?.content ? 1 : 0; // Introduction
  count += lesson.content.grammarRules.length; // One per grammar rule
  count += lesson.content.exercises.length; // One per exercise
  count += Math.ceil(lesson.content.vocabulary.length / 6); // Vocab slides (6 per slide)
  count += lesson.content.summary?.content ? 1 : 0; // Summary
  count += 1; // End slide
  return count;
}

function generateSlideContent(
  lesson: LessonContent
): { index: number; title?: string; bodyText?: string; speakerNotes?: string }[] {
  const slides: {
    index: number;
    title?: string;
    bodyText?: string;
    speakerNotes?: string;
  }[] = [];

  let index = 0;

  // Title slide
  slides.push({
    index: index++,
    title: lesson.metadata.title,
    bodyText: `Level: ${lesson.metadata.level} | ${lesson.metadata.estimatedMinutes} minutes | ${lesson.metadata.topic}`,
    speakerNotes: "Welcome to this lesson. Let's begin!",
  });

  // Learning objectives
  if (lesson.content.learningObjectives.length > 0) {
    slides.push({
      index: index++,
      title: "Learning Objectives",
      bodyText: lesson.content.learningObjectives.map((o) => o.objective).join("\n"),
      speakerNotes:
        "Today we will cover these learning objectives. Make sure to understand each one.",
    });
  }

  // Introduction
  if (lesson.content.introduction?.content) {
    slides.push({
      index: index++,
      title: "Introduction",
      bodyText: lesson.content.introduction.content.replace(/[#*_`]/g, ""),
      speakerNotes: "Let me introduce the topic to you.",
    });
  }

  // Grammar rules
  for (const rule of lesson.content.grammarRules) {
    slides.push({
      index: index++,
      title: `Grammar: ${rule.name}`,
      bodyText: `${rule.rule}\n\nExamples:\n${rule.examples.map((e) => `- ${e.correct}`).join("\n")}`,
      speakerNotes: rule.usageNotes || `This grammar rule about ${rule.name} is important for your level.`,
    });
  }

  // Exercises
  for (let i = 0; i < lesson.content.exercises.length; i++) {
    const ex = lesson.content.exercises[i];
    slides.push({
      index: index++,
      title: `Exercise ${i + 1}: ${ex.title}`,
      bodyText: `${ex.instructions}\n\n${ex.items.slice(0, 5).map((item, j) => `${j + 1}. ${item.question}`).join("\n")}`,
      speakerNotes: `Let's practice with this exercise. ${ex.instructions}`,
    });
  }

  // Vocabulary
  if (lesson.content.vocabulary.length > 0) {
    const vocabChunks = chunkArray(lesson.content.vocabulary, 6);
    for (let i = 0; i < vocabChunks.length; i++) {
      slides.push({
        index: index++,
        title: `Vocabulary${vocabChunks.length > 1 ? ` (${i + 1}/${vocabChunks.length})` : ""}`,
        bodyText: vocabChunks[i]
          .map((v) => `${v.term} - ${v.termDe}: ${v.exampleSentence || ""}`)
          .join("\n"),
        speakerNotes:
          "Let's learn these vocabulary words. Repeat after me and try to remember the German translation.",
      });
    }
  }

  // Summary
  if (lesson.content.summary?.content) {
    slides.push({
      index: index++,
      title: "Summary",
      bodyText: lesson.content.summary.content.replace(/[#*_`]/g, ""),
      speakerNotes: "Let's review what we learned today.",
    });
  }

  // End slide
  slides.push({
    index: index++,
    title: "Thank You!",
    bodyText: "Generated by Emma AI Platform",
    speakerNotes: "Great job today! Keep practicing and see you next time.",
  });

  return slides;
}
