import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND } from "../../lib/brand-config";

type QuestionSlideProps = {
  question: string;
  options?: string[];
  questionNumber?: number;
  totalQuestions?: number;
  type?: "multiple_choice" | "true_false" | "open_ended" | "fill_blank";
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    lightColor?: string;
    lightestColor?: string;
  };
};

export const QuestionSlide: React.FC<QuestionSlideProps> = ({
  question,
  options = [],
  questionNumber,
  totalQuestions,
  type = "multiple_choice",
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

  const questionOpacity = interpolate(frame, [fps * 0.1, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const questionScale = interpolate(frame, [fps * 0.1, fps * 0.4], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Staggered option animations
  const getOptionAnimation = (index: number) => {
    const startFrame = fps * (0.5 + index * 0.12);
    const endFrame = startFrame + fps * 0.25;

    return {
      opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      x: interpolate(frame, [startFrame, endFrame], [30, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      }),
    };
  };

  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}ee 100%)`,
        padding: 60,
        fontFamily: SLS_BRAND.fonts.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              background: colors.accent,
              borderRadius: 8,
              padding: "8px 20px",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: SLS_BRAND.colors.textLight,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Comprehension Check
            </span>
          </div>
        </div>

        {questionNumber !== undefined && totalQuestions !== undefined && (
          <span
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: `${SLS_BRAND.colors.textLight}aa`,
            }}
          >
            Question {questionNumber} of {totalQuestions}
          </span>
        )}
      </div>

      {/* Question */}
      <div
        style={{
          opacity: questionOpacity,
          transform: `scale(${questionScale})`,
          background: SLS_BRAND.colors.textLight,
          borderRadius: 16,
          padding: 40,
          marginBottom: 40,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <p
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: colors.primary,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {question}
        </p>
      </div>

      {/* Options */}
      {options.length > 0 && type !== "open_ended" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: options.length > 2 ? "1fr 1fr" : "1fr",
            gap: 20,
          }}
        >
          {options.map((option, index) => {
            const anim = getOptionAnimation(index);
            return (
              <div
                key={index}
                style={{
                  opacity: anim.opacity,
                  transform: `translateX(${anim.x}px)`,
                  background: colors.lightest,
                  borderRadius: 12,
                  padding: "20px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              >
                {/* Option letter */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: colors.light,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: colors.primary,
                    }}
                  >
                    {optionLabels[index]}
                  </span>
                </div>

                {/* Option text */}
                <p
                  style={{
                    fontSize: 24,
                    color: SLS_BRAND.colors.textDark,
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {option}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Open-ended prompt */}
      {type === "open_ended" && (
        <div
          style={{
            opacity: getOptionAnimation(0).opacity,
            transform: `translateX(${getOptionAnimation(0).x}px)`,
            background: `${colors.lightest}22`,
            borderRadius: 12,
            padding: 32,
            border: `2px dashed ${colors.lightest}44`,
          }}
        >
          <p
            style={{
              fontSize: 24,
              color: `${SLS_BRAND.colors.textLight}cc`,
              margin: 0,
              textAlign: "center",
            }}
          >
            Think about your answer...
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};
