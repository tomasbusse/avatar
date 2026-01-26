/**
 * Educational Video Generator - Lesson Content Generation API
 *
 * Uses Anthropic Claude directly (like the working practice page) with OpenRouter fallback.
 * Supports grammar lessons (PPP method), news broadcasts, vocabulary, and conversation.
 * Includes Tavily web search for enriching lesson content.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getLessonPrompt,
  LESSON_SYSTEM_MESSAGE,
  LessonPromptInput,
} from "@/lib/video-generator/prompts";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes for AI generation

// Lazy init Convex client
let convex: ConvexHttpClient | null = null;
function getConvexClient(): ConvexHttpClient {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

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
      console.error("Tavily API error:", response.status);
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
    }

    return searchContent;
  } catch (error) {
    console.error("Tavily search error:", error);
    return "";
  }
}

/**
 * Call Anthropic API directly (like the working practice page)
 */
async function callAnthropicDirect(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; model: string } | { error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "ANTHROPIC_API_KEY not configured" };
  }

  console.log("Calling Anthropic Claude directly...");

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      console.log(`Anthropic response: ${content.text.length} chars`);
      return { content: content.text, model: "claude-sonnet-4" };
    }

    return { error: "Unexpected response format from Claude" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Anthropic API error:", errorMsg);
    return { error: errorMsg };
  }
}

/**
 * Call OpenRouter API as fallback
 */
async function callOpenRouterFallback(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; model: string } | { error: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { error: "OPENROUTER_API_KEY not configured" };
  }

  console.log("Calling OpenRouter fallback (GPT-4o)...");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://avatar-vert-phi.vercel.app",
        "X-Title": "Sweet Language School Video Generator",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        max_tokens: 8000,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`OpenRouter error (${response.status}):`, responseText);
      return { error: `API error ${response.status}: ${responseText}` };
    }

    const data = JSON.parse(responseText);

    if (data.error) {
      return { error: data.error.message };
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { error: "Empty response from OpenRouter" };
    }

    console.log(`OpenRouter response: ${content.length} chars`);
    return { content, model: "gpt-4o" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("OpenRouter error:", errorMsg);
    return { error: errorMsg };
  }
}

/**
 * Generate lesson content - tries Anthropic first, then OpenRouter fallback
 */
async function generateLessonContent(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; model: string } | { error: string }> {
  // Try Anthropic first (like the working practice page)
  if (process.env.ANTHROPIC_API_KEY) {
    const result = await callAnthropicDirect(systemPrompt, userPrompt);
    if (!("error" in result)) {
      return result;
    }
    console.log("Anthropic failed, trying OpenRouter fallback...");
  }

  // Fallback to OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    return callOpenRouterFallback(systemPrompt, userPrompt);
  }

  return { error: "No AI provider configured (need ANTHROPIC_API_KEY or OPENROUTER_API_KEY)" };
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

    console.log(`Generating lesson: ${topic} (${level}) - ${templateType}`);

    // Update status to generating
    await getConvexClient().mutation(api.educationalVideos.updateStatus, {
      videoId: videoId as Id<"educationalVideos">,
      status: "content_generating",
    });

    // Search for relevant content using Tavily
    let searchContent = "";
    const searchQuery = `${topic} ${level} English lesson teaching ESL`;

    console.log("Searching web for content...");
    searchContent = await searchWithTavily(searchQuery, 5);

    if (searchContent) {
      console.log("Web search found relevant content");
    }

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
        console.error("Error scraping URLs:", error);
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

    console.log("Calling AI to generate lesson content...");

    // Generate content
    const result = await generateLessonContent(LESSON_SYSTEM_MESSAGE, prompt);

    if ("error" in result) {
      console.error("AI generation failed:", result.error);

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

    console.log(`AI response received (model: ${result.model})`);

    // Parse the JSON response
    let lessonContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lessonContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing lesson content:", parseError);
      console.error("Raw response (first 500 chars):", result.content.slice(0, 500));

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

    console.log("Lesson content generated and stored successfully");

    return NextResponse.json({
      success: true,
      lessonContent: normalizedContent,
      model: result.model,
      message: "Lesson content generated successfully",
    });
  } catch (error) {
    console.error("Error generating lesson:", error);

    // Update status to failed if we have a videoId
    if (videoId) {
      try {
        await getConvexClient().mutation(api.educationalVideos.updateStatus, {
          videoId: videoId as Id<"educationalVideos">,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          errorStep: "content_generation",
        });
      } catch {
        // Ignore errors in error handling
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
