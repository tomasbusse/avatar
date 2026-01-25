import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface TavilyExtractResult {
  url: string;
  raw_content: string;
}

/**
 * Clean raw article content from Tavily
 */
function cleanArticleContent(rawContent: string): string {
  if (!rawContent) return "";

  let cleaned = rawContent;

  // Remove image references
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, "");

  // Remove markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove standalone URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s\)]+/g, "");

  // Remove boilerplate patterns
  const boilerplatePatterns = [
    /^Skip to content.*$/gim,
    /^Share this.*$/gim,
    /^Save this.*$/gim,
    /^Copy link.*$/gim,
    /^Follow us.*$/gim,
    /^Subscribe.*$/gim,
    /^Advertisement.*$/gim,
    /^Related Topics.*$/gim,
    /^Related Stories.*$/gim,
    /^Cookie.*policy.*$/gim,
    /^Privacy.*policy.*$/gim,
  ];

  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Clean up markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+(.*)$/gm, "$1");

  // Remove horizontal rules
  cleaned = cleaned.replace(/^[-*_]{3,}$/gm, "");

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/^\s+|\s+$/gm, "");

  // Filter short lines
  cleaned = cleaned
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 3 && !/^[*\-_•·→←↑↓]+$/.test(trimmed);
    })
    .join("\n");

  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Build prompt for creating a video script from article content
 */
function buildScriptPrompt(title: string, content: string, targetDuration?: number): string {
  const durationNote = targetDuration
    ? `The script should be approximately ${targetDuration} seconds when read aloud (about ${Math.round(targetDuration * 2.5)} words).`
    : "The script should be 1-2 minutes when read aloud (150-300 words).";

  return `You are a professional scriptwriter for video presentations. Transform the following article into a compelling video script for a presenter to read.

REQUIREMENTS:
- Write in a conversational, engaging tone suitable for video
- Start with a strong hook to grab attention
- Present the key information clearly and concisely
- End with a brief summary or call to action
- Use short sentences and paragraphs for easy reading
- ${durationNote}
- Do NOT include stage directions, timestamps, or presenter instructions
- Write as continuous prose that flows naturally when spoken

ARTICLE TITLE: ${title}

ARTICLE CONTENT:
${content}

OUTPUT FORMAT:
Return ONLY the script text that the presenter will read. No headers, no formatting instructions, just the spoken content.

Begin:`;
}

/**
 * Generate script using Anthropic Claude
 */
async function generateScriptWithAnthropic(
  prompt: string
): Promise<{ content: string; summary: string; keyPoints: string[] }> {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const scriptContent = response.content[0];
  if (scriptContent.type !== "text") {
    throw new Error("Unexpected response format from Claude");
  }

  // Generate summary and key points
  const summaryResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Based on this video script, provide:
1. A one-sentence summary (max 50 words)
2. 3-5 key points (each max 10 words)

SCRIPT:
${scriptContent.text}

OUTPUT FORMAT (JSON):
{
  "summary": "...",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`,
      },
    ],
  });

  const summaryContent = summaryResponse.content[0];
  if (summaryContent.type !== "text") {
    return { content: scriptContent.text, summary: "", keyPoints: [] };
  }

  try {
    const parsed = JSON.parse(summaryContent.text);
    return {
      content: scriptContent.text,
      summary: parsed.summary || "",
      keyPoints: parsed.keyPoints || [],
    };
  } catch {
    return { content: scriptContent.text, summary: "", keyPoints: [] };
  }
}

/**
 * Generate script using OpenRouter
 */
async function generateScriptWithOpenRouter(
  prompt: string
): Promise<{ content: string; summary: string; keyPoints: string[] }> {
  const model = "google/gemini-2.0-flash-001";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Beethoven Video Script Generator",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const scriptContent = data.choices?.[0]?.message?.content;

  if (!scriptContent) {
    throw new Error("No content in OpenRouter response");
  }

  // Generate summary with a second call
  const summaryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Beethoven Video Script Generator",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: `Based on this video script, provide a JSON object with:
- "summary": one-sentence summary (max 50 words)
- "keyPoints": array of 3-5 key points (each max 10 words)

SCRIPT:
${scriptContent}

Return ONLY valid JSON.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (summaryResponse.ok) {
    const summaryData = await summaryResponse.json();
    const summaryText = summaryData.choices?.[0]?.message?.content;
    if (summaryText) {
      try {
        // Try to extract JSON from the response
        const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            content: scriptContent,
            summary: parsed.summary || "",
            keyPoints: parsed.keyPoints || [],
          };
        }
      } catch {
        // Fall through to default
      }
    }
  }

  return { content: scriptContent, summary: "", keyPoints: [] };
}

/**
 * Scrape URL content using Tavily Extract API
 */
export async function POST(request: NextRequest) {
  try {
    if (!TAVILY_API_KEY) {
      return NextResponse.json(
        { error: "TAVILY_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { url, generateScript = true, targetDuration } = body as {
      url: string;
      generateScript?: boolean;
      targetDuration?: number;
    };

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    console.log(`[Video Scrape] Fetching URL: ${url}`);

    // Use Tavily Extract API to get full content from the URL
    const response = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        urls: [url],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Tavily Extract API error:", error);
      return NextResponse.json(
        { error: `Failed to fetch URL content: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const results = data.results as TavilyExtractResult[];

    if (!results || results.length === 0 || !results[0].raw_content) {
      return NextResponse.json(
        { error: "No content found at the specified URL" },
        { status: 404 }
      );
    }

    const rawContent = results[0].raw_content;
    const cleanedContent = cleanArticleContent(rawContent);

    console.log(`[Video Scrape] Extracted ${cleanedContent.length} chars from URL`);

    // Extract title from content (first line or first heading)
    let title = "";
    const lines = cleanedContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        title = trimmed;
        break;
      }
    }

    // If generateScript is true, use LLM to create a video script
    let processedContent = {
      title: title || "Untitled Content",
      content: cleanedContent,
      summary: undefined as string | undefined,
      keyPoints: undefined as string[] | undefined,
      source: url,
      fetchedAt: Date.now(),
    };

    if (generateScript && cleanedContent.length > 100) {
      console.log(`[Video Scrape] Generating video script...`);

      const prompt = buildScriptPrompt(title, cleanedContent, targetDuration);

      let scriptResult: { content: string; summary: string; keyPoints: string[] } | null = null;

      // Try Anthropic first, then OpenRouter
      if (ANTHROPIC_API_KEY) {
        try {
          scriptResult = await generateScriptWithAnthropic(prompt);
          console.log(`[Video Scrape] Script generated with Anthropic`);
        } catch (error) {
          console.error("[Video Scrape] Anthropic failed:", error);
        }
      }

      if (!scriptResult && OPENROUTER_API_KEY) {
        try {
          scriptResult = await generateScriptWithOpenRouter(prompt);
          console.log(`[Video Scrape] Script generated with OpenRouter`);
        } catch (error) {
          console.error("[Video Scrape] OpenRouter failed:", error);
        }
      }

      if (scriptResult) {
        processedContent = {
          ...processedContent,
          content: scriptResult.content,
          summary: scriptResult.summary || undefined,
          keyPoints: scriptResult.keyPoints.length > 0 ? scriptResult.keyPoints : undefined,
        };
      }
    }

    console.log(`[Video Scrape] Complete. Title: "${processedContent.title.substring(0, 50)}..."`);

    return NextResponse.json({
      success: true,
      processedContent,
    });
  } catch (error) {
    console.error("Video scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
