/**
 * Organization Agent
 *
 * Expert at structuring and organizing raw research into a coherent outline.
 * Identifies patterns, groups related concepts, and creates a logical flow.
 */

import { ResearchResult } from "./research-agent";

export interface OrganizedContent {
  subtopic: string;
  mainTopic: string;

  // Structured outline
  outline: {
    title: string;
    titleDe?: string;
    level: string; // A1-C2 or "general"
    estimatedMinutes: number;
    objectives: Array<{
      id: string;
      objective: string;
      objectiveDe?: string;
    }>;
  };

  // Organized sections
  sections: Array<{
    id: string;
    type: "introduction" | "concept" | "grammar" | "vocabulary" | "practice" | "summary";
    title: string;
    titleDe?: string;
    purpose: string;
    keyPoints: string[];
    sourceRefs: string[]; // References to original sources
    suggestedExamples: string[];
    order: number;
  }>;

  // Vocabulary organized by difficulty
  vocabularyPlan: Array<{
    term: string;
    termDe?: string;
    difficulty: "basic" | "intermediate" | "advanced";
    category: string;
    mustInclude: boolean;
    sourceRef?: string;
  }>;

  // Grammar rules identified
  grammarPlan: Array<{
    ruleName: string;
    ruleNameDe?: string;
    category: string;
    complexity: number; // 1-5
    prerequisites: string[];
    relatedRules: string[];
    commonMistakePatterns: string[];
  }>;

  // Exercise plan
  exercisePlan: Array<{
    type: "fill_blank" | "multiple_choice" | "error_correction" | "matching" | "translation";
    targetSkill: string;
    difficulty: 1 | 2 | 3;
    count: number;
    focusArea: string;
  }>;

  // Connections to other topics
  connections: Array<{
    relatedTopic: string;
    relationship: "prerequisite" | "builds_on" | "related" | "advanced_extension";
    note: string;
  }>;

  // Quality metrics from research
  researchQuality: {
    sourceCount: number;
    factCount: number;
    exampleCount: number;
    coverage: "basic" | "good" | "comprehensive" | "excellent";
  };
}

export interface OrganizationAgentConfig {
  openrouterApiKey: string;
  targetLevel?: string;
  language: string;
  includeExercises: boolean;
}

export class OrganizationAgent {
  private config: OrganizationAgentConfig;

  constructor(config: OrganizationAgentConfig) {
    this.config = config;
  }

  /**
   * Organize research into structured content plan
   */
  async organize(research: ResearchResult, mainTopic: string): Promise<OrganizedContent> {
    console.log(`[OrganizationAgent] Organizing research for: ${research.subtopic}`);
    console.log(`[OrganizationAgent] Input: ${research.keyFacts.length} facts, ${research.definitions.length} definitions, ${research.examples.length} examples`);

    // Step 1: Analyze the research and create an outline
    const outline = await this.createOutline(research, mainTopic);
    console.log(`[OrganizationAgent] Created outline with ${outline.sections.length} sections`);

    // Step 2: Plan vocabulary
    const vocabularyPlan = await this.planVocabulary(research, mainTopic);
    console.log(`[OrganizationAgent] Planned ${vocabularyPlan.length} vocabulary items`);

    // Step 3: Plan grammar rules (if applicable)
    const grammarPlan = await this.planGrammar(research, mainTopic);
    console.log(`[OrganizationAgent] Planned ${grammarPlan.length} grammar rules`);

    // Step 4: Plan exercises
    const exercisePlan = this.config.includeExercises
      ? await this.planExercises(research, outline, mainTopic)
      : [];
    console.log(`[OrganizationAgent] Planned ${exercisePlan.length} exercise types`);

    // Step 5: Identify connections
    const connections = this.identifyConnections(research);

    // Calculate research quality
    const researchQuality = this.assessResearchQuality(research);

    return {
      subtopic: research.subtopic,
      mainTopic,
      outline: outline.outline,
      sections: outline.sections,
      vocabularyPlan,
      grammarPlan,
      exercisePlan,
      connections,
      researchQuality,
    };
  }

  /**
   * Create a structured outline from research
   */
  private async createOutline(
    research: ResearchResult,
    mainTopic: string
  ): Promise<{ outline: OrganizedContent["outline"]; sections: OrganizedContent["sections"] }> {
    const systemPrompt = `You are an expert curriculum designer and content architect.

Your task: Create a structured outline for educational content about "${research.subtopic}" (within ${mainTopic}).

Based on the research provided, design a logical flow that:
1. Introduces the concept clearly
2. Builds understanding progressively
3. Includes practical examples
4. Addresses common misconceptions
5. Ends with summary and key takeaways

Target audience: ${this.config.targetLevel || "general learners"}
Language: ${this.config.language === "multi" ? "Bilingual (English/German)" : this.config.language}

Output JSON:
{
  "outline": {
    "title": "Clear, descriptive title",
    "titleDe": "German title (if bilingual)",
    "level": "A1|A2|B1|B2|C1|C2|general",
    "estimatedMinutes": 15-45,
    "objectives": [
      {"id": "obj-1", "objective": "...", "objectiveDe": "..."}
    ]
  },
  "sections": [
    {
      "id": "sec-1",
      "type": "introduction|concept|grammar|vocabulary|practice|summary",
      "title": "Section title",
      "titleDe": "German title",
      "purpose": "What this section achieves",
      "keyPoints": ["point1", "point2"],
      "sourceRefs": ["Source 1", "Source 3"],
      "suggestedExamples": ["example from research"],
      "order": 1
    }
  ]
}`;

    const researchSummary = `
Key Facts: ${research.keyFacts.slice(0, 15).join("; ")}

Definitions Found: ${research.definitions.map((d) => d.term).join(", ")}

Examples Available: ${research.examples.length} examples

Related Topics: ${research.relatedTopics.join(", ")}
`;

    const response = await this.callAI(systemPrompt, researchSummary, 4000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      // Fallback structure
      return {
        outline: {
          title: research.subtopic,
          level: this.config.targetLevel || "B1",
          estimatedMinutes: 20,
          objectives: [{ id: "obj-1", objective: `Understand ${research.subtopic}` }],
        },
        sections: [
          {
            id: "sec-1",
            type: "introduction",
            title: "Introduction",
            purpose: "Introduce the topic",
            keyPoints: research.keyFacts.slice(0, 3),
            sourceRefs: [],
            suggestedExamples: [],
            order: 1,
          },
        ],
      };
    }
  }

  /**
   * Plan vocabulary items from research
   */
  private async planVocabulary(
    research: ResearchResult,
    mainTopic: string
  ): Promise<OrganizedContent["vocabularyPlan"]> {
    const systemPrompt = `You are a vocabulary specialist. Analyze research and identify key vocabulary.

For each term, determine:
- Difficulty level (basic/intermediate/advanced)
- Category (e.g., "grammar terminology", "business", "technical")
- Whether it's essential (mustInclude: true) or supplementary

Output JSON array:
[
  {
    "term": "word/phrase",
    "termDe": "German translation",
    "difficulty": "basic|intermediate|advanced",
    "category": "category name",
    "mustInclude": true|false,
    "sourceRef": "where this came from"
  }
]

Include 15-30 vocabulary items.`;

    const vocabContext = `
Topic: ${research.subtopic} (${mainTopic})
Definitions found: ${JSON.stringify(research.definitions.slice(0, 20))}
Key facts mentioning terms: ${research.keyFacts.slice(0, 10).join("; ")}
`;

    const response = await this.callAI(systemPrompt, vocabContext, 3000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      // Extract from definitions
      return research.definitions.map((d) => ({
        term: d.term,
        difficulty: "intermediate" as const,
        category: "general",
        mustInclude: true,
        sourceRef: d.source,
      }));
    }
  }

  /**
   * Plan grammar rules from research
   */
  private async planGrammar(
    research: ResearchResult,
    mainTopic: string
  ): Promise<OrganizedContent["grammarPlan"]> {
    // Check if this is language-related content
    const isLanguageContent =
      mainTopic.toLowerCase().includes("english") ||
      mainTopic.toLowerCase().includes("german") ||
      mainTopic.toLowerCase().includes("grammar") ||
      mainTopic.toLowerCase().includes("language");

    if (!isLanguageContent) {
      return []; // No grammar rules for non-language topics
    }

    const systemPrompt = `You are a grammar expert. Analyze research and identify grammar rules/patterns.

For each rule, determine:
- Complexity (1-5, where 1 is basic and 5 is advanced)
- Prerequisites (what learners should know first)
- Related rules
- Common mistake patterns to watch for

Output JSON array:
[
  {
    "ruleName": "Name of the rule",
    "ruleNameDe": "German name",
    "category": "tenses|articles|prepositions|word_order|etc",
    "complexity": 1-5,
    "prerequisites": ["rule1", "rule2"],
    "relatedRules": ["rule3"],
    "commonMistakePatterns": ["pattern1", "pattern2"]
  }
]`;

    const grammarContext = `
Topic: ${research.subtopic} (${mainTopic})
Key facts: ${research.keyFacts.slice(0, 15).join("; ")}
Examples: ${research.examples.slice(0, 10).map((e) => e.example).join("; ")}
`;

    const response = await this.callAI(systemPrompt, grammarContext, 3000);

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
   * Plan exercises based on content
   */
  private async planExercises(
    research: ResearchResult,
    outline: { outline: OrganizedContent["outline"]; sections: OrganizedContent["sections"] },
    mainTopic: string
  ): Promise<OrganizedContent["exercisePlan"]> {
    const systemPrompt = `You are an exercise design specialist. Plan a variety of exercises to reinforce learning.

Consider:
- Different exercise types for different skills
- Progressive difficulty
- Coverage of key concepts

Output JSON array:
[
  {
    "type": "fill_blank|multiple_choice|error_correction|matching|translation",
    "targetSkill": "what skill this tests",
    "difficulty": 1|2|3,
    "count": 3-8,
    "focusArea": "specific aspect to focus on"
  }
]

Plan 4-8 different exercise sets.`;

    const exerciseContext = `
Topic: ${research.subtopic} (${mainTopic})
Sections: ${outline.sections.map((s) => s.title).join(", ")}
Learning objectives: ${outline.outline.objectives.map((o) => o.objective).join("; ")}
`;

    const response = await this.callAI(systemPrompt, exerciseContext, 2000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return [
        { type: "fill_blank", targetSkill: "application", difficulty: 1, count: 5, focusArea: "basics" },
        { type: "multiple_choice", targetSkill: "recognition", difficulty: 2, count: 5, focusArea: "concepts" },
      ];
    }
  }

  /**
   * Identify connections to other topics
   */
  private identifyConnections(research: ResearchResult): OrganizedContent["connections"] {
    return research.relatedTopics.slice(0, 10).map((topic) => ({
      relatedTopic: topic,
      relationship: "related" as const,
      note: `Discovered during research on ${research.subtopic}`,
    }));
  }

  /**
   * Assess the quality of research
   */
  private assessResearchQuality(research: ResearchResult): OrganizedContent["researchQuality"] {
    const sourceCount = research.sources.length;
    const factCount = research.keyFacts.length;
    const exampleCount = research.examples.length;

    let coverage: "basic" | "good" | "comprehensive" | "excellent";
    const score = sourceCount * 2 + factCount + exampleCount;

    if (score < 15) coverage = "basic";
    else if (score < 30) coverage = "good";
    else if (score < 50) coverage = "comprehensive";
    else coverage = "excellent";

    return { sourceCount, factCount, exampleCount, coverage };
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
