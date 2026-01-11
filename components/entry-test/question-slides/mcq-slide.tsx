"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MCQSlideProps {
  question: string;
  options: string[];
  context?: string;
  selectedAnswer: number | null;
  onAnswer: (index: number) => void;
  onSubmit: () => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctIndex?: number;
  isSubmitting?: boolean;
}

export function MCQSlide({
  question,
  options,
  context,
  selectedAnswer,
  onAnswer,
  onSubmit,
  showFeedback = false,
  isCorrect,
  correctIndex,
  isSubmitting = false,
}: MCQSlideProps) {
  return (
    <div className="h-full flex flex-col px-8 py-6">
      {/* Context if provided */}
      {context && (
        <p className="text-sm text-sls-olive/70 italic mb-4 text-center max-w-xl mx-auto">
          {context}
        </p>
      )}

      {/* Question */}
      <h2 className="text-xl md:text-2xl font-semibold text-sls-teal text-center mb-8 max-w-2xl mx-auto leading-relaxed">
        {question}
      </h2>

      {/* Options */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = showFeedback && idx === correctIndex;
            const isWrongSelected = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={idx}
                onClick={() => !showFeedback && onAnswer(idx)}
                disabled={showFeedback}
                className={cn(
                  "relative p-5 rounded-xl border-2 text-left transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  // Default state
                  !isSelected && !showFeedback && "border-gray-200 bg-white hover:border-sls-teal/50 hover:bg-sls-cream/30",
                  // Selected state (before submission)
                  isSelected && !showFeedback && "border-sls-teal bg-sls-teal/5",
                  // Correct state (after submission)
                  isCorrectOption && "border-sls-chartreuse bg-sls-chartreuse/10",
                  // Wrong selected state
                  isWrongSelected && "border-sls-orange bg-sls-orange/10",
                  // Disabled non-selected options after feedback
                  showFeedback && !isSelected && !isCorrectOption && "opacity-50"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Option letter */}
                  <span
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      !isSelected && !showFeedback && "bg-gray-100 text-gray-600",
                      isSelected && !showFeedback && "bg-sls-teal text-white",
                      isCorrectOption && "bg-sls-chartreuse text-white",
                      isWrongSelected && "bg-sls-orange text-white"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>

                  {/* Option text */}
                  <span className="flex-1 text-base md:text-lg text-sls-olive font-medium">
                    {option}
                  </span>

                  {/* Feedback icons */}
                  {isCorrectOption && (
                    <CheckCircle className="w-6 h-6 text-sls-chartreuse shrink-0" />
                  )}
                  {isWrongSelected && (
                    <XCircle className="w-6 h-6 text-sls-orange shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button */}
      {!showFeedback && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onSubmit}
            disabled={selectedAnswer === null || isSubmitting}
            size="lg"
            className="bg-sls-teal hover:bg-sls-teal/90 text-white px-8"
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </Button>
        </div>
      )}
    </div>
  );
}
