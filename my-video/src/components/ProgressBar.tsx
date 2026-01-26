import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SLS_BRAND } from "../lib/brand-config";

type ProgressBarProps = {
  totalDuration: number; // Total video duration in seconds
  currentSection?: string; // Current section name
  sections?: { name: string; startTime: number }[]; // Section markers
  brandConfig?: {
    primaryColor?: string;
    accentColor?: string;
  };
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalDuration,
  currentSection,
  sections = [],
  brandConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const colors = {
    primary: brandConfig?.primaryColor ?? SLS_BRAND.colors.primary,
    accent: brandConfig?.accentColor ?? SLS_BRAND.colors.accent,
  };

  // Calculate progress percentage
  const progress = (frame / durationInFrames) * 100;

  // Fade in animation
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Calculate current time
  const currentTimeSeconds = Math.floor(frame / fps);
  const minutes = Math.floor(currentTimeSeconds / 60);
  const seconds = currentTimeSeconds % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const totalMinutes = Math.floor(totalDuration / 60);
  const totalSeconds = Math.floor(totalDuration % 60);
  const totalTimeString = `${totalMinutes}:${totalSeconds.toString().padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        opacity,
        fontFamily: SLS_BRAND.fonts.primary,
      }}
    >
      {/* Section label */}
      {currentSection && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 40,
            background: `${colors.primary}ee`,
            padding: "8px 16px",
            borderRadius: 6,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: SLS_BRAND.colors.textLight,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {currentSection}
          </span>
        </div>
      )}

      {/* Time display */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: SLS_BRAND.colors.textLight,
            fontFamily: SLS_BRAND.fonts.mono,
          }}
        >
          {timeString}
        </span>
        <span
          style={{
            fontSize: 14,
            color: `${SLS_BRAND.colors.textLight}aa`,
          }}
        >
          / {totalTimeString}
        </span>
      </div>

      {/* Progress bar container */}
      <div
        style={{
          height: 6,
          background: `${SLS_BRAND.colors.textLight}22`,
          position: "relative",
        }}
      >
        {/* Section markers */}
        {sections.map((section, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${(section.startTime / totalDuration) * 100}%`,
              top: -4,
              bottom: -4,
              width: 2,
              background: `${SLS_BRAND.colors.textLight}44`,
            }}
          />
        ))}

        {/* Progress fill */}
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
            transition: "width 0.1s linear",
          }}
        />

        {/* Progress indicator dot */}
        <div
          style={{
            position: "absolute",
            left: `${progress}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: colors.accent,
            border: `2px solid ${SLS_BRAND.colors.textLight}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </div>
  );
};
