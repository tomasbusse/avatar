"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Lightbulb, RotateCcw, Shuffle } from "lucide-react";

export interface WordOrderingConfig {
  type: "word_ordering";
  correctOrder?: string[]; // Words in correct order (new format)
  shuffledWords?: string[]; // Optional pre-shuffled order
  // Legacy format support
  items?: Array<{
    id: string;
    scrambledWords: string[];
    correctSentence: string;
    punctuation?: string;
  }>;
}

interface WordOrderingProps {
  config: WordOrderingConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
  // Multiplayer sync props
  onWordsChange?: (words: string[]) => void;
  syncedWords?: string[];
  isViewOnly?: boolean;
}

interface SortableWordProps {
  id: string;
  word: string;
  isCorrect?: boolean;
  isIncorrect?: boolean;
}

function SortableWord({ id, word, isCorrect, isIncorrect }: SortableWordProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium cursor-grab active:cursor-grabbing",
        "border-2 shadow-sm select-none whitespace-nowrap",
        "transition-all duration-150 hover:scale-105 hover:shadow-md",
        isDragging && "opacity-50 scale-105 shadow-lg",
        isCorrect && "bg-sls-teal/10 border-sls-teal text-sls-teal",
        isIncorrect && "bg-sls-orange/10 border-sls-orange text-sls-orange",
        !isCorrect && !isIncorrect && "bg-sls-cream border-sls-beige hover:border-sls-teal"
      )}
    >
      {word}
    </div>
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function WordOrdering({
  config,
  instructions,
  hints = [],
  onComplete,
  onWordsChange,
  syncedWords,
  isViewOnly,
}: WordOrderingProps) {
  // Support both new format (correctOrder) and legacy format (items)
  const getCorrectOrder = (): string[] => {
    if (config.correctOrder && Array.isArray(config.correctOrder)) {
      return config.correctOrder;
    }
    // Legacy format: extract from first item's correctSentence
    if (config.items && Array.isArray(config.items) && config.items.length > 0) {
      const sentence = config.items[0].correctSentence || "";
      // Remove punctuation and split into words
      return sentence.replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean);
    }
    return [];
  };

  const getInitialWords = (): string[] => {
    if (config.shuffledWords && Array.isArray(config.shuffledWords)) {
      return config.shuffledWords;
    }
    // Legacy format: use scrambledWords if available
    if (config.items && Array.isArray(config.items) && config.items.length > 0) {
      return config.items[0].scrambledWords || [];
    }
    // Shuffle the correct order
    return shuffleArray(getCorrectOrder());
  };

  const correctOrder = getCorrectOrder();
  const initialWords = getInitialWords();

  const [words, setWords] = useState<string[]>(initialWords);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [wordStatuses, setWordStatuses] = useState<("correct" | "incorrect" | null)[]>(
    new Array(correctOrder.length).fill(null)
  );

  // Sync words from other players (multiplayer) - using ref to prevent loops
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (!syncedWords || syncedWords.length === 0) return;

    const syncedWordsStr = syncedWords.join(",");

    // Skip if we already processed this sync
    if (lastSyncedRef.current === syncedWordsStr) return;
    lastSyncedRef.current = syncedWordsStr;

    setWords(syncedWords);
    setShowResult(false);
    setWordStatuses(new Array(correctOrder.length).fill(null));
  }, [syncedWords, correctOrder.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Real-time sync during drag (not just on drop)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (isViewOnly) return;

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = words.indexOf(active.id as string);
      const newIndex = words.indexOf(over.id as string);

      if (oldIndex !== newIndex) {
        const newWords = arrayMove(words, oldIndex, newIndex);
        setWords(newWords);
        setShowResult(false);
        setWordStatuses(new Array(correctOrder.length).fill(null));

        // Notify parent for real-time multiplayer sync
        onWordsChange?.(newWords);
      }
    }
  }, [correctOrder.length, words, isViewOnly, onWordsChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (isViewOnly) return;

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = words.indexOf(active.id as string);
      const newIndex = words.indexOf(over.id as string);
      const newWords = arrayMove(words, oldIndex, newIndex);

      setWords(newWords);
      setShowResult(false);
      setWordStatuses(new Array(correctOrder.length).fill(null));

      // Final sync on drop
      onWordsChange?.(newWords);
    }
  }, [correctOrder.length, words, isViewOnly, onWordsChange]);

  const handleCheck = () => {
    setAttempts(prev => prev + 1);

    const statuses: ("correct" | "incorrect" | null)[] = words.map((word, idx) =>
      word === correctOrder[idx] ? "correct" : "incorrect"
    );
    setWordStatuses(statuses);

    const allCorrect = statuses.every(s => s === "correct");
    setIsCorrect(allCorrect);
    setShowResult(true);

    if (allCorrect && onComplete) {
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
    }
  };

  const handleShuffle = () => {
    setWords(shuffleArray(words));
    setShowResult(false);
    setWordStatuses(new Array(correctOrder.length).fill(null));
    setCurrentHint(null);
  };

  const handleReset = () => {
    setWords(shuffleArray(correctOrder));
    setShowResult(false);
    setIsCorrect(false);
    setWordStatuses(new Array(correctOrder.length).fill(null));
    setCurrentHint(null);
  };

  return (
    <div className="h-full flex flex-col bg-white px-16 py-4">
      {/* Instructions */}
      {instructions && (
        <p className="text-center text-sm text-sls-olive/70 mb-4">
          {instructions}
        </p>
      )}

      {/* Word ordering area */}
      <div className="flex-1 bg-sls-cream/30 rounded-lg p-6 border border-sls-beige/50 min-h-[120px] flex items-center justify-center">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={words} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-3 justify-center">
              {words.map((word, idx) => (
                <SortableWord
                  key={`${word}-${idx}`}
                  id={word}
                  word={word}
                  isCorrect={wordStatuses[idx] === "correct"}
                  isIncorrect={wordStatuses[idx] === "incorrect"}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Hint */}
      {currentHint && (
        <div className="mt-4 bg-sls-chartreuse/10 border border-sls-chartreuse/30 rounded-lg p-3 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-sls-chartreuse flex-shrink-0 mt-0.5" />
          <p className="text-sm text-sls-olive">{currentHint}</p>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div
          className={cn(
            "mt-4 rounded-lg p-3 flex items-center gap-3",
            isCorrect
              ? "bg-sls-teal/10 border border-sls-teal/30"
              : "bg-sls-orange/10 border border-sls-orange/30"
          )}
        >
          {isCorrect ? (
            <>
              <CheckCircle className="w-6 h-6 text-sls-teal" />
              <div>
                <p className="font-medium text-sls-teal">Perfect!</p>
                <p className="text-sm text-sls-olive">
                  The correct order in {attempts} attempt{attempts !== 1 ? "s" : ""}!
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-6 h-6 text-sls-orange" />
              <div>
                <p className="font-medium text-sls-orange">Not quite right</p>
                <p className="text-sm text-sls-olive">
                  Drag the words to rearrange them.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center gap-2">
        {!showResult || !isCorrect ? (
          <>
            <Button variant="outline" onClick={handleShuffle} className="border-sls-olive/30 text-sls-olive hover:border-sls-teal hover:text-sls-teal">
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle
            </Button>
            <Button
              variant="outline"
              onClick={handleHint}
              disabled={hintsUsed >= hints.length}
              className="border-sls-chartreuse/50 text-sls-chartreuse hover:bg-sls-chartreuse/10"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Hint ({hints.length - hintsUsed} left)
            </Button>
            <Button onClick={handleCheck} className="bg-sls-teal hover:bg-sls-teal/90 text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Check Order
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={handleReset} className="border-sls-teal text-sls-teal hover:bg-sls-teal/10">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
