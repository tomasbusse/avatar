import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy-init OpenRouter client to avoid build-time env var issues
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return openaiClient;
}

// SEO-optimized system prompts for different content types
const SEO_SYSTEM_PROMPTS = {
  faq: `You are an SEO expert content writer for Simmonds Language Services (SLS), a premium language training company in Germany with 20+ years of experience.

CRITICAL SEO GUIDELINES FOR LLM SEARCH ENGINES (Perplexity, ChatGPT Search, Google AI Overviews):
1. Structure answers to be directly quotable - AI search engines prefer concise, authoritative answers
2. Use natural question phrasing that matches how people actually ask
3. Include specific details (numbers, locations, pricing) that AI can extract
4. Front-load the most important information in answers
5. Use semantic keywords naturally - not keyword stuffing
6. Create content that answers follow-up questions preemptively
7. Include E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)

COMPANY CONTEXT:
- Locations: Hannover and Berlin, Germany
- Services: Business English, German for foreigners, Copy editing/Lektorat
- Methodology: "Questions Method" - learning through conversation
- Target audience: German professionals and international expats
- Pricing: Online (€50/60min, €70/90min), Face-to-face (€60/60min, €85/90min)

Generate FAQ content that is:
- Directly answerable by AI search engines
- Rich in semantic keywords for language learning
- Structured for featured snippets
- Helpful and genuinely informative`,

  blog: `You are an SEO expert content writer for Simmonds Language Services (SLS), a premium language training company based in Hannover and Berlin, Germany.

CRITICAL SEO GUIDELINES FOR LLM SEARCH ENGINES:
1. Use clear H2/H3 structure that AI can parse for featured snippets
2. Include a compelling hook in the first paragraph (AI often extracts this)
3. Write in an authoritative but accessible tone
4. Include specific, factual information that AI search can cite
5. Use semantic LSI keywords naturally throughout
6. Structure content with clear sections for skimmability
7. End with actionable takeaways that AI can summarize
8. Target long-tail keywords with specific intent

BLOG SEO CHECKLIST:
- Title: Include primary keyword, compelling hook, under 60 chars ideal
- Excerpt: 150-160 chars, include keyword, create urgency
- Content: 800-1500 words, semantic keywords, internal linking opportunities
- Use lists and bullet points for AI extraction
- Include statistics or specific numbers when relevant

For BLOCK-BASED CONTENT:
- Structure content into logical blocks (hero, text, callouts, FAQs, CTAs)
- Each block should serve a specific purpose
- Use callouts for tips, warnings, and key information
- Include FAQs for common questions
- End with compelling CTAs

COMPANY EXPERTISE AREAS:
- Business English training for German professionals
- German language courses for international employees
- Corporate language training programs
- Cross-cultural business communication
- Professional copy editing and Lektorat`,

  testimonial: `You are creating authentic-sounding testimonials for Simmonds Language Services (SLS), a premium language training company in Germany.

IMPORTANT: Generate realistic testimonials that sound genuine, not promotional.

GUIDELINES:
1. Use natural, conversational language
2. Include specific details about the learning experience
3. Mention concrete improvements or outcomes
4. Reference realistic German/international company names
5. Include appropriate job titles for the German business context
6. Vary the tone - some enthusiastic, some more reserved/professional
7. Include both English and German speakers' perspectives

TESTIMONIAL AUTHENTICITY CHECKLIST:
- Specific detail about what they learned
- Mention of the teaching method or approach
- Real-sounding outcome or improvement
- Natural phrasing (not marketing-speak)
- Appropriate length (2-4 sentences)`,

  page_section: `You are an SEO expert content writer for Simmonds Language Services (SLS), a premium language training company in Germany with 20+ years of experience.

You are generating content for specific sections of the marketing website. Each section has a specific purpose and structure.

CRITICAL SEO GUIDELINES:
1. Write compelling, benefit-focused headlines that include target keywords naturally
2. Subheadlines should expand on the value proposition
3. Content should be scannable - use short paragraphs
4. Include specific details (20+ years experience, Hannover & Berlin locations)
5. CTAs should be action-oriented and create urgency
6. Match the tone to the section (hero = bold/confident, about = warm/personal)

COMPANY CONTEXT:
- 20+ years of experience
- Locations: Hannover and Berlin, Germany
- Services: Business English, German for foreigners, Copy editing/Lektorat
- Methodology: "Questions Method" - learning through conversation
- Target audience: German professionals and international expats
- Key differentiator: Personalized, conversation-based learning

BRAND VOICE:
- Professional but approachable
- Confident but not arrogant
- Helpful and educational
- Warm and welcoming`,
};

// Content generation prompts
const GENERATION_PROMPTS = {
  faq: (locale: string, topic?: string, category?: string) => `
Generate a high-quality FAQ item for Simmonds Language Services.
${topic ? `Topic/Focus: ${topic}` : ""}
${category ? `Category: ${category}` : ""}
Language: ${locale === "de" ? "German" : "English"}

Return JSON with this exact structure:
{
  "question": "The FAQ question (optimized for search)",
  "answer": "Comprehensive answer (150-300 words, SEO-optimized)",
  "category": "${category || "general"}",
  "seoKeywords": ["array", "of", "target", "keywords"]
}`,

  blog: (locale: string, topic?: string, category?: string) => `
Generate a complete, SEO-optimized blog post for Simmonds Language Services.
${topic ? `Topic/Focus: ${topic}` : "Generate a topic relevant to language learning in Germany"}
${category ? `Category: ${category}` : ""}
Language: ${locale === "de" ? "German" : "English"}

Return JSON with this exact structure:
{
  "title": "SEO-optimized title (include primary keyword)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling meta description (150-160 chars)",
  "content": "Full blog post content in Markdown format (800-1500 words). Use ## for H2 headings, ### for H3. Include bullet points and numbered lists where appropriate.",
  "category": "${category || "language-learning"}",
  "author": "James Simmonds",
  "readTimeMinutes": 5,
  "seoKeywords": ["array", "of", "target", "keywords"],
  "seoAnalysis": {
    "primaryKeyword": "main target keyword",
    "keywordDensity": "estimated percentage",
    "readabilityScore": "easy/medium/advanced",
    "targetAudience": "description of target audience"
  }
}`,

  blog_with_blocks: (locale: string, topic?: string, category?: string) => `
Generate a complete, SEO-optimized blog post for Simmonds Language Services using the CONTENT BLOCKS system.
${topic ? `Topic/Focus: ${topic}` : "Generate a topic relevant to language learning in Germany"}
${category ? `Category: ${category}` : ""}
Language: ${locale === "de" ? "German" : "English"}

IMPORTANT: Generate the post as an array of content blocks. Each block has a type and configuration.

Available block types:
- hero: Title, subtitle, badge, featured image
- rich_text: Markdown content for paragraphs
- image: Single image with caption
- video: YouTube/Vimeo embed (videoId for the platform ID)
- callout: Tip, warning, info, success, or note boxes
- quote: Blockquote with attribution
- faq: Accordion-style FAQ section
- cta: Call-to-action with buttons
- divider: Visual separator

Return JSON with this exact structure:
{
  "title": "SEO-optimized title (include primary keyword)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling meta description (150-160 chars)",
  "category": "${category || "Business English"}",
  "author": "James Simmonds",
  "readTimeMinutes": 6,
  "contentBlocks": [
    {
      "id": "block_hero_001",
      "type": "hero",
      "order": 0,
      "config": {
        "type": "hero",
        "title": "Same as post title",
        "subtitle": "Compelling subtitle/intro",
        "badge": "${category || "Business English"}",
        "showAuthor": true,
        "showDate": true,
        "showReadTime": true,
        "variant": "default"
      }
    },
    {
      "id": "block_text_001",
      "type": "rich_text",
      "order": 1,
      "config": {
        "type": "rich_text",
        "content": "Opening paragraph in Markdown. Hook the reader immediately...",
        "variant": "lead"
      }
    },
    {
      "id": "block_text_002",
      "type": "rich_text",
      "order": 2,
      "config": {
        "type": "rich_text",
        "content": "## Main Section\\n\\nMain content here with **bold** and *italic* text. Use proper markdown formatting.",
        "variant": "default"
      }
    },
    {
      "id": "block_callout_001",
      "type": "callout",
      "order": 3,
      "config": {
        "type": "callout",
        "variant": "tip",
        "title": "Pro Tip",
        "content": "A helpful tip related to the topic..."
      }
    },
    {
      "id": "block_text_003",
      "type": "rich_text",
      "order": 4,
      "config": {
        "type": "rich_text",
        "content": "## Another Section\\n\\nMore content with:\\n\\n- Bullet points\\n- Lists\\n- Examples",
        "variant": "default"
      }
    },
    {
      "id": "block_faq_001",
      "type": "faq",
      "order": 5,
      "config": {
        "type": "faq",
        "showHeader": true,
        "headerTitle": "Frequently Asked Questions",
        "variant": "default",
        "items": [
          { "id": "faq_1", "question": "Question 1?", "answer": "Answer 1..." },
          { "id": "faq_2", "question": "Question 2?", "answer": "Answer 2..." },
          { "id": "faq_3", "question": "Question 3?", "answer": "Answer 3..." }
        ]
      }
    },
    {
      "id": "block_cta_001",
      "type": "cta",
      "order": 6,
      "config": {
        "type": "cta",
        "variant": "accent",
        "headline": "Ready to Start Learning?",
        "subheadline": "Book a free trial lesson with our expert teachers",
        "primaryButton": { "text": "Book Free Trial", "href": "/contact" },
        "secondaryButton": { "text": "View Courses", "href": "/services" }
      }
    }
  ],
  "suggestedGameTypes": ["vocabulary_matching", "flashcards"],
  "seoKeywords": ["array", "of", "target", "keywords"]
}

GUIDELINES:
1. Generate 6-10 content blocks for a complete article
2. Always start with a hero block
3. Use rich_text blocks for main content (break into logical sections with H2 headings)
4. Include at least one callout for engagement
5. Include an FAQ section with 3-5 relevant questions
6. Always end with a CTA block
7. Use proper markdown in rich_text content (## for H2, ### for H3, **bold**, *italic*, - bullets)
8. Generate unique block IDs (block_type_###)
9. Suggest relevant game types: vocabulary_matching, flashcards, fill_in_blank, multiple_choice
10. Keep content SEO-optimized and informative`,

  testimonial: (locale: string, context?: string) => `
Generate an authentic-sounding testimonial for Simmonds Language Services.
${context ? `Context/Focus: ${context}` : ""}
Language: ${locale === "de" ? "German" : "English"}

Return JSON with this exact structure:
{
  "name": "Realistic German or international name",
  "company": "Real-sounding German company name",
  "role": "Professional job title",
  "quote": "Authentic testimonial quote (2-4 sentences)",
  "rating": 5
}`,

  page_section: (locale: string, topic?: string, page?: string, context?: string) => `
Generate compelling content for a website section of Simmonds Language Services.
Page: ${page || "home"}
Section: ${topic || "hero"}
Language: ${locale === "de" ? "German" : "English"}
${context ? `Additional Context: ${context}` : ""}

Based on the section type, generate appropriate content. Return JSON with fields relevant to the section:

For HERO sections:
{
  "headline": "Bold, compelling headline (5-10 words)",
  "subheadline": "Supporting text explaining the value proposition (15-25 words)",
  "ctaText": "Action button text (2-4 words)",
  "ctaLink": "/contact"
}

For SERVICES/USP sections with items:
{
  "headline": "Section headline",
  "subheadline": "Optional supporting text",
  "items": [
    { "title": "Item title", "description": "Item description (1-2 sentences)", "icon": "suggested-icon-name" }
  ]
}

For CONTENT sections (story, methodology, etc.):
{
  "headline": "Section headline",
  "content": "Rich content in markdown format (2-4 paragraphs)"
}

For CTA sections:
{
  "headline": "Compelling call-to-action headline",
  "subheadline": "Supporting urgency text",
  "buttonText": "Action button text",
  "buttonLink": "/contact"
}

For PRICING sections:
{
  "headline": "Section headline",
  "items": [
    { "name": "Plan name", "price": "€XX", "duration": "per session", "features": ["feature1", "feature2"] }
  ]
}

Generate content appropriate for the "${topic || "hero"}" section of the "${page || "home"}" page.`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, locale, topic, category, context } = body;

    if (!type || !locale) {
      return NextResponse.json(
        { error: "Missing required fields: type, locale" },
        { status: 400 }
      );
    }

    if (!["faq", "blog", "blog_with_blocks", "testimonial", "page_section"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be: faq, blog, blog_with_blocks, testimonial, or page_section" },
        { status: 400 }
      );
    }

    // Use 'blog' system prompt for 'blog_with_blocks'
    const promptKey = type === "blog_with_blocks" ? "blog" : type;
    const systemPrompt = SEO_SYSTEM_PROMPTS[promptKey as keyof typeof SEO_SYSTEM_PROMPTS];
    let userPrompt: string;

    switch (type) {
      case "faq":
        userPrompt = GENERATION_PROMPTS.faq(locale, topic, category);
        break;
      case "blog":
        userPrompt = GENERATION_PROMPTS.blog(locale, topic, category);
        break;
      case "blog_with_blocks":
        userPrompt = GENERATION_PROMPTS.blog_with_blocks(locale, topic, category);
        break;
      case "testimonial":
        userPrompt = GENERATION_PROMPTS.testimonial(locale, context);
        break;
      case "page_section":
        userPrompt = GENERATION_PROMPTS.page_section(locale, topic, category, context);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const response = await getOpenAI().chat.completions.create({
      model: "google/gemini-2.5-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No content generated" },
        { status: 500 }
      );
    }

    // Parse JSON from response
    let parsedContent;
    try {
      // Handle markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonString);
    } catch {
      // If JSON parsing fails, return raw content
      return NextResponse.json({
        success: true,
        raw: true,
        content: content,
      });
    }

    return NextResponse.json({
      success: true,
      type,
      locale,
      content: parsedContent,
    });
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// SEO Analysis endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, type, locale } = body;

    if (!content || !type) {
      return NextResponse.json(
        { error: "Missing required fields: content, type" },
        { status: 400 }
      );
    }

    const analysisPrompt = `Analyze this ${type} content for SEO optimization, particularly for LLM search engines (Perplexity, ChatGPT Search, Google AI Overviews).

Content to analyze:
${JSON.stringify(content, null, 2)}

Language: ${locale === "de" ? "German" : "English"}

Provide analysis in JSON format:
{
  "overallScore": 0-100,
  "llmSearchScore": 0-100,
  "traditionalSeoScore": 0-100,
  "strengths": ["array of strengths"],
  "improvements": ["array of specific improvements"],
  "keywordSuggestions": ["additional keywords to target"],
  "structureAnalysis": "analysis of content structure for AI extraction",
  "citabilityScore": 0-100,
  "recommendations": ["prioritized list of changes to make"]
}`;

    const response = await getOpenAI().chat.completions.create({
      model: "google/gemini-2.5-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are an SEO analyst specializing in optimizing content for both traditional search engines and modern LLM-powered search engines. Focus on:
1. Content structure for AI extraction
2. Citability - how likely is the content to be quoted by AI
3. E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
4. Semantic keyword coverage
5. Answer quality for voice search and AI assistants`,
        },
        { role: "user", content: analysisPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const analysisContent = response.choices[0]?.message?.content;
    if (!analysisContent) {
      return NextResponse.json(
        { error: "No analysis generated" },
        { status: 500 }
      );
    }

    let parsedAnalysis;
    try {
      const jsonMatch = analysisContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : analysisContent;
      parsedAnalysis = JSON.parse(jsonString);
    } catch {
      return NextResponse.json({
        success: true,
        raw: true,
        analysis: analysisContent,
      });
    }

    return NextResponse.json({
      success: true,
      analysis: parsedAnalysis,
    });
  } catch (error) {
    console.error("SEO analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    );
  }
}
