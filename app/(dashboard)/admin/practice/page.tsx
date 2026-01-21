"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MessageSquare,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Loader2,
  Clock,
  Users,
  Link as LinkIcon,
  RefreshCw,
  Globe,
  Search,
  FileText,
  Upload,
  BookOpen,
  X,
  Pencil,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type ConversationMode = "free_conversation" | "transcript_based" | "knowledge_based" | "topic_guided";
type ConversationStyle = "discussion" | "quiz" | "review" | "q_and_a" | "mixed";
type AccessMode = "authenticated_only" | "public_link" | "both";
type SearchDepth = "basic" | "advanced" | "detailed";
type SearchTopic = "general" | "news" | "finance";

export default function AdminPracticePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<Id<"conversationPractice"> | null>(null);
  const [isTestingWebSearch, setIsTestingWebSearch] = useState<string | null>(null);

  // Web search preview state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewResults, setPreviewResults] = useState<{
    query: string;
    answer?: string;
    searchDepth?: string;
    llmRewrittenContent?: string; // LLM-rewritten clean journalist prose (detailed mode)
    results: Array<{
      title: string;
      url: string;
      content: string;
      rawContent?: string; // Full article content (detailed mode)
      publishedDate?: string;
    }>;
    fetchedAt: number;
  } | null>(null);
  const [previewPracticeTitle, setPreviewPracticeTitle] = useState("");
  const [previewPracticeId, setPreviewPracticeId] = useState<Id<"conversationPractice"> | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<ConversationMode>("free_conversation");
  const [subject, setSubject] = useState("");
  const [avatarId, setAvatarId] = useState<string>("");
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle>("discussion");
  const [targetDuration, setTargetDuration] = useState(15);
  const [accessMode, setAccessMode] = useState<AccessMode>("both");
  const [collectName, setCollectName] = useState(true);
  const [collectEmail, setCollectEmail] = useState(false);
  const [welcomeNote, setWelcomeNote] = useState("");

  // Web search state
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [searchDepth, setSearchDepth] = useState<SearchDepth>("basic");
  const [searchTopic, setSearchTopic] = useState<SearchTopic>("general");
  const [includeDomains, setIncludeDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [maxResults, setMaxResults] = useState(5);

  // Transcript state (for transcript_based mode)
  const [transcriptContent, setTranscriptContent] = useState("");
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [isUploadingTranscript, setIsUploadingTranscript] = useState(false);

  // Knowledge base state (for knowledge_based mode)
  const [selectedKnowledgeBaseIds, setSelectedKnowledgeBaseIds] = useState<string[]>([]);

  // Queries
  const practices = useQuery(api.conversationPractice.list, {});
  const avatars = useQuery(api.avatars.listActiveAvatars);
  const knowledgeBases = useQuery(api.knowledgeBases.list);

  // Mutations
  const createPractice = useMutation(api.conversationPractice.create);
  const updatePractice = useMutation(api.conversationPractice.update);
  const deletePractice = useMutation(api.conversationPractice.remove);
  const regenerateToken = useMutation(api.conversationPractice.regenerateShareToken);
  const uploadTranscript = useMutation(api.conversationPractice.uploadTranscript);
  const storePrefetchedContent = useMutation(api.conversationPractice.storePrefetchedContent);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMode("free_conversation");
    setSubject("");
    setAvatarId("");
    setConversationStyle("discussion");
    setTargetDuration(15);
    setAccessMode("both");
    setCollectName(true);
    setCollectEmail(false);
    setWelcomeNote("");
    // Reset web search
    setWebSearchEnabled(false);
    setSearchDepth("basic");
    setSearchTopic("general");
    setIncludeDomains([]);
    setNewDomain("");
    setMaxResults(5);
    // Reset transcript
    setTranscriptContent("");
    setTranscriptFile(null);
    // Reset knowledge base
    setSelectedKnowledgeBaseIds([]);
  };

  // Handle adding a domain to the list
  const handleAddDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;

    // Clean up the domain (remove protocol if present)
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]; // Remove any path

    if (cleanDomain && !includeDomains.includes(cleanDomain)) {
      setIncludeDomains([...includeDomains, cleanDomain]);
      setNewDomain("");
    }
  };

  // Handle removing a domain from the list
  const handleRemoveDomain = (domain: string) => {
    setIncludeDomains(includeDomains.filter((d) => d !== domain));
  };

  // Load practice data for editing
  const loadPracticeForEdit = (practice: NonNullable<typeof practices>[number]) => {
    setEditingPracticeId(practice._id);
    setTitle(practice.title);
    setDescription(practice.description || "");
    setMode(practice.mode as ConversationMode);
    setSubject(practice.subject || "");
    setAvatarId(practice.avatarId);
    setConversationStyle((practice.behaviorConfig.conversationStyle || "discussion") as ConversationStyle);
    setTargetDuration(practice.behaviorConfig.targetDurationMinutes || 15);
    setAccessMode((practice.accessMode || "both") as AccessMode);
    setCollectName(practice.guestSettings?.collectName ?? true);
    setCollectEmail(practice.guestSettings?.collectEmail ?? false);
    setWelcomeNote(practice.guestSettings?.welcomeNote || "");
    // Web search
    setWebSearchEnabled(practice.webSearchEnabled || false);
    setSearchDepth((practice.webSearchConfig?.searchDepth || "basic") as SearchDepth);
    setSearchTopic((practice.webSearchConfig?.topic || "general") as SearchTopic);
    setIncludeDomains(practice.webSearchConfig?.includeDomains || []);
    setMaxResults(practice.webSearchConfig?.maxResults || 5);
    // Transcript
    setTranscriptContent(practice.transcript?.content || "");
    // Knowledge bases
    setSelectedKnowledgeBaseIds(practice.knowledgeBaseIds || []);

    setIsDialogOpen(true);
  };

  // Fetch and store web search content for a practice
  // This replaces any existing content and stores it permanently
  const testWebSearch = async (
    practiceId: Id<"conversationPractice">,
    practiceTitle: string,
    searchConfig: {
      searchDepth?: string;
      topic?: string;
      includeDomains?: string[];
      maxResults?: number;
    } | undefined,
    subject?: string
  ) => {
    setIsTestingWebSearch(practiceId);
    try {
      const response = await fetch("/api/practice/test-web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchConfig,
          subject,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch web search");
      }

      if (data.webSearchResults && data.webSearchResults.results.length > 0) {
        // Store results in practice record (replaces any existing content)
        await storePrefetchedContent({
          practiceId,
          prefetchedContent: data.webSearchResults,
        });

        // Also update preview dialog
        setPreviewResults(data.webSearchResults);
        setPreviewPracticeTitle(practiceTitle);
        setPreviewPracticeId(practiceId);
        setPreviewDialogOpen(true);
        toast.success(`Stored ${data.webSearchResults.results.length} results for avatar`);
      } else if (data.results && data.results.length > 0) {
        // Legacy format fallback
        const legacyResults = {
          query: data.query,
          answer: data.answer,
          results: data.results,
          fetchedAt: Date.now(),
        };

        await storePrefetchedContent({
          practiceId,
          prefetchedContent: legacyResults,
        });

        setPreviewResults(legacyResults);
        setPreviewPracticeTitle(practiceTitle);
        setPreviewPracticeId(practiceId);
        setPreviewDialogOpen(true);
        toast.success(`Stored ${data.results.length} results for avatar`);
      } else {
        toast.warning("No results found - try different search settings");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch web search");
    } finally {
      setIsTestingWebSearch(null);
    }
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!avatarId) {
      toast.error("Please select an avatar");
      return;
    }

    // Mode-specific validation
    if (mode === "transcript_based" && !transcriptContent.trim()) {
      toast.error("Please enter or upload a transcript");
      return;
    }
    if (mode === "knowledge_based" && selectedKnowledgeBaseIds.length === 0) {
      toast.error("Please select at least one knowledge base");
      return;
    }

    setIsCreating(true);
    try {
      if (editingPracticeId) {
        // Update existing practice
        await updatePractice({
          practiceId: editingPracticeId,
          title: title.trim(),
          description: description.trim() || undefined,
          subject: subject.trim() || undefined,
          avatarId: avatarId as Id<"avatars">,
          behaviorConfig: {
            conversationStyle,
            difficultyAdaptation: true,
            allowTopicDrift: true,
            targetDurationMinutes: targetDuration,
          },
          webSearchEnabled,
          webSearchConfig: webSearchEnabled
            ? {
                searchDepth,
                topic: searchTopic,
                maxResults,
                includeDomains: includeDomains.length > 0 ? includeDomains : undefined,
              }
            : undefined,
          accessMode,
          guestSettings: {
            collectName,
            collectEmail,
            welcomeNote: welcomeNote.trim() || undefined,
          },
        });
        toast.success("Practice updated!");
      } else {
        // Create new practice
        await handleCreate();
        return; // handleCreate already handles success/error
      }

      resetForm();
      setEditingPracticeId(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle transcript file selection
  const handleTranscriptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["text/plain", "application/pdf", "text/markdown"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      toast.error("Please upload a text file (.txt, .md)");
      return;
    }

    setTranscriptFile(file);

    // Read file content
    try {
      const text = await file.text();
      setTranscriptContent(text);
      toast.success(`Loaded: ${file.name}`);
    } catch {
      toast.error("Failed to read file");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!avatarId) {
      toast.error("Please select an avatar");
      return;
    }

    // Mode-specific validation
    if (mode === "transcript_based" && !transcriptContent.trim()) {
      toast.error("Please enter or upload a transcript");
      return;
    }
    if (mode === "knowledge_based" && selectedKnowledgeBaseIds.length === 0) {
      toast.error("Please select at least one knowledge base");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createPractice({
        title: title.trim(),
        description: description.trim() || undefined,
        mode,
        subject: subject.trim() || undefined,
        avatarId: avatarId as Id<"avatars">,
        behaviorConfig: {
          conversationStyle,
          difficultyAdaptation: true,
          allowTopicDrift: true,
          targetDurationMinutes: targetDuration,
        },
        webSearchEnabled,
        webSearchConfig: webSearchEnabled
          ? {
              searchDepth,
              topic: searchTopic,
              maxResults,
              includeDomains: includeDomains.length > 0 ? includeDomains : undefined,
            }
          : undefined,
        // Include knowledge base IDs for knowledge_based mode
        knowledgeBaseIds: mode === "knowledge_based" && selectedKnowledgeBaseIds.length > 0
          ? selectedKnowledgeBaseIds.map((id) => id as Id<"knowledgeBases">)
          : undefined,
        accessMode,
        guestSettings: {
          collectName,
          collectEmail,
          nameRequired: collectName,
          emailRequired: collectEmail,
          welcomeNote: welcomeNote.trim() || undefined,
        },
        entryFlowConfig: {
          startButton: {
            text: "Start Practice",
            variant: "gradient",
            animation: "breathe",
          },
          waitingScreen: {
            text: "{avatarName} is getting ready...",
            animation: "pulse",
          },
        },
      });

      // Upload transcript if in transcript_based mode
      if (mode === "transcript_based" && transcriptContent.trim()) {
        await uploadTranscript({
          practiceId: result.practiceId,
          content: transcriptContent.trim(),
          sourceType: transcriptFile ? "file_upload" : "paste",
          sourceMetadata: transcriptFile
            ? { originalFileName: transcriptFile.name }
            : undefined,
        });
      }

      toast.success("Practice created!", {
        description: `Share link: /practice/join/${result.shareToken}`,
      });
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create practice");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (practiceId: Id<"conversationPractice">) => {
    if (!confirm("Are you sure you want to delete this practice?")) return;

    try {
      await deletePractice({ practiceId });
      toast.success("Practice deleted");
    } catch (error) {
      toast.error("Failed to delete practice");
    }
  };

  const handleRegenerateToken = async (practiceId: Id<"conversationPractice">) => {
    try {
      const result = await regenerateToken({ practiceId });
      toast.success("New share link generated", {
        description: `/practice/join/${result.shareToken}`,
      });
    } catch (error) {
      toast.error("Failed to regenerate token");
    }
  };

  const copyShareLink = (shareToken: string) => {
    const url = `${window.location.origin}/practice/join/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Conversation Practice</h2>
            <p className="text-muted-foreground">
              Create shareable practice sessions for speaking practice
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
              setEditingPracticeId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Practice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPracticeId ? "Edit Conversation Practice" : "Create Conversation Practice"}
                </DialogTitle>
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
                      placeholder="e.g., Business English Practice"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of what students will practice"
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

                {/* Conversation Settings */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-medium">Conversation Settings</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mode">Mode</Label>
                      <Select value={mode} onValueChange={(v) => setMode(v as ConversationMode)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free_conversation">Free Conversation</SelectItem>
                          <SelectItem value="topic_guided">Topic Guided</SelectItem>
                          <SelectItem value="knowledge_based">Knowledge Based</SelectItem>
                          <SelectItem value="transcript_based">Transcript Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="style">Style</Label>
                      <Select value={conversationStyle} onValueChange={(v) => setConversationStyle(v as ConversationStyle)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discussion">Discussion</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="q_and_a">Q&A</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(mode === "topic_guided" || mode === "knowledge_based") && (
                    <div>
                      <Label htmlFor="subject">Subject/Topic</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Job interviews, Travel vocabulary"
                      />
                    </div>
                  )}

                  {/* Transcript Input (for transcript_based mode) */}
                  {mode === "transcript_based" && (
                    <div className="space-y-3 p-4 bg-amber-50/50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-medium text-amber-800">Transcript Content</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter or upload a transcript for the avatar to discuss with the student.
                      </p>

                      {/* File Upload */}
                      <div className="flex items-center gap-2">
                        <label htmlFor="transcript-file" className="cursor-pointer">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md hover:bg-gray-50 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">
                              {transcriptFile ? transcriptFile.name : "Upload file"}
                            </span>
                          </div>
                          <input
                            id="transcript-file"
                            type="file"
                            accept=".txt,.md,text/plain,text/markdown"
                            onChange={handleTranscriptFileChange}
                            className="hidden"
                          />
                        </label>
                        {transcriptFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTranscriptFile(null);
                              setTranscriptContent("");
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      {/* Or paste directly */}
                      <div className="text-center text-xs text-muted-foreground">or paste directly</div>

                      <Textarea
                        value={transcriptContent}
                        onChange={(e) => setTranscriptContent(e.target.value)}
                        placeholder="Paste your transcript here..."
                        rows={6}
                        className="font-mono text-sm"
                      />
                      {transcriptContent && (
                        <p className="text-xs text-muted-foreground">
                          {transcriptContent.split(/\s+/).length} words
                        </p>
                      )}
                    </div>
                  )}

                  {/* Knowledge Base Selection (for knowledge_based mode) */}
                  {mode === "knowledge_based" && (
                    <div className="space-y-3 p-4 bg-purple-50/50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-medium text-purple-800">Knowledge Bases</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select one or more knowledge bases for the avatar to reference during the conversation.
                      </p>

                      {knowledgeBases === undefined ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : knowledgeBases.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">No knowledge bases found</p>
                          <Link href="/admin/knowledge">
                            <Button variant="outline" size="sm">
                              Create Knowledge Base
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {knowledgeBases.map((kb) => (
                            <div
                              key={kb._id}
                              className="flex items-center gap-2 p-2 bg-white rounded border"
                            >
                              <Checkbox
                                id={`kb-${kb._id}`}
                                checked={selectedKnowledgeBaseIds.includes(kb._id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedKnowledgeBaseIds([...selectedKnowledgeBaseIds, kb._id]);
                                  } else {
                                    setSelectedKnowledgeBaseIds(
                                      selectedKnowledgeBaseIds.filter((id) => id !== kb._id)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`kb-${kb._id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <p className="text-sm font-medium">{kb.name}</p>
                                {kb.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {kb.description}
                                  </p>
                                )}
                              </label>
                              <Badge variant="outline" className="text-xs">
                                {kb.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedKnowledgeBaseIds.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedKnowledgeBaseIds.length} selected
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="duration">Target Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={5}
                      max={60}
                      value={targetDuration}
                      onChange={(e) => setTargetDuration(parseInt(e.target.value) || 15)}
                    />
                  </div>
                </div>

                {/* Web Search Settings (Tavily) */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium">Web Search (Tavily)</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="webSearchEnabled"
                        checked={webSearchEnabled}
                        onCheckedChange={(c) => setWebSearchEnabled(c === true)}
                      />
                      <Label htmlFor="webSearchEnabled" className="text-sm font-normal">
                        Enable
                      </Label>
                    </div>
                  </div>

                  {webSearchEnabled && (
                    <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                      <p className="text-sm text-muted-foreground">
                        Avatar can search the web for current news and information during the conversation.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="searchDepth">Search Depth</Label>
                          <Select value={searchDepth} onValueChange={(v) => setSearchDepth(v as SearchDepth)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic (faster)</SelectItem>
                              <SelectItem value="advanced">Advanced (more thorough)</SelectItem>
                              <SelectItem value="detailed">Detailed (full articles)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="searchTopic">Topic Focus</Label>
                          <Select value={searchTopic} onValueChange={(v) => setSearchTopic(v as SearchTopic)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="news">News</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="maxResults">Max Results</Label>
                        <Input
                          id="maxResults"
                          type="number"
                          min={1}
                          max={20}
                          value={maxResults}
                          onChange={(e) => setMaxResults(parseInt(e.target.value) || 5)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="includeDomains">Preferred Domains</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="includeDomains"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddDomain();
                              }
                            }}
                            placeholder="e.g., bbc.com"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddDomain}
                            disabled={!newDomain.trim()}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                        {includeDomains.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {includeDomains.map((domain) => (
                              <Badge
                                key={domain}
                                variant="secondary"
                                className="flex items-center gap-1 pl-2 pr-1"
                              >
                                {domain}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDomain(domain)}
                                  className="hover:bg-muted rounded p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Limit search to specific news sources or websites
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Access Settings */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-medium">Access Settings</h3>

                  <div>
                    <Label htmlFor="accessMode">Who can access?</Label>
                    <Select value={accessMode} onValueChange={(v) => setAccessMode(v as AccessMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Anyone with link (guests + logged in)</SelectItem>
                        <SelectItem value="public_link">Guests only (no login required)</SelectItem>
                        <SelectItem value="authenticated_only">Logged in users only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {accessMode !== "authenticated_only" && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">Guest Settings</p>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="collectName"
                          checked={collectName}
                          onCheckedChange={(c) => setCollectName(c === true)}
                        />
                        <Label htmlFor="collectName" className="text-sm font-normal">
                          Ask for name before starting
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="collectEmail"
                          checked={collectEmail}
                          onCheckedChange={(c) => setCollectEmail(c === true)}
                        />
                        <Label htmlFor="collectEmail" className="text-sm font-normal">
                          Ask for email (optional)
                        </Label>
                      </div>

                      <div>
                        <Label htmlFor="welcomeNote" className="text-sm">Welcome Note</Label>
                        <Textarea
                          id="welcomeNote"
                          value={welcomeNote}
                          onChange={(e) => setWelcomeNote(e.target.value)}
                          placeholder="Welcome message shown to guests"
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                    setEditingPracticeId(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingPracticeId ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      editingPracticeId ? "Save Changes" : "Create Practice"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Practices List */}
        {practices === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : practices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No practices yet</p>
              <p className="text-muted-foreground mb-4">
                Create your first conversation practice session
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Practice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {practices.map((practice) => (
              <Card key={practice._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{practice.title}</h3>
                        <Badge variant="secondary" className="capitalize">
                          {practice.mode.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {practice.behaviorConfig.conversationStyle}
                        </Badge>
                        {practice.webSearchEnabled && (
                          <Badge variant="default" className="bg-blue-500">
                            <Globe className="w-3 h-3 mr-1" />
                            Web Search
                          </Badge>
                        )}
                        {practice.transcript && (
                          <Badge variant="default" className="bg-amber-500">
                            <FileText className="w-3 h-3 mr-1" />
                            Transcript
                          </Badge>
                        )}
                        {practice.knowledgeBaseIds && practice.knowledgeBaseIds.length > 0 && (
                          <Badge variant="default" className="bg-purple-500">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {practice.knowledgeBaseIds.length} KB
                          </Badge>
                        )}
                      </div>

                      {practice.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {practice.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {practice.avatar && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {practice.avatar.name}
                          </span>
                        )}
                        {practice.behaviorConfig.targetDurationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {practice.behaviorConfig.targetDurationMinutes} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {practice.totalSessions} sessions
                        </span>
                      </div>

                      {/* Share Link */}
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                          <LinkIcon className="w-4 h-4 text-muted-foreground" />
                          <code className="text-xs">
                            /practice/join/{practice.shareToken}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyShareLink(practice.shareToken)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateToken(practice._id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Link
                          href={`/practice/join/${practice.shareToken}`}
                          target="_blank"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Test Web Search Button */}
                      {practice.webSearchEnabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => testWebSearch(
                            practice._id,
                            practice.title,
                            practice.webSearchConfig,
                            practice.subject
                          )}
                          disabled={isTestingWebSearch === practice._id}
                          title="Fetch & Preview Web Search"
                        >
                          {isTestingWebSearch === practice._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => loadPracticeForEdit(practice)}
                        title="Edit Practice"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(practice._id)}
                        title="Delete Practice"
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

        {/* Web Search Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={(open) => {
          setPreviewDialogOpen(open);
          if (!open) setExpandedArticles(new Set());
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Web Search Preview: {previewPracticeTitle}
              </DialogTitle>
            </DialogHeader>

            {previewResults && (
              <div className="space-y-4">
                {/* Query and metadata */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Query:</span>
                      <span className="text-muted-foreground">{previewResults.query}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {previewResults.searchDepth === "detailed" && (
                        <Badge className="bg-purple-500 text-xs">Full Articles</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(previewResults.fetchedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Synthesized answer */}
                {previewResults.answer && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">AI Summary (what avatar sees first)</span>
                    </div>
                    <p className="text-sm text-green-900">{previewResults.answer}</p>
                  </div>
                )}

                {/* LLM Rewritten Content - Clean journalist prose */}
                {previewResults.llmRewrittenContent && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Clean Article Content (what avatar uses)</span>
                      <Badge className="bg-purple-500 text-xs">LLM Rewritten</Badge>
                    </div>
                    <div className="text-sm text-purple-900 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                      {previewResults.llmRewrittenContent}
                    </div>
                  </div>
                )}

                {/* Results list */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      Sources ({previewResults.results.length} results)
                    </span>
                    {previewResults.searchDepth === "detailed" && (
                      <span className="text-xs text-purple-600">
                        ({Math.round(previewResults.results.reduce((sum, r) => sum + (r.rawContent?.length || r.content.length), 0) / 1000)}k chars)
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {previewResults.results.map((result, i) => {
                      const isExpanded = expandedArticles.has(i);
                      const hasFullContent = !!result.rawContent;

                      return (
                        <div
                          key={i}
                          className="p-3 bg-muted/50 rounded-lg border"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {i + 1}. {result.title}
                            </h4>
                            <div className="flex items-center gap-1 shrink-0">
                              {hasFullContent && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  {Math.round((result.rawContent?.length || 0) / 1000)}k
                                </Badge>
                              )}
                              {result.publishedDate && (
                                <Badge variant="outline" className="text-xs">
                                  {result.publishedDate}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline line-clamp-1 mb-2 block"
                          >
                            {result.url}
                          </a>

                          {/* Content display */}
                          {hasFullContent ? (
                            <div>
                              <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-3"}`}>
                                {isExpanded ? result.rawContent : result.content}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-6 text-xs text-purple-600 hover:text-purple-700 px-2"
                                onClick={() => {
                                  const newExpanded = new Set(expandedArticles);
                                  if (isExpanded) {
                                    newExpanded.delete(i);
                                  } else {
                                    newExpanded.add(i);
                                  }
                                  setExpandedArticles(newExpanded);
                                }}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Show full article ({Math.round((result.rawContent?.length || 0) / 1000)}k chars)
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {result.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Info box */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                  <p className="text-amber-800">
                    <strong>How it works:</strong> When a user joins this practice session,
                    Tavily will fetch fresh news/information and inject it into the avatar&apos;s
                    context. The avatar will be able to discuss this current information naturally.
                    {previewResults.searchDepth === "detailed" && (
                      <span className="block mt-1 text-purple-700">
                        <strong>Detailed mode:</strong> Full article text is included, giving the avatar deep knowledge of each source.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
