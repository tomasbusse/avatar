/**
 * Simmonds Language Services (SLS) Brand Colors
 * Used across PDF, PowerPoint, and HTML slide generation
 */

export const SLS_COLORS = {
  // Primary colors
  teal: "#003F37",        // Primary - dark teal/forest green
  olive: "#4F5338",       // Secondary - olive/army green
  chartreuse: "#9F9D38",  // Accent - yellow-green
  orange: "#B25627",      // Action - burnt orange/terracotta
  beige: "#E3C6AB",       // Background - warm beige
  cream: "#FFE8CD",       // Light background - cream

  // Functional mappings
  primary: "#003F37",     // teal
  secondary: "#4F5338",   // olive
  accent: "#9F9D38",      // chartreuse
  action: "#B25627",      // orange
  background: "#FFE8CD",  // cream
  backgroundAlt: "#E3C6AB", // beige

  // Derived colors for better contrast
  white: "#FFFFFF",
  black: "#1A1A1A",
  textDark: "#1A1A1A",
  textLight: "#FFFFFF",
  textMuted: "#4F5338",   // olive for muted text

  // Grammar/learning specific
  grammarBg: "#FFE8CD",   // cream - for grammar boxes
  grammarBorder: "#B25627", // orange
  grammarText: "#003F37", // teal

  // Success/objective colors
  objectivesBg: "#E3C6AB", // beige
  objectivesBorder: "#9F9D38", // chartreuse
  objectivesText: "#003F37", // teal

  // Exercise colors
  exerciseBg: "#FFFFFF",
  exerciseBorder: "#E3C6AB", // beige
  exerciseText: "#1A1A1A",

  // Vocabulary table
  tableHeaderBg: "#003F37", // teal
  tableHeaderText: "#FFFFFF",
  tableRowAlt: "#FFE8CD", // cream
} as const;

// Without # prefix for PowerPoint (pptxgenjs uses colors without #)
export const SLS_COLORS_HEX = {
  teal: "003F37",
  olive: "4F5338",
  chartreuse: "9F9D38",
  orange: "B25627",
  beige: "E3C6AB",
  cream: "FFE8CD",
  primary: "003F37",
  secondary: "4F5338",
  accent: "9F9D38",
  action: "B25627",
  background: "FFE8CD",
  backgroundAlt: "E3C6AB",
  white: "FFFFFF",
  black: "1A1A1A",
  textDark: "1A1A1A",
  textLight: "FFFFFF",
  textMuted: "4F5338",
  grammarBg: "FFE8CD",
  grammarBorder: "B25627",
  grammarText: "003F37",
  objectivesBg: "E3C6AB",
  objectivesBorder: "9F9D38",
  objectivesText: "003F37",
  exerciseBg: "FFFFFF",
  exerciseBorder: "E3C6AB",
  exerciseText: "1A1A1A",
  tableHeaderBg: "003F37",
  tableHeaderText: "FFFFFF",
  tableRowAlt: "FFE8CD",
} as const;

// CSS for HTML generation
export const SLS_CSS_VARS = `
  --sls-teal: #003F37;
  --sls-olive: #4F5338;
  --sls-chartreuse: #9F9D38;
  --sls-orange: #B25627;
  --sls-beige: #E3C6AB;
  --sls-cream: #FFE8CD;
  --sls-white: #FFFFFF;
  --sls-black: #1A1A1A;
`;
