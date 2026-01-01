import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch YouTube transcript using youtube-transcript library approach
async function fetchYouTubeTranscript(videoId: string): Promise<{ text: string; duration: string }> {
  try {
    // Try to get transcript via innertube API
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    const html = await response.text();

    // Extract captions data from page
    const captionsMatch = html.match(/"captions":\s*(\{[^}]+\})/);
    if (!captionsMatch) {
      throw new Error("No captions available for this video");
    }

    // Try alternative: use a public transcript API
    const transcriptResponse = await fetch(
      `https://yt.lemnoslife.com/videos?part=transcript&id=${videoId}`
    );

    if (transcriptResponse.ok) {
      const data = await transcriptResponse.json();
      if (data.items?.[0]?.transcript?.content) {
        const segments = data.items[0].transcript.content;
        const text = segments.map((s: any) => s.text).join(" ");
        const duration = data.items[0].duration || "Unknown";
        return { text, duration };
      }
    }

    // Fallback: Extract any available text from the page
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "Unknown Video";

    // Try to get description
    const descMatch = html.match(/"description":\s*\{"simpleText":\s*"([^"]+)"\}/);
    const description = descMatch ? descMatch[1] : "";

    if (description) {
      return {
        text: `Video Title: ${title}\n\nDescription:\n${description}\n\n(Full transcript not available - captions may be disabled)`,
        duration: "Unknown",
      };
    }

    throw new Error("Could not extract transcript. Video may not have captions enabled.");
  } catch (error) {
    console.error("YouTube transcript error:", error);
    throw error;
  }
}

// Convert transcript to markdown
function transcriptToMarkdown(
  text: string,
  title: string,
  url: string,
  duration: string
): string {
  let markdown = `# ${title}\n\n`;
  markdown += `*Source: YouTube Video*\n`;
  markdown += `*URL: ${url}*\n`;
  if (duration !== "Unknown") {
    markdown += `*Duration: ${duration}*\n`;
  }
  markdown += "\n---\n\n";

  // Clean up transcript text
  const cleanText = text
    .replace(/\[Music\]/gi, "")
    .replace(/\[Applause\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Split into paragraphs (roughly every 3-4 sentences)
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
  let paragraph = "";
  let sentenceCount = 0;

  for (const sentence of sentences) {
    paragraph += sentence.trim() + " ";
    sentenceCount++;

    if (sentenceCount >= 4) {
      markdown += paragraph.trim() + "\n\n";
      paragraph = "";
      sentenceCount = 0;
    }
  }

  if (paragraph.trim()) {
    markdown += paragraph.trim() + "\n";
  }

  return markdown;
}

export async function POST(request: NextRequest) {
  try {
    const { contentId, url, title } = await request.json();

    if (!contentId || !url) {
      return NextResponse.json(
        { error: "Missing contentId or url" },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Fetch transcript
    const { text, duration } = await fetchYouTubeTranscript(videoId);

    // Convert to markdown
    const markdown = transcriptToMarkdown(text, title, url, duration);
    const wordCount = markdown.split(/\s+/).length;

    // Update content in Convex
    await convex.mutation(api.knowledgeBases.updateContent, {
      contentId: contentId as Id<"knowledgeContent">,
      content: markdown,
      metadata: {
        duration,
        wordCount,
      },
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      wordCount,
      duration,
    });
  } catch (error) {
    console.error("YouTube processing error:", error);

    // Try to update status to failed
    try {
      const body = await request.clone().json();
      if (body.contentId) {
        await convex.mutation(api.knowledgeBases.updateContent, {
          contentId: body.contentId as Id<"knowledgeContent">,
          content: "",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Failed to extract transcript",
        });
      }
    } catch (e) {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "YouTube processing failed" },
      { status: 500 }
    );
  }
}
