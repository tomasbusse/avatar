import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND, LEVEL_COLORS, CEFRLevel } from "../lib/brand-config";

type EducationalIntroProps = {
  title: string;
  subtitle?: string;
  level?: CEFRLevel;
  lessonType?: string; // "Grammar Lesson", "Vocabulary", etc.
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    lightestColor?: string;
  };
};

export const EducationalIntro: React.FC<EducationalIntroProps> = ({
  title,
  subtitle,
  level,
  lessonType,
  brandConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colors = {
    primary: brandConfig?.primaryColor ?? SLS_BRAND.colors.primary,
    accent: brandConfig?.accentColor ?? SLS_BRAND.colors.accent,
    lightest: brandConfig?.lightestColor ?? SLS_BRAND.colors.lightest,
  };

  // Animations
  const backgroundScale = interpolate(frame, [0, fps * 0.5], [1.1, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const logoScale = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  const logoOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const typeOpacity = interpolate(frame, [fps * 0.3, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [fps * 0.5, fps * 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [fps * 0.5, fps * 0.8], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const lineWidth = interpolate(frame, [fps * 0.6, fps * 1.0], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const levelBadgeScale = interpolate(frame, [fps * 0.8, fps * 1.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  const subtitleOpacity = interpolate(frame, [fps * 1.0, fps * 1.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const levelColors = level ? LEVEL_COLORS[level] : null;

  return (
    <AbsoluteFill
      style={{
        background: colors.primary,
        overflow: "hidden",
      }}
    >
      {/* Animated background gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 30% 30%, ${colors.accent}33 0%, transparent 50%),
                       radial-gradient(circle at 70% 70%, ${colors.lightest}22 0%, transparent 40%)`,
          transform: `scale(${backgroundScale})`,
        }}
      />

      {/* Decorative elements */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: `3px solid ${colors.accent}22`,
          opacity: logoOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: `2px solid ${colors.lightest}11`,
          opacity: logoOpacity,
        }}
      />

      {/* Main content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SLS_BRAND.fonts.heading,
        }}
      >
        {/* SLS Logo/Brand */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: colors.accent,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            {SLS_BRAND.shortName}
          </span>
        </div>

        {/* Lesson type badge */}
        {lessonType && (
          <div
            style={{
              opacity: typeOpacity,
              background: `${colors.accent}22`,
              padding: "10px 24px",
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              {lessonType}
            </span>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: SLS_BRAND.colors.textLight,
              margin: 0,
              lineHeight: 1.2,
              textShadow: "0 4px 30px rgba(0,0,0,0.2)",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Animated line */}
        <div
          style={{
            width: `${lineWidth}%`,
            maxWidth: 200,
            height: 4,
            background: colors.accent,
            marginTop: 32,
            marginBottom: 24,
            borderRadius: 2,
          }}
        />

        {/* Level badge */}
        {level && levelColors && (
          <div
            style={{
              transform: `scale(${levelBadgeScale})`,
              background: levelColors.bg,
              padding: "12px 32px",
              borderRadius: 8,
              marginBottom: subtitle ? 24 : 0,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: levelColors.text,
                letterSpacing: "0.1em",
              }}
            >
              Level {level}
            </span>
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              opacity: subtitleOpacity,
            }}
          >
            <p
              style={{
                fontSize: 28,
                fontWeight: 400,
                color: `${SLS_BRAND.colors.textLight}cc`,
                margin: 0,
                textAlign: "center",
                maxWidth: 600,
              }}
            >
              {subtitle}
            </p>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
