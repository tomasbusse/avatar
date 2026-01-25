import { useCurrentFrame, useVideoConfig } from "remotion";

type NewsTickerProps = {
  text: string;
  speed?: number; // Pixels per frame
  backgroundColor?: string;
  textColor?: string;
};

export const NewsTicker: React.FC<NewsTickerProps> = ({
  text,
  speed = 3,
  backgroundColor = "#dc2626",
  textColor = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Repeat the text to ensure smooth scrolling
  const repeatedText = `${text}     •     ${text}     •     ${text}     •     `;

  // Calculate scroll position
  const scrollX = frame * speed;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 48,
        backgroundColor,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Breaking news label */}
      <div
        style={{
          backgroundColor: "#000",
          padding: "0 20px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <span
          style={{
            color: textColor,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          BREAKING
        </span>
      </div>

      {/* Scrolling text */}
      <div
        style={{
          display: "flex",
          whiteSpace: "nowrap",
          transform: `translateX(-${scrollX % (width * 2)}px)`,
        }}
      >
        <span
          style={{
            color: textColor,
            fontSize: 20,
            fontWeight: 500,
            fontFamily: "Inter, system-ui, sans-serif",
            paddingLeft: 20,
          }}
        >
          {repeatedText}
        </span>
      </div>
    </div>
  );
};
