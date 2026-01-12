export enum VocabSuiteMode {
  OVERVIEW = "overview",
  FLASHCARDS = "flashcards",
  MATCHING = "matching",
  QUIZ = "quiz",
  AI_TUTOR = "ai_tutor",
}

export interface VocabTerm {
  id: string;
  term: string;
  definition: string;
  category?: string;
  example?: string;
}

export interface VocabGameData {
  id: string;
  title: string;
  description?: string;
  sourceDocument?: string;
  terms: VocabTerm[];
  highlights?: string[];
}
