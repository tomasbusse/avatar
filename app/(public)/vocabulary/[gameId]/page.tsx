"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { VocabularySuite, VocabGameData, VocabTerm } from "@/components/vocabulary-suite";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { VocabularyMatchingConfig } from "@/types/word-games";

export default function VocabularyGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const game = useQuery(api.wordGames.getGame, {
    gameId: gameId as Id<"wordGames">,
  });

  if (game === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-sls-teal mx-auto mb-4" />
          <p className="text-slate-600">Loading vocabulary game...</p>
        </div>
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Game Not Found
          </h1>
          <p className="text-slate-600">
            The vocabulary game you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  // Transform game config to VocabGameData format
  const config = game.config as VocabularyMatchingConfig;

  // Handle both vocabulary_matching and matching_pairs game types
  let terms: VocabTerm[] = [];

  if (game.type === "vocabulary_matching" && config.terms) {
    terms = config.terms.map((t) => ({
      id: t.id,
      term: t.term,
      definition: t.definition,
      category: t.category,
      example: t.example,
    }));
  } else if (game.type === "matching_pairs" && (config as any).pairs) {
    // Convert matching_pairs format to vocabulary format
    terms = ((config as any).pairs || []).map((p: any, i: number) => ({
      id: p.id || `term${i + 1}`,
      term: p.left?.text || p.item || "",
      definition: p.right?.text || p.match || "",
      category: undefined,
      example: undefined,
    }));
  }

  // Extract highlights from game hints or create defaults
  const highlights = game.hints?.length
    ? game.hints.slice(0, 4)
    : [
        `${terms.length} key vocabulary terms`,
        "Clear definitions and examples",
        "Audio pronunciation for each term",
        "Interactive matching exercises",
      ];

  const gameData: VocabGameData = {
    id: game._id,
    title: game.title,
    description: game.instructions,
    sourceDocument: undefined, // Could be extracted from metadata if available
    terms,
    highlights,
  };

  return <VocabularySuite gameData={gameData} />;
}
