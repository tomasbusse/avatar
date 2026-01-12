"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles,
  RefreshCw,
  Wand2,
  Layers,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AIModelSelector } from "./ai-model-selector";
import { GamePreviewCard, VariationPreviewCard } from "./game-preview-card";
import {
  FullGenerationResult,
  EnhanceResult,
  VariationsResult,
  TokenUsage,
  EnhancementOptions,
} from "@/lib/game-generation/types";
import { GameType, CEFRLevel } from "@/types/word-games";
import { cn } from "@/lib/utils";

// Helper functions for item count
function getDefaultItemCount(gameType: GameType): number {
  const defaults: Record<GameType, number> = {
    sentence_builder: 5,
    fill_in_blank: 5,
    word_ordering: 5,
    matching_pairs: 8,
    vocabulary_matching: 8,
    word_scramble: 5,
    multiple_choice: 5,
    flashcards: 10,
    hangman: 5,
    crossword: 6,
  };
  return defaults[gameType] || 5;
}

function getItemCountDescription(gameType: GameType, count: number): string {
  if (count === 1) return "Single challenge";

  const itemNames: Record<GameType, string> = {
    sentence_builder: "sentences to build",
    fill_in_blank: "fill-in-the-blank sentences",
    word_ordering: "sentences to order",
    matching_pairs: "pairs to match",
    vocabulary_matching: "terms to match",
    word_scramble: "words to unscramble",
    multiple_choice: "questions",
    flashcards: "flashcards",
    hangman: "words to guess",
    crossword: "words in the puzzle",
  };

  return `${count} ${itemNames[gameType] || "items"}`;
}

interface AIGenerationPanelProps {
  gameType: GameType;
  level: CEFRLevel;
  currentConfig: unknown;
  currentHints: string[];
  onApplyChanges: (config: unknown, hints?: string[]) => void;
  onCreateVariation?: (level: CEFRLevel, config: unknown, hints: string[], title: string) => void;
}

export function AIGenerationPanel({
  gameType,
  level,
  currentConfig,
  currentHints,
  onApplyChanges,
  onCreateVariation,
}: AIGenerationPanelProps) {
  const [activeTab, setActiveTab] = useState("regenerate");
  const [model, setModel] = useState("anthropic/claude-3.5-sonnet");

  // Regenerate state
  const [topic, setTopic] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [itemCount, setItemCount] = useState(getDefaultItemCount(gameType));
  // Crossword-specific parameters
  const [crosswordWordsPerPuzzle, setCrosswordWordsPerPuzzle] = useState(10);
  const [crosswordPuzzleCount, setCrosswordPuzzleCount] = useState(1);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratedResult, setRegeneratedResult] = useState<FullGenerationResult | null>(null);
  const [regeneratedUsage, setRegeneratedUsage] = useState<TokenUsage | null>(null);

  // Enhance state
  const [enhancements, setEnhancements] = useState<EnhancementOptions>({
    addHints: true,
    addDistractors: false,
    addExplanations: false,
    improveQuality: false,
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<EnhanceResult | null>(null);
  const [enhanceUsage, setEnhanceUsage] = useState<TokenUsage | null>(null);

  // Variations state
  const [targetLevels, setTargetLevels] = useState<CEFRLevel[]>([]);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [variationsResult, setVariationsResult] = useState<VariationsResult | null>(null);
  const [variationsUsage, setVariationsUsage] = useState<TokenUsage | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);

  const allLevels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const availableLevels = allLevels.filter((l) => l !== level);

  // Regenerate handler
  const handleRegenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsRegenerating(true);
    setRegeneratedResult(null);

    try {
      const response = await fetch("/api/games/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "full",
          gameType,
          level,
          topic,
          model,
          // For crossword, pass both params; for others, pass itemCount
          ...(gameType === "crossword"
            ? { wordsPerPuzzle: crosswordWordsPerPuzzle, puzzleCount: crosswordPuzzleCount }
            : { itemCount }),
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to regenerate game");
        return;
      }

      setRegeneratedResult(data.result);
      setRegeneratedUsage(data.usage);
      toast.success("Game regenerated!");
    } catch (error) {
      console.error("Regeneration error:", error);
      toast.error("Failed to regenerate game");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleApplyRegenerated = () => {
    if (regeneratedResult) {
      onApplyChanges(regeneratedResult.config, regeneratedResult.hints);
      setRegeneratedResult(null);
      toast.success("Changes applied!");
    }
  };

  // Enhance handler
  const handleEnhance = async () => {
    const hasEnhancements = Object.values(enhancements).some((v) => v);
    if (!hasEnhancements) {
      toast.error("Please select at least one enhancement");
      return;
    }

    setIsEnhancing(true);
    setEnhanceResult(null);

    try {
      const response = await fetch("/api/games/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "enhance",
          gameType,
          level,
          existingConfig: currentConfig,
          model,
          enhancements,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to enhance game");
        return;
      }

      setEnhanceResult(data.result);
      setEnhanceUsage(data.usage);
      toast.success("Enhancements generated!");
    } catch (error) {
      console.error("Enhancement error:", error);
      toast.error("Failed to enhance game");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApplyEnhancements = () => {
    if (enhanceResult) {
      onApplyChanges(enhanceResult.config, enhanceResult.hints);
      setEnhanceResult(null);
      toast.success("Enhancements applied!");
    }
  };

  // Variations handler
  const handleGenerateVariations = async () => {
    if (targetLevels.length === 0) {
      toast.error("Please select at least one target level");
      return;
    }

    setIsGeneratingVariations(true);
    setVariationsResult(null);
    setSelectedVariation(null);

    try {
      const response = await fetch("/api/games/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "variations",
          gameType,
          sourceLevel: level,
          targetLevels,
          existingConfig: currentConfig,
          model,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to generate variations");
        return;
      }

      setVariationsResult(data.result);
      setVariationsUsage(data.usage);
      toast.success(`Generated ${data.result.variations.length} variations!`);
    } catch (error) {
      console.error("Variations error:", error);
      toast.error("Failed to generate variations");
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleCreateSelectedVariation = () => {
    if (variationsResult && selectedVariation !== null && onCreateVariation) {
      const variation = variationsResult.variations[selectedVariation];
      onCreateVariation(variation.level, variation.config, variation.hints, variation.title);
      toast.success(`Creating ${variation.level} variation...`);
    }
  };

  const toggleLevel = (lvl: CEFRLevel) => {
    setTargetLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Model Selection */}
        <div className="space-y-2 mb-4">
          <Label className="text-sm">AI Model</Label>
          <AIModelSelector
            value={model}
            onChange={setModel}
            disabled={isRegenerating || isEnhancing || isGeneratingVariations}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="regenerate" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </TabsTrigger>
            <TabsTrigger value="enhance" className="text-xs">
              <Wand2 className="h-3 w-3 mr-1" />
              Enhance
            </TabsTrigger>
            <TabsTrigger value="variations" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Variations
            </TabsTrigger>
          </TabsList>

          {/* REGENERATE TAB */}
          <TabsContent value="regenerate" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>New Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Past Simple Tense"
                disabled={isRegenerating}
              />
              <p className="text-xs text-muted-foreground">
                Generate a completely new game on this topic
              </p>
            </div>

            {/* Item Count Slider - Crossword has two sliders */}
            {gameType === "crossword" ? (
              <div className="space-y-4">
                {/* Words per crossword: 6-20, default 10 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Words per Crossword</Label>
                    <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {crosswordWordsPerPuzzle}
                    </span>
                  </div>
                  <Slider
                    value={[crosswordWordsPerPuzzle]}
                    onValueChange={(v) => setCrosswordWordsPerPuzzle(v[0])}
                    min={6}
                    max={20}
                    step={1}
                    disabled={isRegenerating}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {crosswordWordsPerPuzzle} words in each puzzle
                  </p>
                </div>

                {/* Number of crosswords: 1-10, default 1 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Number of Crosswords</Label>
                    <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {crosswordPuzzleCount}
                    </span>
                  </div>
                  <Slider
                    value={[crosswordPuzzleCount]}
                    onValueChange={(v) => setCrosswordPuzzleCount(v[0])}
                    min={1}
                    max={10}
                    step={1}
                    disabled={isRegenerating}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {crosswordPuzzleCount === 1 ? "1 crossword puzzle" : `${crosswordPuzzleCount} crossword puzzles`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Number of Items</Label>
                  <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {itemCount}
                  </span>
                </div>
                <Slider
                  value={[itemCount]}
                  onValueChange={(v) => setItemCount(v[0])}
                  min={1}
                  max={25}
                  step={1}
                  disabled={isRegenerating}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  {getItemCountDescription(gameType, itemCount)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Additional Instructions (Optional)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g., Focus on irregular verbs, include questions about travel, make sentences about daily routines..."
                disabled={isRegenerating}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Add specific requirements or context for the AI
              </p>
            </div>

            {!regeneratedResult && (
              <Button
                onClick={handleRegenerate}
                disabled={isRegenerating || !topic.trim()}
                className="w-full"
                size="sm"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Game
                  </>
                )}
              </Button>
            )}

            {regeneratedResult && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800 font-medium">
                    <Check className="h-4 w-4" />
                    New game generated!
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {regeneratedResult.title}
                  </p>
                  {regeneratedUsage && (
                    <p className="text-xs text-green-600 mt-1">
                      Cost: ${regeneratedUsage.totalCost.toFixed(4)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRegeneratedResult(null)}
                    className="flex-1"
                  >
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleApplyRegenerated} className="flex-1">
                    Apply Changes
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ENHANCE TAB */}
          <TabsContent value="enhance" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Enhancement Options</Label>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addHints"
                    checked={enhancements.addHints}
                    onCheckedChange={(checked) =>
                      setEnhancements((prev) => ({ ...prev, addHints: !!checked }))
                    }
                    disabled={isEnhancing}
                  />
                  <label htmlFor="addHints" className="text-sm">
                    Add/improve hints
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addDistractors"
                    checked={enhancements.addDistractors}
                    onCheckedChange={(checked) =>
                      setEnhancements((prev) => ({ ...prev, addDistractors: !!checked }))
                    }
                    disabled={isEnhancing}
                  />
                  <label htmlFor="addDistractors" className="text-sm">
                    Add more distractors
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addExplanations"
                    checked={enhancements.addExplanations}
                    onCheckedChange={(checked) =>
                      setEnhancements((prev) => ({ ...prev, addExplanations: !!checked }))
                    }
                    disabled={isEnhancing}
                  />
                  <label htmlFor="addExplanations" className="text-sm">
                    Add explanations
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="improveQuality"
                    checked={enhancements.improveQuality}
                    onCheckedChange={(checked) =>
                      setEnhancements((prev) => ({ ...prev, improveQuality: !!checked }))
                    }
                    disabled={isEnhancing}
                  />
                  <label htmlFor="improveQuality" className="text-sm">
                    Improve overall quality
                  </label>
                </div>
              </div>
            </div>

            {!enhanceResult && (
              <Button
                onClick={handleEnhance}
                disabled={isEnhancing || !Object.values(enhancements).some((v) => v)}
                className="w-full"
                size="sm"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Enhance Game
                  </>
                )}
              </Button>
            )}

            {enhanceResult && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-800 font-medium">
                    <Check className="h-4 w-4" />
                    Enhancements ready!
                  </div>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    {enhanceResult.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                  {enhanceUsage && (
                    <p className="text-xs text-blue-600 mt-2">
                      Cost: ${enhanceUsage.totalCost.toFixed(4)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhanceResult(null)}
                    className="flex-1"
                  >
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleApplyEnhancements} className="flex-1">
                    Apply Enhancements
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* VARIATIONS TAB */}
          <TabsContent value="variations" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>
                Generate for levels (current: {level})
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableLevels.map((lvl) => (
                  <Button
                    key={lvl}
                    variant={targetLevels.includes(lvl) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLevel(lvl)}
                    disabled={isGeneratingVariations}
                    className={cn(
                      "w-12",
                      targetLevels.includes(lvl) && "bg-primary"
                    )}
                  >
                    {lvl}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Create adapted versions for different proficiency levels
              </p>
            </div>

            {!variationsResult && (
              <Button
                onClick={handleGenerateVariations}
                disabled={isGeneratingVariations || targetLevels.length === 0}
                className="w-full"
                size="sm"
              >
                {isGeneratingVariations ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating {targetLevels.length} variation(s)...
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 mr-2" />
                    Generate Variations
                  </>
                )}
              </Button>
            )}

            {variationsResult && (
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-purple-800 font-medium">
                    <Check className="h-4 w-4" />
                    {variationsResult.variations.length} variation(s) generated!
                  </div>
                  {variationsUsage && (
                    <p className="text-xs text-purple-600 mt-1">
                      Cost: ${variationsUsage.totalCost.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {variationsResult.variations.map((variation, idx) => (
                    <VariationPreviewCard
                      key={idx}
                      level={variation.level}
                      title={variation.title}
                      config={variation.config}
                      hints={variation.hints}
                      selected={selectedVariation === idx}
                      onSelect={() => setSelectedVariation(idx)}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVariationsResult(null);
                      setSelectedVariation(null);
                    }}
                    className="flex-1"
                  >
                    Discard All
                  </Button>
                  {onCreateVariation && (
                    <Button
                      size="sm"
                      onClick={handleCreateSelectedVariation}
                      disabled={selectedVariation === null}
                      className="flex-1"
                    >
                      Create Selected
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
