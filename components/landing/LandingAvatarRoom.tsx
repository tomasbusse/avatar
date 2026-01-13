"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  useVoiceAssistant,
  VideoTrack,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Volume2, VolumeX, X, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingAvatarRoomProps {
  avatar: {
    _id: string;
    name: string;
    profileImage?: string;
    visionConfig?: {
      enabled?: boolean;
      captureWebcam?: boolean;
    };
    [key: string]: any;
  };
  onClose?: () => void;
  className?: string;
}

/**
 * Pre-warm audio context to avoid delay on first interaction
 */
let audioContextWarmed = false;
function warmAudioContext(): void {
  if (audioContextWarmed) return;
  audioContextWarmed = true;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.001);
    }
  } catch (e) {
    console.warn("[LandingAvatarRoom] Failed to warm audio context:", e);
  }
}

/**
 * Generate a unique guest session ID
 */
function generateGuestSessionId(): string {
  return `landing_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function LandingAvatarRoom({
  avatar,
  onClose,
  className,
}: LandingAvatarRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [sessionId] = useState(() => generateGuestSessionId());
  const tokenFetchedRef = useRef(false);
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Determine if vision/camera is enabled for this avatar
  const visionEnabled = avatar.visionConfig?.enabled && avatar.visionConfig?.captureWebcam;

  useEffect(() => {
    warmAudioContext();
  }, []);

  useEffect(() => {
    if (tokenFetchedRef.current) return;
    tokenFetchedRef.current = true;

    async function fetchToken() {
      try {
        const roomName = `landing_${avatar._id}_${sessionId}`;

        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName,
            participantName: "Landing Visitor",
            sessionId,
            avatar,
            isGuest: true,
            guestId: `guest_${sessionId}`,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get access token");
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        console.error("[LandingAvatarRoom] Token fetch error:", err);
        setError("Failed to connect to avatar");
      } finally {
        setIsConnecting(false);
      }
    }

    fetchToken();
  }, [avatar, sessionId]);

  // Error state
  if (error) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive rounded-3xl", className)}>
        <div className="text-center text-white p-6">
          <p className="text-white/80 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isConnecting || !token) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive rounded-3xl", className)}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-white/80">Connecting to {avatar.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={true}
      video={visionEnabled ?? false}
      onDisconnected={onClose}
      className={cn("w-full h-full", className)}
    >
      <RoomContent
        avatar={avatar}
        visionEnabled={visionEnabled ?? false}
        onClose={onClose}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function RoomContent({
  avatar,
  visionEnabled,
  onClose,
}: {
  avatar: LandingAvatarRoomProps["avatar"];
  visionEnabled: boolean;
  onClose?: () => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [showCamera, setShowCamera] = useState(visionEnabled);
  const [audioContextBlocked, setAudioContextBlocked] = useState(false);

  const { videoTrack: voiceAssistantVideoTrack, agent } = useVoiceAssistant();

  // Get Beyond Presence avatar video
  const allVideoTracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const beyAvatarTrack = allVideoTracks.find(
    (track) => track.participant.identity.includes("bey-avatar")
  );
  const avatarVideoTrack = beyAvatarTrack || voiceAssistantVideoTrack;

  // Local video for visitor preview (PiP)
  const localTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localVideoTrack = localTracks.find(
    (track) => track.participant.identity === localParticipant.identity
  );

  const avatarName = avatar.name || agent?.identity || "Avatar";

  // Check for blocked audio context
  useEffect(() => {
    const checkAudioContext = () => {
      // @ts-ignore
      if (room.engine?.client?.audioContext?.state === "suspended") {
        setAudioContextBlocked(true);
      }
    };
    checkAudioContext();
    const interval = setInterval(checkAudioContext, 2000);
    return () => clearInterval(interval);
  }, [room]);

  const handleResumeAudio = async () => {
    try {
      // @ts-ignore
      await room.engine?.client?.audioContext?.resume();
      setAudioContextBlocked(false);
    } catch (e) {
      console.error("Failed to resume audio context:", e);
    }
  };

  // Toggle microphone mute
  const toggleMute = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [localParticipant, isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (localParticipant) {
      const newState = !showCamera;
      await localParticipant.setCameraEnabled(newState);
      setShowCamera(newState);
    }
  }, [localParticipant, showCamera]);

  // Handle close/disconnect
  const handleClose = useCallback(async () => {
    try {
      if (localParticipant) {
        await localParticipant.setMicrophoneEnabled(false);
        await localParticipant.setCameraEnabled(false);
      }
      await room.disconnect();
    } catch (e) {
      console.error("Error disconnecting:", e);
    }
    onClose?.();
  }, [room, localParticipant, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false).catch(() => {});
        localParticipant.setCameraEnabled(false).catch(() => {});
      }
    };
  }, [localParticipant]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-sls-teal to-sls-olive">
      {/* Audio Blocked Overlay */}
      {audioContextBlocked && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-light text-white mb-2">Enable Audio</h2>
            <p className="text-white/60 mb-6 text-sm">
              Tap to hear {avatarName}
            </p>
            <button
              onClick={handleResumeAudio}
              className="bg-white text-black hover:bg-white/90 rounded-full px-8 py-2 font-medium"
            >
              Unmute
            </button>
          </div>
        </div>
      )}

      {/* Main Avatar Video */}
      <div className="absolute inset-0">
        {avatarVideoTrack ? (
          <VideoTrack
            trackRef={avatarVideoTrack}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  {avatar.profileImage ? (
                    <img
                      src={avatar.profileImage}
                      alt={avatarName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-light text-white/80">
                      {avatarName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
              </div>
              <p className="text-white/60 text-sm">
                {agent ? "Almost ready..." : "Connecting..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-sls-chartreuse/90 text-sls-teal text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-sls-teal animate-pulse" />
        AI Avatar Live
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30"
        title="End conversation"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Controls - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={cn(
            "p-3 rounded-full backdrop-blur-sm transition-all",
            isMuted
              ? "bg-red-500/80 hover:bg-red-500"
              : "bg-white/20 hover:bg-white/30"
          )}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Camera Toggle (only if vision enabled) */}
        {visionEnabled && (
          <button
            onClick={toggleCamera}
            className={cn(
              "p-3 rounded-full backdrop-blur-sm transition-all",
              !showCamera
                ? "bg-red-500/80 hover:bg-red-500"
                : "bg-white/20 hover:bg-white/30"
            )}
            title={showCamera ? "Turn off camera" : "Turn on camera"}
          >
            {showCamera ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>

      {/* PiP Camera View - Bottom Right (only if vision enabled and camera on) */}
      {visionEnabled && showCamera && (
        <div className="absolute bottom-4 right-4">
          {localVideoTrack ? (
            <div className="w-20 h-28 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg bg-black/20">
              <VideoTrack
                trackRef={localVideoTrack}
                className="w-full h-full object-cover mirror"
              />
            </div>
          ) : (
            <div className="w-20 h-28 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-white/40" />
            </div>
          )}
        </div>
      )}

      {/* Connection Status Overlay */}
      {room.state !== "connected" && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
