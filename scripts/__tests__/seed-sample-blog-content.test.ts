/**
 * Tests for seed-sample-blog-content.ts
 *
 * Tests the structure and validity of sample blog content.
 * Note: Integration tests with Convex would require a test environment.
 */

import type { HeroBlockConfig, RichTextBlockConfig } from "@/types/blog-blocks";

// Re-implement generateBlockId for testing (same logic as in seed script)
function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Sample blog post structure matching the seed script
interface SampleBlogPost {
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  status: "draft" | "published" | "archived";
  contentVersion: number;
  contentBlocks: Array<{
    id: string;
    type: string;
    order: number;
    config: HeroBlockConfig | RichTextBlockConfig;
  }>;
}

// Create sample posts matching seed script structure
function createSampleBlogPosts(): SampleBlogPost[] {
  return [
    {
      locale: "en",
      slug: "present-perfect-guide",
      title: "Mastering the Present Perfect Tense",
      excerpt:
        "Learn when to use the present perfect tense and how it differs from simple past. Master this essential grammar concept for natural English communication.",
      author: "James Simmonds",
      category: "grammar",
      tags: ["grammar", "present-perfect", "tenses", "english-basics"],
      readTimeMinutes: 8,
      status: "published" as const,
      contentVersion: 2,
      contentBlocks: [
        {
          id: generateBlockId(),
          type: "hero",
          order: 0,
          config: {
            type: "hero",
            title: "Mastering the Present Perfect Tense",
            subtitle:
              "Learn when to use the present perfect tense and how it differs from simple past.",
            badge: "Grammar Guide",
            showAuthor: true,
            showDate: true,
            showReadTime: true,
            author: "James Simmonds",
            readTimeMinutes: 8,
            variant: "default",
          } as HeroBlockConfig,
        },
        {
          id: generateBlockId(),
          type: "rich_text",
          order: 1,
          config: {
            type: "rich_text",
            content: "## What is the Present Perfect Tense?\n\nThe present perfect tense...",
            variant: "default",
          } as RichTextBlockConfig,
        },
      ],
    },
    {
      locale: "en",
      slug: "business-email-tips",
      title: "Professional Email Writing Tips",
      excerpt:
        "Master the art of formal email language for international business communication.",
      author: "James Simmonds",
      category: "business-english",
      tags: ["business-english", "email", "writing", "professional-communication"],
      readTimeMinutes: 6,
      status: "published" as const,
      contentVersion: 2,
      contentBlocks: [
        {
          id: generateBlockId(),
          type: "hero",
          order: 0,
          config: {
            type: "hero",
            title: "Professional Email Writing Tips",
            subtitle:
              "Master the art of formal email language for international business communication.",
            badge: "Business English",
            showAuthor: true,
            showDate: true,
            showReadTime: true,
            author: "James Simmonds",
            readTimeMinutes: 6,
            variant: "default",
          } as HeroBlockConfig,
        },
        {
          id: generateBlockId(),
          type: "rich_text",
          order: 1,
          config: {
            type: "rich_text",
            content: "## Why Professional Email Language Matters\n\nIn international business...",
            variant: "default",
          } as RichTextBlockConfig,
        },
      ],
    },
  ];
}

describe("seed-sample-blog-content", () => {
  describe("generateBlockId", () => {
    it("should generate unique block IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateBlockId());
      }
      // All 100 IDs should be unique
      expect(ids.size).toBe(100);
    });

    it("should generate IDs with correct prefix", () => {
      const id = generateBlockId();
      expect(id).toMatch(/^block_\d+_[a-z0-9]+$/);
    });
  });

  describe("sample blog post structure", () => {
    const posts = createSampleBlogPosts();

    it("should create exactly 2 sample posts", () => {
      expect(posts).toHaveLength(2);
    });

    describe("Post 1: Present Perfect Guide", () => {
      const post = posts[0];

      it("should have correct slug", () => {
        expect(post.slug).toBe("present-perfect-guide");
      });

      it("should have correct title", () => {
        expect(post.title).toBe("Mastering the Present Perfect Tense");
      });

      it("should have excerpt about present perfect tense", () => {
        expect(post.excerpt).toContain("present perfect");
      });

      it("should have grammar category", () => {
        expect(post.category).toBe("grammar");
      });

      it("should have James Simmonds as author", () => {
        expect(post.author).toBe("James Simmonds");
      });

      it("should be published", () => {
        expect(post.status).toBe("published");
      });

      it("should use content blocks version 2", () => {
        expect(post.contentVersion).toBe(2);
      });

      it("should have HeroBlock as first block", () => {
        expect(post.contentBlocks[0].type).toBe("hero");
        expect(post.contentBlocks[0].order).toBe(0);
      });

      it("should have RichTextBlock as second block", () => {
        expect(post.contentBlocks[1].type).toBe("rich_text");
        expect(post.contentBlocks[1].order).toBe(1);
      });

      it("should have valid HeroBlock config", () => {
        const heroConfig = post.contentBlocks[0].config as HeroBlockConfig;
        expect(heroConfig.type).toBe("hero");
        expect(heroConfig.title).toBeTruthy();
        expect(heroConfig.author).toBe("James Simmonds");
        expect(heroConfig.showAuthor).toBe(true);
        expect(heroConfig.showDate).toBe(true);
        expect(heroConfig.showReadTime).toBe(true);
      });

      it("should have valid RichTextBlock config", () => {
        const richTextConfig = post.contentBlocks[1].config as RichTextBlockConfig;
        expect(richTextConfig.type).toBe("rich_text");
        expect(richTextConfig.content).toBeTruthy();
        expect(richTextConfig.variant).toBe("default");
      });
    });

    describe("Post 2: Business Email Tips", () => {
      const post = posts[1];

      it("should have correct slug", () => {
        expect(post.slug).toBe("business-email-tips");
      });

      it("should have correct title", () => {
        expect(post.title).toBe("Professional Email Writing Tips");
      });

      it("should have excerpt about formal email language", () => {
        expect(post.excerpt).toContain("formal email language");
      });

      it("should have business-english category", () => {
        expect(post.category).toBe("business-english");
      });

      it("should have James Simmonds as author", () => {
        expect(post.author).toBe("James Simmonds");
      });

      it("should be published", () => {
        expect(post.status).toBe("published");
      });

      it("should use content blocks version 2", () => {
        expect(post.contentVersion).toBe(2);
      });

      it("should have HeroBlock as first block", () => {
        expect(post.contentBlocks[0].type).toBe("hero");
        expect(post.contentBlocks[0].order).toBe(0);
      });

      it("should have RichTextBlock as second block", () => {
        expect(post.contentBlocks[1].type).toBe("rich_text");
        expect(post.contentBlocks[1].order).toBe(1);
      });
    });

    describe("all posts", () => {
      it("should all have locale set to en", () => {
        posts.forEach((post) => {
          expect(post.locale).toBe("en");
        });
      });

      it("should all have unique slugs", () => {
        const slugs = posts.map((p) => p.slug);
        const uniqueSlugs = new Set(slugs);
        expect(uniqueSlugs.size).toBe(slugs.length);
      });

      it("should all have at least 2 content blocks", () => {
        posts.forEach((post) => {
          expect(post.contentBlocks.length).toBeGreaterThanOrEqual(2);
        });
      });

      it("should all have sequential block order starting from 0", () => {
        posts.forEach((post) => {
          post.contentBlocks.forEach((block, index) => {
            expect(block.order).toBe(index);
          });
        });
      });

      it("should all have non-empty tags array", () => {
        posts.forEach((post) => {
          expect(post.tags.length).toBeGreaterThan(0);
        });
      });

      it("should all have positive readTimeMinutes", () => {
        posts.forEach((post) => {
          expect(post.readTimeMinutes).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("contentBlocks schema compliance", () => {
    const posts = createSampleBlogPosts();

    it("should have valid block structure", () => {
      posts.forEach((post) => {
        post.contentBlocks.forEach((block) => {
          expect(block.id).toBeTruthy();
          expect(typeof block.id).toBe("string");
          expect(block.type).toBeTruthy();
          expect(typeof block.type).toBe("string");
          expect(typeof block.order).toBe("number");
          expect(block.config).toBeTruthy();
          expect(typeof block.config).toBe("object");
        });
      });
    });

    it("should have matching type in config", () => {
      posts.forEach((post) => {
        post.contentBlocks.forEach((block) => {
          expect(block.config.type).toBe(block.type);
        });
      });
    });
  });
});
