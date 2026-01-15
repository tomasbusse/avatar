"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Gamepad2, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { GameType } from "@/types/word-games";
import { Id } from "@/convex/_generated/dataModel";

// Game templates with icons and descriptions
const GAME_TEMPLATES = [
  {
    type: "matching_pairs" as GameType,
    name: "Matching Pairs",
    description: "Match vocabulary terms to definitions or translations",
    icon: "🔗",
    bestFor: ["vocabulary", "signal words", "translations"],
  },
  {
    type: "fill_in_blank" as GameType,
    name: "Fill in the Blank",
    description: "Complete sentences with the correct word or phrase",
    icon: "✏️",
    bestFor: ["grammar rules", "usage patterns"],
  },
  {
    type: "multiple_choice" as GameType,
    name: "Multiple Choice",
    description: "Select the correct answer from options",
    icon: "📝",
    bestFor: ["grammar rules", "error correction", "usage"],
  },
  {
    type: "hangman" as GameType,
    name: "Hangman",
    description: "Guess letters to reveal vocabulary words",
    icon: "🎯",
    bestFor: ["vocabulary", "signal words"],
  },
  {
    type: "word_scramble" as GameType,
    name: "Word Scramble",
    description: "Unscramble letters to form words",
    icon: "🔤",
    bestFor: ["vocabulary", "signal words"],
  },
  {
    type: "flashcards" as GameType,
    name: "Flashcards",
    description: "Study terms with flip cards",
    icon: "📚",
    bestFor: ["vocabulary", "grammar rules"],
  },
  {
    type: "sentence_builder" as GameType,
    name: "Sentence Builder",
    description: "Arrange words to form correct sentences",
    icon: "🧱",
    bestFor: ["grammar rules", "word order"],
  },
  {
    type: "word_ordering" as GameType,
    name: "Word Ordering",
    description: "Put scrambled words in the correct order",
    icon: "📋",
    bestFor: ["grammar rules", "sentence structure"],
  },
] as const;

interface CreateGameFromKnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: Id<"knowledgeContent">;
  contentTitle: string;
  contentLevel: string;
  onSuccess?: (gameId: string) => void;
}

export function CreateGameFromKnowledgeDialog({
  open,
  onOpenChange,
  contentId,
  contentTitle,
  contentLevel,
  onSuccess,
}: CreateGameFromKnowledgeDialogProps) {
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  const [itemCount, setItemCount] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGameId, setGeneratedGameId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedGameType) {
      toast.error("Please select a game type");
      return;
    }

    setIsGenerating(true);
    setGeneratedGameId(null);

    try {
      const response = await fetch("/api/games/generate-from-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          gameType: selectedGameType,
          itemCount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate game");
      }

      setGeneratedGameId(data.gameId);
      toast.success(`${data.title} game created successfully!`);
      onSuccess?.(data.gameId);
    } catch (error) {
      console.error("Game generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate game");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedGameType(null);
    setGeneratedGameId(null);
    onOpenChange(false);
  };

  const selectedTemplate = GAME_TEMPLATES.find((t) => t.type === selectedGameType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Create Game from Knowledge
          </DialogTitle>
          <DialogDescription>
            Generate an interactive game based on &quot;{contentTitle}&quot; ({contentLevel})
          </DialogDescription>
        </DialogHeader>

        {generatedGameId ? (
          // Success state
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Game Created!</h3>
              <p className="text-muted-foreground text-sm">
                Your {selectedTemplate?.name} game is ready to use.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button asChild>
                <a
                  href={`/admin/tools/games?edit=${generatedGameId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Edit Game
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        ) : (
          // Selection state
          <>
            <div className="space-y-6 py-4">
              {/* Game Type Selection */}
              <div className="space-y-3">
                <Label>Select Game Template</Label>
                <Select
                  value={selectedGameType || ""}
                  onValueChange={(value) => setSelectedGameType(value as GameType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a game type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GAME_TEMPLATES.map((template) => (
                      <SelectItem key={template.type} value={template.type}>
                        <span className="flex items-center gap-2">
                          <span>{template.icon}</span>
                          <span>{template.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected template details */}
                {selectedTemplate && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedTemplate.icon}</span>
                      <span className="font-medium">{selectedTemplate.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTemplate.bestFor.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Item Count Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Number of Items</Label>
                  <span className="text-sm font-medium">{itemCount}</span>
                </div>
                <Slider
                  value={[itemCount]}
                  onValueChange={([value]) => setItemCount(value)}
                  min={4}
                  max={15}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  More items = longer game. Recommended: 6-10 for most games.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!selectedGameType || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Create Game
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
