import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND } from "../../lib/brand-config";

type ComparisonSlideProps = {
  title: string;
  correct: {
    text: string;
    explanation?: string;
  };
  incorrect: {
    text: string;
    explanation?: string;
  };
  tip?: string;
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    lightestColor?: string;
  };
};

export const ComparisonSlide: React.FC<ComparisonSlideProps> = ({
  title,
  correct,
  incorrect,
  tip,
  brandConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colors = {
    primary: brandConfig?.primaryColor ?? SLS_BRAND.colors.primary,
    accent: brandConfig?.accentColor ?? SLS_BRAND.colors.accent,
    lightest: brandConfig?.lightestColor ?? SLS_BRAND.colors.lightest,
    success: SLS_BRAND.colors.success,
    error: SLS_BRAND.colors.error,
  };

  // Animations
  const titleOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const incorrectCardAnim = {
    opacity: interpolate(frame, [fps * 0.2, fps * 0.5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    x: interpolate(frame, [fps * 0.2, fps * 0.5], [-50, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }),
  };

  const correctCardAnim = {
    opacity: interpolate(frame, [fps * 0.4, fps * 0.7], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    x: interpolate(frame, [fps * 0.4, fps * 0.7], [50, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }),
  };

  const tipOpacity = interpolate(frame, [fps * 0.8, fps * 1.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tipY = interpolate(frame, [fps * 0.8, fps * 1.0], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.lightest,
        padding: 60,
        fontFamily: SLS_BRAND.fonts.primary,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          marginBottom: 48,
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: colors.primary,
            margin: 0,
            textAlign: "center",
          }}
        >
          {title}
        </h2>
      </div>

      {/* Comparison cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          flex: 1,
        }}
      >
        {/* Incorrect card */}
        <div
          style={{
            opacity: incorrectCardAnim.opacity,
            transform: `translateX(${incorrectCardAnim.x}px)`,
            background: SLS_BRAND.colors.textLight,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: colors.error,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 32,
              }}
            >
              X
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: SLS_BRAND.colors.textLight,
                textTransform: "uppercase",
              }}
            >
              Incorrect
            </span>
          </div>

          {/* Content */}
          <div
            style={{
              padding: 32,
            }}
          >
            <p
              style={{
                fontSize: 28,
                color: SLS_BRAND.colors.textDark,
                margin: 0,
                marginBottom: incorrect.explanation ? 20 : 0,
                textDecoration: "line-through",
                textDecorationColor: colors.error,
                textDecorationThickness: 3,
              }}
            >
              "{incorrect.text}"
            </p>

            {incorrect.explanation && (
              <p
                style={{
                  fontSize: 20,
                  color: SLS_BRAND.colors.textMuted,
                  margin: 0,
                  borderLeft: `3px solid ${colors.error}`,
                  paddingLeft: 16,
                }}
              >
                {incorrect.explanation}
              </p>
            )}
          </div>
        </div>

        {/* Correct card */}
        <div
          style={{
            opacity: correctCardAnim.opacity,
            transform: `translateX(${correctCardAnim.x}px)`,
            background: SLS_BRAND.colors.textLight,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: colors.success,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 32,
              }}
            >
              ✓
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: SLS_BRAND.colors.textLight,
                textTransform: "uppercase",
              }}
            >
              Correct
            </span>
          </div>

          {/* Content */}
          <div
            style={{
              padding: 32,
            }}
          >
            <p
              style={{
                fontSize: 28,
                color: SLS_BRAND.colors.textDark,
                margin: 0,
                marginBottom: correct.explanation ? 20 : 0,
                fontWeight: 600,
              }}
            >
              "{correct.text}"
            </p>

            {correct.explanation && (
              <p
                style={{
                  fontSize: 20,
                  color: SLS_BRAND.colors.textMuted,
                  margin: 0,
                  borderLeft: `3px solid ${colors.success}`,
                  paddingLeft: 16,
                }}
              >
                {correct.explanation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tip */}
      {tip && (
        <div
          style={{
            opacity: tipOpacity,
            transform: `translateY(${tipY}px)`,
            marginTop: 32,
            background: `${colors.accent}15`,
            borderRadius: 12,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 28,
            }}
          >
            💡
          </span>
          <p
            style={{
              fontSize: 22,
              color: colors.primary,
              margin: 0,
              fontWeight: 500,
            }}
          >
            <strong>Tip:</strong> {tip}
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};
