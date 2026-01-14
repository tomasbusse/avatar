/**
 * Multi-Agent Knowledge Base Orchestrator
 *
 * Coordinates three specialized agents to generate high-quality knowledge bases:
 * 1. Research Agent - Collects information from the web
 * 2. Organization Agent - Structures and organizes the information
 * 3. Knowledge Writer Agent - Writes polished content optimized for RLM
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ResearchAgent, ResearchResult, ResearchAgentConfig } from "./research-agent";
import { OrganizationAgent, OrganizedContent, OrganizationAgentConfig } from "./organization-agent";
import { KnowledgeWriterAgent, KnowledgeContent, KnowledgeWriterConfig } from "./knowledge-writer-agent";

// Scale presets for content generation
export type GenerationScale = "quick" | "standard" | "comprehensive" | "book";

export const SCALE_PRESETS: Record<GenerationScale, { subtopics: number; sources: number; description: string }> = {
  quick: { subtopics: 5, sources: 5, description: "Quick overview (~25 sources)" },
  standard: { subtopics: 12, sources: 10, description: "Balanced coverage (~120 sources)" },
  comprehensive: { subtopics: 25, sources: 15, description: "In-depth (~375 sources)" },
  book: { subtopics: 50, sources: 20, description: "Full book (~1000 sources)" },
};

export interface OrchestratorConfig {
  scale?: GenerationScale;
  depth: number;
  maxSourcesPerSubtopic: number;
  includeExercises: boolean;
  targetLevel?: string;
  language: string;
  tags?: string[];
  referenceUrls?: string[];
  broadSearch?: boolean;
}

export interface ProgressEvent {
  type: "discovery" | "research" | "organizing" | "writing" | "complete" | "error";
  phase: string;
  agent: "orchestrator" | "research" | "organization" | "writer";
  current: number;
  total: number;
  message?: string;
  subtopic?: string;
  details?: {
    factsCollected?: number;
    sourcesFound?: number;
    sectionsPlanned?: number;
    contentWritten?: number;
  };
}

export type ProgressCallback = (event: ProgressEvent) => void;

export class MultiAgentOrchestrator {
  private convex: ConvexHttpClient;
  private jobId: Id<"scrapingJobs">;
  private knowledgeBaseId: Id<"knowledgeBases">;
  private config: OrchestratorConfig;
  private onProgress?: ProgressCallback;

  // Agents
  private researchAgent: ResearchAgent;
  private organizationAgent: OrganizationAgent;
  private knowledgeWriterAgent: KnowledgeWriterAgent;

  constructor(
    convex: ConvexHttpClient,
    jobId: Id<"scrapingJobs">,
    knowledgeBaseId: Id<"knowledgeBases">,
    config: OrchestratorConfig,
    onProgress?: ProgressCallback
  ) {
    this.convex = convex;
    this.jobId = jobId;
    this.knowledgeBaseId = knowledgeBaseId;
    this.config = config;
    this.onProgress = onProgress;

    // Validate environment
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (!openrouterKey) throw new Error("Missing OPENROUTER_API_KEY");
    if (!tavilyKey) throw new Error("Missing TAVILY_API_KEY");

    // Initialize agents
    const researchConfig: ResearchAgentConfig = {
      tavilyApiKey: tavilyKey,
      openrouterApiKey: openrouterKey,
      maxSources: config.maxSourcesPerSubtopic,
      broadSearch: config.broadSearch ?? false,
      language: config.language,
    };

    const organizationConfig: OrganizationAgentConfig = {
      openrouterApiKey: openrouterKey,
      targetLevel: config.targetLevel,
      language: config.language,
      includeExercises: config.includeExercises,
    };

    const writerConfig: KnowledgeWriterConfig = {
      openrouterApiKey: openrouterKey,
      language: config.language,
      targetLevel: config.targetLevel,
    };

    this.researchAgent = new ResearchAgent(researchConfig);
    this.organizationAgent = new OrganizationAgent(organizationConfig);
    this.knowledgeWriterAgent = new KnowledgeWriterAgent(writerConfig);

    console.log("[Orchestrator] Initialized with 3 agents: Research, Organization, Writer");
  }

  /**
   * Run the complete multi-agent pipeline
   */
  async run(topic: string, initialSubtopics?: string[]): Promise<void> {
    try {
      console.log(`[Orchestrator] Starting knowledge base generation for: "${topic}"`);

      // Phase 1: Discovery (if no subtopics provided)
      const subtopics = initialSubtopics?.length
        ? initialSubtopics
        : await this.discoverSubtopics(topic);

      console.log(`[Orchestrator] Will process ${subtopics.length} subtopics`);

      // Process each subtopic through the 3-agent pipeline
      for (let i = 0; i < subtopics.length; i++) {
        const subtopic = subtopics[i];
        console.log(`\n[Orchestrator] Processing subtopic ${i + 1}/${subtopics.length}: "${subtopic}"`);

        try {
          // Agent 1: Research
          this.emit({
            type: "research",
            phase: "Collecting information",
            agent: "research",
            current: i + 1,
            total: subtopics.length,
            subtopic,
            message: `Research Agent is searching the web for "${subtopic}"...`,
          });

          const research = await this.researchAgent.research(subtopic, topic);

          await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
            id: this.jobId,
            subtopicName: subtopic,
            status: "scraping",
            sourceCount: research.sources.length,
          });

          this.emit({
            type: "research",
            phase: "Research complete",
            agent: "research",
            current: i + 1,
            total: subtopics.length,
            subtopic,
            message: `Found ${research.sources.length} sources, ${research.keyFacts.length} facts`,
            details: {
              sourcesFound: research.sources.length,
              factsCollected: research.keyFacts.length,
            },
          });

          // Agent 2: Organization
          this.emit({
            type: "organizing",
            phase: "Structuring content",
            agent: "organization",
            current: i + 1,
            total: subtopics.length,
            subtopic,
            message: `Organization Agent is creating content structure...`,
          });

          const organized = await this.organizationAgent.organize(research, topic);

          await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
            id: this.jobId,
            subtopicName: subtopic,
            status: "synthesizing",
          });

          this.emit({
            type: "organizing",
            phase: "Organization complete",
            agent: "organization",
            current: i + 1,
            total: subtopics.length,
            subtopic,
            message: `Planned ${organized.sections.length} sections, ${organized.vocabularyPlan.length} vocabulary items`,
            details: {
              sectionsPlanned: organized.sections.length,
            },
          });

          // Agent 3: Knowledge Writer
          this.emit({
            type: "writing",
            phase: "Writing content",
            agent: "writer",
            current: i + 1,
            total: subtopics.length,
            subtopic,
            message: `Knowledge Writer Agent is creating final content...`,
          });

          const knowledgeContent = await this.knowledgeWriterAgent.write(organized, research);

          await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
            id: this.jobId,
            subtopicName: subtopic,
            status: "optimizing",
          });

          // Convert to markdown for display
          const markdown = this.contentToMarkdown(knowledgeContent);
          const wordCount = markdown.split(/\s+/).length;

          // Save to Convex
          const sourceId = `multiagent-${subtopic.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

          await this.convex.mutation(api.knowledgeBases.addScrapedContent, {
            knowledgeBaseId: this.knowledgeBaseId,
            sourceId,
            title: knowledgeContent.metadata.title,
            content: markdown,
            jsonContent: knowledgeContent,
            rlmOptimized: {
              ...knowledgeContent.rlmOptimized,
              version: "2.0",
              optimizedAt: Date.now(),
            },
            webSources: knowledgeContent.webSources,
            metadata: {
              wordCount,
              exerciseCount: knowledgeContent.content.exercises.length,
              vocabularyCount: knowledgeContent.content.vocabulary.length,
              grammarRuleCount: knowledgeContent.content.grammarRules.length,
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

          this.emit({
            type: "writing",
            phase: "Content saved",
            agent: "writer",
            current: i + 1,
            total: subtopics.length,
            subtopic,
            message: `Wrote ${wordCount} words with ${knowledgeContent.rlmOptimized.topicKeywords.length} RLM keywords`,
            details: {
              contentWritten: wordCount,
            },
          });

        } catch (error) {
          console.error(`[Orchestrator] Failed to process subtopic "${subtopic}":`, error);

          await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
            id: this.jobId,
            subtopicName: subtopic,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Processing failed",
          });

          this.emit({
            type: "error",
            phase: "Subtopic failed",
            agent: "orchestrator",
            current: i + 1,
            total: subtopics.length,
            subtopic,
            message: error instanceof Error ? error.message : "Unknown error",
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
        agent: "orchestrator",
        current: subtopics.length,
        total: subtopics.length,
        message: `Successfully created knowledge base with ${subtopics.length} topics`,
      });

      console.log(`\n[Orchestrator] Knowledge base generation complete!`);

    } catch (error) {
      console.error("[Orchestrator] Pipeline failed:", error);

      await this.convex.mutation(api.scrapingJobs.updateStatus, {
        id: this.jobId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      this.emit({
        type: "error",
        phase: "Pipeline failed",
        agent: "orchestrator",
        current: 0,
        total: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  /**
   * Discover subtopics for a topic using AI
   */
  private async discoverSubtopics(topic: string): Promise<string[]> {
    this.emit({
      type: "discovery",
      phase: "Discovering subtopics",
      agent: "orchestrator",
      current: 0,
      total: 1,
      message: `Analyzing "${topic}" to find key subtopics...`,
    });

    const scalePreset = this.config.scale ? SCALE_PRESETS[this.config.scale] : null;
    const targetSubtopics = scalePreset
      ? scalePreset.subtopics
      : (this.config.depth === 1 ? 5 : this.config.depth === 2 ? 10 : 15);

    const systemPrompt = `You are an expert curriculum designer.
Given a topic, identify ALL the key subtopics that should be covered for comprehensive learning.

Guidelines:
- Identify ${targetSubtopics} subtopics
- Each subtopic should be specific and teachable
- Order from fundamental to advanced
- Include practical applications
${targetSubtopics >= 25 ? "- This is comprehensive coverage - include sub-categories, deep dives, edge cases" : ""}

Output ONLY a JSON array of subtopic names.`;

    const response = await this.callAI(
      systemPrompt,
      `Topic: ${topic}\nTarget count: ${targetSubtopics}\nLevel: ${this.config.targetLevel || "general"}`,
      targetSubtopics >= 25 ? 4000 : 2000
    );

    let subtopics: string[] = [];
    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      subtopics = JSON.parse(jsonText);
    } catch {
      const lines = response.split("\n").filter((l) => l.trim());
      subtopics = lines
        .map((l) => l.replace(/^[\d\-\*\.\)]+\s*/, "").trim())
        .filter((l) => l.length > 3 && l.length < 100);
    }

    const maxSubtopics = scalePreset?.subtopics || this.config.depth * 5;
    subtopics = subtopics.slice(0, maxSubtopics);

    // Update job with discovered subtopics
    await this.convex.mutation(api.scrapingJobs.setSubtopics, {
      id: this.jobId,
      subtopics,
    });

    this.emit({
      type: "discovery",
      phase: "Subtopics discovered",
      agent: "orchestrator",
      current: 1,
      total: 1,
      message: `Found ${subtopics.length} subtopics to cover`,
    });

    return subtopics;
  }

  /**
   * Convert knowledge content to markdown for display
   */
  private contentToMarkdown(content: KnowledgeContent): string {
    let md = `# ${content.metadata.title}\n\n`;

    if (content.metadata.level) md += `**Level:** ${content.metadata.level}\n\n`;

    // Learning objectives
    if (content.content.learningObjectives?.length) {
      md += "## Learning Objectives\n\n";
      for (const obj of content.content.learningObjectives) {
        md += `- ${obj.objective}\n`;
        if (obj.objectiveDe) md += `  - *${obj.objectiveDe}*\n`;
      }
      md += "\n";
    }

    // Introduction
    if (content.content.introduction?.content) {
      md += "## Introduction\n\n";
      md += content.content.introduction.content + "\n\n";
    }

    // Sections
    for (const section of content.content.sections) {
      md += `## ${section.title}\n\n`;
      md += section.content + "\n\n";
    }

    // Grammar rules
    if (content.content.grammarRules?.length) {
      md += "## Grammar Rules\n\n";
      for (const rule of content.content.grammarRules) {
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
    if (content.content.vocabulary?.length) {
      md += "## Vocabulary\n\n";
      md += "| English | German | Example |\n";
      md += "|---------|--------|----------|\n";
      for (const v of content.content.vocabulary) {
        md += `| **${v.term}** | ${v.termDe || ""} | ${v.exampleSentence || ""} |\n`;
      }
      md += "\n";
    }

    // Exercises
    if (content.content.exercises?.length) {
      md += "## Exercises\n\n";
      for (const ex of content.content.exercises) {
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
    if (content.content.summary?.content) {
      md += "## Summary\n\n";
      md += content.content.summary.content + "\n\n";
      if (content.content.summary.keyPoints?.length) {
        md += "**Key Points:**\n";
        for (const point of content.content.summary.keyPoints) {
          md += `- ${point}\n`;
        }
      }
    }

    return md;
  }

  /**
   * Emit progress event
   */
  private emit(event: ProgressEvent): void {
    if (this.onProgress) {
      this.onProgress(event);
    }
  }

  /**
   * Call AI via OpenRouter
   */
  private async callAI(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
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
}

/**
 * Helper to create and run a multi-agent scraping job
 */
export async function runMultiAgentJob(
  convex: ConvexHttpClient,
  jobId: Id<"scrapingJobs">,
  knowledgeBaseId: Id<"knowledgeBases">,
  topic: string,
  config: OrchestratorConfig,
  subtopics?: string[],
  onProgress?: ProgressCallback
): Promise<void> {
  const orchestrator = new MultiAgentOrchestrator(
    convex,
    jobId,
    knowledgeBaseId,
    config,
    onProgress
  );

  await orchestrator.run(topic, subtopics);
}
