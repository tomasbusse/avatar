import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

type OutroProps = {
  brandName?: string;
  tagline?: string;
  primaryColor?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
  };
};

export const Outro: React.FC<OutroProps> = ({
  brandName = "NEWS UPDATE",
  tagline = "Stay Informed. Stay Ahead.",
  primaryColor = "#1e40af",
  socialLinks,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Scale up
  const scale = interpolate(frame, [0, fps * 0.5], [0.9, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Tagline slide up
  const taglineY = interpolate(frame, [fps * 0.3, fps * 0.8], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [fps * 0.3, fps * 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #0f172a 0%, ${primaryColor} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeIn,
      }}
    >
      {/* Brand name */}
      <div
        style={{
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            fontFamily: "Inter, system-ui, sans-serif",
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {brandName}
        </h1>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          marginTop: 16,
        }}
      >
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            fontFamily: "Inter, system-ui, sans-serif",
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.05em",
          }}
        >
          {tagline}
        </p>
      </div>

      {/* Social links */}
      {socialLinks && (
        <div
          style={{
            opacity: taglineOpacity,
            marginTop: 40,
            display: "flex",
            gap: 24,
          }}
        >
          {socialLinks.website && (
            <span
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.7)",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {socialLinks.website}
            </span>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
