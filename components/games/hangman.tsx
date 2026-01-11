"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Lightbulb, RotateCcw } from "lucide-react";

export interface HangmanConfig {
  type: "hangman";
  word: string;
  hint?: string;
  maxWrongGuesses?: number;
}

interface HangmanProps {
  config: HangmanConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function Hangman({
  config,
  instructions,
  hints = [],
  onComplete,
}: HangmanProps) {
  const maxWrong = config.maxWrongGuesses || 6;
  const word = (config.word || "").toUpperCase();

  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  const displayWord = useMemo(() => {
    return word.split("").map(letter => {
      if (letter === " ") return " ";
      return guessedLetters.has(letter) ? letter : "_";
    });
  }, [word, guessedLetters]);

  const isWon = displayWord.every(char => char !== "_");
  const isLost = wrongGuesses >= maxWrong;
  const isGameOver = isWon || isLost;

  // Safety check - if no word, show error
  if (!config.word) {
    return (
      <div className="flex items-center justify-center h-64 text-sls-orange">
        No word configured for this hangman game
      </div>
    );
  }

  const handleGuess = (letter: string) => {
    if (guessedLetters.has(letter) || isGameOver) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);

      if (newWrongGuesses >= maxWrong && onComplete) {
        onComplete({
          isCorrect: false,
          attempts: newGuessed.size,
          hintsUsed,
          timeSeconds: Math.round((Date.now() - startTime) / 1000),
        });
      }
    } else {
      // Check if word is complete
      const newDisplayWord = word.split("").map(l => {
        if (l === " ") return " ";
        return newGuessed.has(l) ? l : "_";
      });
      if (newDisplayWord.every(char => char !== "_") && onComplete) {
        onComplete({
          isCorrect: true,
          attempts: newGuessed.size,
          hintsUsed,
          timeSeconds: Math.round((Date.now() - startTime) / 1000),
        });
      }
    }
  };

  const handleHint = () => {
    // First show config hint, then reveal a letter
    if (config.hint && !currentHint) {
      setCurrentHint(config.hint);
      setHintsUsed(prev => prev + 1);
    } else if (hintsUsed < hints.length + 1) {
      // Reveal an unrevealed letter
      const unrevealedLetters = word
        .split("")
        .filter(l => l !== " " && !guessedLetters.has(l));
      if (unrevealedLetters.length > 0) {
        const letterToReveal = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
        handleGuess(letterToReveal);
        setHintsUsed(prev => prev + 1);
      }
    }
  };

  const handleReset = () => {
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setCurrentHint(null);
  };

  // Hangman drawing parts
  const hangmanParts = [
    // Head
    <circle key="head" cx="150" cy="70" r="20" stroke="currentColor" strokeWidth="3" fill="none" />,
    // Body
    <line key="body" x1="150" y1="90" x2="150" y2="140" stroke="currentColor" strokeWidth="3" />,
    // Left arm
    <line key="leftArm" x1="150" y1="100" x2="120" y2="120" stroke="currentColor" strokeWidth="3" />,
    // Right arm
    <line key="rightArm" x1="150" y1="100" x2="180" y2="120" stroke="currentColor" strokeWidth="3" />,
    // Left leg
    <line key="leftLeg" x1="150" y1="140" x2="120" y2="180" stroke="currentColor" strokeWidth="3" />,
    // Right leg
    <line key="rightLeg" x1="150" y1="140" x2="180" y2="180" stroke="currentColor" strokeWidth="3" />,
  ];

  return (
    <div className="space-y-6">
      {/* Instructions */}
      {instructions && (
        <div className="text-center text-sls-olive">
          {instructions}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Hangman drawing */}
        <div className="bg-sls-cream rounded-xl p-6 shadow-sm border border-sls-beige flex items-center justify-center">
          <svg viewBox="0 0 200 220" className="w-48 h-48 text-sls-olive">
            {/* Gallows */}
            <line x1="20" y1="200" x2="100" y2="200" stroke="currentColor" strokeWidth="3" />
            <line x1="60" y1="200" x2="60" y2="20" stroke="currentColor" strokeWidth="3" />
            <line x1="60" y1="20" x2="150" y2="20" stroke="currentColor" strokeWidth="3" />
            <line x1="150" y1="20" x2="150" y2="50" stroke="currentColor" strokeWidth="3" />

            {/* Hangman parts based on wrong guesses */}
            {hangmanParts.slice(0, wrongGuesses)}
          </svg>
        </div>

        {/* Word display */}
        <div className="bg-sls-cream rounded-xl p-6 shadow-sm border border-sls-beige flex flex-col items-center justify-center">
          <div className="flex gap-2 flex-wrap justify-center mb-4">
            {displayWord.map((char, idx) => (
              <span
                key={idx}
                className={cn(
                  "w-10 h-12 flex items-center justify-center text-2xl font-bold text-sls-teal",
                  char === " " ? "" : "border-b-4 border-sls-teal"
                )}
              >
                {char === " " ? "\u00A0\u00A0" : char}
              </span>
            ))}
          </div>
          <p className="text-sm text-sls-olive">
            {maxWrong - wrongGuesses} wrong guesses remaining
          </p>
        </div>
      </div>

      {/* Hint */}
      {currentHint && (
        <div className="bg-sls-orange/10 border border-sls-orange rounded-lg p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-sls-orange flex-shrink-0 mt-0.5" />
          <p className="text-sls-olive">{currentHint}</p>
        </div>
      )}

      {/* Result */}
      {isGameOver && (
        <div
          className={cn(
            "rounded-lg p-4 text-center",
            isWon
              ? "bg-sls-chartreuse/10 border border-sls-chartreuse"
              : "bg-sls-orange/10 border border-sls-orange"
          )}
        >
          {isWon ? (
            <>
              <p className="text-2xl mb-2">🎉</p>
              <p className="font-medium text-sls-teal">Congratulations!</p>
              <p className="text-sm text-sls-olive">You guessed the word!</p>
            </>
          ) : (
            <>
              <p className="text-2xl mb-2">😔</p>
              <p className="font-medium text-sls-orange">Game Over</p>
              <p className="text-sm text-sls-olive">
                The word was: <strong className="text-sls-teal">{word}</strong>
              </p>
            </>
          )}
        </div>
      )}

      {/* Keyboard */}
      {!isGameOver && (
        <div className="bg-sls-cream rounded-xl p-4 shadow-sm border border-sls-beige">
          <div className="flex flex-wrap gap-2 justify-center">
            {ALPHABET.map((letter) => {
              const isGuessed = guessedLetters.has(letter);
              const isCorrect = isGuessed && word.includes(letter);
              const isWrong = isGuessed && !word.includes(letter);

              return (
                <button
                  key={letter}
                  onClick={() => handleGuess(letter)}
                  disabled={isGuessed}
                  className={cn(
                    "w-10 h-10 rounded-lg font-bold transition-all",
                    isCorrect && "bg-sls-chartreuse text-white",
                    isWrong && "bg-sls-orange text-white opacity-50",
                    !isGuessed && "bg-white hover:bg-sls-teal hover:text-white border border-sls-beige"
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3">
        {!isGameOver ? (
          <Button
            variant="outline"
            onClick={handleHint}
            disabled={hintsUsed >= hints.length + 2}
            className="border-sls-orange text-sls-orange hover:bg-sls-orange/10"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint
          </Button>
        ) : (
          <Button variant="outline" onClick={handleReset} className="border-sls-teal text-sls-teal hover:bg-sls-teal/10">
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
}
