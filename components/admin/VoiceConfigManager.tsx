"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Volume2,
  Plus,
  Trash2,
  Edit,
  Play,
  Square,
  Star,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  VOICE_PRESETS_BY_CATEGORY,
  ALL_CARTESIA_VOICE_PRESETS,
  type CartesiaVoicePreset,
} from "@/lib/cartesia-voice-presets";

// Types
interface VoiceConfig {
  id: string;
  name: string;
  voiceId: string;
  language: string;
  provider?: "cartesia" | "elevenlabs" | "openai";
  model?: string;
  isDefault?: boolean;
  settings?: {
    speed?: number;
    pitch?: number;
    emotion?: string | string[];
  };
  description?: string;
  createdAt?: number;
}

interface VoiceConfigManagerProps {
  avatarId: Id<"avatars">;
  avatarName: string;
}

// Language options
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
];

// TTS Model options
const TTS_MODELS = [
  { value: "sonic-2", label: "Sonic 2 (90ms latency, best quality)" },
  { value: "sonic-turbo", label: "Sonic Turbo (40ms, for quick responses)" },
  { value: "sonic-3", label: "Sonic 3 (laughter, enhanced emotions)" },
];

// Emotion presets
const EMOTION_PRESETS = [
  { value: "none", label: "Default" },
  { value: "positivity:medium", label: "Positive (Warm)" },
  { value: "positivity:high", label: "Enthusiastic" },
  { value: "curiosity:medium", label: "Curious" },
  { value: "positivity:low", label: "Calm" },
];

export function VoiceConfigManager({ avatarId, avatarName }: VoiceConfigManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<VoiceConfig | null>(null);
  const [deletingConfigId, setDeletingConfigId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    voiceId: "",
    language: "en",
    provider: "cartesia" as "cartesia" | "elevenlabs" | "openai",
    model: "sonic-2",
    isDefault: false,
    speed: 1.0,
    emotion: "none",
    description: "",
  });

  // Voice preset selection
  const [usePreset, setUsePreset] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  // Convex queries and mutations
  const voiceConfigs = useQuery(api.avatars.getVoiceConfigs, { avatarId });
  const addVoiceConfig = useMutation(api.avatars.addVoiceConfig);
  const updateVoiceConfig = useMutation(api.avatars.updateVoiceConfig);
  const deleteVoiceConfig = useMutation(api.avatars.deleteVoiceConfig);
  const setDefaultVoice = useMutation(api.avatars.setDefaultVoiceConfig);

  // Reset form
  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      voiceId: "",
      language: "en",
      provider: "cartesia",
      model: "sonic-2",
      isDefault: false,
      speed: 1.0,
      emotion: "none",
      description: "",
    });
    setUsePreset(true);
    setSelectedPresetId("");
  };

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = ALL_CARTESIA_VOICE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFormData({
        ...formData,
        id: preset.id,
        name: preset.name,
        voiceId: preset.voiceId,
        language: preset.language,
        description: preset.description,
      });
    }
  };

  // Generate ID from name
  const generateId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  // Handle name change and auto-generate ID
  const handleNameChange = (name: string) => {
    const newId = editingConfig ? formData.id : generateId(name);
    setFormData({ ...formData, name, id: newId });
  };

  // Open edit dialog
  const openEditDialog = (config: VoiceConfig) => {
    setEditingConfig(config);
    // Check if this voice matches a preset
    const matchingPreset = ALL_CARTESIA_VOICE_PRESETS.find(p => p.voiceId === config.voiceId);
    setUsePreset(!!matchingPreset);
    setSelectedPresetId(matchingPreset?.id || "");
    setFormData({
      id: config.id,
      name: config.name,
      voiceId: config.voiceId,
      language: config.language,
      provider: config.provider || "cartesia",
      model: config.model || "sonic-2",
      isDefault: config.isDefault || false,
      speed: config.settings?.speed || 1.0,
      emotion: Array.isArray(config.settings?.emotion)
        ? config.settings?.emotion[0] || "none"
        : config.settings?.emotion || "none",
      description: config.description || "",
    });
    setIsAddDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.voiceId || !formData.language) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const configData = {
        id: formData.id || generateId(formData.name),
        name: formData.name,
        voiceId: formData.voiceId,
        language: formData.language,
        provider: formData.provider,
        model: formData.model,
        isDefault: formData.isDefault,
        settings: {
          speed: formData.speed,
          emotion: formData.emotion && formData.emotion !== "none" ? [formData.emotion] : undefined,
        },
        description: formData.description || undefined,
      };

      if (editingConfig) {
        await updateVoiceConfig({
          avatarId,
          configId: editingConfig.id,
          updates: {
            name: configData.name,
            voiceId: configData.voiceId,
            language: configData.language,
            provider: configData.provider,
            model: configData.model,
            isDefault: configData.isDefault,
            settings: configData.settings,
            description: configData.description,
          },
        });
        toast.success("Voice configuration updated");
      } else {
        await addVoiceConfig({
          avatarId,
          config: configData,
        });
        toast.success("Voice configuration added");
      }

      setIsAddDialogOpen(false);
      setEditingConfig(null);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save voice configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingConfigId) return;

    try {
      await deleteVoiceConfig({ avatarId, configId: deletingConfigId });
      toast.success("Voice configuration deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete voice configuration");
    } finally {
      setDeletingConfigId(null);
    }
  };

  // Handle set default
  const handleSetDefault = async (configId: string) => {
    try {
      await setDefaultVoice({ avatarId, configId });
      toast.success("Default voice updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set default voice");
    }
  };

  // Handle voice preview
  const handlePlayVoice = async (voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingId === voiceId) {
      setPlayingId(null);
      return;
    }

    setPlayingId(voiceId);

    try {
      const response = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(url);
      };

      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error("Play voice error:", error);
      toast.error("Failed to preview voice");
      setPlayingId(null);
    }
  };

  // Handle copy voice ID
  const handleCopyVoiceId = async (voiceId: string) => {
    try {
      await navigator.clipboard.writeText(voiceId);
      setCopiedId(voiceId);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Voice ID copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Group configs by language
  const groupedConfigs = (voiceConfigs || []).reduce((acc, config) => {
    const lang = config.language;
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(config);
    return acc;
  }, {} as Record<string, VoiceConfig[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice Library
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage multiple Cartesia voices for {avatarName}
          </p>
        </div>
        <Button type="button" onClick={() => { resetForm(); setEditingConfig(null); setIsAddDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Voice
        </Button>
      </div>

      {/* Info card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            Add multiple voice configurations with custom names and language tags.
            The Python agent will use the default voice for each language in bilingual mode.
            Get voice IDs from the{" "}
            <a
              href="https://play.cartesia.ai/voices"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              Cartesia Voice Library
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Voice configs list */}
      {!voiceConfigs ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : voiceConfigs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Volume2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h4 className="font-medium mb-2">No Voice Configurations</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add voice configurations for different languages or styles
            </p>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Voice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedConfigs).map(([lang, configs]) => (
            <div key={lang} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {LANGUAGE_OPTIONS.find(l => l.value === lang)?.label || lang}
              </h4>
              <div className="grid gap-2">
                {configs.map((config) => (
                  <Card key={config.id} className={config.isDefault ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{config.name}</span>
                              {config.isDefault && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <code className="bg-muted px-1 rounded">
                                {config.voiceId.slice(0, 12)}...
                              </code>
                              <button
                                onClick={() => handleCopyVoiceId(config.voiceId)}
                                className="hover:text-foreground"
                              >
                                {copiedId === config.voiceId ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <span>|</span>
                              <span>{config.model || "sonic-2"}</span>
                              {config.settings?.speed && config.settings.speed !== 1.0 && (
                                <>
                                  <span>|</span>
                                  <span>{config.settings.speed}x</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePlayVoice(config.voiceId)}
                          >
                            {playingId === config.voiceId ? (
                              <Square className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          {!config.isDefault && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(config.id)}
                              title="Set as default for this language"
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(config)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingConfigId(config.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {config.description && (
                        <p className="mt-2 text-sm text-muted-foreground pl-13">
                          {config.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingConfig(null);
          resetForm();
        }
        setIsAddDialogOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Edit Voice Configuration" : "Add Voice Configuration"}
            </DialogTitle>
            <DialogDescription>
              Configure a voice for {avatarName}. You can add multiple voices per language.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Voice Selection Mode Toggle */}
            {!editingConfig && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUsePreset(true)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    usePreset
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Preset Voices</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUsePreset(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    !usePreset
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Custom Voice ID</span>
                </button>
              </div>
            )}

            {/* Preset Voice Selector */}
            {usePreset && !editingConfig && (
              <div className="space-y-2">
                <Label>Select a Voice Preset</Label>
                <Select
                  value={selectedPresetId}
                  onValueChange={handlePresetSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a voice..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(VOICE_PRESETS_BY_CATEGORY).map(([category, voices]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          {category}
                        </div>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div className="flex items-center gap-2">
                              <span>{voice.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({voice.tags.slice(0, 2).join(", ")})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPresetId && (
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    {(() => {
                      const preset = ALL_CARTESIA_VOICE_PRESETS.find(p => p.id === selectedPresetId);
                      if (!preset) return null;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{preset.name}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlayVoice(preset.voiceId)}
                              disabled={playingId === preset.voiceId}
                            >
                              {playingId === preset.voiceId ? (
                                <>
                                  <Square className="w-3 h-3 mr-1" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 mr-1" />
                                  Preview
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{preset.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {preset.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Name - show for custom mode or when editing */}
            {(!usePreset || editingConfig) && (
              <div className="space-y-2">
                <Label htmlFor="name">Display Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Emma English, Emma German"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                {formData.id && (
                  <p className="text-xs text-muted-foreground">
                    ID: <code className="bg-muted px-1 rounded">{formData.id}</code>
                  </p>
                )}
              </div>
            )}

            {/* Voice ID - show for custom mode or when editing */}
            {(!usePreset || editingConfig) && (
              <div className="space-y-2">
                <Label htmlFor="voiceId">Cartesia Voice ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="voiceId"
                    placeholder="e.g., 1463a4e1-56a1-4b41-b257-728d56e93605"
                    value={formData.voiceId}
                    onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                    className="font-mono text-sm"
                  />
                  {formData.voiceId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handlePlayVoice(formData.voiceId)}
                      disabled={playingId === formData.voiceId}
                    >
                      {playingId === formData.voiceId ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Get voice IDs from{" "}
                  <a
                    href="https://play.cartesia.ai/voices"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Cartesia Voice Library
                  </a>
                </p>
              </div>
            )}

            {/* Language - show for custom mode or when editing */}
            {(!usePreset || editingConfig) && (
              <div className="space-y-2">
                <Label htmlFor="language">Language *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">TTS Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {TTS_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <Label>Speed: {formData.speed.toFixed(2)}x</Label>
              <Slider
                value={[formData.speed]}
                onValueChange={([value]) => setFormData({ ...formData, speed: value })}
                min={0.5}
                max={2.0}
                step={0.05}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x (Slower)</span>
                <span>2.0x (Faster)</span>
              </div>
            </div>

            {/* Emotion */}
            <div className="space-y-2">
              <Label htmlFor="emotion">Emotion Preset</Label>
              <Select
                value={formData.emotion}
                onValueChange={(value) => setFormData({ ...formData, emotion: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emotion" />
                </SelectTrigger>
                <SelectContent>
                  {EMOTION_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Default toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Set as Default</Label>
                <p className="text-xs text-muted-foreground">
                  Use this voice by default for {LANGUAGE_OPTIONS.find(l => l.value === formData.language)?.label || formData.language}
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Notes (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Professional, warm tone for lessons..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingConfig ? "Save Changes" : "Add Voice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingConfigId} onOpenChange={(open) => !open && setDeletingConfigId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voice Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the voice configuration. The avatar will fall back to other voices for this language.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
