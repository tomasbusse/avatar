// Word Games Type Definitions
// Based on SPEC.md specification

import { Id } from "@/convex/_generated/dataModel";

// ============================================
// CORE ENUMS AND TYPES
// ============================================

export type GameType =
  | "sentence_builder"
  | "fill_in_blank"
  | "word_ordering"
  | "matching_pairs"
  | "word_scramble"
  | "multiple_choice"
  | "flashcards"
  | "hangman"
  | "crossword"
  | "vocabulary_matching";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type GameCategory = "grammar" | "vocabulary" | "mixed";

export type GameStatus = "draft" | "published" | "archived";

export type DistractorDifficulty = "easy" | "medium" | "hard";

export type GameSessionStatus = "in_progress" | "completed" | "abandoned";

export type TriggerType = "slide" | "avatar" | "student" | "checkpoint";

// Block categories for Sentence Builder
export type BlockCategory =
  | "subject"
  | "aux"
  | "modal"
  | "main"
  | "negation"
  | "object"
  | "time"
  | "connector";

// ============================================
// BLOCK TYPES (for Sentence Builder)
// ============================================

export interface Block {
  id: string;
  text: string;
  category: BlockCategory;
}

// Block category colors for consistent styling
export const BLOCK_CATEGORY_COLORS: Record<BlockCategory, string> = {
  subject: "#e0f2ff", // Light blue
  aux: "#e0f7ec", // Light green
  modal: "#fff3d9", // Pale yellow
  main: "#ffe8e0", // Peach
  negation: "#ffd6de", // Pink
  object: "#e9e0ff", // Purple
  time: "#e5f2e0", // Soft green
  connector: "#f0f0f0", // Gray
};

// ============================================
// GAME CONFIGURATION TYPES
// ============================================

// Sentence Builder Item (for multi-item support)
export interface SentenceBuilderItem {
  id: string;
  targetSentence: string;
  availableBlocks: Block[];
  distractorBlocks?: Block[];
  explanation?: string;
}

// Sentence Builder Mode
export type SentenceBuilderMode = "one_per_slide" | "progressive_difficulty";

// Sentence Builder Configuration (supports both legacy single-item and multi-item)
export interface SentenceBuilderConfig {
  type: "sentence_builder";
  // Legacy single-item (backward compatibility)
  targetSentence?: string;
  availableBlocks?: Block[];
  distractorBlocks?: Block[];
  // Multi-item support
  items?: SentenceBuilderItem[];
  mode?: SentenceBuilderMode;
}

// Fill in the Blank Configuration
export interface FillInBlankItem {
  id: string;
  sentence: string; // "The cat ___ on the mat."
  blankIndex: number; // Position of blank (word index)
  correctAnswer: string; // "sat"
  options: string[]; // ["sat", "sit", "sitting", "sets"]
  explanation?: string; // Shown after answering
}

export interface FillInBlankConfig {
  type: "fill_in_blank";
  items: FillInBlankItem[];
}

// Word Ordering Configuration
export interface WordOrderingItem {
  id: string;
  correctSentence: string; // "She has been working here."
  scrambledWords: string[]; // ["working", "She", "here", "has", "been"]
  punctuation?: string; // "." added automatically
}

export interface WordOrderingConfig {
  type: "word_ordering";
  items: WordOrderingItem[];
}

// Matching Pairs Configuration
export type MatchType =
  | "definition"
  | "translation"
  | "image"
  | "synonym"
  | "antonym";

export interface MatchingPair {
  id: string;
  left: {
    text: string;
    imageUrl?: string;
  };
  right: {
    text: string;
    imageUrl?: string;
  };
}

export interface MatchingPairsConfig {
  type: "matching_pairs";
  matchType?: MatchType; // Optional, defaults to "definition"
  pairs: MatchingPair[];
  timeLimit?: number; // Optional, in seconds
}

// Word Scramble Configuration
export interface WordScrambleItem {
  id: string;
  correctWord: string; // "beautiful"
  scrambledLetters: string[]; // ["u","b","t","i","e","a","l","f","u"]
  hint: string; // Definition or context
  imageUrl?: string; // Optional image hint
}

export interface WordScrambleConfig {
  type: "word_scramble";
  items: WordScrambleItem[];
}

// Multiple Choice Configuration
export type QuestionType = "definition" | "grammar" | "completion" | "error";

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MultipleChoiceItem {
  id: string;
  question: string;
  questionType: QuestionType;
  options: MultipleChoiceOption[];
  explanation: string; // Shown after answering
  imageUrl?: string; // Optional image with question
}

export interface MultipleChoiceConfig {
  type: "multiple_choice";
  items: MultipleChoiceItem[];
  allowMultipleSelect?: boolean; // For "select all that apply"
}

// Flashcards Configuration
export interface FlashcardItem {
  id: string;
  front: {
    text: string;
    imageUrl?: string;
    audioUrl?: string; // Pronunciation
  };
  back: {
    text: string;
    example?: string; // Example sentence
    imageUrl?: string;
  };
}

export interface FlashcardsConfig {
  type: "flashcards";
  cards: FlashcardItem[];
  shuffleCards: boolean;
  repeatMissed: boolean; // Re-show missed cards
}

// Hangman Configuration
export interface HangmanItem {
  id: string;
  word: string; // "VOCABULARY"
  hint: string; // Category or definition hint
  maxMistakes: number; // Default: 6
}

export interface HangmanConfig {
  type: "hangman";
  items: HangmanItem[];
  showCategoryHint: boolean; // Show hint before guessing
}

// Crossword Configuration
export interface CrosswordWord {
  id: string;
  word: string;           // The answer word (uppercase)
  clue: string;           // Definition clue
  row: number;            // Starting row (0-indexed)
  col: number;            // Starting column (0-indexed)
  direction: "across" | "down";
  number: number;         // Clue number (1, 2, 3...)
}

export interface CrosswordCell {
  letter: string | null;  // null = blocked cell
  number?: number;        // Clue number if word starts here
  wordIds: string[];      // Which words use this cell
}

export interface CrosswordPuzzleItem {
  words: CrosswordWord[];
  grid?: CrosswordCell[][];  // Optional - computed from words if not provided
}

export interface CrosswordConfig {
  type: "crossword";
  rows: number;
  cols: number;
  // Single puzzle mode (legacy)
  grid?: CrosswordCell[][];  // 2D grid - optional, computed from words if not provided
  words?: CrosswordWord[];   // All words with clues
  // Multi-puzzle mode
  items?: CrosswordPuzzleItem[];
}

// Vocabulary Matching Configuration
export interface VocabularyTerm {
  id: string;
  term: string;              // The vocabulary word/phrase
  definition: string;        // Clear definition
  category?: string;         // Optional category (e.g., "Ingredient", "Property")
  example?: string;          // Example sentence using the term
  audioUrl?: string;         // Pre-generated audio URL (optional, can generate on-demand)
}

export interface VocabularyMatchingConfig {
  type: "vocabulary_matching";
  terms: VocabularyTerm[];   // Array of vocabulary terms
  enableAudio: boolean;      // Enable TTS pronunciation feature
  timeLimit?: number;        // Optional time limit in seconds
  shuffleTerms: boolean;     // Shuffle the order of terms
  showCategories: boolean;   // Group/display by category
}

// Union type for all game configs
export type GameConfig =
  | SentenceBuilderConfig
  | FillInBlankConfig
  | WordOrderingConfig
  | MatchingPairsConfig
  | WordScrambleConfig
  | MultipleChoiceConfig
  | FlashcardsConfig
  | HangmanConfig
  | CrosswordConfig
  | VocabularyMatchingConfig;

// ============================================
// DIFFICULTY CONFIGURATION
// ============================================

export interface DifficultyConfig {
  hintsAvailable: number;
  distractorDifficulty: DistractorDifficulty;
  timeMultiplier?: number;
}

// Default hints by level
export const DEFAULT_HINTS_BY_LEVEL: Record<CEFRLevel, number> = {
  A1: 5,
  A2: 4,
  B1: 3,
  B2: 3,
  C1: 2,
  C2: 2,
};

// ============================================
// GAME STATS
// ============================================

export interface GameStats {
  totalPlays: number;
  completionRate: number;
  averageStars: number;
  averageTimeSeconds: number;
}

// ============================================
// TRIGGER CONFIGURATION
// ============================================

export interface TriggerConfig {
  slideIndex?: number; // For slide-triggered
  afterMinutes?: number; // For checkpoint
  keywords?: string[]; // For avatar/student triggered
}

// ============================================
// GAME SESSION STATE
// ============================================

// Sentence Builder Session State
export interface SentenceBuilderState {
  workspaceBlocks: Block[];
  remainingHints: number;
  attempts: number;
}

// Fill in the Blank Session State
export interface FillInBlankState {
  currentItemIndex: number;
  answers: Record<string, string>; // itemId -> selected answer
  hintsUsedPerItem: Record<string, number>;
}

// Word Ordering Session State
export interface WordOrderingState {
  currentItemIndex: number;
  arrangedWords: Record<string, string[]>; // itemId -> ordered words
  hintsUsedPerItem: Record<string, number>;
}

// Matching Pairs Session State
export interface MatchingPairsState {
  matchedPairs: string[]; // IDs of matched pairs
  wrongAttempts: number;
  selectedLeft?: string;
}

// Word Scramble Session State
export interface WordScrambleState {
  currentItemIndex: number;
  arrangedLetters: Record<string, string[]>; // itemId -> arranged letters
  hintsUsedPerItem: Record<string, number>;
}

// Multiple Choice Session State
export interface MultipleChoiceState {
  currentItemIndex: number;
  answers: Record<string, string[]>; // itemId -> selected option IDs
}

// Flashcards Session State
export interface FlashcardsState {
  currentCardIndex: number;
  cardResults: Record<string, "got_it" | "almost" | "missed_it">;
  missedCards: string[]; // IDs to repeat
}

// Hangman Session State
export interface HangmanState {
  currentItemIndex: number;
  guessedLetters: Record<string, string[]>; // itemId -> guessed letters
  mistakes: Record<string, number>;
}

// Vocabulary Matching Session State
export interface VocabularyMatchingState {
  matchedTerms: string[];       // IDs of matched term-definition pairs
  selectedTerm: string | null;  // Currently selected term ID
  selectedDefinition: string | null; // Currently selected definition ID
  wrongAttempts: number;
  audioPlayed: string[];        // IDs of terms where audio was played
}

// Union type for game states
export type GameState =
  | SentenceBuilderState
  | FillInBlankState
  | WordOrderingState
  | MatchingPairsState
  | WordScrambleState
  | MultipleChoiceState
  | FlashcardsState
  | HangmanState
  | VocabularyMatchingState;

// ============================================
// GAME SESSION EVENTS
// ============================================

export type GameEventType =
  | "game_started"
  | "answer_submitted"
  | "hint_used"
  | "scaffolding_received"
  | "item_completed"
  | "game_completed"
  | "game_abandoned";

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

// ============================================
// SCAFFOLDING ACTIONS
// ============================================

export type ScaffoldingActionId =
  | "hint_highlight"
  | "hint_partial"
  | "hint_eliminate"
  | "hint_verbal"
  | "hint_demonstrate"
  | "hint_reset"
  | "feedback_correct"
  | "feedback_incorrect"
  | "feedback_progress"
  | "feedback_complete";

export interface ScaffoldingEvent {
  type: "scaffolding_action";
  action: ScaffoldingActionId;
  gameId: string;
  sessionId: string;
  targetElementId?: string;
  message?: string;
  timestamp: number;
}

// ============================================
// SCORING
// ============================================

export interface GameScore {
  stars: 0 | 1 | 2 | 3;
  scorePercent: number;
  totalTimeSeconds: number;
  hintsUsed: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

// Star calculation thresholds
export const STAR_THRESHOLDS = {
  THREE_STARS: { percent: 90, maxHints: 0, maxAttempts: 1 },
  TWO_STARS: { percent: 70, maxHints: 2, maxAttempts: 2 },
  ONE_STAR: { percent: 50, maxHints: Infinity, maxAttempts: Infinity },
};

// ============================================
// FULL GAME DOCUMENT TYPE
// ============================================

export interface WordGame {
  _id: Id<"wordGames">;
  title: string;
  slug: string;
  description?: string;
  instructions: string;
  type: GameType;
  category: GameCategory;
  level: CEFRLevel;
  tags?: string[];
  config: GameConfig;
  difficultyConfig: DifficultyConfig;
  hints: string[];
  status: GameStatus;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  stats?: GameStats;
}

// ============================================
// GAME-LESSON LINK TYPE
// ============================================

export interface GameLessonLink {
  _id: Id<"gameLessonLinks">;
  gameId: Id<"wordGames">;
  lessonId: Id<"structuredLessons">;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  isRequired: boolean;
  order: number;
  createdAt: number;
}

// ============================================
// GAME SESSION TYPE
// ============================================

export interface GameSession {
  _id: Id<"gameSessions">;
  gameId: Id<"wordGames">;
  sessionId?: Id<"sessions">;
  studentId: Id<"students">;
  status: GameSessionStatus;
  gameState: GameState;
  currentItemIndex: number;
  totalItems: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  stars?: number;
  scorePercent?: number;
  startedAt: number;
  completedAt?: number;
  totalTimeSeconds?: number;
  events: GameEvent[];
  createdAt: number;
  updatedAt: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate star rating based on game performance
 */
export function calculateStars(
  scorePercent: number,
  hintsUsed: number,
  incorrectAttempts: number
): 0 | 1 | 2 | 3 {
  if (
    scorePercent >= STAR_THRESHOLDS.THREE_STARS.percent &&
    hintsUsed <= STAR_THRESHOLDS.THREE_STARS.maxHints &&
    incorrectAttempts <= STAR_THRESHOLDS.THREE_STARS.maxAttempts
  ) {
    return 3;
  }
  if (
    scorePercent >= STAR_THRESHOLDS.TWO_STARS.percent &&
    hintsUsed <= STAR_THRESHOLDS.TWO_STARS.maxHints &&
    incorrectAttempts <= STAR_THRESHOLDS.TWO_STARS.maxAttempts
  ) {
    return 2;
  }
  if (scorePercent >= STAR_THRESHOLDS.ONE_STAR.percent) {
    return 1;
  }
  return 0;
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * Get game type display name
 */
export function getGameTypeDisplayName(type: GameType): string {
  const names: Record<GameType, string> = {
    sentence_builder: "Sentence Builder",
    fill_in_blank: "Fill in the Blank",
    word_ordering: "Word Ordering",
    matching_pairs: "Matching Pairs",
    word_scramble: "Word Scramble",
    multiple_choice: "Multiple Choice",
    flashcards: "Flashcards",
    hangman: "Hangman",
    crossword: "Crossword",
    vocabulary_matching: "Vocabulary Matching",
  };
  return names[type];
}

/**
 * Get game type icon (for UI)
 */
export function getGameTypeIcon(type: GameType): string {
  const icons: Record<GameType, string> = {
    sentence_builder: "🧱",
    fill_in_blank: "✏️",
    word_ordering: "🔤",
    matching_pairs: "🔗",
    word_scramble: "🔀",
    multiple_choice: "☑️",
    flashcards: "🃏",
    hangman: "🎯",
    crossword: "🔠",
    vocabulary_matching: "📚",
  };
  return icons[type];
}

/**
 * Get total items count from game config
 */
export function getTotalItems(config: GameConfig): number {
  switch (config.type) {
    case "sentence_builder":
      // Support both legacy single-item and multi-item
      return config.items?.length ?? 1;
    case "fill_in_blank":
      return config.items.length;
    case "word_ordering":
      return config.items.length;
    case "matching_pairs":
      // 5 pairs per slide - calculate number of slides
      return Math.ceil(config.pairs.length / 5);
    case "word_scramble":
      return config.items.length;
    case "multiple_choice":
      return config.items.length;
    case "flashcards":
      // Flashcards handles its own navigation - it's one game "item"
      return 1;
    case "hangman":
      return config.items.length;
    case "crossword":
      // Support both single puzzle and multi-puzzle mode
      return config.items?.length ?? 1;
    case "vocabulary_matching":
      // Vocabulary matching is a single game with multiple terms
      return 1;
    default:
      return 0;
  }
}

/**
 * Get single item config from a game config at a specific index
 * This normalizes multi-item and legacy single-item configs
 */
export function getItemConfig(
  config: GameConfig,
  index: number
): {
  id: string;
  data: Record<string, unknown>;
} | null {
  switch (config.type) {
    case "sentence_builder": {
      if (config.items && config.items[index]) {
        const item = config.items[index];
        return {
          id: item.id,
          data: {
            targetSentence: item.targetSentence,
            availableBlocks: item.availableBlocks,
            distractorBlocks: item.distractorBlocks,
            explanation: item.explanation,
          },
        };
      }
      // Legacy single-item format
      if (index === 0 && config.targetSentence) {
        return {
          id: "legacy-0",
          data: {
            targetSentence: config.targetSentence,
            availableBlocks: config.availableBlocks,
            distractorBlocks: config.distractorBlocks,
          },
        };
      }
      return null;
    }
    case "fill_in_blank": {
      const item = config.items[index];
      return item ? { id: item.id, data: item as unknown as Record<string, unknown> } : null;
    }
    case "word_ordering": {
      const item = config.items[index];
      return item ? { id: item.id, data: item as unknown as Record<string, unknown> } : null;
    }
    case "matching_pairs": {
      const pair = config.pairs[index];
      return pair ? { id: pair.id, data: pair as unknown as Record<string, unknown> } : null;
    }
    case "word_scramble": {
      const item = config.items[index];
      return item ? { id: item.id, data: item as unknown as Record<string, unknown> } : null;
    }
    case "multiple_choice": {
      const item = config.items[index];
      return item ? { id: item.id, data: item as unknown as Record<string, unknown> } : null;
    }
    case "flashcards": {
      const card = config.cards[index];
      return card ? { id: card.id, data: card as unknown as Record<string, unknown> } : null;
    }
    case "hangman": {
      const item = config.items[index];
      return item ? { id: item.id, data: item as unknown as Record<string, unknown> } : null;
    }
    case "crossword": {
      // Crossword is a single puzzle - return full config
      if (index === 0) {
        return { id: "crossword-0", data: config as unknown as Record<string, unknown> };
      }
      return null;
    }
    case "vocabulary_matching": {
      // Vocabulary matching is a single game - return full config
      if (index === 0) {
        return { id: "vocab-matching-0", data: config as unknown as Record<string, unknown> };
      }
      return null;
    }
    default:
      return null;
  }
}
