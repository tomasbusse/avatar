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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Gamepad2,
  Edit,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  Star,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Loader2,
  Send,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  GameType,
  CEFRLevel,
  GameCategory,
  GameStatus,
  getGameTypeDisplayName,
  getGameTypeIcon,
} from "@/types/word-games";
import { AIModelSelector } from "@/components/games/ai-model-selector";
import { GamePreviewCard } from "@/components/games/game-preview-card";
import { ShareGameDialog } from "@/components/games/share-game-dialog";
import {
  FullGenerationResult,
  TokenUsage,
  GenerationStatus,
} from "@/lib/game-generation/types";

// ============================================
// GAME CARD COMPONENT
// ============================================

interface GameCardProps {
  game: {
    _id: Id<"wordGames">;
    title: string;
    type: GameType;
    level: CEFRLevel;
    category: GameCategory;
    status: GameStatus;
    stats?: {
      totalPlays: number;
      completionRate: number;
      averageStars: number;
      averageTimeSeconds: number;
    };
    createdAt: number;
  };
  userId?: Id<"users">;
  userDisplayName?: string;
  onEdit: (gameId: Id<"wordGames">) => void;
  onDelete: (gameId: Id<"wordGames">) => void;
  onDuplicate: (gameId: Id<"wordGames">) => void;
  onPreview: (gameId: Id<"wordGames">) => void;
  onPublish: (gameId: Id<"wordGames">) => void;
}

function GameCard({
  game,
  userId,
  userDisplayName,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onPublish,
}: GameCardProps) {
  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  };

  const levelColors = {
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
            <span className="text-2xl">{getGameTypeIcon(game.type)}</span>
            <div>
              <CardTitle className="text-lg">{game.title}</CardTitle>
              <CardDescription className="text-sm">
                {getGameTypeDisplayName(game.type)}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[game.level]}`}
            >
              {game.level}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[game.status]}`}
            >
              {game.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        {game.stats && game.stats.totalPlays > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4 text-center text-sm">
            <div className="bg-gray-50 rounded p-2">
              <div className="flex items-center justify-center gap-1 text-gray-500">
                <Users className="h-3 w-3" />
              </div>
              <div className="font-semibold">{game.stats.totalPlays}</div>
              <div className="text-xs text-gray-500">Plays</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="flex items-center justify-center gap-1 text-gray-500">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <div className="font-semibold">{game.stats.completionRate}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="flex items-center justify-center gap-1 text-gray-500">
                <Star className="h-3 w-3" />
              </div>
              <div className="font-semibold">
                {game.stats.averageStars.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Avg Stars</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="flex items-center justify-center gap-1 text-gray-500">
                <Clock className="h-3 w-3" />
              </div>
              <div className="font-semibold">
                {Math.round(game.stats.averageTimeSeconds)}s
              </div>
              <div className="text-xs text-gray-500">Avg Time</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(game._id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          {game.status === "published" && userId && userDisplayName ? (
            <ShareGameDialog
              gameId={game._id}
              gameTitle={game.title}
              userId={userId}
              userDisplayName={userDisplayName}
              trigger={
                <Button variant="outline" size="sm" className="flex-1">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              }
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPublish(game._id)}
              className="flex-1"
              disabled={game.status === "published"}
            >
              <Send className="h-4 w-4 mr-1" />
              Publish
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(game._id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(game._id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(game._id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CREATE GAME DIALOG
// ============================================

// Helper functions for item count
function getDefaultItemCount(gameType: GameType): number {
  const defaults: Record<GameType, number> = {
    sentence_builder: 5,
    fill_in_blank: 5,
    word_ordering: 5,
    matching_pairs: 8,
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
    word_scramble: "words to unscramble",
    multiple_choice: "questions",
    flashcards: "flashcards",
    hangman: "words to guess",
    crossword: "words in the puzzle",
  };

  return `${count} ${itemNames[gameType] || "items"}`;
}

interface CreateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: Id<"users">;
}

function CreateGameDialog({
  open,
  onOpenChange,
  userId,
}: CreateGameDialogProps) {
  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [gameType, setGameType] = useState<GameType>("sentence_builder");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [level, setLevel] = useState<CEFRLevel>("B1");
  const [category, setCategory] = useState<GameCategory>("grammar");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Generation state
  const [topic, setTopic] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [itemCount, setItemCount] = useState(5);
  // Crossword-specific parameters
  const [crosswordWordsPerPuzzle, setCrosswordWordsPerPuzzle] = useState(10);
  const [crosswordPuzzleCount, setCrosswordPuzzleCount] = useState(1);
  const [model, setModel] = useState("anthropic/claude-3.5-sonnet");
  const [generationState, setGenerationState] = useState<GenerationStatus>({ status: "idle" });
  const [generatedResult, setGeneratedResult] = useState<FullGenerationResult | null>(null);
  const [generatedUsage, setGeneratedUsage] = useState<TokenUsage | null>(null);

  const createGame = useMutation(api.wordGames.createGame);

  const handleManualCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      const defaultConfig = getDefaultConfig(gameType);

      await createGame({
        title,
        instructions: instructions || `Complete this ${getGameTypeDisplayName(gameType)} exercise.`,
        type: gameType,
        category,
        level,
        config: defaultConfig,
        hints: ["Think about the sentence structure.", "Look for the subject first."],
        difficultyConfig: {
          hintsAvailable: 3,
          distractorDifficulty: "medium",
        },
        status: "draft",
        createdBy: userId,
      });

      toast.success("Game created successfully!");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create game");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    if (!model) {
      toast.error("Please select a model");
      return;
    }

    setGenerationState({ status: "generating", startTime: Date.now() });
    setGeneratedResult(null);

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
          category,
          // For crossword, pass both params; for others, pass itemCount
          ...(gameType === "crossword"
            ? { wordsPerPuzzle: crosswordWordsPerPuzzle, puzzleCount: crosswordPuzzleCount }
            : { itemCount }),
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setGenerationState({
          status: "error",
          error: data.error || "Generation failed",
          code: data.code || "API_ERROR",
          rawContent: data.rawContent,
          canRetry: true,
        });
        toast.error(data.error || "Failed to generate game");
        return;
      }

      setGeneratedResult(data.result as FullGenerationResult);
      setGeneratedUsage(data.usage);
      setGenerationState({ status: "success", result: data.result, usage: data.usage });
      toast.success("Game generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      setGenerationState({
        status: "error",
        error: "Network error. Please try again.",
        code: "API_ERROR",
        canRetry: true,
      });
      toast.error("Failed to generate game");
    }
  };

  const handleCreateFromGenerated = async () => {
    if (!generatedResult || !userId) {
      toast.error("No generated game to create");
      return;
    }

    setIsSubmitting(true);

    try {
      await createGame({
        title: generatedResult.title,
        instructions: generatedResult.instructions,
        type: gameType,
        category: category, // Use selected category, not AI-generated
        level,
        config: generatedResult.config,
        hints: generatedResult.hints,
        difficultyConfig: {
          hintsAvailable: 3,
          distractorDifficulty: "medium",
        },
        status: "draft",
        createdBy: userId,
      });

      toast.success("Game created from AI generation!");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create game");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setInstructions("");
    setTopic("");
    setCustomPrompt("");
    setGameType("sentence_builder");
    setLevel("B1");
    setCategory("grammar");
    setGeneratedResult(null);
    setGeneratedUsage(null);
    setGenerationState({ status: "idle" });
  };

  const isGenerating = generationState.status === "generating";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Word Game</DialogTitle>
          <DialogDescription>
            Create a game manually or use AI to generate engaging content.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "ai")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          {/* AI GENERATE TAB */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            {/* Topic */}
            <div className="space-y-2">
              <Label>Topic / Grammar Point</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Present Perfect Tense, Business Vocabulary, Travel Phrases"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Describe what the game should teach or practice
              </p>
            </div>

            {/* Game Type and Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Game Type</Label>
                <Select
                  value={gameType}
                  onValueChange={(v) => setGameType(v as GameType)}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "sentence_builder",
                        "fill_in_blank",
                        "word_ordering",
                        "matching_pairs",
                        "word_scramble",
                        "multiple_choice",
                        "flashcards",
                        "hangman",
                        "crossword",
                      ] as GameType[]
                    ).map((type) => (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <span>{getGameTypeIcon(type)}</span>
                          <span>{getGameTypeDisplayName(type)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>CEFR Level</Label>
                <Select
                  value={level}
                  onValueChange={(v) => setLevel(v as CEFRLevel)}
                  disabled={isGenerating}
                >
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

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>AI Model</Label>
              <AIModelSelector
                value={model}
                onChange={setModel}
                disabled={isGenerating}
              />
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
                    disabled={isGenerating}
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
                    disabled={isGenerating}
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
                  disabled={isGenerating}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  {getItemCountDescription(gameType, itemCount)}
                </p>
              </div>
            )}

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label>Additional Instructions (Optional)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g., Focus on irregular verbs, include questions about travel, make sentences about daily routines..."
                disabled={isGenerating}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Add specific requirements or context for the AI
              </p>
            </div>

            {/* Generate Button */}
            {!generatedResult && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Game
                  </>
                )}
              </Button>
            )}

            {/* Error State */}
            {generationState.status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">Generation Failed</p>
                <p className="text-red-600 text-sm mt-1">{generationState.error}</p>
                {generationState.canRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            )}

            {/* Generated Preview */}
            {generatedResult && (
              <GamePreviewCard
                result={generatedResult}
                usage={generatedUsage || undefined}
                onRegenerate={handleGenerate}
                isRegenerating={isGenerating}
                onAccept={handleCreateFromGenerated}
              />
            )}
          </TabsContent>

          {/* MANUAL TAB */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            {/* Game Type */}
            <div className="space-y-2">
              <Label>Game Type</Label>
              <Select
                value={gameType}
                onValueChange={(v) => setGameType(v as GameType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "sentence_builder",
                      "fill_in_blank",
                      "word_ordering",
                      "matching_pairs",
                      "word_scramble",
                      "multiple_choice",
                      "flashcards",
                      "hangman",
                      "crossword",
                    ] as GameType[]
                  ).map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        <span>{getGameTypeIcon(type)}</span>
                        <span>{getGameTypeDisplayName(type)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Present Perfect Practice"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label>Instructions (optional)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Drag the blocks to form a correct sentence."
                rows={2}
              />
            </div>

            {/* Level and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CEFR Level</Label>
                <Select
                  value={level}
                  onValueChange={(v) => setLevel(v as CEFRLevel)}
                >
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
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as GameCategory)}
                >
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

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualCreate} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Game"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DEFAULT CONFIGS
// ============================================

function getDefaultConfig(type: GameType) {
  switch (type) {
    case "sentence_builder":
      return {
        type: "sentence_builder",
        targetSentence: "I have been working here for three years",
        availableBlocks: [
          { id: "b1", text: "I", category: "subject" },
          { id: "b2", text: "have", category: "aux" },
          { id: "b3", text: "been", category: "aux" },
          { id: "b4", text: "working", category: "main" },
          { id: "b5", text: "here", category: "object" },
          { id: "b6", text: "for", category: "connector" },
          { id: "b7", text: "three years", category: "time" },
        ],
        distractorBlocks: [
          { id: "d1", text: "am", category: "aux" },
          { id: "d2", text: "since", category: "connector" },
        ],
      };
    case "fill_in_blank":
      // Config matches FillInBlankConfig interface
      return {
        type: "fill_in_blank",
        sentence: "She {{blank}} working here for five years.",
        answers: ["has been"],
        acceptableAlternatives: [["has been working"]],
      };
    case "word_ordering":
      // Config matches WordOrderingConfig interface
      return {
        type: "word_ordering",
        correctOrder: ["She", "has", "been", "working", "here"],
      };
    case "matching_pairs":
      // Config matches MatchingPairsConfig interface
      return {
        type: "matching_pairs",
        pairs: [
          { left: "purchase", right: "to buy something" },
          { left: "deadline", right: "final date or time" },
          { left: "appointment", right: "scheduled meeting" },
          { left: "recommend", right: "suggest something" },
        ],
      };
    case "word_scramble":
      // Config matches WordScrambleConfig interface
      return {
        type: "word_scramble",
        word: "vocabulary",
        hint: "Words you learn in a language",
      };
    case "multiple_choice":
      // Config matches MultipleChoiceConfig interface
      return {
        type: "multiple_choice",
        questions: [
          {
            question: "Which sentence is correct?",
            options: [
              "I have been waiting for an hour.",
              "I has been waiting for an hour.",
              "I am been waiting for an hour.",
              "I been waiting for an hour.",
            ],
            correctIndex: 0,
            explanation: "Use 'have been' with 'I' for present perfect continuous.",
          },
        ],
      };
    case "flashcards":
      // Config matches FlashcardsConfig interface
      return {
        type: "flashcards",
        cards: [
          {
            front: "deadline",
            back: "the latest time by which something must be completed",
            example: "The deadline for the report is Friday.",
          },
          {
            front: "appointment",
            back: "a scheduled meeting or arrangement",
            example: "I have a doctor's appointment at 3pm.",
          },
        ],
      };
    case "hangman":
      // Config matches HangmanConfig interface
      return {
        type: "hangman",
        word: "VOCABULARY",
        hint: "Words you learn in a language",
        maxWrongGuesses: 6,
      };
    case "crossword":
      // Config matches CrosswordConfig interface
      return {
        type: "crossword",
        rows: 7,
        cols: 7,
        words: [],
        grid: Array(7).fill(null).map(() =>
          Array(7).fill({ letter: null, wordIds: [] })
        ),
      };
    default:
      return {};
  }
}

// ============================================
// MAIN PAGE
// ============================================

export default function AdminGamesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Get current user from Convex auth
  const currentUser = useQuery(api.users.getCurrentUser);
  const userId = currentUser?._id;

  // Fetch games
  const games = useQuery(api.wordGames.listGames, {
    type: filterType !== "all" ? filterType : undefined,
    level: filterLevel !== "all" ? filterLevel : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  // Mutations
  const deleteGame = useMutation(api.wordGames.deleteGame);
  const duplicateGame = useMutation(api.wordGames.duplicateGame);
  const updateGame = useMutation(api.wordGames.updateGame);

  const handleDelete = async (gameId: Id<"wordGames">) => {
    if (!confirm("Are you sure you want to delete this game?")) return;
    try {
      await deleteGame({ gameId });
      toast.success("Game deleted");
    } catch (error) {
      toast.error("Failed to delete game");
    }
  };

  const handleDuplicate = async (gameId: Id<"wordGames">) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }
    try {
      await duplicateGame({ gameId, createdBy: userId });
      toast.success("Game duplicated");
    } catch (error) {
      toast.error("Failed to duplicate game");
    }
  };

  const handleEdit = (gameId: Id<"wordGames">) => {
    // Navigate to edit page
    window.location.href = `/admin/tools/games/${gameId}/edit`;
  };

  const handlePreview = (gameId: Id<"wordGames">) => {
    // Navigate to preview page
    window.location.href = `/admin/tools/games/${gameId}/preview`;
  };

  const handlePublish = async (gameId: Id<"wordGames">) => {
    try {
      await updateGame({
        gameId,
        status: "published",
      });
      toast.success("Game published successfully!");
    } catch (error) {
      toast.error("Failed to publish game");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gamepad2 className="h-8 w-8" />
            Word Games
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage interactive word games for lessons
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Game
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Game Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sentence_builder">Sentence Builder</SelectItem>
            <SelectItem value="fill_in_blank">Fill in the Blank</SelectItem>
            <SelectItem value="word_ordering">Word Ordering</SelectItem>
            <SelectItem value="matching_pairs">Matching Pairs</SelectItem>
            <SelectItem value="word_scramble">Word Scramble</SelectItem>
            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
            <SelectItem value="flashcards">Flashcards</SelectItem>
            <SelectItem value="hangman">Hangman</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="A1">A1</SelectItem>
            <SelectItem value="A2">A2</SelectItem>
            <SelectItem value="B1">B1</SelectItem>
            <SelectItem value="B2">B2</SelectItem>
            <SelectItem value="C1">C1</SelectItem>
            <SelectItem value="C2">C2</SelectItem>
          </SelectContent>
        </Select>

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
      </div>

      {/* Games Grid */}
      {games === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Gamepad2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No games yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first word game to get started.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Game
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard
              key={game._id}
              game={game}
              userId={userId}
              userDisplayName={currentUser?.firstName || currentUser?.email || "Host"}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onPreview={handlePreview}
              onPublish={handlePublish}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateGameDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        userId={userId}
      />
    </div>
  );
}
