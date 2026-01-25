// Video composition props
export type VideoStyle = "news_broadcast" | "simple";

export type SlideContent = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  startTime: number; // In seconds, when this slide should appear
  duration: number; // How long the slide should be visible
};

export type LowerThirdConfig = {
  name: string;
  title: string;
  show: boolean;
};

export type VideoConfig = {
  style: VideoStyle;
  aspectRatio: "16:9" | "9:16";
  includeIntro: boolean;
  includeOutro: boolean;
  includeLowerThird: boolean;
  includeTicker: boolean;
  tickerText?: string;
};

export type NewsVideoProps = {
  // Avatar video from Hedra
  avatarVideoUrl: string;
  avatarVideoDuration: number; // In seconds

  // Content
  slides: SlideContent[];
  lowerThird: LowerThirdConfig;

  // Styling
  config: VideoConfig;

  // Branding
  brandName?: string;
  brandLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

// Default intro/outro durations in seconds
export const INTRO_DURATION = 3;
export const OUTRO_DURATION = 3;
export const LOWER_THIRD_FADE_IN = 0.5;
