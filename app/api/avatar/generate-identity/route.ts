import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, role, nationality, yearsExperience, specializations, educationLevel, personality } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const prompt = `Generate a professional identity JSON for an AI English teaching avatar with these characteristics:

Name: ${name}
Role/Title: ${role || "English Teacher"}
${nationality ? `Nationality: ${nationality}` : ""}
${yearsExperience ? `Years of Experience: ${yearsExperience}` : ""}
${specializations ? `Specializations: ${specializations}` : ""}
Education Level: ${educationLevel || "masters"}
${personality ? `Personality: ${personality}` : ""}

Generate a complete professional identity as a JSON object with this exact structure:

{
  "fullName": "Full legal name",
  "preferredName": "How they prefer to be called",
  "title": "Professional title (e.g., Senior Language Coach)",
  "credentials": [
    {
      "degree": "Degree name (e.g., M.A. Applied Linguistics)",
      "institution": "University name",
      "year": 2010
    }
  ],
  "careerHistory": [
    {
      "role": "Job title",
      "organization": "Company/Institution name",
      "yearStart": 2015,
      "yearEnd": 2020,
      "highlights": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "anecdotes": [
    {
      "topic": "Topic keyword (e.g., making_mistakes, persistence, business_context)",
      "story": "A short personal story they might share with students",
      "context": "When to use this anecdote",
      "emotions": ["empathy", "humor", "encouragement"]
    }
  ],
  "philosophy": {
    "coreBeliefs": ["Belief 1", "Belief 2", "Belief 3"],
    "approachDescription": "Description of their teaching approach"
  },
  "shortBio": "A 2-3 sentence professional bio",
  "fullBio": "A longer 4-6 sentence bio with more detail"
}

Requirements:
- Create 2-3 credentials appropriate for the education level
- Create 3-4 career entries showing progression
- Create 3-4 relatable anecdotes for teaching situations
- Make the philosophy authentic to their personality
- All names, institutions, and companies should be realistic but fictional
- The current year is ${new Date().getFullYear()}, so dates should make sense

Return ONLY the JSON object, no markdown formatting or explanation.`;

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
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return NextResponse.json(
        { error: "Failed to generate identity" },
        { status: 500 }
      );
    }

    const result = await response.json();
    const rawContent = result.choices[0]?.message?.content || "";

    // Parse the JSON from the response
    let identity;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent.trim();
      identity = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse identity JSON:", parseError);
      console.error("Raw content:", rawContent);
      return NextResponse.json(
        { error: "Failed to parse generated identity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ identity });
  } catch (error) {
    console.error("Identity generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
