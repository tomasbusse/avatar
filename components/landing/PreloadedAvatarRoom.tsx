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
import { Volume2, VolumeX, X, Video, VideoOff, Clock, AlertTriangle, Square, Play, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreloadedAvatarRoomProps {
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
  onClose?: (reason?: string) => void;
  className?: string;
  sessionTimeoutSeconds?: number;
  warningAtSeconds?: number;
  hideControls?: boolean;
  /** If true, preload connection on mount (before user interaction) */
  preload?: boolean;
  /** Called when preload connection is ready */
  onPreloadReady?: () => void;
  /** Max seconds to wait for user to start talking before disconnecting (default: 60) */
  maxIdleSeconds?: number;
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
    console.warn("[PreloadedAvatarRoom] Failed to warm audio context:", e);
  }
}

/**
 * Generate a unique guest session ID
 */
function generateGuestSessionId(): string {
  return `landing_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format seconds as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PreloadedAvatarRoom({
  avatar,
  onClose,
  className,
  sessionTimeoutSeconds = 300,
  warningAtSeconds = 60,
  hideControls = false,
  preload = true,
  onPreloadReady,
  maxIdleSeconds = 60,
}: PreloadedAvatarRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [sessionId] = useState(() => generateGuestSessionId());
  const [isConversationStarted, setIsConversationStarted] = useState(!preload);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const tokenFetchedRef = useRef(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Determine if vision/camera is enabled for this avatar
  const visionEnabled = avatar.visionConfig?.enabled && avatar.visionConfig?.captureWebcam;

  useEffect(() => {
    warmAudioContext();
  }, []);

  // Idle timeout - disconnect if user doesn't start talking within maxIdleSeconds
  useEffect(() => {
    if (!preload || isConversationStarted || isDisconnected) return;

    idleTimeoutRef.current = setTimeout(() => {
      console.log(`[PreloadedAvatarRoom] Idle timeout (${maxIdleSeconds}s) - disconnecting`);
      setIsDisconnected(true);
      onClose?.("idle_timeout");
    }, maxIdleSeconds * 1000);

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [preload, isConversationStarted, isDisconnected, maxIdleSeconds, onClose]);

  // Page visibility - disconnect when user navigates away or hides the page
  useEffect(() => {
    if (isDisconnected) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isConversationStarted) {
        console.log("[PreloadedAvatarRoom] Page hidden - disconnecting preload");
        setIsDisconnected(true);
        onClose?.("page_hidden");
      }
    };

    const handleBeforeUnload = () => {
      if (!isConversationStarted) {
        console.log("[PreloadedAvatarRoom] Page unload - disconnecting preload");
        setIsDisconnected(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isConversationStarted, isDisconnected, onClose]);

  // Fetch token on mount (for preloading)
  useEffect(() => {
    if (tokenFetchedRef.current || isDisconnected) return;
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
        console.error("[PreloadedAvatarRoom] Token fetch error:", err);
        setError("Failed to connect to avatar");
      } finally {
        setIsConnecting(false);
      }
    }

    fetchToken();
  }, [avatar, sessionId, isDisconnected]);

  // Start conversation (enable mic) - also clears idle timeout
  const startConversation = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    setIsConversationStarted(true);
  }, []);

  // Disconnected state (idle timeout or page hidden)
  if (isDisconnected) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive rounded-3xl", className)}>
        <div className="text-center text-white p-6">
          <p className="text-white/80 mb-2">Session ended</p>
          <p className="text-white/60 text-sm">Click the play button to start again</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive rounded-3xl", className)}>
        <div className="text-center text-white p-6">
          <p className="text-white/80 mb-4">{error}</p>
          <button
            onClick={() => onClose?.("error")}
            className="px-6 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Loading state (only show spinner if not preloading)
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
      // Key change: Don't request mic until user starts conversation
      audio={isConversationStarted}
      video={visionEnabled && isConversationStarted}
      onDisconnected={() => onClose?.("disconnected")}
      className={cn("w-full h-full", className)}
    >
      <RoomContent
        avatar={avatar}
        visionEnabled={visionEnabled ?? false}
        onClose={onClose}
        sessionTimeoutSeconds={sessionTimeoutSeconds}
        warningAtSeconds={warningAtSeconds}
        hideControls={hideControls}
        isConversationStarted={isConversationStarted}
        onStartConversation={startConversation}
        onPreloadReady={onPreloadReady}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function RoomContent({
  avatar,
  visionEnabled,
  onClose,
  sessionTimeoutSeconds,
  warningAtSeconds,
  hideControls = false,
  isConversationStarted,
  onStartConversation,
  onPreloadReady,
}: {
  avatar: PreloadedAvatarRoomProps["avatar"];
  visionEnabled: boolean;
  onClose?: (reason?: string) => void;
  sessionTimeoutSeconds: number;
  warningAtSeconds: number;
  hideControls?: boolean;
  isConversationStarted: boolean;
  onStartConversation: () => void;
  onPreloadReady?: () => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [showCamera, setShowCamera] = useState(visionEnabled);
  const [audioContextBlocked, setAudioContextBlocked] = useState(false);
  const [hasNotifiedPreloadReady, setHasNotifiedPreloadReady] = useState(false);

  // Session timeout state (only starts when conversation starts)
  const [timeRemaining, setTimeRemaining] = useState(sessionTimeoutSeconds);
  const [showWarning, setShowWarning] = useState(false);
  const sessionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Notify when preload is ready (avatar video available)
  useEffect(() => {
    if (!hasNotifiedPreloadReady && avatarVideoTrack && room.state === "connected") {
      setHasNotifiedPreloadReady(true);
      onPreloadReady?.();
      console.log("[PreloadedAvatarRoom] Preload ready - avatar video available");
    }
  }, [avatarVideoTrack, room.state, hasNotifiedPreloadReady, onPreloadReady]);

  // Start session timer when conversation starts
  useEffect(() => {
    if (!isConversationStarted) return;

    sessionStartRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      if (!sessionStartRef.current) return;

      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const remaining = Math.max(0, sessionTimeoutSeconds - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= warningAtSeconds && remaining > 0) {
        setShowWarning(true);
      }

      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        handleClose("timeout");
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isConversationStarted, sessionTimeoutSeconds, warningAtSeconds]);

  // Enable mic when conversation starts
  useEffect(() => {
    if (isConversationStarted && localParticipant) {
      localParticipant.setMicrophoneEnabled(true).catch((e) => {
        console.error("[PreloadedAvatarRoom] Failed to enable mic:", e);
      });
    }
  }, [isConversationStarted, localParticipant]);

  // Check for blocked audio context
  useEffect(() => {
    if (!isConversationStarted) return;

    const checkAudioContext = () => {
      // @ts-ignore
      if (room.engine?.client?.audioContext?.state === "suspended") {
        setAudioContextBlocked(true);
      }
    };
    checkAudioContext();
    const interval = setInterval(checkAudioContext, 2000);
    return () => clearInterval(interval);
  }, [room, isConversationStarted]);

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
  const handleClose = useCallback(async (reason?: string) => {
    try {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (localParticipant) {
        await localParticipant.setMicrophoneEnabled(false);
        await localParticipant.setCameraEnabled(false);
      }
      await room.disconnect();
    } catch (e) {
      console.error("Error disconnecting:", e);
    }
    onClose?.(reason);
  }, [room, localParticipant, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false).catch(() => {});
        localParticipant.setCameraEnabled(false).catch(() => {});
      }
    };
  }, [localParticipant]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-sls-teal to-sls-olive">
      {/* "Start Talking" Overlay - shown when preloaded but not started */}
      {!isConversationStarted && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Start button */}
          <button
            onClick={onStartConversation}
            className="relative z-10 group"
          >
            <div className={cn(
              "w-20 h-20 rounded-full bg-sls-orange flex items-center justify-center shadow-2xl transition-all",
              "group-hover:scale-110 group-hover:shadow-sls-orange/50",
              "group-active:scale-95"
            )}>
              <Mic className="w-8 h-8 text-white" />
            </div>
            <p className="mt-4 text-white text-sm font-medium text-center">
              Tap to start talking
            </p>
          </button>
        </div>
      )}

      {/* Audio Blocked Overlay */}
      {isConversationStarted && audioContextBlocked && (
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

      {/* Timeout Warning Overlay */}
      {isConversationStarted && showWarning && timeRemaining > 0 && timeRemaining <= warningAtSeconds && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sls-orange/90 backdrop-blur-sm text-white text-sm font-medium shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>{formatTime(timeRemaining)} remaining</span>
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

      {/* Live Badge with Timer */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
          isConversationStarted
            ? "bg-sls-chartreuse/90 text-sls-teal"
            : "bg-white/20 backdrop-blur-sm text-white"
        )}>
          <span className={cn(
            "w-2 h-2 rounded-full",
            isConversationStarted ? "bg-sls-teal animate-pulse" : "bg-white/60"
          )} />
          {isConversationStarted ? "AI Avatar Live" : "Ready"}
        </div>
        {/* Timer Badge - only show when conversation started */}
        {isConversationStarted && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            timeRemaining <= warningAtSeconds
              ? "bg-sls-orange/90 text-white"
              : "bg-white/20 backdrop-blur-sm text-white"
          )}>
            <Clock className="w-3 h-3" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Close Button - only show if controls are not hidden and conversation started */}
      {!hideControls && isConversationStarted && (
        <button
          onClick={() => handleClose("user_closed")}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30"
          title="End conversation"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Controls - Bottom Center - only show if controls are not hidden and conversation started */}
      {!hideControls && isConversationStarted && (
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

          {/* Stop Button - Flips to contact form */}
          <button
            onClick={() => handleClose("user_stopped")}
            className="p-3 rounded-full bg-sls-orange/90 hover:bg-sls-orange backdrop-blur-sm transition-all"
            title="Stop and contact us"
          >
            <Square className="w-5 h-5 text-white fill-white" />
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
      )}

      {/* PiP Camera View - Bottom Right (only if vision enabled and camera on) */}
      {visionEnabled && showCamera && isConversationStarted && (
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
