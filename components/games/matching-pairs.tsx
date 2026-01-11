"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lightbulb, RotateCcw, Sparkles } from "lucide-react";

// Support both string and {text: string} formats
type TextValue = string | { text: string };

// Confetti particle component
function ConfettiParticle({ delay, left }: { delay: number; left: number }) {
  const colors = ["#003F37", "#9F9D38", "#B25627", "#4F5338", "#E3C6AB"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;

  return (
    <div
      className="absolute animate-confetti-fall pointer-events-none"
      style={{
        left: `${left}%`,
        top: "-10px",
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        animationDelay: `${delay}ms`,
        opacity: 0.9,
      }}
    />
  );
}

// Celebration overlay
function CelebrationOverlay({ show }: { show: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; left: number }>>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        delay: Math.random() * 500,
        left: Math.random() * 100,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} left={p.left} />
      ))}
    </div>
  );
}

export interface MatchingPairsConfig {
  type: "matching_pairs";
  pairs: Array<{
    id?: string;
    left: TextValue;
    right: TextValue;
  }>;
  matchType?: "definition" | "translation" | "synonym" | "image" | "antonym";
  timeLimit?: number;
}

// Helper to extract text from string or {text: string}
function getText(value: TextValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "text" in value) return value.text;
  return String(value);
}

interface MatchingPairsProps {
  config: MatchingPairsConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
  // Multiplayer sync props
  onStateChange?: (state: { matches: [number, number][]; selectedLeft: number | null; selectedRight: number | null }) => void;
  syncedState?: { matches: [number, number][]; selectedLeft: number | null; selectedRight: number | null };
  isViewOnly?: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function MatchingPairs({
  config,
  instructions,
  hints = [],
  onComplete,
  onStateChange,
  syncedState,
  isViewOnly,
}: MatchingPairsProps) {
  // Extract text values from pairs
  const normalizedPairs = useMemo(() =>
    config.pairs.map(p => ({
      left: getText(p.left),
      right: getText(p.right),
    })), [config.pairs]);

  const [leftItems] = useState(() => normalizedPairs.map(p => p.left));
  const [rightItems] = useState(() => shuffleArray(normalizedPairs.map(p => p.right)));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<Map<number, number>>(new Map());
  const [incorrectPair, setIncorrectPair] = useState<[number, number] | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  // Sync state from other players (multiplayer) - using ref to prevent loops
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (!syncedState) return;

    const syncedKey = JSON.stringify(syncedState);

    // Skip if we already processed this sync
    if (lastSyncedRef.current === syncedKey) return;
    lastSyncedRef.current = syncedKey;

    // Sync matches
    const newMatches = new Map<number, number>();
    for (const [left, right] of syncedState.matches) {
      newMatches.set(left, right);
    }

    setMatches(newMatches);
    setSelectedLeft(syncedState.selectedLeft);
    setSelectedRight(syncedState.selectedRight);
  }, [syncedState]);

  const handleLeftClick = (index: number) => {
    if (isViewOnly || matches.has(index)) return;
    setSelectedLeft(index);
    setIncorrectPair(null);

    // Notify parent for multiplayer sync
    onStateChange?.({
      matches: Array.from(matches.entries()),
      selectedLeft: index,
      selectedRight,
    });

    if (selectedRight !== null) {
      checkMatch(index, selectedRight);
    }
  };

  const handleRightClick = (index: number) => {
    if (isViewOnly || Array.from(matches.values()).includes(index)) return;
    setSelectedRight(index);
    setIncorrectPair(null);

    // Notify parent for multiplayer sync
    onStateChange?.({
      matches: Array.from(matches.entries()),
      selectedLeft,
      selectedRight: index,
    });

    if (selectedLeft !== null) {
      checkMatch(selectedLeft, index);
    }
  };

  const checkMatch = (leftIdx: number, rightIdx: number) => {
    setAttempts(prev => prev + 1);

    const leftValue = leftItems[leftIdx];
    const rightValue = rightItems[rightIdx];
    const correctPair = normalizedPairs.find(p => p.left === leftValue);

    if (correctPair && correctPair.right === rightValue) {
      // Correct match
      const newMatches = new Map(matches);
      newMatches.set(leftIdx, rightIdx);
      setMatches(newMatches);
      setSelectedLeft(null);
      setSelectedRight(null);

      // Notify parent for multiplayer sync
      onStateChange?.({
        matches: Array.from(newMatches.entries()),
        selectedLeft: null,
        selectedRight: null,
      });

      // Check if all matched
      if (newMatches.size === config.pairs.length) {
        setIsComplete(true);
        if (onComplete) {
          onComplete({
            isCorrect: true,
            attempts: attempts + 1,
            hintsUsed,
            timeSeconds: Math.round((Date.now() - startTime) / 1000),
          });
        }
      }
    } else {
      // Incorrect match
      setIncorrectPair([leftIdx, rightIdx]);
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setIncorrectPair(null);
      }, 1000);
    }
  };

  const handleHint = () => {
    if (hintsUsed < hints.length) {
      setCurrentHint(hints[hintsUsed]);
      setHintsUsed(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatches(new Map());
    setIncorrectPair(null);
    setIsComplete(false);
    setCurrentHint(null);
  };

  const isLeftMatched = (idx: number) => matches.has(idx);
  const isRightMatched = (idx: number) => Array.from(matches.values()).includes(idx);

  return (
    <div className="h-full flex flex-col bg-white px-16 py-4 relative">
      {/* Celebration confetti overlay */}
      <CelebrationOverlay show={isComplete} />

      {/* Instructions */}
      {instructions && !isComplete && (
        <p className="text-center text-sm text-sls-olive/70 mb-4">
          {instructions}
        </p>
      )}

      {/* Progress bar */}
      {!isComplete && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-sls-olive">
              <span className="text-xl font-bold text-sls-teal">{matches.size}</span>
              <span className="mx-1">/</span>
              <span>{config.pairs.length}</span> matched
            </span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-sls-teal transition-all duration-300"
              style={{ width: `${(matches.size / config.pairs.length) * 100}%` }}
            />
          </div>
        </>
      )}

      {/* Completion celebration */}
      {isComplete ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="relative">
            <Sparkles className="w-12 h-12 text-sls-chartreuse animate-pulse" />
            <CheckCircle className="w-6 h-6 text-sls-teal absolute -bottom-1 -right-1" />
          </div>
          <h3 className="text-2xl font-bold text-sls-teal mt-4">Well Done!</h3>
          <p className="text-sls-olive mt-2">
            All {config.pairs.length} pairs matched
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="bg-sls-cream rounded-lg px-3 py-2">
              <span className="text-sls-olive">Attempts:</span>
              <span className="font-bold text-sls-teal ml-1">{attempts}</span>
            </div>
            <div className="bg-sls-cream rounded-lg px-3 py-2">
              <span className="text-sls-olive">Time:</span>
              <span className="font-bold text-sls-teal ml-1">
                {Math.round((Date.now() - startTime) / 1000)}s
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Matching area */
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-2">
              {leftItems.map((item, idx) => (
                <button
                  key={`left-${idx}`}
                  onClick={() => handleLeftClick(idx)}
                  disabled={isLeftMatched(idx)}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 text-left text-sm transition-all",
                    isLeftMatched(idx) && "bg-sls-teal/10 border-sls-teal text-sls-teal",
                    selectedLeft === idx && !isLeftMatched(idx) && "bg-sls-cream border-sls-chartreuse",
                    incorrectPair?.[0] === idx && "bg-sls-orange/10 border-sls-orange animate-shake",
                    !isLeftMatched(idx) && selectedLeft !== idx && "hover:bg-sls-cream/50 border-sls-beige"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Right column */}
            <div className="space-y-2">
              {rightItems.map((item, idx) => (
                <button
                  key={`right-${idx}`}
                  onClick={() => handleRightClick(idx)}
                  disabled={isRightMatched(idx)}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 text-left text-sm transition-all",
                    isRightMatched(idx) && "bg-sls-teal/10 border-sls-teal text-sls-teal",
                    selectedRight === idx && !isRightMatched(idx) && "bg-sls-cream border-sls-chartreuse",
                    incorrectPair?.[1] === idx && "bg-sls-orange/10 border-sls-orange animate-shake",
                    !isRightMatched(idx) && selectedRight !== idx && "hover:bg-sls-cream/50 border-sls-beige"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      {currentHint && !isComplete && (
        <div className="mt-4 bg-sls-chartreuse/10 border border-sls-chartreuse/30 rounded-lg p-3 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-sls-chartreuse flex-shrink-0 mt-0.5" />
          <p className="text-sm text-sls-olive">{currentHint}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center gap-2">
        {!isComplete ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleHint}
            disabled={hintsUsed >= hints.length}
            className="border-sls-chartreuse/50 text-sls-chartreuse hover:bg-sls-chartreuse/10"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint ({hints.length - hintsUsed} left)
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleReset} className="border-sls-teal text-sls-teal hover:bg-sls-teal/10">
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
}
