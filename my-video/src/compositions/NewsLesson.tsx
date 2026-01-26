import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { AvatarVideo } from "../components/AvatarVideo";
import { LowerThird } from "../components/LowerThird";
import { NewsTicker } from "../components/NewsTicker";
import { ProgressBar } from "../components/ProgressBar";
import { EducationalIntro } from "../components/EducationalIntro";
import { EducationalOutro } from "../components/EducationalOutro";
import {
  TitleSlide,
  KeyConceptSlide,
  BulletPointsSlide,
  VocabularySlide,
  QuestionSlide,
} from "../components/slides";
import type { NewsLessonProps, EducationalSlide } from "../types/educational";
import { EDUCATIONAL_TIMING } from "../types/educational";
import { SLS_BRAND } from "../lib/brand-config";

/**
 * NewsLesson Composition
 *
 * News-based ESL lesson structure:
 * 1. Intro with news headline
 * 2. Pre-viewing vocabulary (4-6 words)
 * 3. News story presentation with graphics
 * 4. Comprehension questions (3)
 * 5. Discussion prompts (2-3)
 * 6. Outro with key takeaways
 */
export const NewsLesson: React.FC<NewsLessonProps> = ({
  avatarVideoUrl,
  avatarVideoDuration,
  lessonContent,
  level,
  lessonTitle,
  newsHeadline,
  sourceCredits,
  lowerThird,
  config,
  brandConfig,
  tickerText,
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

  // Calculate slide timings
  const calculateSlideTimings = (slides: EducationalSlide[]) => {
    let currentTime = 0;
    return slides.map((slide) => {
      const startTime = currentTime;
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

  // Render slide based on type
  const renderSlide = (slide: EducationalSlide & { startTime: number; duration: number }) => {
    const commonProps = { brandConfig };

    switch (slide.type) {
      case "title":
        return (
          <TitleSlide
            title={slide.title || newsHeadline || lessonTitle}
            subtitle={slide.content}
            level={level}
            {...commonProps}
          />
        );

      case "summary":
        return (
          <BulletPointsSlide
            title="Today's Headlines"
            points={slide.items || slide.content?.split("\n").filter(Boolean) || []}
            numbered
            {...commonProps}
          />
        );

      case "bullet_points":
        return (
          <BulletPointsSlide
            title={slide.title || "Key Points"}
            points={slide.items || slide.content?.split("\n").filter(Boolean) || []}
            {...commonProps}
          />
        );

      case "key_concept":
        return (
          <KeyConceptSlide
            title={slide.title || "Key Information"}
            concept={slide.content || ""}
            explanation={slide.items?.[0]}
            {...commonProps}
          />
        );

      case "vocabulary":
        return slide.vocabulary ? (
          <VocabularySlide
            title="Vocabulary"
            vocabulary={slide.vocabulary}
            wordIndex={lessonContent.vocabulary.findIndex(
              (v) => v.word === slide.vocabulary?.word
            )}
            totalWords={lessonContent.vocabulary.length}
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

      case "discussion":
        return (
          <BulletPointsSlide
            title={slide.title || "Discussion Questions"}
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

  // Generate ticker text from vocabulary if not provided
  const finalTickerText =
    tickerText ||
    lessonContent.vocabulary
      .map((v) => `${v.word}: ${v.definition}`)
      .join("  •  ");

  return (
    <AbsoluteFill style={{ backgroundColor: SLS_BRAND.colors.primary }}>
      {/* Intro sequence */}
      {config.includeIntro && (
        <Sequence durationInFrames={introDuration} premountFor={fps}>
          <EducationalIntro
            title={newsHeadline || lessonTitle}
            subtitle={lessonContent.objective}
            level={level}
            lessonType="News Lesson"
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
          {/* Avatar video - positioned based on slides */}
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
                  bottom: 80, // Leave room for ticker
                  width: "55%",
                }}
              >
                {renderSlide(slide)}
              </div>
            </Sequence>
          ))}

          {/* Lower third - news anchor style */}
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

          {/* News ticker at bottom with vocabulary */}
          {config.includeVocabularyHighlights && (
            <NewsTicker
              text={finalTickerText}
              backgroundColor={brandConfig?.accentColor ?? SLS_BRAND.colors.accent}
              textColor={SLS_BRAND.colors.textLight}
            />
          )}

          {/* Progress bar (above ticker) */}
          {config.includeProgressBar && (
            <div
              style={{
                position: "absolute",
                bottom: 50, // Above the ticker
                left: 0,
                right: 0,
              }}
            >
              <ProgressBar
                totalDuration={avatarVideoDuration}
                brandConfig={brandConfig}
              />
            </div>
          )}

          {/* Source credits overlay */}
          {sourceCredits && sourceCredits.length > 0 && (
            <Sequence
              from={mainContentDuration - 5 * fps}
              durationInFrames={5 * fps}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 100,
                  right: 40,
                  background: `${SLS_BRAND.colors.primary}dd`,
                  padding: "12px 20px",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: `${SLS_BRAND.colors.textLight}aa`,
                    fontFamily: SLS_BRAND.fonts.primary,
                  }}
                >
                  Sources: {sourceCredits.join(", ")}
                </span>
              </div>
            </Sequence>
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
            ctaText="Stay informed with SLS News Lessons"
            brandConfig={brandConfig}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
