import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error("[AI Tutor] GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    // Using Gemini 3 Pro Preview for best educational responses
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    // Build conversation history for context
    const conversationHistory = (history || [])
      .map((msg: { role: string; content: string }) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n");

    const fullPrompt = `${context}

${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n\n` : ""}User: ${message}

Please provide a helpful, educational response about the vocabulary. Keep your response concise but informative (2-4 sentences for simple questions, more for complex explanations). Use examples from the vocabulary list when relevant.`;

    console.log("[AI Tutor] Sending request to Gemini...");
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
    console.log("[AI Tutor] Response received successfully");

    return NextResponse.json({ response });
  } catch (error) {
    console.error("[AI Tutor] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
