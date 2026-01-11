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
import { Track, RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SessionTimer } from "./session-timer";
import { MinimalControls } from "./minimal-controls";
import { cn } from "@/lib/utils";

interface LessonRoomProps {
  sessionId: string;
  roomName: string;
  participantName: string;
  avatar?: any;
  onSessionEnd?: () => void;
  isGuest?: boolean;
  /** Duration in minutes for the session (default: 15) */
  durationMinutes?: number;
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
    console.warn("[LessonRoom] Failed to warm audio context:", e);
  }
}

export function LessonRoom({
  sessionId,
  roomName,
  participantName,
  avatar,
  onSessionEnd,
  isGuest = false,
  durationMinutes = 15,
}: LessonRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const tokenFetchedRef = useRef(false);
  const avatarRef = useRef(avatar);
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (avatar) {
    avatarRef.current = avatar;
  }

  useEffect(() => {
    warmAudioContext();
  }, []);

  useEffect(() => {
    const tokenCacheKey = `livekit_token_${roomName}_${sessionId}`;
    const cachedToken = sessionStorage.getItem(tokenCacheKey);

    if (cachedToken && !token) {
      setToken(cachedToken);
      setIsConnecting(false);
      return;
    }

    if (tokenFetchedRef.current) return;
    tokenFetchedRef.current = true;

    async function fetchToken() {
      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName,
            participantName,
            sessionId,
            avatar: avatarRef.current,
            isGuest,
            guestId: isGuest ? `guest_${sessionId}` : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get access token");
        }

        const data = await response.json();
        sessionStorage.setItem(tokenCacheKey, data.token);
        setToken(data.token);
      } catch (err) {
        console.error("Token fetch error:", err);
        setError("Failed to connect to lesson room");
      } finally {
        setIsConnecting(false);
      }
    }

    fetchToken();
  }, [roomName, participantName, sessionId, token, isGuest]);

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isConnecting || !token) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-white/60" />
          <p className="text-white/60">Connecting...</p>
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
      video={true}
      onDisconnected={() => {
        onSessionEnd?.();
      }}
      className="h-full"
    >
      <RoomContent
        sessionId={sessionId}
        roomName={roomName}
        durationMinutes={durationMinutes}
        onEnd={onSessionEnd}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function RoomContent({
  sessionId,
  roomName,
  durationMinutes,
  onEnd,
}: {
  sessionId: string;
  roomName: string;
  durationMinutes: number;
  onEnd?: () => void;
}) {
  const router = useRouter();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [audioContextBlocked, setAudioContextBlocked] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());

  const session = useQuery(api.sessions.getSessionByRoom, { roomName });
  const endSessionByRoom = useMutation(api.sessions.endSessionByRoom);
  const avatar = useQuery(
    api.avatars.getAvatar,
    session?.avatarId ? { avatarId: session.avatarId } : "skip"
  );

  const { videoTrack: voiceAssistantVideoTrack, agent } = useVoiceAssistant();

  // Get Beyond Presence avatar video
  const allVideoTracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const beyAvatarTrack = allVideoTracks.find(
    (track) => track.participant.identity.includes("bey-avatar")
  );
  const avatarVideoTrack = beyAvatarTrack || voiceAssistantVideoTrack;

  // Local video for student preview
  const localTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localVideoTrack = localTracks.find(
    (track) => track.participant.identity === localParticipant.identity
  );

  const avatarName = avatar?.name || agent?.identity || "Emma";

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

  // Toggle mute (pause/resume)
  const toggleMute = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [localParticipant, isMuted]);

  // End lesson with gentle fade-out
  const endLesson = useCallback(async (isTimerExpiry = false) => {
    if (isEnding) return;
    setIsEnding(true);

    // If timer expiry, do gentle fade-out
    if (isTimerExpiry) {
      // Send goodbye message to agent via data channel
      const encoder = new TextEncoder();
      const payload = JSON.stringify({
        type: "session_ending",
        reason: "timer_expired",
        message: "Please say a brief goodbye to the student.",
      });

      if (room.localParticipant && room.state === "connected") {
        room.localParticipant.publishData(encoder.encode(payload), { reliable: true });
      }

      // Start fade-out animation
      setIsFadingOut(true);

      // Wait for fade animation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Show completion screen
      setShowComplete(true);

      // Wait, then redirect
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    try {
      await endSessionByRoom({ roomName, reason: "completed" });

      if (localParticipant) {
        await localParticipant.setMicrophoneEnabled(false);
        await localParticipant.setCameraEnabled(false);
      }
      await room.disconnect();
      onEnd?.();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error ending lesson:", error);
      router.push("/dashboard");
    }
  }, [room, onEnd, router, localParticipant, endSessionByRoom, roomName, isEnding]);

  // Restart session
  const restartSession = useCallback(async () => {
    // Send restart message to agent
    const encoder = new TextEncoder();
    const payload = JSON.stringify({
      type: "session_restart",
      message: "The student wants to restart. Please begin a fresh introduction.",
    });

    if (room.localParticipant && room.state === "connected") {
      room.localParticipant.publishData(encoder.encode(payload), { reliable: true });
    }
  }, [room]);

  // Timer expiry handler
  const handleTimerExpiry = useCallback(() => {
    console.log("[LessonRoom] Timer expired, initiating gentle fade-out");
    endLesson(true);
  }, [endLesson]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false).catch(() => {});
        localParticipant.setCameraEnabled(false).catch(() => {});
      }
    };
  }, [localParticipant]);

  // Browser close cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon("/api/sessions/cleanup", JSON.stringify({
        roomName,
        reason: "browser_closed",
      }));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomName]);

  // Session Complete overlay
  if (showComplete) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center animate-in fade-in duration-500">
        <div className="text-center text-white">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-light mb-2">Session Complete</h2>
          <p className="text-white/60">Great work today!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Audio Blocked Overlay */}
      {audioContextBlocked && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-light text-white mb-2">Enable Audio</h2>
            <p className="text-white/60 mb-6 text-sm">
              Tap to hear {avatarName}
            </p>
            <Button
              onClick={handleResumeAudio}
              className="bg-white text-black hover:bg-white/90 rounded-full px-8"
            >
              Unmute
            </Button>
          </div>
        </div>
      )}

      {/* Timer - Top Center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
          <SessionTimer
            durationMinutes={durationMinutes}
            startTime={sessionStartTime}
            onExpired={handleTimerExpiry}
          />
        </div>
      </div>

      {/* Avatar Video - Centered */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <div
          className={cn(
            "relative w-full max-w-3xl aspect-video rounded-3xl overflow-hidden",
            "shadow-2xl shadow-black/50",
            "transition-opacity duration-[3000ms]",
            isFadingOut && "opacity-0"
          )}
        >
          {avatarVideoTrack ? (
            <VideoTrack
              trackRef={avatarVideoTrack}
              className="w-full h-full object-cover"
            />
          ) : (
            // Loading placeholder
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <div className="text-center">
                <div className="relative mx-auto mb-6">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-4xl font-light text-white/80">
                      {avatarName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                </div>
                <p className="text-white/60 text-sm">
                  {agent ? "Almost ready..." : `Connecting to ${avatarName}...`}
                </p>
              </div>
            </div>
          )}

          {/* Connection status */}
          {room.state !== "connected" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            </div>
          )}
        </div>
      </div>

      {/* Student Preview - Bottom Right (FaceTime style) */}
      {localVideoTrack && (
        <div
          className={cn(
            "absolute bottom-28 right-4 md:bottom-32 md:right-8",
            "w-24 h-32 md:w-32 md:h-44",
            "rounded-2xl overflow-hidden",
            "border-2 border-white/20",
            "shadow-xl shadow-black/40",
            "transition-opacity duration-[3000ms]",
            isFadingOut && "opacity-0"
          )}
        >
          <VideoTrack
            trackRef={localVideoTrack}
            className="w-full h-full object-cover mirror"
          />
        </div>
      )}

      {/* Controls - Bottom Center */}
      <div
        className={cn(
          "absolute bottom-6 left-1/2 -translate-x-1/2 z-20",
          "transition-opacity duration-[3000ms]",
          isFadingOut && "opacity-0"
        )}
      >
        <MinimalControls
          isPaused={isMuted}
          isEnding={isEnding}
          onPause={toggleMute}
          onResume={toggleMute}
          onRestart={restartSession}
          onStop={() => endLesson(false)}
        />
      </div>
    </div>
  );
}
