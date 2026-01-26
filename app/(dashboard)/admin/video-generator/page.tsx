"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Loader2,
  BookOpen,
  Newspaper,
  Languages,
  MessageSquare,
  Wand2,
  Play,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

type TemplateType = "grammar_lesson" | "news_broadcast" | "vocabulary_lesson" | "conversation_practice";
type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type VideoStatus = "draft" | "content_generating" | "content_ready" | "audio_generating" | "audio_ready" | "avatar_generating" | "avatar_ready" | "rendering" | "completed" | "failed";

const TEMPLATE_INFO = {
  grammar_lesson: {
    icon: BookOpen,
    name: "Grammar Lesson",
    description: "PPP-structured lesson (Presentation, Practice, Production)",
  },
  news_broadcast: {
    icon: Newspaper,
    name: "News Lesson",
    description: "News-based ESL lesson with vocabulary",
  },
  vocabulary_lesson: {
    icon: Languages,
    name: "Vocabulary Lesson",
    description: "Word-focused lesson with spaced repetition",
  },
  conversation_practice: {
    icon: MessageSquare,
    name: "Conversation Practice",
    description: "Dialog-based practice scenarios",
  },
};

const STATUS_CONFIG: Record<VideoStatus, { color: string; label: string }> = {
  draft: { color: "bg-gray-500", label: "Draft" },
  content_generating: { color: "bg-blue-500 animate-pulse", label: "Generating Content" },
  content_ready: { color: "bg-blue-600", label: "Content Ready" },
  audio_generating: { color: "bg-purple-500 animate-pulse", label: "Generating Audio" },
  audio_ready: { color: "bg-purple-600", label: "Audio Ready" },
  avatar_generating: { color: "bg-indigo-500 animate-pulse", label: "Generating Avatar" },
  avatar_ready: { color: "bg-indigo-600", label: "Avatar Ready" },
  rendering: { color: "bg-orange-500 animate-pulse", label: "Rendering" },
  completed: { color: "bg-green-500", label: "Completed" },
  failed: { color: "bg-red-500", label: "Failed" },
};

// Pipeline steps for progress visualization
const PIPELINE_STEPS = [
  { id: "content", label: "Content", icon: BookOpen, statuses: ["content_generating", "content_ready"] },
  { id: "audio", label: "Audio", icon: Play, statuses: ["audio_generating", "audio_ready"] },
  { id: "avatar", label: "Avatar", icon: Video, statuses: ["avatar_generating", "avatar_ready"] },
  { id: "render", label: "Final", icon: CheckCircle, statuses: ["rendering", "completed"] },
];

// Get step status based on video status
function getStepStatus(stepIndex: number, videoStatus: VideoStatus): "pending" | "active" | "completed" {
  const statusOrder = [
    "draft",
    "content_generating", "content_ready",
    "audio_generating", "audio_ready",
    "avatar_generating", "avatar_ready",
    "rendering", "completed"
  ];

  const currentIndex = statusOrder.indexOf(videoStatus);
  if (videoStatus === "failed") return "pending";

  // Calculate which step the current status belongs to
  const stepRanges = [
    [0, 2], // content: draft, content_generating, content_ready
    [3, 4], // audio: audio_generating, audio_ready
    [5, 6], // avatar: avatar_generating, avatar_ready
    [7, 8], // render: rendering, completed
  ];

  const [stepStart, stepEnd] = stepRanges[stepIndex];

  if (currentIndex > stepEnd) return "completed";
  if (currentIndex >= stepStart && currentIndex <= stepEnd) {
    // Check if it's the "ready" state (completed for this step)
    const isReady = videoStatus.endsWith("_ready") || videoStatus === "completed";
    if (isReady && currentIndex === stepEnd) return "completed";
    return "active";
  }
  return "pending";
}

// Progress Pipeline Component
function PipelineProgress({ status, processingStep }: { status: VideoStatus; processingStep?: string }) {
  return (
    <div className="flex items-center gap-1 mt-3">
      {PIPELINE_STEPS.map((step, index) => {
        const stepStatus = getStepStatus(index, status);
        const isProcessing = processingStep === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                  ${stepStatus === "completed"
                    ? "bg-green-500 text-white"
                    : stepStatus === "active"
                      ? isProcessing
                        ? "bg-blue-500 text-white animate-pulse ring-4 ring-blue-200"
                        : "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }
                `}
              >
                {stepStatus === "completed" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={`text-[10px] mt-1 ${stepStatus === "pending" ? "text-gray-400" : "text-gray-600"}`}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < PIPELINE_STEPS.length - 1 && (
              <div
                className={`
                  w-8 h-0.5 mx-1 transition-all
                  ${stepStatus === "completed" ? "bg-green-500" : "bg-gray-200"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Default voice/character IDs (Cartesia + Hedra)
const DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091"; // Cartesia English female
const DEFAULT_CHARACTER_ID = ""; // User must provide their Hedra character ID

export default function AdminVideoGeneratorPage() {
  // Form state
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [templateType, setTemplateType] = useState<TemplateType>("grammar_lesson");
  const [level, setLevel] = useState<CEFRLevel>("B1");
  const [targetDuration, setTargetDuration] = useState(5);
  const [urls, setUrls] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeOutro, setIncludeOutro] = useState(true);
  const [characterId, setCharacterId] = useState(DEFAULT_CHARACTER_ID);
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [processingVideos, setProcessingVideos] = useState<Record<string, string>>({});

  // Queries
  const videos = useQuery(api.educationalVideos.list, { limit: 20 });

  // Mutations
  const createVideo = useMutation(api.educationalVideos.create);
  const deleteVideo = useMutation(api.educationalVideos.remove);

  // Poll for video status
  const pollVideoStatus = useCallback(async (videoId: string) => {
    try {
      const response = await fetch(`/api/video-generator/render/${videoId}?videoId=${videoId}`);
      // This is just for tracking - actual status comes from Convex
    } catch (error) {
      console.error("Poll error:", error);
    }
  }, []);

  // Check if any video is currently being processed
  const isAnyProcessing = Object.keys(processingVideos).length > 0;

  // Generate lesson content
  const handleGenerateContent = async (videoId: string, video: {
    sourceConfig: { topic?: string; urls?: string[]; targetLevel: string; targetDuration?: number };
    templateType: string;
  }) => {
    // Prevent concurrent processing to avoid rate limits
    if (isAnyProcessing) {
      toast.error("Please wait", { description: "Another video is being processed. Wait for it to complete." });
      return;
    }

    setProcessingVideos(prev => ({ ...prev, [videoId]: "content" }));
    try {
      const response = await fetch("/api/video-generator/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          templateType: video.templateType,
          topic: video.sourceConfig.topic,
          level: video.sourceConfig.targetLevel,
          targetDuration: video.sourceConfig.targetDuration || 5,
          urls: video.sourceConfig.urls,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.details || "Failed to generate content");

      toast.success("Content generated!", { description: "Ready to generate audio." });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Content generation failed";
      toast.error("Content generation failed", { description: errorMsg.slice(0, 200) });
    } finally {
      setProcessingVideos(prev => {
        const updated = { ...prev };
        delete updated[videoId];
        return updated;
      });
    }
  };

  // Generate audio
  const handleGenerateAudio = async (videoId: string, video: {
    lessonContent?: { fullScript: string };
    voiceConfig: { voiceId: string };
  }) => {
    if (!video.lessonContent?.fullScript) {
      toast.error("No script content available");
      return;
    }

    // Prevent concurrent processing to avoid rate limits
    if (isAnyProcessing) {
      toast.error("Please wait", { description: "Another video is being processed. Wait for it to complete." });
      return;
    }

    setProcessingVideos(prev => ({ ...prev, [videoId]: "audio" }));
    try {
      const response = await fetch("/api/video-generator/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          script: video.lessonContent.fullScript,
          voiceId: video.voiceConfig.voiceId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.details || "Failed to generate audio");

      toast.success("Audio generated!", { description: "Ready to generate avatar video." });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Audio generation failed";
      toast.error("Audio generation failed", { description: errorMsg.slice(0, 200) });
    } finally {
      setProcessingVideos(prev => {
        const updated = { ...prev };
        delete updated[videoId];
        return updated;
      });
    }
  };

  // Poll for avatar status with exponential backoff
  const pollAvatarStatus = async (videoId: string, hedraJobId: string, maxAttempts = 40): Promise<boolean> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/video-generator/avatar-status?videoId=${videoId}&hedraJobId=${hedraJobId}`);
        const data = await response.json();

        if (data.status === "completed") {
          return true;
        } else if (data.status === "failed") {
          throw new Error(data.error || "Avatar generation failed");
        }

        // Exponential backoff: start at 5s, increase to max 20s
        const baseDelay = 5000;
        const delay = Math.min(baseDelay * Math.pow(1.2, Math.floor(attempt / 3)), 20000);
        console.log(`[Avatar Poll] Attempt ${attempt + 1}/${maxAttempts}, next poll in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        // On error, wait longer before retrying
        if (attempt === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    throw new Error("Avatar generation timed out after 10 minutes");
  };

  // Generate avatar video
  const handleGenerateAvatar = async (videoId: string, video: {
    audioOutput?: { r2Url: string };
    avatarConfig: { characterId: string };
    videoSettings: { aspectRatio: string };
  }) => {
    if (!video.audioOutput?.r2Url) {
      toast.error("No audio available");
      return;
    }

    if (!video.avatarConfig.characterId) {
      toast.error("No Hedra character ID configured", {
        description: "Please set a character ID when creating the video.",
      });
      return;
    }

    // Prevent concurrent processing to avoid rate limits
    if (isAnyProcessing) {
      toast.error("Please wait", { description: "Another video is being processed. Wait for it to complete." });
      return;
    }

    setProcessingVideos(prev => ({ ...prev, [videoId]: "avatar" }));
    try {
      // Step 1: Start the avatar generation job
      const response = await fetch("/api/video-generator/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          audioUrl: video.audioOutput.r2Url,
          characterId: video.avatarConfig.characterId,
          aspectRatio: video.videoSettings.aspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.details || "Failed to start avatar generation");

      toast.info("Avatar generation started", { description: "This may take 2-5 minutes..." });

      // Step 2: Poll for completion
      const hedraJobId = data.hedraJobId;
      if (hedraJobId) {
        await pollAvatarStatus(videoId, hedraJobId);
        toast.success("Avatar video generated!", { description: "Ready to render final video." });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Avatar generation failed";
      toast.error("Avatar generation failed", { description: errorMsg.slice(0, 200) });
    } finally {
      setProcessingVideos(prev => {
        const updated = { ...prev };
        delete updated[videoId];
        return updated;
      });
    }
  };

  // Render final video (using Render.com self-hosted Remotion server)
  const handleRender = async (videoId: string) => {
    // Prevent concurrent processing
    if (isAnyProcessing) {
      toast.error("Please wait", { description: "Another video is being processed. Wait for it to complete." });
      return;
    }

    setProcessingVideos(prev => ({ ...prev, [videoId]: "render" }));
    try {
      // Use the new Render.com endpoint instead of AWS Lambda
      const response = await fetch("/api/video-generator/render-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (!data.configured) {
          toast.error("Remotion Render Server not configured", {
            description: "Deploy to Render.com and set REMOTION_RENDER_SERVER_URL.",
            duration: 10000,
          });
          setProcessingVideos(prev => {
            const updated = { ...prev };
            delete updated[videoId];
            return updated;
          });
        } else {
          throw new Error(data.error || "Render failed");
        }
        return;
      }

      toast.success("Render started!", {
        description: "Processing on Render.com server...",
      });

      // Start polling for render status
      let pollCount = 0;
      const maxPolls = 120; // ~20 minutes total (Render.com may be slower than Lambda)

      const pollRender = async () => {
        pollCount++;
        try {
          // Poll the new Render.com status endpoint
          const statusResponse = await fetch(
            `/api/video-generator/render-simple/${data.jobId}?videoId=${videoId}`
          );
          const statusData = await statusResponse.json();

          if (statusData.status === "complete") {
            toast.success("Video rendered!", { description: "Ready to download." });
            setProcessingVideos(prev => {
              const updated = { ...prev };
              delete updated[videoId];
              return updated;
            });
          } else if (statusData.status === "failed" || statusData.status === "error") {
            toast.error("Render failed", { description: statusData.error?.slice(0, 200) });
            setProcessingVideos(prev => {
              const updated = { ...prev };
              delete updated[videoId];
              return updated;
            });
          } else if (statusData.status === "not_found") {
            toast.error("Render job not found", { description: "The render server may have restarted." });
            setProcessingVideos(prev => {
              const updated = { ...prev };
              delete updated[videoId];
              return updated;
            });
          } else if (pollCount < maxPolls) {
            // Continue polling every 10 seconds
            const progress = statusData.progress || 0;
            console.log(`[Render Poll] Progress: ${progress}% (poll ${pollCount}/${maxPolls})`);
            setTimeout(pollRender, 10000);
          } else {
            toast.error("Render timed out", { description: "Check back later or retry." });
            setProcessingVideos(prev => {
              const updated = { ...prev };
              delete updated[videoId];
              return updated;
            });
          }
        } catch (pollError) {
          console.error("[Render Poll] Error:", pollError);
          if (pollCount < maxPolls) {
            // Retry with longer delay on error
            setTimeout(pollRender, 15000);
          } else {
            setProcessingVideos(prev => {
              const updated = { ...prev };
              delete updated[videoId];
              return updated;
            });
          }
        }
      };

      // Start polling after 10 seconds (Render.com needs time to start)
      setTimeout(pollRender, 10000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Render failed";
      toast.error("Render failed", { description: errorMsg.slice(0, 200) });
      setProcessingVideos(prev => {
        const updated = { ...prev };
        delete updated[videoId];
        return updated;
      });
    }
  };

  // Create new video
  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    if (!characterId.trim()) {
      toast.error("Please enter a Hedra character ID");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createVideo({
        title: title.trim(),
        templateType,
        sourceConfig: {
          mode: urls.trim() ? "url_scrape" : "topic_input",
          topic: topic.trim(),
          urls: urls.trim() ? urls.split("\n").map(u => u.trim()).filter(Boolean) : undefined,
          targetLevel: level,
          targetDuration,
          nativeLanguage: "German",
        },
        voiceConfig: {
          provider: "cartesia",
          voiceId: voiceId.trim() || DEFAULT_VOICE_ID,
          voiceName: "English Teacher",
        },
        avatarConfig: {
          provider: "hedra",
          characterId: characterId.trim(),
          characterName: "Emma",
        },
        videoSettings: {
          aspectRatio,
          resolution: "1080p",
          includeIntro,
          includeOutro,
          includeLowerThird: true,
          includeProgressBar: true,
          lowerThird: {
            name: "Emma",
            title: "English Teacher",
          },
        },
      });

      toast.success("Video project created!", {
        description: "Click 'Generate Content' to start the pipeline.",
      });

      // Reset form
      setTitle("");
      setTopic("");
      setUrls("");
      setAdditionalContext("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create video");
    } finally {
      setIsCreating(false);
    }
  };

  // Delete video
  const handleDelete = async (videoId: Id<"educationalVideos">) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      await deleteVideo({ videoId });
      toast.success("Video deleted");
    } catch {
      toast.error("Failed to delete video");
    }
  };

  // Get next action for a video
  const getNextAction = (video: NonNullable<typeof videos>[0]) => {
    const status = video.status as VideoStatus;
    const isProcessing = processingVideos[video._id];
    const isOtherProcessing = isAnyProcessing && !isProcessing;

    if (isProcessing) {
      return (
        <Button disabled size="sm" className="gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isProcessing === "content" && "Generating Content..."}
          {isProcessing === "audio" && "Generating Audio..."}
          {isProcessing === "avatar" && "Generating Avatar..."}
          {isProcessing === "render" && "Rendering..."}
        </Button>
      );
    }

    // Show waiting state when another video is processing
    if (isOtherProcessing) {
      switch (status) {
        case "draft":
        case "failed":
        case "content_ready":
        case "audio_ready":
        case "avatar_ready":
          return (
            <Button disabled size="sm" className="gap-2 opacity-50" title="Wait for other video to complete">
              <Clock className="w-4 h-4" />
              Waiting...
            </Button>
          );
      }
    }

    switch (status) {
      case "draft":
      case "failed":
        return (
          <Button
            size="sm"
            onClick={() => handleGenerateContent(video._id, video)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            disabled={isOtherProcessing}
          >
            <Wand2 className="w-4 h-4" />
            Generate Content
          </Button>
        );
      case "content_ready":
        return (
          <Button
            size="sm"
            onClick={() => handleGenerateAudio(video._id, video)}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Play className="w-4 h-4" />
            Generate Audio
          </Button>
        );
      case "audio_ready":
        return (
          <Button
            size="sm"
            onClick={() => handleGenerateAvatar(video._id, video)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Video className="w-4 h-4" />
            Generate Avatar
          </Button>
        );
      case "avatar_ready":
        return (
          <Button
            size="sm"
            onClick={() => handleRender(video._id)}
            className="gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="w-4 h-4" />
            Render Final Video
          </Button>
        );
      case "completed":
        return video.finalOutput?.r2Url ? (
          <a href={video.finalOutput.r2Url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4" />
              Download Video
            </Button>
          </a>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Educational Video Generator</h1>
          <p className="text-muted-foreground">
            Create AI-powered language learning videos with structured lessons
          </p>
        </div>

        {/* Create New Video */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Create New Educational Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Video Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Present Perfect Tense - B1"
                />
              </div>
              <div>
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Present Perfect Tense"
                />
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <Label>Lesson Template</Label>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {Object.entries(TEMPLATE_INFO).map(([type, info]) => {
                  const Icon = info.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setTemplateType(type as TemplateType)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        templateType === type
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${templateType === type ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-medium text-sm">{info.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level and Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="level">CEFR Level</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as CEFRLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                    <SelectItem value="C2">C2 - Proficient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Target Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={2}
                  max={15}
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as "16:9" | "9:16")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait/Shorts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* URLs for News */}
            {templateType === "news_broadcast" && (
              <div>
                <Label htmlFor="urls">Source URLs (one per line, optional)</Label>
                <Textarea
                  id="urls"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://example.com/news-article"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For news lessons, you can provide URLs to scrape content from
                </p>
              </div>
            )}

            {/* Avatar Config */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="characterId">Hedra Character ID *</Label>
                <Input
                  id="characterId"
                  value={characterId}
                  onChange={(e) => setCharacterId(e.target.value)}
                  placeholder="e.g., chr_abc123..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get this from your Hedra dashboard
                </p>
              </div>
              <div>
                <Label htmlFor="voiceId">Cartesia Voice ID</Label>
                <Input
                  id="voiceId"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  placeholder={DEFAULT_VOICE_ID}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank for default English voice
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeIntro"
                  checked={includeIntro}
                  onCheckedChange={(c) => setIncludeIntro(c === true)}
                />
                <Label htmlFor="includeIntro" className="text-sm">Include intro</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeOutro"
                  checked={includeOutro}
                  onCheckedChange={(c) => setIncludeOutro(c === true)}
                />
                <Label htmlFor="includeOutro" className="text-sm">Include outro</Label>
              </div>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreate}
              disabled={isCreating || !title.trim() || !topic.trim() || !characterId.trim()}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Create Video Project
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Videos List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Videos</CardTitle>
          </CardHeader>
          <CardContent>
            {videos === undefined ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No videos yet</p>
                <p className="text-muted-foreground">
                  Create your first educational video above
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => {
                  const status = video.status as VideoStatus;
                  const statusConfig = STATUS_CONFIG[status];
                  const Icon = TEMPLATE_INFO[video.templateType as TemplateType]?.icon || BookOpen;
                  const processingStep = processingVideos[video._id];

                  return (
                    <div
                      key={video._id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{video.title}</h3>
                              <Badge className={`${statusConfig.color} text-white text-xs`}>
                                {statusConfig.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {video.sourceConfig.targetLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {video.sourceConfig.topic} • {video.templateType.replace(/_/g, " ")}
                            </p>
                            {video.errorMessage && (
                              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {video.errorMessage}
                              </p>
                            )}

                            {/* Pipeline Progress Bar */}
                            <PipelineProgress status={status} processingStep={processingStep} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {getNextAction(video)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(video._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
