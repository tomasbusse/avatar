"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Gamepad2, Trophy, Star } from "lucide-react";
import {
  WordGame,
  GameConfig,
  getTotalItems,
  SentenceBuilderConfig,
  FillInBlankConfig,
  MultipleChoiceConfig,
  MatchingPairsConfig,
  CrosswordConfig,
} from "@/types/word-games";
import { SentenceBuilder } from "./sentence-builder";
import { WordScramble } from "./word-scramble";
import { Hangman } from "./hangman";
import { Flashcards, FlashcardsConfig } from "./flashcards";
import { WordOrdering, WordOrderingConfig } from "./word-ordering";
import { MatchingPairs } from "./matching-pairs";
import { FillInBlank } from "./fill-in-blank";
import { Crossword } from "./crossword";
import html2canvas from "html2canvas";

// ============================================
// TYPES
// ============================================

interface GameViewerProps {
  game: WordGame;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onComplete: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
    itemIndex: number;
  }) => void;
  onGameComplete?: (finalScore: {
    stars: number;
    scorePercent: number;
    totalCorrect: number;
    totalItems: number;
  }) => void;
  onScreenshot?: (imageBase64: string, itemIndex: number) => void;
  onInputChange?: (value: string) => void;
  onElementsChange?: (elementIds: string[]) => void;
  syncedElements?: string[];
  onCrosswordChange?: (gridState: string) => void;
  syncedCrosswordGrid?: string;
  className?: string;
  navigationDisabled?: boolean;
  interactionDisabled?: boolean;
}

interface ItemResult {
  isCorrect: boolean;
  attempts: number;
  hintsUsed: number;
  timeSeconds: number;
}

// ============================================
// SIMPLE COMPONENT CONFIGS (what game components actually expect)
// ============================================

interface SimpleWordScrambleConfig {
  type: "word_scramble";
  word: string;
  hint?: string;
}

interface SimpleHangmanConfig {
  type: "hangman";
  word: string;
  hint?: string;
  maxWrongGuesses?: number;
}

interface SimpleWordOrderingConfig {
  type: "word_ordering";
  correctOrder: string[];
  shuffledWords: string[];
}

type SimpleGameConfig = SentenceBuilderConfig | SimpleWordScrambleConfig | SimpleHangmanConfig | SimpleWordOrderingConfig | GameConfig;

// ============================================
// HELPER: Extract single-item config for current index
// ============================================

function getSingleItemConfig(
  config: GameConfig,
  index: number
): SimpleGameConfig | null {
  switch (config.type) {
    case "sentence_builder": {
      // Multi-item mode
      if (config.items && config.items[index]) {
        const item = config.items[index];
        return {
          type: "sentence_builder",
          targetSentence: item.targetSentence,
          availableBlocks: item.availableBlocks,
          distractorBlocks: item.distractorBlocks,
        } as SentenceBuilderConfig;
      }
      // Legacy single-item mode
      if (index === 0 && config.targetSentence) {
        return config;
      }
      return null;
    }

    case "word_scramble": {
      // Multi-item mode - extract single word for component
      if (config.items && config.items[index]) {
        const item = config.items[index];
        return {
          type: "word_scramble",
          word: item.correctWord,
          hint: item.hint,
        } as SimpleWordScrambleConfig;
      }
      return null;
    }

    case "hangman": {
      // Multi-item mode - extract single word for component
      if (config.items && config.items[index]) {
        const item = config.items[index];
        return {
          type: "hangman",
          word: item.word,
          hint: item.hint,
          maxWrongGuesses: item.maxMistakes,
        } as SimpleHangmanConfig;
      }
      return null;
    }

    case "fill_in_blank": {
      if (config.items && config.items[index]) {
        const item = config.items[index];
        return {
          type: "fill_in_blank",
          items: [item],
        } as FillInBlankConfig;
      }
      return null;
    }

    case "multiple_choice": {
      if (config.items && config.items[index]) {
        const item = config.items[index];
        return {
          type: "multiple_choice",
          items: [item],
          allowMultipleSelect: config.allowMultipleSelect,
        } as MultipleChoiceConfig;
      }
      return null;
    }

    case "word_ordering": {
      // Multi-item mode - extract single item's sentence
      if (config.items && config.items[index]) {
        const item = config.items[index];
        // Parse the correct sentence into words
        const correctSentence = item.correctSentence || "";
        const correctOrder = correctSentence.replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean);
        return {
          type: "word_ordering",
          correctOrder,
          shuffledWords: item.scrambledWords || [],
        } as SimpleWordOrderingConfig;
      }
      return null;
    }

    case "matching_pairs": {
      // 5 pairs per slide - extract pairs for current slide
      const PAIRS_PER_SLIDE = 5;
      const startIdx = index * PAIRS_PER_SLIDE;
      const endIdx = startIdx + PAIRS_PER_SLIDE;
      const slidePairs = config.pairs.slice(startIdx, endIdx);

      if (slidePairs.length === 0) return null;

      // Component handles both simple and complex pair formats
      return {
        type: "matching_pairs",
        pairs: slidePairs,
        matchType: config.matchType,
        timeLimit: config.timeLimit,
      } as unknown as MatchingPairsConfig;
    }

    // Flashcards shows all cards at once
    case "flashcards":
      return index === 0 ? config : null;

    case "crossword": {
      // Multi-puzzle mode - extract single puzzle
      if (config.items && config.items[index]) {
        const item = config.items[index];
        return {
          type: "crossword",
          rows: config.rows,
          cols: config.cols,
          words: item.words,
          grid: item.grid,
        } as CrosswordConfig;
      }
      // Single puzzle mode (legacy)
      if (index === 0 && config.words) {
        return config;
      }
      return null;
    }

    default:
      return null;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GameViewer({
  game,
  currentIndex,
  onIndexChange,
  onComplete,
  onGameComplete,
  onScreenshot,
  onInputChange,
  onElementsChange,
  syncedElements,
  onCrosswordChange,
  syncedCrosswordGrid,
  className,
  navigationDisabled,
  interactionDisabled,
}: GameViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemResults, setItemResults] = useState<Map<number, ItemResult>>(new Map());
  const [resetTrigger, setResetTrigger] = useState(0);
  const prevIndexRef = useRef(currentIndex);

  const totalItems = getTotalItems(game.config);
  const currentItemConfig = getSingleItemConfig(game.config, currentIndex);

  // Calculate overall progress
  const completedItems = itemResults.size;
  const correctItems = Array.from(itemResults.values()).filter(r => r.isCorrect).length;

  // Trigger screenshot when item changes
  useEffect(() => {
    if (!onScreenshot) return;

    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;

      // Capture screenshot after render
      const timer = setTimeout(() => {
        captureScreenshot();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, onScreenshot]);

  // Capture screenshot of current game state
  const captureScreenshot = useCallback(async () => {
    if (!containerRef.current || !onScreenshot) return;

    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: "#ffffff",
        scale: 1,
        logging: false,
        useCORS: true,
      });
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);
      onScreenshot(imageBase64, currentIndex);
    } catch (error) {
      console.error("[GameViewer] Screenshot capture failed:", error);
    }
  }, [currentIndex, onScreenshot]);

  // Handle item completion
  const handleItemComplete = useCallback(
    (result: { isCorrect: boolean; attempts: number; hintsUsed: number; timeSeconds: number }) => {
      const itemResult: ItemResult = { ...result };

      setItemResults(prev => {
        const newResults = new Map(prev);
        newResults.set(currentIndex, itemResult);
        return newResults;
      });

      onComplete({
        ...result,
        itemIndex: currentIndex,
      });

      // Check if all items are complete
      if (completedItems + 1 >= totalItems) {
        // Calculate final score
        const allResults = Array.from(itemResults.values());
        allResults.push(itemResult);

        const totalCorrect = allResults.filter(r => r.isCorrect).length;
        const scorePercent = Math.round((totalCorrect / totalItems) * 100);
        const totalHints = allResults.reduce((sum, r) => sum + r.hintsUsed, 0);
        const totalAttempts = allResults.reduce((sum, r) => sum + r.attempts, 0);

        // Calculate stars
        let stars = 1;
        if (scorePercent >= 90 && totalHints === 0 && totalAttempts <= totalItems) {
          stars = 3;
        } else if (scorePercent >= 70 && totalHints <= 2) {
          stars = 2;
        }

        onGameComplete?.({
          stars,
          scorePercent,
          totalCorrect,
          totalItems,
        });
      } else {
        // Auto-advance to next item after a short delay
        setTimeout(() => {
          if (currentIndex < totalItems - 1) {
            onIndexChange(currentIndex + 1);
          }
        }, 1500);
      }
    },
    [currentIndex, completedItems, totalItems, itemResults, onComplete, onGameComplete, onIndexChange]
  );

  // Navigation
  const goToPrevious = useCallback(() => {
    if (navigationDisabled || currentIndex === 0) return;
    setResetTrigger(prev => prev + 1);
    onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange, navigationDisabled]);

  const goToNext = useCallback(() => {
    if (navigationDisabled || currentIndex >= totalItems - 1) return;
    setResetTrigger(prev => prev + 1);
    onIndexChange(currentIndex + 1);
  }, [currentIndex, totalItems, onIndexChange, navigationDisabled]);

  // Keyboard navigation
  useEffect(() => {
    if (navigationDisabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, navigationDisabled]);

  // Render game content based on type
  const renderGame = () => {
    if (!currentItemConfig) {
      return (
        <div className="flex items-center justify-center h-64 text-sls-olive">
          No content available for this item
        </div>
      );
    }

    switch (currentItemConfig.type) {
      case "sentence_builder":
        return (
          <SentenceBuilder
            key={`sb-${currentIndex}-${resetTrigger}`}
            config={currentItemConfig as SentenceBuilderConfig}
            instructions={game.instructions}
            hints={game.hints || []}
            onComplete={handleItemComplete}
            onBlocksChange={onElementsChange}
            syncedBlockIds={syncedElements}
            isViewOnly={interactionDisabled}
          />
        );

      case "word_scramble":
        return (
          <WordScramble
            key={`ws-${currentIndex}-${resetTrigger}`}
            config={currentItemConfig as SimpleWordScrambleConfig}
            instructions={game.instructions}
            hints={game.hints || []}
            onComplete={handleItemComplete}
          />
        );

      case "hangman":
        return (
          <Hangman
            key={`hm-${currentIndex}-${resetTrigger}`}
            config={currentItemConfig as SimpleHangmanConfig}
            instructions={game.instructions}
            hints={game.hints || []}
            onComplete={handleItemComplete}
          />
        );

      case "flashcards":
        return (
          <Flashcards
            key={`fc-${currentIndex}-${resetTrigger}`}
            config={currentItemConfig as FlashcardsConfig}
            instructions={game.instructions}
            hints={game.hints || []}
            onComplete={handleItemComplete}
          />
        );

      case "word_ordering":
        return (
          <WordOrdering
            key={`wo-${currentIndex}-${resetTrigger}`}
            config={currentItemConfig as SimpleWordOrderingConfig}
            instructions={game.instructions}
            hints={game.hints || []}
            onComplete={handleItemComplete}
            onWordsChange={onElementsChange}
            syncedWords={syncedElements}
            isViewOnly={interactionDisabled}
          />
        );

      case "matching_pairs":
        return (
          <MatchingPairs
            key={`mp-${currentIndex}-${resetTrigger}`}
            config={currentItemConfig as MatchingPairsConfig}
            instructions={game.instructions}
            hints={game.hints || []}
            onComplete={handleItemComplete}
            isViewOnly={interactionDisabled}
          />
        );

      case "fill_in_blank":
        return (
          <FillInBlank
            key={`fib-${currentIndex}-${resetTrigger}`}
            config={currentItemConfig as FillInBlankConfig}
            instructions={game.instructions}
            hints={game.hints || []}
            onComplete={handleItemComplete}
          />
        );

      case "crossword":
        return (
          <Crossword
            key={`cw-${currentIndex}-${resetTrigger}`}
            config={currentItemConfig as CrosswordConfig}
            instructions={game.instructions}
            hints={game.hints || []}
            onComplete={handleItemComplete}
            onGridChange={onCrosswordChange}
            syncedGrid={syncedCrosswordGrid}
            isViewOnly={interactionDisabled}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-sls-olive">
            Game type &quot;{currentItemConfig.type}&quot; not yet implemented in viewer
          </div>
        );
    }
  };

  return (
    <div className={`w-full h-full flex flex-col ${className || ""}`}>
      {/* Compact Progress Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-sls-teal" />
          <span className="font-medium text-sls-teal text-sm">{game.title}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sls-teal transition-all duration-300"
                style={{ width: `${(completedItems / totalItems) * 100}%` }}
              />
            </div>
            <span className="text-xs text-sls-olive">
              {currentIndex + 1}/{totalItems}
            </span>
          </div>

          {/* Score display */}
          <div className="flex items-center gap-1 text-xs">
            <Trophy className="w-3 h-3 text-sls-chartreuse" />
            <span className="text-sls-olive">{correctItems}/{completedItems}</span>
          </div>
        </div>
      </div>

      {/* Main Game Area with Navigation - White background, fills available space */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Previous button */}
        {!navigationDisabled && totalItems > 1 && (
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              currentIndex === 0
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-white shadow-md hover:bg-sls-cream text-sls-teal hover:scale-105"
            }`}
            aria-label="Previous item"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Game content */}
        <div ref={containerRef} className={`flex-1 bg-white min-h-0 ${interactionDisabled ? "pointer-events-none opacity-75" : ""}`}>
          {renderGame()}
        </div>

        {/* Next button */}
        {!navigationDisabled && totalItems > 1 && (
          <button
            onClick={goToNext}
            disabled={currentIndex >= totalItems - 1}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              currentIndex >= totalItems - 1
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-white shadow-md hover:bg-sls-cream text-sls-teal hover:scale-105"
            }`}
            aria-label="Next item"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation disabled indicator */}
      {navigationDisabled && (
        <div className="flex-shrink-0 text-center text-xs text-sls-olive py-1 bg-gray-50">
          Avatar is controlling the game
        </div>
      )}
    </div>
  );
}

export default GameViewer;
