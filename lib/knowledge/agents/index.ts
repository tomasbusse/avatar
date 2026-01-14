/**
 * Knowledge Base Generation Agents
 *
 * A multi-agent system for generating high-quality educational content:
 *
 * 1. Research Agent - Expert at finding and collecting information from the web
 * 2. Organization Agent - Expert at structuring and organizing content
 * 3. Knowledge Writer Agent - Expert at writing polished content optimized for RLM
 *
 * Usage:
 * ```typescript
 * import { runMultiAgentJob } from "@/lib/knowledge/agents";
 *
 * await runMultiAgentJob(convex, jobId, kbId, topic, config);
 * ```
 */

export { ResearchAgent } from "./research-agent";
export type { ResearchResult, ResearchAgentConfig } from "./research-agent";

export { OrganizationAgent } from "./organization-agent";
export type { OrganizedContent, OrganizationAgentConfig } from "./organization-agent";

export { KnowledgeWriterAgent } from "./knowledge-writer-agent";
export type { KnowledgeContent, KnowledgeWriterConfig } from "./knowledge-writer-agent";

export {
  MultiAgentOrchestrator,
  runMultiAgentJob,
  SCALE_PRESETS,
} from "./multi-agent-orchestrator";
export type {
  GenerationScale,
  OrchestratorConfig,
  ProgressEvent,
  ProgressCallback,
} from "./multi-agent-orchestrator";
