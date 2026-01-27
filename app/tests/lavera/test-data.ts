// Lavera Cambridge English Placement Test - Question Bank
// 60 questions testing A1-C1 levels
// Custom content for natural cosmetics/skincare industry

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type QuestionType =
  | "multiple_choice_cloze"
  | "open_cloze"
  | "word_formation"
  | "key_word_transformation"
  | "reading_comprehension"
  | "grammar_mcq"
  | "vocabulary_mcq";

export interface Question {
  id: string;
  type: QuestionType;
  level: CEFRLevel;
  content: {
    // For MCQ types
    question?: string;
    options?: string[];
    correctAnswer?: number; // index of correct option
    // For open cloze / fill blank
    sentence?: string;
    correctAnswers?: string[]; // acceptable answers
    // For word formation
    stemWord?: string;
    // For key word transformation
    originalSentence?: string;
    keyWord?: string;
    gappedSentence?: string;
    // For reading comprehension
    passage?: string;
    questions?: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
    // General
    context?: string;
    explanation?: string;
  };
  metadata: {
    topic: string;
    difficulty: number; // 0-1
    tags: string[];
  };
}

export interface PlacementTestData {
  id: string;
  title: string;
  company: {
    name: string;
    industry: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  totalQuestions: number;
  questions: Question[];
  levelDescriptions: Record<CEFRLevel, {
    title: string;
    description: string;
    recommendations: string[];
  }>;
}

export const laveraPlacementTest: PlacementTestData = {
  id: "lavera-placement-2026",
  title: "Lavera English Placement Test",
  company: {
    name: "Lavera",
    industry: "Natural Cosmetics",
    logo: "/tests/lavera/lavera-logo.png",
    primaryColor: "#5D8C3D", // Lavera green
    secondaryColor: "#8B4513", // Natural brown
  },
  totalQuestions: 60,
  levelDescriptions: {
    A1: {
      title: "Beginner (A1)",
      description: "You have a basic understanding of everyday English expressions and simple phrases. You can introduce yourself and ask simple questions about personal details.",
      recommendations: [
        "Start with foundational English courses focusing on vocabulary building",
        "Practice basic workplace greetings and introductions",
        "Learn essential product-related vocabulary for your daily tasks",
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
        "Expand industry-specific vocabulary for cosmetics and sustainability",
      ],
    },
    B2: {
      title: "Upper-Intermediate (B2)",
      description: "You can interact with a degree of fluency and spontaneity. You can produce clear, detailed text on a wide range of subjects and explain viewpoints on topical issues.",
      recommendations: [
        "Focus on advanced business communication and presentations",
        "Work on negotiation and persuasion skills",
        "Develop ability to discuss complex sustainability topics",
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
    // A1 LEVEL QUESTIONS (Questions 1-10)
    // Basic grammar, simple vocabulary
    // ============================================
    {
      id: "lavera-001",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "I _____ at Lavera as a product designer.",
        options: ["work", "works", "working", "am work"],
        correctAnswer: 0,
        context: "Complete the sentence with the correct verb form.",
      },
      metadata: {
        topic: "present_simple",
        difficulty: 0.15,
        tags: ["grammar", "verbs", "workplace"],
      },
    },
    {
      id: "lavera-002",
      type: "vocabulary_mcq",
      level: "A1",
      content: {
        question: "Our products are made from _____ ingredients.",
        options: ["natural", "naturally", "nature", "naturals"],
        correctAnswer: 0,
        context: "Choose the correct word.",
      },
      metadata: {
        topic: "adjectives",
        difficulty: 0.18,
        tags: ["vocabulary", "products", "lavera"],
      },
    },
    {
      id: "lavera-003",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "_____ you like to try our new face cream?",
        options: ["Would", "Do", "Are", "Is"],
        correctAnswer: 0,
        context: "Complete the customer service question.",
      },
      metadata: {
        topic: "modals",
        difficulty: 0.2,
        tags: ["grammar", "customer_service"],
      },
    },
    {
      id: "lavera-004",
      type: "vocabulary_mcq",
      level: "A1",
      content: {
        question: "Please put the cream in a _____ before giving it to the customer.",
        options: ["bag", "page", "bug", "big"],
        correctAnswer: 0,
        context: "Choose the correct word for packaging.",
      },
      metadata: {
        topic: "basic_vocabulary",
        difficulty: 0.12,
        tags: ["vocabulary", "retail"],
      },
    },
    {
      id: "lavera-005",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "The shampoo _____ on the top shelf.",
        options: ["is", "are", "be", "being"],
        correctAnswer: 0,
        context: "Complete the sentence about product location.",
      },
      metadata: {
        topic: "be_verb",
        difficulty: 0.15,
        tags: ["grammar", "location"],
      },
    },
    {
      id: "lavera-006",
      type: "vocabulary_mcq",
      level: "A1",
      content: {
        question: "This moisturizer is good for _____ skin.",
        options: ["dry", "drive", "draw", "dream"],
        correctAnswer: 0,
        context: "Choose the word that describes a skin type.",
      },
      metadata: {
        topic: "skin_types",
        difficulty: 0.15,
        tags: ["vocabulary", "cosmetics"],
      },
    },
    {
      id: "lavera-007",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "We _____ open at 9 o'clock every morning.",
        options: ["are", "is", "be", "am"],
        correctAnswer: 0,
        context: "Complete the sentence about business hours.",
      },
      metadata: {
        topic: "be_verb",
        difficulty: 0.18,
        tags: ["grammar", "workplace"],
      },
    },
    {
      id: "lavera-008",
      type: "vocabulary_mcq",
      level: "A1",
      content: {
        question: "The customer wants to _____ the product.",
        options: ["buy", "bye", "by", "bay"],
        correctAnswer: 0,
        context: "Choose the correct verb.",
      },
      metadata: {
        topic: "basic_verbs",
        difficulty: 0.12,
        tags: ["vocabulary", "sales"],
      },
    },
    {
      id: "lavera-009",
      type: "grammar_mcq",
      level: "A1",
      content: {
        question: "_____ is the price of this lip balm?",
        options: ["What", "Who", "Where", "When"],
        correctAnswer: 0,
        context: "Choose the correct question word.",
      },
      metadata: {
        topic: "question_words",
        difficulty: 0.2,
        tags: ["grammar", "questions"],
      },
    },
    {
      id: "lavera-010",
      type: "vocabulary_mcq",
      level: "A1",
      content: {
        question: "Our products do not contain any _____ chemicals.",
        options: ["harmful", "harm", "harming", "harms"],
        correctAnswer: 0,
        context: "Choose the correct form.",
      },
      metadata: {
        topic: "adjectives",
        difficulty: 0.22,
        tags: ["vocabulary", "sustainability"],
      },
    },

    // ============================================
    // A2 LEVEL QUESTIONS (Questions 11-20)
    // Elementary grammar, practical vocabulary
    // ============================================
    {
      id: "lavera-011",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "I have _____ working at Lavera for three years.",
        options: ["been", "be", "being", "was"],
        correctAnswer: 0,
        context: "Complete with the correct form of 'be'.",
      },
      metadata: {
        topic: "present_perfect",
        difficulty: 0.32,
        tags: ["grammar", "tenses"],
      },
    },
    {
      id: "lavera-012",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "The new product launch was very _____. We sold 10,000 units.",
        options: ["successful", "success", "succeed", "successfully"],
        correctAnswer: 0,
        context: "Choose the correct form.",
      },
      metadata: {
        topic: "business_vocabulary",
        difficulty: 0.35,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "lavera-013",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "If you _____ any questions, please ask our customer service team.",
        options: ["have", "had", "having", "has"],
        correctAnswer: 0,
        context: "Complete the conditional sentence.",
      },
      metadata: {
        topic: "first_conditional",
        difficulty: 0.38,
        tags: ["grammar", "conditionals"],
      },
    },
    {
      id: "lavera-014",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "All our packaging is _____ and can be recycled.",
        options: ["eco-friendly", "eco-friend", "eco-friendship", "eco-friendliness"],
        correctAnswer: 0,
        context: "Choose the correct compound adjective.",
      },
      metadata: {
        topic: "sustainability",
        difficulty: 0.35,
        tags: ["vocabulary", "environment"],
      },
    },
    {
      id: "lavera-015",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "The shipment _____ delivered yesterday afternoon.",
        options: ["was", "were", "is", "are"],
        correctAnswer: 0,
        context: "Complete with the correct passive form.",
      },
      metadata: {
        topic: "passive_voice",
        difficulty: 0.4,
        tags: ["grammar", "passive"],
      },
    },
    {
      id: "lavera-016",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "We need to _____ the expiry date on all products.",
        options: ["check", "control", "see", "watch"],
        correctAnswer: 0,
        context: "Choose the most appropriate verb.",
      },
      metadata: {
        topic: "quality_control",
        difficulty: 0.32,
        tags: ["vocabulary", "manufacturing"],
      },
    },
    {
      id: "lavera-017",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "She is _____ customer service representative in the team.",
        options: ["the best", "better", "good", "the more good"],
        correctAnswer: 0,
        context: "Complete with the correct superlative.",
      },
      metadata: {
        topic: "superlatives",
        difficulty: 0.38,
        tags: ["grammar", "comparison"],
      },
    },
    {
      id: "lavera-018",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "The _____ of this cream include organic olive oil and aloe vera.",
        options: ["ingredients", "ingredient", "ingredience", "ingredienting"],
        correctAnswer: 0,
        context: "Choose the correct plural noun.",
      },
      metadata: {
        topic: "product_vocabulary",
        difficulty: 0.3,
        tags: ["vocabulary", "cosmetics"],
      },
    },
    {
      id: "lavera-019",
      type: "grammar_mcq",
      level: "A2",
      content: {
        question: "You _____ wear a hairnet in the production area.",
        options: ["must", "may", "might", "could"],
        correctAnswer: 0,
        context: "Complete with the correct modal for obligation.",
      },
      metadata: {
        topic: "modal_verbs",
        difficulty: 0.35,
        tags: ["grammar", "modals"],
      },
    },
    {
      id: "lavera-020",
      type: "vocabulary_mcq",
      level: "A2",
      content: {
        question: "Please _____ the form and send it to HR.",
        options: ["fill in", "fill on", "fill at", "fill by"],
        correctAnswer: 0,
        context: "Choose the correct phrasal verb.",
      },
      metadata: {
        topic: "phrasal_verbs",
        difficulty: 0.4,
        tags: ["vocabulary", "workplace"],
      },
    },

    // ============================================
    // B1 LEVEL QUESTIONS (Questions 21-35)
    // Intermediate grammar, business vocabulary
    // ============================================
    {
      id: "lavera-021",
      type: "multiple_choice_cloze",
      level: "B1",
      content: {
        question: "The company has _____ a significant investment in sustainable packaging.",
        options: ["made", "done", "taken", "given"],
        correctAnswer: 0,
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
      id: "lavera-022",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "By next month, we _____ the new product line.",
        options: ["will have launched", "will launch", "are launching", "have launched"],
        correctAnswer: 0,
        context: "Complete with the correct future tense.",
      },
      metadata: {
        topic: "future_perfect",
        difficulty: 0.55,
        tags: ["grammar", "tenses"],
      },
    },
    {
      id: "lavera-023",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "Our research and _____ department is developing new formulas.",
        options: ["development", "developing", "develop", "developed"],
        correctAnswer: 0,
        context: "Complete the compound noun.",
      },
      metadata: {
        topic: "business_terminology",
        difficulty: 0.45,
        tags: ["vocabulary", "corporate"],
      },
    },
    {
      id: "lavera-024",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "If we _____ more sustainable suppliers, our carbon footprint would decrease.",
        options: ["found", "find", "will find", "finding"],
        correctAnswer: 0,
        context: "Complete the second conditional.",
      },
      metadata: {
        topic: "second_conditional",
        difficulty: 0.52,
        tags: ["grammar", "conditionals"],
      },
    },
    {
      id: "lavera-025",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "The marketing team needs to _____ consumer preferences before the launch.",
        options: ["analyze", "analysis", "analytical", "analyzing"],
        correctAnswer: 0,
        context: "Choose the correct verb form.",
      },
      metadata: {
        topic: "marketing",
        difficulty: 0.5,
        tags: ["vocabulary", "marketing"],
      },
    },
    {
      id: "lavera-026",
      type: "multiple_choice_cloze",
      level: "B1",
      content: {
        question: "We are _____ negotiations with a new organic supplier.",
        options: ["conducting", "making", "doing", "taking"],
        correctAnswer: 0,
        context: "Choose the correct collocation with 'negotiations'.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.55,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "lavera-027",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "The report _____ by the sustainability team yesterday.",
        options: ["was submitted", "submitted", "has submitted", "is submitted"],
        correctAnswer: 0,
        context: "Complete with the correct passive form.",
      },
      metadata: {
        topic: "passive_voice",
        difficulty: 0.48,
        tags: ["grammar", "passive"],
      },
    },
    {
      id: "lavera-028",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "Customer _____ is our top priority at Lavera.",
        options: ["satisfaction", "satisfy", "satisfying", "satisfactory"],
        correctAnswer: 0,
        context: "Choose the correct noun.",
      },
      metadata: {
        topic: "customer_service",
        difficulty: 0.45,
        tags: ["vocabulary", "service"],
      },
    },
    {
      id: "lavera-029",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "Despite _____ organic, our products remain affordable.",
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
      id: "lavera-030",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "We need to _____ our marketing strategy for the Asian market.",
        options: ["adapt", "adopt", "adept", "adaption"],
        correctAnswer: 0,
        context: "Choose the correct verb meaning 'to modify'.",
      },
      metadata: {
        topic: "business_verbs",
        difficulty: 0.55,
        tags: ["vocabulary", "strategy"],
      },
    },
    {
      id: "lavera-031",
      type: "reading_comprehension",
      level: "B1",
      content: {
        passage: `Lavera Naturkosmetik was founded in 1987 with a simple mission: to create effective cosmetics using only natural and organic ingredients. Over three decades later, the company remains committed to this philosophy.

All Lavera products are certified by NATRUE, the international natural cosmetics label. This certification guarantees that products contain only natural and organic raw materials, with gentle manufacturing processes that respect the environment.

The company sources its ingredients from sustainable farms around the world. For example, the organic olive oil used in many Lavera products comes from small family farms in the Mediterranean region. This approach not only ensures high-quality ingredients but also supports local communities.

In recent years, Lavera has expanded its commitment to sustainability beyond ingredients. The company has invested heavily in eco-friendly packaging, with many products now available in recyclable or biodegradable containers. Their goal is to eliminate all plastic packaging by 2030.`,
        questions: [
          {
            question: "When was Lavera founded?",
            options: ["1978", "1987", "1997", "2007"],
            correctAnswer: 1,
          },
          {
            question: "What does NATRUE certification guarantee?",
            options: [
              "Products are the cheapest on the market",
              "Products contain only natural and organic raw materials",
              "Products are made in Germany",
              "Products are available worldwide",
            ],
            correctAnswer: 1,
          },
          {
            question: "Where does Lavera source its organic olive oil?",
            options: [
              "Large industrial farms",
              "Small family farms in the Mediterranean",
              "Laboratories in Germany",
              "Asian suppliers",
            ],
            correctAnswer: 1,
          },
        ],
        context: "Read the passage and answer the questions.",
      },
      metadata: {
        topic: "company_information",
        difficulty: 0.5,
        tags: ["reading", "comprehension", "lavera"],
      },
    },
    {
      id: "lavera-032",
      type: "multiple_choice_cloze",
      level: "B1",
      content: {
        question: "The quality control team is _____ for testing all products before shipment.",
        options: ["responsible", "response", "responsibility", "responsive"],
        correctAnswer: 0,
        context: "Choose the correct adjective.",
      },
      metadata: {
        topic: "job_responsibilities",
        difficulty: 0.48,
        tags: ["vocabulary", "workplace"],
      },
    },
    {
      id: "lavera-033",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "I wish I _____ more about organic chemistry.",
        options: ["knew", "know", "known", "knowing"],
        correctAnswer: 0,
        context: "Complete the wish sentence about the present.",
      },
      metadata: {
        topic: "wish_clauses",
        difficulty: 0.55,
        tags: ["grammar", "wishes"],
      },
    },
    {
      id: "lavera-034",
      type: "vocabulary_mcq",
      level: "B1",
      content: {
        question: "The new product _____ exceeded our sales expectations.",
        options: ["launch", "launching", "launched", "launcher"],
        correctAnswer: 0,
        context: "Choose the correct noun form.",
      },
      metadata: {
        topic: "marketing",
        difficulty: 0.45,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "lavera-035",
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "Not only _____ organic, but our products are also vegan.",
        options: ["are our products", "our products are", "our products", "are products our"],
        correctAnswer: 0,
        context: "Complete with the correct inverted structure.",
      },
      metadata: {
        topic: "inversion",
        difficulty: 0.58,
        tags: ["grammar", "inversion"],
      },
    },

    // ============================================
    // B2 LEVEL QUESTIONS (Questions 36-50)
    // Upper-intermediate grammar, advanced vocabulary
    // ============================================
    {
      id: "lavera-036",
      type: "multiple_choice_cloze",
      level: "B2",
      content: {
        question: "The board has _____ concerns about the environmental impact of our supply chain.",
        options: ["raised", "risen", "arose", "rising"],
        correctAnswer: 0,
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
      id: "lavera-037",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "Had we anticipated the demand, we _____ production earlier.",
        options: ["would have increased", "would increase", "will have increased", "had increased"],
        correctAnswer: 0,
        context: "Complete the third conditional.",
      },
      metadata: {
        topic: "third_conditional",
        difficulty: 0.68,
        tags: ["grammar", "conditionals"],
      },
    },
    {
      id: "lavera-038",
      type: "word_formation",
      level: "B2",
      content: {
        question: "The company's _____ to sustainability is evident in all its practices.",
        stemWord: "COMMIT",
        options: ["commitment", "committed", "committing", "commits"],
        correctAnswer: 0,
        context: "Form the correct word from the stem.",
      },
      metadata: {
        topic: "word_formation",
        difficulty: 0.6,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "lavera-039",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "The merger will _____ our market position in the organic cosmetics sector.",
        options: ["consolidate", "consolidation", "consolidated", "consolidating"],
        correctAnswer: 0,
        context: "Choose the correct verb form.",
      },
      metadata: {
        topic: "business_vocabulary",
        difficulty: 0.65,
        tags: ["vocabulary", "corporate"],
      },
    },
    {
      id: "lavera-040",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "The CEO insisted that the sustainability report _____ published immediately.",
        options: ["be", "was", "is", "being"],
        correctAnswer: 0,
        context: "Complete with the correct subjunctive form.",
      },
      metadata: {
        topic: "subjunctive",
        difficulty: 0.72,
        tags: ["grammar", "subjunctive"],
      },
    },
    {
      id: "lavera-041",
      type: "multiple_choice_cloze",
      level: "B2",
      content: {
        question: "We need to _____ a balance between profitability and environmental responsibility.",
        options: ["strike", "hit", "beat", "knock"],
        correctAnswer: 0,
        context: "Choose the correct collocation with 'balance'.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.65,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "lavera-042",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "_____ the circumstances, the product recall was handled professionally.",
        options: ["Given", "Giving", "Give", "Having given"],
        correctAnswer: 0,
        context: "Complete with the correct participle form.",
      },
      metadata: {
        topic: "participles",
        difficulty: 0.6,
        tags: ["grammar", "participles"],
      },
    },
    {
      id: "lavera-043",
      type: "word_formation",
      level: "B2",
      content: {
        question: "The _____ of natural ingredients ensures product quality.",
        stemWord: "PURE",
        options: ["purity", "purely", "pureness", "purify"],
        correctAnswer: 0,
        context: "Form the correct noun from the stem.",
      },
      metadata: {
        topic: "word_formation",
        difficulty: 0.58,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "lavera-044",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "The company's carbon _____ has decreased by 30% since 2020.",
        options: ["footprint", "print", "step", "mark"],
        correctAnswer: 0,
        context: "Choose the correct environmental term.",
      },
      metadata: {
        topic: "sustainability",
        difficulty: 0.55,
        tags: ["vocabulary", "environment"],
      },
    },
    {
      id: "lavera-045",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "The new regulations, _____ were introduced last year, have significantly impacted our operations.",
        options: ["which", "what", "that", "who"],
        correctAnswer: 0,
        context: "Complete with the correct relative pronoun.",
      },
      metadata: {
        topic: "relative_clauses",
        difficulty: 0.62,
        tags: ["grammar", "relative_clauses"],
      },
    },
    {
      id: "lavera-046",
      type: "reading_comprehension",
      level: "B2",
      content: {
        passage: `The global natural cosmetics market is experiencing unprecedented growth, driven by increasing consumer awareness about synthetic chemicals and their potential health effects. According to recent industry reports, the market is projected to reach $54 billion by 2027, growing at a compound annual rate of 5.2%.

This growth presents both opportunities and challenges for established players like Lavera. On one hand, the expanding market means more potential customers seeking natural alternatives. On the other hand, it has attracted numerous new entrants, intensifying competition and putting pressure on profit margins.

To maintain its competitive edge, Lavera has implemented a three-pronged strategy. First, the company continues to invest heavily in research and development, focusing on innovative formulations that combine efficacy with sustainability. Second, it has strengthened its supply chain relationships, securing long-term contracts with organic farmers to ensure ingredient availability and price stability. Third, Lavera has embarked on an ambitious digital transformation program, enhancing its e-commerce capabilities and using data analytics to better understand consumer preferences.

Industry analysts suggest that companies which fail to adapt to these changing market dynamics risk losing market share to more agile competitors. The key to success, they argue, lies in maintaining authenticity while embracing innovation.`,
        questions: [
          {
            question: "What is the projected value of the natural cosmetics market by 2027?",
            options: ["$45 billion", "$54 billion", "$64 billion", "$75 billion"],
            correctAnswer: 1,
          },
          {
            question: "According to the passage, what is one challenge of market growth?",
            options: [
              "Decreased consumer interest",
              "Reduced product quality",
              "Intensified competition",
              "Higher ingredient costs",
            ],
            correctAnswer: 2,
          },
          {
            question: "What is NOT mentioned as part of Lavera's strategy?",
            options: [
              "Investing in R&D",
              "Strengthening supply chain relationships",
              "Reducing product prices",
              "Digital transformation",
            ],
            correctAnswer: 2,
          },
          {
            question: "What do industry analysts say is key to success?",
            options: [
              "Lowering prices",
              "Maintaining authenticity while embracing innovation",
              "Expanding into new markets",
              "Reducing sustainability efforts",
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
      id: "lavera-047",
      type: "multiple_choice_cloze",
      level: "B2",
      content: {
        question: "The sustainability initiative has _____ widespread support from stakeholders.",
        options: ["garnered", "garnering", "garner", "garnerers"],
        correctAnswer: 0,
        context: "Choose the correct verb form.",
      },
      metadata: {
        topic: "formal_vocabulary",
        difficulty: 0.68,
        tags: ["vocabulary", "corporate"],
      },
    },
    {
      id: "lavera-048",
      type: "grammar_mcq",
      level: "B2",
      content: {
        question: "It is essential that all employees _____ the new safety protocols.",
        options: ["follow", "follows", "following", "followed"],
        correctAnswer: 0,
        context: "Complete with the correct subjunctive form.",
      },
      metadata: {
        topic: "subjunctive",
        difficulty: 0.65,
        tags: ["grammar", "subjunctive"],
      },
    },
    {
      id: "lavera-049",
      type: "word_formation",
      level: "B2",
      content: {
        question: "The product's _____ has been scientifically proven in clinical trials.",
        stemWord: "EFFECT",
        options: ["effectiveness", "effective", "effecting", "effect"],
        correctAnswer: 0,
        context: "Form the correct noun from the stem.",
      },
      metadata: {
        topic: "word_formation",
        difficulty: 0.55,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "lavera-050",
      type: "vocabulary_mcq",
      level: "B2",
      content: {
        question: "The company has _____ strict quality control measures.",
        options: ["implemented", "implementation", "implementing", "implement"],
        correctAnswer: 0,
        context: "Choose the correct past participle.",
      },
      metadata: {
        topic: "business_verbs",
        difficulty: 0.58,
        tags: ["vocabulary", "manufacturing"],
      },
    },

    // ============================================
    // C1 LEVEL QUESTIONS (Questions 51-60)
    // Advanced grammar, sophisticated vocabulary
    // ============================================
    {
      id: "lavera-051",
      type: "key_word_transformation",
      level: "C1",
      content: {
        originalSentence: "The company regrets not investing in sustainable packaging earlier.",
        keyWord: "WISH",
        gappedSentence: "The company _____ sustainable packaging earlier.",
        options: [
          "wishes it had invested in",
          "wishes to invest in",
          "wishes it invests in",
          "wishes investing in",
        ],
        correctAnswer: 0,
        context: "Complete the sentence using the key word so it has a similar meaning.",
      },
      metadata: {
        topic: "key_word_transformation",
        difficulty: 0.75,
        tags: ["grammar", "transformation"],
      },
    },
    {
      id: "lavera-052",
      type: "multiple_choice_cloze",
      level: "C1",
      content: {
        question: "The audit revealed several _____ in our supply chain documentation.",
        options: ["discrepancies", "discrepancy", "discrepant", "discrepate"],
        correctAnswer: 0,
        context: "Choose the correct noun form.",
      },
      metadata: {
        topic: "formal_vocabulary",
        difficulty: 0.78,
        tags: ["vocabulary", "business"],
      },
    },
    {
      id: "lavera-053",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question: "_____ the financial constraints, the R&D team managed to develop an innovative formula.",
        options: ["Notwithstanding", "Nevertheless", "However", "Although"],
        correctAnswer: 0,
        context: "Complete with the correct formal conjunction.",
      },
      metadata: {
        topic: "formal_connectors",
        difficulty: 0.8,
        tags: ["grammar", "formal_language"],
      },
    },
    {
      id: "lavera-054",
      type: "word_formation",
      level: "C1",
      content: {
        question: "The CEO's _____ approach to sustainability has transformed the company culture.",
        stemWord: "VISION",
        options: ["visionary", "vision", "visible", "visualize"],
        correctAnswer: 0,
        context: "Form the correct adjective from the stem.",
      },
      metadata: {
        topic: "word_formation",
        difficulty: 0.72,
        tags: ["vocabulary", "word_formation"],
      },
    },
    {
      id: "lavera-055",
      type: "key_word_transformation",
      level: "C1",
      content: {
        originalSentence: "It was not until 2020 that the company achieved carbon neutrality.",
        keyWord: "ONLY",
        gappedSentence: "_____ carbon neutrality.",
        options: [
          "Only in 2020 did the company achieve",
          "Only in 2020 the company achieved",
          "Only did the company achieve in 2020",
          "Only the company achieved in 2020",
        ],
        correctAnswer: 0,
        context: "Complete using inversion with the key word.",
      },
      metadata: {
        topic: "inversion",
        difficulty: 0.85,
        tags: ["grammar", "transformation"],
      },
    },
    {
      id: "lavera-056",
      type: "vocabulary_mcq",
      level: "C1",
      content: {
        question: "The stakeholders expressed their _____ regarding the proposed merger.",
        options: ["apprehension", "apprehend", "apprehensive", "apprehensively"],
        correctAnswer: 0,
        context: "Choose the correct noun form.",
      },
      metadata: {
        topic: "formal_vocabulary",
        difficulty: 0.78,
        tags: ["vocabulary", "corporate"],
      },
    },
    {
      id: "lavera-057",
      type: "grammar_mcq",
      level: "C1",
      content: {
        question: "Little _____ that the decision would have such far-reaching consequences.",
        options: ["did they realize", "they realized", "they did realize", "realize they did"],
        correctAnswer: 0,
        context: "Complete the inverted negative construction.",
      },
      metadata: {
        topic: "inversion",
        difficulty: 0.82,
        tags: ["grammar", "inversion"],
      },
    },
    {
      id: "lavera-058",
      type: "multiple_choice_cloze",
      level: "C1",
      content: {
        question: "The company's ethos is _____ rooted in environmental stewardship.",
        options: ["deeply", "deep", "depth", "deepen"],
        correctAnswer: 0,
        context: "Choose the correct adverb form.",
      },
      metadata: {
        topic: "adverbs",
        difficulty: 0.7,
        tags: ["vocabulary", "formal"],
      },
    },
    {
      id: "lavera-059",
      type: "reading_comprehension",
      level: "C1",
      content: {
        passage: `The proliferation of greenwashing in the cosmetics industry has prompted regulatory bodies worldwide to scrutinize environmental claims more rigorously. Companies that once relied on vague terminology such as "natural" or "eco-friendly" without substantiation now face potential legal repercussions and reputational damage.

For genuinely sustainable brands like Lavera, this regulatory tightening presents a paradoxical situation. On one hand, stricter enforcement validates their longstanding commitment to transparency and authentic sustainability practices. The NATRUE certification, which Lavera has maintained since its inception, already exceeds many of the newly proposed standards. On the other hand, the administrative burden of compliance threatens to divert resources from innovation and market expansion.

The European Union's proposed Green Claims Directive exemplifies this regulatory shift. Under the proposed legislation, companies would be required to substantiate environmental claims with scientific evidence and undergo third-party verification. Non-compliance could result in penalties of up to 4% of annual turnover.

Industry observers suggest that the regulatory landscape will continue to evolve, potentially creating a bifurcated market. Brands with genuine sustainability credentials will likely benefit from increased consumer trust, while those engaged in superficial green marketing may find themselves marginalized. The ultimate beneficiaries, proponents argue, will be consumers, who will be better equipped to make informed purchasing decisions.`,
        questions: [
          {
            question: "What has prompted stricter scrutiny of environmental claims?",
            options: [
              "Consumer demand for cheaper products",
              "The proliferation of greenwashing",
              "New product innovations",
              "Declining market sales",
            ],
            correctAnswer: 1,
          },
          {
            question: "Why is the regulatory tightening 'paradoxical' for brands like Lavera?",
            options: [
              "It validates their practices but increases administrative burden",
              "It reduces their market share",
              "It makes their products more expensive",
              "It forces them to change their formulas",
            ],
            correctAnswer: 0,
          },
          {
            question: "What penalty does the proposed EU directive specify for non-compliance?",
            options: [
              "Up to 2% of annual turnover",
              "Up to 4% of annual turnover",
              "Up to 6% of annual turnover",
              "Product recall only",
            ],
            correctAnswer: 1,
          },
        ],
        context: "Read the passage and answer the questions.",
      },
      metadata: {
        topic: "regulatory_environment",
        difficulty: 0.82,
        tags: ["reading", "regulations", "sustainability"],
      },
    },
    {
      id: "lavera-060",
      type: "key_word_transformation",
      level: "C1",
      content: {
        originalSentence: "The success of the product launch can be attributed to the marketing team's efforts.",
        keyWord: "CREDIT",
        gappedSentence: "The marketing team _____ the successful product launch.",
        options: [
          "should be given credit for",
          "should give credit to",
          "credited with",
          "credit should be",
        ],
        correctAnswer: 0,
        context: "Complete using the key word so the sentence has a similar meaning.",
      },
      metadata: {
        topic: "key_word_transformation",
        difficulty: 0.8,
        tags: ["grammar", "transformation"],
      },
    },
  ],
};

// Scoring algorithm to determine CEFR level
export function calculateCEFRLevel(
  answers: Record<string, number | string | Record<number, number>>,
  questions: Question[]
): {
  level: CEFRLevel;
  score: number;
  totalPoints: number;
  levelBreakdown: Record<CEFRLevel, { correct: number; total: number; percentage: number }>;
} {
  const levelBreakdown: Record<CEFRLevel, { correct: number; total: number; percentage: number }> = {
    A1: { correct: 0, total: 0, percentage: 0 },
    A2: { correct: 0, total: 0, percentage: 0 },
    B1: { correct: 0, total: 0, percentage: 0 },
    B2: { correct: 0, total: 0, percentage: 0 },
    C1: { correct: 0, total: 0, percentage: 0 },
  };

  let totalCorrect = 0;
  let totalPoints = 0;

  questions.forEach((question) => {
    const answer = answers[question.id];
    let isCorrect = false;
    let points = 1;

    if (question.type === "reading_comprehension" && question.content.questions) {
      // Reading comprehension has multiple sub-questions
      const subAnswers = answer as Record<number, number>;
      question.content.questions.forEach((subQ, idx) => {
        levelBreakdown[question.level].total++;
        totalPoints++;
        if (subAnswers && subAnswers[idx] === subQ.correctAnswer) {
          levelBreakdown[question.level].correct++;
          totalCorrect++;
        }
      });
      return; // Skip the rest of the loop for this question
    }

    levelBreakdown[question.level].total++;
    totalPoints++;

    if (typeof answer === "number" && question.content.correctAnswer !== undefined) {
      isCorrect = answer === question.content.correctAnswer;
    } else if (typeof answer === "string" && question.content.correctAnswers) {
      isCorrect = question.content.correctAnswers
        .map((a) => a.toLowerCase().trim())
        .includes(answer.toLowerCase().trim());
    }

    if (isCorrect) {
      levelBreakdown[question.level].correct++;
      totalCorrect++;
    }
  });

  // Calculate percentages
  Object.keys(levelBreakdown).forEach((level) => {
    const l = level as CEFRLevel;
    if (levelBreakdown[l].total > 0) {
      levelBreakdown[l].percentage = Math.round(
        (levelBreakdown[l].correct / levelBreakdown[l].total) * 100
      );
    }
  });

  // Determine overall level based on thresholds
  // Need 60%+ at a level and all lower levels to be considered at that level
  let determinedLevel: CEFRLevel = "A1";

  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i];
    let meetsThreshold = true;

    // Check if all levels up to and including this one meet the 60% threshold
    for (let j = 0; j <= i; j++) {
      if (levelBreakdown[levels[j]].percentage < 60) {
        meetsThreshold = false;
        break;
      }
    }

    if (meetsThreshold) {
      determinedLevel = level;
      break;
    }
  }

  // Additional check: if they barely pass lower levels but excel at higher ones,
  // use a weighted approach
  const overallPercentage = totalPoints > 0 ? (totalCorrect / totalPoints) * 100 : 0;

  // Adjust level based on overall performance if the strict method seems off
  if (overallPercentage >= 85 && determinedLevel !== "C1") {
    // Very high performers might be underestimated
    if (levelBreakdown.C1.percentage >= 70) determinedLevel = "C1";
    else if (levelBreakdown.B2.percentage >= 75) determinedLevel = "B2";
  } else if (overallPercentage >= 70 && determinedLevel === "A1") {
    // Medium-high performers might be underestimated
    if (levelBreakdown.B1.percentage >= 65) determinedLevel = "B1";
    else if (levelBreakdown.A2.percentage >= 70) determinedLevel = "A2";
  }

  return {
    level: determinedLevel,
    score: totalCorrect,
    totalPoints,
    levelBreakdown,
  };
}
