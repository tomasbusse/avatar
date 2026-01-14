import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface AutoresponderRequest {
  name: string;
  email: string;
  company?: string;
  message: string;
  locale: string;
  mode: "preview" | "generate";
  knowledgeBaseIds?: string[];
  includeFaqs?: boolean;
  includeServices?: boolean;
  customPrompt?: string; // Custom AI instructions to override the default
  useGlobalConfig?: boolean; // Whether to use global email config from Convex
}

interface EmailConfig {
  replyMode: "disabled" | "manual" | "ai_assisted" | "auto_ai";
  aiSettings: {
    enabled: boolean;
    model: string;
    customPrompt: string;
    temperature: number;
    maxTokens: number;
  };
  knowledgeBase: {
    includeFaqs: boolean;
    defaultKnowledgeBaseIds: string[];
    includeServices: boolean;
  };
  notifications: {
    notifyOnNewSubmission: boolean;
    notificationEmails: string[];
    notifyOnAutoReply: boolean;
  };
  templates: {
    en: { subjectPrefix: string; greeting: string; closing: string; signature: string };
    de: { subjectPrefix: string; greeting: string; closing: string; signature: string };
  };
  rateLimits: {
    maxAutoRepliesPerHour: number;
    cooldownMinutes: number;
  };
}

const BASE_SYSTEM_PROMPT = `You are James Simmonds, the founder of Simmonds Language Services (SLS), a professional language training company based in Hannover, Germany since 1999. You're writing personalized email responses to contact form inquiries.

ABOUT SLS:
- 25+ years of experience in corporate language training
- Native English speakers from UK, USA, Australia, and South Africa
- Based in Hannover and Berlin, serving all of Germany
- Services: Business English, German for Expats, Copyediting & Translation
- Training formats: In-person, online, hybrid
- Clients: Major corporations like VW, Continental, TUI, Deutsche Bahn, Rossmann

YOUR COMMUNICATION STYLE:
- Professional yet warm and approachable
- Direct and helpful, never salesy or pushy
- Knowledgeable about language learning challenges
- Genuine interest in helping people improve their language skills
- Use humor sparingly but appropriately

RESPONSE GUIDELINES:
1. Thank them personally for reaching out
2. Address their specific question or need directly
3. Provide relevant information about how SLS can help
4. Suggest a clear next step (call, trial lesson, etc.)
5. Keep it concise (2-4 short paragraphs)
6. End with a personal sign-off

IMPORTANT:
- Match the language of the inquiry (German for German messages, English for English)
- Never be overly formal or stiff
- Reference specific details from their message to show you read it carefully
- If they mention a company, acknowledge it
- If their need is unclear, ask clarifying questions`;

function buildKnowledgeContext(knowledge: {
  knowledgeContent: Array<{ title: string; content: string; category?: string }>;
  faqs: Array<{ question: string; answer: string; category: string }>;
  services: Array<{ title: string; description: string }>;
}): string {
  const sections: string[] = [];

  // Add knowledge base content
  if (knowledge.knowledgeContent.length > 0) {
    sections.push("=== COMPANY KNOWLEDGE BASE ===");
    for (const item of knowledge.knowledgeContent) {
      sections.push(`\n[${item.title}]${item.category ? ` (${item.category})` : ""}`);
      sections.push(item.content);
    }
  }

  // Add FAQs
  if (knowledge.faqs.length > 0) {
    sections.push("\n=== FREQUENTLY ASKED QUESTIONS ===");
    for (const faq of knowledge.faqs) {
      sections.push(`\nQ: ${faq.question}`);
      sections.push(`A: ${faq.answer}`);
    }
  }

  // Add services
  if (knowledge.services.length > 0) {
    sections.push("\n=== SERVICES ===");
    for (const service of knowledge.services) {
      sections.push(`\n${service.title}: ${service.description}`);
    }
  }

  return sections.length > 0
    ? `\n\n--- REFERENCE KNOWLEDGE (use this to provide accurate information) ---\n${sections.join("\n")}\n--- END REFERENCE KNOWLEDGE ---`
    : "";
}

export async function POST(request: NextRequest) {
  try {
    const body: AutoresponderRequest = await request.json();
    const { name, email, company, message, locale, mode, useGlobalConfig = true } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, message" },
        { status: 400 }
      );
    }

    // Fetch global email config from Convex
    let emailConfig: EmailConfig | null = null;
    if (useGlobalConfig) {
      try {
        emailConfig = await convex.query(api.landing.getEmailConfig);
      } catch (configError) {
        console.warn("[Autoresponder] Failed to fetch email config:", configError);
      }
    }

    // Merge request params with global config (request params take precedence)
    const knowledgeBaseIds = body.knowledgeBaseIds ?? emailConfig?.knowledgeBase?.defaultKnowledgeBaseIds ?? [];
    const includeFaqs = body.includeFaqs ?? emailConfig?.knowledgeBase?.includeFaqs ?? true;
    const includeServices = body.includeServices ?? emailConfig?.knowledgeBase?.includeServices ?? true;
    const customPrompt = body.customPrompt ?? emailConfig?.aiSettings?.customPrompt;
    const aiModel = emailConfig?.aiSettings?.model ?? "claude-opus-4-5-20251101";
    const maxTokens = emailConfig?.aiSettings?.maxTokens ?? 1024;

    const isGerman = locale === "de" || /[äöüßÄÖÜ]/.test(message) ||
      message.toLowerCase().includes("sehr geehrte") ||
      message.toLowerCase().includes("mit freundlichen") ||
      message.toLowerCase().includes("anfrage");

    // Fetch knowledge content from Convex
    let knowledgeContext = "";
    try {
      const knowledge = await convex.query(api.landing.getAutoresponderKnowledge, {
        knowledgeBaseIds: knowledgeBaseIds as Id<"knowledgeBases">[] | undefined,
        includeFaqs: includeFaqs,
        includeServices: includeServices,
        locale: isGerman ? "de" : "en",
      });

      knowledgeContext = buildKnowledgeContext(knowledge);
    } catch (kbError) {
      console.warn("[Autoresponder] Failed to fetch knowledge base:", kbError);
      // Continue without knowledge context
    }

    // Use custom prompt if provided, otherwise use the base prompt
    const basePrompt = customPrompt || BASE_SYSTEM_PROMPT;
    const systemPrompt = basePrompt + knowledgeContext;

    const userPrompt = `
Write a personalized email response for this contact form submission:

FROM: ${name}${company ? ` (${company})` : ""}
EMAIL: ${email}
LANGUAGE PREFERENCE: ${isGerman ? "German" : "English"}

THEIR MESSAGE:
${message}

---
Write your response in ${isGerman ? "German" : "English"}. Start directly with the greeting (e.g., "${isGerman ? "Liebe/r" : "Dear"} ${name.split(" ")[0]},"). Do not include a subject line.

If the inquiry relates to information in the REFERENCE KNOWLEDGE above, use that information to provide accurate answers. If you reference specific facts (like pricing, services, or policies), make sure they come from the knowledge base.
`;

    const response = await anthropic.messages.create({
      model: aiModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract text from response
    const generatedEmail = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    // Generate suggested subject line
    const subjectResponse = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022", // Use Haiku for quick subject generation
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Generate a short, professional email subject line for this response. The original inquiry was about: "${message.substring(0, 200)}...". Language: ${isGerman ? "German" : "English"}. Return ONLY the subject line text, nothing else.`,
        },
      ],
    });

    const suggestedSubject = subjectResponse.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return NextResponse.json({
      success: true,
      generatedEmail,
      suggestedSubject,
      detectedLanguage: isGerman ? "de" : "en",
      mode,
      hasKnowledgeContext: knowledgeContext.length > 0,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("[Autoresponder API] Error generating response:", error);
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
