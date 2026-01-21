"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  useVoiceAssistant,
  useRemoteParticipants,
  VideoTrack,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent, DataPacket_Kind } from "livekit-client";
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
  MonitorUp,
  MonitorOff,
  Clock,
  Bug,
  Gamepad2,
  BookOpen,
  Check,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SlideViewer, HtmlSlide } from "./slide-viewer";
import { DocumentUpload } from "./document-upload";
import { GameViewer } from "@/components/games/game-viewer";
import { WordGame, getTotalItems } from "@/types/word-games";
import { cn } from "@/lib/utils";

interface TeachingRoomProps {
  sessionId: string;
  roomName: string;
  participantName: string;
  avatar?: any; // Full avatar object with personality, identity, etc.
  onSessionEnd?: () => void;
  isGuest?: boolean; // For open access lessons without authentication
}

let audioContextWarmed = false;
function warmAudioContext(): void {
  if (audioContextWarmed) return;
  audioContextWarmed = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      console.log("[TeachingRoom] Audio context warmed up");
    }
  } catch (e) {
    console.warn("[TeachingRoom] Failed to warm audio context:", e);
  }
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
  isGuest = false,
}: TeachingRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const tokenFetchedRef = useRef(false);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Use ref to capture avatar value and prevent re-fetches
  const avatarRef = useRef(avatar);
  if (avatar) {
    avatarRef.current = avatar;
  }

  // Debug: Log avatar when component mounts
  console.log("[TeachingRoom] Avatar prop received:", {
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
    // Use sessionStorage to handle React StrictMode double-mount
    // This prevents duplicate token fetches which cause double agent dispatches
    const tokenCacheKey = `livekit_token_${roomName}_${sessionId}`;
    const cachedToken = sessionStorage.getItem(tokenCacheKey);

    // If we already have a token for this session, use it
    if (cachedToken && !token) {
      console.log("[TeachingRoom] Using cached token for session");
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
      console.log("[TeachingRoom] Fetching token with avatar:", {
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
            avatar: avatarRef.current, // Use ref for stable value
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
        console.log(`[TeachingRoom] Connection ready in ${(performance.now() - startTime).toFixed(0)}ms`);
      } catch (err) {
        console.error("Token fetch error:", err);
        setError("Failed to connect to teaching room");
      } finally {
        setIsConnecting(false);
      }
    }

    fetchToken();

    // NO cleanup - don't reset ref to avoid StrictMode double-fetch issues
  }, [roomName, participantName, sessionId, token]); // Added token to deps for cache check

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-sls-cream">
        <Card className="p-6 text-center bg-white border-sls-beige">
          <p className="text-sls-orange mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-sls-teal hover:bg-sls-teal/90 text-white"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (isConnecting || !token) {
    return (
      <div className="flex items-center justify-center h-full bg-sls-cream">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-sls-teal" />
          <p className="text-sls-olive">Connecting...</p>
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
        participantName={participantName}
        onEnd={onSessionEnd}
        avatarName={avatarRef.current?.name || "Teacher"}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// Types for data channel messages
interface SlideCommand {
  type: "slide_command";
  action?: "next" | "prev" | "goto";  // Frontend format
  command?: "next" | "prev" | "goto"; // Agent format
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

// Fallback: send slide URL when image capture fails
interface SlideUrlMessage {
  type: "slide_url";
  url: string;
  slideIndex: number;
  timestamp: number;
}

// Game-related data channel messages
interface GameLoadedMessage {
  type: "game_loaded";
  gameId: string;
  gameType: string;
  title: string;
  totalItems: number;
}

interface GameStateMessage {
  type: "game_state";
  gameId: string;
  currentItemIndex: number;
  totalItems: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

interface GameScreenshotMessage {
  type: "game_screenshot";
  imageBase64: string;
  itemIndex: number;
  timestamp: number;
}

interface GameCompleteMessage {
  type: "game_complete";
  gameId: string;
  stars: number;
  scorePercent: number;
  totalCorrect: number;
  totalItems: number;
}

interface ItemCheckedMessage {
  type: "item_checked";
  gameId: string;
  itemIndex: number;
  totalItems: number;
  isCorrect: boolean;
  attempts: number;
  hintsUsed: number;
  correctSoFar: number;
  incorrectSoFar: number;
  correctAnswer: string;
}

interface GameCommandMessage {
  type: "game_command";
  command: "next" | "prev" | "goto" | "hint";
  itemIndex?: number;
}

interface LoadGameCommand {
  type: "load_game";
  gameId: string;
  title: string;
  gameType: string;
  instructions: string;
  level: string;
  category: string;
  // Full game data for multi-participant sync (optional for backward compat)
  gameData?: WordGame;
}

// Agent-initiated slide loading command
interface LoadSlidesCommand {
  type: "load_slides";
  contentId: string;
  title: string;
  slides: HtmlSlide[];
  slideCount: number;
}

type DataChannelMessage = SlideCommand | PresentationCommand | LoadPresentationCommand | SlideChangedNotification | PresentationReadyNotification | SlideScreenshotMessage | SlidesContextMessage | SlideUrlMessage | GameLoadedMessage | GameStateMessage | GameScreenshotMessage | GameCompleteMessage | ItemCheckedMessage | GameCommandMessage | LoadGameCommand | LoadSlidesCommand;

function RoomContent({
  sessionId,
  roomName,
  participantName,
  onEnd,
  avatarName,
}: {
  sessionId: string;
  roomName: string;
  participantName: string;
  onEnd?: () => void;
  avatarName: string;
}) {
  const router = useRouter();
  const room = useRoomContext();
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [presentationModeActive, setPresentationModeActive] = useState(false);
  const [slideControlledBy, setSlideControlledBy] = useState<"avatar" | "student" | "shared">("shared");
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  // Game mode state
  const [activeGame, setActiveGame] = useState<WordGame | null>(null);
  const [currentGameItemIndex, setCurrentGameItemIndex] = useState(0);
  const [gameModeActive, setGameModeActive] = useState(false);
  const [gameResults, setGameResults] = useState<{
    correctAnswers: number;
    incorrectAnswers: number;
  }>({ correctAnswers: 0, incorrectAnswers: 0 });

  // Dynamically loaded slides from agent (via load_slides command)
  const [dynamicSlides, setDynamicSlides] = useState<{
    slides: HtmlSlide[];
    title: string;
    contentId: string;
  } | null>(null);

  // Session timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Materials panel state (replaced debug panel)
  const [showMaterialsPanel, setShowMaterialsPanel] = useState(false);
  const [agentCommands, setAgentCommands] = useState<Array<{type: string; time: string; data: string}>>([]);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const lastPublishedSlideRef = useRef<number>(-1);
  const screenShareStartedRef = useRef(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const latestSlideImageRef = useRef<string | null>(null);
  const lastPublishedGameItemRef = useRef<number>(-1);
  const slidesContextSentRef = useRef(false);
  // Track when local slide changes happen to avoid race conditions with session sync
  const localSlideChangeTimestampRef = useRef<number>(0);

  const session = useQuery(api.sessions.getSessionByRoom, { roomName });
  const transcript = session?.transcript || [];

  // Get presentation from session's presentationMode or legacy presentationId
  const presentationId = (session?.presentationMode?.presentationId || session?.presentationId) as Id<"presentations"> | undefined;

  const presentation = useQuery(
    api.presentations.getPresentationWithContent,
    presentationId ? { presentationId } : "skip"
  );

  // Get structured lesson to access knowledgeContentId and wordGameId
  // Use getForSession which validates session ownership (no auth/ownership requirement)
  const structuredLessonId = session?.structuredLessonId as Id<"structuredLessons"> | undefined;
  const sessionIdForLesson = session?._id;
  const structuredLesson = useQuery(
    api.structuredLessons.getForSession,
    structuredLessonId && sessionIdForLesson
      ? { lessonId: structuredLessonId, sessionId: sessionIdForLesson }
      : "skip"
  );

  // Get knowledge content with HTML slides for structured lessons
  const knowledgeContentId = structuredLesson?.knowledgeContentId as Id<"knowledgeContent"> | undefined;
  const knowledgeContent = useQuery(
    api.knowledgeBases.getContentById,
    knowledgeContentId ? { contentId: knowledgeContentId } : "skip"
  );

  // Word game is included in getForSession response (legacy single game)
  const linkedGame = structuredLesson?.wordGame;

  // Get all games linked to this session (via gameLessonLinks)
  const availableGames = useQuery(
    api.wordGames.getGamesForSession,
    session?._id ? { sessionId: session._id } : "skip"
  );

  // Get all content linked to this session (via contentLessonLinks)
  const availableContent = useQuery(
    api.knowledgeBases.getContentForSession,
    session?._id ? { sessionId: session._id } : "skip"
  );

  // Extract HTML slides - prioritize dynamically loaded slides from agent
  const knowledgeContentSlides: HtmlSlide[] | undefined = knowledgeContent?.htmlSlides as HtmlSlide[] | undefined;
  const htmlSlides: HtmlSlide[] | undefined = dynamicSlides?.slides || knowledgeContentSlides;

  // Determine render mode: use HTML if available, otherwise use image slides
  const useHtmlSlides = htmlSlides && htmlSlides.length > 0;
  const renderMode = useHtmlSlides ? "html" : "image";
  const currentSlidesSource = dynamicSlides ? "agent" : "lesson";

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
    console.log("[TeachingRoom] Linked game:", linkedGame?._id, linkedGame?.title);
    console.log("[TeachingRoom] ===== END DEBUG =====");
  }, [session, presentationId, presentation, roomName, htmlSlides, renderMode, linkedGame]);

  // Ref to track if game was activated (will be used later after notifyGameLoaded is defined)
  const gameActivatedRef = useRef(false);

  // Convex mutations for session presentation mode
  const startPresentationMode = useMutation(api.sessions.startPresentationMode);
  const updateSlideIndex = useMutation(api.sessions.updateSlideIndex);
  const endPresentationMode = useMutation(api.sessions.endPresentationMode);
  const endSessionByRoom = useMutation(api.sessions.endSessionByRoom);

  const { videoTrack: voiceAssistantTrack, agent } = useVoiceAssistant();

  // Get all video tracks to find the Beyond Presence avatar
  const allVideoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });

  // Find the Beyond Presence avatar track by looking for participants with "bey" or "avatar" in identity
  const beyAvatarTrack = allVideoTracks.find((trackRef) => {
    const identity = trackRef.participant.identity.toLowerCase();
    // Beyond Presence avatar participant typically has "bey" in the identity
    // Skip our own tracks and screen shares
    if (trackRef.participant.identity === localParticipant.identity) return false;
    if (trackRef.source === Track.Source.ScreenShare) return false;
    return identity.includes("bey") || identity.includes("avatar");
  });

  // Use Beyond Presence track if found, otherwise fall back to voice assistant track
  const avatarTrack = beyAvatarTrack || voiceAssistantTrack;

  // Get local camera track
  const localTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });
  const localVideoTrack = localTracks.find(
    (track) => track.participant.identity === localParticipant.identity
  );

  // Simplified: 2 participants only (1 student + 1 avatar)
  // Multi-participant classroom mode removed for simplicity
  const remoteParticipants = useRemoteParticipants();

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

  // Capture and send image slide screenshot (for non-HTML presentations)
  const captureImageSlide = useCallback(async (slideIndex: number) => {
    const slide = presentation?.slides?.[slideIndex];
    const slideUrl = slide?.url;

    console.log(`[TeachingRoom] captureImageSlide called:`, {
      slideIndex,
      hasSlide: !!slide,
      slideUrl: slideUrl || 'undefined',
      totalSlides: presentation?.slides?.length || 0,
    });

    if (!slideUrl) {
      console.log(`[TeachingRoom] No slide URL for index ${slideIndex}, skipping capture`);
      return;
    }

    console.log(`[TeachingRoom] Capturing image slide ${slideIndex}: ${slideUrl}`);

    try {
      console.log(`[TeachingRoom] Slide URL type: ${typeof slideUrl}, length: ${slideUrl?.length}`);
      console.log(`[TeachingRoom] Full URL: ${slideUrl}`);

      // Check if URL looks valid
      if (!slideUrl.startsWith('http') && !slideUrl.startsWith('blob:')) {
        console.error(`[TeachingRoom] Invalid slide URL format: ${slideUrl.substring(0, 100)}`);
        return;
      }

      // Method 1: Try using Image directly (works for same-origin images)
      const img = new Image();

      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log(`[TeachingRoom] Image loaded: ${img.width}x${img.height}`);
          resolve();
        };
        img.onerror = (e) => {
          console.error(`[TeachingRoom] Image load error for URL: ${slideUrl}`);
          console.error(`[TeachingRoom] Error event:`, e);
          reject(new Error("Failed to load slide image"));
        };
      });

      // Don't set crossOrigin - it can cause issues with some servers
      img.src = slideUrl;
      await loadPromise;

      // Create canvas and draw image
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 960; // Standard width for vision
      const scale = Math.min(1, MAX_WIDTH / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to base64 JPEG
      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      const imageBase64 = base64.replace(/^data:image\/jpeg;base64,/, "");

      console.log(`[TeachingRoom] Image slide captured, size: ${imageBase64.length} chars`);

      // Store and send
      latestSlideImageRef.current = imageBase64;
      await publishDataMessage({
        type: "slide_screenshot",
        imageBase64,
        slideIndex,
        slideType: "image",
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("[TeachingRoom] Failed to capture image slide:", error);

      // Fallback: Just send the URL for the agent to fetch directly
      console.log("[TeachingRoom] Sending slide URL as fallback");
      await publishDataMessage({
        type: "slide_url",
        url: slideUrl,
        slideIndex,
        timestamp: Date.now(),
      });
    }
  }, [presentation?.slides, publishDataMessage]);

  // Handle screenshot capture from SlideViewer (for HTML slides / avatar vision)
  const handleSlideScreenshot = useCallback(async (imageBase64: string, slideIndex: number) => {
    if (!useHtmlSlides) {
      // For image slides, use captureImageSlide instead
      return;
    }
    const slideType = htmlSlides?.[slideIndex]?.type;
    console.log(`[TeachingRoom] Captured HTML screenshot for slide ${slideIndex} (${slideType}), size: ${imageBase64.length} chars`);

    // Store latest image
    latestSlideImageRef.current = imageBase64;

    // Send to avatar for vision
    await publishDataMessage({
      type: "slide_screenshot",
      imageBase64,
      slideIndex,
      slideType,
      timestamp: Date.now(),
    });
  }, [useHtmlSlides, htmlSlides, publishDataMessage]);

  // ============================================
  // GAME MODE HANDLERS
  // ============================================

  // Handle game screenshot capture for avatar vision
  const handleGameScreenshot = useCallback(async (imageBase64: string, itemIndex: number) => {
    if (!activeGame) return;

    console.log(`[TeachingRoom] Captured game screenshot for item ${itemIndex}, size: ${imageBase64.length} chars`);

    await publishDataMessage({
      type: "game_screenshot",
      imageBase64,
      itemIndex,
      timestamp: Date.now(),
    });
  }, [activeGame, publishDataMessage]);

  // Handle game item index change
  const handleGameIndexChange = useCallback(async (newIndex: number) => {
    setCurrentGameItemIndex(newIndex);

    if (!activeGame || lastPublishedGameItemRef.current === newIndex) return;

    lastPublishedGameItemRef.current = newIndex;
    const totalItems = getTotalItems(activeGame.config);

    await publishDataMessage({
      type: "game_state",
      gameId: activeGame._id,
      currentItemIndex: newIndex,
      totalItems,
      correctAnswers: gameResults.correctAnswers,
      incorrectAnswers: gameResults.incorrectAnswers,
    });
  }, [activeGame, gameResults, publishDataMessage]);

  // Handle game item completion
  const handleGameItemComplete = useCallback(async (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
    itemIndex: number;
    correctAnswer: string;
  }) => {
    if (!activeGame) return;

    const newCorrect = gameResults.correctAnswers + (result.isCorrect ? 1 : 0);
    const newIncorrect = gameResults.incorrectAnswers + (result.isCorrect ? 0 : 1);

    // Update results
    setGameResults({
      correctAnswers: newCorrect,
      incorrectAnswers: newIncorrect,
    });

    const totalItems = getTotalItems(activeGame.config);

    // Send item_checked event with details about this specific answer
    // Includes the correct answer so avatar doesn't need to rely on vision
    await publishDataMessage({
      type: "item_checked",
      gameId: activeGame._id,
      itemIndex: result.itemIndex,
      totalItems,
      isCorrect: result.isCorrect,
      attempts: result.attempts,
      hintsUsed: result.hintsUsed,
      correctSoFar: newCorrect,
      incorrectSoFar: newIncorrect,
      correctAnswer: result.correctAnswer,
    } as ItemCheckedMessage);

    // Also send game_state for backwards compatibility
    await publishDataMessage({
      type: "game_state",
      gameId: activeGame._id,
      currentItemIndex: result.itemIndex,
      totalItems,
      correctAnswers: newCorrect,
      incorrectAnswers: newIncorrect,
    });
  }, [activeGame, gameResults, publishDataMessage]);

  // Handle game completion
  const handleGameComplete = useCallback(async (finalScore: {
    stars: number;
    scorePercent: number;
    totalCorrect: number;
    totalItems: number;
  }) => {
    if (!activeGame) return;

    console.log(`[TeachingRoom] Game complete:`, finalScore);

    await publishDataMessage({
      type: "game_complete",
      gameId: activeGame._id,
      ...finalScore,
    });

    // Reset game mode after completion (with delay for celebration)
    setTimeout(() => {
      setGameModeActive(false);
      setActiveGame(null);
      setCurrentGameItemIndex(0);
      setGameResults({ correctAnswers: 0, incorrectAnswers: 0 });
    }, 3000);
  }, [activeGame, publishDataMessage]);

  // Notify avatar when game is loaded
  const notifyGameLoaded = useCallback(async (game: WordGame) => {
    const totalItems = getTotalItems(game.config);

    console.log(`[TeachingRoom] Notifying avatar of game loaded:`, {
      gameId: game._id,
      gameType: game.type,
      title: game.title,
      totalItems,
    });

    await publishDataMessage({
      type: "game_loaded",
      gameId: game._id,
      gameType: game.type,
      title: game.title,
      totalItems,
    });
  }, [publishDataMessage]);

  // Simplified: 2 participants only - broadcast functions removed

  // Manual game trigger for debugging
  const manualLoadGame = useCallback(() => {
    if (!linkedGame) {
      console.log("[DEBUG] No linked game available");
      return;
    }
    console.log("[DEBUG] Manually triggering game load:", linkedGame.title);
    setActiveGame(linkedGame as WordGame);
    setGameModeActive(true);
    setCurrentGameItemIndex(0);
    setGameResults({ correctAnswers: 0, incorrectAnswers: 0 });
    gameActivatedRef.current = true;
    notifyGameLoaded(linkedGame as WordGame);
  }, [linkedGame, notifyGameLoaded]);

  // Session timer - updates every second
  useEffect(() => {
    if (!session?.createdAt) return;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - session.createdAt) / 1000);
      setElapsedSeconds(elapsed);
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session?.createdAt]);

  // Format time as MM:SS or HH:MM:SS for display
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate timer display values
  const timerConfig = session?.timerConfig;
  const targetDurationSeconds = timerConfig?.targetDurationMinutes
    ? timerConfig.targetDurationMinutes * 60
    : null;
  const wrapUpBufferSeconds = timerConfig?.wrapUpBufferMinutes
    ? timerConfig.wrapUpBufferMinutes * 60
    : null;
  const remainingSeconds = targetDurationSeconds
    ? Math.max(0, targetDurationSeconds - elapsedSeconds)
    : null;
  const isInWrapUp =
    targetDurationSeconds &&
    wrapUpBufferSeconds &&
    elapsedSeconds >= targetDurationSeconds - wrapUpBufferSeconds;
  const isTimeExpired = remainingSeconds !== null && remainingSeconds <= 0;

  // Auto-activate game mode when linked game is loaded
  useEffect(() => {
    if (linkedGame && !gameActivatedRef.current && room.state === "connected") {
      console.log("[TeachingRoom] Auto-activating game mode for:", linkedGame.title);
      gameActivatedRef.current = true;
      setActiveGame(linkedGame as WordGame);
      setGameModeActive(true);
      setCurrentGameItemIndex(0);
      setGameResults({ correctAnswers: 0, incorrectAnswers: 0 });

      // Notify avatar that game is loaded
      notifyGameLoaded(linkedGame as WordGame);
    }
  }, [linkedGame, room.state, notifyGameLoaded]);

  // Auto-capture image slides when slide index changes
  // NOTE: This only runs for IMAGE presentations, not HTML slides
  useEffect(() => {
    // Skip if using HTML slides - they have their own capture mechanism
    if (useHtmlSlides) {
      return;
    }

    // Skip if no image presentation
    if (!presentation?.slides?.length) {
      return;
    }

    // Skip if room not connected
    if (room.state !== "connected") {
      return;
    }

    // Check if slide has a valid URL before attempting capture
    const slideUrl = presentation.slides[currentSlideIndex]?.url;
    if (!slideUrl) {
      console.log(`[TeachingRoom] Skipping image capture - slide ${currentSlideIndex} has no URL`);
      return;
    }

    // Capture current image slide
    console.log(`[TeachingRoom] Scheduling image capture for slide ${currentSlideIndex}`);
    const timer = setTimeout(() => {
      captureImageSlide(currentSlideIndex);
    }, 500); // Delay to ensure slide is rendered

    return () => clearTimeout(timer);
  }, [currentSlideIndex, useHtmlSlides, presentation?.slides, room.state, captureImageSlide]);

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
    // Mark that we're making a local change to avoid race condition with session sync
    localSlideChangeTimestampRef.current = Date.now();
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

  // Refs to hold current state values for the data handler (avoids stale closures)
  const slideStateRef = useRef({
    currentSlideIndex,
    totalSlides: useHtmlSlides ? (htmlSlides?.length || 1) : (presentation?.totalSlides || 1),
    sessionId: session?._id,
    useHtmlSlides,
  });

  // Keep refs updated with latest values
  useEffect(() => {
    slideStateRef.current = {
      currentSlideIndex,
      totalSlides: useHtmlSlides ? (htmlSlides?.length || 1) : (presentation?.totalSlides || 1),
      sessionId: session?._id,
      useHtmlSlides,
    };
  }, [currentSlideIndex, useHtmlSlides, htmlSlides, presentation?.totalSlides, session?._id]);

  // Listen for data channel messages from avatar (stable listener - only depends on room)
  useEffect(() => {
    const handleDataReceived = (
      payload: Uint8Array,
      _participant?: any,
      _kind?: DataPacket_Kind,
      _topic?: string
    ) => {
      try {
        const decoder = new TextDecoder();
        const message: DataChannelMessage = JSON.parse(decoder.decode(payload));

        console.log("[TeachingRoom] Received data channel message:", message);

        if (message.type === "slide_command") {
          // Support both 'action' (frontend) and 'command' (agent) field names
          const slideAction = message.action || message.command;
          const { currentSlideIndex: curIdx, totalSlides } = slideStateRef.current;
          let newIndex = curIdx;

          switch (slideAction) {
            case "next":
              newIndex = Math.min(curIdx + 1, totalSlides - 1);
              console.log(`[TeachingRoom] Slide command: next (${curIdx} -> ${newIndex})`);
              break;
            case "prev":
              newIndex = Math.max(curIdx - 1, 0);
              console.log(`[TeachingRoom] Slide command: prev (${curIdx} -> ${newIndex})`);
              break;
            case "goto":
              if (message.slideIndex !== undefined) {
                newIndex = Math.max(0, Math.min(message.slideIndex, totalSlides - 1));
                console.log(`[TeachingRoom] Slide command: goto ${message.slideIndex} (-> ${newIndex})`);
              }
              break;
          }

          if (newIndex !== curIdx) {
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

          const { sessionId } = slideStateRef.current;
          if (requestedPresentationId && sessionId) {
            // Start presentation mode with the requested presentation
            startPresentationMode({
              sessionId: sessionId,
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

        // Handle game commands from avatar
        if (message.type === "game_command") {
          const { command, itemIndex } = message;
          console.log("[TeachingRoom] Game command received:", command, itemIndex);

          switch (command) {
            case "next":
              setCurrentGameItemIndex(prev => prev + 1);
              break;
            case "prev":
              setCurrentGameItemIndex(prev => Math.max(0, prev - 1));
              break;
            case "goto":
              if (itemIndex !== undefined) {
                setCurrentGameItemIndex(itemIndex);
              }
              break;
            // hint is handled by the game component itself
          }
        }

        // Handle avatar-initiated game loading or broadcast from other participant
        if (message.type === "load_game") {
          const requestedGameId = message.gameId;
          console.log("[TeachingRoom] Received game load:", requestedGameId, message.title);

          // Log to debug panel
          setAgentCommands(prev => [...prev.slice(-9), {
            type: "load_game",
            time: new Date().toLocaleTimeString(),
            data: `Game: ${message.title || requestedGameId}`,
          }]);

          // Try to get game from: 1) linked game, 2) broadcast gameData
          let gameToActivate: WordGame | null = null;

          if (linkedGame && linkedGame._id === requestedGameId) {
            console.log("[TeachingRoom] Activating linked game:", linkedGame.title);
            gameToActivate = linkedGame as WordGame;
          } else if (message.gameData) {
            // Use game data from broadcast (multi-participant sync)
            console.log("[TeachingRoom] Activating game from broadcast:", message.gameData.title);
            gameToActivate = message.gameData;
          }

          if (gameToActivate) {
            setActiveGame(gameToActivate);
            setGameModeActive(true);
            setCurrentGameItemIndex(0);
            setGameResults({ correctAnswers: 0, incorrectAnswers: 0 });
            gameActivatedRef.current = true;

            // Notify avatar that game is loaded (only if from linkedGame)
            if (linkedGame && linkedGame._id === requestedGameId) {
              notifyGameLoaded(gameToActivate);
            }
          } else {
            console.warn("[TeachingRoom] Game not available and no broadcast data:", requestedGameId);
          }
        }

        // Handle avatar-initiated slide loading
        if (message.type === "load_slides") {
          const { contentId, title, slides, slideCount } = message;
          console.log(`[TeachingRoom] Avatar loaded slides: "${title}" (${slideCount} slides, content: ${contentId})`);

          // Log to debug panel
          setAgentCommands(prev => [...prev.slice(-9), {
            type: "load_slides",
            time: new Date().toLocaleTimeString(),
            data: `Slides: ${title} (${slideCount} slides)`,
          }]);

          // Store the dynamically loaded slides
          setDynamicSlides({
            slides: slides,
            title: title,
            contentId: contentId,
          });

          // Reset to first slide and activate presentation mode
          setCurrentSlideIndex(0);
          lastPublishedSlideRef.current = -1; // Reset to allow publishing context
          setPresentationModeActive(true);
          setSlideControlledBy("shared");

          // Reset the slides context sent flag so we re-send context with new slides
          slidesContextSentRef.current = false;

          console.log(`[TeachingRoom] Dynamic slides loaded and presentation mode activated`);
        }
      } catch (error) {
        console.error("Error parsing data channel message:", error);
      }
    };

    console.log("[TeachingRoom] Registering DataReceived listener");
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      console.log("[TeachingRoom] Unregistering DataReceived listener");
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, startPresentationMode, linkedGame, notifyGameLoaded]);

  // Sync presentation mode state from session
  useEffect(() => {
    if (session?.presentationMode) {
      setPresentationModeActive(session.presentationMode.active || false);
      if (session.presentationMode.controlledBy) {
        setSlideControlledBy(session.presentationMode.controlledBy);
      }
      // Sync slide index from session if different
      // BUT skip if we made a local change recently (avoid race condition)
      const timeSinceLocalChange = Date.now() - localSlideChangeTimestampRef.current;
      const isRecentLocalChange = timeSinceLocalChange < 1000; // 1 second grace period

      if (session.presentationMode.currentSlideIndex !== undefined &&
          session.presentationMode.currentSlideIndex !== currentSlideIndex &&
          !isRecentLocalChange) {
        setCurrentSlideIndex(session.presentationMode.currentSlideIndex);
      }
    }
  }, [session?.presentationMode, currentSlideIndex]);

  // Send presentation ready when presentation is loaded (or when a NEW presentation is loaded)
  useEffect(() => {
    if (presentation?.status === "ready" && room.state === "connected") {
      sendPresentationReady();
    }
  }, [presentationId, presentation?.status, room.state, sendPresentationReady]);

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

  // Reset slides context sent flag when slides change (either from knowledge content or dynamically loaded)
  useEffect(() => {
    slidesContextSentRef.current = false;
  }, [knowledgeContentId, dynamicSlides?.contentId]);

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
      console.log(`[TeachingRoom] ${newState ? "Starting" : "Stopping"} screen share...`);

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

      console.log(`[TeachingRoom] ✅ Screen share ${newState ? "started" : "stopped"}`);
    } catch (error) {
      console.error("[TeachingRoom] Screen share failed:", error);
    }
  }, [localParticipant, isScreenShareEnabled]);

  // Show screen share prompt when slides are ready (Chrome requires user gesture)
  const [showScreenSharePrompt, setShowScreenSharePrompt] = useState(false);
  const [hasShownScreenSharePrompt, setHasShownScreenSharePrompt] = useState(false);

  useEffect(() => {
    const hasSlides = useHtmlSlides || (presentation?.slides?.length ?? 0) > 0;
    const hasGame = gameModeActive && activeGame;
    const hasContent = hasSlides || hasGame;

    // Show prompt once when room is connected and we have content (slides OR game)
    if (
      !hasShownScreenSharePrompt &&
      room.state === "connected" &&
      hasContent &&
      !isScreenShareEnabled
    ) {
      console.log("[TeachingRoom] Showing screen share prompt for", hasGame ? "game" : "slides");
      setShowScreenSharePrompt(true);
      setHasShownScreenSharePrompt(true);
    }
  }, [room.state, hasShownScreenSharePrompt, useHtmlSlides, presentation?.slides?.length, isScreenShareEnabled, gameModeActive, activeGame]);

  // Handle screen share from prompt (user gesture satisfies Chrome requirement)
  const handleStartScreenShare = useCallback(async () => {
    setShowScreenSharePrompt(false);

    try {
      console.log("[TeachingRoom] Starting screen share from user prompt...");
      await localParticipant.setScreenShareEnabled(true, {
        audio: false,
        video: {
          // @ts-ignore - Chrome-specific: restrict to current tab only
          displaySurface: "browser",
        },
        selfBrowserSurface: "include",
        // @ts-ignore - Chrome 109+: prefer/pre-select current tab
        preferCurrentTab: true,
        surfaceSwitching: "exclude",
        systemAudio: "exclude",
      });
      console.log("[TeachingRoom] ✅ Screen share started successfully");
    } catch (error: any) {
      console.error("[TeachingRoom] ❌ Screen share failed:", error?.message || error);
    }
  }, [localParticipant]);

  const dismissScreenSharePrompt = useCallback(() => {
    setShowScreenSharePrompt(false);
  }, []);

  const endLesson = useCallback(async () => {
    setIsEnding(true);
    try {
      console.log("[TeachingRoom] Ending lesson...");

      // Mark session as completed in database BEFORE disconnecting
      // This ensures cleanup even if LiveKit disconnect fails
      try {
        await endSessionByRoom({ roomName, reason: "completed" });
        console.log("[TeachingRoom] Session marked as completed");
      } catch (sessionError) {
        console.warn("[TeachingRoom] Failed to end session in DB (may already be ended):", sessionError);
      }

      // Disable all tracks before disconnecting for clean exit
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

  // Cleanup on unmount - ensures resources are released for faster re-entry
  useEffect(() => {
    return () => {
      console.log("[TeachingRoom] RoomContent unmounting - cleaning up resources");
      // Disable tracks on unmount
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false).catch(() => {});
        localParticipant.setCameraEnabled(false).catch(() => {});
      }
      // Reset all refs for clean re-entry
      lastPublishedSlideRef.current = -1;
      screenShareStartedRef.current = false;
      latestSlideImageRef.current = null;
      lastPublishedGameItemRef.current = -1;
      slidesContextSentRef.current = false;
      gameActivatedRef.current = false;
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
      console.log("[TeachingRoom] Sent cleanup beacon for room:", roomName);
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
    <div className="h-full flex bg-sls-cream">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Content area - Game, Presentation, or Empty state */}
        <div className={cn(
          "flex-1 flex p-4",
          gameModeActive && activeGame
            ? "bg-white"
            : "items-center justify-center bg-gradient-to-br from-sls-cream to-sls-beige/30"
        )}>
          {/* Game Mode - takes priority when active */}
          {gameModeActive && activeGame ? (
            <div ref={slideContainerRef} className="w-full h-full">
              <GameViewer
                game={activeGame}
                currentIndex={currentGameItemIndex}
                onIndexChange={handleGameIndexChange}
                onComplete={handleGameItemComplete}
                onGameComplete={handleGameComplete}
                onScreenshot={handleGameScreenshot}
              />
            </div>
          ) : hasPresentation ? (
            <div ref={slideContainerRef} className="w-full max-w-5xl">
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
            </div>
          ) : (
            <div className="w-full max-w-4xl aspect-video bg-white rounded-xl overflow-hidden relative shadow-lg border-2 border-dashed border-sls-beige flex items-center justify-center">
              <div className="text-center p-8">
                <Presentation className="w-12 h-12 mx-auto mb-3 text-sls-olive/40" />
                <h3 className="text-base font-semibold mb-1.5 text-sls-teal">No Content Loaded</h3>
                <p className="text-sls-olive/70 text-sm mb-4">
                  Upload slides to start teaching
                </p>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-sls-teal hover:bg-sls-teal/90 text-white"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Upload
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Control bar - compact and minimal */}
        <div className="border-t bg-card/80 backdrop-blur-sm py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Left: Status badges and timer */}
            <div className="flex items-center gap-2">
              {/* Session Timer */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono",
                  isTimeExpired
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : isInWrapUp
                      ? "bg-amber-100 text-amber-700 border border-amber-200 animate-pulse"
                      : "bg-sls-cream/70 text-sls-olive border border-sls-beige"
                )}
                title={
                  targetDurationSeconds
                    ? `Target: ${timerConfig?.targetDurationMinutes} min`
                    : "Session duration"
                }
              >
                <Clock className="w-3.5 h-3.5" />
                {targetDurationSeconds ? (
                  // Show remaining time if there's a target duration
                  <span>
                    {isTimeExpired ? "Time's up" : formatTime(remainingSeconds!)}
                  </span>
                ) : (
                  // Show elapsed time if no target duration
                  <span>{formatTime(elapsedSeconds)}</span>
                )}
              </div>

              {hasPresentation && presentationModeActive && (
                <Badge variant="outline" className="gap-1 text-xs bg-sls-cream/50 border-sls-beige text-sls-olive">
                  {slideControlledBy === "avatar" && <Bot className="w-3 h-3" />}
                  {slideControlledBy === "student" && <User className="w-3 h-3" />}
                  {slideControlledBy === "shared" && <Users className="w-3 h-3" />}
                  {slideControlledBy === "shared" ? "Shared" : slideControlledBy === "avatar" ? "Avatar" : "You"}
                </Badge>
              )}
              {gameModeActive && (
                <Badge className="gap-1 text-xs bg-sls-chartreuse text-white border-0">
                  Game Active
                </Badge>
              )}
            </div>

            {/* Center: Main controls */}
            <div className="flex items-center gap-3">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                className={`rounded-full w-12 h-12 ${!isMuted ? 'bg-sls-cream hover:bg-sls-beige border-sls-beige text-sls-teal' : 'bg-sls-orange hover:bg-sls-orange/90 border-0'}`}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                variant={isCameraOff ? "destructive" : "outline"}
                size="icon"
                className={`rounded-full w-12 h-12 ${!isCameraOff ? 'bg-sls-cream hover:bg-sls-beige border-sls-beige text-sls-teal' : 'bg-sls-orange hover:bg-sls-orange/90 border-0'}`}
                onClick={toggleCamera}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>

              <Button
                variant={isScreenShareEnabled ? "default" : "outline"}
                size="icon"
                className={`rounded-full w-12 h-12 ${isScreenShareEnabled ? 'bg-sls-teal hover:bg-sls-teal/90 text-white border-0' : 'bg-sls-cream hover:bg-sls-beige border-sls-beige text-sls-teal'}`}
                onClick={toggleScreenShare}
                title={isScreenShareEnabled ? "Stop sharing" : "Share tab"}
              >
                {isScreenShareEnabled ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 bg-sls-cream hover:bg-sls-beige border-sls-beige text-sls-teal"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="w-5 h-5" />
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-12 h-12 bg-sls-orange hover:bg-sls-orange/90 border-0"
                onClick={endLesson}
                disabled={isEnding}
              >
                {isEnding ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
              </Button>
            </div>

            {/* Right: Optional actions */}
            <div className="flex items-center gap-2">
              {presentation?.slideContent && presentation.slideContent.length > 0 && (
                <Button
                  variant={showSpeakerNotes ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                  className={`text-xs h-8 ${showSpeakerNotes ? 'bg-sls-teal text-white' : 'text-sls-olive hover:bg-sls-beige/50'}`}
                >
                  Notes
                </Button>
              )}
              <Button
                variant={showTranscript ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className={`text-xs h-8 gap-1 ${showTranscript ? 'bg-sls-teal text-white' : 'text-sls-olive hover:bg-sls-beige/50'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </Button>
              {/* Materials button */}
              <Button
                variant={showMaterialsPanel ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowMaterialsPanel(!showMaterialsPanel)}
                className={`text-xs h-8 gap-1 ${showMaterialsPanel ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-100'}`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Materials
              </Button>
            </div>
          </div>
        </div>

        {/* Materials Panel */}
        {showMaterialsPanel && (
          <div className="absolute bottom-20 right-4 w-80 bg-white rounded-lg shadow-xl border p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Available Materials
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMaterialsPanel(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Slides/Content Section - show all linked content */}
              {((availableContent && availableContent.length > 0) || knowledgeContent) && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-medium">
                    Slides & Content ({availableContent?.length || (knowledgeContent ? 1 : 0)})
                  </div>
                  <div className="space-y-2">
                    {/* Show linked content items from contentLessonLinks */}
                    {availableContent && availableContent.map((content) => (
                      <button
                        key={content._id}
                        onClick={() => {
                          // Load this content's slides
                          const slides = content.htmlSlides as HtmlSlide[];
                          if (slides && slides.length > 0) {
                            setDynamicSlides({
                              slides,
                              title: content.title,
                              contentId: content._id,
                            });
                            // Simplified: 2 participants only - no broadcast needed
                          }
                          setPresentationModeActive(true);
                          setCurrentSlideIndex(0);
                          setGameModeActive(false);
                          setShowMaterialsPanel(false);
                        }}
                        className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left flex items-center gap-3 transition-colors"
                      >
                        <Presentation className="w-5 h-5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{content.title}</p>
                          <p className="text-xs text-gray-500">
                            {(content.htmlSlides as HtmlSlide[] | undefined)?.length || 0} slides
                          </p>
                        </div>
                        {!gameModeActive && dynamicSlides?.contentId === content._id && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </button>
                    ))}

                    {/* Legacy: Show single knowledgeContent if no linked content */}
                    {(!availableContent || availableContent.length === 0) && knowledgeContent && (
                      <button
                        onClick={() => {
                          // Activate presentation mode with knowledge content slides
                          setPresentationModeActive(true);
                          setCurrentSlideIndex(0);
                          setGameModeActive(false);
                          setShowMaterialsPanel(false);
                        }}
                        className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left flex items-center gap-3 transition-colors"
                      >
                        <Presentation className="w-5 h-5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{knowledgeContent.title}</p>
                          <p className="text-xs text-gray-500">{htmlSlides?.length || 0} slides</p>
                        </div>
                        {!gameModeActive && useHtmlSlides && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Games Section */}
              {availableGames && availableGames.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-medium">Games ({availableGames.length})</div>
                  <div className="space-y-2">
                    {availableGames.map((game) => (
                      <button
                        key={game._id}
                        onClick={() => {
                          // Start this game
                          const wordGame = game as WordGame;
                          setActiveGame(wordGame);
                          setGameModeActive(true);
                          setCurrentGameItemIndex(0);
                          gameActivatedRef.current = true;
                          setShowMaterialsPanel(false);
                          // Notify avatar (simplified: 2 participants only)
                          notifyGameLoaded(wordGame);
                        }}
                        className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left flex items-center gap-3 transition-colors"
                      >
                        <Gamepad2 className="w-5 h-5 text-purple-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{game.title}</p>
                          <div className="flex gap-1 mt-1">
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                              {game.type?.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              {game.level}
                            </span>
                          </div>
                        </div>
                        {gameModeActive && activeGame?._id === game._id && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy single linked game (if no games via gameLessonLinks) */}
              {linkedGame && (!availableGames || availableGames.length === 0) && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-medium">Games</div>
                  <button
                    onClick={() => {
                      const wordGame = linkedGame as WordGame;
                      setActiveGame(wordGame);
                      setGameModeActive(true);
                      setCurrentGameItemIndex(0);
                      gameActivatedRef.current = true;
                      setShowMaterialsPanel(false);
                      // Notify avatar (simplified: 2 participants only)
                      notifyGameLoaded(wordGame);
                    }}
                    className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left flex items-center gap-3 transition-colors"
                  >
                    <Gamepad2 className="w-5 h-5 text-purple-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{linkedGame.title}</p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          {linkedGame.type?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          {linkedGame.level}
                        </span>
                      </div>
                    </div>
                    {gameModeActive && activeGame?._id === linkedGame._id && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                </div>
              )}

              {/* Stop Game Button (when game is active) */}
              {gameModeActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setGameModeActive(false);
                    setActiveGame(null);
                    gameActivatedRef.current = false;
                  }}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  Stop Current Game
                </Button>
              )}

              {/* Empty State */}
              {!knowledgeContent &&
               (!availableContent || availableContent.length === 0) &&
               (!availableGames || availableGames.length === 0) &&
               !linkedGame && (
                <div className="text-center py-4 text-gray-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No materials linked to this lesson</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Avatar video + Student video */}
      <div className="w-72 border-l border-sls-beige bg-sls-cream/30 flex flex-col">
        {/* Avatar video tile */}
        <div className="p-3 border-b border-sls-beige/50">
          <div className="aspect-video bg-sls-teal/5 rounded-lg overflow-hidden relative">
            {avatarTrack ? (
              <VideoTrack
                trackRef={avatarTrack}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sls-teal/5 to-sls-olive/5">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-sls-teal/20 flex items-center justify-center mx-auto mb-1 animate-pulse">
                    <span className="text-lg font-bold text-sls-teal">L</span>
                  </div>
                  <p className="text-[10px] text-sls-olive/70">
                    {agent ? "Loading..." : "Connecting..."}
                  </p>
                </div>
              </div>
            )}

            {room.state !== "connected" && (
              <div className="absolute inset-0 bg-sls-cream/80 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-sls-teal" />
              </div>
            )}

            <div className="absolute bottom-1.5 left-1.5 bg-sls-teal/80 text-white px-2 py-0.5 rounded text-[10px] font-medium">
              {avatarName}
            </div>
          </div>
        </div>

        {/* Local user video tile */}
        <div className="p-3 border-b border-sls-beige/50">
          <div className="aspect-video bg-sls-beige/30 rounded-lg overflow-hidden relative">
            {localVideoTrack ? (
              <VideoTrack
                trackRef={localVideoTrack}
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sls-beige/30">
                <VideoOff className="w-6 h-6 text-sls-olive/50" />
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 bg-sls-olive/80 text-white px-2 py-0.5 rounded text-[10px] font-medium">
              You
            </div>
          </div>
        </div>

        {/* Simplified: 2 participants only (student + avatar) - multi-participant UI removed */}

        {/* Transcript section */}
        {showTranscript && (
          <>
            <div className="p-2 border-b border-sls-beige/50 flex items-center justify-between">
              <h3 className="font-semibold text-xs text-sls-teal">Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-sls-olive hover:bg-sls-beige/50"
                onClick={() => setShowTranscript(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {transcript.length === 0 ? (
                <div className="text-center py-4 text-sls-olive/60">
                  <MessageSquare className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
                  <p className="text-[10px]">Chat will appear here</p>
                </div>
              ) : (
                transcript.map((entry: TranscriptEntry, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg text-xs ${
                      entry.role === "avatar"
                        ? "bg-sls-teal/10 ml-1 border-l-2 border-sls-teal"
                        : "bg-sls-beige/50 mr-1"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-medium text-[10px] text-sls-teal">
                        {entry.role === "avatar" ? avatarName : "You"}
                      </span>
                      <span className="text-[9px] text-sls-olive/50">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-sls-olive leading-snug">{entry.content}</p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </>
        )}

        {/* When transcript is hidden, show placeholder */}
        {!showTranscript && (
          <div className="flex-1" />
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

      {/* Screen share prompt dialog */}
      {showScreenSharePrompt && (
        <div className="fixed inset-0 bg-sls-teal/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm mx-4 animate-in fade-in zoom-in duration-200 bg-sls-cream border-sls-beige">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-sls-teal/10 flex items-center justify-center mx-auto mb-3">
                <MonitorUp className="w-7 h-7 text-sls-teal" />
              </div>
              <h3 className="text-base font-semibold mb-1.5 text-sls-teal">Share Your Screen</h3>
              <p className="text-sls-olive text-sm mb-5">
                Share so {avatarName} can see your slides.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={dismissScreenSharePrompt}
                  className="bg-white border-sls-beige text-sls-olive hover:bg-sls-beige/50"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleStartScreenShare}
                  className="bg-sls-teal hover:bg-sls-teal/90 text-white border-0"
                >
                  <MonitorUp className="w-4 h-4 mr-1.5" />
                  Share
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
