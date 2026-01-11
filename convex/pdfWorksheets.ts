import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate a unique share token
function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// QUERIES
// ============================================

export const listWorksheets = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      )
    ),
    cefrLevel: v.optional(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("grammar"),
        v.literal("vocabulary"),
        v.literal("reading"),
        v.literal("writing"),
        v.literal("mixed")
      )
    ),
  },
  handler: async (ctx, args) => {
    let worksheets = await ctx.db.query("pdfWorksheets").order("desc").collect();

    // Apply filters
    if (args.status) {
      worksheets = worksheets.filter((w) => w.status === args.status);
    }
    if (args.cefrLevel) {
      worksheets = worksheets.filter((w) => w.cefrLevel === args.cefrLevel);
    }
    if (args.category) {
      worksheets = worksheets.filter((w) => w.category === args.category);
    }

    return worksheets;
  },
});

export const getWorksheet = query({
  args: { worksheetId: v.id("pdfWorksheets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.worksheetId);
  },
});

export const getWorksheetByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db
      .query("pdfWorksheets")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!worksheet) {
      return null;
    }

    // Only return published worksheets for public access
    if (worksheet.status !== "published") {
      return null;
    }

    return worksheet;
  },
});

// ============================================
// MUTATIONS
// ============================================

export const createWorksheet = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    cefrLevel: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2"),
      v.literal("C1"),
      v.literal("C2")
    ),
    category: v.union(
      v.literal("grammar"),
      v.literal("vocabulary"),
      v.literal("reading"),
      v.literal("writing"),
      v.literal("mixed")
    ),
    sourceType: v.union(
      v.literal("upload"),
      v.literal("template"),
      v.literal("blank")
    ),
    templateId: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const shareToken = generateShareToken();

    const worksheetId = await ctx.db.insert("pdfWorksheets", {
      title: args.title,
      description: args.description,
      cefrLevel: args.cefrLevel,
      category: args.category,
      sourceType: args.sourceType,
      templateId: args.templateId,
      pageSize: { width: 210, height: 297 }, // A4
      pageCount: args.sourceType === "blank" ? 1 : 0,
      pages: args.sourceType === "blank" ? [{ index: 0 }] : [],
      fields: [],
      gradingConfig: {
        passingScore: 70,
        showCorrectAnswers: true,
      },
      shareToken,
      isPublic: false,
      status: args.sourceType === "upload" ? "processing" : "draft",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    return worksheetId;
  },
});

export const updateWorksheet = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    cefrLevel: v.optional(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2"),
        v.literal("C1"),
        v.literal("C2")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("grammar"),
        v.literal("vocabulary"),
        v.literal("reading"),
        v.literal("writing"),
        v.literal("mixed")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      )
    ),
    isPublic: v.optional(v.boolean()),
    gradingConfig: v.optional(
      v.object({
        passingScore: v.number(),
        showCorrectAnswers: v.boolean(),
        maxAttempts: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { worksheetId, ...updates } = args;
    const worksheet = await ctx.db.get(worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(worksheetId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return worksheetId;
  },
});

export const deleteWorksheet = mutation({
  args: { worksheetId: v.id("pdfWorksheets") },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    // Delete associated storage files
    if (worksheet.originalPdfStorageId) {
      await ctx.storage.delete(worksheet.originalPdfStorageId);
    }
    if (worksheet.renderedPdfStorageId) {
      await ctx.storage.delete(worksheet.renderedPdfStorageId);
    }
    for (const page of worksheet.pages) {
      if (page.imageStorageId) {
        await ctx.storage.delete(page.imageStorageId);
      }
    }

    // Delete analytics
    const analytics = await ctx.db
      .query("pdfWorksheetAnalytics")
      .withIndex("by_worksheet", (q) => q.eq("worksheetId", args.worksheetId))
      .collect();
    for (const analytic of analytics) {
      await ctx.db.delete(analytic._id);
    }

    // Delete the worksheet
    await ctx.db.delete(args.worksheetId);

    return { success: true };
  },
});

// ============================================
// FIELD MANAGEMENT
// ============================================

export const addField = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    field: v.object({
      id: v.string(),
      pageIndex: v.number(),
      type: v.union(
        v.literal("text_input"),
        v.literal("multiple_choice"),
        v.literal("checkbox"),
        v.literal("matching"),
        v.literal("drag_drop"),
        v.literal("long_text")
      ),
      position: v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
      }),
      label: v.optional(v.string()),
      placeholder: v.optional(v.string()),
      required: v.optional(v.boolean()),
      correctAnswers: v.array(v.string()),
      caseSensitive: v.optional(v.boolean()),
      points: v.optional(v.number()),
      config: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    const updatedFields = [...worksheet.fields, args.field];

    await ctx.db.patch(args.worksheetId, {
      fields: updatedFields,
      updatedAt: Date.now(),
    });

    return args.field.id;
  },
});

export const updateField = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    fieldId: v.string(),
    updates: v.object({
      position: v.optional(
        v.object({
          x: v.number(),
          y: v.number(),
          width: v.number(),
          height: v.number(),
        })
      ),
      label: v.optional(v.string()),
      placeholder: v.optional(v.string()),
      required: v.optional(v.boolean()),
      correctAnswers: v.optional(v.array(v.string())),
      caseSensitive: v.optional(v.boolean()),
      points: v.optional(v.number()),
      config: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    const updatedFields = worksheet.fields.map((field) => {
      if (field.id === args.fieldId) {
        return { ...field, ...args.updates };
      }
      return field;
    });

    await ctx.db.patch(args.worksheetId, {
      fields: updatedFields,
      updatedAt: Date.now(),
    });

    return args.fieldId;
  },
});

export const deleteField = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    fieldId: v.string(),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    const updatedFields = worksheet.fields.filter(
      (field) => field.id !== args.fieldId
    );

    await ctx.db.patch(args.worksheetId, {
      fields: updatedFields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// FILE UPLOAD
// ============================================

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveUploadedPdf = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    storageId: v.id("_storage"),
    pageCount: v.number(),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    // Create page entries
    const pages = Array.from({ length: args.pageCount }, (_, i) => ({
      index: i,
    }));

    await ctx.db.patch(args.worksheetId, {
      originalPdfStorageId: args.storageId,
      pageCount: args.pageCount,
      pages,
      status: "draft" as const,
      updatedAt: Date.now(),
    });

    return args.worksheetId;
  },
});

export const savePageImage = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    pageIndex: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    const updatedPages = worksheet.pages.map((page) => {
      if (page.index === args.pageIndex) {
        return { ...page, imageStorageId: args.storageId };
      }
      return page;
    });

    await ctx.db.patch(args.worksheetId, {
      pages: updatedPages,
      updatedAt: Date.now(),
    });

    return args.worksheetId;
  },
});

// Get URL for a storage ID
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// ============================================
// COLLABORATION (Field-level locking)
// ============================================

export const acquireLock = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    userId: v.id("users"),
    fieldIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    // Check if already locked by another user
    if (worksheet.lockedBy && worksheet.lockedBy !== args.userId) {
      // Check if lock is stale (> 5 minutes)
      const lockAge = Date.now() - (worksheet.lockedAt || 0);
      if (lockAge < 5 * 60 * 1000) {
        throw new Error("Worksheet is locked by another user");
      }
    }

    await ctx.db.patch(args.worksheetId, {
      lockedBy: args.userId,
      lockedAt: Date.now(),
      lockedFields: args.fieldIds,
    });

    return { success: true };
  },
});

export const releaseLock = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    // Only release if locked by this user
    if (worksheet.lockedBy === args.userId) {
      await ctx.db.patch(args.worksheetId, {
        lockedBy: undefined,
        lockedAt: undefined,
        lockedFields: undefined,
      });
    }

    return { success: true };
  },
});

// ============================================
// OCR + AI STRUCTURING WORKFLOW
// ============================================

/**
 * Update the processing stage of a worksheet
 */
export const updateProcessingStage = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    processingStage: v.union(
      v.literal("uploading"),
      v.literal("ocr_extracting"),
      v.literal("ai_structuring"),
      v.literal("ready"),
      v.literal("generating_pdf"),
      v.literal("failed")
    ),
    processingError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    await ctx.db.patch(args.worksheetId, {
      processingStage: args.processingStage,
      processingError: args.processingError,
      // Also update status for backwards compatibility
      status: args.processingStage === "ready" ? "draft" :
              args.processingStage === "failed" ? "processing" :
              worksheet.status,
      updatedAt: Date.now(),
    });

    return args.worksheetId;
  },
});

/**
 * Save raw OCR text extracted from PDF
 */
export const saveOcrText = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    ocrText: v.string(),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    await ctx.db.patch(args.worksheetId, {
      ocrText: args.ocrText,
      updatedAt: Date.now(),
    });

    return args.worksheetId;
  },
});

/**
 * Save structured JSON content from AI processing
 */
export const saveJsonContent = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    jsonContent: v.any(), // WorksheetContent
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    await ctx.db.patch(args.worksheetId, {
      jsonContent: args.jsonContent,
      processingStage: "ready",
      status: "draft",
      updatedAt: Date.now(),
    });

    return args.worksheetId;
  },
});

/**
 * Update JSON content (for editing)
 */
export const updateJsonContent = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    jsonContent: v.any(), // WorksheetContent
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    await ctx.db.patch(args.worksheetId, {
      jsonContent: args.jsonContent,
      updatedAt: Date.now(),
    });

    return args.worksheetId;
  },
});

/**
 * Save rendered PDF storage ID
 */
export const saveRenderedPdf = mutation({
  args: {
    worksheetId: v.id("pdfWorksheets"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const worksheet = await ctx.db.get(args.worksheetId);
    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    await ctx.db.patch(args.worksheetId, {
      renderedPdfStorageId: args.storageId,
      processingStage: "ready",
      updatedAt: Date.now(),
    });

    return args.worksheetId;
  },
});
