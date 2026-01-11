"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { GameViewer } from "@/components/games/game-viewer";
import {
  getGameTypeDisplayName,
  getGameTypeIcon,
  WordGame,
} from "@/types/word-games";

export default function GamePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as Id<"wordGames">;
  const [currentIndex, setCurrentIndex] = useState(0);

  const game = useQuery(api.wordGames.getGame, { gameId });

  const handleComplete = (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
    itemIndex: number;
  }) => {
    console.log("Item completed:", result);
  };

  const handleGameComplete = (finalScore: {
    stars: number;
    scorePercent: number;
    totalCorrect: number;
    totalItems: number;
  }) => {
    console.log("Game completed:", finalScore);
  };

  if (!game) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Convert Convex game to WordGame type for GameViewer
  const wordGame: WordGame = {
    _id: game._id,
    title: game.title,
    slug: game.slug,
    description: game.description,
    instructions: game.instructions,
    type: game.type,
    category: game.category,
    level: game.level,
    tags: game.tags,
    config: game.config,
    hints: game.hints,
    difficultyConfig: game.difficultyConfig,
    status: game.status,
    createdBy: game.createdBy,
    createdAt: game._creationTime,
    updatedAt: game._creationTime,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/tools/games")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getGameTypeIcon(game.type)}</span>
              <h1 className="text-2xl font-bold">{game.title}</h1>
            </div>
            <p className="text-muted-foreground">
              Preview Mode • {game.level} • {game.category}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/tools/games/${gameId}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="bg-sls-teal/10 border border-sls-teal/30 rounded-lg p-3 mb-6 flex items-center gap-2">
        <span className="text-sls-teal font-medium">Preview Mode</span>
        <span className="text-sls-olive text-sm">
          This is how students will see the game. Progress is not saved.
        </span>
      </div>

      {/* Debug: Show config structure */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-gray-500">Debug: View Game Config</summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(game.config, null, 2)}
          </pre>
        </details>
      )}

      {/* Game Player using GameViewer */}
      <div className="bg-white rounded-xl border shadow-sm h-[600px]">
        <GameViewer
          game={wordGame}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onComplete={handleComplete}
          onGameComplete={handleGameComplete}
        />
      </div>
    </div>
  );
}
