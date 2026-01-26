import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { AvatarVideo } from "../components/AvatarVideo";
import { LowerThird } from "../components/LowerThird";
import { ProgressBar } from "../components/ProgressBar";
import { EducationalIntro } from "../components/EducationalIntro";
import { EducationalOutro } from "../components/EducationalOutro";
import {
  TitleSlide,
  KeyConceptSlide,
  BulletPointsSlide,
  VocabularySlide,
  QuestionSlide,
  GrammarRuleSlide,
  PracticeSlide,
  ComparisonSlide,
} from "../components/slides";
import type { GrammarLessonProps, EducationalSlide } from "../types/educational";
import { EDUCATIONAL_TIMING } from "../types/educational";
import { SLS_BRAND } from "../lib/brand-config";

/**
 * GrammarLesson Composition
 *
 * PPP (Presentation-Practice-Production) structure:
 * 1. Intro with hook/common mistake
 * 2. Presentation (33%) - Grammar rule + examples
 * 3. Practice (33%) - Controlled exercises
 * 4. Production (33%) - Free application prompts
 * 5. Recap with key takeaways
 * 6. Outro
 */
export const GrammarLesson: React.FC<GrammarLessonProps> = ({
  avatarVideoUrl,
  avatarVideoDuration,
  lessonContent,
  level,
  lessonTitle,
  lessonSubtitle,
  lowerThird,
  config,
  brandConfig,
}) => {
  const { fps } = useVideoConfig();

  // Timing calculations
  const introDuration = config.includeIntro
    ? EDUCATIONAL_TIMING.introDuration * fps
    : 0;
  const outroDuration = config.includeOutro
    ? EDUCATIONAL_TIMING.outroDuration * fps
    : 0;
  const mainContentStart = introDuration;
  const mainContentDuration = avatarVideoDuration * fps;

  // Calculate slide timings based on narration
  const calculateSlideTimings = (slides: EducationalSlide[]) => {
    let currentTime = 0;
    return slides.map((slide) => {
      const startTime = currentTime;
      // Estimate duration from narration length (~130 words per minute = ~2 words per second)
      const wordCount = slide.narration.split(/\s+/).length;
      const estimatedDuration = slide.durationSeconds ?? Math.max(wordCount / 2, 4);
      currentTime += estimatedDuration;
      return {
        ...slide,
        startTime,
        duration: estimatedDuration,
      };
    });
  };

  const timedSlides = calculateSlideTimings(lessonContent.slides);

  // Render the appropriate slide component based on type
  const renderSlide = (slide: EducationalSlide & { startTime: number; duration: number }) => {
    const commonProps = { brandConfig };

    switch (slide.type) {
      case "title":
        return (
          <TitleSlide
            title={slide.title || lessonTitle}
            subtitle={slide.content}
            level={level}
            {...commonProps}
          />
        );

      case "summary":
      case "bullet_points":
        return (
          <BulletPointsSlide
            title={slide.title || "Key Points"}
            points={slide.items || slide.content?.split("\n").filter(Boolean) || []}
            numbered={slide.type === "summary"}
            {...commonProps}
          />
        );

      case "key_concept":
        return (
          <KeyConceptSlide
            title={slide.title || "Key Concept"}
            concept={slide.content || ""}
            explanation={slide.items?.[0]}
            {...commonProps}
          />
        );

      case "vocabulary":
        return slide.vocabulary ? (
          <VocabularySlide
            vocabulary={slide.vocabulary}
            wordIndex={lessonContent.vocabulary.findIndex(
              (v) => v.word === slide.vocabulary?.word
            )}
            totalWords={lessonContent.vocabulary.length}
            {...commonProps}
          />
        ) : null;

      case "grammar_rule":
        return (
          <GrammarRuleSlide
            title="Grammar Rule"
            ruleName={slide.title || ""}
            formulaText={slide.formula || slide.content}
            explanation={slide.items?.[0] || ""}
            examples={
              slide.items?.slice(1).map((sentence) => ({ sentence })) || []
            }
            {...commonProps}
          />
        );

      case "comparison":
        return slide.correct && slide.incorrect ? (
          <ComparisonSlide
            title={slide.title || "Correct vs Incorrect"}
            correct={slide.correct}
            incorrect={slide.incorrect}
            {...commonProps}
          />
        ) : null;

      case "question":
        const questionIndex = lessonContent.questions.findIndex(
          (q) => q.question === slide.content
        );
        const question = lessonContent.questions[questionIndex];
        return question ? (
          <QuestionSlide
            question={question.question}
            options={question.options}
            type={question.type}
            questionNumber={questionIndex + 1}
            totalQuestions={lessonContent.questions.length}
            {...commonProps}
          />
        ) : (
          <QuestionSlide
            question={slide.content || ""}
            options={slide.options}
            {...commonProps}
          />
        );

      case "practice":
        return (
          <PracticeSlide
            title="Practice"
            instruction={slide.title || "Complete the sentence:"}
            sentence={slide.content || ""}
            options={slide.options}
            {...commonProps}
          />
        );

      case "discussion":
        return (
          <BulletPointsSlide
            title={slide.title || "Discussion"}
            points={slide.items || [slide.content || ""]}
            {...commonProps}
          />
        );

      default:
        return (
          <KeyConceptSlide
            title={slide.title || ""}
            concept={slide.content || ""}
            {...commonProps}
          />
        );
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: SLS_BRAND.colors.primary }}>
      {/* Intro sequence */}
      {config.includeIntro && (
        <Sequence durationInFrames={introDuration} premountFor={fps}>
          <EducationalIntro
            title={lessonTitle}
            subtitle={lessonSubtitle || lessonContent.objective}
            level={level}
            lessonType="Grammar Lesson"
            brandConfig={brandConfig}
          />
        </Sequence>
      )}

      {/* Main content */}
      <Sequence
        from={mainContentStart}
        durationInFrames={mainContentDuration}
        premountFor={fps}
      >
        <AbsoluteFill>
          {/* Avatar video - positioned on left when slides are showing */}
          <AvatarVideo
            src={avatarVideoUrl}
            style={timedSlides.length > 0 ? "side" : "fullscreen"}
          />

          {/* Educational slides */}
          {timedSlides.map((slide) => (
            <Sequence
              key={slide.id}
              from={slide.startTime * fps}
              durationInFrames={slide.duration * fps}
              premountFor={fps * 0.5}
            >
              {/* Slide container - right side */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "55%",
                }}
              >
                {renderSlide(slide)}
              </div>
            </Sequence>
          ))}

          {/* Lower third - appears after 1 second */}
          {config.includeLowerThird && lowerThird && (
            <Sequence
              from={EDUCATIONAL_TIMING.lowerThirdAppear * fps}
              durationInFrames={EDUCATIONAL_TIMING.lowerThirdDuration * fps}
              premountFor={fps * 0.5}
            >
              <LowerThird
                config={{ ...lowerThird, show: true }}
                primaryColor={brandConfig?.primaryColor ?? SLS_BRAND.colors.primary}
                secondaryColor={brandConfig?.accentColor ?? SLS_BRAND.colors.accent}
              />
            </Sequence>
          )}

          {/* Progress bar */}
          {config.includeProgressBar && (
            <ProgressBar
              totalDuration={avatarVideoDuration}
              brandConfig={brandConfig}
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* Outro sequence */}
      {config.includeOutro && (
        <Sequence
          from={mainContentStart + mainContentDuration}
          durationInFrames={outroDuration}
          premountFor={fps}
        >
          <EducationalOutro
            keyTakeaways={lessonContent.keyTakeaways}
            ctaText="Master English Grammar with SLS"
            brandConfig={brandConfig}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
