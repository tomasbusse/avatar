"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  AlertCircle,
  Play,
  Square,
  Video,
  FileText,
  Clock,
  ChevronLeft,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Recording Room Page
 * Provides a teleprompter view with avatar recording controls
 */
export default function RecordingPage() {
  const params = useParams();
  const router = useRouter();
  const videoCreationId = params.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "stopping">("idle");
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Query video creation data
  const video = useQuery(api.videoCreation.getById, {
    videoCreationId: videoCreationId as Id<"videoCreation">,
  });

  // Mutations
  const startRecording = useMutation(api.videoCreation.startRecording);
  const completeRecording = useMutation(api.videoCreation.completeRecording);
  const markFailed = useMutation(api.videoCreation.markFailed);

  // Start the recording session
  const handleStartSession = async () => {
    if (!video) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Start recording in Convex (creates room name)
      const { roomName: newRoomName } = await startRecording({
        videoCreationId: videoCreationId as Id<"videoCreation">,
      });

      setRoomName(newRoomName);

      // Get LiveKit token
      const response = await fetch("/api/video/recording-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: newRoomName,
          videoCreationId,
          participantName: "Recording Admin",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get recording token");
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      console.error("Failed to start recording session:", err);
      setError(err instanceof Error ? err.message : "Failed to start recording");
      await markFailed({
        videoCreationId: videoCreationId as Id<"videoCreation">,
        errorMessage: err instanceof Error ? err.message : "Failed to start recording",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Start the actual recording
  const handleStartRecording = () => {
    setRecordingState("recording");
    setElapsedTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    toast.success("Recording started");
  };

  // Stop recording
  const handleStopRecording = async () => {
    setRecordingState("stopping");

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // TODO: Stop LiveKit Egress and get recording URL
    // For now, just mark as recorded
    toast.success("Recording stopped. Processing...");

    // In a full implementation, you would:
    // 1. Stop the LiveKit Egress
    // 2. Wait for the upload to R2 to complete
    // 3. Update Convex with the recording details

    // For now, simulate completion
    setTimeout(() => {
      router.push("/admin/video-creator");
      toast.success("Recording saved! Ready for processing.");
    }, 2000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (video === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Not found
  if (!video) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Video Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This video project could not be found.
            </p>
            <Button onClick={() => router.push("/admin/video-creator")}>
              Back to Video Creator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check status
  if (video.recordingStatus !== "pending" && video.recordingStatus !== "recording") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {video.recordingStatus === "completed" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              {video.recordingStatus === "completed"
                ? "Already Recorded"
                : video.recordingStatus === "recorded"
                ? "Recording Complete"
                : `Status: ${video.recordingStatus}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {video.recordingStatus === "completed"
                ? "This video has already been recorded and processed."
                : video.recordingStatus === "recorded"
                ? "This video has been recorded and is ready for processing."
                : `Current status: ${video.recordingStatus}`}
            </p>
            <Button onClick={() => router.push("/admin/video-creator")}>
              Back to Video Creator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-recording view
  if (!token || !roomName) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/video-creator")}
              className="text-white/60 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">{video.title}</h1>
            <Badge variant="outline" className="text-white/60 border-white/20">
              {video.videoConfig.aspectRatio}
            </Badge>
          </div>

          {/* Error */}
          {error && (
            <Card className="mb-6 border-red-500/50 bg-red-500/10">
              <CardContent className="p-4 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5" />
                {error}
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          <div className="grid grid-cols-2 gap-8">
            {/* Script Preview */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Script
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-950 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                    {video.scriptContent || video.processedContent?.content || "No script content"}
                  </p>
                </div>
                {video.scriptContent && (
                  <p className="text-white/40 text-xs mt-2">
                    {video.scriptContent.split(/\s+/).filter(Boolean).length} words
                    {" "}~{Math.round(video.scriptContent.split(/\s+/).filter(Boolean).length / 150)} min
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recording Info */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Recording Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Avatar</span>
                    <span className="text-white">{video.avatar?.name || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Style</span>
                    <span className="text-white capitalize">
                      {video.videoConfig.style.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Aspect Ratio</span>
                    <span className="text-white">{video.videoConfig.aspectRatio}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Include Intro</span>
                    <span className="text-white">{video.videoConfig.includeIntro ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Include Outro</span>
                    <span className="text-white">{video.videoConfig.includeOutro ? "Yes" : "No"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleStartSession}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Recording Session
                      </>
                    )}
                  </Button>
                  <p className="text-white/40 text-xs text-center mt-2">
                    This will connect to the avatar and prepare for recording
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Recording view with LiveKit
  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={false}
      video={false}
      className="h-screen bg-gray-950"
    >
      <RecordingRoomContent
        video={video}
        recordingState={recordingState}
        elapsedTime={elapsedTime}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        formatTime={formatTime}
        onBack={() => router.push("/admin/video-creator")}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

/**
 * Recording room content - shows avatar video and teleprompter
 */
function RecordingRoomContent({
  video,
  recordingState,
  elapsedTime,
  onStartRecording,
  onStopRecording,
  formatTime,
  onBack,
}: {
  video: NonNullable<ReturnType<typeof useQuery<typeof api.videoCreation.getById>>>;
  recordingState: "idle" | "recording" | "stopping";
  elapsedTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  formatTime: (seconds: number) => string;
  onBack: () => void;
}) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const avatarTrack = tracks.find((t) => t.participant.identity === "avatar-agent");

  // Calculate script progress based on time
  const wordCount = video.scriptContent?.split(/\s+/).filter(Boolean).length || 0;
  const estimatedDuration = Math.ceil(wordCount / 2.5); // ~150 words per minute = 2.5 words per second
  const progress = estimatedDuration > 0 ? Math.min((elapsedTime / estimatedDuration) * 100, 100) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/60 hover:text-white"
            disabled={recordingState === "recording"}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-white">{video.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {recordingState === "recording" && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-mono text-sm">REC</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left side - Avatar video */}
        <div className="flex-1 flex items-center justify-center bg-black p-8">
          <div
            className={`relative ${
              video.videoConfig.aspectRatio === "9:16"
                ? "aspect-[9/16] h-full max-h-[calc(100vh-200px)]"
                : "aspect-video w-full max-w-4xl"
            } bg-gray-900 rounded-lg overflow-hidden`}
          >
            {avatarTrack ? (
              <VideoTrack
                trackRef={avatarTrack}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white/40" />
                  <p className="text-white/40">Waiting for avatar...</p>
                </div>
              </div>
            )}

            {/* Recording indicator overlay */}
            {recordingState === "recording" && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Recording</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Teleprompter */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Teleprompter
            </h2>
            {wordCount > 0 && (
              <p className="text-white/40 text-xs mt-1">
                {wordCount} words ~{Math.ceil(wordCount / 150)} min
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap">
              {video.scriptContent || video.processedContent?.content || "No script content"}
            </p>
          </div>

          {/* Progress bar */}
          {recordingState === "recording" && (
            <div className="p-4 border-t border-gray-800">
              <Progress value={progress} className="h-2" />
              <p className="text-white/40 text-xs mt-2 text-center">
                Estimated progress: {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="p-4 border-t border-gray-800 space-y-3">
            {recordingState === "idle" && (
              <Button
                className="w-full gap-2 bg-red-600 hover:bg-red-700"
                size="lg"
                onClick={onStartRecording}
                disabled={!avatarTrack}
              >
                <Play className="w-4 h-4" />
                Start Recording
              </Button>
            )}

            {recordingState === "recording" && (
              <Button
                className="w-full gap-2"
                size="lg"
                variant="destructive"
                onClick={onStopRecording}
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}

            {recordingState === "stopping" && (
              <Button className="w-full gap-2" size="lg" disabled>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </Button>
            )}

            <p className="text-white/40 text-xs text-center">
              {recordingState === "idle"
                ? "Click to start recording the avatar's performance"
                : recordingState === "recording"
                ? "The avatar is reading the script. Stop when ready."
                : "Processing your recording..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
