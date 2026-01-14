/**
 * Knowledge Base Feedback Loop System
 *
 * Learns from avatar usage to improve future content generation:
 * 1. Tracks which content the avatar uses successfully
 * 2. Identifies gaps where the avatar couldn't find answers
 * 3. Records student confusion points
 * 4. Generates improvement recommendations
 *
 * This data feeds back into future knowledge base generation
 * to create increasingly better educational content.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Types for tracking avatar knowledge usage
export interface KnowledgeUsageEvent {
  type: "lookup" | "retrieval" | "fallback" | "gap";
  timestamp: number;
  sessionId: string;
  studentId?: string;

  // What was looked up
  query: string;
  queryType: "grammar" | "vocabulary" | "exercise" | "general";

  // What was found (or not)
  found: boolean;
  contentId?: string;
  contentTitle?: string;
  rlmLookupTime?: number; // ms

  // How it was used
  usedInResponse: boolean;
  studentFoundHelpful?: boolean;
  studentAskedFollowUp?: boolean;

  // Context
  lessonTopic?: string;
  studentLevel?: string;
}

export interface ContentEffectiveness {
  contentId: string;
  title: string;
  knowledgeBaseId: string;

  // Usage metrics
  lookupCount: number;
  successfulLookups: number;
  failedLookups: number;
  averageLookupTime: number;

  // Effectiveness metrics
  usedInResponseCount: number;
  helpfulCount: number;
  confusingCount: number;
  followUpRate: number; // % of times student asked follow-up

  // Quality indicators
  effectivenessScore: number; // 0-100
  needsImprovement: boolean;
  improvementReasons: string[];
}

export interface KnowledgeGap {
  id: string;
  query: string;
  queryType: string;
  occurrenceCount: number;
  firstSeen: number;
  lastSeen: number;
  relatedTopics: string[];
  suggestedContent: string;
  priority: "high" | "medium" | "low";
}

export interface FeedbackSummary {
  knowledgeBaseId: string;
  periodStart: number;
  periodEnd: number;

  // Overall metrics
  totalLookups: number;
  successRate: number;
  averageLookupTime: number;
  avgHelpfulness: number;

  // Content performance
  topPerformingContent: ContentEffectiveness[];
  underperformingContent: ContentEffectiveness[];

  // Gaps identified
  knowledgeGaps: KnowledgeGap[];

  // Recommendations
  recommendations: Array<{
    type: "add_content" | "improve_content" | "add_examples" | "simplify" | "add_exercises";
    priority: "high" | "medium" | "low";
    target: string;
    reason: string;
    suggestedAction: string;
  }>;
}

export interface FeedbackLoopConfig {
  convex: ConvexHttpClient;
  openrouterApiKey: string;
  knowledgeBaseId: Id<"knowledgeBases">;
}

export class FeedbackLoop {
  private config: FeedbackLoopConfig;
  private usageBuffer: KnowledgeUsageEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: FeedbackLoopConfig) {
    this.config = config;
  }

  /**
   * Start the feedback loop - begins collecting and processing usage data
   */
  start(flushIntervalMs: number = 30000): void {
    console.log("[FeedbackLoop] Starting feedback collection");

    // Periodically flush buffered events
    this.flushInterval = setInterval(() => {
      this.flushUsageBuffer();
    }, flushIntervalMs);
  }

  /**
   * Stop the feedback loop
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushUsageBuffer(); // Final flush
    console.log("[FeedbackLoop] Stopped feedback collection");
  }

  /**
   * Record a knowledge usage event from the avatar
   */
  recordUsage(event: Omit<KnowledgeUsageEvent, "timestamp">): void {
    this.usageBuffer.push({
      ...event,
      timestamp: Date.now(),
    });

    // Immediate flush if buffer is large
    if (this.usageBuffer.length >= 50) {
      this.flushUsageBuffer();
    }
  }

  /**
   * Record when avatar couldn't find relevant content (gap detection)
   */
  recordGap(query: string, queryType: string, context: {
    sessionId: string;
    lessonTopic?: string;
    studentLevel?: string;
  }): void {
    this.recordUsage({
      type: "gap",
      sessionId: context.sessionId,
      query,
      queryType: queryType as KnowledgeUsageEvent["queryType"],
      found: false,
      usedInResponse: false,
      lessonTopic: context.lessonTopic,
      studentLevel: context.studentLevel,
    });
  }

  /**
   * Record student feedback on avatar response
   */
  recordStudentFeedback(
    contentId: string,
    sessionId: string,
    feedback: {
      helpful: boolean;
      askedFollowUp: boolean;
      confusionIndicators?: string[];
    }
  ): void {
    this.recordUsage({
      type: "retrieval",
      sessionId,
      query: "",
      queryType: "general",
      found: true,
      contentId,
      usedInResponse: true,
      studentFoundHelpful: feedback.helpful,
      studentAskedFollowUp: feedback.askedFollowUp,
    });
  }

  /**
   * Flush buffered usage events to storage
   */
  private async flushUsageBuffer(): Promise<void> {
    if (this.usageBuffer.length === 0) return;

    const events = [...this.usageBuffer];
    this.usageBuffer = [];

    try {
      // Store events in Convex
      await this.config.convex.mutation(api.knowledgeFeedback.recordUsageEvents, {
        knowledgeBaseId: this.config.knowledgeBaseId,
        events: events.map((e) => ({
          ...e,
          contentId: e.contentId as Id<"knowledgeContent"> | undefined,
        })),
      });

      console.log(`[FeedbackLoop] Flushed ${events.length} usage events`);
    } catch (error) {
      console.error("[FeedbackLoop] Failed to flush events:", error);
      // Put events back in buffer for retry
      this.usageBuffer.unshift(...events);
    }
  }

  /**
   * Generate a feedback summary with recommendations
   */
  async generateSummary(periodDays: number = 7): Promise<FeedbackSummary> {
    console.log(`[FeedbackLoop] Generating feedback summary for last ${periodDays} days`);

    const periodEnd = Date.now();
    const periodStart = periodEnd - periodDays * 24 * 60 * 60 * 1000;

    // Fetch usage data from Convex
    const usageData = await this.config.convex.query(api.knowledgeFeedback.getUsageStats, {
      knowledgeBaseId: this.config.knowledgeBaseId,
      startTime: periodStart,
      endTime: periodEnd,
    });

    // Calculate content effectiveness
    const contentEffectiveness = this.calculateContentEffectiveness(usageData.events);

    // Identify knowledge gaps
    const knowledgeGaps = this.identifyKnowledgeGaps(usageData.events);

    // Generate AI-powered recommendations
    const recommendations = await this.generateRecommendations(
      contentEffectiveness,
      knowledgeGaps,
      usageData
    );

    return {
      knowledgeBaseId: this.config.knowledgeBaseId.toString(),
      periodStart,
      periodEnd,
      totalLookups: usageData.totalLookups,
      successRate: usageData.successRate,
      averageLookupTime: usageData.avgLookupTime,
      avgHelpfulness: usageData.avgHelpfulness,
      topPerformingContent: contentEffectiveness
        .filter((c) => c.effectivenessScore >= 80)
        .slice(0, 10),
      underperformingContent: contentEffectiveness
        .filter((c) => c.needsImprovement)
        .slice(0, 10),
      knowledgeGaps,
      recommendations,
    };
  }

  /**
   * Calculate effectiveness metrics for each content piece
   */
  private calculateContentEffectiveness(
    events: KnowledgeUsageEvent[]
  ): ContentEffectiveness[] {
    const contentMap = new Map<string, {
      events: KnowledgeUsageEvent[];
      title: string;
    }>();

    // Group events by content
    for (const event of events) {
      if (event.contentId) {
        if (!contentMap.has(event.contentId)) {
          contentMap.set(event.contentId, {
            events: [],
            title: event.contentTitle || "Unknown",
          });
        }
        contentMap.get(event.contentId)!.events.push(event);
      }
    }

    // Calculate metrics for each content
    const effectiveness: ContentEffectiveness[] = [];

    for (const [contentId, data] of Array.from(contentMap.entries())) {
      const { events: contentEvents, title } = data;

      const lookupCount = contentEvents.length;
      const successfulLookups = contentEvents.filter((e: KnowledgeUsageEvent) => e.found).length;
      const failedLookups = lookupCount - successfulLookups;

      const lookupTimes = contentEvents
        .filter((e: KnowledgeUsageEvent) => e.rlmLookupTime)
        .map((e: KnowledgeUsageEvent) => e.rlmLookupTime!);
      const averageLookupTime =
        lookupTimes.length > 0
          ? lookupTimes.reduce((a: number, b: number) => a + b, 0) / lookupTimes.length
          : 0;

      const usedInResponseCount = contentEvents.filter((e: KnowledgeUsageEvent) => e.usedInResponse).length;
      const helpfulCount = contentEvents.filter((e: KnowledgeUsageEvent) => e.studentFoundHelpful).length;
      const confusingCount = contentEvents.filter(
        (e: KnowledgeUsageEvent) => e.studentFoundHelpful === false
      ).length;
      const followUpCount = contentEvents.filter((e: KnowledgeUsageEvent) => e.studentAskedFollowUp).length;

      const followUpRate = usedInResponseCount > 0 ? followUpCount / usedInResponseCount : 0;

      // Calculate effectiveness score
      const successWeight = 0.3;
      const helpfulWeight = 0.4;
      const followUpWeight = 0.2; // Lower follow-up is better
      const speedWeight = 0.1;

      const successScore = successfulLookups / lookupCount;
      const helpfulScore = usedInResponseCount > 0 ? helpfulCount / usedInResponseCount : 0.5;
      const followUpScore = 1 - followUpRate; // Invert: less follow-up = better
      const speedScore = averageLookupTime < 10 ? 1 : averageLookupTime < 50 ? 0.8 : 0.5;

      const effectivenessScore = Math.round(
        (successScore * successWeight +
          helpfulScore * helpfulWeight +
          followUpScore * followUpWeight +
          speedScore * speedWeight) *
          100
      );

      // Determine if improvement needed
      const improvementReasons: string[] = [];
      if (successScore < 0.7) improvementReasons.push("Low lookup success rate");
      if (helpfulScore < 0.6) improvementReasons.push("Students not finding content helpful");
      if (followUpRate > 0.5) improvementReasons.push("High follow-up question rate");
      if (averageLookupTime > 50) improvementReasons.push("Slow RLM lookup times");

      effectiveness.push({
        contentId,
        title,
        knowledgeBaseId: this.config.knowledgeBaseId.toString(),
        lookupCount,
        successfulLookups,
        failedLookups,
        averageLookupTime,
        usedInResponseCount,
        helpfulCount,
        confusingCount,
        followUpRate,
        effectivenessScore,
        needsImprovement: improvementReasons.length > 0,
        improvementReasons,
      });
    }

    return effectiveness.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
  }

  /**
   * Identify gaps in knowledge base coverage
   */
  private identifyKnowledgeGaps(events: KnowledgeUsageEvent[]): KnowledgeGap[] {
    const gapEvents = events.filter((e) => e.type === "gap" || !e.found);

    // Group by similar queries
    const gapMap = new Map<string, {
      queries: string[];
      occurrences: KnowledgeUsageEvent[];
    }>();

    for (const event of gapEvents) {
      const normalizedQuery = event.query.toLowerCase().trim();

      // Find similar existing gap or create new
      let matchedKey: string | null = null;
      for (const [key] of Array.from(gapMap.entries())) {
        if (this.querySimilarity(normalizedQuery, key) > 0.7) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        gapMap.get(matchedKey)!.queries.push(normalizedQuery);
        gapMap.get(matchedKey)!.occurrences.push(event);
      } else {
        gapMap.set(normalizedQuery, {
          queries: [normalizedQuery],
          occurrences: [event],
        });
      }
    }

    // Convert to KnowledgeGap objects
    const gaps: KnowledgeGap[] = [];
    let gapIndex = 0;

    for (const [key, data] of Array.from(gapMap.entries())) {
      const occurrences = data.occurrences;

      // Determine priority based on occurrence count
      let priority: "high" | "medium" | "low";
      if (occurrences.length >= 10) priority = "high";
      else if (occurrences.length >= 5) priority = "medium";
      else priority = "low";

      // Extract related topics
      const relatedTopics = Array.from(
        new Set(occurrences.map((e: KnowledgeUsageEvent) => e.lessonTopic).filter(Boolean) as string[])
      );

      gaps.push({
        id: `gap-${gapIndex++}`,
        query: key,
        queryType: occurrences[0].queryType,
        occurrenceCount: occurrences.length,
        firstSeen: Math.min(...occurrences.map((e: KnowledgeUsageEvent) => e.timestamp)),
        lastSeen: Math.max(...occurrences.map((e: KnowledgeUsageEvent) => e.timestamp)),
        relatedTopics,
        suggestedContent: `Content about: ${key}`,
        priority,
      });
    }

    return gaps.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    contentEffectiveness: ContentEffectiveness[],
    knowledgeGaps: KnowledgeGap[],
    usageData: { totalLookups: number; successRate: number }
  ): Promise<FeedbackSummary["recommendations"]> {
    const systemPrompt = `You are an educational content optimization expert.
Analyze knowledge base performance data and generate actionable recommendations.

For each recommendation:
- type: what kind of change (add_content, improve_content, add_examples, simplify, add_exercises)
- priority: high/medium/low
- target: specific content or topic
- reason: why this is needed
- suggestedAction: concrete steps to take`;

    const context = `
PERFORMANCE SUMMARY:
- Total lookups: ${usageData.totalLookups}
- Success rate: ${(usageData.successRate * 100).toFixed(1)}%

UNDERPERFORMING CONTENT:
${contentEffectiveness
  .filter((c) => c.needsImprovement)
  .slice(0, 5)
  .map((c) => `- ${c.title}: ${c.improvementReasons.join(", ")}`)
  .join("\n")}

KNOWLEDGE GAPS (queries with no results):
${knowledgeGaps
  .slice(0, 10)
  .map((g) => `- "${g.query}" (${g.occurrenceCount} times, ${g.priority} priority)`)
  .join("\n")}

Generate 5-10 prioritized recommendations as JSON array.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.openrouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: context },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) throw new Error("AI call failed");

      const data = await response.json();
      let jsonText = data.choices?.[0]?.message?.content || "[]";

      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error("[FeedbackLoop] Failed to generate recommendations:", error);

      // Fallback recommendations based on data
      const recommendations: FeedbackSummary["recommendations"] = [];

      // Recommend fixing underperforming content
      for (const content of contentEffectiveness.filter((c) => c.needsImprovement).slice(0, 3)) {
        recommendations.push({
          type: "improve_content",
          priority: content.effectivenessScore < 50 ? "high" : "medium",
          target: content.title,
          reason: content.improvementReasons[0] || "Low effectiveness score",
          suggestedAction: `Review and improve "${content.title}"`,
        });
      }

      // Recommend adding content for gaps
      for (const gap of knowledgeGaps.filter((g) => g.priority === "high").slice(0, 3)) {
        recommendations.push({
          type: "add_content",
          priority: "high",
          target: gap.query,
          reason: `${gap.occurrenceCount} failed lookups for this topic`,
          suggestedAction: `Create content covering: ${gap.query}`,
        });
      }

      return recommendations;
    }
  }

  /**
   * Simple query similarity check (Jaccard similarity on words)
   */
  private querySimilarity(query1: string, query2: string): number {
    const words1 = new Set(query1.split(/\s+/));
    const words2 = new Set(query2.split(/\s+/));

    const words1Array = Array.from(words1);
    const words2Array = Array.from(words2);

    const intersection = new Set(words1Array.filter((x) => words2.has(x)));
    const union = new Set([...words1Array, ...words2Array]);

    return intersection.size / union.size;
  }

  /**
   * Apply feedback to improve future content generation
   * Returns config adjustments for the orchestrator
   */
  async getGenerationImprovements(): Promise<{
    priorityTopics: string[];
    avoidPatterns: string[];
    styleAdjustments: string[];
    exerciseGuidelines: string[];
  }> {
    const summary = await this.generateSummary(30); // Last 30 days

    return {
      // Topics that need more content
      priorityTopics: summary.knowledgeGaps
        .filter((g) => g.priority === "high")
        .map((g) => g.query),

      // Patterns that confused students
      avoidPatterns: summary.underperformingContent
        .filter((c) => c.confusingCount > c.helpfulCount)
        .map((c) => `Avoid style used in: ${c.title}`),

      // Style adjustments based on what worked
      styleAdjustments: summary.topPerformingContent.slice(0, 3).map(
        (c) => `Emulate style of: ${c.title} (${c.effectivenessScore}% effective)`
      ),

      // Exercise guidelines from follow-up patterns
      exerciseGuidelines: summary.underperformingContent
        .filter((c) => c.followUpRate > 0.5)
        .map((c) => `Add more practice for: ${c.title}`),
    };
  }
}

/**
 * Create and start a feedback loop for a knowledge base
 */
export function createFeedbackLoop(
  convex: ConvexHttpClient,
  knowledgeBaseId: Id<"knowledgeBases">,
  openrouterApiKey: string
): FeedbackLoop {
  const loop = new FeedbackLoop({
    convex,
    openrouterApiKey,
    knowledgeBaseId,
  });

  return loop;
}
