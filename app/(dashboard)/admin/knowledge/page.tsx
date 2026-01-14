"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Plus,
  Upload,
  FileText,
  Trash2,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link as LinkIcon,
  Youtube,
  Globe,
  FileType,
  Eye,
  File,
  ScanText,
  RefreshCw,
  FileDown,
  Share2,
  Copy,
  Code2,
  FileCode,
  Presentation,
  Download,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  Settings2,
  Zap,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function KnowledgeManagementPage() {
  const knowledgeBases = useQuery(api.knowledgeBases.list);
  const [showCreator, setShowCreator] = useState(false);
  const [showWebGenerator, setShowWebGenerator] = useState(false);
  const [selectedKB, setSelectedKB] = useState<Id<"knowledgeBases"> | null>(null);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Knowledge Management</h2>
            <p className="text-muted-foreground">
              Create knowledge bases and upload documents, YouTube videos, or web pages for your AI avatars.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowWebGenerator(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate from Web
            </Button>
            <Button onClick={() => setShowCreator(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Knowledge Base
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Knowledge Bases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Database className="w-8 h-8 text-blue-500" />
                <span className="text-3xl font-bold">{knowledgeBases?.length ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <span className="text-3xl font-bold">
                  {knowledgeBases?.filter(kb => kb.status === "active").length ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-purple-500" />
                <span className="text-3xl font-bold">
                  {knowledgeBases?.reduce((acc, kb) => acc + kb.sources.length, 0) ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Base List */}
        <div className="space-y-4">
          {knowledgeBases?.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Knowledge Bases Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first knowledge base to start adding content for your avatars.
                </p>
                <Button onClick={() => setShowCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Knowledge Base
                </Button>
              </CardContent>
            </Card>
          )}

          {knowledgeBases?.map((kb) => (
            <KnowledgeBaseCard
              key={kb._id}
              knowledgeBase={kb}
              isExpanded={selectedKB === kb._id}
              onToggle={() => setSelectedKB(selectedKB === kb._id ? null : kb._id)}
            />
          ))}
        </div>

        {/* Creator Modal */}
        {showCreator && (
          <KnowledgeBaseCreator onClose={() => setShowCreator(false)} />
        )}

        {/* Web Generator Modal */}
        {showWebGenerator && (
          <WebGeneratorModal onClose={() => setShowWebGenerator(false)} />
        )}
      </div>
    </div>
  );
}

function KnowledgeBaseCard({
  knowledgeBase,
  isExpanded,
  onToggle,
}: {
  knowledgeBase: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const deleteKB = useMutation(api.knowledgeBases.remove);
  const updateStatus = useMutation(api.knowledgeBases.updateStatus);
  const contents = useQuery(
    api.knowledgeBases.getContent,
    isExpanded ? { knowledgeBaseId: knowledgeBase._id } : "skip"
  );

  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState<"file" | "url" | "text" | null>(null);
  const [viewingContent, setViewingContent] = useState<any>(null);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this knowledge base?")) return;
    setIsDeleting(true);
    try {
      await deleteKB({ id: knowledgeBase._id });
      toast.success("Knowledge base deleted");
    } catch (error) {
      toast.error("Failed to delete knowledge base");
    }
    setIsDeleting(false);
  };

  const handleActivate = async () => {
    try {
      await updateStatus({
        knowledgeBaseId: knowledgeBase._id,
        status: "active",
      });
      toast.success("Knowledge base activated");
    } catch (error) {
      toast.error("Failed to activate");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    indexing: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    indexing: <Loader2 className="w-3 h-3 animate-spin" />,
    active: <CheckCircle2 className="w-3 h-3" />,
    error: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{knowledgeBase.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{knowledgeBase.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={statusColors[knowledgeBase.status] || "bg-gray-100"}>
              <span className="flex items-center gap-1">
                {statusIcons[knowledgeBase.status]}
                {knowledgeBase.status}
              </span>
            </Badge>
            <Badge variant="outline">
              {knowledgeBase.sources.length} item{knowledgeBase.sources.length !== 1 ? "s" : ""}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="border-t pt-4 space-y-4">
            {/* Add Content Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={showAddPanel === "file" ? "default" : "outline"}
                onClick={() => setShowAddPanel(showAddPanel === "file" ? null : "file")}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload File
              </Button>
              <Button
                size="sm"
                variant={showAddPanel === "url" ? "default" : "outline"}
                onClick={() => setShowAddPanel(showAddPanel === "url" ? null : "url")}
              >
                <LinkIcon className="w-4 h-4 mr-1" />
                Add URL
              </Button>
              <Button
                size="sm"
                variant={showAddPanel === "text" ? "default" : "outline"}
                onClick={() => setShowAddPanel(showAddPanel === "text" ? null : "text")}
              >
                <FileText className="w-4 h-4 mr-1" />
                Add Text
              </Button>
            </div>

            {/* Add Panels */}
            {showAddPanel === "file" && (
              <FileUploadPanel
                knowledgeBaseId={knowledgeBase._id}
                onClose={() => setShowAddPanel(null)}
              />
            )}
            {showAddPanel === "url" && (
              <UrlAddPanel
                knowledgeBaseId={knowledgeBase._id}
                onClose={() => setShowAddPanel(null)}
              />
            )}
            {showAddPanel === "text" && (
              <TextAddPanel
                knowledgeBaseId={knowledgeBase._id}
                onClose={() => setShowAddPanel(null)}
              />
            )}

            {/* Content List */}
            <div>
              <h4 className="font-medium mb-3">Content ({contents?.length ?? 0})</h4>

              {(!contents || contents.length === 0) ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No content added yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload files, add URLs, or paste text content
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contents.map((content: any) => (
                    <ContentItem
                      key={content._id}
                      content={content}
                      onView={() => setViewingContent(content)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t">
              {knowledgeBase.status === "pending" && (
                <Button size="sm" onClick={handleActivate}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Activate
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Content Viewer Modal */}
          {viewingContent && (
            <ContentViewer
              content={viewingContent}
              onClose={() => setViewingContent(null)}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}

// File Upload Panel
function FileUploadPanel({
  knowledgeBaseId,
  onClose,
}: {
  knowledgeBaseId: Id<"knowledgeBases">;
  onClose: () => void;
}) {
  const generateUploadUrl = useMutation(api.knowledgeBases.generateUploadUrl);
  const addFileSource = useMutation(api.knowledgeBases.addFileSource);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Create a synthetic event to reuse the existing handler
      const syntheticEvent = {
        target: { files: e.dataTransfer.files }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowedTypes: Record<string, "pdf" | "powerpoint" | "markdown" | "text"> = {
      pdf: "pdf",
      pptx: "powerpoint",
      ppt: "powerpoint",
      md: "markdown",
      txt: "text",
    };

    const fileType = allowedTypes[extension || ""];
    if (!fileType) {
      toast.error("Unsupported file type. Please upload PDF, PowerPoint, Markdown, or Text files.");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Getting upload URL...");

    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      setUploadProgress("Uploading file...");
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { storageId } = await response.json();

      // Add source to knowledge base
      setUploadProgress("Processing file...");
      const result = await addFileSource({
        knowledgeBaseId,
        storageId,
        fileName: file.name,
        fileType,
      });

      // Trigger processing
      setUploadProgress("Extracting content...");
      const processResponse = await fetch("/api/knowledge/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: result.contentId,
          storageId,
          fileType,
        }),
      });

      if (!processResponse.ok) {
        const error = await processResponse.json();
        throw new Error(error.error || "Processing failed");
      }

      toast.success("File uploaded and processed successfully!");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium">Upload File</h5>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.pptx,.ppt,.md,.txt"
          className="hidden"
        />

        {isUploading ? (
          <div className="py-4">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{uploadProgress}</p>
          </div>
        ) : (
          <>
            <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium mb-2">
              {isDragOver ? "Drop file here" : "Drag and drop a file here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button
              type="button"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mb-3"
            >
              <File className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground">
              Supported: PDF, PowerPoint (.pptx), Markdown (.md), Text (.txt)
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// URL Add Panel
function UrlAddPanel({
  knowledgeBaseId,
  onClose,
}: {
  knowledgeBaseId: Id<"knowledgeBases">;
  onClose: () => void;
}) {
  const addUrlSource = useMutation(api.knowledgeBases.addUrlSource);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  const handleSubmit = async () => {
    if (!url || !title) {
      toast.error("URL and title are required");
      return;
    }

    setIsProcessing(true);
    try {
      const urlType = isYouTube ? "youtube" : "webpage";

      // Add source
      const result = await addUrlSource({
        knowledgeBaseId,
        url,
        title,
        urlType,
      });

      // Process URL
      const endpoint = isYouTube ? "/api/knowledge/youtube" : "/api/knowledge/webpage";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: result.contentId,
          url,
          title,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Processing failed");
      }

      toast.success(`${isYouTube ? "YouTube video" : "Webpage"} added successfully!`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add URL");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium">Add URL</h5>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">URL *</label>
          <div className="relative mt-1">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 pl-9 border rounded-lg bg-background"
              placeholder="https://youtube.com/watch?v=... or https://example.com/article"
            />
            {isYouTube ? (
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            ) : (
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isYouTube
              ? "YouTube video - transcript will be extracted"
              : "Web page - content will be extracted"}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            placeholder="e.g., Grammar Tutorial Video"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? "Processing..." : "Add URL"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// Text Add Panel
function TextAddPanel({
  knowledgeBaseId,
  onClose,
}: {
  knowledgeBaseId: Id<"knowledgeBases">;
  onClose: () => void;
}) {
  const addTextContent = useMutation(api.knowledgeBases.addTextContent);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !content) {
      toast.error("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await addTextContent({
        knowledgeBaseId,
        title,
        content,
        category: category || undefined,
      });
      toast.success("Content added successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to add content");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium">Add Text Content</h5>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            placeholder="e.g., Present Perfect Tense Rules"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Category (optional)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            placeholder="e.g., Grammar"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Content * (Markdown supported)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
            rows={8}
            placeholder="# Grammar Rule&#10;&#10;The present perfect tense is used when...&#10;&#10;## Examples&#10;- I have visited Paris.&#10;- She has finished her homework."
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Content
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// Content Item
function ContentItem({
  content,
  onView,
}: {
  content: any;
  onView: () => void;
}) {
  const deleteContent = useMutation(api.knowledgeBases.deleteContent);
  const generateShareLink = useMutation(api.knowledgeBases.generateShareLink);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [isRestructuring, setIsRestructuring] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPptx, setIsGeneratingPptx] = useState(false);
  const [isDownloadingPptx, setIsDownloadingPptx] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  // Fetch presentation data if presentationId exists
  const presentation = useQuery(
    api.presentations.getPresentation,
    content.presentationId ? { presentationId: content.presentationId } : "skip"
  );
  const [showJsonViewer, setShowJsonViewer] = useState(false);
  const [showHtmlSlidesViewer, setShowHtmlSlidesViewer] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this content?")) return;
    setIsDeleting(true);
    try {
      await deleteContent({ contentId: content._id });
      toast.success("Content deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
    setIsDeleting(false);
  };

  const handleOcrReprocess = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!content.storageId) {
      toast.error("No file available for OCR processing");
      return;
    }

    setIsOcrProcessing(true);
    try {
      const response = await fetch("/api/knowledge/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: content._id,
          storageId: content.storageId,
          fileType: content.contentType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "OCR processing failed");
      }

      const result = await response.json();
      toast.success(`OCR complete! Extracted ${result.wordCount} words with AI cleanup`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OCR processing failed");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleRestructure = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!content.content) {
      toast.error("No content available to restructure");
      return;
    }

    setIsRestructuring(true);
    try {
      const response = await fetch("/api/knowledge/restructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: content._id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Restructuring failed");
      }

      const result = await response.json();
      toast.success(`Lesson restructured! "${result.title}" with ${result.exerciseCount} exercises`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restructuring failed");
    } finally {
      setIsRestructuring(false);
    }
  };

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (content.pdfUrl) {
      window.open(content.pdfUrl, "_blank");
    } else {
      toast.info("Generating PDF...");
      setIsGeneratingPdf(true);
      try {
        const response = await fetch("/api/knowledge/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: content._id }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "PDF generation failed");
        }

        toast.success("PDF generated! Refreshing...");
        // The page will re-render with the new pdfUrl
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "PDF generation failed");
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  };

  const handleGeneratePptx = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (content.presentationId) {
      // Presentation already exists, could link to it or show message
      toast.success("PowerPoint already generated!");
      return;
    }

    toast.info("Generating PowerPoint...");
    setIsGeneratingPptx(true);
    try {
      const response = await fetch("/api/knowledge/generate-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content._id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "PPTX generation failed");
      }

      const result = await response.json();
      toast.success(`PowerPoint generated! ${result.slideCount} slides created.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PPTX generation failed");
    } finally {
      setIsGeneratingPptx(false);
    }
  };

  const handleDownloadPptx = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Get the slide URL from presentation
    const slideUrl = presentation?.slides?.[0]?.url;
    if (!slideUrl) {
      toast.error("No PowerPoint file available");
      return;
    }

    // Open the URL directly - browser will download PPTX files
    window.open(slideUrl, "_blank");
    toast.success("Download started!");
  };

  const handleGenerateShareLink = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (content.shareToken) {
      // Copy existing share link
      const shareUrl = `${window.location.origin}/lessons/${content.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
      return;
    }

    setIsGeneratingShare(true);
    try {
      const result = await generateShareLink({ contentId: content._id });
      const shareUrl = `${window.location.origin}/lessons/${result.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link created and copied!");
    } catch (error) {
      toast.error("Failed to generate share link");
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleViewJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowJsonViewer(true);
  };

  const typeIcons: Record<string, React.ReactNode> = {
    pdf: <FileType className="w-4 h-4 text-red-500" />,
    powerpoint: <FileType className="w-4 h-4 text-orange-500" />,
    markdown: <FileText className="w-4 h-4 text-blue-500" />,
    text: <FileText className="w-4 h-4 text-gray-500" />,
    youtube: <Youtube className="w-4 h-4 text-red-500" />,
    webpage: <Globe className="w-4 h-4 text-green-500" />,
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    generating_pdf: "bg-purple-100 text-purple-700",
  };

  // Show OCR button for PDFs and PowerPoints that have a storageId
  const canOcr = content.storageId && (content.contentType === "pdf" || content.contentType === "powerpoint");
  // Show Restructure button for documents with content but no jsonContent, or to regenerate
  const canRestructure = content.content && content.processingStatus === "completed";
  const hasJsonContent = content.jsonContent != null;
  const hasPdf = content.pdfUrl != null;
  const hasPptx = content.presentationId != null;
  const hasHtmlSlides = content.htmlSlides && content.htmlSlides.length > 0;

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          {typeIcons[content.contentType] || <File className="w-4 h-4" />}
          <div>
            <p className="font-medium text-sm">{content.title}</p>
            <p className="text-xs text-muted-foreground">
              {content.contentType}
              {content.metadata?.wordCount && ` • ${content.metadata.wordCount} words`}
              {content.metadata?.exerciseCount && ` • ${content.metadata.exerciseCount} exercises`}
              {content.metadata?.vocabularyCount && ` • ${content.metadata.vocabularyCount} vocab`}
              {content.metadata?.level && ` • ${content.metadata.level}`}
              {content.metadata?.usedOcr && " • OCR"}
              {content.metadata?.aiCleaned && " • AI"}
              {hasPdf && " • PDF"}
              {hasPptx && " • PPTX"}
              {hasHtmlSlides && ` • ${content.htmlSlides.length} slides`}
              {content.shareToken && " • Shared"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge className={statusColors[content.processingStatus] || "bg-gray-100"}>
            {content.processingStatus}
          </Badge>

          {/* OCR Reprocess Button */}
          {canOcr && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOcrReprocess}
              disabled={isOcrProcessing}
              title="Re-extract with OCR + AI structuring"
            >
              {isOcrProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ScanText className="w-4 h-4 text-blue-500" />
              )}
            </Button>
          )}

          {/* Restructure Button (for legacy content or to regenerate) */}
          {canRestructure && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRestructure}
              disabled={isRestructuring}
              title={hasJsonContent ? "Regenerate structured content with AI" : "Create structured content with AI"}
            >
              {isRestructuring ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className={`w-4 h-4 ${hasJsonContent ? "text-purple-500" : "text-orange-500"}`} />
              )}
            </Button>
          )}

          {/* View JSON Button */}
          {hasJsonContent && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewJson}
              title="View structured JSON"
            >
              <FileCode className="w-4 h-4 text-purple-500" />
            </Button>
          )}

          {/* PDF Download Button */}
          {content.processingStatus === "completed" && hasJsonContent && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title={hasPdf ? "Download PDF" : "Generate PDF"}
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className={`w-4 h-4 ${hasPdf ? "text-green-500" : "text-gray-400"}`} />
              )}
            </Button>
          )}

          {/* PPTX Generation Button */}
          {content.processingStatus === "completed" && hasJsonContent && !hasPptx && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGeneratePptx}
              disabled={isGeneratingPptx}
              title="Generate PowerPoint"
            >
              {isGeneratingPptx ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Presentation className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          )}

          {/* PPTX Download Button */}
          {hasPptx && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownloadPptx}
              disabled={isDownloadingPptx}
              title="Download PowerPoint"
            >
              {isDownloadingPptx ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-orange-500" />
              )}
            </Button>
          )}

          {/* HTML Slides Preview Button */}
          {hasHtmlSlides && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowHtmlSlidesViewer(true);
              }}
              title={`Preview ${content.htmlSlides.length} HTML slides`}
            >
              <Layers className="w-4 h-4 text-indigo-500" />
            </Button>
          )}

          {/* Share Link Button */}
          {content.processingStatus === "completed" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerateShareLink}
              disabled={isGeneratingShare}
              title={content.shareToken ? "Copy share link" : "Generate share link"}
            >
              {isGeneratingShare ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : content.shareToken ? (
                <Copy className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          )}

          {/* View Content Button */}
          {content.processingStatus === "completed" && (
            <Button size="sm" variant="ghost" onClick={onView} title="View content">
              <Eye className="w-4 h-4" />
            </Button>
          )}

          {/* Delete Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-destructive" />
            )}
          </Button>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {showJsonViewer && (
        <JsonViewer
          jsonContent={content.jsonContent}
          title={content.title}
          onClose={() => setShowJsonViewer(false)}
        />
      )}

      {/* HTML Slides Viewer Modal */}
      {showHtmlSlidesViewer && hasHtmlSlides && (
        <HtmlSlidesViewer
          slides={content.htmlSlides}
          title={content.title}
          onClose={() => setShowHtmlSlidesViewer(false)}
        />
      )}
    </>
  );
}

// HTML Slides Viewer Modal
function HtmlSlidesViewer({
  slides,
  title,
  onClose,
}: {
  slides: Array<{
    index: number;
    html: string;
    title?: string;
    type: string;
    speakerNotes?: string;
    teachingPrompt?: string;
  }>;
  title: string;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSlide = slides[currentIndex];

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, slides.length]);

  const typeColors: Record<string, string> = {
    title: "bg-blue-100 text-blue-700",
    objectives: "bg-green-100 text-green-700",
    content: "bg-gray-100 text-gray-700",
    grammar: "bg-amber-100 text-amber-700",
    vocabulary: "bg-purple-100 text-purple-700",
    exercise: "bg-orange-100 text-orange-700",
    summary: "bg-indigo-100 text-indigo-700",
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] flex flex-col bg-white">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-indigo-500" />
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={typeColors[currentSlide?.type] || "bg-gray-100"}>
                    {currentSlide?.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Slide {currentIndex + 1} of {slides.length}
                  </span>
                  {currentSlide?.title && (
                    <span className="text-sm font-medium">
                      — {currentSlide.title}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          {/* Slide Preview - Full height, clean presentation */}
          <div className="flex-1 bg-black p-4 flex items-center justify-center">
            <div className="w-full max-w-5xl aspect-video bg-white rounded-lg shadow-2xl overflow-hidden">
              <iframe
                srcDoc={currentSlide?.html}
                title={`Slide ${currentIndex + 1}`}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="border-t p-4 flex items-center justify-between bg-white">
            <Button
              variant="outline"
              onClick={goToPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {/* Slide Thumbnails */}
            <div className="flex gap-1 overflow-x-auto max-w-md px-2">
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 w-10 h-6 rounded text-xs font-medium transition-all ${
                    idx === currentIndex
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={currentIndex === slides.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// JSON Viewer Modal
function JsonViewer({
  jsonContent,
  title,
  onClose,
}: {
  jsonContent: any;
  title: string;
  onClose: () => void;
}) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(jsonContent, null, 2));
    toast.success("JSON copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-500" />
                Structured Content: {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {jsonContent?.content?.exercises?.length || 0} exercises •
                {jsonContent?.content?.vocabulary?.length || 0} vocabulary •
                {jsonContent?.content?.grammarRules?.length || 0} grammar rules
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded-lg overflow-auto">
            {JSON.stringify(jsonContent, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

// Content Viewer Modal
function ContentViewer({
  content,
  onClose,
}: {
  content: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{content.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {content.contentType}
                {content.metadata?.wordCount && ` • ${content.metadata.wordCount} words`}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto">
              {content.content}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Knowledge Base Creator Modal
function KnowledgeBaseCreator({ onClose }: { onClose: () => void }) {
  const createKB = useMutation(api.knowledgeBases.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    primaryTopic: "",
    language: "en" as "en" | "de" | "multi",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.primaryTopic) {
      toast.error("Name and primary topic are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createKB({
        name: formData.name,
        description: formData.description,
        domain: {
          primaryTopic: formData.primaryTopic,
          language: formData.language,
        },
      });
      toast.success("Knowledge base created!");
      onClose();
    } catch (error) {
      toast.error("Failed to create knowledge base");
      console.error(error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create Knowledge Base</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="e.g., English Grammar, Business English"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                rows={2}
                placeholder="What kind of content will this knowledge base contain?"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Primary Topic *</label>
              <input
                type="text"
                value={formData.primaryTopic}
                onChange={(e) => setFormData({ ...formData, primaryTopic: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="e.g., English Grammar Rules"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="multi">Multilingual</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Web Generator Modal - Generate knowledge base from web scraping
interface SubtopicProgress {
  name: string;
  status: string;
  sourceCount: number;
  wordCount: number;
}

interface GenerationProgress {
  type: string;
  phase: string;
  status: string;
  currentSubtopic: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  subtopics: SubtopicProgress[];
  stats: {
    totalSources: number;
    totalWords: number;
  };
  errorMessage?: string;
}

function WebGeneratorModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [topic, setTopic] = useState("");
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [newSubtopic, setNewSubtopic] = useState("");
  const [depth, setDepth] = useState<1 | 2 | 3>(2);
  const [maxSources, setMaxSources] = useState(5);
  const [includeExercises, setIncludeExercises] = useState(true);
  const [targetLevel, setTargetLevel] = useState("B1");
  const [language, setLanguage] = useState<"en" | "de">("en");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const addSubtopic = () => {
    if (newSubtopic.trim() && !subtopics.includes(newSubtopic.trim())) {
      setSubtopics([...subtopics, newSubtopic.trim()]);
      setNewSubtopic("");
    }
  };

  const removeSubtopic = (index: number) => {
    setSubtopics(subtopics.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    if (mode === "advanced" && subtopics.length === 0) {
      toast.error("Please add at least one subtopic in advanced mode");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(null);

    try {
      const response = await fetch("/api/knowledge/generate-from-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          mode,
          subtopics: mode === "advanced" ? subtopics : undefined,
          depth,
          maxSourcesPerSubtopic: maxSources,
          includeExercises,
          targetLevel,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start generation");
      }

      const data = await response.json();
      setJobId(data.jobId);

      // Start SSE for progress updates
      const eventSource = new EventSource(
        `/api/knowledge/generate-from-web/progress?jobId=${data.jobId}`
      );
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const progressData = JSON.parse(event.data);
          setProgress(progressData);

          if (progressData.type === "complete") {
            toast.success("Knowledge base generated successfully!");
            eventSource.close();
            setTimeout(() => {
              onClose();
            }, 2000);
          } else if (progressData.type === "error") {
            setError(progressData.errorMessage || progressData.message);
            eventSource.close();
            setIsGenerating(false);
          } else if (progressData.type === "cancelled") {
            setError("Generation was cancelled");
            eventSource.close();
            setIsGenerating(false);
          }
        } catch (e) {
          console.error("Failed to parse SSE message:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (!progress || progress.type !== "complete") {
          setError("Connection lost. Check the job status.");
          setIsGenerating(false);
        }
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to start generation");
      setIsGenerating(false);
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;

    try {
      await fetch(`/api/knowledge/generate-from-web?jobId=${jobId}`, {
        method: "DELETE",
      });
      toast.info("Cancellation requested");
    } catch (error) {
      toast.error("Failed to cancel");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    discovering: "bg-blue-100 text-blue-700",
    scraping: "bg-amber-100 text-amber-700",
    synthesizing: "bg-purple-100 text-purple-700",
    optimizing: "bg-indigo-100 text-indigo-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  const subtopicStatusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3 text-gray-400" />,
    scraping: <Search className="w-3 h-3 text-amber-500 animate-pulse" />,
    synthesizing: <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />,
    optimizing: <Zap className="w-3 h-3 text-indigo-500 animate-pulse" />,
    completed: <CheckCircle className="w-3 h-3 text-green-500" />,
    failed: <XCircle className="w-3 h-3 text-red-500" />,
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <CardTitle>Generate Knowledge Base from Web</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isGenerating && !error}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Automatically search and compile comprehensive educational content from the web.
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          {!isGenerating ? (
            <div className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setMode("simple")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    mode === "simple"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Simple Mode
                </button>
                <button
                  onClick={() => setMode("advanced")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    mode === "advanced"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Settings2 className="w-4 h-4 inline mr-2" />
                  Advanced Mode
                </button>
              </div>

              {/* Topic Input */}
              <div>
                <label className="text-sm font-medium">Topic *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="e.g., English Present Perfect Tense, Business Email Writing"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "simple"
                    ? "AI will automatically discover subtopics and create comprehensive content"
                    : "Specify your own subtopics for targeted content generation"}
                </p>
              </div>

              {/* Advanced Mode: Subtopics */}
              {mode === "advanced" && (
                <div>
                  <label className="text-sm font-medium">Subtopics *</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={newSubtopic}
                      onChange={(e) => setNewSubtopic(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSubtopic())}
                      className="flex-1 px-3 py-2 border rounded-lg bg-background"
                      placeholder="Add a subtopic..."
                    />
                    <Button type="button" onClick={addSubtopic} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {subtopics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {subtopics.map((st, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="py-1 px-2 flex items-center gap-1"
                        >
                          {st}
                          <button
                            onClick={() => removeSubtopic(idx)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Configuration Grid */}
              <div className="grid grid-cols-2 gap-4">
                {mode === "simple" && (
                  <div>
                    <label className="text-sm font-medium">Depth</label>
                    <select
                      value={depth}
                      onChange={(e) => setDepth(Number(e.target.value) as 1 | 2 | 3)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value={1}>Basic (3-5 subtopics)</option>
                      <option value={2}>Standard (5-8 subtopics)</option>
                      <option value={3}>Comprehensive (8-12 subtopics)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Sources per Subtopic</label>
                  <select
                    value={maxSources}
                    onChange={(e) => setMaxSources(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value={3}>3 sources (faster)</option>
                    <option value={5}>5 sources (balanced)</option>
                    <option value={8}>8 sources (comprehensive)</option>
                    <option value={10}>10 sources (thorough)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Target Level</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Proficient</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "en" | "de")}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="en">English</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeExercises"
                  checked={includeExercises}
                  onChange={(e) => setIncludeExercises(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="includeExercises" className="text-sm">
                  Include practice exercises and quizzes
                </label>
              </div>

              {/* Estimate */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Estimated time:</span>
                  <span className="font-medium">
                    {mode === "advanced"
                      ? `${Math.ceil(subtopics.length * 2)} minutes`
                      : `${Math.ceil(depth * 5 * 2)} minutes`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Content will be scraped from authoritative sources and synthesized with AI
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Knowledge Base
                </Button>
              </div>
            </div>
          ) : (
            /* Progress View */
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-amber-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium">{topic}</h3>
                <p className="text-sm text-muted-foreground">
                  {progress?.phase || "Starting generation..."}
                </p>
              </div>

              {/* Overall Progress */}
              {progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">{progress.progress.percentage}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${progress.progress.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {progress.progress.current} / {progress.progress.total} subtopics
                    </span>
                    <Badge className={statusColors[progress.status] || "bg-gray-100"}>
                      {progress.status}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Stats */}
              {progress?.stats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {progress.stats.totalSources}
                    </div>
                    <div className="text-xs text-muted-foreground">Sources Found</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {progress.stats.totalWords.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Words Generated</div>
                  </div>
                </div>
              )}

              {/* Subtopics Progress */}
              {progress?.subtopics && progress.subtopics.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Subtopics</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {progress.subtopics.map((st, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                          st.status === progress.currentSubtopic
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {subtopicStatusIcons[st.status] || (
                            <Clock className="w-3 h-3 text-gray-400" />
                          )}
                          <span className={st.status === "completed" ? "text-green-700" : ""}>
                            {st.name}
                          </span>
                        </div>
                        {st.status === "completed" && (
                          <span className="text-xs text-muted-foreground">
                            {st.sourceCount} sources • {st.wordCount.toLocaleString()} words
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700">Generation Failed</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center gap-2 pt-2">
                {progress?.type !== "complete" && !error && (
                  <Button variant="outline" onClick={handleCancel}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                {(progress?.type === "complete" || error) && (
                  <Button onClick={onClose}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {progress?.type === "complete" ? "Done" : "Close"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
