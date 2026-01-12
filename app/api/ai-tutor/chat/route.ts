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
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    // Using Gemini 2.0 Pro for better reasoning and educational responses
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp" });

    // Build conversation history for context
    const conversationHistory = (history || [])
      .map((msg: { role: string; content: string }) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n");

    const fullPrompt = `${context}

${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n\n` : ""}User: ${message}

Please provide a helpful, educational response about the vocabulary. Keep your response concise but informative (2-4 sentences for simple questions, more for complex explanations). Use examples from the vocabulary list when relevant.`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("[AI Tutor] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
