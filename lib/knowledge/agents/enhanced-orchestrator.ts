/**
 * Enhanced Multi-Agent Knowledge Base Orchestrator
 *
 * Coordinates FIVE specialized agents with parallel processing:
 * 1. Research Agent - Collects information from the web
 * 2. Source Verification Agent - Cross-references facts for accuracy
 * 3. Organization Agent - Structures and organizes content
 * 4. Knowledge Writer Agent - Writes polished RLM-optimized content
 * 5. Quality Reviewer Agent - Final quality gate before saving
 *
 * Features:
 * - Parallel processing of multiple subtopics
 * - Configurable concurrency
 * - Quality gates with auto-retry
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ResearchAgent, ResearchResult } from "./research-agent";
import { SourceVerificationAgent, VerifiedResearch } from "./source-verification-agent";
import { OrganizationAgent, OrganizedContent } from "./organization-agent";
import { KnowledgeWriterAgent, KnowledgeContent } from "./knowledge-writer-agent";
import { QualityReviewerAgent, QualityReview } from "./quality-reviewer-agent";

// Scale presets
export type GenerationScale = "quick" | "standard" | "comprehensive" | "book";

export const SCALE_PRESETS: Record<GenerationScale, {
  subtopics: number;
  sources: number;
  description: string;
  concurrency: number;
}> = {
  quick: { subtopics: 5, sources: 5, description: "Quick overview", concurrency: 3 },
  standard: { subtopics: 12, sources: 10, description: "Balanced coverage", concurrency: 4 },
  comprehensive: { subtopics: 25, sources: 15, description: "In-depth", concurrency: 5 },
  book: { subtopics: 50, sources: 20, description: "Full book", concurrency: 6 },
};

export interface EnhancedOrchestratorConfig {
  scale?: GenerationScale;
  depth: number;
  maxSourcesPerSubtopic: number;
  includeExercises: boolean;
  targetLevel?: string;
  language: string;
  tags?: string[];
  referenceUrls?: string[];
  broadSearch?: boolean;
  // New options
  enableParallel?: boolean;
  maxConcurrency?: number;
  enableVerification?: boolean;
  enableQualityReview?: boolean;
  strictQuality?: boolean;
  autoRetryOnFail?: boolean;
}

export interface EnhancedProgressEvent {
  type: "discovery" | "research" | "verifying" | "organizing" | "writing" | "reviewing" | "complete" | "error";
  phase: string;
  agent: "orchestrator" | "research" | "verification" | "organization" | "writer" | "reviewer";
  current: number;
  total: number;
  message?: string;
  subtopic?: string;
  parallelStatus?: {
    activeWorkers: number;
    queuedSubtopics: number;
    completedSubtopics: number;
  };
  qualityScore?: number;
}

export type EnhancedProgressCallback = (event: EnhancedProgressEvent) => void;

interface SubtopicResult {
  subtopic: string;
  success: boolean;
  content?: KnowledgeContent;
  qualityReview?: QualityReview;
  error?: string;
  wordCount?: number;
  retryCount: number;
}

export class EnhancedOrchestrator {
  private convex: ConvexHttpClient;
  private jobId: Id<"scrapingJobs">;
  private knowledgeBaseId: Id<"knowledgeBases">;
  private config: EnhancedOrchestratorConfig;
  private onProgress?: EnhancedProgressCallback;

  // Agents
  private researchAgent: ResearchAgent;
  private verificationAgent: SourceVerificationAgent;
  private organizationAgent: OrganizationAgent;
  private writerAgent: KnowledgeWriterAgent;
  private reviewerAgent: QualityReviewerAgent;

  // Parallel processing state
  private activeWorkers = 0;
  private completedSubtopics = 0;
  private maxConcurrency: number;

  constructor(
    convex: ConvexHttpClient,
    jobId: Id<"scrapingJobs">,
    knowledgeBaseId: Id<"knowledgeBases">,
    config: EnhancedOrchestratorConfig,
    onProgress?: EnhancedProgressCallback
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

    // Set concurrency based on scale
    const scalePreset = config.scale ? SCALE_PRESETS[config.scale] : null;
    this.maxConcurrency = config.maxConcurrency || scalePreset?.concurrency || 3;

    // Initialize all agents
    this.researchAgent = new ResearchAgent({
      tavilyApiKey: tavilyKey,
      openrouterApiKey: openrouterKey,
      maxSources: config.maxSourcesPerSubtopic,
      broadSearch: config.broadSearch ?? false,
      language: config.language,
    });

    this.verificationAgent = new SourceVerificationAgent({
      openrouterApiKey: openrouterKey,
      minConfidenceThreshold: config.strictQuality ? 0.7 : 0.5,
      requireMultipleSources: config.strictQuality ?? false,
    });

    this.organizationAgent = new OrganizationAgent({
      openrouterApiKey: openrouterKey,
      targetLevel: config.targetLevel,
      language: config.language,
      includeExercises: config.includeExercises,
    });

    this.writerAgent = new KnowledgeWriterAgent({
      openrouterApiKey: openrouterKey,
      language: config.language,
      targetLevel: config.targetLevel,
    });

    this.reviewerAgent = new QualityReviewerAgent({
      openrouterApiKey: openrouterKey,
      strictMode: config.strictQuality ?? false,
      autoFix: true,
    });

    console.log(`[EnhancedOrchestrator] Initialized with 5 agents, concurrency: ${this.maxConcurrency}`);
  }

  /**
   * Run the complete enhanced pipeline with parallel processing
   */
  async run(topic: string, initialSubtopics?: string[]): Promise<void> {
    try {
      console.log(`[EnhancedOrchestrator] Starting enhanced generation for: "${topic}"`);

      // Phase 1: Discovery
      const subtopics = initialSubtopics?.length
        ? initialSubtopics
        : await this.discoverSubtopics(topic);

      console.log(`[EnhancedOrchestrator] Will process ${subtopics.length} subtopics with ${this.maxConcurrency} parallel workers`);

      // Phase 2: Process subtopics (parallel or sequential)
      const results: SubtopicResult[] = [];

      if (this.config.enableParallel !== false && subtopics.length > 1) {
        // Parallel processing
        const chunks = this.chunkArray(subtopics, this.maxConcurrency);

        for (const chunk of chunks) {
          const chunkResults = await Promise.all(
            chunk.map((subtopic) => this.processSubtopic(subtopic, topic, subtopics.length))
          );
          results.push(...chunkResults);
        }
      } else {
        // Sequential processing
        for (const subtopic of subtopics) {
          const result = await this.processSubtopic(subtopic, topic, subtopics.length);
          results.push(result);
        }
      }

      // Calculate success rate
      const successCount = results.filter((r) => r.success).length;
      const totalWords = results.reduce((sum, r) => sum + (r.wordCount || 0), 0);

      // Complete the job
      await this.convex.mutation(api.scrapingJobs.updateStatus, {
        id: this.jobId,
        status: successCount > 0 ? "completed" : "failed",
        errorMessage: successCount === 0 ? "All subtopics failed to process" : undefined,
      });

      this.emit({
        type: "complete",
        phase: "Knowledge base generated",
        agent: "orchestrator",
        current: subtopics.length,
        total: subtopics.length,
        message: `Completed ${successCount}/${subtopics.length} subtopics, ${totalWords} total words`,
        parallelStatus: {
          activeWorkers: 0,
          queuedSubtopics: 0,
          completedSubtopics: this.completedSubtopics,
        },
      });

      console.log(`\n[EnhancedOrchestrator] Generation complete! ${successCount}/${subtopics.length} succeeded`);

    } catch (error) {
      console.error("[EnhancedOrchestrator] Pipeline failed:", error);

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
   * Process a single subtopic through all 5 agents
   */
  private async processSubtopic(
    subtopic: string,
    mainTopic: string,
    totalSubtopics: number
  ): Promise<SubtopicResult> {
    this.activeWorkers++;
    let retryCount = 0;
    const maxRetries = this.config.autoRetryOnFail ? 2 : 0;

    while (retryCount <= maxRetries) {
      try {
        console.log(`\n[EnhancedOrchestrator] Processing: "${subtopic}" (attempt ${retryCount + 1})`);

        // Agent 1: Research
        this.emit({
          type: "research",
          phase: "Collecting information",
          agent: "research",
          current: this.completedSubtopics + 1,
          total: totalSubtopics,
          subtopic,
          message: `Research Agent searching for "${subtopic}"...`,
          parallelStatus: this.getParallelStatus(totalSubtopics),
        });

        const research = await this.researchAgent.research(subtopic, mainTopic);

        await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
          id: this.jobId,
          subtopicName: subtopic,
          status: "scraping",
          sourceCount: research.sources.length,
        });

        // Agent 2: Source Verification (if enabled)
        let verifiedResearch: VerifiedResearch | ResearchResult = research;

        if (this.config.enableVerification !== false) {
          this.emit({
            type: "verifying",
            phase: "Cross-referencing sources",
            agent: "verification",
            current: this.completedSubtopics + 1,
            total: totalSubtopics,
            subtopic,
            message: `Verification Agent checking ${research.keyFacts.length} facts...`,
            parallelStatus: this.getParallelStatus(totalSubtopics),
          });

          verifiedResearch = await this.verificationAgent.verify(research, mainTopic);

          console.log(`[EnhancedOrchestrator] Verification confidence: ${((verifiedResearch as VerifiedResearch).verification.overallConfidence * 100).toFixed(1)}%`);
        }

        // Agent 3: Organization
        this.emit({
          type: "organizing",
          phase: "Structuring content",
          agent: "organization",
          current: this.completedSubtopics + 1,
          total: totalSubtopics,
          subtopic,
          message: "Organization Agent creating structure...",
          parallelStatus: this.getParallelStatus(totalSubtopics),
        });

        const organized = await this.organizationAgent.organize(research, mainTopic);

        await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
          id: this.jobId,
          subtopicName: subtopic,
          status: "synthesizing",
        });

        // Agent 4: Knowledge Writer
        this.emit({
          type: "writing",
          phase: "Writing content",
          agent: "writer",
          current: this.completedSubtopics + 1,
          total: totalSubtopics,
          subtopic,
          message: "Knowledge Writer Agent creating final content...",
          parallelStatus: this.getParallelStatus(totalSubtopics),
        });

        let content = await this.writerAgent.write(organized, research);

        await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
          id: this.jobId,
          subtopicName: subtopic,
          status: "optimizing",
        });

        // Agent 5: Quality Review (if enabled)
        let qualityReview: QualityReview | undefined;

        if (this.config.enableQualityReview !== false) {
          this.emit({
            type: "reviewing",
            phase: "Quality review",
            agent: "reviewer",
            current: this.completedSubtopics + 1,
            total: totalSubtopics,
            subtopic,
            message: "Quality Reviewer Agent checking content...",
            parallelStatus: this.getParallelStatus(totalSubtopics),
          });

          const reviewResult = await this.reviewerAgent.review(content, research);
          qualityReview = reviewResult.review;

          // Use improved content if available
          if (reviewResult.improvedContent) {
            content = reviewResult.improvedContent;
          }

          // Check if quality gate passes
          if (!qualityReview.passesQualityGate && retryCount < maxRetries) {
            console.log(`[EnhancedOrchestrator] Quality gate failed (${qualityReview.overallScore}/100), retrying...`);
            retryCount++;
            continue; // Retry the whole process
          }

          this.emit({
            type: "reviewing",
            phase: "Quality review complete",
            agent: "reviewer",
            current: this.completedSubtopics + 1,
            total: totalSubtopics,
            subtopic,
            message: `Quality score: ${qualityReview.overallScore}/100`,
            qualityScore: qualityReview.overallScore,
            parallelStatus: this.getParallelStatus(totalSubtopics),
          });
        }

        // Save to Convex
        const markdown = this.contentToMarkdown(content);
        const wordCount = markdown.split(/\s+/).length;
        const sourceId = `enhanced-${subtopic.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

        await this.convex.mutation(api.knowledgeBases.addScrapedContent, {
          knowledgeBaseId: this.knowledgeBaseId,
          sourceId,
          title: content.metadata.title,
          content: markdown,
          jsonContent: content,
          rlmOptimized: {
            ...content.rlmOptimized,
            version: "2.1",
            optimizedAt: Date.now(),
          },
          webSources: content.webSources,
          metadata: {
            wordCount,
            exerciseCount: content.content.exercises.length,
            vocabularyCount: content.content.vocabulary.length,
            grammarRuleCount: content.content.grammarRules.length,
            level: this.config.targetLevel,
          },
        });

        // Mark complete
        await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
          id: this.jobId,
          subtopicName: subtopic,
          status: "completed",
          wordCount,
        });

        this.completedSubtopics++;
        this.activeWorkers--;

        return {
          subtopic,
          success: true,
          content,
          qualityReview,
          wordCount,
          retryCount,
        };

      } catch (error) {
        console.error(`[EnhancedOrchestrator] Error processing "${subtopic}":`, error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[EnhancedOrchestrator] Retrying... (${retryCount}/${maxRetries})`);
          continue;
        }

        // Mark as failed
        await this.convex.mutation(api.scrapingJobs.updateSubtopic, {
          id: this.jobId,
          subtopicName: subtopic,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Processing failed",
        });

        this.activeWorkers--;

        return {
          subtopic,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          retryCount,
        };
      }
    }

    // This shouldn't be reached, but TypeScript needs it
    this.activeWorkers--;
    return { subtopic, success: false, error: "Max retries exceeded", retryCount };
  }

  /**
   * Discover subtopics for a topic
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
    const targetSubtopics = scalePreset?.subtopics || this.config.depth * 5;

    const systemPrompt = `You are an expert curriculum designer.
Given a topic, identify ALL the key subtopics for comprehensive learning.

Guidelines:
- Identify ${targetSubtopics} subtopics
- Each should be specific and teachable
- Order from fundamental to advanced
- Include practical applications
${targetSubtopics >= 25 ? "- For comprehensive coverage, include sub-categories and deep dives" : ""}

Output ONLY a JSON array of subtopic names.`;

    const response = await this.callAI(
      systemPrompt,
      `Topic: ${topic}\nTarget: ${targetSubtopics}\nLevel: ${this.config.targetLevel || "general"}`,
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

    subtopics = subtopics.slice(0, scalePreset?.subtopics || this.config.depth * 5);

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
   * Get current parallel processing status
   */
  private getParallelStatus(total: number): EnhancedProgressEvent["parallelStatus"] {
    return {
      activeWorkers: this.activeWorkers,
      queuedSubtopics: total - this.completedSubtopics - this.activeWorkers,
      completedSubtopics: this.completedSubtopics,
    };
  }

  /**
   * Split array into chunks for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Convert content to markdown
   */
  private contentToMarkdown(content: KnowledgeContent): string {
    let md = `# ${content.metadata.title}\n\n`;

    if (content.metadata.level) md += `**Level:** ${content.metadata.level}\n\n`;

    if (content.content.learningObjectives?.length) {
      md += "## Learning Objectives\n\n";
      for (const obj of content.content.learningObjectives) {
        md += `- ${obj.objective}\n`;
      }
      md += "\n";
    }

    if (content.content.introduction?.content) {
      md += "## Introduction\n\n" + content.content.introduction.content + "\n\n";
    }

    for (const section of content.content.sections) {
      md += `## ${section.title}\n\n${section.content}\n\n`;
    }

    if (content.content.grammarRules?.length) {
      md += "## Grammar Rules\n\n";
      for (const rule of content.content.grammarRules) {
        md += `### ${rule.name}\n\n`;
        if (rule.formula) md += `**Formula:** \`${rule.formula}\`\n\n`;
        md += rule.rule + "\n\n";
      }
    }

    if (content.content.vocabulary?.length) {
      md += "## Vocabulary\n\n| English | German | Example |\n|---|---|---|\n";
      for (const v of content.content.vocabulary) {
        md += `| **${v.term}** | ${v.termDe || ""} | ${v.exampleSentence || ""} |\n`;
      }
      md += "\n";
    }

    if (content.content.exercises?.length) {
      md += "## Exercises\n\n";
      for (const ex of content.content.exercises) {
        md += `### ${ex.title}\n\n*${ex.instructions}*\n\n`;
        for (let i = 0; i < ex.items.length; i++) {
          const item = ex.items[i];
          md += `${i + 1}. ${item.question}\n`;
          md += `   **Answer:** ${item.correctAnswer}\n\n`;
        }
      }
    }

    if (content.content.summary?.content) {
      md += "## Summary\n\n" + content.content.summary.content + "\n";
    }

    return md;
  }

  /**
   * Emit progress event
   */
  private emit(event: EnhancedProgressEvent): void {
    if (this.onProgress) {
      this.onProgress(event);
    }
  }

  /**
   * Call AI
   */
  private async callAI(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

    if (!response.ok) throw new Error(`AI call failed: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

/**
 * Helper to run enhanced multi-agent job
 */
export async function runEnhancedJob(
  convex: ConvexHttpClient,
  jobId: Id<"scrapingJobs">,
  knowledgeBaseId: Id<"knowledgeBases">,
  topic: string,
  config: EnhancedOrchestratorConfig,
  subtopics?: string[],
  onProgress?: EnhancedProgressCallback
): Promise<void> {
  const orchestrator = new EnhancedOrchestrator(
    convex,
    jobId,
    knowledgeBaseId,
    config,
    onProgress
  );

  await orchestrator.run(topic, subtopics);
}
