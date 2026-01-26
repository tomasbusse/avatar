import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND } from "../../lib/brand-config";

type VocabularyItem = {
  word: string;
  phonetic?: string;
  definition: string;
  germanTranslation: string;
  exampleSentence?: string;
};

type VocabularySlideProps = {
  title?: string;
  vocabulary: VocabularyItem;
  wordIndex?: number;
  totalWords?: number;
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    secondaryColor?: string;
    lightColor?: string;
    lightestColor?: string;
  };
};

export const VocabularySlide: React.FC<VocabularySlideProps> = ({
  title = "Vocabulary",
  vocabulary,
  wordIndex,
  totalWords,
  brandConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colors = {
    primary: brandConfig?.primaryColor ?? SLS_BRAND.colors.primary,
    accent: brandConfig?.accentColor ?? SLS_BRAND.colors.accent,
    secondary: brandConfig?.secondaryColor ?? SLS_BRAND.colors.secondary,
    light: brandConfig?.lightColor ?? SLS_BRAND.colors.light,
    lightest: brandConfig?.lightestColor ?? SLS_BRAND.colors.lightest,
  };

  // Animations
  const headerOpacity = interpolate(frame, [0, fps * 0.2], [0, 1], {
    extrapolateRight: "clamp",
  });

  const wordScale = interpolate(frame, [fps * 0.1, fps * 0.4], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.3)),
  });

  const wordOpacity = interpolate(frame, [fps * 0.1, fps * 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const phoneticOpacity = interpolate(frame, [fps * 0.3, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const definitionOpacity = interpolate(frame, [fps * 0.5, fps * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const definitionY = interpolate(frame, [fps * 0.5, fps * 0.7], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translationOpacity = interpolate(frame, [fps * 0.7, fps * 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exampleOpacity = interpolate(frame, [fps * 0.9, fps * 1.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.lightest} 0%, ${colors.light} 100%)`,
        padding: 60,
        fontFamily: SLS_BRAND.fonts.primary,
      }}
    >
      {/* Header with title and counter */}
      <div
        style={{
          opacity: headerOpacity,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h3
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: colors.secondary,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {title}
        </h3>
        {wordIndex !== undefined && totalWords !== undefined && (
          <span
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: colors.accent,
              background: SLS_BRAND.colors.textLight,
              padding: "8px 20px",
              borderRadius: 20,
            }}
          >
            {wordIndex + 1} / {totalWords}
          </span>
        )}
      </div>

      {/* Main word card */}
      <div
        style={{
          background: SLS_BRAND.colors.textLight,
          borderRadius: 20,
          padding: 48,
          boxShadow: "0 10px 50px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Word */}
        <div
          style={{
            opacity: wordOpacity,
            transform: `scale(${wordScale})`,
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: colors.primary,
              margin: 0,
            }}
          >
            {vocabulary.word}
          </h1>
        </div>

        {/* Phonetic */}
        {vocabulary.phonetic && (
          <div
            style={{
              opacity: phoneticOpacity,
              marginBottom: 32,
            }}
          >
            <span
              style={{
                fontSize: 28,
                color: SLS_BRAND.colors.textMuted,
                fontFamily: SLS_BRAND.fonts.mono,
              }}
            >
              {vocabulary.phonetic}
            </span>
          </div>
        )}

        {/* Definition */}
        <div
          style={{
            opacity: definitionOpacity,
            transform: `translateY(${definitionY}px)`,
            background: `${colors.primary}0a`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            width: "100%",
          }}
        >
          <p
            style={{
              fontSize: 32,
              color: SLS_BRAND.colors.textDark,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {vocabulary.definition}
          </p>
        </div>

        {/* German translation */}
        <div
          style={{
            opacity: translationOpacity,
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: vocabulary.exampleSentence ? 32 : 0,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: colors.secondary,
              textTransform: "uppercase",
            }}
          >
            Deutsch:
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: colors.accent,
            }}
          >
            {vocabulary.germanTranslation}
          </span>
        </div>

        {/* Example sentence */}
        {vocabulary.exampleSentence && (
          <div
            style={{
              opacity: exampleOpacity,
              borderTop: `2px solid ${colors.light}`,
              paddingTop: 24,
              width: "100%",
            }}
          >
            <p
              style={{
                fontSize: 24,
                color: SLS_BRAND.colors.textMuted,
                margin: 0,
                fontStyle: "italic",
              }}
            >
              "{vocabulary.exampleSentence}"
            </p>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
