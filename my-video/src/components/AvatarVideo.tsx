import { Video } from "@remotion/media";
import { AbsoluteFill } from "remotion";

type AvatarVideoProps = {
  src: string;
  style?: "fullscreen" | "pip" | "side";
  pipPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
};

export const AvatarVideo: React.FC<AvatarVideoProps> = ({
  src,
  style = "fullscreen",
  pipPosition = "bottom-right",
}) => {
  if (style === "fullscreen") {
    return (
      <AbsoluteFill>
        <Video
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
    );
  }

  if (style === "pip") {
    const positions = {
      "top-right": { top: 40, right: 40 },
      "top-left": { top: 40, left: 40 },
      "bottom-right": { bottom: 120, right: 40 },
      "bottom-left": { bottom: 120, left: 40 },
    };

    return (
      <div
        style={{
          position: "absolute",
          ...positions[pipPosition],
          width: 320,
          height: 180,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          border: "3px solid rgba(255,255,255,0.2)",
        }}
      >
        <Video
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  // Side style - avatar on left, content on right
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "40%",
      }}
    >
      <Video
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
};
