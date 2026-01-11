"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Lightbulb, RotateCcw, Sparkles } from "lucide-react";

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

// Item structure from AI generation
interface FillInBlankItem {
  id: string;
  sentence: string;
  correctAnswer: string;
  options: string[];
  explanation?: string;
  blankIndex?: number;
}

export interface FillInBlankConfig {
  type: "fill_in_blank";
  items: FillInBlankItem[];
}

interface FillInBlankProps {
  config: FillInBlankConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
}

export function FillInBlank({
  config,
  instructions,
  hints = [],
  onComplete,
}: FillInBlankProps) {
  // Get the single item (game-viewer extracts one item at a time)
  const item = config.items?.[0];

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  // Safety check
  if (!item) {
    return (
      <div className="flex items-center justify-center h-64 text-sls-orange">
        No fill-in-blank item configured
      </div>
    );
  }

  // Parse sentence - replace ___ or {{blank}} with marker
  const renderSentence = () => {
    const parts = item.sentence.split(/(___|{{blank}})/g);
    return parts.map((part, idx) => {
      if (part === "___" || part === "{{blank}}") {
        return (
          <span
            key={idx}
            className={cn(
              "inline-block min-w-[120px] mx-1 px-3 py-1 rounded-md border-2 border-dashed text-center font-medium transition-all",
              selectedAnswer
                ? showResult
                  ? isCorrect
                    ? "bg-sls-chartreuse/20 border-sls-chartreuse text-sls-teal"
                    : "bg-sls-orange/20 border-sls-orange text-sls-orange"
                  : "bg-sls-teal/10 border-sls-teal text-sls-teal"
                : "bg-gray-100 border-gray-300 text-gray-400"
            )}
          >
            {selectedAnswer || "?"}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const handleOptionClick = (option: string) => {
    if (showResult && isCorrect) return;
    setSelectedAnswer(option);
    setShowResult(false);
  };

  const handleCheck = () => {
    if (!selectedAnswer) return;

    setAttempts(prev => prev + 1);
    const correct = selectedAnswer.toLowerCase().trim() === item.correctAnswer.toLowerCase().trim();
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
    } else if (item.explanation && !currentHint) {
      // Use explanation as a hint
      setCurrentHint("Think about: " + item.explanation.split(".")[0] + ".");
      setHintsUsed(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
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
          <h3 className="text-2xl font-bold text-sls-teal mt-4">Correct!</h3>
          <p className="text-sls-olive mt-2">
            The answer is <span className="font-bold text-sls-teal">{item.correctAnswer}</span>
          </p>
          {item.explanation && (
            <p className="text-sm text-sls-olive/70 mt-3 max-w-md">
              {item.explanation}
            </p>
          )}
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
            Try Again
          </Button>
        </div>
      ) : (
        /* Main game area */
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="text-center mb-4">
            <span className="text-xs uppercase tracking-wider text-sls-olive/60">
              Choose the correct word
            </span>
          </div>

          {/* Sentence with blank */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <p className="text-xl leading-relaxed text-center text-sls-teal">
              {renderSentence()}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {item.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(option)}
                disabled={showResult && isCorrect}
                className={cn(
                  "p-4 rounded-lg border-2 text-left font-medium transition-all",
                  selectedAnswer === option
                    ? showResult
                      ? isCorrect
                        ? "bg-sls-chartreuse/20 border-sls-chartreuse text-sls-teal"
                        : "bg-sls-orange/20 border-sls-orange text-sls-orange animate-shake"
                      : "bg-sls-teal/10 border-sls-teal text-sls-teal"
                    : "bg-white border-gray-200 hover:border-sls-chartreuse hover:bg-sls-cream/50 text-sls-olive"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Hint display */}
          {currentHint && (
            <div className="mt-2 bg-sls-chartreuse/10 border border-sls-chartreuse/30 rounded-lg p-3 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-sls-chartreuse flex-shrink-0 mt-0.5" />
              <p className="text-sm text-sls-olive">{currentHint}</p>
            </div>
          )}

          {/* Wrong answer feedback */}
          {showResult && !isCorrect && (
            <div className="mt-2 bg-sls-orange/10 border border-sls-orange/30 rounded-lg p-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-sls-orange flex-shrink-0" />
              <p className="text-sm text-sls-olive">Not quite right. Try another option!</p>
            </div>
          )}
        </div>
      )}

      {/* Actions - bottom fixed */}
      {(!isCorrect || !showResult) && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleHint}
            disabled={hintsUsed >= hints.length && !!currentHint}
            className="border-sls-chartreuse/50 text-sls-chartreuse hover:bg-sls-chartreuse/10"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Hint
          </Button>
          <Button
            size="sm"
            onClick={handleCheck}
            disabled={!selectedAnswer}
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
