"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lightbulb, RotateCcw, Sparkles, BookOpen } from "lucide-react";
import { AudioButton } from "./audio-button";
import { VocabularyMatchingConfig, VocabularyTerm } from "@/types/word-games";

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

interface ShuffledDefinition {
  id: string;
  definition: string;
}

interface VocabularyMatchingProps {
  config: VocabularyMatchingConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
    audioPlayed: number;
  }) => void;
  // Multiplayer sync props
  onStateChange?: (state: {
    matches: string[];
    selectedTerm: string | null;
    selectedDefinition: string | null;
  }) => void;
  syncedState?: {
    matches: string[];
    selectedTerm: string | null;
    selectedDefinition: string | null;
  };
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

export function VocabularyMatching({
  config,
  instructions,
  hints = [],
  onComplete,
  onStateChange,
  syncedState,
  isViewOnly = false,
}: VocabularyMatchingProps) {
  // Prepare terms and shuffled definitions
  const { terms, shuffledDefinitions } = useMemo(() => {
    const orderedTerms = config.shuffleTerms
      ? shuffleArray(config.terms)
      : config.terms;

    const definitions: ShuffledDefinition[] = shuffleArray(
      config.terms.map((t) => ({ id: t.id, definition: t.definition }))
    );

    return { terms: orderedTerms, shuffledDefinitions: definitions };
  }, [config.terms, config.shuffleTerms]);

  // State
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null);
  const [matches, setMatches] = useState<Set<string>>(new Set());
  const [incorrectPair, setIncorrectPair] = useState<{ term: string; def: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [audioPlayed, setAudioPlayed] = useState<Set<string>>(new Set());
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  // Sync state from other players (multiplayer)
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (!syncedState) return;

    const syncedKey = JSON.stringify(syncedState);
    if (lastSyncedRef.current === syncedKey) return;
    lastSyncedRef.current = syncedKey;

    setMatches(new Set(syncedState.matches));
    setSelectedTerm(syncedState.selectedTerm);
    setSelectedDefinition(syncedState.selectedDefinition);
  }, [syncedState]);

  // Handle term selection
  const handleTermClick = (termId: string) => {
    if (isViewOnly || matches.has(termId)) return;

    setSelectedTerm(termId);
    setIncorrectPair(null);

    onStateChange?.({
      matches: Array.from(matches),
      selectedTerm: termId,
      selectedDefinition,
    });

    if (selectedDefinition !== null) {
      checkMatch(termId, selectedDefinition);
    }
  };

  // Handle definition selection
  const handleDefinitionClick = (defId: string) => {
    if (isViewOnly || matches.has(defId)) return;

    setSelectedDefinition(defId);
    setIncorrectPair(null);

    onStateChange?.({
      matches: Array.from(matches),
      selectedTerm,
      selectedDefinition: defId,
    });

    if (selectedTerm !== null) {
      checkMatch(selectedTerm, defId);
    }
  };

  // Check if term and definition match
  const checkMatch = (termId: string, defId: string) => {
    setAttempts((prev) => prev + 1);

    // They match if the IDs are the same (term.id === definition's original term id)
    if (termId === defId) {
      // Correct match!
      const newMatches = new Set(matches);
      newMatches.add(termId);
      setMatches(newMatches);
      setSelectedTerm(null);
      setSelectedDefinition(null);

      onStateChange?.({
        matches: Array.from(newMatches),
        selectedTerm: null,
        selectedDefinition: null,
      });

      // Check if all matched
      if (newMatches.size === config.terms.length) {
        setIsComplete(true);
        onComplete?.({
          isCorrect: true,
          attempts: attempts + 1,
          hintsUsed,
          timeSeconds: Math.round((Date.now() - startTime) / 1000),
          audioPlayed: audioPlayed.size,
        });
      }
    } else {
      // Incorrect match
      setIncorrectPair({ term: termId, def: defId });
      setTimeout(() => {
        setSelectedTerm(null);
        setSelectedDefinition(null);
        setIncorrectPair(null);
      }, 1000);
    }
  };

  // Track audio played
  const handleAudioPlay = (termId: string) => {
    setAudioPlayed((prev) => new Set(prev).add(termId));
  };

  // Show hint
  const handleHint = () => {
    if (hintsUsed < hints.length) {
      setCurrentHint(hints[hintsUsed]);
      setHintsUsed((prev) => prev + 1);
    }
  };

  // Reset game
  const handleReset = () => {
    setSelectedTerm(null);
    setSelectedDefinition(null);
    setMatches(new Set());
    setIncorrectPair(null);
    setIsComplete(false);
    setCurrentHint(null);
    setAttempts(0);
    setHintsUsed(0);
    setAudioPlayed(new Set());
  };

  // Check if matched
  const isTermMatched = (id: string) => matches.has(id);
  const isDefinitionMatched = (id: string) => matches.has(id);

  // Get categories for grouping (optional)
  const categories = useMemo(() => {
    if (!config.showCategories) return null;
    const cats = new Set(terms.map((t) => t.category).filter(Boolean));
    return cats.size > 0 ? Array.from(cats) : null;
  }, [terms, config.showCategories]);

  return (
    <div className="h-full flex flex-col bg-white px-4 md:px-16 py-4 relative">
      {/* Celebration confetti overlay */}
      <CelebrationOverlay show={isComplete} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sls-teal" />
          <h2 className="text-lg font-semibold text-sls-olive">Vocabulary Matching</h2>
        </div>
        {config.enableAudio && (
          <span className="text-xs text-sls-olive/60 bg-sls-cream px-2 py-1 rounded">
            🔊 Audio enabled
          </span>
        )}
      </div>

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
              <span>{config.terms.length}</span> matched
            </span>
            {attempts > 0 && (
              <span className="text-xs text-sls-olive/60">
                {attempts} attempt{attempts !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-sls-teal transition-all duration-300"
              style={{ width: `${(matches.size / config.terms.length) * 100}%` }}
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
          <h3 className="text-2xl font-bold text-sls-teal mt-4">Excellent Work!</h3>
          <p className="text-sls-olive mt-2">
            All {config.terms.length} terms matched successfully!
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm flex-wrap justify-center">
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
            {config.enableAudio && (
              <div className="bg-sls-cream rounded-lg px-3 py-2">
                <span className="text-sls-olive">Audio:</span>
                <span className="font-bold text-sls-teal ml-1">{audioPlayed.size} played</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Matching area */
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {/* Left column - Terms */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-sls-olive/60 uppercase tracking-wider text-center mb-3">
                Terms
              </h4>
              {terms.map((term) => (
                <div
                  key={`term-${term.id}`}
                  className={cn(
                    "flex items-center gap-2 w-full p-3 rounded-lg border-2 transition-all",
                    isTermMatched(term.id) && "bg-sls-teal/10 border-sls-teal text-sls-teal opacity-60",
                    selectedTerm === term.id && !isTermMatched(term.id) && "bg-sls-cream border-sls-chartreuse ring-2 ring-sls-chartreuse/30",
                    incorrectPair?.term === term.id && "bg-sls-orange/10 border-sls-orange animate-shake",
                    !isTermMatched(term.id) && selectedTerm !== term.id && "border-sls-beige hover:bg-sls-cream/50 cursor-pointer"
                  )}
                >
                  <button
                    onClick={() => handleTermClick(term.id)}
                    disabled={isTermMatched(term.id) || isViewOnly}
                    className="flex-1 text-left text-sm font-medium disabled:cursor-default"
                  >
                    {term.term}
                    {term.category && config.showCategories && (
                      <span className="ml-2 text-xs text-sls-olive/40">
                        ({term.category})
                      </span>
                    )}
                  </button>
                  {config.enableAudio && !isTermMatched(term.id) && (
                    <AudioButton
                      text={term.term}
                      size="sm"
                      onPlay={() => handleAudioPlay(term.id)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Right column - Definitions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-sls-olive/60 uppercase tracking-wider text-center mb-3">
                Definitions
              </h4>
              {shuffledDefinitions.map((def) => (
                <button
                  key={`def-${def.id}`}
                  onClick={() => handleDefinitionClick(def.id)}
                  disabled={isDefinitionMatched(def.id) || isViewOnly}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 text-left text-sm transition-all",
                    isDefinitionMatched(def.id) && "bg-sls-teal/10 border-sls-teal text-sls-teal opacity-60",
                    selectedDefinition === def.id && !isDefinitionMatched(def.id) && "bg-sls-cream border-sls-chartreuse ring-2 ring-sls-chartreuse/30",
                    incorrectPair?.def === def.id && "bg-sls-orange/10 border-sls-orange animate-shake",
                    !isDefinitionMatched(def.id) && selectedDefinition !== def.id && "border-sls-beige hover:bg-sls-cream/50",
                    "disabled:cursor-default"
                  )}
                >
                  {def.definition}
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-sls-teal text-sls-teal hover:bg-sls-teal/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) infinite;
        }
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall 2s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
