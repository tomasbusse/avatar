import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { lifeStoryDocument } = await request.json();

    if (!lifeStoryDocument) {
      return NextResponse.json(
        { error: "Life story document is required" },
        { status: 400 }
      );
    }

    const prompt = `Condense this life story into a 300-500 word summary for use in an AI avatar's system prompt.

The summary should:
1. Be written in third person, as if describing who the avatar IS
2. Capture key personality traits with brief examples
3. Include the most important background details (education, career)
4. Preserve their teaching philosophy and approach
5. Keep 1-2 memorable quirks or anecdotes that make them human
6. Be efficient but warm in tone

Remove:
- Excessive dates and specific years
- Secondary characters unless crucial
- Lengthy anecdotes (keep the essence)
- Redundant descriptions

The summary will be included in the avatar's system prompt, so it should help the AI embody this character authentically.

Original life story:
${lifeStoryDocument}

Write the summary now:`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku-20240307",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return NextResponse.json(
        { error: "Failed to summarize life story" },
        { status: 500 }
      );
    }

    const result = await response.json();
    const summary = result.choices[0]?.message?.content || "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Life story summarization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
