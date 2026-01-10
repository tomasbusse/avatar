import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface SearchConfig {
  searchDepth?: string;
  topic?: string;
  includeDomains?: string[];
  maxResults?: number;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string; // Full article content when include_raw_content=true
  published_date?: string;
}

/**
 * Clean raw article content from Tavily to extract just the article text
 * Removes navigation, markdown formatting, images, and boilerplate
 */
function cleanArticleContent(rawContent: string): string {
  if (!rawContent) return "";

  let cleaned = rawContent;

  // Remove image references: ![Image 1: description](url) or ![alt](url)
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, "");

  // Remove markdown links but keep the text: [text](url) -> text
  // But remove navigation-style links (ones that are just short menu items)
  cleaned = cleaned.replace(/\[([^\]]{1,50})\]\([^)]+\)/g, (match, text) => {
    // Remove if it looks like navigation (short text, common nav words)
    const navPatterns =
      /^(Home|News|Sport|Business|Culture|Arts|Travel|Future|Skip|More|Menu|Sign|Log|Search|Share|Save|Copy|Follow|Subscribe|Watch|Listen|Read more|Related|See also|Advertisement|Ad|Cookie|Privacy|Terms|About|Contact|Help|FAQ)s?$/i;
    if (text.length < 20 && navPatterns.test(text.trim())) {
      return "";
    }
    return text;
  });

  // Remove standalone URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s\)]+/g, "");

  // Remove lines that look like navigation menus (multiple * items in a row)
  cleaned = cleaned.replace(/^(\s*\*\s*[^\n]{1,30}\n){3,}/gm, "\n");

  // Remove common boilerplate patterns
  const boilerplatePatterns = [
    /^Skip to content.*$/gim,
    /^Share this.*$/gim,
    /^Save this.*$/gim,
    /^Copy link.*$/gim,
    /^Follow us.*$/gim,
    /^Subscribe.*$/gim,
    /^Sign up.*$/gim,
    /^Log in.*$/gim,
    /^Advertisement.*$/gim,
    /^Related Topics.*$/gim,
    /^Related Stories.*$/gim,
    /^More on this story.*$/gim,
    /^You may also like.*$/gim,
    /^Cookie.*policy.*$/gim,
    /^Privacy.*policy.*$/gim,
    /^Terms.*conditions.*$/gim,
    /^\*\s*$\n?/gm, // Single bullet points with nothing after
    /^#{1,6}\s*$/gm, // Empty headers
  ];

  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Remove sections that start with navigation-like headers
  cleaned = cleaned.replace(
    /^#+\s*(Navigation|Menu|Footer|Related|Share|Social|Tags|Categories|Archive|Search)[\s\S]*?(?=^#|$)/gim,
    ""
  );

  // Clean up markdown headers (keep text, remove # symbols)
  cleaned = cleaned.replace(/^#{1,6}\s+(.*)$/gm, "$1");

  // Remove horizontal rules
  cleaned = cleaned.replace(/^[-*_]{3,}$/gm, "");

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines
  cleaned = cleaned.replace(/[ \t]+/g, " "); // Multiple spaces to single
  cleaned = cleaned.replace(/^\s+|\s+$/gm, ""); // Trim each line

  // Remove lines that are just punctuation or very short
  cleaned = cleaned
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      // Keep lines with actual content (more than just punctuation)
      return trimmed.length > 3 && !/^[*\-_•·→←↑↓]+$/.test(trimmed);
    })
    .join("\n");

  // Final cleanup
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}

/**
 * Use Claude to rewrite articles into clean, professional journalist prose
 * Takes the raw/cleaned article content and produces clear, readable text
 */
async function rewriteWithLLM(
  articles: Array<{ title: string; content: string; url: string }>,
  topic: string
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    console.warn("[LLM Rewrite] No ANTHROPIC_API_KEY, returning cleaned content as-is");
    return articles.map(a => `**${a.title}**\n\n${a.content}`).join("\n\n---\n\n");
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // Combine articles into a single prompt
  const articleText = articles
    .map((a, i) => `ARTICLE ${i + 1}: ${a.title}\nSource: ${a.url}\n\n${a.content}`)
    .join("\n\n---\n\n");

  const prompt = `You are a professional news editor. Rewrite the following news articles into clean, clear prose suitable for discussion.

REQUIREMENTS:
- Write in clear, professional English like a quality newspaper
- Remove any remaining formatting artifacts, broken links, or navigation text
- Keep the key facts and news content
- Use complete sentences and proper paragraphs
- For each article, include: headline, 2-3 paragraph summary of key points
- Do NOT add commentary or opinions - just present the facts
- Do NOT include URLs or source links in the text
- Keep it concise - each article summary should be 100-200 words

Topic context: ${topic}

RAW ARTICLES:
${articleText}

OUTPUT FORMAT:
For each article, write:
HEADLINE: [clear headline]
[2-3 paragraphs of clean prose summarizing the article]

---

Begin:`;

  try {
    console.log(`[LLM Rewrite] Sending ${articles.length} articles to Claude...`);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      console.log(`[LLM Rewrite] Received ${content.text.length} chars of cleaned content`);
      return content.text;
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error) {
    console.error("[LLM Rewrite] Error:", error);
    // Fallback to cleaned content without LLM rewrite
    return articles.map(a => `**${a.title}**\n\n${a.content}`).join("\n\n---\n\n");
  }
}

/**
 * Filter articles to only include those from today
 */
function filterToToday(results: TavilyResult[]): TavilyResult[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return results.filter(r => {
    if (!r.published_date) return true; // Include if no date (can't filter)

    const pubDate = new Date(r.published_date);
    pubDate.setHours(0, 0, 0, 0);

    // Include if published today or yesterday (to handle timezone differences)
    const diffDays = Math.floor((today.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  });
}

/**
 * Fetch web search results from Tavily API
 * Called when user joins a conversation practice or admin clicks "Fetch Now"
 * Returns results in the format expected by the session schema
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
    const { searchConfig, subject } = body as {
      searchConfig?: SearchConfig;
      subject?: string;
    };

    // Build query based on subject and topic
    let query = "latest news today";
    const topic = searchConfig?.topic || "general";

    if (subject) {
      if (topic === "news") {
        query = `latest news about ${subject}`;
      } else if (topic === "finance") {
        query = `${subject} financial news today`;
      } else {
        query = `current information about ${subject}`;
      }
    } else {
      if (topic === "news") {
        query = "latest world news today";
      } else if (topic === "finance") {
        query = "stock market news today";
      }
    }

    // Determine search depth and whether to include raw content
    const searchDepth = searchConfig?.searchDepth || "basic";
    const isDetailed = searchDepth === "detailed";
    const tavilySearchDepth = isDetailed ? "advanced" : searchDepth;

    console.log(`[Tavily] Fetching: "${query}" (topic: ${topic}, depth: ${searchDepth}, rawContent: ${isDetailed})`);

    // Call Tavily API
    // - "detailed" mode uses advanced search + raw_content for full articles
    // - days: 1 to filter to recent news only
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: tavilySearchDepth,
        max_results: searchConfig?.maxResults || 5,
        include_domains: searchConfig?.includeDomains || [],
        topic: topic,
        include_answer: true,
        include_raw_content: isDetailed, // Get full article text in detailed mode
        days: 1, // Only fetch news from the last 24 hours
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Tavily API error:", error);
      return NextResponse.json(
        { error: `Tavily API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Filter to today's news only (extra safety beyond Tavily's days param)
    const filteredResults = filterToToday(data.results || []);
    console.log(`[Tavily] Filtered ${data.results?.length || 0} → ${filteredResults.length} results (today only)`);

    // Process results
    const processedResults = filteredResults.map((r: TavilyResult) => ({
      title: r.title,
      url: r.url,
      content: r.content || "",
      rawContent: r.raw_content ? cleanArticleContent(r.raw_content) : undefined,
      publishedDate: r.published_date,
    }));

    // For detailed mode, rewrite with LLM for clean journalist prose
    let llmRewrittenContent: string | undefined;
    if (isDetailed && processedResults.length > 0) {
      const articlesToRewrite = processedResults.map(r => ({
        title: r.title,
        content: r.rawContent || r.content,
        url: r.url,
      }));
      llmRewrittenContent = await rewriteWithLLM(articlesToRewrite, topic);
    }

    // Return in the format expected by the session schema
    const webSearchResults = {
      fetchedAt: Date.now(),
      query,
      answer: data.answer || undefined,
      searchDepth,
      // For detailed mode, include the LLM-rewritten content as the primary content
      llmRewrittenContent,
      results: processedResults,
    };

    const totalContent = webSearchResults.results.reduce(
      (sum: number, r: { rawContent?: string; content: string }) =>
        sum + (r.rawContent?.length || r.content.length),
      0
    );
    console.log(`[Tavily] Final: ${webSearchResults.results.length} results (${Math.round(totalContent / 1000)}k chars${isDetailed ? ", with LLM rewrite" : ""})`);

    return NextResponse.json({
      success: true,
      webSearchResults,
    });
  } catch (error) {
    console.error("Web search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
