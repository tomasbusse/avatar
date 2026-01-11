import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-client";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";
import {
  WorksheetContent,
  WorksheetSection,
  WorksheetCategory,
  DEFAULT_WORKSHEET_DESIGN,
  createEmptyWorksheet,
} from "@/lib/types/worksheet-content";
import type { CEFRLevel } from "@/lib/types/lesson-content";
import { SLS_COLORS } from "@/lib/brand-colors";

// JSON schema for worksheet output
const WORKSHEET_SCHEMA = `{
  "version": "1.0",
  "metadata": {
    "title": "string (clear descriptive title for the worksheet)",
    "titleDe": "string (German translation)",
    "level": "A1|A2|B1|B2|C1|C2",
    "estimatedMinutes": number,
    "category": "grammar|vocabulary|reading|writing|listening|speaking|mixed",
    "topic": "string",
    "subtopics": ["string"],
    "tags": ["string"],
    "createdAt": number,
    "updatedAt": number
  },
  "design": {
    "theme": "sls-brand",
    "colors": {
      "primary": "${SLS_COLORS.teal}",
      "secondary": "${SLS_COLORS.olive}",
      "accent": "${SLS_COLORS.chartreuse}",
      "action": "${SLS_COLORS.orange}",
      "background": "${SLS_COLORS.beige}",
      "backgroundAlt": "${SLS_COLORS.cream}",
      "text": "#1a1a1a",
      "textMuted": "#6b7280"
    },
    "fonts": { "heading": "Merriweather", "body": "Inter", "headingSize": 24, "bodySize": 12 },
    "pageSize": "A4",
    "margins": { "top": 20, "right": 15, "bottom": 25, "left": 15 }
  },
  "content": {
    "header": {
      "id": "header-1",
      "showTitle": true,
      "showLevel": true,
      "showInstructions": boolean,
      "instructions": "string (optional general instructions)",
      "instructionsDe": "string",
      "studentNameField": true,
      "dateField": true,
      "scoreField": true
    },
    "sections": [
      {
        "id": "sec-1",
        "type": "instructions|content|exercise|vocabulary|grammar|reading|writing|divider|spacer",
        "title": "string",
        "titleDe": "string",
        "content": "string (markdown/HTML for content sections)",
        "contentDe": "string",
        "exercise": {
          "type": "fill_blank|multiple_choice|matching|error_correction|sentence_completion|word_formation|open_ended|translation|reordering",
          "instructions": "string",
          "instructionsDe": "string",
          "points": number,
          "items": [
            {
              "id": "item-1",
              "question": "string (use ___ or [blank] for fill-in-blank)",
              "questionDe": "string",
              "options": ["string"] (for multiple choice only),
              "correctAnswer": "string",
              "acceptableAnswers": ["string"],
              "explanation": "string",
              "hint": "string"
            }
          ],
          "showNumbering": true,
          "showAnswerLines": true,
          "answerLineLength": 100,
          "columnsCount": 1|2|3,
          "showPointsPerItem": false
        },
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
        "grammarRule": {
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
      }
    ],
    "footer": {
      "id": "footer-1",
      "showPageNumbers": true,
      "showTotalScore": true,
      "totalPoints": number (sum of all exercise points),
      "customText": "string (optional)"
    }
  }
}`;

/**
 * Structure raw OCR text into WorksheetContent using Claude Opus 4.5
 */
async function structureWithClaude(
  rawText: string,
  category: WorksheetCategory,
  level: CEFRLevel,
  existingTitle?: string
): Promise<WorksheetContent | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error("No ANTHROPIC_API_KEY, cannot structure content");
    return null;
  }

  console.log("🤖 Sending to Claude Opus 4.5 for worksheet structuring...");

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const systemPrompt = `You are a MASTER English language teacher and worksheet designer.

# YOUR MISSION
You will receive OCR text from a scanned worksheet or educational document. Your job is to:
1. UNDERSTAND what the original document was teaching
2. RECREATE the exercises accurately (preserve the original exercise structure)
3. FILL IN the correct answers based on context
4. FORMAT everything into a clean, professional JSON structure

# CRITICAL REQUIREMENTS

## 1. Preserve Original Content
- Keep the SAME exercises as in the original document
- Preserve exercise instructions, question ordering, and structure
- If it's a fill-in-the-blank exercise, keep it as fill_blank
- If it's multiple choice, keep it as multiple_choice

## 2. Provide ALL Answers
- Every exercise item MUST have a correctAnswer
- For fill-in-blank: provide the correct word/phrase
- For multiple choice: indicate which option is correct
- Infer answers from context, grammar rules, or teaching patterns

## 3. German Translations
This is for German speakers learning English. Add German translations:
- Exercise instructions (instructionsDe)
- Vocabulary terms (termDe)
- Question context where helpful (questionDe)

## 4. SLS Brand Styling
Use these exact colors in the design:
- Primary (headers): ${SLS_COLORS.teal}
- Secondary (muted): ${SLS_COLORS.olive}
- Accent (highlights): ${SLS_COLORS.chartreuse}
- Action (grammar boxes): ${SLS_COLORS.orange}
- Background: ${SLS_COLORS.beige}
- BackgroundAlt: ${SLS_COLORS.cream}

## 5. Exercise Types
Map exercises to these types:
- fill_blank: Sentences with blanks to fill (use ___ in question text)
- multiple_choice: Questions with A/B/C/D options
- matching: Connect items from two columns
- error_correction: Find and fix grammar mistakes
- sentence_completion: Complete the sentence
- word_formation: Change word form (verb→noun, etc.)
- open_ended: Free-form written answers
- translation: Translate between languages
- reordering: Put words/sentences in order

## 6. Section Organization
Organize content into logical sections:
- "instructions" for general worksheet instructions
- "grammar" for grammar rule explanations with formula
- "vocabulary" for vocabulary tables
- "exercise" for practice activities
- "content" for reading passages or general text
- "divider" to separate major sections

# OUTPUT FORMAT
Output ONLY valid JSON following this schema:

${WORKSHEET_SCHEMA}

# IMPORTANT
- Output starts with { and ends with } - nothing else
- All IDs must be unique (sec-1, ex-1, item-1, vocab-1, etc.)
- Set timestamps to: ${Date.now()}
- Calculate totalPoints as sum of all exercise points
- Every correctAnswer must be filled in`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: `Here is OCR text from a scanned English learning worksheet. Structure it into the JSON format for editable worksheets.

DOCUMENT INFO:
- Category: ${category}
- Level: ${level}
${existingTitle ? `- Title: ${existingTitle}` : ""}

---
RAW OCR TEXT:
${rawText}
---

Now create the structured worksheet JSON. Preserve all exercises from the original, provide correct answers, and add German translations. Output ONLY the JSON object:`,
        },
      ],
      system: systemPrompt,
    });

    let jsonText =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (!jsonText) {
      console.error("No content in Claude response");
      return null;
    }

    // Clean up response - remove markdown code block markers
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
    const worksheetContent = JSON.parse(jsonText) as WorksheetContent;

    // Validate required fields
    if (
      !worksheetContent.version ||
      !worksheetContent.metadata ||
      !worksheetContent.content
    ) {
      console.error("Invalid worksheet structure - missing required fields");
      return null;
    }

    // Ensure design defaults are applied
    if (!worksheetContent.design) {
      worksheetContent.design = DEFAULT_WORKSHEET_DESIGN;
    }

    // Count stats
    const exerciseCount = worksheetContent.content.sections.filter(
      (s) => s.type === "exercise"
    ).length;
    const vocabCount = worksheetContent.content.sections
      .filter((s) => s.vocabulary)
      .reduce((sum, s) => sum + (s.vocabulary?.length || 0), 0);
    const grammarCount = worksheetContent.content.sections.filter(
      (s) => s.grammarRule
    ).length;

    console.log(
      `✅ Structured worksheet: "${worksheetContent.metadata.title}"`
    );
    console.log(`   - ${exerciseCount} exercises`);
    console.log(`   - ${vocabCount} vocabulary items`);
    console.log(`   - ${grammarCount} grammar rules`);

    return worksheetContent;
  } catch (error) {
    console.error("Claude structuring error:", error);
    return null;
  }
}

/**
 * Create fallback worksheet when AI structuring fails
 * Attempts to parse the OCR text into a structured format
 */
function createFallbackWorksheet(
  rawText: string,
  category: WorksheetCategory,
  level: CEFRLevel,
  title?: string
): WorksheetContent {
  const now = Date.now();
  const worksheet = createEmptyWorksheet(
    title || "Imported Worksheet",
    level,
    category
  );

  // Parse the raw text into sections
  const sections: WorksheetSection[] = [];
  let sectionCounter = 1;
  let itemCounter = 1;

  // Split by common section delimiters (Unit, Exercise, etc.)
  const lines = rawText.split("\n").filter((l) => l.trim());

  // Look for numbered exercises or sentences with blanks
  const exerciseItems: Array<{ id: string; question: string; correctAnswer: string }> = [];
  let currentContent: string[] = [];
  let foundExercises = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if line looks like an exercise item (starts with number or has blanks)
    const isNumberedItem = /^\d+[\.\)]\s/.test(trimmedLine);
    const hasBlank = /_{2,}|\.\.\.|\.{3,}|\[.*?\]/.test(trimmedLine);

    if (isNumberedItem || hasBlank) {
      foundExercises = true;
      // Convert various blank patterns to standard ___
      let question = trimmedLine
        .replace(/^\d+[\.\)]\s*/, "") // Remove leading number
        .replace(/_{2,}/g, "___") // Normalize underscores
        .replace(/\.{3,}/g, "___") // Convert ... to ___
        .replace(/\.\.\./g, "___");

      exerciseItems.push({
        id: `item-${itemCounter++}`,
        question,
        correctAnswer: "", // User will fill this in
      });
    } else if (trimmedLine.length > 5) {
      currentContent.push(trimmedLine);
    }
  }

  // If we found exercises, create an exercise section
  if (exerciseItems.length > 0) {
    // Add any intro content first
    if (currentContent.length > 0) {
      sections.push({
        id: `sec-${sectionCounter++}`,
        type: "instructions",
        title: "Instructions",
        content: currentContent.slice(0, 5).join("\n"),
      });
    }

    sections.push({
      id: `sec-${sectionCounter++}`,
      type: "exercise",
      title: title || "Exercise",
      exercise: {
        type: "fill_blank",
        instructions: "Complete the sentences with the correct words.",
        instructionsDe: "Vervollständigen Sie die Sätze mit den richtigen Wörtern.",
        points: exerciseItems.length,
        items: exerciseItems,
        showNumbering: true,
        showAnswerLines: true,
        answerLineLength: 100,
      },
    });
  } else {
    // No exercises found - create a content section with the raw text
    // Format it nicely with paragraphs
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim().replace(/\n/g, " ")}</p>`)
      .join("\n");

    sections.push({
      id: `sec-${sectionCounter++}`,
      type: "content",
      title: "Content",
      titleDe: "Inhalt",
      content: paragraphs || `<p>${rawText}</p>`,
    });
  }

  worksheet.content.sections = sections;
  worksheet.metadata.createdAt = now;
  worksheet.metadata.updatedAt = now;

  // Set total points in footer
  const totalPoints = sections
    .filter((s) => s.exercise)
    .reduce((sum, s) => sum + (s.exercise?.points || 0), 0);

  if (worksheet.content.footer) {
    worksheet.content.footer.totalPoints = totalPoints;
  }

  return worksheet;
}

export async function POST(request: NextRequest) {
  try {
    const { worksheetId, rawText, category, level } = await request.json();

    console.log("🔄 AI Structuring started for worksheet:", worksheetId);

    if (!worksheetId || !rawText) {
      return NextResponse.json(
        { error: "Missing worksheetId or rawText" },
        { status: 400 }
      );
    }

    // Get worksheet to get title
    const worksheet = await getConvex().query(api.pdfWorksheets.getWorksheet, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
    });

    if (!worksheet) {
      return NextResponse.json(
        { error: "Worksheet not found" },
        { status: 404 }
      );
    }

    // Update processing stage to ai_structuring
    await getConvex().mutation(api.pdfWorksheets.updateProcessingStage, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
      processingStage: "ai_structuring",
    });

    // Structure with Claude
    let worksheetContent = await structureWithClaude(
      rawText,
      (category || worksheet.category || "mixed") as WorksheetCategory,
      (level || worksheet.cefrLevel || "B1") as CEFRLevel,
      worksheet.title
    );

    // Fallback if Claude fails
    if (!worksheetContent) {
      console.log("⚠️ Claude structuring failed, creating fallback structure");
      worksheetContent = createFallbackWorksheet(
        rawText,
        (category || worksheet.category || "mixed") as WorksheetCategory,
        (level || worksheet.cefrLevel || "B1") as CEFRLevel,
        worksheet.title
      );
    }

    // Save structured content
    await getConvex().mutation(api.pdfWorksheets.saveJsonContent, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
      jsonContent: worksheetContent,
    });

    // Calculate stats
    const exerciseCount = worksheetContent.content.sections.filter(
      (s) => s.type === "exercise"
    ).length;
    const vocabCount = worksheetContent.content.sections
      .filter((s) => s.vocabulary)
      .reduce((sum, s) => sum + (s.vocabulary?.length || 0), 0);
    const grammarCount = worksheetContent.content.sections.filter(
      (s) => s.grammarRule
    ).length;
    const totalPoints =
      worksheetContent.content.footer?.totalPoints ||
      worksheetContent.content.sections
        .filter((s) => s.exercise)
        .reduce((sum, s) => sum + (s.exercise?.points || 0), 0);

    console.log("✅ AI structuring complete");

    return NextResponse.json({
      success: true,
      title: worksheetContent.metadata.title,
      exerciseCount,
      vocabCount,
      grammarCount,
      totalPoints,
      level: worksheetContent.metadata.level,
      category: worksheetContent.metadata.category,
    });
  } catch (error) {
    console.error("AI structuring error:", error);

    // Try to mark as failed
    try {
      const { worksheetId } = await request.json();
      if (worksheetId) {
        await getConvex().mutation(api.pdfWorksheets.updateProcessingStage, {
          worksheetId: worksheetId as Id<"pdfWorksheets">,
          processingStage: "failed",
          processingError:
            error instanceof Error ? error.message : "AI structuring failed",
        });
      }
    } catch {
      // Ignore secondary error
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "AI structuring failed",
      },
      { status: 500 }
    );
  }
}
