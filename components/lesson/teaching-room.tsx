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
import { Track, RoomEvent, LocalVideoTrack, DataPacket_Kind } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Presentation,
  X,
  Users,
  User,
  Bot,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SlideViewer, HtmlSlide } from "./slide-viewer";
import { DocumentUpload } from "./document-upload";

interface TeachingRoomProps {
  sessionId: string;
  roomName: string;
  participantName: string;
  avatar?: any; // Full avatar object with personality, identity, etc.
  onSessionEnd?: () => void;
}

interface TranscriptEntry {
  role: "student" | "avatar" | "system";
  content: string;
  timestamp: number;
  language?: string;
}

export function TeachingRoom({
  sessionId,
  roomName,
  participantName,
  avatar,
  onSessionEnd,
}: TeachingRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const tokenFetchedRef = useRef(false);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Use ref to capture avatar value and prevent re-fetches
  const avatarRef = useRef(avatar);
  if (avatar && !avatarRef.current) {
    avatarRef.current = avatar;
  }

  useEffect(() => {
    // Only fetch token once
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
            avatar: avatarRef.current, // Use ref for stable value
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get access token");
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        console.error("Token fetch error:", err);
        setError("Failed to connect to teaching room");
      } finally {
        setIsConnecting(false);
      }
    }

    fetchToken();
  }, [roomName, participantName, sessionId]); // Removed avatar from deps

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
        onSessionEnd?.();
      }}
      className="h-full"
    >
      <RoomContent
        sessionId={sessionId}
        roomName={roomName}
        onEnd={onSessionEnd}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// Types for data channel messages
interface SlideCommand {
  type: "slide_command";
  action: "next" | "prev" | "goto";
  slideIndex?: number;
}

interface PresentationCommand {
  type: "start_presentation" | "end_presentation";
  presentationId?: string;
}

interface LoadPresentationCommand {
  type: "load_presentation";
  presentationId: string;
}

interface SlideChangedNotification {
  type: "slide_changed";
  slideIndex: number;
  totalSlides: number;
}

interface PresentationReadyNotification {
  type: "presentation_ready";
  presentationId: string;
  totalSlides: number;
  slideContent: Array<{
    index: number;
    title?: string;
    bodyText?: string;
    speakerNotes?: string;
  }>;
}

// Send slide screenshot to avatar for vision
interface SlideScreenshotMessage {
  type: "slide_screenshot";
  imageBase64: string;
  slideIndex: number;
  slideType?: string;
  timestamp: number;
}

// Send HTML slides context to avatar for teaching
interface SlidesContextMessage {
  type: "slides_context";
  totalSlides: number;
  currentIndex: number;
  slides: Array<{
    index: number;
    type: string;
    title?: string;
    teachingPrompt?: string;
    speakerNotes?: string;
  }>;
}

type DataChannelMessage = SlideCommand | PresentationCommand | LoadPresentationCommand | SlideChangedNotification | PresentationReadyNotification | SlideScreenshotMessage | SlidesContextMessage;

function RoomContent({
  sessionId,
  roomName,
  onEnd,
}: {
  sessionId: string;
  roomName: string;
  onEnd?: () => void;
}) {
  const router = useRouter();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [presentationModeActive, setPresentationModeActive] = useState(false);
  const [slideControlledBy, setSlideControlledBy] = useState<"avatar" | "student" | "shared">("shared");
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);
  const lastPublishedSlideRef = useRef<number>(-1);
  const screenShareStartedRef = useRef(false);

  const session = useQuery(api.sessions.getSessionByRoom, { roomName });
  const transcript = session?.transcript || [];

  // Get presentation from session's presentationMode or legacy presentationId
  const presentationId = (session?.presentationMode?.presentationId || session?.presentationId) as Id<"presentations"> | undefined;

  const presentation = useQuery(
    api.presentations.getPresentationWithContent,
    presentationId ? { presentationId } : "skip"
  );

  // Get structured lesson to access knowledgeContentId
  const structuredLessonId = session?.structuredLessonId as Id<"structuredLessons"> | undefined;
  const structuredLesson = useQuery(
    api.structuredLessons.getById,
    structuredLessonId ? { lessonId: structuredLessonId } : "skip"
  );

  // Get knowledge content with HTML slides for structured lessons
  const knowledgeContentId = structuredLesson?.knowledgeContentId as Id<"knowledgeContent"> | undefined;
  const knowledgeContent = useQuery(
    api.knowledgeBases.getContentById,
    knowledgeContentId ? { contentId: knowledgeContentId } : "skip"
  );

  // Extract HTML slides from knowledge content
  const htmlSlides: HtmlSlide[] | undefined = knowledgeContent?.htmlSlides as HtmlSlide[] | undefined;

  // Determine render mode: use HTML if available, otherwise use image slides
  const useHtmlSlides = htmlSlides && htmlSlides.length > 0;
  const renderMode = useHtmlSlides ? "html" : "image";

  // Debug: Log session and presentation state
  useEffect(() => {
    console.log("[TeachingRoom] ===== PRESENTATION DEBUG =====");
    console.log("[TeachingRoom] Room Name:", roomName);
    console.log("[TeachingRoom] Session loaded:", !!session);

    if (session) {
      console.log("[TeachingRoom] Session ID:", session._id);
      console.log("[TeachingRoom] Session type:", session.type);
      console.log("[TeachingRoom] Session presentationId (top-level):", session.presentationId);
      console.log("[TeachingRoom] Session presentationMode:", JSON.stringify(session.presentationMode, null, 2));
      console.log("[TeachingRoom] Session structuredLessonId:", session.structuredLessonId);
    }

    console.log("[TeachingRoom] Resolved presentationId:", presentationId);
    console.log("[TeachingRoom] Presentation loaded:", !!presentation);
    console.log("[TeachingRoom] HTML Slides available:", htmlSlides?.length ?? 0);
    console.log("[TeachingRoom] Render mode:", renderMode);

    if (presentation) {
      console.log("[TeachingRoom] Presentation ID:", presentation._id);
      console.log("[TeachingRoom] Presentation name:", presentation.name);
      console.log("[TeachingRoom] Presentation status:", presentation.status);
      console.log("[TeachingRoom] Slides count:", presentation.slides?.length);
      console.log("[TeachingRoom] First slide URL:", presentation.slides?.[0]?.url);
    }

    const hasPresentation = presentation?.status === "ready" && (presentation?.slides?.length ?? 0) > 0;
    console.log("[TeachingRoom] hasPresentation (will render slides):", hasPresentation);
    console.log("[TeachingRoom] ===== END DEBUG =====");
  }, [session, presentationId, presentation, roomName, htmlSlides, renderMode]);

  // Convex mutations for session presentation mode
  const startPresentationMode = useMutation(api.sessions.startPresentationMode);
  const updateSlideIndex = useMutation(api.sessions.updateSlideIndex);
  const endPresentationMode = useMutation(api.sessions.endPresentationMode);

  const { videoTrack: avatarTrack, agent } = useVoiceAssistant();

  // Get local camera track
  const localTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });
  const localVideoTrack = localTracks.find(
    (track) => track.participant.identity === localParticipant.identity
  );

  // Publish data channel message to avatar
  const publishDataMessage = useCallback(async (message: DataChannelMessage) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      await localParticipant.publishData(data, { reliable: true });
    } catch (error) {
      console.error("Failed to publish data message:", error);
    }
  }, [localParticipant]);

  // Handle screenshot capture from SlideViewer (for avatar vision)
  const handleSlideScreenshot = useCallback(async (imageBase64: string, slideIndex: number) => {
    if (!useHtmlSlides) return;
    const slideType = htmlSlides?.[slideIndex]?.type;
    console.log(`[TeachingRoom] Captured screenshot for slide ${slideIndex} (${slideType}), size: ${imageBase64.length} chars`);
    await publishDataMessage({
      type: "slide_screenshot",
      imageBase64,
      slideIndex,
      slideType,
      timestamp: Date.now(),
    });
  }, [useHtmlSlides, htmlSlides, publishDataMessage]);

  // Notify avatar when slide changes
  const notifySlideChange = useCallback(async (newIndex: number) => {
    if (!presentation || lastPublishedSlideRef.current === newIndex) return;

    lastPublishedSlideRef.current = newIndex;

    await publishDataMessage({
      type: "slide_changed",
      slideIndex: newIndex,
      totalSlides: presentation.totalSlides,
    });

    // Also update Convex
    if (session?._id) {
      try {
        await updateSlideIndex({
          sessionId: session._id,
          slideIndex: newIndex,
          triggeredBy: "student",
        });
      } catch (error) {
        console.error("Failed to update slide index in Convex:", error);
      }
    }
  }, [presentation, publishDataMessage, session?._id, updateSlideIndex]);

  // Handle slide index change from UI
  const handleSlideIndexChange = useCallback((newIndex: number) => {
    setCurrentSlideIndex(newIndex);
    notifySlideChange(newIndex);
  }, [notifySlideChange]);

  // Send presentation ready notification when presentation loads
  const sendPresentationReady = useCallback(async () => {
    if (!presentation || !presentationId) return;

    await publishDataMessage({
      type: "presentation_ready",
      presentationId: presentationId as string,
      totalSlides: presentation.totalSlides,
      slideContent: (presentation.slideContent || []).map((slide) => ({
        index: slide.index,
        title: slide.title,
        bodyText: slide.bodyText,
        speakerNotes: slide.speakerNotes,
      })),
    });
  }, [presentation, presentationId, publishDataMessage]);

  // Listen for data channel messages from avatar
  useEffect(() => {
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: DataPacket_Kind,
      topic?: string
    ) => {
      try {
        const decoder = new TextDecoder();
        const message: DataChannelMessage = JSON.parse(decoder.decode(payload));

        console.log("Received data channel message:", message);

        if (message.type === "slide_command") {
          const totalSlides = presentation?.totalSlides || 1;
          let newIndex = currentSlideIndex;

          switch (message.action) {
            case "next":
              newIndex = Math.min(currentSlideIndex + 1, totalSlides - 1);
              break;
            case "prev":
              newIndex = Math.max(currentSlideIndex - 1, 0);
              break;
            case "goto":
              if (message.slideIndex !== undefined) {
                newIndex = Math.max(0, Math.min(message.slideIndex, totalSlides - 1));
              }
              break;
          }

          if (newIndex !== currentSlideIndex) {
            setCurrentSlideIndex(newIndex);
            lastPublishedSlideRef.current = newIndex; // Don't echo back to avatar
          }
        }

        if (message.type === "start_presentation") {
          setPresentationModeActive(true);
          setSlideControlledBy("shared");
        }

        if (message.type === "end_presentation") {
          setPresentationModeActive(false);
        }

        // Handle avatar-initiated presentation loading
        if (message.type === "load_presentation") {
          const requestedPresentationId = message.presentationId;
          console.log("[TeachingRoom] Avatar requested presentation:", requestedPresentationId);

          if (requestedPresentationId && session?._id) {
            // Start presentation mode with the requested presentation
            startPresentationMode({
              sessionId: session._id,
              presentationId: requestedPresentationId as Id<"presentations">,
              controlledBy: "shared",
            }).then(() => {
              console.log("[TeachingRoom] Presentation mode started for:", requestedPresentationId);
              setPresentationModeActive(true);
              setCurrentSlideIndex(0);
              lastPublishedSlideRef.current = -1; // Reset to allow publishing
            }).catch((error) => {
              console.error("[TeachingRoom] Failed to start presentation mode:", error);
            });
          }
        }
      } catch (error) {
        console.error("Error parsing data channel message:", error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, currentSlideIndex, presentation?.totalSlides, session?._id, startPresentationMode]);

  // Sync presentation mode state from session
  useEffect(() => {
    if (session?.presentationMode) {
      setPresentationModeActive(session.presentationMode.active || false);
      if (session.presentationMode.controlledBy) {
        setSlideControlledBy(session.presentationMode.controlledBy);
      }
      // Sync slide index from session if different
      if (session.presentationMode.currentSlideIndex !== undefined &&
          session.presentationMode.currentSlideIndex !== currentSlideIndex) {
        setCurrentSlideIndex(session.presentationMode.currentSlideIndex);
      }
    }
  }, [session?.presentationMode]);

  // Send presentation ready when presentation is loaded (or when a NEW presentation is loaded)
  useEffect(() => {
    if (presentation?.status === "ready" && room.state === "connected") {
      sendPresentationReady();
    }
  }, [presentationId, presentation?.status, room.state, sendPresentationReady]);

  // Track if slides context was sent to avoid duplicates
  const slidesContextSentRef = useRef(false);

  // Send HTML slides context to avatar for teaching
  const sendSlidesContext = useCallback(async () => {
    if (!htmlSlides || htmlSlides.length === 0) return;
    if (slidesContextSentRef.current) return;

    console.log(`[TeachingRoom] Sending slides context to avatar: ${htmlSlides.length} slides`);

    await publishDataMessage({
      type: "slides_context",
      totalSlides: htmlSlides.length,
      currentIndex: currentSlideIndex,
      slides: htmlSlides.map((slide) => ({
        index: slide.index,
        type: slide.type,
        title: slide.title,
        teachingPrompt: slide.teachingPrompt,
        speakerNotes: slide.speakerNotes,
      })),
    });

    slidesContextSentRef.current = true;
  }, [htmlSlides, currentSlideIndex, publishDataMessage]);

  // Send HTML slides context when loaded and room is connected
  useEffect(() => {
    if (useHtmlSlides && room.state === "connected" && !slidesContextSentRef.current) {
      // Small delay to ensure agent is ready
      const timer = setTimeout(() => {
        sendSlidesContext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [useHtmlSlides, room.state, sendSlidesContext]);

  // Reset slides context sent flag when slides change
  useEffect(() => {
    slidesContextSentRef.current = false;
  }, [knowledgeContentId]);

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

  const endLesson = useCallback(async () => {
    setIsEnding(true);
    try {
      // Stop screen share if active
      if (videoTrackRef.current) {
        await localParticipant.unpublishTrack(videoTrackRef.current);
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
      }
      await room.disconnect();
      onEnd?.();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error ending lesson:", error);
      router.push("/dashboard");
    }
  }, [room, onEnd, router, localParticipant]);

  // Publish slide as video track when slide changes
  const publishSlideAsVideo = useCallback(async (slideUrl: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load and draw the slide image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Create video track from canvas
      try {
        const stream = canvas.captureStream(1); // 1 FPS is enough for slides
        const videoTrack = stream.getVideoTracks()[0];

        if (videoTrack) {
          // Unpublish existing track if any
          if (videoTrackRef.current) {
            await localParticipant.unpublishTrack(videoTrackRef.current);
            videoTrackRef.current.stop();
          }

          const localTrack = new LocalVideoTrack(videoTrack, undefined, false);
          await localParticipant.publishTrack(localTrack, {
            source: Track.Source.ScreenShare,
            name: "presentation",
          });
          videoTrackRef.current = localTrack;
        }
      } catch (error) {
        console.error("Failed to publish slide as video:", error);
      }
    };
    img.src = slideUrl;
  }, [localParticipant]);

  // Publish slide as screen share when it changes
  // Add 2-second delay on first load to allow room to fully connect
  useEffect(() => {
    if (presentation?.status === "ready" && presentation.slides[currentSlideIndex]?.url) {
      if (!screenShareStartedRef.current) {
        // First time - wait 2 seconds before starting screen share
        console.log("[TeachingRoom] Waiting 2 seconds before starting screen share...");
        const timer = setTimeout(() => {
          console.log("[TeachingRoom] Starting screen share now");
          publishSlideAsVideo(presentation.slides[currentSlideIndex].url);
          screenShareStartedRef.current = true;
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        // Subsequent navigations - publish immediately
        publishSlideAsVideo(presentation.slides[currentSlideIndex].url);
      }
    }
  }, [presentation, currentSlideIndex, publishSlideAsVideo]);

  useEffect(() => {
    const handleDisconnect = () => {
      console.log("Disconnected from room");
    };

    room.on(RoomEvent.Disconnected, handleDisconnect);

    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
    };
  }, [room]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript.length]);

  const handleUploadComplete = async (newPresentationId: string) => {
    setShowUploadDialog(false);
    setCurrentSlideIndex(0);

    // Link the presentation to the session via presentation mode
    if (session?._id) {
      try {
        await startPresentationMode({
          sessionId: session._id,
          presentationId: newPresentationId as Id<"presentations">,
          controlledBy: "shared",
        });
        setPresentationModeActive(true);
        setSlideControlledBy("shared");
        logger.info(`Linked presentation ${newPresentationId} to session ${session._id}`);
      } catch (error) {
        console.error("Failed to link presentation to session:", error);
      }
    }
  };

  // Simple logger for client-side
  const logger = {
    info: (msg: string) => console.log(`[TeachingRoom] ${msg}`),
  };

  const hasImagePresentation = presentation?.status === "ready" && presentation.slides.length > 0;
  const hasHtmlSlides = useHtmlSlides;
  const hasPresentation = hasHtmlSlides || hasImagePresentation;

  return (
    <div className="h-full flex bg-background">
      {/* Hidden canvas for screen share */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Presentation/Slide area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
          {hasPresentation ? (
            <SlideViewer
              slides={hasImagePresentation ? presentation.slides.map(s => ({
                ...s,
                url: s.url ?? undefined,
              })) : []}
              currentIndex={currentSlideIndex}
              onIndexChange={handleSlideIndexChange}
              slideContent={presentation?.slideContent}
              showSpeakerNotes={showSpeakerNotes}
              // HTML slides mode
              htmlSlides={htmlSlides}
              renderMode={renderMode}
              onSlideScreenshot={handleSlideScreenshot}
            />
          ) : (
            <div className="w-full max-w-4xl aspect-video bg-card rounded-xl overflow-hidden relative shadow-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <div className="text-center p-8">
                <Presentation className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Presentation Loaded</h3>
                <p className="text-muted-foreground mb-4">
                  Upload a PDF or presentation to start teaching
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="border-t bg-card p-4">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            {/* Presentation mode indicator */}
            {hasPresentation && (
              <div className="flex items-center justify-center gap-3">
                <Badge variant={presentationModeActive ? "default" : "secondary"} className="gap-1.5">
                  <Presentation className="w-3.5 h-3.5" />
                  {presentationModeActive ? "Presentation Active" : "Presentation Loaded"}
                </Badge>
                {presentationModeActive && (
                  <Badge variant="outline" className="gap-1.5">
                    {slideControlledBy === "avatar" && <Bot className="w-3.5 h-3.5" />}
                    {slideControlledBy === "student" && <User className="w-3.5 h-3.5" />}
                    {slideControlledBy === "shared" && <Users className="w-3.5 h-3.5" />}
                    {slideControlledBy === "avatar" ? "Avatar Control" :
                     slideControlledBy === "student" ? "Your Control" : "Shared Control"}
                  </Badge>
                )}
                {presentation?.slideContent && presentation.slideContent.length > 0 && (
                  <Button
                    variant={showSpeakerNotes ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                    className="text-xs"
                  >
                    {showSpeakerNotes ? "Hide Notes" : "Show Notes"}
                  </Button>
                )}
              </div>
            )}

            {/* Main controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>

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
                variant="secondary"
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="w-6 h-6" />
              </Button>

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
                variant={showTranscript ? "default" : "secondary"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                <MessageSquare className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Avatar video + Transcript */}
      <div className="w-80 border-l bg-card flex flex-col">
        {/* Avatar video tile */}
        <div className="p-4 border-b">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
            {avatarTrack ? (
              <VideoTrack
                trackRef={avatarTrack}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <span className="text-xl font-bold text-primary">L</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {agent ? "Loading video..." : "Waiting for Ludwig..."}
                  </p>
                </div>
              </div>
            )}

            {/* Connection status overlay */}
            {room.state !== "connected" && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}

            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs">
              {room.state === "connected" ? "Ludwig" : "Connecting..."}
            </div>
          </div>
        </div>

        {/* Local user video tile */}
        <div className="p-4 border-b">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
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
            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs">
              You
            </div>
          </div>
        </div>

        {/* Transcript section */}
        {showTranscript && (
          <>
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Transcript</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setShowTranscript(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {transcript.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Conversation will appear here</p>
                </div>
              ) : (
                transcript.map((entry: TranscriptEntry, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg ${
                      entry.role === "avatar"
                        ? "bg-primary/10 ml-2"
                        : "bg-muted mr-2"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">
                        {entry.role === "avatar" ? "Ludwig" : "You"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs">{entry.content}</p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </>
        )}

        {/* When transcript is hidden, show expand button */}
        {!showTranscript && (
          <div className="flex-1 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(true)}
              className="text-muted-foreground"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Show Transcript
            </Button>
          </div>
        )}
      </div>

      {/* Upload dialog */}
      {showUploadDialog && (
        <DocumentUpload
          sessionId={sessionId}
          onComplete={handleUploadComplete}
          onClose={() => setShowUploadDialog(false)}
        />
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
