/**
 * HTML Slide Templates
 *
 * Self-contained HTML templates for each slide type.
 * All CSS is inline to ensure slides render without external dependencies.
 */

import { SlideTheme, DEFAULT_THEME } from "./types";

// Escape HTML special characters
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Base CSS styles shared across all slides
export function getBaseStyles(theme: SlideTheme = DEFAULT_THEME): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .slide {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      width: 100%;
      height: 100%;
      min-height: 540px;
      padding: 48px 64px;
      background: ${theme.background};
      color: ${theme.text};
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    h1, h2, h3 {
      font-family: 'Merriweather', Georgia, serif;
      color: ${theme.primary};
      font-weight: 700;
    }

    h1 {
      font-size: 42px;
      line-height: 1.2;
      margin-bottom: 24px;
    }

    h2 {
      font-size: 32px;
      line-height: 1.3;
      margin-bottom: 20px;
    }

    h3 {
      font-size: 24px;
      margin-bottom: 16px;
    }

    p {
      font-size: 20px;
      margin-bottom: 16px;
    }

    ul, ol {
      font-size: 20px;
      padding-left: 32px;
    }

    li {
      margin-bottom: 12px;
    }

    .muted {
      color: ${theme.muted};
    }

    .accent {
      color: ${theme.accent};
    }

    .primary {
      color: ${theme.primary};
    }

    .badge {
      display: inline-block;
      background: ${theme.primary};
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .slide-number {
      position: absolute;
      bottom: 24px;
      right: 32px;
      font-size: 14px;
      color: ${theme.muted};
    }
  `;
}

// Title Slide Template
export function titleSlideTemplate(
  title: string,
  level: string,
  topic: string,
  estimatedMinutes: number,
  theme: SlideTheme = DEFAULT_THEME
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .title-slide {
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, ${theme.background} 0%, #f8fafc 100%);
    }

    .title-slide h1 {
      font-size: 52px;
      margin-bottom: 32px;
      max-width: 90%;
    }

    .meta-row {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .topic {
      font-size: 24px;
      color: ${theme.muted};
      margin-top: 16px;
    }

    .duration {
      font-size: 18px;
      color: ${theme.muted};
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="slide title-slide">
    <div class="meta-row">
      <span class="badge">${escapeHtml(level)}</span>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p class="topic">${escapeHtml(topic)}</p>
    <p class="duration">${estimatedMinutes} minutes</p>
  </div>
</body>
</html>`;
}

// Learning Objectives Slide Template
export function objectivesSlideTemplate(
  objectives: Array<{ objective: string; objectiveDe?: string }>,
  includeDeutsch: boolean,
  theme: SlideTheme = DEFAULT_THEME
): string {
  const objectivesList = objectives
    .map(
      (obj, i) => `
      <li>
        <span class="objective-text">${escapeHtml(obj.objective)}</span>
        ${includeDeutsch && obj.objectiveDe ? `<span class="objective-de">${escapeHtml(obj.objectiveDe)}</span>` : ""}
      </li>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .objectives-slide {
      background: linear-gradient(135deg, #f0fdf4 0%, ${theme.background} 100%);
    }

    .objectives-box {
      background: white;
      border-left: 6px solid ${theme.accent};
      border-radius: 0 16px 16px 0;
      padding: 32px 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .objectives-box h2 {
      color: ${theme.accent};
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .objectives-box h2::before {
      content: "🎯";
      font-size: 28px;
    }

    .objectives-list {
      list-style: none;
      padding: 0;
    }

    .objectives-list li {
      display: flex;
      flex-direction: column;
      padding: 12px 0;
      padding-left: 32px;
      position: relative;
    }

    .objectives-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      top: 12px;
      color: ${theme.accent};
      font-weight: bold;
      font-size: 18px;
    }

    .objective-text {
      font-size: 22px;
      font-weight: 500;
    }

    .objective-de {
      font-size: 16px;
      color: ${theme.muted};
      font-style: italic;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="slide objectives-slide">
    <div class="objectives-box">
      <h2>Learning Objectives</h2>
      <ul class="objectives-list">
        ${objectivesList}
      </ul>
    </div>
  </div>
</body>
</html>`;
}

// Content Section Slide Template
export function contentSlideTemplate(
  title: string,
  content: string,
  theme: SlideTheme = DEFAULT_THEME
): string {
  // Convert markdown-style content to HTML
  const htmlContent = content
    .split("\n\n")
    .map((para) => `<p>${escapeHtml(para)}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .content-slide {
      justify-content: flex-start;
    }

    .content-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .content-body p {
      font-size: 22px;
      line-height: 1.7;
      max-width: 95%;
    }
  </style>
</head>
<body>
  <div class="slide content-slide">
    <h2>${escapeHtml(title)}</h2>
    <div class="content-body">
      ${htmlContent}
    </div>
  </div>
</body>
</html>`;
}

// Grammar Rule Slide Template
export function grammarSlideTemplate(
  name: string,
  rule: string,
  formula: string | undefined,
  examples: Array<{ correct: string; incorrect?: string; explanation?: string }>,
  theme: SlideTheme = DEFAULT_THEME
): string {
  const examplesList = examples
    .map(
      (ex) => `
      <div class="example-item">
        <div class="correct">✓ ${escapeHtml(ex.correct)}</div>
        ${ex.incorrect ? `<div class="incorrect">✗ ${escapeHtml(ex.incorrect)}</div>` : ""}
        ${ex.explanation ? `<div class="explanation">${escapeHtml(ex.explanation)}</div>` : ""}
      </div>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .grammar-slide h2 {
      color: #92400e;
    }

    .grammar-box {
      background: ${theme.grammar};
      border: 2px solid ${theme.grammarBorder};
      border-radius: 16px;
      padding: 28px 36px;
      margin-bottom: 24px;
    }

    .grammar-rule {
      font-size: 20px;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .formula-box {
      background: white;
      border-radius: 8px;
      padding: 16px 24px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 20px;
      color: ${theme.primary};
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .examples-section h3 {
      color: #92400e;
      font-size: 20px;
      margin-bottom: 16px;
    }

    .example-item {
      background: #fffbeb;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 12px;
    }

    .correct {
      color: ${theme.accent};
      font-size: 20px;
      font-weight: 500;
    }

    .incorrect {
      color: #dc2626;
      font-size: 18px;
      text-decoration: line-through;
      margin-top: 4px;
    }

    .explanation {
      font-size: 16px;
      color: ${theme.muted};
      font-style: italic;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="slide grammar-slide">
    <h2>${escapeHtml(name)}</h2>
    <div class="grammar-box">
      <p class="grammar-rule">${escapeHtml(rule)}</p>
      ${formula ? `<div class="formula-box">${escapeHtml(formula)}</div>` : ""}
    </div>
    <div class="examples-section">
      <h3>Examples</h3>
      ${examplesList}
    </div>
  </div>
</body>
</html>`;
}

// Vocabulary Slide Template
export function vocabularySlideTemplate(
  items: Array<{
    term: string;
    termDe: string;
    exampleSentence: string;
    partOfSpeech?: string;
  }>,
  slideNumber: number,
  totalVocabSlides: number,
  theme: SlideTheme = DEFAULT_THEME
): string {
  const vocabRows = items
    .map(
      (item) => `
      <tr>
        <td class="term-cell">
          <span class="term">${escapeHtml(item.term)}</span>
          ${item.partOfSpeech ? `<span class="pos">(${escapeHtml(item.partOfSpeech)})</span>` : ""}
        </td>
        <td class="german-cell">${escapeHtml(item.termDe)}</td>
        <td class="example-cell">${escapeHtml(item.exampleSentence)}</td>
      </tr>
    `
    )
    .join("");

  const slideLabel =
    totalVocabSlides > 1 ? ` (${slideNumber}/${totalVocabSlides})` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .vocabulary-slide h2::after {
      content: "${slideLabel}";
      font-size: 18px;
      color: ${theme.muted};
      font-weight: normal;
      margin-left: 12px;
    }

    .vocab-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 16px;
      font-size: 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      overflow: hidden;
    }

    .vocab-table th {
      background: ${theme.primary};
      color: white;
      padding: 16px 20px;
      text-align: left;
      font-weight: 600;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .vocab-table td {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }

    .vocab-table tr:last-child td {
      border-bottom: none;
    }

    .vocab-table tr:nth-child(even) {
      background: #f9fafb;
    }

    .vocab-table tr:hover {
      background: #f0f9ff;
    }

    .term-cell {
      width: 25%;
    }

    .term {
      font-weight: 600;
      color: ${theme.primary};
    }

    .pos {
      font-size: 14px;
      color: ${theme.muted};
      margin-left: 8px;
    }

    .german-cell {
      width: 25%;
      color: ${theme.text};
    }

    .example-cell {
      color: ${theme.muted};
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="slide vocabulary-slide">
    <h2>Vocabulary</h2>
    <table class="vocab-table">
      <thead>
        <tr>
          <th>English</th>
          <th>German</th>
          <th>Example</th>
        </tr>
      </thead>
      <tbody>
        ${vocabRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

// Exercise Slide Template
export function exerciseSlideTemplate(
  title: string,
  instructions: string,
  exerciseType: string,
  items: Array<{
    question: string;
    options?: string[];
    hint?: string;
  }>,
  slideNumber: number,
  totalExerciseSlides: number,
  theme: SlideTheme = DEFAULT_THEME
): string {
  const exerciseItems = items
    .map((item, i) => {
      let optionsHtml = "";
      if (item.options && item.options.length > 0) {
        optionsHtml = `
          <div class="options">
            ${item.options.map((opt, j) => `<span class="option">${String.fromCharCode(65 + j)}) ${escapeHtml(opt)}</span>`).join("")}
          </div>
        `;
      }

      return `
        <div class="exercise-item">
          <span class="item-number">${i + 1}</span>
          <div class="item-content">
            <p class="question">${escapeHtml(item.question)}</p>
            ${optionsHtml}
            ${item.hint ? `<p class="hint">💡 Hint: ${escapeHtml(item.hint)}</p>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  const slideLabel =
    totalExerciseSlides > 1 ? ` (${slideNumber}/${totalExerciseSlides})` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .exercise-slide {
      background: linear-gradient(135deg, #f0f9ff 0%, ${theme.background} 100%);
    }

    .exercise-header {
      margin-bottom: 24px;
    }

    .exercise-header h2::after {
      content: "${slideLabel}";
      font-size: 18px;
      color: ${theme.muted};
      font-weight: normal;
      margin-left: 12px;
    }

    .exercise-type {
      display: inline-block;
      background: ${theme.primary}15;
      color: ${theme.primary};
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .instructions {
      font-size: 18px;
      color: ${theme.muted};
      font-style: italic;
      padding: 16px 20px;
      background: white;
      border-radius: 8px;
      margin-bottom: 24px;
      border-left: 4px solid ${theme.primary};
    }

    .exercise-items {
      flex: 1;
    }

    .exercise-item {
      display: flex;
      gap: 16px;
      padding: 16px 20px;
      background: white;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .item-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: ${theme.primary};
      color: white;
      border-radius: 50%;
      font-weight: 600;
      flex-shrink: 0;
    }

    .item-content {
      flex: 1;
    }

    .question {
      font-size: 20px;
      margin-bottom: 8px;
    }

    .options {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 12px;
    }

    .option {
      background: #f3f4f6;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 16px;
    }

    .hint {
      font-size: 14px;
      color: ${theme.accent};
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="slide exercise-slide">
    <div class="exercise-header">
      <span class="exercise-type">${escapeHtml(exerciseType.replace(/_/g, " "))}</span>
      <h2>${escapeHtml(title)}</h2>
      <div class="instructions">${escapeHtml(instructions)}</div>
    </div>
    <div class="exercise-items">
      ${exerciseItems}
    </div>
  </div>
</body>
</html>`;
}

// Summary Slide Template
export function summarySlideTemplate(
  title: string,
  content: string,
  keyTakeaways: string[],
  theme: SlideTheme = DEFAULT_THEME
): string {
  const takeawaysList =
    keyTakeaways.length > 0
      ? `
    <div class="takeaways">
      <h3>Key Takeaways</h3>
      <ul>
        ${keyTakeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
      </ul>
    </div>
  `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .summary-slide {
      background: linear-gradient(135deg, #f3f4f6 0%, ${theme.background} 100%);
    }

    .summary-box {
      background: white;
      border-radius: 16px;
      padding: 36px 44px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .summary-content {
      font-size: 20px;
      line-height: 1.7;
      margin-bottom: 24px;
      flex: 1;
    }

    .takeaways {
      background: #f0fdf4;
      border-radius: 12px;
      padding: 20px 28px;
      margin-top: auto;
    }

    .takeaways h3 {
      color: ${theme.accent};
      font-size: 18px;
      margin-bottom: 12px;
    }

    .takeaways ul {
      margin: 0;
      padding-left: 24px;
    }

    .takeaways li {
      font-size: 17px;
      margin-bottom: 8px;
      color: ${theme.text};
    }

    .completion-badge {
      text-align: center;
      margin-top: 24px;
      font-size: 28px;
    }
  </style>
</head>
<body>
  <div class="slide summary-slide">
    <h2>${escapeHtml(title || "Lesson Summary")}</h2>
    <div class="summary-box">
      <div class="summary-content">
        ${content
          .split("\n\n")
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join("")}
      </div>
      ${takeawaysList}
      <div class="completion-badge">🎉</div>
    </div>
  </div>
</body>
</html>`;
}
