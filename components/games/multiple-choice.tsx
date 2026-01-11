"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Lightbulb, RotateCcw, ChevronRight } from "lucide-react";

export interface MultipleChoiceConfig {
  type: "multiple_choice";
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
}

interface MultipleChoiceProps {
  config: MultipleChoiceConfig;
  instructions?: string;
  hints?: string[];
  onComplete?: (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
  }) => void;
}

export function MultipleChoice({
  config,
  instructions,
  hints = [],
  onComplete,
}: MultipleChoiceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const question = config.questions[currentQuestion];

  const handleOptionClick = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
  };

  const handleCheck = () => {
    if (selectedOption === null) return;
    setAttempts(prev => prev + 1);

    const correct = selectedOption === question.correctIndex;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < config.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      setIsCorrect(false);
      setCurrentHint(null);
    } else {
      // Quiz complete
      setIsComplete(true);
      if (onComplete) {
        onComplete({
          isCorrect: score + (isCorrect ? 1 : 0) === config.questions.length,
          attempts,
          hintsUsed,
          timeSeconds: Math.round((Date.now() - startTime) / 1000),
        });
      }
    }
  };

  const handleHint = () => {
    if (hintsUsed < hints.length) {
      setCurrentHint(hints[hintsUsed]);
      setHintsUsed(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setIsComplete(false);
    setCurrentHint(null);
  };

  if (isComplete) {
    const finalScore = score;
    const total = config.questions.length;
    const percentage = Math.round((finalScore / total) * 100);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
          <div className="text-6xl mb-4">
            {percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : "💪"}
          </div>
          <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
          <p className="text-4xl font-bold text-primary mb-2">
            {finalScore} / {total}
          </p>
          <p className="text-muted-foreground">
            {percentage >= 80
              ? "Excellent work!"
              : percentage >= 60
              ? "Good job! Keep practicing."
              : "Keep learning, you'll get better!"}
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Question {currentQuestion + 1} of {config.questions.length}
        </span>
        <span className="font-medium text-primary">Score: {score}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / config.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-medium mb-6">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3",
                selectedOption === idx && !showResult && "bg-blue-50 border-blue-500",
                showResult && idx === question.correctIndex && "bg-green-100 border-green-500",
                showResult && selectedOption === idx && idx !== question.correctIndex && "bg-red-100 border-red-500",
                !showResult && selectedOption !== idx && "hover:bg-gray-50 border-gray-200"
              )}
            >
              <span
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  selectedOption === idx
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
              {showResult && idx === question.correctIndex && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {showResult && selectedOption === idx && idx !== question.correctIndex && (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation */}
      {showResult && question.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Explanation:</strong> {question.explanation}
          </p>
        </div>
      )}

      {/* Hint */}
      {currentHint && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800">{currentHint}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3">
        {!showResult ? (
          <>
            <Button
              variant="outline"
              onClick={handleHint}
              disabled={hintsUsed >= hints.length}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Hint ({hints.length - hintsUsed} left)
            </Button>
            <Button onClick={handleCheck} disabled={selectedOption === null}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Check Answer
            </Button>
          </>
        ) : (
          <Button onClick={handleNext}>
            {currentQuestion < config.questions.length - 1 ? (
              <>
                Next Question
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              "See Results"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
