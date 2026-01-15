"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameViewer } from "@/components/games/game-viewer";
import {
  Loader2,
  Share2,
  RotateCcw,
  Trophy,
  Clock,
  Target,
  Star
} from "lucide-react";
import {
  getGameTypeDisplayName,
  getGameTypeIcon,
  WordGame,
} from "@/types/word-games";
import { toast } from "sonner";

export default function PublicGamePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<{
    stars: number;
    scorePercent: number;
    totalCorrect: number;
    totalItems: number;
    timeSeconds?: number;
  } | null>(null);

  // Fetch game by slug
  const game = useQuery(api.wordGames.getGameBySlug, { slug });

  const handleComplete = (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
    itemIndex: number;
  }) => {
    console.log("Item completed:", result);
  };

  const handleGameComplete = (score: {
    stars: number;
    scorePercent: number;
    totalCorrect: number;
    totalItems: number;
    timeSeconds?: number;
  }) => {
    setGameComplete(true);
    setFinalScore(score);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setGameComplete(false);
    setFinalScore(null);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: game?.title || "Language Game",
        text: `Practice English with this interactive game!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Loading state
  if (game === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  // Game not found
  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Game Not Found</CardTitle>
            <CardDescription>
              This game doesn&apos;t exist or may have been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game not published
  if (game.status !== "published") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Game Unavailable</CardTitle>
            <CardDescription>
              This game is currently not available for play.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
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

  // Game complete screen
  if (gameComplete && finalScore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Congratulations!</h1>
              <p className="opacity-90">You completed the game</p>
            </div>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">{game.title}</h2>
                <div className="flex justify-center gap-1 mb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-8 w-8 ${
                        i < finalScore.stars
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                  <div className="text-2xl font-bold">{finalScore.scorePercent}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Trophy className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                  <div className="text-2xl font-bold">
                    {finalScore.totalCorrect}/{finalScore.totalItems}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleRestart} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Play Again
                </Button>
                <Button onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">{getGameTypeIcon(game.type)}</span>
            <h1 className="text-2xl font-bold">{game.title}</h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline">{game.level}</Badge>
            <Badge variant="secondary">{getGameTypeDisplayName(game.type)}</Badge>
            <Badge variant="secondary">{game.category}</Badge>
          </div>
          {game.description && (
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              {game.description}
            </p>
          )}
        </div>

        {/* Game */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <GameViewer
              game={wordGame}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              onComplete={handleComplete}
              onGameComplete={handleGameComplete}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Button onClick={handleShare} variant="ghost" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share this game
          </Button>
        </div>
      </div>
    </div>
  );
}
