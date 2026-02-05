"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gamepad2,
  Plus,
  Trash2,
  Eye,
  Pencil,
  Loader2,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  GameType,
  CEFRLevel,
  GameCategory,
  GameStatus,
  getGameTypeDisplayName,
  getGameTypeIcon,
} from "@/types/word-games";

const GAME_TYPES: { value: GameType; label: string }[] = [
  { value: "sentence_builder", label: "Sentence Builder" },
  { value: "fill_in_blank", label: "Fill in the Blank" },
  { value: "word_ordering", label: "Word Ordering" },
  { value: "matching_pairs", label: "Matching Pairs" },
  { value: "vocabulary_matching", label: "Vocabulary Matching" },
  { value: "word_scramble", label: "Word Scramble" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "flashcards", label: "Flashcards" },
  { value: "hangman", label: "Hangman" },
  { value: "crossword", label: "Crossword" },
];

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const levelColors: Record<CEFRLevel, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-lime-100 text-lime-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-orange-100 text-orange-800",
  C1: "bg-red-100 text-red-800",
  C2: "bg-purple-100 text-purple-800",
};

const statusColors: Record<GameStatus, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

export default function TeacherGamesPage() {
  const [filterType, setFilterType] = useState<string>("");
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const games = useQuery(api.wordGames.listGamesByCreator, {
    type: filterType && filterType !== "all" ? filterType : undefined,
    level: filterLevel && filterLevel !== "all" ? filterLevel : undefined,
    status: filterStatus && filterStatus !== "all" ? filterStatus : undefined,
  });
  const deleteGame = useMutation(api.wordGames.deleteGame);
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

  const handlePublish = async (gameId: Id<"wordGames">) => {
    try {
      await updateGame({ gameId, status: "published" });
      toast.success("Game published");
    } catch (error) {
      toast.error("Failed to publish game");
    }
  };

  if (games === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Games</h2>
          <p className="text-muted-foreground">
            Manage your word games and interactive exercises.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tools/games">
            <Plus className="w-4 h-4 mr-2" />
            Create Game
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {GAME_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {(filterType || filterLevel || filterStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterType("");
              setFilterLevel("");
              setFilterStatus("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Game Grid */}
      {games.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No games yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first game to start engaging your students.
            </p>
            <Button asChild>
              <Link href="/admin/tools/games">
                <Plus className="w-4 h-4 mr-2" />
                Create Game
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <Card key={game._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getGameTypeIcon(game.type as GameType)}</span>
                    <div>
                      <CardTitle className="text-lg">{game.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {getGameTypeDisplayName(game.type as GameType)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[game.level as CEFRLevel] || ""}`}>
                      {game.level}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[game.status as GameStatus] || ""}`}>
                      {game.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                {game.stats && game.stats.totalPlays > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">{game.stats.totalPlays}</div>
                      <div className="text-xs text-muted-foreground">Plays</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">{game.stats.completionRate}%</div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">{game.stats.averageStars.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Avg Stars</div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground mb-3">
                  Created {new Date(game.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {game.slug && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/games/${game.slug}`} target="_blank">
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/admin/tools/games/${game._id}/edit`}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  {game.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePublish(game._id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                  )}
                  {game.slug && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/games/${game.slug}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Game link copied");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(game._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
