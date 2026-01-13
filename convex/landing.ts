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

// Get landing page avatar configuration
export const getLandingAvatar = query({
  args: {},
  handler: async (ctx) => {
    // Get configured avatar ID from site config
    const config = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "landing_hero_avatar"))
      .first();

    if (!config?.value) {
      // Return first active avatar as fallback
      const avatar = await ctx.db
        .query("avatars")
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
      return avatar;
    }

    const avatar = await ctx.db.get(config.value);
    return avatar;
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
    content: v.string(),
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
      content: args.content,
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
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
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
