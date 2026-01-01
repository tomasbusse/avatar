export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficiency",
};

export const LEARNING_GOALS = [
  { value: "career", label: "Career & Business" },
  { value: "travel", label: "Travel & Tourism" },
  { value: "exam", label: "Exam Preparation" },
  { value: "personal", label: "Personal Growth" },
  { value: "academic", label: "Academic Studies" },
] as const;

export const BILINGUAL_MODES = [
  { value: "adaptive", label: "Adaptive", description: "Switch to German when you struggle" },
  { value: "code_switching", label: "Natural Mix", description: "Natural bilingual conversation" },
  { value: "strict_separation", label: "Separate", description: "Clear language boundaries" },
  { value: "target_only", label: "English Only", description: "Full immersion mode" },
] as const;

export const SESSION_TYPES = [
  { value: "structured_lesson", label: "Structured Lesson", duration: 30 },
  { value: "quick_practice", label: "Quick Practice", duration: 10 },
  { value: "free_conversation", label: "Free Conversation", duration: 15 },
  { value: "vocabulary_review", label: "Vocabulary Review", duration: 10 },
] as const;

export const LESSON_CATEGORIES = [
  "business",
  "grammar",
  "vocabulary",
  "conversation",
  "pronunciation",
  "culture",
] as const;

export const TIER_LIMITS = {
  free: { lessons: 3, features: ["voice"] },
  essential: { lessons: 20, features: ["voice", "slides", "progress"] },
  premium: { lessons: -1, features: ["voice", "video", "slides", "progress", "vocabulary", "custom"] },
  business: { lessons: -1, features: ["all"] },
} as const;

export const APP_NAME = "Beethoven";
export const APP_DESCRIPTION = "AI-powered language learning with video avatars";
