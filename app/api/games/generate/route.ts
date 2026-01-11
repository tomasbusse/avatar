import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  GameGenerationRequest,
  GameGenerationResponse,
  FullGenerationResult,
  EnhanceResult,
  VariationsResult,
  TokenUsage,
} from "@/lib/game-generation/types";
import {
  getPromptForGameType,
  getEnhancePrompt,
  getVariationsPrompt,
} from "@/lib/game-generation/prompts";
import { GameType, CEFRLevel, GameCategory } from "@/types/word-games";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds max

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<GameGenerationResponse>> {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = (await request.json()) as GameGenerationRequest;

    // 3. Validate request
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // 4. Build prompt based on request type
    const prompt = buildPrompt(body);

    // 5. Call OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OpenRouter API key not configured", code: "API_ERROR" },
        { status: 500 }
      );
    }

    const openRouterResponse = await callOpenRouter(body.model, prompt, apiKey);

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("OpenRouter error:", errorText);

      if (openRouterResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded. Please try again.", code: "RATE_LIMIT" },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to generate game content", code: "API_ERROR" },
        { status: 500 }
      );
    }

    const responseData = await openRouterResponse.json();

    // 6. Parse the generated content
    const rawContent = responseData.choices?.[0]?.message?.content || "";
    console.log("[Game Generation] Raw content length:", rawContent.length);
    console.log("[Game Generation] Raw content preview:", rawContent.slice(0, 500));

    const parsedContent = parseGeneratedJSON(rawContent);

    if (!parsedContent) {
      console.error("[Game Generation] Failed to parse JSON. Full content:", rawContent);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse AI response as JSON",
          code: "INVALID_JSON",
          rawContent: rawContent.slice(0, 2000), // Truncate for safety
        },
        { status: 500 }
      );
    }

    // 7. Format result based on request type
    const result = formatResult(body.type, parsedContent);

    // 8. Calculate usage/cost
    const usage = calculateUsage(responseData.usage, body.model);

    return NextResponse.json({
      success: true,
      result,
      usage,
    });
  } catch (error) {
    console.error("Game generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "API_ERROR",
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function validateRequest(body: GameGenerationRequest): string | null {
  if (!body.type) {
    return "Missing generation type";
  }

  if (!body.model) {
    return "Missing model selection";
  }

  if (body.type === "full") {
    if (!body.gameType) return "Missing game type";
    if (!body.level) return "Missing CEFR level";
    if (!body.topic || body.topic.trim().length < 2) {
      return "Topic must be at least 2 characters";
    }
  }

  if (body.type === "enhance") {
    if (!body.existingConfig) return "Missing existing config";
    if (!body.gameType) return "Missing game type";
    if (!body.level) return "Missing CEFR level";
    if (!body.enhancements) return "Missing enhancement options";
  }

  if (body.type === "variations") {
    if (!body.existingConfig) return "Missing existing config";
    if (!body.gameType) return "Missing game type";
    if (!body.sourceLevel) return "Missing source level";
    if (!body.targetLevels || body.targetLevels.length === 0) {
      return "Missing target levels";
    }
  }

  return null;
}

function buildPrompt(request: GameGenerationRequest): string {
  switch (request.type) {
    case "full":
      // For crossword, pass wordsPerPuzzle and puzzleCount
      if (request.gameType === "crossword") {
        return getPromptForGameType(
          request.gameType,
          request.topic,
          request.level,
          request.wordsPerPuzzle || 10,
          request.customPrompt,
          request.puzzleCount || 1
        );
      }
      return getPromptForGameType(
        request.gameType,
        request.topic,
        request.level,
        request.itemCount,
        request.customPrompt
      );

    case "enhance":
      return getEnhancePrompt(
        request.gameType,
        request.level,
        request.existingConfig,
        request.enhancements
      );

    case "variations":
      return getVariationsPrompt(
        request.gameType,
        request.sourceLevel,
        request.targetLevels,
        request.existingConfig
      );

    default:
      throw new Error("Invalid request type");
  }
}

async function callOpenRouter(
  model: string,
  prompt: string,
  apiKey: string
): Promise<Response> {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Beethoven AI Game Generator",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      // Request JSON mode if supported by the model
      response_format: { type: "json_object" },
    }),
  });
}

function parseGeneratedJSON(rawContent: string): unknown | null {
  // Try multiple parsing strategies

  // Strategy 1: Direct parse
  try {
    return JSON.parse(rawContent);
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Extract from markdown code blocks
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Find JSON object boundaries
  const jsonStart = rawContent.indexOf("{");
  const jsonEnd = rawContent.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      return JSON.parse(rawContent.slice(jsonStart, jsonEnd + 1));
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 4: Try to fix common JSON issues
  try {
    // Remove trailing commas
    const cleaned = rawContent
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      // Fix unescaped newlines in strings
      .replace(/\n/g, "\\n");
    return JSON.parse(cleaned);
  } catch {
    // All strategies failed
  }

  return null;
}

function normalizeConfig(config: unknown): Record<string, unknown> {
  const c = (config || {}) as Record<string, unknown>;

  // Ensure array fields are actually arrays
  const arrayFields = [
    "availableBlocks",
    "distractorBlocks",
    "blanks",
    "options",
    "correctOrder",
    "distractors",
    "pairs",
    "questions",
    "cards",
    "items", // Multi-item games
  ];

  for (const field of arrayFields) {
    if (c[field] !== undefined && !Array.isArray(c[field])) {
      // If it's an object with numeric keys, convert to array
      if (typeof c[field] === "object" && c[field] !== null) {
        c[field] = Object.values(c[field] as object);
      } else {
        c[field] = [];
      }
    }
  }

  // For multi-item configs, also normalize nested arrays in items
  if (Array.isArray(c.items)) {
    c.items = (c.items as Record<string, unknown>[]).map((item) => {
      const normalizedItem = { ...item };
      // Normalize nested arrays in each item
      const itemArrayFields = ["availableBlocks", "distractorBlocks", "options", "scrambledLetters", "scrambledWords"];
      for (const field of itemArrayFields) {
        if (normalizedItem[field] !== undefined && !Array.isArray(normalizedItem[field])) {
          if (typeof normalizedItem[field] === "object" && normalizedItem[field] !== null) {
            normalizedItem[field] = Object.values(normalizedItem[field] as object);
          } else {
            normalizedItem[field] = [];
          }
        }
      }
      return normalizedItem;
    });
  }

  return c;
}

// Compute crossword grid from words array
interface CrosswordWord {
  id: string;
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
  number: number;
}

interface CrosswordCell {
  letter: string | null;
  number?: number;
  wordIds: string[];
}

function computeCrosswordGrid(
  words: CrosswordWord[],
  rows: number,
  cols: number
): CrosswordCell[][] {
  // Initialize empty grid
  const grid: CrosswordCell[][] = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => ({ letter: null, wordIds: [] }))
    );

  // Place each word on the grid
  for (const word of words) {
    const letters = word.word.toUpperCase().split("");
    for (let i = 0; i < letters.length; i++) {
      const r = word.direction === "across" ? word.row : word.row + i;
      const c = word.direction === "across" ? word.col + i : word.col;

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c].letter = letters[i];
        if (!grid[r][c].wordIds.includes(word.id)) {
          grid[r][c].wordIds.push(word.id);
        }
        // Add number at starting position
        if (i === 0) {
          grid[r][c].number = word.number;
        }
      }
    }
  }

  return grid;
}

function ensureCrosswordGrid(config: Record<string, unknown>): Record<string, unknown> {
  if (config.type !== "crossword") return config;

  const rows = (config.rows as number) || 10;
  const cols = (config.cols as number) || 10;

  // Handle single puzzle
  if (Array.isArray(config.words) && !config.grid) {
    config.grid = computeCrosswordGrid(config.words as CrosswordWord[], rows, cols);
  }

  // Handle multiple puzzles (items array)
  if (Array.isArray(config.items)) {
    config.items = (config.items as Record<string, unknown>[]).map((item) => {
      if (Array.isArray(item.words) && !item.grid) {
        item.grid = computeCrosswordGrid(item.words as CrosswordWord[], rows, cols);
      }
      return item;
    });
  }

  return config;
}

function formatResult(
  type: "full" | "enhance" | "variations",
  parsed: unknown
): FullGenerationResult | EnhanceResult | VariationsResult {
  const data = parsed as Record<string, unknown>;

  switch (type) {
    case "full": {
      let config = normalizeConfig(data.config);
      // Compute crossword grid if missing
      config = ensureCrosswordGrid(config);
      return {
        type: "full",
        title: (data.title as string) || "Untitled Game",
        instructions: (data.instructions as string) || "",
        config,
        hints: Array.isArray(data.hints) ? data.hints : [],
        category: (data.category as GameCategory) || "mixed",
      };
    }

    case "enhance":
      return {
        type: "enhance",
        config: normalizeConfig(data.config),
        hints: Array.isArray(data.hints) ? data.hints : undefined,
        changes: Array.isArray(data.changes) ? data.changes : [],
      };

    case "variations":
      const variations = Array.isArray(data.variations) ? data.variations : [];
      return {
        type: "variations",
        variations: variations.map((v: unknown) => {
          const variation = v as Record<string, unknown>;
          return {
            ...variation,
            config: normalizeConfig(variation.config),
            hints: Array.isArray(variation.hints) ? variation.hints : [],
          };
        }) as VariationsResult["variations"],
      };
  }
}

function calculateUsage(
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  model: string
): TokenUsage {
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;

  // Rough cost estimates (actual pricing varies by model)
  // These are conservative estimates
  const estimatedCostPerPromptToken = 0.000003; // $3/1M tokens
  const estimatedCostPerCompletionToken = 0.000015; // $15/1M tokens

  const totalCost =
    promptTokens * estimatedCostPerPromptToken +
    completionTokens * estimatedCostPerCompletionToken;

  return {
    promptTokens,
    completionTokens,
    totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimals
  };
}
