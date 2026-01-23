"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Gamepad2,
  ArrowRight,
  Filter,
  Search,
  BookOpen,
  Briefcase,
  Languages,
  Lightbulb,
  GraduationCap,
} from "lucide-react";
import { getGameTypeDisplayName, getGameTypeIcon } from "@/types/word-games";
import { cn } from "@/lib/utils";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const CATEGORIES = [
  { id: "all", label: "All Games", icon: Gamepad2 },
  { id: "grammar", label: "Grammar", icon: BookOpen },
  { id: "vocabulary", label: "Vocabulary", icon: Languages },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "general", label: "General", icon: Lightbulb },
] as const;

const levelColors: Record<string, string> = {
  A1: "bg-green-100 text-green-700 border-green-200",
  A2: "bg-green-100 text-green-700 border-green-200",
  B1: "bg-blue-100 text-blue-700 border-blue-200",
  B2: "bg-blue-100 text-blue-700 border-blue-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
  C2: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function GamesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all published games
  const games = useQuery(api.wordGames.listGames, {
    status: "published",
    limit: 100,
  });

  const isLoading = games === undefined;

  // Filter games based on selected filters
  const filteredGames = games?.filter((game) => {
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    const matchesLevel = !selectedLevel || game.level === selectedLevel;
    const matchesSearch = !searchQuery ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesLevel && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sls-cream via-white to-sls-beige/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sls-teal via-sls-teal/90 to-sls-olive py-16 lg:py-24">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Decorative Orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-sls-chartreuse/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-sls-olive/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6">
            <Gamepad2 className="w-4 h-4" />
            Interactive Learning
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Practice English with
            <span className="text-sls-chartreuse"> Interactive Games</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Learn grammar, expand vocabulary, and master business English through
            engaging games designed specifically for German speakers.
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 text-white/70">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{games?.length || 0}+</div>
              <div className="text-sm">Games Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">A1-C2</div>
              <div className="text-sm">All Levels</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm">Free to Play</div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-sls-cream"
            />
          </svg>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 border-b border-sls-beige bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedCategory === cat.id
                        ? "bg-sls-teal text-white"
                        : "bg-sls-beige/50 text-sls-olive hover:bg-sls-beige"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Search & Level Filter */}
            <div className="flex gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-sls-beige bg-white text-sls-teal placeholder-sls-olive/50 focus:border-sls-teal focus:outline-none transition-colors"
                />
              </div>

              {/* Level Filter */}
              <div className="flex gap-1">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                      selectedLevel === level
                        ? levelColors[level]
                        : "bg-white border-sls-beige text-sls-olive hover:border-sls-teal"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-sls-teal" />
              <span className="ml-3 text-sls-olive">Loading games...</span>
            </div>
          ) : filteredGames && filteredGames.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sls-olive">
                  Showing <span className="font-semibold text-sls-teal">{filteredGames.length}</span> games
                  {selectedCategory !== "all" && ` in ${selectedCategory}`}
                  {selectedLevel && ` for level ${selectedLevel}`}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGames.map((game) => (
                  <Link key={game._id} href={`/games/${game.slug}`}>
                    <Card className="h-full hover:shadow-lg hover:border-sls-teal/30 transition-all hover:-translate-y-1 cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <span className="text-3xl">{getGameTypeIcon(game.type)}</span>
                          <Badge className={cn("border", levelColors[game.level] || "bg-gray-100 text-gray-700")}>
                            {game.level}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-sls-teal group-hover:text-sls-orange transition-colors line-clamp-2">
                          {game.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {game.description || "Practice your English skills with this interactive game."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getGameTypeDisplayName(game.type)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {game.category}
                            </Badge>
                          </div>
                          <ArrowRight className="w-4 h-4 text-sls-olive group-hover:text-sls-orange group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Gamepad2 className="w-16 h-16 text-sls-beige mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-sls-teal mb-2">No games found</h3>
              <p className="text-sls-olive mb-6">
                {searchQuery || selectedLevel || selectedCategory !== "all"
                  ? "Try adjusting your filters to find more games."
                  : "Games are coming soon! Check back later."}
              </p>
              {(searchQuery || selectedLevel || selectedCategory !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLevel(null);
                    setSelectedCategory("all");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-sls-teal to-sls-olive">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want Personalized Learning?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Our games are great for practice, but nothing beats learning with a real teacher.
            Book a free consultation to discuss your language learning goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-sls-orange hover:bg-sls-orange/90 text-white font-semibold px-8"
            >
              <Link href="/contact">
                Book Free Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 font-semibold px-8"
            >
              <Link href="/blog">
                Read Our Blog
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Back to Blog Link */}
      <section className="py-8 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sls-teal hover:text-sls-orange transition-colors font-medium"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Blog
          </Link>
        </div>
      </section>
    </div>
  );
}
