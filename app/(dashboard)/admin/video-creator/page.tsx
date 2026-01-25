"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Loader2,
  Clock,
  Eye,
  Link as LinkIcon,
  RefreshCw,
  Globe,
  FileText,
  Download,
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Settings,
  Clapperboard,
  Wand2,
  Sparkles,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type ContentMode = "url_scrape" | "text_input" | "template_based";
type VideoStyle = "news_broadcast" | "simple";
type AspectRatio = "16:9" | "9:16";
type AccessMode = "private" | "unlisted" | "public";
type RecordingStatus = "pending" | "recording" | "recorded" | "processing" | "completed" | "failed" | "generating_audio" | "generating_video" | "uploading";

const STATUS_COLORS: Record<RecordingStatus, string> = {
  pending: "bg-gray-500",
  recording: "bg-red-500 animate-pulse",
  recorded: "bg-yellow-500",
  processing: "bg-blue-500 animate-pulse",
  completed: "bg-green-500",
  failed: "bg-red-600",
  generating_audio: "bg-purple-500 animate-pulse",
  generating_video: "bg-indigo-500 animate-pulse",
  uploading: "bg-cyan-500 animate-pulse",
};

const STATUS_LABELS: Record<RecordingStatus, string> = {
  pending: "Pending",
  recording: "Recording",
  recorded: "Recorded",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  generating_audio: "Generating Audio",
  generating_video: "Generating Video",
  uploading: "Uploading",
};

export default function AdminVideoCreatorPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<Id<"videoCreation"> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Batch generation state
  const [generatingVideos, setGeneratingVideos] = useState<Record<string, {
    jobId: string;
    progress: number;
    status: string;
  }>>({});

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<ContentMode>("text_input");
  const [sourceUrls, setSourceUrls] = useState<string[]>([""]);
  const [scriptContent, setScriptContent] = useState("");
  const [rewriteWithOpus, setRewriteWithOpus] = useState(true);
  const [isRewriting, setIsRewriting] = useState(false);
  const [targetWordCount, setTargetWordCount] = useState<number>(400);
  const [avatarId, setAvatarId] = useState<string>("");
  const [videoStyle, setVideoStyle] = useState<VideoStyle>("simple");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeOutro, setIncludeOutro] = useState(true);
  const [includeLowerThird, setIncludeLowerThird] = useState(false);
  const [includeTicker, setIncludeTicker] = useState(false);
  const [lowerThirdName, setLowerThirdName] = useState("");
  const [lowerThirdTitle, setLowerThirdTitle] = useState("");
  const [accessMode, setAccessMode] = useState<AccessMode>("private");

  // Provider overrides
  const [hedraAvatarId, setHedraAvatarId] = useState("");
  const [hedraAvatarImageUrl, setHedraAvatarImageUrl] = useState("");
  const [hedraBaseCreativeId, setHedraBaseCreativeId] = useState("");
  const [beyAvatarId, setBeyAvatarId] = useState("");
  const [cartesiaVoiceId, setCartesiaVoiceId] = useState("");

  // Queries
  const videos = useQuery(api.videoCreation.list, {});
  const avatars = useQuery(api.avatars.listActiveAvatars);

  // Mutations
  const createVideo = useMutation(api.videoCreation.create);
  const updateVideo = useMutation(api.videoCreation.update);
  const deleteVideo = useMutation(api.videoCreation.remove);
  const storeProcessedContent = useMutation(api.videoCreation.storeProcessedContent);
  const regenerateToken = useMutation(api.videoCreation.regenerateShareToken);
  const resetToPending = useMutation(api.videoCreation.resetToPending);

  // Poll for batch generation status
  const pollGenerationStatus = useCallback(async (videoId: string, jobId: string) => {
    try {
      const response = await fetch(`/api/video/generate/${jobId}?videoCreationId=${videoId}`);
      const data = await response.json();

      if (data.status === "complete") {
        // Generation complete, remove from tracking
        setGeneratingVideos((prev) => {
          const updated = { ...prev };
          delete updated[videoId];
          return updated;
        });
        toast.success("Video generated successfully!", {
          description: "Your video is ready to download.",
        });
        return true; // Stop polling
      } else if (data.status === "failed" || data.status === "error") {
        setGeneratingVideos((prev) => {
          const updated = { ...prev };
          delete updated[videoId];
          return updated;
        });
        toast.error("Video generation failed", {
          description: data.error || "Unknown error occurred",
        });
        return true; // Stop polling
      } else {
        // Update progress
        setGeneratingVideos((prev) => ({
          ...prev,
          [videoId]: {
            jobId,
            progress: data.progress || 0,
            status: data.status,
          },
        }));
        return false; // Continue polling
      }
    } catch (error) {
      console.error("Poll error:", error);
      return false; // Continue polling on network errors
    }
  }, []);

  // Start polling effect - only poll when we have a valid jobId
  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {};

    Object.entries(generatingVideos).forEach(([videoId, { jobId }]) => {
      // Only poll if we have a valid (non-empty) jobId
      if (jobId && !intervals[videoId]) {
        intervals[videoId] = setInterval(async () => {
          const shouldStop = await pollGenerationStatus(videoId, jobId);
          if (shouldStop) {
            clearInterval(intervals[videoId]);
            delete intervals[videoId];
          }
        }, 5000); // Poll every 5 seconds
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [generatingVideos, pollGenerationStatus]);

  // Start batch video generation
  const handleGenerateVideo = async (video: {
    _id: Id<"videoCreation">;
    scriptContent?: string;
    avatarId: Id<"avatars">;
    avatarProviderConfig?: {
      hedraAvatarId?: string;
      hedraBaseCreativeId?: string;
    };
    voiceProviderConfig?: {
      cartesiaVoiceId?: string;
    };
    videoConfig: {
      aspectRatio: string;
    };
    avatar?: {
      _id: Id<"avatars">;
      name: string;
    } | null;
  }) => {
    if (!video.scriptContent?.trim()) {
      toast.error("No script content", {
        description: "Please add script content before generating video.",
      });
      return;
    }

    // Get avatar details for Hedra character ID
    const avatar = avatars?.find((a) => a._id === video.avatarId);
    if (!avatar) {
      toast.error("Avatar not found");
      return;
    }

    // Determine Hedra character ID
    // Priority: 1) Video-level override, 2) Avatar's native Hedra ID (if type is hedra)
    let characterId = video.avatarProviderConfig?.hedraAvatarId;
    if (!characterId && avatar.avatarProvider.type === "hedra") {
      characterId = avatar.avatarProvider.avatarId;
    }

    if (!characterId) {
      const hedraAvatars = avatars?.filter((a) => a.avatarProvider.type === "hedra").map((a) => a.name);
      toast.error("Hedra character required", {
        description: avatar.avatarProvider.type === "beyond_presence"
          ? `"${avatar.name}" uses Beyond Presence. Either use a Hedra avatar (${hedraAvatars?.join(", ") || "none available"}) or edit this video and add a Hedra Avatar ID in Provider Overrides.`
          : "Please set a Hedra Avatar ID in the video's Provider Overrides section.",
        duration: 8000,
      });
      return;
    }

    // Determine voice ID
    const voiceId = video.voiceProviderConfig?.cartesiaVoiceId || avatar.voiceProvider.voiceId;

    try {
      setGeneratingVideos((prev) => ({
        ...prev,
        [video._id]: { jobId: "", progress: 0, status: "starting" },
      }));

      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: video.scriptContent,
          voiceId,
          characterId,
          aspectRatio: video.videoConfig.aspectRatio,
          videoCreationId: video._id,
          textPrompt: `${avatar.name} speaking clearly to camera`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start video generation");
      }

      // Update tracking with job ID
      setGeneratingVideos((prev) => ({
        ...prev,
        [video._id]: { jobId: data.jobId, progress: 5, status: "generating_audio" },
      }));

      toast.success("Video generation started", {
        description: `Estimated duration: ~${data.estimatedVideoDuration || 30} seconds`,
      });
    } catch (error) {
      setGeneratingVideos((prev) => {
        const updated = { ...prev };
        delete updated[video._id];
        return updated;
      });
      toast.error(error instanceof Error ? error.message : "Failed to start generation");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMode("text_input");
    setSourceUrls([""]);
    setScriptContent("");
    setRewriteWithOpus(true);
    setTargetWordCount(400);
    setAvatarId("");
    setVideoStyle("simple");
    setAspectRatio("16:9");
    setIncludeIntro(true);
    setIncludeOutro(true);
    setIncludeLowerThird(false);
    setIncludeTicker(false);
    setLowerThirdName("");
    setLowerThirdTitle("");
    setAccessMode("private");
    // Provider overrides
    setHedraAvatarId("");
    setHedraBaseCreativeId("");
    setBeyAvatarId("");
    setCartesiaVoiceId("");
    // Reset edit state
    setEditingVideoId(null);
  };

  // Open edit dialog with existing video data
  const openEditDialog = (video: {
    _id: Id<"videoCreation">;
    title: string;
    description?: string;
    mode: ContentMode;
    sourceUrl?: string;
    sourceUrls?: string[];
    scriptContent?: string;
    avatarId: Id<"avatars">;
    avatarProviderConfig?: {
      hedraAvatarId?: string;
      hedraBaseCreativeId?: string;
      beyAvatarId?: string;
    };
    voiceProviderConfig?: {
      cartesiaVoiceId?: string;
    };
    videoConfig: {
      style: VideoStyle;
      aspectRatio: AspectRatio;
      includeIntro: boolean;
      includeOutro: boolean;
      includeLowerThird: boolean;
      includeTicker: boolean;
      lowerThirdConfig?: {
        name?: string;
        title?: string;
      };
    };
    accessMode: AccessMode;
  }) => {
    setEditingVideoId(video._id);
    setTitle(video.title);
    setDescription(video.description || "");
    setMode(video.mode);
    setSourceUrls(video.sourceUrls?.length ? video.sourceUrls : video.sourceUrl ? [video.sourceUrl] : [""]);
    setScriptContent(video.scriptContent || "");
    setAvatarId(video.avatarId);
    setVideoStyle(video.videoConfig.style);
    setAspectRatio(video.videoConfig.aspectRatio);
    setIncludeIntro(video.videoConfig.includeIntro);
    setIncludeOutro(video.videoConfig.includeOutro);
    setIncludeLowerThird(video.videoConfig.includeLowerThird);
    setIncludeTicker(video.videoConfig.includeTicker);
    setLowerThirdName(video.videoConfig.lowerThirdConfig?.name || "");
    setLowerThirdTitle(video.videoConfig.lowerThirdConfig?.title || "");
    setAccessMode(video.accessMode);
    // Provider overrides
    setHedraAvatarId(video.avatarProviderConfig?.hedraAvatarId || "");
    setHedraBaseCreativeId(video.avatarProviderConfig?.hedraBaseCreativeId || "");
    setBeyAvatarId(video.avatarProviderConfig?.beyAvatarId || "");
    setCartesiaVoiceId(video.voiceProviderConfig?.cartesiaVoiceId || "");
    setIsEditDialogOpen(true);
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingVideoId) return;

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsUpdating(true);
    try {
      // Build provider config objects only if values are provided
      const avatarProviderConfig =
        hedraAvatarId || hedraBaseCreativeId || beyAvatarId
          ? {
              hedraAvatarId: hedraAvatarId || undefined,
              hedraBaseCreativeId: hedraBaseCreativeId || undefined,
              beyAvatarId: beyAvatarId || undefined,
            }
          : undefined;

      const voiceProviderConfig = cartesiaVoiceId
        ? {
            cartesiaVoiceId: cartesiaVoiceId || undefined,
          }
        : undefined;

      const validUrls = sourceUrls.filter((u) => u.trim());
      await updateVideo({
        videoCreationId: editingVideoId,
        title: title.trim(),
        description: description.trim() || undefined,
        sourceUrl: mode === "url_scrape" && validUrls.length > 0 ? validUrls[0] : undefined,
        sourceUrls: mode === "url_scrape" && validUrls.length > 0 ? validUrls : undefined,
        scriptContent: scriptContent.trim() || undefined,
        avatarId: avatarId as Id<"avatars">,
        avatarProviderConfig,
        voiceProviderConfig,
        videoConfig: {
          style: videoStyle,
          aspectRatio,
          includeIntro,
          includeOutro,
          includeLowerThird,
          includeTicker,
          lowerThirdConfig:
            includeLowerThird && (lowerThirdName || lowerThirdTitle)
              ? {
                  name: lowerThirdName || undefined,
                  title: lowerThirdTitle || undefined,
                  style: "news" as const,
                }
              : undefined,
        },
        accessMode,
      });

      toast.success("Video project updated!");
      resetForm();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update video");
    } finally {
      setIsUpdating(false);
    }
  };

  // Add a new URL input field
  const addUrlField = () => {
    setSourceUrls([...sourceUrls, ""]);
  };

  // Remove a URL input field
  const removeUrlField = (index: number) => {
    if (sourceUrls.length > 1) {
      setSourceUrls(sourceUrls.filter((_, i) => i !== index));
    }
  };

  // Update a specific URL
  const updateUrl = (index: number, value: string) => {
    const updated = [...sourceUrls];
    updated[index] = value;
    setSourceUrls(updated);
  };

  // Scrape URLs for content
  const handleScrapeUrl = async () => {
    const validUrls = sourceUrls.filter((u) => u.trim());
    if (validUrls.length === 0) {
      toast.error("Please enter at least one URL");
      return;
    }

    setIsScraping(true);
    if (rewriteWithOpus) {
      setIsRewriting(true);
    }
    try {
      const response = await fetch("/api/video/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: validUrls,
          generateScript: true,
          rewriteWithOpus: rewriteWithOpus,
          videoStyle: videoStyle,
          targetWordCount: targetWordCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape URL(s)");
      }

      if (data.processedContent) {
        setScriptContent(data.processedContent.content);
        if (data.processedContent.title && !title) {
          setTitle(data.processedContent.title);
        }
        const sourceCount = data.sourceCount || 1;
        const rewriteNote = rewriteWithOpus ? " and rewritten with Opus 4.5" : "";
        toast.success(
          `Content extracted from ${sourceCount} source${sourceCount > 1 ? "s" : ""}${rewriteNote}!`
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to scrape URL(s)");
    } finally {
      setIsScraping(false);
      setIsRewriting(false);
    }
  };

  // Handle create
  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!avatarId) {
      toast.error("Please select an avatar");
      return;
    }
    if (mode === "text_input" && !scriptContent.trim()) {
      toast.error("Please enter script content");
      return;
    }
    if (mode === "url_scrape" && !scriptContent.trim()) {
      toast.error("Please scrape a URL first to generate script");
      return;
    }

    setIsCreating(true);
    try {
      // Build provider config objects only if values are provided
      const avatarProviderConfig =
        hedraAvatarId || hedraBaseCreativeId || beyAvatarId
          ? {
              hedraAvatarId: hedraAvatarId || undefined,
              hedraBaseCreativeId: hedraBaseCreativeId || undefined,
              beyAvatarId: beyAvatarId || undefined,
            }
          : undefined;

      const voiceProviderConfig = cartesiaVoiceId
        ? {
            cartesiaVoiceId: cartesiaVoiceId || undefined,
          }
        : undefined;

      const validUrls = sourceUrls.filter((u) => u.trim());
      const result = await createVideo({
        title: title.trim(),
        description: description.trim() || undefined,
        mode,
        sourceUrl: mode === "url_scrape" && validUrls.length > 0 ? validUrls[0] : undefined,
        sourceUrls: mode === "url_scrape" && validUrls.length > 0 ? validUrls : undefined,
        scriptContent: scriptContent.trim(),
        avatarId: avatarId as Id<"avatars">,
        avatarProviderConfig,
        voiceProviderConfig,
        videoConfig: {
          style: videoStyle,
          aspectRatio,
          includeIntro,
          includeOutro,
          includeLowerThird,
          includeTicker,
          lowerThirdConfig:
            includeLowerThird && (lowerThirdName || lowerThirdTitle)
              ? {
                  name: lowerThirdName || undefined,
                  title: lowerThirdTitle || undefined,
                  style: "news" as const,
                }
              : undefined,
        },
        accessMode,
      });

      toast.success("Video project created!", {
        description: "Ready to record when you are.",
      });
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create video");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (videoId: Id<"videoCreation">) => {
    if (!confirm("Are you sure you want to delete this video project?")) return;

    try {
      await deleteVideo({ videoCreationId: videoId });
      toast.success("Video deleted");
    } catch {
      toast.error("Failed to delete video");
    }
  };

  const handleResetToPending = async (videoId: Id<"videoCreation">) => {
    try {
      await resetToPending({ videoCreationId: videoId });
      toast.success("Reset to pending - ready for re-recording");
    } catch {
      toast.error("Failed to reset video");
    }
  };

  const handleRegenerateToken = async (videoId: Id<"videoCreation">) => {
    try {
      const result = await regenerateToken({ videoCreationId: videoId });
      toast.success("New share link generated", {
        description: `/video/watch/${result.shareToken}`,
      });
    } catch {
      toast.error("Failed to regenerate token");
    }
  };

  const copyShareLink = (shareToken: string) => {
    const url = `${window.location.origin}/video/watch/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const getStatusIcon = (status: RecordingStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "recording":
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      case "recorded":
        return <CheckCircle className="w-4 h-4 text-yellow-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "generating_audio":
        return <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />;
      case "generating_video":
        return <Wand2 className="w-4 h-4 text-indigo-500 animate-pulse" />;
      case "uploading":
        return <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Video Creator</h2>
            <p className="text-muted-foreground">
              Create AI avatar videos from text or scraped content
            </p>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Video Project</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Weekly News Update"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this video"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="avatar">Avatar *</Label>
                    <Select value={avatarId} onValueChange={setAvatarId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an avatar" />
                      </SelectTrigger>
                      <SelectContent>
                        {avatars?.map((avatar) => (
                          <SelectItem key={avatar._id} value={avatar._id}>
                            {avatar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Content Mode */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Content Source</h3>
                  <Tabs
                    value={mode}
                    onValueChange={(v) => setMode(v as ContentMode)}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text_input" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Write Script
                      </TabsTrigger>
                      <TabsTrigger value="url_scrape" className="gap-2">
                        <Globe className="w-4 h-4" />
                        Scrape URL
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text_input" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="script">Script *</Label>
                        <Textarea
                          id="script"
                          value={scriptContent}
                          onChange={(e) => setScriptContent(e.target.value)}
                          placeholder="Enter the script that the avatar will read..."
                          rows={8}
                          className="font-mono text-sm"
                        />
                        {scriptContent && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {scriptContent.split(/\s+/).filter(Boolean).length} words
                            {" "}(~{Math.round(scriptContent.split(/\s+/).filter(Boolean).length / 150)} min)
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="url_scrape" className="space-y-4 mt-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>URLs to Scrape</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addUrlField}
                            className="h-7 text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add URL
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {sourceUrls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={url}
                                onChange={(e) => updateUrl(index, e.target.value)}
                                placeholder={`https://example.com/article${sourceUrls.length > 1 ? `-${index + 1}` : ""}`}
                                className="flex-1"
                              />
                              {sourceUrls.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeUrlField(index)}
                                  className="h-10 w-10 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Add multiple URLs to combine content from different sources
                        </p>
                      </div>

                      {/* Word Count Target */}
                      <div>
                        <Label htmlFor="wordCount">Target Word Count</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <Input
                            id="wordCount"
                            type="number"
                            min={100}
                            max={2000}
                            step={50}
                            value={targetWordCount}
                            onChange={(e) => setTargetWordCount(Number(e.target.value))}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            ~{Math.round(targetWordCount / 150)} min read time
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          100-300 words = short, 400-600 = medium, 800+ = detailed
                        </p>
                      </div>

                      {/* Opus Rewrite Option */}
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                        <Checkbox
                          id="rewriteWithOpus"
                          checked={rewriteWithOpus}
                          onCheckedChange={(c) => setRewriteWithOpus(c === true)}
                        />
                        <div className="flex-1">
                          <Label htmlFor="rewriteWithOpus" className="text-sm font-medium cursor-pointer">
                            Rewrite with Opus 4.5
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Completely rewrite content for originality & broadcast quality
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      </div>

                      {/* Generate Button */}
                      <Button
                        type="button"
                        onClick={handleScrapeUrl}
                        disabled={isScraping || sourceUrls.every((u) => !u.trim())}
                        className="w-full"
                      >
                        {isScraping ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            {isRewriting ? "Rewriting with Opus 4.5..." : "Scraping & Processing..."}
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate Script from {sourceUrls.filter((u) => u.trim()).length || 1} URL{sourceUrls.filter((u) => u.trim()).length > 1 ? "s" : ""}
                          </>
                        )}
                      </Button>

                      {scriptContent && (
                        <div>
                          <Label>Generated Script</Label>
                          <Textarea
                            value={scriptContent}
                            onChange={(e) => setScriptContent(e.target.value)}
                            rows={8}
                            className="font-mono text-sm mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {scriptContent.split(/\s+/).filter(Boolean).length} words
                            {" "}(~{Math.round(scriptContent.split(/\s+/).filter(Boolean).length / 150)} min)
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Video Settings */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-medium">Video Settings</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="style">Style</Label>
                      <Select
                        value={videoStyle}
                        onValueChange={(v) => setVideoStyle(v as VideoStyle)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple (Avatar Only)</SelectItem>
                          <SelectItem value="news_broadcast">News Broadcast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="aspect">Aspect Ratio</Label>
                      <Select
                        value={aspectRatio}
                        onValueChange={(v) => setAspectRatio(v as AspectRatio)}
                      >
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="includeIntro"
                        checked={includeIntro}
                        onCheckedChange={(c) => setIncludeIntro(c === true)}
                      />
                      <Label htmlFor="includeIntro" className="text-sm font-normal">
                        Include intro animation
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="includeOutro"
                        checked={includeOutro}
                        onCheckedChange={(c) => setIncludeOutro(c === true)}
                      />
                      <Label htmlFor="includeOutro" className="text-sm font-normal">
                        Include outro with CTA
                      </Label>
                    </div>

                    {videoStyle === "news_broadcast" && (
                      <>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeLowerThird"
                            checked={includeLowerThird}
                            onCheckedChange={(c) => setIncludeLowerThird(c === true)}
                          />
                          <Label htmlFor="includeLowerThird" className="text-sm font-normal">
                            Include lower third (name bar)
                          </Label>
                        </div>

                        {includeLowerThird && (
                          <div className="ml-6 space-y-2 p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Label htmlFor="lowerThirdName" className="text-xs">
                                Name
                              </Label>
                              <Input
                                id="lowerThirdName"
                                value={lowerThirdName}
                                onChange={(e) => setLowerThirdName(e.target.value)}
                                placeholder="e.g., Emma Smith"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lowerThirdTitle" className="text-xs">
                                Title
                              </Label>
                              <Input
                                id="lowerThirdTitle"
                                value={lowerThirdTitle}
                                onChange={(e) => setLowerThirdTitle(e.target.value)}
                                placeholder="e.g., News Anchor"
                                className="h-8"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeTicker"
                            checked={includeTicker}
                            onCheckedChange={(c) => setIncludeTicker(c === true)}
                          />
                          <Label htmlFor="includeTicker" className="text-sm font-normal">
                            Include news ticker
                          </Label>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Provider Overrides (Advanced) */}
                <div className="border-t pt-4 space-y-4">
                  <details className="group">
                    <summary className="font-medium cursor-pointer list-none flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Provider Overrides (Advanced)
                      <span className="text-xs text-muted-foreground ml-2">
                        Optional - overrides avatar defaults
                      </span>
                    </summary>
                    <div className="mt-4 space-y-4 pl-6">
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use the selected avatar&apos;s default provider settings.
                      </p>

                      {/* Hedra Settings */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Hedra</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="hedraAvatarId" className="text-xs">
                              Hedra Avatar ID
                            </Label>
                            <Input
                              id="hedraAvatarId"
                              value={hedraAvatarId}
                              onChange={(e) => setHedraAvatarId(e.target.value)}
                              placeholder="e.g., avatar_abc123"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="hedraBaseCreativeId" className="text-xs">
                              Base Creative ID
                            </Label>
                            <Input
                              id="hedraBaseCreativeId"
                              value={hedraBaseCreativeId}
                              onChange={(e) => setHedraBaseCreativeId(e.target.value)}
                              placeholder="e.g., creative_xyz789"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Beyond Presence Settings */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Beyond Presence</h4>
                        <div>
                          <Label htmlFor="beyAvatarId" className="text-xs">
                            Beyond Presence Avatar ID
                          </Label>
                          <Input
                            id="beyAvatarId"
                            value={beyAvatarId}
                            onChange={(e) => setBeyAvatarId(e.target.value)}
                            placeholder="e.g., b9be11b8-89fb-4227-8f86-..."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Cartesia Settings */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Cartesia (Voice)</h4>
                        <div>
                          <Label htmlFor="cartesiaVoiceId" className="text-xs">
                            Cartesia Voice ID
                          </Label>
                          <Input
                            id="cartesiaVoiceId"
                            value={cartesiaVoiceId}
                            onChange={(e) => setCartesiaVoiceId(e.target.value)}
                            placeholder="e.g., voice_abc123"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Access Settings */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-medium">Access</h3>
                  <Select
                    value={accessMode}
                    onValueChange={(v) => setAccessMode(v as AccessMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (Only you)</SelectItem>
                      <SelectItem value="unlisted">Unlisted (Anyone with link)</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Video Project</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Weekly News Update"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this video"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-avatar">Avatar *</Label>
                    <Select value={avatarId} onValueChange={setAvatarId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an avatar" />
                      </SelectTrigger>
                      <SelectContent>
                        {avatars?.map((avatar) => (
                          <SelectItem key={avatar._id} value={avatar._id}>
                            {avatar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Script Content */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Script Content</h3>
                  <div>
                    <Label htmlFor="edit-script">Script</Label>
                    <Textarea
                      id="edit-script"
                      value={scriptContent}
                      onChange={(e) => setScriptContent(e.target.value)}
                      placeholder="Enter the script that the avatar will read..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    {scriptContent && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {scriptContent.split(/\s+/).filter(Boolean).length} words
                        {" "}(~{Math.round(scriptContent.split(/\s+/).filter(Boolean).length / 150)} min)
                      </p>
                    )}
                  </div>
                </div>

                {/* Video Settings */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-medium">Video Settings</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-style">Style</Label>
                      <Select
                        value={videoStyle}
                        onValueChange={(v) => setVideoStyle(v as VideoStyle)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple (Avatar Only)</SelectItem>
                          <SelectItem value="news_broadcast">News Broadcast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-aspect">Aspect Ratio</Label>
                      <Select
                        value={aspectRatio}
                        onValueChange={(v) => setAspectRatio(v as AspectRatio)}
                      >
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="edit-includeIntro"
                        checked={includeIntro}
                        onCheckedChange={(c) => setIncludeIntro(c === true)}
                      />
                      <Label htmlFor="edit-includeIntro" className="text-sm font-normal">
                        Include intro animation
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="edit-includeOutro"
                        checked={includeOutro}
                        onCheckedChange={(c) => setIncludeOutro(c === true)}
                      />
                      <Label htmlFor="edit-includeOutro" className="text-sm font-normal">
                        Include outro with CTA
                      </Label>
                    </div>

                    {videoStyle === "news_broadcast" && (
                      <>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="edit-includeLowerThird"
                            checked={includeLowerThird}
                            onCheckedChange={(c) => setIncludeLowerThird(c === true)}
                          />
                          <Label htmlFor="edit-includeLowerThird" className="text-sm font-normal">
                            Include lower third (name bar)
                          </Label>
                        </div>

                        {includeLowerThird && (
                          <div className="ml-6 space-y-2 p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Label htmlFor="edit-lowerThirdName" className="text-xs">
                                Name
                              </Label>
                              <Input
                                id="edit-lowerThirdName"
                                value={lowerThirdName}
                                onChange={(e) => setLowerThirdName(e.target.value)}
                                placeholder="e.g., Emma Smith"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-lowerThirdTitle" className="text-xs">
                                Title
                              </Label>
                              <Input
                                id="edit-lowerThirdTitle"
                                value={lowerThirdTitle}
                                onChange={(e) => setLowerThirdTitle(e.target.value)}
                                placeholder="e.g., News Anchor"
                                className="h-8"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="edit-includeTicker"
                            checked={includeTicker}
                            onCheckedChange={(c) => setIncludeTicker(c === true)}
                          />
                          <Label htmlFor="edit-includeTicker" className="text-sm font-normal">
                            Include news ticker
                          </Label>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Provider Overrides (Advanced) */}
                <div className="border-t pt-4 space-y-4">
                  <details className="group">
                    <summary className="font-medium cursor-pointer list-none flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Provider Overrides (Advanced)
                      <span className="text-xs text-muted-foreground ml-2">
                        Optional - overrides avatar defaults
                      </span>
                    </summary>
                    <div className="mt-4 space-y-4 pl-6">
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use the selected avatar&apos;s default provider settings.
                      </p>

                      {/* Hedra Settings */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Hedra</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="edit-hedraAvatarId" className="text-xs">
                              Hedra Avatar ID
                            </Label>
                            <Input
                              id="edit-hedraAvatarId"
                              value={hedraAvatarId}
                              onChange={(e) => setHedraAvatarId(e.target.value)}
                              placeholder="e.g., avatar_abc123"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-hedraBaseCreativeId" className="text-xs">
                              Base Creative ID
                            </Label>
                            <Input
                              id="edit-hedraBaseCreativeId"
                              value={hedraBaseCreativeId}
                              onChange={(e) => setHedraBaseCreativeId(e.target.value)}
                              placeholder="e.g., creative_xyz789"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Beyond Presence Settings */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Beyond Presence</h4>
                        <div>
                          <Label htmlFor="edit-beyAvatarId" className="text-xs">
                            Beyond Presence Avatar ID
                          </Label>
                          <Input
                            id="edit-beyAvatarId"
                            value={beyAvatarId}
                            onChange={(e) => setBeyAvatarId(e.target.value)}
                            placeholder="e.g., b9be11b8-89fb-4227-8f86-..."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Cartesia Settings */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Cartesia (Voice)</h4>
                        <div>
                          <Label htmlFor="edit-cartesiaVoiceId" className="text-xs">
                            Cartesia Voice ID
                          </Label>
                          <Input
                            id="edit-cartesiaVoiceId"
                            value={cartesiaVoiceId}
                            onChange={(e) => setCartesiaVoiceId(e.target.value)}
                            placeholder="e.g., voice_abc123"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Access Settings */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-medium">Access</h3>
                  <Select
                    value={accessMode}
                    onValueChange={(v) => setAccessMode(v as AccessMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (Only you)</SelectItem>
                      <SelectItem value="unlisted">Unlisted (Anyone with link)</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Videos List */}
        {videos === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No video projects yet</p>
              <p className="text-muted-foreground mb-4">
                Create your first AI avatar video
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Video
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {videos.map((video) => (
              <Card key={video._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{video.title}</h3>
                        <Badge
                          className={`${STATUS_COLORS[video.recordingStatus as RecordingStatus]} text-white`}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(video.recordingStatus as RecordingStatus)}
                            {STATUS_LABELS[video.recordingStatus as RecordingStatus]}
                          </span>
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {video.videoConfig.style.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="secondary">
                          {video.videoConfig.aspectRatio}
                        </Badge>
                      </div>

                      {video.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {video.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {video.avatar && (
                          <span className="flex items-center gap-1">
                            <Clapperboard className="w-4 h-4" />
                            {video.avatar.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.totalViews} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Error Message */}
                      {video.errorMessage && (
                        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {video.errorMessage}
                        </div>
                      )}

                      {/* Generation Progress */}
                      {generatingVideos[video._id] && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            <span className="text-muted-foreground">
                              {generatingVideos[video._id].status === "generating_audio"
                                ? "Generating audio..."
                                : generatingVideos[video._id].status === "generating_video"
                                ? "Generating video..."
                                : generatingVideos[video._id].status === "uploading"
                                ? "Uploading to storage..."
                                : "Processing..."}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${generatingVideos[video._id].progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {generatingVideos[video._id].progress}% complete
                          </p>
                        </div>
                      )}

                      {/* Actions based on status */}
                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        {video.recordingStatus === "pending" && !generatingVideos[video._id] && (
                          <>
                            <Button
                              size="sm"
                              className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                              onClick={() => handleGenerateVideo(video)}
                            >
                              <Wand2 className="w-4 h-4" />
                              Generate Video
                            </Button>
                            <Link href={`/video/record/${video._id}`}>
                              <Button size="sm" variant="outline" className="gap-2">
                                <Play className="w-4 h-4" />
                                LiveKit Recording
                              </Button>
                            </Link>
                          </>
                        )}

                        {(video.recordingStatus === "generating_audio" ||
                          video.recordingStatus === "generating_video" ||
                          video.recordingStatus === "uploading") &&
                          !generatingVideos[video._id] && (
                            <>
                              {/* If we have a hedraJobId, allow resuming polling */}
                              {video.batchGeneration?.hedraJobId ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => {
                                    setGeneratingVideos((prev) => ({
                                      ...prev,
                                      [video._id]: {
                                        jobId: video.batchGeneration!.hedraJobId!,
                                        progress: video.batchGeneration?.progress || 0,
                                        status: video.recordingStatus,
                                      },
                                    }));
                                    toast.info("Polling resumed", {
                                      description: "Checking video generation status...",
                                    });
                                  }}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Resume Polling
                                </Button>
                              ) : (
                                <Button size="sm" disabled className="gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Processing...
                                </Button>
                              )}
                            </>
                          )}

                        {video.recordingStatus === "recorded" && (
                          <Button size="sm" className="gap-2" disabled>
                            <Settings className="w-4 h-4" />
                            Process Video (Coming Soon)
                          </Button>
                        )}

                        {video.recordingStatus === "completed" && video.finalOutput && (
                          <>
                            <a
                              href={video.finalOutput.r2Url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                Raw Video
                              </Button>
                            </a>
                            {video.renderedOutput ? (
                              <a
                                href={video.renderedOutput.r2Url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                  <Download className="w-4 h-4" />
                                  Final Video
                                </Button>
                              </a>
                            ) : (
                              <Button
                                size="sm"
                                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                onClick={async () => {
                                  toast.info("Starting Remotion render...");
                                  try {
                                    const response = await fetch("/api/video/render", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        videoCreationId: video._id,
                                      }),
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                      toast.success("Render started!", {
                                        description: "This may take a few minutes...",
                                      });
                                    } else if (!data.configured) {
                                      toast.error("Remotion not configured", {
                                        description: data.setupSteps?.[0] || "Please set up AWS credentials",
                                        duration: 10000,
                                      });
                                    } else {
                                      toast.error(data.error || "Render failed");
                                    }
                                  } catch (error) {
                                    toast.error("Failed to start render");
                                  }
                                }}
                              >
                                <Sparkles className="w-4 h-4" />
                                Render with Slides
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyShareLink(video.shareToken)}
                              className="gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Copy Link
                            </Button>
                          </>
                        )}

                        {(video.recordingStatus === "failed" ||
                          video.recordingStatus === "recorded" ||
                          video.recordingStatus === "completed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetToPending(video._id)}
                            className="gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Re-record
                          </Button>
                        )}
                      </div>

                      {/* Share Link (for completed videos) */}
                      {video.recordingStatus === "completed" && (
                        <div className="mt-4 flex items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                            <LinkIcon className="w-4 h-4 text-muted-foreground" />
                            <code className="text-xs">
                              /video/watch/{video.shareToken}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyShareLink(video.shareToken)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerateToken(video._id)}
                            title="Regenerate link"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Link
                            href={`/video/watch/${video.shareToken}`}
                            target="_blank"
                          >
                            <Button variant="ghost" size="sm" title="Open in new tab">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(video)}
                        title="Edit Video"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(video._id)}
                        title="Delete Video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
