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
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Copy,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function TeacherEntryTestsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Data
  const tests = useQuery(api.placementTests.listByCreator, {
    status: filterStatus === "draft" || filterStatus === "published"
      ? filterStatus
      : undefined,
  });
  const createTest = useMutation(api.placementTests.create);
  const updateTest = useMutation(api.placementTests.update);
  const removeTest = useMutation(api.placementTests.remove);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setCompanyName("");
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const finalSlug = slug.trim() || generateSlug(title);

    setIsCreating(true);
    try {
      await createTest({
        title: title.trim(),
        slug: finalSlug,
        companyName: companyName.trim() || undefined,
        config: {
          sections: [],
          settings: {
            timeLimit: 60,
            showTimer: true,
            shuffleQuestions: false,
            allowReview: true,
          },
        },
        status: "draft",
      });

      toast.success("Entry test created");
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create test");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (testId: Id<"placementTests">) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    try {
      await removeTest({ id: testId });
      toast.success("Test deleted");
    } catch (error) {
      toast.error("Failed to delete test");
    }
  };

  const handlePublish = async (testId: Id<"placementTests">) => {
    try {
      await updateTest({ id: testId, status: "published" });
      toast.success("Test published");
    } catch (error) {
      toast.error("Failed to publish test");
    }
  };

  if (tests === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entry Tests</h2>
          <p className="text-muted-foreground">
            Create and manage placement tests for your students.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Entry Test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Entry Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      // Auto-generate slug as user types
                    }
                  }}
                  placeholder="e.g., B2 Cambridge First Practice Test"
                />
              </div>

              <div>
                <Label>URL Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={title ? generateSlug(title) : "auto-generated-from-title"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The test will be available at: /entry-test/{slug || generateSlug(title) || "..."}
                </p>
              </div>

              <div>
                <Label>Company Name (optional)</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Deutsche Bank"
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={isCreating || !title.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Test
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Test List */}
      {tests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No entry tests yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first placement test to assess student levels.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Entry Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <Card key={test._id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{test.title}</h3>
                      <Badge
                        variant={test.status === "published" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {test.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>/{test.slug}</span>
                      {test.companyName && (
                        <span>{test.companyName}</span>
                      )}
                      <span>
                        Created {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button variant="ghost" size="sm" asChild title="Preview">
                      <Link href={`/entry-test/${test.slug}`} target="_blank">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild title="Edit">
                      <Link href={`/admin/entry-tests/${test._id}/edit`}>
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/entry-test/${test.slug}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Test link copied");
                      }}
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {test.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePublish(test._id)}
                        title="Publish"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(test._id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
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
  );
}
