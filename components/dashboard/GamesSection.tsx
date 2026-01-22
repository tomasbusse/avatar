"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GameCard } from "./GameCard";

interface Game {
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
}

interface GamesSectionProps {
  games: Game[];
  isLoading?: boolean;
  maxItems?: number;
}

export function GamesSection({
  games,
  isLoading,
  maxItems = 4,
}: GamesSectionProps) {
  const displayGames = games.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Your Games
          </CardTitle>
          <Link href="/games">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayGames.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-3">No games available yet</p>
            <p className="text-xs">
              Games will appear here when you have lessons with linked exercises
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {displayGames.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
