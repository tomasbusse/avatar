import { NextRequest, NextResponse } from "next/server";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

interface SearchConfig {
  searchDepth?: string;
  topic?: string;
  includeDomains?: string[];
  maxResults?: number;
}

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

    // Call Tavily API
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: searchConfig?.searchDepth || "basic",
        max_results: searchConfig?.maxResults || 5,
        include_domains: searchConfig?.includeDomains || [],
        topic: topic,
        include_answer: true,
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

    return NextResponse.json({
      success: true,
      query,
      answer: data.answer,
      results: data.results?.map((r: { title: string; url: string; content: string; published_date?: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content?.slice(0, 200) + "...",
        publishedDate: r.published_date,
      })) || [],
    });
  } catch (error) {
    console.error("Web search test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
