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
  Edit3,
  BookMarked,
  Activity,
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
            placeholder="e.g., Introduction to Machine Learning"
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
            placeholder="# Topic Overview&#10;&#10;Introduction to the concept...&#10;&#10;## Key Points&#10;- Point one&#10;- Point two&#10;&#10;## Examples&#10;..."
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
  const [showEditModal, setShowEditModal] = useState(false);

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

          {/* Edit Content Button */}
          {content.processingStatus === "completed" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              title="Edit content"
            >
              <Edit3 className="w-4 h-4 text-blue-500" />
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

      {/* Edit Content Modal */}
      {showEditModal && (
        <EditContentModal
          content={content}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}

// Edit Content Modal
function EditContentModal({
  content,
  onClose,
}: {
  content: any;
  onClose: () => void;
}) {
  const editContent = useMutation(api.knowledgeBases.editContent);
  const [title, setTitle] = useState(content.title || "");
  const [markdownContent, setMarkdownContent] = useState(content.content || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      await editContent({
        contentId: content._id,
        title: title.trim(),
        content: markdownContent,
      });
      toast.success("Content updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update content");
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = markdownContent.split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-500" />
              <CardTitle>Edit Content</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Edit the title and content. Changes will be saved to the knowledge base.
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              placeholder="Content title"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Content (Markdown)</label>
              <span className="text-xs text-muted-foreground">
                {wordCount.toLocaleString()} words
              </span>
            </div>
            <textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-sm min-h-[400px]"
              placeholder="Markdown content..."
            />
          </div>

          {/* Source info */}
          {content.webSources && content.webSources.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Generated from {content.webSources.length} web sources
              </p>
              <div className="flex flex-wrap gap-1">
                {content.webSources.slice(0, 5).map((source: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {source.domain}
                  </Badge>
                ))}
                {content.webSources.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{content.webSources.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
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

// Scale presets matching the orchestrator
const SCALE_PRESETS = {
  quick: { subtopics: 5, sources: 5, description: "Quick overview", estimate: "~5 min" },
  standard: { subtopics: 12, sources: 10, description: "Balanced coverage", estimate: "~15 min" },
  comprehensive: { subtopics: 25, sources: 15, description: "In-depth", estimate: "~45 min" },
  book: { subtopics: 50, sources: 20, description: "Full book", estimate: "~2 hours" },
};

type GenerationScale = "quick" | "standard" | "comprehensive" | "book";

function WebGeneratorModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [topic, setTopic] = useState("");
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [newSubtopic, setNewSubtopic] = useState("");
  const [scale, setScale] = useState<GenerationScale>("standard");
  const [includeExercises, setIncludeExercises] = useState(true);
  const [language, setLanguage] = useState<"en" | "de" | "multi">("multi");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");

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

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    if (newUrl.trim() && !referenceUrls.includes(newUrl.trim())) {
      // Basic URL validation
      try {
        new URL(newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`);
        setReferenceUrls([...referenceUrls, newUrl.trim()]);
        setNewUrl("");
      } catch {
        toast.error("Please enter a valid URL");
      }
    }
  };

  const removeUrl = (index: number) => {
    setReferenceUrls(referenceUrls.filter((_, i) => i !== index));
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
      const scaleConfig = SCALE_PRESETS[scale];
      const response = await fetch("/api/knowledge/generate-from-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          mode,
          subtopics: mode === "advanced" ? subtopics : undefined,
          scale,
          depth: scale === "quick" ? 1 : scale === "standard" ? 2 : 3,
          maxSourcesPerSubtopic: scaleConfig.sources,
          includeExercises,
          language,
          tags: tags.length > 0 ? tags : undefined,
          referenceUrls: referenceUrls.length > 0 ? referenceUrls : undefined,
          broadSearch: scale === "comprehensive" || scale === "book",
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
                  placeholder="e.g., Project Management, Machine Learning, Business Strategy"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "simple"
                    ? "AI will automatically discover subtopics and create comprehensive content"
                    : "Specify your own subtopics for targeted content generation"}
                </p>
              </div>

              {/* Tags Input */}
              <div>
                <label className="text-sm font-medium">Tags (for categorization)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border rounded-lg bg-background"
                    placeholder="Add a tag..."
                  />
                  <Button type="button" onClick={addTag} size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="py-1 px-2 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(idx)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Reference URLs */}
              <div>
                <label className="text-sm font-medium">Reference URLs (optional)</label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                      className="w-full px-3 py-2 pl-9 border rounded-lg bg-background"
                      placeholder="https://example.com/article"
                    />
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <Button type="button" onClick={addUrl} size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Add specific URLs you want to include as reference sources
                </p>
                {referenceUrls.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {referenceUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm"
                      >
                        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate flex-1">{url}</span>
                        <button
                          onClick={() => removeUrl(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

              {/* Scale Selector */}
              {mode === "simple" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Generation Scale</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(SCALE_PRESETS) as [GenerationScale, typeof SCALE_PRESETS[GenerationScale]][]).map(
                      ([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setScale(key)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            scale === key
                              ? "border-amber-500 bg-amber-50"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium capitalize">{key}</span>
                            <span className="text-xs text-muted-foreground">{preset.estimate}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {preset.description}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            ~{preset.subtopics} topics • {preset.sources} sources each
                          </p>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Additional Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Content Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "en" | "de" | "multi")}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="multi">Any Language</option>
                    <option value="en">English Only</option>
                    <option value="de">German Only</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      id="includeExercises"
                      checked={includeExercises}
                      onChange={(e) => setIncludeExercises(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="includeExercises" className="text-sm">
                      Include exercises
                    </label>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-900">Generation Summary</span>
                  </div>
                  <Badge variant="outline" className="bg-white border-amber-300 text-amber-700">
                    {mode === "advanced" ? `${subtopics.length} custom topics` : SCALE_PRESETS[scale].description}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-lg font-bold text-amber-600">
                      {mode === "advanced" ? subtopics.length : SCALE_PRESETS[scale].subtopics}
                    </div>
                    <div className="text-xs text-muted-foreground">Topics</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-lg font-bold text-orange-600">
                      ~{mode === "advanced"
                        ? subtopics.length * SCALE_PRESETS[scale].sources
                        : SCALE_PRESETS[scale].subtopics * SCALE_PRESETS[scale].sources}
                    </div>
                    <div className="text-xs text-muted-foreground">Sources</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-lg font-bold text-purple-600">
                      {mode === "advanced"
                        ? `~${Math.ceil(subtopics.length * 3)} min`
                        : SCALE_PRESETS[scale].estimate}
                    </div>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>
                </div>

                {(tags.length > 0 || referenceUrls.length > 0) && (
                  <div className="text-xs text-amber-700 flex items-center gap-2 pt-1 border-t border-amber-200">
                    {tags.length > 0 && <span>{tags.length} tag{tags.length !== 1 ? 's' : ''}</span>}
                    {tags.length > 0 && referenceUrls.length > 0 && <span>•</span>}
                    {referenceUrls.length > 0 && <span>{referenceUrls.length} reference URL{referenceUrls.length !== 1 ? 's' : ''}</span>}
                  </div>
                )}
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
            /* Progress View - Enhanced */
            <div className="space-y-6">
              {/* Header with Large Animated Indicator */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  {/* Background ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-muted" />
                  {/* Progress ring */}
                  <svg className="absolute inset-0 w-24 h-24 -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      strokeWidth="4"
                      stroke="currentColor"
                      className="text-amber-500"
                      strokeDasharray={`${(progress?.progress.percentage || 0) * 2.76} 276`}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-amber-600">
                      {progress?.progress.percentage || 0}%
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-medium">{topic}</h3>
              </div>

              {/* Current Activity Banner */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                    {progress?.status === "discovering" && <Search className="w-5 h-5" />}
                    {progress?.status === "scraping" && <Globe className="w-5 h-5" />}
                    {progress?.status === "synthesizing" && <Sparkles className="w-5 h-5" />}
                    {progress?.status === "optimizing" && <Zap className="w-5 h-5" />}
                    {progress?.status === "completed" && <CheckCircle className="w-5 h-5" />}
                    {!progress?.status && <Loader2 className="w-5 h-5 animate-spin" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {progress?.status === "discovering" && "Discovering Topics..."}
                      {progress?.status === "scraping" && "Searching Web Sources..."}
                      {progress?.status === "synthesizing" && "Generating Content..."}
                      {progress?.status === "optimizing" && "Optimizing for Fast Retrieval..."}
                      {progress?.status === "completed" && "Generation Complete!"}
                      {progress?.status === "pending" && "Starting..."}
                      {!progress && "Initializing..."}
                    </div>
                    <div className="text-sm text-white/80">
                      {progress?.currentSubtopic
                        ? `Working on: ${progress.currentSubtopic}`
                        : progress?.phase || "Please wait..."}
                    </div>
                  </div>
                </div>

                {/* Progress bar inside banner */}
                <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress?.progress.percentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/70 mt-1">
                  <span>{progress?.progress.current || 0} / {progress?.progress.total || "?"} topics</span>
                  <span>{progress?.progress.percentage || 0}% complete</span>
                </div>
              </div>

              {/* Live Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {progress?.stats?.totalSources || 0}
                  </div>
                  <div className="text-xs text-amber-700">Sources Scraped</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(progress?.stats?.totalWords || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-700">Words Generated</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {progress?.subtopics?.filter(s => s.status === "completed").length || 0}
                  </div>
                  <div className="text-xs text-green-700">Topics Done</div>
                </div>
              </div>

              {/* Subtopics Progress List */}
              {progress?.subtopics && progress.subtopics.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Topics Progress</h4>
                    <span className="text-xs text-muted-foreground">
                      {progress.subtopics.filter(s => s.status === "completed").length} / {progress.subtopics.length} complete
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {progress.subtopics.map((st, idx) => {
                      const isActive = st.name === progress.currentSubtopic ||
                        ["scraping", "synthesizing", "optimizing"].includes(st.status);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? "bg-amber-50 border border-amber-300 shadow-sm"
                              : st.status === "completed"
                              ? "bg-green-50/50"
                              : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={isActive ? "animate-pulse" : ""}>
                              {subtopicStatusIcons[st.status] || (
                                <Clock className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                            <span className={`${st.status === "completed" ? "text-green-700" : ""} ${isActive ? "font-medium" : ""}`}>
                              {st.name}
                            </span>
                            {isActive && (
                              <span className="text-xs text-amber-600 ml-1">
                                ({st.status})
                              </span>
                            )}
                          </div>
                          {st.status === "completed" && (
                            <span className="text-xs text-green-600">
                              ✓ {st.sourceCount} sources • {st.wordCount?.toLocaleString()} words
                            </span>
                          )}
                        </div>
                      );
                    })}
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
                    Cancel Generation
                  </Button>
                )}
                {(progress?.type === "complete" || error) && (
                  <Button onClick={onClose} className={progress?.type === "complete" ? "bg-green-600 hover:bg-green-700" : ""}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {progress?.type === "complete" ? "View Knowledge Base" : "Close"}
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
