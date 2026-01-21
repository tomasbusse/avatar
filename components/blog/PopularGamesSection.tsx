"use client";

import Link from "next/link";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GamePreviewCard } from "./GamePreviewCard";
import { cn } from "@/lib/utils";

type DifficultyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface PopularGamesSectionProps {
  className?: string;
}

export function PopularGamesSection({ className }: PopularGamesSectionProps) {
  const games = useQuery(api.wordGames.listGames, {
    status: "published",
    limit: 3,
  });

  const isLoading = games === undefined;

  return (
    <section className={cn("py-16 lg:py-24", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-beige text-sls-teal text-sm font-medium mb-4">
            <Gamepad2 className="w-4 h-4" />
            Interactive Learning
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
            Practice with Interactive Games
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learning through play is the most effective way to master English.
            Try our interactive games designed specifically for German speakers.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {isLoading ? (
            // Loading skeletons
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-sls-beige rounded-xl p-6 animate-pulse"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-sls-beige/50 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-5 bg-sls-beige/50 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-sls-beige/30 rounded w-full" />
                    </div>
                  </div>
                  <div className="h-10 bg-sls-beige/40 rounded-lg" />
                </div>
              ))}
            </>
          ) : games && games.length > 0 ? (
            games.map((game) => (
              <GamePreviewCard
                key={game._id}
                title={game.title}
                description={game.description || "Practice your English skills with this interactive game."}
                difficulty={game.level as DifficultyLevel}
                gameLink={`/games/${game.slug}`}
              />
            ))
          ) : (
            // Empty state
            <div className="col-span-full text-center py-12">
              <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No games available yet. Check back soon!</p>
            </div>
          )}
        </div>

        {/* View All Link */}
        {games && games.length > 0 && (
          <div className="text-center">
            <Button
              asChild
              variant="outline"
              className="border-2 border-sls-teal text-sls-teal hover:bg-sls-teal hover:text-white font-semibold px-6 py-2.5 rounded-lg transition-all hover:-translate-y-0.5"
            >
              <Link href="/games">
                View All Games
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
