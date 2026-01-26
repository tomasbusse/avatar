import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND } from "../../lib/brand-config";

type BulletPointsSlideProps = {
  title: string;
  points: string[];
  numbered?: boolean;
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    lightestColor?: string;
  };
};

export const BulletPointsSlide: React.FC<BulletPointsSlideProps> = ({
  title,
  points,
  numbered = false,
  brandConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colors = {
    primary: brandConfig?.primaryColor ?? SLS_BRAND.colors.primary,
    accent: brandConfig?.accentColor ?? SLS_BRAND.colors.accent,
    lightest: brandConfig?.lightestColor ?? SLS_BRAND.colors.lightest,
  };

  // Title animation
  const titleOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleX = interpolate(frame, [0, fps * 0.3], [-30, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Staggered bullet point animations
  const getPointAnimation = (index: number) => {
    const startFrame = fps * (0.3 + index * 0.15);
    const endFrame = startFrame + fps * 0.3;

    return {
      opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      x: interpolate(frame, [startFrame, endFrame], [40, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      }),
      scale: interpolate(frame, [startFrame, endFrame - fps * 0.1], [0.95, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    };
  };

  return (
    <AbsoluteFill
      style={{
        background: colors.lightest,
        padding: 60,
        fontFamily: SLS_BRAND.fonts.primary,
      }}
    >
      {/* Decorative accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 8,
          height: "100%",
          background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateX(${titleX}px)`,
          marginBottom: 48,
          marginLeft: 20,
        }}
      >
        <h2
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: colors.primary,
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Bullet points */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginLeft: 20,
        }}
      >
        {points.map((point, index) => {
          const anim = getPointAnimation(index);
          return (
            <div
              key={index}
              style={{
                opacity: anim.opacity,
                transform: `translateX(${anim.x}px) scale(${anim.scale})`,
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
              }}
            >
              {/* Bullet/number indicator */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: numbered ? 8 : "50%",
                  background: colors.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <span
                  style={{
                    color: SLS_BRAND.colors.textLight,
                    fontSize: numbered ? 24 : 20,
                    fontWeight: 700,
                  }}
                >
                  {numbered ? index + 1 : "•"}
                </span>
              </div>

              {/* Point text */}
              <div
                style={{
                  background: SLS_BRAND.colors.textLight,
                  borderRadius: 12,
                  padding: "20px 28px",
                  flex: 1,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <p
                  style={{
                    fontSize: 28,
                    color: SLS_BRAND.colors.textDark,
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {point}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
