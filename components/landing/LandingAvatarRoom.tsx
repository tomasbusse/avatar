"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Daily from "@daily-co/daily-js";
import { DailyProvider, DailyAudio, DailyVideo, useDaily } from "@daily-co/daily-react";
import { Volume2, VolumeX, X, Video, VideoOff, Clock, AlertTriangle, Square } from "lucide-react";
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
  onClose?: (reason?: string) => void;
  className?: string;
  sessionTimeoutSeconds?: number;
  warningAtSeconds?: number;
  /** Hide all UI controls (close button, mute, stop, camera) for external control */
  hideControls?: boolean;
}

/**
 * Format seconds as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function LandingAvatarRoom({
  avatar,
  onClose,
  className,
  sessionTimeoutSeconds = 300,
  warningAtSeconds = 60,
  hideControls = false,
}: LandingAvatarRoomProps) {
  const [callObject, setCallObject] = useState<ReturnType<typeof Daily.createCallObject> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [phase, setPhase] = useState<"connecting" | "active" | "error">("connecting");
  const connectingRef = useRef(false);
  const callObjectRef = useRef(callObject);
  callObjectRef.current = callObject;

  // Connect to Daily room
  useEffect(() => {
    if (connectingRef.current) return;
    connectingRef.current = true;

    async function connect() {
      try {
        console.log("[LandingAvatarRoom] Requesting session token...");
        const response = await fetch("/api/daily/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("[LandingAvatarRoom] Token request failed:", response.status, text);
          throw new Error("Failed to get access token");
        }

        const data = await response.json();
        console.log("[LandingAvatarRoom] Got room URL:", data.roomUrl);

        const co = Daily.createCallObject({
          subscribeToTracksAutomatically: true,
          videoSource: false,
        });

        // Join BEFORE setting state (critical pattern from englisch-lehrer)
        console.log("[LandingAvatarRoom] Joining Daily room...");
        await co.join({ url: data.roomUrl, token: data.token, userName: "Landing Visitor" });
        console.log("[LandingAvatarRoom] Joined Daily room successfully");

        // Enable microphone after joining
        await co.setLocalAudio(true);

        setCallObject(co);
        setPhase("active");
        setIsConnecting(false);
      } catch (err) {
        console.error("[LandingAvatarRoom] Connection error:", err);
        setError("Failed to connect to avatar");
        setPhase("error");
        setIsConnecting(false);
      }
    }

    connect();
  }, [avatar]);

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

  // Error state
  if (phase === "error" || error) {
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
      />
    </DailyProvider>
  );
}

function AvatarVideoDisplay({ avatar }: { avatar: LandingAvatarRoomProps["avatar"] }) {
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
          console.log("[AvatarVideoDisplay] Found avatar video participant:", sid);
        }
        setAvatarSessionId(sid);
        setHasVideoTrack(true);

        // Fallback: manually attach video track if DailyVideo doesn't render
        const track = (withVideo as any).tracks?.video?.persistentTrack;
        if (track && videoRef.current && !videoRef.current.srcObject) {
          console.log("[AvatarVideoDisplay] Attaching video track directly to element");
          videoRef.current.srcObject = new MediaStream([track]);
        }
      } else if (remote.length > 0 && !avatarSessionId) {
        // Set session ID for audio-only participant as placeholder, but don't claim we have video
        console.log("[AvatarVideoDisplay] Remote participants found but no video yet, count:", remote.length);
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
  }, [daily, avatarSessionId]);

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
        {/* Hidden fallback video element — used if DailyVideo fails to render */}
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

  // Waiting for avatar video
  const avatarName = avatar.name || "Avatar";
  return (
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
        <p className="text-white/60 text-sm">Connecting...</p>
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
}: {
  avatar: LandingAvatarRoomProps["avatar"];
  onClose?: (reason?: string) => void;
  sessionTimeoutSeconds: number;
  warningAtSeconds: number;
  hideControls?: boolean;
}) {
  const daily = useDaily();
  const [isMuted, setIsMuted] = useState(false);

  // Session timeout state
  const [timeRemaining, setTimeRemaining] = useState(sessionTimeoutSeconds);
  const [showWarning, setShowWarning] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const avatarName = avatar.name || "Avatar";

  // Session timeout timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
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
  }, [sessionTimeoutSeconds, warningAtSeconds]);

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
      {/* Timeout Warning Overlay */}
      {showWarning && timeRemaining > 0 && timeRemaining <= warningAtSeconds && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sls-orange/90 backdrop-blur-sm text-white text-sm font-medium shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>{formatTime(timeRemaining)} remaining</span>
          </div>
        </div>
      )}

      {/* Main Avatar Video */}
      <div className="absolute inset-0">
        <AvatarVideoDisplay avatar={avatar} />
      </div>

      {/* Live Badge with Timer */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sls-chartreuse/90 text-sls-teal text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-sls-teal animate-pulse" />
          AI Avatar Live
        </div>
        {/* Timer Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          timeRemaining <= warningAtSeconds
            ? "bg-sls-orange/90 text-white"
            : "bg-white/20 backdrop-blur-sm text-white"
        )}>
          <Clock className="w-3 h-3" />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      </div>

      {/* Close Button */}
      {!hideControls && (
        <button
          onClick={() => handleClose("user_closed")}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30"
          title="End conversation"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Controls - Bottom Center */}
      {!hideControls && (
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
