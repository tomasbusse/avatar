"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Copy,
  Trash2,
  Loader2,
  X,
  Eye,
  Link as LinkIcon,
  Lock,
  Unlock,
  Users,
  ExternalLink,
  RefreshCw,
  Presentation,
  GraduationCap,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLessonsPage() {
  const lessons = useQuery(api.structuredLessons.listMyLessons);
  const avatars = useQuery(api.avatars.listActiveAvatars);
  const [showCreator, setShowCreator] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Structured Lessons</h2>
            <p className="text-muted-foreground">
              Create shareable lesson links that combine content with an AI avatar teacher.
            </p>
          </div>
          <Button onClick={() => setShowCreator(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Lesson
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-blue-500" />
                <span className="text-3xl font-bold">{lessons?.length ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Public Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Unlock className="w-8 h-8 text-green-500" />
                <span className="text-3xl font-bold">
                  {lessons?.filter((l) => l.isPublic).length ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-purple-500" />
                <span className="text-3xl font-bold">
                  {lessons?.reduce((acc, l) => acc + l.totalSessions, 0) ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lesson List */}
        <div className="space-y-4">
          {lessons?.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Lessons Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first structured lesson to share with students.
                </p>
                <Button onClick={() => setShowCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lesson
                </Button>
              </CardContent>
            </Card>
          )}

          {lessons?.map((lesson) => (
            <LessonCard
              key={lesson._id}
              lesson={lesson}
              onEdit={() => setEditingLesson(lesson)}
            />
          ))}
        </div>

        {/* Creator Modal */}
        {showCreator && (
          <LessonEditor
            avatars={avatars ?? []}
            onClose={() => setShowCreator(false)}
          />
        )}

        {/* Editor Modal */}
        {editingLesson && (
          <LessonEditor
            avatars={avatars ?? []}
            lesson={editingLesson}
            onClose={() => setEditingLesson(null)}
          />
        )}
      </div>
    </div>
  );
}

function LessonCard({ lesson, onEdit }: { lesson: any; onEdit: () => void }) {
  const deleteLesson = useMutation(api.structuredLessons.remove);
  const regenerateToken = useMutation(api.structuredLessons.regenerateToken);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/lesson/join/${lesson.shareToken}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  const handleRegenerateToken = async () => {
    if (!confirm("Regenerate share link? The old link will stop working.")) return;
    setIsRegenerating(true);
    try {
      await regenerateToken({ lessonId: lesson._id });
      toast.success("New share link generated!");
    } catch (error) {
      toast.error("Failed to regenerate link");
    }
    setIsRegenerating(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    setIsDeleting(true);
    try {
      await deleteLesson({ lessonId: lesson._id });
      toast.success("Lesson deleted");
    } catch (error) {
      toast.error("Failed to delete lesson");
    }
    setIsDeleting(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              {lesson.sessionType === "presentation" ? (
                <Presentation className="w-6 h-6 text-primary" />
              ) : (
                <GraduationCap className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{lesson.title}</CardTitle>
              {lesson.description && (
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={lesson.isPublic ? "default" : "secondary"}>
              {lesson.isPublic ? (
                <span className="flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  Public
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </span>
              )}
            </Badge>
            <Badge variant={lesson.requiresAuth ? "outline" : "secondary"}>
              {lesson.requiresAuth ? "Auth Required" : "Open Access"}
            </Badge>
            <Badge variant="outline">
              {lesson.totalSessions} session{lesson.totalSessions !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {lesson.avatar && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${lesson.avatar.appearance?.avatarImage})`,
                  }}
                />
                <span>{lesson.avatar.name}</span>
              </div>
            )}
            <span className="capitalize">{lesson.sessionType.replace("_", " ")}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Link */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-sm">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <code className="text-xs">{lesson.shareToken}</code>
              <Button size="sm" variant="ghost" onClick={handleCopyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {/* Edit */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              title="Edit lesson"
            >
              <Pencil className="w-4 h-4" />
            </Button>

            {/* Regenerate Token */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRegenerateToken}
              disabled={isRegenerating}
              title="Regenerate share link"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>

            {/* Open Link */}
            <Button size="sm" variant="ghost" asChild title="Open lesson page">
              <Link href={`/lesson/join/${lesson.shareToken}`} target="_blank">
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete lesson"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-destructive" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LessonEditor({
  avatars,
  lesson,
  onClose,
}: {
  avatars: any[];
  lesson?: any; // If provided, we're editing; otherwise creating
  onClose: () => void;
}) {
  const createLesson = useMutation(api.structuredLessons.create);
  const updateLesson = useMutation(api.structuredLessons.update);
  const knowledgeBases = useQuery(api.knowledgeBases.list);
  const presentations = useQuery(api.presentations.getUserPresentations);

  const isEditing = !!lesson;

  // Determine initial content source from lesson data
  const getInitialContentSource = (): "none" | "knowledge" | "presentation" => {
    if (!lesson) return "none";
    if (lesson.presentationId) return "presentation";
    if (lesson.knowledgeContentId) return "knowledge";
    return "none";
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: lesson?.title || "",
    description: lesson?.description || "",
    avatarId: lesson?.avatarId || "",
    contentSource: getInitialContentSource(),
    knowledgeContentId: lesson?.knowledgeContentId || "",
    presentationId: lesson?.presentationId || "",
    sessionType: (lesson?.sessionType || "structured_lesson") as "structured_lesson" | "presentation",
    isPublic: lesson?.isPublic || false,
    requiresAuth: lesson?.requiresAuth || false,
    welcomeMessage: lesson?.welcomeMessage || "",
  });

  // Get all content items from all knowledge bases
  const allContent = useQuery(
    api.knowledgeBases.getAllContent,
    knowledgeBases && knowledgeBases.length > 0 ? {} : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.avatarId) {
      toast.error("Title and avatar are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        // Update existing lesson
        await updateLesson({
          lessonId: lesson._id,
          title: formData.title,
          description: formData.description || undefined,
          avatarId: formData.avatarId as Id<"avatars">,
          knowledgeContentId:
            formData.contentSource === "knowledge" && formData.knowledgeContentId
              ? (formData.knowledgeContentId as Id<"knowledgeContent">)
              : undefined,
          presentationId:
            formData.contentSource === "presentation" && formData.presentationId
              ? (formData.presentationId as Id<"presentations">)
              : undefined,
          sessionType: formData.sessionType,
          isPublic: formData.isPublic,
          requiresAuth: formData.requiresAuth,
          welcomeMessage: formData.welcomeMessage || undefined,
        });

        toast.success("Lesson updated!");
      } else {
        // Create new lesson
        const result = await createLesson({
          title: formData.title,
          description: formData.description || undefined,
          avatarId: formData.avatarId as Id<"avatars">,
          knowledgeContentId:
            formData.contentSource === "knowledge" && formData.knowledgeContentId
              ? (formData.knowledgeContentId as Id<"knowledgeContent">)
              : undefined,
          presentationId:
            formData.contentSource === "presentation" && formData.presentationId
              ? (formData.presentationId as Id<"presentations">)
              : undefined,
          sessionType: formData.sessionType,
          isPublic: formData.isPublic,
          requiresAuth: formData.requiresAuth,
          welcomeMessage: formData.welcomeMessage || undefined,
        });

        toast.success("Lesson created!");

        // Copy link to clipboard
        const shareUrl = `${window.location.origin}/lesson/join/${result.shareToken}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      }

      onClose();
    } catch (error) {
      toast.error(isEditing ? "Failed to update lesson" : "Failed to create lesson");
      console.error(error);
    }
    setIsSubmitting(false);
  };

  // avatars already filtered to active via listActiveAvatars query
  const activeAvatars = avatars;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? "Edit Lesson" : "Create Structured Lesson"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium">Lesson Details</h4>

              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="e.g., Business English Presentation Skills"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  rows={2}
                  placeholder="Brief description of what students will learn"
                />
              </div>
            </div>

            {/* Avatar Selection */}
            <div className="space-y-4">
              <h4 className="font-medium">Avatar Teacher</h4>

              <div>
                <label className="text-sm font-medium">Select Avatar *</label>
                <select
                  value={formData.avatarId}
                  onChange={(e) =>
                    setFormData({ ...formData, avatarId: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">Choose an avatar...</option>
                  {activeAvatars.map((avatar) => (
                    <option key={avatar._id} value={avatar._id}>
                      {avatar.name} - {avatar.persona?.role || "Teacher"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Source */}
            <div className="space-y-4">
              <h4 className="font-medium">Content Source</h4>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="contentSource"
                    value="none"
                    checked={formData.contentSource === "none"}
                    onChange={() =>
                      setFormData({ ...formData, contentSource: "none" })
                    }
                  />
                  <span className="text-sm">No content (free conversation)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="contentSource"
                    value="knowledge"
                    checked={formData.contentSource === "knowledge"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        contentSource: "knowledge",
                        sessionType: "structured_lesson",
                      })
                    }
                  />
                  <span className="text-sm">Knowledge Base Content</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="contentSource"
                    value="presentation"
                    checked={formData.contentSource === "presentation"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        contentSource: "presentation",
                        sessionType: "presentation",
                      })
                    }
                  />
                  <span className="text-sm">Uploaded Presentation</span>
                </label>
              </div>

              {formData.contentSource === "knowledge" && (
                <div>
                  <label className="text-sm font-medium">Select Content</label>
                  <select
                    value={formData.knowledgeContentId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        knowledgeContentId: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">Choose content...</option>
                    {allContent?.map((content: any) => (
                      <option key={content._id} value={content._id}>
                        {content.title}{" "}
                        {content.metadata?.level && `(${content.metadata.level})`}
                        {content.presentationId && " (has slides)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.contentSource === "presentation" && (
                <div>
                  <label className="text-sm font-medium">Select Presentation</label>
                  <select
                    value={formData.presentationId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        presentationId: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">Choose presentation...</option>
                    {presentations?.map((pres: any) => (
                      <option key={pres._id} value={pres._id}>
                        {pres.name} ({pres.totalSlides} slides)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Access Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Access Settings</h4>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublic: e.target.checked })
                    }
                  />
                  <span className="text-sm">Public (discoverable)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresAuth}
                    onChange={(e) =>
                      setFormData({ ...formData, requiresAuth: e.target.checked })
                    }
                  />
                  <span className="text-sm">Require authentication</span>
                </label>
              </div>
            </div>

            {/* Welcome Message */}
            <div>
              <label className="text-sm font-medium">Welcome Message (optional)</label>
              <textarea
                value={formData.welcomeMessage}
                onChange={(e) =>
                  setFormData({ ...formData, welcomeMessage: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                rows={2}
                placeholder="Custom greeting for students joining this lesson"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : isEditing ? (
                  <Pencil className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isEditing ? "Update Lesson" : "Create Lesson"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
