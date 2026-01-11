"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Block,
  BlockCategory,
  SentenceBuilderConfig,
  SentenceBuilderItem,
  BLOCK_CATEGORY_COLORS,
} from "@/types/word-games";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ============================================
// CLICKABLE WORD BLOCK
// ============================================

interface WordBlockProps {
  block: Block;
  onClick: () => void;
  showRemove?: boolean;
  disabled?: boolean;
}

function WordBlock({ block, onClick, showRemove, disabled }: WordBlockProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative px-4 py-2 rounded-lg text-base font-medium",
        "border border-black/10 shadow-sm select-none whitespace-nowrap",
        "transition-all duration-150",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95",
        showRemove && "pr-9"
      )}
      style={{ backgroundColor: BLOCK_CATEGORY_COLORS[block.category] }}
    >
      {block.text}
      {showRemove && (
        <span
          className={cn(
            "absolute right-1.5 top-1/2 -translate-y-1/2",
            "w-6 h-6 rounded-full bg-black/20 group-hover:bg-red-500",
            "flex items-center justify-center",
            "transition-colors"
          )}
        >
          <X className="w-3.5 h-3.5 text-white" />
        </span>
      )}
    </button>
  );
}

// ============================================
// FEEDBACK COMPONENT
// ============================================

interface FeedbackProps {
  isCorrect: boolean | null;
  message?: string;
}

function Feedback({ isCorrect, message }: FeedbackProps) {
  if (isCorrect === null) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-4 rounded-lg animate-in fade-in slide-in-from-bottom-2",
        isCorrect
          ? "bg-sls-chartreuse/10 text-sls-teal border border-sls-chartreuse"
          : "bg-sls-orange/10 text-sls-orange border border-sls-orange"
      )}
    >
      {isCorrect ? (
        <CheckCircle className="h-5 w-5 text-sls-chartreuse" />
      ) : (
        <XCircle className="h-5 w-5" />
      )}
      <span className="font-medium">
        {message || (isCorrect ? "Correct! Well done!" : "Not quite. Try again!")}
      </span>
    </div>
  );
}

// ============================================
// STAR RATING DISPLAY
// ============================================

interface StarRatingProps {
  stars: number;
  showAnimation?: boolean;
}

function StarRating({ stars, showAnimation }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((star) => (
        <Sparkles
          key={star}
          className={cn(
            "h-8 w-8 transition-all duration-300",
            star <= stars
              ? "text-sls-chartreuse fill-sls-chartreuse"
              : "text-sls-beige",
            showAnimation && star <= stars && "animate-bounce"
          )}
          style={{
            animationDelay: showAnimation ? `${star * 100}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// MAIN SENTENCE BUILDER COMPONENT
// ============================================

interface SentenceBuilderProps {
  config: SentenceBuilderConfig;
  instructions: string;
  hints: string[];
  onComplete: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
  onHintRequest?: () => void;
  highlightedBlockId?: string;
  currentItemIndex?: number;
  onItemIndexChange?: (index: number) => void;
  // Multiplayer sync props
  onBlocksChange?: (blockIds: string[]) => void;
  syncedBlockIds?: string[];
  isViewOnly?: boolean;
}

export function SentenceBuilder({
  config,
  instructions,
  hints,
  onComplete,
  onHintRequest,
  highlightedBlockId,
  currentItemIndex: externalItemIndex,
  onItemIndexChange,
  onBlocksChange,
  syncedBlockIds,
  isViewOnly,
}: SentenceBuilderProps) {
  // Determine if this is a multi-item config
  const items = useMemo(() => {
    console.log("[SentenceBuilder] Processing config:", {
      hasItems: Array.isArray(config.items),
      itemsLength: Array.isArray(config.items) ? config.items.length : 0,
      hasTargetSentence: !!config.targetSentence,
      hasAvailableBlocks: Array.isArray(config.availableBlocks),
      blocksCount: Array.isArray(config.availableBlocks) ? config.availableBlocks.length : 0,
    });

    if (Array.isArray(config.items) && config.items.length > 0) {
      console.log("[SentenceBuilder] Using multi-item format");
      return config.items;
    }
    // Convert legacy single-item config to items array format
    const legacyItem = {
      id: "legacy",
      targetSentence: config.targetSentence || "",
      availableBlocks: Array.isArray(config.availableBlocks) ? config.availableBlocks : [],
      distractorBlocks: Array.isArray(config.distractorBlocks) ? config.distractorBlocks : [],
      explanation: undefined,
    } as SentenceBuilderItem;
    console.log("[SentenceBuilder] Using legacy format, blocks:", legacyItem.availableBlocks?.length);
    return [legacyItem];
  }, [config]);

  const isMultiItem = items.length > 1;

  // Current item index (controlled or internal)
  const [internalItemIndex, setInternalItemIndex] = useState(0);
  const currentItemIndex = externalItemIndex !== undefined ? externalItemIndex : internalItemIndex;

  const setCurrentItemIndex = useCallback((index: number) => {
    if (onItemIndexChange) {
      onItemIndexChange(index);
    } else {
      setInternalItemIndex(index);
    }
  }, [onItemIndexChange]);

  // Get current item
  const currentItem = items[currentItemIndex] || items[0];

  // Build blocks for current item
  const availableBlocks = Array.isArray(currentItem.availableBlocks)
    ? currentItem.availableBlocks
    : [];
  const distractorBlocks = Array.isArray(currentItem.distractorBlocks)
    ? currentItem.distractorBlocks
    : [];
  const allBlocks = [...availableBlocks, ...distractorBlocks];

  // State - track which blocks have been used by their original ID
  const [usedBlockIds, setUsedBlockIds] = useState<Set<string>>(new Set());
  const [sentenceBlocks, setSentenceBlocks] = useState<Block[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());
  const [isItemComplete, setIsItemComplete] = useState(false);

  // Multi-item state
  const [completedItems, setCompletedItems] = useState<boolean[]>(
    new Array(items.length).fill(false)
  );
  const [itemAttempts, setItemAttempts] = useState<number[]>(
    new Array(items.length).fill(0)
  );

  // Reset state when item changes
  useEffect(() => {
    setUsedBlockIds(new Set());
    setSentenceBlocks([]);
    setIsCorrect(null);
    setShowHint(false);
    setIsItemComplete(completedItems[currentItemIndex] || false);
  }, [currentItemIndex, completedItems]);

  // Sync blocks from other players (multiplayer) - using ref to prevent loops
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (!syncedBlockIds || syncedBlockIds.length === 0) return;

    const syncedIdsStr = syncedBlockIds.join(",");

    // Skip if we already processed this sync
    if (lastSyncedRef.current === syncedIdsStr) return;
    lastSyncedRef.current = syncedIdsStr;

    // Build blocks from synced IDs
    const syncedBlocks: Block[] = [];
    const syncedIds = new Set<string>();

    for (const id of syncedBlockIds) {
      const block = allBlocks.find(b => b.id === id);
      if (block) {
        syncedBlocks.push(block);
        syncedIds.add(id);
      }
    }

    setSentenceBlocks(syncedBlocks);
    setUsedBlockIds(syncedIds);
  }, [syncedBlockIds, allBlocks]);

  // Add block to sentence
  const handleAddBlock = useCallback((block: Block) => {
    console.log("[SentenceBuilder] handleAddBlock:", {
      blockId: block.id,
      blockText: block.text,
      alreadyUsed: usedBlockIds.has(block.id),
      isItemComplete,
      isViewOnly,
    });

    if (usedBlockIds.has(block.id) || isItemComplete || isViewOnly) {
      console.log("[SentenceBuilder] Skipping - already used, item complete, or view only");
      return;
    }

    const newBlockIds = [...sentenceBlocks.map(b => b.id), block.id];

    setUsedBlockIds(prev => {
      const next = new Set(prev);
      next.add(block.id);
      return next;
    });
    setSentenceBlocks(prev => {
      const newBlocks = [...prev, block];
      console.log("[SentenceBuilder] Added block, sentence now:", newBlocks.map(b => b.text).join(" "));
      return newBlocks;
    });
    setIsCorrect(null); // Clear previous feedback

    // Notify parent for multiplayer sync
    onBlocksChange?.(newBlockIds);
  }, [usedBlockIds, isItemComplete, isViewOnly, sentenceBlocks, onBlocksChange]);

  // Remove block from sentence
  const handleRemoveBlock = useCallback((index: number) => {
    if (isItemComplete || isViewOnly) return;

    const blockToRemove = sentenceBlocks[index];
    if (blockToRemove) {
      const newBlocks = sentenceBlocks.filter((_, i) => i !== index);
      const newBlockIds = newBlocks.map(b => b.id);

      setUsedBlockIds(prev => {
        const next = new Set(prev);
        next.delete(blockToRemove.id);
        return next;
      });
      setSentenceBlocks(newBlocks);
      setIsCorrect(null);

      // Notify parent for multiplayer sync
      onBlocksChange?.(newBlockIds);
    }
  }, [sentenceBlocks, isItemComplete, isViewOnly, onBlocksChange]);

  // Check answer
  const handleCheckAnswer = useCallback(() => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setItemAttempts(prev => {
      const updated = [...prev];
      updated[currentItemIndex] = newAttempts;
      return updated;
    });

    // Build sentence from blocks
    const builtSentence = sentenceBlocks.map((b) => b.text).join(" ");
    const targetSentence = currentItem.targetSentence || "";

    // Normalize for comparison
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,!?]/g, "").trim();
    const correct = normalize(builtSentence) === normalize(targetSentence);

    setIsCorrect(correct);

    if (correct) {
      setIsItemComplete(true);

      // Mark item as completed
      setCompletedItems(prev => {
        const updated = [...prev];
        updated[currentItemIndex] = true;
        return updated;
      });

      // Check if all items are complete
      const allComplete = completedItems.every((c, i) => c || i === currentItemIndex);

      if (allComplete || !isMultiItem) {
        const timeSeconds = Math.round((Date.now() - startTime) / 1000);
        onComplete({
          isCorrect: true,
          attempts: itemAttempts.reduce((a, b) => a + b, 0) + newAttempts,
          hintsUsed,
          timeSeconds,
        });
      }
    }
  }, [sentenceBlocks, currentItem, startTime, attempts, hintsUsed, onComplete, currentItemIndex, completedItems, isMultiItem, itemAttempts]);

  // Request hint
  const handleRequestHint = useCallback(() => {
    if (currentHintIndex < hints.length) {
      setHintsUsed((prev) => prev + 1);
      setShowHint(true);
      setCurrentHintIndex((prev) => prev + 1);
      onHintRequest?.();
    }
  }, [currentHintIndex, hints.length, onHintRequest]);

  // Reset current item
  const handleReset = useCallback(() => {
    setUsedBlockIds(new Set());
    setSentenceBlocks([]);
    setIsCorrect(null);
    setShowHint(false);
  }, []);

  // Navigation
  const goToPrevItem = useCallback(() => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  }, [currentItemIndex, setCurrentItemIndex]);

  const goToNextItem = useCallback(() => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  }, [currentItemIndex, items.length, setCurrentItemIndex]);

  // Calculate stars for display
  const calculateStars = (): number => {
    const allComplete = completedItems.every(c => c);
    if (!allComplete && isMultiItem) return 0;
    if (!isItemComplete && !isMultiItem) return 0;

    const totalAttempts = itemAttempts.reduce((a, b) => a + b, 0);
    const avgAttempts = totalAttempts / items.length;

    if (avgAttempts <= 1 && hintsUsed === 0) return 3;
    if (avgAttempts <= 2 && hintsUsed <= 2) return 2;
    return 1;
  };

  const allItemsComplete = completedItems.every(c => c);

  // Group available blocks by category
  const groupedBlocks = allBlocks.reduce(
    (acc, block) => {
      if (!acc[block.category]) {
        acc[block.category] = [];
      }
      acc[block.category].push(block);
      return acc;
    },
    {} as Record<BlockCategory, Block[]>
  );

  const categoryLabels: Record<BlockCategory, string> = {
    subject: "Subjects",
    aux: "Auxiliaries",
    modal: "Modals",
    main: "Main Verbs",
    negation: "Negation",
    object: "Objects",
    time: "Time / Adverbials",
    connector: "Connectors",
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl">
      {/* Compact Header with Instructions */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-sm text-sls-olive">{instructions}</p>
          {showHint && currentHintIndex > 0 && (
            <div className="flex items-center gap-2 text-sls-orange text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>{hints[currentHintIndex - 1]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* LEFT: Word Bank */}
        <div className="w-1/2 flex flex-col min-h-0">
          <h3 className="flex-shrink-0 font-semibold text-sls-teal text-sm mb-2">Word Bank</h3>
          <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-3 overflow-y-auto">
            {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => (
              <div key={category} className="mb-3 last:mb-0">
                <div className="text-xs font-medium text-sls-olive/70 uppercase mb-2">
                  {categoryLabels[category as BlockCategory]}
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoryBlocks.map((block) => (
                    <WordBlock
                      key={block.id}
                      block={block}
                      onClick={() => handleAddBlock(block)}
                      disabled={usedBlockIds.has(block.id) || isItemComplete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Your Sentence */}
        <div className="w-1/2 flex flex-col min-h-0">
          <h3 className="flex-shrink-0 font-semibold text-sls-teal text-sm mb-2">Your Sentence</h3>
          <div
            className={cn(
              "flex-1 rounded-lg border-2 p-4 flex flex-col",
              "transition-all duration-200",
              sentenceBlocks.length === 0
                ? "border-dashed border-gray-300 bg-gray-50"
                : "border-solid border-sls-teal bg-sls-teal/5"
            )}
          >
            {sentenceBlocks.length === 0 ? (
              <p className="text-gray-400 text-center text-sm m-auto">
                Click words to build your sentence...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 content-start">
                {sentenceBlocks.map((block, index) => (
                  <WordBlock
                    key={`${block.id}-${index}`}
                    block={block}
                    onClick={() => handleRemoveBlock(index)}
                    showRemove={!isItemComplete}
                    disabled={isItemComplete}
                  />
                ))}
              </div>
            )}

            {/* Feedback inside the sentence box */}
            {isCorrect !== null && (
              <div className={cn(
                "mt-auto pt-3 border-t text-sm font-medium flex items-center gap-2",
                isCorrect ? "text-sls-chartreuse border-sls-chartreuse/30" : "text-sls-orange border-sls-orange/30"
              )}>
                {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {isCorrect ? "Correct!" : "Try again"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item completion message */}
      {isItemComplete && !allItemsComplete && isMultiItem && (
        <div className="flex-shrink-0 mx-4 mb-2 bg-sls-chartreuse/10 border border-sls-chartreuse rounded-lg p-3 text-center">
          <p className="text-sls-teal font-medium text-sm">
            Great job! {completedItems.filter(c => c).length} of {items.length} sentences completed.
          </p>
        </div>
      )}

      {/* All items complete */}
      {allItemsComplete && (
        <div className="flex-shrink-0 mx-4 mb-2 bg-sls-chartreuse/10 border border-sls-chartreuse rounded-lg p-4 text-center">
          <h3 className="text-lg font-bold text-sls-teal">Congratulations!</h3>
          <p className="text-sls-olive text-sm mt-1">
            {isMultiItem
              ? `You completed all ${items.length} sentences!`
              : `You built the sentence correctly in ${attempts} attempt${attempts !== 1 ? "s" : ""}!`}
          </p>
          <div className="flex justify-center mt-2">
            <StarRating stars={calculateStars()} showAnimation />
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          {/* Left: Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevItem}
              disabled={!isMultiItem || currentItemIndex === 0}
              className="border-gray-200 text-sls-olive hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {isMultiItem && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-sls-olive">
                  {currentItemIndex + 1} / {items.length}
                </span>
                <div className="flex gap-1">
                  {completedItems.map((completed, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentItemIndex(idx)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        idx === currentItemIndex
                          ? "bg-sls-teal"
                          : completed
                          ? "bg-sls-chartreuse"
                          : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextItem}
              disabled={!isMultiItem || currentItemIndex === items.length - 1}
              className="border-gray-200 text-sls-olive hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Center: Helper Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestHint}
              disabled={currentHintIndex >= hints.length || isItemComplete}
              className="text-sls-orange hover:bg-sls-orange/10"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Hint
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isItemComplete}
              className="text-sls-olive hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          {/* Right: Check Answer */}
          {!allItemsComplete ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={sentenceBlocks.length === 0 || isItemComplete}
              size="sm"
              className="bg-sls-teal hover:bg-sls-teal/90 text-white px-6"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Check
            </Button>
          ) : (
            <Button
              onClick={goToNextItem}
              disabled={currentItemIndex === items.length - 1}
              size="sm"
              className="bg-sls-teal hover:bg-sls-teal/90 text-white px-6"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SentenceBuilder;
