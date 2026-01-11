"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Shuffle } from "lucide-react";

// Support both string and {text: string} formats from AI generation
type TextValue = string | { text: string };

export interface FlashcardsConfig {
  type: "flashcards";
  cards: Array<{
    front: TextValue;
    back: TextValue;
    example?: TextValue;
  }>;
}

interface FlashcardsProps {
  config: FlashcardsConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to extract text from string or {text: string} format
function getText(value: string | { text: string } | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "text" in value) return value.text;
  return String(value);
}

export function Flashcards({
  config,
  instructions,
  onComplete,
}: FlashcardsProps) {
  const [cards, setCards] = useState(config.cards);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [unknownCards, setUnknownCards] = useState<Set<number>>(new Set());
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const card = cards[currentCard];
  const progress = knownCards.size + unknownCards.size;
  const total = cards.length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnow = () => {
    const newKnown = new Set(knownCards);
    newKnown.add(currentCard);
    setKnownCards(newKnown);
    unknownCards.delete(currentCard);
    goToNextUnreviewed(newKnown, unknownCards);
  };

  const handleDontKnow = () => {
    const newUnknown = new Set(unknownCards);
    newUnknown.add(currentCard);
    setUnknownCards(newUnknown);
    knownCards.delete(currentCard);
    goToNextUnreviewed(knownCards, newUnknown);
  };

  const goToNextUnreviewed = (known: Set<number>, unknown: Set<number>) => {
    setIsFlipped(false);

    // Check if all cards reviewed
    if (known.size + unknown.size === cards.length) {
      setIsComplete(true);
      if (onComplete) {
        onComplete({
          isCorrect: unknown.size === 0,
          attempts: cards.length,
          hintsUsed: 0,
          timeSeconds: Math.round((Date.now() - startTime) / 1000),
        });
      }
      return;
    }

    // Find next unreviewed card
    let next = (currentCard + 1) % cards.length;
    while (known.has(next) || unknown.has(next)) {
      next = (next + 1) % cards.length;
    }
    setCurrentCard(next);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % cards.length);
  };

  const handleShuffle = () => {
    setCards(shuffleArray(cards));
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setCards(shuffleArray(config.cards));
    setCurrentCard(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setUnknownCards(new Set());
    setIsComplete(false);
  };

  if (isComplete) {
    const knownCount = knownCards.size;
    const percentage = Math.round((knownCount / total) * 100);

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-3">
            {percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : "📚"}
          </div>
          <h3 className="text-xl font-bold text-sls-teal mb-4">Session Complete!</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-sls-teal/10 rounded-lg p-3">
              <p className="text-3xl font-bold text-sls-teal">{knownCount}</p>
              <p className="text-xs text-sls-olive">Known</p>
            </div>
            <div className="bg-sls-orange/10 rounded-lg p-3">
              <p className="text-3xl font-bold text-sls-orange">{unknownCards.size}</p>
              <p className="text-xs text-sls-olive">Review Later</p>
            </div>
          </div>
          <p className="text-sm text-sls-olive mb-4">
            {percentage >= 80
              ? "Great job! You know most of these!"
              : percentage >= 60
              ? "Good progress! Keep reviewing."
              : "Keep practicing to improve!"}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="border-sls-teal text-sls-teal">
              <RotateCcw className="w-3 h-3 mr-1" />
              Restart
            </Button>
            {unknownCards.size > 0 && (
              <Button size="sm" onClick={() => {
                const unknownIndices = Array.from(unknownCards);
                setCards(unknownIndices.map(i => config.cards[i]));
                setCurrentCard(0);
                setKnownCards(new Set());
                setUnknownCards(new Set());
                setIsComplete(false);
              }} className="bg-sls-teal hover:bg-sls-teal/90">
                Review ({unknownCards.size})
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-sls-teal">{currentCard + 1}</span>
          <span className="text-sls-olive">/</span>
          <span className="text-lg text-sls-olive">{total}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-sls-teal/10 px-2 py-1 rounded">
            <Check className="w-3 h-3 text-sls-teal" />
            <span className="text-sm font-semibold text-sls-teal">{knownCards.size}</span>
          </div>
          <div className="flex items-center gap-1 bg-sls-orange/10 px-2 py-1 rounded">
            <X className="w-3 h-3 text-sls-orange" />
            <span className="text-sm font-semibold text-sls-orange">{unknownCards.size}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-sls-teal transition-all duration-300"
          style={{ width: `${(progress / total) * 100}%` }}
        />
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-sls-olive/70 mb-3">
        {isFlipped ? "Do you know this word?" : "Click on the card to reveal the definition"}
      </p>

      {/* Flashcard - Compact */}
      <div
        className="flex-1 min-h-0 relative cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-400",
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-sls-cream to-white rounded-lg border-2 border-sls-beige p-6 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-sm uppercase tracking-wide text-sls-olive/60 mb-3">Term</span>
            <p className="text-3xl font-bold text-sls-teal text-center">{getText(card.front)}</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-sls-teal/5 to-sls-cream rounded-lg border-2 border-sls-teal/30 p-6 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-sm uppercase tracking-wide text-sls-olive/60 mb-3">Definition</span>
            <p className="text-2xl text-sls-olive text-center">{getText(card.back)}</p>
            {card.example && (
              <p className="text-base text-sls-olive/70 mt-4 italic text-center">
                &quot;{getText(card.example)}&quot;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handlePrevious} className="text-sls-olive hover:text-sls-teal">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShuffle} className="text-sls-olive hover:text-sls-teal">
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNext} className="text-sls-olive hover:text-sls-teal">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {isFlipped && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDontKnow}
              className="border-sls-orange text-sls-orange hover:bg-sls-orange/10"
            >
              <X className="w-3 h-3 mr-1" />
              Review
            </Button>
            <Button
              size="sm"
              onClick={handleKnow}
              className="bg-sls-teal hover:bg-sls-teal/90 text-white"
            >
              <Check className="w-3 h-3 mr-1" />
              Got it
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
