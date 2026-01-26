import "./index.css";
import { Composition, Folder, CalculateMetadataFunction } from "remotion";
import { NewsBroadcast } from "./compositions/NewsBroadcast";
import { GrammarLesson } from "./compositions/GrammarLesson";
import { NewsLesson } from "./compositions/NewsLesson";
import type { NewsVideoProps } from "./types";
import type { GrammarLessonProps, NewsLessonProps } from "./types/educational";
import { EDUCATIONAL_TIMING } from "./types/educational";
import { SLS_BRAND } from "./lib/brand-config";

// ============================================
// LEGACY NEWS BROADCAST (existing)
// ============================================

// Calculate total duration based on props - used for dynamic duration
const calculateDuration = (props: NewsVideoProps, fps: number): number => {
  const introDuration = props.config.includeIntro ? 3 * fps : 0;
  const outroDuration = props.config.includeOutro ? 3 * fps : 0;
  const mainDuration = Math.ceil(props.avatarVideoDuration * fps);
  return introDuration + mainDuration + outroDuration;
};

// Dynamic metadata calculation - this makes duration work with inputProps
const calculateMetadata: CalculateMetadataFunction<NewsVideoProps> = async ({
  props,
}) => {
  const fps = 30;
  return {
    durationInFrames: calculateDuration(props, fps),
    fps,
  };
};

// Default props for preview in Remotion Studio
const defaultNewsVideoProps: NewsVideoProps = {
  avatarVideoUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  avatarVideoDuration: 30, // 30 seconds preview
  slides: [
    {
      id: "1",
      title: "Breaking News",
      content:
        "This is an example slide that appears during the video. It demonstrates the slide overlay feature.",
      startTime: 5,
      duration: 8,
    },
    {
      id: "2",
      title: "Key Points",
      content:
        "• First important point\n• Second important point\n• Third important point",
      startTime: 15,
      duration: 10,
    },
  ],
  lowerThird: {
    name: "John Smith",
    title: "News Anchor",
    show: true,
  },
  config: {
    style: "news_broadcast",
    aspectRatio: "16:9",
    includeIntro: true,
    includeOutro: true,
    includeLowerThird: true,
    includeTicker: true,
    tickerText:
      "Breaking: Major developments in today's news • Markets reach record highs • Weather forecast: Sunny skies ahead",
  },
  brandName: "SLS NEWS",
  primaryColor: "#003F37", // Updated to SLS brand
  secondaryColor: "#B25627", // Updated to SLS brand
};

// ============================================
// EDUCATIONAL VIDEO COMPOSITIONS (NEW)
// ============================================

// Calculate educational video duration
const calculateEducationalDuration = (
  avatarDuration: number,
  includeIntro: boolean,
  includeOutro: boolean,
  fps: number
): number => {
  const introDuration = includeIntro ? EDUCATIONAL_TIMING.introDuration * fps : 0;
  const outroDuration = includeOutro ? EDUCATIONAL_TIMING.outroDuration * fps : 0;
  const mainDuration = Math.ceil(avatarDuration * fps);
  return introDuration + mainDuration + outroDuration;
};

// Metadata calculator for Grammar Lesson
const calculateGrammarLessonMetadata: CalculateMetadataFunction<GrammarLessonProps> = async ({
  props,
}) => {
  const fps = 30;
  return {
    durationInFrames: calculateEducationalDuration(
      props.avatarVideoDuration,
      props.config.includeIntro,
      props.config.includeOutro,
      fps
    ),
    fps,
  };
};

// Metadata calculator for News Lesson
const calculateNewsLessonMetadata: CalculateMetadataFunction<NewsLessonProps> = async ({
  props,
}) => {
  const fps = 30;
  return {
    durationInFrames: calculateEducationalDuration(
      props.avatarVideoDuration,
      props.config.includeIntro,
      props.config.includeOutro,
      fps
    ),
    fps,
  };
};

// Default Grammar Lesson props for preview
const defaultGrammarLessonProps: GrammarLessonProps = {
  avatarVideoUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  avatarVideoDuration: 60,
  level: "B1",
  lessonTitle: "Present Perfect Tense",
  lessonSubtitle: "Connecting Past to Present",
  lessonContent: {
    objective: "Learn to use the present perfect tense to describe past events that affect the present",
    vocabulary: [
      {
        word: "experience",
        phonetic: "/ɪkˈspɪəriəns/",
        definition: "Something that happens to you or something you do",
        germanTranslation: "die Erfahrung",
        exampleSentence: "I have had many interesting experiences.",
      },
      {
        word: "already",
        phonetic: "/ɔːlˈredi/",
        definition: "Before now or before a particular time",
        germanTranslation: "bereits, schon",
        exampleSentence: "She has already finished her homework.",
      },
    ],
    slides: [
      {
        id: "1",
        type: "title",
        title: "Present Perfect Tense",
        narration: "Today we will learn about the present perfect tense.",
        durationSeconds: 4,
      },
      {
        id: "2",
        type: "grammar_rule",
        title: "Present Perfect",
        content: "Subject + have/has + past participle",
        formula: "Subject + have/has + past participle",
        items: [
          "Use to connect past actions to the present",
          "I have lived here for 5 years.",
          "She has visited Paris three times.",
        ],
        narration: "The formula for present perfect is: subject plus have or has, plus the past participle of the verb.",
        durationSeconds: 10,
      },
      {
        id: "3",
        type: "vocabulary",
        vocabulary: {
          word: "experience",
          phonetic: "/ɪkˈspɪəriəns/",
          definition: "Something that happens to you or something you do",
          germanTranslation: "die Erfahrung",
          exampleSentence: "I have had many interesting experiences.",
        },
        narration: "Let's learn a new vocabulary word: experience.",
        durationSeconds: 8,
      },
      {
        id: "4",
        type: "practice",
        title: "Complete the sentence",
        content: "She _____ (visit) London twice.",
        options: ["visited", "has visited", "have visited"],
        narration: "Now let's practice. Complete this sentence.",
        durationSeconds: 6,
      },
      {
        id: "5",
        type: "question",
        content: "Which sentence is in present perfect?",
        options: [
          "I went to the store.",
          "I have been to the store.",
          "I am going to the store.",
        ],
        narration: "Here's a comprehension question.",
        durationSeconds: 8,
      },
    ],
    questions: [
      {
        question: "Which sentence is in present perfect?",
        type: "multiple_choice",
        options: [
          "I went to the store.",
          "I have been to the store.",
          "I am going to the store.",
        ],
        correctAnswer: "I have been to the store.",
      },
    ],
    keyTakeaways: [
      "Present perfect connects past to present",
      "Formula: have/has + past participle",
      "Use for experiences and completed actions with present relevance",
    ],
    fullScript:
      "Today we will learn about the present perfect tense. This tense is used to connect past actions to the present...",
    estimatedDuration: 60,
  },
  lowerThird: {
    name: "Emma",
    title: "English Teacher",
    show: true,
  },
  config: {
    templateType: "grammar_lesson",
    aspectRatio: "16:9",
    includeIntro: true,
    includeOutro: true,
    includeLowerThird: true,
    includeProgressBar: true,
    includeComprehensionQuestions: true,
  },
  brandConfig: {
    primaryColor: SLS_BRAND.colors.primary,
    accentColor: SLS_BRAND.colors.accent,
    lightColor: SLS_BRAND.colors.light,
    lightestColor: SLS_BRAND.colors.lightest,
  },
};

// Default News Lesson props for preview
const defaultNewsLessonProps: NewsLessonProps = {
  avatarVideoUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  avatarVideoDuration: 60,
  level: "B1",
  lessonTitle: "Climate Change Updates",
  newsHeadline: "Global Climate Summit Reaches Historic Agreement",
  sourceCredits: ["BBC News", "The Guardian"],
  lessonContent: {
    objective: "Understand and discuss current climate change news using advanced vocabulary",
    vocabulary: [
      {
        word: "summit",
        phonetic: "/ˈsʌmɪt/",
        definition: "A meeting of world leaders to discuss important issues",
        germanTranslation: "der Gipfel",
        exampleSentence: "The climate summit will take place in December.",
      },
      {
        word: "agreement",
        phonetic: "/əˈɡriːmənt/",
        definition: "A decision reached by two or more parties",
        germanTranslation: "das Abkommen, die Vereinbarung",
        exampleSentence: "The countries signed an important agreement.",
      },
      {
        word: "emissions",
        phonetic: "/ɪˈmɪʃənz/",
        definition: "Gases released into the atmosphere",
        germanTranslation: "die Emissionen",
        exampleSentence: "We need to reduce carbon emissions.",
      },
    ],
    slides: [
      {
        id: "1",
        type: "title",
        title: "Climate Change News",
        content: "Global Leaders Make Historic Decision",
        narration: "Today we'll learn English through current events about climate change.",
        durationSeconds: 4,
      },
      {
        id: "2",
        type: "summary",
        title: "Today's Headlines",
        items: [
          "Historic climate agreement reached",
          "195 countries commit to action",
          "New emissions targets set for 2030",
        ],
        narration: "Here are today's top headlines about the climate summit.",
        durationSeconds: 8,
      },
      {
        id: "3",
        type: "vocabulary",
        vocabulary: {
          word: "summit",
          phonetic: "/ˈsʌmɪt/",
          definition: "A meeting of world leaders to discuss important issues",
          germanTranslation: "der Gipfel",
          exampleSentence: "The climate summit will take place in December.",
        },
        narration: "Before we continue, let's learn an important word: summit.",
        durationSeconds: 8,
      },
      {
        id: "4",
        type: "key_concept",
        title: "Main Story",
        content: "World leaders have agreed to limit global warming to 1.5 degrees Celsius above pre-industrial levels.",
        items: ["This is the most ambitious target ever set."],
        narration: "The main story is about the new agreement on climate targets.",
        durationSeconds: 10,
      },
      {
        id: "5",
        type: "question",
        content: "What temperature limit did world leaders agree to?",
        options: ["1.5°C", "2°C", "3°C", "5°C"],
        narration: "Let's check your understanding with a question.",
        durationSeconds: 8,
      },
      {
        id: "6",
        type: "discussion",
        title: "Discussion Questions",
        items: [
          "What can individuals do to help fight climate change?",
          "Do you think the agreement will be successful?",
        ],
        narration: "Now let's discuss some questions about this topic.",
        durationSeconds: 10,
      },
    ],
    questions: [
      {
        question: "What temperature limit did world leaders agree to?",
        type: "multiple_choice",
        options: ["1.5°C", "2°C", "3°C", "5°C"],
        correctAnswer: "1.5°C",
      },
    ],
    keyTakeaways: [
      "World leaders agreed to limit warming to 1.5°C",
      "195 countries are committed to the agreement",
      "New vocabulary: summit, agreement, emissions",
    ],
    fullScript:
      "Today we'll learn English through current events. World leaders have reached a historic agreement on climate change...",
    estimatedDuration: 60,
  },
  lowerThird: {
    name: "Emma",
    title: "News Anchor",
    show: true,
  },
  config: {
    templateType: "news_broadcast",
    aspectRatio: "16:9",
    includeIntro: true,
    includeOutro: true,
    includeLowerThird: true,
    includeProgressBar: true,
    includeVocabularyHighlights: true,
    includeComprehensionQuestions: true,
  },
  brandConfig: {
    primaryColor: SLS_BRAND.colors.primary,
    accentColor: SLS_BRAND.colors.accent,
    lightColor: SLS_BRAND.colors.light,
    lightestColor: SLS_BRAND.colors.lightest,
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ============================================
          LEGACY NEWS BROADCAST (existing)
          ============================================ */}
      <Folder name="News">
        <Composition
          id="NewsBroadcast"
          component={NewsBroadcast}
          calculateMetadata={calculateMetadata}
          width={1920}
          height={1080}
          defaultProps={defaultNewsVideoProps}
        />

        {/* 9:16 vertical version for social media */}
        <Composition
          id="NewsBroadcast-Vertical"
          component={NewsBroadcast}
          calculateMetadata={calculateMetadata}
          width={1080}
          height={1920}
          defaultProps={{
            ...defaultNewsVideoProps,
            config: {
              ...defaultNewsVideoProps.config,
              aspectRatio: "9:16" as const,
            },
          }}
        />
      </Folder>

      {/* ============================================
          EDUCATIONAL VIDEO GENERATOR (NEW)
          ============================================ */}
      <Folder name="Educational">
        {/* Grammar Lesson - PPP Structure */}
        <Composition
          id="GrammarLesson"
          component={GrammarLesson}
          calculateMetadata={calculateGrammarLessonMetadata}
          width={1920}
          height={1080}
          defaultProps={defaultGrammarLessonProps}
        />

        <Composition
          id="GrammarLesson-Vertical"
          component={GrammarLesson}
          calculateMetadata={calculateGrammarLessonMetadata}
          width={1080}
          height={1920}
          defaultProps={{
            ...defaultGrammarLessonProps,
            config: {
              ...defaultGrammarLessonProps.config,
              aspectRatio: "9:16" as const,
            },
          }}
        />

        {/* News Lesson - ESL News Format */}
        <Composition
          id="NewsLesson"
          component={NewsLesson}
          calculateMetadata={calculateNewsLessonMetadata}
          width={1920}
          height={1080}
          defaultProps={defaultNewsLessonProps}
        />

        <Composition
          id="NewsLesson-Vertical"
          component={NewsLesson}
          calculateMetadata={calculateNewsLessonMetadata}
          width={1080}
          height={1920}
          defaultProps={{
            ...defaultNewsLessonProps,
            config: {
              ...defaultNewsLessonProps.config,
              aspectRatio: "9:16" as const,
            },
          }}
        />
      </Folder>
    </>
  );
};
