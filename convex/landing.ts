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
    };
  },
});

// Update site config from admin
export const updateSiteConfig = mutation({
  args: {
    heroAvatarId: v.optional(v.id("avatars")),
  },
  handler: async (ctx, args) => {
    if (args.heroAvatarId) {
      const existing = await ctx.db
        .query("siteConfig")
        .withIndex("by_key", (q) => q.eq("key", "landing_hero_avatar"))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value: args.heroAvatarId,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("siteConfig", {
          key: "landing_hero_avatar",
          value: args.heroAvatarId,
          updatedAt: Date.now(),
        });
      }
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
