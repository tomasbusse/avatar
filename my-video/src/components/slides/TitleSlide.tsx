import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND, LEVEL_COLORS, CEFRLevel } from "../../lib/brand-config";

type TitleSlideProps = {
  title: string;
  subtitle?: string;
  level?: CEFRLevel;
  lessonNumber?: number;
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    lightestColor?: string;
  };
};

export const TitleSlide: React.FC<TitleSlideProps> = ({
  title,
  subtitle,
  level,
  lessonNumber,
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
  const titleScale = interpolate(frame, [0, fps * 0.4], [0.8, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.3)),
  });

  const titleOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [fps * 0.3, fps * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [fps * 0.3, fps * 0.6], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeScale = interpolate(frame, [fps * 0.2, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  const lineWidth = interpolate(frame, [fps * 0.4, fps * 0.9], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const levelColors = level ? LEVEL_COLORS[level] : null;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 50%, ${colors.accent}33 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SLS_BRAND.fonts.heading,
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          border: `3px solid ${colors.accent}22`,
          top: -200,
          right: -200,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          border: `2px solid ${colors.lightest}11`,
          bottom: -150,
          left: -150,
        }}
      />

      {/* Level badge */}
      {level && levelColors && (
        <div
          style={{
            transform: `scale(${badgeScale})`,
            marginBottom: 32,
            padding: "12px 32px",
            borderRadius: 8,
            backgroundColor: levelColors.bg,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <span
            style={{
              color: levelColors.text,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            {lessonNumber ? `${level} - Lesson ${lessonNumber}` : level}
          </span>
        </div>
      )}

      {/* Main title */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: SLS_BRAND.colors.textLight,
            textShadow: "0 4px 30px rgba(0,0,0,0.3)",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Animated line */}
      <div
        style={{
          width: `${lineWidth}%`,
          maxWidth: 300,
          height: 4,
          background: colors.accent,
          marginTop: 32,
          marginBottom: 24,
          borderRadius: 2,
        }}
      />

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          <p
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: `${SLS_BRAND.colors.textLight}cc`,
              textAlign: "center",
              maxWidth: 800,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};
