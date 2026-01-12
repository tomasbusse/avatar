"use client";

import React, { useState, useMemo } from "react";
import { VocabGameData } from "./types";
import { AudioButton } from "@/components/games/audio-button";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";

interface FlashcardsProps {
  gameData: VocabGameData;
}

const VocabularySuiteFlashcards: React.FC<FlashcardsProps> = ({ gameData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());

  const terms = useMemo(() => {
    if (shuffled) {
      return [...gameData.terms].sort(() => Math.random() - 0.5);
    }
    return gameData.terms;
  }, [gameData.terms, shuffled]);

  const currentTerm = terms[currentIndex];

  const handleNext = () => {
    if (currentIndex < terms.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    setShuffled((prev) => !prev);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
  };

  const toggleKnown = () => {
    const newKnown = new Set(knownCards);
    if (newKnown.has(currentTerm.id)) {
      newKnown.delete(currentTerm.id);
    } else {
      newKnown.add(currentTerm.id);
    }
    setKnownCards(newKnown);
  };

  const isComplete = knownCards.size === terms.length;

  return (
    <div className="p-8 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Flashcards</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleShuffle}
            className={`p-2 rounded-lg transition-colors ${
              shuffled
                ? "bg-sls-teal text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title="Shuffle cards"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Reset progress"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <span className="text-sm text-slate-500 font-medium">
            {knownCards.size} / {terms.length} known
          </span>
        </div>
      </div>

      {isComplete ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
            🎉
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-2">
            All Cards Mastered!
          </h3>
          <p className="text-slate-600 mb-8">
            You&apos;ve marked all {terms.length} flashcards as known.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-sls-teal text-white rounded-lg font-bold hover:bg-sls-teal/90 transition-colors"
          >
            Study Again
          </button>
        </div>
      ) : (
        <>
          {/* Flashcard */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className="relative w-full max-w-lg h-72 cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`absolute inset-0 transition-transform duration-500 preserve-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Front - Term */}
                <div className="absolute inset-0 backface-hidden">
                  <div
                    className={`w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center p-8 transition-all ${
                      knownCards.has(currentTerm.id)
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-gradient-to-br from-sls-teal to-sls-olive text-white border-transparent"
                    }`}
                  >
                    <span className="text-3xl font-bold mb-4">
                      {currentTerm.term}
                    </span>
                    <AudioButton
                      text={currentTerm.term}
                      example={currentTerm.example}
                      size="lg"
                      className={
                        knownCards.has(currentTerm.id)
                          ? "text-emerald-600"
                          : "text-white/80"
                      }
                    />
                    <p className="text-sm opacity-70 mt-4">
                      Click to see definition
                    </p>
                  </div>
                </div>

                {/* Back - Definition */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                  <div className="w-full h-full rounded-2xl bg-white border-2 border-slate-200 flex flex-col items-center justify-center p-8 shadow-lg">
                    <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                      Definition
                    </span>
                    <p className="text-lg text-slate-800 text-center mb-4">
                      {currentTerm.definition}
                    </p>
                    {currentTerm.example && (
                      <p className="text-sm text-slate-500 italic text-center">
                        &ldquo;{currentTerm.example}&rdquo;
                      </p>
                    )}
                    {currentTerm.category && (
                      <span className="mt-4 px-3 py-1 bg-sls-chartreuse/20 text-sls-olive rounded-full text-xs font-medium">
                        {currentTerm.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                {currentIndex + 1} of {terms.length}
              </span>
              <button
                onClick={toggleKnown}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  knownCards.has(currentTerm.id)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                {knownCards.has(currentTerm.id) ? "✓ Known" : "Mark as Known"}
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === terms.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sls-teal text-white hover:bg-sls-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default VocabularySuiteFlashcards;
