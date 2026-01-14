/**
 * Web Scraping Knowledge Base Orchestrator
 *
 * Handles the full pipeline for generating knowledge bases from web content:
 * 1. Discovery: Use AI to identify subtopics for a given topic
 * 2. Scraping: Use Tavily to search and fetch web content
 * 3. Synthesis: Use AI to create structured educational content
 * 4. RLM Optimization: Build indexes for fast avatar retrieval
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Types
export interface ScrapingConfig {
  depth: number; // 1-3
  maxSourcesPerSubtopic: number;
  includeExercises: boolean;
  targetLevel?: string; // A1-C2
  language: string; // en, de, multi
}

export interface WebSource {
  url: string;
  title: string;
  domain: string;
  content: string;
  score?: number;
}

export interface ProgressCallback {
  (event: {
    type: "discovery" | "scraping" | "synthesizing" | "optimizing" | "complete" | "error";
    phase: string;
    current: number;
    total: number;
    message?: string;
    subtopic?: string;
  }): void;
}

// Quality source domains for educational content
const QUALITY_DOMAINS = [
  "britishcouncil.org",
  "cambridge.org",
  "oxfordlearnersdictionaries.com",
  "bbc.co.uk/learningenglish",
  "englishgrammar.org",
  "grammarly.com",
  "perfect-english-grammar.com",
  "ef.com",
  "learnenglish.de",
  "ego4u.com",
  "englisch-hilfen.de",
];

// Lesson content schema for synthesis
const LESSON_SCHEMA = `{
  "version": "1.0",
  "metadata": {
    "title": "string",
    "titleDe": "string",
    "level": "A1|A2|B1|B2|C1|C2",
    "estimatedMinutes": number,
    "topic": "string",
    "subtopics": ["string"],
    "tags": ["string"]
  },
  "content": {
    "learningObjectives": [{ "id": "obj-N", "objective": "string", "objectiveDe": "string" }],
    "introduction": { "id": "intro-1", "content": "string", "contentDe": "string" },
    "sections": [{ "id": "sec-N", "type": "content|grammar|vocabulary", "title": "string", "titleDe": "string", "content": "string", "contentDe": "string" }],
    "vocabulary": [{ "id": "vocab-N", "term": "string", "termDe": "string", "definition": "string", "definitionDe": "string", "exampleSentence": "string", "exampleSentenceDe": "string", "level": "A1|A2|B1|B2" }],
    "grammarRules": [{ "id": "gram-N", "name": "string", "nameDe": "string", "category": "string", "rule": "string", "ruleDe": "string", "formula": "string", "keywords": ["string"], "examples": [{ "correct": "string", "incorrect": "string", "explanation": "string", "explanationDe": "string" }], "commonMistakes": [{ "pattern": "string", "correction": "string", "explanation": "string" }] }],
    "exercises": [{ "id": "ex-N", "type": "fill_blank|multiple_choice|error_correction|matching", "title": "string", "titleDe": "string", "instructions": "string", "instructionsDe": "string", "difficulty": 1|2|3, "items": [{ "id": "item-N", "question": "string", "questionDe": "string", "correctAnswer": "string", "options": ["string"], "explanation": "string", "explanationDe": "string", "hint": "string" }] }],
    "summary": { "id": "summary-1", "content": "string", "contentDe": "string", "keyPoints": ["string"] }
  }
}`;

export class ScrapingOrchestrator {
  private convex: ConvexHttpClient;
  private openrouterKey: string;
  private tavilyKey: string;
  private jobId: Id<"scrapingJobs">;
  private knowledgeBaseId: Id<"knowledgeBases">;
  private config: ScrapingConfig;
  private onProgress?: ProgressCallback;

  constructor(
    convex: ConvexHttpClient,
    jobId: Id<"scrapingJobs">,
    knowledgeBaseId: Id<"knowledgeBases">,
    config: ScrapingConfig,
    onProgress?: ProgressCallback
  ) {
    this.convex = convex;
    this.jobId = jobId;
    this.knowledgeBaseId = knowledgeBaseId;
    this.config = config;
    this.onProgress = onProgress;

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (!openrouterKey) throw new Error("Missing OPENROUTER_API_KEY");
    if (!tavilyKey) throw new Error("Missing TAVILY_API_KEY");

    this.openrouterKey = openrouterKey;
    this.tavilyKey = tavilyKey;
  }

  /**
   * Phase 1: Discover subtopics for a given topic
   */
  async discoverSubtopics(topic: string): Promise<string[]> {
    this.emit({
      type: "discovery",
      phase: "Discovering subtopics",
      current: 0,
      total: 1,
      message: `Analyzing "${topic}" to find key subtopics...`,
    });

    const systemPrompt = `You are an expert English language curriculum designer.
Given a topic, identify the key subtopics that should be covered for comprehensive learning.

Guidelines:
- Identify 8-15 subtopics depending on the topic's breadth
- Each subtopic should be specific and teachable in one lesson
- Order from fundamental to advanced concepts
- Include practical application topics
- For grammar: include rules, usage, common mistakes
- For vocabulary: group by theme or situation

Output ONLY a JSON array of subtopic names, e.g.:
["Subtopic 1", "Subtopic 2", "Subtopic 3"]`;

    const response = await this.callAI(systemPrompt, `
Topic: ${topic}
Target Level: ${this.config.targetLevel || "B1-B2"}
Language: ${this.config.language}

List the key subtopics that should be covered:`, 2000);

    let subtopics: string[] = [];
    try {
      // Clean and parse response
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      subtopics = JSON.parse(jsonText);
    } catch {
      // Fallback: extract from text
      const lines = response.split("\n").filter((l) => l.trim());
      subtopics = lines
        .map((l) => l.replace(/^[\d\-\*\.\)]+\s*/, "").trim())
        .filter((l) => l.length > 3 && l.length < 100);
    }

    // Limit based on depth
    const maxSubtopics = this.config.depth === 1 ? 5 : this.config.depth === 2 ? 10 : 15;
    subtopics = subtopics.slice(0, maxSubtopics);

    // Update job with discovered subtopics
    await this.convex.mutation(api.scrapingJobs.setSubtopics, {
      id: this.jobId,
      subtopics,
    });

    this.emit({
      type: "discovery",
      phase: "Subtopics discovered",
      current: 1,
      total: 1,
      message: `Found ${subtopics.length} subtopics to cover`,
    });

    return subtopics;
  }

  /**
   * Phase 2: Scrape web content for a subtopic using Tavily
   */
  async scrapeSubtopic(subtopic: string, mainTopic: string): Promise<WebSource[]> {
    this.emit({
      type: "scraping",
      phase: "Searching web",
      current: 0,
      total: this.config.maxSourcesPerSubtopic,
      subtopic,
      message: `Searching for "${subtopic}"...`,
    });

    // Build search query
    const query = `${mainTopic} ${subtopic} English grammar rules examples exercises`;

    // Call Tavily API
    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.tavilyKey,
        query,
        search_depth: "advanced",
        max_results: this.config.maxSourcesPerSubtopic * 2, // Get more, filter later
        include_domains: QUALITY_DOMAINS,
        include_raw_content: true,
      }),
    });

    if (!tavilyResponse.ok) {
      throw new Error(`Tavily search failed: ${tavilyResponse.status}`);
    }

    const tavilyData = await tavilyResponse.json();
    const results = tavilyData.results || [];

    // Process and filter results
    const sources: WebSource[] = [];
    for (const result of results) {
      if (sources.length >= this.config.maxSourcesPerSubtopic) break;

      // Extract content
      const content = result.raw_content || result.content || "";
      if (content.length < 200) continue; // Skip thin content

      const domain = new URL(result.url).hostname.replace("www.", "");

      sources.push({
        url: result.url,
        title: result.title || subtopic,
        domain,
        content: content.slice(0, 10000), // Limit content size
        score: result.score,
      });

      this.emit({
        type: "scraping",
        phase: "Fetching sources",
        current: sources.length,
        total: this.config.maxSourcesPerSubtopic,
        subtopic,
        message: `Fetched ${sources.length} sources from ${domain}`,
      });
    }

    // Update subtopic status
    await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
      id: this.jobId,
      subtopicName: subtopic,
      status: "synthesizing",
      sourceCount: sources.length,
    });

    return sources;
  }

  /**
   * Phase 3: Synthesize web content into structured lesson content
   */
  async synthesizeContent(
    subtopic: string,
    sources: WebSource[],
    mainTopic: string
  ): Promise<{
    lessonContent: any;
    markdown: string;
    wordCount: number;
  }> {
    this.emit({
      type: "synthesizing",
      phase: "Creating structured content",
      current: 0,
      total: 1,
      subtopic,
      message: "AI is synthesizing educational content...",
    });

    // Combine source content
    const sourceText = sources
      .map((s) => `## Source: ${s.title} (${s.domain})\n\n${s.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a MASTER English language teacher and textbook author (Cambridge/Oxford level).

# YOUR MISSION
Create a comprehensive, professional lesson on "${subtopic}" (part of "${mainTopic}").
Use the provided source content as REFERENCE material, but write everything fresh in your own words.

# TARGET AUDIENCE
- German speakers learning English at ${this.config.targetLevel || "B1-B2"} level
- Provide German translations for key content

# WHAT YOU MUST CREATE

## 1. Professional Explanations
- Clear, engaging explanations of the concept
- Proper grammar rule explanations with formulas
- Natural example sentences showing correct usage
- All content must be Cambridge/Oxford textbook quality

## 2. Grammar Rules (if applicable)
- Write clear grammatical formulas (e.g., "Subject + has/have + past participle")
- Include KEYWORDS that identify when this rule applies
- Provide correct/incorrect example pairs
- Note common mistakes German speakers make

## 3. Vocabulary
- 10-20 relevant vocabulary items
- German translations
- Natural example sentences

## 4. Exercises (${this.config.includeExercises ? "REQUIRED" : "OPTIONAL"})
- 5-10 practice exercises
- Multiple types: fill_blank, multiple_choice, error_correction
- ALL correct answers must be provided
- Explanations for each answer

## 5. Common Mistakes
- Include patterns that German speakers commonly get wrong
- Provide corrections and explanations

# OUTPUT
Output ONLY valid JSON matching this schema:
${LESSON_SCHEMA}

Timestamps should use: ${Date.now()}`;

    const response = await this.callAI(
      systemPrompt,
      `Create a comprehensive lesson on "${subtopic}".

SOURCE MATERIAL (use as reference only - write fresh content):
${sourceText}

Output ONLY the JSON object:`,
      16000
    );

    // Parse JSON response
    let jsonText = response.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
    }

    let lessonContent: any;
    try {
      lessonContent = JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse lesson JSON:", e);
      throw new Error("AI returned invalid JSON");
    }

    // Convert to markdown for display
    const markdown = this.lessonToMarkdown(lessonContent, subtopic);
    const wordCount = markdown.split(/\s+/).length;

    // Update subtopic with word count
    await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
      id: this.jobId,
      subtopicName: subtopic,
      status: "optimizing",
      wordCount,
    });

    this.emit({
      type: "synthesizing",
      phase: "Content synthesized",
      current: 1,
      total: 1,
      subtopic,
      message: `Created ${wordCount} words of content`,
    });

    return { lessonContent, markdown, wordCount };
  }

  /**
   * Phase 4: Optimize content for RLM fast retrieval
   */
  buildRlmOptimizedData(lessonContent: any): {
    grammarIndex: Record<string, any[]>;
    vocabularyByTerm: Record<string, any>;
    vocabularyByTermDe: Record<string, any>;
    vocabularyByLevel: Record<string, any[]>;
    mistakePatterns: Array<{
      pattern: string;
      mistakeType: string;
      correction: string;
      explanation: string;
    }>;
    topicKeywords: string[];
  } {
    const grammarIndex: Record<string, any[]> = {};
    const vocabularyByTerm: Record<string, any> = {};
    const vocabularyByTermDe: Record<string, any> = {};
    const vocabularyByLevel: Record<string, any[]> = {};
    const mistakePatterns: Array<{
      pattern: string;
      mistakeType: string;
      correction: string;
      explanation: string;
    }> = [];
    const topicKeywords: string[] = [];

    const content = lessonContent.content || {};

    // Index grammar rules by keywords
    if (content.grammarRules) {
      for (const rule of content.grammarRules) {
        // Add rule keywords to index
        const keywords = rule.keywords || [];
        const nameWords = (rule.name || "").toLowerCase().split(/\s+/);
        const allKeywords = [...keywords, ...nameWords];

        for (const keyword of allKeywords) {
          const key = keyword.toLowerCase().trim();
          if (key.length > 2) {
            if (!grammarIndex[key]) grammarIndex[key] = [];
            grammarIndex[key].push(rule);
            topicKeywords.push(key);
          }
        }

        // Extract common mistakes as patterns
        if (rule.commonMistakes) {
          for (const mistake of rule.commonMistakes) {
            mistakePatterns.push({
              pattern: mistake.pattern,
              mistakeType: rule.category || "grammar",
              correction: mistake.correction,
              explanation: mistake.explanation,
            });
          }
        }
      }
    }

    // Index vocabulary
    if (content.vocabulary) {
      for (const vocab of content.vocabulary) {
        const term = (vocab.term || "").toLowerCase();
        const termDe = (vocab.termDe || "").toLowerCase();
        const level = vocab.level || "B1";

        if (term) {
          vocabularyByTerm[term] = vocab;
          topicKeywords.push(term);
        }
        if (termDe) {
          vocabularyByTermDe[termDe] = vocab;
        }

        if (!vocabularyByLevel[level]) vocabularyByLevel[level] = [];
        vocabularyByLevel[level].push(vocab);
      }
    }

    // Add topic keywords from metadata
    if (lessonContent.metadata) {
      const meta = lessonContent.metadata;
      if (meta.topic) topicKeywords.push(meta.topic.toLowerCase());
      if (meta.subtopics) {
        for (const st of meta.subtopics) {
          topicKeywords.push(st.toLowerCase());
        }
      }
      if (meta.tags) {
        for (const tag of meta.tags) {
          topicKeywords.push(tag.toLowerCase());
        }
      }
    }

    return {
      grammarIndex,
      vocabularyByTerm,
      vocabularyByTermDe,
      vocabularyByLevel,
      mistakePatterns,
      topicKeywords: Array.from(new Set(topicKeywords)),
    };
  }

  /**
   * Run the complete pipeline
   */
  async run(topic: string, initialSubtopics?: string[]): Promise<void> {
    try {
      // Phase 1: Discovery (or use provided subtopics)
      const subtopics = initialSubtopics?.length
        ? initialSubtopics
        : await this.discoverSubtopics(topic);

      // Process each subtopic
      for (let i = 0; i < subtopics.length; i++) {
        const subtopic = subtopics[i];

        try {
          // Phase 2: Scrape
          const sources = await this.scrapeSubtopic(subtopic, topic);

          if (sources.length === 0) {
            await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
              id: this.jobId,
              subtopicName: subtopic,
              status: "failed",
              errorMessage: "No sources found",
            });
            continue;
          }

          // Phase 3: Synthesize
          const { lessonContent, markdown, wordCount } = await this.synthesizeContent(
            subtopic,
            sources,
            topic
          );

          // Phase 4: Optimize for RLM
          this.emit({
            type: "optimizing",
            phase: "Building fast retrieval indexes",
            current: i + 1,
            total: subtopics.length,
            subtopic,
            message: "Optimizing for avatar retrieval...",
          });

          const rlmOptimized = this.buildRlmOptimizedData(lessonContent);

          // Save content to Convex
          const sourceId = `scrape-${subtopic.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

          await this.convex.mutation(api.knowledgeBases.addScrapedContent, {
            knowledgeBaseId: this.knowledgeBaseId,
            sourceId,
            title: subtopic,
            content: markdown,
            jsonContent: lessonContent,
            rlmOptimized: {
              ...rlmOptimized,
              version: "1.0",
              optimizedAt: Date.now(),
            },
            webSources: sources.map((s) => ({
              url: s.url,
              title: s.title,
              domain: s.domain,
              scrapedAt: Date.now(),
              relevanceScore: s.score,
            })),
            metadata: {
              wordCount,
              exerciseCount: lessonContent.content?.exercises?.length || 0,
              vocabularyCount: lessonContent.content?.vocabulary?.length || 0,
              grammarRuleCount: lessonContent.content?.grammarRules?.length || 0,
              level: this.config.targetLevel,
            },
          });

          // Mark subtopic complete
          await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
            id: this.jobId,
            subtopicName: subtopic,
            status: "completed",
            wordCount,
          });
        } catch (error) {
          console.error(`Failed to process subtopic "${subtopic}":`, error);
          await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
            id: this.jobId,
            subtopicName: subtopic,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Processing failed",
          });
        }
      }

      // Complete the job
      await this.convex.mutation(api.scrapingJobs.updateStatus, {
        id: this.jobId,
        status: "completed",
      });

      this.emit({
        type: "complete",
        phase: "Knowledge base generated",
        current: subtopics.length,
        total: subtopics.length,
        message: `Successfully created knowledge base with ${subtopics.length} topics`,
      });
    } catch (error) {
      console.error("Scraping orchestrator failed:", error);

      await this.convex.mutation(api.scrapingJobs.updateStatus, {
        id: this.jobId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      this.emit({
        type: "error",
        phase: "Failed",
        current: 0,
        total: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  // Helper: Call AI via OpenRouter
  private async callAI(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://beethoven.app",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI call failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  // Helper: Convert lesson content to markdown
  private lessonToMarkdown(content: any, title: string): string {
    let md = `# ${title}\n\n`;

    const c = content.content || {};
    const meta = content.metadata || {};

    if (meta.level) md += `**Level:** ${meta.level}\n\n`;

    // Learning objectives
    if (c.learningObjectives?.length) {
      md += "## Learning Objectives\n\n";
      for (const obj of c.learningObjectives) {
        md += `- ${obj.objective}\n`;
        if (obj.objectiveDe) md += `  - *${obj.objectiveDe}*\n`;
      }
      md += "\n";
    }

    // Introduction
    if (c.introduction?.content) {
      md += "## Introduction\n\n";
      md += c.introduction.content + "\n\n";
    }

    // Grammar rules
    if (c.grammarRules?.length) {
      md += "## Grammar Rules\n\n";
      for (const rule of c.grammarRules) {
        md += `### ${rule.name}\n\n`;
        if (rule.formula) md += `**Formula:** \`${rule.formula}\`\n\n`;
        md += rule.rule + "\n\n";
        if (rule.examples?.length) {
          md += "**Examples:**\n";
          for (const ex of rule.examples) {
            md += `- ✓ ${ex.correct}\n`;
            if (ex.incorrect) md += `- ✗ ~~${ex.incorrect}~~\n`;
            if (ex.explanation) md += `  - *${ex.explanation}*\n`;
          }
          md += "\n";
        }
      }
    }

    // Vocabulary
    if (c.vocabulary?.length) {
      md += "## Vocabulary\n\n";
      md += "| English | German | Example |\n";
      md += "|---------|--------|----------|\n";
      for (const v of c.vocabulary) {
        md += `| **${v.term}** | ${v.termDe || ""} | ${v.exampleSentence || ""} |\n`;
      }
      md += "\n";
    }

    // Exercises
    if (c.exercises?.length) {
      md += "## Exercises\n\n";
      for (const ex of c.exercises) {
        md += `### ${ex.title}\n\n`;
        md += `*${ex.instructions}*\n\n`;
        if (ex.items?.length) {
          for (let i = 0; i < ex.items.length; i++) {
            const item = ex.items[i];
            md += `${i + 1}. ${item.question}\n`;
            if (item.options?.length) {
              for (const opt of item.options) {
                md += `   - ${opt}\n`;
              }
            }
            md += `   **Answer:** ${item.correctAnswer}\n`;
            if (item.explanation) md += `   *${item.explanation}*\n`;
            md += "\n";
          }
        }
      }
    }

    // Summary
    if (c.summary?.content) {
      md += "## Summary\n\n";
      md += c.summary.content + "\n\n";
      if (c.summary.keyPoints?.length) {
        md += "**Key Points:**\n";
        for (const point of c.summary.keyPoints) {
          md += `- ${point}\n`;
        }
      }
    }

    return md;
  }

  // Helper: Emit progress event
  private emit(event: Parameters<ProgressCallback>[0]): void {
    if (this.onProgress) {
      this.onProgress(event);
    }
  }
}

/**
 * Helper to create and run a scraping job
 */
export async function runScrapingJob(
  convex: ConvexHttpClient,
  jobId: Id<"scrapingJobs">,
  knowledgeBaseId: Id<"knowledgeBases">,
  topic: string,
  config: ScrapingConfig,
  subtopics?: string[],
  onProgress?: ProgressCallback
): Promise<void> {
  const orchestrator = new ScrapingOrchestrator(
    convex,
    jobId,
    knowledgeBaseId,
    config,
    onProgress
  );

  await orchestrator.run(topic, subtopics);
}
