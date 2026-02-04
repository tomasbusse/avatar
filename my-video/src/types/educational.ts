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

// ============================================================
// V2 TYPES - Timestamp-based sync with Deepgram
// ============================================================

// Word-level timestamp from Deepgram transcription
export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number; // seconds
  confidence: number;
}

// YouTube-style caption segment
export interface CaptionSegment {
  text: string;
  start: number; // seconds
  end: number; // seconds
}

// V2 Slide types
export type SlideTypeV2 =
  | "title"
  | "content"
  | "example"
  | "quiz"
  | "summary"
  | "vocabulary"
  | "grammar_rule"
  | "comparison"
  | "dialogue"; // NEW: Conversation examples with two speakers

// V2 Slide with exact timestamps from audio
export interface SlideWithTimestamp {
  id: string;
  type: SlideTypeV2;
  title: string;
  content: string[]; // Bullet points
  narration: string;
  imageUrl?: string;
  startTime: number; // Exact second from Deepgram
  endTime: number; // Exact second from Deepgram
  wordTimestamps: WordTimestamp[]; // For bullet animations

  // Quiz-specific fields
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectIndex?: number;
  quizExplanation?: string;

  // Grammar-specific
  grammarFormula?: string;
  examples?: Array<{ correct: string; incorrect?: string; explanation?: string }>;

  // Vocabulary-specific
  vocabularyWord?: string;
  vocabularyDefinition?: string;
  vocabularyTranslation?: string;
  vocabularyPhonetic?: string;

  // Dialogue-specific (conversation examples)
  dialogueLines?: DialogueLine[];
  dialogueContext?: string; // e.g., "At a coffee shop" or "Job interview"
}

// Dialogue line for conversation slides
export interface DialogueLine {
  speaker: string; // e.g., "Anna", "Tom"
  text: string;
  voiceId?: string; // Cartesia voice ID for this speaker
  highlight?: string; // Grammar element to highlight, e.g., "have visited"
}

// Layout options for V2
export type LayoutTypeV2 =
  | "avatar-pip" // Avatar in corner, slides fullscreen
  | "avatar-side" // Avatar left, slides right
  | "avatar-full" // Fullscreen avatar with text overlay
  | "slides-only" // No avatar
  | "alternating"; // Switch between avatar and slides

export type AvatarPositionV2 = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type AvatarSizeV2 = "small" | "medium" | "large";
export type SlideStyleV2 = "minimal" | "modern" | "classic" | "bold";
export type TransitionTypeV2 = "fade" | "slide" | "zoom" | "none";

// Color theme for V2
export interface ColorThemeV2 {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// Main props for EducationalVideoV2 composition
// Index signature required for Remotion's Composition component
export interface EducationalVideoV2Props {
  [key: string]: unknown;
  // Content
  slides: SlideWithTimestamp[];
  title: string;
  subtitle?: string;
  level: CEFRLevel;

  // Audio (pre-generated)
  audioUrl: string;
  totalDuration: number; // seconds from Deepgram

  // YouTube-style captions
  captions: CaptionSegment[];
  showCaptions: boolean;

  // Avatar video (from Hedra or Wav2Lip)
  avatarVideoUrl: string;
  avatarVideoUrls?: string[]; // Array of chunked videos for InfiniteTalk

  // Layout & Style
  layout: LayoutTypeV2;
  avatarPosition: AvatarPositionV2;
  avatarSize: AvatarSizeV2;
  slideStyle: SlideStyleV2;
  transitions: TransitionTypeV2;
  colors: ColorThemeV2;

  // Options
  includeIntro: boolean;
  includeOutro: boolean;
  includeProgressBar: boolean;
  includeLowerThird: boolean;

  // Lower third config
  lowerThird?: {
    name: string;
    title: string;
  };

  // Branding
  logoUrl?: string;
  brandName?: string;
}

// Avatar size mappings (percentage of screen)
export const AVATAR_SIZE_MAP: Record<AvatarSizeV2, number> = {
  small: 0.2, // 20%
  medium: 0.3, // 30%
  large: 0.4, // 40%
};

// Avatar position mappings
export const AVATAR_POSITION_STYLES: Record<AvatarPositionV2, React.CSSProperties> = {
  "top-left": { top: 20, left: 20 },
  "top-right": { top: 20, right: 20 },
  "bottom-left": { bottom: 20, left: 20 },
  "bottom-right": { bottom: 20, right: 20 },
};

// Default V2 colors (SLS brand)
export const DEFAULT_COLORS_V2: ColorThemeV2 = {
  primary: "#003F37",
  secondary: "#4F5338",
  accent: "#B25627",
  background: "#FFE8CD",
  text: "#1a1a1a",
};

// V2 timing constants
export const TIMING_V2 = {
  transitionFrames: 15, // 0.5 seconds at 30fps
  introDuration: 4, // seconds
  outroDuration: 5, // seconds
  lowerThirdDelay: 1, // seconds
  lowerThirdDuration: 6, // seconds
  quizRevealDelay: 3, // seconds before showing answer
  bulletStagger: 0.3, // seconds between bullet animations
} as const;

// Slide duration limits (min/max in seconds)
// Max is 15 seconds to match InfiniteTalk chunk limit
export const SLIDE_DURATION_LIMITS: Record<SlideTypeV2, { min: number; max: number }> = {
  title: { min: 4, max: 8 },
  content: { min: 6, max: 15 },
  example: { min: 6, max: 15 },
  quiz: { min: 12, max: 15 },      // Extra time to think
  summary: { min: 6, max: 15 },
  vocabulary: { min: 8, max: 15 },
  grammar_rule: { min: 8, max: 15 },
  comparison: { min: 8, max: 15 },
  dialogue: { min: 10, max: 15 },  // Conversation needs time
} as const;
