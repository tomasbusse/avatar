import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, age, nationality, personality, background, quirk, style } = await request.json();

    if (!name || !personality) {
      return NextResponse.json(
        { error: "Name and personality are required" },
        { status: 400 }
      );
    }

    // Determine word count based on style
    const wordCounts = {
      detailed: "2000-2500 words",
      balanced: "1000-1500 words",
      concise: "500-800 words",
    };
    const targetLength = wordCounts[style as keyof typeof wordCounts] || wordCounts.balanced;

    const prompt = `Generate a comprehensive, authentic life story for an AI English teaching avatar with these characteristics:

Name: ${name}
${age ? `Age: ${age}` : ""}
${nationality ? `Nationality: ${nationality}` : ""}
Personality: ${personality}
${background ? `Background/Career: ${background}` : ""}
${quirk ? `Interesting quirk: ${quirk}` : ""}

Create a detailed life story that includes:

1. **Early Life & Family** (parents' names, occupations, siblings, childhood home, family dynamics)
2. **Education** (specific schools, memorable teachers, favorite subjects, formative experiences)
3. **Career Journey** (first job, how they discovered teaching, pivotal moments, achievements)
4. **Personal Life** (relationships, hobbies, interests, daily routines)
5. **Teaching Philosophy** (why they teach, beliefs about learning, approach to students)
6. **Fun Facts & Quirks** (memorable anecdotes, habits, preferences)

Requirements:
- Target length: ${targetLength}
- Use specific names, places, and anecdotes to make it feel real
- Include sensory details and emotional moments
- Make the personality traits evident through stories, not just stated
- Include at least 2-3 memorable anecdotes they might share with students
- Format as markdown with clear section headers
- Make it feel like a real person's biography, not a character sheet

The tone should be warm and personal, as if they're telling their own story.`;

    // Call OpenRouter for generation
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-20250514",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return NextResponse.json(
        { error: "Failed to generate life story" },
        { status: 500 }
      );
    }

    const result = await response.json();
    const lifeStory = result.choices[0]?.message?.content || "";

    // Generate a summary in a second call
    const summaryPrompt = `Condense this life story into a 300-500 word summary for use in an AI system prompt.

Keep:
- Key personality traits and how they manifest
- Most important background details (education, career highlights)
- Teaching philosophy core beliefs
- 1-2 notable quirks or anecdotes

Remove:
- Excessive detail and dates
- Lengthy descriptions
- Secondary characters unless crucial

Make it feel personal but efficient - this will be the avatar's internal self-knowledge.

Original life story:
${lifeStory}`;

    const summaryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            content: summaryPrompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    let summary = "";
    if (summaryResponse.ok) {
      const summaryResult = await summaryResponse.json();
      summary = summaryResult.choices[0]?.message?.content || "";
    }

    return NextResponse.json({ lifeStory, summary });
  } catch (error) {
    console.error("Life story generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
