#!/usr/bin/env npx tsx
/**
 * Seed script for initial blog posts with professional journalistic content
 *
 * Creates 3 engaging blog posts for the SLS blog:
 * 1. "Understanding English Prepositions" (Grammar)
 * 2. "The Language of International Business" (Business English)
 * 3. "Game-Based Language Acquisition" (Interactive Learning)
 *
 * Each post uses the block-based content system with professional,
 * essay-style content following journalistic best practices.
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
 * Blog posts to seed - Professional journalistic content
 */
const blogPosts = [
  // ============================================
  // POST 1: Understanding English Prepositions
  // ============================================
  {
    locale: "en",
    slug: "master-english-prepositions",
    title: "Understanding English Prepositions: A Guide for German Speakers",
    excerpt:
      "English prepositions present a persistent challenge for German speakers precisely because they resist direct translation. This guide explores the systematic patterns that govern their usage.",
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
          title: "Understanding English Prepositions: A Guide for German Speakers",
          subtitle:
            "English prepositions present a persistent challenge for German speakers precisely because they resist direct translation. This guide explores the systematic patterns that govern their usage.",
          badge: "Grammar",
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
          content: `## The Challenge of Cross-Linguistic Transfer

German speakers learning English encounter a particular difficulty with prepositions that stems from a fundamental difference in how the two languages conceptualize spatial and temporal relationships. In German, one might say "Ich bin in der Arbeit" to indicate being at work, yet English requires "at work" rather than "in work." This discrepancy arises not from arbitrary convention but from deeper semantic distinctions in how each language carves up conceptual space.

The encouraging news for learners is that English prepositions, despite their apparent irregularity, follow discernible patterns. Understanding these patterns transforms what seems like endless memorization into a more systematic acquisition process.

## Spatial and Temporal Prepositions

The three most frequently used prepositions in English are in, on, and at. Each operates according to specific semantic principles that, once understood, apply consistently across numerous contexts.

Consider "in" as the preposition of enclosure or containment. We use it when something exists within boundaries, whether physical or conceptual. This applies to enclosed spaces such as rooms, buildings, and vehicles one sits inside. It extends to geographical regions including cities, countries, and continents. For time expressions, "in" denotes periods with duration, namely parts of the day, months, and years.

The preposition "on" functions differently, indicating contact with a surface or specificity of time. Physically, it describes objects resting on tables, floors, or walls. Temporally, "on" marks specific days, whether named days of the week, holidays, or personal anniversaries such as birthdays.

Where "in" implies enclosure and "on" suggests surface contact, "at" denotes a precise point in either space or time. We use it for specific locations like bus stops, corners, and addresses. For time, "at" marks exact moments: at nine o'clock, at noon, at midnight. The preposition implies precision rather than duration or extent.`,
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
          title: "A Note on German-English Differences",
          content: "German uses distinct prepositions for days (am) and times (um), while English consistently employs 'on' for days and 'at' for specific times. This consistent pairing simplifies the English system once the pattern is recognized.",
          icon: "Lightbulb",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          content: `## Common Transfer Errors and Their Corrections

German speakers frequently produce certain characteristic errors when using English prepositions. Understanding why these errors occur helps in avoiding them.

The phrase "I am in the work" represents a direct translation from German that fails in English, which requires "at work." The distinction lies in English treating "work" as a point of activity rather than a containing space. Similarly, "on the weekend" versus "at the weekend" reflects dialectal variation between American and British English rather than error, though learners should be aware of this difference.

Saying "in Monday" instead of "on Monday" applies the German pattern for days to English, where specific days consistently take "on." The opposite error occurs with parts of the day: "at the morning" should be "in the morning" because morning represents a period rather than a point in time.

## The Transportation Distinction

One domain where English prepositions seem particularly counterintuitive involves vehicles. The governing principle relates to physical capacity: "in" describes vehicles where passengers are enclosed in a seated position, while "on" applies to conveyances where one could theoretically stand and move about.

Thus we say "in a car" or "in a taxi" because passengers sit enclosed within a small space. For buses, trains, planes, and ships, English prefers "on" because these vehicles are large enough to walk around inside. The same principle explains "on a bicycle" where the rider sits atop the frame rather than enclosed within it.`,
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
          title: "Developing Automaticity",
          content: "Interactive practice accelerates the development of intuitive preposition use. Our preposition matching activities, available during lessons, help cement these patterns through active engagement rather than passive study.",
          icon: "Gamepad2",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          content: `## Reference Patterns

For temporal expressions, the following patterns apply consistently. Use "in" for parts of the day such as morning, afternoon, and evening. Use "in" for months, seasons, and years. Use "on" for specific named days and dates. Use "at" for precise clock times, noon, midnight, and night.

For spatial expressions, "in" designates enclosed locations including cities, countries, rooms, and buildings. "On" indicates surfaces such as tables, floors, and streets, as well as floors of buildings in British usage. "At" marks specific addresses, institutions treated as points of contact, and precise locations like corners and bus stops.

## Cognitive Strategies for Retention

Three mental models prove helpful for remembering preposition usage. First, the container model: if the location could be conceived as enclosing something, "in" likely applies. Second, the surface model: if something rests upon or touches a surface, "on" is appropriate. Third, the point model: if the location or time represents a precise, specific point, "at" fits best.

It bears noting that even native English speakers occasionally debate preposition choices, and regional variations exist. The goal of language learning is communication, not the achievement of a perhaps unattainable perfection. Developing a working understanding of these core patterns enables effective communication while continued exposure refines intuitions over time.`,
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
              question: "Why does English use 'at night' but 'in the morning'?",
              answer: "This apparent inconsistency reflects how English conceptualizes these time periods differently. Night is treated as a point in the daily cycle, while morning, afternoon, and evening are conceived as periods with duration. This distinction must simply be learned as a feature of English.",
            },
            {
              id: generateFaqId(),
              question: "Do British and American English differ in preposition usage?",
              answer: "Yes, certain variations exist. The most commonly encountered difference involves weekends: British English prefers 'at the weekend' while American English uses 'on the weekend.' Both are correct within their respective dialects.",
            },
            {
              id: generateFaqId(),
              question: "What is the most effective approach to learning prepositions?",
              answer: "Research in second language acquisition suggests learning prepositions within phrases rather than in isolation. Instead of memorizing that 'at' goes with 'work,' learn the complete phrase 'I am at work.' Phrases are retained more effectively than isolated grammatical rules.",
            },
          ],
          showHeader: true,
          headerTitle: "Common Questions",
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
          headline: "Develop Your Grammar Intuition",
          subheadline: "Practice preposition usage through conversation with Emma, incorporating interactive exercises designed for German speakers.",
          primaryButton: { text: "Begin Learning", href: "/contact" },
          secondaryButton: { text: "Explore Lessons", href: "/lessons" },
          trustBadge: "Complimentary first session",
        },
      },
    ],
  },

  // ============================================
  // POST 2: The Language of International Business
  // ============================================
  {
    locale: "en",
    slug: "business-english-phrases-professionals",
    title: "The Language of International Business: Essential Phrases for German Professionals",
    excerpt:
      "In international business communication, how one expresses an idea often matters as much as the idea itself. Understanding the conventions of English business discourse helps German professionals navigate cross-cultural expectations.",
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
          title: "The Language of International Business: Essential Phrases for German Professionals",
          subtitle:
            "In international business communication, how one expresses an idea often matters as much as the idea itself. Understanding the conventions of English business discourse helps German professionals navigate cross-cultural expectations.",
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
          content: `## The Culture of Corporate Communication

German business communication is characterised by directness and efficiency, qualities valued within German professional culture. English-speaking business environments, particularly those influenced by Anglo-American norms, often expect more diplomatic language that maintains relationship alongside task completion. This difference is not a matter of one approach being superior but of understanding and adapting to differing cultural expectations.

The following phrases represent common conventions in English business communication. Used appropriately, they facilitate smoother interactions across cultural boundaries.

---

## Initiating Contact and Following Up

The phrase "I'd like to touch base with you" serves as an informal way to request a brief conversation or check-in. Its German equivalent might be rendered as wanting to coordinate briefly on a matter. For example, one might write: "I'd like to touch base with you about the quarterly projections when you have a moment this week." The expression conveys friendly professionalism without undue formality.

When a topic requires revisiting, "Could we circle back to that?" allows graceful navigation between discussion points. This proves useful in meetings where multiple subjects compete for attention. It acknowledges the value of a point while deferring its full discussion.

To confirm mutual understanding, "I think we're on the same page" summarizes agreement reached. It creates a moment of explicit consensus that prevents later misunderstandings about what was decided.`,
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
          title: "On Directness",
          content: "German directness is valued in Germany but may appear abrupt in Anglo-American business contexts. Phrases like 'I think' or 'Perhaps we could' soften communication without weakening substantive content. These are rhetorical conventions rather than signs of uncertainty.",
          icon: "Lightbulb",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          content: `## Expressing Disagreement Professionally

Diplomatic disagreement represents perhaps the greatest difference between German and English business communication. The phrase "Let me push back on that a little" introduces a contrary view while maintaining collegial tone. It signals thoughtful engagement rather than conflict.

---

## Planning and Coordination

"Going forward, we should..." introduces future-oriented proposals. It implicitly treats past issues as concluded while directing attention toward solutions. The phrase proves useful when discussing process improvements or changes arising from lessons learned.

Communication management employs phrases like "I'll loop you in on the email," indicating that relevant parties will be included in ongoing correspondence. "Let's take this offline" gracefully moves detailed technical discussions out of larger meetings where they might consume time better spent on matters relevant to all participants.

---

## Commitment and Capacity

When accepting responsibility for a task, "I'll action that and get back to you" combines commitment with a promise of follow-up. Including a specific timeframe strengthens the commitment and aids accountability.

Enquiring about colleagues' availability requires tact. "What's the bandwidth on your end?" asks about capacity in a way that invites honest response about competing demands. It acknowledges that workloads vary and respects colleagues' need to manage their time.

The closing phrase "Let's align on next steps" ensures meetings conclude productively with clear responsibilities assigned. It prevents the common problem of productive discussions that nonetheless end without clarity about who will do what.`,
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
          title: "A Word of Caution",
          content: "These phrases should be deployed strategically rather than constantly. Excessive use of corporate idiom can create the impression of insincerity or lack of substance. The most effective communicators blend conventional phrases with straightforward language.",
          icon: "AlertCircle",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          content: `## Summary Reference

The following phrases serve the indicated functions. "Touch base" initiates informal contact or check-ins. "Circle back" returns discussion to a prior topic. "On the same page" confirms mutual understanding. "Push back" introduces diplomatic disagreement. "Going forward" frames future planning. "Loop in" indicates including others in communication. "Take offline" moves discussions to separate forums. "Action" indicates accepting task responsibility. "Bandwidth" enquires about capacity. "Align" means reaching agreement on plans.

Learning to use these phrases appropriately develops through practice in realistic contexts. Many find that incorporating one new phrase at a time into actual work communications allows natural integration into their professional vocabulary.`,
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
              question: "Are these phrases used in both British and American business English?",
              answer: "Yes, these expressions circulate widely in international business English and are understood in both British and American contexts. Some, such as 'touch base,' originated in American English but have become standard in global business communication.",
            },
            {
              id: generateFaqId(),
              question: "Should German directness be avoided entirely in English business communication?",
              answer: "Not necessarily. The appropriate register depends on your audience and relationship. With German colleagues, directness remains appropriate. With American or British colleagues, particularly in initial interactions, softening phrases often smooth communication. Experienced professionals adapt their register to context.",
            },
            {
              id: generateFaqId(),
              question: "What is the best way to practice these phrases?",
              answer: "Active use in real professional situations proves most effective. Consider focusing on one phrase per week, consciously using it in appropriate contexts. Our business English modules also provide structured practice opportunities through scenario-based exercises.",
            },
          ],
          showHeader: true,
          headerTitle: "Common Questions",
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
          headline: "Develop Your Professional English",
          subheadline: "Practice business English in realistic meeting and email scenarios with personalised feedback on register and appropriateness.",
          primaryButton: { text: "Schedule a Session", href: "/contact" },
          secondaryButton: { text: "View Business Courses", href: "/lessons" },
        },
      },
    ],
  },

  // ============================================
  // POST 3: Game-Based Language Acquisition
  // ============================================
  {
    locale: "en",
    slug: "interactive-games-learn-english",
    title: "Game-Based Language Acquisition: The Research Behind Interactive Learning",
    excerpt:
      "Contemporary research in second language acquisition increasingly supports what learners have long intuited: engagement accelerates learning. Interactive games leverage this principle through immediate feedback and reduced anxiety.",
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
          title: "Game-Based Language Acquisition: The Research Behind Interactive Learning",
          subtitle:
            "Contemporary research in second language acquisition increasingly supports what learners have long intuited: engagement accelerates learning. Interactive games leverage this principle through immediate feedback and reduced anxiety.",
          badge: "Learning Science",
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
          content: `## The Cognitive Case for Interactive Learning

The effectiveness of game-based learning rests on well-established principles from cognitive science and educational psychology. Research consistently demonstrates several advantages of interactive approaches over passive study methods.

Studies show retention improvements of approximately forty percent compared to passive learning when information is processed through active engagement. Games reduce the affective filter, the psychological barrier that anxiety creates against language acquisition. Through repeated active use, learners develop automaticity, the ability to produce language without conscious rule application. Immediate feedback allows rapid error correction and prevents incorrect patterns from becoming entrenched.

At Swiss Language School, interactive games are integrated directly into conversational lessons, creating a seamless connection between structured practice and authentic communication.

---

## Categories of Interactive Practice

Vocabulary matching activities require learners to connect English words with their German translations, visual representations, or definitional descriptions. This format employs spaced repetition principles and provides immediate feedback. Correct matches strengthen neural connections while errors trigger immediate correction. This approach proves particularly effective for building vocabulary, preparing for assessments, and developing word associations.

Sentence construction activities present learners with word tiles to arrange into grammatically correct sequences. Unlike recognition-based exercises, construction requires productive language use, a crucial distinction for developing speaking fluency. These activities address grammar practice, word order challenges, and understanding of syntactic structure.

Gap-fill exercises require learners to complete sentences with appropriate words, prepositions, or verb forms. This format mirrors the demands of real communication where language must be produced in context rather than merely recognised. Particularly valuable for preposition practice, verb tense usage, and phrasal verb mastery.`,
          variant: "default",
        },
      },
      {
        id: generateBlockId(),
        type: "quote",
        order: 2,
        config: {
          type: "quote",
          text: "I used to approach grammar exercises with reluctance. The game components of my lessons changed that entirely. Learning no longer feels like studying.",
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
          content: `Word unscrambling activities require reconstructing correct spelling from disordered letters. This format develops attention to orthographic patterns, improving written accuracy alongside recognition. Useful for spelling practice, vocabulary consolidation, and visual pattern memory.

Multiple choice exercises test knowledge by requiring selection of correct answers from several options. The design of incorrect options, known as distractors, is crucial; they are carefully constructed to highlight common errors and misconceptions. This format serves well for knowledge review, comprehension testing, and confidence building.

---

## Integration Within Conversational Lessons

When learning with Emma, games are not isolated activities but components of a conversational flow. A typical progression begins with discussion of a topic, proceeds to Emma introducing relevant vocabulary with contextual explanation, presents an appropriate game in the Materials panel, allows play with supportive feedback, and concludes with review of what was learned and identification of areas for further practice.

This integrated approach ensures that structured practice connects to meaningful communication rather than existing in isolation.

---

## Research Evidence

Cognitive science provides clear evidence for the effectiveness of different learning approaches. Passive exposure through listening or reading alone yields retention rates of roughly ten to twenty percent after one week. Interactive practice improves this to fifty to seventy percent. Game-based learning with immediate feedback achieves retention rates of seventy-five to ninety percent.

The key factors are challenge at an appropriate level, immediate corrective feedback, and engagement that sustains attention and motivation. Games provide all three elements in combination.`,
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
          title: "Getting Started",
          content: "During any lesson with Emma, request game-based practice by indicating your interest. The Materials panel will display appropriate activities based on your current topic and level.",
          icon: "Gamepad2",
        },
      },
      {
        id: generateBlockId(),
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          content: `## Maximising Learning Outcomes

Several principles enhance the effectiveness of game-based practice. Avoid rushing; the objective is learning rather than speed. Take time to consider why answers are correct or incorrect, building understanding rather than merely memorising patterns.

Review errors after each session. The items answered incorrectly represent the most valuable learning opportunities, indicating knowledge gaps ready to be filled. Return to games after intervals; spaced repetition dramatically improves long-term retention. Playing the same game one day later, then again after a week, consolidates learning more effectively than concentrated practice.

Vocalise during play. Speaking words aloud while reading and responding engages multiple cognitive channels, enhancing encoding and recall. Self-competition against previous scores adds motivational element without external pressure.

---

## Learner Perspectives

Students consistently report that game integration transforms their experience of language learning. The shift from passive study to active engagement makes practice sustainable and even enjoyable. Difficult topics like preposition usage or confusing word pairs become manageable when approached through interactive formats that provide immediate feedback and low-stakes opportunity for error correction.`,
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
              question: "Are games accessible outside of scheduled lessons?",
              answer: "Many game activities are available through lesson materials. During lessons, Emma can open games directly. Standalone practice modes for independent study are under development.",
            },
            {
              id: generateFaqId(),
              question: "What if games are not my preferred learning style?",
              answer: "Games represent one tool among many available approaches. Emma adapts to learner preferences. If conversation-based learning without game elements suits you better, simply indicate this preference. The important consideration is finding approaches that sustain your engagement and progress.",
            },
            {
              id: generateFaqId(),
              question: "Are games designed specifically for German speakers?",
              answer: "Yes. Games include German translations where appropriate and are designed around the specific challenges German speakers face with English, including preposition usage, article systems, and word order differences.",
            },
          ],
          showHeader: true,
          headerTitle: "Common Questions",
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
          headerTitle: "Further Reading",
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
          headline: "Experience Interactive Learning",
          subheadline: "Your first session with Emma includes access to our complete library of interactive learning activities.",
          primaryButton: { text: "Begin Your First Session", href: "/contact" },
          secondaryButton: { text: "View All Resources", href: "/lessons" },
          trustBadge: "Over 100 interactive activities available",
        },
      },
    ],
  },
];

async function seedBlogPosts() {
  console.log("\n📝 Starting blog posts seeding (Professional content)...\n");

  let successCount = 0;

  for (const post of blogPosts) {
    console.log(`📄 Processing: "${post.title}"...`);

    try {
      // Check if post already exists
      const existingPost = await convex.query(api.landing.getBlogPost, {
        locale: post.locale,
        slug: post.slug,
      });

      if (existingPost) {
        // Delete existing post to update with new content
        console.log(`   🔄 Updating existing post "${post.slug}"...`);
        await convex.mutation(api.landing.deleteBlogPost, {
          id: existingPost._id,
        });
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
