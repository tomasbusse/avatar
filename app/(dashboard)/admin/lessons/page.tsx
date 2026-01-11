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
  Gamepad2,
  UserPlus,
  Search,
  Check,
  Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLessonsPage() {
  const lessons = useQuery(api.structuredLessons.listMyLessons);
  const avatars = useQuery(api.avatars.listActiveAvatars);
  const [showCreator, setShowCreator] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [assigningLesson, setAssigningLesson] = useState<any>(null);

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
              onAssign={() => setAssigningLesson(lesson)}
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

        {/* Assignment Dialog */}
        {assigningLesson && (
          <AssignLessonDialog
            lesson={assigningLesson}
            onClose={() => setAssigningLesson(null)}
          />
        )}
      </div>
    </div>
  );
}

function LessonCard({ lesson, onEdit, onAssign }: { lesson: any; onEdit: () => void; onAssign: () => void }) {
  const deleteLesson = useMutation(api.structuredLessons.remove);
  const regenerateToken = useMutation(api.structuredLessons.regenerateToken);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/lesson/join/${lesson.shareToken}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setJustCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setJustCopied(false), 2000);
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

            {/* Assign */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onAssign}
              title="Assign to students"
              className="text-primary"
            >
              <UserPlus className="w-4 h-4" />
            </Button>

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

            {/* Copy Link */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              title="Copy lesson link"
              className="gap-1.5"
            >
              {justCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              <span className="text-xs">{justCopied ? "Copied!" : "Copy Link"}</span>
            </Button>

            {/* Open Link */}
            <Button size="sm" variant="outline" asChild title="Open lesson page" className="gap-1.5">
              <Link href={`/lesson/join/${lesson.shareToken}`} target="_blank">
                <ExternalLink className="w-4 h-4" />
                <span className="text-xs">Open</span>
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
  const assignToStudent = useMutation(api.lessonEnrollments.assignToStudent);
  const assignToGroup = useMutation(api.lessonEnrollments.assignToGroup);
  const knowledgeBases = useQuery(api.knowledgeBases.list);
  const presentations = useQuery(api.presentations.getUserPresentations);
  const wordGames = useQuery(api.wordGames.listGames, { status: "published" });
  const students = useQuery(api.students.listStudents);
  const groups = useQuery(api.groups.listGroups, {});

  // Multi-game linking (when editing existing lesson)
  const linkedGames = useQuery(
    api.wordGames.getGamesForLesson,
    lesson?._id ? { lessonId: lesson._id } : "skip"
  );
  const linkGame = useMutation(api.wordGames.linkGameToLesson);
  const unlinkGame = useMutation(api.wordGames.unlinkGameFromLesson);

  // Multi-content linking (when editing existing lesson)
  const linkedContent = useQuery(
    api.knowledgeBases.getContentForLesson,
    lesson?._id ? { lessonId: lesson._id } : "skip"
  );
  const linkContent = useMutation(api.knowledgeBases.linkContentToLesson);
  const unlinkContent = useMutation(api.knowledgeBases.unlinkContentFromLesson);

  const isEditing = !!lesson;

  // Determine initial content source from lesson data
  const getInitialContentSource = (): "none" | "knowledge" | "presentation" | "word_game" => {
    if (!lesson) return "none";
    if (lesson.wordGameId) return "word_game";
    if (lesson.presentationId) return "presentation";
    if (lesson.knowledgeContentId) return "knowledge";
    return "none";
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkingGame, setIsLinkingGame] = useState(false);
  const [isLinkingContent, setIsLinkingContent] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  // Handlers for content linking/unlinking
  const handleLinkContent = async (contentId: string) => {
    if (!lesson?._id) {
      toast.error("Save the lesson first before linking content");
      return;
    }
    setIsLinkingContent(true);
    try {
      await linkContent({
        contentId: contentId as Id<"knowledgeContent">,
        lessonId: lesson._id,
        triggerType: "student", // Student-controlled
        triggerConfig: {},
      });
      toast.success("Content linked to lesson");
    } catch (error: any) {
      toast.error(error.message || "Failed to link content");
    }
    setIsLinkingContent(false);
  };

  const handleUnlinkContent = async (linkId: string) => {
    try {
      await unlinkContent({ linkId: linkId as Id<"contentLessonLinks"> });
      toast.success("Content removed from lesson");
    } catch (error) {
      toast.error("Failed to remove content");
    }
  };

  // Handlers for game linking/unlinking
  const handleLinkGame = async (gameId: string) => {
    if (!lesson?._id) {
      toast.error("Save the lesson first before linking games");
      return;
    }
    setIsLinkingGame(true);
    try {
      await linkGame({
        gameId: gameId as Id<"wordGames">,
        lessonId: lesson._id,
        triggerType: "student", // Student-controlled
        triggerConfig: {},
        isRequired: false,
      });
      toast.success("Game linked to lesson");
    } catch (error: any) {
      toast.error(error.message || "Failed to link game");
    }
    setIsLinkingGame(false);
  };

  const handleUnlinkGame = async (linkId: string) => {
    try {
      await unlinkGame({ linkId: linkId as Id<"gameLessonLinks"> });
      toast.success("Game removed from lesson");
    } catch (error) {
      toast.error("Failed to remove game");
    }
  };
  const [formData, setFormData] = useState({
    title: lesson?.title || "",
    description: lesson?.description || "",
    avatarId: lesson?.avatarId || "",
    contentSource: getInitialContentSource(),
    knowledgeContentId: lesson?.knowledgeContentId || "",
    presentationId: lesson?.presentationId || "",
    wordGameId: lesson?.wordGameId || "", // Selected word game ID
    sessionType: (lesson?.sessionType || "structured_lesson") as "structured_lesson" | "presentation",
    isPublic: lesson?.isPublic || false,
    requiresAuth: lesson?.requiresAuth || false,
    welcomeMessage: lesson?.welcomeMessage || "",
    // Session duration override (null = use avatar default)
    durationMinutes: lesson?.durationMinutes ?? null as number | null,
    wrapUpBufferMinutes: lesson?.wrapUpBufferMinutes ?? null as number | null,
    // Enrollment settings
    allowSelfEnrollment: lesson?.enrollmentSettings?.allowSelfEnrollment || false,
    maxEnrollments: lesson?.enrollmentSettings?.maxEnrollments || "",
  });

  // Get all content items from all knowledge bases
  const allContent = useQuery(api.knowledgeBases.getAllContent, {});

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

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
          wordGameId:
            formData.contentSource === "word_game" && formData.wordGameId
              ? (formData.wordGameId as Id<"wordGames">)
              : undefined,
          sessionType: formData.sessionType,
          isPublic: formData.isPublic,
          requiresAuth: formData.requiresAuth,
          welcomeMessage: formData.welcomeMessage || undefined,
          // Session duration override (null = use avatar default)
          durationMinutes: formData.durationMinutes ?? undefined,
          wrapUpBufferMinutes: formData.wrapUpBufferMinutes ?? undefined,
          // Clear other content sources when switching
          clearKnowledgeContent: formData.contentSource !== "knowledge",
          clearPresentation: formData.contentSource !== "presentation",
          clearWordGame: formData.contentSource !== "word_game",
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
          wordGameId:
            formData.contentSource === "word_game" && formData.wordGameId
              ? (formData.wordGameId as Id<"wordGames">)
              : undefined,
          sessionType: formData.sessionType,
          isPublic: formData.isPublic,
          requiresAuth: formData.requiresAuth,
          welcomeMessage: formData.welcomeMessage || undefined,
          // Session duration override (null = use avatar default)
          durationMinutes: formData.durationMinutes ?? undefined,
          wrapUpBufferMinutes: formData.wrapUpBufferMinutes ?? undefined,
          enrollmentSettings: (formData.allowSelfEnrollment || formData.maxEnrollments)
            ? {
                allowSelfEnrollment: formData.allowSelfEnrollment,
                maxEnrollments: formData.maxEnrollments ? parseInt(formData.maxEnrollments as string) : undefined,
              }
            : undefined,
        });

        // Assign to selected students and groups
        const dueDateNum = dueDate ? new Date(dueDate).getTime() : undefined;

        for (const studentId of selectedStudents) {
          try {
            await assignToStudent({
              lessonId: result.lessonId,
              studentId: studentId as Id<"students">,
              dueDate: dueDateNum,
            });
          } catch (e) {
            console.error("Failed to assign to student:", e);
          }
        }

        for (const groupId of selectedGroups) {
          try {
            await assignToGroup({
              lessonId: result.lessonId,
              groupId: groupId as Id<"groups">,
              dueDate: dueDateNum,
            });
          } catch (e) {
            console.error("Failed to assign to group:", e);
          }
        }

        const assignmentCount = selectedStudents.length + selectedGroups.length;
        if (assignmentCount > 0) {
          toast.success(`Lesson created and assigned to ${assignmentCount} recipient(s)!`);
        } else {
          toast.success("Lesson created!");
        }

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

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-primary/50 bg-primary/5">
                  <input
                    type="radio"
                    name="contentSource"
                    value="word_game"
                    checked={formData.contentSource === "word_game"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        contentSource: "word_game",
                        sessionType: "structured_lesson",
                      })
                    }
                  />
                  <Gamepad2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Word Game</span>
                  <Badge variant="secondary" className="ml-1 text-xs">New</Badge>
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
                    {allContent === undefined ? (
                      <option value="">Loading content...</option>
                    ) : allContent.length === 0 ? (
                      <option value="">No content available - create some in Knowledge Bases first</option>
                    ) : (
                      <>
                        <option value="">Choose content...</option>
                        {allContent.map((content: any) => (
                          <option key={content._id} value={content._id}>
                            {content.title}{" "}
                            {content.metadata?.level && `(${content.metadata.level})`}
                            {content.htmlSlides?.length && ` (${content.htmlSlides.length} slides)`}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {allContent?.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Go to Admin &gt; Knowledge Bases to upload content with HTML slides.
                    </p>
                  )}
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

              {formData.contentSource === "word_game" && (
                <div>
                  <label className="text-sm font-medium">Select Word Game</label>
                  <select
                    value={formData.wordGameId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wordGameId: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    {wordGames === undefined ? (
                      <option value="">Loading games...</option>
                    ) : wordGames.length === 0 ? (
                      <option value="">No published games - create one in Word Games first</option>
                    ) : (
                      <>
                        <option value="">Choose a word game...</option>
                        {wordGames.map((game: any) => (
                          <option key={game._id} value={game._id}>
                            {game.title} ({game.level} • {game.type.replace("_", " ")})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {wordGames?.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <Link href="/admin/games" className="text-primary hover:underline">
                        Go to Word Games
                      </Link>{" "}
                      to create and publish games.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Multi-Game Linking (only when editing) */}
            {isEditing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    <h4 className="font-medium">Linked Games</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {linkedGames?.length || 0} / 20 games
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add multiple games that students can play during the lesson. Students can choose which games to play from the Materials panel.
                </p>

                {/* Currently linked games */}
                {linkedGames && linkedGames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {linkedGames.map((link: any) => (
                      <Badge
                        key={link._id}
                        variant="secondary"
                        className="gap-1 pr-1 py-1"
                      >
                        <Gamepad2 className="w-3 h-3" />
                        {link.game?.title || "Unknown game"}
                        <span className="text-xs text-muted-foreground ml-1">
                          {link.game?.level}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUnlinkGame(link._id)}
                          className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add game dropdown */}
                <div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleLinkGame(e.target.value);
                        e.target.value = ""; // Reset after selection
                      }
                    }}
                    disabled={isLinkingGame || (linkedGames?.length || 0) >= 20}
                    className="w-full px-3 py-2 border rounded-lg bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {(linkedGames?.length || 0) >= 20
                        ? "Maximum 20 games reached"
                        : isLinkingGame
                        ? "Adding game..."
                        : "Add a game..."}
                    </option>
                    {wordGames
                      ?.filter(
                        (game: any) =>
                          !linkedGames?.some(
                            (link: any) => link.game?._id === game._id
                          )
                      )
                      .map((game: any) => (
                        <option key={game._id} value={game._id}>
                          {game.title} ({game.level} • {game.type.replace("_", " ")})
                        </option>
                      ))}
                  </select>
                </div>

                {(!linkedGames || linkedGames.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">
                    No games linked yet. Add games above to make them available to students.
                  </p>
                )}
              </div>
            )}

            {/* Multi-Content Linking (only when editing) */}
            {isEditing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium">Linked Slides / Content</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {linkedContent?.length || 0} / 20 content items
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add multiple PowerPoint/slides from the knowledge base that students can view during the lesson.
                </p>

                {/* Currently linked content */}
                {linkedContent && linkedContent.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {linkedContent.map((link: any) => (
                      <Badge
                        key={link._id}
                        variant="secondary"
                        className="gap-1 pr-1 py-1"
                      >
                        <Presentation className="w-3 h-3" />
                        {link.content?.title || "Unknown content"}
                        {link.content?.htmlSlides?.length && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({link.content.htmlSlides.length} slides)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUnlinkContent(link._id)}
                          className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add content dropdown */}
                <div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleLinkContent(e.target.value);
                        e.target.value = ""; // Reset after selection
                      }
                    }}
                    disabled={isLinkingContent || (linkedContent?.length || 0) >= 20}
                    className="w-full px-3 py-2 border rounded-lg bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {(linkedContent?.length || 0) >= 20
                        ? "Maximum 20 content items reached"
                        : isLinkingContent
                        ? "Adding content..."
                        : "Add slides/content..."}
                    </option>
                    {allContent
                      ?.filter(
                        (content: any) =>
                          !linkedContent?.some(
                            (link: any) => link.content?._id === content._id
                          )
                      )
                      .map((content: any) => (
                        <option key={content._id} value={content._id}>
                          {content.title}
                          {content.htmlSlides?.length && ` (${content.htmlSlides.length} slides)`}
                          {content.metadata?.level && ` - ${content.metadata.level}`}
                        </option>
                      ))}
                  </select>
                </div>

                {(!linkedContent || linkedContent.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">
                    No content linked yet. Add slides above to make them available to students.
                  </p>
                )}
              </div>
            )}

            {/* Hint for new lessons */}
            {!isEditing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> After creating the lesson, you can edit it to link multiple games and content items (up to 20 each) that students can access during the lesson.
                </p>
              </div>
            )}

            {/* Access Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Access Settings</h4>

              <div className="flex flex-wrap gap-4">
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowSelfEnrollment}
                    onChange={(e) =>
                      setFormData({ ...formData, allowSelfEnrollment: e.target.checked })
                    }
                  />
                  <span className="text-sm">Allow self-enrollment</span>
                </label>
              </div>

              {formData.allowSelfEnrollment && (
                <div className="pl-6">
                  <label className="text-sm font-medium">Max Enrollments (optional)</label>
                  <input
                    type="number"
                    value={formData.maxEnrollments}
                    onChange={(e) =>
                      setFormData({ ...formData, maxEnrollments: e.target.value })
                    }
                    className="w-32 mt-1 px-3 py-2 border rounded-lg bg-background"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
              )}
            </div>

            {/* Assign to Students/Groups (only when creating) */}
            {!isEditing && (
              <div className="space-y-4">
                <h4 className="font-medium">Assign to Students or Groups</h4>
                <p className="text-sm text-muted-foreground">
                  Optionally assign this lesson to specific students or groups now. You can also assign later.
                </p>

                {/* Due Date */}
                <div>
                  <label className="text-sm font-medium">Due Date (optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>

                {/* Students Selection */}
                <div>
                  <label className="text-sm font-medium">
                    Students ({selectedStudents.length} selected)
                  </label>
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg">
                    {!students || students.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No students available</p>
                    ) : (
                      students.map((student: any) => (
                        <div
                          key={student._id}
                          className={`flex items-center justify-between p-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 ${
                            selectedStudents.includes(student._id) ? "bg-primary/5" : ""
                          }`}
                          onClick={() => toggleStudent(student._id)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={() => toggleStudent(student._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm">
                              {student.user?.firstName} {student.user?.lastName}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">{student.currentLevel}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Groups Selection */}
                <div>
                  <label className="text-sm font-medium">
                    Groups ({selectedGroups.length} selected)
                  </label>
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg">
                    {!groups?.groups || groups.groups.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No groups available</p>
                    ) : (
                      groups.groups.map((group: any) => (
                        <div
                          key={group._id}
                          className={`flex items-center justify-between p-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 ${
                            selectedGroups.includes(group._id) ? "bg-primary/5" : ""
                          }`}
                          onClick={() => toggleGroup(group._id)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(group._id)}
                              onChange={() => toggleGroup(group._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm">{group.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {group.memberCount || 0} members
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

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

            {/* Session Duration Override */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Session Duration (Optional)</h4>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Override the avatar&apos;s default session duration for this specific lesson.
                Leave as &quot;Use Avatar Default&quot; to inherit the avatar&apos;s settings.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Session Duration</label>
                  <select
                    value={formData.durationMinutes ?? "default"}
                    onChange={(e) => setFormData({
                      ...formData,
                      durationMinutes: e.target.value === "default" ? null : parseInt(e.target.value)
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="default">Use Avatar Default</option>
                    <option value="10">10 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 hour)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Wrap-Up Buffer</label>
                  <select
                    value={formData.wrapUpBufferMinutes ?? "default"}
                    onChange={(e) => setFormData({
                      ...formData,
                      wrapUpBufferMinutes: e.target.value === "default" ? null : parseInt(e.target.value)
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="default">Use Avatar Default</option>
                    <option value="1">1 minute before end</option>
                    <option value="2">2 minutes before end</option>
                    <option value="3">3 minutes before end</option>
                    <option value="5">5 minutes before end</option>
                  </select>
                </div>
              </div>
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

function AssignLessonDialog({
  lesson,
  onClose,
}: {
  lesson: any;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"students" | "groups">("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch students and groups
  const students = useQuery(api.students.listStudents);
  const groups = useQuery(api.groups.listGroups, {});

  // Assignment mutations
  const assignToStudent = useMutation(api.lessonEnrollments.assignToStudent);
  const assignToGroup = useMutation(api.lessonEnrollments.assignToGroup);

  // Filter students by search
  const filteredStudents = students?.filter((s: any) => {
    if (!searchQuery) return true;
    const name = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
    const email = s.user?.email?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  // Filter groups by search (groups query returns paginated result with .groups property)
  const filteredGroups = groups?.groups?.filter((g: any) => {
    if (!searchQuery) return true;
    return g.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSubmit = async () => {
    if (selectedStudents.length === 0 && selectedGroups.length === 0) {
      toast.error("Please select at least one student or group");
      return;
    }

    setIsSubmitting(true);
    try {
      const dueDateNum = dueDate ? new Date(dueDate).getTime() : undefined;

      // Assign to individual students
      for (const studentId of selectedStudents) {
        await assignToStudent({
          lessonId: lesson._id,
          studentId: studentId as Id<"students">,
          dueDate: dueDateNum,
          notes: notes || undefined,
        });
      }

      // Assign to groups
      for (const groupId of selectedGroups) {
        await assignToGroup({
          lessonId: lesson._id,
          groupId: groupId as Id<"groups">,
          dueDate: dueDateNum,
          notes: notes || undefined,
        });
      }

      const totalAssigned = selectedStudents.length + selectedGroups.length;
      toast.success(`Lesson assigned to ${totalAssigned} ${totalAssigned === 1 ? "recipient" : "recipients"}`);
      onClose();
    } catch (error) {
      toast.error("Failed to assign lesson");
      console.error(error);
    }
    setIsSubmitting(false);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assign Lesson</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Assign "{lesson.title}" to students or groups
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students or groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "students" | "groups")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="students">
                Students ({selectedStudents.length} selected)
              </TabsTrigger>
              <TabsTrigger value="groups">
                Groups ({selectedGroups.length} selected)
              </TabsTrigger>
            </TabsList>

            {/* Students Tab */}
            <TabsContent value="students" className="flex-1 overflow-auto mt-4">
              {!filteredStudents || filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No students found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStudents.includes(student._id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleStudent(student._id)}
                    >
                      <div>
                        <p className="font-medium">
                          {student.user?.firstName} {student.user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.user?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{student.currentLevel}</Badge>
                        {selectedStudents.includes(student._id) && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="flex-1 overflow-auto mt-4">
              {!filteredGroups || filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No groups found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGroups.map((group: any) => (
                    <div
                      key={group._id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedGroups.includes(group._id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleGroup(group._id)}
                    >
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.description || `${group.memberCount || 0} members`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.targetLevel && (
                          <Badge variant="outline">{group.targetLevel}</Badge>
                        )}
                        {selectedGroups.includes(group._id) && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Options */}
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Due Date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Complete before class"
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedStudents.length + selectedGroups.length} recipient(s) selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (selectedStudents.length === 0 && selectedGroups.length === 0)}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Assign Lesson
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
