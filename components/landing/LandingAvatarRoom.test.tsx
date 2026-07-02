/**
 * Regression test: AvatarVideoDisplay must fall back to useVoiceAssistant()'s
 * video track when the raw Camera/ScreenShare source lookup finds nothing.
 * lesson-room.tsx (the real, proven-working lesson pipeline on the same
 * bitHuman backend) already does `beyAvatarTrack || voiceAssistantVideoTrack`
 * — the landing page never had that fallback, which produced an intermittent
 * "stuck on placeholder" bug when the raw source-based lookup raced/missed.
 */
import { render, screen } from "@testing-library/react";
import { AvatarVideoDisplay } from "./LandingAvatarRoom";

jest.mock("@livekit/components-styles", () => ({}));
jest.mock("livekit-client", () => ({
  Track: { Source: { Camera: "camera", ScreenShare: "screen_share" } },
  RoomEvent: { Disconnected: "disconnected" },
}));

const mockUseTracks = jest.fn();
const mockUseVoiceAssistant = jest.fn();

jest.mock("@livekit/components-react", () => ({
  useTracks: (...args: unknown[]) => mockUseTracks(...args),
  useVoiceAssistant: () => mockUseVoiceAssistant(),
  VideoTrack: ({ trackRef }: { trackRef: { participant: { identity: string } } }) => (
    <div data-testid="video-track">{trackRef.participant.identity}</div>
  ),
}));

describe("AvatarVideoDisplay", () => {
  beforeEach(() => {
    mockUseTracks.mockReset();
    mockUseVoiceAssistant.mockReset();
  });

  it("falls back to useVoiceAssistant's video track when no raw Camera/ScreenShare track is found", () => {
    mockUseTracks.mockReturnValue([]); // raw source-based lookup finds nothing
    mockUseVoiceAssistant.mockReturnValue({
      videoTrack: { participant: { identity: "agent-bithuman", isLocal: false } },
      agent: {},
    });

    render(<AvatarVideoDisplay avatar={{ _id: "1", name: "George" }} />);

    expect(screen.getByTestId("video-track")).toHaveTextContent("agent-bithuman");
    expect(screen.queryByText("Connecting...")).not.toBeInTheDocument();
  });
});
