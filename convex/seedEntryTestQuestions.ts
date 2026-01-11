import { mutation } from "./_generated/server";

// Seed script for entry test question bank
// Note: This bypasses auth check for seeding purposes
export const seedQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    // Count approved questions
    const approvedQuestions = await ctx.db
      .query("entryTestQuestionBank")
      .withIndex("by_curation_status", (q) => q.eq("curationStatus", "approved"))
      .collect();

    if (approvedQuestions.length >= 20) {
      return { message: "Sufficient approved questions exist, skipping seed", count: approvedQuestions.length };
    }

    // Get any user to use as createdBy (prefer admin)
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    const anyUser = adminUser || await ctx.db.query("users").first();

    if (!anyUser) {
      return { message: "No users found. Please create a user first.", count: 0 };
    }

    const now = Date.now();
    const userId = anyUser._id;

    // Base fields for all questions
    const baseFields = {
      generatedBy: "manual" as const,
      curationStatus: "approved" as const,
      curatedBy: userId,
      curatedAt: now,
      usageCount: 0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    const questions = [];

    // ============================================
    // GRAMMAR MCQ (A1-B2)
    // ============================================
    questions.push({
      ...baseFields,
      type: "grammar_mcq" as const,
      cefrLevel: "A1" as const,
      tags: ["present simple", "verb to be"],
      content: {
        question: "She ___ a student.",
        options: ["am", "is", "are", "be"],
        correctAnswer: 1,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_mcq" as const,
      cefrLevel: "A1" as const,
      tags: ["present simple", "articles"],
      content: {
        question: "I have ___ apple.",
        options: ["a", "an", "the", "---"],
        correctAnswer: 1,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_mcq" as const,
      cefrLevel: "A2" as const,
      tags: ["past simple"],
      content: {
        question: "Yesterday, I ___ to the cinema.",
        options: ["go", "went", "going", "gone"],
        correctAnswer: 1,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_mcq" as const,
      cefrLevel: "A2" as const,
      tags: ["possessives"],
      content: {
        question: "This is ___ book.",
        options: ["me", "my", "mine", "I"],
        correctAnswer: 1,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_mcq" as const,
      cefrLevel: "B1" as const,
      tags: ["present perfect"],
      content: {
        question: "I ___ never been to Japan.",
        options: ["have", "has", "had", "am"],
        correctAnswer: 0,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_mcq" as const,
      cefrLevel: "B2" as const,
      tags: ["conditionals"],
      content: {
        question: "If I ___ rich, I would travel the world.",
        options: ["am", "was", "were", "be"],
        correctAnswer: 2,
      },
      deliveryMode: "text" as const,
    });

    // ============================================
    // GRAMMAR FILL-BLANK (A1-B2)
    // ============================================
    questions.push({
      ...baseFields,
      type: "grammar_fill_blank" as const,
      cefrLevel: "A1" as const,
      tags: ["present simple"],
      content: {
        sentence: "He ___ to school every day.",
        correctAnswer: "goes",
        hint: "Use the correct form of 'go'",
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_fill_blank" as const,
      cefrLevel: "A2" as const,
      tags: ["past simple"],
      content: {
        sentence: "She ___ a letter yesterday.",
        correctAnswer: "wrote",
        hint: "Past tense of 'write'",
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_fill_blank" as const,
      cefrLevel: "A2" as const,
      tags: ["comparatives"],
      content: {
        sentence: "This book is ___ than that one.",
        correctAnswer: "better",
        hint: "Comparative form of 'good'",
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_fill_blank" as const,
      cefrLevel: "B1" as const,
      tags: ["passive voice"],
      content: {
        sentence: "The letter was ___ by my assistant.",
        correctAnswer: "written",
        hint: "Past participle of 'write'",
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_fill_blank" as const,
      cefrLevel: "B1" as const,
      tags: ["modal verbs"],
      content: {
        sentence: "You ___ study harder if you want to pass.",
        correctAnswer: "should",
        hint: "Modal verb for advice",
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "grammar_fill_blank" as const,
      cefrLevel: "B2" as const,
      tags: ["reported speech"],
      content: {
        sentence: "She said that she ___ tired.",
        correctAnswer: "was",
        hint: "Backshift of 'is' in reported speech",
      },
      deliveryMode: "text" as const,
    });

    // ============================================
    // VOCABULARY MCQ (A1-B2)
    // ============================================
    questions.push({
      ...baseFields,
      type: "vocabulary_mcq" as const,
      cefrLevel: "A1" as const,
      tags: ["colors"],
      content: {
        question: "What color is the sky on a sunny day?",
        options: ["Red", "Blue", "Green", "Yellow"],
        correctAnswer: 1,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "vocabulary_mcq" as const,
      cefrLevel: "A1" as const,
      tags: ["numbers"],
      content: {
        question: "How many days are in a week?",
        options: ["Five", "Six", "Seven", "Eight"],
        correctAnswer: 2,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "vocabulary_mcq" as const,
      cefrLevel: "A2" as const,
      tags: ["food"],
      content: {
        question: "Which of these is a vegetable?",
        options: ["Apple", "Carrot", "Banana", "Orange"],
        correctAnswer: 1,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "vocabulary_mcq" as const,
      cefrLevel: "A2" as const,
      tags: ["jobs"],
      content: {
        question: "A person who teaches students is called a ___.",
        options: ["Doctor", "Teacher", "Driver", "Chef"],
        correctAnswer: 1,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "vocabulary_mcq" as const,
      cefrLevel: "B1" as const,
      tags: ["synonyms"],
      content: {
        question: "Which word is closest in meaning to 'happy'?",
        options: ["Sad", "Angry", "Joyful", "Tired"],
        correctAnswer: 2,
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "vocabulary_mcq" as const,
      cefrLevel: "B2" as const,
      tags: ["idioms"],
      content: {
        question: "What does 'break the ice' mean?",
        options: [
          "To freeze something",
          "To start a conversation in a social situation",
          "To break something fragile",
          "To cool down a drink",
        ],
        correctAnswer: 1,
      },
      deliveryMode: "text" as const,
    });

    // ============================================
    // LISTENING MCQ (A2-B2)
    // ============================================
    questions.push({
      ...baseFields,
      type: "listening_mcq" as const,
      cefrLevel: "A2" as const,
      tags: ["daily life"],
      content: {
        audioText: "Hello, my name is Sarah. I live in London and I work as a nurse at the local hospital. I usually start work at 7 in the morning.",
        audioContext: "Listen to Sarah introduce herself.",
        question: "What is Sarah's job?",
        options: ["Teacher", "Doctor", "Nurse", "Driver"],
        correctAnswer: 2,
      },
      deliveryMode: "audio" as const,
    });

    questions.push({
      ...baseFields,
      type: "listening_mcq" as const,
      cefrLevel: "B1" as const,
      tags: ["travel"],
      content: {
        audioText: "The train to Manchester will depart from platform 3 at 14:25. Please make sure you have your tickets ready. The journey will take approximately two hours.",
        audioContext: "Listen to the train station announcement.",
        question: "What time does the train leave?",
        options: ["2:25 PM", "3:25 PM", "4:25 PM", "2:35 PM"],
        correctAnswer: 0,
      },
      deliveryMode: "audio" as const,
    });

    questions.push({
      ...baseFields,
      type: "listening_mcq" as const,
      cefrLevel: "B1" as const,
      tags: ["weather"],
      content: {
        audioText: "Good morning! Today's weather forecast shows sunny skies in the morning with temperatures reaching 25 degrees. However, expect some rain in the afternoon, so don't forget your umbrella.",
        audioContext: "Listen to the weather forecast.",
        question: "What will the weather be like in the afternoon?",
        options: ["Sunny", "Cloudy", "Rainy", "Snowy"],
        correctAnswer: 2,
      },
      deliveryMode: "audio" as const,
    });

    questions.push({
      ...baseFields,
      type: "listening_mcq" as const,
      cefrLevel: "B2" as const,
      tags: ["business"],
      content: {
        audioText: "Thank you all for joining today's meeting. As you know, our quarterly sales have increased by 15% compared to last year. However, we need to address the rising costs in our supply chain. I propose we explore alternative suppliers.",
        audioContext: "Listen to the business meeting excerpt.",
        question: "What is the main concern mentioned in the meeting?",
        options: [
          "Decreasing sales",
          "Rising supply chain costs",
          "Employee turnover",
          "Marketing budget",
        ],
        correctAnswer: 1,
      },
      deliveryMode: "audio" as const,
    });

    // ============================================
    // READING COMPREHENSION (B1-B2)
    // ============================================
    questions.push({
      ...baseFields,
      type: "reading_comprehension" as const,
      cefrLevel: "B1" as const,
      tags: ["environment"],
      content: {
        passage: `Climate change is one of the biggest challenges facing our planet today. Scientists have observed rising temperatures, melting ice caps, and more frequent extreme weather events. Many countries are now working together to reduce carbon emissions and find sustainable energy sources.

Individuals can also make a difference by reducing their energy consumption, using public transport, and recycling. Small changes in our daily habits can have a big impact when everyone participates.`,
        questions: [
          {
            question: "What have scientists observed as effects of climate change?",
            options: [
              "Lower temperatures",
              "Rising temperatures and melting ice",
              "More stable weather",
              "Cleaner air",
            ],
            correctAnswer: 1,
          },
          {
            question: "What can individuals do to help?",
            options: [
              "Drive more cars",
              "Use more electricity",
              "Reduce energy consumption and recycle",
              "Ignore the problem",
            ],
            correctAnswer: 2,
          },
        ],
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "reading_comprehension" as const,
      cefrLevel: "B2" as const,
      tags: ["technology"],
      content: {
        passage: `Artificial Intelligence (AI) is transforming the way we live and work. From virtual assistants on our phones to recommendation systems on streaming platforms, AI is becoming an integral part of our daily lives.

However, the rapid advancement of AI technology has raised important ethical questions. Concerns about privacy, job displacement, and algorithmic bias need to be addressed as AI becomes more prevalent. Experts suggest that we need clear regulations and guidelines to ensure that AI is developed and used responsibly.`,
        questions: [
          {
            question: "According to the passage, where is AI commonly used?",
            options: [
              "Only in hospitals",
              "Virtual assistants and streaming platforms",
              "Only in factories",
              "Nowhere currently",
            ],
            correctAnswer: 1,
          },
          {
            question: "What concerns are raised about AI?",
            options: [
              "It's too expensive",
              "Privacy, job displacement, and algorithmic bias",
              "It's too slow",
              "It uses too much paper",
            ],
            correctAnswer: 1,
          },
        ],
      },
      deliveryMode: "text" as const,
    });

    // ============================================
    // WRITING PROMPT (B1-B2)
    // ============================================
    questions.push({
      ...baseFields,
      type: "writing_prompt" as const,
      cefrLevel: "B1" as const,
      tags: ["personal", "daily life"],
      content: {
        prompt: "Describe your favorite holiday destination and explain why you like it.",
        requirements: [
          "Write 80-120 words",
          "Include details about the location",
          "Explain what activities you enjoy there",
        ],
        wordCount: { min: 80, max: 120 },
      },
      deliveryMode: "text" as const,
    });

    questions.push({
      ...baseFields,
      type: "writing_prompt" as const,
      cefrLevel: "B2" as const,
      tags: ["opinion", "technology"],
      content: {
        prompt: "Do you think social media has a positive or negative impact on society? Give reasons for your opinion.",
        requirements: [
          "Write 120-180 words",
          "State your opinion clearly",
          "Provide at least two supporting arguments",
          "Include a conclusion",
        ],
        wordCount: { min: 120, max: 180 },
      },
      deliveryMode: "text" as const,
    });

    // ============================================
    // SPEAKING PROMPT (B1-B2)
    // ============================================
    questions.push({
      ...baseFields,
      type: "speaking_prompt" as const,
      cefrLevel: "B1" as const,
      tags: ["personal", "hobbies"],
      content: {
        prompt: "Talk about a hobby or activity you enjoy in your free time.",
        followUpQuestions: [
          "When did you start this hobby?",
          "Why do you enjoy it?",
          "How often do you do it?",
        ],
        duration: { min: 60, max: 120 },
      },
      deliveryMode: "avatar" as const,
    });

    questions.push({
      ...baseFields,
      type: "speaking_prompt" as const,
      cefrLevel: "B2" as const,
      tags: ["opinion", "work"],
      content: {
        prompt: "What do you think are the most important qualities for success in the workplace?",
        followUpQuestions: [
          "Can you give an example from your experience?",
          "How can people develop these qualities?",
          "Do you think these qualities have changed over time?",
        ],
        duration: { min: 90, max: 180 },
      },
      deliveryMode: "avatar" as const,
    });

    // Insert all questions
    for (const q of questions) {
      await ctx.db.insert("entryTestQuestionBank", q);
    }

    return { message: "Successfully seeded questions", count: questions.length };
  },
});
