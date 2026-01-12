"use client";

import React, { useState, useMemo } from "react";
import { VocabGameData, VocabTerm } from "./types";
import { AudioButton } from "@/components/games/audio-button";
import { ChevronRight, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

interface QuizProps {
  gameData: VocabGameData;
}

interface QuizQuestion {
  term: VocabTerm;
  options: string[];
  correctAnswer: string;
}

const VocabularySuiteQuiz: React.FC<QuizProps> = ({ gameData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  // Generate quiz questions from terms
  const questions: QuizQuestion[] = useMemo(() => {
    return gameData.terms.map((term) => {
      // Get 3 wrong definitions from other terms
      const otherDefs = gameData.terms
        .filter((t) => t.id !== term.id)
        .map((t) => t.definition)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Combine with correct answer and shuffle
      const options = [...otherDefs, term.definition].sort(
        () => Math.random() - 0.5
      );

      return {
        term,
        options,
        correctAnswer: term.definition,
      };
    });
  }, [gameData.terms]);

  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setAnswers((prev) => [...prev, isCorrect]);
    setShowResult(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
  };

  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="p-8 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Vocabulary Quiz</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Reset quiz"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          {!isComplete && (
            <span className="text-sm text-slate-500 font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
          )}
        </div>
      </div>

      {isComplete ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-4 ${
              percentage >= 80
                ? "bg-emerald-100 text-emerald-600"
                : percentage >= 60
                ? "bg-yellow-100 text-yellow-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : "📚"}
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-2">
            Quiz Complete!
          </h3>
          <p className="text-5xl font-bold text-sls-teal mb-2">{percentage}%</p>
          <p className="text-slate-600 mb-8">
            You got {score} out of {questions.length} correct
          </p>

          {/* Answer summary */}
          <div className="flex gap-2 mb-8">
            {answers.map((correct, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  correct
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {correct ? "✓" : "✗"}
              </div>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="px-6 py-2 bg-sls-teal text-white rounded-lg font-bold hover:bg-sls-teal/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mb-8">
            <div
              className="bg-sls-teal h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(currentIndex / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question */}
          <div className="flex-1">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-widest text-slate-400 block mb-2">
                What is the definition of:
              </span>
              <div className="flex items-center justify-center gap-3">
                <h3 className="text-2xl font-bold text-slate-800">
                  {currentQuestion.term.term}
                </h3>
                <AudioButton text={currentQuestion.term.term} size="md" />
              </div>
              {currentQuestion.term.category && (
                <span className="mt-2 inline-block px-3 py-1 bg-sls-chartreuse/20 text-sls-olive rounded-full text-xs font-medium">
                  {currentQuestion.term.category}
                </span>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3 max-w-2xl mx-auto">
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                      showCorrect
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : showWrong
                        ? "bg-red-50 border-red-500 text-red-700"
                        : isSelected
                        ? "bg-sls-teal/10 border-sls-teal shadow-md"
                        : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        showCorrect
                          ? "bg-emerald-500 text-white"
                          : showWrong
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-sls-teal text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {showCorrect ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : showWrong ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl max-w-2xl mx-auto">
                <p className="text-sm text-slate-600">
                  {selectedAnswer === currentQuestion.correctAnswer ? (
                    <span className="text-emerald-600 font-medium">
                      Correct!{" "}
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      Not quite.{" "}
                    </span>
                  )}
                  {currentQuestion.term.example && (
                    <span>
                      Example: &ldquo;{currentQuestion.term.example}&rdquo;
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-8">
            {!showResult ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-sls-teal text-white font-medium hover:bg-sls-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-sls-teal text-white font-medium hover:bg-sls-teal/90 transition-colors"
              >
                {currentIndex < questions.length - 1
                  ? "Next Question"
                  : "See Results"}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VocabularySuiteQuiz;
