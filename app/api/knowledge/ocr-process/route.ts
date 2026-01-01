import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LessonContent, lessonToMarkdown } from "@/lib/types/lesson-content";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const OCR_SERVER_URL = process.env.OCR_SERVER_URL || "http://localhost:8765";

// JSON schema for structured lesson output
const LESSON_SCHEMA = `{
  "version": "1.0",
  "metadata": {
    "title": "string (clear descriptive title)",
    "titleDe": "string (German translation)",
    "level": "A1|A2|B1|B2|C1|C2",
    "estimatedMinutes": number,
    "topic": "string",
    "subtopics": ["string"],
    "tags": ["string"],
    "createdAt": number (timestamp),
    "updatedAt": number (timestamp)
  },
  "content": {
    "learningObjectives": [
      { "id": "obj-1", "objective": "string", "objectiveDe": "string" }
    ],
    "introduction": {
      "id": "intro-1",
      "content": "string (markdown)",
      "contentDe": "string"
    },
    "sections": [
      {
        "id": "sec-1",
        "type": "content|grammar|vocabulary|dialogue|reading|listening",
        "title": "string",
        "titleDe": "string",
        "content": "string (markdown)",
        "contentDe": "string",
        "relatedExerciseIds": ["string"],
        "relatedGrammarIds": ["string"]
      }
    ],
    "vocabulary": [
      {
        "id": "vocab-1",
        "term": "string (English)",
        "termDe": "string (German)",
        "pronunciation": "string (IPA optional)",
        "partOfSpeech": "noun|verb|adjective|adverb|preposition|conjunction|phrase|idiom",
        "definition": "string",
        "definitionDe": "string",
        "exampleSentence": "string",
        "exampleSentenceDe": "string",
        "level": "A1|A2|B1|B2|C1|C2"
      }
    ],
    "grammarRules": [
      {
        "id": "gram-1",
        "name": "string",
        "nameDe": "string",
        "category": "tenses|modals|conditionals|articles|prepositions|word_order|passive|reported_speech|relative_clauses|other",
        "rule": "string (markdown explanation)",
        "ruleDe": "string",
        "formula": "string (e.g. 'Subject + have/has + past participle')",
        "examples": [
          { "correct": "string", "incorrect": "string", "explanation": "string", "explanationDe": "string" }
        ],
        "commonMistakes": [
          { "mistake": "string", "correction": "string", "explanation": "string" }
        ]
      }
    ],
    "exercises": [
      {
        "id": "ex-1",
        "type": "fill_blank|multiple_choice|matching|error_correction|sentence_completion|word_formation|open_ended|translation|reordering",
        "title": "string",
        "titleDe": "string",
        "instructions": "string",
        "instructionsDe": "string",
        "difficulty": 1|2|3,
        "items": [
          {
            "id": "item-1",
            "question": "string",
            "questionDe": "string",
            "options": ["string"] (for multiple choice),
            "correctAnswer": "string",
            "acceptableAnswers": ["string"],
            "explanation": "string",
            "hint": "string"
          }
        ],
        "relatedGrammarIds": ["gram-1"]
      }
    ],
    "summary": {
      "id": "summary-1",
      "content": "string (markdown)",
      "contentDe": "string"
    }
  }
}`;

// Create a brand new professional lesson using OCR as a guide
async function structureWithAI(rawText: string, documentType: string): Promise<LessonContent | null> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    console.log("No OPENROUTER_API_KEY, cannot structure content");
    return null;
  }

  console.log("🤖 Sending to Claude Sonnet 4.5 for professional lesson creation...");

  const systemPrompt = `You are a MASTER English language teacher and textbook author (Cambridge/Oxford level).

# YOUR MISSION
You will receive messy OCR text from a scanned document. Use this ONLY as a GUIDE to understand:
- What topic/grammar point is being taught
- What types of exercises are included
- What vocabulary or concepts are covered

Then CREATE A COMPLETELY NEW, PROFESSIONAL LESSON from scratch. Do NOT try to preserve or clean the OCR text - write everything fresh in your own words.

# WHAT YOU MUST CREATE

## 1. Professional Content
- Write clear, engaging explanations (not copied from OCR)
- Create proper grammar rule explanations with formulas
- Write example sentences that are natural and helpful
- All content must be publication-ready (Cambridge/Oxford quality)

## 2. Complete Exercises
- Recreate any exercises you detect in the source material
- Write clear instructions in professional language
- Provide ALL correct answers (infer if needed based on context)
- Add helpful explanations for each answer
- Include hints where appropriate

## 3. Grammar Rules
- Extract the grammar concept being taught
- Write a clear, structured explanation
- Include the grammatical formula (e.g., "Subject + modal + have + past participle")
- Provide correct/incorrect example pairs
- Note common mistakes students make

## 4. Vocabulary
- Identify key vocabulary from the lesson
- Provide German translations
- Write natural example sentences
- Include part of speech and any notes

## 5. Bilingual Support (German)
- Translate all learning objectives
- Translate exercise instructions
- Translate vocabulary terms and definitions
- Translate key explanations

# JSON OUTPUT REQUIREMENTS
- Output ONLY valid JSON (no markdown, no commentary)
- Every ID must be unique (obj-1, sec-1, vocab-1, gram-1, ex-1, item-1, etc.)
- Set timestamps to: ${Date.now()}
- Follow this exact schema:

${LESSON_SCHEMA}

# CRITICAL
- DO NOT copy garbled OCR text - write everything NEW
- Make the lesson BETTER than the original
- Every sentence must be grammatically perfect
- Output starts with { and ends with } - nothing else`;

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
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Here is OCR text from a scanned English lesson document. Use this as a REFERENCE to understand the topic and exercises, then CREATE A COMPLETELY NEW professional lesson in JSON format.

DO NOT copy or clean this text - write everything fresh based on what you understand the lesson is teaching.

---
REFERENCE MATERIAL (${documentType}):
${rawText}
---

Now create a brand new, professionally written lesson covering the same topic. Output ONLY the JSON object:`
          }
        ],
        max_tokens: 16000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI structuring failed:", response.status, error);
      return null;
    }

    const data = await response.json();
    let jsonText = data.choices?.[0]?.message?.content;

    if (!jsonText) {
      console.error("No content in AI response");
      return null;
    }

    // Clean up the response - remove any markdown code block markers
    jsonText = jsonText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    // Parse and validate JSON
    const lessonContent = JSON.parse(jsonText) as LessonContent;

    // Validate required fields
    if (!lessonContent.version || !lessonContent.metadata || !lessonContent.content) {
      console.error("Invalid lesson structure - missing required fields");
      return null;
    }

    console.log(`✅ Structured lesson extracted: "${lessonContent.metadata.title}"`);
    console.log(`   - ${lessonContent.content.exercises.length} exercises`);
    console.log(`   - ${lessonContent.content.vocabulary.length} vocabulary items`);
    console.log(`   - ${lessonContent.content.grammarRules.length} grammar rules`);

    return lessonContent;
  } catch (error) {
    console.error("AI structuring error:", error);
    return null;
  }
}

// Fallback: Create basic lesson structure from raw text
function createFallbackLesson(rawText: string, documentType: string): LessonContent {
  const now = Date.now();
  return {
    version: "1.0",
    metadata: {
      title: `Document: ${documentType}`,
      level: "B1",
      estimatedMinutes: 30,
      topic: documentType,
      subtopics: [],
      tags: ["ocr", "unstructured"],
      createdAt: now,
      updatedAt: now,
    },
    content: {
      learningObjectives: [],
      introduction: {
        id: "intro-1",
        content: "This lesson was extracted from a document but could not be fully structured.",
      },
      sections: [
        {
          id: "sec-1",
          type: "content",
          title: "Raw Content",
          content: rawText,
        },
      ],
      vocabulary: [],
      grammarRules: [],
      exercises: [],
    },
  };
}

// Call OCR server
async function extractWithOcr(fileUrl: string): Promise<string> {
  console.log("📸 Calling OCR server...");

  const formData = new FormData();
  formData.append("url", fileUrl);

  const response = await fetch(`${OCR_SERVER_URL}/ocr/url`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR server error: ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ OCR extracted ${result.wordCount} words`);
  return result.text || "";
}

export async function POST(request: NextRequest) {
  try {
    const { contentId, storageId, fileType } = await request.json();

    console.log("🔄 OCR Processing started:", { contentId, fileType });

    if (!contentId || !storageId) {
      return NextResponse.json(
        { error: "Missing contentId or storageId" },
        { status: 400 }
      );
    }

    // Get file URL from Convex storage
    const fileUrl = await convex.query(api.knowledgeBases.getFileUrl, {
      storageId: storageId as Id<"_storage">,
    });

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 }
      );
    }

    console.log("📥 File URL obtained, starting OCR...");

    // Update status: processing (OCR)
    await convex.mutation(api.knowledgeBases.updateProcessingStatus, {
      contentId: contentId as Id<"knowledgeContent">,
      status: "processing",
    });

    // Step 1: OCR extraction
    let rawText: string;
    try {
      rawText = await extractWithOcr(fileUrl);
    } catch (e) {
      console.error("OCR failed:", e);
      await convex.mutation(api.knowledgeBases.updateProcessingStatus, {
        contentId: contentId as Id<"knowledgeContent">,
        status: "failed",
      });
      return NextResponse.json(
        { error: "OCR extraction failed. Is the OCR server running?" },
        { status: 500 }
      );
    }

    if (!rawText || rawText.trim().length < 10) {
      await convex.mutation(api.knowledgeBases.updateProcessingStatus, {
        contentId: contentId as Id<"knowledgeContent">,
        status: "failed",
      });
      return NextResponse.json(
        { error: "OCR extracted no text from document" },
        { status: 400 }
      );
    }

    // Update status: structuring (AI)
    await convex.mutation(api.knowledgeBases.updateProcessingStatus, {
      contentId: contentId as Id<"knowledgeContent">,
      status: "structuring",
    });

    // Step 2: Structure with AI (outputs JSON)
    let lessonContent = await structureWithAI(rawText, fileType || "document");

    // Fallback if AI structuring fails
    if (!lessonContent) {
      console.log("⚠️ AI structuring failed, creating fallback structure");
      lessonContent = createFallbackLesson(rawText, fileType || "document");
    }

    // Step 3: Generate Markdown from structured JSON
    const markdown = lessonToMarkdown(lessonContent);

    // Step 4: Prepare metadata
    const metadata = {
      wordCount: markdown.split(/\s+/).length,
      usedOcr: true,
      aiCleaned: true,
      exerciseCount: lessonContent.content.exercises.length,
      vocabularyCount: lessonContent.content.vocabulary.length,
      grammarRuleCount: lessonContent.content.grammarRules.length,
      level: lessonContent.metadata.level,
    };

    // Step 5: Save to Convex (both JSON and Markdown)
    await convex.mutation(api.knowledgeBases.updateContentWithStructure, {
      contentId: contentId as Id<"knowledgeContent">,
      content: markdown,
      jsonContent: lessonContent,
      metadata,
      status: "completed",
    });

    console.log("✅ Processing complete:", metadata);

    // Step 6: Trigger async PDF generation (fire and forget)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/knowledge/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId }),
    }).catch((err) => {
      console.log("📄 PDF generation triggered (async):", err.message || "started");
    });

    return NextResponse.json({
      success: true,
      wordCount: metadata.wordCount,
      exerciseCount: metadata.exerciseCount,
      vocabularyCount: metadata.vocabularyCount,
      grammarRuleCount: metadata.grammarRuleCount,
      level: metadata.level,
      title: lessonContent.metadata.title,
      usedOcr: true,
      aiCleaned: true,
      preview: markdown.substring(0, 500) + "...",
    });
  } catch (error) {
    console.error("OCR processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
