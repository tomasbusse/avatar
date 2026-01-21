#!/usr/bin/env npx tsx
/**
 * Seed script for sample blog content
 *
 * Inserts 2 sample blog posts with proper contentBlocks (HeroBlock + RichTextBlock):
 * 1. "Mastering the Present Perfect Tense" (grammar category)
 * 2. "Professional Email Writing Tips" (business-english category)
 *
 * Usage: npx tsx scripts/seed-sample-blog-content.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Missing required environment variable: NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

/**
 * Generate a unique block ID
 */
function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sample blog posts with contentBlocks
 */
const sampleBlogPosts = [
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
            "Learn when to use the present perfect tense and how it differs from simple past. Master this essential grammar concept for natural English communication.",
          badge: "Grammar Guide",
          showAuthor: true,
          showDate: true,
          showReadTime: true,
          author: "James Simmonds",
          readTimeMinutes: 8,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          content: `## What is the Present Perfect Tense?

The present perfect tense connects the past to the present. It's formed using **have/has** + **past participle** (e.g., "I have worked", "She has eaten").

This tense is one of the most challenging aspects of English for German speakers because German uses the *Perfekt* differently.

## When to Use the Present Perfect

### 1. Experiences (without specific time)

Use it to talk about life experiences when the time isn't important:

- "I **have visited** London three times."
- "She **has never eaten** sushi."
- "**Have** you ever **been** to Australia?"

### 2. Recent Actions with Present Results

When a past action has a clear effect on the present:

- "I **have lost** my keys." (I can't find them now)
- "He **has broken** his leg." (His leg is still broken)
- "The taxi **has arrived**." (It's here now)

### 3. Actions That Started in the Past and Continue Now

Use with **for** (duration) and **since** (starting point):

- "I **have lived** in Berlin **for** five years."
- "She **has worked** here **since** 2019."
- "We **have known** each other **for** ages."

## Present Perfect vs. Simple Past

This is where German speakers often make mistakes. In German, you might say "Ich habe gestern gearbeitet," but in English, you must use simple past with specific past times:

**Correct:**
- "I **worked** yesterday." (specific time = simple past)
- "I **have worked** all my life." (up to now = present perfect)

**Incorrect:**
- ~~"I have worked yesterday."~~

### Key Difference

- **Simple Past**: Completed action at a specific past time
- **Present Perfect**: Connection between past and present, or unspecified past time

## Common Mistakes to Avoid

1. **Using present perfect with specific past times**
   - ❌ "I have seen him last week."
   - ✅ "I saw him last week."

2. **Using simple past for experiences**
   - ❌ "Did you ever visit Paris?"
   - ✅ "Have you ever visited Paris?"

3. **Forgetting the auxiliary verb**
   - ❌ "I seen that movie."
   - ✅ "I have seen that movie."

## Practice Makes Perfect

Try converting these German sentences to English, choosing the correct tense:

1. "Ich habe schon gefrühstückt." → "I **have already eaten** breakfast."
2. "Ich habe gestern gefrühstückt." → "I **ate** breakfast yesterday."
3. "Er wohnt hier seit 2020." → "He **has lived** here since 2020."

## Conclusion

The present perfect tense is essential for natural English communication. Remember: if the action connects to now or the time isn't specified, use present perfect. If you mention a specific past time, use simple past.

With practice, this distinction will become second nature!`,
          variant: "default",
        },
      },
    ],
  },
  {
    locale: "en",
    slug: "business-email-tips",
    title: "Professional Email Writing Tips",
    excerpt:
      "Master the art of formal email language for international business communication. Learn key phrases, structures, and etiquette for professional correspondence.",
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
            "Master the art of formal email language for international business communication. Learn key phrases, structures, and etiquette for professional correspondence.",
          badge: "Business English",
          showAuthor: true,
          showDate: true,
          showReadTime: true,
          author: "James Simmonds",
          readTimeMinutes: 6,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          content: `## Why Professional Email Language Matters

In international business, your emails create lasting impressions. A well-crafted email demonstrates professionalism, builds trust, and ensures clear communication across cultures.

For German professionals, adapting to English email conventions can be challenging—the tone, structure, and level of formality often differ from German business correspondence.

## Email Structure Essentials

### 1. Subject Lines

Your subject line should be clear and specific:

- ✅ "Meeting Request: Q3 Budget Review - Thursday 2pm"
- ✅ "Action Required: Contract Approval by Friday"
- ❌ "Meeting" (too vague)
- ❌ "Quick Question" (not informative)

### 2. Professional Greetings

Choose your greeting based on your relationship:

**Formal (first contact or senior colleagues):**
- "Dear Mr./Ms. [Last Name],"
- "Dear Dr. [Last Name],"

**Semi-formal (established relationships):**
- "Dear [First Name],"
- "Hello [First Name],"

**For groups:**
- "Dear Team,"
- "Dear All,"
- "Dear Colleagues,"

### 3. Opening Lines

Start with context or pleasantries, depending on the situation:

- "I hope this email finds you well."
- "Thank you for your email regarding..."
- "Following our conversation yesterday..."
- "I am writing to inquire about..."

## Key Phrases for Common Situations

### Making Requests

- "I would be grateful if you could..."
- "Would it be possible to..."
- "I would appreciate it if you could..."
- "Could you please..."

### Providing Information

- "Please find attached..."
- "I am pleased to inform you that..."
- "I would like to bring to your attention..."
- "As per our discussion..."

### Apologizing

- "I apologize for any inconvenience caused."
- "Please accept my apologies for..."
- "I regret to inform you that..."

### Following Up

- "I am following up on my previous email..."
- "I wanted to check in regarding..."
- "Just a gentle reminder about..."

## Tone and Formality

### Avoid Being Too Direct

German business communication tends to be more direct. In English, especially with international colleagues, softer language is often preferred:

- ❌ "Send me the report."
- ✅ "Could you please send me the report?"

- ❌ "This is wrong."
- ✅ "I noticed a small discrepancy that we might want to address."

### Use Hedging Language

Softening statements makes them more polite:

- "I think this might be..."
- "Perhaps we could consider..."
- "It seems that..."
- "I was wondering if..."

## Closing Your Emails

### Call to Action

Be clear about what you need:

- "Please confirm your availability by Friday."
- "I would appreciate a response by [date]."
- "Please let me know if you have any questions."

### Professional Sign-offs

**Formal:**
- "Kind regards,"
- "Best regards,"
- "Yours sincerely," (UK, if you know the name)
- "Yours faithfully," (UK, if you don't know the name)

**Semi-formal:**
- "Best,"
- "Thanks,"
- "Many thanks,"

## Common Mistakes to Avoid

1. **Overly long emails** - Keep it concise. If it's longer than two paragraphs, consider whether email is the right format.

2. **Missing subject line** - Always include a clear, descriptive subject.

3. **Reply All unnecessarily** - Only include people who need to see your response.

4. **Emotional language** - Keep emails professional, even when frustrated.

5. **Forgetting attachments** - Double-check before sending!

## Email Template Example

**Subject: Project Update Request - Marketing Campaign Q1**

Dear Sarah,

I hope this email finds you well.

I am writing to request an update on the marketing campaign for Q1. As we discussed in last week's meeting, we need to finalize the budget allocation by Friday.

Could you please provide:
- The current campaign status
- Updated cost projections
- Timeline for deliverables

I would appreciate receiving this information by Thursday if possible, so we can prepare for the budget meeting.

Please let me know if you need any clarification or additional information from my side.

Best regards,
[Your Name]

## Conclusion

Professional email writing is a skill that improves with practice. Remember to be clear, courteous, and concise. When in doubt, err on the side of formality—it's easier to become more casual than to recover from appearing too informal.`,
          variant: "default",
        },
      },
    ],
  },
];

async function seedBlogContent() {
  console.log("\n🌱 Starting blog content seeding...\n");

  const now = Date.now();
  let successCount = 0;

  for (const post of sampleBlogPosts) {
    console.log(`📝 Creating post: "${post.title}"...`);

    try {
      // Check if post already exists
      const existingPost = await convex.query(api.landing.getBlogPost, {
        locale: post.locale,
        slug: post.slug,
      });

      if (existingPost) {
        console.log(`   ⏭️  Post "${post.slug}" already exists, skipping.`);
        continue;
      }

      // Create the blog post
      await convex.mutation(api.landing.createBlogPost, {
        locale: post.locale,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: "", // Empty for v2 content blocks
        contentBlocks: post.contentBlocks,
        contentVersion: post.contentVersion,
        author: post.author,
        category: post.category,
        tags: post.tags,
        readTimeMinutes: post.readTimeMinutes,
        status: post.status,
      });

      console.log(`   ✅ Created: "${post.title}"`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error creating "${post.title}":`, error);
    }
  }

  console.log(`\n✨ Seeding complete! Created ${successCount}/${sampleBlogPosts.length} posts.\n`);
}

// Run the seed function
seedBlogContent().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
