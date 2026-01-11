import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-client";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LessonContent, lessonToMarkdown } from "@/lib/types/lesson-content";


// JSON schema for structured lesson output
const LESSON_SCHEMA = `{
  "version": "1.0",
  "metadata": {
    "title": "string",
    "titleDe": "string",
    "level": "A1|A2|B1|B2|C1|C2",
    "estimatedMinutes": number,
    "topic": "string",
    "subtopics": ["string"],
    "tags": ["string"],
    "createdAt": number,
    "updatedAt": number
  },
  "content": {
    "learningObjectives": [{ "id": "obj-1", "objective": "string", "objectiveDe": "string" }],
    "introduction": { "id": "intro-1", "content": "string", "contentDe": "string" },
    "sections": [{ "id": "sec-1", "type": "content|grammar|vocabulary", "title": "string", "content": "string" }],
    "vocabulary": [{ "id": "vocab-1", "term": "string", "termDe": "string", "definition": "string", "exampleSentence": "string" }],
    "grammarRules": [{ "id": "gram-1", "name": "string", "category": "string", "rule": "string", "formula": "string", "examples": [{ "correct": "string", "incorrect": "string", "explanation": "string" }] }],
    "exercises": [{ "id": "ex-1", "type": "fill_blank|multiple_choice|error_correction", "title": "string", "instructions": "string", "difficulty": 1|2|3, "items": [{ "id": "item-1", "question": "string", "correctAnswer": "string", "explanation": "string" }] }],
    "summary": { "id": "summary-1", "content": "string" }
  }
}`;

// Create a professional lesson from existing content
async function createLessonFromContent(existingContent: string): Promise<LessonContent | null> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    console.log("No OPENROUTER_API_KEY");
    return null;
  }

  console.log("🤖 Creating professional lesson with Claude Sonnet 4.5...");

  const systemPrompt = `You are a MASTER English language teacher and textbook author (Cambridge/Oxford level).

# YOUR MISSION
You will receive text from an English lesson (possibly messy from OCR). Use this as a REFERENCE to understand:
- What topic/grammar point is being taught
- What types of exercises are included
- What vocabulary or concepts are covered

Then CREATE A COMPLETELY NEW, PROFESSIONAL LESSON from scratch. Write everything fresh in clear, professional language.

# WHAT YOU MUST CREATE

## 1. Professional Content
- Write clear, engaging explanations
- Create proper grammar rule explanations with formulas
- Write natural, helpful example sentences
- All content must be Cambridge/Oxford textbook quality

## 2. Complete Exercises
- Recreate exercises you detect in the source
- Write clear instructions
- Provide ALL correct answers
- Add explanations for each answer
- Include hints where helpful

## 3. Grammar Rules
- Extract the grammar concept being taught
- Write a clear, structured explanation
- Include the grammatical formula
- Provide correct/incorrect example pairs
- Note common student mistakes

## 4. Vocabulary
- Identify key vocabulary
- Provide German translations
- Write natural example sentences

## 5. Bilingual Support
- Translate learning objectives to German
- Translate exercise instructions to German
- Translate vocabulary to German

# JSON OUTPUT
- Output ONLY valid JSON
- Every ID must be unique (obj-1, sec-1, vocab-1, gram-1, ex-1, item-1)
- Set timestamps to: ${Date.now()}
- Follow this schema:

${LESSON_SCHEMA}

# CRITICAL
- DO NOT copy the source text - write everything NEW
- Make the lesson BETTER than the original
- Every sentence must be grammatically perfect`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://beethoven.app",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here is text from an English lesson. Use this as a REFERENCE, then CREATE A COMPLETELY NEW professional lesson in JSON format.

DO NOT copy this text - write everything fresh based on what you understand the lesson is teaching.

---
SOURCE CONTENT:
${existingContent}
---

Create a brand new, professionally written lesson. Output ONLY the JSON object:`
          }
        ],
        max_tokens: 16000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI failed:", response.status, error);
      return null;
    }

    const data = await response.json();
    let jsonText = data.choices?.[0]?.message?.content;

    if (!jsonText) return null;

    // Clean up response
    jsonText = jsonText.trim();
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
    jsonText = jsonText.trim();

    const lessonContent = JSON.parse(jsonText) as LessonContent;

    if (!lessonContent.version || !lessonContent.metadata || !lessonContent.content) {
      console.error("Invalid lesson structure");
      return null;
    }

    console.log(`✅ Created lesson: "${lessonContent.metadata.title}"`);
    console.log(`   - ${lessonContent.content.exercises.length} exercises`);
    console.log(`   - ${lessonContent.content.vocabulary.length} vocabulary`);
    console.log(`   - ${lessonContent.content.grammarRules.length} grammar rules`);

    return lessonContent;
  } catch (error) {
    console.error("AI error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json({ error: "Missing contentId" }, { status: 400 });
    }

    console.log("🔄 Restructuring content:", contentId);

    // Get existing content
    const existingContent = await getConvex().query(api.knowledgeBases.getContentById, {
      contentId: contentId as Id<"knowledgeContent">,
    });

    if (!existingContent?.content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Update status
    await getConvex().mutation(api.knowledgeBases.updateProcessingStatus, {
      contentId: contentId as Id<"knowledgeContent">,
      status: "structuring",
    });

    // Create structured lesson
    const lessonContent = await createLessonFromContent(existingContent.content);

    if (!lessonContent) {
      await getConvex().mutation(api.knowledgeBases.updateProcessingStatus, {
        contentId: contentId as Id<"knowledgeContent">,
        status: "failed",
      });
      return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
    }

    // Generate markdown
    const markdown = lessonToMarkdown(lessonContent);

    // Save to Convex
    const metadata = {
      wordCount: markdown.split(/\s+/).length,
      usedOcr: false,
      aiCleaned: true,
      exerciseCount: lessonContent.content.exercises.length,
      vocabularyCount: lessonContent.content.vocabulary.length,
      grammarRuleCount: lessonContent.content.grammarRules.length,
      level: lessonContent.metadata.level,
    };

    await getConvex().mutation(api.knowledgeBases.updateContentWithStructure, {
      contentId: contentId as Id<"knowledgeContent">,
      content: markdown,
      jsonContent: lessonContent,
      metadata,
      status: "completed",
    });

    console.log("✅ Restructuring complete");

    // Generate PDF and HTML slides
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Trigger PDF generation (fire-and-forget with logging)
    fetch(`${baseUrl}/api/knowledge/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId }),
    }).then(res => {
      if (res.ok) console.log("✅ PDF generation triggered");
      else console.error("❌ PDF generation failed:", res.status);
    }).catch(err => console.error("❌ PDF generation error:", err));

    // Trigger HTML slides generation (await to ensure it completes)
    try {
      const htmlRes = await fetch(`${baseUrl}/api/knowledge/generate-html-slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });

      if (htmlRes.ok) {
        const htmlResult = await htmlRes.json();
        console.log(`✅ HTML slides generated: ${htmlResult.slideCount} slides`);
      } else {
        const errorText = await htmlRes.text();
        console.error("❌ HTML slides generation failed:", htmlRes.status, errorText);
      }
    } catch (err) {
      console.error("❌ HTML slides generation error:", err);
    }

    return NextResponse.json({
      success: true,
      title: lessonContent.metadata.title,
      exerciseCount: metadata.exerciseCount,
      vocabularyCount: metadata.vocabularyCount,
      grammarRuleCount: metadata.grammarRuleCount,
      level: metadata.level,
    });
  } catch (error) {
    console.error("Restructure error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
