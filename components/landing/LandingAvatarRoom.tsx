"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  useRoomContext,
} from "@livekit/components-react";
import type { TrackReference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent } from "livekit-client";
import { Volume2, VolumeX, X, Clock, AlertTriangle, Square } from "lucide-react";
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
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"connecting" | "active" | "error">("connecting");
  const requestingRef = useRef(false);

  useEffect(() => {
    if (requestingRef.current) return;
    requestingRef.current = true;

    (async () => {
      try {
        console.log("[LandingAvatarRoom] Requesting LiveKit landing token...");
        const res = await fetch("/api/livekit/landing-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("[LandingAvatarRoom] Token request failed:", res.status, text);
          throw new Error("Failed to get access token");
        }

        const data = await res.json();
        console.log("[LandingAvatarRoom] Got room:", data.roomName);
        setToken(data.token);
        setServerUrl(data.livekitUrl);
      } catch (err) {
        console.error("[LandingAvatarRoom] Connection error:", err);
        setError("Failed to connect to avatar");
        setPhase("error");
      }
    })();
  }, [avatar]);

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

  if (!token || !serverUrl) {
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
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
      onConnected={() => {
        console.log("[LandingAvatarRoom] Connected to LiveKit room");
        setPhase("active");
      }}
      onDisconnected={() => {
        console.log("[LandingAvatarRoom] Disconnected from LiveKit room");
      }}
      onError={(err) => {
        console.error("[LandingAvatarRoom] LiveKit error:", err);
        setError(err.message);
        setPhase("error");
      }}
      className={cn("relative w-full h-full", className)}
    >
      <RoomAudioRenderer />
      <RoomContent
        avatar={avatar}
        onClose={onClose}
        sessionTimeoutSeconds={sessionTimeoutSeconds}
        warningAtSeconds={warningAtSeconds}
        hideControls={hideControls}
      />
    </LiveKitRoom>
  );
}

function AvatarVideoDisplay({ avatar }: { avatar: LandingAvatarRoomProps["avatar"] }) {
  // Subscribe to all remote camera + screen tracks; agent avatar video arrives here.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  type ObjectFitType = "cover" | "contain" | "fill";
  const objectFit: ObjectFitType =
    (avatar?.avatarProvider?.settings?.objectFit as ObjectFitType) || "cover";

  // Pick first remote video track (not local participant's own video).
  const avatarTrack = tracks.find(
    (t): t is TrackReference =>
      !t.participant.isLocal && t.publication?.kind === "video"
  );

  if (avatarTrack) {
    return (
      <VideoTrack
        trackRef={avatarTrack}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
        }}
      />
    );
  }

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
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState(sessionTimeoutSeconds);
  const [showWarning, setShowWarning] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enable microphone on join (LiveKitRoom audio=true publishes after permission grant).
  useEffect(() => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(true).catch((e) => {
      console.error("[LandingAvatarRoom] Mic enable failed:", e);
    });
  }, [localParticipant]);

  const handleClose = useCallback(
    async (reason?: string) => {
      try {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (room) await room.disconnect();
      } catch (e) {
        console.error("[LandingAvatarRoom] disconnect error:", e);
      }
      onClose?.(reason);
    },
    [room, onClose]
  );

  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const remaining = Math.max(0, sessionTimeoutSeconds - elapsed);
      setTimeRemaining(remaining);
      if (remaining <= warningAtSeconds && remaining > 0) setShowWarning(true);
      if (remaining <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        handleClose("timeout");
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sessionTimeoutSeconds, warningAtSeconds, handleClose]);

  // Listen for room disconnect events triggered externally.
  useEffect(() => {
    if (!room) return;
    const onDisc = () => onClose?.("disconnected");
    room.on(RoomEvent.Disconnected, onDisc);
    return () => {
      room.off(RoomEvent.Disconnected, onDisc);
    };
  }, [room, onClose]);

  const toggleMute = useCallback(async () => {
    if (!localParticipant) return;
    const newMuted = !isMuted;
    await localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  }, [localParticipant, isMuted]);

  const avatarName = avatar.name || "Avatar";

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-sls-teal to-sls-olive">
      {showWarning && timeRemaining > 0 && timeRemaining <= warningAtSeconds && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sls-orange/90 backdrop-blur-sm text-white text-sm font-medium shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>{formatTime(timeRemaining)} remaining</span>
          </div>
        </div>
      )}

      <div className="absolute inset-0">
        <AvatarVideoDisplay avatar={avatar} />
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sls-chartreuse/90 text-sls-teal text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-sls-teal animate-pulse" />
          AI Avatar Live
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            timeRemaining <= warningAtSeconds
              ? "bg-sls-orange/90 text-white"
              : "bg-white/20 backdrop-blur-sm text-white"
          )}
        >
          <Clock className="w-3 h-3" />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      </div>

      {!hideControls && (
        <button
          onClick={() => handleClose("user_closed")}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30"
          title="End conversation"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {!hideControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={toggleMute}
            className={cn(
              "p-3 rounded-full backdrop-blur-sm transition-all",
              isMuted ? "bg-red-500/80 hover:bg-red-500" : "bg-white/20 hover:bg-white/30"
            )}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

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
