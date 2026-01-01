/**
 * HTML Slide Generator
 *
 * Generates self-contained HTML slides from structured LessonContent.
 * Each slide is designed for 16:9 aspect ratio display and can be
 * captured via html2canvas for avatar vision.
 */

import { LessonContent } from "@/lib/types/lesson-content";
import {
  HtmlSlide,
  SlideGeneratorOptions,
  DEFAULT_OPTIONS,
  DEFAULT_THEME,
} from "./types";
import {
  titleSlideTemplate,
  objectivesSlideTemplate,
  contentSlideTemplate,
  grammarSlideTemplate,
  vocabularySlideTemplate,
  exerciseSlideTemplate,
  summarySlideTemplate,
} from "./templates";

/**
 * Generate HTML slides from structured lesson content
 */
export function generateHtmlSlides(
  lessonContent: LessonContent,
  options: SlideGeneratorOptions = {}
): HtmlSlide[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const theme = opts.theme || DEFAULT_THEME;
  const slides: HtmlSlide[] = [];
  let slideIndex = 0;

  // 1. Title Slide
  slides.push({
    index: slideIndex++,
    type: "title",
    title: lessonContent.metadata.title,
    html: titleSlideTemplate(
      lessonContent.metadata.title,
      lessonContent.metadata.level,
      lessonContent.metadata.topic,
      lessonContent.metadata.estimatedMinutes,
      theme
    ),
    speakerNotes: `Welcome the student. Introduce the lesson: "${lessonContent.metadata.title}". This is a ${lessonContent.metadata.level} level lesson about ${lessonContent.metadata.topic}. Estimated duration: ${lessonContent.metadata.estimatedMinutes} minutes.`,
    teachingPrompt:
      "Greet the student warmly and provide a brief overview of what they'll learn today.",
  });

  // 2. Learning Objectives Slide
  if (lessonContent.content.learningObjectives.length > 0) {
    slides.push({
      index: slideIndex++,
      type: "objectives",
      title: "Learning Objectives",
      html: objectivesSlideTemplate(
        lessonContent.content.learningObjectives,
        opts.includeDeutsch || false,
        theme
      ),
      speakerNotes: `Explain the learning objectives: ${lessonContent.content.learningObjectives.map((o) => o.objective).join("; ")}`,
      teachingPrompt:
        "Go through each objective and explain what the student will be able to do by the end of this lesson.",
    });
  }

  // 3. Introduction Slide (if present)
  if (lessonContent.content.introduction?.content) {
    slides.push({
      index: slideIndex++,
      type: "content",
      title: lessonContent.content.introduction.title || "Introduction",
      html: contentSlideTemplate(
        lessonContent.content.introduction.title || "Introduction",
        lessonContent.content.introduction.content,
        theme
      ),
      speakerNotes: lessonContent.content.introduction.content,
      teachingPrompt:
        "Set the context for the lesson. Connect to what the student might already know.",
    });
  }

  // 4. Content Sections
  for (const section of lessonContent.content.sections) {
    slides.push({
      index: slideIndex++,
      type: "content",
      title: section.title,
      html: contentSlideTemplate(section.title, section.content, theme),
      speakerNotes: section.content,
      teachingPrompt: `Present this section clearly. ${section.type === "grammar" ? "Focus on the grammar concepts." : section.type === "dialogue" ? "Consider role-playing this dialogue." : "Check for understanding."}`,
    });
  }

  // 5. Grammar Rules (one slide per rule or group)
  for (const rule of lessonContent.content.grammarRules) {
    slides.push({
      index: slideIndex++,
      type: "grammar",
      title: rule.name,
      html: grammarSlideTemplate(
        rule.name,
        rule.rule,
        rule.formula,
        rule.examples,
        theme
      ),
      speakerNotes: `Grammar: ${rule.name}. ${rule.rule}. Formula: ${rule.formula || "N/A"}. Examples: ${rule.examples.map((e) => e.correct).join(", ")}`,
      teachingPrompt:
        "Explain this grammar rule step by step. Use the formula to help students remember the structure. Go through each example clearly.",
    });
  }

  // 6. Exercises (split if needed)
  for (const exercise of lessonContent.content.exercises) {
    const maxItems = opts.maxExerciseItemsPerSlide || 4;
    const totalSlides = Math.ceil(exercise.items.length / maxItems);

    for (let i = 0; i < totalSlides; i++) {
      const startIdx = i * maxItems;
      const slideItems = exercise.items.slice(startIdx, startIdx + maxItems);

      slides.push({
        index: slideIndex++,
        type: "exercise",
        title: exercise.title,
        html: exerciseSlideTemplate(
          exercise.title,
          exercise.instructions,
          exercise.type,
          slideItems.map((item) => ({
            question: item.question,
            options: item.options,
            hint: item.hint,
          })),
          i + 1,
          totalSlides,
          theme
        ),
        speakerNotes: `Exercise: ${exercise.title}. Type: ${exercise.type}. Instructions: ${exercise.instructions}. Items: ${slideItems.map((item) => item.question).join("; ")}`,
        teachingPrompt: `Guide the student through this ${exercise.type.replace(/_/g, " ")} exercise. Read the instructions, then work through each item. Provide feedback on answers.`,
      });
    }
  }

  // 7. Vocabulary (split if needed)
  if (lessonContent.content.vocabulary.length > 0) {
    const vocab = lessonContent.content.vocabulary;
    const maxPerSlide = opts.maxVocabPerSlide || 6;
    const totalSlides = Math.ceil(vocab.length / maxPerSlide);

    for (let i = 0; i < totalSlides; i++) {
      const startIdx = i * maxPerSlide;
      const slideVocab = vocab.slice(startIdx, startIdx + maxPerSlide);

      slides.push({
        index: slideIndex++,
        type: "vocabulary",
        title: "Vocabulary",
        html: vocabularySlideTemplate(
          slideVocab.map((v) => ({
            term: v.term,
            termDe: v.termDe,
            exampleSentence: v.exampleSentence,
            partOfSpeech: v.partOfSpeech,
          })),
          i + 1,
          totalSlides,
          theme
        ),
        speakerNotes: `Vocabulary items: ${slideVocab.map((v) => `${v.term} (${v.termDe})`).join(", ")}`,
        teachingPrompt:
          "Go through each vocabulary word. Pronounce it clearly, explain the meaning, and use it in a sentence. Ask the student to repeat.",
      });
    }
  }

  // 8. Summary Slide
  if (lessonContent.content.summary?.content) {
    // Extract key takeaways from learning objectives
    const keyTakeaways = lessonContent.content.learningObjectives
      .slice(0, 3)
      .map((obj) => obj.objective);

    slides.push({
      index: slideIndex++,
      type: "summary",
      title: "Lesson Summary",
      html: summarySlideTemplate(
        "Lesson Summary",
        lessonContent.content.summary.content,
        keyTakeaways,
        theme
      ),
      speakerNotes: `Summary: ${lessonContent.content.summary.content}. Key takeaways: ${keyTakeaways.join("; ")}`,
      teachingPrompt:
        "Wrap up the lesson. Review the key points and celebrate the student's progress. Ask if they have any questions.",
    });
  }

  return slides;
}

/**
 * Validate HTML slides data structure
 */
export function validateHtmlSlides(slides: HtmlSlide[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(slides)) {
    return { valid: false, errors: ["Slides must be an array"] };
  }

  slides.forEach((slide, i) => {
    if (typeof slide.index !== "number") {
      errors.push(`Slide ${i}: missing index`);
    }
    if (typeof slide.html !== "string" || slide.html.length < 50) {
      errors.push(`Slide ${i}: invalid or missing HTML content`);
    }
    if (!slide.type) {
      errors.push(`Slide ${i}: missing type`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get slide count by type
 */
export function getSlideStats(slides: HtmlSlide[]): Record<string, number> {
  const stats: Record<string, number> = {
    total: slides.length,
  };

  slides.forEach((slide) => {
    stats[slide.type] = (stats[slide.type] || 0) + 1;
  });

  return stats;
}

export type { HtmlSlide, SlideGeneratorOptions } from "./types";
