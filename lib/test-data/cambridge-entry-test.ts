// Cambridge English Entry Test - 60 Questions
// 6 Bands x 10 Questions each
// Following Cambridge Assessment Guidelines

import type { PlacementTestData, Question } from "@/app/tests/lavera/test-data";

export const cambridgeEntryTest: PlacementTestData = {
  id: "cambridge-entry-2026",
  title: "Cambridge English Entry Test",
  company: {
    name: "Cambridge Assessment",
    industry: "Language Assessment",
    logo: "/tests/cambridge/test-banner.webp",
    primaryColor: "#5D8C3D",
    secondaryColor: "#4A7030",
  },
  totalQuestions: 60,
  levelDescriptions: {
    A1: {
      title: "Beginner (A1)",
      description:
        "You are at the beginning of your English learning journey. You can understand and use familiar everyday expressions and very basic phrases aimed at satisfying concrete needs.",
      recommendations: [
        "Start with foundational vocabulary and common phrases",
        "Practice basic greetings and introductions",
        "Focus on present simple tense with common verbs",
      ],
    },
    A2: {
      title: "Elementary (A2)",
      description:
        "You have a foundation in basic English. You can understand and use familiar everyday expressions and basic phrases. You can communicate in simple, routine tasks.",
      recommendations: [
        "Build confidence with structured vocabulary courses",
        "Practice basic workplace conversations and greetings",
        "Focus on present and past simple tenses",
      ],
    },
    B1: {
      title: "Intermediate (B1)",
      description:
        "You can deal with most situations likely to arise whilst traveling or working. You can produce simple connected text on familiar topics and describe experiences.",
      recommendations: [
        "Develop business writing skills for emails",
        "Practice participating in meetings and discussions",
        "Work on present perfect and conditional structures",
      ],
    },
    B2: {
      title: "Upper-Intermediate (B2)",
      description:
        "You can interact with a degree of fluency and spontaneity. You can understand the main ideas of complex text and produce clear, detailed text on a wide range of subjects.",
      recommendations: [
        "Focus on advanced conditionals and modal verbs",
        "Work on nuanced collocations and register awareness",
        "Practice formal business communication",
      ],
    },
    C1: {
      title: "Advanced (C1)",
      description:
        "You can express yourself fluently and spontaneously. You can use language flexibly and effectively for social, academic, and professional purposes with high accuracy.",
      recommendations: [
        "Refine understanding of subtle meaning differences",
        "Master advanced clause structures and inversion",
        "Focus on idiomatic and academic language",
      ],
    },
  },
  questions: [
    // ============================================
    // BAND 1 (Questions 1-10): A2 → early B1
    // Basic verb tenses (present, past simple)
    // Simple sentence structure, core prepositions
    // Basic word order, high-frequency vocabulary
    // ============================================
    {
      id: "cambridge-001",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "She _____ to the office every morning.",
        options: ["go", "goes", "going", "gone"],
        correctAnswer: 1,
        context: "Complete with the correct present simple form.",
      },
      metadata: {
        band: 1,
        topic: "present_simple",
        difficulty: 0.15,
        tags: ["grammar", "verbs", "workplace"],
      },
    },
    {
      id: "cambridge-002",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "I _____ the report yesterday.",
        options: ["finish", "finished", "finishing", "finishes"],
        correctAnswer: 1,
        context: "Complete with the correct past simple form.",
      },
      metadata: {
        band: 1,
        topic: "past_simple",
        difficulty: 0.18,
        tags: ["grammar", "past_tense"],
      },
    },
    {
      id: "cambridge-003",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "The meeting room is _____ the second floor.",
        options: ["in", "at", "on", "by"],
        correctAnswer: 2,
        context: "Choose the correct preposition.",
      },
      metadata: {
        band: 1,
        topic: "prepositions",
        difficulty: 0.2,
        tags: ["vocabulary", "prepositions"],
      },
    },
    {
      id: "cambridge-004",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "There _____ three people waiting in the lobby.",
        options: ["is", "are", "was", "be"],
        correctAnswer: 1,
        context: "Complete with the correct form.",
      },
      metadata: {
        band: 1,
        topic: "there_is_are",
        difficulty: 0.15,
        tags: ["grammar", "sentence_structure"],
      },
    },
    {
      id: "cambridge-005",
      type: "image_based",
      level: "A2",
      content: {
        imageUrl: "/tests/cambridge/workplace-greeting.webp",
        imageAlt: "Two professionals shaking hands in an office lobby",
        question: "What are the people doing in the picture?",
        options: [
          "They are eating lunch",
          "They are shaking hands",
          "They are working at computers",
          "They are having a meeting",
        ],
        correctAnswer: 1,
        context: "Look at the image and answer the question.",
      },
      metadata: {
        band: 1,
        topic: "workplace_actions",
        difficulty: 0.15,
        tags: ["vocabulary", "workplace", "image"],
      },
    },
    {
      id: "cambridge-006",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "I work _____ a large company in the city centre.",
        options: ["in", "for", "to", "at"],
        correctAnswer: 1,
        context: "Choose the correct preposition.",
      },
      metadata: {
        band: 1,
        topic: "prepositions",
        difficulty: 0.22,
        tags: ["vocabulary", "workplace"],
      },
    },
    {
      id: "cambridge-007",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "_____ you at the conference last week?",
        options: ["Was", "Were", "Are", "Is"],
        correctAnswer: 1,
        context: "Complete with the correct past form of 'be'.",
      },
      metadata: {
        band: 1,
        topic: "past_simple_be",
        difficulty: 0.2,
        tags: ["grammar", "past_tense"],
      },
    },
    {
      id: "cambridge-008",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "What do you call a person who works at the front desk of a hotel?",
        options: ["waiter", "receptionist", "chef", "manager"],
        correctAnswer: 1,
        context: "Choose the correct job title.",
      },
      metadata: {
        band: 1,
        topic: "jobs",
        difficulty: 0.15,
        tags: ["vocabulary", "jobs"],
      },
    },
    {
      id: "cambridge-009",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "He doesn't _____ coffee in the evening.",
        options: ["drinks", "drink", "drinking", "drank"],
        correctAnswer: 1,
        context: "Complete with the correct verb form after 'doesn't'.",
      },
      metadata: {
        band: 1,
        topic: "present_simple_negative",
        difficulty: 0.2,
        tags: ["grammar", "present_simple"],
      },
    },
    {
      id: "cambridge-010",
      type: "image_based",
      level: "A2",
      content: {
        imageUrl: "/tests/cambridge/office-directions.webp",
        imageAlt: "Person at information desk pointing directions",
        question: "The person at the desk is giving _____.",
        options: ["food", "money", "directions", "presents"],
        correctAnswer: 2,
        context: "Look at the image and complete the sentence.",
      },
      metadata: {
        band: 1,
        topic: "actions",
        difficulty: 0.18,
        tags: ["vocabulary", "actions", "image"],
      },
    },

    // ============================================
    // BAND 2 (Questions 11-20): solid B1
    // Present perfect vs past simple
    // Comparatives/superlatives, basic conditionals
    // Modal verbs, common collocations
    // ============================================
    {
      id: "cambridge-011",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "I _____ here since 2019.",
        options: ["work", "worked", "have worked", "am working"],
        correctAnswer: 2,
        context: "Choose the correct tense with 'since'.",
      },
      metadata: {
        band: 2,
        topic: "present_perfect",
        difficulty: 0.35,
        tags: ["grammar", "tenses"],
      },
    },
    {
      id: "cambridge-012",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "She is the _____ experienced person in our team.",
        options: ["more", "most", "much", "many"],
        correctAnswer: 1,
        context: "Complete with the correct superlative form.",
      },
      metadata: {
        band: 2,
        topic: "superlatives",
        difficulty: 0.32,
        tags: ["grammar", "comparison"],
      },
    },
    {
      id: "cambridge-013",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "If it _____ tomorrow, we'll cancel the outdoor event.",
        options: ["rains", "will rain", "rained", "is raining"],
        correctAnswer: 0,
        context: "Complete the first conditional.",
      },
      metadata: {
        band: 2,
        topic: "first_conditional",
        difficulty: 0.38,
        tags: ["grammar", "conditionals"],
      },
    },
    {
      id: "cambridge-014",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "You _____ wear a suit to the interview.",
        options: ["can", "might", "should", "would"],
        correctAnswer: 2,
        context: "Choose the modal verb for advice.",
      },
      metadata: {
        band: 2,
        topic: "modals_advice",
        difficulty: 0.35,
        tags: ["grammar", "modals"],
      },
    },
    {
      id: "cambridge-015",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "We need to _____ a decision before Friday.",
        options: ["do", "make", "take", "have"],
        correctAnswer: 1,
        context: "Choose the correct collocation.",
      },
      metadata: {
        band: 2,
        topic: "collocations",
        difficulty: 0.38,
        tags: ["vocabulary", "collocations"],
      },
    },
    {
      id: "cambridge-016",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "Have you ever _____ to London?",
        options: ["go", "went", "been", "going"],
        correctAnswer: 2,
        context: "Complete with the correct form after 'Have you ever'.",
      },
      metadata: {
        band: 2,
        topic: "present_perfect_experience",
        difficulty: 0.35,
        tags: ["grammar", "present_perfect"],
      },
    },
    {
      id: "cambridge-017",
      type: "image_based",
      level: "B1",
      content: {
        imageUrl: "/tests/cambridge/customer-service.webp",
        imageAlt: "Customer service representative helping a customer",
        question: "The employee is _____ the customer with their enquiry.",
        options: ["helping", "telling", "speaking", "watching"],
        correctAnswer: 0,
        context: "Look at the image and complete the sentence.",
      },
      metadata: {
        band: 2,
        topic: "customer_service",
        difficulty: 0.32,
        tags: ["vocabulary", "service", "image"],
      },
    },
    {
      id: "cambridge-018",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "This report is _____ than the one I wrote last month.",
        options: ["good", "better", "best", "more good"],
        correctAnswer: 1,
        context: "Complete with the correct comparative.",
      },
      metadata: {
        band: 2,
        topic: "comparatives",
        difficulty: 0.3,
        tags: ["grammar", "comparison"],
      },
    },
    {
      id: "cambridge-019",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "I'd like to _____ a meeting for next Tuesday.",
        options: ["arrange", "arranging", "arranged", "arranges"],
        correctAnswer: 0,
        context: "Choose the correct verb form after 'I'd like to'.",
      },
      metadata: {
        band: 2,
        topic: "meetings_vocabulary",
        difficulty: 0.35,
        tags: ["vocabulary", "meetings"],
      },
    },
    {
      id: "cambridge-020",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "You _____ ask permission before using company equipment.",
        options: ["can", "must", "would", "could"],
        correctAnswer: 1,
        context: "Choose the modal for obligation.",
      },
      metadata: {
        band: 2,
        topic: "modals_obligation",
        difficulty: 0.4,
        tags: ["grammar", "modals"],
      },
    },

    // ============================================
    // BAND 3 (Questions 21-30): B1+
    // More complex tense contrasts, passive voice
    // Indirect questions, verb patterns
    // Abstract vocabulary
    // ============================================
    {
      id: "cambridge-021",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "The project _____ completed by the end of the month.",
        options: ["is", "will be", "was", "has"],
        correctAnswer: 1,
        context: "Complete with the correct passive form.",
      },
      metadata: {
        band: 3,
        topic: "passive_voice",
        difficulty: 0.45,
        tags: ["grammar", "passive"],
      },
    },
    {
      id: "cambridge-022",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "Could you tell me where the conference room _____?",
        options: ["is", "is it", "it is", "does it"],
        correctAnswer: 0,
        context: "Complete the indirect question.",
      },
      metadata: {
        band: 3,
        topic: "indirect_questions",
        difficulty: 0.48,
        tags: ["grammar", "questions"],
      },
    },
    {
      id: "cambridge-023",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "The company decided _____ in new equipment.",
        options: ["invest", "investing", "to invest", "invested"],
        correctAnswer: 2,
        context: "Choose the correct verb pattern after 'decided'.",
      },
      metadata: {
        band: 3,
        topic: "verb_patterns",
        difficulty: 0.45,
        tags: ["grammar", "verb_patterns"],
      },
    },
    {
      id: "cambridge-024",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "While I _____ the report, the phone rang.",
        options: ["write", "wrote", "was writing", "have written"],
        correctAnswer: 2,
        context: "Choose the correct tense for a past interrupted action.",
      },
      metadata: {
        band: 3,
        topic: "past_continuous",
        difficulty: 0.45,
        tags: ["grammar", "tenses"],
      },
    },
    {
      id: "cambridge-025",
      type: "image_based",
      level: "B1",
      content: {
        imageUrl: "/tests/cambridge/computer-work.webp",
        imageAlt: "Professional person working at a computer",
        question:
          "Based on the image, which statement best describes the work environment?",
        options: [
          "A casual home office",
          "A modern professional workspace",
          "A factory production line",
          "A retail store",
        ],
        correctAnswer: 1,
        context: "Analyze the workplace setting shown.",
      },
      metadata: {
        band: 3,
        topic: "workplace_analysis",
        difficulty: 0.45,
        tags: ["comprehension", "workplace", "image"],
      },
    },
    {
      id: "cambridge-026",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "Customer _____ is our highest priority.",
        options: ["satisfy", "satisfying", "satisfaction", "satisfactory"],
        correctAnswer: 2,
        context: "Choose the correct noun form.",
      },
      metadata: {
        band: 3,
        topic: "word_forms",
        difficulty: 0.48,
        tags: ["vocabulary", "word_forms"],
      },
    },
    {
      id: "cambridge-027",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "I don't know what time the meeting _____.",
        options: ["starts", "does start", "is starting", "start"],
        correctAnswer: 0,
        context: "Complete the indirect question with the correct form.",
      },
      metadata: {
        band: 3,
        topic: "indirect_questions",
        difficulty: 0.5,
        tags: ["grammar", "questions"],
      },
    },
    {
      id: "cambridge-028",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "The quality control team is _____ for testing all products.",
        options: ["response", "responsibility", "responsible", "responsive"],
        correctAnswer: 2,
        context: "Choose the correct adjective.",
      },
      metadata: {
        band: 3,
        topic: "word_forms",
        difficulty: 0.48,
        tags: ["vocabulary", "workplace"],
      },
    },
    {
      id: "cambridge-029",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "The report _____ sent to all managers yesterday.",
        options: ["is", "was", "has been", "be"],
        correctAnswer: 1,
        context: "Complete with the correct past passive form.",
      },
      metadata: {
        band: 3,
        topic: "passive_voice_past",
        difficulty: 0.45,
        tags: ["grammar", "passive"],
      },
    },
    {
      id: "cambridge-030",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "She avoided _____ the difficult questions.",
        options: ["answer", "to answer", "answering", "answered"],
        correctAnswer: 2,
        context: "Choose the correct verb pattern after 'avoided'.",
      },
      metadata: {
        band: 3,
        topic: "verb_patterns",
        difficulty: 0.5,
        tags: ["grammar", "verb_patterns"],
      },
    },

    // ============================================
    // BAND 4 (Questions 31-40): B1+ → B2
    // Complex verb patterns, reported speech
    // Adverbial word order, dependent prepositions
    // Longer sentence processing
    // ============================================
    {
      id: "cambridge-031",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "She said that she _____ the proposal the day before.",
        options: ["will send", "has sent", "had sent", "sends"],
        correctAnswer: 2,
        context: "Complete the reported speech.",
      },
      metadata: {
        band: 4,
        topic: "reported_speech",
        difficulty: 0.55,
        tags: ["grammar", "reported_speech"],
      },
    },
    {
      id: "cambridge-032",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "The success depends _____ your commitment to the project.",
        options: ["in", "at", "on", "for"],
        correctAnswer: 2,
        context: "Choose the correct dependent preposition.",
      },
      metadata: {
        band: 4,
        topic: "dependent_prepositions",
        difficulty: 0.52,
        tags: ["vocabulary", "prepositions"],
      },
    },
    {
      id: "cambridge-033",
      type: "image_based",
      level: "B2",
      content: {
        imageUrl: "/tests/cambridge/team-meeting.webp",
        imageAlt: "Diverse team having a meeting in a glass conference room",
        question:
          "Which statement best describes the communication dynamic shown?",
        options: [
          "A one-way presentation with no interaction",
          "A collaborative discussion among team members",
          "A formal job interview process",
          "A conflict resolution meeting",
        ],
        correctAnswer: 1,
        context: "Analyze the team dynamics in the image.",
      },
      metadata: {
        band: 4,
        topic: "workplace_dynamics",
        difficulty: 0.55,
        tags: ["comprehension", "business", "image"],
      },
    },
    {
      id: "cambridge-034",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "He asked me where I _____ the previous year.",
        options: ["work", "worked", "had worked", "was working"],
        correctAnswer: 2,
        context: "Complete the reported question.",
      },
      metadata: {
        band: 4,
        topic: "reported_questions",
        difficulty: 0.58,
        tags: ["grammar", "reported_speech"],
      },
    },
    {
      id: "cambridge-035",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "We need to comply _____ the new regulations.",
        options: ["to", "for", "with", "at"],
        correctAnswer: 2,
        context: "Choose the correct dependent preposition.",
      },
      metadata: {
        band: 4,
        topic: "dependent_prepositions",
        difficulty: 0.55,
        tags: ["vocabulary", "prepositions"],
      },
    },
    {
      id: "cambridge-036",
      type: "reading_comprehension",
      level: "B2",
      content: {
        passage: `Remote work has become increasingly popular in recent years. Many companies now offer flexible working arrangements that allow employees to work from home several days a week.

Studies show that remote workers often report higher job satisfaction and improved work-life balance. However, some challenges remain, including difficulty with communication and feelings of isolation.

Companies are investing in new technologies to help remote teams collaborate more effectively. Video conferencing, project management software, and instant messaging tools have become essential for modern businesses.`,
        questions: [
          {
            question: "According to the passage, what do remote workers often report?",
            options: [
              "Lower salaries",
              "Higher job satisfaction",
              "More travel time",
              "Longer working hours",
            ],
            correctAnswer: 1,
          },
          {
            question: "What is mentioned as a challenge of remote work?",
            options: [
              "Higher costs",
              "Better communication",
              "Feelings of isolation",
              "More meetings",
            ],
            correctAnswer: 2,
          },
        ],
        context: "Read the passage and answer the questions.",
      },
      metadata: {
        band: 4,
        topic: "remote_work",
        difficulty: 0.55,
        tags: ["reading", "business", "modern_workplace"],
      },
    },
    {
      id: "cambridge-037",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "Rarely _____ such dedication from new employees.",
        options: ["we see", "do we see", "we do see", "see we"],
        correctAnswer: 1,
        context: "Complete with the correct inverted form.",
      },
      metadata: {
        band: 4,
        topic: "inversion",
        difficulty: 0.6,
        tags: ["grammar", "word_order"],
      },
    },
    {
      id: "cambridge-038",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "The manager insisted _____ reviewing all the documents.",
        options: ["in", "on", "at", "for"],
        correctAnswer: 1,
        context: "Choose the correct dependent preposition.",
      },
      metadata: {
        band: 4,
        topic: "dependent_prepositions",
        difficulty: 0.55,
        tags: ["vocabulary", "prepositions"],
      },
    },
    {
      id: "cambridge-039",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "He recommended that she _____ for the senior position.",
        options: ["applies", "apply", "applied", "applying"],
        correctAnswer: 1,
        context: "Complete with the correct subjunctive form.",
      },
      metadata: {
        band: 4,
        topic: "subjunctive",
        difficulty: 0.6,
        tags: ["grammar", "verb_patterns"],
      },
    },
    {
      id: "cambridge-040",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "Despite the challenges, they succeeded _____ meeting the deadline.",
        options: ["at", "in", "on", "for"],
        correctAnswer: 1,
        context: "Choose the correct preposition.",
      },
      metadata: {
        band: 4,
        topic: "dependent_prepositions",
        difficulty: 0.58,
        tags: ["vocabulary", "prepositions"],
      },
    },

    // ============================================
    // BAND 5 (Questions 41-50): B2
    // Advanced conditionals, nuanced modal meaning
    // Collocations, register awareness
    // Grammatical precision
    // ============================================
    {
      id: "cambridge-041",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "Had we known about the delay, we _____ our plans.",
        options: [
          "would change",
          "will have changed",
          "would have changed",
          "had changed",
        ],
        correctAnswer: 2,
        context: "Complete the third conditional.",
      },
      metadata: {
        band: 5,
        topic: "third_conditional",
        difficulty: 0.65,
        tags: ["grammar", "conditionals"],
      },
    },
    {
      id: "cambridge-042",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "The board has _____ concerns about the financial projections.",
        options: ["risen", "raised", "arose", "rising"],
        correctAnswer: 1,
        context: "Choose the correct collocation with 'concerns'.",
      },
      metadata: {
        band: 5,
        topic: "collocations",
        difficulty: 0.62,
        tags: ["vocabulary", "corporate"],
      },
    },
    {
      id: "cambridge-043",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question:
          "The CEO insisted that the report _____ published immediately.",
        options: ["was", "be", "is", "being"],
        correctAnswer: 1,
        context: "Complete with the correct subjunctive form.",
      },
      metadata: {
        band: 5,
        topic: "subjunctive",
        difficulty: 0.68,
        tags: ["grammar", "formal_language"],
      },
    },
    {
      id: "cambridge-044",
      type: "image_based",
      level: "B2",
      content: {
        imageUrl: "/tests/cambridge/eco-office.webp",
        imageAlt: "Modern sustainable office with plants and natural light",
        question:
          "What can you infer about this company's corporate values based on the office design?",
        options: [
          "They prioritize cost reduction over employee welfare",
          "They are committed to sustainability and employee wellbeing",
          "They focus exclusively on profit maximization",
          "They prefer traditional office environments",
        ],
        correctAnswer: 1,
        context: "Analyze the office environment and draw conclusions.",
      },
      metadata: {
        band: 5,
        topic: "inference",
        difficulty: 0.62,
        tags: ["comprehension", "sustainability", "image"],
      },
    },
    {
      id: "cambridge-045",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "We need to _____ a balance between innovation and cost control.",
        options: ["hit", "beat", "strike", "knock"],
        correctAnswer: 2,
        context: "Choose the correct collocation with 'balance'.",
      },
      metadata: {
        band: 5,
        topic: "collocations",
        difficulty: 0.65,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "cambridge-046",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "You _____ have informed us earlier about the changes.",
        options: ["can", "might", "should", "would"],
        correctAnswer: 2,
        context: "Choose the modal expressing criticism about the past.",
      },
      metadata: {
        band: 5,
        topic: "modals_past",
        difficulty: 0.65,
        tags: ["grammar", "modals"],
      },
    },
    {
      id: "cambridge-047",
      type: "word_formation",
      level: "B2",
      content: {
        question: "The company's _____ to quality is evident in all its products.",
        stemWord: "COMMIT",
        options: ["committed", "commitment", "committing", "commits"],
        correctAnswer: 1,
        context: "Form the correct word from the stem.",
      },
      metadata: {
        band: 5,
        topic: "word_formation",
        difficulty: 0.6,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "cambridge-048",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "_____ the circumstances, the product launch was handled well.",
        options: ["Giving", "Given", "Give", "Having given"],
        correctAnswer: 1,
        context: "Complete with the correct participle form.",
      },
      metadata: {
        band: 5,
        topic: "participles",
        difficulty: 0.62,
        tags: ["grammar", "participles"],
      },
    },
    {
      id: "cambridge-049",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "The initiative has _____ widespread support from stakeholders.",
        options: ["garnering", "garner", "garnered", "garnerers"],
        correctAnswer: 2,
        context: "Choose the correct verb form.",
      },
      metadata: {
        band: 5,
        topic: "formal_vocabulary",
        difficulty: 0.68,
        tags: ["vocabulary", "register"],
      },
    },
    {
      id: "cambridge-050",
      type: "key_word_transformation",
      level: "B2",
      content: {
        originalSentence: "I haven't seen him since last year's conference.",
        keyWord: "SAW",
        gappedSentence: "The last time I _____ at last year's conference.",
        options: [
          "saw him being",
          "saw him was",
          "have saw him",
          "was seeing him",
        ],
        correctAnswer: 1,
        context: "Complete using the key word so the sentence has similar meaning.",
      },
      metadata: {
        band: 5,
        topic: "key_word_transformation",
        difficulty: 0.65,
        tags: ["grammar", "transformation"],
      },
    },

    // ============================================
    // BAND 6 (Questions 51-60): high B2 → C1
    // Subtle meaning differences
    // Advanced clause structures, less frequent grammar
    // Idiomatic/academic language, error recognition
    // ============================================
    {
      id: "cambridge-051",
      type: "key_word_transformation",
      level: "C1",
      content: {
        originalSentence: "The company regrets not investing in technology earlier.",
        keyWord: "WISH",
        gappedSentence: "The company _____ technology earlier.",
        options: [
          "wishes to invest in",
          "wishes it had invested in",
          "wishes it invests in",
          "wishes investing in",
        ],
        correctAnswer: 1,
        context: "Complete using the key word so the sentence has similar meaning.",
      },
      metadata: {
        band: 6,
        topic: "key_word_transformation",
        difficulty: 0.75,
        tags: ["grammar", "transformation"],
      },
    },
    {
      id: "cambridge-052",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question:
          "_____ the financial constraints, the team delivered excellent results.",
        options: ["Nevertheless", "However", "Notwithstanding", "Although"],
        correctAnswer: 2,
        context: "Choose the correct formal connector.",
      },
      metadata: {
        band: 6,
        topic: "formal_connectors",
        difficulty: 0.78,
        tags: ["grammar", "academic_language"],
      },
    },
    {
      id: "cambridge-053",
      type: "vocabulary_mcq",
      level: "C1",
      content: {
        question: "The audit revealed several _____ in the documentation.",
        options: ["discrepancy", "discrepant", "discrepancies", "discrepate"],
        correctAnswer: 2,
        context: "Choose the correct noun form.",
      },
      metadata: {
        band: 6,
        topic: "formal_vocabulary",
        difficulty: 0.75,
        tags: ["vocabulary", "academic"],
      },
    },
    {
      id: "cambridge-054",
      type: "key_word_transformation",
      level: "C1",
      content: {
        originalSentence:
          "It was not until 2020 that the company achieved profitability.",
        keyWord: "ONLY",
        gappedSentence: "_____ profitability.",
        options: [
          "Only in 2020 the company achieved",
          "Only did the company achieve in 2020",
          "Only the company achieved in 2020",
          "Only in 2020 did the company achieve",
        ],
        correctAnswer: 3,
        context: "Complete using inversion with the key word.",
      },
      metadata: {
        band: 6,
        topic: "inversion",
        difficulty: 0.82,
        tags: ["grammar", "advanced_structures"],
      },
    },
    {
      id: "cambridge-055",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question:
          "Little _____ that the decision would have such far-reaching consequences.",
        options: [
          "they realized",
          "did they realize",
          "they did realize",
          "realize they did",
        ],
        correctAnswer: 1,
        context: "Complete the inverted negative construction.",
      },
      metadata: {
        band: 6,
        topic: "inversion",
        difficulty: 0.8,
        tags: ["grammar", "inversion"],
      },
    },
    {
      id: "cambridge-056",
      type: "image_based",
      level: "C1",
      content: {
        imageUrl: "/tests/cambridge/presentation.webp",
        imageAlt: "Executive giving presentation to board members",
        question:
          "Which statement most accurately captures the strategic significance of executive presentations?",
        options: [
          "They serve primarily as informal networking opportunities",
          "They represent critical touchpoints for stakeholder alignment and strategic communication",
          "They are mandatory compliance requirements with limited business value",
          "They function primarily as employee performance evaluations",
        ],
        correctAnswer: 1,
        context: "Evaluate the business context depicted in the image.",
      },
      metadata: {
        band: 6,
        topic: "corporate_communication",
        difficulty: 0.75,
        tags: ["comprehension", "strategy", "image"],
      },
    },
    {
      id: "cambridge-057",
      type: "reading_comprehension",
      level: "C1",
      content: {
        passage: `The proliferation of artificial intelligence in business has prompted organizations worldwide to scrutinize their operational practices more rigorously. Companies that once relied on traditional methods now face potential disruption and the need for rapid adaptation.

For forward-thinking organizations, this technological shift presents a paradoxical situation. On one hand, AI adoption validates their longstanding commitment to innovation and efficiency. On the other hand, the administrative burden of implementation threatens to divert resources from core business activities.

Industry analysts suggest that the business environment will continue to evolve, potentially creating a bifurcated market where organizations with genuine technological capabilities benefit from increased competitive advantage, while those engaged in superficial modernization may find themselves marginalized.`,
        questions: [
          {
            question:
              "Why is AI adoption described as 'paradoxical' for forward-thinking organizations?",
            options: [
              "It reduces their market share",
              "It validates innovation but increases administrative burden",
              "It makes products more expensive",
              "It requires hiring new employees",
            ],
            correctAnswer: 1,
          },
          {
            question:
              "What does the passage suggest will happen in a 'bifurcated market'?",
            options: [
              "All companies will benefit equally",
              "Technology companies will merge",
              "Some companies will gain advantage while others become marginalized",
              "Government regulations will increase",
            ],
            correctAnswer: 2,
          },
        ],
        context: "Read the passage and answer the questions.",
      },
      metadata: {
        band: 6,
        topic: "business_transformation",
        difficulty: 0.8,
        tags: ["reading", "technology", "academic"],
      },
    },
    {
      id: "cambridge-058",
      type: "word_formation",
      level: "C1",
      content: {
        question: "The merger faced _____ opposition from employee unions.",
        stemWord: "CONSIDER",
        options: ["considered", "considerable", "considerate", "consideration"],
        correctAnswer: 1,
        context: "Form the correct adjective from the stem.",
      },
      metadata: {
        band: 6,
        topic: "word_formation",
        difficulty: 0.72,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "cambridge-059",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question: "It is essential that all employees _____ the new protocols.",
        options: ["follows", "following", "follow", "followed"],
        correctAnswer: 2,
        context: "Complete with the correct subjunctive form.",
      },
      metadata: {
        band: 6,
        topic: "subjunctive",
        difficulty: 0.75,
        tags: ["grammar", "formal_language"],
      },
    },
    {
      id: "cambridge-060",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question: "Under no circumstances _____ share confidential client information.",
        options: [
          "employees should",
          "should employees",
          "employees must",
          "employees do",
        ],
        correctAnswer: 1,
        context: "Complete the inverted structure.",
      },
      metadata: {
        band: 6,
        topic: "inversion",
        difficulty: 0.8,
        tags: ["grammar", "inversion"],
      },
    },
  ],
};
