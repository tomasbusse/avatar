/**
 * HTML Slide Types
 *
 * Self-contained HTML slides for interactive lesson rendering.
 * Each slide has inline CSS and requires no external dependencies.
 */

export type SlideType =
  | "title"
  | "objectives"
  | "content"
  | "grammar"
  | "vocabulary"
  | "exercise"
  | "summary";

export interface HtmlSlide {
  index: number;
  html: string;              // Self-contained HTML with inline CSS
  title?: string;
  type: SlideType;
  speakerNotes?: string;     // Notes for the avatar to reference
  teachingPrompt?: string;   // Instructions for the avatar's behavior
}

export interface SlideGeneratorOptions {
  /**
   * Maximum vocabulary items per slide before splitting
   */
  maxVocabPerSlide?: number;

  /**
   * Maximum exercise items per slide before splitting
   */
  maxExerciseItemsPerSlide?: number;

  /**
   * Include German translations on slides
   */
  includeDeutsch?: boolean;

  /**
   * Theme color scheme
   */
  theme?: SlideTheme;
}

export interface SlideTheme {
  primary: string;      // Main heading color (default: #1e40af blue)
  accent: string;       // Accent color for highlights (default: #059669 green)
  grammar: string;      // Grammar box background (default: #fef3c7 amber)
  grammarBorder: string;// Grammar box border (default: #fcd34d)
  text: string;         // Main text color (default: #1f2937)
  muted: string;        // Secondary text color (default: #6b7280)
  background: string;   // Slide background (default: #ffffff)
}

export const DEFAULT_THEME: SlideTheme = {
  primary: "#1e40af",
  accent: "#059669",
  grammar: "#fef3c7",
  grammarBorder: "#fcd34d",
  text: "#1f2937",
  muted: "#6b7280",
  background: "#ffffff",
};

export const DEFAULT_OPTIONS: SlideGeneratorOptions = {
  maxVocabPerSlide: 6,
  maxExerciseItemsPerSlide: 4,
  includeDeutsch: true,
  theme: DEFAULT_THEME,
};
