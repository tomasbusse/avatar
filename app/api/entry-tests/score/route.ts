import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();

export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================
// TYPES
// ============================================

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface ScoringRequest {
  sessionId: string;
}

interface ScoredQuestion {
  instanceId: string;
  type: string;
  cefrLevel: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  aiEvaluation?: {
    score: number;
    feedback: string;
    criteriaScores?: Record<string, number>;
  };
}

interface SectionScore {
  sectionId: string;
  sectionType: string;
  rawScore: number;
  maxScore: number;
  percentScore: number;
  cefrLevel: string;
  aiEvaluation?: unknown;
}

// ============================================
// SCORING HELPERS
// ============================================

// CEFR level scoring weights
const LEVEL_VALUES: Record<CEFRLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

function valueToLevel(value: number): CEFRLevel {
  if (value <= 1.5) return "A1";
  if (value <= 2.5) return "A2";
  if (value <= 3.5) return "B1";
  if (value <= 4.5) return "B2";
  if (value <= 5.5) return "C1";
  return "C2";
}

// Score objective questions (MCQ, fill-blank, matching)
function scoreObjectiveQuestion(
  questionType: string,
  content: Record<string, unknown>,
  answer: unknown
): { isCorrect: boolean; score: number; maxScore: number } {
  switch (questionType) {
    case "grammar_mcq":
    case "vocabulary_mcq":
    case "listening_mcq": {
      const correctAnswer = content.correctAnswer as number;
      const isCorrect = answer === correctAnswer;
      return { isCorrect, score: isCorrect ? 1 : 0, maxScore: 1 };
    }

    case "grammar_fill_blank":
    case "listening_fill_blank": {
      const correctAnswers = content.correctAnswers as string[] || [content.correctAnswer as string];
      const studentAnswer = (answer as string || "").trim().toLowerCase();
      const isCorrect = correctAnswers.some(
        (a) => a.toLowerCase().trim() === studentAnswer
      );
      return { isCorrect, score: isCorrect ? 1 : 0, maxScore: 1 };
    }

    case "vocabulary_matching": {
      const pairs = content.pairs as Array<{ term: string; match: string }>;
      const answers = answer as Record<string, string>;
      let correct = 0;
      for (const pair of pairs) {
        if (answers[pair.term] === pair.match) {
          correct++;
        }
      }
      const isCorrect = correct === pairs.length;
      return { isCorrect, score: correct, maxScore: pairs.length };
    }

    case "reading_comprehension": {
      const questions = content.questions as Array<{ correctAnswer: number }>;
      const answers = answer as Record<number, number>;
      let correct = 0;
      for (let i = 0; i < questions.length; i++) {
        if (answers[i] === questions[i].correctAnswer) {
          correct++;
        }
      }
      const isCorrect = correct === questions.length;
      return { isCorrect, score: correct, maxScore: questions.length };
    }

    default:
      return { isCorrect: false, score: 0, maxScore: 1 };
  }
}

// Score subjective questions (writing, speaking) using AI
async function scoreSubjectiveQuestion(
  questionType: string,
  content: Record<string, unknown>,
  answer: unknown,
  cefrLevel: CEFRLevel,
  apiKey: string
): Promise<{
  score: number;
  maxScore: number;
  isCorrect: boolean;
  aiEvaluation: {
    score: number;
    feedback: string;
    criteriaScores: Record<string, number>;
  };
}> {
  const rubric = content.rubric as Record<string, string> | undefined;

  const prompt = `You are a Cambridge English Assessment expert evaluator.

Evaluate this ${questionType === "writing_prompt" ? "writing" : "speaking"} response.

**Task/Prompt:**
${content.prompt}

**Student Response:**
${questionType === "speaking_prompt" ? (answer as { transcript?: string })?.transcript || answer : answer}

**Target CEFR Level:** ${cefrLevel}

**Evaluation Criteria:**
${rubric ? Object.entries(rubric).map(([k, v]) => `- ${k}: ${v}`).join("\n") : "Content, Organization, Language Use, Accuracy"}

**Instructions:**
1. Evaluate the response against each criterion (score 0-5 each)
2. Provide an overall score out of 20
3. Provide brief, constructive feedback
4. Consider CEFR level expectations

Return JSON:
{
  "criteriaScores": {
    "content": 0-5,
    "organization": 0-5,
    "language": 0-5,
    "accuracy": 0-5
  },
  "overallScore": 0-20,
  "feedback": "Brief constructive feedback"
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Beethoven Entry Test Scorer",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku-20240307",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error("AI scoring failed");
    }

    const data = await response.json();
    const evaluation = JSON.parse(data.choices[0].message.content);

    const score = evaluation.overallScore || 0;
    const maxScore = 20;

    return {
      score,
      maxScore,
      isCorrect: score >= maxScore * 0.6, // 60% threshold
      aiEvaluation: {
        score,
        feedback: evaluation.feedback || "",
        criteriaScores: evaluation.criteriaScores || {},
      },
    };
  } catch (error) {
    console.error("AI scoring error:", error);
    // Fallback: give partial credit
    return {
      score: 10,
      maxScore: 20,
      isCorrect: true,
      aiEvaluation: {
        score: 10,
        feedback: "Unable to fully evaluate. Partial credit awarded.",
        criteriaScores: {},
      },
    };
  }
}

// Calculate overall CEFR level from section scores
function calculateOverallLevel(
  sectionScores: SectionScore[],
  questionScores: ScoredQuestion[]
): {
  recommendedLevel: CEFRLevel;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
} {
  // Weight sections by performance
  let totalWeight = 0;
  let weightedLevelSum = 0;

  for (const section of sectionScores) {
    const weight = section.percentScore / 100;
    const levelValue = LEVEL_VALUES[section.cefrLevel as CEFRLevel] || 3;
    weightedLevelSum += levelValue * weight;
    totalWeight += weight;
  }

  const avgLevelValue = totalWeight > 0 ? weightedLevelSum / totalWeight : 3;

  // Adjust based on actual question performance
  const correctByLevel: Record<CEFRLevel, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
    C2: { correct: 0, total: 0 },
  };

  for (const q of questionScores) {
    const level = q.cefrLevel as CEFRLevel;
    if (correctByLevel[level]) {
      correctByLevel[level].total++;
      if (q.isCorrect) {
        correctByLevel[level].correct++;
      }
    }
  }

  // Find highest level with >= 70% accuracy
  let determinedLevel: CEFRLevel = "A1";
  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]) {
    const stats = correctByLevel[level];
    if (stats.total > 0 && stats.correct / stats.total >= 0.7) {
      determinedLevel = level;
    }
  }

  // Average between weighted calculation and threshold-based determination
  const determinedValue = LEVEL_VALUES[determinedLevel];
  const finalValue = (avgLevelValue + determinedValue) / 2;
  const recommendedLevel = valueToLevel(finalValue);

  // Calculate confidence based on consistency
  const totalQuestions = questionScores.length;
  const correctQuestions = questionScores.filter((q) => q.isCorrect).length;
  const overallAccuracy = totalQuestions > 0 ? correctQuestions / totalQuestions : 0;

  // Confidence is higher when performance is consistent
  const confidenceScore = Math.round(
    Math.min(100, overallAccuracy * 100 + (totalQuestions >= 20 ? 20 : totalQuestions))
  );

  // Identify strengths and weaknesses by section
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const section of sectionScores) {
    if (section.percentScore >= 80) {
      strengths.push(section.sectionType);
    } else if (section.percentScore < 50) {
      weaknesses.push(section.sectionType);
    }
  }

  return {
    recommendedLevel,
    confidenceScore,
    strengths: strengths.length > 0 ? strengths : ["General comprehension"],
    weaknesses: weaknesses.length > 0 ? weaknesses : [],
  };
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ScoringRequest;
    const sessionId = body.sessionId as Id<"entryTestSessions">;

    // Get session with questions
    const session = await getConvex().query(api.entryTestSessions.getSessionWithQuestions, {
      sessionId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Scoring service not configured" },
        { status: 500 }
      );
    }

    // Score each question
    const scoredQuestions: ScoredQuestion[] = [];

    for (const instance of session.questionInstances) {
      const answer = session.answers?.find((a) => a.instanceId === instance.instanceId);

      if (!answer) {
        // Unanswered question
        scoredQuestions.push({
          instanceId: instance.instanceId,
          type: instance.type,
          cefrLevel: instance.cefrLevel,
          isCorrect: false,
          score: 0,
          maxScore: 1,
        });
        continue;
      }

      const questionType = instance.type;
      const content = instance.content as Record<string, unknown>;

      // Score based on question type
      if (questionType === "writing_prompt" || questionType === "speaking_prompt") {
        const result = await scoreSubjectiveQuestion(
          questionType,
          content,
          answer.answer,
          instance.cefrLevel as CEFRLevel,
          apiKey
        );
        scoredQuestions.push({
          instanceId: instance.instanceId,
          type: questionType,
          cefrLevel: instance.cefrLevel,
          ...result,
        });
      } else {
        const result = scoreObjectiveQuestion(questionType, content, answer.answer);
        scoredQuestions.push({
          instanceId: instance.instanceId,
          type: questionType,
          cefrLevel: instance.cefrLevel,
          ...result,
        });
      }
    }

    // Calculate section scores
    const sectionScores: SectionScore[] = [];
    const sections = session.template?.sections || [];

    for (const section of sections) {
      const sectionQuestions = scoredQuestions.filter(
        (q) =>
          session.questionInstances.find(
            (qi) => qi.instanceId === q.instanceId && qi.sectionId === section.id
          )
      );

      if (sectionQuestions.length === 0) continue;

      const rawScore = sectionQuestions.reduce((sum, q) => sum + q.score, 0);
      const maxScore = sectionQuestions.reduce((sum, q) => sum + q.maxScore, 0);
      const percentScore = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

      // Determine section CEFR level based on performance
      const avgCefrValue =
        sectionQuestions.reduce(
          (sum, q) => sum + (q.isCorrect ? LEVEL_VALUES[q.cefrLevel as CEFRLevel] : 0),
          0
        ) / Math.max(1, sectionQuestions.filter((q) => q.isCorrect).length);

      sectionScores.push({
        sectionId: section.id,
        sectionType: section.type || section.title,
        rawScore,
        maxScore,
        percentScore,
        cefrLevel: valueToLevel(avgCefrValue || 3),
      });
    }

    // Calculate overall result
    const { recommendedLevel, confidenceScore, strengths, weaknesses } =
      calculateOverallLevel(sectionScores, scoredQuestions);

    const totalScore = scoredQuestions.reduce((sum, q) => sum + q.score, 0);
    const maxPossibleScore = scoredQuestions.reduce((sum, q) => sum + q.maxScore, 0);
    const percentScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    // Store results in database
    await getConvex().mutation(api.entryTestSessions.storeResults, {
      sessionId,
      sectionScores,
      overallResult: {
        recommendedLevel,
        confidenceScore,
        totalScore,
        maxPossibleScore,
        percentScore,
        strengths,
        weaknesses,
        levelApplied: false,
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        recommendedLevel,
        percentScore,
        confidenceScore,
        sectionScores,
        strengths,
        weaknesses,
      },
    });
  } catch (error) {
    console.error("Scoring error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Scoring failed",
      },
      { status: 500 }
    );
  }
}
