import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, context, history } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[AI Tutor] OPENROUTER_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Build conversation history for context
    const conversationHistory = (history || [])
      .map((msg: { role: string; content: string }) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n");

    const fullPrompt = `${context}

${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n\n` : ""}User: ${message}

Please provide a helpful, educational response about the vocabulary. Keep your response concise but informative (2-4 sentences for simple questions, more for complex explanations). Use examples from the vocabulary list when relevant.`;

    // Try primary model first, then fallback
    const models = ["google/gemini-2.5-pro", "google/gemini-2.5-flash"];
    let aiResponse = "";
    let lastError = "";

    for (const model of models) {
      console.log(`[AI Tutor] Trying model: ${model}...`);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "Beethoven AI Vocabulary Tutor",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: fullPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || "";
          if (aiResponse) {
            console.log(`[AI Tutor] Success with model: ${model}`);
            break;
          }
        } else {
          lastError = await response.text();
          console.error(`[AI Tutor] Model ${model} failed:`, lastError);
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Unknown error";
        console.error(`[AI Tutor] Model ${model} error:`, lastError);
      }
    }

    if (!aiResponse) {
      console.error("[AI Tutor] All models failed. Last error:", lastError);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    console.log("[AI Tutor] Response received successfully");

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("[AI Tutor] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
