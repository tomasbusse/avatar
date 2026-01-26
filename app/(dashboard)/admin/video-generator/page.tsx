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

  // Generate lesson content
  const handleGenerateContent = async (videoId: string, video: {
    sourceConfig: { topic?: string; urls?: string[]; targetLevel: string; targetDuration?: number };
    templateType: string;
  }) => {
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
      if (!response.ok) throw new Error(data.error || "Failed to generate content");

      toast.success("Content generated!", { description: "Ready to generate audio." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Content generation failed");
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
      if (!response.ok) throw new Error(data.error || "Failed to generate audio");

      toast.success("Audio generated!", { description: "Ready to generate avatar video." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Audio generation failed");
    } finally {
      setProcessingVideos(prev => {
        const updated = { ...prev };
        delete updated[videoId];
        return updated;
      });
    }
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

    setProcessingVideos(prev => ({ ...prev, [videoId]: "avatar" }));
    try {
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
      if (!response.ok) throw new Error(data.error || "Failed to generate avatar");

      toast.success("Avatar video generated!", { description: "Ready to render final video." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Avatar generation failed");
    } finally {
      setProcessingVideos(prev => {
        const updated = { ...prev };
        delete updated[videoId];
        return updated;
      });
    }
  };

  // Render final video
  const handleRender = async (videoId: string) => {
    setProcessingVideos(prev => ({ ...prev, [videoId]: "render" }));
    try {
      const response = await fetch("/api/video-generator/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (!data.configured) {
          toast.error("Remotion Lambda not configured", {
            description: "Please set up AWS credentials for Remotion.",
            duration: 10000,
          });
        } else {
          throw new Error(data.error || "Render failed");
        }
        return;
      }

      toast.success("Render started!", {
        description: "This may take a few minutes. Check back soon.",
      });

      // Start polling for render status
      const pollRender = async () => {
        const statusResponse = await fetch(
          `/api/video-generator/render/${data.renderId}?videoId=${videoId}&bucketName=${data.bucketName}`
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
          toast.error("Render failed", { description: statusData.error });
          setProcessingVideos(prev => {
            const updated = { ...prev };
            delete updated[videoId];
            return updated;
          });
        } else {
          // Continue polling
          setTimeout(pollRender, 5000);
        }
      };

      setTimeout(pollRender, 5000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Render failed");
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

    switch (status) {
      case "draft":
      case "failed":
        return (
          <Button
            size="sm"
            onClick={() => handleGenerateContent(video._id, video)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
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

                  return (
                    <div
                      key={video._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
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
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
