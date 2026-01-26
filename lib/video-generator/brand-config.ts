/**
 * SLS Brand Configuration
 *
 * Brand colors for Sweet Language School - NO BLUE
 * This is a shared copy for Next.js API routes (my-video folder is excluded from tsconfig)
 * Keep in sync with: my-video/src/lib/brand-config.ts
 */

export const SLS_BRAND = {
  // Primary brand colors
  colors: {
    primary: "#003F37",      // Dark teal/green - headers, backgrounds
    secondary: "#4F5338",     // Olive green - accents
    accent: "#B25627",        // Burnt orange - CTAs, highlights
    light: "#E3C6AB",         // Warm beige - cards, sections
    lightest: "#FFE8CD",      // Cream - backgrounds
    // Text colors
    textDark: "#1a1a1a",
    textLight: "#ffffff",
    textMuted: "#6b7280",
    // State colors
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
  },

  // Typography
  fonts: {
    primary: "Blinker, Inter, system-ui, sans-serif",
    heading: "Blinker, Inter, system-ui, sans-serif",
    mono: "JetBrains Mono, monospace",
  },

  // Gradient presets
  gradients: {
    primary: "linear-gradient(135deg, #003F37 0%, #4F5338 100%)",
    accent: "linear-gradient(135deg, #B25627 0%, #003F37 100%)",
    warm: "linear-gradient(135deg, #E3C6AB 0%, #FFE8CD 100%)",
    dark: "linear-gradient(135deg, #003F37 0%, #1a1a1a 100%)",
  },

  // Brand name and taglines
  name: "Sweet Language School",
  shortName: "SLS",
  tagline: "Learn English, Sweet and Simple",
  taglineDE: "Englisch lernen, süß und einfach",

  // Logo paths (relative to public folder)
  logos: {
    green: "/images/SLS_Logo_green.jpg",
    white: "/images/SLS_Logo_white.jpg",
  },
} as const;

// Helper function to get brand color by name
export function getBrandColor(name: keyof typeof SLS_BRAND.colors): string {
  return SLS_BRAND.colors[name];
}

// Template-specific color configurations
export const TEMPLATE_COLORS = {
  news_broadcast: {
    primary: SLS_BRAND.colors.primary,
    secondary: SLS_BRAND.colors.secondary,
    accent: SLS_BRAND.colors.accent,
    background: SLS_BRAND.colors.primary,
    cardBackground: SLS_BRAND.colors.lightest,
    tickerBackground: SLS_BRAND.colors.accent,
  },
  grammar_lesson: {
    primary: SLS_BRAND.colors.primary,
    secondary: SLS_BRAND.colors.secondary,
    accent: SLS_BRAND.colors.accent,
    background: SLS_BRAND.colors.lightest,
    cardBackground: SLS_BRAND.colors.light,
    highlightCorrect: SLS_BRAND.colors.success,
    highlightIncorrect: SLS_BRAND.colors.error,
  },
  vocabulary_lesson: {
    primary: SLS_BRAND.colors.primary,
    secondary: SLS_BRAND.colors.secondary,
    accent: SLS_BRAND.colors.accent,
    background: SLS_BRAND.colors.lightest,
    wordHighlight: SLS_BRAND.colors.accent,
    translationText: SLS_BRAND.colors.secondary,
  },
  conversation_practice: {
    primary: SLS_BRAND.colors.primary,
    secondary: SLS_BRAND.colors.secondary,
    accent: SLS_BRAND.colors.accent,
    background: SLS_BRAND.colors.light,
  },
} as const;

// CEFR level badges color coding
export const LEVEL_COLORS = {
  A1: { bg: "#FFE8CD", text: "#B25627" },
  A2: { bg: "#E3C6AB", text: "#B25627" },
  B1: { bg: "#4F5338", text: "#ffffff" },
  B2: { bg: "#003F37", text: "#ffffff" },
  C1: { bg: "#003F37", text: "#B25627" },
  C2: { bg: "#1a1a1a", text: "#FFE8CD" },
} as const;

export type CEFRLevel = keyof typeof LEVEL_COLORS;
