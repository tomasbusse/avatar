import { GameType, CEFRLevel, GameCategory } from "@/types/word-games";
import { EnhancementOptions } from "./types";

// ============================================
// CEFR LEVEL GUIDELINES
// ============================================

export const CEFR_GUIDELINES = `
CEFR LEVEL GUIDELINES:
- A1 (Beginner): Simple present tense, basic vocabulary (10-20 common words), very short sentences (4-6 words), familiar everyday topics
- A2 (Elementary): Present continuous, past simple, basic vocabulary with some variety, short sentences (6-10 words), daily life topics
- B1 (Intermediate): Present perfect, modals, conditionals, intermediate vocabulary, medium sentences (8-14 words), work/travel/interests
- B2 (Upper-Intermediate): Complex tenses, passive voice, advanced vocabulary, longer sentences (12-18 words), abstract topics
- C1 (Advanced): All tenses fluently, sophisticated vocabulary, complex sentences (15-22 words), professional/academic topics, idioms
- C2 (Proficient): Near-native complexity, nuanced expressions, any sentence length, subtle distinctions, cultural references
`;

// ============================================
// BASE SYSTEM PROMPT
// ============================================

const BASE_SYSTEM_PROMPT = `You are an expert English language teacher with years of experience creating engaging educational games for language learners. You understand CEFR proficiency levels deeply and create content that is precisely calibrated to each level.

Your games are:
- Pedagogically sound: Teaching real language skills, not just testing
- Engaging: Using interesting topics and varied content
- Level-appropriate: Vocabulary and grammar match the CEFR level exactly
- Error-free: Perfect English grammar and spelling
- Well-structured: Clear JSON output that matches the required schema exactly

${CEFR_GUIDELINES}

IMPORTANT: You MUST respond with valid JSON only. No explanations or text outside the JSON.`;

// ============================================
// GAME-TYPE PROMPTS
// ============================================

export function getSentenceBuilderPrompt(topic: string, level: CEFRLevel, itemCount: number = 1): string {
  const isMultiItem = itemCount > 1;

  if (isMultiItem) {
    return `${BASE_SYSTEM_PROMPT}

Create a Sentence Builder game about "${topic}" for ${level} level learners.

The student will drag and drop word blocks to form correct sentences.

Create ${itemCount} different sentences to build.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Build sentences by dragging word blocks into the correct order.",
  "config": {
    "type": "sentence_builder",
    "mode": "one_per_slide",
    "items": [
      {
        "id": "item1",
        "targetSentence": "The complete correct sentence without punctuation",
        "availableBlocks": [
          { "id": "item1_b1", "text": "word", "category": "subject" }
        ],
        "distractorBlocks": [
          { "id": "item1_d1", "text": "wrong word", "category": "subject" }
        ],
        "explanation": "Brief explanation of the grammar point"
      }
    ]
  },
  "hints": ["General hint 1", "General hint 2", "General hint 3"],
  "category": "grammar"
}

REQUIREMENTS:
- Create exactly ${itemCount} items in the items array
- Each item ID must be unique (item1, item2, item3...)
- Block IDs must include the item prefix (item1_b1, item1_b2, item1_d1...)
- Include 2-4 distractor blocks per item with common mistakes
- Categories: subject, aux, modal, main, negation, object, time, connector
- Vary the sentences to cover different aspects of "${topic}"
- For ${level}: ${getLevelSpecificGuidance(level)}`;
  }

  // Single item (legacy format)
  return `${BASE_SYSTEM_PROMPT}

Create a Sentence Builder game about "${topic}" for ${level} level learners.

The student will drag and drop word blocks to form correct sentences.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Clear instructions for students",
  "config": {
    "type": "sentence_builder",
    "targetSentence": "The complete correct sentence without punctuation",
    "availableBlocks": [
      { "id": "b1", "text": "word or short phrase", "category": "subject|aux|modal|main|negation|object|time|connector" }
    ],
    "distractorBlocks": [
      { "id": "d1", "text": "plausible wrong word", "category": "category" }
    ]
  },
  "hints": ["Hint 1 - subtle", "Hint 2 - more helpful", "Hint 3 - almost gives it away"],
  "category": "grammar"
}

REQUIREMENTS:
- Block IDs must be unique (b1, b2... for correct blocks, d1, d2... for distractors)
- Include 2-4 distractor blocks with common mistakes (wrong tense, wrong preposition, etc.)
- Categories: subject, aux, modal, main, negation, object, time, connector
- Hints should be progressive (each more helpful than the last)
- For ${level}: ${getLevelSpecificGuidance(level)}`;
}

export function getFillInBlankPrompt(topic: string, level: CEFRLevel, itemCount: number = 3): string {
  return `${BASE_SYSTEM_PROMPT}

Create a Fill in the Blank game about "${topic}" for ${level} level learners.

Create ${itemCount} fill-in-the-blank sentences.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Complete the sentences by filling in the blanks.",
  "config": {
    "type": "fill_in_blank",
    "items": [
      {
        "id": "item1",
        "sentence": "She ___ working here for five years.",
        "blankIndex": 1,
        "correctAnswer": "has been",
        "options": ["has been", "is", "was", "have been"],
        "explanation": "We use 'has been' with present perfect continuous for ongoing actions."
      }
    ]
  },
  "hints": ["Hint about grammar point", "Hint about the tense", "More specific hint"],
  "category": "grammar"
}

REQUIREMENTS:
- Create exactly ${itemCount} items in the items array
- Each item ID must be unique (item1, item2, item3...)
- Use ___ (three underscores) to mark the blank in the sentence
- blankIndex is the word position (0-based) where the blank appears
- Provide 4 options including the correct answer and 3 plausible distractors
- Include an explanation for each item
- For ${level}: ${getLevelSpecificGuidance(level)}`;
}

export function getWordOrderingPrompt(topic: string, level: CEFRLevel, itemCount: number = 3): string {
  return `${BASE_SYSTEM_PROMPT}

Create a Word Ordering game about "${topic}" for ${level} level learners.

Students will arrange scrambled words into correct sentences.

Create ${itemCount} sentences to order.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Arrange the words to form correct sentences.",
  "config": {
    "type": "word_ordering",
    "items": [
      {
        "id": "item1",
        "correctSentence": "She has been working here since 2020",
        "scrambledWords": ["working", "She", "here", "has", "since", "been", "2020"],
        "punctuation": "."
      }
    ]
  },
  "hints": ["Think about word order in English", "What comes after the subject?", "The auxiliary verb comes early"],
  "category": "grammar"
}

REQUIREMENTS:
- Create exactly ${itemCount} items in the items array
- Each item ID must be unique (item1, item2, item3...)
- correctSentence: the sentence with words in correct order (no punctuation)
- scrambledWords: the words shuffled randomly
- punctuation: the ending punctuation (. or ? or !)
- Each word should be a separate array element
- Do NOT include punctuation in the arrays
- For ${level}: ${getLevelSpecificGuidance(level)}`;
}

export function getMatchingPairsPrompt(topic: string, level: CEFRLevel, slideCount: number = 2): string {
  // slideCount is the number of slides, each slide has 5 pairs
  const PAIRS_PER_SLIDE = 5;
  const totalPairs = slideCount * PAIRS_PER_SLIDE;

  return `${BASE_SYSTEM_PROMPT}

Create a Matching Pairs game about "${topic}" for ${level} level learners.

Students will match words with their definitions. The game has ${slideCount} slide(s), each showing 5 pairs at a time.

Create exactly ${totalPairs} pairs total (${slideCount} slides × 5 pairs per slide).

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Match each word with its correct definition.",
  "config": {
    "type": "matching_pairs",
    "matchType": "definition",
    "pairs": [
      { "id": "pair1", "left": { "text": "vocabulary word" }, "right": { "text": "clear definition" } },
      { "id": "pair2", "left": { "text": "another word" }, "right": { "text": "its definition" } }
    ],
    "timeLimit": 120
  },
  "hints": ["General hint about the topic", "Think about word families"],
  "category": "vocabulary"
}

REQUIREMENTS:
- Create exactly ${totalPairs} pairs (for ${slideCount} slides of 5 pairs each)
- Each pair ID must be unique (pair1, pair2, pair3... up to pair${totalPairs})
- matchType can be: "definition", "translation", "synonym", or "antonym"
- Each pair must be unambiguous (only one correct match possible)
- Definitions should be clear and level-appropriate
- timeLimit is in seconds (use 60-180 depending on difficulty)
- For ${level}: ${getLevelSpecificGuidance(level)}`;
}

export function getWordScramblePrompt(topic: string, level: CEFRLevel, itemCount: number = 5): string {
  return `${BASE_SYSTEM_PROMPT}

Create a Word Scramble game about "${topic}" for ${level} level learners.

Students will unscramble letters to form vocabulary words.

Create ${itemCount} words to unscramble.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Unscramble the letters to find the word.",
  "config": {
    "type": "word_scramble",
    "items": [
      {
        "id": "item1",
        "correctWord": "vocabulary",
        "scrambledLetters": ["v", "a", "b", "o", "c", "l", "u", "a", "r", "y"],
        "hint": "Words you learn in a language"
      }
    ]
  },
  "hints": ["The words all relate to ${topic}", "Look for common letter patterns", "Try finding common prefixes or suffixes"],
  "category": "vocabulary"
}

REQUIREMENTS:
- Create exactly ${itemCount} items in the items array
- Each item ID must be unique (item1, item2, item3...)
- correctWord: the word in correct spelling
- scrambledLetters: array of individual letters shuffled randomly
- hint: definition or context clue (don't give away the spelling)
- Use words appropriate for ${level} level
- For ${level}: ${getLevelSpecificGuidance(level)}`;
}

export function getMultipleChoicePrompt(topic: string, level: CEFRLevel, itemCount: number = 5): string {
  return `${BASE_SYSTEM_PROMPT}

Create a Multiple Choice quiz about "${topic}" for ${level} level learners.

Create ${itemCount} questions.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Choose the correct answer for each question.",
  "config": {
    "type": "multiple_choice",
    "items": [
      {
        "id": "item1",
        "question": "Which sentence uses the present perfect correctly?",
        "questionType": "grammar",
        "options": [
          { "id": "item1_opt1", "text": "I have been waiting for an hour.", "isCorrect": true },
          { "id": "item1_opt2", "text": "I has been waiting for an hour.", "isCorrect": false },
          { "id": "item1_opt3", "text": "I am been waiting for an hour.", "isCorrect": false },
          { "id": "item1_opt4", "text": "I been waiting for an hour.", "isCorrect": false }
        ],
        "explanation": "We use 'have been' with 'I' for present perfect continuous."
      }
    ]
  },
  "hints": ["Think about subject-verb agreement", "Consider the tense formation"],
  "category": "grammar"
}

REQUIREMENTS:
- Create exactly ${itemCount} items in the items array
- Each item ID must be unique (item1, item2, item3...)
- Exactly 4 options per question with unique IDs (item1_opt1, item1_opt2...)
- questionType can be: "definition", "grammar", "completion", or "error"
- Exactly one option should have isCorrect: true
- Include common learner mistakes as wrong options
- Explanations should teach, not just confirm
- For ${level}: ${getLevelSpecificGuidance(level)}`;
}

export function getFlashcardsPrompt(topic: string, level: CEFRLevel, itemCount: number = 8): string {
  return `${BASE_SYSTEM_PROMPT}

Create Flashcards about "${topic}" for ${level} level learners.

Create ${itemCount} vocabulary flashcards.

OUTPUT FORMAT (JSON only):
{
  "title": "Short descriptive title",
  "instructions": "Study each flashcard. Click to flip and see the definition.",
  "config": {
    "type": "flashcards",
    "cards": [
      {
        "id": "card1",
        "front": { "text": "deadline" },
        "back": { "text": "the latest time by which something must be completed", "example": "The deadline for the report is Friday." }
      }
    ],
    "shuffleCards": true,
    "repeatMissed": true
  },
  "hints": ["Take your time with each card", "Try to recall the meaning before flipping"],
  "category": "vocabulary"
}

REQUIREMENTS:
- Create exactly ${itemCount} cards in the cards array
- Each card ID must be unique (card1, card2, card3...)
- front.text: the vocabulary word or phrase
- back.text: clear, level-appropriate definition
- back.example: a natural example sentence showing usage
- shuffleCards: whether to randomize card order (usually true)
- repeatMissed: whether to show missed cards again (usually true)
- For ${level}: ${getLevelSpecificGuidance(level)}`;
}

export function getHangmanPrompt(topic: string, level: CEFRLevel, itemCount: number = 5): string {
  return `${BASE_SYSTEM_PROMPT}

Create a Hangman game about "${topic}" for ${level} level learners.

Create ${itemCount} words to guess.

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
        "hint": "Words you learn in a language",
        "maxMistakes": 6
      }
    ],
    "showCategoryHint": true
  },
  "hints": ["All words relate to ${topic}", "Think about common letter patterns", "Try vowels first"],
  "category": "vocabulary"
}

REQUIREMENTS:
- Create exactly ${itemCount} items in the items array
- Each item ID must be unique (item1, item2, item3...)
- word: the word in UPPERCASE letters only
- hint: a clue to help identify the word without making it too easy
- maxMistakes: 6 for long words (8+ letters), 5 for medium (5-7), 4 for short (4 or less)
- showCategoryHint: whether to show the hint before guessing (usually true)
- For ${level}: ${getLevelSpecificGuidance(level)}`;
}

export function getCrosswordPrompt(topic: string, level: CEFRLevel, wordCount: number = 10, puzzleCount: number = 1): string {
  // Grid size based on level
  const gridSize = ["A1", "A2"].includes(level)
    ? { rows: 7, cols: 7, maxWords: 8 }
    : { rows: 10, cols: 10, maxWords: 12 };

  const actualWordCount = Math.min(wordCount, gridSize.maxWords);

  // For multiple puzzles, use items array
  const configFormat = puzzleCount > 1
    ? `"config": {
    "type": "crossword",
    "rows": ${gridSize.rows},
    "cols": ${gridSize.cols},
    "items": [
      {
        "words": [
          {"id": "word1", "word": "EXAMPLE", "clue": "Definition here", "row": 0, "col": 0, "direction": "across", "number": 1},
          {"id": "word2", "word": "EXTRA", "clue": "Definition here", "row": 0, "col": 0, "direction": "down", "number": 1}
        ]
      }
    ]
  }`
    : `"config": {
    "type": "crossword",
    "rows": ${gridSize.rows},
    "cols": ${gridSize.cols},
    "words": [
      {"id": "word1", "word": "EXAMPLE", "clue": "A sample that represents a group", "row": 0, "col": 0, "direction": "across", "number": 1},
      {"id": "word2", "word": "EXTRA", "clue": "More than usual", "row": 0, "col": 0, "direction": "down", "number": 1}
    ]
  }`;

  return `${BASE_SYSTEM_PROMPT}

Create ${puzzleCount > 1 ? `${puzzleCount} Crossword puzzles` : "a Crossword puzzle"} about "${topic}" for ${level} level learners.

GRID SPECIFICATIONS:
- Grid size: ${gridSize.rows} rows × ${gridSize.cols} columns
- Words per puzzle: ${actualWordCount}
${puzzleCount > 1 ? `- Total puzzles: ${puzzleCount} (each with DIFFERENT words)` : ""}

CROSSWORD RULES:
1. First word goes horizontally at row 0
2. Each word MUST intersect with at least one other word (share a letter)
3. Words can be "across" (horizontal) or "down" (vertical)
4. Number words in reading order (top-left to bottom-right)
5. Words must fit within the ${gridSize.rows}x${gridSize.cols} grid

OUTPUT FORMAT (JSON only, NO grid array - we compute it automatically):
{
  "title": "Descriptive title",
  "instructions": "Fill in the crossword by typing answers for each clue.",
  ${configFormat},
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "category": "vocabulary"
}

WORD REQUIREMENTS:
- Exactly ${actualWordCount} words ${puzzleCount > 1 ? "per puzzle" : ""}
- word: UPPERCASE, 3-${["A1", "A2"].includes(level) ? "7" : "10"} letters
- clue: clear ${level}-appropriate definition (never include the answer!)
- row/col: 0-indexed starting position (must fit in grid)
- direction: "across" or "down"
- number: clue number in reading order
- Words MUST actually intersect at shared letters!

Example intersection: "EXAMPLE" across at (0,0) and "EXTRA" down at (0,0) share "E" at position (0,0).

${getLevelSpecificGuidance(level)}

DO NOT include a "grid" array - only provide the "words" array. The grid is computed automatically from word positions.`;
}

// ============================================
// ENHANCEMENT PROMPT
// ============================================

export function getEnhancePrompt(
  gameType: GameType,
  level: CEFRLevel,
  existingConfig: unknown,
  enhancements: EnhancementOptions
): string {
  const enhancementList: string[] = [];
  if (enhancements.addHints) enhancementList.push("Add 3 progressive hints (subtle → helpful → almost revealing)");
  if (enhancements.addDistractors) enhancementList.push("Add more plausible wrong options/distractors");
  if (enhancements.addExplanations) enhancementList.push("Add educational explanations for answers");
  if (enhancements.improveQuality) enhancementList.push("Improve vocabulary sophistication and pedagogical value");

  return `${BASE_SYSTEM_PROMPT}

You are enhancing an existing ${gameType} game for ${level} level learners.

CURRENT GAME CONFIG:
${JSON.stringify(existingConfig, null, 2)}

REQUESTED ENHANCEMENTS:
${enhancementList.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Return the ENHANCED config with improvements. Maintain the exact same structure.

OUTPUT FORMAT (JSON only):
{
  "config": { /* the enhanced game config with same structure */ },
  "hints": ["hint 1", "hint 2", "hint 3"],
  "changes": ["Description of change 1", "Description of change 2"]
}

The "changes" array should list what was improved.`;
}

// ============================================
// VARIATIONS PROMPT
// ============================================

export function getVariationsPrompt(
  gameType: GameType,
  sourceLevel: CEFRLevel,
  targetLevels: CEFRLevel[],
  existingConfig: unknown
): string {
  return `${BASE_SYSTEM_PROMPT}

Create level variations of this ${gameType} game.

SOURCE LEVEL: ${sourceLevel}
SOURCE CONFIG:
${JSON.stringify(existingConfig, null, 2)}

TARGET LEVELS: ${targetLevels.join(", ")}

Create adapted versions for each target level. Adjust:
- Vocabulary complexity
- Sentence length and structure
- Grammar difficulty
- Number of items/distractors

OUTPUT FORMAT (JSON only):
{
  "variations": [
    {
      "level": "A1",
      "title": "Adapted title for A1",
      "config": { /* adapted game config */ },
      "hints": ["level-appropriate hint 1", "hint 2", "hint 3"]
    }
  ]
}

Create one variation object for each level in: ${targetLevels.join(", ")}`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getLevelSpecificGuidance(level: CEFRLevel): string {
  const guidance: Record<CEFRLevel, string> = {
    A1: "Use only the most common 500 words, present tense only, very short sentences",
    A2: "Use common vocabulary, simple past and present, short clear sentences",
    B1: "Use intermediate vocabulary, present perfect and conditionals, medium sentences",
    B2: "Use varied vocabulary, all common tenses including passive, longer sentences",
    C1: "Use sophisticated vocabulary, complex grammar structures, nuanced expressions",
    C2: "Use native-level vocabulary, idioms, cultural references, any complexity",
  };
  return guidance[level];
}

export function getPromptForGameType(
  gameType: GameType,
  topic: string,
  level: CEFRLevel,
  itemCount?: number,
  customPrompt?: string,
  puzzleCount?: number // Only used for crossword
): string {
  const count = itemCount || getDefaultItemCount(gameType);

  let basePrompt: string;
  switch (gameType) {
    case "sentence_builder":
      basePrompt = getSentenceBuilderPrompt(topic, level, count);
      break;
    case "fill_in_blank":
      basePrompt = getFillInBlankPrompt(topic, level, count);
      break;
    case "word_ordering":
      basePrompt = getWordOrderingPrompt(topic, level, count);
      break;
    case "matching_pairs":
      basePrompt = getMatchingPairsPrompt(topic, level, count);
      break;
    case "word_scramble":
      basePrompt = getWordScramblePrompt(topic, level, count);
      break;
    case "multiple_choice":
      basePrompt = getMultipleChoicePrompt(topic, level, count);
      break;
    case "flashcards":
      basePrompt = getFlashcardsPrompt(topic, level, count);
      break;
    case "hangman":
      basePrompt = getHangmanPrompt(topic, level, count);
      break;
    case "crossword":
      basePrompt = getCrosswordPrompt(topic, level, count, puzzleCount || 1);
      break;
    default:
      throw new Error(`Unknown game type: ${gameType}`);
  }

  // Append custom instructions if provided
  if (customPrompt && customPrompt.trim()) {
    basePrompt += `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${customPrompt.trim()}`;
  }

  return basePrompt;
}

function getDefaultItemCount(gameType: GameType): number {
  const defaults: Record<GameType, number> = {
    sentence_builder: 5,
    fill_in_blank: 5,
    word_ordering: 5,
    matching_pairs: 2,  // 2 slides × 5 pairs = 10 pairs total
    word_scramble: 5,
    multiple_choice: 5,
    flashcards: 10,
    hangman: 5,
    crossword: 6,  // 6 words in the puzzle
  };
  return defaults[gameType] || 5;
}
