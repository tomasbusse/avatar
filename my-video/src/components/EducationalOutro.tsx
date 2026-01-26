import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { SLS_BRAND } from "../lib/brand-config";

type EducationalOutroProps = {
  keyTakeaways?: string[];
  ctaText?: string;
  ctaUrl?: string;
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
    lightestColor?: string;
  };
};

export const EducationalOutro: React.FC<EducationalOutroProps> = ({
  keyTakeaways = [],
  ctaText = "Keep learning with Sweet Language School",
  ctaUrl,
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
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, fps * 0.5], [0.95, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const headerOpacity = interpolate(frame, [fps * 0.2, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const getTakeawayAnim = (index: number) => {
    const startFrame = fps * (0.5 + index * 0.15);
    const endFrame = startFrame + fps * 0.3;

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

  const ctaOpacity = interpolate(frame, [fps * 1.5, fps * 1.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaScale = interpolate(frame, [fps * 1.5, fps * 1.8], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });

  const brandOpacity = interpolate(frame, [fps * 2.0, fps * 2.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
        opacity: fadeIn,
        transform: `scale(${scale})`,
        fontFamily: SLS_BRAND.fonts.primary,
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "40%",
          height: "100%",
          background: `linear-gradient(180deg, ${colors.accent}22 0%, transparent 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 80,
        }}
      >
        {/* Key Takeaways section */}
        {keyTakeaways.length > 0 && (
          <div style={{ flex: 1 }}>
            {/* Header */}
            <div
              style={{
                opacity: headerOpacity,
                marginBottom: 40,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 32 }}>🎯</span>
              <h2
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: SLS_BRAND.colors.textLight,
                  margin: 0,
                }}
              >
                Key Takeaways
              </h2>
            </div>

            {/* Takeaways list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {keyTakeaways.map((takeaway, index) => {
                const anim = getTakeawayAnim(index);
                return (
                  <div
                    key={index}
                    style={{
                      opacity: anim.opacity,
                      transform: `translateX(${anim.x}px)`,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 20,
                    }}
                  >
                    {/* Checkmark */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: colors.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          color: SLS_BRAND.colors.textLight,
                          fontSize: 20,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    </div>

                    {/* Takeaway text */}
                    <p
                      style={{
                        fontSize: 26,
                        color: SLS_BRAND.colors.textLight,
                        margin: 0,
                        lineHeight: 1.4,
                        paddingTop: 4,
                      }}
                    >
                      {takeaway}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA section */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            marginTop: keyTakeaways.length > 0 ? 60 : 0,
            flex: keyTakeaways.length === 0 ? 1 : undefined,
            display: "flex",
            flexDirection: "column",
            justifyContent: keyTakeaways.length === 0 ? "center" : "flex-start",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: colors.accent,
              padding: "20px 48px",
              borderRadius: 12,
              boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            }}
          >
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: SLS_BRAND.colors.textLight,
                margin: 0,
                textAlign: "center",
              }}
            >
              {ctaText}
            </p>
          </div>

          {ctaUrl && (
            <p
              style={{
                fontSize: 20,
                color: `${SLS_BRAND.colors.textLight}aa`,
                marginTop: 16,
              }}
            >
              {ctaUrl}
            </p>
          )}
        </div>

        {/* Brand footer */}
        <div
          style={{
            opacity: brandOpacity,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 40,
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: colors.accent,
              letterSpacing: "0.15em",
            }}
          >
            {SLS_BRAND.shortName}
          </span>
          <span
            style={{
              fontSize: 18,
              color: `${SLS_BRAND.colors.textLight}88`,
            }}
          >
            |
          </span>
          <span
            style={{
              fontSize: 18,
              color: `${SLS_BRAND.colors.textLight}88`,
            }}
          >
            {SLS_BRAND.tagline}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
