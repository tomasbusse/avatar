import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { AvatarVideo } from "../components/AvatarVideo";
import { LowerThird } from "../components/LowerThird";
import { NewsTicker } from "../components/NewsTicker";
import { Slide } from "../components/Slide";
import { Intro } from "../components/Intro";
import { Outro } from "../components/Outro";
import type { NewsVideoProps } from "../types";

export const NewsBroadcast: React.FC<NewsVideoProps> = ({
  avatarVideoUrl,
  avatarVideoDuration,
  slides,
  lowerThird,
  config,
  brandName = "NEWS UPDATE",
  primaryColor = "#1e40af",
  secondaryColor = "#3b82f6",
}) => {
  const { fps } = useVideoConfig();

  // Calculate timing
  const introDuration = config.includeIntro ? 3 * fps : 0; // 3 seconds
  const outroDuration = config.includeOutro ? 3 * fps : 0; // 3 seconds
  const mainContentStart = introDuration;
  const mainContentDuration = avatarVideoDuration * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
      {/* Intro sequence */}
      {config.includeIntro && (
        <Sequence durationInFrames={introDuration} premountFor={fps}>
          <Intro brandName={brandName} primaryColor={primaryColor} />
        </Sequence>
      )}

      {/* Main content - Avatar video */}
      <Sequence
        from={mainContentStart}
        durationInFrames={mainContentDuration}
        premountFor={fps}
      >
        <AbsoluteFill>
          {/* Avatar video - full screen or side depending on slides */}
          <AvatarVideo
            src={avatarVideoUrl}
            style={slides.length > 0 ? "side" : "fullscreen"}
          />

          {/* Slides appearing at specific times */}
          {slides.map((slide) => (
            <Sequence
              key={slide.id}
              from={slide.startTime * fps}
              durationInFrames={slide.duration * fps}
              premountFor={fps * 0.5}
            >
              <Slide slide={slide} position="right" />
            </Sequence>
          ))}

          {/* Lower third - appears after 1 second, stays for 5 seconds */}
          {config.includeLowerThird && (
            <Sequence
              from={fps}
              durationInFrames={5 * fps}
              premountFor={fps * 0.5}
            >
              <LowerThird
                config={lowerThird}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            </Sequence>
          )}

          {/* News ticker at bottom */}
          {config.includeTicker && config.tickerText && (
            <NewsTicker
              text={config.tickerText}
              backgroundColor="#dc2626"
              textColor="#ffffff"
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* Outro sequence */}
      {config.includeOutro && (
        <Sequence
          from={mainContentStart + mainContentDuration}
          durationInFrames={outroDuration}
          premountFor={fps}
        >
          <Outro brandName={brandName} primaryColor={primaryColor} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
