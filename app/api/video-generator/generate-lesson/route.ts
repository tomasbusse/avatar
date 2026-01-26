/**
 * Educational Video Generator - Lesson Content Generation API
 *
 * Uses OpenRouter with Claude Sonnet 4 for AI-powered lesson content generation.
 * Includes Tavily web search for enriching lesson content.
 * Features exponential backoff retry for rate limits.
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
import { withRetry, requestSpacer } from "@/lib/video-generator/rate-limiter";

export const runtime = "nodejs";
export const maxDuration = 180; // 3 minutes for AI generation (increased for retries)

// Lazy init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

// OpenRouter configuration - Claude Opus 4.5
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-opus-4.5";

// Tavily API for web search
const TAVILY_API_URL = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

/**
 * Search the web using Tavily API
 */
async function searchWithTavily(query: string, maxResults: number = 5): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log("Tavily API key not configured, skipping web search");
    return "";
  }

  try {
    console.log(`[Tavily] Searching: "${query}"`);

    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      console.error("[Tavily] API error:", response.status);
      return "";
    }

    const data: TavilyResponse = await response.json();

    // Format results for the AI
    let searchContent = "";
    if (data.answer) {
      searchContent += `Summary: ${data.answer}\n\n`;
    }

    if (data.results && data.results.length > 0) {
      searchContent += "Sources:\n";
      for (const result of data.results.slice(0, maxResults)) {
        searchContent += `- ${result.title}\n  ${result.content.slice(0, 500)}\n  Source: ${result.url}\n\n`;
      }
      console.log(`[Tavily] Found ${data.results.length} results`);
    }

    return searchContent;
  } catch (error) {
    console.error("[Tavily] Search error:", error);
    return "";
  }
}

/**
 * Call OpenRouter API with Claude Opus 4.5
 * Includes exponential backoff retry for rate limits
 */
async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string } | { error: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { error: "OPENROUTER_API_KEY not configured" };
  }

  console.log(`[OpenRouter] Calling ${MODEL}...`);

  try {
    // Space requests to avoid burst rate limits (minimum 2s between requests)
    await requestSpacer.space("openrouter", 2000);

    const result = await withRetry(
      async () => {
        const response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://avatar-vert-phi.vercel.app",
            "X-Title": "Sweet Language School Video Generator",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 8000,
            temperature: 0.7,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        // Handle rate limits and server errors as retryable
        if (response.status === 429 || response.status === 503 || response.status === 502) {
          const errorText = await response.text();
          throw new Error(`Rate limit (${response.status}): ${errorText.slice(0, 200)}`);
        }

        if (!response.ok) {
          const errorText = await response.text();
          // Don't retry client errors (4xx except 429)
          if (response.status >= 400 && response.status < 500) {
            return { error: `OpenRouter API error ${response.status}: ${errorText}` };
          }
          throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.error) {
          console.error("[OpenRouter] Response error:", data.error);
          return { error: data.error.message || JSON.stringify(data.error) };
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          console.error("[OpenRouter] Empty response:", JSON.stringify(data));
          return { error: "Empty response from OpenRouter" };
        }

        console.log(`[OpenRouter] Success: ${content.length} chars`);
        return { content };
      },
      {
        maxRetries: 4,
        baseDelayMs: 3000, // Start with 3s delay for LLM rate limits
        maxDelayMs: 60000,
        onRetry: (attempt, delay, error) => {
          console.log(`[OpenRouter] Retry ${attempt}/4, waiting ${delay}ms: ${error.message.slice(0, 100)}`);
        },
      }
    );

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[OpenRouter] Final error after retries:", errorMsg);
    return { error: errorMsg };
  }
}

export async function POST(request: NextRequest) {
  let videoId: string | undefined;

  try {
    const body = await request.json();

    videoId = body.videoId;
    const {
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
          error: "Missing required fields",
          details: { videoId: !!videoId, templateType: !!templateType, topic: !!topic, level: !!level },
        },
        { status: 400 }
      );
    }

    console.log(`[Generate] Starting: "${topic}" (${level}) - ${templateType}`);

    // Update status to generating
    await getConvexClient().mutation(api.educationalVideos.updateStatus, {
      videoId: videoId as Id<"educationalVideos">,
      status: "content_generating",
    });

    // Search for relevant content using Tavily
    let searchContent = "";
    const searchQuery = `${topic} ${level} English lesson teaching ESL`;
    searchContent = await searchWithTavily(searchQuery, 5);

    // Also scrape provided URLs if any
    let scrapedContent = "";
    if (urls && urls.length > 0) {
      try {
        const scrapedParts = await Promise.all(
          urls.slice(0, 3).map(async (url: string) => {
            try {
              const response = await fetch(url, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; SLS-Bot/1.0)" }
              });
              const html = await response.text();
              const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 3000);
              return `Source: ${url}\n${textContent}\n`;
            } catch {
              return "";
            }
          })
        );
        scrapedContent = scrapedParts.filter(Boolean).join("\n---\n");
      } catch (error) {
        console.error("[Scrape] Error:", error);
      }
    }

    // Combine all research content
    const combinedResearch = [searchContent, scrapedContent].filter(Boolean).join("\n\n---\n\n");

    // Build prompt input
    const promptInput: LessonPromptInput = {
      topic,
      level,
      targetDuration: targetDuration || 5,
      nativeLanguage,
      additionalContext,
      urls,
      scrapedContent: combinedResearch || undefined,
    };

    // Get the appropriate prompt
    const prompt = getLessonPrompt(templateType, promptInput);

    // Call OpenRouter with Claude Opus 4.5
    const result = await callOpenRouter(LESSON_SYSTEM_MESSAGE, prompt);

    if ("error" in result) {
      console.error("[Generate] AI failed:", result.error);

      await getConvexClient().mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: result.error,
        errorStep: "content_generation",
      });

      return NextResponse.json(
        { error: "AI generation failed", details: result.error },
        { status: 500 }
      );
    }

    console.log("[Generate] Parsing AI response...");

    // Parse the JSON response
    let lessonContent;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lessonContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Generate] Parse error:", parseError);
      console.error("[Generate] Raw (first 500):", result.content.slice(0, 500));

      await getConvexClient().mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: "Failed to parse AI response as JSON",
        errorStep: "content_generation",
      });

      return NextResponse.json(
        { error: "Failed to parse lesson content", rawResponse: result.content.slice(0, 1000) },
        { status: 500 }
      );
    }

    // Validate lesson content structure
    if (!lessonContent.objective || !lessonContent.slides || !lessonContent.fullScript) {
      const missing = [];
      if (!lessonContent.objective) missing.push("objective");
      if (!lessonContent.slides) missing.push("slides");
      if (!lessonContent.fullScript) missing.push("fullScript");

      await getConvexClient().mutation(api.educationalVideos.updateStatus, {
        videoId: videoId as Id<"educationalVideos">,
        status: "failed",
        errorMessage: `Missing required fields: ${missing.join(", ")}`,
        errorStep: "content_validation",
      });

      return NextResponse.json(
        { error: "Invalid lesson content structure", missing },
        { status: 500 }
      );
    }

    // Normalize content with defaults
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
    await getConvexClient().mutation(api.educationalVideos.storeLessonContent, {
      videoId: videoId as Id<"educationalVideos">,
      lessonContent: normalizedContent,
    });

    console.log("[Generate] Success! Content stored.");

    return NextResponse.json({
      success: true,
      lessonContent: normalizedContent,
      model: MODEL,
      message: "Lesson content generated successfully",
    });
  } catch (error) {
    console.error("[Generate] Error:", error);

    if (videoId) {
      try {
        await getConvexClient().mutation(api.educationalVideos.updateStatus, {
          videoId: videoId as Id<"educationalVideos">,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          errorStep: "content_generation",
        });
      } catch {
        // Ignore
      }
    }

    return NextResponse.json(
      {
        error: "Failed to generate lesson content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
