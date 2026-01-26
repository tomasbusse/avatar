/**
 * Educational Video Generator - Lesson Content Generation API
 *
 * Uses OpenRouter to generate AI-powered lesson content based on template type.
 * Supports grammar lessons (PPP method), news broadcasts, vocabulary, and conversation.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getLessonPrompt,
  LESSON_SYSTEM_MESSAGE,
  LessonPromptInput,
} from "@/lib/video-generator/prompts";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// OpenRouter API configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "anthropic/claude-sonnet-4"; // Can be configured

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      videoId,
      templateType,
      topic,
      level,
      targetDuration,
      nativeLanguage = "German",
      urls,
      additionalContext,
    } = body;

    // Validate required fields
    if (!videoId || !templateType || !topic || !level) {
      return NextResponse.json(
        {
          error: "Missing required fields: videoId, templateType, topic, level",
        },
        { status: 400 }
      );
    }

    // Check for OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Update status to generating
    await convex.mutation(api.educationalVideos.updateStatus, {
      videoId: videoId as Id<"educationalVideos">,
      status: "content_generating",
    });

    // Scrape content if URLs provided
    let scrapedContent = "";
    if (urls && urls.length > 0 && templateType === "news_broadcast") {
      try {
        // Use a simple fetch for now - can be enhanced with Tavily later
        const scrapedParts = await Promise.all(
          urls.slice(0, 3).map(async (url: string) => {
            try {
              const response = await fetch(url);
              const html = await response.text();
              // Extract text content (basic - can be enhanced)
              const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 5000);
              return `Source: ${url}\n${textContent}\n`;
            } catch {
              return "";
            }
          })
        );
        scrapedContent = scrapedParts.filter(Boolean).join("\n---\n");
      } catch (error) {
        console.error("Error scraping URLs:", error);
      }
    }

    // Build prompt input
    const promptInput: LessonPromptInput = {
      topic,
      level,
      targetDuration: targetDuration || 5,
      nativeLanguage,
      additionalContext,
      urls,
      scrapedContent: scrapedContent || undefined,
    };

    // Get the appropriate prompt
    const prompt = getLessonPrompt(templateType, promptInput);

    // Call OpenRouter API
    const openRouterResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://avatar-vert-phi.vercel.app",
        "X-Title": "Sweet Language School Video Generator",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 8000,
        messages: [
          {
            role: "system",
            content: LESSON_SYSTEM_MESSAGE,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text();
      console.error("OpenRouter API error:", errorData);

      await convex.mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: `OpenRouter API error: ${openRouterResponse.status}`,
        errorStep: "content_generation",
      });

      return NextResponse.json(
        { error: "OpenRouter API request failed", details: errorData },
        { status: 500 }
      );
    }

    const responseData: OpenRouterResponse = await openRouterResponse.json();

    // Check for API error in response
    if (responseData.error) {
      await convex.mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: responseData.error.message,
        errorStep: "content_generation",
      });

      return NextResponse.json(
        { error: "OpenRouter API error", details: responseData.error.message },
        { status: 500 }
      );
    }

    // Extract the text from OpenRouter response (OpenAI format)
    const responseText = responseData.choices?.[0]?.message?.content || "";

    if (!responseText) {
      await convex.mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: "Empty response from AI",
        errorStep: "content_generation",
      });

      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let lessonContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lessonContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing lesson content:", parseError);
      console.error("Raw response:", responseText);

      // Update status to failed
      await convex.mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: "Failed to parse AI-generated lesson content",
        errorStep: "content_generation",
      });

      return NextResponse.json(
        { error: "Failed to parse lesson content", rawResponse: responseText },
        { status: 500 }
      );
    }

    // Validate lesson content structure
    if (
      !lessonContent.objective ||
      !lessonContent.slides ||
      !lessonContent.fullScript
    ) {
      await convex.mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: "Invalid lesson content structure",
        errorStep: "content_validation",
      });

      return NextResponse.json(
        { error: "Invalid lesson content structure" },
        { status: 500 }
      );
    }

    // Ensure required fields have defaults
    const normalizedContent = {
      objective: lessonContent.objective,
      vocabulary: lessonContent.vocabulary || [],
      slides: lessonContent.slides.map((slide: Record<string, unknown>, index: number) => ({
        id: slide.id || `slide-${index}`,
        type: slide.type || "key_concept",
        title: slide.title,
        content: slide.content,
        items: slide.items,
        narration: slide.narration || "",
        durationSeconds: slide.durationSeconds,
        formula: slide.formula,
        correct: slide.correct,
        incorrect: slide.incorrect,
        options: slide.options,
        vocabulary: slide.vocabulary,
      })),
      questions: (lessonContent.questions || []).map(
        (q: Record<string, unknown>) => ({
          question: q.question,
          type: q.type || "multiple_choice",
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })
      ),
      keyTakeaways: lessonContent.keyTakeaways || [],
      fullScript: lessonContent.fullScript,
      estimatedDuration: lessonContent.estimatedDuration || targetDuration * 60,
    };

    // Store the generated content in Convex
    await convex.mutation(api.educationalVideos.storeLessonContent, {
      videoId: videoId as Id<"educationalVideos">,
      lessonContent: normalizedContent,
    });

    return NextResponse.json({
      success: true,
      lessonContent: normalizedContent,
      message: "Lesson content generated successfully",
    });
  } catch (error) {
    console.error("Error generating lesson:", error);

    return NextResponse.json(
      {
        error: "Failed to generate lesson content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
