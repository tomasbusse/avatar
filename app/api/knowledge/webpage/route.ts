import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple HTML to text extraction
function htmlToText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Convert headers to markdown
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");
  text = text.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n##### $1\n");
  text = text.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n###### $1\n");

  // Convert lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");
  text = text.replace(/<\/ul>/gi, "\n");
  text = text.replace(/<\/ol>/gi, "\n");

  // Convert paragraphs and divs to line breaks
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");

  // Convert bold and italic
  text = text.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/(b|strong)>/gi, "**$2**");
  text = text.replace(/<(i|em)[^>]*>([\s\S]*?)<\/(i|em)>/gi, "*$2*");

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&mdash;/g, "—");
  text = text.replace(/&ndash;/g, "–");

  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, "\n\n");
  text = text.replace(/[ \t]+/g, " ");

  return text.trim();
}

// Extract main content from HTML
function extractMainContent(html: string): string {
  // Try to find article or main content
  const patterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1].length > 200) {
      return htmlToText(match[1]);
    }
  }

  // Fallback: use body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return htmlToText(bodyMatch[1]);
  }

  return htmlToText(html);
}

// Extract title from HTML
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].trim();
  }

  return "Untitled Page";
}

// Convert webpage to markdown
function webpageToMarkdown(content: string, title: string, url: string): string {
  let markdown = `# ${title}\n\n`;
  markdown += `*Source: Web Page*\n`;
  markdown += `*URL: ${url}*\n`;
  markdown += `*Extracted: ${new Date().toISOString().split("T")[0]}*\n`;
  markdown += "\n---\n\n";
  markdown += content;

  return markdown;
}

export async function POST(request: NextRequest) {
  try {
    const { contentId, url, title: providedTitle } = await request.json();

    if (!contentId || !url) {
      return NextResponse.json(
        { error: "Missing contentId or url" },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch webpage with realistic browser headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status}`);
    }

    const html = await response.text();

    // Extract title and content
    const pageTitle = providedTitle || extractTitle(html);
    const content = extractMainContent(html);

    if (content.length < 100) {
      throw new Error("Could not extract meaningful content from page");
    }

    // Convert to markdown
    const markdown = webpageToMarkdown(content, pageTitle, url);
    const wordCount = markdown.split(/\s+/).length;

    // Update content in Convex
    await convex.mutation(api.knowledgeBases.updateContent, {
      contentId: contentId as Id<"knowledgeContent">,
      content: markdown,
      metadata: {
        wordCount,
      },
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      wordCount,
      title: pageTitle,
    });
  } catch (error) {
    console.error("Webpage processing error:", error);

    // Try to update status to failed
    try {
      const body = await request.clone().json();
      if (body.contentId) {
        await convex.mutation(api.knowledgeBases.updateContent, {
          contentId: body.contentId as Id<"knowledgeContent">,
          content: "",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Failed to extract content",
        });
      }
    } catch (e) {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webpage processing failed" },
      { status: 500 }
    );
  }
}
