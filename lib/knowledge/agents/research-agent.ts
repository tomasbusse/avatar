/**
 * Research Agent
 *
 * Expert at finding and collecting information from the web.
 * Uses Tavily for search and extracts key facts, quotes, and sources.
 */

export interface ResearchResult {
  subtopic: string;
  sources: Array<{
    url: string;
    title: string;
    domain: string;
    content: string;
    relevanceScore?: number;
  }>;
  keyFacts: string[];
  definitions: Array<{
    term: string;
    definition: string;
    source: string;
  }>;
  examples: Array<{
    example: string;
    context: string;
    source: string;
  }>;
  quotes: Array<{
    quote: string;
    source: string;
    relevance: string;
  }>;
  relatedTopics: string[];
  searchQueries: string[];
}

export interface ResearchAgentConfig {
  tavilyApiKey: string;
  openrouterApiKey: string;
  maxSources: number;
  broadSearch: boolean;
  language: string;
}

// Quality domains for educational content
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
  "merriam-webster.com",
  "dictionary.com",
];

export class ResearchAgent {
  private config: ResearchAgentConfig;

  constructor(config: ResearchAgentConfig) {
    this.config = config;
  }

  /**
   * Research a subtopic thoroughly
   */
  async research(subtopic: string, mainTopic: string): Promise<ResearchResult> {
    console.log(`[ResearchAgent] Starting research on: ${subtopic}`);

    // Step 1: Generate multiple search queries for comprehensive coverage
    const searchQueries = await this.generateSearchQueries(subtopic, mainTopic);
    console.log(`[ResearchAgent] Generated ${searchQueries.length} search queries`);

    // Step 2: Execute searches and collect raw content
    const rawSources = await this.executeSearches(searchQueries);
    console.log(`[ResearchAgent] Collected ${rawSources.length} sources`);

    // Step 3: Extract structured information from sources
    const extractedInfo = await this.extractInformation(subtopic, mainTopic, rawSources);
    console.log(`[ResearchAgent] Extracted ${extractedInfo.keyFacts.length} facts, ${extractedInfo.definitions.length} definitions`);

    return {
      subtopic,
      sources: rawSources,
      ...extractedInfo,
      searchQueries,
    };
  }

  /**
   * Generate diverse search queries for comprehensive coverage
   */
  private async generateSearchQueries(subtopic: string, mainTopic: string): Promise<string[]> {
    const systemPrompt = `You are a research assistant. Generate 5-8 diverse search queries to thoroughly research a topic.

Include queries for:
- Definitions and explanations
- Examples and use cases
- Common mistakes and misconceptions
- Advanced aspects and edge cases
- Practical applications

Output ONLY a JSON array of search query strings.`;

    const response = await this.callAI(
      systemPrompt,
      `Main topic: ${mainTopic}\nSubtopic to research: ${subtopic}\n\nGenerate search queries:`,
      1000
    );

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      // Fallback to basic queries
      return [
        `${subtopic} explanation examples`,
        `${subtopic} guide tutorial`,
        `${subtopic} common mistakes`,
        `${mainTopic} ${subtopic} rules`,
      ];
    }
  }

  /**
   * Execute search queries using Tavily
   */
  private async executeSearches(queries: string[]): Promise<ResearchResult["sources"]> {
    const allSources: ResearchResult["sources"] = [];
    const seenUrls = new Set<string>();

    for (const query of queries) {
      if (allSources.length >= this.config.maxSources) break;

      try {
        const tavilyRequest: Record<string, unknown> = {
          api_key: this.config.tavilyApiKey,
          query,
          search_depth: "advanced",
          max_results: Math.min(10, this.config.maxSources - allSources.length + 5),
          include_raw_content: true,
        };

        // Only limit domains if not doing broad search
        if (!this.config.broadSearch) {
          tavilyRequest.include_domains = QUALITY_DOMAINS;
        }

        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tavilyRequest),
        });

        if (!response.ok) continue;

        const data = await response.json();

        for (const result of data.results || []) {
          if (allSources.length >= this.config.maxSources) break;
          if (seenUrls.has(result.url)) continue;

          const content = result.raw_content || result.content || "";
          if (content.length < 200) continue;

          seenUrls.add(result.url);
          const domain = new URL(result.url).hostname.replace("www.", "");

          allSources.push({
            url: result.url,
            title: result.title || query,
            domain,
            content: content.slice(0, 20000), // Keep more content for analysis
            relevanceScore: result.score,
          });
        }
      } catch (error) {
        console.error(`[ResearchAgent] Search failed for query "${query}":`, error);
      }
    }

    return allSources;
  }

  /**
   * Extract structured information from raw sources
   */
  private async extractInformation(
    subtopic: string,
    mainTopic: string,
    sources: ResearchResult["sources"]
  ): Promise<Omit<ResearchResult, "subtopic" | "sources" | "searchQueries">> {
    const sourceText = sources
      .map((s, i) => `[Source ${i + 1}: ${s.title}]\n${s.content.slice(0, 8000)}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are an expert research analyst. Extract and organize key information from source materials.

Your task: Analyze the sources and extract structured information about "${subtopic}" (within ${mainTopic}).

Output JSON with this exact structure:
{
  "keyFacts": ["fact1", "fact2", ...],  // 10-20 key facts and insights
  "definitions": [
    {"term": "...", "definition": "...", "source": "Source N"}
  ],
  "examples": [
    {"example": "...", "context": "...", "source": "Source N"}
  ],
  "quotes": [
    {"quote": "...", "source": "Source N", "relevance": "why this quote matters"}
  ],
  "relatedTopics": ["topic1", "topic2", ...]  // Related areas to explore
}

Be thorough. Extract ALL relevant information. This is the research phase - more is better.`;

    const response = await this.callAI(
      systemPrompt,
      `Extract information about "${subtopic}":\n\n${sourceText}`,
      8000
    );

    try {
      let jsonText = response.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "");
      }
      return JSON.parse(jsonText);
    } catch {
      return {
        keyFacts: [],
        definitions: [],
        examples: [],
        quotes: [],
        relatedTopics: [],
      };
    }
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
