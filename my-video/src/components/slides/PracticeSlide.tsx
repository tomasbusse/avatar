import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND } from "../../lib/brand-config";

type PracticeSlideProps = {
  title?: string;
  instruction: string;
  sentence: string;
  blank?: string; // The word that goes in the blank
  options?: string[]; // Multiple choice options
  hint?: string;
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    lightColor?: string;
    lightestColor?: string;
  };
};

export const PracticeSlide: React.FC<PracticeSlideProps> = ({
  title = "Practice",
  instruction,
  sentence,
  blank,
  options = [],
  hint,
  brandConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colors = {
    primary: brandConfig?.primaryColor ?? SLS_BRAND.colors.primary,
    accent: brandConfig?.accentColor ?? SLS_BRAND.colors.accent,
    light: brandConfig?.lightColor ?? SLS_BRAND.colors.light,
    lightest: brandConfig?.lightestColor ?? SLS_BRAND.colors.lightest,
  };

  // Animations
  const headerOpacity = interpolate(frame, [0, fps * 0.2], [0, 1], {
    extrapolateRight: "clamp",
  });

  const instructionOpacity = interpolate(frame, [fps * 0.1, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sentenceOpacity = interpolate(frame, [fps * 0.3, fps * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sentenceScale = interpolate(frame, [fps * 0.3, fps * 0.6], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const blankPulse = interpolate(
    frame % (fps * 1.5),
    [0, fps * 0.75, fps * 1.5],
    [1, 1.05, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Staggered option animations
  const getOptionAnimation = (index: number) => {
    const startFrame = fps * (0.6 + index * 0.1);
    const endFrame = startFrame + fps * 0.25;

    return {
      opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      y: interpolate(frame, [startFrame, endFrame], [20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      }),
    };
  };

  const hintOpacity = interpolate(frame, [fps * 1.0, fps * 1.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Split sentence by "_____" or similar blank markers
  const renderSentenceWithBlank = () => {
    const blankMarkers = ["_____", "___", "____", "[blank]", "(blank)"];
    let splitSentence = [sentence];

    for (const marker of blankMarkers) {
      if (sentence.includes(marker)) {
        splitSentence = sentence.split(marker);
        break;
      }
    }

    if (splitSentence.length === 1) {
      // No blank marker found, return sentence as-is
      return <span>{sentence}</span>;
    }

    return (
      <>
        <span>{splitSentence[0]}</span>
        <span
          style={{
            display: "inline-block",
            transform: `scale(${blankPulse})`,
            background: `${colors.accent}20`,
            borderBottom: `4px solid ${colors.accent}`,
            padding: "4px 40px",
            margin: "0 8px",
            borderRadius: 4,
            minWidth: 120,
          }}
        >
          {blank && (
            <span
              style={{
                opacity: 0.3,
                fontSize: 28,
                color: colors.accent,
              }}
            >
              ?
            </span>
          )}
        </span>
        <span>{splitSentence[1]}</span>
      </>
    );
  };

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.lightest} 0%, ${colors.light} 100%)`,
        padding: 60,
        fontFamily: SLS_BRAND.fonts.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: colors.primary,
            borderRadius: 8,
            padding: "12px 24px",
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: SLS_BRAND.colors.textLight,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {title}
          </span>
        </div>
      </div>

      {/* Instruction */}
      <div
        style={{
          opacity: instructionOpacity,
          marginBottom: 40,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: SLS_BRAND.colors.textMuted,
            margin: 0,
          }}
        >
          {instruction}
        </p>
      </div>

      {/* Sentence card */}
      <div
        style={{
          opacity: sentenceOpacity,
          transform: `scale(${sentenceScale})`,
          background: SLS_BRAND.colors.textLight,
          borderRadius: 20,
          padding: 48,
          boxShadow: "0 10px 50px rgba(0,0,0,0.1)",
          marginBottom: 40,
        }}
      >
        <p
          style={{
            fontSize: 36,
            color: SLS_BRAND.colors.textDark,
            margin: 0,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          {renderSentenceWithBlank()}
        </p>
      </div>

      {/* Options (if multiple choice) */}
      {options.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          {options.map((option, index) => {
            const anim = getOptionAnimation(index);
            return (
              <div
                key={index}
                style={{
                  opacity: anim.opacity,
                  transform: `translateY(${anim.y}px)`,
                  background: colors.light,
                  borderRadius: 12,
                  padding: "16px 32px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                  border: `2px solid transparent`,
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: colors.primary,
                  }}
                >
                  {option}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Hint */}
      {hint && (
        <div
          style={{
            opacity: hintOpacity,
            position: "absolute",
            bottom: 60,
            left: 60,
            right: 60,
            background: `${colors.primary}0a`,
            borderRadius: 12,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>💡</span>
          <p
            style={{
              fontSize: 20,
              color: colors.primary,
              margin: 0,
            }}
          >
            <strong>Hint:</strong> {hint}
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};
