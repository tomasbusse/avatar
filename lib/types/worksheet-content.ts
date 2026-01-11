/**
 * Worksheet Content Schema
 *
 * This schema defines the structure for editable PDF worksheets.
 * Designed for printable worksheets with exercises, vocabulary tables,
 * and grammar rules that can be exported to PDF with SLS brand styling.
 */

import { SLS_COLORS } from "@/lib/brand-colors";

// Re-export useful types from lesson-content
export type { CEFRLevel, PartOfSpeech, GrammarCategory } from "./lesson-content";
import type {
  CEFRLevel,
  VocabularyItem,
  GrammarRule,
  ExerciseType,
  ExerciseItem,
} from "./lesson-content";

// ============================================================================
// Main Worksheet Structure
// ============================================================================

export interface WorksheetContent {
  version: "1.0";
  metadata: WorksheetMetadata;
  design: WorksheetDesign;
  content: WorksheetBody;
}

export interface WorksheetMetadata {
  title: string;
  titleDe?: string;
  level: CEFRLevel;
  estimatedMinutes: number;
  category: WorksheetCategory;
  topic: string;
  subtopics?: string[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  sourceDocumentId?: string;
}

export type WorksheetCategory =
  | "grammar"
  | "vocabulary"
  | "reading"
  | "writing"
  | "listening"
  | "speaking"
  | "mixed";

// ============================================================================
// Design & Styling
// ============================================================================

export interface WorksheetDesign {
  theme: WorksheetTheme;
  colors: WorksheetColors;
  fonts: WorksheetFonts;
  pageSize: "A4" | "letter";
  margins: PageMargins;
}

export type WorksheetTheme = "sls-brand" | "minimal" | "colorful";

export interface WorksheetColors {
  primary: string;      // Headers, titles (SLS teal #003F37)
  secondary: string;    // Muted text (SLS olive #4F5338)
  accent: string;       // Highlights (SLS chartreuse #9F9D38)
  action: string;       // CTAs, grammar boxes (SLS orange #B25627)
  background: string;   // Section backgrounds (SLS beige #E3C6AB)
  backgroundAlt: string; // Light backgrounds (SLS cream #FFE8CD)
  text: string;         // Main text color
  textMuted: string;    // Secondary text
}

export interface WorksheetFonts {
  heading: string;      // Default: Merriweather
  body: string;         // Default: Inter
  headingSize: number;  // Default: 24
  bodySize: number;     // Default: 12
}

export interface PageMargins {
  top: number;     // mm
  right: number;   // mm
  bottom: number;  // mm
  left: number;    // mm
}

// Default SLS brand design
export const DEFAULT_WORKSHEET_DESIGN: WorksheetDesign = {
  theme: "sls-brand",
  colors: {
    primary: SLS_COLORS.teal,
    secondary: SLS_COLORS.olive,
    accent: SLS_COLORS.chartreuse,
    action: SLS_COLORS.orange,
    background: SLS_COLORS.beige,
    backgroundAlt: SLS_COLORS.cream,
    text: "#1a1a1a",
    textMuted: "#6b7280",
  },
  fonts: {
    heading: "Merriweather",
    body: "Inter",
    headingSize: 24,
    bodySize: 12,
  },
  pageSize: "A4",
  margins: {
    top: 20,
    right: 15,
    bottom: 25,
    left: 15,
  },
};

// ============================================================================
// Content Structure
// ============================================================================

export interface WorksheetBody {
  header?: WorksheetHeader;
  sections: WorksheetSection[];
  footer?: WorksheetFooter;
}

export interface WorksheetHeader {
  id: string;
  showTitle: boolean;
  showLevel: boolean;
  showInstructions: boolean;
  instructions?: string;
  instructionsDe?: string;
  studentNameField: boolean;
  dateField: boolean;
  scoreField: boolean;
  customFields?: HeaderField[];
}

export interface HeaderField {
  id: string;
  label: string;
  labelDe?: string;
  width: "small" | "medium" | "large";
}

export interface WorksheetFooter {
  id: string;
  showPageNumbers: boolean;
  showTotalScore: boolean;
  totalPoints?: number;
  customText?: string;
  customTextDe?: string;
}

// ============================================================================
// Sections
// ============================================================================

export interface WorksheetSection {
  id: string;
  type: SectionType;
  title?: string;
  titleDe?: string;
  content?: string;       // Markdown or HTML content
  contentDe?: string;

  // Type-specific content
  exercise?: WorksheetExercise;
  vocabulary?: VocabularyItem[];
  grammarRule?: GrammarRule;
  readingPassage?: ReadingPassage;

  // Layout options
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  backgroundColor?: string;
  borderLeft?: boolean;
  borderColor?: string;
}

export type SectionType =
  | "instructions"
  | "content"
  | "exercise"
  | "vocabulary"
  | "grammar"
  | "reading"
  | "writing"
  | "spacer"
  | "divider";

// ============================================================================
// Exercises (Extended for Worksheets)
// ============================================================================

export interface WorksheetExercise {
  type: ExerciseType;
  instructions: string;
  instructionsDe?: string;
  points: number;
  items: WorksheetExerciseItem[];

  // Display options
  showNumbering: boolean;
  showAnswerLines: boolean;
  answerLineLength?: number;  // Characters
  columnsCount?: 1 | 2 | 3;
  showPointsPerItem?: boolean;

  // Grading options
  caseSensitive?: boolean;
  partialCredit?: boolean;
}

export interface WorksheetExerciseItem extends ExerciseItem {
  // Additional worksheet-specific fields
  pointValue?: number;        // Points for this item (if different from default)
  answerLineCount?: number;   // For open-ended: number of lines
  wordLimit?: number;         // For writing exercises
  imageUrl?: string;          // Optional image for the question
}

// ============================================================================
// Reading Passages
// ============================================================================

export interface ReadingPassage {
  id: string;
  title: string;
  titleDe?: string;
  content: string;          // The reading text (Markdown)
  contentDe?: string;
  source?: string;          // Attribution
  wordCount?: number;
  questions?: WorksheetExercise;  // Comprehension questions
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for worksheet elements
 */
export function generateWorksheetId(prefix: string, index?: number): string {
  const suffix = index !== undefined ? `-${index + 1}` : `-${Date.now()}`;
  return `${prefix}${suffix}`;
}

/**
 * Create a default empty worksheet content structure
 */
export function createEmptyWorksheet(
  title: string,
  level: CEFRLevel = "B1",
  category: WorksheetCategory = "mixed"
): WorksheetContent {
  const now = Date.now();
  return {
    version: "1.0",
    metadata: {
      title,
      level,
      estimatedMinutes: 30,
      category,
      topic: "",
      createdAt: now,
      updatedAt: now,
    },
    design: DEFAULT_WORKSHEET_DESIGN,
    content: {
      header: {
        id: generateWorksheetId("header"),
        showTitle: true,
        showLevel: true,
        showInstructions: false,
        studentNameField: true,
        dateField: true,
        scoreField: true,
      },
      sections: [],
      footer: {
        id: generateWorksheetId("footer"),
        showPageNumbers: true,
        showTotalScore: true,
      },
    },
  };
}

/**
 * Calculate total points in a worksheet
 */
export function calculateTotalPoints(worksheet: WorksheetContent): number {
  let total = 0;
  for (const section of worksheet.content.sections) {
    if (section.exercise) {
      total += section.exercise.points;
    }
  }
  return total;
}

/**
 * Count exercises in a worksheet
 */
export function countExercises(worksheet: WorksheetContent): number {
  return worksheet.content.sections.filter(s => s.type === "exercise").length;
}

/**
 * Count vocabulary items in a worksheet
 */
export function countVocabulary(worksheet: WorksheetContent): number {
  let count = 0;
  for (const section of worksheet.content.sections) {
    if (section.vocabulary) {
      count += section.vocabulary.length;
    }
  }
  return count;
}

/**
 * Convert WorksheetContent to HTML for PDF rendering
 */
export function worksheetToHtml(worksheet: WorksheetContent): string {
  const { metadata, design, content } = worksheet;
  const colors = design.colors;

  const lines: string[] = [];

  // HTML document start
  lines.push(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metadata.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-accent: ${colors.accent};
      --color-action: ${colors.action};
      --color-background: ${colors.background};
      --color-background-alt: ${colors.backgroundAlt};
      --color-text: ${colors.text};
      --color-text-muted: ${colors.textMuted};
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: '${design.fonts.body}', sans-serif;
      font-size: ${design.fonts.bodySize}px;
      line-height: 1.6;
      color: var(--color-text);
      padding: ${design.margins.top}mm ${design.margins.right}mm ${design.margins.bottom}mm ${design.margins.left}mm;
    }

    h1, h2, h3, h4 {
      font-family: '${design.fonts.heading}', serif;
      color: var(--color-primary);
      margin-bottom: 0.5em;
    }

    h1 { font-size: ${design.fonts.headingSize}px; }
    h2 { font-size: ${design.fonts.headingSize * 0.8}px; border-bottom: 2px solid var(--color-background); padding-bottom: 0.3em; margin-top: 1.5em; }
    h3 { font-size: ${design.fonts.headingSize * 0.65}px; color: var(--color-secondary); }

    .header { margin-bottom: 2em; padding-bottom: 1em; border-bottom: 3px solid var(--color-primary); }
    .header-title { display: flex; justify-content: space-between; align-items: baseline; }
    .level-badge {
      display: inline-block;
      background: var(--color-action);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
    }

    .header-fields {
      display: flex;
      gap: 2em;
      margin-top: 1em;
      padding-top: 1em;
      border-top: 1px solid var(--color-background);
    }
    .header-field {
      display: flex;
      align-items: center;
      gap: 0.5em;
    }
    .header-field label {
      font-weight: 600;
      color: var(--color-secondary);
    }
    .header-field-line {
      border-bottom: 1px solid var(--color-text);
      min-width: 150px;
      height: 1.5em;
    }

    .section { margin: 1.5em 0; }
    .section-instructions {
      background: var(--color-background);
      border-left: 4px solid var(--color-accent);
      padding: 1em;
      border-radius: 0 8px 8px 0;
      margin: 1em 0;
    }

    .exercise { margin: 1.5em 0; }
    .exercise-instructions {
      font-style: italic;
      color: var(--color-secondary);
      margin-bottom: 1em;
    }
    .exercise-item {
      margin: 0.75em 0;
      padding-left: 1.5em;
    }
    .answer-line {
      display: inline-block;
      border-bottom: 1px solid var(--color-text);
      min-width: 80px;
      margin: 0 4px;
    }

    .grammar-box {
      background: var(--color-background-alt);
      border-left: 4px solid var(--color-action);
      border-radius: 0 8px 8px 0;
      padding: 1.25em;
      margin: 1.5em 0;
    }
    .grammar-box h3 { color: var(--color-action); margin-bottom: 0.75em; }
    .grammar-formula {
      background: white;
      padding: 0.75em;
      border-radius: 4px;
      font-family: monospace;
      color: var(--color-primary);
      font-weight: 600;
      margin: 0.75em 0;
    }

    .vocabulary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    .vocabulary-table th,
    .vocabulary-table td {
      padding: 0.75em;
      text-align: left;
      border-bottom: 1px solid var(--color-background);
    }
    .vocabulary-table th {
      background: var(--color-primary);
      color: white;
      font-weight: 600;
    }
    .vocabulary-table tr:nth-child(even) {
      background: var(--color-background-alt);
    }

    .footer {
      margin-top: 2em;
      padding-top: 1em;
      border-top: 2px solid var(--color-background);
      display: flex;
      justify-content: space-between;
      color: var(--color-text-muted);
      font-size: 0.9em;
    }

    .page-break { page-break-before: always; }

    @media print {
      body { padding: 0; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>`);

  // Header
  if (content.header) {
    const h = content.header;
    lines.push('<div class="header">');
    if (h.showTitle || h.showLevel) {
      lines.push('<div class="header-title">');
      if (h.showTitle) {
        lines.push(`<h1>${escapeHtml(metadata.title)}</h1>`);
      }
      if (h.showLevel) {
        lines.push(`<span class="level-badge">${metadata.level}</span>`);
      }
      lines.push('</div>');
    }
    if (h.showInstructions && h.instructions) {
      lines.push(`<p class="instructions">${escapeHtml(h.instructions)}</p>`);
    }
    if (h.studentNameField || h.dateField || h.scoreField) {
      lines.push('<div class="header-fields">');
      if (h.studentNameField) {
        lines.push('<div class="header-field"><label>Name:</label><span class="header-field-line"></span></div>');
      }
      if (h.dateField) {
        lines.push('<div class="header-field"><label>Date:</label><span class="header-field-line"></span></div>');
      }
      if (h.scoreField) {
        lines.push('<div class="header-field"><label>Score:</label><span class="header-field-line"></span></div>');
      }
      lines.push('</div>');
    }
    lines.push('</div>');
  }

  // Sections
  for (const section of content.sections) {
    const sectionClass = section.pageBreakBefore ? 'section page-break' : 'section';
    lines.push(`<div class="${sectionClass}">`);

    if (section.title) {
      lines.push(`<h2>${escapeHtml(section.title)}</h2>`);
    }

    switch (section.type) {
      case "instructions":
        lines.push(`<div class="section-instructions">${section.content || ""}</div>`);
        break;

      case "content":
        lines.push(`<div class="section-content">${section.content || ""}</div>`);
        break;

      case "exercise":
        if (section.exercise) {
          lines.push(renderExerciseHtml(section.exercise));
        }
        break;

      case "vocabulary":
        if (section.vocabulary && section.vocabulary.length > 0) {
          lines.push(renderVocabularyHtml(section.vocabulary));
        }
        break;

      case "grammar":
        if (section.grammarRule) {
          lines.push(renderGrammarHtml(section.grammarRule));
        }
        break;

      case "divider":
        lines.push('<hr style="border: none; border-top: 2px solid var(--color-background); margin: 2em 0;">');
        break;

      case "spacer":
        lines.push('<div style="height: 2em;"></div>');
        break;
    }

    lines.push('</div>');
  }

  // Footer
  if (content.footer) {
    const f = content.footer;
    lines.push('<div class="footer">');
    if (f.showTotalScore && f.totalPoints) {
      lines.push(`<span>Total Points: ${f.totalPoints}</span>`);
    }
    if (f.customText) {
      lines.push(`<span>${escapeHtml(f.customText)}</span>`);
    }
    lines.push('</div>');
  }

  lines.push('</body></html>');

  return lines.join('\n');
}

// Helper functions for HTML rendering
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderExerciseHtml(exercise: WorksheetExercise): string {
  const lines: string[] = [];

  lines.push('<div class="exercise">');
  lines.push(`<p class="exercise-instructions">${escapeHtml(exercise.instructions)}</p>`);

  const columns = exercise.columnsCount || 1;
  if (columns > 1) {
    lines.push(`<div style="column-count: ${columns}; column-gap: 2em;">`);
  }

  for (let i = 0; i < exercise.items.length; i++) {
    const item = exercise.items[i];
    const num = exercise.showNumbering ? `${i + 1}. ` : "";

    let questionHtml = escapeHtml(item.question);

    // Replace blanks with answer lines
    if (exercise.showAnswerLines) {
      const lineWidth = exercise.answerLineLength || 100;
      questionHtml = questionHtml.replace(
        /_{2,}|\[blank\]|\[___\]/g,
        `<span class="answer-line" style="min-width: ${lineWidth}px;"></span>`
      );
    }

    lines.push(`<div class="exercise-item">${num}${questionHtml}</div>`);

    // For multiple choice, show options
    if (exercise.type === "multiple_choice" && item.options) {
      lines.push('<div style="margin-left: 1.5em; margin-top: 0.25em;">');
      for (let j = 0; j < item.options.length; j++) {
        const letter = String.fromCharCode(97 + j); // a, b, c, d...
        lines.push(`<div>${letter}) ${escapeHtml(item.options[j])}</div>`);
      }
      lines.push('</div>');
    }
  }

  if (columns > 1) {
    lines.push('</div>');
  }

  lines.push('</div>');
  return lines.join('\n');
}

function renderVocabularyHtml(vocabulary: VocabularyItem[]): string {
  const lines: string[] = [];

  lines.push('<table class="vocabulary-table">');
  lines.push('<thead><tr><th>English</th><th>German</th><th>Example</th></tr></thead>');
  lines.push('<tbody>');

  for (const vocab of vocabulary) {
    lines.push(`<tr>
      <td><strong>${escapeHtml(vocab.term)}</strong></td>
      <td>${escapeHtml(vocab.termDe)}</td>
      <td>${escapeHtml(vocab.exampleSentence)}</td>
    </tr>`);
  }

  lines.push('</tbody></table>');
  return lines.join('\n');
}

function renderGrammarHtml(rule: GrammarRule): string {
  const lines: string[] = [];

  lines.push('<div class="grammar-box">');
  lines.push(`<h3>${escapeHtml(rule.name)}</h3>`);
  lines.push(`<p>${rule.rule}</p>`);

  if (rule.formula) {
    lines.push(`<div class="grammar-formula">${escapeHtml(rule.formula)}</div>`);
  }

  if (rule.examples && rule.examples.length > 0) {
    lines.push('<p><strong>Examples:</strong></p>');
    lines.push('<ul>');
    for (const ex of rule.examples) {
      lines.push(`<li>✓ ${escapeHtml(ex.correct)}`);
      if (ex.incorrect) {
        lines.push(` (Not: ✗ <s>${escapeHtml(ex.incorrect)}</s>)`);
      }
      lines.push('</li>');
    }
    lines.push('</ul>');
  }

  lines.push('</div>');
  return lines.join('\n');
}
