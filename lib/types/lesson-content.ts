/**
 * Structured Lesson Content Schema
 *
 * This schema defines the structure for processed educational documents.
 * The avatar can navigate this structure to quickly access:
 * - Specific exercises: lesson.content.exercises[2]
 * - Grammar rules: lesson.content.grammarRules.find(r => r.name.includes("modal"))
 * - Vocabulary: lesson.content.vocabulary
 */

export interface LessonContent {
  version: "1.0";
  metadata: LessonMetadata;
  content: LessonBody;
}

export interface LessonMetadata {
  title: string;
  titleDe?: string;
  level: CEFRLevel;
  estimatedMinutes: number;
  topic: string;
  subtopics: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  sourceDocumentId?: string;
}

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LessonBody {
  learningObjectives: LearningObjective[];
  introduction: MarkdownSection;
  sections: LessonSection[];
  vocabulary: VocabularyItem[];
  grammarRules: GrammarRule[];
  exercises: Exercise[];
  summary?: MarkdownSection;
  additionalResources?: Resource[];
}

export interface LearningObjective {
  id: string;
  objective: string;
  objectiveDe?: string;
}

export interface MarkdownSection {
  id: string;
  title?: string;
  content: string; // Markdown content
  contentDe?: string;
}

export interface LessonSection {
  id: string;
  type: "content" | "grammar" | "vocabulary" | "dialogue" | "reading" | "listening";
  title: string;
  titleDe?: string;
  content: string; // Markdown
  contentDe?: string;
  subsections?: LessonSection[];
  relatedExerciseIds?: string[];
  relatedGrammarIds?: string[];
  relatedVocabularyIds?: string[];
}

export interface VocabularyItem {
  id: string;
  term: string;
  termDe: string;
  pronunciation?: string;
  partOfSpeech?: PartOfSpeech;
  definition: string;
  definitionDe?: string;
  exampleSentence: string;
  exampleSentenceDe?: string;
  audioUrl?: string;
  notes?: string;
  level?: CEFRLevel;
}

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "phrase"
  | "idiom";

export interface GrammarRule {
  id: string;
  name: string;
  nameDe?: string;
  category: GrammarCategory;
  rule: string; // Markdown
  ruleDe?: string;
  formula?: string; // e.g., "Subject + have/has + past participle"
  examples: GrammarExample[];
  commonMistakes?: CommonMistake[];
  usageNotes?: string;
  relatedRuleIds?: string[];
}

export type GrammarCategory =
  | "tenses"
  | "modals"
  | "conditionals"
  | "articles"
  | "prepositions"
  | "word_order"
  | "passive"
  | "reported_speech"
  | "relative_clauses"
  | "other";

export interface GrammarExample {
  correct: string;
  incorrect?: string;
  explanation?: string;
  explanationDe?: string;
}

export interface CommonMistake {
  mistake: string;
  correction: string;
  explanation: string;
  explanationDe?: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;
  titleDe?: string;
  instructions: string; // Markdown
  instructionsDe?: string;
  difficulty: 1 | 2 | 3; // Easy, Medium, Hard
  items: ExerciseItem[];
  relatedGrammarIds?: string[];
  relatedVocabularyIds?: string[];
}

export type ExerciseType =
  | "fill_blank"
  | "multiple_choice"
  | "matching"
  | "error_correction"
  | "sentence_completion"
  | "word_formation"
  | "open_ended"
  | "translation"
  | "reordering";

export interface ExerciseItem {
  id: string;
  question: string;
  questionDe?: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  acceptableAnswers?: string[]; // Alternative correct answers
  explanation?: string;
  explanationDe?: string;
  hint?: string;
  hintDe?: string;
}

export interface Resource {
  id: string;
  type: "video" | "article" | "audio" | "website" | "book";
  title: string;
  url?: string;
  description?: string;
}

/**
 * Helper function to generate unique IDs for lesson elements
 */
export function generateLessonId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

/**
 * Helper to convert structured lesson to Markdown for display
 */
export function lessonToMarkdown(lesson: LessonContent): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${lesson.metadata.title}`);
  lines.push("");
  lines.push(`**Level:** ${lesson.metadata.level} | **Duration:** ~${lesson.metadata.estimatedMinutes} minutes`);
  lines.push("");

  // Learning Objectives
  if (lesson.content.learningObjectives.length > 0) {
    lines.push("## Learning Objectives");
    lines.push("");
    for (const obj of lesson.content.learningObjectives) {
      lines.push(`- ${obj.objective}`);
    }
    lines.push("");
  }

  // Introduction
  if (lesson.content.introduction?.content) {
    lines.push("## Introduction");
    lines.push("");
    lines.push(lesson.content.introduction.content);
    lines.push("");
  }

  // Sections
  for (const section of lesson.content.sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(section.content);
    lines.push("");
  }

  // Grammar Rules
  if (lesson.content.grammarRules.length > 0) {
    lines.push("## Grammar Rules");
    lines.push("");
    for (const rule of lesson.content.grammarRules) {
      lines.push(`### ${rule.name}`);
      lines.push("");
      lines.push(rule.rule);
      if (rule.formula) {
        lines.push("");
        lines.push(`> **Formula:** ${rule.formula}`);
      }
      lines.push("");
      lines.push("**Examples:**");
      for (const ex of rule.examples) {
        lines.push(`- ✓ ${ex.correct}`);
        if (ex.incorrect) {
          lines.push(`- ✗ ~~${ex.incorrect}~~`);
        }
        if (ex.explanation) {
          lines.push(`  *${ex.explanation}*`);
        }
      }
      lines.push("");
    }
  }

  // Exercises
  if (lesson.content.exercises.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Exercises");
    lines.push("");
    for (let i = 0; i < lesson.content.exercises.length; i++) {
      const exercise = lesson.content.exercises[i];
      lines.push(`### Exercise ${i + 1}: ${exercise.title}`);
      lines.push("");
      lines.push(`*${exercise.instructions}*`);
      lines.push("");
      for (let j = 0; j < exercise.items.length; j++) {
        const item = exercise.items[j];
        lines.push(`${j + 1}. ${item.question}`);
      }
      lines.push("");
    }
  }

  // Vocabulary
  if (lesson.content.vocabulary.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Vocabulary");
    lines.push("");
    lines.push("| English | German | Example |");
    lines.push("|---------|--------|---------|");
    for (const vocab of lesson.content.vocabulary) {
      lines.push(`| **${vocab.term}** | ${vocab.termDe} | ${vocab.exampleSentence} |`);
    }
    lines.push("");
  }

  // Summary
  if (lesson.content.summary?.content) {
    lines.push("---");
    lines.push("");
    lines.push("## Summary");
    lines.push("");
    lines.push(lesson.content.summary.content);
  }

  return lines.join("\n");
}
