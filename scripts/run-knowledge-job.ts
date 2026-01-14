#!/usr/bin/env npx tsx
/**
 * CLI script to run knowledge base generation jobs
 *
 * Usage: npx tsx scripts/run-knowledge-job.ts <jobId>
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  ResearchAgent,
  OrganizationAgent,
  KnowledgeWriterAgent,
} from "../lib/knowledge/agents";

// Load environment
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!CONVEX_URL || !OPENROUTER_API_KEY || !TAVILY_API_KEY) {
  console.error("Missing required environment variables");
  console.error("Required: NEXT_PUBLIC_CONVEX_URL, OPENROUTER_API_KEY, TAVILY_API_KEY");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

async function runJob(jobId: string) {
  console.log(`\n🚀 Starting knowledge generation job: ${jobId}\n`);

  // Get job details
  const job = await convex.query(api.scrapingJobs.getById, {
    id: jobId as Id<"scrapingJobs">,
  });

  if (!job) {
    console.error("Job not found:", jobId);
    process.exit(1);
  }

  console.log(`📚 Topic: ${job.topic}`);
  console.log(`📝 Subtopics: ${job.subtopics.map((s: { name: string }) => s.name).join(", ")}`);
  console.log(`⚙️  Config:`, job.config);
  console.log("");

  // Update status to scraping
  await convex.mutation(api.scrapingJobs.updateStatus, {
    id: job._id,
    status: "scraping",
  });

  // Initialize agents
  const researchAgent = new ResearchAgent({
    tavilyApiKey: TAVILY_API_KEY!,
    openrouterApiKey: OPENROUTER_API_KEY!,
    maxSources: job.config.maxSourcesPerSubtopic,
    broadSearch: job.config.broadSearch ?? false,
    language: job.config.language,
  });

  const organizationAgent = new OrganizationAgent({
    openrouterApiKey: OPENROUTER_API_KEY!,
    targetLevel: job.config.targetLevel,
    language: job.config.language,
    includeExercises: job.config.includeExercises,
  });

  const writerAgent = new KnowledgeWriterAgent({
    openrouterApiKey: OPENROUTER_API_KEY!,
    language: job.config.language,
    targetLevel: job.config.targetLevel,
  });

  let allSucceeded = true;

  // Process each subtopic
  for (let i = 0; i < job.subtopics.length; i++) {
    const subtopic = job.subtopics[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📖 Processing subtopic ${i + 1}/${job.subtopics.length}: "${subtopic.name}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      // Phase 1: Research
      console.log("🔍 Phase 1: Research Agent searching the web...");
      await convex.mutation(api.scrapingJobs.updateSubtopic, {
        id: job._id,
        subtopicName: subtopic.name,
        status: "scraping",
      });

      const research = await researchAgent.research(subtopic.name, job.topic);
      console.log(`   ✅ Found ${research.sources.length} sources, ${research.keyFacts.length} facts`);

      // Update progress
      await convex.mutation(api.scrapingJobs.updateSubtopic, {
        id: job._id,
        subtopicName: subtopic.name,
        status: "synthesizing",
        sourceCount: research.sources.length,
      });

      // Phase 2: Organization
      console.log("\n📊 Phase 2: Organization Agent structuring content...");
      const organized = await organizationAgent.organize(research, job.topic);
      console.log(`   ✅ Created ${organized.sections?.length || 0} sections, ${organized.vocabulary?.length || 0} vocabulary items`);

      // Phase 3: Writing
      console.log("\n✍️  Phase 3: Knowledge Writer Agent creating content...");
      await convex.mutation(api.scrapingJobs.updateSubtopic, {
        id: job._id,
        subtopicName: subtopic.name,
        status: "optimizing",
      });

      const content = await writerAgent.write(organized, research, job.topic);
      console.log(`   ✅ Generated ${content.content.sections.length} sections, ${content.content.vocabulary.length} vocabulary, ${content.content.exercises.length} exercises`);

      // Save to database
      console.log("\n💾 Saving to knowledge base...");
      const sourceId = `scraped_${Date.now()}_${i}`;

      await convex.mutation(api.knowledgeBases.addScrapedContent, {
        knowledgeBaseId: job.knowledgeBaseId,
        sourceId,
        title: content.metadata.title,
        content: JSON.stringify(content.content, null, 2), // Markdown-ish
        jsonContent: content.content,
        rlmOptimized: content.rlmOptimized,
        webSources: research.sources.map((s) => ({
          url: s.url,
          title: s.title,
          domain: s.domain,
          scrapedAt: Date.now(),
          relevanceScore: s.relevanceScore,
        })),
        metadata: {
          wordCount: content.metadata.wordCount,
          exerciseCount: content.content.exercises.length,
          vocabularyCount: content.content.vocabulary.length,
          grammarRuleCount: content.content.grammarRules.length,
          level: content.metadata.level,
        },
      });

      // Mark subtopic complete
      await convex.mutation(api.scrapingJobs.updateSubtopic, {
        id: job._id,
        subtopicName: subtopic.name,
        status: "completed",
        wordCount: content.metadata.wordCount,
      });

      console.log(`   ✅ Subtopic "${subtopic.name}" completed!\n`);

    } catch (error) {
      console.error(`\n❌ Error processing subtopic "${subtopic.name}":`, error);
      allSucceeded = false;

      await convex.mutation(api.scrapingJobs.updateSubtopic, {
        id: job._id,
        subtopicName: subtopic.name,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Mark job complete
  await convex.mutation(api.scrapingJobs.updateStatus, {
    id: job._id,
    status: allSucceeded ? "completed" : "failed",
  });

  console.log(allSucceeded ? "\n✅ Job completed successfully!" : "\n⚠️ Job completed with some failures");
}

// Get job ID from command line
const jobId = process.argv[2];
if (!jobId) {
  console.error("Usage: npx tsx scripts/run-knowledge-job.ts <jobId>");
  process.exit(1);
}

runJob(jobId).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
