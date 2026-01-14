/**
 * Source Verification Agent
 *
 * Expert at cross-referencing facts across multiple sources to ensure accuracy.
 * Validates claims, identifies conflicts, and calculates confidence scores.
 */

import { ResearchResult } from "./research-agent";

export interface VerifiedResearch extends ResearchResult {
  verification: {
    overallConfidence: number; // 0-1
    verifiedAt: number;

    // Facts with verification status
    verifiedFacts: Array<{
      fact: string;
      confidence: number; // 0-1
      supportingSources: string[];
      conflictingSources: string[];
      consensusLevel: "unanimous" | "majority" | "mixed" | "controversial";
      notes?: string;
    }>;

    // Cross-referenced definitions
    verifiedDefinitions: Array<{
      term: string;
      definition: string;
      alternativeDefinitions: string[];
      confidence: number;
      sourceCount: number;
    }>;

    // Conflicting information found
    conflicts: Array<{
      topic: string;
      claim1: { text: string; source: string };
      claim2: { text: string; source: string };
      resolution?: string;
      recommendedClaim?: string;
    }>;

    // Source quality assessment
    sourceQuality: Array<{
      source: string;
      domain: string;
      reliability: "authoritative" | "reliable" | "moderate" | "questionable";
      reasons: string[];
    }>;

    // Recommendations
    factsToInclude: string[];      // High confidence, should use
    factsToExclude: string[];      // Low confidence or conflicting
    factsNeedingCitation: string[]; // Include but cite source
  };
}

export interface SourceVerificationConfig {
  openrouterApiKey: string;
  minConfidenceThreshold: number; // 0-1, facts below this are flagged
  requireMultipleSources: boolean; // If true, single-source facts are flagged
}

// Known authoritative domains for different topics
const AUTHORITATIVE_DOMAINS: Record<string, string[]> = {
  english: [
    "cambridge.org",
    "oxfordlearnersdictionaries.com",
    "britishcouncil.org",
    "merriam-webster.com",
    "bbc.co.uk",
  ],
  german: [
    "duden.de",
    "goethe.de",
    "dwds.de",
    "leo.org",
  ],
  grammar: [
    "grammarly.com",
    "perfect-english-grammar.com",
    "englishgrammar.org",
  ],
  general: [
    "wikipedia.org",
    "britannica.com",
    "edu", // .edu domains
  ],
};

export class SourceVerificationAgent {
  private config: SourceVerificationConfig;

  constructor(config: SourceVerificationConfig) {
    this.config = config;
  }

  /**
   * Verify research by cross-referencing sources
   */
  async verify(research: ResearchResult, topic: string): Promise<VerifiedResearch> {
    console.log(`[SourceVerificationAgent] Verifying research for: ${research.subtopic}`);
    console.log(`[SourceVerificationAgent] Analyzing ${research.sources.length} sources, ${research.keyFacts.length} facts`);

    // Step 1: Assess source quality
    const sourceQuality = this.assessSourceQuality(research.sources, topic);
    console.log(`[SourceVerificationAgent] Source quality assessed`);

    // Step 2: Cross-reference facts across sources
    const verifiedFacts = await this.crossReferenceFacts(research, sourceQuality);
    console.log(`[SourceVerificationAgent] Verified ${verifiedFacts.length} facts`);

    // Step 3: Verify definitions across sources
    const verifiedDefinitions = await this.verifyDefinitions(research, sourceQuality);
    console.log(`[SourceVerificationAgent] Verified ${verifiedDefinitions.length} definitions`);

    // Step 4: Identify conflicts
    const conflicts = await this.identifyConflicts(research, verifiedFacts);
    console.log(`[SourceVerificationAgent] Found ${conflicts.length} conflicts`);

    // Step 5: Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(verifiedFacts, sourceQuality);

    // Step 6: Generate recommendations
    const { factsToInclude, factsToExclude, factsNeedingCitation } = this.generateRecommendations(
      verifiedFacts,
      conflicts
    );

    const verification = {
      overallConfidence,
      verifiedAt: Date.now(),
      verifiedFacts,
      verifiedDefinitions,
      conflicts,
      sourceQuality,
      factsToInclude,
      factsToExclude,
      factsNeedingCitation,
    };

    console.log(`[SourceVerificationAgent] Verification complete. Confidence: ${(overallConfidence * 100).toFixed(1)}%`);

    return {
      ...research,
      verification,
    };
  }

  /**
   * Assess the quality/reliability of each source
   */
  private assessSourceQuality(
    sources: ResearchResult["sources"],
    topic: string
  ): VerifiedResearch["verification"]["sourceQuality"] {
    const topicCategory = this.detectTopicCategory(topic);
    const authoritativeDomains = [
      ...(AUTHORITATIVE_DOMAINS[topicCategory] || []),
      ...AUTHORITATIVE_DOMAINS.general,
    ];

    return sources.map((source) => {
      const domain = source.domain.toLowerCase();
      const reasons: string[] = [];
      let reliability: "authoritative" | "reliable" | "moderate" | "questionable";

      // Check if authoritative domain
      const isAuthoritative = authoritativeDomains.some(
        (auth) => domain.includes(auth) || domain.endsWith(".edu")
      );

      if (isAuthoritative) {
        reliability = "authoritative";
        reasons.push("Recognized authoritative source for this topic");
      } else if (domain.endsWith(".edu") || domain.endsWith(".gov")) {
        reliability = "authoritative";
        reasons.push("Educational or government institution");
      } else if (
        domain.includes("university") ||
        domain.includes("college") ||
        domain.includes("institute")
      ) {
        reliability = "reliable";
        reasons.push("Academic institution");
      } else if (source.relevanceScore && source.relevanceScore > 0.8) {
        reliability = "reliable";
        reasons.push("High relevance score from search");
      } else if (source.content.length > 5000) {
        reliability = "moderate";
        reasons.push("Substantial content depth");
      } else {
        reliability = "moderate";
        reasons.push("General web source");
      }

      // Check for red flags
      if (domain.includes("blog") || domain.includes("forum")) {
        reliability = reliability === "authoritative" ? "reliable" : "moderate";
        reasons.push("User-generated content platform");
      }

      return {
        source: source.title,
        domain: source.domain,
        reliability,
        reasons,
      };
    });
  }

  /**
   * Cross-reference facts across multiple sources
   */
  private async crossReferenceFacts(
    research: ResearchResult,
    sourceQuality: VerifiedResearch["verification"]["sourceQuality"]
  ): Promise<VerifiedResearch["verification"]["verifiedFacts"]> {
    const systemPrompt = `You are a fact verification expert. Cross-reference facts against source materials.

For each fact:
1. Check which sources support it
2. Check if any sources contradict it
3. Assign a confidence score (0-1) based on:
   - Number of supporting sources
   - Quality/authority of sources
   - Absence of contradictions

Source quality ratings:
${sourceQuality.map((s) => `- ${s.source}: ${s.reliability}`).join("\n")}

Output JSON array:
[
  {
    "fact": "the fact being verified",
    "confidence": 0.0-1.0,
    "supportingSources": ["Source 1", "Source 2"],
    "conflictingSources": [],
    "consensusLevel": "unanimous|majority|mixed|controversial",
    "notes": "optional clarification"
  }
]`;

    const context = `
FACTS TO VERIFY:
${research.keyFacts.map((f, i) => `${i + 1}. ${f}`).join("\n")}

SOURCE CONTENT SUMMARIES:
${research.sources.map((s) => `[${s.title}]: ${s.content.slice(0, 1500)}`).join("\n\n")}
`;

    const response = await this.callAI(systemPrompt, context, 6000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      // Fallback: assign moderate confidence to all facts
      return research.keyFacts.map((fact) => ({
        fact,
        confidence: 0.7,
        supportingSources: [research.sources[0]?.title || "Unknown"],
        conflictingSources: [],
        consensusLevel: "majority" as const,
      }));
    }
  }

  /**
   * Verify definitions by comparing across sources
   */
  private async verifyDefinitions(
    research: ResearchResult,
    sourceQuality: VerifiedResearch["verification"]["sourceQuality"]
  ): Promise<VerifiedResearch["verification"]["verifiedDefinitions"]> {
    if (research.definitions.length === 0) {
      return [];
    }

    const systemPrompt = `You are a terminology expert. Verify definitions by comparing across sources.

For each term:
1. Find the most accurate/comprehensive definition
2. Note any alternative definitions
3. Assign confidence based on source agreement

Source quality:
${sourceQuality.map((s) => `- ${s.source}: ${s.reliability}`).join("\n")}

Output JSON array:
[
  {
    "term": "the term",
    "definition": "best definition",
    "alternativeDefinitions": ["alt def 1"],
    "confidence": 0.0-1.0,
    "sourceCount": 3
  }
]`;

    const context = `
DEFINITIONS TO VERIFY:
${research.definitions.map((d) => `${d.term}: ${d.definition} (from ${d.source})`).join("\n")}

SOURCE CONTENT FOR REFERENCE:
${research.sources.slice(0, 3).map((s) => `[${s.title}]: ${s.content.slice(0, 2000)}`).join("\n\n")}
`;

    const response = await this.callAI(systemPrompt, context, 4000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return research.definitions.map((d) => ({
        term: d.term,
        definition: d.definition,
        alternativeDefinitions: [],
        confidence: 0.75,
        sourceCount: 1,
      }));
    }
  }

  /**
   * Identify conflicting information between sources
   */
  private async identifyConflicts(
    research: ResearchResult,
    verifiedFacts: VerifiedResearch["verification"]["verifiedFacts"]
  ): Promise<VerifiedResearch["verification"]["conflicts"]> {
    // Find facts with conflicting sources
    const conflictingFacts = verifiedFacts.filter(
      (f) => f.conflictingSources.length > 0 || f.consensusLevel === "controversial"
    );

    if (conflictingFacts.length === 0) {
      return [];
    }

    const systemPrompt = `You are a conflict resolution expert. Analyze conflicting claims and recommend resolutions.

For each conflict:
1. Identify the specific disagreement
2. Compare the authority of sources
3. Recommend which claim to use (or how to present both)

Output JSON array:
[
  {
    "topic": "what the conflict is about",
    "claim1": {"text": "first claim", "source": "source name"},
    "claim2": {"text": "second claim", "source": "source name"},
    "resolution": "how to resolve",
    "recommendedClaim": "which to use"
  }
]`;

    const context = `
CONFLICTING FACTS:
${conflictingFacts.map((f) => `Fact: ${f.fact}\nSupporting: ${f.supportingSources.join(", ")}\nConflicting: ${f.conflictingSources.join(", ")}`).join("\n\n")}
`;

    const response = await this.callAI(systemPrompt, context, 3000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return [];
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    verifiedFacts: VerifiedResearch["verification"]["verifiedFacts"],
    sourceQuality: VerifiedResearch["verification"]["sourceQuality"]
  ): number {
    if (verifiedFacts.length === 0) return 0.5;

    // Average fact confidence
    const avgFactConfidence =
      verifiedFacts.reduce((sum, f) => sum + f.confidence, 0) / verifiedFacts.length;

    // Source quality score
    const qualityScores = {
      authoritative: 1.0,
      reliable: 0.8,
      moderate: 0.6,
      questionable: 0.3,
    };
    const avgSourceQuality =
      sourceQuality.reduce((sum, s) => sum + qualityScores[s.reliability], 0) /
      sourceQuality.length;

    // Consensus score (fewer conflicts = higher)
    const controversialCount = verifiedFacts.filter(
      (f) => f.consensusLevel === "controversial" || f.consensusLevel === "mixed"
    ).length;
    const consensusScore = 1 - controversialCount / verifiedFacts.length;

    // Weighted combination
    return avgFactConfidence * 0.5 + avgSourceQuality * 0.3 + consensusScore * 0.2;
  }

  /**
   * Generate recommendations for content creation
   */
  private generateRecommendations(
    verifiedFacts: VerifiedResearch["verification"]["verifiedFacts"],
    conflicts: VerifiedResearch["verification"]["conflicts"]
  ): {
    factsToInclude: string[];
    factsToExclude: string[];
    factsNeedingCitation: string[];
  } {
    const factsToInclude: string[] = [];
    const factsToExclude: string[] = [];
    const factsNeedingCitation: string[] = [];

    for (const fact of verifiedFacts) {
      if (fact.confidence >= 0.8 && fact.consensusLevel === "unanimous") {
        factsToInclude.push(fact.fact);
      } else if (fact.confidence < this.config.minConfidenceThreshold) {
        factsToExclude.push(fact.fact);
      } else if (fact.consensusLevel === "controversial") {
        factsToExclude.push(fact.fact);
      } else if (
        this.config.requireMultipleSources &&
        fact.supportingSources.length < 2
      ) {
        factsNeedingCitation.push(fact.fact);
      } else if (fact.confidence >= 0.6) {
        factsToInclude.push(fact.fact);
      } else {
        factsNeedingCitation.push(fact.fact);
      }
    }

    // Add conflict resolutions to appropriate lists
    for (const conflict of conflicts) {
      if (conflict.recommendedClaim) {
        factsNeedingCitation.push(
          `${conflict.topic}: ${conflict.recommendedClaim} (note: conflicting sources exist)`
        );
      }
    }

    return { factsToInclude, factsToExclude, factsNeedingCitation };
  }

  /**
   * Detect the topic category for source quality assessment
   */
  private detectTopicCategory(topic: string): string {
    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes("english") || lowerTopic.includes("grammar")) {
      return "english";
    }
    if (lowerTopic.includes("german") || lowerTopic.includes("deutsch")) {
      return "german";
    }
    if (
      lowerTopic.includes("tense") ||
      lowerTopic.includes("verb") ||
      lowerTopic.includes("article")
    ) {
      return "grammar";
    }

    return "general";
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
        temperature: 0.2,
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
