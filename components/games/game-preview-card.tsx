"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  RefreshCw,
  Check,
  Lightbulb,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FullGenerationResult, TokenUsage } from "@/lib/game-generation/types";
import { GameType, getGameTypeDisplayName, getGameTypeIcon } from "@/types/word-games";

interface GamePreviewCardProps {
  result: FullGenerationResult;
  usage?: TokenUsage;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onAccept?: () => void;
  isRegenerating?: boolean;
}

export function GamePreviewCard({
  result,
  usage,
  onRegenerate,
  onEdit,
  onAccept,
  isRegenerating = false,
}: GamePreviewCardProps) {
  const [showJson, setShowJson] = useState(false);

  const config = result.config as Record<string, unknown>;
  const gameType = (config.type as GameType) || "sentence_builder";

  // Get summary stats based on game type
  const getSummaryStats = () => {
    switch (gameType) {
      case "sentence_builder": {
        const blocks = config.availableBlocks as unknown[] || [];
        const distractors = config.distractorBlocks as unknown[] || [];
        return [
          { label: "Blocks", value: blocks.length },
          { label: "Distractors", value: distractors.length },
        ];
      }
      case "fill_in_blank": {
        const blanks = (config.sentence as string || "").match(/\{\{blank\}\}/g) || [];
        return [{ label: "Blanks", value: blanks.length }];
      }
      case "word_ordering": {
        const words = config.correctOrder as string[] || [];
        return [{ label: "Words", value: words.length }];
      }
      case "matching_pairs": {
        const pairs = config.pairs as unknown[] || [];
        return [{ label: "Pairs", value: pairs.length }];
      }
      case "multiple_choice": {
        const questions = config.questions as unknown[] || [];
        return [{ label: "Questions", value: questions.length }];
      }
      case "flashcards": {
        const cards = config.cards as unknown[] || [];
        return [{ label: "Cards", value: cards.length }];
      }
      case "hangman":
      case "word_scramble": {
        const word = config.word as string || "";
        return [{ label: "Letters", value: word.length }];
      }
      default:
        return [];
    }
  };

  const stats = getSummaryStats();

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getGameTypeIcon(gameType)}</span>
            <div>
              <CardTitle className="text-lg">{result.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {getGameTypeDisplayName(gameType)} • {result.category}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Generated</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions Preview */}
        {result.instructions && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Instructions:</span> {result.instructions}
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-md px-3 py-1 border">
              <span className="text-sm font-medium">{stat.value}</span>
              <span className="text-xs text-muted-foreground ml-1">{stat.label}</span>
            </div>
          ))}
          {result.hints.length > 0 && (
            <div className="bg-white rounded-md px-3 py-1 border flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-yellow-500" />
              <span className="text-sm font-medium">{result.hints.length}</span>
              <span className="text-xs text-muted-foreground ml-1">Hints</span>
            </div>
          )}
        </div>

        {/* Hints Preview */}
        {result.hints.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Hints:</span>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {result.hints.map((hint, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-1.5 py-0.5">
                    {i + 1}
                  </span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* JSON Collapsible */}
        <Collapsible open={showJson} onOpenChange={setShowJson}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                View JSON Config
              </span>
              {showJson ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-md text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>

        {/* Usage Stats */}
        {usage && (
          <div className="text-xs text-muted-foreground flex items-center gap-4 pt-2 border-t">
            <span>Tokens: {usage.promptTokens + usage.completionTokens}</span>
            <span>Est. cost: ${usage.totalCost.toFixed(4)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isRegenerating && "animate-spin")}
              />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onAccept && (
            <Button size="sm" onClick={onAccept} className="ml-auto">
              <Check className="h-4 w-4 mr-2" />
              Use This Game
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Simpler preview for variations
interface VariationPreviewProps {
  level: string;
  title: string;
  config: unknown;
  hints: string[];
  onSelect?: () => void;
  selected?: boolean;
}

export function VariationPreviewCard({
  level,
  title,
  config,
  hints,
  onSelect,
  selected = false,
}: VariationPreviewProps) {
  const gameConfig = config as Record<string, unknown>;
  const gameType = (gameConfig.type as GameType) || "sentence_builder";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selected && "border-primary ring-2 ring-primary/20"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-1 rounded text-xs font-bold",
                level === "A1" && "bg-green-100 text-green-700",
                level === "A2" && "bg-lime-100 text-lime-700",
                level === "B1" && "bg-yellow-100 text-yellow-700",
                level === "B2" && "bg-orange-100 text-orange-700",
                level === "C1" && "bg-red-100 text-red-700",
                level === "C2" && "bg-purple-100 text-purple-700"
              )}
            >
              {level}
            </span>
            <span className="font-medium">{title}</span>
          </div>
          {selected && <Check className="h-4 w-4 text-primary" />}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {getGameTypeDisplayName(gameType)} • {hints.length} hints
        </p>
      </CardContent>
    </Card>
  );
}
