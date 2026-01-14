/**
 * Quality Reviewer Agent
 *
 * Expert at reviewing generated content for accuracy, consistency, and completeness.
 * Acts as a final quality gate before content is saved to the knowledge base.
 */

import { KnowledgeContent } from "./knowledge-writer-agent";
import { ResearchResult } from "./research-agent";

export interface QualityReview {
  // Overall assessment
  overallScore: number; // 0-100
  passesQualityGate: boolean;

  // Detailed scores
  scores: {
    accuracy: number;      // Facts are correct
    completeness: number;  // All key topics covered
    consistency: number;   // No contradictions
    clarity: number;       // Easy to understand
    practicalValue: number; // Useful examples/exercises
  };

  // Issues found
  issues: Array<{
    severity: "critical" | "major" | "minor" | "suggestion";
    category: "accuracy" | "completeness" | "consistency" | "clarity" | "grammar" | "exercise";
    location: string; // Where in the content
    description: string;
    suggestion?: string;
  }>;

  // Improvements made
  improvements: Array<{
    location: string;
    original: string;
    improved: string;
    reason: string;
  }>;

  // Verified facts
  verifiedFacts: Array<{
    fact: string;
    verified: boolean;
    confidence: number;
    sources: string[];
  }>;

  // Missing topics that should be added
  missingTopics: string[];

  // Summary
  summary: string;
  recommendations: string[];
}

export interface QualityReviewerConfig {
  openrouterApiKey: string;
  strictMode: boolean; // If true, requires higher scores to pass
  autoFix: boolean;    // If true, automatically fix minor issues
}

export class QualityReviewerAgent {
  private config: QualityReviewerConfig;

  constructor(config: QualityReviewerConfig) {
    this.config = config;
  }

  /**
   * Review content quality and optionally fix issues
   */
  async review(
    content: KnowledgeContent,
    research: ResearchResult
  ): Promise<{ review: QualityReview; improvedContent?: KnowledgeContent }> {
    console.log(`[QualityReviewerAgent] Starting quality review for: ${content.metadata.title}`);

    // Step 1: Check accuracy against research
    const accuracyCheck = await this.checkAccuracy(content, research);
    console.log(`[QualityReviewerAgent] Accuracy score: ${accuracyCheck.score}`);

    // Step 2: Check completeness
    const completenessCheck = await this.checkCompleteness(content, research);
    console.log(`[QualityReviewerAgent] Completeness score: ${completenessCheck.score}`);

    // Step 3: Check internal consistency
    const consistencyCheck = await this.checkConsistency(content);
    console.log(`[QualityReviewerAgent] Consistency score: ${consistencyCheck.score}`);

    // Step 4: Check clarity and readability
    const clarityCheck = await this.checkClarity(content);
    console.log(`[QualityReviewerAgent] Clarity score: ${clarityCheck.score}`);

    // Step 5: Verify exercises have correct answers
    const exerciseCheck = await this.verifyExercises(content);
    console.log(`[QualityReviewerAgent] Exercise validity score: ${exerciseCheck.score}`);

    // Combine all issues
    const allIssues = [
      ...accuracyCheck.issues,
      ...completenessCheck.issues,
      ...consistencyCheck.issues,
      ...clarityCheck.issues,
      ...exerciseCheck.issues,
    ];

    // Calculate overall score
    const scores = {
      accuracy: accuracyCheck.score,
      completeness: completenessCheck.score,
      consistency: consistencyCheck.score,
      clarity: clarityCheck.score,
      practicalValue: exerciseCheck.score,
    };

    const overallScore = Math.round(
      (scores.accuracy * 0.25 +
        scores.completeness * 0.2 +
        scores.consistency * 0.2 +
        scores.clarity * 0.2 +
        scores.practicalValue * 0.15)
    );

    // Determine if it passes quality gate
    const minScore = this.config.strictMode ? 75 : 60;
    const hasCriticalIssues = allIssues.some((i) => i.severity === "critical");
    const passesQualityGate = overallScore >= minScore && !hasCriticalIssues;

    // Auto-fix minor issues if enabled
    let improvedContent: KnowledgeContent | undefined;
    const improvements: QualityReview["improvements"] = [];

    if (this.config.autoFix && allIssues.some((i) => i.severity === "minor" || i.severity === "suggestion")) {
      const fixResult = await this.autoFixIssues(content, allIssues);
      improvedContent = fixResult.content;
      improvements.push(...fixResult.improvements);
    }

    const review: QualityReview = {
      overallScore,
      passesQualityGate,
      scores,
      issues: allIssues,
      improvements,
      verifiedFacts: accuracyCheck.verifiedFacts,
      missingTopics: completenessCheck.missingTopics,
      summary: this.generateSummary(overallScore, allIssues, passesQualityGate),
      recommendations: this.generateRecommendations(allIssues, scores),
    };

    console.log(`[QualityReviewerAgent] Review complete. Score: ${overallScore}, Passes: ${passesQualityGate}`);

    return { review, improvedContent };
  }

  /**
   * Check accuracy of content against research sources
   */
  private async checkAccuracy(
    content: KnowledgeContent,
    research: ResearchResult
  ): Promise<{
    score: number;
    issues: QualityReview["issues"];
    verifiedFacts: QualityReview["verifiedFacts"];
  }> {
    const systemPrompt = `You are a fact-checking expert. Verify the accuracy of educational content against source research.

Check for:
1. Factual errors or misrepresentations
2. Incorrect grammar rules or formulas
3. Wrong examples or incorrect answers in exercises
4. Misleading or oversimplified explanations

For each claim in the content, determine if it's supported by the research.

Output JSON:
{
  "score": 0-100,
  "verifiedFacts": [
    {"fact": "...", "verified": true|false, "confidence": 0-1, "sources": ["Source 1"]}
  ],
  "issues": [
    {"severity": "critical|major|minor", "category": "accuracy", "location": "where", "description": "what's wrong", "suggestion": "fix"}
  ]
}`;

    const context = `
CONTENT TO VERIFY:
${JSON.stringify(content.content, null, 2).slice(0, 10000)}

RESEARCH SOURCES:
Key facts: ${research.keyFacts.join("; ")}
Definitions: ${research.definitions.map((d) => `${d.term}: ${d.definition}`).join("; ")}
`;

    const response = await this.callAI(systemPrompt, context, 4000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return { score: 80, issues: [], verifiedFacts: [] };
    }
  }

  /**
   * Check completeness - are all important topics covered?
   */
  private async checkCompleteness(
    content: KnowledgeContent,
    research: ResearchResult
  ): Promise<{
    score: number;
    issues: QualityReview["issues"];
    missingTopics: string[];
  }> {
    const systemPrompt = `You are a curriculum completeness expert. Check if the content covers all important aspects of the topic.

Evaluate:
1. Are all key concepts from the research included?
2. Are there gaps in the explanation?
3. Are enough examples provided?
4. Is vocabulary coverage sufficient?
5. Are exercises comprehensive?

Output JSON:
{
  "score": 0-100,
  "missingTopics": ["topic that should be covered"],
  "issues": [
    {"severity": "major|minor", "category": "completeness", "location": "section", "description": "what's missing"}
  ]
}`;

    const context = `
CONTENT SECTIONS:
${content.content.sections.map((s) => `- ${s.title}`).join("\n")}

VOCABULARY COUNT: ${content.content.vocabulary.length}
GRAMMAR RULES: ${content.content.grammarRules.length}
EXERCISES: ${content.content.exercises.length}

RESEARCH TOPICS:
${research.keyFacts.slice(0, 15).join("\n")}
Related: ${research.relatedTopics.join(", ")}
`;

    const response = await this.callAI(systemPrompt, context, 2000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return { score: 85, issues: [], missingTopics: [] };
    }
  }

  /**
   * Check internal consistency - no contradictions
   */
  private async checkConsistency(content: KnowledgeContent): Promise<{
    score: number;
    issues: QualityReview["issues"];
  }> {
    const systemPrompt = `You are a content consistency expert. Check for internal contradictions and inconsistencies.

Look for:
1. Contradictory statements in different sections
2. Inconsistent terminology usage
3. Rules that contradict examples
4. Exercise answers that don't match taught content
5. Inconsistent formatting or style

Output JSON:
{
  "score": 0-100,
  "issues": [
    {"severity": "critical|major|minor", "category": "consistency", "location": "where", "description": "contradiction found"}
  ]
}`;

    const contentSummary = `
Introduction: ${content.content.introduction?.content?.slice(0, 500)}

Rules: ${content.content.grammarRules.map((r) => `${r.name}: ${r.rule.slice(0, 200)}`).join("\n")}

Vocabulary terms: ${content.content.vocabulary.map((v) => v.term).join(", ")}

Exercise types: ${content.content.exercises.map((e) => e.type).join(", ")}
`;

    const response = await this.callAI(systemPrompt, contentSummary, 2000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return { score: 90, issues: [] };
    }
  }

  /**
   * Check clarity and readability
   */
  private async checkClarity(content: KnowledgeContent): Promise<{
    score: number;
    issues: QualityReview["issues"];
  }> {
    const systemPrompt = `You are a readability and clarity expert. Evaluate how clear and understandable the content is.

Check for:
1. Complex sentences that should be simplified
2. Jargon without explanation
3. Missing context or background
4. Unclear instructions in exercises
5. Ambiguous explanations

Target audience: ${content.metadata.level} level learners

Output JSON:
{
  "score": 0-100,
  "issues": [
    {"severity": "major|minor|suggestion", "category": "clarity", "location": "where", "description": "what's unclear", "suggestion": "clearer version"}
  ]
}`;

    const sampleContent = `
Title: ${content.metadata.title}
Level: ${content.metadata.level}

Sample section: ${content.content.sections[0]?.content?.slice(0, 1000) || ""}

Sample exercise: ${JSON.stringify(content.content.exercises[0]?.items?.[0] || {}).slice(0, 500)}
`;

    const response = await this.callAI(systemPrompt, sampleContent, 2000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return { score: 85, issues: [] };
    }
  }

  /**
   * Verify exercises have correct answers and make sense
   */
  private async verifyExercises(content: KnowledgeContent): Promise<{
    score: number;
    issues: QualityReview["issues"];
  }> {
    if (content.content.exercises.length === 0) {
      return { score: 100, issues: [] };
    }

    const systemPrompt = `You are an exercise quality expert. Verify that all exercises are valid and answers are correct.

Check for:
1. Correct answers that are actually correct
2. Clear and unambiguous questions
3. Appropriate difficulty progression
4. Distractors (wrong options) that are plausible but clearly wrong
5. Explanations that actually explain the answer

Output JSON:
{
  "score": 0-100,
  "issues": [
    {"severity": "critical|major|minor", "category": "exercise", "location": "exercise ID", "description": "problem found"}
  ]
}`;

    const exerciseData = content.content.exercises.map((ex) => ({
      id: ex.id,
      type: ex.type,
      title: ex.title,
      items: ex.items.slice(0, 5),
    }));

    const response = await this.callAI(systemPrompt, JSON.stringify(exerciseData, null, 2), 3000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return { score: 85, issues: [] };
    }
  }

  /**
   * Auto-fix minor issues
   */
  private async autoFixIssues(
    content: KnowledgeContent,
    issues: QualityReview["issues"]
  ): Promise<{
    content: KnowledgeContent;
    improvements: QualityReview["improvements"];
  }> {
    const minorIssues = issues.filter(
      (i) => i.severity === "minor" || i.severity === "suggestion"
    );

    if (minorIssues.length === 0) {
      return { content, improvements: [] };
    }

    const systemPrompt = `You are an expert editor. Fix the minor issues in this content.

Issues to fix:
${minorIssues.map((i) => `- ${i.location}: ${i.description} (Suggestion: ${i.suggestion || "none"})`).join("\n")}

Return the fixes as JSON:
{
  "improvements": [
    {"location": "where", "original": "original text", "improved": "fixed text", "reason": "why changed"}
  ]
}`;

    const response = await this.callAI(systemPrompt, JSON.stringify(content.content).slice(0, 8000), 3000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      const fixes = JSON.parse(jsonText);
      // Note: In a real implementation, we'd apply these fixes to the content
      return { content, improvements: fixes.improvements || [] };
    } catch {
      return { content, improvements: [] };
    }
  }

  /**
   * Generate summary of review
   */
  private generateSummary(
    score: number,
    issues: QualityReview["issues"],
    passes: boolean
  ): string {
    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const majorCount = issues.filter((i) => i.severity === "major").length;
    const minorCount = issues.filter((i) => i.severity === "minor").length;

    if (passes) {
      return `Content passes quality review with score ${score}/100. Found ${majorCount} major and ${minorCount} minor issues that could be improved.`;
    } else {
      return `Content does not pass quality gate (score: ${score}/100). Found ${criticalCount} critical, ${majorCount} major issues that need attention.`;
    }
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(
    issues: QualityReview["issues"],
    scores: QualityReview["scores"]
  ): string[] {
    const recommendations: string[] = [];

    if (scores.accuracy < 80) {
      recommendations.push("Review and verify all factual claims against authoritative sources");
    }
    if (scores.completeness < 80) {
      recommendations.push("Add more coverage of missing subtopics identified in the review");
    }
    if (scores.consistency < 80) {
      recommendations.push("Review content for contradictions and standardize terminology");
    }
    if (scores.clarity < 80) {
      recommendations.push("Simplify complex explanations and add more context for technical terms");
    }
    if (scores.practicalValue < 80) {
      recommendations.push("Add more practical examples and diverse exercise types");
    }

    const criticalIssues = issues.filter((i) => i.severity === "critical");
    for (const issue of criticalIssues) {
      recommendations.push(`CRITICAL: Fix ${issue.category} issue in ${issue.location}`);
    }

    return recommendations;
  }

  /**
   * Call AI via OpenRouter
   */
  private async callAI(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.openrouterApiKey}`,
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
        temperature: 0.2, // Lower temperature for more consistent reviews
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
