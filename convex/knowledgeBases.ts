import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Knowledge Base Management
 *
 * Knowledge bases contain RAG content that avatars can retrieve
 * to answer questions accurately.
 */

// Get all knowledge bases
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("knowledgeBases").order("desc").collect();
  },
});

// Get a knowledge base by ID
export const getById = query({
  args: { id: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get active knowledge bases
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("knowledgeBases")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

// Create a new knowledge base
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    domain: v.object({
      primaryTopic: v.string(),
      language: v.union(v.literal("en"), v.literal("de"), v.literal("multi")),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const kbId = await ctx.db.insert("knowledgeBases", {
      name: args.name,
      description: args.description,
      sources: [],
      domain: {
        primaryTopic: args.domain.primaryTopic,
        subtopics: [],
        language: args.domain.language,
      },
      retrievalSettings: {
        embeddingModel: "text-embedding-3-small",
        chunkSize: 500,
        chunkOverlap: 50,
        maxContextChunks: 3,
        similarityThreshold: 0.7,
        preferRecent: false,
        includeMetadata: true,
      },
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id: kbId };
  },
});

// Add a source to a knowledge base
export const addSource = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    sourceId: v.string(),
    type: v.union(v.literal("document"), v.literal("faq"), v.literal("glossary")),
    name: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.knowledgeBaseId);
    if (!kb) {
      throw new Error("Knowledge base not found");
    }

    const newSource = {
      sourceId: args.sourceId,
      type: args.type,
      name: args.name,
      storageId: args.storageId,
      chunkCount: 0,
      lastUpdated: Date.now(),
      priority: kb.sources.length + 1, // Auto-increment priority
    };

    await ctx.db.patch(args.knowledgeBaseId, {
      sources: [...kb.sources, newSource],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Add text content directly to a knowledge base (for manual entry)
export const addTextContent = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.knowledgeBaseId);
    if (!kb) {
      throw new Error("Knowledge base not found");
    }

    const sourceId = `text-${Date.now()}`;
    const newSource = {
      sourceId,
      type: "document" as const,
      name: args.title,
      description: args.category,
      chunkCount: 1,
      lastUpdated: Date.now(),
      priority: kb.sources.length + 1,
    };

    await ctx.db.patch(args.knowledgeBaseId, {
      sources: [...kb.sources, newSource],
      status: "active",
      updatedAt: Date.now(),
    });

    // Note: The actual content should be stored in Zep via the Python agent
    // This just tracks the source in Convex

    return {
      success: true,
      sourceId,
      message: "Source added. Use the Python agent to index content in Zep for RAG.",
    };
  },
});

// Update knowledge base status
export const updateStatus = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    status: v.union(v.literal("pending"), v.literal("indexing"), v.literal("active")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.knowledgeBaseId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a knowledge base
export const remove = mutation({
  args: { id: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Link knowledge base to avatar
export const linkToAvatar = mutation({
  args: {
    avatarSlug: v.string(),
    knowledgeBaseId: v.id("knowledgeBases"),
  },
  handler: async (ctx, args) => {
    const avatar = await ctx.db
      .query("avatars")
      .filter((q) => q.eq(q.field("slug"), args.avatarSlug))
      .unique();

    if (!avatar) {
      throw new Error("Avatar not found");
    }

    const currentKbs = avatar.knowledgeConfig?.knowledgeBaseIds ?? [];
    if (!currentKbs.includes(args.knowledgeBaseId)) {
      // Build complete knowledgeConfig with defaults if not present
      const existingConfig = avatar.knowledgeConfig ?? {
        knowledgeBaseIds: [],
        domain: { primaryTopic: "", subtopics: [], expertise: [], limitations: [] },
        ragSettings: { enabled: false, triggerKeywords: [], maxContextChunks: 3, similarityThreshold: 0.7 },
      };
      const newConfig = {
        domain: existingConfig.domain.primaryTopic ? existingConfig.domain : {
          primaryTopic: "English Language Learning",
          subtopics: [],
          expertise: [],
          limitations: [],
        },
        ragSettings: existingConfig.ragSettings.enabled !== undefined ? existingConfig.ragSettings : {
          enabled: true,
          triggerKeywords: [],
          maxContextChunks: 3,
          similarityThreshold: 0.7,
        },
        knowledgeBaseIds: [...currentKbs, args.knowledgeBaseId],
      };

      await ctx.db.patch(avatar._id, {
        knowledgeConfig: newConfig,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ============================================
// FILE & URL CONTENT MANAGEMENT
// ============================================

// Generate upload URL for file
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Add a file source (after upload)
export const addFileSource = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.union(
      v.literal("pdf"),
      v.literal("powerpoint"),
      v.literal("markdown"),
      v.literal("text")
    ),
  },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.knowledgeBaseId);
    if (!kb) {
      throw new Error("Knowledge base not found");
    }

    const now = Date.now();
    const sourceId = `file-${now}`;

    // Add source to knowledge base
    const newSource = {
      sourceId,
      type: "document" as const,
      name: args.fileName,
      description: `Uploaded ${args.fileType} file`,
      storageId: args.storageId,
      chunkCount: 0,
      lastUpdated: now,
      priority: kb.sources.length + 1,
    };

    await ctx.db.patch(args.knowledgeBaseId, {
      sources: [...kb.sources, newSource],
      updatedAt: now,
    });

    // Create pending content record
    const contentId = await ctx.db.insert("knowledgeContent", {
      knowledgeBaseId: args.knowledgeBaseId,
      sourceId,
      title: args.fileName,
      content: "", // Will be filled after processing
      contentType: args.fileType,
      originalFileName: args.fileName,
      storageId: args.storageId,
      processingStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, sourceId, contentId };
  },
});

// Add URL source (YouTube, webpage)
export const addUrlSource = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    url: v.string(),
    title: v.string(),
    urlType: v.union(v.literal("youtube"), v.literal("webpage")),
  },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.knowledgeBaseId);
    if (!kb) {
      throw new Error("Knowledge base not found");
    }

    const now = Date.now();
    const sourceId = `url-${now}`;

    // Add source to knowledge base
    const newSource = {
      sourceId,
      type: "document" as const,
      name: args.title,
      description: args.urlType === "youtube" ? "YouTube video transcript" : "Web page content",
      chunkCount: 0,
      lastUpdated: now,
      priority: kb.sources.length + 1,
    };

    await ctx.db.patch(args.knowledgeBaseId, {
      sources: [...kb.sources, newSource],
      updatedAt: now,
    });

    // Create pending content record
    const contentId = await ctx.db.insert("knowledgeContent", {
      knowledgeBaseId: args.knowledgeBaseId,
      sourceId,
      title: args.title,
      content: "", // Will be filled after processing
      contentType: args.urlType,
      originalUrl: args.url,
      processingStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, sourceId, contentId };
  },
});

// Update content after processing
export const updateContent = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    content: v.string(),
    metadata: v.optional(v.object({
      pageCount: v.optional(v.number()),
      slideCount: v.optional(v.number()),
      duration: v.optional(v.string()),
      author: v.optional(v.string()),
      wordCount: v.optional(v.number()),
      usedOcr: v.optional(v.boolean()),
      aiCleaned: v.optional(v.boolean()),
    })),
    status: v.union(
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    await ctx.db.patch(args.contentId, {
      content: args.content,
      metadata: args.metadata,
      processingStatus: args.status,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });

    // Update source chunk count in knowledge base
    if (args.status === "completed") {
      const kb = await ctx.db.get(content.knowledgeBaseId);
      if (kb) {
        const wordCount = args.content.split(/\s+/).length;
        const chunkCount = Math.ceil(wordCount / 500); // Rough chunk estimate

        const updatedSources = kb.sources.map(s =>
          s.sourceId === content.sourceId
            ? { ...s, chunkCount }
            : s
        );

        await ctx.db.patch(content.knowledgeBaseId, {
          sources: updatedSources,
          status: "active",
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Add scraped content from web (used by scraping orchestrator)
export const addScrapedContent = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    sourceId: v.string(),
    title: v.string(),
    content: v.string(), // Markdown
    jsonContent: v.any(), // Structured LessonContent
    rlmOptimized: v.object({
      grammarIndex: v.optional(v.any()),
      vocabularyByTerm: v.optional(v.any()),
      vocabularyByTermDe: v.optional(v.any()),
      vocabularyByLevel: v.optional(v.any()),
      mistakePatterns: v.optional(v.array(v.object({
        pattern: v.string(),
        mistakeType: v.string(),
        correction: v.string(),
        explanation: v.string(),
      }))),
      topicKeywords: v.optional(v.array(v.string())),
      version: v.optional(v.string()),
      optimizedAt: v.optional(v.number()),
      // Quick reference cards for common questions
      quickReference: v.optional(v.array(v.object({
        id: v.string(),
        trigger: v.string(),
        response: v.string(),
        expandedResponse: v.optional(v.string()),
      }))),
      // Exercise index by type
      exerciseIndex: v.optional(v.any()), // { [type: string]: string[] }
    }),
    webSources: v.array(v.object({
      url: v.string(),
      title: v.string(),
      domain: v.string(),
      scrapedAt: v.number(),
      relevanceScore: v.optional(v.number()),
    })),
    metadata: v.object({
      wordCount: v.optional(v.number()),
      exerciseCount: v.optional(v.number()),
      vocabularyCount: v.optional(v.number()),
      grammarRuleCount: v.optional(v.number()),
      level: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.knowledgeBaseId);
    if (!kb) {
      throw new Error("Knowledge base not found");
    }

    const now = Date.now();

    // Add source to knowledge base
    const newSource = {
      sourceId: args.sourceId,
      type: "document" as const,
      name: args.title,
      chunkCount: Math.ceil((args.metadata.wordCount || 0) / 500),
      lastUpdated: now,
      priority: 1,
    };

    await ctx.db.patch(args.knowledgeBaseId, {
      sources: [...kb.sources, newSource],
      updatedAt: now,
    });

    // Create content record
    const contentId = await ctx.db.insert("knowledgeContent", {
      knowledgeBaseId: args.knowledgeBaseId,
      sourceId: args.sourceId,
      title: args.title,
      content: args.content,
      contentType: "webpage",
      jsonContent: args.jsonContent,
      rlmOptimized: args.rlmOptimized,
      webSources: args.webSources,
      metadata: {
        ...args.metadata,
        usedOcr: false,
        aiCleaned: true,
      },
      processingStatus: "completed",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, contentId, sourceId: args.sourceId };
  },
});

// Get all content for a knowledge base
export const getContent = query({
  args: { knowledgeBaseId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("knowledgeContent")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
      .collect();
  },
});

// Get all content from all knowledge bases (for lesson creation)
export const getAllContent = query({
  args: {},
  handler: async (ctx) => {
    const allContent = await ctx.db
      .query("knowledgeContent")
      .withIndex("by_status", (q) => q.eq("processingStatus", "completed"))
      .order("desc")
      .take(100);
    return allContent;
  },
});

// Get content by source ID
export const getContentBySource = query({
  args: { sourceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("knowledgeContent")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .first();
  },
});

// Edit content (for manual editing of generated content)
export const editContent = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingContent = await ctx.db.get(args.contentId);
    if (!existingContent) {
      throw new Error("Content not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) {
      updates.content = args.content;
      // Update word count
      const wordCount = args.content.split(/\s+/).length;
      updates.metadata = {
        ...existingContent.metadata,
        wordCount,
      };
    }

    await ctx.db.patch(args.contentId, updates);

    // Update source name in knowledge base if title changed
    if (args.title !== undefined && args.title.trim()) {
      const kb = await ctx.db.get(existingContent.knowledgeBaseId);
      if (kb) {
        const newTitle = args.title; // Capture for type narrowing
        const updatedSources = kb.sources.map((s) =>
          s.sourceId === existingContent.sourceId
            ? { ...s, name: newTitle }
            : s
        );
        await ctx.db.patch(existingContent.knowledgeBaseId, {
          sources: updatedSources,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Delete content
export const deleteContent = mutation({
  args: { contentId: v.id("knowledgeContent") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    // Remove source from knowledge base
    const kb = await ctx.db.get(content.knowledgeBaseId);
    if (kb) {
      const updatedSources = kb.sources.filter(s => s.sourceId !== content.sourceId);
      await ctx.db.patch(content.knowledgeBaseId, {
        sources: updatedSources,
        updatedAt: Date.now(),
      });
    }

    // Delete the file from storage if it exists
    if (content.storageId) {
      await ctx.storage.delete(content.storageId);
    }

    // Delete content record
    await ctx.db.delete(args.contentId);

    return { success: true };
  },
});

// Get file URL for download
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Get all content for a knowledge base (for indexing)
export const getContentForKnowledgeBase = query({
  args: { knowledgeBaseId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("knowledgeContent")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
      .collect();

    return content.map(c => ({
      _id: c._id,
      title: c.title,
      content: c.content,
      sourceType: c.contentType,
      status: c.processingStatus,
      metadata: c.metadata,
    }));
  },
});

// Update vector store reference after indexing
export const updateVectorStoreRef = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    vectorStoreRef: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.knowledgeBaseId, {
      vectorStoreRef: args.vectorStoreRef,
      status: "active",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// ============================================
// STRUCTURED CONTENT & PDF MANAGEMENT
// ============================================

// Get content by ID
export const getContentById = query({
  args: { contentId: v.id("knowledgeContent") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contentId);
  },
});

// Update content with structured JSON
export const updateContentWithStructure = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    content: v.string(), // Markdown for display
    jsonContent: v.any(), // LessonContent JSON
    metadata: v.optional(v.object({
      pageCount: v.optional(v.number()),
      slideCount: v.optional(v.number()),
      duration: v.optional(v.string()),
      author: v.optional(v.string()),
      wordCount: v.optional(v.number()),
      usedOcr: v.optional(v.boolean()),
      aiCleaned: v.optional(v.boolean()),
      exerciseCount: v.optional(v.number()),
      vocabularyCount: v.optional(v.number()),
      grammarRuleCount: v.optional(v.number()),
      level: v.optional(v.string()),
    })),
    status: v.union(
      v.literal("completed"),
      v.literal("failed"),
      v.literal("generating_pdf")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    await ctx.db.patch(args.contentId, {
      content: args.content,
      jsonContent: args.jsonContent,
      metadata: args.metadata,
      processingStatus: args.status,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });

    // Update source chunk count in knowledge base
    if (args.status === "completed") {
      const kb = await ctx.db.get(content.knowledgeBaseId);
      if (kb) {
        const wordCount = args.content.split(/\s+/).length;
        const chunkCount = Math.ceil(wordCount / 500);

        const updatedSources = kb.sources.map(s =>
          s.sourceId === content.sourceId
            ? { ...s, chunkCount }
            : s
        );

        await ctx.db.patch(content.knowledgeBaseId, {
          sources: updatedSources,
          status: "active",
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Update PDF storage reference
export const updatePdfStorage = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    pdfStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.pdfStorageId);

    await ctx.db.patch(args.contentId, {
      pdfStorageId: args.pdfStorageId,
      pdfUrl: url ?? undefined,
      pdfGeneratedAt: Date.now(),
      processingStatus: "completed",
      updatedAt: Date.now(),
    });

    return { success: true, pdfUrl: url ?? undefined };
  },
});

// Update processing status (for progress indicator)
export const updateProcessingStatus = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("structuring"),
      v.literal("generating_pdf"),
      v.literal("generating_pptx"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contentId, {
      processingStatus: args.status,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Update presentation link (after PPTX generation)
export const updatePresentationLink = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    presentationId: v.id("presentations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contentId, {
      presentationId: args.presentationId,
      pptxGeneratedAt: Date.now(),
      processingStatus: "completed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update HTML slides (for interactive rendering)
export const updateHtmlSlides = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    htmlSlides: v.array(v.object({
      index: v.number(),
      html: v.string(),
      title: v.optional(v.string()),
      type: v.union(
        v.literal("title"),
        v.literal("objectives"),
        v.literal("content"),
        v.literal("grammar"),
        v.literal("vocabulary"),
        v.literal("exercise"),
        v.literal("summary")
      ),
      speakerNotes: v.optional(v.string()),
      teachingPrompt: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contentId, {
      htmlSlides: args.htmlSlides,
      htmlSlidesGeneratedAt: Date.now(),
      processingStatus: "completed",
      updatedAt: Date.now(),
    });

    return { success: true, slideCount: args.htmlSlides.length };
  },
});

// Generate shareable link for content
export const generateShareLink = mutation({
  args: { contentId: v.id("knowledgeContent") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    // Generate a short unique token
    const shareToken = Math.random().toString(36).substring(2, 10);

    await ctx.db.patch(args.contentId, {
      isPublic: true,
      shareToken,
      updatedAt: Date.now(),
    });

    return {
      shareToken,
      // The actual URL will be constructed by the frontend
    };
  },
});

// Revoke share link
export const revokeShareLink = mutation({
  args: { contentId: v.id("knowledgeContent") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contentId, {
      isPublic: false,
      shareToken: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get content by share token (public access)
export const getContentByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("knowledgeContent")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!content || !content.isPublic) {
      return null;
    }

    // Return only public-safe fields
    return {
      _id: content._id,
      title: content.title,
      content: content.content,
      jsonContent: content.jsonContent,
      pdfUrl: content.pdfUrl,
      metadata: content.metadata,
      contentType: content.contentType,
      processingStatus: content.processingStatus,
      shareToken: content.shareToken,
    };
  },
});

// Get all public content (for lesson library)
export const getPublicContent = query({
  args: {},
  handler: async (ctx) => {
    const content = await ctx.db
      .query("knowledgeContent")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    return content.map(c => ({
      _id: c._id,
      title: c.title,
      pdfUrl: c.pdfUrl,
      metadata: c.metadata,
      shareToken: c.shareToken,
    }));
  },
});

// ============================================
// GENERAL KNOWLEDGE BASE (for Python Agent fast lookup)
// ============================================

/**
 * General knowledge that applies across all lessons:
 * - Grammar rules
 * - Core vocabulary (A1-B2)
 * - Common German speaker mistakes
 *
 * These are loaded at agent startup and kept in memory for <1ms lookups.
 */

// Get general grammar rules (loaded once at agent startup)
export const getGeneralGrammarRules = query({
  args: {},
  handler: async (ctx) => {
    // Try to get from dedicated grammarRules table if it exists
    // For now, return empty array - the Python agent has built-in defaults
    // This allows future expansion where admins can add custom rules via UI
    return [];
  },
});

// Get general vocabulary up to a certain level
export const getGeneralVocabulary = query({
  args: {
    maxLevel: v.optional(v.string()), // A1, A2, B1, B2
  },
  handler: async (ctx, args) => {
    // Try to get from dedicated vocabulary table if it exists
    // For now, return empty array - the Python agent has built-in defaults
    // This allows future expansion where admins can add custom vocabulary via UI
    return [];
  },
});

// Get common German speaker mistakes
export const getCommonMistakes = query({
  args: {},
  handler: async (ctx) => {
    // Try to get from dedicated mistakes table if it exists
    // For now, return empty array - the Python agent has built-in defaults
    // This allows future expansion where admins can add custom patterns via UI
    return [];
  },
});

// ============================================
// AVATAR KNOWLEDGE ACCESS (for Python Agent)
// ============================================

// Get lightweight lesson index for an avatar (fast, for session start)
export const getAvatarLessonIndex = query({
  args: { avatarId: v.id("avatars") },
  handler: async (ctx, args) => {
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar?.knowledgeConfig?.knowledgeBaseIds) return [];

    const allContent = [];
    for (const kbId of avatar.knowledgeConfig.knowledgeBaseIds) {
      const content = await ctx.db
        .query("knowledgeContent")
        .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", kbId))
        .filter((q) => q.eq(q.field("processingStatus"), "completed"))
        .collect();
      allContent.push(...content);
    }

    // Return lightweight index with keywords for pattern matching
    return allContent.map(c => {
      const jsonContent = c.jsonContent as {
        metadata?: {
          topic?: string;
          level?: string;
          subtopics?: string[];
          tags?: string[];
        };
      } | null;

      return {
        _id: c._id,
        title: c.title,
        topic: jsonContent?.metadata?.topic || null,
        level: jsonContent?.metadata?.level || null,
        exerciseCount: c.metadata?.exerciseCount || 0,
        vocabularyCount: c.metadata?.vocabularyCount || 0,
        grammarCount: c.metadata?.grammarRuleCount || 0,
        // Keywords for pattern matching
        keywords: [
          c.title?.toLowerCase(),
          jsonContent?.metadata?.topic?.toLowerCase(),
          ...(jsonContent?.metadata?.subtopics || []).map((s: string) => s.toLowerCase()),
          ...(jsonContent?.metadata?.tags || []).map((t: string) => t.toLowerCase()),
        ].filter(Boolean),
      };
    });
  },
});

// Get all lesson content for an avatar's linked knowledge bases (full data)
export const getAvatarLessonContent = query({
  args: { avatarId: v.id("avatars") },
  handler: async (ctx, args) => {
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar?.knowledgeConfig?.knowledgeBaseIds) return [];

    const allContent = [];
    for (const kbId of avatar.knowledgeConfig.knowledgeBaseIds) {
      const content = await ctx.db
        .query("knowledgeContent")
        .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", kbId))
        .filter((q) => q.eq(q.field("processingStatus"), "completed"))
        .collect();
      allContent.push(...content);
    }

    return allContent.map(c => ({
      _id: c._id,
      title: c.title,
      jsonContent: c.jsonContent,
      metadata: c.metadata,
    }));
  },
});

// ============================================
// CONTENT-LESSON LINKING (Multiple content per lesson)
// ============================================

/**
 * Get all content linked to a lesson via contentLessonLinks table
 * Used by admin UI when editing lessons
 */
export const getContentForLesson = query({
  args: { lessonId: v.id("structuredLessons") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("contentLessonLinks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    // Fetch actual content items
    const contentItems = await Promise.all(
      links.map(async (link) => {
        const content = await ctx.db.get(link.contentId);
        return {
          ...link,
          content,
        };
      })
    );

    // Sort by order
    return contentItems.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get content available for a session (via the linked structured lesson)
 * Used by the teaching room Materials panel
 */
export const getContentForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session?.structuredLessonId) return [];

    // Store lessonId in a const to help TypeScript narrow the type
    const lessonId = session.structuredLessonId;

    // Get content links via contentLessonLinks table
    const links = await ctx.db
      .query("contentLessonLinks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .collect();

    // Fetch content details
    const contentItems = await Promise.all(
      links.map(async (link) => {
        const content = await ctx.db.get(link.contentId);
        if (!content || content.processingStatus !== "completed") return null;
        return {
          ...content,
          linkId: link._id,
          order: link.order,
          triggerType: link.triggerType,
        };
      })
    );

    // Filter out nulls and sort by order
    return contentItems
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },
});

/**
 * Link content to a lesson
 * Maximum 20 content items per lesson
 */
export const linkContentToLesson = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    lessonId: v.id("structuredLessons"),
    triggerType: v.union(
      v.literal("student"),
      v.literal("avatar"),
      v.literal("scheduled")
    ),
    triggerConfig: v.object({
      afterMinutes: v.optional(v.number()),
      keywords: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    // Get current links for this lesson
    const existingLinks = await ctx.db
      .query("contentLessonLinks")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    // Enforce 20-content limit
    if (existingLinks.length >= 20) {
      throw new Error("Maximum of 20 content items per lesson reached");
    }

    // Check if this content is already linked
    const alreadyLinked = existingLinks.some(
      (link) => link.contentId === args.contentId
    );
    if (alreadyLinked) {
      throw new Error("This content is already linked to this lesson");
    }

    // Calculate next order
    const maxOrder = existingLinks.reduce((max, link) => Math.max(max, link.order), 0);

    // Create the link
    const linkId = await ctx.db.insert("contentLessonLinks", {
      contentId: args.contentId,
      lessonId: args.lessonId,
      triggerType: args.triggerType,
      triggerConfig: args.triggerConfig,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    return { success: true, linkId };
  },
});

/**
 * Unlink content from a lesson
 */
export const unlinkContentFromLesson = mutation({
  args: {
    linkId: v.id("contentLessonLinks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.linkId);
    return { success: true };
  },
});

/**
 * Update content-lesson link (change order, trigger, etc.)
 */
export const updateContentLessonLink = mutation({
  args: {
    linkId: v.id("contentLessonLinks"),
    triggerType: v.optional(
      v.union(
        v.literal("student"),
        v.literal("avatar"),
        v.literal("scheduled")
      )
    ),
    triggerConfig: v.optional(
      v.object({
        afterMinutes: v.optional(v.number()),
        keywords: v.optional(v.array(v.string())),
      })
    ),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { linkId, ...updates } = args;
    const validUpdates: Record<string, unknown> = {};

    if (updates.triggerType !== undefined) validUpdates.triggerType = updates.triggerType;
    if (updates.triggerConfig !== undefined) validUpdates.triggerConfig = updates.triggerConfig;
    if (updates.order !== undefined) validUpdates.order = updates.order;

    await ctx.db.patch(linkId, validUpdates);
    return { success: true };
  },
});

// ============================================
// RLM OPTIMIZATION
// ============================================

/**
 * Helper function to extract RLM indexes from markdown content
 * Extracts keywords from headers, bold text, and FAQ patterns
 */
function generateRlmFromMarkdown(content: string, title: string): {
  topicKeywords: string[];
  quickReference: Array<{
    id: string;
    trigger: string;
    response: string;
    expandedResponse?: string;
  }>;
} {
  const topicKeywords: Set<string> = new Set();
  const quickReference: Array<{
    id: string;
    trigger: string;
    response: string;
    expandedResponse?: string;
  }> = [];

  // Extract words from title
  const titleWords = title.toLowerCase().replace(/[^a-zA-Z0-9äöüß\s]/g, "").split(/\s+/);
  titleWords.forEach(word => {
    if (word.length > 2) topicKeywords.add(word);
  });

  // Extract words from headers (# ## ###)
  const headerMatches = Array.from(content.matchAll(/^#{1,3}\s+(.+)$/gm));
  for (const match of headerMatches) {
    const headerWords = match[1].toLowerCase().replace(/[^a-zA-Z0-9äöüß\s]/g, "").split(/\s+/);
    headerWords.forEach(word => {
      if (word.length > 2) topicKeywords.add(word);
    });
  }

  // Extract bold text (**text**)
  const boldMatches = Array.from(content.matchAll(/\*\*([^*]+)\*\*/g));
  for (const match of boldMatches) {
    const boldWords = match[1].toLowerCase().replace(/[^a-zA-Z0-9äöüß\s]/g, "").split(/\s+/);
    boldWords.forEach(word => {
      if (word.length > 2) topicKeywords.add(word);
    });
  }

  // Extract FAQ patterns: **Q:** or Q: followed by answer
  const faqMatches = Array.from(content.matchAll(/(?:\*\*)?Q(?:uestion)?(?:\*\*)?[:\s]+([^\n]+)\n+(?:\*\*)?A(?:nswer)?(?:\*\*)?[:\s]+([^\n]+)/gi));
  let faqIndex = 0;
  for (const match of faqMatches) {
    const question = match[1].trim();
    const answer = match[2].trim();

    // Create trigger from question words
    const questionWords = question.toLowerCase()
      .replace(/[^a-zA-Z0-9äöüß\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2 && !["how", "what", "when", "where", "why", "who", "can", "does", "the", "and", "for"].includes(w));

    if (questionWords.length > 0) {
      quickReference.push({
        id: `qr-auto-${faqIndex++}`,
        trigger: questionWords.slice(0, 4).join("|"),
        response: answer.slice(0, 200),
        expandedResponse: answer.length > 200 ? answer : undefined,
      });
    }
  }

  // Extract table rows with | **Info** | Value | pattern
  const tableMatches = Array.from(content.matchAll(/\|\s*\*\*([^|*]+)\*\*\s*\|\s*([^|]+)\s*\|/g));
  for (const match of tableMatches) {
    const label = match[1].trim().toLowerCase();
    const value = match[2].trim();

    // Add label words as keywords
    label.split(/\s+/).forEach(word => {
      if (word.length > 2) topicKeywords.add(word);
    });

    // Create quick reference for important info
    const importantLabels = ["phone", "email", "address", "website", "price", "cost", "contact", "telefon", "adresse", "preis"];
    if (importantLabels.some(k => label.includes(k))) {
      quickReference.push({
        id: `qr-table-${quickReference.length}`,
        trigger: label.replace(/\s+/g, "|"),
        response: value,
      });
    }
  }

  // Add common search terms based on content patterns
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes("price") || lowerContent.includes("preis") || content.includes("€")) {
    ["price", "preis", "cost", "kosten"].forEach(k => topicKeywords.add(k));
  }
  if (lowerContent.includes("phone") || lowerContent.includes("telefon") || /\+\d{2}/.test(content)) {
    ["phone", "telefon", "call", "anrufen"].forEach(k => topicKeywords.add(k));
  }
  if (lowerContent.includes("email") || content.includes("@")) {
    ["email", "mail", "contact", "kontakt"].forEach(k => topicKeywords.add(k));
  }
  if (lowerContent.includes("address") || lowerContent.includes("adresse")) {
    ["address", "adresse", "location", "standort"].forEach(k => topicKeywords.add(k));
  }

  return {
    topicKeywords: Array.from(topicKeywords),
    quickReference,
  };
}

/**
 * Update existing content with RLM-optimized indexes for fast lookups
 * This enables <10ms response times for common queries
 */
export const updateRlmOptimized = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
    rlmOptimized: v.object({
      grammarIndex: v.optional(v.any()),
      vocabularyByTerm: v.optional(v.any()),
      vocabularyByTermDe: v.optional(v.any()),
      vocabularyByLevel: v.optional(v.any()),
      mistakePatterns: v.optional(v.array(v.object({
        pattern: v.string(),
        mistakeType: v.string(),
        correction: v.string(),
        explanation: v.string(),
      }))),
      topicKeywords: v.optional(v.array(v.string())),
      version: v.optional(v.string()),
      optimizedAt: v.optional(v.number()),
      // Quick reference cards for common questions (FAQ-style)
      quickReference: v.optional(v.array(v.object({
        id: v.string(),
        trigger: v.string(),
        response: v.string(),
        expandedResponse: v.optional(v.string()),
      }))),
      // Exercise index by type
      exerciseIndex: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    await ctx.db.patch(args.contentId, {
      rlmOptimized: args.rlmOptimized,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Auto-generate RLM indexes for markdown content
 * Call this after uploading or updating markdown files
 */
export const autoGenerateRlm = mutation({
  args: {
    contentId: v.id("knowledgeContent"),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    // Only process markdown and text content types
    if (!["markdown", "text"].includes(content.contentType || "")) {
      return { success: false, message: "Not a markdown file" };
    }

    const rlmData = generateRlmFromMarkdown(content.content || "", content.title || "");

    await ctx.db.patch(args.contentId, {
      rlmOptimized: {
        version: "1.0-auto",
        optimizedAt: Date.now(),
        topicKeywords: rlmData.topicKeywords,
        quickReference: rlmData.quickReference,
      },
      updatedAt: Date.now(),
    });

    return {
      success: true,
      keywordsCount: rlmData.topicKeywords.length,
      quickRefCount: rlmData.quickReference.length,
    };
  },
});

/**
 * Add markdown content with auto-generated RLM indexes
 * Use this for uploading markdown knowledge base files
 */
export const addMarkdownWithRlm = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.knowledgeBaseId);
    if (!kb) {
      throw new Error("Knowledge base not found");
    }

    const now = Date.now();
    const sourceId = `md-${now}`;

    // Generate RLM indexes
    const rlmData = generateRlmFromMarkdown(args.content, args.title);

    // Add source to knowledge base
    const newSource = {
      sourceId,
      type: "document" as const,
      name: args.title,
      chunkCount: Math.ceil(args.content.split(/\s+/).length / 500),
      lastUpdated: now,
      priority: kb.sources.length + 1,
    };

    await ctx.db.patch(args.knowledgeBaseId, {
      sources: [...kb.sources, newSource],
      status: "active",
      updatedAt: now,
    });

    // Create content record with RLM
    const contentId = await ctx.db.insert("knowledgeContent", {
      knowledgeBaseId: args.knowledgeBaseId,
      sourceId,
      title: args.title,
      content: args.content,
      contentType: "markdown",
      metadata: {
        wordCount: args.content.split(/\s+/).length,
      },
      rlmOptimized: {
        version: "1.0-auto",
        optimizedAt: now,
        topicKeywords: rlmData.topicKeywords,
        quickReference: rlmData.quickReference,
      },
      processingStatus: "completed",
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      contentId,
      sourceId,
      keywordsCount: rlmData.topicKeywords.length,
      quickRefCount: rlmData.quickReference.length,
    };
  },
});

/**
 * Batch auto-generate RLM for all markdown content in a knowledge base
 */
export const batchGenerateRlm = mutation({
  args: {
    knowledgeBaseId: v.id("knowledgeBases"),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("knowledgeContent")
      .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
      .collect();

    let processed = 0;
    let skipped = 0;

    for (const item of content) {
      // Only process markdown/text without existing RLM
      if (
        ["markdown", "text"].includes(item.contentType || "") &&
        !item.rlmOptimized
      ) {
        const rlmData = generateRlmFromMarkdown(item.content || "", item.title || "");

        await ctx.db.patch(item._id, {
          rlmOptimized: {
            version: "1.0-auto",
            optimizedAt: Date.now(),
            topicKeywords: rlmData.topicKeywords,
            quickReference: rlmData.quickReference,
          },
          updatedAt: Date.now(),
        });
        processed++;
      } else {
        skipped++;
      }
    }

    return { success: true, processed, skipped };
  },
});
