import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface TavilyExtractResult {
  url: string;
  raw_content: string;
}

interface ScrapedSource {
  url: string;
  title: string;
  content: string;
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
 * Build prompt for creating a video script from article content (single source)
 */
function buildScriptPrompt(title: string, content: string, targetWordCount?: number): string {
  const wordCount = targetWordCount || 300;
  const durationNote = `The script MUST be approximately ${wordCount} words (about ${Math.round(wordCount / 150)} minutes when read aloud). This word count is CRITICAL - do not write significantly more or less.`;

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
 * Build prompt for creating a video script from multiple sources
 */
function buildMultiSourceScriptPrompt(sources: ScrapedSource[], targetWordCount?: number): string {
  const wordCount = targetWordCount || 450;
  const durationNote = `The script MUST be approximately ${wordCount} words (about ${Math.round(wordCount / 150)} minutes when read aloud). This word count is CRITICAL - do not write significantly more or less.`;

  const sourcesText = sources.map((s, i) => `
--- SOURCE ${i + 1}: ${s.title} ---
${s.content}
`).join("\n");

  return `You are a professional scriptwriter for video presentations. Synthesize the following ${sources.length} articles into ONE compelling, cohesive video script for a presenter to read.

REQUIREMENTS:
- Combine information from ALL sources into a unified narrative
- Write in a conversational, engaging tone suitable for video
- Start with a strong hook that captures the overall theme
- Present the key information clearly and concisely
- Connect related points across sources naturally
- End with a comprehensive summary or call to action
- Use short sentences and paragraphs for easy reading
- ${durationNote}
- Do NOT include stage directions, timestamps, or presenter instructions
- Write as continuous prose that flows naturally when spoken
- Do NOT mention "according to source 1" or similar - present as one unified piece

${sourcesText}

OUTPUT FORMAT:
Return ONLY the script text that the presenter will read. No headers, no formatting instructions, just the spoken content.

Begin:`;
}

/**
 * Build prompt for completely rewriting news content with Opus 4.5
 */
function buildOpusRewritePrompt(
  content: string,
  videoStyle: string,
  targetWordCount?: number
): string {
  const wordCount = targetWordCount || 450;
  const durationNote = `Target length: EXACTLY ${wordCount} words (about ${Math.round(wordCount / 150)} minutes when read aloud). This word count is CRITICAL and MUST be followed precisely.`;

  const styleInstructions = videoStyle === "news_broadcast"
    ? `STYLE: Professional news broadcast
- Use authoritative yet accessible tone
- Start with a clear headline-style hook
- Present facts in descending order of importance (inverted pyramid)
- Use active voice and present tense where possible
- Include transitions between topics ("Meanwhile...", "In related news...", "Turning to...")
- End with a forward-looking statement or call to action
- Sound like a professional news anchor`
    : `STYLE: Professional video presentation
- Use conversational but informative tone
- Start with an engaging hook question or statement
- Build narrative arc with clear beginning, middle, end
- Make complex information accessible
- End with key takeaway or call to action`;

  return `You are an expert broadcast journalist and video scriptwriter. Your task is to COMPLETELY REWRITE the following content into an original, professional video script.

CRITICAL INSTRUCTIONS:
- This is NOT a summary or adaptation - you must REWRITE the content entirely
- Use your own words, phrasing, and structure
- The final script should be original enough to avoid any copyright concerns
- Maintain factual accuracy while expressing ideas in fresh ways
- Add professional polish, better transitions, and engaging delivery
- ${durationNote}

${styleInstructions}

TECHNICAL REQUIREMENTS:
- Write as continuous prose - no bullet points, headers, or formatting
- No stage directions, timestamps, or "[pause]" instructions
- Every word should be spoken by the presenter
- Natural speech patterns with varied sentence lengths
- Easy to read aloud with proper pacing

ORIGINAL CONTENT TO REWRITE:
${content}

OUTPUT:
Write the complete, ready-to-read video script below. Return ONLY the script text, nothing else.

`;
}

/**
 * Rewrite content using Opus 4.5 for highest quality output
 */
async function rewriteWithOpus(
  content: string,
  videoStyle: string,
  targetWordCount?: number
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = buildOpusRewritePrompt(content, videoStyle, targetWordCount);

  console.log(`[Video Scrape] Rewriting with Opus 4.5...`);

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20250101",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const result = response.content[0];
  if (result.type !== "text") {
    throw new Error("Unexpected response format from Opus");
  }

  console.log(`[Video Scrape] Opus rewrite complete (${result.text.split(/\s+/).length} words)`);
  return result.text;
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
 * Extract title from cleaned content
 */
function extractTitle(content: string): string {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && trimmed.length < 200) {
      return trimmed;
    }
  }
  return "Untitled Content";
}

/**
 * Scrape URL content using Tavily Extract API
 * Supports single URL (url param) or multiple URLs (urls param)
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
    const {
      url,
      urls,
      generateScript = true,
      rewriteWithOpus: shouldRewrite = false,
      videoStyle = "simple",
      targetDuration,
      targetWordCount,
    } = body as {
      url?: string;
      urls?: string[];
      generateScript?: boolean;
      rewriteWithOpus?: boolean;
      videoStyle?: string;
      targetDuration?: number;
      targetWordCount?: number;
    };

    // Convert word count to duration if provided (approx 150 words per minute)
    const effectiveDuration = targetWordCount
      ? Math.round(targetWordCount / 2.5) // words to seconds
      : targetDuration;
    const effectiveWordCount = targetWordCount || (targetDuration ? Math.round(targetDuration * 2.5) : 400);

    // Support both single url and multiple urls
    const urlList: string[] = urls && urls.length > 0
      ? urls.filter((u: string) => u.trim())
      : url
        ? [url]
        : [];

    if (urlList.length === 0) {
      return NextResponse.json(
        { error: "At least one URL is required" },
        { status: 400 }
      );
    }

    console.log(`[Video Scrape] Fetching ${urlList.length} URL(s): ${urlList.join(", ")}`);

    // Use Tavily Extract API to get full content from all URLs
    const response = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        urls: urlList,
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

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "No content found at the specified URL(s)" },
        { status: 404 }
      );
    }

    // Process all scraped sources
    const scrapedSources: ScrapedSource[] = [];
    for (const result of results) {
      if (result.raw_content) {
        const cleanedContent = cleanArticleContent(result.raw_content);
        if (cleanedContent.length > 50) {
          scrapedSources.push({
            url: result.url,
            title: extractTitle(cleanedContent),
            content: cleanedContent,
          });
        }
      }
    }

    if (scrapedSources.length === 0) {
      return NextResponse.json(
        { error: "No usable content found at the specified URL(s)" },
        { status: 404 }
      );
    }

    console.log(`[Video Scrape] Extracted content from ${scrapedSources.length} source(s)`);

    // Combine all sources for the response
    const combinedTitle = scrapedSources.length === 1
      ? scrapedSources[0].title
      : `${scrapedSources[0].title} (+ ${scrapedSources.length - 1} more)`;

    const combinedRawContent = scrapedSources.map(s => s.content).join("\n\n---\n\n");

    // Initialize processed content
    let processedContent = {
      title: combinedTitle,
      content: combinedRawContent,
      summary: undefined as string | undefined,
      keyPoints: undefined as string[] | undefined,
      sources: scrapedSources.map(s => s.url),
      fetchedAt: Date.now(),
    };

    // Generate script if requested
    if (generateScript && combinedRawContent.length > 100) {
      console.log(`[Video Scrape] Generating video script from ${scrapedSources.length} source(s)...`);

      let scriptResult: { content: string; summary: string; keyPoints: string[] } | null = null;

      // Use multi-source prompt if multiple sources, otherwise single source
      const prompt = scrapedSources.length > 1
        ? buildMultiSourceScriptPrompt(scrapedSources, effectiveWordCount)
        : buildScriptPrompt(scrapedSources[0].title, scrapedSources[0].content, effectiveWordCount);

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

    // OPUS REWRITE STEP: Completely rewrite with Opus 4.5 for highest quality
    if (shouldRewrite && ANTHROPIC_API_KEY) {
      try {
        const rewrittenContent = await rewriteWithOpus(
          processedContent.content,
          videoStyle,
          effectiveWordCount
        );
        processedContent = {
          ...processedContent,
          content: rewrittenContent,
        };
        console.log(`[Video Scrape] Content rewritten with Opus 4.5`);
      } catch (error) {
        console.error("[Video Scrape] Opus rewrite failed:", error);
        // Continue with the non-rewritten content
      }
    }

    console.log(`[Video Scrape] Complete. Title: "${processedContent.title.substring(0, 50)}..."`);

    return NextResponse.json({
      success: true,
      processedContent,
      sourceCount: scrapedSources.length,
    });
  } catch (error) {
    console.error("Video scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
