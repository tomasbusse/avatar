import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

type IntroProps = {
  brandName?: string;
  brandLogo?: string;
  primaryColor?: string;
  title?: string;
};

export const Intro: React.FC<IntroProps> = ({
  brandName = "NEWS UPDATE",
  primaryColor = "#1e40af",
  title,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation phases
  const logoScale = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  const titleOpacity = interpolate(frame, [fps * 0.3, fps * 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleSlide = interpolate(frame, [fps * 0.3, fps * 0.8], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [fps * 0.5, fps * 1.2], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background gradient animation
  const gradientPosition = interpolate(frame, [0, fps * 3], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg,
          ${primaryColor} ${gradientPosition}%,
          #0f172a ${gradientPosition + 50}%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Animated background shapes */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          transform: `scale(${logoScale * 2})`,
        }}
      />

      {/* Brand name */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            fontFamily: "Inter, system-ui, sans-serif",
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {brandName}
        </h1>
      </div>

      {/* Animated line */}
      <div
        style={{
          width: `${lineWidth}%`,
          maxWidth: 400,
          height: 4,
          background: "white",
          marginBottom: 24,
          borderRadius: 2,
        }}
      />

      {/* Title if provided */}
      {title && (
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
          }}
        >
          <h2
            style={{
              fontSize: 36,
              fontWeight: 500,
              fontFamily: "Inter, system-ui, sans-serif",
              color: "rgba(255,255,255,0.9)",
              textAlign: "center",
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            {title}
          </h2>
        </div>
      )}
    </AbsoluteFill>
  );
};
