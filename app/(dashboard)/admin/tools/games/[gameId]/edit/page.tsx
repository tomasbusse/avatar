"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Eye,
  Trash2,
  Plus,
  GripVertical,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  GameType,
  CEFRLevel,
  GameCategory,
  Block,
  BlockCategory,
  BLOCK_CATEGORY_COLORS,
  getGameTypeDisplayName,
} from "@/types/word-games";
import { AIGenerationPanel } from "@/components/games/ai-generation-panel";

// ============================================
// SENTENCE BUILDER EDITOR (supports multi-item)
// ============================================

interface SentenceItem {
  id: string;
  targetSentence: string;
  availableBlocks: Block[];
  distractorBlocks?: Block[];
  explanation?: string;
}

interface SentenceBuilderConfig {
  type?: string;
  targetSentence?: string;
  availableBlocks?: Block[];
  distractorBlocks?: Block[];
  items?: SentenceItem[];
}

interface SentenceBuilderEditorProps {
  config: SentenceBuilderConfig;
  onChange: (config: unknown) => void;
}

function SentenceBuilderEditor({ config, onChange }: SentenceBuilderEditorProps) {
  // Convert to multi-item format internally
  const initialItems = (): SentenceItem[] => {
    if (Array.isArray(config.items) && config.items.length > 0) {
      return config.items;
    }
    // Legacy single-item format
    if (config.targetSentence || (config.availableBlocks && config.availableBlocks.length > 0)) {
      return [{
        id: "item-1",
        targetSentence: config.targetSentence || "",
        availableBlocks: config.availableBlocks || [],
        distractorBlocks: config.distractorBlocks || [],
      }];
    }
    // Empty - create one blank item
    return [{
      id: "item-1",
      targetSentence: "",
      availableBlocks: [],
      distractorBlocks: [],
    }];
  };

  const [items, setItems] = useState<SentenceItem[]>(initialItems);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Sync with config changes (e.g., from AI generation)
  useEffect(() => {
    const newItems = initialItems();
    if (JSON.stringify(newItems) !== JSON.stringify(items)) {
      setItems(newItems);
      setCurrentItemIndex(0);
    }
  }, [config]);

  const updateConfig = (newItems: SentenceItem[]) => {
    // Always save in multi-item format
    onChange({
      type: "sentence_builder",
      items: newItems,
    });
  };

  const currentItem = items[currentItemIndex] || items[0];

  const updateCurrentItem = (updates: Partial<SentenceItem>) => {
    const newItems = items.map((item, idx) =>
      idx === currentItemIndex ? { ...item, ...updates } : item
    );
    setItems(newItems);
    updateConfig(newItems);
  };

  const addItem = () => {
    const newItem: SentenceItem = {
      id: `item-${Date.now()}`,
      targetSentence: "",
      availableBlocks: [],
      distractorBlocks: [],
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setCurrentItemIndex(newItems.length - 1);
    updateConfig(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setCurrentItemIndex(Math.min(currentItemIndex, newItems.length - 1));
    updateConfig(newItems);
  };

  const addBlock = (isDistractor: boolean) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      text: "",
      category: "main",
    };
    if (isDistractor) {
      updateCurrentItem({
        distractorBlocks: [...(currentItem.distractorBlocks || []), newBlock],
      });
    } else {
      updateCurrentItem({
        availableBlocks: [...currentItem.availableBlocks, newBlock],
      });
    }
  };

  const updateBlock = (id: string, field: keyof Block, value: string, isDistractor: boolean) => {
    if (isDistractor) {
      updateCurrentItem({
        distractorBlocks: (currentItem.distractorBlocks || []).map(b =>
          b.id === id ? { ...b, [field]: value } : b
        ),
      });
    } else {
      updateCurrentItem({
        availableBlocks: currentItem.availableBlocks.map(b =>
          b.id === id ? { ...b, [field]: value } : b
        ),
      });
    }
  };

  const removeBlock = (id: string, isDistractor: boolean) => {
    if (isDistractor) {
      updateCurrentItem({
        distractorBlocks: (currentItem.distractorBlocks || []).filter(b => b.id !== id),
      });
    } else {
      updateCurrentItem({
        availableBlocks: currentItem.availableBlocks.filter(b => b.id !== id),
      });
    }
  };

  const categories: BlockCategory[] = [
    "subject", "aux", "modal", "main", "negation", "object", "time", "connector"
  ];

  return (
    <div className="space-y-6">
      {/* Item Navigation */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sentence {currentItemIndex + 1} of {items.length}</span>
          <div className="flex gap-1">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentItemIndex(idx)}
                className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                  idx === currentItemIndex
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Add Sentence
          </Button>
          {items.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeItem(currentItemIndex)}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Target Sentence */}
      <div className="space-y-2">
        <Label>Target Sentence (Correct Answer)</Label>
        <Input
          value={currentItem.targetSentence}
          onChange={(e) => updateCurrentItem({ targetSentence: e.target.value })}
          placeholder="I have been working here for three years"
        />
        <p className="text-xs text-muted-foreground">
          The sentence students need to build. Blocks will be matched against this.
        </p>
      </div>

      {/* Available Blocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Available Blocks ({currentItem.availableBlocks.length})</Label>
          <Button size="sm" variant="outline" onClick={() => addBlock(false)}>
            <Plus className="h-4 w-4 mr-1" /> Add Block
          </Button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {currentItem.availableBlocks.map((block) => (
            <div key={block.id} className="flex gap-2 items-center">
              <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                value={block.text}
                onChange={(e) => updateBlock(block.id, "text", e.target.value, false)}
                placeholder="Block text"
                className="flex-1"
              />
              <Select
                value={block.category}
                onValueChange={(v) => updateBlock(block.id, "category", v, false)}
              >
                <SelectTrigger className="w-[120px] flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: BLOCK_CATEGORY_COLORS[cat] }}
                        />
                        <span className="capitalize">{cat}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeBlock(block.id, false)}
                className="text-red-500 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {currentItem.availableBlocks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No blocks yet. Add blocks or generate with AI.
            </p>
          )}
        </div>
      </div>

      {/* Distractor Blocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Distractor Blocks ({(currentItem.distractorBlocks || []).length})</Label>
          <Button size="sm" variant="outline" onClick={() => addBlock(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Distractor
          </Button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {(currentItem.distractorBlocks || []).map((block) => (
            <div key={block.id} className="flex gap-2 items-center">
              <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                value={block.text}
                onChange={(e) => updateBlock(block.id, "text", e.target.value, true)}
                placeholder="Distractor text"
                className="flex-1"
              />
              <Select
                value={block.category}
                onValueChange={(v) => updateBlock(block.id, "category", v, true)}
              >
                <SelectTrigger className="w-[120px] flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: BLOCK_CATEGORY_COLORS[cat] }}
                        />
                        <span className="capitalize">{cat}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeBlock(block.id, true)}
                className="text-red-500 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(currentItem.distractorBlocks || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No distractors. Add some wrong options to increase difficulty.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// JSON EDITOR
// ============================================

interface JsonEditorProps {
  config: unknown;
  onChange: (config: unknown) => void;
}

function JsonEditor({ config, onChange }: JsonEditorProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError("Invalid JSON");
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={jsonText}
        onChange={(e) => handleChange(e.target.value)}
        className="font-mono text-sm min-h-[400px]"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ============================================
// MAIN EDITOR PAGE
// ============================================

export default function GameEditorPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as Id<"wordGames">;

  const game = useQuery(api.wordGames.getGame, { gameId });
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateGame = useMutation(api.wordGames.updateGame);
  const createGame = useMutation(api.wordGames.createGame);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [level, setLevel] = useState<CEFRLevel>("B1");
  const [category, setCategory] = useState<GameCategory>("grammar");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [config, setConfig] = useState<unknown>({});
  const [hints, setHints] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<"template" | "json">("template");

  // Load game data
  useEffect(() => {
    if (game) {
      setTitle(game.title);
      setInstructions(game.instructions);
      setLevel(game.level);
      setCategory(game.category);
      setStatus(game.status);
      setConfig(game.config);
      setHints(game.hints);
    }
  }, [game]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateGame({
        gameId,
        title,
        instructions,
        level,
        category,
        status,
        config,
        hints,
      });
      toast.success("Game saved successfully!");
    } catch (error) {
      toast.error("Failed to save game");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const addHint = () => {
    setHints([...hints, ""]);
  };

  const updateHint = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const removeHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index));
  };

  // AI Generation handlers
  const handleApplyAIChanges = (newConfig: unknown, newHints?: string[]) => {
    setConfig(newConfig);
    if (newHints) {
      setHints(newHints);
    }
    toast.success("AI changes applied! Don't forget to save.");
  };

  const handleCreateVariation = async (
    variationLevel: CEFRLevel,
    variationConfig: unknown,
    variationHints: string[],
    variationTitle: string
  ) => {
    if (!currentUser?._id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const newGameId = await createGame({
        title: variationTitle,
        instructions,
        type: game?.type as GameType,
        category,
        level: variationLevel,
        config: variationConfig,
        hints: variationHints,
        difficultyConfig: {
          hintsAvailable: variationHints.length,
          distractorDifficulty: "medium",
        },
        status: "draft",
        createdBy: currentUser._id,
      });
      toast.success(`Created ${variationLevel} variation!`, {
        action: {
          label: "Open",
          onClick: () => router.push(`/admin/tools/games/${newGameId}/edit`),
        },
      });
    } catch (error) {
      toast.error("Failed to create variation");
      console.error(error);
    }
  };

  if (!game) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/tools/games")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Game</h1>
            <p className="text-muted-foreground">
              {getGameTypeDisplayName(game.type)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/tools/games/${gameId}/preview`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as CEFRLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as GameCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grammar">Grammar</SelectItem>
                      <SelectItem value="vocabulary">Vocabulary</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Hints */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hints</CardTitle>
                <Button size="sm" variant="outline" onClick={addHint}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <CardDescription>
                Progressive hints shown when student requests help
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {hints.map((hint, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={hint}
                    onChange={(e) => updateHint(index, e.target.value)}
                    placeholder={`Hint ${index + 1}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeHint(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {hints.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hints added yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Generation Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <CardTitle>AI Assistant</CardTitle>
              </div>
              <CardDescription>
                Use AI to regenerate, enhance, or create variations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIGenerationPanel
                gameType={game.type}
                level={level}
                currentConfig={config}
                currentHints={hints}
                onApplyChanges={handleApplyAIChanges}
                onCreateVariation={handleCreateVariation}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Game Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Game Content</CardTitle>
                <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as "template" | "json")}>
                  <TabsList>
                    <TabsTrigger value="template">Template</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {editorMode === "template" ? (
                game.type === "sentence_builder" ? (
                  <SentenceBuilderEditor
                    config={config as {
                      targetSentence: string;
                      availableBlocks: Block[];
                      distractorBlocks?: Block[];
                    }}
                    onChange={setConfig}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Template editor not yet available for this game type.</p>
                    <p className="text-sm">Use JSON mode to edit the game configuration.</p>
                    <Button
                      variant="link"
                      onClick={() => setEditorMode("json")}
                      className="mt-2"
                    >
                      Switch to JSON mode
                    </Button>
                  </div>
                )
              ) : (
                <JsonEditor config={config} onChange={setConfig} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
