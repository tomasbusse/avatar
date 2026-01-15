/**
 * Cartesia Voice Presets
 *
 * Pre-configured voices from Cartesia's library for British English and German.
 * These voices are optimized for the Emma AI teaching platform.
 *
 * Voice IDs sourced from:
 * - https://cartesia.ai/voices/british-accent
 * - https://cartesia.ai/languages/german
 * - https://developer.signalwire.com/voice/tts/cartesia/
 */

export interface CartesiaVoicePreset {
  id: string;
  name: string;
  voiceId: string;
  language: "en" | "de";
  gender: "female" | "male";
  accent?: "british" | "american" | "german";
  description: string;
  useCase: string[];
  tags: string[];
}

/**
 * British English Voices
 * These voices have authentic British accents, ideal for Emma's English teaching.
 */
export const BRITISH_ENGLISH_VOICES: CartesiaVoicePreset[] = [
  {
    id: "british_reading_lady",
    name: "British Reading Lady",
    voiceId: "71a7ad14-091c-4e8e-a314-022ece01c121",
    language: "en",
    gender: "female",
    accent: "british",
    description: "Calm and elegant voice with a British accent, perfect for storytelling and narration",
    useCase: ["lessons", "reading", "storytelling"],
    tags: ["calm", "elegant", "storytelling"],
  },
  {
    id: "british_narration_lady",
    name: "British Narration Lady",
    voiceId: "4d2fd738-3b3d-4368-957a-bb4805275bd9",
    language: "en",
    gender: "female",
    accent: "british",
    description: "Professional British female voice suited for narration and educational content",
    useCase: ["narration", "educational", "professional"],
    tags: ["professional", "narration", "clear"],
  },
  {
    id: "british_lady",
    name: "British Lady",
    voiceId: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    language: "en",
    gender: "female",
    accent: "british",
    description: "Versatile British female voice with natural warmth",
    useCase: ["conversation", "general", "teaching"],
    tags: ["warm", "versatile", "natural"],
  },
  {
    id: "british_customer_support_lady",
    name: "British Customer Support Lady",
    voiceId: "a01c369f-6d2d-4185-bc20-b32c225eab70",
    language: "en",
    gender: "female",
    accent: "british",
    description: "Friendly and helpful British female voice, ideal for interactive conversations",
    useCase: ["support", "conversation", "interactive"],
    tags: ["friendly", "helpful", "patient"],
  },
  {
    id: "claire",
    name: "Claire",
    voiceId: "248be419-c632-4f23-adf1-5324ed7dbf1d",
    language: "en",
    gender: "female",
    accent: "british",
    description: "Refined and versatile British voice with warmth, clarity, and professionalism. Perfect for commercial reads, corporate narrations, and e-learning",
    useCase: ["e-learning", "corporate", "commercial"],
    tags: ["refined", "professional", "warm", "clear"],
  },
  {
    id: "confident_british_man",
    name: "Confident British Man",
    voiceId: "63ff761f-c1e8-414b-b969-d1833d1c870c",
    language: "en",
    gender: "male",
    accent: "british",
    description: "Confident and authoritative British male voice",
    useCase: ["presentations", "professional", "authoritative"],
    tags: ["confident", "authoritative", "professional"],
  },
  {
    id: "classy_british_man",
    name: "Classy British Man",
    voiceId: "95856005-0332-41b0-935f-352e296aa0df",
    language: "en",
    gender: "male",
    accent: "british",
    description: "Sophisticated and classy British male voice with refined diction",
    useCase: ["narration", "luxury", "sophisticated"],
    tags: ["classy", "sophisticated", "refined"],
  },
  {
    id: "the_oracle",
    name: "The Oracle",
    voiceId: "87748186-23bb-4f5d-8db3-bcc0509b13a7",
    language: "en",
    gender: "male",
    accent: "british",
    description: "A British male voice that carries the wisdom and gravitas of an oracle, ideal for character-driven storytelling",
    useCase: ["storytelling", "character", "dramatic"],
    tags: ["wise", "gravitas", "dramatic"],
  },
  {
    id: "benedict",
    name: "Benedict",
    voiceId: "694f9389-aac1-45b6-b726-9d9369183238",
    language: "en",
    gender: "male",
    accent: "british",
    description: "Fast-paced British male voice with sharp clarity and engaging delivery, perfect for dynamic narrations and documentaries",
    useCase: ["documentaries", "dynamic", "informative"],
    tags: ["fast-paced", "clear", "engaging"],
  },
];

/**
 * German Voices
 * Native German voices for bilingual teaching and German language practice.
 */
export const GERMAN_VOICES: CartesiaVoicePreset[] = [
  {
    id: "german_conversational_woman",
    name: "German Conversational Woman",
    voiceId: "3f4ade23-6eb4-4279-ab05-6a144947c4d5",
    language: "de",
    gender: "female",
    accent: "german",
    description: "Rich and friendly voice, perfect for casual conversations in German",
    useCase: ["conversation", "casual", "interactive"],
    tags: ["friendly", "conversational", "natural"],
  },
  {
    id: "lena",
    name: "Lena",
    voiceId: "5619d38c-cf51-4d8e-9575-48f61a280571",
    language: "de",
    gender: "female",
    accent: "german",
    description: "Warm and expressive German female voice, great for audiobooks and clear communication",
    useCase: ["audiobooks", "educational", "clear"],
    tags: ["warm", "expressive", "clear"],
  },
  {
    id: "alina",
    name: "Alina",
    voiceId: "e91cb5d3-6e4a-4cdf-8f3a-2e3c2d7a25a3",
    language: "de",
    gender: "female",
    accent: "german",
    description: "Warm, engaging German voice designed for seamless and natural conversations. Perfect for phone systems, virtual assistants, and customer service",
    useCase: ["assistants", "customer-service", "phone"],
    tags: ["warm", "engaging", "smooth"],
  },
  {
    id: "sabine",
    name: "Sabine",
    voiceId: "db9e4a4f-c9e5-4d67-b1f4-7e3c4f8e6a12",
    language: "de",
    gender: "female",
    accent: "german",
    description: "A deeper feminine voice with a smooth, calm energy. Great for conversations and narrating calming stories",
    useCase: ["narration", "calm", "stories"],
    tags: ["deep", "calm", "smooth"],
  },
  {
    id: "german_reporter_woman",
    name: "German Reporter Woman",
    voiceId: "119e03e4-0705-43c9-b3ac-a658ce2b6639",
    language: "de",
    gender: "female",
    accent: "german",
    description: "Professional German female voice with news reporter clarity and authority",
    useCase: ["news", "professional", "reporting"],
    tags: ["professional", "clear", "authoritative"],
  },
  {
    id: "german_woman",
    name: "German Woman",
    voiceId: "b9de4a89-2257-424b-94c2-db18ba68c81a",
    language: "de",
    gender: "female",
    accent: "german",
    description: "Versatile German female voice for general use",
    useCase: ["general", "versatile", "teaching"],
    tags: ["versatile", "natural", "general"],
  },
  {
    id: "sebastian",
    name: "Sebastian",
    voiceId: "ee7ea9f8-c0c1-498c-9f62-5c6aff8d4c6f",
    language: "de",
    gender: "male",
    accent: "german",
    description: "Warm and expressive German male voice, great for audiobooks and clear communication",
    useCase: ["audiobooks", "educational", "clear"],
    tags: ["warm", "expressive", "clear"],
  },
  {
    id: "nico",
    name: "Nico",
    voiceId: "3a63e2d1-1c8e-4c9a-b5d2-6f4a3e7c8d9b",
    language: "de",
    gender: "male",
    accent: "german",
    description: "Casual, conversational German male voice great for phone calls and conversational agents",
    useCase: ["conversation", "phone", "casual"],
    tags: ["casual", "conversational", "friendly"],
  },
  {
    id: "german_storyteller_man",
    name: "German Storyteller Man",
    voiceId: "db229dfe-f5de-4be4-91fd-7b077c158578",
    language: "de",
    gender: "male",
    accent: "german",
    description: "Smooth and deliberate voice, perfect for narrating stories in German",
    useCase: ["storytelling", "narration", "audiobooks"],
    tags: ["smooth", "deliberate", "storytelling"],
  },
  {
    id: "german_conversation_man",
    name: "German Conversation Man",
    voiceId: "384b625b-da5d-49e8-a76d-a2855d4f31eb",
    language: "de",
    gender: "male",
    accent: "german",
    description: "Rich and earnest voice, perfect for conversations and customer support in German",
    useCase: ["conversation", "support", "customer-service"],
    tags: ["rich", "earnest", "supportive"],
  },
  {
    id: "german_reporter_man",
    name: "German Reporter Man",
    voiceId: "3f6e78a8-5283-42aa-b5e7-af82e8bb310c",
    language: "de",
    gender: "male",
    accent: "german",
    description: "Professional German male voice with news reporter clarity",
    useCase: ["news", "professional", "reporting"],
    tags: ["professional", "clear", "authoritative"],
  },
  {
    id: "friendly_german_man",
    name: "Friendly German Man",
    voiceId: "fb9fcab6-aba5-49ec-8d7e-3f1100296dde",
    language: "de",
    gender: "male",
    accent: "german",
    description: "Approachable and friendly German male voice",
    useCase: ["conversation", "friendly", "teaching"],
    tags: ["friendly", "approachable", "warm"],
  },
];

/**
 * All voice presets combined
 */
export const ALL_CARTESIA_VOICE_PRESETS: CartesiaVoicePreset[] = [
  ...BRITISH_ENGLISH_VOICES,
  ...GERMAN_VOICES,
];

/**
 * Voice presets grouped by language and gender
 */
export const VOICE_PRESETS_BY_CATEGORY = {
  "British English - Female": BRITISH_ENGLISH_VOICES.filter(v => v.gender === "female"),
  "British English - Male": BRITISH_ENGLISH_VOICES.filter(v => v.gender === "male"),
  "German - Female": GERMAN_VOICES.filter(v => v.gender === "female"),
  "German - Male": GERMAN_VOICES.filter(v => v.gender === "male"),
};

/**
 * Recommended voices for Emma AI teaching platform
 * These are curated for the best teaching experience
 */
export const RECOMMENDED_VOICES = {
  // Recommended English voice for Emma (warm, clear, professional)
  english: BRITISH_ENGLISH_VOICES.find(v => v.id === "claire") || BRITISH_ENGLISH_VOICES[0],
  // Recommended German voice for Emma (warm, expressive)
  german: GERMAN_VOICES.find(v => v.id === "lena") || GERMAN_VOICES[0],
};

/**
 * Helper function to get voice by ID
 */
export function getVoicePresetById(id: string): CartesiaVoicePreset | undefined {
  return ALL_CARTESIA_VOICE_PRESETS.find(v => v.id === id);
}

/**
 * Helper function to get voice by Cartesia voice ID
 */
export function getVoicePresetByVoiceId(voiceId: string): CartesiaVoicePreset | undefined {
  return ALL_CARTESIA_VOICE_PRESETS.find(v => v.voiceId === voiceId);
}

/**
 * Helper function to get voices by language
 */
export function getVoicePresetsByLanguage(language: "en" | "de"): CartesiaVoicePreset[] {
  return ALL_CARTESIA_VOICE_PRESETS.filter(v => v.language === language);
}

/**
 * Helper function to get voices by tags
 */
export function getVoicePresetsByTags(tags: string[]): CartesiaVoicePreset[] {
  return ALL_CARTESIA_VOICE_PRESETS.filter(v =>
    tags.some(tag => v.tags.includes(tag))
  );
}
