"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  useVoiceAssistant,
  VideoTrack,
  useTrackRefContext,
  useTrackVolume,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileUp,
  Loader2,
  Image as ImageIcon,
  Settings,
  ChevronRight,
  ChevronLeft,
  Volume2,
  MonitorUp,
  MonitorOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface LessonRoomProps {
  sessionId: string;
  roomName: string;
  participantName: string;
  avatar?: any; // Full avatar object with personality, identity, etc.
  onSessionEnd?: () => void;
  isGuest?: boolean; // For open access lessons without authentication
}

/**
 * Pre-warm audio context to avoid delay on first interaction
 * Only runs once per page load
 */
let audioContextWarmed = false;
function warmAudioContext(): void {
  if (audioContextWarmed) return;
  audioContextWarmed = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      // Create a silent oscillator to warm up the audio pipeline
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0; // Silent
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.001);
      console.log("[LessonRoom] Audio context warmed up");
    }
  } catch (e) {
    console.warn("[LessonRoom] Failed to warm audio context:", e);
  }
}



function VolumeIndicator({ trackRef }: { trackRef: any }) {
  const volume = useTrackVolume(trackRef);
  return (
    <div className="flex gap-0.5 items-end h-6 w-8 pb-1">
      <div
        className="flex-1 bg-primary rounded-t-[1px] transition-all duration-75"
        style={{ height: `${Math.max(15, volume * 100)}%` }}
      />
      <div
        className="flex-1 bg-primary rounded-t-[1px] transition-all duration-75"
        style={{ height: `${Math.max(15, volume * 150)}%` }}
      />
      <div
        className="flex-1 bg-primary rounded-t-[1px] transition-all duration-75"
        style={{ height: `${Math.max(15, volume * 120)}%` }}
      />
    </div>
  );
}

export function LessonRoom({
  sessionId,
  roomName,
  participantName,
  avatar,
  onSessionEnd,
  isGuest = false,
}: LessonRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const tokenFetchedRef = useRef(false);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Memoize avatar to prevent unnecessary re-renders/re-fetches
  const avatarRef = useRef(avatar);
  if (avatar) {
    avatarRef.current = avatar;
  }

  // Debug: Log avatar when component mounts
  console.log("[LessonRoom] Avatar prop received:", {
    hasAvatar: !!avatar,
    avatarName: avatar?.name,
    hasLlmConfig: !!avatar?.llmConfig,
    llmModel: avatar?.llmConfig?.model,
    hasVoiceProvider: !!avatar?.voiceProvider,
    voiceModel: avatar?.voiceProvider?.model,
    voiceId: avatar?.voiceProvider?.voiceId,
  });

  // Warm up audio context on mount for faster first response
  useEffect(() => {
    warmAudioContext();
  }, []);

  useEffect(() => {
    // Only fetch token once per session - use sessionStorage to handle React StrictMode double-mount
    const tokenCacheKey = `livekit_token_${roomName}_${sessionId}`;
    const cachedToken = sessionStorage.getItem(tokenCacheKey);

    // If we already have a token for this session, use it
    if (cachedToken && !token) {
      console.log("[LessonRoom] Using cached token for session");
      setToken(cachedToken);
      setIsConnecting(false);
      return;
    }

    // Prevent duplicate fetches with ref (handles rapid re-renders)
    if (tokenFetchedRef.current) return;
    tokenFetchedRef.current = true;

    const startTime = performance.now();

    async function fetchToken() {
      // Debug: Log what we're sending
      console.log("[LessonRoom] Fetching token with avatar:", {
        hasAvatarRef: !!avatarRef.current,
        avatarName: avatarRef.current?.name,
        hasLlmConfig: !!avatarRef.current?.llmConfig,
        llmModel: avatarRef.current?.llmConfig?.model,
        hasVoiceProvider: !!avatarRef.current?.voiceProvider,
        voiceModel: avatarRef.current?.voiceProvider?.model,
      });

      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName,
            participantName,
            sessionId,
            avatar: avatarRef.current, // Use ref to get stable avatar value
            isGuest,
            guestId: isGuest ? `guest_${sessionId}` : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get access token");
        }

        const data = await response.json();
        // Cache the token in sessionStorage to prevent double-fetch on StrictMode remount
        sessionStorage.setItem(tokenCacheKey, data.token);
        setToken(data.token);
        console.log(`[LessonRoom] Connection ready in ${(performance.now() - startTime).toFixed(0)}ms`);
      } catch (err) {
        console.error("Token fetch error:", err);
        setError("Failed to connect to lesson room");
      } finally {
        setIsConnecting(false);
      }
    }

    fetchToken();

    // NO cleanup - don't reset ref to avoid StrictMode double-fetch issues
    // Token is cached in sessionStorage per room+session, so navigation away/back is safe
  }, [roomName, participantName, sessionId, token]); // Added token to deps

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <Card className="p-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (isConnecting || !token) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Connecting to your lesson...</p>
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
        console.log("[LessonRoom] Room disconnected");
        onSessionEnd?.();
      }}
      className="h-full"
    >
      <RoomContent
        sessionId={sessionId}
        roomName={roomName}
        participantName={participantName}
        onEnd={onSessionEnd}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function RoomContent({
  sessionId,
  roomName,
  participantName,
  onEnd,
}: {
  sessionId: string;
  roomName: string;
  participantName: string;
  onEnd?: () => void;
}) {
  const router = useRouter();
  const room = useRoomContext();
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isEnding, setIsEnding] = useState(false);


  const [audioContextBlocked, setAudioContextBlocked] = useState(false);

  // Document upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPresentationId, setCurrentPresentationId] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Watch current presentation
  const presentation = useQuery(api.presentations.getPresentation,
    currentPresentationId ? { presentationId: currentPresentationId as any } : "skip"
  );


  // Helper: Send High-Quality Image snapshot via data packet
  const sendHighQualitySnapshot = useCallback(async (imageUrl: string) => {
    if (!localParticipant) return;

    try {
      // Fetch image as blob to avoid CORS issues
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.src = objectUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 1024; // High enough for OCR/detail
      const scale = Math.min(1, MAX_WIDTH / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const base64 = canvas.toDataURL("image/jpeg", 0.7);

      // Clean up object URL
      URL.revokeObjectURL(objectUrl);

      const encoder = new TextEncoder();
      const payload = JSON.stringify({
        type: "document_image",
        image: base64,
        page: currentSlideIndex + 1,
        totalPages: presentation?.slides?.length || 1,
        fileName: "Presentation"
      });

      if (room.state === "connected") {
        localParticipant.publishData(encoder.encode(payload), { reliable: true });
        console.log("[VISION] HQ snapshot sent via data channel");
      } else {
        console.warn("[VISION] Not connected, skipping HQ snapshot");
      }
    } catch (err) {
      console.error("[VISION] Failed to send HQ snapshot:", err);
    }
  }, [room, localParticipant, currentSlideIndex, presentation]);




  // Broadcast slide change to agent
  useEffect(() => {
    if (presentation && presentation.status === "ready" && presentation.slides.length > 0) {
      const slideData = presentation.slides[currentSlideIndex];
      if (slideData) {
        console.log(`Sending slide update: index ${currentSlideIndex}`);

        // 1. Send breadcrumb via existing payload
        const encoder = new TextEncoder();
        const payload = JSON.stringify({
          type: "slide_changed",
          presentationId: presentation._id,
          url: slideData.url,
          index: currentSlideIndex
        });

        if (room.localParticipant && room.state === "connected") {
          room.localParticipant.publishData(encoder.encode(payload), { reliable: true });
        }

        // 2. Send High-Quality Snapshot (Data Packet) for focused vision
        if (slideData.url) {
          sendHighQualitySnapshot(slideData.url);
        }
      }
    }
  }, [currentSlideIndex, presentation, room.localParticipant, sendHighQualitySnapshot]);

  // Initial presentation load notification
  useEffect(() => {
    if (presentation && presentation.status === "ready" && presentation.slides.length > 0) {
      console.log("Presentation ready! Sending to agent...", presentation);
      // Reset to first slide when new presentation loads
      // setCurrentSlideIndex(0);
      // Note: The Effect above will trigger for index 0 and send the data, 
      // preventing double-sending if we manage deps carefully. 
      // Actually, setCurrentSlideIndex(0) might not trigger if it's already 0. 
      // Let's keep the explicit "presentation_ready" for clarity as it might carry metadata.

      const encoder = new TextEncoder();
      const payload = JSON.stringify({
        type: "presentation_ready",
        presentationId: presentation._id,
        slides: presentation.slides.map((s: any) => ({ url: s.url, index: s.index }))
      });

      if (room.localParticipant && room.state === "connected") {
        room.localParticipant.publishData(encoder.encode(payload), { reliable: true });
      }
    }
  }, [presentation, room.localParticipant]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // NOTE: Screen share is DISABLED - we use direct canvas capture instead
    // Slides are automatically captured and sent via data channel when they load/change
    // This avoids the browser's screen share picker dialog entirely

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/presentations/convert", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.presentationId) {
        setCurrentPresentationId(data.presentationId);
        // Toast success? We don't have toast imported here yet, but that's fine.
        console.log("Upload success!", data);
      } else {
        console.error("Upload failed:", data.error);
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    // Check if audio context is blocked (common in Firefox/Chrome until user click)
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
      console.log("🔊 Audio context resumed");
    } catch (e) {
      console.error("Failed to resume audio context:", e);
    }
  };

  const session = useQuery(api.sessions.getSessionByRoom, { roomName });
  const endSessionByRoom = useMutation(api.sessions.endSessionByRoom);

  // Get the avatar details for personalized messages
  const avatar = useQuery(
    api.avatars.getAvatar,
    session?.avatarId ? { avatarId: session.avatarId } : "skip"
  );

  const { videoTrack: voiceAssistantVideoTrack, agent } = useVoiceAssistant();

  // Get all video tracks to find Beyond Presence avatar
  const allVideoTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  // Find Beyond Presence avatar video (published by bey-avatar-agent participant)
  const beyAvatarTrack = allVideoTracks.find(
    (track) => track.participant.identity.includes("bey-avatar")
  );

  // Use Beyond Presence track if available, otherwise fall back to voice assistant track
  const avatarVideoTrack = beyAvatarTrack || voiceAssistantVideoTrack;

  // Debug logging for avatar track
  useEffect(() => {
    console.log("🎬 Avatar tracks debug:", {
      allVideoTracksCount: allVideoTracks.length,
      allVideoTrackParticipants: allVideoTracks.map(t => t.participant.identity),
      hasBeyAvatarTrack: !!beyAvatarTrack,
      hasVoiceAssistantTrack: !!voiceAssistantVideoTrack,
      hasAvatarVideoTrack: !!avatarVideoTrack,
    });
  }, [allVideoTracks, beyAvatarTrack, voiceAssistantVideoTrack, avatarVideoTrack]);

  // Avatar name with fallbacks: DB name > agent identity > default
  const avatarName = avatar?.name || agent?.identity || "Your teacher";

  const localTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });

  const localVideoTrack = localTracks.find(
    (track) => track.participant.identity === localParticipant.identity
  );

  const toggleMute = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [localParticipant, isMuted]);

  const toggleCamera = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  }, [localParticipant, isCameraOff]);

  // Toggle screen share - configured to show ONLY current tab option
  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const newState = !isScreenShareEnabled;
      console.log(`[LessonRoom] ${newState ? "Starting" : "Stopping"} screen share...`);

      await localParticipant.setScreenShareEnabled(newState, {
        audio: false,
        video: {
          // @ts-ignore - Chrome-specific: restrict to current tab only
          displaySurface: "browser", // Only allow tab sharing (not window/screen)
        },
        selfBrowserSurface: "include", // Include current tab in picker
        // @ts-ignore - Chrome 109+: prefer/pre-select current tab
        preferCurrentTab: true,
        surfaceSwitching: "exclude", // Don't allow switching to other surfaces
        systemAudio: "exclude",
      });

      console.log(`[LessonRoom] ✅ Screen share ${newState ? "started" : "stopped"}`);
    } catch (error) {
      console.error("[LessonRoom] Screen share failed:", error);
    }
  }, [localParticipant, isScreenShareEnabled]);

  const localAudioTrack = useTracks([Track.Source.Microphone]).find(
    (t) => t.participant.identity === localParticipant.identity
  );

  const endLesson = useCallback(async () => {
    setIsEnding(true);
    try {
      console.log("[LessonRoom] Ending lesson...");

      // Mark session as completed in database BEFORE disconnecting
      // This ensures cleanup even if LiveKit disconnect fails
      try {
        await endSessionByRoom({ roomName, reason: "completed" });
        console.log("[LessonRoom] Session marked as completed");
      } catch (sessionError) {
        console.warn("[LessonRoom] Failed to end session in DB (may already be ended):", sessionError);
      }

      // Disable tracks before disconnecting
      if (localParticipant) {
        await localParticipant.setMicrophoneEnabled(false);
        await localParticipant.setCameraEnabled(false);
        if (isScreenShareEnabled) {
          await localParticipant.setScreenShareEnabled(false);
        }
      }
      await room.disconnect();
      onEnd?.();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error ending lesson:", error);
      router.push("/dashboard");
    }
  }, [room, onEnd, router, localParticipant, isScreenShareEnabled, endSessionByRoom, roomName]);

  // Cleanup on unmount - ensures resources are released
  useEffect(() => {
    return () => {
      console.log("[LessonRoom] RoomContent unmounting - cleaning up resources");
      // Disable tracks on unmount
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false).catch(() => {});
        localParticipant.setCameraEnabled(false).catch(() => {});
      }
    };
  }, [localParticipant]);

  // Browser close/refresh cleanup via beacon API
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon to ensure the request completes even as page unloads
      const data = JSON.stringify({
        roomName,
        reason: "browser_closed",
      });

      // sendBeacon is fire-and-forget, works reliably during page unload
      navigator.sendBeacon("/api/sessions/cleanup", data);
      console.log("[LessonRoom] Sent cleanup beacon for room:", roomName);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomName]);

  useEffect(() => {
    const handleDisconnect = () => {
      console.log("Disconnected from room");
    };

    room.on(RoomEvent.Disconnected, handleDisconnect);

    // === DEBUGGING: Track publishing logs ===
    const handleLocalTrackPublished = (publication: any) => {
      console.log("🎤 LOCAL TRACK PUBLISHED:", {
        kind: publication.kind,
        source: publication.source,
        trackSid: publication.trackSid,
        trackName: publication.trackName,
      });
    };

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log("✅ REMOTE TRACK SUBSCRIBED:", {
        participantIdentity: participant.identity,
        kind: track.kind,
        source: publication.source,
        trackSid: track.sid,
      });
    };

    const handleParticipantConnected = (participant: any) => {
      console.log("🟢 PARTICIPANT CONNECTED:", participant.identity);
    };

    room.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);

    // Log current state
    console.log("📊 Room state:", {
      state: room.state,
      localParticipant: localParticipant?.identity,
      localTracks: localParticipant?.trackPublications ?
        Array.from(localParticipant.trackPublications.values()).map((p: any) => ({
          kind: p.kind,
          source: p.source,
          isMuted: p.isMuted,
        })) : [],
      remoteParticipants: Array.from(room.remoteParticipants.values()).map((p: any) => p.identity),
    });
    // === END DEBUGGING ===

    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
      room.off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
    };
  }, [room, localParticipant]);



  return (
    <div className="h-full flex bg-background relative">
      {/* Audio Blocked Overlay */}
      {audioContextBlocked && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-card border rounded-2xl p-8 max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Enable Audio</h2>
            <p className="text-muted-foreground mb-6">
              Your browser has blocked audio playback. Click the button below to hear {avatarName}.
            </p>
            <Button onClick={handleResumeAudio} size="lg" className="w-full gap-2">
              <Volume2 className="w-5 h-5" />
              Unmute Teacher
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">

          {/* Presentation Mode Layout */}
          {presentation && presentation.status === "ready" && presentation.slides.length > 0 ? (
            <div className="w-full h-full flex gap-4 max-w-7xl">
              {/* Center: Slide Viewer */}
              <div className="flex-1 bg-muted/50 rounded-xl border flex items-center justify-center relative overflow-hidden shadow-sm">
                {/* Current Slide */}
                <div className="relative w-full h-full p-4 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={presentation.slides[currentSlideIndex]?.url}
                    alt={`Slide ${currentSlideIndex + 1}`}
                    className="max-w-full max-h-full object-contain shadow-lg rounded-md"
                  />
                </div>

                {/* Slide Navigation Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm border border-white/10 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                    disabled={currentSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  {/* Clickable Page Numbers */}
                  <div className="flex gap-1 mx-2">
                    {presentation.slides.map((_: any, idx: number) => {
                      // Simple logic to show limited dots if too many slides could be added,
                      // but for now showing all or a simple text input is requested.
                      // User asked for "numbers so one click on the numbers".
                      // If heavily loaded, this might wrap, but standard presentations < 50 slides usually fine horizontally or we scroll.
                      // Let's implement a scrollable number strip if needed, or just numbers.
                      if (presentation.slides.length > 10 && Math.abs(currentSlideIndex - idx) > 3 && idx !== 0 && idx !== presentation.slides.length - 1) {
                        if (Math.abs(currentSlideIndex - idx) === 4) return <span key={idx} className="text-white/50 text-xs self-end">...</span>;
                        return null;
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${currentSlideIndex === idx
                            ? "bg-primary text-primary-foreground"
                            : "text-white hover:bg-white/20"
                            }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                    disabled={currentSlideIndex === presentation.slides.length - 1}
                    onClick={() => setCurrentSlideIndex(prev => Math.min(presentation.slides.length - 1, prev + 1))}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Right Sidebar: Video Feeds (Stacked) */}
              <div className="w-80 flex flex-col gap-4 shrink-0">
                {/* Avatar Video (Top) */}
                <div className="flex-1 min-h-0 bg-muted rounded-xl overflow-hidden relative shadow-sm border">
                  {avatarVideoTrack ? (
                    <VideoTrack
                      trackRef={avatarVideoTrack}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {avatarName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs font-medium">
                    {avatarName}
                  </div>
                </div>

                {/* Local User Video (Bottom) */}
                <div className="flex-1 min-h-0 bg-muted rounded-xl overflow-hidden relative shadow-sm border">
                  {localVideoTrack ? (
                    <VideoTrack
                      trackRef={localVideoTrack}
                      className="w-full h-full object-cover mirror"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <VideoOff className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs font-medium">
                    You
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Avatar View (No Presentation) */
            <div className="w-full h-full max-w-7xl mx-auto flex items-center justify-center p-4">
              <div className="w-full h-full bg-muted rounded-xl overflow-hidden relative shadow-lg ring-1 ring-border/20">
                {avatarVideoTrack ? (
                  <VideoTrack
                    trackRef={avatarVideoTrack}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                    <div className="text-center animate-in fade-in duration-500">
                      {/* Avatar placeholder with pulsing ring animation */}
                      <div className="relative mx-auto mb-6">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                          <span className="text-5xl font-bold text-primary">
                            {avatarName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {/* Pulsing ring animation */}
                        <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                        <div className="absolute inset-[-4px] rounded-full border-2 border-primary/20 animate-pulse" />
                      </div>

                      {/* Loading message with avatar name - friendly and personalized */}
                      <h3 className="text-xl font-semibold mb-2">
                        {agent
                          ? `${avatarName} is just finishing preparing your lesson`
                          : `${avatarName} will be with you in a few seconds`
                        }
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {agent
                          ? "Almost ready..."
                          : "Please wait while your teacher connects"
                        }
                      </p>

                      {/* Loading dots animation */}
                      <div className="flex justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                {room.state !== "connected" && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {room.state === "connecting"
                          ? "Connecting..."
                          : "Reconnecting..."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {room.state === "connected" ? "🟢 Connected" : "⏳ Connecting"}
                </div>

                {localVideoTrack && (
                  <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/50 shadow-lg">
                    <VideoTrack
                      trackRef={localVideoTrack}
                      className="w-full h-full object-cover mirror"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-card p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <div className="relative group">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-14 h-14 relative z-10"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>
              {!isMuted && localAudioTrack && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border rounded-full px-2 py-1 shadow-md flex items-center justify-center">
                  <VolumeIndicator trackRef={localAudioTrack} />
                </div>
              )}
            </div>

            <Button
              variant={isCameraOff ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={toggleCamera}
            >
              {isCameraOff ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <Video className="w-6 h-6" />
              )}
            </Button>

            <Button
              variant={isScreenShareEnabled ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={toggleScreenShare}
              title={isScreenShareEnabled ? "Stop Screen Share" : "Share Current Tab"}
            >
              {isScreenShareEnabled ? (
                <MonitorOff className="w-6 h-6" />
              ) : (
                <MonitorUp className="w-6 h-6" />
              )}
            </Button>

            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                onChange={handleFileUpload}
              />
              <Button
                variant={isUploading ? "secondary" : "secondary"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Upload Document"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <FileUp className="w-6 h-6" />
                )}
              </Button>
            </div>

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={endLesson}
              disabled={isEnding}
            >
              {isEnding ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <PhoneOff className="w-6 h-6" />
              )}
            </Button>



            <Button
              variant="secondary"
              size="lg"
              className="rounded-full w-14 h-14"
              disabled
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div >
  );
}


