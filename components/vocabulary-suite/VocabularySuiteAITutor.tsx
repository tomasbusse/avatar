"use client";

import React, { useState, useRef, useEffect } from "react";
import { VocabGameData } from "./types";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface AITutorProps {
  gameData: VocabGameData;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

// Clean up title by removing (Copy) patterns
function cleanTitle(title: string): string {
  return title.replace(/\s*\(Copy\)\s*/gi, " ").trim();
}

const VocabularySuiteAITutor: React.FC<AITutorProps> = ({ gameData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = cleanTitle(gameData.title);

  // Build context from vocabulary data for the AI
  const buildContext = () => {
    const termsContext = gameData.terms
      .map(
        (t) =>
          `- ${t.term}: ${t.definition}${t.example ? ` (Example: "${t.example}")` : ""}${t.category ? ` [Category: ${t.category}]` : ""}`
      )
      .join("\n");

    return `You are a knowledgeable vocabulary tutor helping users understand the following vocabulary terms from "${displayTitle}".

${gameData.description ? `Document Description: ${gameData.description}` : ""}
${gameData.sourceDocument ? `Source: ${gameData.sourceDocument}` : ""}

Vocabulary Terms:
${termsContext}

Instructions:
- Answer questions about these vocabulary terms, their definitions, usage, and context
- Provide detailed explanations when asked about specific terms
- Help users understand how to use these terms correctly
- If asked about something not in the vocabulary list, politely explain you can only help with the vocabulary from this document
- Be friendly, encouraging, and educational in your responses
- Keep responses concise but informative`;
  };

  // Initial greeting message
  useEffect(() => {
    const greeting: Message = {
      id: "greeting",
      role: "assistant",
      content: `Hello! I'm your Vocabulary Tutor. Do you have any questions about the terms, definitions, or usage from "${displayTitle}"? I'm here to help you understand the vocabulary in more detail!`,
    };
    setMessages([greeting]);
  }, [displayTitle]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-tutor/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: buildContext(),
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Tutor error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm sorry, I encountered an error. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Get a sample term for placeholder
  const sampleTerm = gameData.terms[0]?.term || "a term";

  return (
    <div className="p-8 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-sls-teal rounded-xl flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            AI Vocabulary Expert
          </h2>
          <p className="text-sm text-slate-500">
            Ask about terms and definitions
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 min-h-[300px] max-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "assistant"
                  ? "bg-sls-teal text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {message.role === "assistant" ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === "assistant"
                  ? "bg-slate-100 text-slate-800"
                  : "bg-sls-teal text-white"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-sls-teal text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 p-4 rounded-2xl">
              <Loader2 className="w-5 h-5 text-sls-teal animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`e.g., What is ${sampleTerm} and how is it used?`}
          className="w-full px-5 py-4 pr-14 rounded-xl border-2 border-slate-200 focus:border-sls-teal focus:outline-none transition-colors text-slate-800 placeholder:text-slate-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-sls-teal text-white flex items-center justify-center hover:bg-sls-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-400 mt-4">
        Your tutor uses Gemini AI to help you learn faster.
      </p>
    </div>
  );
};

export default VocabularySuiteAITutor;
