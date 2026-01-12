"use client";

import React from "react";
import { VocabGameData, VocabSuiteMode } from "./types";
import { AudioButton } from "@/components/games/audio-button";

interface OverviewProps {
  gameData: VocabGameData;
  onStart: () => void;
}

// Clean up title by removing (Copy) patterns
function cleanTitle(title: string): string {
  return title.replace(/\s*\(Copy\)\s*/gi, " ").trim();
}

const VocabularySuiteOverview: React.FC<OverviewProps> = ({
  gameData,
  onStart,
}) => {
  const displayTitle = cleanTitle(gameData.title);

  // Get unique categories from terms
  const categories = Array.from(
    new Set(gameData.terms.map((t) => t.category).filter((c): c is string => !!c))
  );

  // Get key terms (first 7)
  const keyTerms = gameData.terms.slice(0, 7);

  return (
    <div className="flex flex-col h-full">
      {/* Hero Section with SLS Teal Gradient */}
      <div className="p-8 md:p-12 text-center bg-gradient-to-br from-sls-teal to-sls-olive text-white">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          {displayTitle}
        </h2>
        <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
          {gameData.description || (
            <>
              Interactive exercises to master key vocabulary.
              {gameData.sourceDocument && (
                <>
                  {" "}Based on <strong>{gameData.sourceDocument}</strong>.
                </>
              )}
              {" "}Learn terms, definitions, and usage like a pro.
            </>
          )}
        </p>
        <button
          onClick={onStart}
          className="bg-white text-sls-teal px-8 py-3 rounded-xl font-bold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
        >
          Start Learning
        </button>
      </div>

      {/* Content Section */}
      <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
        {/* Product Highlights / What You'll Learn */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="p-2 bg-sls-teal/10 text-sls-teal rounded-lg text-sm">
              ✨
            </span>
            What You&apos;ll Learn
          </h3>
          <ul className="space-y-3">
            {(gameData.highlights || [
              `${gameData.terms.length} key vocabulary terms`,
              "Clear definitions and examples",
              "Audio pronunciation for each term",
              "Interactive matching exercises",
            ]).map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-600">
                <span className="text-sls-teal mt-1">✓</span>
                {text}
              </li>
            ))}
          </ul>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-500 mb-2">
                Categories covered:
              </h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 bg-sls-chartreuse/20 text-sls-olive rounded-full text-xs font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key Technical Terms */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg text-sm">
              🔤
            </span>
            Key Terms
          </h3>
          <div className="flex flex-wrap gap-3">
            {keyTerms.map((term) => (
              <div
                key={term.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200"
              >
                <span>{term.term}</span>
                <AudioButton text={term.term} example={term.example} size="sm" />
              </div>
            ))}
            {gameData.terms.length > 7 && (
              <span className="px-3 py-1.5 text-slate-400 text-sm">
                +{gameData.terms.length - 7} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Source Footer */}
      {gameData.sourceDocument && (
        <div className="px-8 pb-8 text-center text-xs text-slate-400">
          Source: {gameData.sourceDocument}
        </div>
      )}
    </div>
  );
};

export default VocabularySuiteOverview;
