import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// TYPES
// ============================================

const cefrLevelValidator = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
  v.literal("C1"),
  v.literal("C2")
);

const sectionTypeValidator = v.union(
  v.literal("reading"),
  v.literal("grammar"),
  v.literal("vocabulary"),
  v.literal("listening"),
  v.literal("writing"),
  v.literal("speaking")
);

const deliveryModeValidator = v.union(
  v.literal("web_only"),
  v.literal("audio_avatar"),
  v.literal("video_avatar")
);

const ownershipTypeValidator = v.union(
  v.literal("platform"),
  v.literal("company"),
  v.literal("group")
);

const feedbackLevelValidator = v.union(
  v.literal("none"),
  v.literal("score_only"),
  v.literal("personalized"),
  v.literal("learning_path"),
  v.literal("full_debrief")
);

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================
// QUERIES
// ============================================

// List templates accessible to current user
export const listTemplates = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    ownershipType: v.optional(ownershipTypeValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Build query based on filters
    let templates;
    if (args.status) {
      templates = await ctx.db
        .query("entryTestTemplates")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      templates = await ctx.db.query("entryTestTemplates").collect();
    }

    // Filter by ownership type if specified
    if (args.ownershipType) {
      templates = templates.filter((t) => t.ownership.type === args.ownershipType);
    }

    // For non-admins, filter to templates they have access to
    if (user.role !== "admin") {
      // Get student's company and group memberships
      const student = await ctx.db
        .query("students")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (student) {
        const groupMemberships = await ctx.db
          .query("groupMembers")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        const groupIds = groupMemberships.map((m) => m.groupId);
        const groups = await Promise.all(groupIds.map((id) => ctx.db.get(id)));
        const companyIds = groups
          .filter((g) => g !== null)
          .map((g) => g!.companyId);

        templates = templates.filter((t) => {
          // Platform templates are always visible
          if (t.ownership.type === "platform" && t.status === "published") {
            return true;
          }
          // Company templates visible to company members
          if (
            t.ownership.type === "company" &&
            t.ownership.companyId &&
            companyIds.includes(t.ownership.companyId)
          ) {
            return true;
          }
          // Group templates visible to group members
          if (
            t.ownership.type === "group" &&
            t.ownership.groupId &&
            groupIds.includes(t.ownership.groupId)
          ) {
            return true;
          }
          return false;
        });
      } else {
        // No student profile - only show published platform templates
        templates = templates.filter(
          (t) => t.ownership.type === "platform" && t.status === "published"
        );
      }
    }

    // Sort by creation date descending
    templates.sort((a, b) => b.createdAt - a.createdAt);

    return templates;
  },
});

// Get a single template by ID
export const getTemplate = query({
  args: { templateId: v.id("entryTestTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      return null;
    }

    // Get avatar details if configured
    let avatar = null;
    if (template.deliveryConfig.avatarId) {
      avatar = await ctx.db.get(template.deliveryConfig.avatarId);
    }

    return {
      ...template,
      avatar,
    };
  },
});

// Get template with question counts per section
export const getTemplateWithQuestionCounts = query({
  args: { templateId: v.id("entryTestTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      return null;
    }

    // Count available questions for each section
    const sectionsWithCounts = await Promise.all(
      template.sections.map(async (section) => {
        // Get approved questions matching this section's filter
        const questions = await ctx.db
          .query("entryTestQuestionBank")
          .withIndex("by_curation_status", (q) => q.eq("curationStatus", "approved"))
          .collect();

        const matchingQuestions = questions.filter((q) => {
          // Check type matches
          if (!section.questionBankFilter.types.includes(q.type)) {
            return false;
          }
          // Check level matches
          if (!section.questionBankFilter.levels.includes(q.cefrLevel)) {
            return false;
          }
          // Check tags if specified
          if (section.questionBankFilter.tags && section.questionBankFilter.tags.length > 0) {
            const hasRequiredTag = section.questionBankFilter.tags.some((tag) =>
              q.tags.includes(tag)
            );
            if (!hasRequiredTag) {
              return false;
            }
          }
          return true;
        });

        return {
          ...section,
          availableQuestionCount: matchingQuestions.length,
          hasEnoughQuestions: matchingQuestions.length >= section.questionCount,
        };
      })
    );

    return {
      ...template,
      sections: sectionsWithCounts,
    };
  },
});

// Get template by slug
export const getTemplateBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entryTestTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create a new test template
export const createTemplate = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    targetLevelRange: v.object({
      min: cefrLevelValidator,
      max: cefrLevelValidator,
    }),
    ownershipType: ownershipTypeValidator,
    companyId: v.optional(v.id("companies")),
    groupId: v.optional(v.id("groups")),
    parentTemplateId: v.optional(v.id("entryTestTemplates")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check authorization
    if (args.ownershipType === "platform" && user.role !== "admin") {
      throw new Error("Only admins can create platform templates");
    }

    // Generate unique slug
    let slug = generateSlug(args.title);
    let existing = await ctx.db
      .query("entryTestTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    let counter = 1;
    while (existing) {
      slug = `${generateSlug(args.title)}-${counter}`;
      existing = await ctx.db
        .query("entryTestTemplates")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      counter++;
    }

    const now = Date.now();

    const templateId = await ctx.db.insert("entryTestTemplates", {
      title: args.title,
      slug,
      description: args.description,
      targetLevelRange: args.targetLevelRange,
      ownership: {
        type: args.ownershipType,
        companyId: args.companyId,
        groupId: args.groupId,
        parentTemplateId: args.parentTemplateId,
      },
      sections: [],
      deliveryConfig: {
        minimumMode: "web_only",
        allowUpgrade: true,
      },
      feedbackConfig: {
        showScoreImmediately: true,
        avatarFeedbackLevel: "personalized",
        showSectionBreakdown: true,
        showCorrectAnswers: false,
      },
      status: "draft",
      version: 1,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

// Update template basic info
export const updateTemplate = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetLevelRange: v.optional(
      v.object({
        min: cefrLevelValidator,
        max: cefrLevelValidator,
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
      // Update slug if title changes
      let slug = generateSlug(args.title);
      let existing = await ctx.db
        .query("entryTestTemplates")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (existing && existing._id !== args.templateId) {
        let counter = 1;
        while (existing && existing._id !== args.templateId) {
          slug = `${generateSlug(args.title)}-${counter}`;
          existing = await ctx.db
            .query("entryTestTemplates")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
          counter++;
        }
      }
      updates.slug = slug;
    }

    if (args.description !== undefined) {
      updates.description = args.description;
    }

    if (args.targetLevelRange !== undefined) {
      updates.targetLevelRange = args.targetLevelRange;
    }

    await ctx.db.patch(args.templateId, updates);

    return { success: true };
  },
});

// Add a section to template
export const addSectionToTemplate = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    section: v.object({
      id: v.string(),
      type: sectionTypeValidator,
      title: v.string(),
      instructions_en: v.string(),
      instructions_de: v.optional(v.string()),
      questionCount: v.number(),
      questionBankFilter: v.object({
        types: v.array(v.string()),
        levels: v.array(v.string()),
        tags: v.optional(v.array(v.string())),
      }),
      selectionMode: v.optional(v.union(v.literal("auto"), v.literal("manual"))),
      selectedQuestionIds: v.optional(v.array(v.id("entryTestQuestionBank"))),
      weight: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check if section ID already exists
    if (template.sections.some((s) => s.id === args.section.id)) {
      throw new Error("Section with this ID already exists");
    }

    // Validate manual selection if provided
    if (args.section.selectionMode === "manual" && args.section.selectedQuestionIds) {
      // Verify all questions exist and are approved
      for (const questionId of args.section.selectedQuestionIds) {
        const question = await ctx.db.get(questionId);
        if (!question) {
          throw new Error(`Question ${questionId} not found`);
        }
        if (question.curationStatus !== "approved") {
          throw new Error(`Question ${questionId} is not approved`);
        }
        // Verify question type matches section's allowed types
        if (!args.section.questionBankFilter.types.includes(question.type)) {
          throw new Error(`Question ${questionId} type does not match section filter`);
        }
      }
    }

    // Add section with order
    const newSection = {
      ...args.section,
      order: template.sections.length,
      // Auto-set questionCount for manual mode
      questionCount: args.section.selectionMode === "manual" && args.section.selectedQuestionIds
        ? args.section.selectedQuestionIds.length
        : args.section.questionCount,
    };

    await ctx.db.patch(args.templateId, {
      sections: [...template.sections, newSection],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update a section in template
export const updateSection = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    sectionId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      instructions_en: v.optional(v.string()),
      instructions_de: v.optional(v.string()),
      questionCount: v.optional(v.number()),
      questionBankFilter: v.optional(
        v.object({
          types: v.array(v.string()),
          levels: v.array(v.string()),
          tags: v.optional(v.array(v.string())),
        })
      ),
      selectionMode: v.optional(v.union(v.literal("auto"), v.literal("manual"))),
      selectedQuestionIds: v.optional(v.array(v.id("entryTestQuestionBank"))),
      weight: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const sectionIndex = template.sections.findIndex((s) => s.id === args.sectionId);
    if (sectionIndex === -1) {
      throw new Error("Section not found");
    }

    const currentSection = template.sections[sectionIndex];
    const newSelectionMode = args.updates.selectionMode ?? currentSection.selectionMode ?? "auto";
    const newSelectedQuestionIds = args.updates.selectedQuestionIds ?? currentSection.selectedQuestionIds;
    const questionBankFilter = args.updates.questionBankFilter ?? currentSection.questionBankFilter;

    // Validate manual selection if provided
    if (newSelectionMode === "manual" && newSelectedQuestionIds) {
      // Verify all questions exist and are approved
      for (const questionId of newSelectedQuestionIds) {
        const question = await ctx.db.get(questionId);
        if (!question) {
          throw new Error(`Question ${questionId} not found`);
        }
        if (question.curationStatus !== "approved") {
          throw new Error(`Question ${questionId} is not approved`);
        }
        // Verify question type matches section's allowed types
        if (!questionBankFilter.types.includes(question.type)) {
          throw new Error(`Question ${questionId} type does not match section filter`);
        }
      }
    }

    // Build updated section
    const updatedSection = {
      ...currentSection,
      ...args.updates,
    };

    // Auto-set questionCount for manual mode
    if (newSelectionMode === "manual" && newSelectedQuestionIds) {
      updatedSection.questionCount = newSelectedQuestionIds.length;
    }

    const updatedSections = [...template.sections];
    updatedSections[sectionIndex] = updatedSection;

    await ctx.db.patch(args.templateId, {
      sections: updatedSections,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Remove a section from template
export const removeSection = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    sectionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const updatedSections = template.sections
      .filter((s) => s.id !== args.sectionId)
      .map((s, index) => ({ ...s, order: index }));

    await ctx.db.patch(args.templateId, {
      sections: updatedSections,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Reorder sections
export const reorderSections = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    sectionIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Validate all section IDs exist
    const existingIds = new Set(template.sections.map((s) => s.id));
    for (const id of args.sectionIds) {
      if (!existingIds.has(id)) {
        throw new Error(`Section ${id} not found`);
      }
    }

    // Reorder sections
    const sectionMap = new Map(template.sections.map((s) => [s.id, s]));
    const reorderedSections = args.sectionIds.map((id, index) => ({
      ...sectionMap.get(id)!,
      order: index,
    }));

    await ctx.db.patch(args.templateId, {
      sections: reorderedSections,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update delivery configuration
export const updateDeliveryConfig = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    deliveryConfig: v.object({
      minimumMode: deliveryModeValidator,
      allowUpgrade: v.boolean(),
      avatarId: v.optional(v.id("avatars")),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      deliveryConfig: args.deliveryConfig,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update audio configuration
export const updateAudioConfig = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    audioConfig: v.object({
      maxReplays: v.number(),
      voiceId: v.optional(v.string()),
      speed: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      audioConfig: args.audioConfig,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update feedback configuration
export const updateFeedbackConfig = mutation({
  args: {
    templateId: v.id("entryTestTemplates"),
    feedbackConfig: v.object({
      showScoreImmediately: v.boolean(),
      avatarFeedbackLevel: feedbackLevelValidator,
      showSectionBreakdown: v.boolean(),
      showCorrectAnswers: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      feedbackConfig: args.feedbackConfig,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Publish template
export const publishTemplate = mutation({
  args: { templateId: v.id("entryTestTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Validate template has at least one section
    if (template.sections.length === 0) {
      throw new Error("Template must have at least one section");
    }

    // Validate section weights sum to 1
    const totalWeight = template.sections.reduce((sum, s) => sum + s.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      throw new Error("Section weights must sum to 1");
    }

    await ctx.db.patch(args.templateId, {
      status: "published",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Archive template
export const archiveTemplate = mutation({
  args: { templateId: v.id("entryTestTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Derive a new template from an existing one
export const deriveTemplate = mutation({
  args: {
    sourceTemplateId: v.id("entryTestTemplates"),
    ownershipType: v.union(v.literal("company"), v.literal("group")),
    companyId: v.optional(v.id("companies")),
    groupId: v.optional(v.id("groups")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const sourceTemplate = await ctx.db.get(args.sourceTemplateId);
    if (!sourceTemplate) {
      throw new Error("Source template not found");
    }

    // Generate unique slug
    let slug = generateSlug(args.title);
    let existing = await ctx.db
      .query("entryTestTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    let counter = 1;
    while (existing) {
      slug = `${generateSlug(args.title)}-${counter}`;
      existing = await ctx.db
        .query("entryTestTemplates")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      counter++;
    }

    const now = Date.now();

    const newTemplateId = await ctx.db.insert("entryTestTemplates", {
      title: args.title,
      slug,
      description: sourceTemplate.description,
      targetLevelRange: sourceTemplate.targetLevelRange,
      ownership: {
        type: args.ownershipType,
        companyId: args.companyId,
        groupId: args.groupId,
        parentTemplateId: args.sourceTemplateId,
      },
      sections: sourceTemplate.sections,
      deliveryConfig: sourceTemplate.deliveryConfig,
      audioConfig: sourceTemplate.audioConfig,
      feedbackConfig: sourceTemplate.feedbackConfig,
      status: "draft",
      version: 1,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return newTemplateId;
  },
});

// Delete template (only drafts)
export const deleteTemplate = mutation({
  args: { templateId: v.id("entryTestTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    if (template.status !== "draft") {
      throw new Error("Only draft templates can be deleted");
    }

    await ctx.db.delete(args.templateId);

    return { success: true };
  },
});
