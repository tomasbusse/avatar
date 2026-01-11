"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lightbulb, RotateCcw, Sparkles, Eye } from "lucide-react";
import { CrosswordConfig, CrosswordWord, CrosswordCell } from "@/types/word-games";

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

interface CrosswordProps {
  config: CrosswordConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
  // Multiplayer sync props
  onGridChange?: (gridState: string) => void; // JSON stringified grid
  syncedGrid?: string; // JSON stringified grid from other players
  isViewOnly?: boolean;
}

// Compute grid from words if not provided
function computeGridFromWords(
  words: CrosswordWord[],
  rows: number,
  cols: number
): CrosswordCell[][] {
  const grid: CrosswordCell[][] = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => ({ letter: null, wordIds: [] }))
    );

  for (const word of words) {
    const letters = word.word.toUpperCase().split("");
    for (let i = 0; i < letters.length; i++) {
      const r = word.direction === "across" ? word.row : word.row + i;
      const c = word.direction === "across" ? word.col + i : word.col;

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c].letter = letters[i];
        if (!grid[r][c].wordIds.includes(word.id)) {
          grid[r][c].wordIds.push(word.id);
        }
        if (i === 0) {
          grid[r][c].number = word.number;
        }
      }
    }
  }

  return grid;
}

export function Crossword({
  config,
  instructions,
  hints = [],
  onComplete,
  onGridChange,
  syncedGrid,
  isViewOnly,
}: CrosswordProps) {
  // Compute grid if not provided
  const grid = useMemo(() => {
    if (config.grid && Array.isArray(config.grid) && config.grid.length > 0) {
      return config.grid;
    }
    // Compute from words
    const rows = config.rows || 10;
    const cols = config.cols || 10;
    return computeGridFromWords(config.words || [], rows, cols);
  }, [config.grid, config.words, config.rows, config.cols]);

  // Initialize user grid with empty strings for letter cells, null for blocked
  const initUserGrid = useCallback(() => {
    return grid.map(row =>
      row.map(cell => (cell.letter === null ? null : ""))
    );
  }, [grid]);

  const [userGrid, setUserGrid] = useState<(string | null)[][]>(initUserGrid);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<"across" | "down">("across");
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const lastSyncedRef = useRef<string>("");

  // Sync grid from other players (multiplayer)
  useEffect(() => {
    if (!syncedGrid) return;

    // Skip if we already processed this sync
    if (lastSyncedRef.current === syncedGrid) return;
    lastSyncedRef.current = syncedGrid;

    console.log("[Crossword] Received synced grid from other player");
    try {
      const parsedGrid = JSON.parse(syncedGrid) as (string | null)[][];
      setUserGrid(parsedGrid);
    } catch (e) {
      console.error("Failed to parse synced crossword grid:", e);
    }
  }, [syncedGrid]);

  // Get words array with fallback (memoized)
  const words = useMemo(() => config.words || [], [config.words]);

  // Get word by ID
  const getWord = useCallback((wordId: string): CrosswordWord | undefined => {
    return words.find(w => w.id === wordId);
  }, [words]);

  // Get words at a cell
  const getWordsAtCell = useCallback((row: number, col: number): CrosswordWord[] => {
    const cell = grid[row]?.[col];
    if (!cell || !cell.wordIds) return [];
    return cell.wordIds.map(id => getWord(id)).filter((w): w is CrosswordWord => !!w);
  }, [grid, getWord]);

  // Get cells for a word
  const getCellsForWord = useCallback((word: CrosswordWord): Array<{ row: number; col: number }> => {
    const cells: Array<{ row: number; col: number }> = [];
    for (let i = 0; i < word.word.length; i++) {
      if (word.direction === "across") {
        cells.push({ row: word.row, col: word.col + i });
      } else {
        cells.push({ row: word.row + i, col: word.col });
      }
    }
    return cells;
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    const cell = grid[row]?.[col];
    if (!cell || cell.letter === null) return;

    // If clicking same cell, toggle direction
    if (selectedCell?.row === row && selectedCell?.col === col) {
      const words = getWordsAtCell(row, col);
      if (words.length > 1) {
        const newDir = selectedDirection === "across" ? "down" : "across";
        setSelectedDirection(newDir);
        const newWord = words.find(w => w.direction === newDir);
        if (newWord) setSelectedWordId(newWord.id);
      }
    } else {
      setSelectedCell({ row, col });
      const words = getWordsAtCell(row, col);
      // Prefer word in current direction
      const word = words.find(w => w.direction === selectedDirection) || words[0];
      if (word) {
        setSelectedWordId(word.id);
        setSelectedDirection(word.direction);
      }
    }

    // Focus the input
    const key = `${row}-${col}`;
    inputRefs.current.get(key)?.focus();
  }, [grid, selectedCell, selectedDirection, getWordsAtCell]);

  // Handle key input
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    const cell = grid[row]?.[col];
    if (!cell || cell.letter === null) return;

    if (e.key === "Tab") {
      e.preventDefault();
      // Toggle direction
      const words = getWordsAtCell(row, col);
      if (words.length > 1) {
        const newDir = selectedDirection === "across" ? "down" : "across";
        setSelectedDirection(newDir);
        const newWord = words.find(w => w.direction === newDir);
        if (newWord) setSelectedWordId(newWord.id);
      }
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      let newRow = row;
      let newCol = col;
      if (e.key === "ArrowLeft") newCol--;
      if (e.key === "ArrowRight") newCol++;
      if (e.key === "ArrowUp") newRow--;
      if (e.key === "ArrowDown") newRow++;

      // Find next valid cell
      if (newRow >= 0 && newRow < config.rows && newCol >= 0 && newCol < config.cols) {
        const newCell = grid[newRow]?.[newCol];
        if (newCell && newCell.letter !== null) {
          handleCellClick(newRow, newCol);
        }
      }
      return;
    }

    // Block editing if view only
    if (isViewOnly) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      // Clear current cell and sync
      const newGrid = userGrid.map(r => [...r]);
      newGrid[row][col] = "";
      setUserGrid(newGrid);
      // Notify parent for real-time multiplayer sync
      onGridChange?.(JSON.stringify(newGrid));

      // Move back in current direction
      if (selectedWordId) {
        const word = getWord(selectedWordId);
        if (word) {
          const cells = getCellsForWord(word);
          const idx = cells.findIndex(c => c.row === row && c.col === col);
          if (idx > 0) {
            const prevCell = cells[idx - 1];
            handleCellClick(prevCell.row, prevCell.col);
          }
        }
      }
      return;
    }

    // Letter input
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      // Update grid and sync
      const newGrid = userGrid.map(r => [...r]);
      newGrid[row][col] = letter;
      setUserGrid(newGrid);
      // Notify parent for real-time multiplayer sync
      console.log("[Crossword] Syncing grid change:", { row, col, letter, hasCallback: !!onGridChange });
      onGridChange?.(JSON.stringify(newGrid));

      setWrongCells(prev => {
        const next = new Set(prev);
        next.delete(`${row}-${col}`);
        return next;
      });

      // Move to next cell in current word
      if (selectedWordId) {
        const word = getWord(selectedWordId);
        if (word) {
          const cells = getCellsForWord(word);
          const idx = cells.findIndex(c => c.row === row && c.col === col);
          if (idx < cells.length - 1) {
            const nextCell = cells[idx + 1];
            handleCellClick(nextCell.row, nextCell.col);
          }
        }
      }
    }
  }, [grid, config.rows, config.cols, selectedDirection, selectedWordId, getWord, getCellsForWord, getWordsAtCell, handleCellClick, isViewOnly, onGridChange, userGrid]);

  // Check answers
  const handleCheck = useCallback(() => {
    setAttempts(prev => prev + 1);
    const wrong = new Set<string>();
    let allCorrect = true;

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const cell = grid[row]?.[col];
        if (cell && cell.letter !== null) {
          const userLetter = userGrid[row]?.[col];
          if (userLetter !== cell.letter) {
            wrong.add(`${row}-${col}`);
            allCorrect = false;
          }
        }
      }
    }

    setWrongCells(wrong);

    if (allCorrect) {
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
  }, [grid, config.rows, userGrid, attempts, hintsUsed, startTime, onComplete]);

  // Reveal selected word
  const handleReveal = useCallback(() => {
    if (!selectedWordId) return;
    const word = getWord(selectedWordId);
    if (!word) return;

    setHintsUsed(prev => prev + 1);
    const cells = getCellsForWord(word);

    setUserGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      cells.forEach((cell, i) => {
        newGrid[cell.row][cell.col] = word.word[i];
      });
      return newGrid;
    });

    setRevealedCells(prev => {
      const next = new Set(prev);
      cells.forEach(cell => next.add(`${cell.row}-${cell.col}`));
      return next;
    });
  }, [selectedWordId, getWord, getCellsForWord]);

  // Reset
  const handleReset = useCallback(() => {
    setUserGrid(initUserGrid());
    setSelectedCell(null);
    setSelectedWordId(null);
    setWrongCells(new Set());
    setRevealedCells(new Set());
    setIsComplete(false);
  }, [initUserGrid]);

  // Check if cell is in selected word
  const isCellInSelectedWord = useCallback((row: number, col: number): boolean => {
    if (!selectedWordId) return false;
    const word = getWord(selectedWordId);
    if (!word) return false;
    const cells = getCellsForWord(word);
    return cells.some(c => c.row === row && c.col === col);
  }, [selectedWordId, getWord, getCellsForWord]);

  // Separate words into Across and Down
  const acrossWords = words.filter(w => w.direction === "across").sort((a, b) => a.number - b.number);
  const downWords = words.filter(w => w.direction === "down").sort((a, b) => a.number - b.number);

  // Calculate cell size based on grid dimensions
  const cellSize = Math.min(36, Math.floor(280 / Math.max(config.rows, config.cols)));

  return (
    <div className="h-full flex flex-col bg-white px-16 py-4 relative">
      {/* Celebration confetti overlay */}
      <CelebrationOverlay show={isComplete} />

      {/* Instructions */}
      {instructions && !isComplete && (
        <p className="text-center text-sm text-sls-olive/70 mb-3">
          {instructions}
        </p>
      )}

      {/* Celebration screen */}
      {isComplete ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="relative">
            <Sparkles className="w-12 h-12 text-sls-chartreuse animate-pulse" />
            <CheckCircle className="w-6 h-6 text-sls-teal absolute -bottom-1 -right-1" />
          </div>
          <h3 className="text-2xl font-bold text-sls-teal mt-4">Puzzle Complete!</h3>
          <p className="text-sls-olive mt-2">
            You solved the crossword with {words.length} words
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="bg-sls-cream rounded-lg px-3 py-2">
              <span className="text-sls-olive">Checks:</span>
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
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Grid */}
          <div className="flex-shrink-0 flex items-start justify-center">
            <div
              className="grid gap-0 border-2 border-sls-teal rounded-md overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${config.rows}, ${cellSize}px)`,
              }}
            >
              {grid.map((row, rowIdx) =>
                row.map((cell, colIdx) => {
                  const key = `${rowIdx}-${colIdx}`;
                  const isBlocked = cell.letter === null;
                  const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                  const isInWord = isCellInSelectedWord(rowIdx, colIdx);
                  const isWrong = wrongCells.has(key);
                  const isRevealed = revealedCells.has(key);
                  const userLetter = userGrid[rowIdx]?.[colIdx];

                  return (
                    <div
                      key={key}
                      className={cn(
                        "relative border border-gray-200 flex items-center justify-center",
                        isBlocked ? "bg-sls-teal" : "bg-white cursor-pointer",
                        isSelected && !isBlocked && "bg-sls-chartreuse/30",
                        isInWord && !isSelected && !isBlocked && "bg-sls-cream",
                        isWrong && "bg-sls-orange/20",
                        isRevealed && "bg-sls-teal/10"
                      )}
                      style={{ width: cellSize, height: cellSize }}
                      onClick={() => !isBlocked && handleCellClick(rowIdx, colIdx)}
                    >
                      {/* Clue number */}
                      {cell.number && (
                        <span className="absolute top-0 left-0.5 text-[8px] font-bold text-sls-olive">
                          {cell.number}
                        </span>
                      )}
                      {/* Input */}
                      {!isBlocked && (
                        <input
                          ref={el => {
                            if (el) inputRefs.current.set(key, el);
                          }}
                          type="text"
                          maxLength={1}
                          value={userLetter || ""}
                          onChange={() => {}}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                          className={cn(
                            "w-full h-full text-center font-bold bg-transparent outline-none uppercase",
                            cellSize < 30 ? "text-sm" : "text-lg",
                            isRevealed ? "text-sls-teal" : "text-sls-olive"
                          )}
                          style={{ caretColor: "transparent" }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clues */}
          <div className="flex-1 min-w-0 overflow-auto">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Across */}
              <div>
                <h4 className="font-bold text-sls-teal mb-2">Across</h4>
                <div className="space-y-1">
                  {acrossWords.map(word => (
                    <button
                      key={word.id}
                      onClick={() => {
                        setSelectedWordId(word.id);
                        setSelectedDirection("across");
                        setSelectedCell({ row: word.row, col: word.col });
                        const key = `${word.row}-${word.col}`;
                        inputRefs.current.get(key)?.focus();
                      }}
                      className={cn(
                        "block w-full text-left p-1.5 rounded transition-colors",
                        selectedWordId === word.id
                          ? "bg-sls-chartreuse/20 text-sls-teal"
                          : "hover:bg-sls-cream text-sls-olive"
                      )}
                    >
                      <span className="font-medium">{word.number}.</span> {word.clue}
                    </button>
                  ))}
                </div>
              </div>

              {/* Down */}
              <div>
                <h4 className="font-bold text-sls-teal mb-2">Down</h4>
                <div className="space-y-1">
                  {downWords.map(word => (
                    <button
                      key={word.id}
                      onClick={() => {
                        setSelectedWordId(word.id);
                        setSelectedDirection("down");
                        setSelectedCell({ row: word.row, col: word.col });
                        const key = `${word.row}-${word.col}`;
                        inputRefs.current.get(key)?.focus();
                      }}
                      className={cn(
                        "block w-full text-left p-1.5 rounded transition-colors",
                        selectedWordId === word.id
                          ? "bg-sls-chartreuse/20 text-sls-teal"
                          : "hover:bg-sls-cream text-sls-olive"
                      )}
                    >
                      <span className="font-medium">{word.number}.</span> {word.clue}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions - bottom fixed */}
      {!isComplete && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReveal}
            disabled={!selectedWordId}
            className="border-sls-olive/30 text-sls-olive hover:bg-sls-olive/10"
          >
            <Eye className="w-4 h-4 mr-1" />
            Reveal Word
          </Button>
          <Button
            size="sm"
            onClick={handleCheck}
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
