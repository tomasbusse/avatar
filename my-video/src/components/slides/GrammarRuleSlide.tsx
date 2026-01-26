import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND } from "../../lib/brand-config";

type FormulaPart = {
  text: string;
  type: "subject" | "verb" | "object" | "auxiliary" | "connector" | "text";
};

type GrammarRuleSlideProps = {
  title: string;
  ruleName: string;
  formula?: FormulaPart[]; // Color-coded formula parts
  formulaText?: string; // Simple text fallback
  explanation: string;
  examples: {
    sentence: string;
    highlight?: string; // Part to highlight
  }[];
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    secondaryColor?: string;
    lightColor?: string;
    lightestColor?: string;
  };
};

// Color mapping for formula parts
const PART_COLORS: Record<FormulaPart["type"], string> = {
  subject: "#2563eb", // Blue
  verb: SLS_BRAND.colors.accent, // Orange
  object: "#059669", // Green
  auxiliary: "#7c3aed", // Purple
  connector: "#64748b", // Gray
  text: SLS_BRAND.colors.textDark,
};

export const GrammarRuleSlide: React.FC<GrammarRuleSlideProps> = ({
  title,
  ruleName,
  formula,
  formulaText,
  explanation,
  examples,
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

  const ruleNameScale = interpolate(frame, [fps * 0.1, fps * 0.4], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });

  const ruleNameOpacity = interpolate(frame, [fps * 0.1, fps * 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const formulaOpacity = interpolate(frame, [fps * 0.3, fps * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const explanationOpacity = interpolate(frame, [fps * 0.5, fps * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
      {/* Section header */}
      <div
        style={{
          opacity: headerOpacity,
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: colors.secondary,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}
        >
          {title}
        </span>
      </div>

      {/* Rule name */}
      <div
        style={{
          opacity: ruleNameOpacity,
          transform: `scale(${ruleNameScale})`,
          transformOrigin: "left center",
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: colors.primary,
            margin: 0,
          }}
        >
          {ruleName}
        </h1>
      </div>

      {/* Formula box */}
      <div
        style={{
          opacity: formulaOpacity,
          background: SLS_BRAND.colors.textLight,
          borderRadius: 16,
          padding: 32,
          marginBottom: 32,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          borderLeft: `6px solid ${colors.accent}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {formula ? (
            formula.map((part, index) => (
              <span
                key={index}
                style={{
                  fontSize: 32,
                  fontWeight: part.type === "text" ? 400 : 700,
                  color: PART_COLORS[part.type],
                  fontFamily: part.type === "text" ? SLS_BRAND.fonts.primary : SLS_BRAND.fonts.mono,
                  background: part.type !== "text" ? `${PART_COLORS[part.type]}15` : "transparent",
                  padding: part.type !== "text" ? "8px 16px" : "8px 4px",
                  borderRadius: 8,
                }}
              >
                {part.text}
              </span>
            ))
          ) : (
            <code
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: colors.accent,
                fontFamily: SLS_BRAND.fonts.mono,
              }}
            >
              {formulaText}
            </code>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div
        style={{
          opacity: explanationOpacity,
          marginBottom: 32,
        }}
      >
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
      </div>

      {/* Examples */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: colors.secondary,
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
              background: colors.light,
              borderRadius: 12,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: colors.accent,
                color: SLS_BRAND.colors.textLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </span>
            <p
              style={{
                fontSize: 24,
                color: SLS_BRAND.colors.textDark,
                margin: 0,
              }}
            >
              {example.highlight ? (
                <>
                  {example.sentence.split(example.highlight).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span
                          style={{
                            color: colors.accent,
                            fontWeight: 700,
                            textDecoration: "underline",
                            textUnderlineOffset: 4,
                          }}
                        >
                          {example.highlight}
                        </span>
                      )}
                    </span>
                  ))}
                </>
              ) : (
                example.sentence
              )}
            </p>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
