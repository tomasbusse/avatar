"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FillBlankSlideProps {
  sentence: string;
  hint?: string;
  answer: string;
  onAnswer: (value: string) => void;
  onSubmit: () => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  isSubmitting?: boolean;
}

export function FillBlankSlide({
  sentence,
  hint,
  answer,
  onAnswer,
  onSubmit,
  showFeedback = false,
  isCorrect,
  correctAnswer,
  isSubmitting = false,
}: FillBlankSlideProps) {
  // Parse sentence and replace blank markers with input
  const renderSentenceWithInput = () => {
    const parts = sentence.split(/(___|{{blank}}|\[.*?\])/g);

    return (
      <span className="text-xl md:text-2xl leading-relaxed">
        {parts.map((part, idx) => {
          if (part === "___" || part === "{{blank}}" || part.match(/^\[.*\]$/)) {
            return (
              <span key={idx} className="inline-block mx-2 align-middle">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => onAnswer(e.target.value)}
                  disabled={showFeedback}
                  placeholder="..."
                  className={cn(
                    "w-40 md:w-48 px-4 py-2 text-center text-lg font-medium border-b-2 bg-transparent outline-none transition-colors",
                    !showFeedback && "border-sls-teal focus:border-sls-chartreuse",
                    showFeedback && isCorrect && "border-sls-chartreuse text-sls-teal",
                    showFeedback && !isCorrect && "border-sls-orange text-sls-orange"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && answer.trim() && !showFeedback) {
                      onSubmit();
                    }
                  }}
                />
              </span>
            );
          }
          return <span key={idx} className="text-sls-olive">{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col px-8 py-6">
      {/* Instruction */}
      <p className="text-sm text-sls-olive/60 text-center mb-6 uppercase tracking-wide">
        Complete the sentence
      </p>

      {/* Sentence with blank */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 max-w-3xl w-full border border-gray-100">
          <p className="text-center">{renderSentenceWithInput()}</p>
        </div>

        {/* Hint */}
        {hint && !showFeedback && (
          <p className="mt-4 text-sm text-sls-olive/60 italic">
            Hint: {hint}
          </p>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div
            className={cn(
              "mt-6 px-6 py-3 rounded-xl",
              isCorrect ? "bg-sls-chartreuse/10 text-sls-teal" : "bg-sls-orange/10 text-sls-orange"
            )}
          >
            {isCorrect ? (
              <p className="font-medium">Correct!</p>
            ) : (
              <p className="font-medium">
                The correct answer is: <span className="font-bold">{correctAnswer}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Submit button */}
      {!showFeedback && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onSubmit}
            disabled={!answer.trim() || isSubmitting}
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
