/**
 * HTML Slide Types
 *
 * Self-contained HTML slides for interactive lesson rendering.
 * Each slide has inline CSS and requires no external dependencies.
 */

import { SLS_COLORS } from "@/lib/brand-colors";

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
  primary: string;      // Main heading color (SLS teal: #003F37)
  accent: string;       // Accent color for highlights (SLS chartreuse: #9F9D38)
  grammar: string;      // Grammar box background (SLS cream: #FFE8CD)
  grammarBorder: string;// Grammar box border (SLS orange: #B25627)
  text: string;         // Main text color (#1a1a1a)
  muted: string;        // Secondary text color (SLS olive: #4F5338)
  background: string;   // Slide background (#ffffff)
}

// SLS Brand Theme - Simmonds Language Services colors
export const DEFAULT_THEME: SlideTheme = {
  primary: SLS_COLORS.teal,        // #003F37 - Dark teal
  accent: SLS_COLORS.chartreuse,   // #9F9D38 - Yellow-green
  grammar: SLS_COLORS.cream,       // #FFE8CD - Cream background
  grammarBorder: SLS_COLORS.orange,// #B25627 - Orange border
  text: "#1a1a1a",                 // Near-black for readability
  muted: SLS_COLORS.olive,         // #4F5338 - Olive for secondary text
  background: "#ffffff",           // White background
};

export const DEFAULT_OPTIONS: SlideGeneratorOptions = {
  maxVocabPerSlide: 6,
  maxExerciseItemsPerSlide: 4,
  includeDeutsch: true,
  theme: DEFAULT_THEME,
};
