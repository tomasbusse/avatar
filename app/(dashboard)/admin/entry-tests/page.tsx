"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ClipboardCheck,
  Edit,
  Trash2,
  Eye,
  Save,
  Send,
  FileJson,
  ExternalLink,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

interface PlacementTest {
  _id: Id<"placementTests">;
  title: string;
  slug: string;
  companyName?: string;
  companyLogo?: string;
  config: Record<string, unknown>;
  status: "draft" | "published";
  resultEmails?: {
    sendToCandidate: boolean;
    hrEmails?: string[];
  };
  createdAt: number;
  updatedAt: number;
}

// ============================================
// TEST CARD COMPONENT
// ============================================

interface TestCardProps {
  test: PlacementTest;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function TestCard({ test, isSelected, onSelect, onDelete }: TestCardProps) {
  const questionCount = (test.config as { questions?: unknown[] })?.questions?.length || 0;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{test.title}</CardTitle>
            <CardDescription className="text-sm">
              /{test.slug}
            </CardDescription>
          </div>
          <Badge
            variant={test.status === "published" ? "default" : "secondary"}
          >
            {test.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{questionCount} questions</span>
          {test.companyName && <span>{test.companyName}</span>}
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/tests/${test.slug}`, "_blank");
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// JSON EDITOR
// ============================================

interface JsonEditorProps {
  test: PlacementTest | null;
  onSave: (updates: {
    title?: string;
    slug?: string;
    companyName?: string;
    config?: Record<string, unknown>;
    status?: "draft" | "published";
  }) => Promise<void>;
  isSaving: boolean;
}

function JsonEditor({ test, onSave, isSaving }: JsonEditorProps) {
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Update local state when test changes
  useEffect(() => {
    if (test) {
      setJsonText(JSON.stringify(test.config, null, 2));
      setTitle(test.title);
      setSlug(test.slug);
      setCompanyName(test.companyName || "");
      setJsonError(null);
      setHasChanges(false);
    } else {
      setJsonText("");
      setTitle("");
      setSlug("");
      setCompanyName("");
    }
  }, [test]);

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    setHasChanges(true);

    // Validate JSON
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handleSave = async () => {
    if (jsonError) {
      toast.error("Please fix JSON errors before saving");
      return;
    }

    try {
      const config = JSON.parse(jsonText);
      await onSave({
        title,
        slug,
        companyName: companyName || undefined,
        config,
      });
      setHasChanges(false);
      toast.success("Test saved successfully");
    } catch (error) {
      toast.error("Failed to save test");
      console.error(error);
    }
  };

  const handlePublish = async () => {
    if (!test) return;

    try {
      const config = JSON.parse(jsonText);
      await onSave({
        title,
        slug,
        companyName: companyName || undefined,
        config,
        status: "published",
      });
      setHasChanges(false);
      toast.success("Test published successfully");
    } catch (error) {
      toast.error("Failed to publish test");
      console.error(error);
    }
  };

  if (!test) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-muted-foreground">
          <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a test to edit or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold">{test.title}</span>
          </div>
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/tests/${test.slug}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !!jsonError}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
          {test.status === "draft" && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isSaving || !!jsonError}
            >
              <Send className="h-4 w-4 mr-1" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Metadata fields */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b bg-gray-50">
        <div className="space-y-1">
          <Label htmlFor="title" className="text-xs">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Test title"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug" className="text-xs">Slug (URL path)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setHasChanges(true);
            }}
            placeholder="test-slug"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="companyName" className="text-xs">Company Name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Company name (optional)"
          />
        </div>
      </div>

      {/* JSON validation status */}
      {jsonError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-sm border-b">
          <X className="h-4 w-4" />
          <span>JSON Error: {jsonError}</span>
        </div>
      )}
      {!jsonError && jsonText && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm border-b">
          <Check className="h-4 w-4" />
          <span>Valid JSON</span>
        </div>
      )}

      {/* JSON Editor */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          className="w-full h-full font-mono text-sm p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Test configuration JSON..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}

// ============================================
// CREATE TEST DIALOG
// ============================================

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateTestDialog({ open, onOpenChange }: CreateTestDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTest = useMutation(api.placementTests.create);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!slug.trim()) {
      toast.error("Please enter a slug");
      return;
    }

    setIsSubmitting(true);

    try {
      const defaultConfig = {
        id: slug,
        title: title,
        company: {
          name: companyName || "Company",
          industry: "General",
          primaryColor: "#3B82F6",
          secondaryColor: "#6B7280",
        },
        totalQuestions: 0,
        questions: [],
        levelDescriptions: {
          A1: {
            title: "Beginner (A1)",
            description: "Basic understanding of everyday expressions.",
            recommendations: ["Start with foundational courses"],
          },
          A2: {
            title: "Elementary (A2)",
            description: "Can communicate in simple, routine tasks.",
            recommendations: ["Build confidence with intermediate vocabulary"],
          },
          B1: {
            title: "Intermediate (B1)",
            description: "Can deal with most situations while traveling.",
            recommendations: ["Develop business writing skills"],
          },
          B2: {
            title: "Upper-Intermediate (B2)",
            description: "Can interact with fluency and spontaneity.",
            recommendations: ["Focus on advanced communication"],
          },
          C1: {
            title: "Advanced (C1)",
            description: "Can express yourself fluently and spontaneously.",
            recommendations: ["Refine presentation skills"],
          },
        },
      };

      await createTest({
        title: title.trim(),
        slug: slug.trim(),
        companyName: companyName.trim() || undefined,
        config: defaultConfig,
        status: "draft",
      });

      toast.success("Test created successfully!");
      onOpenChange(false);
      setTitle("");
      setSlug("");
      setCompanyName("");
    } catch (error) {
      toast.error((error as Error).message || "Failed to create test");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Only auto-generate if slug hasn't been manually edited
    const autoSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(autoSlug);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Placement Test</DialogTitle>
          <DialogDescription>
            Create a new placement test. You can edit the questions after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Test Title</Label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Cambridge English Placement Test"
            />
          </div>

          <div className="space-y-2">
            <Label>URL Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., company-name"
            />
            <p className="text-xs text-muted-foreground">
              Test will be available at: /tests/{slug || "your-slug"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Company Name (optional)</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Lavera"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Test"}
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
  const [selectedTestId, setSelectedTestId] = useState<Id<"placementTests"> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all tests
  const tests = useQuery(api.placementTests.list, {});

  // Fetch selected test
  const selectedTest = useQuery(
    api.placementTests.getById,
    selectedTestId ? { id: selectedTestId } : "skip"
  );

  // Mutations
  const updateTest = useMutation(api.placementTests.update);
  const deleteTest = useMutation(api.placementTests.remove);

  // Auto-select first test if none selected
  useEffect(() => {
    if (tests && tests.length > 0 && !selectedTestId) {
      setSelectedTestId(tests[0]._id);
    }
  }, [tests, selectedTestId]);

  const handleSave = async (updates: {
    title?: string;
    slug?: string;
    companyName?: string;
    config?: Record<string, unknown>;
    status?: "draft" | "published";
  }) => {
    if (!selectedTestId) return;

    setIsSaving(true);
    try {
      await updateTest({
        id: selectedTestId,
        ...updates,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (testId: Id<"placementTests">) => {
    if (!confirm("Are you sure you want to delete this test?")) return;

    try {
      await deleteTest({ id: testId });
      if (selectedTestId === testId) {
        setSelectedTestId(null);
      }
      toast.success("Test deleted");
    } catch (error) {
      toast.error("Failed to delete test");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-7 w-7" />
            Placement Tests
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage Cambridge English placement tests
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Test
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar - Test list */}
        <div className="w-80 flex-shrink-0 overflow-y-auto">
          <div className="space-y-3">
            {tests === undefined ? (
              // Loading state
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-32 animate-pulse bg-gray-100" />
                ))}
              </>
            ) : tests.length === 0 ? (
              // Empty state
              <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                <ClipboardCheck className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  No placement tests yet
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Test
                </Button>
              </div>
            ) : (
              // Test cards
              tests.map((test) => (
                <TestCard
                  key={test._id}
                  test={test as PlacementTest}
                  isSelected={selectedTestId === test._id}
                  onSelect={() => setSelectedTestId(test._id)}
                  onDelete={() => handleDelete(test._id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Main editor */}
        <JsonEditor
          test={selectedTest as PlacementTest | null}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>

      {/* Create dialog */}
      <CreateTestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
