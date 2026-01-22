/**
 * Grammar Knowledge Slide Generator
 *
 * Generates HTML slides from grammar knowledge content structure
 * (different from LessonContent - used for "English Grammar in Use" units)
 */

import { HtmlSlide, SlideTheme, DEFAULT_THEME } from "./types";
import { getBaseStyles, escapeHtml } from "./templates";
import { SLS_COLORS } from "@/lib/brand-colors";

/**
 * Grammar knowledge content structure (from grammar import)
 */
export interface GrammarKnowledgeContent {
  cefrLevel: string;
  topic: string;
  type: string;
  grammarRules: Array<{
    rule: string;
    examples: string[];
  }>;
  commonMistakes: Array<{
    correct: string;
    wrong: string;
    explanation: string;
  }>;
  exercises: Array<{
    type: string;
    instruction: string;
    sentences: string[];
    answers?: string[];
    corrections?: string[]; // Alternative field name used in some exercises
  }>;
  vocabulary: Array<{
    term: string;
    translation: string;
  }>;
}

/**
 * Check if jsonContent matches grammar knowledge structure
 */
export function isGrammarKnowledgeContent(
  jsonContent: unknown
): jsonContent is GrammarKnowledgeContent {
  if (!jsonContent || typeof jsonContent !== "object") {
    return false;
  }
  const obj = jsonContent as Record<string, unknown>;

  // Grammar content has these top-level keys (no metadata/content wrapper)
  if (!obj.cefrLevel || typeof obj.cefrLevel !== "string") {
    return false;
  }
  if (!obj.topic || typeof obj.topic !== "string") {
    return false;
  }
  if (!obj.grammarRules || !Array.isArray(obj.grammarRules)) {
    return false;
  }

  return true;
}

/**
 * Generate HTML slides from grammar knowledge content
 */
export function generateGrammarSlides(
  content: GrammarKnowledgeContent,
  unitTitle: string,
  options: { maxRulesPerSlide?: number; maxExercisesPerSlide?: number } = {}
): HtmlSlide[] {
  const { maxRulesPerSlide = 3, maxExercisesPerSlide = 4 } = options;
  const theme = DEFAULT_THEME;
  const slides: HtmlSlide[] = [];
  let slideIndex = 0;

  // 1. Title Slide
  slides.push({
    index: slideIndex++,
    type: "title",
    title: unitTitle,
    html: grammarTitleSlide(unitTitle, content.cefrLevel, content.topic, theme),
    speakerNotes: `This is ${unitTitle}, a ${content.cefrLevel} level grammar lesson about ${content.topic.replace(/_/g, " ")}.`,
    teachingPrompt:
      "Introduce the grammar topic. Ask the student what they already know about this grammar point.",
  });

  // 2. Grammar Rules Slides (split if needed)
  const rules = content.grammarRules || [];
  if (rules.length > 0) {
    const totalRuleSlides = Math.ceil(rules.length / maxRulesPerSlide);

    for (let i = 0; i < totalRuleSlides; i++) {
      const startIdx = i * maxRulesPerSlide;
      const slideRules = rules.slice(startIdx, startIdx + maxRulesPerSlide);

      slides.push({
        index: slideIndex++,
        type: "grammar",
        title: "Grammar Rules",
        html: grammarRulesSlide(slideRules, i + 1, totalRuleSlides, theme),
        speakerNotes: `Grammar rules: ${slideRules.map((r) => r.rule).join("; ")}`,
        teachingPrompt:
          "Explain each grammar rule clearly. Use the examples to illustrate. Ask the student to repeat the examples.",
      });
    }
  }

  // 3. Common Mistakes Slide
  const commonMistakes = content.commonMistakes || [];
  if (commonMistakes.length > 0) {
    slides.push({
      index: slideIndex++,
      type: "grammar",
      title: "Common Mistakes",
      html: commonMistakesSlide(commonMistakes, theme),
      speakerNotes: `Common mistakes to avoid: ${commonMistakes.map((m) => `${m.wrong} should be ${m.correct}`).join("; ")}`,
      teachingPrompt:
        "Go through each common mistake. Explain why it's wrong and how to correct it. This is especially important for German speakers.",
    });
  }

  // 4. Vocabulary Slide
  const vocabulary = content.vocabulary || [];
  if (vocabulary.length > 0) {
    slides.push({
      index: slideIndex++,
      type: "vocabulary",
      title: "Vocabulary",
      html: grammarVocabularySlide(vocabulary, theme),
      speakerNotes: `Key vocabulary: ${vocabulary.map((v) => `${v.term} = ${v.translation}`).join(", ")}`,
      teachingPrompt:
        "Review the key vocabulary. Have the student repeat each term. Check pronunciation.",
    });
  }

  // 5. Exercise Slides
  const exercises = content.exercises || [];
  for (const exercise of exercises) {
    const sentences = exercise.sentences || [];
    if (sentences.length === 0) continue; // Skip empty exercises

    const totalExSlides = Math.ceil(sentences.length / maxExercisesPerSlide);
    // Handle both 'answers' and 'corrections' field names
    const answerSource = exercise.answers || exercise.corrections || [];

    for (let i = 0; i < totalExSlides; i++) {
      const startIdx = i * maxExercisesPerSlide;
      const slideSentences = sentences.slice(
        startIdx,
        startIdx + maxExercisesPerSlide
      );
      const slideAnswers = answerSource.slice(
        startIdx,
        startIdx + maxExercisesPerSlide
      );

      slides.push({
        index: slideIndex++,
        type: "exercise",
        title: "Practice",
        html: grammarExerciseSlide(
          exercise.type,
          exercise.instruction,
          slideSentences,
          slideAnswers,
          i + 1,
          totalExSlides,
          theme
        ),
        speakerNotes: `Exercise: ${exercise.instruction}. Sentences: ${slideSentences.join("; ")}`,
        teachingPrompt:
          "Work through each exercise item with the student. Give them time to think. Provide hints if needed, then reveal the answer.",
      });
    }
  }

  // 6. Summary Slide
  const rulesSummary = rules.map((r) => r.rule);
  slides.push({
    index: slideIndex++,
    type: "summary",
    title: "Summary",
    html: grammarSummarySlide(unitTitle, rulesSummary, theme),
    speakerNotes: `Summary of ${unitTitle}. ${rulesSummary.length > 0 ? `Key rules: ${rulesSummary.join("; ")}` : ""}`,
    teachingPrompt:
      "Review what was learned. Ask the student to explain one of the rules in their own words. Celebrate their progress!",
  });

  return slides;
}

// ===== Template Functions =====

function grammarTitleSlide(
  title: string,
  level: string,
  topic: string,
  theme: SlideTheme
): string {
  const formattedTopic = topic
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
      background: linear-gradient(135deg, ${SLS_COLORS.cream}60 0%, ${theme.background} 100%);
    }

    .title-slide h1 {
      font-size: 48px;
      margin-bottom: 24px;
      max-width: 90%;
    }

    .level-badge {
      display: inline-block;
      background: ${theme.primary};
      color: white;
      padding: 8px 24px;
      border-radius: 24px;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 1px;
      margin-bottom: 32px;
    }

    .topic {
      font-size: 24px;
      color: ${theme.muted};
      margin-top: 16px;
    }

    .grammar-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="slide title-slide">
    <div class="grammar-icon">📖</div>
    <span class="level-badge">${escapeHtml(level)}</span>
    <h1>${escapeHtml(title)}</h1>
    <p class="topic">${escapeHtml(formattedTopic)}</p>
  </div>
</body>
</html>`;
}

function grammarRulesSlide(
  rules: Array<{ rule: string; examples: string[] }>,
  slideNum: number,
  totalSlides: number,
  theme: SlideTheme
): string {
  const rulesHtml = rules
    .map(
      (r) => `
      <div class="rule-card">
        <div class="rule-text">${escapeHtml(r.rule)}</div>
        <div class="examples">
          ${r.examples.map((ex) => `<div class="example">→ ${escapeHtml(ex)}</div>`).join("")}
        </div>
      </div>
    `
    )
    .join("");

  const slideLabel = totalSlides > 1 ? ` (${slideNum}/${totalSlides})` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .rules-slide h2::after {
      content: "${slideLabel}";
      font-size: 16px;
      color: ${theme.muted};
      font-weight: normal;
      margin-left: 12px;
    }

    .rules-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      flex: 1;
    }

    .rule-card {
      background: ${SLS_COLORS.cream};
      border-left: 5px solid ${SLS_COLORS.orange};
      border-radius: 0 12px 12px 0;
      padding: 24px 28px;
    }

    .rule-text {
      font-size: 22px;
      font-weight: 600;
      color: ${theme.primary};
      margin-bottom: 12px;
    }

    .examples {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .example {
      font-size: 18px;
      color: ${theme.text};
      padding-left: 16px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="slide rules-slide">
    <h2>Grammar Rules</h2>
    <div class="rules-container">
      ${rulesHtml}
    </div>
  </div>
</body>
</html>`;
}

function commonMistakesSlide(
  mistakes: Array<{ correct: string; wrong: string; explanation: string }>,
  theme: SlideTheme
): string {
  const mistakesHtml = mistakes
    .map(
      (m) => `
      <div class="mistake-card">
        <div class="wrong">
          <span class="icon">✗</span>
          <span class="text">${escapeHtml(m.wrong)}</span>
        </div>
        <div class="correct">
          <span class="icon">✓</span>
          <span class="text">${escapeHtml(m.correct)}</span>
        </div>
        <div class="explanation">${escapeHtml(m.explanation)}</div>
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

    .mistakes-slide h2 {
      color: #dc2626;
    }

    .mistakes-slide h2::before {
      content: "⚠️ ";
    }

    .mistakes-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }

    .mistake-card {
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .wrong {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .wrong .icon {
      color: #dc2626;
      font-weight: bold;
      font-size: 20px;
    }

    .wrong .text {
      font-size: 18px;
      color: #dc2626;
      text-decoration: line-through;
    }

    .correct {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .correct .icon {
      color: ${theme.accent};
      font-weight: bold;
      font-size: 20px;
    }

    .correct .text {
      font-size: 18px;
      color: ${theme.accent};
      font-weight: 500;
    }

    .explanation {
      font-size: 14px;
      color: ${theme.muted};
      font-style: italic;
      padding-left: 32px;
    }
  </style>
</head>
<body>
  <div class="slide mistakes-slide">
    <h2>Common Mistakes</h2>
    <div class="mistakes-container">
      ${mistakesHtml}
    </div>
  </div>
</body>
</html>`;
}

function grammarVocabularySlide(
  vocabulary: Array<{ term: string; translation: string }>,
  theme: SlideTheme
): string {
  const vocabRows = vocabulary
    .map(
      (v) => `
      <tr>
        <td class="term">${escapeHtml(v.term)}</td>
        <td class="translation">${escapeHtml(v.translation)}</td>
      </tr>
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

    .vocab-slide h2::before {
      content: "📝 ";
    }

    .vocab-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 24px;
      font-size: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      overflow: hidden;
    }

    .vocab-table th {
      background: ${theme.primary};
      color: white;
      padding: 18px 24px;
      text-align: left;
      font-weight: 600;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .vocab-table td {
      padding: 18px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .vocab-table tr:last-child td {
      border-bottom: none;
    }

    .vocab-table tr:nth-child(even) {
      background: ${SLS_COLORS.cream};
    }

    .term {
      font-weight: 600;
      color: ${theme.primary};
    }

    .translation {
      color: ${theme.text};
    }
  </style>
</head>
<body>
  <div class="slide vocab-slide">
    <h2>Key Vocabulary</h2>
    <table class="vocab-table">
      <thead>
        <tr>
          <th>English</th>
          <th>German</th>
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

function grammarExerciseSlide(
  exerciseType: string,
  instruction: string,
  sentences: string[],
  answers: string[],
  slideNum: number,
  totalSlides: number,
  theme: SlideTheme
): string {
  const sentencesHtml = sentences
    .map(
      (s, i) => `
      <div class="exercise-item">
        <span class="number">${i + 1}</span>
        <span class="sentence">${escapeHtml(s)}</span>
      </div>
    `
    )
    .join("");

  const slideLabel = totalSlides > 1 ? ` (${slideNum}/${totalSlides})` : "";
  const formattedType = exerciseType.replace(/_/g, " ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .exercise-slide {
      background: linear-gradient(135deg, ${SLS_COLORS.beige}30 0%, ${theme.background} 100%);
    }

    .exercise-slide h2::after {
      content: "${slideLabel}";
      font-size: 16px;
      color: ${theme.muted};
      font-weight: normal;
      margin-left: 12px;
    }

    .exercise-type {
      display: inline-block;
      background: ${theme.primary}20;
      color: ${theme.primary};
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      text-transform: capitalize;
    }

    .instruction {
      font-size: 18px;
      color: ${theme.muted};
      font-style: italic;
      padding: 16px 20px;
      background: white;
      border-radius: 8px;
      margin-bottom: 24px;
      border-left: 4px solid ${theme.accent};
    }

    .exercises-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .exercise-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: white;
      padding: 16px 20px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .number {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      background: ${theme.primary};
      color: white;
      border-radius: 50%;
      font-weight: 600;
      font-size: 14px;
    }

    .sentence {
      font-size: 19px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="slide exercise-slide">
    <span class="exercise-type">${escapeHtml(formattedType)}</span>
    <h2>Practice</h2>
    <div class="instruction">${escapeHtml(instruction)}</div>
    <div class="exercises-container">
      ${sentencesHtml}
    </div>
  </div>
</body>
</html>`;
}

function grammarSummarySlide(
  title: string,
  rules: string[],
  theme: SlideTheme
): string {
  const rulesHtml = rules.map((r) => `<li>${escapeHtml(r)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${getBaseStyles(theme)}

    .summary-slide {
      background: linear-gradient(135deg, ${SLS_COLORS.beige}40 0%, ${theme.background} 100%);
    }

    .summary-slide h2::before {
      content: "🎯 ";
    }

    .summary-box {
      background: white;
      border-radius: 16px;
      padding: 32px 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      flex: 1;
    }

    .summary-title {
      font-size: 24px;
      color: ${theme.primary};
      margin-bottom: 24px;
      font-weight: 600;
    }

    .rules-list {
      list-style: none;
      padding: 0;
    }

    .rules-list li {
      font-size: 18px;
      padding: 12px 0;
      padding-left: 32px;
      position: relative;
      border-bottom: 1px solid #f0f0f0;
    }

    .rules-list li:last-child {
      border-bottom: none;
    }

    .rules-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: ${theme.accent};
      font-weight: bold;
    }

    .encouragement {
      text-align: center;
      margin-top: 32px;
      font-size: 28px;
    }
  </style>
</head>
<body>
  <div class="slide summary-slide">
    <h2>Summary</h2>
    <div class="summary-box">
      <div class="summary-title">${escapeHtml(title)}</div>
      <ul class="rules-list">
        ${rulesHtml}
      </ul>
      <div class="encouragement">🎉 Great work!</div>
    </div>
  </div>
</body>
</html>`;
}
