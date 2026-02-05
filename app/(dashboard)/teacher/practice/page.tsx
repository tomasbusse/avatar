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
import {
  MessageSquare,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Loader2,
  Clock,
  Users,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type ConversationMode = "free_conversation" | "transcript_based" | "topic_guided";
type ConversationStyle = "discussion" | "quiz" | "review" | "q_and_a" | "mixed";

export default function TeacherPracticePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<ConversationMode>("free_conversation");
  const [subject, setSubject] = useState("");
  const [avatarId, setAvatarId] = useState<string>("");
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle>("discussion");
  const [targetDuration, setTargetDuration] = useState(15);
  const [openingGreeting, setOpeningGreeting] = useState("");
  const [transcriptContent, setTranscriptContent] = useState("");

  // Data
  const profile = useQuery(api.teachers.getMyTeacherProfile);
  const practices = useQuery(api.conversationPractice.list, {});
  const createPractice = useMutation(api.conversationPractice.create);
  const removePractice = useMutation(api.conversationPractice.remove);
  const uploadTranscript = useMutation(api.conversationPractice.uploadTranscript);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMode("free_conversation");
    setSubject("");
    setAvatarId("");
    setConversationStyle("discussion");
    setTargetDuration(15);
    setOpeningGreeting("");
    setTranscriptContent("");
  };

  const handleCreate = async () => {
    if (!title.trim() || !avatarId) {
      toast.error("Title and avatar are required");
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
        greetingConfig: openingGreeting.trim()
          ? { openingGreeting: openingGreeting.trim(), personalizeWithName: true }
          : undefined,
        accessMode: "both",
        guestSettings: {
          collectName: true,
          collectEmail: false,
        },
        isPublic: true,
      });

      // Upload transcript if provided
      if (mode === "transcript_based" && transcriptContent.trim() && result.practiceId) {
        await uploadTranscript({
          practiceId: result.practiceId,
          content: transcriptContent.trim(),
          sourceType: "paste",
        });
      }

      toast.success("Practice created! Share token: " + result.shareToken);
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
      await removePractice({ practiceId });
      toast.success("Practice deleted");
    } catch (error) {
      toast.error("Failed to delete practice");
    }
  };

  const copyShareLink = (shareToken: string) => {
    const url = `${window.location.origin}/practice/join/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  if (profile === undefined || practices === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const teacherAvatars = profile?.avatars ?? [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Practice Sessions</h2>
          <p className="text-muted-foreground">
            Create and manage conversation practice sessions for your students.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Practice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Practice Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Title */}
              <div>
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Business Meeting Practice"
                />
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description for students..."
                  rows={2}
                />
              </div>

              {/* Mode */}
              <div>
                <Label>Mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as ConversationMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_conversation">Free Conversation</SelectItem>
                    <SelectItem value="transcript_based">Transcript-Based</SelectItem>
                    <SelectItem value="topic_guided">Topic-Guided</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject (for topic_guided) */}
              {mode === "topic_guided" && (
                <div>
                  <Label>Topic / Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Job interviews, Travel, Healthcare..."
                  />
                </div>
              )}

              {/* Transcript (for transcript_based) */}
              {mode === "transcript_based" && (
                <div>
                  <Label>Transcript Content</Label>
                  <Textarea
                    value={transcriptContent}
                    onChange={(e) => setTranscriptContent(e.target.value)}
                    placeholder="Paste the transcript here..."
                    rows={6}
                  />
                </div>
              )}

              {/* Avatar Selection */}
              <div>
                <Label>Avatar *</Label>
                {teacherAvatars.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    No avatars assigned. Contact an admin to get avatars assigned.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {teacherAvatars.map((avatar) => (
                      <button
                        key={avatar._id}
                        type="button"
                        onClick={() => setAvatarId(avatar._id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          avatarId === avatar._id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {avatar.profileImage ? (
                          <img
                            src={avatar.profileImage}
                            alt={avatar.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{avatar.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation Style */}
              <div>
                <Label>Conversation Style</Label>
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

              {/* Target Duration */}
              <div>
                <Label>Target Duration (minutes)</Label>
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(parseInt(e.target.value) || 15)}
                />
              </div>

              {/* Opening Greeting */}
              <div>
                <Label>Opening Greeting (optional)</Label>
                <Textarea
                  value={openingGreeting}
                  onChange={(e) => setOpeningGreeting(e.target.value)}
                  placeholder="What should the avatar say when the session starts?"
                  rows={2}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleCreate}
                disabled={isCreating || !title.trim() || !avatarId}
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
                    Create Practice
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Practice List */}
      {!practices || practices.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No practice sessions yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first practice session to get started.
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
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{practice.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {practice.mode.replace(/_/g, " ")}
                      </Badge>
                      {practice.isPublic && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                    </div>
                    {practice.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {practice.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {practice.avatar && (
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          {practice.avatar.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(practice.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {practice.totalSessions ?? 0} sessions
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {practice.shareToken && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyShareLink(practice.shareToken!)}
                        title="Copy share link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    {practice.shareToken && (
                      <Button variant="ghost" size="sm" asChild title="Open practice page">
                        <Link
                          href={`/practice/join/${practice.shareToken}`}
                          target="_blank"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(practice._id)}
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
