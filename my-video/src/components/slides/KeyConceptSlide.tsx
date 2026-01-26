import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND } from "../../lib/brand-config";

type KeyConceptSlideProps = {
  title: string;
  concept: string;
  explanation?: string;
  formula?: string; // For grammar rules like "Subject + will + verb"
  examples?: string[];
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    lightColor?: string;
    lightestColor?: string;
  };
};

export const KeyConceptSlide: React.FC<KeyConceptSlideProps> = ({
  title,
  concept,
  explanation,
  formula,
  examples = [],
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
  const titleOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const cardSlide = interpolate(frame, [fps * 0.2, fps * 0.5], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const cardOpacity = interpolate(frame, [fps * 0.2, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const formulaScale = interpolate(frame, [fps * 0.4, fps * 0.7], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });

  const getExampleOpacity = (index: number) =>
    interpolate(frame, [fps * (0.7 + index * 0.15), fps * (0.9 + index * 0.15)], [0, 1], {
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
      {/* Title bar */}
      <div
        style={{
          opacity: titleOpacity,
          marginBottom: 40,
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: colors.primary,
            margin: 0,
            borderLeft: `6px solid ${colors.accent}`,
            paddingLeft: 24,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Main concept card */}
      <div
        style={{
          opacity: cardOpacity,
          transform: `translateY(${cardSlide}px)`,
          background: SLS_BRAND.colors.textLight,
          borderRadius: 16,
          padding: 40,
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          borderLeft: `8px solid ${colors.accent}`,
        }}
      >
        {/* Concept highlight */}
        <div
          style={{
            background: `${colors.primary}0a`,
            borderRadius: 12,
            padding: 24,
            marginBottom: formula || explanation ? 24 : 0,
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
            {concept}
          </p>
        </div>

        {/* Formula display */}
        {formula && (
          <div
            style={{
              transform: `scale(${formulaScale})`,
              background: colors.light,
              borderRadius: 12,
              padding: 24,
              marginBottom: explanation ? 24 : 0,
              textAlign: "center",
            }}
          >
            <code
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: colors.accent,
                fontFamily: SLS_BRAND.fonts.mono,
                letterSpacing: "0.05em",
              }}
            >
              {formula}
            </code>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <p
            style={{
              fontSize: 24,
              color: SLS_BRAND.colors.textMuted,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {explanation}
          </p>
        )}
      </div>

      {/* Examples */}
      {examples.length > 0 && (
        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: colors.primary,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Examples
          </span>
          {examples.map((example, index) => (
            <div
              key={index}
              style={{
                opacity: getExampleOpacity(index),
                background: SLS_BRAND.colors.textLight,
                borderRadius: 8,
                padding: "16px 24px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  fontSize: 24,
                  color: SLS_BRAND.colors.textDark,
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                "{example}"
              </p>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
