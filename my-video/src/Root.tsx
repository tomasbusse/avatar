import "./index.css";
import { Composition, Folder } from "remotion";
import { NewsBroadcast } from "./compositions/NewsBroadcast";
import type { NewsVideoProps } from "./types";

// Calculate total duration based on props
const calculateDuration = (props: NewsVideoProps, fps: number): number => {
  const introDuration = props.config.includeIntro ? 3 * fps : 0;
  const outroDuration = props.config.includeOutro ? 3 * fps : 0;
  const mainDuration = props.avatarVideoDuration * fps;
  return introDuration + mainDuration + outroDuration;
};

// Default props for preview in Remotion Studio
const defaultNewsVideoProps: NewsVideoProps = {
  avatarVideoUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  avatarVideoDuration: 30, // 30 seconds preview
  slides: [
    {
      id: "1",
      title: "Breaking News",
      content:
        "This is an example slide that appears during the video. It demonstrates the slide overlay feature.",
      startTime: 5,
      duration: 8,
    },
    {
      id: "2",
      title: "Key Points",
      content:
        "• First important point\n• Second important point\n• Third important point",
      startTime: 15,
      duration: 10,
    },
  ],
  lowerThird: {
    name: "John Smith",
    title: "News Anchor",
    show: true,
  },
  config: {
    style: "news_broadcast",
    aspectRatio: "16:9",
    includeIntro: true,
    includeOutro: true,
    includeLowerThird: true,
    includeTicker: true,
    tickerText:
      "Breaking: Major developments in today's news • Markets reach record highs • Weather forecast: Sunny skies ahead",
  },
  brandName: "SLS NEWS",
  primaryColor: "#1e40af",
  secondaryColor: "#3b82f6",
};

export const RemotionRoot: React.FC = () => {
  const fps = 30;

  return (
    <>
      <Folder name="News">
        <Composition
          id="NewsBroadcast"
          component={NewsBroadcast}
          durationInFrames={calculateDuration(defaultNewsVideoProps, fps)}
          fps={fps}
          width={1920}
          height={1080}
          defaultProps={defaultNewsVideoProps}
        />

        {/* 9:16 vertical version for social media */}
        <Composition
          id="NewsBroadcast-Vertical"
          component={NewsBroadcast}
          durationInFrames={calculateDuration(defaultNewsVideoProps, fps)}
          fps={fps}
          width={1080}
          height={1920}
          defaultProps={{
            ...defaultNewsVideoProps,
            config: {
              ...defaultNewsVideoProps.config,
              aspectRatio: "9:16" as const,
            },
          }}
        />
      </Folder>
    </>
  );
};
