/**
 * Knowledge Base Generation Agents
 *
 * A multi-agent system for generating high-quality educational content:
 *
 * 1. Research Agent - Expert at finding and collecting information from the web
 * 2. Organization Agent - Expert at structuring and organizing content
 * 3. Knowledge Writer Agent - Expert at writing polished content optimized for RLM
 * 4. Quality Reviewer Agent - Reviews content for accuracy and completeness
 * 5. Source Verification Agent - Cross-references facts across sources
 *
 * Plus:
 * - Enhanced Orchestrator with parallel processing
 * - Feedback Loop for continuous improvement
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

export { QualityReviewerAgent } from "./quality-reviewer-agent";
export type { QualityReview, QualityReviewerConfig } from "./quality-reviewer-agent";

export { SourceVerificationAgent } from "./source-verification-agent";
export type { VerifiedResearch, SourceVerificationConfig } from "./source-verification-agent";

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

export {
  EnhancedOrchestrator,
  runEnhancedJob,
  SCALE_PRESETS as ENHANCED_SCALE_PRESETS,
} from "./enhanced-orchestrator";
export type {
  EnhancedOrchestratorConfig,
  EnhancedProgressEvent,
  EnhancedProgressCallback,
} from "./enhanced-orchestrator";

export { FeedbackLoop, createFeedbackLoop } from "./feedback-loop";
export type {
  KnowledgeUsageEvent,
  ContentEffectiveness,
  KnowledgeGap,
  FeedbackSummary,
  FeedbackLoopConfig,
} from "./feedback-loop";
