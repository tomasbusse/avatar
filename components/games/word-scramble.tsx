"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Lightbulb, RotateCcw, Shuffle, Sparkles, Eye } from "lucide-react";

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

export interface WordScrambleConfig {
  type: "word_scramble";
  word: string;
  hint?: string; // Optional hint/definition
}

interface WordScrambleProps {
  config: WordScrambleConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
}

function scrambleWord(word: string): string[] {
  const letters = word.toUpperCase().split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Make sure it's actually scrambled
  if (letters.join("") === word.toUpperCase()) {
    return scrambleWord(word);
  }
  return letters;
}

export function WordScramble({
  config,
  instructions,
  hints = [],
  onComplete,
}: WordScrambleProps) {
  const word = config.word || "";

  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [userWord, setUserWord] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (word) {
      setScrambledLetters(scrambleWord(word));
    }
  }, [word]);

  // Safety check - if no word, show error
  if (!word) {
    return (
      <div className="flex items-center justify-center h-64 text-sls-orange">
        No word configured for this word scramble game
      </div>
    );
  }

  const handleLetterClick = (index: number) => {
    if (selectedLetters.includes(index)) {
      // Deselect letter
      const idx = selectedLetters.indexOf(index);
      const newSelected = [...selectedLetters];
      newSelected.splice(idx, 1);
      setSelectedLetters(newSelected);
      setUserWord(prev => prev.slice(0, idx) + prev.slice(idx + 1));
    } else {
      // Select letter
      setSelectedLetters([...selectedLetters, index]);
      setUserWord(prev => prev + scrambledLetters[index]);
    }
    setShowResult(false);
  };

  const handleCheck = () => {
    setAttempts(prev => prev + 1);

    const correct = userWord.toUpperCase() === config.word.toUpperCase();
    setIsCorrect(correct);
    setShowResult(true);

    if (correct && onComplete) {
      onComplete({
        isCorrect: true,
        attempts: attempts + 1,
        hintsUsed,
        timeSeconds: Math.round((Date.now() - startTime) / 1000),
      });
    }
  };

  const handleHint = () => {
    if (hintsUsed < hints.length) {
      setCurrentHint(hints[hintsUsed]);
      setHintsUsed(prev => prev + 1);
    } else if (config.hint && !currentHint) {
      setCurrentHint(config.hint);
      setHintsUsed(prev => prev + 1);
    }
  };

  const handleClear = () => {
    setSelectedLetters([]);
    setUserWord("");
    setShowResult(false);
  };

  const handleShuffle = () => {
    setScrambledLetters(scrambleWord(config.word));
    handleClear();
  };

  const handleReveal = () => {
    setIsRevealed(true);
    setUserWord(config.word.toUpperCase());
    setSelectedLetters(scrambledLetters.map((_, i) => i));
  };

  const handleReset = () => {
    setScrambledLetters(scrambleWord(config.word));
    setSelectedLetters([]);
    setUserWord("");
    setShowResult(false);
    setIsCorrect(false);
    setIsRevealed(false);
    setCurrentHint(null);
  };

  return (
    <div className="h-full flex flex-col bg-white px-16 py-4 relative">
      {/* Celebration confetti overlay */}
      <CelebrationOverlay show={isCorrect && showResult} />

      {/* Instructions */}
      {instructions && !isCorrect && (
        <p className="text-center text-sm text-sls-olive/70 mb-4">
          {instructions}
        </p>
      )}

      {/* Celebration screen */}
      {isCorrect && showResult ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="relative">
            <Sparkles className="w-12 h-12 text-sls-chartreuse animate-pulse" />
            <CheckCircle className="w-6 h-6 text-sls-teal absolute -bottom-1 -right-1" />
          </div>
          <h3 className="text-2xl font-bold text-sls-teal mt-4">Excellent!</h3>
          <p className="text-sls-olive mt-2">
            The word is <span className="font-bold text-sls-teal">{config.word.toUpperCase()}</span>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="mt-6 border-sls-teal text-sls-teal hover:bg-sls-teal/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      ) : (
        /* Main game area */
        <div className="flex-1 flex flex-col">
          {/* Header with word length */}
          <div className="text-center mb-4">
            <span className="text-xs uppercase tracking-wider text-sls-olive/60">
              Unscramble the letters
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-2xl font-bold text-sls-teal">{config.word.length}</span>
              <span className="text-sm text-sls-olive">letters</span>
            </div>
          </div>

          {/* Scrambled letters - modern square tiles */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {scrambledLetters.map((letter, idx) => (
              <button
                key={idx}
                onClick={() => handleLetterClick(idx)}
                disabled={isRevealed}
                className={cn(
                  "w-14 h-14 rounded-md text-2xl font-bold transition-all duration-200",
                  "border-2 shadow-sm",
                  selectedLetters.includes(idx)
                    ? "bg-sls-teal text-white border-sls-teal scale-90 opacity-40"
                    : "bg-white hover:bg-sls-cream border-gray-200 hover:border-sls-chartreuse hover:scale-105 text-sls-teal"
                )}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* User's word area - clean modern box */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[80px] flex items-center justify-center border-2 border-dashed border-gray-200">
            {userWord ? (
              <div className="flex gap-1.5">
                {userWord.split("").map((letter, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "w-12 h-12 rounded-md flex items-center justify-center text-xl font-bold shadow-sm",
                      isRevealed
                        ? "bg-sls-chartreuse/20 text-sls-teal border border-sls-chartreuse"
                        : "bg-white text-sls-teal border border-sls-beige"
                    )}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sls-olive/50 text-sm">Tap letters above to build the word</span>
            )}
          </div>

          {/* Hint display */}
          {currentHint && (
            <div className="mt-4 bg-sls-chartreuse/10 border border-sls-chartreuse/30 rounded-lg p-3 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-sls-chartreuse flex-shrink-0 mt-0.5" />
              <p className="text-sm text-sls-olive">{currentHint}</p>
            </div>
          )}

          {/* Wrong answer feedback */}
          {showResult && !isCorrect && (
            <div className="mt-4 bg-sls-orange/10 border border-sls-orange/30 rounded-lg p-3 flex items-center gap-2 animate-shake">
              <XCircle className="w-4 h-4 text-sls-orange flex-shrink-0" />
              <p className="text-sm text-sls-olive">Not quite right. Try again!</p>
            </div>
          )}

          {/* Revealed feedback */}
          {isRevealed && (
            <div className="mt-4 bg-sls-teal/10 border border-sls-teal/30 rounded-lg p-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-sls-teal flex-shrink-0" />
              <p className="text-sm text-sls-olive">
                The answer is <span className="font-bold text-sls-teal">{config.word.toUpperCase()}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions - bottom fixed */}
      {(!isCorrect || !showResult) && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isRevealed}
            className="border-gray-200 text-sls-olive hover:bg-gray-50"
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            disabled={isRevealed}
            className="border-gray-200 text-sls-olive hover:bg-gray-50"
          >
            <Shuffle className="w-4 h-4 mr-1" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHint}
            disabled={(hintsUsed >= hints.length && !!currentHint) || isRevealed}
            className="border-sls-chartreuse/50 text-sls-chartreuse hover:bg-sls-chartreuse/10"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Hint
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReveal}
            disabled={isRevealed}
            className="border-sls-olive/30 text-sls-olive hover:bg-sls-olive/10"
          >
            <Eye className="w-4 h-4 mr-1" />
            Reveal
          </Button>
          <Button
            size="sm"
            onClick={handleCheck}
            disabled={userWord.length !== config.word.length || isRevealed}
            className="bg-sls-teal hover:bg-sls-teal/90 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Check
          </Button>
        </div>
      )}
    </div>
  );
}
