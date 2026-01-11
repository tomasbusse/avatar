"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Pause, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TestAvatar } from "./test-avatar";
import {
  MCQSlide,
  FillBlankSlide,
  WritingSlide,
  ListeningSlide,
  SpeakingSlide,
  ReadingSlide,
} from "./question-slides";

// ============================================
// TYPES
// ============================================

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type QuestionType =
  | "reading_comprehension"
  | "grammar_mcq"
  | "grammar_fill_blank"
  | "vocabulary_mcq"
  | "vocabulary_matching"
  | "listening_mcq"
  | "listening_fill_blank"
  | "writing_prompt"
  | "speaking_prompt";

interface QuestionInstance {
  instanceId: string;
  type: QuestionType;
  cefrLevel: CEFRLevel;
  content: Record<string, unknown>;
  sectionId: string;
  orderInSection: number;
}

interface AvatarConfig {
  name: string;
  avatarImage: string;
}

interface TestSlideViewerProps {
  templateTitle: string;
  currentQuestion: QuestionInstance | null;
  currentSectionTitle: string;
  totalQuestions: number;
  answeredQuestions: number;
  avatar?: AvatarConfig;
  onSubmitAnswer: (answer: unknown) => Promise<void>;
  onPause: () => void;
  isLastQuestion: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TestSlideViewer({
  templateTitle,
  currentQuestion,
  currentSectionTitle,
  totalQuestions,
  answeredQuestions,
  avatar,
  onSubmitAnswer,
  onPause,
  isLastQuestion,
}: TestSlideViewerProps) {
  // State
  const [currentAnswer, setCurrentAnswer] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [avatarExpression, setAvatarExpression] = useState<"neutral" | "encouraging" | "celebrating" | "thinking">("neutral");

  // For reading comprehension
  const [readingSubIndex, setReadingSubIndex] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>({});

  // For matching
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});

  // Progress
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Reset state when question changes
  useEffect(() => {
    setCurrentAnswer(null);
    setShowFeedback(false);
    setReadingSubIndex(0);
    setReadingAnswers({});
    setMatchingAnswers({});
    setAvatarExpression("neutral");
  }, [currentQuestion?.instanceId]);

  // Handle answer submission
  const handleSubmit = async () => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    setAvatarExpression("thinking");

    try {
      let answerToSubmit = currentAnswer;

      // Handle special question types
      if (currentQuestion.type === "reading_comprehension") {
        answerToSubmit = readingAnswers;
      } else if (currentQuestion.type === "vocabulary_matching") {
        answerToSubmit = matchingAnswers;
      }

      await onSubmitAnswer(answerToSubmit);
      setAvatarExpression("celebrating");
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the appropriate slide based on question type
  const renderQuestionSlide = () => {
    if (!currentQuestion) {
      return (
        <div className="h-full flex items-center justify-center text-sls-olive/60">
          Loading question...
        </div>
      );
    }

    const { type, content } = currentQuestion;

    switch (type) {
      case "grammar_mcq":
      case "vocabulary_mcq":
        return (
          <MCQSlide
            question={(content.question as string) || (content.sentence as string) || ""}
            options={(content.options as string[]) || []}
            context={content.context as string}
            selectedAnswer={currentAnswer as number | null}
            onAnswer={setCurrentAnswer}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );

      case "grammar_fill_blank":
        return (
          <FillBlankSlide
            sentence={(content.sentence as string) || (content.displayText as string) || ""}
            hint={content.hint as string}
            answer={(currentAnswer as string) || ""}
            onAnswer={setCurrentAnswer}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );

      case "listening_mcq":
        return (
          <ListeningSlide
            audioText={content.audioText as string}
            audioContext={content.audioContext as string}
            onReplayUsed={() => {}}
          >
            <MCQSlide
              question={(content.question as string) || ""}
              options={(content.options as string[]) || []}
              selectedAnswer={currentAnswer as number | null}
              onAnswer={setCurrentAnswer}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </ListeningSlide>
        );

      case "listening_fill_blank":
        return (
          <ListeningSlide
            audioText={content.audioText as string}
            audioContext={content.audioContext as string}
            onReplayUsed={() => {}}
          >
            <FillBlankSlide
              sentence={(content.sentence as string) || (content.displayText as string) || ""}
              hint={content.hint as string}
              answer={(currentAnswer as string) || ""}
              onAnswer={setCurrentAnswer}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </ListeningSlide>
        );

      case "reading_comprehension":
        const questions = (content.questions as Array<{
          question: string;
          options: string[];
          correctAnswer: number;
        }>) || [];
        return (
          <ReadingSlide
            passage={content.passage as string}
            questions={questions}
            currentQuestionIndex={readingSubIndex}
            answers={readingAnswers}
            onAnswer={(qIdx, aIdx) => setReadingAnswers(prev => ({ ...prev, [qIdx]: aIdx }))}
            onPrevQuestion={() => setReadingSubIndex(prev => Math.max(0, prev - 1))}
            onNextQuestion={() => setReadingSubIndex(prev => Math.min(questions.length - 1, prev + 1))}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );

      case "writing_prompt":
        return (
          <WritingSlide
            prompt={content.prompt as string}
            requirements={content.requirements as string[]}
            wordCount={content.wordCount as { min: number; max: number }}
            answer={(currentAnswer as string) || ""}
            onAnswer={setCurrentAnswer}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );

      case "speaking_prompt":
        return (
          <SpeakingSlide
            prompt={content.prompt as string}
            followUpQuestions={content.followUpQuestions as string[]}
            duration={content.duration as { min: number; max: number }}
            onTranscript={(transcript) => setCurrentAnswer({ transcript })}
            onSubmit={handleSubmit}
            hasRecording={!!(currentAnswer as { transcript?: string })?.transcript}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return (
          <div className="h-full flex items-center justify-center text-sls-olive/60">
            Question type not supported: {type}
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-white to-sls-cream/30">
      {/* Header - minimal and clean */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title and section */}
            <div>
              <h1 className="text-lg font-semibold text-sls-teal">{templateTitle}</h1>
              <p className="text-sm text-sls-olive/60">{currentSectionTitle}</p>
            </div>

            {/* Center: Progress */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-sls-olive/60">
                <Target className="w-4 h-4" />
                <span>{answeredQuestions} / {totalQuestions}</span>
              </div>
              <div className="w-40">
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>

            {/* Right: Level badge and pause */}
            <div className="flex items-center gap-3">
              {currentQuestion && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-sls-teal/10 text-sls-teal">
                  {currentQuestion.cefrLevel}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={onPause}>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            </div>
          </div>

          {/* Mobile progress */}
          <div className="md:hidden mt-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-sls-olive/60">
                {answeredQuestions} of {totalQuestions} questions
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Question slide area */}
        <div className="flex-1 flex flex-col">
          {renderQuestionSlide()}
        </div>

        {/* Avatar sidebar - only on larger screens */}
        {avatar && (
          <aside className="hidden lg:flex w-48 flex-col items-center justify-center border-l border-gray-100 bg-white/50 px-4">
            <TestAvatar
              avatarImage={avatar.avatarImage}
              name={avatar.name}
              expression={avatarExpression}
              isThinking={isSubmitting}
            />

            {/* Encouragement text */}
            <p className="mt-4 text-center text-sm text-sls-olive/60">
              {isSubmitting
                ? "Checking your answer..."
                : avatarExpression === "celebrating"
                ? "Great job!"
                : "Take your time"}
            </p>
          </aside>
        )}
      </main>

      {/* Footer with next button indicator */}
      <footer className="flex-shrink-0 px-6 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-sls-olive/40">
            {isLastQuestion ? "This is the last question" : ""}
          </span>

          <div className="text-sm text-sls-olive/60 flex items-center gap-1">
            Press <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to submit
          </div>
        </div>
      </footer>
    </div>
  );
}
