import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { LowerThirdConfig } from "../types";

type LowerThirdProps = {
  config: LowerThirdConfig;
  primaryColor?: string;
  secondaryColor?: string;
};

export const LowerThird: React.FC<LowerThirdProps> = ({
  config,
  primaryColor = "#1e40af",
  secondaryColor = "#3b82f6",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!config.show) return null;

  // Animate in from left
  const slideIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        display: "flex",
        flexDirection: "column",
        transform: `translateX(${interpolate(slideIn, [0, 1], [-100, 0])}%)`,
        opacity,
      }}
    >
      {/* Name bar */}
      <div
        style={{
          background: primaryColor,
          padding: "12px 48px 12px 24px",
          clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 32,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {config.name}
        </span>
      </div>

      {/* Title bar */}
      <div
        style={{
          background: secondaryColor,
          padding: "8px 36px 8px 24px",
          clipPath: "polygon(0 0, 100% 0, 96% 100%, 0 100%)",
          marginTop: -2,
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: 500,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {config.title}
        </span>
      </div>
    </div>
  );
};
