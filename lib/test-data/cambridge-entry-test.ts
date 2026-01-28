// Cambridge English Entry Test - 60 Questions
// Generic Business English content for placement testing
// CEFR Levels: A1-C1

import type { PlacementTestData, Question } from "@/app/tests/lavera/test-data";

export const cambridgeEntryTest: PlacementTestData = {
  id: "cambridge-entry-2026",
  title: "Cambridge English Entry Test",
  company: {
    name: "Cambridge Assessment",
    industry: "Language Assessment",
    logo: "/tests/cambridge/test-banner.webp",
    primaryColor: "#1e40af", // Cambridge blue
    secondaryColor: "#3b82f6",
  },
  totalQuestions: 60,
  levelDescriptions: {
    A1: {
      title: "Beginner (A1)",
      description: "You have a basic understanding of everyday English expressions and simple phrases. You can introduce yourself and ask simple questions about personal details.",
      recommendations: [
        "Start with foundational English courses focusing on vocabulary building",
        "Practice basic workplace greetings and introductions",
        "Learn essential business vocabulary for daily tasks",
      ],
    },
    A2: {
      title: "Elementary (A2)",
      description: "You can communicate in simple, routine tasks requiring direct exchange of information. You understand frequently used expressions and can describe your background and immediate environment.",
      recommendations: [
        "Build confidence with intermediate vocabulary courses",
        "Practice describing products and processes in simple terms",
        "Work on understanding simple written communications",
      ],
    },
    B1: {
      title: "Intermediate (B1)",
      description: "You can deal with most situations likely to arise whilst traveling or working in an English-speaking environment. You can produce simple connected text on familiar topics.",
      recommendations: [
        "Develop business writing skills for emails and reports",
        "Practice participating in meetings and discussions",
        "Expand industry-specific vocabulary for your field",
      ],
    },
    B2: {
      title: "Upper-Intermediate (B2)",
      description: "You can interact with a degree of fluency and spontaneity. You can produce clear, detailed text on a wide range of subjects and explain viewpoints on topical issues.",
      recommendations: [
        "Focus on advanced business communication and presentations",
        "Work on negotiation and persuasion skills",
        "Develop ability to discuss complex professional topics",
      ],
    },
    C1: {
      title: "Advanced (C1)",
      description: "You can express yourself fluently and spontaneously. You can use language flexibly and effectively for social, academic, and professional purposes.",
      recommendations: [
        "Refine presentation skills for executive-level communication",
        "Master nuanced language for international negotiations",
        "Focus on leadership communication and strategic discussions",
      ],
    },
  },
  questions: [
    // ============================================
    // A1 LEVEL QUESTIONS (Questions 1-12)
    // Basic grammar, simple vocabulary
    // ============================================
    {
      id: "cambridge-001",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "She _____ to the office every day.",
        options: ["go", "goes", "going", "went"],
        correctAnswer: 1,
        context: "Complete the sentence with the correct verb form.",
      },
      metadata: {
        topic: "present_simple",
        difficulty: 0.15,
        tags: ["grammar", "verbs", "workplace"],
      },
    },
    {
      id: "cambridge-002",
      type: "vocabulary_mcq",
      level: "A1",
      content: {
        question: "What do you call a person who works at the front desk of a hotel?",
        options: ["waiter", "receptionist", "chef", "manager"],
        correctAnswer: 1,
        context: "Choose the correct job title.",
      },
      metadata: {
        topic: "jobs",
        difficulty: 0.12,
        tags: ["vocabulary", "jobs"],
      },
    },
    {
      id: "cambridge-003",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "I _____ a student. I study business.",
        options: ["is", "am", "are", "be"],
        correctAnswer: 1,
        context: "Complete with the correct form of 'be'.",
      },
      metadata: {
        topic: "be_verb",
        difficulty: 0.1,
        tags: ["grammar", "be_verb"],
      },
    },
    {
      id: "cambridge-004",
      type: "vocabulary_mcq",
      level: "A1",
      content: {
        question: "The meeting is at 3 _____.",
        options: ["clock", "o'clock", "hour", "time"],
        correctAnswer: 1,
        context: "Choose the correct word for telling time.",
      },
      metadata: {
        topic: "time",
        difficulty: 0.15,
        tags: ["vocabulary", "time"],
      },
    },
    {
      id: "cambridge-005",
      type: "image_based",
      level: "A1",
      content: {
        imageUrl: "/tests/cambridge/workplace-greeting.webp",
        imageAlt: "Two professionals shaking hands in an office lobby",
        question: "Look at the picture. What are the people doing?",
        options: ["They are eating lunch", "They are shaking hands", "They are working at computers", "They are having a meeting"],
        correctAnswer: 1,
        context: "Look at the image and answer the question.",
      },
      metadata: {
        topic: "workplace_actions",
        difficulty: 0.15,
        tags: ["vocabulary", "workplace", "image"],
      },
    },
    {
      id: "cambridge-006",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "_____ is your name?",
        options: ["Who", "What", "Where", "When"],
        correctAnswer: 1,
        context: "Choose the correct question word.",
      },
      metadata: {
        topic: "question_words",
        difficulty: 0.12,
        tags: ["grammar", "questions"],
      },
    },
    {
      id: "cambridge-007",
      type: "vocabulary_mcq",
      level: "A1",
      content: {
        question: "I work in an _____. It has many desks and computers.",
        options: ["office", "hospital", "restaurant", "school"],
        correctAnswer: 0,
        context: "Choose the correct place.",
      },
      metadata: {
        topic: "places",
        difficulty: 0.1,
        tags: ["vocabulary", "workplace"],
      },
    },
    {
      id: "cambridge-008",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "There _____ three people in the room.",
        options: ["is", "are", "be", "was"],
        correctAnswer: 1,
        context: "Complete with the correct form.",
      },
      metadata: {
        topic: "there_is_are",
        difficulty: 0.18,
        tags: ["grammar", "there_is"],
      },
    },
    {
      id: "cambridge-009",
      type: "image_based",
      level: "A1",
      content: {
        imageUrl: "/tests/cambridge/office-directions.webp",
        imageAlt: "Person at information desk pointing directions",
        question: "The woman is giving _____.",
        options: ["food", "money", "directions", "presents"],
        correctAnswer: 2,
        context: "Look at the image and complete the sentence.",
      },
      metadata: {
        topic: "actions",
        difficulty: 0.18,
        tags: ["vocabulary", "actions", "image"],
      },
    },
    {
      id: "cambridge-010",
      type: "reading_comprehension",
      level: "A1",
      content: {
        passage: `Hello! My name is Maria. I work at a big company. I start work at 9 o'clock in the morning. I have lunch at 12 o'clock. I finish work at 5 o'clock. I like my job very much.`,
        questions: [
          {
            question: "What time does Maria start work?",
            options: ["8 o'clock", "9 o'clock", "10 o'clock", "12 o'clock"],
            correctAnswer: 1,
          },
          {
            question: "When does Maria have lunch?",
            options: ["11 o'clock", "12 o'clock", "1 o'clock", "2 o'clock"],
            correctAnswer: 1,
          },
        ],
        context: "Read the passage and answer the questions.",
      },
      metadata: {
        topic: "daily_routine",
        difficulty: 0.2,
        tags: ["reading", "time", "work"],
      },
    },

    // ============================================
    // A2 LEVEL QUESTIONS (Questions 11-22)
    // Elementary grammar, practical vocabulary
    // ============================================
    {
      id: "cambridge-011",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "I _____ to the conference last week.",
        options: ["go", "went", "going", "gone"],
        correctAnswer: 1,
        context: "Complete with the correct past tense.",
      },
      metadata: {
        topic: "past_simple",
        difficulty: 0.3,
        tags: ["grammar", "past_tense"],
      },
    },
    {
      id: "cambridge-012",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "Could you please _____ this document to the manager?",
        options: ["send", "sending", "sent", "sends"],
        correctAnswer: 0,
        context: "Choose the correct verb form after 'could you please'.",
      },
      metadata: {
        topic: "requests",
        difficulty: 0.32,
        tags: ["vocabulary", "polite_requests"],
      },
    },
    {
      id: "cambridge-013",
      type: "image_based",
      level: "A2",
      content: {
        imageUrl: "/tests/cambridge/customer-service.webp",
        imageAlt: "Customer service representative helping a customer",
        question: "What is the person on the left doing?",
        options: ["Cooking food", "Helping a customer", "Reading a book", "Playing a game"],
        correctAnswer: 1,
        context: "Look at the image and answer the question.",
      },
      metadata: {
        topic: "customer_service",
        difficulty: 0.3,
        tags: ["vocabulary", "service", "image"],
      },
    },
    {
      id: "cambridge-014",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "She has _____ working here for five years.",
        options: ["be", "been", "being", "was"],
        correctAnswer: 1,
        context: "Complete with the correct form.",
      },
      metadata: {
        topic: "present_perfect",
        difficulty: 0.35,
        tags: ["grammar", "present_perfect"],
      },
    },
    {
      id: "cambridge-015",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "The _____ shows who is responsible for each task.",
        options: ["schedule", "receipt", "invoice", "brochure"],
        correctAnswer: 0,
        context: "Choose the correct business document.",
      },
      metadata: {
        topic: "business_documents",
        difficulty: 0.35,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "cambridge-016",
      type: "multiple_choice_cloze",
      level: "A2",
      content: {
        question: "I need to _____ a meeting with the client for next Tuesday.",
        options: ["arrange", "arranging", "arranged", "arranges"],
        correctAnswer: 0,
        context: "Choose the correct verb form.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.38,
        tags: ["vocabulary", "meetings"],
      },
    },
    {
      id: "cambridge-017",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "The report _____ sent yesterday.",
        options: ["is", "was", "were", "be"],
        correctAnswer: 1,
        context: "Complete with the correct passive form.",
      },
      metadata: {
        topic: "passive_voice",
        difficulty: 0.4,
        tags: ["grammar", "passive"],
      },
    },
    {
      id: "cambridge-018",
      type: "image_based",
      level: "A2",
      content: {
        imageUrl: "/tests/cambridge/computer-work.webp",
        imageAlt: "Professional person working at a computer",
        question: "The person is _____ at a computer.",
        options: ["sleeping", "working", "eating", "dancing"],
        correctAnswer: 1,
        context: "Look at the image and complete the sentence.",
      },
      metadata: {
        topic: "actions",
        difficulty: 0.28,
        tags: ["vocabulary", "workplace", "image"],
      },
    },
    {
      id: "cambridge-019",
      type: "reading_comprehension",
      level: "A2",
      content: {
        passage: `Dear Mr. Johnson,

Thank you for your email about the project deadline. I understand that you need the report by Friday. I will make sure to complete it on time.

Please let me know if you need any additional information.

Best regards,
Sarah`,
        questions: [
          {
            question: "When does Mr. Johnson need the report?",
            options: ["Monday", "Wednesday", "Friday", "Next week"],
            correctAnswer: 2,
          },
          {
            question: "What will Sarah do?",
            options: ["Cancel the project", "Complete the report on time", "Ask for more time", "Send additional information"],
            correctAnswer: 1,
          },
        ],
        context: "Read the email and answer the questions.",
      },
      metadata: {
        topic: "business_email",
        difficulty: 0.38,
        tags: ["reading", "email", "business"],
      },
    },
    {
      id: "cambridge-020",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "You _____ arrive on time for the interview.",
        options: ["can", "might", "must", "could"],
        correctAnswer: 2,
        context: "Choose the correct modal verb for obligation.",
      },
      metadata: {
        topic: "modals",
        difficulty: 0.4,
        tags: ["grammar", "modals"],
      },
    },
    {
      id: "cambridge-021",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "Please _____ the form and return it to reception.",
        options: ["fill on", "fill at", "fill in", "fill by"],
        correctAnswer: 2,
        context: "Choose the correct phrasal verb.",
      },
      metadata: {
        topic: "phrasal_verbs",
        difficulty: 0.38,
        tags: ["vocabulary", "phrasal_verbs"],
      },
    },
    {
      id: "cambridge-022",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "She is _____ experienced employee in the department.",
        options: ["more", "most", "the most", "the more"],
        correctAnswer: 2,
        context: "Complete with the correct superlative.",
      },
      metadata: {
        topic: "superlatives",
        difficulty: 0.35,
        tags: ["grammar", "comparison"],
      },
    },

    // ============================================
    // B1 LEVEL QUESTIONS (Questions 23-34)
    // Intermediate grammar, business vocabulary
    // ============================================
    {
      id: "cambridge-023",
      type: "multiple_choice_cloze",
      level: "B1",
      content: {
        question: "The company has _____ a significant investment in new technology.",
        options: ["done", "made", "taken", "given"],
        correctAnswer: 1,
        context: "Choose the correct collocation.",
        explanation: "'Make an investment' is the correct collocation in business English.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.48,
        tags: ["vocabulary", "business", "collocations"],
      },
    },
    {
      id: "cambridge-024",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "By next month, we _____ the project.",
        options: ["will complete", "are completing", "will have completed", "have completed"],
        correctAnswer: 2,
        context: "Complete with the correct future tense.",
      },
      metadata: {
        topic: "future_perfect",
        difficulty: 0.55,
        tags: ["grammar", "tenses"],
      },
    },
    {
      id: "cambridge-025",
      type: "image_based",
      level: "B1",
      content: {
        imageUrl: "/tests/cambridge/team-meeting.webp",
        imageAlt: "Diverse team having a meeting in a glass conference room",
        question: "What type of meeting is most likely taking place?",
        options: [
          "A job interview",
          "A team project discussion",
          "A birthday celebration",
          "A training session for new employees"
        ],
        correctAnswer: 1,
        context: "Look at the workplace scene and choose the best description.",
      },
      metadata: {
        topic: "workplace_situations",
        difficulty: 0.52,
        tags: ["vocabulary", "business", "image"],
      },
    },
    {
      id: "cambridge-026",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "Customer _____ is our top priority.",
        options: ["satisfy", "satisfying", "satisfaction", "satisfactory"],
        correctAnswer: 2,
        context: "Choose the correct noun.",
      },
      metadata: {
        topic: "word_forms",
        difficulty: 0.45,
        tags: ["vocabulary", "service"],
      },
    },
    {
      id: "cambridge-027",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "If we _____ more staff, our service would improve.",
        options: ["hire", "will hire", "hired", "hiring"],
        correctAnswer: 2,
        context: "Complete the second conditional.",
      },
      metadata: {
        topic: "second_conditional",
        difficulty: 0.52,
        tags: ["grammar", "conditionals"],
      },
    },
    {
      id: "cambridge-028",
      type: "multiple_choice_cloze",
      level: "B1",
      content: {
        question: "The quality control team is _____ for testing all products.",
        options: ["response", "responsibility", "responsible", "responsive"],
        correctAnswer: 2,
        context: "Choose the correct adjective.",
      },
      metadata: {
        topic: "word_forms",
        difficulty: 0.48,
        tags: ["vocabulary", "workplace"],
      },
    },
    {
      id: "cambridge-029",
      type: "image_based",
      level: "B1",
      content: {
        imageUrl: "/tests/cambridge/eco-office.webp",
        imageAlt: "Modern sustainable office with plants and natural light",
        question: "What can you infer about this company's values based on the office design?",
        options: [
          "They prioritize low costs over quality",
          "They are committed to sustainability",
          "They focus only on profit",
          "They don't care about employee comfort"
        ],
        correctAnswer: 1,
        context: "Look at the office environment and draw a conclusion.",
      },
      metadata: {
        topic: "inference",
        difficulty: 0.55,
        tags: ["comprehension", "sustainability", "image"],
      },
    },
    {
      id: "cambridge-030",
      type: "reading_comprehension",
      level: "B1",
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
              "Longer working hours"
            ],
            correctAnswer: 1,
          },
          {
            question: "What is mentioned as a challenge of remote work?",
            options: [
              "Higher costs",
              "Better communication",
              "Feelings of isolation",
              "More meetings"
            ],
            correctAnswer: 2,
          },
          {
            question: "What are companies investing in?",
            options: [
              "Office furniture",
              "Travel expenses",
              "Technologies for collaboration",
              "Employee parties"
            ],
            correctAnswer: 2,
          },
        ],
        context: "Read the passage and answer the questions.",
      },
      metadata: {
        topic: "remote_work",
        difficulty: 0.5,
        tags: ["reading", "business", "modern_workplace"],
      },
    },
    {
      id: "cambridge-031",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "Despite _____ busy, she always replies to emails quickly.",
        options: ["being", "be", "to be", "been"],
        correctAnswer: 0,
        context: "Complete with the correct form after 'despite'.",
      },
      metadata: {
        topic: "gerunds",
        difficulty: 0.52,
        tags: ["grammar", "gerunds"],
      },
    },
    {
      id: "cambridge-032",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "We need to _____ our strategy for the new market.",
        options: ["adopt", "adapt", "adept", "adaption"],
        correctAnswer: 1,
        context: "Choose the correct verb meaning 'to modify'.",
      },
      metadata: {
        topic: "business_verbs",
        difficulty: 0.55,
        tags: ["vocabulary", "strategy"],
      },
    },
    {
      id: "cambridge-033",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "I wish I _____ more time to prepare for the presentation.",
        options: ["have", "had", "having", "will have"],
        correctAnswer: 1,
        context: "Complete the wish sentence about the present.",
      },
      metadata: {
        topic: "wish_clauses",
        difficulty: 0.55,
        tags: ["grammar", "wishes"],
      },
    },
    {
      id: "cambridge-034",
      type: "multiple_choice_cloze",
      level: "B1",
      content: {
        question: "The deadline has been _____ until next Friday.",
        options: ["extended", "expanded", "enlarged", "enhanced"],
        correctAnswer: 0,
        context: "Choose the correct verb for deadlines.",
      },
      metadata: {
        topic: "business_vocabulary",
        difficulty: 0.5,
        tags: ["vocabulary", "business"],
      },
    },

    // ============================================
    // B2 LEVEL QUESTIONS (Questions 35-46)
    // Upper-intermediate grammar, advanced vocabulary
    // ============================================
    {
      id: "cambridge-035",
      type: "multiple_choice_cloze",
      level: "B2",
      content: {
        question: "The board has _____ concerns about the financial projections.",
        options: ["risen", "raised", "arose", "rising"],
        correctAnswer: 1,
        context: "Choose the correct verb form.",
        explanation: "'Raise concerns' is a fixed collocation; 'rise' is intransitive.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.62,
        tags: ["vocabulary", "corporate"],
      },
    },
    {
      id: "cambridge-036",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "Had we anticipated the market changes, we _____ our strategy earlier.",
        options: ["would change", "will have changed", "would have changed", "had changed"],
        correctAnswer: 2,
        context: "Complete the third conditional.",
      },
      metadata: {
        topic: "third_conditional",
        difficulty: 0.68,
        tags: ["grammar", "conditionals"],
      },
    },
    {
      id: "cambridge-037",
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
        topic: "word_formation",
        difficulty: 0.6,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "cambridge-038",
      type: "image_based",
      level: "B2",
      content: {
        imageUrl: "/tests/cambridge/presentation.webp",
        imageAlt: "Executive giving presentation to board members",
        question: "This image illustrates an important aspect of corporate communication. Which statement best describes the context?",
        options: [
          "An informal team brainstorming session",
          "A formal executive presentation to stakeholders",
          "A casual lunch meeting",
          "A job interview process"
        ],
        correctAnswer: 1,
        context: "Analyze the business context shown in the image.",
      },
      metadata: {
        topic: "corporate_communication",
        difficulty: 0.6,
        tags: ["comprehension", "business", "image"],
      },
    },
    {
      id: "cambridge-039",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "The CEO insisted that the report _____ published immediately.",
        options: ["was", "be", "is", "being"],
        correctAnswer: 1,
        context: "Complete with the correct subjunctive form.",
      },
      metadata: {
        topic: "subjunctive",
        difficulty: 0.72,
        tags: ["grammar", "subjunctive"],
      },
    },
    {
      id: "cambridge-040",
      type: "multiple_choice_cloze",
      level: "B2",
      content: {
        question: "We need to _____ a balance between innovation and cost control.",
        options: ["hit", "beat", "strike", "knock"],
        correctAnswer: 2,
        context: "Choose the correct collocation with 'balance'.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.65,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "cambridge-041",
      type: "word_formation",
      level: "B2",
      content: {
        question: "The _____ of raw materials ensures product quality.",
        stemWord: "PURE",
        options: ["purely", "purity", "pureness", "purify"],
        correctAnswer: 1,
        context: "Form the correct noun from the stem.",
      },
      metadata: {
        topic: "word_formation",
        difficulty: 0.58,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "cambridge-042",
      type: "reading_comprehension",
      level: "B2",
      content: {
        passage: `The global market is experiencing unprecedented growth, driven by increasing consumer awareness about quality and sustainability. According to recent industry reports, the market is projected to reach $120 billion by 2028, growing at a compound annual rate of 6.5%.

This growth presents both opportunities and challenges for established companies. On one hand, the expanding market means more potential customers. On the other hand, it has attracted numerous new entrants, intensifying competition and putting pressure on profit margins.

To maintain competitive advantage, companies have implemented a three-pronged strategy. First, continued investment in research and development. Second, strengthening supply chain relationships with reliable partners. Third, embarking on digital transformation programs to enhance customer experience.

Industry analysts suggest that companies which fail to adapt to these changing market dynamics risk losing market share to more agile competitors.`,
        questions: [
          {
            question: "What is the projected market value by 2028?",
            options: ["$100 billion", "$110 billion", "$120 billion", "$130 billion"],
            correctAnswer: 2,
          },
          {
            question: "What is one challenge mentioned for established companies?",
            options: [
              "Decreased consumer interest",
              "Reduced product quality",
              "Higher ingredient costs",
              "Intensified competition"
            ],
            correctAnswer: 3,
          },
          {
            question: "What is NOT mentioned as part of the three-pronged strategy?",
            options: [
              "Reducing product prices",
              "Investing in R&D",
              "Strengthening supply chains",
              "Digital transformation"
            ],
            correctAnswer: 0,
          },
          {
            question: "What risk do companies face if they don't adapt?",
            options: [
              "Higher profits",
              "Losing market share",
              "Better customer relations",
              "Increased innovation"
            ],
            correctAnswer: 1,
          },
        ],
        context: "Read the article and answer the questions.",
      },
      metadata: {
        topic: "market_analysis",
        difficulty: 0.65,
        tags: ["reading", "business", "market"],
      },
    },
    {
      id: "cambridge-043",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "_____ the circumstances, the product launch was handled professionally.",
        options: ["Giving", "Given", "Give", "Having given"],
        correctAnswer: 1,
        context: "Complete with the correct participle form.",
      },
      metadata: {
        topic: "participles",
        difficulty: 0.6,
        tags: ["grammar", "participles"],
      },
    },
    {
      id: "cambridge-044",
      type: "word_formation",
      level: "B2",
      content: {
        question: "The product's _____ has been scientifically proven in trials.",
        stemWord: "EFFECT",
        options: ["effective", "effecting", "effectiveness", "effect"],
        correctAnswer: 2,
        context: "Form the correct noun from the stem.",
      },
      metadata: {
        topic: "word_formation",
        difficulty: 0.55,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "cambridge-045",
      type: "multiple_choice_cloze",
      level: "B2",
      content: {
        question: "The initiative has _____ widespread support from stakeholders.",
        options: ["garnering", "garner", "garnered", "garnerers"],
        correctAnswer: 2,
        context: "Choose the correct verb form.",
      },
      metadata: {
        topic: "formal_vocabulary",
        difficulty: 0.68,
        tags: ["vocabulary", "corporate"],
      },
    },
    {
      id: "cambridge-046",
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
          "was seeing him"
        ],
        correctAnswer: 1,
        context: "Complete the sentence using the key word so it has a similar meaning.",
      },
      metadata: {
        topic: "key_word_transformation",
        difficulty: 0.65,
        tags: ["grammar", "transformation"],
      },
    },

    // ============================================
    // C1 LEVEL QUESTIONS (Questions 47-60)
    // Advanced grammar, sophisticated vocabulary
    // ============================================
    {
      id: "cambridge-047",
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
          "wishes investing in"
        ],
        correctAnswer: 1,
        context: "Complete the sentence using the key word so it has a similar meaning.",
      },
      metadata: {
        topic: "key_word_transformation",
        difficulty: 0.75,
        tags: ["grammar", "transformation"],
      },
    },
    {
      id: "cambridge-048",
      type: "multiple_choice_cloze",
      level: "C1",
      content: {
        question: "The audit revealed several _____ in the documentation.",
        options: ["discrepancy", "discrepant", "discrepancies", "discrepate"],
        correctAnswer: 2,
        context: "Choose the correct noun form.",
      },
      metadata: {
        topic: "formal_vocabulary",
        difficulty: 0.78,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "cambridge-049",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question: "_____ the financial constraints, the team managed to deliver excellent results.",
        options: ["Nevertheless", "However", "Notwithstanding", "Although"],
        correctAnswer: 2,
        context: "Complete with the correct formal conjunction.",
      },
      metadata: {
        topic: "formal_connectors",
        difficulty: 0.8,
        tags: ["grammar", "formal_language"],
      },
    },
    {
      id: "cambridge-050",
      type: "key_word_transformation",
      level: "C1",
      content: {
        originalSentence: "It was not until 2020 that the company achieved profitability.",
        keyWord: "ONLY",
        gappedSentence: "_____ profitability.",
        options: [
          "Only in 2020 the company achieved",
          "Only did the company achieve in 2020",
          "Only the company achieved in 2020",
          "Only in 2020 did the company achieve"
        ],
        correctAnswer: 3,
        context: "Complete using inversion with the key word.",
      },
      metadata: {
        topic: "inversion",
        difficulty: 0.85,
        tags: ["grammar", "transformation"],
      },
    },
    {
      id: "cambridge-051",
      type: "vocabulary_mcq",
      level: "C1",
      content: {
        question: "The stakeholders expressed their _____ regarding the proposed changes.",
        options: ["apprehend", "apprehensive", "apprehension", "apprehensively"],
        correctAnswer: 2,
        context: "Choose the correct noun form.",
      },
      metadata: {
        topic: "formal_vocabulary",
        difficulty: 0.78,
        tags: ["vocabulary", "corporate"],
      },
    },
    {
      id: "cambridge-052",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question: "Little _____ that the decision would have such far-reaching consequences.",
        options: ["they realized", "did they realize", "they did realize", "realize they did"],
        correctAnswer: 1,
        context: "Complete the inverted negative construction.",
      },
      metadata: {
        topic: "inversion",
        difficulty: 0.82,
        tags: ["grammar", "inversion"],
      },
    },
    {
      id: "cambridge-053",
      type: "image_based",
      level: "C1",
      content: {
        imageUrl: "/tests/cambridge/strategy-planning.webp",
        imageAlt: "Senior executives in boardroom strategic planning session",
        question: "Considering the corporate setting depicted, which statement most accurately captures the strategic significance of such meetings?",
        options: [
          "They serve primarily as informal team-building exercises",
          "They represent critical touchpoints for aligning stakeholders and ensuring cohesive strategic direction",
          "They are mandatory regulatory requirements with no business value",
          "They function solely as performance reviews for management"
        ],
        correctAnswer: 1,
        context: "Evaluate the business implications of the scene depicted.",
      },
      metadata: {
        topic: "corporate_strategy",
        difficulty: 0.75,
        tags: ["comprehension", "strategy", "image"],
      },
    },
    {
      id: "cambridge-054",
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
        topic: "word_formation",
        difficulty: 0.7,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "cambridge-055",
      type: "multiple_choice_cloze",
      level: "C1",
      content: {
        question: "The company's ethos is _____ rooted in ethical business practices.",
        options: ["deep", "depth", "deeply", "deepen"],
        correctAnswer: 2,
        context: "Choose the correct adverb form.",
      },
      metadata: {
        topic: "adverbs",
        difficulty: 0.7,
        tags: ["vocabulary", "formal"],
      },
    },
    {
      id: "cambridge-056",
      type: "key_word_transformation",
      level: "C1",
      content: {
        originalSentence: "The success of the project can be attributed to the team's efforts.",
        keyWord: "CREDIT",
        gappedSentence: "The team _____ the successful project.",
        options: [
          "should give credit to",
          "credited with",
          "should be given credit for",
          "credit should be"
        ],
        correctAnswer: 2,
        context: "Complete using the key word so the sentence has a similar meaning.",
      },
      metadata: {
        topic: "key_word_transformation",
        difficulty: 0.8,
        tags: ["grammar", "transformation"],
      },
    },
    {
      id: "cambridge-057",
      type: "reading_comprehension",
      level: "C1",
      content: {
        passage: `The proliferation of artificial intelligence in business has prompted organizations worldwide to scrutinize their operational practices more rigorously. Companies that once relied on traditional methods now face potential disruption and the need for rapid adaptation.

For forward-thinking organizations, this technological shift presents a paradoxical situation. On one hand, AI adoption validates their longstanding commitment to innovation and efficiency. Many have already exceeded their transformation goals. On the other hand, the administrative burden of implementation threatens to divert resources from core business activities.

The regulatory landscape exemplifies this shift. Under proposed legislation, companies would be required to ensure AI systems are transparent and accountable. Non-compliance could result in significant penalties.

Industry observers suggest that the business environment will continue to evolve, potentially creating a bifurcated market. Organizations with genuine technological capabilities will likely benefit from increased competitive advantage, while those engaged in superficial modernization may find themselves marginalized.`,
        questions: [
          {
            question: "What has prompted organizations to scrutinize their practices?",
            options: [
              "Consumer demand for lower prices",
              "The proliferation of AI in business",
              "Declining market conditions",
              "Government subsidies"
            ],
            correctAnswer: 1,
          },
          {
            question: "Why is AI adoption described as 'paradoxical' for forward-thinking organizations?",
            options: [
              "It reduces their market share",
              "It validates innovation but increases administrative burden",
              "It makes products more expensive",
              "It requires hiring new employees"
            ],
            correctAnswer: 1,
          },
          {
            question: "What does the passage suggest will happen to organizations that don't genuinely adapt?",
            options: [
              "They will receive government support",
              "They will find new markets",
              "They may become marginalized",
              "They will maintain market position"
            ],
            correctAnswer: 2,
          },
        ],
        context: "Read the passage and answer the questions.",
      },
      metadata: {
        topic: "business_transformation",
        difficulty: 0.82,
        tags: ["reading", "technology", "business"],
      },
    },
    {
      id: "cambridge-058",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question: "It is essential that all employees _____ the new protocols.",
        options: ["follows", "following", "follow", "followed"],
        correctAnswer: 2,
        context: "Complete with the correct subjunctive form.",
      },
      metadata: {
        topic: "subjunctive",
        difficulty: 0.75,
        tags: ["grammar", "subjunctive"],
      },
    },
    {
      id: "cambridge-059",
      type: "word_formation",
      level: "C1",
      content: {
        question: "The company demonstrated remarkable _____ during the economic crisis.",
        stemWord: "RESILIENT",
        options: ["resilience", "resiliently", "resilient", "resiliency"],
        correctAnswer: 0,
        context: "Form the correct noun from the stem.",
      },
      metadata: {
        topic: "word_formation",
        difficulty: 0.72,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "cambridge-060",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question: "Under no circumstances _____ share confidential client information.",
        options: ["employees should", "should employees", "employees must", "employees do"],
        correctAnswer: 1,
        context: "Complete the inverted structure.",
      },
      metadata: {
        topic: "inversion",
        difficulty: 0.8,
        tags: ["grammar", "inversion"],
      },
    },
  ],
};
