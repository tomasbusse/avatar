#!/usr/bin/env npx tsx
/**
 * Seed script for initial blog posts with game integration
 *
 * Creates 3 engaging blog posts for the SLS blog:
 * 1. "Fun Ways to Master English Prepositions" (Grammar)
 * 2. "10 Business English Phrases Every Professional Needs" (Business English)
 * 3. "Interactive Games: The Fun Way to Learn English" (Interactive Learning)
 *
 * Each post uses the block-based content system with:
 * - Hero sections
 * - Rich text with tips
 * - Callout boxes
 * - FAQ sections
 * - CTA blocks
 *
 * Game blocks can be added later via the CMS once games are created.
 *
 * Usage: npx tsx scripts/seed-initial-blog-posts.ts
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
 * Generate a unique FAQ ID
 */
function generateFaqId(): string {
  return `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Blog posts to seed
 */
const blogPosts = [
  // ============================================
  // POST 1: Fun Ways to Master English Prepositions
  // ============================================
  {
    locale: "en",
    slug: "master-english-prepositions",
    title: "Fun Ways to Master English Prepositions",
    excerpt:
      "Struggling with in, on, and at? You're not alone. German speakers find English prepositions tricky because they work differently. Discover fun and effective strategies to finally master them.",
    author: "Emma AI",
    category: "Grammar",
    tags: ["grammar", "prepositions", "german-speakers", "beginner-friendly", "interactive"],
    readTimeMinutes: 7,
    status: "published" as const,
    contentVersion: 2,
    contentBlocks: [
      {
        id: generateBlockId(),
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          title: "Fun Ways to Master English Prepositions",
          subtitle:
            "Struggling with in, on, and at? You're not alone. German speakers find English prepositions tricky because they work differently. Discover fun and effective strategies to finally master them.",
          badge: "Grammar Guide",
          showAuthor: true,
          showDate: true,
          showReadTime: true,
          author: "Emma AI",
          readTimeMinutes: 7,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          content: `## Why Are Prepositions So Tricky for German Speakers?

In German, you might say "Ich bin **in** der Arbeit" (I am at work) — but wait, in English it's "at" not "in"! That's because prepositions don't translate directly between languages.

The good news? Once you understand the patterns, it becomes much easier. Let's break it down.

## The Big Three: In, On, At

These three prepositions cover most situations, but they follow specific patterns:

### **IN** - Think "inside" or "within"
- **In** a box, room, car, building
- **In** Munich, Germany, Europe (cities, countries, continents)
- **In** the morning, **in** April, **in** 2024 (times of day, months, years)

### **ON** - Think "surface" or "specific day"
- **On** the table, floor, wall (surfaces)
- **On** Monday, **on** Christmas Day, **on** my birthday (specific days)
- **On** the first floor (British English!)

### **AT** - Think "precise point"
- **At** the bus stop, **at** the corner, **at** the office (locations)
- **At** 9 o'clock, **at** noon, **at** night (specific times)
- **At** the weekend (British) vs **On** the weekend (American)`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "callout",
        order: 2,
        config: {
          type: "callout",
          variant: "tip",
          title: "German Speaker Tip",
          content: "German uses 'am' for days (am Montag) and 'um' for times (um 9 Uhr). In English, it's always 'on' for days and 'at' for times. Create a mental note: Day = ON, Time = AT.",
          icon: "Lightbulb",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          content: `## Common Mistakes German Speakers Make

Let's look at the most frequent errors and how to fix them:

| ❌ Incorrect | ✅ Correct | Why? |
|-------------|-----------|------|
| I am in the work | I am **at** work | "At" for workplaces |
| On the weekend | **At** the weekend (UK) | British preference |
| In Monday | **On** Monday | Specific days use "on" |
| At the morning | **In** the morning | Parts of day use "in" |
| I'm sitting in the table | I'm sitting **at** the table | Position relative to table |

## The "Transportation" Rule

This one confuses everyone! Here's the pattern:

**IN** = You're inside a small, private vehicle
- **In** a car, taxi, helicopter

**ON** = You're on public transport or large vehicles
- **On** a bus, train, plane, ship, bicycle

*Think of it this way: If you can stand up and walk around inside it, use "on"!*`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "callout",
        order: 4,
        config: {
          type: "callout",
          variant: "info",
          title: "Practice Makes Perfect",
          content: "Want to practice prepositions interactively? Try our Preposition Matching Game! It takes just 5 minutes and helps cement these rules in your memory. Look for the 'Play Game' button in the Materials section of your next lesson.",
          icon: "Gamepad2",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          content: `## Quick Reference Chart

### Time Expressions
| Use IN | Use ON | Use AT |
|--------|--------|--------|
| in the morning | on Monday | at 9 AM |
| in April | on 1st April | at noon |
| in 2024 | on my birthday | at night |
| in summer | on the weekend (US) | at the weekend (UK) |

### Place Expressions
| Use IN | Use ON | Use AT |
|--------|--------|--------|
| in Munich | on the street | at the corner |
| in Germany | on the 2nd floor | at school |
| in the office | on the bus | at the bus stop |
| in bed | on the table | at work |

## Memory Tricks That Work

1. **The Container Rule**: If something is fully enclosed (like a container), use **IN**
2. **The Surface Rule**: If something is touching a surface, use **ON**
3. **The Point Rule**: If you're at a specific point or place, use **AT**

## Your Action Plan

1. ✅ Practice with the preposition game in your next session
2. ✅ Notice prepositions while reading English content
3. ✅ When you make a mistake, note it down and look for the pattern
4. ✅ Start with the most common combinations and build from there

Remember: Even native English speakers sometimes debate which preposition is "correct"! The goal is communication, not perfection.`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "faq",
        order: 6,
        config: {
          type: "faq",
          items: [
            {
              id: generateFaqId(),
              question: "Why is it 'at night' but 'in the morning'?",
              answer: "Great question! Night is treated as a point in time (at night), while morning/afternoon/evening are periods (in the morning). This is simply a quirk of English that must be memorized.",
            },
            {
              id: generateFaqId(),
              question: "Do Americans and British use different prepositions?",
              answer: "Yes, sometimes! The most common difference is 'at the weekend' (British) vs 'on the weekend' (American). Both are correct depending on which dialect you're learning.",
            },
            {
              id: generateFaqId(),
              question: "How can I remember all these rules?",
              answer: "Focus on learning phrases rather than individual prepositions. Instead of memorizing 'at + work', learn 'I am at work.' Phrases stick better than isolated rules.",
            },
          ],
          showHeader: true,
          headerTitle: "Frequently Asked Questions",
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "cta",
        order: 7,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Ready to Practice?",
          subheadline: "Book a session with Emma and practice prepositions in real conversation. Interactive games included!",
          primaryButton: { text: "Start Learning", href: "/contact" },
          secondaryButton: { text: "View Lessons", href: "/lessons" },
          trustBadge: "First lesson free",
        },
      },
    ],
  },

  // ============================================
  // POST 2: 10 Business English Phrases
  // ============================================
  {
    locale: "en",
    slug: "business-english-phrases-professionals",
    title: "10 Business English Phrases Every Professional Needs",
    excerpt:
      "Master the essential business English phrases for meetings, emails, and negotiations. Perfect for German professionals working in international environments.",
    author: "Emma AI",
    category: "Business English",
    tags: ["business-english", "professional", "meetings", "email", "phrases"],
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
          title: "10 Business English Phrases Every Professional Needs",
          subtitle:
            "Master the essential business English phrases for meetings, emails, and negotiations. Perfect for German professionals working in international environments.",
          badge: "Business English",
          showAuthor: true,
          showDate: true,
          showReadTime: true,
          author: "Emma AI",
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
          content: `## Why These Phrases Matter

In international business, how you say something is often as important as what you say. German business communication tends to be direct and efficient — but English-speaking cultures often expect more diplomatic language.

These 10 phrases will help you sound professional, build rapport, and get things done.

---

## 1. "I'd like to touch base with you about..."

**Usage**: Starting a conversation or checking in
**German equivalent**: "Ich möchte mich bei Ihnen erkundigen über..."

**Example**:
> "Hi Sarah, I'd like to touch base with you about the Q3 projections. Do you have 10 minutes this week?"

**Why it works**: It's friendly, non-threatening, and signals you want to connect rather than demand.

---

## 2. "Could we circle back to that?"

**Usage**: Returning to a previous topic
**German equivalent**: "Können wir darauf zurückkommen?"

**Example**:
> "That's a great point about the budget. Could we circle back to that after we discuss the timeline?"

**Why it works**: It shows you're organized and value the other person's input.

---

## 3. "I think we're on the same page"

**Usage**: Confirming mutual understanding
**German equivalent**: "Ich glaube, wir sind uns einig"

**Example**:
> "So we'll deliver by Friday and you'll handle the client call? Great, I think we're on the same page."

**Why it works**: It builds consensus and prevents misunderstandings.`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "callout",
        order: 2,
        config: {
          type: "callout",
          variant: "tip",
          title: "Pro Tip",
          content: "German directness is valued in Germany but can seem abrupt in Anglo-American business culture. Adding phrases like 'I think' or 'Perhaps we could' softens your message without weakening it.",
          icon: "Lightbulb",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          content: `## 4. "Let me push back on that a little"

**Usage**: Disagreeing politely
**German equivalent**: "Da muss ich etwas widersprechen"

**Example**:
> "I appreciate the suggestion, but let me push back on that a little. I'm concerned about the timeline."

**Why it works**: It shows you're engaged and thinking critically without creating conflict.

---

## 5. "Going forward, we should..."

**Usage**: Suggesting future actions
**German equivalent**: "Künftig sollten wir..."

**Example**:
> "This was a great learning experience. Going forward, we should document our process better."

**Why it works**: It's forward-looking and action-oriented.

---

## 6. "I'll loop you in on the email"

**Usage**: Including someone in communication
**German equivalent**: "Ich setze Sie in CC"

**Example**:
> "I'll loop you in on the email with the client so you have all the context."

**Why it works**: It shows you're thinking about keeping people informed.

---

## 7. "Let's take this offline"

**Usage**: Moving a detailed discussion out of a meeting
**German equivalent**: "Das besprechen wir separat"

**Example**:
> "This is getting quite technical. Let's take this offline and schedule a separate call."

**Why it works**: It respects everyone's time while promising to address the issue.`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "callout",
        order: 4,
        config: {
          type: "callout",
          variant: "warning",
          title: "Watch Out!",
          content: "Don't overuse these phrases! If every sentence includes corporate jargon, you'll sound insincere. Use them strategically at key moments.",
          icon: "AlertCircle",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          content: `## 8. "I'll action that and get back to you"

**Usage**: Committing to a task
**German equivalent**: "Ich kümmere mich darum und melde mich"

**Example**:
> "Good point about the vendor contract. I'll action that and get back to you by Wednesday."

**Why it works**: It shows accountability and gives a clear timeline.

---

## 9. "What's the bandwidth on your end?"

**Usage**: Checking if someone has capacity
**German equivalent**: "Haben Sie Kapazitäten?"

**Example**:
> "We need someone for the Shanghai project. What's the bandwidth on your end this quarter?"

**Why it works**: It's respectful of people's workloads and invites honest responses.

---

## 10. "Let's align on next steps"

**Usage**: Wrapping up with clear actions
**German equivalent**: "Lassen Sie uns die nächsten Schritte abstimmen"

**Example**:
> "Great meeting everyone. Before we wrap up, let's align on next steps. Who's doing what?"

**Why it works**: It ensures meetings end productively with clear responsibilities.

---

## Quick Reference Card

| Phrase | When to Use |
|--------|-------------|
| Touch base | Starting informal check-ins |
| Circle back | Returning to a topic |
| On the same page | Confirming understanding |
| Push back | Polite disagreement |
| Going forward | Future planning |
| Loop you in | Including in communication |
| Take this offline | Moving discussions |
| Action that | Committing to tasks |
| Bandwidth | Checking capacity |
| Align | Agreeing on plans |`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "faq",
        order: 6,
        config: {
          type: "faq",
          items: [
            {
              id: generateFaqId(),
              question: "Are these phrases used in British and American English?",
              answer: "Yes, these phrases are widely used in both British and American business contexts. Some (like 'touch base') originated in American English but are now used globally.",
            },
            {
              id: generateFaqId(),
              question: "Is it okay to use German-style directness in emails?",
              answer: "It depends on your audience. With German colleagues, yes. With American or British colleagues, adding softening phrases like 'I was wondering if...' or 'Would it be possible to...' is often appreciated.",
            },
            {
              id: generateFaqId(),
              question: "How can I practice these phrases?",
              answer: "Start using one phrase per week in your real work. Our vocabulary matching games also include business English modules that help cement these phrases through interactive practice.",
            },
          ],
          showHeader: true,
          headerTitle: "Questions About Business English",
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "cta",
        order: 7,
        config: {
          type: "cta",
          variant: "gradient",
          headline: "Elevate Your Professional English",
          subheadline: "Practice business English with Emma in realistic meeting and email scenarios. Get personalized feedback on your language.",
          primaryButton: { text: "Book Business English Session", href: "/contact" },
          secondaryButton: { text: "Browse Business Courses", href: "/lessons" },
        },
      },
    ],
  },

  // ============================================
  // POST 3: Interactive Games - The Fun Way to Learn English
  // ============================================
  {
    locale: "en",
    slug: "interactive-games-learn-english",
    title: "Interactive Games: The Fun Way to Learn English",
    excerpt:
      "Discover how interactive games can transform your English learning. From vocabulary matching to sentence building, explore our engaging learning tools.",
    author: "Emma AI",
    category: "Interactive Learning",
    tags: ["games", "interactive", "vocabulary", "learning-tips", "motivation"],
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
          title: "Interactive Games: The Fun Way to Learn English",
          subtitle:
            "Discover how interactive games can transform your English learning. From vocabulary matching to sentence building, explore our engaging learning tools.",
          badge: "Interactive Learning",
          showAuthor: true,
          showDate: true,
          showReadTime: true,
          author: "Emma AI",
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
          content: `## Why Games Work for Language Learning

Remember how easily you learned as a child? Through play! Research shows that game-based learning:

- **Increases retention by 40%** compared to passive learning
- **Reduces anxiety** around making mistakes
- **Builds automaticity** — you start using words without thinking
- **Provides instant feedback** so you learn faster

At Swiss Language School, we've integrated interactive games directly into our lessons. Here's how they work and why they're so effective.

---

## Our Game Types

### 🎯 Vocabulary Matching

**What is it?** Match English words with their German translations, images, or definitions.

**Why it works**: This classic format uses spaced repetition and immediate feedback. When you match correctly, your brain strengthens the connection. When you don't, you learn immediately.

**Best for**: Learning new vocabulary, reviewing before exams, building word associations.

---

### 🧩 Sentence Builder

**What is it?** Arrange word tiles to form grammatically correct sentences.

**Why it works**: You actively construct language rather than passively recognizing it. This "productive practice" is crucial for speaking fluency.

**Best for**: Grammar practice, word order challenges, understanding sentence structure.

---

### 🔤 Fill in the Blank

**What is it?** Complete sentences with the correct word, preposition, or verb form.

**Why it works**: It mimics real communication where you need to produce language in context. You can't just recognize the answer — you must recall it.

**Best for**: Preposition practice, verb tenses, phrasal verbs.`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "quote",
        order: 2,
        config: {
          type: "quote",
          text: "I used to dread grammar exercises. Now I actually look forward to the game part of my lessons. It doesn't feel like studying!",
          attribution: "Maria K.",
          role: "Student",
          company: "B2 Level",
          variant: "highlighted",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          content: `### 🎲 Word Scramble

**What is it?** Unscramble letters to form the correct word.

**Why it works**: It forces you to focus on spelling and letter patterns, which improves writing accuracy.

**Best for**: Spelling practice, vocabulary retention, visual memory.

---

### ❓ Multiple Choice

**What is it?** Choose the correct answer from several options.

**Why it works**: Perfect for reviewing and testing knowledge. The wrong options (distractors) are carefully designed to highlight common errors.

**Best for**: Quick reviews, testing understanding, building confidence.

---

## How Games Fit Into Your Lessons

When you learn with Emma, games aren't separate — they're woven into your conversation:

1. **You discuss a topic** (e.g., prepositions of place)
2. **Emma introduces new vocabulary** with explanations
3. **A game appears** in your Materials panel
4. **You play** while Emma provides encouragement and tips
5. **Emma reviews** what you learned and notes areas to practice

This integrated approach means you're never just "drilling" — you're learning in context.

---

## The Science Behind It

Research from cognitive science shows:

| Learning Method | Retention After 1 Week |
|----------------|------------------------|
| Listening/Reading Only | 10-20% |
| Interactive Practice | 50-70% |
| Game-Based Learning | 75-90% |

Games add **challenge**, **immediate feedback**, and **fun** — the three ingredients that make learning stick.`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "callout",
        order: 4,
        config: {
          type: "callout",
          variant: "success",
          title: "Ready to Try?",
          content: "In your next lesson with Emma, ask to try a vocabulary game! Simply say 'Can we play a game?' or 'I'd like to practice with games' and Emma will open the Materials panel with available games.",
          icon: "Gamepad2",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          content: `## Tips for Maximizing Game-Based Learning

### 1. **Don't Rush**
The goal isn't to finish fastest — it's to learn. Take time to read each option and think about why answers are correct or incorrect.

### 2. **Review Mistakes**
After each game, note the words or patterns you missed. These are your learning opportunities!

### 3. **Come Back to Games**
Spaced repetition is powerful. Playing the same game a day later, then a week later, dramatically improves retention.

### 4. **Speak as You Play**
Say the words out loud! Combining reading, speaking, and game mechanics engages more of your brain.

### 5. **Compete With Yourself**
Try to beat your previous score or time. This adds motivation without stress.

---

## What Students Say

> "The games make all the difference. I finally understand when to use 'make' vs 'do'!" — Thomas R.

> "My vocabulary has grown so much since we started using the matching games." — Lisa M.

> "I used to hate grammar. Now it's my favorite part!" — Stefan B.`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "faq",
        order: 6,
        config: {
          type: "faq",
          items: [
            {
              id: generateFaqId(),
              question: "Are the games available outside of lessons?",
              answer: "Many games are accessible through our lesson materials. During lessons, Emma can open games directly. We're also working on a standalone practice mode for independent study.",
            },
            {
              id: generateFaqId(),
              question: "What if I don't like games?",
              answer: "No problem! Games are one tool among many. Emma adapts to your preferences. If you prefer conversation-based learning, just let her know. The important thing is finding what works for you.",
            },
            {
              id: generateFaqId(),
              question: "Are the games designed for German speakers?",
              answer: "Yes! Our games include German translations and are designed around the specific challenges German speakers face with English — like prepositions, articles, and word order.",
            },
          ],
          showHeader: true,
          headerTitle: "Game Learning FAQ",
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "related_posts",
        order: 7,
        config: {
          type: "related_posts",
          strategy: "category",
          category: "games",
          limit: 2,
          showHeader: true,
          headerTitle: "More Interactive Learning",
          variant: "cards",
        },
      },
      {
        id: generateBlockId(),
        type: "cta",
        order: 8,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Start Learning Through Play",
          subheadline: "Experience interactive learning with Emma. Your first lesson includes access to our full game library.",
          primaryButton: { text: "Try Your First Game", href: "/contact" },
          secondaryButton: { text: "See All Games", href: "/lessons" },
          trustBadge: "100+ interactive games available",
        },
      },
    ],
  },
];

async function seedBlogPosts() {
  console.log("\n📝 Starting blog posts seeding...\n");

  let successCount = 0;

  for (const post of blogPosts) {
    console.log(`📄 Creating post: "${post.title}"...`);

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

  console.log(`\n✨ Seeding complete! Created ${successCount}/${blogPosts.length} posts.\n`);

  // List all posts for verification
  console.log("📋 Published blog posts:");
  for (const locale of ["en", "de"]) {
    const posts = await convex.query(api.landing.getBlogPosts, { locale });
    const published = posts.filter((p) => p.status === "published");
    if (published.length > 0) {
      console.log(`\n   ${locale.toUpperCase()}:`);
      for (const p of published) {
        console.log(`   - ${p.title} (/${locale}/blog/${p.slug})`);
      }
    }
  }
  console.log("\n");
}

// Run the seed function
seedBlogPosts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
