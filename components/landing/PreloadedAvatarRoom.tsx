"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Daily from "@daily-co/daily-js";
import { DailyProvider, DailyAudio, DailyVideo, useDaily } from "@daily-co/daily-react";
import { Volume2, VolumeX, X, Video, VideoOff, Clock, AlertTriangle, Square, Mic } from "lucide-react";
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
  const [callObject, setCallObject] = useState<ReturnType<typeof Daily.createCallObject> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConversationStarted, setIsConversationStarted] = useState(!preload);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const connectingRef = useRef(false);
  const callObjectRef = useRef(callObject);
  callObjectRef.current = callObject;
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Page visibility - disconnect when user navigates away
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

  // Connect to Daily room on mount (for preloading)
  useEffect(() => {
    if (connectingRef.current || isDisconnected) return;
    connectingRef.current = true;

    async function connect() {
      try {
        console.log("[PreloadedAvatarRoom] Requesting session token...");
        const response = await fetch("/api/daily/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("[PreloadedAvatarRoom] Token request failed:", response.status, text);
          throw new Error("Failed to get access token");
        }

        const data = await response.json();
        console.log("[PreloadedAvatarRoom] Got room URL:", data.roomUrl);

        const co = Daily.createCallObject({
          subscribeToTracksAutomatically: true,
          videoSource: false,
        });

        // Join BEFORE setting state (critical pattern)
        // Don't enable mic yet in preload mode -- wait for user to start conversation
        console.log("[PreloadedAvatarRoom] Joining Daily room...");
        await co.join({ url: data.roomUrl, token: data.token, userName: "Landing Visitor" });
        console.log("[PreloadedAvatarRoom] Joined Daily room successfully");

        // Start with mic muted in preload mode
        if (preload) {
          co.setLocalAudio(false);
        }

        setCallObject(co);
        setIsConnecting(false);
      } catch (err) {
        console.error("[PreloadedAvatarRoom] Connection error:", err);
        setError("Failed to connect to avatar");
        setIsConnecting(false);
      }
    }

    connect();
  }, [avatar, isDisconnected, preload]);

  // Start conversation (enable mic) — also clears idle timeout
  const startConversation = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (callObjectRef.current) {
      callObjectRef.current.setLocalAudio(true);
    }
    setIsConversationStarted(true);
  }, []);

  // Cleanup on unmount — use ref, NOT callObject in deps
  useEffect(() => {
    return () => {
      if (callObjectRef.current) {
        try {
          callObjectRef.current.leave();
          callObjectRef.current.destroy();
        } catch {}
      }
    };
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

  // Loading state
  if (isConnecting || !callObject) {
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
    <DailyProvider callObject={callObject}>
      <DailyAudio />
      <RoomContent
        avatar={avatar}
        onClose={onClose}
        sessionTimeoutSeconds={sessionTimeoutSeconds}
        warningAtSeconds={warningAtSeconds}
        hideControls={hideControls}
        isConversationStarted={isConversationStarted}
        onStartConversation={startConversation}
        onPreloadReady={onPreloadReady}
      />
    </DailyProvider>
  );
}

function AvatarVideoDisplay({
  avatar,
  onPreloadReady,
  hasNotifiedRef,
}: {
  avatar: PreloadedAvatarRoomProps["avatar"];
  onPreloadReady?: () => void;
  hasNotifiedRef: React.MutableRefObject<boolean>;
}) {
  const daily = useDaily();
  const [avatarSessionId, setAvatarSessionId] = useState<string | null>(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get object-fit from avatar config
  type ObjectFitType = "cover" | "contain" | "fill";
  const objectFit: ObjectFitType = (avatar?.avatarProvider?.settings?.objectFit as ObjectFitType) || "cover";

  useEffect(() => {
    if (!daily) return;

    const checkParticipants = () => {
      const participants = daily.participants();
      const remote = Object.values(participants).filter((p: any) => !p.local);

      // Find participant with a playable video track
      const withVideo = remote.find((p: any) => {
        const videoTrack = p.tracks?.video;
        return videoTrack?.persistentTrack || videoTrack?.state === "playable";
      });

      if (withVideo) {
        const sid = (withVideo as any).session_id;
        if (sid !== avatarSessionId) {
          console.log("[PreloadedAvatarRoom] Found avatar video participant:", sid);
        }
        setAvatarSessionId(sid);
        setHasVideoTrack(true);

        // Fallback: manually attach video track if DailyVideo doesn't render
        const track = (withVideo as any).tracks?.video?.persistentTrack;
        if (track && videoRef.current && !videoRef.current.srcObject) {
          console.log("[PreloadedAvatarRoom] Attaching video track directly to element");
          videoRef.current.srcObject = new MediaStream([track]);
        }

        // Notify preload ready when we first get avatar video
        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true;
          onPreloadReady?.();
          console.log("[PreloadedAvatarRoom] Preload ready - avatar video available");
        }
      } else if (remote.length > 0) {
        console.log("[PreloadedAvatarRoom] Remote participants found but no video yet, count:", remote.length);
      }
    };

    checkParticipants();
    daily.on("participant-joined", checkParticipants);
    daily.on("participant-updated", checkParticipants);
    daily.on("track-started", checkParticipants);
    const interval = setInterval(checkParticipants, 1000);

    return () => {
      daily.off("participant-joined", checkParticipants);
      daily.off("participant-updated", checkParticipants);
      daily.off("track-started", checkParticipants);
      clearInterval(interval);
    };
  }, [daily, onPreloadReady, hasNotifiedRef, avatarSessionId]);

  if (avatarSessionId && hasVideoTrack) {
    return (
      <>
        <DailyVideo
          sessionId={avatarSessionId}
          type="video"
          style={{
            width: "100%",
            height: "100%",
            objectFit,
          }}
        />
        {/* Hidden fallback video element -- used if DailyVideo fails to render */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit,
            zIndex: 0,
          }}
        />
      </>
    );
  }

  // Waiting for avatar video -- show profile image with loading state
  const avatarName = avatar.name || "Avatar";
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center px-4">
        {/* Large Profile Image */}
        <div className="relative mx-auto mb-6">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-2xl">
            {avatar.profileImage ? (
              <img
                src={avatar.profileImage}
                alt={avatarName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl sm:text-6xl font-light text-white/80">
                {avatarName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Animated loading ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sls-chartreuse animate-spin" style={{ animationDuration: "1.5s" }} />
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        </div>

        {/* Avatar Name */}
        <h3 className="text-white font-semibold text-lg mb-2">{avatarName}</h3>

        {/* Status Message */}
        <p className="text-white/70 text-sm mb-4">Waiting for avatar...</p>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-sls-chartreuse" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}

function RoomContent({
  avatar,
  onClose,
  sessionTimeoutSeconds,
  warningAtSeconds,
  hideControls = false,
  isConversationStarted,
  onStartConversation,
  onPreloadReady,
}: {
  avatar: PreloadedAvatarRoomProps["avatar"];
  onClose?: (reason?: string) => void;
  sessionTimeoutSeconds: number;
  warningAtSeconds: number;
  hideControls?: boolean;
  isConversationStarted: boolean;
  onStartConversation: () => void;
  onPreloadReady?: () => void;
}) {
  const daily = useDaily();
  const [isMuted, setIsMuted] = useState(false);
  const hasNotifiedRef = useRef(false);

  // Session timeout state (only starts when conversation starts)
  const [timeRemaining, setTimeRemaining] = useState(sessionTimeoutSeconds);
  const [showWarning, setShowWarning] = useState(false);
  const sessionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const avatarName = avatar.name || "Avatar";

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

  // Toggle microphone mute
  const toggleMute = useCallback(async () => {
    if (daily) {
      const newMuted = !isMuted;
      daily.setLocalAudio(!newMuted);
      setIsMuted(newMuted);
    }
  }, [daily, isMuted]);

  // Handle close/disconnect
  const handleClose = useCallback(async (reason?: string) => {
    try {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (daily) {
        await daily.leave();
        daily.destroy();
      }
    } catch (e) {
      console.error("Error disconnecting:", e);
    }
    onClose?.(reason);
  }, [daily, onClose]);

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
        <AvatarVideoDisplay
          avatar={avatar}
          onPreloadReady={onPreloadReady}
          hasNotifiedRef={hasNotifiedRef}
        />
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
            isConversationStarted
              ? "bg-sls-teal animate-pulse"
              : "bg-white/60"
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

      {/* Close Button - only show if controls not hidden and conversation started */}
      {!hideControls && isConversationStarted && (
        <button
          onClick={() => handleClose("user_closed")}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30"
          title="End conversation"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Controls - Bottom Center - only show if controls not hidden and conversation started */}
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

          {/* Stop Button */}
          <button
            onClick={() => handleClose("user_stopped")}
            className="p-3 rounded-full bg-sls-orange/90 hover:bg-sls-orange backdrop-blur-sm transition-all"
            title="Stop and contact us"
          >
            <Square className="w-5 h-5 text-white fill-white" />
          </button>
        </div>
      )}
    </div>
  );
}
