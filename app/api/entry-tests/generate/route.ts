import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes max for batch generation

// ============================================
// TYPES
// ============================================

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type QuestionType =
  | "reading_comprehension"
  | "grammar_mcq"
  | "grammar_fill_blank"
  | "vocabulary_mcq"
  | "vocabulary_matching"
  | "listening_mcq"
  | "listening_fill_blank"
  | "writing_prompt"
  | "speaking_prompt";

interface GenerationRequest {
  questionType: QuestionType;
  cefrLevel: CEFRLevel;
  count: number;
  topic?: string;
  customPrompt?: string;
  model: string;
}

interface GenerationResponse {
  success: boolean;
  questions?: GeneratedQuestion[];
  error?: string;
  code?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
}

type DeliveryMode = "text" | "audio" | "avatar";

interface GeneratedQuestion {
  type: QuestionType;
  cefrLevel: CEFRLevel;
  content: unknown;
  tags: string[];
  deliveryMode: DeliveryMode;
}

// Smart defaults for delivery mode based on question type
function getDefaultDeliveryMode(type: QuestionType): DeliveryMode {
  switch (type) {
    case "listening_mcq":
    case "listening_fill_blank":
      return "audio"; // Listening questions need audio
    case "speaking_prompt":
      return "avatar"; // Speaking questions use video avatar
    case "reading_comprehension":
    case "grammar_mcq":
    case "grammar_fill_blank":
    case "vocabulary_mcq":
    case "vocabulary_matching":
    case "writing_prompt":
    default:
      return "text"; // Text-based by default
  }
}

// ============================================
// PROMPTS
// ============================================

function getSystemPrompt(): string {
  return `You are an expert Cambridge English Assessment question creator specializing in CEFR-aligned language testing.

Your task is to generate high-quality assessment questions that accurately test specific language skills at the appropriate CEFR level.

Key requirements:
- Questions must precisely target the specified CEFR level
- Follow Cambridge English Assessment best practices
- Include clear, unambiguous correct answers
- Provide plausible distractors for MCQ questions
- Use authentic, contextually appropriate language
- For German-speaking learners of English

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanations, no code blocks. Start your response with { and end with }. The JSON must match the exact structure requested.`;
}

function getQuestionPrompt(
  type: QuestionType,
  level: CEFRLevel,
  count: number,
  topic?: string,
  customPrompt?: string
): string {
  const topicContext = topic ? `Focus on the topic: "${topic}".` : "";
  const customContext = customPrompt ? `Additional instructions: ${customPrompt}` : "";

  const levelDescriptions: Record<CEFRLevel, string> = {
    A1: "Very basic vocabulary and simple sentences. Focus on familiar everyday expressions and very basic phrases.",
    A2: "Simple vocabulary and basic grammar. Can understand sentences about familiar topics and communicate in simple, routine tasks.",
    B1: "Intermediate vocabulary and grammar. Can deal with most situations likely to arise whilst travelling and can describe experiences and events.",
    B2: "Upper-intermediate complexity. Can understand the main ideas of complex text and can interact with a degree of fluency and spontaneity.",
    C1: "Advanced vocabulary and sophisticated grammar. Can express ideas fluently and spontaneously, using language flexibly for social, academic and professional purposes.",
    C2: "Near-native proficiency. Can understand with ease virtually everything heard or read and can summarize information from different spoken and written sources.",
  };

  const questionTypePrompts: Record<QuestionType, string> = {
    reading_comprehension: `Generate ${count} reading comprehension questions at CEFR ${level} level.
${levelDescriptions[level]}

Each question must include:
- A passage (100-300 words depending on level)
- 3-5 multiple choice questions about the passage
- Each MCQ has 4 options with exactly one correct answer

JSON structure for each question:
{
  "passage": "The reading text...",
  "questions": [
    {
      "question": "What is the main idea of the passage?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ],
  "vocabulary": ["word1", "word2"]
}`,

    grammar_mcq: `Generate ${count} grammar MCQ questions at CEFR ${level} level.
${levelDescriptions[level]}

Each question tests a specific grammar point appropriate for this level.
Grammar points by level:
- A1: Present simple, articles, basic prepositions, to be/have
- A2: Past simple, future with going to, comparatives, present continuous
- B1: Present perfect, conditionals (1st/2nd), passive voice, relative clauses
- B2: Past perfect, reported speech, mixed conditionals, advanced passive
- C1: Inversion, subjunctive, advanced tenses, complex clauses
- C2: All grammar structures, subtle distinctions, formal/informal register

JSON structure for each question:
{
  "sentence": "She _____ to the store yesterday.",
  "options": ["A) go", "B) goes", "C) went", "D) gone"],
  "correctAnswer": 2,
  "grammarPoint": "Past simple - regular verbs",
  "explanation": "We use 'went' because 'yesterday' indicates past time."
}`,

    grammar_fill_blank: `Generate ${count} fill-in-the-blank grammar questions at CEFR ${level} level.
${levelDescriptions[level]}

Each question is a sentence with a blank where students type the correct form.

JSON structure for each question:
{
  "sentence": "If I _____ (know) the answer, I would tell you.",
  "correctAnswers": ["knew", "had known"],
  "hint": "Think about the second conditional",
  "grammarPoint": "Second conditional",
  "explanation": "In second conditional, we use past simple after 'if'."
}`,

    vocabulary_mcq: `Generate ${count} vocabulary MCQ questions at CEFR ${level} level.
${levelDescriptions[level]}

Test vocabulary knowledge appropriate for this level through:
- Definition matching
- Contextual usage
- Synonyms/antonyms
- Collocations

JSON structure for each question:
{
  "context": "The sentence or context for the vocabulary item",
  "targetWord": "The word being tested",
  "question": "What does 'X' mean in this context?",
  "options": ["A) meaning1", "B) meaning2", "C) meaning3", "D) meaning4"],
  "correctAnswer": 0,
  "explanation": "Explanation of the correct meaning"
}`,

    vocabulary_matching: `Generate ${count} vocabulary matching exercises at CEFR ${level} level.
${levelDescriptions[level]}

Create matching pairs (words to definitions, synonyms, or translations).

JSON structure for each question:
{
  "instructions": "Match the words with their definitions",
  "pairs": [
    {"term": "word1", "match": "definition1"},
    {"term": "word2", "match": "definition2"},
    {"term": "word3", "match": "definition3"},
    {"term": "word4", "match": "definition4"}
  ],
  "topic": "Topic category"
}`,

    listening_mcq: `Generate ${count} listening comprehension MCQ questions at CEFR ${level} level.
${levelDescriptions[level]}

Note: This generates the text that will be converted to audio. Create realistic spoken dialogue or monologue.

JSON structure for each question:
{
  "audioText": "The text to be read aloud (dialogue or monologue)...",
  "audioContext": "Setting/context description",
  "questions": [
    {
      "question": "What does the speaker say about...?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": 0,
      "timestamp": "Beginning/Middle/End"
    }
  ]
}`,

    listening_fill_blank: `Generate ${count} listening fill-in-the-blank questions at CEFR ${level} level.
${levelDescriptions[level]}

Create a transcript with strategic blanks where students must write what they hear.

JSON structure for each question:
{
  "audioText": "The complete text that will be spoken",
  "displayText": "The text shown to students with _____ for blanks",
  "blanks": [
    {"position": 0, "answer": "correct word", "acceptableAnswers": ["word1", "word2"]}
  ],
  "audioContext": "Setting/context description"
}`,

    writing_prompt: `Generate ${count} writing prompts at CEFR ${level} level.
${levelDescriptions[level]}

Create structured writing tasks with clear requirements.
Task types by level:
- A1-A2: Form filling, short messages, postcards
- B1: Informal emails, simple articles, stories
- B2: Formal letters, articles, essays, reviews
- C1-C2: Reports, proposals, complex essays

JSON structure for each question:
{
  "prompt": "The writing task description",
  "taskType": "email/essay/article/etc",
  "requirements": ["Requirement 1", "Requirement 2"],
  "wordCount": {"min": 100, "max": 150},
  "rubric": {
    "content": "Criteria for content",
    "organization": "Criteria for organization",
    "language": "Criteria for language use",
    "accuracy": "Criteria for grammatical accuracy"
  }
}`,

    speaking_prompt: `Generate ${count} speaking prompts at CEFR ${level} level.
${levelDescriptions[level]}

Create structured speaking tasks with clear expectations.
Task types by level:
- A1-A2: Simple Q&A, describing pictures, personal information
- B1: Discussions, role-plays, expressing opinions
- B2: Debates, complex role-plays, presentations
- C1-C2: Abstract discussions, negotiations, formal presentations

JSON structure for each question:
{
  "prompt": "The speaking task description",
  "taskType": "discussion/roleplay/presentation/etc",
  "duration": {"min": 60, "max": 120},
  "followUpQuestions": ["Question 1", "Question 2"],
  "rubric": {
    "fluency": "Criteria for fluency",
    "pronunciation": "Criteria for pronunciation",
    "vocabulary": "Criteria for vocabulary range",
    "grammar": "Criteria for grammatical accuracy",
    "interaction": "Criteria for interactive communication"
  }
}`,
  };

  return `${questionTypePrompts[type]}

${topicContext}
${customContext}

Return a JSON object with this exact structure:
{
  "questions": [
    // Array of ${count} questions following the structure above
  ],
  "tags": ["suggested", "tags", "for", "these", "questions"]
}`;
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerationResponse>> {
  try {
    // 1. Auth check - get auth but don't block if session issues
    // The admin route is already protected by middleware
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError) {
      console.warn("[Entry Test Generation] Auth warning:", authError);
    }

    // Log for debugging
    console.log("[Entry Test Generation] userId:", userId ? "present" : "null");

    // 2. Parse request
    const body = (await request.json()) as GenerationRequest;

    // 3. Validate request
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // 4. Get API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OpenRouter API key not configured", code: "API_ERROR" },
        { status: 500 }
      );
    }

    // 5. Build prompts
    const systemPrompt = getSystemPrompt();
    const userPrompt = getQuestionPrompt(
      body.questionType,
      body.cefrLevel,
      body.count,
      body.topic,
      body.customPrompt
    );

    // 6. Call OpenRouter
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Beethoven Entry Test Generator",
      },
      body: JSON.stringify({
        model: body.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("[Entry Test Generation] OpenRouter error:", errorText);

      if (openRouterResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded. Please try again.", code: "RATE_LIMIT" },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to generate questions", code: "API_ERROR" },
        { status: 500 }
      );
    }

    const responseData = await openRouterResponse.json();

    // 7. Parse the generated content
    const rawContent = responseData.choices?.[0]?.message?.content || "";
    console.log("[Entry Test Generation] Raw content length:", rawContent.length);

    const parsedContent = parseGeneratedJSON(rawContent);
    if (!parsedContent) {
      console.error("[Entry Test Generation] Failed to parse JSON:", rawContent.slice(0, 500));
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response", code: "INVALID_JSON" },
        { status: 500 }
      );
    }

    // 8. Format questions
    const data = parsedContent as { questions: unknown[]; tags: string[] };
    const questions: GeneratedQuestion[] = (data.questions || []).map((q) => ({
      type: body.questionType,
      cefrLevel: body.cefrLevel,
      content: q,
      tags: data.tags || [],
      deliveryMode: getDefaultDeliveryMode(body.questionType),
    }));

    // 9. Calculate usage
    const usage = calculateUsage(responseData.usage, body.model);

    return NextResponse.json({
      success: true,
      questions,
      usage,
    });
  } catch (error) {
    console.error("[Entry Test Generation] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "API_ERROR",
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function validateRequest(body: GenerationRequest): string | null {
  const validTypes: QuestionType[] = [
    "reading_comprehension",
    "grammar_mcq",
    "grammar_fill_blank",
    "vocabulary_mcq",
    "vocabulary_matching",
    "listening_mcq",
    "listening_fill_blank",
    "writing_prompt",
    "speaking_prompt",
  ];

  const validLevels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

  if (!body.questionType || !validTypes.includes(body.questionType)) {
    return "Invalid question type";
  }

  if (!body.cefrLevel || !validLevels.includes(body.cefrLevel)) {
    return "Invalid CEFR level";
  }

  if (!body.count || body.count < 1 || body.count > 20) {
    return "Count must be between 1 and 20";
  }

  if (!body.model) {
    return "Model is required";
  }

  return null;
}

function parseGeneratedJSON(rawContent: string): unknown | null {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(rawContent);
  } catch {
    // Continue
  }

  // Strategy 2: Extract from markdown code blocks
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Strategy 3: Find JSON object boundaries
  const jsonStart = rawContent.indexOf("{");
  const jsonEnd = rawContent.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      return JSON.parse(rawContent.slice(jsonStart, jsonEnd + 1));
    } catch {
      // Continue
    }
  }

  return null;
}

function calculateUsage(
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  model: string
): { promptTokens: number; completionTokens: number; totalCost: number } {
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;

  // Cost estimates vary by model
  let costPerPromptToken = 0.000003;
  let costPerCompletionToken = 0.000015;

  // Adjust for known models
  if (model.includes("claude-3-haiku") || model.includes("gpt-4o-mini")) {
    costPerPromptToken = 0.00000025;
    costPerCompletionToken = 0.00000125;
  } else if (model.includes("claude-3-sonnet") || model.includes("gpt-4o")) {
    costPerPromptToken = 0.000003;
    costPerCompletionToken = 0.000015;
  } else if (model.includes("claude-3-opus") || model.includes("gpt-4-turbo")) {
    costPerPromptToken = 0.000015;
    costPerCompletionToken = 0.000075;
  }

  const totalCost =
    promptTokens * costPerPromptToken + completionTokens * costPerCompletionToken;

  return {
    promptTokens,
    completionTokens,
    totalCost: Math.round(totalCost * 10000) / 10000,
  };
}
