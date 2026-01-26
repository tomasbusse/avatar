/**
 * Types for Educational Video Generator
 */

import type { CEFRLevel } from "../lib/brand-config";

// Slide types for educational content
export type SlideType =
  | "title"
  | "summary"
  | "key_concept"
  | "bullet_points"
  | "vocabulary"
  | "grammar_rule"
  | "comparison"
  | "question"
  | "practice"
  | "discussion";

// Brand configuration that can be customized per video
export type BrandConfig = {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  lightColor?: string;
  lightestColor?: string;
  fontFamily?: string;
};

// Vocabulary item structure
export type VocabularyItem = {
  word: string;
  phonetic?: string;
  definition: string;
  germanTranslation: string;
  exampleSentence?: string;
  audioUrl?: string;
};

// Slide content structure
export type EducationalSlide = {
  id: string;
  type: SlideType;
  title?: string;
  content?: string;
  items?: string[];
  narration: string;
  durationSeconds?: number;
  // Type-specific fields
  vocabulary?: VocabularyItem;
  options?: string[]; // For question slides
  formula?: string; // For grammar slides
  correct?: { text: string; explanation?: string }; // For comparison slides
  incorrect?: { text: string; explanation?: string }; // For comparison slides
};

// Question structure for comprehension checks
export type ComprehensionQuestion = {
  question: string;
  type?: "multiple_choice" | "true_false" | "fill_blank" | "open_ended";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
};

// Complete lesson content from AI generation
export type LessonContent = {
  objective: string;
  vocabulary: VocabularyItem[];
  slides: EducationalSlide[];
  questions: ComprehensionQuestion[];
  keyTakeaways: string[];
  fullScript: string;
  estimatedDuration?: number;
};

// Lower third configuration
export type EducationalLowerThird = {
  name: string;
  title: string;
  show: boolean;
};

// Video configuration
export type EducationalVideoConfig = {
  templateType: "news_broadcast" | "grammar_lesson" | "vocabulary_lesson" | "conversation_practice";
  aspectRatio: "16:9" | "9:16";
  includeIntro: boolean;
  includeOutro: boolean;
  includeLowerThird: boolean;
  includeProgressBar: boolean;
  includeVocabularyHighlights?: boolean;
  includeComprehensionQuestions?: boolean;
};

// Props for GrammarLesson composition
export type GrammarLessonProps = {
  avatarVideoUrl: string;
  avatarVideoDuration: number;
  lessonContent: LessonContent;
  level: CEFRLevel;
  lessonTitle: string;
  lessonSubtitle?: string;
  lowerThird?: EducationalLowerThird;
  config: EducationalVideoConfig;
  brandConfig?: BrandConfig;
};

// Props for NewsLesson composition
export type NewsLessonProps = {
  avatarVideoUrl: string;
  avatarVideoDuration: number;
  lessonContent: LessonContent;
  level: CEFRLevel;
  lessonTitle: string;
  newsHeadline?: string;
  sourceCredits?: string[];
  lowerThird?: EducationalLowerThird;
  config: EducationalVideoConfig;
  brandConfig?: BrandConfig;
  tickerText?: string;
};

// Default durations
export const EDUCATIONAL_TIMING = {
  introDuration: 4, // seconds
  outroDuration: 5, // seconds
  slideTransition: 0.5, // seconds
  vocabularySlide: 8, // seconds per word
  questionPause: 5, // seconds for viewer to think
  lowerThirdAppear: 1, // seconds after main content starts
  lowerThirdDuration: 6, // seconds
} as const;
