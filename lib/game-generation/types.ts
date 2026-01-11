import { GameType, CEFRLevel, GameCategory } from "@/types/word-games";

// ============================================
// REQUEST TYPES
// ============================================

export type GenerationType = "full" | "enhance" | "variations";

export interface FullGenerationRequest {
  type: "full";
  gameType: GameType;
  level: CEFRLevel;
  topic: string;
  model: string;
  category?: GameCategory;
  itemCount?: number;
  // Crossword-specific parameters
  wordsPerPuzzle?: number;
  puzzleCount?: number;
  customPrompt?: string;
}

export interface EnhancementOptions {
  addHints: boolean;
  addDistractors: boolean;
  addExplanations: boolean;
  improveQuality: boolean;
}

export interface EnhanceRequest {
  type: "enhance";
  existingConfig: unknown;
  gameType: GameType;
  level: CEFRLevel;
  model: string;
  enhancements: EnhancementOptions;
}

export interface VariationsRequest {
  type: "variations";
  existingConfig: unknown;
  gameType: GameType;
  sourceLevel: CEFRLevel;
  targetLevels: CEFRLevel[];
  model: string;
}

export type GameGenerationRequest =
  | FullGenerationRequest
  | EnhanceRequest
  | VariationsRequest;

// ============================================
// RESPONSE TYPES
// ============================================

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
}

export interface FullGenerationResult {
  type: "full";
  title: string;
  instructions: string;
  config: unknown;
  hints: string[];
  category: GameCategory;
}

export interface EnhanceResult {
  type: "enhance";
  config: unknown;
  hints?: string[];
  changes: string[];
}

export interface VariationItem {
  level: CEFRLevel;
  title: string;
  config: unknown;
  hints: string[];
}

export interface VariationsResult {
  type: "variations";
  variations: VariationItem[];
}

export type GeneratedGameResult =
  | FullGenerationResult
  | EnhanceResult
  | VariationsResult;

export interface GenerationSuccess {
  success: true;
  result: GeneratedGameResult;
  usage: TokenUsage;
}

export type GenerationErrorCode =
  | "INVALID_JSON"
  | "API_ERROR"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT"
  | "MODEL_UNAVAILABLE"
  | "UNAUTHORIZED";

export interface GenerationError {
  success: false;
  error: string;
  code: GenerationErrorCode;
  rawContent?: string;
}

export type GameGenerationResponse = GenerationSuccess | GenerationError;

// ============================================
// MODEL TYPES
// ============================================

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
}

export interface GroupedModels {
  [provider: string]: OpenRouterModel[];
}

export interface ModelPricing {
  promptPer1M: number;
  completionPer1M: number;
  formatted: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export type GenerationStatus =
  | { status: "idle" }
  | { status: "generating"; startTime: number }
  | { status: "success"; result: GeneratedGameResult; usage: TokenUsage }
  | { status: "error"; error: string; code: GenerationErrorCode; rawContent?: string; canRetry: boolean }
  | { status: "retrying"; attempt: number; maxAttempts: number };

// ============================================
// HELPERS
// ============================================

export function getProviderFromModelId(modelId: string): string {
  const [provider] = modelId.split("/");
  // Capitalize first letter
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function formatModelPricing(pricing: { prompt: string; completion: string }): ModelPricing {
  const promptPrice = parseFloat(pricing.prompt) || 0;
  const completionPrice = parseFloat(pricing.completion) || 0;

  const promptPer1M = promptPrice * 1_000_000;
  const completionPer1M = completionPrice * 1_000_000;

  const formatted = `$${promptPer1M.toFixed(2)}/$${completionPer1M.toFixed(2)}`;

  return {
    promptPer1M,
    completionPer1M,
    formatted,
  };
}

export function groupModelsByProvider(models: OpenRouterModel[]): GroupedModels {
  return models.reduce((acc, model) => {
    const provider = getProviderFromModelId(model.id);
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as GroupedModels);
}

export function estimateGenerationCost(
  model: OpenRouterModel,
  estimatedPromptTokens: number,
  estimatedCompletionTokens: number
): number {
  const promptPrice = parseFloat(model.pricing.prompt) || 0;
  const completionPrice = parseFloat(model.pricing.completion) || 0;

  return (promptPrice * estimatedPromptTokens) + (completionPrice * estimatedCompletionTokens);
}

// Storage keys for localStorage
export const STORAGE_KEYS = {
  LAST_MODEL: "beethoven_game_gen_last_model",
  RECENT_MODELS: "beethoven_game_gen_recent_models",
  MODELS_CACHE: "beethoven_openrouter_models_cache_v2", // v2 to force refresh
  MODELS_CACHE_TIME: "beethoven_openrouter_models_cache_time_v2",
} as const;

// Cache duration: 30 minutes
export const MODELS_CACHE_DURATION = 30 * 60 * 1000;
