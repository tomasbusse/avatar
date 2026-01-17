import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// SITE CONFIG
// ============================================

export const getSiteConfig = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return config?.value ?? null;
  },
});

export const setSiteConfig = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("siteConfig", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
      });
    }
    return { success: true };
  },
});

// Get all site config for admin page
export const getFullSiteConfig = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("siteConfig").collect();
    const configMap: Record<string, any> = {};
    for (const config of configs) {
      configMap[config.key] = config.value;
    }
    return {
      heroAvatarId: configMap["landing_hero_avatar"] || null,
      heroAvatarIdEn: configMap["landing_hero_avatar_en"] || null,
      heroAvatarIdDe: configMap["landing_hero_avatar_de"] || null,
      contactInfo: configMap["contact_info"] || null,
    };
  },
});

// Get contact information for the contact page
export const getContactInfo = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "contact_info"))
      .first();

    // Return stored config or defaults
    return config?.value || {
      // Business info
      email: "james@englisch-lehrer.com",
      phone: "+49 511 47 39 339",
      hours: {
        en: "Monday – Friday: 9:00 – 18:00",
        de: "Montag – Freitag: 9:00 – 18:00",
      },
      // Locations
      locations: [
        {
          name: { en: "Hannover Office", de: "Büro Hannover" },
          address: "Im Werkhof, Schaufelder Straße 11, 30167 Hannover",
          isPrimary: true,
        },
        {
          name: { en: "Berlin Office", de: "Büro Berlin" },
          address: "Friedrichstraße 123, 10117 Berlin",
          isPrimary: false,
        },
      ],
      // Email personalization
      emailSettings: {
        autoReplyEnabled: true,
        notificationEmails: ["james@englisch-lehrer.com"],
        personalizedMessages: {
          en: {
            thankYou: "Thank you for your message! We have received your inquiry and will get back to you within 24 hours.",
            closing: "In the meantime, you can learn more about our services on our website.",
          },
          de: {
            thankYou: "Vielen Dank für Ihre Nachricht! Wir haben Ihre Anfrage erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden.",
            closing: "In der Zwischenzeit können Sie mehr über unsere Dienstleistungen auf unserer Website erfahren.",
          },
        },
      },
    };
  },
});

// Update contact information (admin function)
export const updateContactInfo = mutation({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    hours: v.optional(v.object({
      en: v.string(),
      de: v.string(),
    })),
    locations: v.optional(v.array(v.object({
      name: v.object({ en: v.string(), de: v.string() }),
      address: v.string(),
      isPrimary: v.optional(v.boolean()),
    }))),
    emailSettings: v.optional(v.object({
      autoReplyEnabled: v.boolean(),
      notificationEmails: v.array(v.string()),
      personalizedMessages: v.object({
        en: v.object({ thankYou: v.string(), closing: v.string() }),
        de: v.object({ thankYou: v.string(), closing: v.string() }),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "contact_info"))
      .first();

    const currentValue = existing?.value || {};
    const newValue = {
      ...currentValue,
      ...args,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: newValue,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("siteConfig", {
        key: "contact_info",
        value: newValue,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Update site config from admin
export const updateSiteConfig = mutation({
  args: {
    heroAvatarId: v.optional(v.id("avatars")),
    heroAvatarIdEn: v.optional(v.id("avatars")),
    heroAvatarIdDe: v.optional(v.id("avatars")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Helper to upsert a config key
    const upsertConfig = async (key: string, value: any) => {
      const existing = await ctx.db
        .query("siteConfig")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("siteConfig", {
          key,
          value,
          updatedAt: now,
        });
      }
    };

    // Update generic avatar (for backward compatibility)
    if (args.heroAvatarId) {
      await upsertConfig("landing_hero_avatar", args.heroAvatarId);
    }

    // Update English-specific avatar
    if (args.heroAvatarIdEn) {
      await upsertConfig("landing_hero_avatar_en", args.heroAvatarIdEn);
    }

    // Update German-specific avatar
    if (args.heroAvatarIdDe) {
      await upsertConfig("landing_hero_avatar_de", args.heroAvatarIdDe);
    }

    return { success: true };
  },
});

// ============================================
// EMAIL CONFIGURATION
// ============================================

const DEFAULT_EMAIL_CONFIG = {
  replyMode: "ai_assisted" as const, // "disabled" | "manual" | "ai_assisted" | "auto_ai"
  aiSettings: {
    enabled: true,
    model: "claude-opus-4-5-20251101",
    customPrompt: `You are James Simmonds, the founder of Simmonds Language Services (SLS), a professional language training company based in Hannover, Germany since 1999. You're writing personalized email responses to contact form inquiries.

ABOUT SLS:
- 25+ years of experience in corporate language training
- Native English speakers from UK, USA, Australia, and South Africa
- Based in Hannover and Berlin, serving all of Germany
- Services: Business English, German for Expats, Copyediting & Translation
- Training formats: In-person, online, hybrid
- Clients: Major corporations like VW, Continental, TUI, Deutsche Bahn, Rossmann

YOUR COMMUNICATION STYLE:
- Professional yet warm and approachable
- Direct and helpful, never salesy or pushy
- Knowledgeable about language learning challenges
- Genuine interest in helping people improve their language skills

RESPONSE GUIDELINES:
1. Thank them personally for reaching out
2. Address their specific question or need directly
3. Provide relevant information about how SLS can help
4. Suggest a clear next step (call, trial lesson, etc.)
5. Keep it concise (2-4 short paragraphs)
6. End with a personal sign-off

IMPORTANT:
- Match the language of the inquiry (German for German messages, English for English)
- Never be overly formal or stiff
- Reference specific details from their message`,
    temperature: 0.7,
    maxTokens: 1024,
  },
  knowledgeBase: {
    includeFaqs: true,
    defaultKnowledgeBaseIds: [] as string[],
    includeServices: true,
  },
  notifications: {
    notifyOnNewSubmission: true,
    notificationEmails: ["james@englisch-lehrer.com"],
    notifyOnAutoReply: false,
  },
  templates: {
    en: {
      subjectPrefix: "Re: ",
      greeting: "Dear {name},",
      closing: "Best regards,",
      signature: "James Simmonds\nSimmonds Language Services",
    },
    de: {
      subjectPrefix: "Re: ",
      greeting: "Liebe/r {name},",
      closing: "Mit freundlichen Grüßen,",
      signature: "James Simmonds\nSimmonds Language Services",
    },
  },
  rateLimits: {
    maxAutoRepliesPerHour: 20,
    cooldownMinutes: 5,
  },
};

// Get email configuration
export const getEmailConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "email_config"))
      .first();
    return config?.value ?? DEFAULT_EMAIL_CONFIG;
  },
});

// Update email configuration
export const updateEmailConfig = mutation({
  args: {
    config: v.object({
      replyMode: v.union(
        v.literal("disabled"),
        v.literal("manual"),
        v.literal("ai_assisted"),
        v.literal("auto_ai")
      ),
      aiSettings: v.object({
        enabled: v.boolean(),
        model: v.string(),
        customPrompt: v.string(),
        temperature: v.number(),
        maxTokens: v.number(),
      }),
      knowledgeBase: v.object({
        includeFaqs: v.boolean(),
        defaultKnowledgeBaseIds: v.array(v.string()),
        includeServices: v.boolean(),
      }),
      notifications: v.object({
        notifyOnNewSubmission: v.boolean(),
        notificationEmails: v.array(v.string()),
        notifyOnAutoReply: v.boolean(),
      }),
      templates: v.object({
        en: v.object({
          subjectPrefix: v.string(),
          greeting: v.string(),
          closing: v.string(),
          signature: v.string(),
        }),
        de: v.object({
          subjectPrefix: v.string(),
          greeting: v.string(),
          closing: v.string(),
          signature: v.string(),
        }),
      }),
      rateLimits: v.object({
        maxAutoRepliesPerHour: v.number(),
        cooldownMinutes: v.number(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "email_config"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.config,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("siteConfig", {
        key: "email_config",
        value: args.config,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get landing page avatar configuration (locale-aware)
export const getLandingAvatar = query({
  args: {
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const locale = args.locale || "en";
    const otherLocale = locale === "en" ? "de" : "en";

    // Try locale-specific avatar first (e.g., landing_hero_avatar_en or landing_hero_avatar_de)
    const localeConfig = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", `landing_hero_avatar_${locale}`))
      .first();

    if (localeConfig?.value) {
      const avatar = await ctx.db
        .query("avatars")
        .filter((q) => q.eq(q.field("_id"), localeConfig.value))
        .first();
      if (avatar) return avatar;
    }

    // Try other locale's avatar as fallback (so DE uses EN avatar if DE not configured)
    const otherLocaleConfig = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", `landing_hero_avatar_${otherLocale}`))
      .first();

    if (otherLocaleConfig?.value) {
      const avatar = await ctx.db
        .query("avatars")
        .filter((q) => q.eq(q.field("_id"), otherLocaleConfig.value))
        .first();
      if (avatar) return avatar;
    }

    // Fall back to generic config (for backward compatibility)
    const config = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "landing_hero_avatar"))
      .first();

    if (config?.value) {
      const avatar = await ctx.db
        .query("avatars")
        .filter((q) => q.eq(q.field("_id"), config.value))
        .first();
      if (avatar) return avatar;
    }

    // Return first active avatar as final fallback
    const avatar = await ctx.db
      .query("avatars")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    return avatar;
  },
});

// Default landing avatar config
const DEFAULT_LANDING_AVATAR_CONFIG = {
  sessionTimeoutSeconds: 300, // 5 minutes default
  warningAtSeconds: 60, // Show warning at 1 minute remaining
  allowRestart: true, // Allow user to restart after timeout
  showContactFormOnStop: true, // Show contact form when stopped
};

// Get landing avatar session config
export const getLandingAvatarConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "landing_avatar_config"))
      .first();
    return config?.value ?? DEFAULT_LANDING_AVATAR_CONFIG;
  },
});

// Update landing avatar session config
export const updateLandingAvatarConfig = mutation({
  args: {
    sessionTimeoutSeconds: v.optional(v.number()),
    warningAtSeconds: v.optional(v.number()),
    allowRestart: v.optional(v.boolean()),
    showContactFormOnStop: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "landing_avatar_config"))
      .first();

    const currentValue = existing?.value ?? DEFAULT_LANDING_AVATAR_CONFIG;
    const newValue = {
      ...currentValue,
      ...Object.fromEntries(
        Object.entries(args).filter(([_, v]) => v !== undefined)
      ),
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: newValue,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("siteConfig", {
        key: "landing_avatar_config",
        value: newValue,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ============================================
// LANDING CONTENT
// ============================================

export const getPageContent = query({
  args: {
    locale: v.string(),
    page: v.string(),
  },
  handler: async (ctx, args) => {
    const sections = await ctx.db
      .query("landingContent")
      .withIndex("by_locale_page", (q) =>
        q.eq("locale", args.locale).eq("page", args.page)
      )
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // Sort by order
    sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Return as object keyed by section
    const contentMap: Record<string, any> = {};
    for (const section of sections) {
      contentMap[section.section] = section.content;
    }
    return contentMap;
  },
});

export const getSectionContent = query({
  args: {
    locale: v.string(),
    page: v.string(),
    section: v.string(),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("landingContent")
      .withIndex("by_locale_page_section", (q) =>
        q
          .eq("locale", args.locale)
          .eq("page", args.page)
          .eq("section", args.section)
      )
      .first();

    return content?.content ?? null;
  },
});

export const upsertSectionContent = mutation({
  args: {
    locale: v.string(),
    page: v.string(),
    section: v.string(),
    content: v.any(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("landingContent")
      .withIndex("by_locale_page_section", (q) =>
        q
          .eq("locale", args.locale)
          .eq("page", args.page)
          .eq("section", args.section)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        order: args.order ?? existing.order,
        updatedAt: now,
      });
      return { id: existing._id };
    } else {
      const id = await ctx.db.insert("landingContent", {
        locale: args.locale,
        page: args.page,
        section: args.section,
        content: args.content,
        order: args.order ?? 0,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      });
      return { id };
    }
  },
});

// Get all sections for a page (admin - includes unpublished)
export const getPageSectionsAdmin = query({
  args: {
    locale: v.string(),
    page: v.string(),
  },
  handler: async (ctx, args) => {
    const sections = await ctx.db
      .query("landingContent")
      .withIndex("by_locale_page", (q) =>
        q.eq("locale", args.locale).eq("page", args.page)
      )
      .collect();

    // Sort by order
    sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sections;
  },
});

// Get all pages list for admin
export const getAllPages = query({
  args: { locale: v.string() },
  handler: async (ctx, args) => {
    const allContent = await ctx.db
      .query("landingContent")
      .withIndex("by_locale_page", (q) => q.eq("locale", args.locale))
      .collect();

    // Get unique pages
    const pages = new Set<string>();
    for (const content of allContent) {
      pages.add(content.page);
    }

    // Return page info
    const pageList = Array.from(pages).map((page) => {
      const pageSections = allContent.filter((c) => c.page === page);
      return {
        page,
        sectionCount: pageSections.length,
        lastUpdated: Math.max(...pageSections.map((s) => s.updatedAt)),
      };
    });

    return pageList;
  },
});

// Delete a section
export const deleteSection = mutation({
  args: { id: v.id("landingContent") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Update section published status
export const updateSectionStatus = mutation({
  args: {
    id: v.id("landingContent"),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// ============================================
// FAQ
// ============================================

export const getFaqs = query({
  args: {
    locale: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let faqs;

    if (args.category) {
      faqs = await ctx.db
        .query("landingFaq")
        .withIndex("by_locale_category", (q) =>
          q.eq("locale", args.locale).eq("category", args.category!)
        )
        .filter((q) => q.eq(q.field("isPublished"), true))
        .collect();
    } else {
      faqs = await ctx.db
        .query("landingFaq")
        .withIndex("by_locale", (q) => q.eq("locale", args.locale))
        .filter((q) => q.eq(q.field("isPublished"), true))
        .collect();
    }

    // Sort by order
    faqs.sort((a, b) => a.order - b.order);
    return faqs;
  },
});

export const createFaq = mutation({
  args: {
    locale: v.string(),
    question: v.string(),
    answer: v.string(),
    category: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("landingFaq", {
      locale: args.locale,
      question: args.question,
      answer: args.answer,
      category: args.category,
      order: args.order ?? 0,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

export const updateFaq = mutation({
  args: {
    id: v.id("landingFaq"),
    question: v.optional(v.string()),
    answer: v.optional(v.string()),
    category: v.optional(v.string()),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const deleteFaq = mutation({
  args: { id: v.id("landingFaq") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================
// TESTIMONIALS
// ============================================

export const updateTestimonial = mutation({
  args: {
    id: v.id("landingTestimonials"),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    quote: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    rating: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, featured, ...updates } = args;
    const patchData: any = {
      ...updates,
      updatedAt: Date.now(),
    };
    if (featured !== undefined) {
      patchData.isFeatured = featured;
    }
    await ctx.db.patch(id, patchData);
    return { success: true };
  },
});

export const deleteTestimonial = mutation({
  args: { id: v.id("landingTestimonials") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const getTestimonials = query({
  args: {
    locale: v.string(),
    featuredOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let testimonials;

    if (args.featuredOnly) {
      testimonials = await ctx.db
        .query("landingTestimonials")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .filter((q) =>
          q.and(
            q.eq(q.field("locale"), args.locale),
            q.eq(q.field("isPublished"), true)
          )
        )
        .collect();
    } else {
      testimonials = await ctx.db
        .query("landingTestimonials")
        .withIndex("by_locale", (q) => q.eq("locale", args.locale))
        .filter((q) => q.eq(q.field("isPublished"), true))
        .collect();
    }

    // Sort by order
    testimonials.sort((a, b) => a.order - b.order);
    return testimonials;
  },
});

export const createTestimonial = mutation({
  args: {
    locale: v.string(),
    name: v.string(),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    quote: v.string(),
    imageUrl: v.optional(v.string()),
    rating: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("landingTestimonials", {
      locale: args.locale,
      name: args.name,
      company: args.company,
      role: args.role,
      quote: args.quote,
      imageUrl: args.imageUrl,
      rating: args.rating,
      isFeatured: args.isFeatured ?? false,
      order: args.order ?? 0,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

// ============================================
// BLOG
// ============================================

export const getBlogPosts = query({
  args: {
    locale: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let posts;
    const status = args.status ?? "published";

    if (args.category) {
      posts = await ctx.db
        .query("blogPosts")
        .withIndex("by_locale_category", (q) =>
          q.eq("locale", args.locale).eq("category", args.category!)
        )
        .filter((q) => q.eq(q.field("status"), status))
        .collect();
    } else {
      posts = await ctx.db
        .query("blogPosts")
        .withIndex("by_locale_status", (q) =>
          q.eq("locale", args.locale).eq("status", status as any)
        )
        .collect();
    }

    // Sort by published date (newest first)
    posts.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));

    // Apply limit
    if (args.limit) {
      posts = posts.slice(0, args.limit);
    }

    return posts;
  },
});

export const getBlogPost = query({
  args: {
    locale: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_locale_slug", (q) =>
        q.eq("locale", args.locale).eq("slug", args.slug)
      )
      .first();

    return post;
  },
});

export const createBlogPost = mutation({
  args: {
    locale: v.string(),
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.optional(v.string()),
    contentBlocks: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      order: v.number(),
      config: v.any(),
    }))),
    contentVersion: v.optional(v.number()),
    author: v.string(),
    authorImageUrl: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    featuredImageUrl: v.optional(v.string()),
    readTimeMinutes: v.optional(v.number()),
    status: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const status = (args.status ?? "draft") as "draft" | "published" | "archived";

    const id = await ctx.db.insert("blogPosts", {
      locale: args.locale,
      slug: args.slug,
      title: args.title,
      excerpt: args.excerpt,
      content: args.content || "",
      contentBlocks: args.contentBlocks,
      contentVersion: args.contentVersion || 1,
      author: args.author,
      authorImageUrl: args.authorImageUrl,
      category: args.category,
      tags: args.tags,
      featuredImageUrl: args.featuredImageUrl,
      readTimeMinutes: args.readTimeMinutes,
      status,
      publishedAt: status === "published" ? now : undefined,
      seoTitle: args.seoTitle,
      seoDescription: args.seoDescription,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  },
});

export const updateBlogPost = mutation({
  args: {
    id: v.id("blogPosts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    contentBlocks: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      order: v.number(),
      config: v.any(),
    }))),
    contentVersion: v.optional(v.number()),
    author: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImageUrl: v.optional(v.string()),
    readTimeMinutes: v.optional(v.number()),
    status: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, status, ...updates } = args;

    const updateData: any = {
      ...updates,
      updatedAt: Date.now(),
    };

    // Handle status change
    if (status) {
      updateData.status = status;
      if (status === "published") {
        const existing = await ctx.db.get(id);
        if (!existing?.publishedAt) {
          updateData.publishedAt = Date.now();
        }
      }
    }

    await ctx.db.patch(id, updateData);
    return { success: true };
  },
});

export const deleteBlogPost = mutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================
// CONTACT FORM
// ============================================

export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    message: v.string(),
    locale: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("contactSubmissions", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      company: args.company,
      message: args.message,
      locale: args.locale,
      source: args.source,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    return { id, success: true };
  },
});

export const getContactSubmissions = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let submissions;

    if (args.status) {
      submissions = await ctx.db
        .query("contactSubmissions")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    } else {
      submissions = await ctx.db
        .query("contactSubmissions")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }

    // Sort by created date (newest first)
    submissions.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (args.limit) {
      submissions = submissions.slice(0, args.limit);
    }

    return submissions;
  },
});

export const updateContactStatus = mutation({
  args: {
    id: v.id("contactSubmissions"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status as any,
      notes: args.notes,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const recordContactReply = mutation({
  args: {
    id: v.id("contactSubmissions"),
    subject: v.string(),
    body: v.string(),
    method: v.union(v.literal("manual"), v.literal("ai")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "replied",
      repliedAt: now,
      replySubject: args.subject,
      replyBody: args.body,
      replyMethod: args.method,
      updatedAt: now,
    });
    return { success: true };
  },
});

// Get knowledge context for autoresponder
export const getAutoresponderKnowledge = query({
  args: {
    knowledgeBaseIds: v.optional(v.array(v.id("knowledgeBases"))),
    includeFaqs: v.optional(v.boolean()),
    includeServices: v.optional(v.boolean()),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result: {
      knowledgeContent: Array<{ title: string; content: string; category?: string }>;
      faqs: Array<{ question: string; answer: string; category: string }>;
      services: Array<{ title: string; description: string }>;
    } = {
      knowledgeContent: [],
      faqs: [],
      services: [],
    };

    // 1. Get content from specified knowledge bases
    if (args.knowledgeBaseIds && args.knowledgeBaseIds.length > 0) {
      for (const kbId of args.knowledgeBaseIds) {
        const content = await ctx.db
          .query("knowledgeContent")
          .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", kbId))
          .filter((q) => q.eq(q.field("processingStatus"), "completed"))
          .collect();

        for (const item of content) {
          result.knowledgeContent.push({
            title: item.title,
            content: item.content.substring(0, 2000), // Limit content size
            category: item.contentType,
          });
        }
      }
    }

    // 2. Get FAQs from landingFaq if requested
    if (args.includeFaqs !== false) {
      const locale = args.locale || "en";
      const faqs = await ctx.db
        .query("landingFaq")
        .withIndex("by_locale_published", (q) =>
          q.eq("locale", locale).eq("isPublished", true)
        )
        .collect();

      for (const faq of faqs) {
        result.faqs.push({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
        });
      }
    }

    // 3. Get services info from landingContent (if requested)
    if (args.includeServices !== false) {
      const servicesContent = await ctx.db
        .query("landingContent")
        .withIndex("by_locale_page_section", (q) =>
          q.eq("locale", args.locale || "en").eq("page", "services")
        )
        .collect();

      for (const section of servicesContent) {
        if (section.content && typeof section.content === "object") {
          const content = section.content as Record<string, unknown>;
          if (content.headline && content.subheadline) {
            result.services.push({
              title: content.headline as string,
              description: content.subheadline as string,
            });
          }
        }
      }
    }

    return result;
  },
});

// ============================================
// SEED PAGE CONTENT
// ============================================

export const seedPageContent = mutation({
  args: { locale: v.string() },
  handler: async (ctx, args) => {
    const { locale } = args;
    const now = Date.now();

    // Helper function to upsert a section
    const upsertSection = async (page: string, section: string, content: any, order: number) => {
      const existing = await ctx.db
        .query("landingContent")
        .withIndex("by_locale_page_section", (q) =>
          q.eq("locale", locale).eq("page", page).eq("section", section)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          content,
          order,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("landingContent", {
          locale,
          page,
          section,
          content,
          order,
          isPublished: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    };

    // English content
    const contentEN = {
      home: {
        hero: {
          badge: "Over 20 Years Experience",
          headline: "Master English",
          headlineAccent: "for your career.",
          subheadline: "Tailored business English training that delivers real results. In person in Hannover and Berlin, or online worldwide.",
          benefit1: "Personalized 1:1 sessions focused on your goals",
          benefit2: "Real-world practice with meetings, emails & presentations",
          benefit3: "Flexible scheduling – online or face-to-face",
          ctaPrimary: "Free Consultation",
          ctaSecondary: "Our Services",
          ctaLink: "/contact",
          avatarName: "Helena Clarke",
          avatarGreeting: "Hi! I'm Helena, your AI English teacher. Click the play button to start a conversation with me!",
        },
        services: {
          badge: "What We Offer",
          headline: "Language Services That Deliver",
          subheadline: "Professional training solutions tailored to your specific needs and goals",
          items: [
            { title: "Business English", description: "Master the English you need for meetings, presentations, negotiations, and everyday workplace communication.", icon: "Briefcase" },
            { title: "German for Foreigners", description: "Integration through language – helping international employees succeed in German-speaking environments.", icon: "GraduationCap" },
            { title: "Copy Editing", description: "Professional text editing that transforms your documents into clear, impactful communication.", icon: "FileEdit" },
          ],
        },
        usps: {
          badge: "Why Choose Us",
          headline: "The Simmonds Difference",
          subheadline: "What sets our language training apart from the rest",
          items: [
            { title: "Complete Flexibility", description: "Online or face-to-face, morning or evening – training that fits your schedule.", icon: "Clock" },
            { title: "Truly Personalized", description: "No generic courses. Every session is built around your specific goals and challenges.", icon: "Users" },
            { title: "20+ Years Expertise", description: "Proven methods refined over two decades of helping professionals succeed.", icon: "Award" },
            { title: "The Questions Method", description: "Our unique approach focuses on what you actually need to say and do.", icon: "Target" },
            { title: "Native Expertise", description: "Native speakers who understand both languages and cultures deeply.", icon: "Languages" },
            { title: "Ongoing Support", description: "We're here for you between sessions with feedback and resources.", icon: "HeartHandshake" },
          ],
        },
        cta: {
          headline: "Ready to Transform Your English?",
          subheadline: "Book a free consultation and discover how we can help you achieve your language goals.",
          buttonPrimary: "Book Free Consultation",
          buttonSecondary: "Call Us",
          buttonLink: "/contact",
          trustBadge: "No commitment required • Usually respond within 24 hours",
        },
      },
      about: {
        hero: {
          badge: "Our Story",
          headline: "About Simmonds Language Services",
          subheadline: "Over 20 years of helping professionals communicate with confidence",
        },
        story: {
          headline: "Our Story",
          content: "Founded in Hannover over two decades ago, Simmonds Language Services has grown from a small English training practice into a trusted partner for businesses and individuals across Germany. With offices in Hannover and Berlin, we've helped hundreds of professionals achieve their language goals.",
        },
        methodology: {
          headline: "The Questions Method",
          content: "Our unique teaching approach focuses on what you actually need to communicate. We build each session around real questions and situations from your work life, making every lesson immediately applicable.",
          items: [
            { title: "Tailored to your specific needs", icon: "Users" },
            { title: "Flexible scheduling options", icon: "Clock" },
            { title: "Proven results over 20 years", icon: "Award" },
          ],
        },
        locations: {
          headline: "Our Locations",
          items: [
            { name: "Hannover Office", address: "Im Werkhof, Schaufelder Straße 11, 30167 Hannover" },
            { name: "Berlin Office", address: "Friedrichstraße 123, 10117 Berlin" },
            { name: "Online Worldwide", address: "Video call sessions available anywhere" },
          ],
        },
      },
      services: {
        hero: {
          badge: "Our Services",
          headline: "Professional Language Services",
          subheadline: "Comprehensive training solutions for individuals and businesses",
        },
        overview: {
          headline: "What We Offer",
          items: [
            { title: "Business English", description: "Master professional English communication for the global workplace.", href: "/services/business-english", icon: "Briefcase" },
            { title: "German Courses", description: "German language training for international professionals.", href: "/services/german-courses", icon: "GraduationCap" },
            { title: "Copy Editing", description: "Professional editing to perfect your written communication.", href: "/services/copy-editing", icon: "FileEdit" },
          ],
        },
      },
      pricing: {
        hero: {
          badge: "Transparent Pricing",
          headline: "Simple, Fair Pricing",
          subheadline: "No hidden fees. Choose the format that works best for you.",
        },
        tiers: {
          items: [
            { name: "Online Training", price: "€65", duration: "60 min", description: "Flexible video sessions from anywhere", features: ["1:1 personalized sessions", "Flexible scheduling", "Session recordings available", "Resources & materials included"], isPopular: true },
            { name: "Face-to-Face", price: "€75", duration: "60 min", description: "In-person training in Hannover or Berlin", features: ["1:1 personalized sessions", "Meet at your office or our location", "Intensive focus environment", "All materials provided"] },
            { name: "Group Training", price: "€35/h", duration: "per person", description: "Team training for corporate clients", features: ["2-6 participants per group", "Custom content for your company", "Online or in-person", "Progress tracking included"] },
          ],
          notes: ["Language training is VAT-exempt", "Travel costs may apply for face-to-face", "24h cancellation policy"],
        },
      },
      contact: {
        hero: {
          badge: "Get in Touch",
          headline: "Contact Us",
          subheadline: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
        },
        info: {
          headline: "Contact Information",
          items: [
            { title: "Hannover", content: "Im Werkhof, Schaufelder Straße 11, 30167 Hannover", icon: "MapPin" },
            { title: "Berlin", content: "Friedrichstraße 123, 10117 Berlin", icon: "MapPin" },
            { title: "Phone", content: "+49 511 47 39 339", href: "tel:+495114739339", icon: "Phone" },
            { title: "Email", content: "james@englisch-lehrer.com", href: "mailto:james@englisch-lehrer.com", icon: "Mail" },
            { title: "Hours", content: "Monday – Friday: 9:00 – 18:00", icon: "Clock" },
          ],
        },
      },
    };

    // German content
    const contentDE = {
      home: {
        hero: {
          badge: "Über 20 Jahre Erfahrung",
          headline: "Business English",
          headlineAccent: "für Ihre Karriere.",
          subheadline: "Maßgeschneidertes Business English Training mit echten Ergebnissen. Persönlich in Hannover und Berlin oder online weltweit.",
          benefit1: "Personalisierte 1:1-Sitzungen auf Ihre Ziele ausgerichtet",
          benefit2: "Praxisnahes Training für Meetings, E-Mails & Präsentationen",
          benefit3: "Flexible Terminplanung – online oder persönlich",
          ctaPrimary: "Kostenlose Beratung",
          ctaSecondary: "Unsere Leistungen",
          ctaLink: "/contact",
          avatarName: "Helena Clarke",
          avatarGreeting: "Hallo! Ich bin Helena, Ihre KI-Englischlehrerin. Klicken Sie auf den Play-Button, um ein Gespräch mit mir zu starten!",
        },
        services: {
          badge: "Unsere Leistungen",
          headline: "Sprachdienstleistungen die wirken",
          subheadline: "Professionelle Trainingslösungen auf Ihre spezifischen Bedürfnisse und Ziele zugeschnitten",
          items: [
            { title: "Business English", description: "Beherrschen Sie das Englisch, das Sie für Meetings, Präsentationen, Verhandlungen und die tägliche Kommunikation am Arbeitsplatz brauchen.", icon: "Briefcase" },
            { title: "Deutsch für Ausländer", description: "Integration durch Sprache – wir helfen internationalen Mitarbeitern im deutschsprachigen Umfeld erfolgreich zu sein.", icon: "GraduationCap" },
            { title: "Lektorat", description: "Professionelles Textlektorat, das Ihre Dokumente in klare, wirkungsvolle Kommunikation verwandelt.", icon: "FileEdit" },
          ],
        },
        usps: {
          badge: "Warum wir",
          headline: "Der Simmonds Unterschied",
          subheadline: "Was unser Sprachtraining von anderen unterscheidet",
          items: [
            { title: "Maximale Flexibilität", description: "Online oder persönlich, morgens oder abends – Training das in Ihren Zeitplan passt.", icon: "Clock" },
            { title: "Wirklich Individuell", description: "Keine Standard-Kurse. Jede Sitzung wird um Ihre spezifischen Ziele und Herausforderungen gebaut.", icon: "Users" },
            { title: "20+ Jahre Expertise", description: "Bewährte Methoden, verfeinert über zwei Jahrzehnte Erfahrung mit Fach- und Führungskräften.", icon: "Award" },
            { title: "Die Fragen-Methode", description: "Unser einzigartiger Ansatz konzentriert sich auf das, was Sie tatsächlich sagen und tun müssen.", icon: "Target" },
            { title: "Muttersprachliche Expertise", description: "Muttersprachler, die beide Sprachen und Kulturen tiefgreifend verstehen.", icon: "Languages" },
            { title: "Kontinuierliche Betreuung", description: "Wir sind auch zwischen den Sitzungen mit Feedback und Materialien für Sie da.", icon: "HeartHandshake" },
          ],
        },
        cta: {
          headline: "Bereit Ihr Englisch zu transformieren?",
          subheadline: "Buchen Sie eine kostenlose Beratung und entdecken Sie, wie wir Ihnen helfen können, Ihre Sprachziele zu erreichen.",
          buttonPrimary: "Kostenlose Beratung buchen",
          buttonSecondary: "Rufen Sie uns an",
          buttonLink: "/contact",
          trustBadge: "Keine Verpflichtung • Antwort innerhalb von 24 Stunden",
        },
      },
      about: {
        hero: {
          badge: "Unsere Geschichte",
          headline: "Über Simmonds Language Services",
          subheadline: "Über 20 Jahre Erfahrung darin, Fachleuten zu selbstbewusster Kommunikation zu verhelfen",
        },
        story: {
          headline: "Unsere Geschichte",
          content: "Vor über zwei Jahrzehnten in Hannover gegründet, hat sich Simmonds Language Services von einer kleinen Englischtraining-Praxis zu einem vertrauenswürdigen Partner für Unternehmen und Privatpersonen in ganz Deutschland entwickelt. Mit Büros in Hannover und Berlin haben wir Hunderten von Fachleuten geholfen, ihre Sprachziele zu erreichen.",
        },
        methodology: {
          headline: "Die Fragen-Methode",
          content: "Unser einzigartiger Lehransatz konzentriert sich auf das, was Sie tatsächlich kommunizieren müssen. Wir bauen jede Sitzung um echte Fragen und Situationen aus Ihrem Berufsleben auf, wodurch jede Lektion sofort anwendbar wird.",
          items: [
            { title: "Auf Ihre spezifischen Bedürfnisse zugeschnitten", icon: "Users" },
            { title: "Flexible Terminoptionen", icon: "Clock" },
            { title: "Bewährte Ergebnisse seit 20 Jahren", icon: "Award" },
          ],
        },
        locations: {
          headline: "Unsere Standorte",
          items: [
            { name: "Büro Hannover", address: "Im Werkhof, Schaufelder Straße 11, 30167 Hannover" },
            { name: "Büro Berlin", address: "Friedrichstraße 123, 10117 Berlin" },
            { name: "Online Weltweit", address: "Videositzungen überall verfügbar" },
          ],
        },
      },
      services: {
        hero: {
          badge: "Unsere Leistungen",
          headline: "Professionelle Sprachdienstleistungen",
          subheadline: "Umfassende Trainingslösungen für Einzelpersonen und Unternehmen",
        },
        overview: {
          headline: "Was wir bieten",
          items: [
            { title: "Business English", description: "Professionelle englische Kommunikation für den globalen Arbeitsplatz meistern.", href: "/services/business-english", icon: "Briefcase" },
            { title: "Deutsch Kurse", description: "Deutschtraining für internationale Fachkräfte.", href: "/services/german-courses", icon: "GraduationCap" },
            { title: "Lektorat", description: "Professionelles Lektorat zur Perfektionierung Ihrer schriftlichen Kommunikation.", href: "/services/copy-editing", icon: "FileEdit" },
          ],
        },
      },
      pricing: {
        hero: {
          badge: "Transparente Preise",
          headline: "Einfache, faire Preise",
          subheadline: "Keine versteckten Gebühren. Wählen Sie das Format, das am besten zu Ihnen passt.",
        },
        tiers: {
          items: [
            { name: "Online Training", price: "€65", duration: "60 Min", description: "Flexible Video-Sitzungen von überall", features: ["1:1 personalisierte Sitzungen", "Flexible Terminplanung", "Sitzungsaufnahmen verfügbar", "Ressourcen & Materialien inklusive"], isPopular: true },
            { name: "Präsenztraining", price: "€75", duration: "60 Min", description: "Persönliches Training in Hannover oder Berlin", features: ["1:1 personalisierte Sitzungen", "Bei Ihnen im Büro oder bei uns", "Intensive Lernumgebung", "Alle Materialien inklusive"] },
            { name: "Gruppentraining", price: "€35/Std", duration: "pro Person", description: "Teamtraining für Firmenkunden", features: ["2-6 Teilnehmer pro Gruppe", "Maßgeschneiderte Inhalte für Ihr Unternehmen", "Online oder persönlich", "Fortschrittsverfolgung inklusive"] },
          ],
          notes: ["Sprachtraining ist umsatzsteuerbefreit", "Fahrtkosten können für Präsenztraining anfallen", "24 Std. Stornierungsrichtlinie"],
        },
      },
      contact: {
        hero: {
          badge: "Kontaktieren Sie uns",
          headline: "Kontakt",
          subheadline: "Wir freuen uns von Ihnen zu hören. Senden Sie uns eine Nachricht und wir melden uns so schnell wie möglich.",
        },
        info: {
          headline: "Kontaktinformationen",
          items: [
            { title: "Hannover", content: "Im Werkhof, Schaufelder Straße 11, 30167 Hannover", icon: "MapPin" },
            { title: "Berlin", content: "Friedrichstraße 123, 10117 Berlin", icon: "MapPin" },
            { title: "Telefon", content: "+49 511 47 39 339", href: "tel:+495114739339", icon: "Phone" },
            { title: "E-Mail", content: "james@englisch-lehrer.com", href: "mailto:james@englisch-lehrer.com", icon: "Mail" },
            { title: "Öffnungszeiten", content: "Montag – Freitag: 9:00 – 18:00", icon: "Clock" },
          ],
        },
      },
    };

    // Choose content based on locale
    const content = locale === "de" ? contentDE : contentEN;

    // Insert all page sections
    const pages = ["home", "about", "services", "pricing", "contact"];
    let sectionCount = 0;

    for (const page of pages) {
      const pageContent = content[page as keyof typeof content];
      if (pageContent) {
        let order = 0;
        for (const [section, sectionContent] of Object.entries(pageContent)) {
          await upsertSection(page, section, sectionContent, order);
          order++;
          sectionCount++;
        }
      }
    }

    return { success: true, sectionsCreated: sectionCount, locale };
  },
});
