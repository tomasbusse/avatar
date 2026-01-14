/**
 * Knowledge Writer Agent
 *
 * Expert at writing polished educational content optimized for RLM retrieval.
 * Takes organized content and produces final knowledge base entries.
 */

import { OrganizedContent } from "./organization-agent";
import { ResearchResult } from "./research-agent";

// Final content structure matching the knowledge base schema
export interface KnowledgeContent {
  // Metadata
  metadata: {
    title: string;
    titleDe?: string;
    level: string;
    estimatedMinutes: number;
    topic: string;
    subtopics: string[];
    tags: string[];
    version: string;
    generatedAt: number;
  };

  // Main content
  content: {
    learningObjectives: Array<{
      id: string;
      objective: string;
      objectiveDe?: string;
    }>;

    introduction: {
      id: string;
      content: string;
      contentDe?: string;
    };

    sections: Array<{
      id: string;
      type: string;
      title: string;
      titleDe?: string;
      content: string;
      contentDe?: string;
    }>;

    vocabulary: Array<{
      id: string;
      term: string;
      termDe?: string;
      definition: string;
      definitionDe?: string;
      exampleSentence: string;
      exampleSentenceDe?: string;
      level: string;
    }>;

    grammarRules: Array<{
      id: string;
      name: string;
      nameDe?: string;
      category: string;
      rule: string;
      ruleDe?: string;
      formula?: string;
      keywords: string[];
      examples: Array<{
        correct: string;
        incorrect?: string;
        explanation: string;
        explanationDe?: string;
      }>;
      commonMistakes: Array<{
        pattern: string;
        correction: string;
        explanation: string;
      }>;
    }>;

    exercises: Array<{
      id: string;
      type: string;
      title: string;
      titleDe?: string;
      instructions: string;
      instructionsDe?: string;
      difficulty: number;
      items: Array<{
        id: string;
        question: string;
        questionDe?: string;
        correctAnswer: string;
        options?: string[];
        explanation: string;
        explanationDe?: string;
        hint?: string;
      }>;
    }>;

    summary: {
      id: string;
      content: string;
      contentDe?: string;
      keyPoints: string[];
    };
  };

  // RLM Optimization - critical for fast avatar retrieval
  rlmOptimized: {
    version: string;
    optimizedAt: number;

    // Grammar indexed by keywords for O(1) lookup
    grammarIndex: Record<string, Array<{
      ruleId: string;
      ruleName: string;
      formula?: string;
      keywords: string[];
    }>>;

    // Vocabulary indexed by term for instant lookup
    vocabularyByTerm: Record<string, {
      id: string;
      term: string;
      termDe?: string;
      definition: string;
      level: string;
    }>;

    // Vocabulary indexed by German term
    vocabularyByTermDe: Record<string, {
      id: string;
      term: string;
      termDe?: string;
      definition: string;
      level: string;
    }>;

    // Vocabulary grouped by level for targeted practice
    vocabularyByLevel: Record<string, Array<{
      id: string;
      term: string;
      level: string;
    }>>;

    // Common mistake patterns for real-time error detection
    mistakePatterns: Array<{
      pattern: string;
      patternRegex?: string;
      mistakeType: string;
      correction: string;
      explanation: string;
      confidence: number;
    }>;

    // Topic keywords for relevance matching
    topicKeywords: string[];

    // Quick reference cards for avatar to use
    quickReference: Array<{
      id: string;
      trigger: string; // What question/context triggers this
      response: string; // Concise response
      expandedResponse?: string; // Detailed response if needed
    }>;

    // Exercise index by skill/type for targeted practice
    exerciseIndex: Record<string, string[]>; // skill -> exercise IDs
  };

  // Web sources for attribution
  webSources: Array<{
    url: string;
    title: string;
    domain: string;
    scrapedAt: number;
    relevanceScore?: number;
  }>;
}

export interface KnowledgeWriterConfig {
  openrouterApiKey: string;
  language: string;
  targetLevel?: string;
}

export class KnowledgeWriterAgent {
  private config: KnowledgeWriterConfig;

  constructor(config: KnowledgeWriterConfig) {
    this.config = config;
  }

  /**
   * Sanitize a string to be used as a Convex field name (ASCII only)
   * Replaces German umlauts and other special characters
   */
  private sanitizeKey(key: string): string {
    return key
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^\x00-\x7F]/g, "") // Remove any remaining non-ASCII
      .trim();
  }

  /**
   * Write final knowledge content from organized structure
   */
  async write(
    organized: OrganizedContent,
    research: ResearchResult
  ): Promise<KnowledgeContent> {
    console.log(`[KnowledgeWriterAgent] Writing content for: ${organized.subtopic}`);

    // Step 1: Write main content sections
    const mainContent = await this.writeMainContent(organized, research);
    console.log(`[KnowledgeWriterAgent] Wrote ${mainContent.sections.length} sections`);

    // Step 2: Write vocabulary entries
    const vocabulary = await this.writeVocabulary(organized, research);
    console.log(`[KnowledgeWriterAgent] Wrote ${vocabulary.length} vocabulary entries`);

    // Step 3: Write grammar rules (if applicable)
    const grammarRules = await this.writeGrammarRules(organized, research);
    console.log(`[KnowledgeWriterAgent] Wrote ${grammarRules.length} grammar rules`);

    // Step 4: Write exercises
    const exercises = await this.writeExercises(organized, research);
    console.log(`[KnowledgeWriterAgent] Wrote ${exercises.length} exercises`);

    // Step 5: Write summary
    const summary = await this.writeSummary(organized, mainContent);

    // Step 6: Build RLM optimization indexes
    const rlmOptimized = this.buildRlmOptimization(
      organized,
      vocabulary,
      grammarRules,
      exercises
    );
    console.log(`[KnowledgeWriterAgent] Built RLM indexes with ${rlmOptimized.topicKeywords.length} keywords`);

    return {
      metadata: {
        title: organized.outline.title,
        titleDe: organized.outline.titleDe,
        level: organized.outline.level,
        estimatedMinutes: organized.outline.estimatedMinutes,
        topic: organized.mainTopic,
        subtopics: [organized.subtopic],
        tags: this.extractTags(organized),
        version: "2.0",
        generatedAt: Date.now(),
      },
      content: {
        learningObjectives: organized.outline.objectives,
        introduction: mainContent.introduction,
        sections: mainContent.sections,
        vocabulary,
        grammarRules,
        exercises,
        summary,
      },
      rlmOptimized,
      webSources: research.sources.map((s) => ({
        url: s.url,
        title: s.title,
        domain: s.domain,
        scrapedAt: Date.now(),
        relevanceScore: s.relevanceScore,
      })),
    };
  }

  /**
   * Write main content sections
   */
  private async writeMainContent(
    organized: OrganizedContent,
    research: ResearchResult
  ): Promise<{
    introduction: KnowledgeContent["content"]["introduction"];
    sections: KnowledgeContent["content"]["sections"];
  }> {
    const systemPrompt = `You are an expert educational content writer. Write clear, engaging, professional content.

Your writing should:
- Be clear and accessible to ${this.config.targetLevel || "general"} level learners
- Use practical examples from the research
- Build understanding progressively
- Address common misconceptions
${this.config.language === "multi" ? "- Include German translations where helpful" : ""}

For each section, write substantial content (200-500 words) that thoroughly covers the topic.

Output JSON:
{
  "introduction": {
    "id": "intro-1",
    "content": "Engaging introduction...",
    "contentDe": "German translation..."
  },
  "sections": [
    {
      "id": "sec-1",
      "type": "concept",
      "title": "Section title",
      "titleDe": "German title",
      "content": "Full section content...",
      "contentDe": "German content..."
    }
  ]
}`;

    const context = `
Topic: ${organized.subtopic} (${organized.mainTopic})
Target Level: ${organized.outline.level}

Sections to write:
${organized.sections.map((s) => `- ${s.title}: ${s.purpose}\n  Key points: ${s.keyPoints.join(", ")}`).join("\n")}

Research facts to incorporate:
${research.keyFacts.slice(0, 20).join("\n")}

Examples to use:
${research.examples.slice(0, 10).map((e) => e.example).join("\n")}
`;

    const response = await this.callAI(systemPrompt, context, 12000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return {
        introduction: {
          id: "intro-1",
          content: `Introduction to ${organized.subtopic}`,
        },
        sections: organized.sections.map((s, i) => ({
          id: `sec-${i + 1}`,
          type: s.type,
          title: s.title,
          titleDe: s.titleDe,
          content: s.keyPoints.join("\n\n"),
        })),
      };
    }
  }

  /**
   * Write vocabulary entries
   */
  private async writeVocabulary(
    organized: OrganizedContent,
    research: ResearchResult
  ): Promise<KnowledgeContent["content"]["vocabulary"]> {
    const systemPrompt = `You are a vocabulary specialist. Write comprehensive vocabulary entries.

For each term:
- Write a clear, learner-friendly definition
- Create an example sentence showing real usage
${this.config.language === "multi" ? "- Include German translations" : ""}
- Assign appropriate CEFR level (A1/A2/B1/B2/C1/C2)

Output JSON array of vocabulary entries.`;

    const vocabPlan = organized.vocabularyPlan.slice(0, 30);
    const definitions = research.definitions;

    const context = `
Vocabulary to write entries for:
${vocabPlan.map((v) => `- ${v.term} (${v.difficulty}): ${v.category}`).join("\n")}

Existing definitions from research:
${definitions.map((d) => `- ${d.term}: ${d.definition}`).join("\n")}

Output JSON array with schema:
[{
  "id": "vocab-1",
  "term": "word",
  "termDe": "German",
  "definition": "Clear definition",
  "definitionDe": "German definition",
  "exampleSentence": "Example showing usage",
  "exampleSentenceDe": "German example",
  "level": "A1|A2|B1|B2|C1|C2"
}]`;

    const response = await this.callAI(systemPrompt, context, 8000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return vocabPlan.map((v, i) => ({
        id: `vocab-${i + 1}`,
        term: v.term,
        termDe: v.termDe,
        definition: definitions.find((d) => d.term === v.term)?.definition || `Definition of ${v.term}`,
        exampleSentence: `Example using ${v.term}.`,
        level: v.difficulty === "basic" ? "A2" : v.difficulty === "advanced" ? "C1" : "B1",
      }));
    }
  }

  /**
   * Write grammar rules
   */
  private async writeGrammarRules(
    organized: OrganizedContent,
    research: ResearchResult
  ): Promise<KnowledgeContent["content"]["grammarRules"]> {
    if (organized.grammarPlan.length === 0) {
      return [];
    }

    const systemPrompt = `You are a grammar expert. Write comprehensive grammar rules that are easy to understand and apply.

For each rule:
- Write a clear explanation
- Create a simple formula/pattern if applicable
- Provide correct AND incorrect examples
- List keywords that indicate when this rule applies
- Document common mistakes

${this.config.language === "multi" ? "Include German translations." : ""}

Output JSON array with full grammar rule objects.`;

    const context = `
Grammar rules to write:
${organized.grammarPlan.map((g) => `- ${g.ruleName} (${g.category}, complexity: ${g.complexity})`).join("\n")}

Research examples:
${research.examples.slice(0, 15).map((e) => e.example).join("\n")}

Key facts about grammar:
${research.keyFacts.filter((f) => f.toLowerCase().includes("rule") || f.toLowerCase().includes("grammar")).join("\n")}

Output JSON array with schema:
[{
  "id": "gram-1",
  "name": "Rule name",
  "nameDe": "German name",
  "category": "tenses|articles|etc",
  "rule": "Clear explanation of the rule",
  "ruleDe": "German explanation",
  "formula": "Subject + have/has + past participle",
  "keywords": ["have", "has", "since", "for"],
  "examples": [
    {"correct": "I have eaten", "incorrect": "I have eat", "explanation": "Why correct/incorrect"}
  ],
  "commonMistakes": [
    {"pattern": "have + base verb", "correction": "have + past participle", "explanation": "..."}
  ]
}]`;

    const response = await this.callAI(systemPrompt, context, 10000);

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
   * Write exercises
   */
  private async writeExercises(
    organized: OrganizedContent,
    research: ResearchResult
  ): Promise<KnowledgeContent["content"]["exercises"]> {
    if (organized.exercisePlan.length === 0) {
      return [];
    }

    const systemPrompt = `You are an exercise design expert. Create engaging, educational exercises.

Requirements:
- Each exercise must have CORRECT answers provided
- Include explanations for why answers are correct
- Vary difficulty as specified
- Use realistic examples
${this.config.language === "multi" ? "- Include German translations for instructions" : ""}

Output complete exercise objects with all items.`;

    const context = `
Exercise plan:
${organized.exercisePlan.map((e) => `- ${e.type}: ${e.count} items, difficulty ${e.difficulty}, focus: ${e.focusArea}`).join("\n")}

Content to test:
- Vocabulary: ${organized.vocabularyPlan.slice(0, 10).map((v) => v.term).join(", ")}
- Grammar: ${organized.grammarPlan.map((g) => g.ruleName).join(", ")}
- Key concepts: ${research.keyFacts.slice(0, 5).join("; ")}

Output JSON array with schema:
[{
  "id": "ex-1",
  "type": "fill_blank|multiple_choice|error_correction|matching",
  "title": "Exercise title",
  "titleDe": "German title",
  "instructions": "Clear instructions",
  "instructionsDe": "German instructions",
  "difficulty": 1|2|3,
  "items": [{
    "id": "item-1",
    "question": "Question text with ___ for blanks",
    "questionDe": "German question",
    "correctAnswer": "The correct answer",
    "options": ["option1", "option2", "option3", "option4"],
    "explanation": "Why this is correct",
    "explanationDe": "German explanation",
    "hint": "Optional hint"
  }]
}]`;

    const response = await this.callAI(systemPrompt, context, 10000);

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
   * Write summary
   */
  private async writeSummary(
    organized: OrganizedContent,
    mainContent: { sections: KnowledgeContent["content"]["sections"] }
  ): Promise<KnowledgeContent["content"]["summary"]> {
    const systemPrompt = `Write a concise summary of the lesson content.

Include:
- Brief recap of what was covered
- 5-8 key takeaways as bullet points
${this.config.language === "multi" ? "- German translation" : ""}

Output JSON:
{
  "id": "summary-1",
  "content": "Summary paragraph...",
  "contentDe": "German summary...",
  "keyPoints": ["point1", "point2", ...]
}`;

    const context = `
Topic: ${organized.subtopic}
Objectives: ${organized.outline.objectives.map((o) => o.objective).join("; ")}
Sections covered: ${mainContent.sections.map((s) => s.title).join(", ")}
`;

    const response = await this.callAI(systemPrompt, context, 2000);

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return {
        id: "summary-1",
        content: `Summary of ${organized.subtopic}`,
        keyPoints: organized.outline.objectives.map((o) => o.objective),
      };
    }
  }

  /**
   * Build RLM optimization indexes for ultra-fast avatar retrieval
   */
  private buildRlmOptimization(
    organized: OrganizedContent,
    vocabulary: KnowledgeContent["content"]["vocabulary"],
    grammarRules: KnowledgeContent["content"]["grammarRules"],
    exercises: KnowledgeContent["content"]["exercises"]
  ): KnowledgeContent["rlmOptimized"] {
    console.log(`[KnowledgeWriterAgent] Building RLM optimization indexes...`);

    // Build grammar index by keywords
    const grammarIndex: Record<string, Array<{ ruleId: string; ruleName: string; formula?: string; keywords: string[] }>> = {};

    for (const rule of grammarRules) {
      const allKeywords = [
        ...rule.keywords,
        ...rule.name.toLowerCase().split(/\s+/),
        rule.category,
      ];

      for (const keyword of allKeywords) {
        const key = this.sanitizeKey(keyword);
        if (key.length > 2) {
          if (!grammarIndex[key]) grammarIndex[key] = [];
          grammarIndex[key].push({
            ruleId: rule.id,
            ruleName: rule.name,
            formula: rule.formula,
            keywords: rule.keywords,
          });
        }
      }
    }

    // Build vocabulary indexes
    const vocabularyByTerm: Record<string, any> = {};
    const vocabularyByTermDe: Record<string, any> = {};
    const vocabularyByLevel: Record<string, any[]> = {};

    for (const vocab of vocabulary) {
      const termKey = this.sanitizeKey(vocab.term);
      vocabularyByTerm[termKey] = {
        id: vocab.id,
        term: vocab.term,
        termDe: vocab.termDe,
        definition: vocab.definition,
        level: vocab.level,
      };

      if (vocab.termDe) {
        const termDeKey = this.sanitizeKey(vocab.termDe);
        vocabularyByTermDe[termDeKey] = vocabularyByTerm[termKey];
      }

      const levelKey = this.sanitizeKey(vocab.level);
      if (!vocabularyByLevel[levelKey]) vocabularyByLevel[levelKey] = [];
      vocabularyByLevel[levelKey].push({
        id: vocab.id,
        term: vocab.term,
        level: vocab.level,
      });
    }

    // Build mistake patterns for real-time error detection
    const mistakePatterns: KnowledgeContent["rlmOptimized"]["mistakePatterns"] = [];

    for (const rule of grammarRules) {
      for (const mistake of rule.commonMistakes || []) {
        mistakePatterns.push({
          pattern: mistake.pattern,
          mistakeType: rule.category,
          correction: mistake.correction,
          explanation: mistake.explanation,
          confidence: 0.8,
        });
      }
    }

    // Extract topic keywords for relevance matching
    const topicKeywords = new Set<string>();

    // From metadata
    topicKeywords.add(organized.subtopic.toLowerCase());
    topicKeywords.add(organized.mainTopic.toLowerCase());

    // From vocabulary
    for (const vocab of vocabulary) {
      topicKeywords.add(vocab.term.toLowerCase());
    }

    // From grammar
    for (const rule of grammarRules) {
      topicKeywords.add(rule.name.toLowerCase());
      for (const kw of rule.keywords) {
        topicKeywords.add(kw.toLowerCase());
      }
    }

    // Build quick reference cards for common questions
    const quickReference: KnowledgeContent["rlmOptimized"]["quickReference"] = [];

    // Add grammar quick refs
    for (const rule of grammarRules) {
      quickReference.push({
        id: `qr-${rule.id}`,
        trigger: `What is ${rule.name}?`,
        response: rule.rule.slice(0, 200),
        expandedResponse: rule.rule,
      });

      if (rule.formula) {
        quickReference.push({
          id: `qr-${rule.id}-formula`,
          trigger: `How do I form ${rule.name}?`,
          response: `Formula: ${rule.formula}`,
          expandedResponse: `${rule.rule}\n\nFormula: ${rule.formula}`,
        });
      }
    }

    // Build exercise index by skill
    const exerciseIndex: Record<string, string[]> = {};

    for (const exercise of exercises) {
      const skill = this.sanitizeKey(exercise.type);
      if (!exerciseIndex[skill]) exerciseIndex[skill] = [];
      exerciseIndex[skill].push(exercise.id);
    }

    return {
      version: "2.0",
      optimizedAt: Date.now(),
      grammarIndex,
      vocabularyByTerm,
      vocabularyByTermDe,
      vocabularyByLevel,
      mistakePatterns,
      topicKeywords: Array.from(topicKeywords),
      quickReference,
      exerciseIndex,
    };
  }

  /**
   * Extract tags from organized content
   */
  private extractTags(organized: OrganizedContent): string[] {
    const tags = new Set<string>();

    tags.add(organized.mainTopic.toLowerCase());
    tags.add(organized.subtopic.toLowerCase());

    for (const section of organized.sections) {
      tags.add(section.type);
    }

    for (const grammar of organized.grammarPlan) {
      tags.add(grammar.category);
    }

    return Array.from(tags).slice(0, 10);
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
