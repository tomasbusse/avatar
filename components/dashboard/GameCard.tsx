"use client";

import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import Link from "next/link";

interface GameCardProps {
  game: {
    _id: string;
    title: string;
    slug: string;
    type: string;
    level: string;
    category: string;
    description?: string | null;
    bestStars: number | null;
    bestScore: number | null;
    timesPlayed: number;
    lessonTitle?: string | null;
  };
}

const gameTypeIcons: Record<string, string> = {
  sentence_builder: "🏗️",
  fill_in_blank: "📝",
  word_ordering: "🔢",
  matching_pairs: "🎴",
  vocabulary_matching: "🔤",
  word_scramble: "🔀",
  multiple_choice: "✅",
  flashcards: "🃏",
  hangman: "🎯",
  crossword: "⬛",
};

const levelColors: Record<string, { bg: string; text: string }> = {
  A1: { bg: "bg-green-100", text: "text-green-800" },
  A2: { bg: "bg-green-100", text: "text-green-800" },
  B1: { bg: "bg-blue-100", text: "text-blue-800" },
  B2: { bg: "bg-blue-100", text: "text-blue-800" },
  C1: { bg: "bg-purple-100", text: "text-purple-800" },
  C2: { bg: "bg-purple-100", text: "text-purple-800" },
};

export function GameCard({ game }: GameCardProps) {
  const icon = gameTypeIcons[game.type] || "🎮";
  const levelColor = levelColors[game.level] || levelColors.B1;
  const hasPlayed = game.timesPlayed > 0;

  return (
    <Link
      href={`/games/${game.slug}`}
      className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {game.title}
          </h4>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={`${levelColor.bg} ${levelColor.text} border-transparent text-xs`}
            >
              {game.level}
            </Badge>

            {hasPlayed && game.bestStars !== null && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= (game.bestStars ?? 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}

            {!hasPlayed && (
              <span className="text-xs text-muted-foreground">New</span>
            )}
          </div>

          {game.lessonTitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              From: {game.lessonTitle}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
