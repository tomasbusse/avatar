"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { GameBlockConfig } from "@/types/blog-blocks";
import { GameViewer } from "@/components/games/game-viewer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Gamepad2, Play, Star, Clock, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameBlockProps {
  config: GameBlockConfig;
  postSlug?: string;
}

// Loading skeleton
function GameBlockSkeleton() {
  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse bg-gradient-to-br from-sls-teal/5 to-sls-chartreuse/5 rounded-2xl border border-sls-beige p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-sls-beige/50" />
            <div className="flex-1">
              <div className="h-6 bg-sls-beige/50 rounded w-1/3 mb-2" />
              <div className="h-4 bg-sls-beige/30 rounded w-2/3" />
            </div>
            <div className="w-32 h-10 bg-sls-beige/50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Game completion celebration
function GameCompletionCard({ stars, scorePercent }: { stars: number; scorePercent: number }) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center gap-1 mb-4">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            className={cn(
              "w-8 h-8 transition-all",
              i <= stars
                ? "text-sls-chartreuse fill-sls-chartreuse scale-110"
                : "text-sls-beige"
            )}
          />
        ))}
      </div>
      <p className="text-2xl font-bold text-sls-teal mb-2">
        {scorePercent}% Complete!
      </p>
      <p className="text-sls-olive/70">
        Great job! You&apos;ve completed this exercise.
      </p>
    </div>
  );
}

export function GameBlock({ config, postSlug }: GameBlockProps) {
  const {
    gameId,
    displayMode = "inline",
    showTitle = true,
    showInstructions = true,
    showLevel = true,
    height = 500,
    ctaText,
  } = config;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<{ stars: number; scorePercent: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch game data
  const game = useQuery(api.wordGames.getGame, {
    gameId: gameId as Id<"wordGames">,
  });

  // Handle item completion
  const handleComplete = (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
    itemIndex: number;
  }) => {
    // Progress tracking could be added here
    console.log("Item completed:", result);
  };

  // Handle game completion
  const handleGameComplete = (score: {
    stars: number;
    scorePercent: number;
    totalCorrect: number;
    totalItems: number;
  }) => {
    setIsComplete(true);
    setFinalScore({ stars: score.stars, scorePercent: score.scorePercent });
  };

  // Reset game
  const resetGame = () => {
    setCurrentIndex(0);
    setIsComplete(false);
    setFinalScore(null);
  };

  if (!game) {
    return <GameBlockSkeleton />;
  }

  const levelColors: Record<string, string> = {
    A1: "bg-green-100 text-green-700",
    A2: "bg-emerald-100 text-emerald-700",
    B1: "bg-blue-100 text-blue-700",
    B2: "bg-indigo-100 text-indigo-700",
    C1: "bg-purple-100 text-purple-700",
    C2: "bg-pink-100 text-pink-700",
  };

  // Modal display mode
  if (displayMode === "modal") {
    return (
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-sls-teal/5 to-sls-chartreuse/5 rounded-2xl border border-sls-beige p-6 hover:border-sls-teal/30 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-sls-teal/10 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-7 h-7 text-sls-teal" />
                </div>
                <div>
                  {showTitle && (
                    <h3 className="font-semibold text-sls-teal text-lg">
                      {game.title}
                    </h3>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {showLevel && game.level && (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        levelColors[game.level] || "bg-sls-beige text-sls-olive"
                      )}>
                        {game.level}
                      </span>
                    )}
                    {showInstructions && game.instructions && (
                      <p className="text-sm text-sls-olive/70 line-clamp-1">
                        {game.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-sls-orange hover:bg-sls-orange/90 text-white gap-2">
                    <Play className="w-4 h-4" />
                    {ctaText || "Play Game"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden">
                  <DialogHeader className="p-4 border-b bg-sls-cream/50">
                    <DialogTitle className="text-sls-teal flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5" />
                      {game.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto p-4">
                    {isComplete && finalScore ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <GameCompletionCard
                          stars={finalScore.stars}
                          scorePercent={finalScore.scorePercent}
                        />
                        <Button onClick={resetGame} variant="outline" className="mt-4">
                          Play Again
                        </Button>
                      </div>
                    ) : (
                      <GameViewer
                        game={game}
                        currentIndex={currentIndex}
                        onIndexChange={setCurrentIndex}
                        onComplete={handleComplete}
                        onGameComplete={handleGameComplete}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Inline or fullwidth display mode
  const containerClass = displayMode === "fullwidth"
    ? "w-full"
    : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <section className="py-8">
      <div className={containerClass}>
        <div className="rounded-2xl overflow-hidden border-2 border-sls-beige shadow-lg shadow-sls-teal/5">
          {/* Game Header */}
          {(showTitle || showLevel) && (
            <div className="bg-gradient-to-r from-sls-cream to-sls-beige/30 px-6 py-4 border-b border-sls-beige">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sls-teal/10 flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-sls-teal" />
                  </div>
                  {showTitle && (
                    <div>
                      <h3 className="font-semibold text-sls-teal">{game.title}</h3>
                      {showInstructions && game.instructions && (
                        <p className="text-sm text-sls-olive/70">{game.instructions}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {showLevel && game.level && (
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      levelColors[game.level] || "bg-sls-beige text-sls-olive"
                    )}>
                      {game.level}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Game Content */}
          <div
            className="bg-white"
            style={{ minHeight: height }}
          >
            {isComplete && finalScore ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <GameCompletionCard
                  stars={finalScore.stars}
                  scorePercent={finalScore.scorePercent}
                />
                <Button onClick={resetGame} variant="outline" className="mt-4 gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Play Again
                </Button>
              </div>
            ) : (
              <GameViewer
                game={game}
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                onComplete={handleComplete}
                onGameComplete={handleGameComplete}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
