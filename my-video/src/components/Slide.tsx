import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { SlideContent } from "../types";

type SlideProps = {
  slide: SlideContent;
  position?: "right" | "fullscreen" | "center";
};

export const Slide: React.FC<SlideProps> = ({ slide, position = "right" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in animation
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Slide in from right
  const slideIn = interpolate(frame, [0, fps * 0.4], [50, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const containerStyle: React.CSSProperties =
    position === "right"
      ? {
          position: "absolute",
          right: 40,
          top: 80,
          bottom: 140,
          width: "50%",
          maxWidth: 600,
        }
      : position === "center"
        ? {
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translateX(${slideIn}px)`,
            width: "80%",
            maxWidth: 900,
          }
        : {
            position: "absolute",
            inset: 60,
          };

  return (
    <div
      style={{
        ...containerStyle,
        opacity: fadeIn,
        transform:
          position !== "center"
            ? `translateX(${slideIn}px)`
            : containerStyle.transform,
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: 16,
          padding: 32,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Slide title */}
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            color: "#1e293b",
            marginBottom: 24,
            lineHeight: 1.2,
          }}
        >
          {slide.title}
        </h2>

        {/* Slide content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {slide.imageUrl && (
            <Img
              src={slide.imageUrl}
              style={{
                width: "100%",
                maxHeight: 300,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          )}

          <p
            style={{
              fontSize: 24,
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#475569",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {slide.content}
          </p>
        </div>
      </div>
    </div>
  );
};
