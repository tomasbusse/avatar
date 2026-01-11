"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadingSlideProps {
  passage: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  currentQuestionIndex: number;
  answers: Record<number, number>;
  onAnswer: (questionIndex: number, answerIndex: number) => void;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onSubmit: () => void;
  showFeedback?: boolean;
  isSubmitting?: boolean;
}

export function ReadingSlide({
  passage,
  questions,
  currentQuestionIndex,
  answers,
  onAnswer,
  onPrevQuestion,
  onNextQuestion,
  onSubmit,
  showFeedback = false,
  isSubmitting = false,
}: ReadingSlideProps) {
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestionIndex];
  const allQuestionsAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 px-6 py-4">
      {/* Passage panel */}
      <div className="md:w-1/2 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-sls-teal" />
          <span className="text-sm font-medium text-sls-olive">Reading Passage</span>
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl p-5 border border-gray-100 overflow-y-auto max-h-[40vh] md:max-h-none">
          <p className="text-base text-sls-olive leading-relaxed whitespace-pre-wrap">
            {passage}
          </p>
        </div>
      </div>

      {/* Questions panel */}
      <div className="md:w-1/2 flex flex-col">
        {/* Question progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-sls-olive/60">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx === currentQuestionIndex && "bg-sls-teal",
                  idx !== currentQuestionIndex && answers[idx] !== undefined && "bg-sls-chartreuse",
                  idx !== currentQuestionIndex && answers[idx] === undefined && "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <h3 className="text-lg font-semibold text-sls-teal mb-4">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="flex-1 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = showFeedback && idx === currentQuestion.correctAnswer;
            const isWrongSelected = showFeedback && isSelected && idx !== currentQuestion.correctAnswer;

            return (
              <button
                key={idx}
                onClick={() => !showFeedback && onAnswer(currentQuestionIndex, idx)}
                disabled={showFeedback}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3",
                  // Default state
                  !isSelected && !showFeedback && "border-gray-200 bg-white hover:border-sls-teal/50",
                  // Selected state
                  isSelected && !showFeedback && "border-sls-teal bg-sls-teal/5",
                  // Correct state
                  isCorrectOption && "border-sls-chartreuse bg-sls-chartreuse/10",
                  // Wrong state
                  isWrongSelected && "border-sls-orange bg-sls-orange/10"
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    !isSelected && !showFeedback && "bg-gray-100 text-gray-600",
                    isSelected && !showFeedback && "bg-sls-teal text-white",
                    isCorrectOption && "bg-sls-chartreuse text-white",
                    isWrongSelected && "bg-sls-orange text-white"
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 text-sls-olive">{option}</span>
                {isCorrectOption && <CheckCircle className="w-5 h-5 text-sls-chartreuse" />}
                {isWrongSelected && <XCircle className="w-5 h-5 text-sls-orange" />}
              </button>
            );
          })}
        </div>

        {/* Navigation and submit */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="border-gray-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              size="sm"
              onClick={onNextQuestion}
              disabled={selectedAnswer === undefined}
              className="bg-sls-teal hover:bg-sls-teal/90"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={!allQuestionsAnswered || isSubmitting}
              className="bg-sls-teal hover:bg-sls-teal/90"
            >
              {isSubmitting ? "Submitting..." : "Submit All Answers"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
