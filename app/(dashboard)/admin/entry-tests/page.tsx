"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ClipboardCheck,
  Edit,
  Trash2,
  Copy,
  Eye,
  MoreHorizontal,
  FileText,
  Send,
  Archive,
  Building2,
  Users,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type OwnershipType = "platform" | "company" | "group";
type TemplateStatus = "draft" | "published" | "archived";

// ============================================
// TEMPLATE CARD COMPONENT
// ============================================

interface TemplateCardProps {
  template: {
    _id: Id<"entryTestTemplates">;
    title: string;
    slug: string;
    description?: string;
    targetLevelRange: { min: CEFRLevel; max: CEFRLevel };
    ownership: {
      type: OwnershipType;
      companyId?: Id<"companies">;
      groupId?: Id<"groups">;
    };
    sections: Array<{ id: string; type: string; title: string }>;
    status: TemplateStatus;
    version: number;
    createdAt: number;
  };
  onEdit: (templateId: Id<"entryTestTemplates">) => void;
  onDelete: (templateId: Id<"entryTestTemplates">) => void;
  onDuplicate: (templateId: Id<"entryTestTemplates">) => void;
  onPreview: (templateId: Id<"entryTestTemplates">) => void;
  onPublish: (templateId: Id<"entryTestTemplates">) => void;
  onArchive: (templateId: Id<"entryTestTemplates">) => void;
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onPublish,
  onArchive,
}: TemplateCardProps) {
  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  };

  const ownershipIcons = {
    platform: <Globe className="h-4 w-4" />,
    company: <Building2 className="h-4 w-4" />,
    group: <Users className="h-4 w-4" />,
  };

  const levelColors: Record<CEFRLevel, string> = {
    A1: "bg-green-100 text-green-800",
    A2: "bg-lime-100 text-lime-800",
    B1: "bg-yellow-100 text-yellow-800",
    B2: "bg-orange-100 text-orange-800",
    C1: "bg-red-100 text-red-800",
    C2: "bg-purple-100 text-purple-800",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{template.title}</CardTitle>
              <CardDescription className="text-sm">
                {template.sections.length} sections
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(template._id)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template._id)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template._id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {template.status === "draft" && (
                <DropdownMenuItem onClick={() => onPublish(template._id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </DropdownMenuItem>
              )}
              {template.status !== "archived" && (
                <DropdownMenuItem onClick={() => onArchive(template._id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(template._id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {/* Description */}
        {template.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={levelColors[template.targetLevelRange.min]}>
            {template.targetLevelRange.min === template.targetLevelRange.max
              ? template.targetLevelRange.min
              : `${template.targetLevelRange.min}-${template.targetLevelRange.max}`}
          </Badge>
          <Badge variant="outline" className={statusColors[template.status]}>
            {template.status}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {ownershipIcons[template.ownership.type]}
            {template.ownership.type}
          </Badge>
        </div>

        {/* Sections summary */}
        <div className="text-xs text-muted-foreground">
          {template.sections.map((s) => s.type).join(" • ")}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(template._id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(template._id)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CREATE TEMPLATE DIALOG
// ============================================

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateTemplateDialog({ open, onOpenChange }: CreateTemplateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minLevel, setMinLevel] = useState<CEFRLevel>("A1");
  const [maxLevel, setMaxLevel] = useState<CEFRLevel>("C2");
  const [ownershipType, setOwnershipType] = useState<OwnershipType>("platform");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTemplate = useMutation(api.entryTests.createTemplate);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSubmitting(true);

    try {
      await createTemplate({
        title: title.trim(),
        description: description.trim() || undefined,
        targetLevelRange: { min: minLevel, max: maxLevel },
        ownershipType,
      });

      toast.success("Template created successfully!");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create template");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMinLevel("A1");
    setMaxLevel("C2");
    setOwnershipType("platform");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Entry Test Template</DialogTitle>
          <DialogDescription>
            Create a new entry test template. You can add sections after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cambridge English Placement Test"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A comprehensive assessment to determine student CEFR level..."
              rows={3}
            />
          </div>

          {/* Level Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Level</Label>
              <Select value={minLevel} onValueChange={(v) => setMinLevel(v as CEFRLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Level</Label>
              <Select value={maxLevel} onValueChange={(v) => setMaxLevel(v as CEFRLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ownership */}
          <div className="space-y-2">
            <Label>Template Scope</Label>
            <Select
              value={ownershipType}
              onValueChange={(v) => setOwnershipType(v as OwnershipType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="platform">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Platform-wide (Official)
                  </span>
                </SelectItem>
                <SelectItem value="company">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company-specific
                  </span>
                </SelectItem>
                <SelectItem value="group">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Group-specific
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AdminEntryTestsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOwnership, setFilterOwnership] = useState<string>("all");

  // Fetch templates
  const templates = useQuery(api.entryTests.listTemplates, {
    status: filterStatus !== "all" ? (filterStatus as TemplateStatus) : undefined,
    ownershipType: filterOwnership !== "all" ? (filterOwnership as OwnershipType) : undefined,
  });

  // Fetch question bank stats
  const pendingCount = useQuery(api.entryTestQuestionBank.getPendingCount);

  // Mutations
  const deleteTemplate = useMutation(api.entryTests.deleteTemplate);
  const publishTemplate = useMutation(api.entryTests.publishTemplate);
  const archiveTemplate = useMutation(api.entryTests.archiveTemplate);

  const handleDelete = async (templateId: Id<"entryTestTemplates">) => {
    if (!confirm("Are you sure you want to delete this template? Only draft templates can be deleted.")) return;
    try {
      await deleteTemplate({ templateId });
      toast.success("Template deleted");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete template";
      toast.error(errorMessage);
    }
  };

  const handleDuplicate = (templateId: Id<"entryTestTemplates">) => {
    // Navigate to derive page
    window.location.href = `/admin/entry-tests/${templateId}/derive`;
  };

  const handleEdit = (templateId: Id<"entryTestTemplates">) => {
    window.location.href = `/admin/entry-tests/${templateId}/edit`;
  };

  const handlePreview = (templateId: Id<"entryTestTemplates">) => {
    window.location.href = `/admin/entry-tests/${templateId}/preview`;
  };

  const handlePublish = async (templateId: Id<"entryTestTemplates">) => {
    try {
      await publishTemplate({ templateId });
      toast.success("Template published successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to publish template";
      toast.error(errorMessage);
    }
  };

  const handleArchive = async (templateId: Id<"entryTestTemplates">) => {
    try {
      await archiveTemplate({ templateId });
      toast.success("Template archived");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to archive template";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8" />
            Entry Tests
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage Cambridge English assessment tests
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/admin/entry-tests/questions")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Question Bank
            {pendingCount !== undefined && pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterOwnership} onValueChange={setFilterOwnership}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="platform">Platform</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="group">Group</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {templates === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No entry test templates yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first entry test template to assess student levels.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onPreview={handlePreview}
              onPublish={handlePublish}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateTemplateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
