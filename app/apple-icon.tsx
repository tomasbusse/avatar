import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #003F37 0%, #4F5338 100%)",
          borderRadius: "36px",
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Presentation board */}
          <rect
            x="5"
            y="4"
            width="22"
            height="16"
            rx="2.5"
            stroke="white"
            strokeWidth="1.6"
            fill="none"
          />
          {/* Play triangle */}
          <polygon points="13,8.5 13,18 21,13.25" fill="white" />
          {/* Easel legs */}
          <line
            x1="11"
            y1="20"
            x2="7.5"
            y2="28"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="21"
            y1="20"
            x2="24.5"
            y2="28"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
