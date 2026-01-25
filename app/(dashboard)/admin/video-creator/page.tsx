"use client";

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type ContentMode = "url_scrape" | "text_input" | "template_based";
type VideoStyle = "news_broadcast" | "simple";
type AspectRatio = "16:9" | "9:16";
type AccessMode = "private" | "unlisted" | "public";
type RecordingStatus = "pending" | "recording" | "recorded" | "processing" | "completed" | "failed";

const STATUS_COLORS: Record<RecordingStatus, string> = {
  pending: "bg-gray-500",
  recording: "bg-red-500 animate-pulse",
  recorded: "bg-yellow-500",
  processing: "bg-blue-500 animate-pulse",
  completed: "bg-green-500",
  failed: "bg-red-600",
};

const STATUS_LABELS: Record<RecordingStatus, string> = {
  pending: "Pending",
  recording: "Recording",
  recorded: "Recorded",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export default function AdminVideoCreatorPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<ContentMode>("text_input");
  const [sourceUrl, setSourceUrl] = useState("");
  const [scriptContent, setScriptContent] = useState("");
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

  // Queries
  const videos = useQuery(api.videoCreation.list, {});
  const avatars = useQuery(api.avatars.listActiveAvatars);

  // Mutations
  const createVideo = useMutation(api.videoCreation.create);
  const deleteVideo = useMutation(api.videoCreation.remove);
  const storeProcessedContent = useMutation(api.videoCreation.storeProcessedContent);
  const regenerateToken = useMutation(api.videoCreation.regenerateShareToken);
  const resetToPending = useMutation(api.videoCreation.resetToPending);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMode("text_input");
    setSourceUrl("");
    setScriptContent("");
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
  };

  // Scrape URL for content
  const handleScrapeUrl = async () => {
    if (!sourceUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsScraping(true);
    try {
      const response = await fetch("/api/video/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: sourceUrl.trim(),
          generateScript: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape URL");
      }

      if (data.processedContent) {
        setScriptContent(data.processedContent.content);
        if (data.processedContent.title && !title) {
          setTitle(data.processedContent.title);
        }
        toast.success("Content extracted and script generated!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to scrape URL");
    } finally {
      setIsScraping(false);
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
      const result = await createVideo({
        title: title.trim(),
        description: description.trim() || undefined,
        mode,
        sourceUrl: mode === "url_scrape" ? sourceUrl.trim() : undefined,
        scriptContent: scriptContent.trim(),
        avatarId: avatarId as Id<"avatars">,
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
                        <Label htmlFor="url">URL to Scrape</Label>
                        <div className="flex gap-2">
                          <Input
                            id="url"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            placeholder="https://example.com/article"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleScrapeUrl}
                            disabled={isScraping || !sourceUrl.trim()}
                          >
                            {isScraping ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Wand2 className="w-4 h-4" />
                            )}
                            <span className="ml-2">Generate</span>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          We&apos;ll extract the content and generate a video script
                        </p>
                      </div>

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

                      {/* Actions based on status */}
                      <div className="mt-4 flex items-center gap-2">
                        {video.recordingStatus === "pending" && (
                          <Link href={`/video/record/${video._id}`}>
                            <Button size="sm" className="gap-2">
                              <Play className="w-4 h-4" />
                              Start Recording
                            </Button>
                          </Link>
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
                                Download
                              </Button>
                            </a>
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
