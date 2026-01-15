import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GameType, CEFRLevel, GameCategory } from "@/types/word-games";
import { LessonContent } from "@/lib/types/lesson-content";
import { CEFR_GUIDELINES } from "@/lib/game-generation/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

const getConvex = () => getConvexClient();

// Available game templates for knowledge-based generation
const GAME_TEMPLATES = [
  {
    type: "matching_pairs" as GameType,
    name: "Matching Pairs",
    description: "Match vocabulary terms to definitions or translations",
    icon: "🔗",
    bestFor: ["vocabulary", "signal words", "translations"],
  },
  {
    type: "fill_in_blank" as GameType,
    name: "Fill in the Blank",
    description: "Complete sentences with the correct word or phrase",
    icon: "✏️",
    bestFor: ["grammar rules", "usage patterns"],
  },
  {
    type: "multiple_choice" as GameType,
    name: "Multiple Choice",
    description: "Select the correct answer from options",
    icon: "📝",
    bestFor: ["grammar rules", "error correction", "usage"],
  },
  {
    type: "hangman" as GameType,
    name: "Hangman",
    description: "Guess letters to reveal vocabulary words",
    icon: "🎯",
    bestFor: ["vocabulary", "signal words"],
  },
  {
    type: "word_scramble" as GameType,
    name: "Word Scramble",
    description: "Unscramble letters to form words",
    icon: "🔤",
    bestFor: ["vocabulary", "signal words"],
  },
  {
    type: "flashcards" as GameType,
    name: "Flashcards",
    description: "Study terms with flip cards",
    icon: "📚",
    bestFor: ["vocabulary", "grammar rules"],
  },
  {
    type: "sentence_builder" as GameType,
    name: "Sentence Builder",
    description: "Arrange words to form correct sentences",
    icon: "🧱",
    bestFor: ["grammar rules", "word order"],
  },
  {
    type: "word_ordering" as GameType,
    name: "Word Ordering",
    description: "Put scrambled words in the correct order",
    icon: "📋",
    bestFor: ["grammar rules", "sentence structure"],
  },
] as const;

interface GenerateFromKnowledgeRequest {
  contentId: string;
  gameType: GameType;
  itemCount?: number;
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = (await request.json()) as GenerateFromKnowledgeRequest;
    const { contentId, gameType, itemCount = 8, model = "anthropic/claude-3-5-sonnet" } = body;

    if (!contentId || !gameType) {
      return NextResponse.json(
        { success: false, error: "Missing contentId or gameType" },
        { status: 400 }
      );
    }

    // 3. Fetch knowledge content
    const content = await getConvex().query(api.knowledgeBases.getContentById, {
      contentId: contentId as Id<"knowledgeContent">,
    });

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Knowledge content not found" },
        { status: 404 }
      );
    }

    if (!content.jsonContent) {
      return NextResponse.json(
        { success: false, error: "No structured content available for game generation" },
        { status: 400 }
      );
    }

    const lessonContent = content.jsonContent as LessonContent;

    // Build metadata from whatever is available in the jsonContent or content record
    const effectiveMetadata = {
      level: lessonContent.metadata?.level || (content.metadata as any)?.level || "A2",
      title: lessonContent.metadata?.title || content.title || "Knowledge Content",
      topic: lessonContent.metadata?.topic || content.title || "English",
      tags: lessonContent.metadata?.tags || [],
    };

    console.log(`📎 Generating ${gameType} game from knowledge: ${content.title} (level: ${effectiveMetadata.level})`);

    // 4. Build prompt based on game type and knowledge content
    const prompt = buildPromptFromKnowledge(gameType, lessonContent, itemCount);

    // 5. Call OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Beethoven AI Game Generator from Knowledge",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("OpenRouter error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to generate game content" },
        { status: 500 }
      );
    }

    const responseData = await openRouterResponse.json();
    const rawContent = responseData.choices?.[0]?.message?.content || "";
    console.log("[Game from Knowledge] Raw content length:", rawContent.length);

    // 6. Parse generated content
    const parsedContent = parseGeneratedJSON(rawContent);
    if (!parsedContent) {
      console.error("[Game from Knowledge] Failed to parse JSON:", rawContent.slice(0, 500));
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const data = parsedContent as Record<string, unknown>;

    // 7. Look up the Convex user by Clerk ID
    const convexUser = await getConvex().query(api.users.getUserByClerkId, {
      clerkId: userId,
    });

    if (!convexUser) {
      return NextResponse.json(
        { success: false, error: "User not found in database. Please try logging out and back in." },
        { status: 404 }
      );
    }

    // 8. Create the game in Convex
    const gameTitle = (data.title as string) || effectiveMetadata.title;
    const slug = generateSlug(gameTitle);

    const gameId = await getConvex().mutation(api.wordGames.createGame, {
      title: `${gameTitle} - ${gameType}`,
      slug,
      description: `Generated from knowledge base: ${content.title}`,
      instructions: (data.instructions as string) || "Complete the game to practice what you learned.",
      type: gameType,
      category: (data.category as GameCategory) || determineCategory(gameType, lessonContent),
      level: effectiveMetadata.level as CEFRLevel,
      tags: [effectiveMetadata.topic, "knowledge-generated", ...effectiveMetadata.tags],
      config: normalizeConfig(data.config),
      hints: Array.isArray(data.hints) ? (data.hints as string[]) : [],
      difficultyConfig: {
        hintsAvailable: 3,
        distractorDifficulty: "medium" as const,
        timeMultiplier: 1.0,
      },
      status: "draft" as const,
      createdBy: convexUser._id,
    });

    console.log(`✅ Game created: ${gameId}`);

    // 8. Link game to knowledge content (optional - for tracking)
    // This could be added later for better tracking

    return NextResponse.json({
      success: true,
      gameId,
      title: gameTitle,
      type: gameType,
      level: effectiveMetadata.level,
    });

  } catch (error) {
    console.error("Game from knowledge error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// Build a prompt tailored to the game type using knowledge content
function buildPromptFromKnowledge(
  gameType: GameType,
  lesson: LessonContent,
  itemCount: number
): string {
  const level = lesson.metadata?.level || "A2";
  const title = lesson.metadata?.title || "English Lesson";

  // Extract relevant content based on game type
  const vocabulary = lesson.content?.vocabulary || [];
  const grammarRules = lesson.content?.grammarRules || [];
  const exercises = lesson.content?.exercises || [];

  const basePrompt = `You are an expert English language teacher creating educational games.

${CEFR_GUIDELINES}

You are creating a ${gameType.replace(/_/g, " ")} game based on this educational content:

TOPIC: ${title}
LEVEL: ${level}
ESTIMATED TIME: ${lesson.metadata.estimatedMinutes} minutes

LEARNING OBJECTIVES:
${lesson.content.learningObjectives.map(o => `- ${o.objective}`).join("\n")}

${vocabulary.length > 0 ? `
VOCABULARY (${vocabulary.length} terms):
${vocabulary.map(v => `- ${v.term} (${v.termDe}): ${v.definition}`).join("\n")}
` : ""}

${grammarRules.length > 0 ? `
GRAMMAR RULES (${grammarRules.length} rules):
${grammarRules.map(r => `
- ${r.name}: ${r.rule}
  Examples: ${r.examples.map(e => e.correct).join(", ")}
  ${r.commonMistakes ? `Common mistakes: ${r.commonMistakes.map(m => `${m.mistake} → ${m.correction}`).join(", ")}` : ""}
`).join("\n")}
` : ""}

${exercises.length > 0 ? `
EXISTING EXERCISES FOR REFERENCE:
${exercises.slice(0, 2).map(e => `
- Type: ${e.type}
  Instructions: ${e.instructions}
  Sample items: ${e.items.slice(0, 3).map(i => i.question).join("; ")}
`).join("\n")}
` : ""}

IMPORTANT: You MUST respond with valid JSON only. No explanations or text outside the JSON.
`;

  // Game-type specific instructions
  switch (gameType) {
    case "matching_pairs":
      return `${basePrompt}
Create a Matching Pairs game using the vocabulary and concepts from this content.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Match each term with its correct definition or translation.",
  "config": {
    "type": "matching_pairs",
    "pairs": [
      { "id": "pair1", "left": { "text": "English term" }, "right": { "text": "German translation or definition" } }
    ],
    "matchType": "translation",
    "timeLimit": 180
  },
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "category": "vocabulary"
}

REQUIREMENTS:
- Create ${itemCount} pairs using vocabulary/concepts from the content
- If vocabulary has German translations, use matchType "translation"
- If no translations, use matchType "definition"
- All content must match the ${level} CEFR level`;

    case "fill_in_blank":
      return `${basePrompt}
Create a Fill in the Blank game using the grammar rules and examples from this content.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Choose the correct word to complete each sentence.",
  "config": {
    "type": "fill_in_blank",
    "items": [
      {
        "id": "item1",
        "sentence": "The sentence with _____ blank",
        "blankIndex": 4,
        "correctAnswer": "correct word",
        "options": ["option1", "option2", "correct word", "option3"],
        "explanation": "Brief explanation"
      }
    ]
  },
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "category": "grammar"
}

REQUIREMENTS:
- Create ${itemCount} fill-in-blank items based on the grammar rules
- Use common mistakes from the content as distractor options
- blankIndex is the 0-based position of the blank in the sentence (count words)
- Include exactly 4 options per item
- Explanations should reference the grammar rules`;

    case "multiple_choice":
      return `${basePrompt}
Create a Multiple Choice quiz using the grammar rules and common mistakes from this content.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Select the correct answer for each question.",
  "config": {
    "type": "multiple_choice",
    "items": [
      {
        "id": "item1",
        "question": "The question about grammar or vocabulary",
        "questionType": "grammar",
        "options": [
          { "id": "item1_opt1", "text": "Option A", "isCorrect": false },
          { "id": "item1_opt2", "text": "Option B", "isCorrect": true },
          { "id": "item1_opt3", "text": "Option C", "isCorrect": false },
          { "id": "item1_opt4", "text": "Option D", "isCorrect": false }
        ],
        "explanation": "Brief explanation of why the answer is correct"
      }
    ],
    "allowMultipleSelect": false
  },
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "category": "grammar"
}

REQUIREMENTS:
- Create ${itemCount} questions based on the grammar rules and common mistakes
- questionType: "grammar" for grammar questions, "error" for error identification
- Include exactly 4 options, one correct
- Use common German speaker mistakes as distractors`;

    case "hangman":
      return `${basePrompt}
Create a Hangman game using the vocabulary from this content.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Guess the letters to reveal the word.",
  "config": {
    "type": "hangman",
    "items": [
      {
        "id": "item1",
        "word": "VOCABULARY",
        "hint": "A helpful hint about the word",
        "maxMistakes": 6
      }
    ],
    "showCategoryHint": true
  },
  "hints": ["All words are related to the topic", "Think about common patterns"],
  "category": "vocabulary"
}

REQUIREMENTS:
- Create ${itemCount} words from the vocabulary list
- Words must be UPPERCASE
- maxMistakes: 6 for long words (8+), 5 for medium (5-7), 4 for short (≤4)
- Hints should help identify the word without being too obvious`;

    case "word_scramble":
      return `${basePrompt}
Create a Word Scramble game using the vocabulary from this content.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Unscramble the letters to form the correct word.",
  "config": {
    "type": "word_scramble",
    "items": [
      {
        "id": "item1",
        "correctWord": "example",
        "scrambledLetters": ["x", "a", "e", "l", "p", "m", "e"],
        "hint": "A sample that represents others"
      }
    ]
  },
  "hints": ["Think about the topic", "Look for common letter patterns"],
  "category": "vocabulary"
}

REQUIREMENTS:
- Create ${itemCount} words from the vocabulary
- scrambledLetters must contain exactly the letters from correctWord (scrambled)
- correctWord should be lowercase
- Hints should help identify the word`;

    case "flashcards":
      return `${basePrompt}
Create Flashcards using the vocabulary and grammar rules from this content.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Study each card. Click to flip and see the definition.",
  "config": {
    "type": "flashcards",
    "cards": [
      {
        "id": "card1",
        "front": { "text": "Term or concept" },
        "back": { "text": "Definition or explanation", "example": "Example sentence" }
      }
    ],
    "shuffleCards": true,
    "repeatMissed": true
  },
  "hints": ["Take your time", "Try to recall before flipping"],
  "category": "vocabulary"
}

REQUIREMENTS:
- Create ${itemCount} cards from vocabulary and key grammar concepts
- Include example sentences where available
- Mix vocabulary terms and grammar rules`;

    case "sentence_builder":
      return `${basePrompt}
Create a Sentence Builder game using the grammar rules from this content.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Drag the word blocks into the correct order to form a sentence.",
  "config": {
    "type": "sentence_builder",
    "mode": "one_per_slide",
    "items": [
      {
        "id": "item1",
        "targetSentence": "The complete correct sentence",
        "availableBlocks": [
          { "id": "item1_b1", "text": "The", "category": "subject" },
          { "id": "item1_b2", "text": "complete", "category": "main" }
        ],
        "distractorBlocks": [
          { "id": "item1_d1", "text": "wrong", "category": "main" }
        ],
        "explanation": "Explanation of the grammar point"
      }
    ]
  },
  "hints": ["Think about word order", "Check the grammar rule"],
  "category": "grammar"
}

REQUIREMENTS:
- Create ${itemCount} sentences demonstrating the grammar rules
- Include 1-2 distractor blocks per sentence (common mistakes)
- Categories: subject, aux, modal, main, negation, object, time, connector
- targetSentence should NOT include punctuation`;

    case "word_ordering":
      return `${basePrompt}
Create a Word Ordering game using examples from this content.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Put the words in the correct order to form a sentence.",
  "config": {
    "type": "word_ordering",
    "items": [
      {
        "id": "item1",
        "correctSentence": "The correct sentence in proper order",
        "scrambledWords": ["in", "sentence", "The", "correct", "proper", "order"]
      }
    ]
  },
  "hints": ["Think about sentence structure", "Remember subject-verb-object order"],
  "category": "grammar"
}

REQUIREMENTS:
- Create ${itemCount} sentences from the grammar examples
- scrambledWords must contain all words from correctSentence (scrambled)
- Focus on sentences that demonstrate the grammar rules`;

    default:
      return `${basePrompt}
Create a ${gameType.replace(/_/g, " ")} game using the content above.
Create ${itemCount} items appropriate for the ${level} level.
Return valid JSON with title, instructions, config, hints, and category.`;
  }
}

function parseGeneratedJSON(rawContent: string): unknown | null {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(rawContent);
  } catch {
    // Continue
  }

  // Strategy 2: Extract from markdown
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Strategy 3: Find JSON boundaries
  const jsonStart = rawContent.indexOf("{");
  const jsonEnd = rawContent.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      return JSON.parse(rawContent.slice(jsonStart, jsonEnd + 1));
    } catch {
      // Continue
    }
  }

  return null;
}

function normalizeConfig(config: unknown): Record<string, unknown> {
  const c = (config || {}) as Record<string, unknown>;

  // Ensure array fields are arrays
  const arrayFields = ["pairs", "items", "cards", "words", "options", "availableBlocks", "distractorBlocks", "scrambledLetters", "scrambledWords"];

  for (const field of arrayFields) {
    if (c[field] !== undefined && !Array.isArray(c[field])) {
      if (typeof c[field] === "object" && c[field] !== null) {
        c[field] = Object.values(c[field] as object);
      } else {
        c[field] = [];
      }
    }
  }

  // Normalize nested items
  if (Array.isArray(c.items)) {
    c.items = (c.items as Record<string, unknown>[]).map((item) => {
      const normalized = { ...item };
      for (const field of arrayFields) {
        if (normalized[field] !== undefined && !Array.isArray(normalized[field])) {
          if (typeof normalized[field] === "object" && normalized[field] !== null) {
            normalized[field] = Object.values(normalized[field] as object);
          } else {
            normalized[field] = [];
          }
        }
      }
      return normalized;
    });
  }

  return c;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}

function determineCategory(gameType: GameType, lesson: LessonContent): GameCategory {
  // If we have grammar rules, it's grammar-focused
  if (lesson.content.grammarRules.length > 0) {
    return "grammar";
  }
  // If we have vocabulary, it's vocabulary-focused
  if (lesson.content.vocabulary.length > 0) {
    return "vocabulary";
  }
  // Default based on game type
  const vocabGames: GameType[] = ["matching_pairs", "hangman", "word_scramble", "flashcards", "vocabulary_matching"];
  return vocabGames.includes(gameType) ? "vocabulary" : "grammar";
}

// GET endpoint to list available game templates
export async function GET() {
  return NextResponse.json({
    templates: GAME_TEMPLATES,
  });
}
