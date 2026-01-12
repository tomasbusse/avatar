"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VocabGameData } from "./types";
import { AudioButton } from "@/components/games/audio-button";
import { RotateCcw } from "lucide-react";

interface MatchingProps {
  gameData: VocabGameData;
}

const VocabularySuiteMatching: React.FC<MatchingProps> = ({ gameData }) => {
  const [shuffledTerms, setShuffledTerms] = useState<
    { id: string; text: string }[]
  >([]);
  const [shuffledDefs, setShuffledDefs] = useState<
    { id: string; text: string }[]
  >([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [wrongEffect, setWrongEffect] = useState(false);

  // Shuffle on mount
  useEffect(() => {
    const terms = gameData.terms.map((t) => ({ id: t.id, text: t.term }));
    const defs = gameData.terms.map((t) => ({ id: t.id, text: t.definition }));
    setShuffledTerms([...terms].sort(() => Math.random() - 0.5));
    setShuffledDefs([...defs].sort(() => Math.random() - 0.5));
  }, [gameData.terms]);

  // Check for match when both are selected
  useEffect(() => {
    if (selectedTerm && selectedDef) {
      if (selectedTerm === selectedDef) {
        // Correct match
        setMatches((prev) => [...prev, selectedTerm]);
        setSelectedTerm(null);
        setSelectedDef(null);
      } else {
        // Wrong match
        setWrongEffect(true);
        setTimeout(() => {
          setSelectedTerm(null);
          setSelectedDef(null);
          setWrongEffect(false);
        }, 800);
      }
    }
  }, [selectedTerm, selectedDef]);

  const handleReset = () => {
    setMatches([]);
    setSelectedTerm(null);
    setSelectedDef(null);
    setShuffledTerms((prev) => [...prev].sort(() => Math.random() - 0.5));
    setShuffledDefs((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const isComplete = matches.length === gameData.terms.length;

  return (
    <div className="p-8 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Term Matching</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Reset game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold text-sm">
            {matches.length} / {gameData.terms.length}
          </span>
        </div>
      </div>

      {isComplete ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
            🎉
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-2">
            Excellent Work!
          </h3>
          <p className="text-slate-600 mb-8">
            You&apos;ve successfully matched all {gameData.terms.length} terms.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-sls-teal text-white rounded-lg font-bold hover:bg-sls-teal/90 transition-colors"
          >
            Play Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-8 flex-1">
          {/* Terms Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
              Terms
            </h4>
            {shuffledTerms.map((item) => {
              const isMatched = matches.includes(item.id);
              const isSelected = selectedTerm === item.id;
              return (
                <button
                  key={item.id}
                  disabled={
                    isMatched ||
                    (selectedTerm !== null && !isSelected && selectedDef !== null)
                  }
                  onClick={() => setSelectedTerm(item.id)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                    isMatched
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 opacity-60"
                      : isSelected
                      ? wrongEffect
                        ? "bg-red-50 border-red-300 animate-shake"
                        : "bg-sls-teal/10 border-sls-teal shadow-md ring-2 ring-sls-teal/30"
                      : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="font-medium">{item.text}</span>
                  {!isMatched && (
                    <AudioButton text={item.text} size="sm" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Definitions Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
              Definitions
            </h4>
            {shuffledDefs.map((item) => {
              const isMatched = matches.includes(item.id);
              const isSelected = selectedDef === item.id;
              return (
                <button
                  key={item.id}
                  disabled={
                    isMatched ||
                    (selectedDef !== null && !isSelected && selectedTerm !== null)
                  }
                  onClick={() => setSelectedDef(item.id)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                    isMatched
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 opacity-60"
                      : isSelected
                      ? wrongEffect
                        ? "bg-red-50 border-red-300 animate-shake"
                        : "bg-sls-teal/10 border-sls-teal shadow-md ring-2 ring-sls-teal/30"
                      : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-sm">{item.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
        }
      `}</style>
    </div>
  );
};

export default VocabularySuiteMatching;
