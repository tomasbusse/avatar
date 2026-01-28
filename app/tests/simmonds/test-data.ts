// Simmonds Business English Placement Test - Question Bank
// 60 questions testing A1-C1 levels
// Verbatim questions from Cambridge-style placement test PDF

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type QuestionType =
  | "notice_identification"
  | "cloze_passage"
  | "sentence_completion"
  | "grammar_mcq"
  | "vocabulary_mcq";

export interface Question {
  id: string;
  type: QuestionType;
  level: CEFRLevel;
  band: number; // 1-6 band from the test
  content: {
    // For notice identification
    notice?: string;
    // For standard MCQ
    question?: string;
    options?: string[];
    correctAnswer?: number; // index of correct option
    // For cloze passages
    passageTitle?: string;
    passageText?: string;
    gapNumber?: number;
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

// Cloze passage texts for reference in the UI
export const clozePassages = {
  scotland: {
    title: "Scotland",
    text: `Scotland is the north part of the island of Great Britain. The Atlantic Ocean is on the west and the North Sea on the east. Some people (6) _____ Scotland speak a different language called Gaelic. There are (7) _____ five million people in Scotland, and Edinburgh is (8) _____ most famous city.

Scotland has many mountains; the highest one is called 'Ben Nevis'. In the south of Scotland, there are lot of sheep. A long time ago, there (9) _____ many forests, but now there are only a (10) _____.

Scotland is only a small country, but it is quite beautiful.`,
  },
  aliceGuyBlache: {
    title: "Alice Guy Blaché",
    text: `Alice Guy Blaché was the first female film director. She first became involved in cinema whilst working for the Gaumont Film Company in the late 1890s. This was a period of great change in the cinema and Alice was the first to use many new inventions, (11) _____ sound and colour.

In 1907 Alice (12) _____ to New York where she started her own film company. She was (13) _____ successful, but, when Hollywood became the centre of the film world, the best days of the independent New York film companies were (14) _____. When Alice died in 1968, hardly anybody (15) _____ her name.`,
  },
  ufos: {
    title: "UFOs",
    text: `UFO is short for 'unidentified flying object'. UFOs are popularly known as flying saucers, (16) _____ that is often the (17) _____ they are reported to be. The (18) _____ 'flying saucers' were seen in 1947 by an American pilot, but experts who studied his claim decided it had been a trick of the light.

Even people experienced at watching the sky, (19) _____ as pilots, report seeing UFOs. In 1978 a pilot reported a collection of UFOs off the coast of New Zealand. A television (20) _____ went up with the pilot and filmed the UFOs. Scientists studying this phenomenon later discovered that in this case they were simply lights on boats out fishing.`,
  },
  skyscrapers: {
    title: "Skyscrapers",
    text: `Nowadays, skyscrapers can be found in most major cities of the world. A building which was many (41) _____ high was first called a skyscraper in the United States at the end of the 19th century, and New York has perhaps the (42) _____ skyscraper of them all, the Empire State Building.

The (43) _____ beneath the streets of New York is rock, (44) _____ enough to take the heaviest load without sinking, and is therefore well-suited to bearing the (45) _____ of tall buildings.`,
  },
  scrabble: {
    title: "Scrabble",
    text: `Scrabble is the world's most popular word game. For its origins, we have to go back to the 1930s in the USA, when Alfred Butts, an architect, found himself out of (46) _____. He decided that there was a (47) _____ for a board game based on words, and (48) _____ to design one.

Eventually he made a (49) _____ from it, in spite of the fact that his original (50) _____ was only three cents a game.`,
  },
};

export const simmondsPlacementTest: PlacementTestData = {
  id: "simmonds-placement-2026",
  title: "Simmonds Business English Placement Test",
  company: {
    name: "Simmonds Language Services",
    industry: "Corporate Language Training",
    logo: "/tests/simmonds/simmonds-logo.png",
    primaryColor: "#5D8C3D", // Green (same as Cambridge style)
    secondaryColor: "#1a365d", // Dark blue
  },
  totalQuestions: 60,
  levelDescriptions: {
    A1: {
      title: "Beginner (A1)",
      description: "You have a basic understanding of everyday English expressions and simple phrases. You can introduce yourself and ask simple questions about personal details.",
      recommendations: [
        "Start with foundational English courses focusing on vocabulary building",
        "Practice basic workplace greetings and introductions",
        "Learn essential business vocabulary for your daily tasks",
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
        "Expand industry-specific vocabulary for your sector",
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
    // BAND 1: Questions 1-10 (A1/A2 Level)
    // Notice identification + Scotland cloze
    // ============================================

    // Questions 1-5: Notice Identification
    // "Where can you see these notices?"
    {
      id: "simmonds-001",
      type: "notice_identification",
      level: "A1",
      band: 1,
      content: {
        context: "Where can you see this notice?",
        notice: "Please leave your room key at Reception.",
        options: ["in a shop", "in a hotel", "in a taxi"],
        correctAnswer: 1, // B: in a hotel
      },
      metadata: {
        topic: "notices",
        difficulty: 0.15,
        tags: ["reading", "notices", "accommodation"],
      },
    },
    {
      id: "simmonds-002",
      type: "notice_identification",
      level: "A1",
      band: 1,
      content: {
        context: "Where can you see this notice?",
        notice: "Foreign money changed here",
        options: ["in a library", "in a bank", "in a police station"],
        correctAnswer: 1, // B: in a bank
      },
      metadata: {
        topic: "notices",
        difficulty: 0.15,
        tags: ["reading", "notices", "finance"],
      },
    },
    {
      id: "simmonds-003",
      type: "notice_identification",
      level: "A1",
      band: 1,
      content: {
        context: "Where can you see this notice?",
        notice: "AFTERNOON SHOW BEGINS AT 2PM",
        options: ["outside a theatre", "outside a supermarket", "outside a restaurant"],
        correctAnswer: 0, // A: outside a theatre
      },
      metadata: {
        topic: "notices",
        difficulty: 0.15,
        tags: ["reading", "notices", "entertainment"],
      },
    },
    {
      id: "simmonds-004",
      type: "notice_identification",
      level: "A1",
      band: 1,
      content: {
        context: "Where can you see this notice?",
        notice: "CLOSED FOR HOLIDAYS - Lessons start again on 8th January",
        options: ["at a travel agent's", "at a music school", "at a restaurant"],
        correctAnswer: 1, // B: at a music school
      },
      metadata: {
        topic: "notices",
        difficulty: 0.18,
        tags: ["reading", "notices", "education"],
      },
    },
    {
      id: "simmonds-005",
      type: "notice_identification",
      level: "A1",
      band: 1,
      content: {
        context: "Where can you see this notice?",
        notice: "Price per night: £10 a tent, £5 a person",
        options: ["at a cinema", "in a hotel", "at a camp-site"],
        correctAnswer: 2, // C: at a camp-site
      },
      metadata: {
        topic: "notices",
        difficulty: 0.18,
        tags: ["reading", "notices", "accommodation"],
      },
    },

    // Questions 6-10: Scotland Cloze (A/B/C options)
    {
      id: "simmonds-006",
      type: "cloze_passage",
      level: "A1",
      band: 1,
      content: {
        passageTitle: "Scotland",
        passageText: clozePassages.scotland.text,
        gapNumber: 6,
        question: "Some people (6) _____ Scotland speak a different language called Gaelic.",
        options: ["on", "in", "at"],
        correctAnswer: 1, // B: in
        context: "Read the text about Scotland and choose the best word for each gap.",
      },
      metadata: {
        topic: "prepositions",
        difficulty: 0.2,
        tags: ["grammar", "prepositions", "geography"],
      },
    },
    {
      id: "simmonds-007",
      type: "cloze_passage",
      level: "A1",
      band: 1,
      content: {
        passageTitle: "Scotland",
        passageText: clozePassages.scotland.text,
        gapNumber: 7,
        question: "There are (7) _____ five million people in Scotland...",
        options: ["about", "between", "among"],
        correctAnswer: 0, // A: about
        context: "Read the text about Scotland and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.2,
        tags: ["vocabulary", "numbers", "approximation"],
      },
    },
    {
      id: "simmonds-008",
      type: "cloze_passage",
      level: "A1",
      band: 1,
      content: {
        passageTitle: "Scotland",
        passageText: clozePassages.scotland.text,
        gapNumber: 8,
        question: "...and Edinburgh is (8) _____ most famous city.",
        options: ["his", "your", "its"],
        correctAnswer: 2, // C: its
        context: "Read the text about Scotland and choose the best word for each gap.",
      },
      metadata: {
        topic: "pronouns",
        difficulty: 0.22,
        tags: ["grammar", "possessive_pronouns"],
      },
    },
    {
      id: "simmonds-009",
      type: "cloze_passage",
      level: "A2",
      band: 1,
      content: {
        passageTitle: "Scotland",
        passageText: clozePassages.scotland.text,
        gapNumber: 9,
        question: "A long time ago, there (9) _____ many forests...",
        options: ["is", "were", "was"],
        correctAnswer: 1, // B: were
        context: "Read the text about Scotland and choose the best word for each gap.",
      },
      metadata: {
        topic: "past_tense",
        difficulty: 0.25,
        tags: ["grammar", "tenses", "past_simple"],
      },
    },
    {
      id: "simmonds-010",
      type: "cloze_passage",
      level: "A2",
      band: 1,
      content: {
        passageTitle: "Scotland",
        passageText: clozePassages.scotland.text,
        gapNumber: 10,
        question: "...but now there are only a (10) _____.",
        options: ["few", "little", "lot"],
        correctAnswer: 0, // A: few
        context: "Read the text about Scotland and choose the best word for each gap.",
      },
      metadata: {
        topic: "quantifiers",
        difficulty: 0.28,
        tags: ["grammar", "quantifiers"],
      },
    },

    // ============================================
    // BAND 2: Questions 11-20 (A2/B1 Level)
    // Alice Guy Blaché cloze + UFOs cloze
    // ============================================

    // Questions 11-15: Alice Guy Blaché Cloze (A/B/C/D options)
    {
      id: "simmonds-011",
      type: "cloze_passage",
      level: "A2",
      band: 2,
      content: {
        passageTitle: "Alice Guy Blaché",
        passageText: clozePassages.aliceGuyBlache.text,
        gapNumber: 11,
        question: "...Alice was the first to use many new inventions, (11) _____ sound and colour.",
        options: ["bringing", "including", "containing", "supporting"],
        correctAnswer: 1, // B: including
        context: "Read the text about Alice Guy Blaché and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.35,
        tags: ["vocabulary", "verbs"],
      },
    },
    {
      id: "simmonds-012",
      type: "cloze_passage",
      level: "A2",
      band: 2,
      content: {
        passageTitle: "Alice Guy Blaché",
        passageText: clozePassages.aliceGuyBlache.text,
        gapNumber: 12,
        question: "In 1907 Alice (12) _____ to New York where she started her own film company.",
        options: ["moved", "ran", "entered", "transported"],
        correctAnswer: 0, // A: moved
        context: "Read the text about Alice Guy Blaché and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.32,
        tags: ["vocabulary", "movement_verbs"],
      },
    },
    {
      id: "simmonds-013",
      type: "cloze_passage",
      level: "A2",
      band: 2,
      content: {
        passageTitle: "Alice Guy Blaché",
        passageText: clozePassages.aliceGuyBlache.text,
        gapNumber: 13,
        question: "She was (13) _____ successful...",
        options: ["next", "once", "immediately", "recently"],
        correctAnswer: 1, // B: once
        context: "Read the text about Alice Guy Blaché and choose the best word for each gap.",
      },
      metadata: {
        topic: "adverbs",
        difficulty: 0.38,
        tags: ["vocabulary", "adverbs", "time"],
      },
    },
    {
      id: "simmonds-014",
      type: "cloze_passage",
      level: "A2",
      band: 2,
      content: {
        passageTitle: "Alice Guy Blaché",
        passageText: clozePassages.aliceGuyBlache.text,
        gapNumber: 14,
        question: "...the best days of the independent New York film companies were (14) _____.",
        options: ["after", "down", "behind", "over"],
        correctAnswer: 3, // D: over
        context: "Read the text about Alice Guy Blaché and choose the best word for each gap.",
      },
      metadata: {
        topic: "idioms",
        difficulty: 0.4,
        tags: ["vocabulary", "idioms", "time"],
      },
    },
    {
      id: "simmonds-015",
      type: "cloze_passage",
      level: "A2",
      band: 2,
      content: {
        passageTitle: "Alice Guy Blaché",
        passageText: clozePassages.aliceGuyBlache.text,
        gapNumber: 15,
        question: "When Alice died in 1968, hardly anybody (15) _____ her name.",
        options: ["remembered", "realised", "reminded", "repeated"],
        correctAnswer: 0, // A: remembered
        context: "Read the text about Alice Guy Blaché and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.35,
        tags: ["vocabulary", "memory_verbs"],
      },
    },

    // Questions 16-20: UFOs Cloze (A/B/C/D options)
    {
      id: "simmonds-016",
      type: "cloze_passage",
      level: "B1",
      band: 2,
      content: {
        passageTitle: "UFOs",
        passageText: clozePassages.ufos.text,
        gapNumber: 16,
        question: "UFOs are popularly known as flying saucers, (16) _____ that is often the shape they are reported to be.",
        options: ["because", "therefore", "although", "so"],
        correctAnswer: 0, // A: because
        context: "Read the text about UFOs and choose the best word for each gap.",
      },
      metadata: {
        topic: "conjunctions",
        difficulty: 0.42,
        tags: ["grammar", "conjunctions", "reason"],
      },
    },
    {
      id: "simmonds-017",
      type: "cloze_passage",
      level: "B1",
      band: 2,
      content: {
        passageTitle: "UFOs",
        passageText: clozePassages.ufos.text,
        gapNumber: 17,
        question: "...that is often the (17) _____ they are reported to be.",
        options: ["look", "shape", "size", "type"],
        correctAnswer: 1, // B: shape
        context: "Read the text about UFOs and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.38,
        tags: ["vocabulary", "nouns", "appearance"],
      },
    },
    {
      id: "simmonds-018",
      type: "cloze_passage",
      level: "B1",
      band: 2,
      content: {
        passageTitle: "UFOs",
        passageText: clozePassages.ufos.text,
        gapNumber: 18,
        question: "The (18) _____ 'flying saucers' were seen in 1947 by an American pilot...",
        options: ["last", "next", "first", "oldest"],
        correctAnswer: 2, // C: first
        context: "Read the text about UFOs and choose the best word for each gap.",
      },
      metadata: {
        topic: "ordinals",
        difficulty: 0.35,
        tags: ["vocabulary", "ordinals", "time"],
      },
    },
    {
      id: "simmonds-019",
      type: "cloze_passage",
      level: "B1",
      band: 2,
      content: {
        passageTitle: "UFOs",
        passageText: clozePassages.ufos.text,
        gapNumber: 19,
        question: "Even people experienced at watching the sky, (19) _____ as pilots, report seeing UFOs.",
        options: ["like", "that", "so", "such"],
        correctAnswer: 3, // D: such
        context: "Read the text about UFOs and choose the best word for each gap.",
      },
      metadata: {
        topic: "grammar",
        difficulty: 0.45,
        tags: ["grammar", "such_as"],
      },
    },
    {
      id: "simmonds-020",
      type: "cloze_passage",
      level: "B1",
      band: 2,
      content: {
        passageTitle: "UFOs",
        passageText: clozePassages.ufos.text,
        gapNumber: 20,
        question: "A television (20) _____ went up with the pilot and filmed the UFOs.",
        options: ["cameraman", "director", "actor", "announcer"],
        correctAnswer: 0, // A: cameraman
        context: "Read the text about UFOs and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.35,
        tags: ["vocabulary", "jobs", "media"],
      },
    },

    // ============================================
    // BAND 3: Questions 21-30 (B1 Level)
    // Sentence completion
    // ============================================
    {
      id: "simmonds-021",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "The teacher encouraged her students _____ to an English pen-friend.",
        options: ["should write", "write", "wrote", "to write"],
        correctAnswer: 3, // D: to write
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "infinitives",
        difficulty: 0.48,
        tags: ["grammar", "infinitives", "verbs"],
      },
    },
    {
      id: "simmonds-022",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "They spent a lot of time _____ at the pictures in the museum.",
        options: ["looking", "for looking", "to look", "to looking"],
        correctAnswer: 0, // A: looking
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "gerunds",
        difficulty: 0.5,
        tags: ["grammar", "gerunds", "verbs"],
      },
    },
    {
      id: "simmonds-023",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "Shirley enjoys science lessons, but all her experiments seem to _____ wrong.",
        options: ["turn", "come", "end", "go"],
        correctAnswer: 3, // D: go
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.52,
        tags: ["vocabulary", "collocations", "idioms"],
      },
    },
    {
      id: "simmonds-024",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "_____ from Michael, all the group arrived on time.",
        options: ["Except", "Other", "Besides", "Apart"],
        correctAnswer: 3, // D: Apart
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "prepositions",
        difficulty: 0.55,
        tags: ["grammar", "prepositions", "exceptions"],
      },
    },
    {
      id: "simmonds-025",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "She _____ her neighbour's children for the broken window.",
        options: ["accused", "complained", "blamed", "denied"],
        correctAnswer: 2, // C: blamed
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.5,
        tags: ["vocabulary", "verbs", "blame"],
      },
    },
    {
      id: "simmonds-026",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "As I had missed the history lesson, my friend went _____ the homework with me.",
        options: ["by", "after", "over", "on"],
        correctAnswer: 2, // C: over
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "phrasal_verbs",
        difficulty: 0.52,
        tags: ["vocabulary", "phrasal_verbs"],
      },
    },
    {
      id: "simmonds-027",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "Whether she's a good actress or not is a _____ of opinion.",
        options: ["matter", "subject", "point", "case"],
        correctAnswer: 0, // A: matter
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.55,
        tags: ["vocabulary", "collocations", "idioms"],
      },
    },
    {
      id: "simmonds-028",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "The decorated roof of the ancient palace was _____ up by four thin columns.",
        options: ["built", "carried", "held", "supported"],
        correctAnswer: 2, // C: held
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.5,
        tags: ["vocabulary", "verbs", "architecture"],
      },
    },
    {
      id: "simmonds-029",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "Would it _____ you if we came on Thursday?",
        options: ["agree", "suit", "like", "fit"],
        correctAnswer: 1, // B: suit
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.52,
        tags: ["vocabulary", "verbs", "arrangements"],
      },
    },
    {
      id: "simmonds-030",
      type: "sentence_completion",
      level: "B1",
      band: 3,
      content: {
        question: "This form _____ to be handed in until the end of the week.",
        options: ["doesn't need", "doesn't have", "needn't", "hasn't got"],
        correctAnswer: 0, // A: doesn't need
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "modals",
        difficulty: 0.55,
        tags: ["grammar", "modals", "necessity"],
      },
    },

    // ============================================
    // BAND 4: Questions 31-40 (B1/B2 Level)
    // Sentence completion (more advanced)
    // ============================================
    {
      id: "simmonds-031",
      type: "sentence_completion",
      level: "B1",
      band: 4,
      content: {
        question: "If you make a mistake when you are writing, just _____ it out with your pen.",
        options: ["cross", "clear", "do", "wipe"],
        correctAnswer: 0, // A: cross
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "phrasal_verbs",
        difficulty: 0.55,
        tags: ["vocabulary", "phrasal_verbs"],
      },
    },
    {
      id: "simmonds-032",
      type: "sentence_completion",
      level: "B1",
      band: 4,
      content: {
        question: "Although our opinions on many things _____, we're good friends.",
        options: ["differ", "oppose", "disagree", "divide"],
        correctAnswer: 0, // A: differ
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.58,
        tags: ["vocabulary", "verbs", "opinion"],
      },
    },
    {
      id: "simmonds-033",
      type: "sentence_completion",
      level: "B2",
      band: 4,
      content: {
        question: "This product must be eaten _____ two days of purchase.",
        options: ["by", "before", "within", "under"],
        correctAnswer: 2, // C: within
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "prepositions",
        difficulty: 0.6,
        tags: ["grammar", "prepositions", "time"],
      },
    },
    {
      id: "simmonds-034",
      type: "sentence_completion",
      level: "B2",
      band: 4,
      content: {
        question: "The newspaper report contained _____ important information.",
        options: ["many", "another", "an", "a lot of"],
        correctAnswer: 3, // D: a lot of
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "quantifiers",
        difficulty: 0.55,
        tags: ["grammar", "quantifiers"],
      },
    },
    {
      id: "simmonds-035",
      type: "sentence_completion",
      level: "B2",
      band: 4,
      content: {
        question: "Have you considered _____ to London?",
        options: ["move", "to move", "to be moving", "moving"],
        correctAnswer: 3, // D: moving
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "gerunds",
        difficulty: 0.58,
        tags: ["grammar", "gerunds", "verbs"],
      },
    },
    {
      id: "simmonds-036",
      type: "sentence_completion",
      level: "B2",
      band: 4,
      content: {
        question: "It can be a good idea for people who lead an active life to increase their _____ of vitamins.",
        options: ["upturn", "input", "upkeep", "intake"],
        correctAnswer: 3, // D: intake
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.62,
        tags: ["vocabulary", "nouns", "health"],
      },
    },
    {
      id: "simmonds-037",
      type: "sentence_completion",
      level: "B2",
      band: 4,
      content: {
        question: "I thought there was a _____ of jealousy in his reactions to my good fortune.",
        options: ["piece", "part", "shadow", "touch"],
        correctAnswer: 3, // D: touch
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.65,
        tags: ["vocabulary", "collocations", "emotions"],
      },
    },
    {
      id: "simmonds-038",
      type: "sentence_completion",
      level: "B2",
      band: 4,
      content: {
        question: "Why didn't you _____ that you were feeling ill?",
        options: ["advise", "mention", "remark", "tell"],
        correctAnswer: 1, // B: mention
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.58,
        tags: ["vocabulary", "verbs", "communication"],
      },
    },
    {
      id: "simmonds-039",
      type: "sentence_completion",
      level: "B2",
      band: 4,
      content: {
        question: "James was not sure exactly where his best interests _____.",
        options: ["stood", "rested", "lay", "centred"],
        correctAnswer: 2, // C: lay
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.68,
        tags: ["vocabulary", "collocations", "idioms"],
      },
    },
    {
      id: "simmonds-040",
      type: "sentence_completion",
      level: "B2",
      band: 4,
      content: {
        question: "He's still getting _____ the shock of losing his job.",
        options: ["across", "by", "over", "through"],
        correctAnswer: 2, // C: over
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "phrasal_verbs",
        difficulty: 0.6,
        tags: ["vocabulary", "phrasal_verbs", "emotions"],
      },
    },

    // ============================================
    // BAND 5: Questions 41-50 (B2 Level)
    // Skyscrapers cloze + Scrabble cloze
    // ============================================

    // Questions 41-45: Skyscrapers Cloze
    {
      id: "simmonds-041",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Skyscrapers",
        passageText: clozePassages.skyscrapers.text,
        gapNumber: 41,
        question: "A building which was many (41) _____ high was first called a skyscraper...",
        options: ["stages", "steps", "storeys", "levels"],
        correctAnswer: 2, // C: storeys
        context: "Read the text about skyscrapers and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.65,
        tags: ["vocabulary", "nouns", "architecture"],
      },
    },
    {
      id: "simmonds-042",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Skyscrapers",
        passageText: clozePassages.skyscrapers.text,
        gapNumber: 42,
        question: "...New York has perhaps the (42) _____ skyscraper of them all, the Empire State Building.",
        options: ["first-rate", "top-class", "well-built", "best-known"],
        correctAnswer: 3, // D: best-known
        context: "Read the text about skyscrapers and choose the best word for each gap.",
      },
      metadata: {
        topic: "compound_adjectives",
        difficulty: 0.62,
        tags: ["vocabulary", "compound_adjectives"],
      },
    },
    {
      id: "simmonds-043",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Skyscrapers",
        passageText: clozePassages.skyscrapers.text,
        gapNumber: 43,
        question: "The (43) _____ beneath the streets of New York is rock...",
        options: ["dirt", "field", "ground", "soil"],
        correctAnswer: 2, // C: ground
        context: "Read the text about skyscrapers and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.58,
        tags: ["vocabulary", "nouns", "earth"],
      },
    },
    {
      id: "simmonds-044",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Skyscrapers",
        passageText: clozePassages.skyscrapers.text,
        gapNumber: 44,
        question: "...is rock, (44) _____ enough to take the heaviest load without sinking...",
        options: ["hard", "stiff", "forceful", "powerful"],
        correctAnswer: 0, // A: hard
        context: "Read the text about skyscrapers and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.55,
        tags: ["vocabulary", "adjectives", "materials"],
      },
    },
    {
      id: "simmonds-045",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Skyscrapers",
        passageText: clozePassages.skyscrapers.text,
        gapNumber: 45,
        question: "...and is therefore well-suited to bearing the (45) _____ of tall buildings.",
        options: ["weight", "height", "size", "scale"],
        correctAnswer: 0, // A: weight
        context: "Read the text about skyscrapers and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.52,
        tags: ["vocabulary", "nouns", "measurement"],
      },
    },

    // Questions 46-50: Scrabble Cloze
    {
      id: "simmonds-046",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Scrabble",
        passageText: clozePassages.scrabble.text,
        gapNumber: 46,
        question: "...when Alfred Butts, an architect, found himself out of (46) _____.",
        options: ["earning", "work", "income", "job"],
        correctAnswer: 1, // B: work
        context: "Read the text about Scrabble and choose the best word for each gap.",
      },
      metadata: {
        topic: "idioms",
        difficulty: 0.6,
        tags: ["vocabulary", "idioms", "employment"],
      },
    },
    {
      id: "simmonds-047",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Scrabble",
        passageText: clozePassages.scrabble.text,
        gapNumber: 47,
        question: "He decided that there was a (47) _____ for a board game based on words...",
        options: ["market", "purchase", "commerce", "sale"],
        correctAnswer: 0, // A: market
        context: "Read the text about Scrabble and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.62,
        tags: ["vocabulary", "nouns", "business"],
      },
    },
    {
      id: "simmonds-048",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Scrabble",
        passageText: clozePassages.scrabble.text,
        gapNumber: 48,
        question: "...and (48) _____ to design one.",
        options: ["took up", "set out", "made for", "got round"],
        correctAnswer: 1, // B: set out
        context: "Read the text about Scrabble and choose the best word for each gap.",
      },
      metadata: {
        topic: "phrasal_verbs",
        difficulty: 0.68,
        tags: ["vocabulary", "phrasal_verbs"],
      },
    },
    {
      id: "simmonds-049",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Scrabble",
        passageText: clozePassages.scrabble.text,
        gapNumber: 49,
        question: "Eventually he made a (49) _____ from it...",
        options: ["wealth", "fund", "cash", "fortune"],
        correctAnswer: 3, // D: fortune
        context: "Read the text about Scrabble and choose the best word for each gap.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.65,
        tags: ["vocabulary", "collocations", "money"],
      },
    },
    {
      id: "simmonds-050",
      type: "cloze_passage",
      level: "B2",
      band: 5,
      content: {
        passageTitle: "Scrabble",
        passageText: clozePassages.scrabble.text,
        gapNumber: 50,
        question: "...in spite of the fact that his original (50) _____ was only three cents a game.",
        options: ["receipt", "benefit", "profit", "allowance"],
        correctAnswer: 2, // C: profit
        context: "Read the text about Scrabble and choose the best word for each gap.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.58,
        tags: ["vocabulary", "nouns", "money"],
      },
    },

    // ============================================
    // BAND 6: Questions 51-60 (C1 Level)
    // Advanced sentence completion
    // ============================================
    {
      id: "simmonds-051",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "Roger's manager _____ to make him stay late if he hadn't finished the work.",
        options: ["insisted", "warned", "threatened", "announced"],
        correctAnswer: 2, // C: threatened
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.72,
        tags: ["vocabulary", "verbs", "threats"],
      },
    },
    {
      id: "simmonds-052",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "By the time he has finished his week's work, John has hardly _____ energy left for the weekend.",
        options: ["any", "much", "no", "same"],
        correctAnswer: 0, // A: any
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "quantifiers",
        difficulty: 0.7,
        tags: ["grammar", "quantifiers"],
      },
    },
    {
      id: "simmonds-053",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "As the game _____ to a close, disappointed spectators started to leave.",
        options: ["led", "neared", "approached", "drew"],
        correctAnswer: 3, // D: drew
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.75,
        tags: ["vocabulary", "collocations", "idioms"],
      },
    },
    {
      id: "simmonds-054",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "I don't remember _____ the front door when I left home this morning.",
        options: ["to lock", "locking", "locked", "to have locked"],
        correctAnswer: 1, // B: locking
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "gerunds",
        difficulty: 0.72,
        tags: ["grammar", "gerunds", "memory"],
      },
    },
    {
      id: "simmonds-055",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "I _____ to other people borrowing my books: they always forget to return them.",
        options: ["disagree", "avoid", "dislike", "object"],
        correctAnswer: 3, // D: object
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.75,
        tags: ["vocabulary", "verbs", "complaints"],
      },
    },
    {
      id: "simmonds-056",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "Andrew's attempts to get into the swimming team have not _____ with much success.",
        options: ["associated", "concluded", "joined", "met"],
        correctAnswer: 3, // D: met
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.78,
        tags: ["vocabulary", "collocations", "success"],
      },
    },
    {
      id: "simmonds-057",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "Although Harry had obviously read the newspaper article carefully, he didn't seem to have _____ the main point.",
        options: ["grasped", "clutched", "clasped", "gripped"],
        correctAnswer: 0, // A: grasped
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.75,
        tags: ["vocabulary", "verbs", "understanding"],
      },
    },
    {
      id: "simmonds-058",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "A lot of the views put forward in the documentary were open to _____.",
        options: ["enquiry", "query", "question", "wonder"],
        correctAnswer: 2, // C: question
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "collocations",
        difficulty: 0.72,
        tags: ["vocabulary", "collocations", "debate"],
      },
    },
    {
      id: "simmonds-059",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "The new college _____ for the needs of students with a variety of learning backgrounds.",
        options: ["deals", "supplies", "furnishes", "caters"],
        correctAnswer: 3, // D: caters
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "vocabulary",
        difficulty: 0.78,
        tags: ["vocabulary", "verbs", "provision"],
      },
    },
    {
      id: "simmonds-060",
      type: "sentence_completion",
      level: "C1",
      band: 6,
      content: {
        question: "I find the times of English meals very strange - I'm not used _____ dinner at 6pm.",
        options: ["to have", "to having", "having", "have"],
        correctAnswer: 1, // B: to having
        context: "Choose the best word to complete the sentence.",
      },
      metadata: {
        topic: "grammar",
        difficulty: 0.75,
        tags: ["grammar", "used_to", "gerunds"],
      },
    },
  ],
};

// Scoring algorithm to determine CEFR level
export function calculateCEFRLevel(
  answers: Record<string, number | string>,
  questions: Question[]
): {
  level: CEFRLevel;
  score: number;
  totalPoints: number;
  bandBreakdown: Record<number, { correct: number; total: number; percentage: number }>;
  levelBreakdown: Record<CEFRLevel, { correct: number; total: number; percentage: number }>;
} {
  // Initialize band breakdown (1-6)
  const bandBreakdown: Record<number, { correct: number; total: number; percentage: number }> = {
    1: { correct: 0, total: 0, percentage: 0 },
    2: { correct: 0, total: 0, percentage: 0 },
    3: { correct: 0, total: 0, percentage: 0 },
    4: { correct: 0, total: 0, percentage: 0 },
    5: { correct: 0, total: 0, percentage: 0 },
    6: { correct: 0, total: 0, percentage: 0 },
  };

  // Initialize level breakdown
  const levelBreakdown: Record<CEFRLevel, { correct: number; total: number; percentage: number }> = {
    A1: { correct: 0, total: 0, percentage: 0 },
    A2: { correct: 0, total: 0, percentage: 0 },
    B1: { correct: 0, total: 0, percentage: 0 },
    B2: { correct: 0, total: 0, percentage: 0 },
    C1: { correct: 0, total: 0, percentage: 0 },
  };

  let totalCorrect = 0;
  const totalPoints = questions.length;

  questions.forEach((question) => {
    const answer = answers[question.id];
    let isCorrect = false;

    // Count in band breakdown
    bandBreakdown[question.band].total++;

    // Count in level breakdown
    levelBreakdown[question.level].total++;

    if (typeof answer === "number" && question.content.correctAnswer !== undefined) {
      isCorrect = answer === question.content.correctAnswer;
    }

    if (isCorrect) {
      bandBreakdown[question.band].correct++;
      levelBreakdown[question.level].correct++;
      totalCorrect++;
    }
  });

  // Calculate percentages for bands
  Object.keys(bandBreakdown).forEach((band) => {
    const b = parseInt(band);
    if (bandBreakdown[b].total > 0) {
      bandBreakdown[b].percentage = Math.round(
        (bandBreakdown[b].correct / bandBreakdown[b].total) * 100
      );
    }
  });

  // Calculate percentages for levels
  Object.keys(levelBreakdown).forEach((level) => {
    const l = level as CEFRLevel;
    if (levelBreakdown[l].total > 0) {
      levelBreakdown[l].percentage = Math.round(
        (levelBreakdown[l].correct / levelBreakdown[l].total) * 100
      );
    }
  });

  // Determine CEFR level based on band performance
  // Band 1-2 = A1/A2, Band 3-4 = B1, Band 5 = B2, Band 6 = C1
  let determinedLevel: CEFRLevel = "A1";

  // Calculate combined scores for level determination
  const band1_2_score = (bandBreakdown[1].correct + bandBreakdown[2].correct) /
                        (bandBreakdown[1].total + bandBreakdown[2].total) * 100;
  const band3_4_score = (bandBreakdown[3].correct + bandBreakdown[4].correct) /
                        (bandBreakdown[3].total + bandBreakdown[4].total) * 100;
  const band5_score = bandBreakdown[5].percentage;
  const band6_score = bandBreakdown[6].percentage;

  // Level determination logic
  if (band6_score >= 60 && band5_score >= 60 && band3_4_score >= 60 && band1_2_score >= 60) {
    determinedLevel = "C1";
  } else if (band5_score >= 60 && band3_4_score >= 60 && band1_2_score >= 60) {
    determinedLevel = "B2";
  } else if (band3_4_score >= 60 && band1_2_score >= 60) {
    determinedLevel = "B1";
  } else if (band1_2_score >= 60) {
    // Check if they did better on band 1 vs band 2
    if (bandBreakdown[2].percentage >= 60) {
      determinedLevel = "A2";
    } else {
      determinedLevel = "A1";
    }
  } else {
    determinedLevel = "A1";
  }

  // Additional check based on overall percentage
  const overallPercentage = (totalCorrect / totalPoints) * 100;

  // Adjust based on overall performance
  if (overallPercentage >= 85 && determinedLevel !== "C1" && band6_score >= 70) {
    determinedLevel = "C1";
  } else if (overallPercentage >= 75 && determinedLevel === "B1" && band5_score >= 65) {
    determinedLevel = "B2";
  } else if (overallPercentage >= 65 && determinedLevel === "A2" && band3_4_score >= 55) {
    determinedLevel = "B1";
  }

  return {
    level: determinedLevel,
    score: totalCorrect,
    totalPoints,
    bandBreakdown,
    levelBreakdown,
  };
}
