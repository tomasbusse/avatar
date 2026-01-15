"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bot,
  Plus,
  Settings,
  Loader2,
  Volume2,
  Brain,
  Video,
  Play,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Square,
  Mic,
  Heart,
  User,
  BookOpen,
  Database,
  AlertTriangle,
  Clock,
  XCircle,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
import {
  PersonalityTraitsEditor,
  IdentityEditor,
  KnowledgeBaseEditor,
  MemoryConfigEditor,
  LifeStoryEditor,
  SessionStartEditor,
} from "@/components/admin/AvatarPersonalityEditor";
import { VoiceConfigManager } from "@/components/admin/VoiceConfigManager";

interface Voice {
  id: string;
  name: string;
  lang: string;
  isCustom?: boolean;
}

const DEFAULT_VOICES: Voice[] = [
  { id: "a0e99841-438c-4a64-b679-ae501e7d6091", name: "News Narrator (EN)", lang: "en" },
  { id: "f786b574-daa5-4673-aa0c-cbe3e8534c02", name: "Conversational (EN)", lang: "en" },
  { id: "794f9389-aac1-45b6-b726-9d9369183238", name: "Soft (EN)", lang: "en" },
  { id: "79a125e8-cd45-4c13-8a67-188112f4dd22", name: "British Butler", lang: "en" },
  { id: "ee7ea9f8-c0c1-498c-9f62-7f8f1e1c5ab1", name: "German Female", lang: "de" },
];

const CUSTOM_VOICES_KEY = "beethoven_custom_voices";

function getStoredVoices(): Voice[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_VOICES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomVoices(voices: Voice[]) {
  localStorage.setItem(CUSTOM_VOICES_KEY, JSON.stringify(voices));
}

const CARTESIA_EMOTIONS = ["neutral", "cheerful", "sad", "angry", "fearful", "surprised"];

// TTS Model options
const CARTESIA_TTS_MODELS = [
  { id: "sonic-2", name: "Sonic 2 (Stable)" },
  { id: "sonic-3", name: "Sonic 3 (Latest)" },
];

// STT Model options
const DEEPGRAM_STT_MODELS = [
  { id: "nova-3", name: "Nova 3 (Latest)" },
  { id: "nova-2", name: "Nova 2 (Stable)" },
];

// Cartesia emotion presets with proper API format
const CARTESIA_EMOTION_PRESETS = [
  { id: "neutral", label: "Neutral", value: [] as string[] },
  { id: "positive", label: "Positive (Warm)", value: ["positivity:medium"] },
  { id: "very_positive", label: "Enthusiastic", value: ["positivity:high"] },
  { id: "curious", label: "Curious", value: ["curiosity:medium"] },
  { id: "calm", label: "Calm", value: ["positivity:low"] },
];

interface LLMModel {
  id: string;
  name: string;
}

const DEFAULT_LLM_MODELS: LLMModel[] = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku (Fast)" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Fast)" },
  { id: "google/gemini-2.0-flash-exp", name: "🔭 Gemini 2.0 Flash (Vision)" },
  { id: "google/gemini-flash-1.5", name: "🔭 Gemini 1.5 Flash (Vision)" },
  { id: "google/gemini-pro-1.5", name: "🔭 Gemini 1.5 Pro (Vision)" },
];

// Cerebras models - ultra-fast inference
// GLM-4.7: ~1000 tok/s, 131k context, best for agentic/coding tasks
// Llama models: ~2300 tok/s, great for general conversation
const CEREBRAS_MODELS: LLMModel[] = [
  { id: "zai-glm-4.7", name: "🧠 GLM 4.7 (Agentic/Coding - 1000 tok/s)" },
  { id: "llama-3.3-70b", name: "⚡ Llama 3.3 70B (Fastest - 2314 tok/s)" },
  { id: "llama-3.1-70b", name: "⚡ Llama 3.1 70B" },
  { id: "llama-3.1-8b", name: "⚡ Llama 3.1 8B (Ultra Fast)" },
];

type LLMProvider = "openrouter" | "cerebras";

export default function AvatarsPage() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<Id<"avatars"> | null>(null);
  const [showVoiceManager, setShowVoiceManager] = useState(false);
  const [customVoices, setCustomVoices] = useState<Voice[]>([]);
  const [deletingAvatar, setDeletingAvatar] = useState<Id<"avatars"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const [isEndingSessions, setIsEndingSessions] = useState(false);

  const [dynamicModels, setDynamicModels] = useState<LLMModel[]>(DEFAULT_LLM_MODELS);

  useEffect(() => {
    setCustomVoices(getStoredVoices());

    // Fetch all models from OpenRouter
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/llm/models");
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          const models = data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id
          }));
          // Sort by name
          models.sort((a: LLMModel, b: LLMModel) => a.name.localeCompare(b.name));
          setDynamicModels(models);
        }
      } catch (error) {
        console.error("Failed to fetch dynamic models:", error);
      }
    };
    fetchModels();
  }, []);

  const allVoices = [...DEFAULT_VOICES, ...customVoices.map(v => ({ ...v, isCustom: true }))];

  const avatars = useQuery(api.avatars.listActiveAvatars);
  const deleteAvatarMutation = useMutation(api.avatars.deleteAvatar);
  const deletionInfo = useQuery(
    api.avatars.getAvatarDeletionInfo,
    deletingAvatar ? { avatarId: deletingAvatar } : "skip"
  );
  const activeSessions = useQuery(
    api.sessions.getActiveSessionsByAvatar,
    deletingAvatar ? { avatarId: deletingAvatar } : "skip"
  );
  const endSessionsForAvatar = useMutation(api.sessions.endSessionsForAvatar);

  const handleAddVoice = (voice: Voice) => {
    const updated = [...customVoices, { ...voice, isCustom: true }];
    setCustomVoices(updated);
    saveCustomVoices(updated);
    toast.success(`Voice "${voice.name}" added`);
  };

  const handleRemoveVoice = (voiceId: string) => {
    const updated = customVoices.filter(v => v.id !== voiceId);
    setCustomVoices(updated);
    saveCustomVoices(updated);
    toast.success("Voice removed");
  };

  const handleDeleteAvatar = async () => {
    if (!deletingAvatar) return;

    setIsDeleting(true);
    try {
      const result = await deleteAvatarMutation({
        avatarId: deletingAvatar,
        confirmDelete: true,
        forceDelete: forceDelete,
      });

      toast.success(result.message);

      // Show deletion summary
      const { deletionCounts } = result;
      const summaryParts = [];
      if (deletionCounts.sessions > 0) {
        summaryParts.push(`${deletionCounts.sessions} session(s)`);
      }
      if (deletionCounts.structuredLessons > 0) {
        summaryParts.push(`${deletionCounts.structuredLessons} lesson(s)`);
      }
      if (summaryParts.length > 0) {
        toast.info(`Deleted: ${summaryParts.join(", ")}`, { duration: 4000 });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete avatar"
      );
    } finally {
      setIsDeleting(false);
      setDeletingAvatar(null);
      setForceDelete(false);
    }
  };

  const handleEndActiveSessions = async () => {
    if (!deletingAvatar) return;

    setIsEndingSessions(true);
    try {
      const result = await endSessionsForAvatar({
        avatarId: deletingAvatar,
        reason: "admin_cleanup",
      });

      toast.success(`Ended ${result.endedCount} active session(s)`);
      // The deletionInfo query will automatically refetch
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to end sessions"
      );
    } finally {
      setIsEndingSessions(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Avatar Management</h2>
            <p className="text-muted-foreground">
              Configure AI teaching avatars with Beyond Presence video and Cartesia voice
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowVoiceManager(true)}>
              <Mic className="w-4 h-4 mr-2" />
              Manage Voices
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Avatar
            </Button>
          </div>
        </div>

        {!avatars ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : avatars.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Avatars Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first AI teaching avatar to get started
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Avatar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {avatars.map((avatar) => (
              <Card key={avatar._id} className={selectedAvatar === avatar._id ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {avatar.profileImage ? (
                          <img
                            src={avatar.profileImage}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Bot className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle>{avatar.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {avatar.persona.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAvatar(
                        selectedAvatar === avatar._id ? null : avatar._id
                      )}
                    >
                      {selectedAvatar === avatar._id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {avatar.description}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Video className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                      <p className="text-xs font-medium">Beyond Presence</p>
                      <p className="text-xs text-muted-foreground truncate" title={avatar.avatarProvider.avatarId}>
                        {avatar.avatarProvider.avatarId.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Volume2 className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-xs font-medium">Cartesia</p>
                      <p className="text-xs text-muted-foreground">
                        {avatar.voiceProvider.model || "sonic-2"}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Brain className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <p className="text-xs font-medium truncate">
                        {avatar.llmConfig.model.split("/")[1] || avatar.llmConfig.model}
                      </p>
                      <p className="text-xs text-muted-foreground">LLM</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {avatar.persona.expertise.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Session Monitor - Shows active sessions with cleanup options */}
                  <div className="mb-4">
                    <SessionMonitor avatarId={avatar._id} />
                  </div>

                  {selectedAvatar === avatar._id && (
                    <div className="border-t pt-4 mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Beyond Presence Settings</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Avatar ID: <code className="text-xs bg-muted px-1 rounded">{avatar.avatarProvider.avatarId}</code></p>
                            <p>Resolution: {avatar.avatarProvider.settings?.resolution || "720p"}</p>
                            <p>FPS: {avatar.avatarProvider.settings?.fps || 30}</p>
                            <p>Background: {avatar.avatarProvider.settings?.background || "transparent"}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Cartesia Voice Settings</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Voice ID: <code className="text-xs bg-muted px-1 rounded">{avatar.voiceProvider.voiceId.slice(0, 12)}...</code></p>
                            <p>Model: {avatar.voiceProvider.model || "sonic-2"}</p>
                            <p>Speed: {avatar.voiceProvider.settings.speed}x</p>
                            <p>Emotion: {avatar.voiceProvider.settings.emotion || "neutral"}</p>
                            <p>Language: {avatar.voiceProvider.language}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">LLM Configuration</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Model: {avatar.llmConfig.model}</p>
                            <p>Temperature: {avatar.llmConfig.temperature}</p>
                            <p>Max Tokens: {avatar.llmConfig.maxTokens}</p>
                            {avatar.llmConfig.fastModel && (
                              <p>Fast Model: {avatar.llmConfig.fastModel}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Behavior Rules</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Max Response: {avatar.behaviorRules.maxResponseLength} words</p>
                            <p>Questions: {avatar.behaviorRules.askQuestionsFrequency}</p>
                            <p>Wait Time: {avatar.behaviorRules.maxWaitTimeSeconds}s</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Teaching Style</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {avatar.persona.teachingStyle} - {avatar.persona.personality}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Bilingual Mode</h4>
                        <p className="text-sm text-muted-foreground capitalize mb-2">
                          {avatar.bilingualConfig.defaultMode.replace("_", " ")}
                        </p>
                        <div className="grid grid-cols-6 gap-2">
                          {Object.entries(avatar.bilingualConfig.germanThresholds).map(([level, pct]) => (
                            <div key={level} className="text-center">
                              <p className="text-xs font-medium">{level}</p>
                              <p className="text-xs text-muted-foreground">{pct}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAvatar(avatar._id)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/lesson/new?avatar=${avatar._id}`, "_blank")}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Test Avatar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingAvatar(avatar._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isCreating && (
          <AvatarCreator onClose={() => setIsCreating(false)} allVoices={allVoices} llmModels={dynamicModels} />
        )}

        {editingAvatar && (
          <AvatarEditor
            avatarId={editingAvatar}
            onClose={() => setEditingAvatar(null)}
            allVoices={allVoices}
            llmModels={dynamicModels}
          />
        )}

        {showVoiceManager && (
          <VoiceManager
            customVoices={customVoices}
            onAddVoice={handleAddVoice}
            onRemoveVoice={handleRemoveVoice}
            onClose={() => setShowVoiceManager(false)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deletingAvatar !== null}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingAvatar(null);
              setForceDelete(false);
            }
          }}
        >
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Delete Avatar
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  {deletionInfo === undefined ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : deletionInfo === null ? (
                    <p>Avatar not found.</p>
                  ) : (
                    <>
                      <p>
                        Are you sure you want to delete{" "}
                        <strong>{deletionInfo.avatar.name}</strong>? This action
                        cannot be undone.
                      </p>

                      {!deletionInfo.canDelete && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-800 dark:text-red-200">
                              {deletionInfo.blockingReason}
                            </span>
                          </div>

                          {/* Active sessions list and cleanup button */}
                          {activeSessions && activeSessions.length > 0 && (
                            <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950">
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                  Active Sessions ({activeSessions.length})
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleEndActiveSessions}
                                  disabled={isEndingSessions}
                                  className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                                >
                                  {isEndingSessions ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Ending...
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      End All Sessions
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="max-h-32 overflow-y-auto">
                                {activeSessions.map((session) => (
                                  <div
                                    key={session._id}
                                    className="flex items-center justify-between px-3 py-2 text-xs border-t border-blue-100 dark:border-blue-900"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={session.status === "active" ? "default" : "secondary"}
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        {session.status}
                                      </Badge>
                                      <span className="text-muted-foreground">
                                        {session.studentName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      {session.durationMinutes}m
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <input
                              type="checkbox"
                              id="forceDelete"
                              checked={forceDelete}
                              onChange={(e) => setForceDelete(e.target.checked)}
                              className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                            />
                            <label htmlFor="forceDelete" className="text-sm text-amber-800 dark:text-amber-200 cursor-pointer">
                              <strong>Force Delete:</strong> Mark all active sessions as &ldquo;abandoned&rdquo; and delete anyway.
                              These are likely orphaned sessions that weren&apos;t properly closed.
                            </label>
                          </div>
                        </div>
                      )}

                      {deletionInfo.canDelete && (
                        <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                          <p className="font-medium">
                            The following data will be affected:
                          </p>
                          <ul className="space-y-1 text-muted-foreground">
                            {deletionInfo.counts.totalSessions > 0 && (
                              <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                {deletionInfo.counts.totalSessions} session(s)
                                will be deleted
                              </li>
                            )}
                            {deletionInfo.counts.structuredLessons > 0 && (
                              <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                {deletionInfo.counts.structuredLessons}{" "}
                                structured lesson(s) will be deleted
                              </li>
                            )}
                            {deletionInfo.counts.studentsWithPreference > 0 && (
                              <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                {deletionInfo.counts.studentsWithPreference}{" "}
                                student preference(s) will be cleared
                              </li>
                            )}
                            {deletionInfo.counts.groupsWithDefault > 0 && (
                              <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                {deletionInfo.counts.groupsWithDefault} group
                                default(s) will be cleared
                              </li>
                            )}
                            {deletionInfo.counts.entryTestTemplates > 0 && (
                              <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                {deletionInfo.counts.entryTestTemplates} entry
                                test template(s) will be updated
                              </li>
                            )}
                            {deletionInfo.counts.totalSessions === 0 &&
                              deletionInfo.counts.structuredLessons === 0 &&
                              deletionInfo.counts.studentsWithPreference === 0 &&
                              deletionInfo.counts.groupsWithDefault === 0 &&
                              deletionInfo.counts.entryTestTemplates === 0 && (
                                <li className="flex items-center gap-2 text-green-600">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  No related data will be affected
                                </li>
                              )}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAvatar}
                disabled={
                  isDeleting ||
                  deletionInfo === undefined ||
                  deletionInfo === null ||
                  (!deletionInfo.canDelete && !forceDelete)
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Avatar
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Session Monitor Component - Shows active sessions for an avatar with cleanup button
function SessionMonitor({ avatarId }: { avatarId: Id<"avatars"> }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);

  const sessions = useQuery(api.sessions.getActiveSessionsByAvatar, { avatarId });
  const sessionStats = useQuery(api.sessions.getSessionStatsForAvatar, { avatarId });
  const endSessions = useMutation(api.sessions.endSessionsForAvatar);
  const cleanupStale = useMutation(api.sessions.cleanupStaleSessionsForAvatar);
  const forceEndSession = useMutation(api.sessions.forceEndSession);
  const deleteHistoricalSessions = useMutation(api.sessions.deleteHistoricalSessionsForAvatar);

  // Format session type for display
  const formatSessionType = (type: string) => {
    const typeMap: Record<string, string> = {
      structured_lesson: "Lesson",
      quick_practice: "Practice",
      free_conversation: "Chat",
      vocabulary_review: "Vocab",
      pronunciation_drill: "Pronun.",
      presentation: "Slides",
    };
    return typeMap[type] || type;
  };

  // Format start time
  const formatStartTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return date.toLocaleDateString();
  };

  // End a single session
  const handleEndSession = async (sessionId: Id<"sessions">) => {
    setEndingSessionId(sessionId);
    try {
      await forceEndSession({
        sessionId,
        reason: "admin_cleanup",
      });
      toast.success("Session ended");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to end session");
    } finally {
      setEndingSessionId(null);
    }
  };

  const sessionCount = sessions?.length ?? 0;

  const handleEndAll = async () => {
    setIsEnding(true);
    try {
      const result = await endSessions({
        avatarId,
        reason: "admin_cleanup",
      });
      toast.success(`Ended ${result.endedCount} session(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to end sessions");
    } finally {
      setIsEnding(false);
    }
  };

  const handleCleanupStale = async () => {
    setIsEnding(true);
    try {
      const result = await cleanupStale({
        avatarId,
        maxAgeMinutes: 60, // 1 hour
      });
      if (result.cleanedCount > 0) {
        toast.success(`Cleaned up ${result.cleanedCount} stale session(s)`);
      } else {
        toast.info("No stale sessions found");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cleanup sessions");
    } finally {
      setIsEnding(false);
    }
  };

  const handleDeleteHistory = async () => {
    setIsDeletingHistory(true);
    try {
      const result = await deleteHistoricalSessions({
        avatarId,
        confirmDelete: true,
      });
      toast.success(`Deleted ${result.deletedCount} historical session(s)`);
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete sessions");
    } finally {
      setIsDeletingHistory(false);
    }
  };

  const historicalCount = sessionStats?.historical ?? 0;

  if (sessions === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading sessions...
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Delete History Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg p-6 max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Session History
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete <strong>{historicalCount}</strong> historical sessions
              (completed and abandoned). This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingHistory}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteHistory}
                disabled={isDeletingHistory}
              >
                {isDeletingHistory ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Delete {historicalCount} Sessions
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
          sessionCount > 0 ? "bg-blue-50 dark:bg-blue-950/50" : "bg-muted/30"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sessions</span>
          <Badge
            variant={sessionCount > 0 ? "default" : "secondary"}
            className="text-xs"
          >
            {sessionCount} active
          </Badge>
          {historicalCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs text-muted-foreground"
            >
              {historicalCount} history
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {historicalCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear History
            </Button>
          )}
          {sessionCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleEndAll();
              }}
              disabled={isEnding}
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isEnding ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  End All
                </>
              )}
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t">
          {sessionCount === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No active sessions for this avatar
            </div>
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="px-3 py-2 text-sm border-b last:border-b-0 hover:bg-muted/30"
                  >
                    {/* Row 1: Status, Type, Student Name, End Button */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={session.status === "active" ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {session.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {formatSessionType(session.type)}
                        </Badge>
                        <span className="font-medium text-foreground">
                          {session.studentName}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEndSession(session._id)}
                        disabled={endingSessionId === session._id}
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {endingSessionId === session._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            End
                          </>
                        )}
                      </Button>
                    </div>
                    {/* Row 2: Room name, Duration, Start time */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pl-1">
                      <span className="font-mono truncate max-w-[150px]" title={session.roomName}>
                        {session.roomName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.durationMinutes}m
                      </span>
                      <span className="text-muted-foreground/70">
                        Started {formatStartTime(session.startedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 bg-muted/20 border-t flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCleanupStale}
                  disabled={isEnding}
                  className="h-7 text-xs"
                >
                  {isEnding ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  Cleanup Stale ({">"}1h)
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AvatarCreator({ onClose, allVoices, llmModels }: { onClose: () => void; allVoices: Voice[]; llmModels: LLMModel[] }) {
  const [activeTab, setActiveTab] = useState<"basic" | "voice" | "avatar" | "llm" | "vision" | "behavior" | "personality" | "identity" | "knowledge" | "memory" | "lifeStory" | "sessionStart" | "sessionTimer">("basic");
  const [modelSearch, setModelSearch] = useState("");
  const knowledgeBases = useQuery(api.knowledgeBases.list);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    profileImage: "",
    role: "English Teacher",
    personaDescription: "Warm, patient, encouraging",
    teachingStyle: "supportive" as const,
    expertise: ["Grammar", "Conversation"],
    beyAvatarId: "",
    beyResolution: "720p",
    beyFps: 30,
    beyBackground: "transparent",
    cartesiaVoiceId: "a0e99841-438c-4a64-b679-ae501e7d6091",
    cartesiaModel: "sonic-2",
    cartesiaSpeed: 1.0,
    cartesiaEmotion: "neutral",
    cartesiaEmotionValue: ["positivity:medium"] as string[],
    cartesiaLanguage: "en",
    // Language mode: english, german, or bilingual
    languageMode: "english" as "english" | "german" | "bilingual",
    bilingualDefault: "en" as "en" | "de",
    bilingualSystemPrompt: `# Language - BILINGUAL MODE
You are fluent in both German and English.
- If your default is German: START conversations in German, switch to English when asked
- If your default is English: START conversations in English, switch to German when asked
- When the student speaks German, respond in German
- When the student speaks English, respond in English
- You can naturally code-switch between languages when it helps explain something
- When correcting mistakes, you may explain in German if the student struggles with English`,
    // STT Config
    sttModel: "nova-3",
    sttLanguage: "en",
    sttEndpointing: 600,
    // LLM Config
    llmProvider: "openrouter" as LLMProvider,
    llmModel: "anthropic/claude-sonnet-4-20250514",
    llmTemperature: 0.7,
    llmMaxTokens: 1024,
    // Vision config
    visionEnabled: false,
    visionLLMModel: "google/gemini-3-flash-preview",
    visionCaptureMode: "smart" as "on_demand" | "always" | "smart",
    visionCaptureWebcam: true,
    visionCaptureScreen: true,
    maxResponseLength: 80,
    askQuestionsFrequency: "often" as const,
    maxWaitTimeSeconds: 15,
    // Structured personality/identity/knowledge/memory
    personality: null as any,
    identity: null as any,
    knowledgeConfig: null as any,
    memoryConfig: null as any,
    // Life Story & Session Start
    lifeStoryDocument: null as string | null,
    lifeStorySummary: null as string | null,
    sessionStartConfig: null as any,
    // Session Duration Config
    sessionDurationMinutes: null as number | null,  // null = no limit
    sessionWrapUpBufferMinutes: 2,
    sessionAutoEnd: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const createAvatar = useMutation(api.avatars.createAvatar);
  const generateUploadUrl = useMutation(api.avatars.generateProfileImageUploadUrl);
  const getStorageUrl = useMutation(api.avatars.getStorageUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createAvatar({
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description,
        profileImage: formData.profileImage || undefined,
        avatarProvider: {
          type: "beyond_presence",
          avatarId: formData.beyAvatarId || "b9be11b8-89fb-4227-8f86-4a881393cbdb",
          settings: {
            resolution: formData.beyResolution,
            fps: formData.beyFps,
            background: formData.beyBackground,
          },
        },
        voiceProvider: {
          type: "cartesia",
          voiceId: formData.cartesiaVoiceId,
          language: formData.cartesiaLanguage,
          model: formData.cartesiaModel,
          languageMode: formData.languageMode,
          bilingualDefault: formData.bilingualDefault,
          settings: {
            speed: formData.cartesiaSpeed,
            emotion: formData.cartesiaEmotionValue,  // Array format for Cartesia
          },
        },
        sttConfig: {
          provider: "deepgram" as const,
          model: formData.sttModel,
          language: formData.sttLanguage,
          settings: {
            endpointing: formData.sttEndpointing,
          },
        },
        llmConfig: {
          provider: formData.llmProvider,
          model: formData.llmModel,
          temperature: formData.llmTemperature,
          maxTokens: formData.llmMaxTokens,
        },
        visionConfig: formData.visionEnabled ? {
          enabled: true,
          visionLLMModel: formData.visionLLMModel,
          captureMode: formData.visionCaptureMode,
          captureWebcam: formData.visionCaptureWebcam,
          captureScreen: formData.visionCaptureScreen,
        } : { enabled: false },
        persona: {
          role: formData.role,
          personality: formData.personaDescription,
          expertise: formData.expertise,
          teachingStyle: formData.teachingStyle,
        },
        bilingualConfig: {
          supportedLanguages: ["en", "de"],
          defaultMode: "adaptive",
          germanThresholds: { A1: 70, A2: 50, B1: 20, B2: 5, C1: 0, C2: 0 },
          systemPrompt: formData.languageMode === "bilingual" ? formData.bilingualSystemPrompt : undefined,
        },
        systemPrompts: {
          base: `You are ${formData.name}, a ${formData.role}. ${formData.personaDescription}. Help students improve their English through conversation.`,
        },
        behaviorRules: {
          maxResponseLength: formData.maxResponseLength,
          preferShortResponses: true,
          askQuestionsFrequency: formData.askQuestionsFrequency,
          waitForStudentResponse: true,
          maxWaitTimeSeconds: formData.maxWaitTimeSeconds,
        },
        appearance: {
          avatarImage: `/avatars/${formData.slug || formData.name.toLowerCase()}.png`,
        },
        // Structured personality/identity/knowledge/memory
        personality: formData.personality || undefined,
        identity: formData.identity || undefined,
        knowledgeConfig: formData.knowledgeConfig || undefined,
        memoryConfig: formData.memoryConfig || undefined,
        // Session timer config
        sessionConfig: formData.sessionDurationMinutes ? {
          defaultDurationMinutes: formData.sessionDurationMinutes,
          wrapUpBufferMinutes: formData.sessionWrapUpBufferMinutes,
          autoEnd: formData.sessionAutoEnd,
        } : undefined,
      });

      toast.success("Avatar created successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to create avatar");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "lifeStory", label: "📖 Life Story" },
    { id: "sessionStart", label: "▶️ Session Start" },
    { id: "sessionTimer", label: "⏱️ Session Timer" },
    { id: "personality", label: "Personality" },
    { id: "identity", label: "Identity" },
    { id: "knowledge", label: "Knowledge" },
    { id: "memory", label: "Memory" },
    { id: "avatar", label: "Beyond Presence" },
    { id: "voice", label: "Cartesia Voice" },
    { id: "llm", label: "LLM Config" },
    { id: "vision", label: "👁️ Vision" },
    { id: "behavior", label: "Behavior" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <CardTitle>Create New Avatar</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <div className="flex-shrink-0 border-b px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="flex-1 overflow-y-auto pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "basic" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      placeholder="Emma"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      placeholder="emma-teacher"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    rows={2}
                    placeholder="A friendly English teacher specializing in..."
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Profile Image</label>
                  <div className="mt-1 flex items-center gap-3">
                    {/* Preview */}
                    {formData.profileImage && (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-muted flex-shrink-0">
                        <img
                          src={formData.profileImage}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {/* Upload Button */}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                        <Upload className="w-4 h-4" />
                        {isUploadingImage ? "Uploading..." : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsUploadingImage(true);
                            try {
                              // Get upload URL from Convex
                              const uploadUrl = await generateUploadUrl();

                              // Upload file to Convex storage
                              const result = await fetch(uploadUrl, {
                                method: "POST",
                                headers: { "Content-Type": file.type },
                                body: file,
                              });

                              if (!result.ok) throw new Error("Upload failed");

                              const { storageId } = await result.json();

                              // Get the URL for the uploaded file
                              const url = await getStorageUrl({ storageId });

                              // Update local form state
                              setFormData({ ...formData, profileImage: url });
                              toast.success("Profile image uploaded!");
                            } catch (error) {
                              console.error("Upload error:", error);
                              toast.error("Failed to upload image");
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Image shown in the loading circle before avatar connects
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      placeholder="English Teacher"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Teaching Style</label>
                    <select
                      value={formData.teachingStyle}
                      onChange={(e) => setFormData({ ...formData, teachingStyle: e.target.value as typeof formData.teachingStyle })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="supportive">Supportive</option>
                      <option value="socratic">Socratic</option>
                      <option value="direct">Direct</option>
                      <option value="challenging">Challenging</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Personality Description</label>
                  <input
                    type="text"
                    value={formData.personaDescription}
                    onChange={(e) => setFormData({ ...formData, personaDescription: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    placeholder="Warm, patient, encouraging"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Brief personality description. For detailed traits, use the Personality tab.
                  </p>
                </div>
              </>
            )}

            {activeTab === "personality" && (
              <PersonalityTraitsEditor
                value={formData.personality}
                onChange={(data) => setFormData({ ...formData, personality: data })}
              />
            )}

            {activeTab === "identity" && (
              <IdentityEditor
                value={formData.identity}
                onChange={(data) => setFormData({ ...formData, identity: data })}
                avatarName={formData.name}
              />
            )}

            {activeTab === "knowledge" && (
              <KnowledgeBaseEditor
                value={formData.knowledgeConfig}
                onChange={(data) => setFormData({ ...formData, knowledgeConfig: data })}
                availableKnowledgeBases={knowledgeBases?.map(kb => ({
                  _id: kb._id,
                  name: kb.name,
                  description: kb.description,
                  status: kb.status,
                })) || []}
              />
            )}

            {activeTab === "memory" && (
              <MemoryConfigEditor
                value={formData.memoryConfig}
                onChange={(data) => setFormData({ ...formData, memoryConfig: data })}
              />
            )}

            {activeTab === "lifeStory" && (
              <LifeStoryEditor
                avatarName={formData.name}
                value={{
                  lifeStoryDocument: formData.lifeStoryDocument || undefined,
                  lifeStorySummary: formData.lifeStorySummary || undefined,
                }}
                onChange={(data) => setFormData({
                  ...formData,
                  lifeStoryDocument: data.lifeStoryDocument || null,
                  lifeStorySummary: data.lifeStorySummary || null,
                })}
              />
            )}

            {activeTab === "sessionStart" && (
              <SessionStartEditor
                value={formData.sessionStartConfig}
                onChange={(data) => setFormData({ ...formData, sessionStartConfig: data })}
              />
            )}

            {activeTab === "sessionTimer" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Session Timer Configuration</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Configure default session duration for this avatar. Sessions will automatically wrap up
                    and end when time expires. Individual lessons can override these defaults.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Default Session Duration</label>
                  <select
                    value={formData.sessionDurationMinutes ?? "unlimited"}
                    onChange={(e) => setFormData({
                      ...formData,
                      sessionDurationMinutes: e.target.value === "unlimited" ? null : parseInt(e.target.value)
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="unlimited">No Limit (Unlimited)</option>
                    <option value="10">10 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 hour)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose the default lesson duration. Students will be notified when time is running out.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Wrap-Up Buffer (minutes)</label>
                  <select
                    value={formData.sessionWrapUpBufferMinutes}
                    onChange={(e) => setFormData({
                      ...formData,
                      sessionWrapUpBufferMinutes: parseInt(e.target.value)
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="1">1 minute before end</option>
                    <option value="2">2 minutes before end (Recommended)</option>
                    <option value="3">3 minutes before end</option>
                    <option value="5">5 minutes before end</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How long before the session ends to start wrapping up. The avatar will summarize
                    the lesson and ask for final questions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sessionAutoEnd"
                    checked={formData.sessionAutoEnd}
                    onChange={(e) => setFormData({ ...formData, sessionAutoEnd: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="sessionAutoEnd" className="text-sm font-medium">
                    Automatically end session when time expires
                  </label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  When enabled, the session will automatically close after the avatar finishes the closing message.
                  When disabled, the avatar will say goodbye but the student can continue if they wish.
                </p>
              </div>
            )}

            {activeTab === "avatar" && (
              <>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                  <h4 className="font-medium text-purple-900 mb-1">Beyond Presence Configuration</h4>
                  <p className="text-sm text-purple-700">
                    Configure the real-time AI avatar video streaming. Get your Avatar ID from the{" "}
                    <a href="https://app.bey.chat" target="_blank" rel="noopener" className="underline">
                      Beyond Presence Dashboard
                    </a>.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Avatar ID *</label>
                  <input
                    type="text"
                    value={formData.beyAvatarId}
                    onChange={(e) => setFormData({ ...formData, beyAvatarId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
                    placeholder="b9be11b8-89fb-4227-8f86-4a881393cbdb"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use the default avatar from environment
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Resolution</label>
                    <select
                      value={formData.beyResolution}
                      onChange={(e) => setFormData({ ...formData, beyResolution: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="480p">480p</option>
                      <option value="720p">720p (Recommended)</option>
                      <option value="1080p">1080p</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">FPS</label>
                    <select
                      value={formData.beyFps}
                      onChange={(e) => setFormData({ ...formData, beyFps: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value={24}>24 fps</option>
                      <option value={30}>30 fps (Recommended)</option>
                      <option value={60}>60 fps</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Background</label>
                    <select
                      value={formData.beyBackground}
                      onChange={(e) => setFormData({ ...formData, beyBackground: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="transparent">Transparent</option>
                      <option value="blur">Blur</option>
                      <option value="solid">Solid Color</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "voice" && (
              <>
                {/* TTS Section */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-1">Text-to-Speech (TTS)</h4>
                  <p className="text-sm text-blue-700">
                    Configure voice synthesis with Cartesia Sonic for ultra-low latency.
                  </p>
                </div>

                <VoiceSelector
                  voices={allVoices}
                  selectedVoiceId={formData.cartesiaVoiceId}
                  onSelect={(id) => setFormData({ ...formData, cartesiaVoiceId: id })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">TTS Model</label>
                    <select
                      value={formData.cartesiaModel}
                      onChange={(e) => setFormData({ ...formData, cartesiaModel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      {CARTESIA_TTS_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Voice Emotion</label>
                    <select
                      value={formData.cartesiaEmotion}
                      onChange={(e) => {
                        const preset = CARTESIA_EMOTION_PRESETS.find(p => p.id === e.target.value);
                        setFormData({
                          ...formData,
                          cartesiaEmotion: e.target.value,
                          cartesiaEmotionValue: preset?.value || []
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      {CARTESIA_EMOTION_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Speed: {formData.cartesiaSpeed}x</label>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.1"
                      value={formData.cartesiaSpeed}
                      onChange={(e) => setFormData({ ...formData, cartesiaSpeed: parseFloat(e.target.value) })}
                      className="w-full mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <select
                      value={formData.cartesiaLanguage}
                      onChange={(e) => setFormData({ ...formData, cartesiaLanguage: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="en">English</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>

                {/* Language Mode Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Language Mode</label>
                    <select
                      value={formData.languageMode}
                      onChange={(e) => setFormData({ ...formData, languageMode: e.target.value as "english" | "german" | "bilingual" })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="english">English Only</option>
                      <option value="german">German Only</option>
                      <option value="bilingual">Bilingual (EN + DE)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls STT and TTS language detection
                    </p>
                  </div>
                  {formData.languageMode === "bilingual" && (
                    <div>
                      <label className="text-sm font-medium">Bilingual Default</label>
                      <select
                        value={formData.bilingualDefault}
                        onChange={(e) => setFormData({ ...formData, bilingualDefault: e.target.value as "en" | "de" })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      >
                        <option value="en">Start in English</option>
                        <option value="de">Start in German</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Default language for TTS (can switch at runtime)
                      </p>
                    </div>
                  )}
                </div>

                {/* Bilingual System Prompt */}
                {formData.languageMode === "bilingual" && (
                  <div>
                    <label className="text-sm font-medium">Bilingual System Prompt</label>
                    <textarea
                      value={formData.bilingualSystemPrompt}
                      onChange={(e) => setFormData({ ...formData, bilingualSystemPrompt: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
                      rows={8}
                      placeholder="Instructions for how the avatar should handle German/English switching..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Custom instructions for bilingual behavior (injected into system prompt)
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Custom Voice ID</label>
                  <input
                    type="text"
                    value={formData.cartesiaVoiceId}
                    onChange={(e) => setFormData({ ...formData, cartesiaVoiceId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
                    placeholder="a0e99841-438c-4a64-b679-ae501e7d6091"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Override with a custom voice ID from Cartesia
                  </p>
                </div>

                {/* STT Section */}
                <div className="border-t pt-6 mt-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <h4 className="font-medium text-green-900 mb-1">Speech-to-Text (STT)</h4>
                    <p className="text-sm text-green-700">
                      Configure speech recognition with Deepgram for accurate transcription.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">STT Model</label>
                      <select
                        value={formData.sttModel}
                        onChange={(e) => setFormData({ ...formData, sttModel: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      >
                        {DEEPGRAM_STT_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Language</label>
                      <select
                        value={formData.sttLanguage}
                        onChange={(e) => setFormData({ ...formData, sttLanguage: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      >
                        <option value="en">English</option>
                        <option value="de">German</option>
                        <option value="multi">Multi-language</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-medium">Endpointing: {formData.sttEndpointing}ms</label>
                    <input
                      type="range"
                      min="300"
                      max="1500"
                      step="100"
                      value={formData.sttEndpointing}
                      onChange={(e) => setFormData({ ...formData, sttEndpointing: parseInt(e.target.value) })}
                      className="w-full mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Silence duration before ending an utterance (lower = faster, higher = more natural pauses)
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "llm" && (
              <>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <h4 className="font-medium text-green-900 mb-1">LLM Configuration</h4>
                  <p className="text-sm text-green-700">
                    {formData.llmProvider === "cerebras"
                      ? "⚡ Cerebras: GLM-4.7 (1000 tok/s, agentic) or Llama 3.3 (2314 tok/s, fast). Both with 131k context!"
                      : "Configure the AI brain via OpenRouter. Claude Sonnet 4 is recommended for best teaching quality."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">LLM Provider</label>
                    <select
                      value={formData.llmProvider}
                      onChange={(e) => {
                        const newProvider = e.target.value as LLMProvider;
                        setFormData({
                          ...formData,
                          llmProvider: newProvider,
                          llmModel: newProvider === "cerebras" ? "llama-3.3-70b" : "anthropic/claude-sonnet-4-20250514"
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="openrouter">OpenRouter (Claude, GPT, Gemini, etc.)</option>
                      <option value="cerebras">⚡ Cerebras (GLM-4.7 + Llama)</option>
                    </select>
                  </div>

                  {formData.llmProvider === "openrouter" && (
                    <div>
                      <label className="text-sm font-medium">Search Models</label>
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                        placeholder="Search OpenRouter models..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Select Model</label>
                    <select
                      value={formData.llmModel}
                      onChange={(e) => setFormData({ ...formData, llmModel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      {formData.llmProvider === "cerebras" ? (
                        CEREBRAS_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))
                      ) : (
                        llmModels
                          .filter(m =>
                            m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                            m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
                            m.id === formData.llmModel
                          )
                          .map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))
                      )}
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Currently selected: <span className="font-mono">{formData.llmModel}</span>
                      {formData.llmProvider === "cerebras" && (
                        <span className="ml-2 text-yellow-600">⚡ 2,314 tok/s</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Temperature: {formData.llmTemperature}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.llmTemperature}
                      onChange={(e) => setFormData({ ...formData, llmTemperature: parseFloat(e.target.value) })}
                      className="w-full mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lower = more focused, Higher = more creative
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Tokens</label>
                    <input
                      type="number"
                      value={formData.llmMaxTokens}
                      onChange={(e) => setFormData({ ...formData, llmMaxTokens: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      min={256}
                      max={4096}
                    />
                  </div>
                </div>

                {formData.llmProvider === "cerebras" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Note:</strong> Cerebras models don&apos;t support vision. If you need vision capabilities, use OpenRouter with Gemini or Claude 3.5.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === "vision" && (
              <>
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg mb-4">
                  <h4 className="font-medium text-cyan-900 mb-1">👁️ Vision Configuration</h4>
                  <p className="text-sm text-cyan-700">
                    Enable the avatar to see the student's webcam or screen. Ensure your main LLM (under LLM Config) supports vision (e.g., Gemini or Claude 3.5).
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg mb-4">
                  <input
                    type="checkbox"
                    id="visionEnabled"
                    checked={formData.visionEnabled}
                    onChange={(e) => setFormData({ ...formData, visionEnabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <label htmlFor="visionEnabled" className="font-medium cursor-pointer">
                      Enable Vision
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Allow the avatar to see the student via webcam or screen share
                    </p>
                  </div>
                </div>

                {formData.visionEnabled && (
                  <>
                    <div className="mb-4">
                      <label className="text-sm font-medium">Capture Mode</label>
                      <select
                        value={formData.visionCaptureMode}
                        onChange={(e) => setFormData({ ...formData, visionCaptureMode: e.target.value as typeof formData.visionCaptureMode })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      >
                        <option value="smart">Smart (AI decides when to look)</option>
                        <option value="on_demand">On Demand (Only when user asks)</option>
                        <option value="always">Always (Every turn)</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        "Smart" is recommended - captures when slides are shown or student is presenting
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          id="captureWebcam"
                          checked={formData.visionCaptureWebcam}
                          onChange={(e) => setFormData({ ...formData, visionCaptureWebcam: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <label htmlFor="captureWebcam" className="cursor-pointer">
                          <span className="font-medium">Webcam</span>
                          <p className="text-xs text-muted-foreground">See the student's face</p>
                        </label>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          id="captureScreen"
                          checked={formData.visionCaptureScreen}
                          onChange={(e) => setFormData({ ...formData, visionCaptureScreen: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <label htmlFor="captureScreen" className="cursor-pointer">
                          <span className="font-medium">Screen Share</span>
                          <p className="text-xs text-muted-foreground">See slides/documents</p>
                        </label>
                      </div>
                    </div>

                    <p className="text-sm text-amber-600 mt-4 p-3 bg-amber-50 rounded-lg">
                      ⚠️ Vision requires a Gemini model (google/gemini-*) in the LLM config for best results.
                    </p>
                  </>
                )}
              </>
            )}

            {activeTab === "behavior" && (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <h4 className="font-medium text-amber-900 mb-1">Conversation Behavior</h4>
                  <p className="text-sm text-amber-700">
                    Control how the avatar behaves during teaching conversations.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Max Response Length (words)</label>
                    <input
                      type="number"
                      value={formData.maxResponseLength}
                      onChange={(e) => setFormData({ ...formData, maxResponseLength: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      min={20}
                      max={200}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Shorter responses feel more conversational
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Question Frequency</label>
                    <select
                      value={formData.askQuestionsFrequency}
                      onChange={(e) => setFormData({ ...formData, askQuestionsFrequency: e.target.value as typeof formData.askQuestionsFrequency })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="always">Always</option>
                      <option value="often">Often</option>
                      <option value="sometimes">Sometimes</option>
                      <option value="rarely">Rarely</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Max Wait Time: {formData.maxWaitTimeSeconds}s</label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={formData.maxWaitTimeSeconds}
                    onChange={(e) => setFormData({ ...formData, maxWaitTimeSeconds: parseInt(e.target.value) })}
                    className="w-full mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How long to wait for student response before prompting
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Avatar"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AvatarEditor({ avatarId, onClose, allVoices, llmModels }: { avatarId: Id<"avatars">; onClose: () => void; allVoices: Voice[]; llmModels: LLMModel[] }) {
  const avatar = useQuery(api.avatars.getAvatar, { avatarId });
  const updateAvatar = useMutation(api.avatars.updateAvatar);
  const updateLifeStory = useMutation(api.avatars.updateLifeStory);
  const updateSessionStartConfig = useMutation(api.avatars.updateSessionStartConfig);
  const generateUploadUrl = useMutation(api.avatars.generateProfileImageUploadUrl);
  const saveProfileImage = useMutation(api.avatars.saveProfileImage);
  const knowledgeBases = useQuery(api.knowledgeBases.list);

  // Combine default voices with avatar's Voice Library voices
  const combinedVoices = useMemo(() => {
    const libraryVoices: Voice[] = (avatar?.voiceConfigs || []).map((vc: { id: string; name: string; voiceId: string; language: string }) => ({
      id: vc.voiceId,
      name: `📚 ${vc.name}`,
      lang: vc.language,
      isCustom: true,
    }));
    // Put library voices first, then default voices
    return [...libraryVoices, ...allVoices];
  }, [avatar?.voiceConfigs, allVoices]);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "voice" | "voiceLibrary" | "avatar" | "llm" | "vision" | "behavior" | "personality" | "identity" | "knowledge" | "memory" | "lifeStory" | "sessionStart" | "sessionTimer">("basic");
  const [modelSearch, setModelSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    profileImage: string;
    role: string;
    personaDescription: string;
    teachingStyle: "supportive" | "socratic" | "direct" | "challenging";
    expertise: string[];
    beyAvatarId: string;
    beyResolution: string;
    beyFps: number;
    beyBackground: string;
    cartesiaVoiceId: string;
    cartesiaModel: string;
    cartesiaSpeed: number;
    cartesiaEmotion: string;
    cartesiaEmotionValue: string[];
    cartesiaLanguage: string;
    // Language mode
    languageMode: "english" | "german" | "bilingual";
    bilingualDefault: "en" | "de";
    bilingualSystemPrompt: string;
    // STT Config
    sttModel: string;
    sttLanguage: string;
    sttEndpointing: number;
    // LLM Config
    llmProvider: LLMProvider;
    llmModel: string;
    llmTemperature: number;
    llmMaxTokens: number;
    // Vision config
    visionEnabled: boolean;
    visionLLMModel: string;
    visionCaptureMode: "on_demand" | "always" | "smart";
    visionCaptureWebcam: boolean;
    visionCaptureScreen: boolean;
    maxResponseLength: number;
    askQuestionsFrequency: "always" | "often" | "sometimes" | "rarely";
    maxWaitTimeSeconds: number;
    systemPrompt: string;
    // New personality/identity/knowledge/memory fields
    personality: any;
    identity: any;
    knowledgeConfig: any;
    memoryConfig: any;
    // Life Story & Session Start
    lifeStoryDocument: string | null;
    lifeStorySummary: string | null;
    sessionStartConfig: any;
    // Session Duration Config
    sessionDurationMinutes: number | null;
    sessionWrapUpBufferMinutes: number;
    sessionAutoEnd: boolean;
  } | null>(null);

  useEffect(() => {
    if (avatar && !formData) {
      setFormData({
        name: avatar.name,
        slug: avatar.slug,
        description: avatar.description,
        profileImage: avatar.profileImage || "",
        role: avatar.persona.role,
        personaDescription: avatar.persona.personality,
        teachingStyle: avatar.persona.teachingStyle,
        expertise: avatar.persona.expertise,
        beyAvatarId: avatar.avatarProvider.avatarId,
        beyResolution: avatar.avatarProvider.settings?.resolution || "720p",
        beyFps: avatar.avatarProvider.settings?.fps || 30,
        beyBackground: avatar.avatarProvider.settings?.background || "transparent",
        cartesiaVoiceId: avatar.voiceProvider.voiceId,
        cartesiaModel: avatar.voiceProvider.model || "sonic-2",
        cartesiaSpeed: avatar.voiceProvider.settings.speed,
        cartesiaEmotion: typeof avatar.voiceProvider.settings.emotion === 'string'
          ? avatar.voiceProvider.settings.emotion
          : "neutral",
        cartesiaEmotionValue: Array.isArray(avatar.voiceProvider.settings.emotion)
          ? avatar.voiceProvider.settings.emotion
          : ["positivity:medium"],
        cartesiaLanguage: avatar.voiceProvider.language,
        // Language mode
        languageMode: (avatar.voiceProvider as any).languageMode || "english",
        bilingualDefault: (avatar.voiceProvider as any).bilingualDefault || "en",
        bilingualSystemPrompt: avatar.bilingualConfig?.systemPrompt || `# Language - BILINGUAL MODE
You are fluent in both German and English.
- If your default is German: START conversations in German, switch to English when asked
- If your default is English: START conversations in English, switch to German when asked
- When the student speaks German, respond in German
- When the student speaks English, respond in English
- You can naturally code-switch between languages when it helps explain something
- When correcting mistakes, you may explain in German if the student struggles with English`,
        // STT Config
        sttModel: avatar.sttConfig?.model || "nova-3",
        sttLanguage: avatar.sttConfig?.language || "en",
        sttEndpointing: avatar.sttConfig?.settings?.endpointing || 600,
        // LLM Config
        llmProvider: (avatar.llmConfig.provider || "openrouter") as LLMProvider,
        llmModel: avatar.llmConfig.model,
        llmTemperature: avatar.llmConfig.temperature,
        llmMaxTokens: avatar.llmConfig.maxTokens,
        // Load vision config (defaults for old avatars without it)
        visionEnabled: avatar.visionConfig?.enabled ?? false,
        visionLLMModel: avatar.visionConfig?.visionLLMModel ?? "google/gemini-flash-1.5",
        visionCaptureMode: avatar.visionConfig?.captureMode ?? "smart",
        visionCaptureWebcam: avatar.visionConfig?.captureWebcam ?? true,
        visionCaptureScreen: avatar.visionConfig?.captureScreen ?? true,
        maxResponseLength: avatar.behaviorRules.maxResponseLength,
        askQuestionsFrequency: avatar.behaviorRules.askQuestionsFrequency,
        maxWaitTimeSeconds: avatar.behaviorRules.maxWaitTimeSeconds,
        systemPrompt: avatar.systemPrompts.base,
        // Initialize new fields
        personality: avatar.personality ?? null,
        identity: avatar.identity ?? null,
        knowledgeConfig: avatar.knowledgeConfig ?? null,
        memoryConfig: avatar.memoryConfig ?? null,
        // Life Story & Session Start
        lifeStoryDocument: avatar.lifeStoryDocument ?? null,
        lifeStorySummary: avatar.lifeStorySummary ?? null,
        sessionStartConfig: avatar.sessionStartConfig ?? null,
        // Session Duration Config
        sessionDurationMinutes: avatar.sessionConfig?.defaultDurationMinutes ?? null,
        sessionWrapUpBufferMinutes: avatar.sessionConfig?.wrapUpBufferMinutes ?? 2,
        sessionAutoEnd: avatar.sessionConfig?.autoEnd ?? true,
      });
    }
  }, [avatar, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);

    try {
      await updateAvatar({
        avatarId,
        updates: {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          profileImage: formData.profileImage || undefined,
          avatarProvider: {
            type: "beyond_presence" as const,
            avatarId: formData.beyAvatarId,
            settings: {
              resolution: formData.beyResolution,
              fps: formData.beyFps,
              background: formData.beyBackground,
            },
          },
          voiceProvider: {
            type: "cartesia" as const,
            voiceId: formData.cartesiaVoiceId,
            language: formData.cartesiaLanguage,
            model: formData.cartesiaModel,
            languageMode: formData.languageMode,
            bilingualDefault: formData.bilingualDefault,
            settings: {
              speed: formData.cartesiaSpeed,
              emotion: formData.cartesiaEmotionValue,  // Array format for Cartesia
            },
          },
          sttConfig: {
            provider: "deepgram" as const,
            model: formData.sttModel,
            language: formData.sttLanguage,
            settings: {
              endpointing: formData.sttEndpointing,
            },
          },
          llmConfig: {
            provider: formData.llmProvider,
            model: formData.llmModel,
            temperature: formData.llmTemperature,
            maxTokens: formData.llmMaxTokens,
          },
          persona: {
            role: formData.role,
            personality: formData.personaDescription,
            expertise: formData.expertise,
            teachingStyle: formData.teachingStyle,
          },
          systemPrompts: {
            base: formData.systemPrompt,
          },
          bilingualConfig: {
            supportedLanguages: ["en", "de"],
            defaultMode: "adaptive",
            germanThresholds: { A1: 70, A2: 50, B1: 20, B2: 5, C1: 0, C2: 0 },
            systemPrompt: formData.languageMode === "bilingual" ? formData.bilingualSystemPrompt : undefined,
          },
          behaviorRules: {
            maxResponseLength: formData.maxResponseLength,
            preferShortResponses: true,
            askQuestionsFrequency: formData.askQuestionsFrequency,
            waitForStudentResponse: true,
            maxWaitTimeSeconds: formData.maxWaitTimeSeconds,
          },
          visionConfig: formData.visionEnabled ? {
            enabled: true,
            visionLLMModel: formData.visionLLMModel,
            captureMode: formData.visionCaptureMode,
            captureWebcam: formData.visionCaptureWebcam,
            captureScreen: formData.visionCaptureScreen,
          } : { enabled: false },
          // New personality/identity/knowledge/memory fields
          personality: formData.personality || undefined,
          identity: formData.identity || undefined,
          knowledgeConfig: formData.knowledgeConfig || undefined,
          memoryConfig: formData.memoryConfig || undefined,
          // Session timer config
          sessionConfig: formData.sessionDurationMinutes ? {
            defaultDurationMinutes: formData.sessionDurationMinutes,
            wrapUpBufferMinutes: formData.sessionWrapUpBufferMinutes,
            autoEnd: formData.sessionAutoEnd,
          } : undefined,
        },
      });

      toast.success("Avatar updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update avatar");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "lifeStory", label: "📖 Life Story" },
    { id: "sessionStart", label: "▶️ Session Start" },
    { id: "sessionTimer", label: "⏱️ Session Timer" },
    { id: "personality", label: "Personality" },
    { id: "identity", label: "Identity" },
    { id: "knowledge", label: "Knowledge" },
    { id: "memory", label: "Memory" },
    { id: "avatar", label: "Beyond Presence" },
    { id: "voice", label: "Primary Voice" },
    { id: "voiceLibrary", label: "🎤 Voice Library" },
    { id: "llm", label: "LLM Config" },
    { id: "vision", label: "👁️ Vision" },
    { id: "behavior", label: "Behavior" },
  ];

  if (!avatar || !formData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <CardTitle>Edit Avatar: {avatar.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <div className="flex-shrink-0 border-b px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="flex-1 overflow-y-auto pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "basic" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Profile Image</label>
                  <div className="mt-1 flex items-center gap-3">
                    {/* Preview */}
                    {formData.profileImage && (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-muted flex-shrink-0">
                        <img
                          src={formData.profileImage}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {/* Upload Button */}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                        <Upload className="w-4 h-4" />
                        {isUploadingImage ? "Uploading..." : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsUploadingImage(true);
                            try {
                              // Get upload URL from Convex
                              const uploadUrl = await generateUploadUrl();

                              // Upload file to Convex storage
                              const result = await fetch(uploadUrl, {
                                method: "POST",
                                headers: { "Content-Type": file.type },
                                body: file,
                              });

                              if (!result.ok) throw new Error("Upload failed");

                              const { storageId } = await result.json();

                              // Save the profile image to the avatar
                              const saveResult = await saveProfileImage({
                                avatarId,
                                storageId,
                              });

                              // Update local form state
                              setFormData({ ...formData, profileImage: saveResult.url });
                              toast.success("Profile image uploaded!");
                            } catch (error) {
                              console.error("Upload error:", error);
                              toast.error("Failed to upload image");
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Image shown in the loading circle before avatar connects
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Teaching Style</label>
                    <select
                      value={formData.teachingStyle}
                      onChange={(e) => setFormData({ ...formData, teachingStyle: e.target.value as typeof formData.teachingStyle })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="supportive">Supportive</option>
                      <option value="socratic">Socratic</option>
                      <option value="direct">Direct</option>
                      <option value="challenging">Challenging</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Personality Description</label>
                  <input
                    type="text"
                    value={formData.personaDescription}
                    onChange={(e) => setFormData({ ...formData, personaDescription: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    placeholder="Warm, patient, encouraging"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Brief personality description. For detailed traits, use the Personality tab.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">System Prompt</label>
                  <textarea
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
                    rows={6}
                  />
                </div>
              </>
            )}

            {activeTab === "personality" && (
              <PersonalityTraitsEditor
                value={formData.personality}
                onChange={(data) => setFormData({ ...formData, personality: data })}
              />
            )}

            {activeTab === "identity" && (
              <IdentityEditor
                value={formData.identity}
                onChange={(data) => setFormData({ ...formData, identity: data })}
                avatarName={formData.name}
              />
            )}

            {activeTab === "knowledge" && (
              <KnowledgeBaseEditor
                value={formData.knowledgeConfig}
                onChange={(data) => setFormData({ ...formData, knowledgeConfig: data })}
                availableKnowledgeBases={knowledgeBases?.map(kb => ({
                  _id: kb._id,
                  name: kb.name,
                  description: kb.description,
                  status: kb.status,
                })) || []}
              />
            )}

            {activeTab === "memory" && (
              <MemoryConfigEditor
                value={formData.memoryConfig}
                onChange={(data) => setFormData({ ...formData, memoryConfig: data })}
              />
            )}

            {activeTab === "lifeStory" && (
              <LifeStoryEditor
                avatarName={formData.name}
                value={{
                  lifeStoryDocument: formData.lifeStoryDocument || undefined,
                  lifeStorySummary: formData.lifeStorySummary || undefined,
                }}
                onChange={async (data) => {
                  setFormData({
                    ...formData,
                    lifeStoryDocument: data.lifeStoryDocument || null,
                    lifeStorySummary: data.lifeStorySummary || null,
                  });
                  // Auto-save life story separately
                  try {
                    await updateLifeStory({
                      avatarId,
                      lifeStoryDocument: data.lifeStoryDocument,
                      lifeStorySummary: data.lifeStorySummary,
                    });
                    toast.success("Life story saved");
                  } catch (error) {
                    console.error("Failed to save life story:", error);
                  }
                }}
              />
            )}

            {activeTab === "sessionStart" && (
              <SessionStartEditor
                value={formData.sessionStartConfig}
                onChange={async (data) => {
                  setFormData({ ...formData, sessionStartConfig: data });
                  // Auto-save session config separately
                  try {
                    await updateSessionStartConfig({
                      avatarId,
                      sessionStartConfig: data,
                    });
                    toast.success("Session start config saved");
                  } catch (error) {
                    console.error("Failed to save session config:", error);
                  }
                }}
              />
            )}

            {activeTab === "sessionTimer" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Session Timer Configuration</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Configure default session duration for this avatar. The avatar will automatically
                    wrap up the lesson when time is running low and end gracefully.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Default Session Duration</label>
                  <select
                    value={formData.sessionDurationMinutes ?? "unlimited"}
                    onChange={(e) => setFormData({
                      ...formData,
                      sessionDurationMinutes: e.target.value === "unlimited" ? null : parseInt(e.target.value)
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="unlimited">No Limit (Unlimited)</option>
                    <option value="10">10 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 hour)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set the default session length. This can be overridden per lesson.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Wrap-Up Buffer (minutes before end)</label>
                  <select
                    value={formData.sessionWrapUpBufferMinutes}
                    onChange={(e) => setFormData({
                      ...formData,
                      sessionWrapUpBufferMinutes: parseInt(e.target.value)
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="1">1 minute before end</option>
                    <option value="2">2 minutes before end (Recommended)</option>
                    <option value="3">3 minutes before end</option>
                    <option value="5">5 minutes before end</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    When to start wrapping up the lesson. The avatar will summarize key points and say goodbye.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-sessionAutoEnd"
                    checked={formData.sessionAutoEnd}
                    onChange={(e) => setFormData({
                      ...formData,
                      sessionAutoEnd: e.target.checked
                    })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="edit-sessionAutoEnd" className="text-sm">
                    Automatically end session when time expires
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  If enabled, the session will end automatically after the avatar finishes wrap-up remarks.
                </p>
              </div>
            )}

            {activeTab === "avatar" && (
              <>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                  <h4 className="font-medium text-purple-900 mb-1">Beyond Presence Configuration</h4>
                  <p className="text-sm text-purple-700">
                    Configure the real-time AI avatar video streaming.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Avatar ID *</label>
                  <input
                    type="text"
                    value={formData.beyAvatarId}
                    onChange={(e) => setFormData({ ...formData, beyAvatarId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Resolution</label>
                    <select
                      value={formData.beyResolution}
                      onChange={(e) => setFormData({ ...formData, beyResolution: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">FPS</label>
                    <select
                      value={formData.beyFps}
                      onChange={(e) => setFormData({ ...formData, beyFps: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value={24}>24 fps</option>
                      <option value={30}>30 fps</option>
                      <option value={60}>60 fps</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Background</label>
                    <select
                      value={formData.beyBackground}
                      onChange={(e) => setFormData({ ...formData, beyBackground: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="transparent">Transparent</option>
                      <option value="blur">Blur</option>
                      <option value="solid">Solid Color</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "voice" && (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-1">Cartesia TTS Configuration</h4>
                  <p className="text-sm text-blue-700">
                    Configure text-to-speech with Cartesia Sonic-3. Voices from your Voice Library appear first (📚).
                  </p>
                </div>

                <VoiceSelector
                  voices={combinedVoices}
                  selectedVoiceId={formData.cartesiaVoiceId}
                  onSelect={(id) => setFormData({ ...formData, cartesiaVoiceId: id })}
                />

                <div>
                  <label className="text-sm font-medium">Model</label>
                  <select
                    value={formData.cartesiaModel}
                    onChange={(e) => setFormData({ ...formData, cartesiaModel: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="sonic-3">Sonic-3 (Latest)</option>
                    <option value="sonic-2">Sonic-2</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Speed: {formData.cartesiaSpeed}x</label>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.1"
                      value={formData.cartesiaSpeed}
                      onChange={(e) => setFormData({ ...formData, cartesiaSpeed: parseFloat(e.target.value) })}
                      className="w-full mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Emotion</label>
                    <select
                      value={formData.cartesiaEmotion}
                      onChange={(e) => setFormData({ ...formData, cartesiaEmotion: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      {CARTESIA_EMOTIONS.map((emotion) => (
                        <option key={emotion} value={emotion}>
                          {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <select
                      value={formData.cartesiaLanguage}
                      onChange={(e) => setFormData({ ...formData, cartesiaLanguage: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="en">English</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>

                {/* Language Mode Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Language Mode</label>
                    <select
                      value={formData.languageMode}
                      onChange={(e) => setFormData({ ...formData, languageMode: e.target.value as "english" | "german" | "bilingual" })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="english">English Only</option>
                      <option value="german">German Only</option>
                      <option value="bilingual">Bilingual (EN + DE)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls STT and TTS language detection
                    </p>
                  </div>
                  {formData.languageMode === "bilingual" && (
                    <div>
                      <label className="text-sm font-medium">Bilingual Default</label>
                      <select
                        value={formData.bilingualDefault}
                        onChange={(e) => setFormData({ ...formData, bilingualDefault: e.target.value as "en" | "de" })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      >
                        <option value="en">Start in English</option>
                        <option value="de">Start in German</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Default language for TTS (can switch at runtime)
                      </p>
                    </div>
                  )}
                </div>

                {/* Bilingual System Prompt */}
                {formData.languageMode === "bilingual" && (
                  <div>
                    <label className="text-sm font-medium">Bilingual System Prompt</label>
                    <textarea
                      value={formData.bilingualSystemPrompt}
                      onChange={(e) => setFormData({ ...formData, bilingualSystemPrompt: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
                      rows={8}
                      placeholder="Instructions for how the avatar should handle German/English switching..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Custom instructions for bilingual behavior (injected into system prompt)
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Custom Voice ID</label>
                  <input
                    type="text"
                    value={formData.cartesiaVoiceId}
                    onChange={(e) => setFormData({ ...formData, cartesiaVoiceId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
                  />
                </div>
              </>
            )}

            {activeTab === "voiceLibrary" && (
              <VoiceConfigManager
                avatarId={avatarId}
                avatarName={avatar.name}
              />
            )}

            {activeTab === "llm" && (
              <>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <h4 className="font-medium text-green-900 mb-1">LLM Configuration</h4>
                  <p className="text-sm text-green-700">
                    {formData.llmProvider === "cerebras"
                      ? "⚡ Cerebras: GLM-4.7 (1000 tok/s, agentic) or Llama 3.3 (2314 tok/s, fast). Both with 131k context!"
                      : "Configure the AI brain via OpenRouter. Claude Sonnet 4 is recommended for best teaching quality."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">LLM Provider</label>
                    <select
                      value={formData.llmProvider}
                      onChange={(e) => {
                        const newProvider = e.target.value as LLMProvider;
                        setFormData({
                          ...formData,
                          llmProvider: newProvider,
                          llmModel: newProvider === "cerebras" ? "llama-3.3-70b" : "anthropic/claude-sonnet-4-20250514"
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="openrouter">OpenRouter (Claude, GPT, Gemini, etc.)</option>
                      <option value="cerebras">⚡ Cerebras (GLM-4.7 + Llama)</option>
                    </select>
                  </div>

                  {formData.llmProvider === "openrouter" && (
                    <div>
                      <label className="text-sm font-medium">Search Models</label>
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                        placeholder="Search OpenRouter models..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Select Model</label>
                    <select
                      value={formData.llmModel}
                      onChange={(e) => setFormData({ ...formData, llmModel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      {formData.llmProvider === "cerebras" ? (
                        CEREBRAS_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))
                      ) : (
                        llmModels
                          .filter(m =>
                            m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                            m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
                            m.id === formData.llmModel
                          )
                          .map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))
                      )}
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Currently selected: <span className="font-mono">{formData.llmModel}</span>
                      {formData.llmProvider === "cerebras" && (
                        <span className="ml-2 text-yellow-600">⚡ 2,314 tok/s</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Temperature: {formData.llmTemperature}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.llmTemperature}
                      onChange={(e) => setFormData({ ...formData, llmTemperature: parseFloat(e.target.value) })}
                      className="w-full mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lower = more focused, Higher = more creative
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Tokens</label>
                    <input
                      type="number"
                      value={formData.llmMaxTokens}
                      onChange={(e) => setFormData({ ...formData, llmMaxTokens: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      min={256}
                      max={4096}
                    />
                  </div>
                </div>

                {formData.llmProvider === "cerebras" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Note:</strong> Cerebras models don&apos;t support vision. If you need vision capabilities, use OpenRouter with Gemini or Claude 3.5.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === "vision" && formData && (
              <>
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg mb-4">
                  <h4 className="font-medium text-cyan-900 mb-1">👁️ Vision Configuration</h4>
                  <p className="text-sm text-cyan-700">
                    Enable the avatar to see the student's webcam or screen. Ensure your main LLM (under LLM Config) supports vision (e.g., Gemini or Claude 3.5).
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg mb-4">
                  <input
                    type="checkbox"
                    id="visionEnabledEdit"
                    checked={formData.visionEnabled}
                    onChange={(e) => setFormData({ ...formData, visionEnabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <label htmlFor="visionEnabledEdit" className="font-medium cursor-pointer">
                      Enable Vision
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Allow the avatar to see the student via webcam or screen share
                    </p>
                  </div>
                </div>

                {formData.visionEnabled && (
                  <>
                    <div className="mb-4">
                      <label className="text-sm font-medium">Capture Mode</label>
                      <select
                        value={formData.visionCaptureMode}
                        onChange={(e) => setFormData({ ...formData, visionCaptureMode: e.target.value as typeof formData.visionCaptureMode })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      >
                        <option value="smart">Smart (AI decides when to look)</option>
                        <option value="on_demand">On Demand (Only when user asks)</option>
                        <option value="always">Always (Every turn)</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        "Smart" is recommended - captures when slides are shown or student is presenting
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          id="captureWebcamEdit"
                          checked={formData.visionCaptureWebcam}
                          onChange={(e) => setFormData({ ...formData, visionCaptureWebcam: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <label htmlFor="captureWebcamEdit" className="cursor-pointer">
                          <span className="font-medium">Webcam</span>
                          <p className="text-xs text-muted-foreground">See the student's face</p>
                        </label>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          id="captureScreenEdit"
                          checked={formData.visionCaptureScreen}
                          onChange={(e) => setFormData({ ...formData, visionCaptureScreen: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <label htmlFor="captureScreenEdit" className="cursor-pointer">
                          <span className="font-medium">Screen Share</span>
                          <p className="text-xs text-muted-foreground">See slides/documents</p>
                        </label>
                      </div>
                    </div>

                    <p className="text-sm text-amber-600 mt-4 p-3 bg-amber-50 rounded-lg">
                      ⚠️ Vision requires a Gemini model (google/gemini-*) in the LLM config for best results.
                    </p>
                  </>
                )}
              </>
            )}

            {activeTab === "behavior" && (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <h4 className="font-medium text-amber-900 mb-1">Conversation Behavior</h4>
                  <p className="text-sm text-amber-700">
                    Control how the avatar behaves during teaching conversations.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Max Response Length (words)</label>
                    <input
                      type="number"
                      value={formData.maxResponseLength}
                      onChange={(e) => setFormData({ ...formData, maxResponseLength: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                      min={20}
                      max={200}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Question Frequency</label>
                    <select
                      value={formData.askQuestionsFrequency}
                      onChange={(e) => setFormData({ ...formData, askQuestionsFrequency: e.target.value as typeof formData.askQuestionsFrequency })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="always">Always</option>
                      <option value="often">Often</option>
                      <option value="sometimes">Sometimes</option>
                      <option value="rarely">Rarely</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Max Wait Time: {formData.maxWaitTimeSeconds}s</label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={formData.maxWaitTimeSeconds}
                    onChange={(e) => setFormData({ ...formData, maxWaitTimeSeconds: parseInt(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function VoiceSelector({
  voices,
  selectedVoiceId,
  onSelect,
}: {
  voices: Voice[];
  selectedVoiceId: string;
  onSelect: (id: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = async (voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingId === voiceId) {
      setPlayingId(null);
      setIsPlaying(false);
      return;
    }

    setPlayingId(voiceId);
    setIsPlaying(true);

    try {
      const response = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingId(null);
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setPlayingId(null);
        setIsPlaying(false);
        toast.error("Failed to play audio");
      };

      await audio.play();
    } catch (error) {
      console.error("Play voice error:", error);
      toast.error("Failed to preview voice");
      setPlayingId(null);
      setIsPlaying(false);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium">Voice</label>
      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
        {voices.map((voice) => (
          <div
            key={voice.id}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedVoiceId === voice.id
              ? "bg-primary/10 border border-primary"
              : "hover:bg-muted"
              }`}
            onClick={() => onSelect(voice.id)}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={selectedVoiceId === voice.id}
                onChange={() => onSelect(voice.id)}
                className="w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium">{voice.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{voice.id.slice(0, 12)}...</p>
              </div>
              {voice.isCustom && (
                <Badge variant="outline" className="text-xs">Custom</Badge>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayVoice(voice.id);
              }}
              disabled={isPlaying && playingId !== voice.id}
            >
              {playingId === voice.id ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoiceManager({
  customVoices,
  onAddVoice,
  onRemoveVoice,
  onClose,
}: {
  customVoices: Voice[];
  onAddVoice: (voice: Voice) => void;
  onRemoveVoice: (id: string) => void;
  onClose: () => void;
}) {
  const [newVoiceName, setNewVoiceName] = useState("");
  const [newVoiceId, setNewVoiceId] = useState("");
  const [newVoiceLang, setNewVoiceLang] = useState("en");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAddVoice = () => {
    if (!newVoiceName.trim() || !newVoiceId.trim()) {
      toast.error("Name and Voice ID are required");
      return;
    }

    if (customVoices.some(v => v.id === newVoiceId)) {
      toast.error("Voice ID already exists");
      return;
    }

    onAddVoice({
      id: newVoiceId.trim(),
      name: newVoiceName.trim(),
      lang: newVoiceLang,
    });

    setNewVoiceName("");
    setNewVoiceId("");
  };

  const handleTestVoice = async (voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingId === voiceId) {
      setPlayingId(null);
      setIsPlaying(false);
      return;
    }

    setPlayingId(voiceId);
    setIsPlaying(true);

    try {
      const response = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingId(null);
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (error) {
      console.error("Test voice error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to test voice");
      setPlayingId(null);
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <CardTitle>Manage Voices</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">Add Custom Voice</h4>
            <p className="text-sm text-blue-700 mb-4">
              Add voices from your Cartesia account. Get Voice IDs from the{" "}
              <a href="https://play.cartesia.ai/voices" target="_blank" rel="noopener" className="underline">
                Cartesia Voice Library
              </a>.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium">Voice Name</label>
                <input
                  type="text"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="My Custom Voice"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Language</label>
                <select
                  value={newVoiceLang}
                  onChange={(e) => setNewVoiceLang(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium">Voice ID</label>
              <input
                type="text"
                value={newVoiceId}
                onChange={(e) => setNewVoiceId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => newVoiceId && handleTestVoice(newVoiceId)}
                variant="outline"
                disabled={!newVoiceId || isPlaying}
              >
                {playingId === newVoiceId ? (
                  <Square className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Test Voice
              </Button>
              <Button onClick={handleAddVoice} disabled={!newVoiceName || !newVoiceId}>
                <Plus className="w-4 h-4 mr-2" />
                Add Voice
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Default Voices</h4>
            <div className="space-y-2">
              {DEFAULT_VOICES.map((voice) => (
                <div
                  key={voice.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{voice.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{voice.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestVoice(voice.id)}
                    disabled={isPlaying && playingId !== voice.id}
                  >
                    {playingId === voice.id ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {customVoices.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Custom Voices</h4>
              <div className="space-y-2">
                {customVoices.map((voice) => (
                  <div
                    key={voice.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{voice.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{voice.id}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestVoice(voice.id)}
                        disabled={isPlaying && playingId !== voice.id}
                      >
                        {playingId === voice.id ? (
                          <Square className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveVoice(voice.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <div className="flex-shrink-0 p-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
