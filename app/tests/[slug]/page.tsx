"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Mail,
  User,
  Building2,
  Trophy,
  Target,
  Clock,
  BarChart3,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  calculateCEFRLevel,
  type Question,
  type CEFRLevel,
  type PlacementTestData,
} from "@/app/tests/lavera/test-data";

// ============================================
// TYPES
// ============================================

type TestPhase = "loading" | "not-found" | "registration" | "test" | "calculating" | "results";

interface UserInfo {
  name: string;
  email: string;
  company: string;
}

interface TestState {
  currentQuestionIndex: number;
  answers: Record<string, number | string | Record<number, number>>;
  startTime: number;
  questionStartTimes: Record<string, number>;
}

interface TestConfig {
  title: string;
  slug: string;
  companyName?: string;
  companyLogo?: string;
  config: PlacementTestData;
  resultEmails?: {
    sendToCandidate: boolean;
    hrEmails?: string[];
  };
}

// ============================================
// LOADING SCREEN
// ============================================

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-gray-50/30 to-stone-50/20">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#5D8C3D] animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading test...</p>
      </div>
    </div>
  );
}

// ============================================
// NOT FOUND SCREEN
// ============================================

function NotFoundScreen({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-gray-50/30 to-slate-50/20">
      <div className="text-center max-w-md">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Not Found</h1>
        <p className="text-gray-600 mb-4">
          The test &quot;{slug}&quot; could not be found or is not currently available.
        </p>
        <p className="text-sm text-gray-500">
          Please check the URL or contact your administrator.
        </p>
      </div>
    </div>
  );
}

// ============================================
// REGISTRATION SCREEN
// ============================================

function RegistrationScreen({
  onSubmit,
  testConfig,
}: {
  onSubmit: (info: UserInfo) => void;
  testConfig: TestConfig;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; company?: string }>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; company?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Please enter your full name";
    }
    if (!email.trim()) {
      newErrors.email = "Please enter your email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!company.trim()) {
      newErrors.company = "Please enter your company name";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ name: name.trim(), email: email.trim(), company: company.trim() });
  };

  const testData = testConfig.config;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-gray-50/30 to-stone-50/20">
      <div
        className={cn(
          "w-full max-w-lg transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#5D8C3D]/10 text-[#5D8C3D]">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Cambridge English Assessment</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {testConfig.title}
          </h1>
          <p className="text-gray-600">
            Discover your English level with our Cambridge-style assessment
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Test Info */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#5D8C3D]/10 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-[#5D8C3D]" />
              </div>
              <p className="text-sm font-medium text-gray-900">{testData.totalQuestions}</p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#5D8C3D]/10 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-[#5D8C3D]" />
              </div>
              <p className="text-sm font-medium text-gray-900">~30 min</p>
              <p className="text-xs text-gray-500">Duration</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#5D8C3D]/10 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-5 h-5 text-[#5D8C3D]" />
              </div>
              <p className="text-sm font-medium text-gray-900">A1-C1</p>
              <p className="text-xs text-gray-500">Levels</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Enter your full name"
                  className={cn(
                    "pl-10",
                    errors.name && "border-red-500 focus:ring-red-500"
                  )}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Enter your email address"
                  className={cn(
                    "pl-10",
                    errors.email && "border-red-500 focus:ring-red-500"
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    setErrors((prev) => ({ ...prev, company: undefined }));
                  }}
                  placeholder="Enter your company name"
                  className={cn(
                    "pl-10",
                    errors.company && "border-red-500 focus:ring-red-500"
                  )}
                />
              </div>
              {errors.company && (
                <p className="mt-1 text-sm text-red-500">{errors.company}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#5D8C3D] hover:bg-[#4A7030] text-white py-6 text-lg"
            >
              Start Test
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Your results will be sent to your email address and to the assessment coordinator.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUESTION SLIDE
// ============================================

function QuestionSlide({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswer,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  testTitle,
}: {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  answer: number | string | Record<number, number> | undefined;
  onAnswer: (answer: number | string | Record<number, number>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  testTitle: string;
}) {
  const [readingSubIndex, setReadingSubIndex] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>(
    (answer as Record<number, number>) || {}
  );
  const [slideKey, setSlideKey] = useState(0);

  // Reset reading state when question changes
  useEffect(() => {
    if (question.type === "reading_comprehension") {
      setReadingSubIndex(0);
      setReadingAnswers((answer as Record<number, number>) || {});
    }
    setSlideKey((k) => k + 1);
  }, [question.id]);

  // Update parent when reading answers change
  useEffect(() => {
    if (question.type === "reading_comprehension" && Object.keys(readingAnswers).length > 0) {
      onAnswer(readingAnswers);
    }
  }, [readingAnswers, question.type]);

  const handleMCQAnswer = (index: number) => {
    onAnswer(index);
  };

  const handleReadingAnswer = (subIdx: number, optionIdx: number) => {
    setReadingAnswers((prev) => ({ ...prev, [subIdx]: optionIdx }));
  };

  // Render different question types
  const renderQuestionContent = () => {
    const { type, content } = question;

    // Reading comprehension
    if (type === "reading_comprehension" && content.passage && content.questions) {
      const currentSubQuestion = content.questions[readingSubIndex];
      if (!currentSubQuestion) {
        return <div>Loading question...</div>;
      }
      const isLastSubQuestion = readingSubIndex === content.questions.length - 1;
      const isFirstSubQuestion = readingSubIndex === 0;

      return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Passage */}
          <div className="lg:w-1/2 bg-gray-50 rounded-xl p-6 overflow-y-auto max-h-[50vh] lg:max-h-full">
            <h3 className="font-semibold text-gray-900 mb-4">Reading Passage</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {content.passage}
            </p>
          </div>

          {/* Questions */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="mb-4">
              <span className="text-sm text-gray-500">
                Question {readingSubIndex + 1} of {content.questions.length}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentSubQuestion.question}
            </h3>
            <div className="space-y-3 flex-1">
              {currentSubQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleReadingAnswer(readingSubIndex, idx)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    readingAnswers[readingSubIndex] === idx
                      ? "border-[#5D8C3D] bg-[#5D8C3D]/10"
                      : "border-gray-200 hover:border-[#5D8C3D]/50 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        readingAnswers[readingSubIndex] === idx
                          ? "bg-[#5D8C3D] text-white"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-gray-700">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Sub-question navigation */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setReadingSubIndex((prev) => prev - 1)}
                disabled={isFirstSubQuestion}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              {isLastSubQuestion ? (
                <Button
                  onClick={onNext}
                  disabled={Object.keys(readingAnswers).length < content.questions.length}
                  className="bg-[#5D8C3D] hover:bg-[#4A7030]"
                >
                  {isLast ? "Finish Test" : "Next Question"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => setReadingSubIndex((prev) => prev + 1)}
                  disabled={readingAnswers[readingSubIndex] === undefined}
                  className="bg-[#5D8C3D] hover:bg-[#4A7030]"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Key word transformation
    if (type === "key_word_transformation") {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-amber-800 mb-2">Original sentence:</p>
            <p className="text-lg font-medium text-gray-900">{content.originalSentence}</p>
          </div>
          <div className="bg-[#5D8C3D]/10 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-[#5D8C3D] mb-1">Key word (do not change):</p>
            <p className="text-2xl font-bold text-[#4A7030]">{content.keyWord}</p>
          </div>
          <p className="text-lg text-gray-700 mb-6">
            Complete the sentence so it has a similar meaning:
          </p>
          <p className="text-lg text-gray-900 mb-8 bg-gray-50 p-4 rounded-lg">
            {content.gappedSentence}
          </p>
          <div className="space-y-3">
            {content.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleMCQAnswer(idx)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  answer === idx
                    ? "border-[#5D8C3D] bg-[#5D8C3D]/10"
                    : "border-gray-200 hover:border-[#5D8C3D]/50 bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      answer === idx
                        ? "bg-[#5D8C3D] text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Word formation
    if (type === "word_formation") {
      return (
        <div className="max-w-2xl mx-auto">
          {content.context && (
            <p className="text-sm text-gray-500 italic mb-4 text-center">
              {content.context}
            </p>
          )}
          <div className="bg-amber-50 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-amber-600 mb-1">Word to transform:</p>
            <p className="text-2xl font-bold text-amber-800">{content.stemWord}</p>
          </div>
          <p className="text-xl text-gray-900 mb-8 text-center">
            {content.question}
          </p>
          <div className="space-y-3">
            {content.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleMCQAnswer(idx)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  answer === idx
                    ? "border-[#5D8C3D] bg-[#5D8C3D]/10"
                    : "border-gray-200 hover:border-[#5D8C3D]/50 bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      answer === idx
                        ? "bg-[#5D8C3D] text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Image-based questions
    if (type === "image_based" && content.imageUrl) {
      return (
        <div className="max-w-3xl mx-auto">
          {/* Image */}
          <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
            <img
              src={content.imageUrl}
              alt={content.imageAlt || "Question image"}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>

          {content.context && (
            <p className="text-sm text-gray-500 italic mb-4 text-center">
              {content.context}
            </p>
          )}
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-8">
            {content.question}
          </h2>
          <div className="space-y-3">
            {content.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleMCQAnswer(idx)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  answer === idx
                    ? "border-[#5D8C3D] bg-[#5D8C3D]/10"
                    : "border-gray-200 hover:border-[#5D8C3D]/50 bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      answer === idx
                        ? "bg-[#5D8C3D] text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Default MCQ (grammar_mcq, vocabulary_mcq, multiple_choice_cloze)
    return (
      <div className="max-w-2xl mx-auto">
        {content.context && (
          <p className="text-sm text-gray-500 italic mb-4 text-center">
            {content.context}
          </p>
        )}
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-8">
          {content.question}
        </h2>
        <div className="space-y-3">
          {content.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleMCQAnswer(idx)}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all",
                answer === idx
                  ? "border-[#5D8C3D] bg-[#5D8C3D]/10"
                  : "border-gray-200 hover:border-[#5D8C3D]/50 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    answer === idx
                      ? "bg-[#5D8C3D] text-white"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-gray-700">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const canProceed = () => {
    if (question.type === "reading_comprehension" && question.content.questions) {
      return Object.keys(readingAnswers).length >= question.content.questions.length;
    }
    return answer !== undefined;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50/20 to-stone-50/10">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#5D8C3D]" />
              <span className="font-semibold text-gray-900">{testTitle}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#5D8C3D]/10 text-[#5D8C3D]">
                {question.level}
              </span>
              <span className="text-sm text-gray-500">
                {questionNumber} / {totalQuestions}
              </span>
            </div>
          </div>
          <Progress
            value={(questionNumber / totalQuestions) * 100}
            className="mt-3 h-2"
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-4 md:p-8">
        <div className="flex-1 max-w-4xl mx-auto w-full">
          <div
            key={slideKey}
            className="h-full animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {renderQuestionContent()}
          </div>
        </div>
      </main>

      {/* Footer navigation (only for non-reading questions) */}
      {question.type !== "reading_comprehension" && (
        <footer className="flex-shrink-0 bg-white border-t p-4">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirst}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={onNext}
              disabled={!canProceed()}
              className="bg-[#5D8C3D] hover:bg-[#4A7030]"
            >
              {isLast ? "Finish Test" : "Next"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}

// ============================================
// CALCULATING SCREEN
// ============================================

function CalculatingScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-gray-50/30 to-stone-50/20">
      <div
        className={cn(
          "text-center transition-all duration-500",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        <div className="relative w-24 h-24 mx-auto mb-6">
          <Loader2 className="w-24 h-24 text-[#5D8C3D] animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Calculating Your Results
        </h2>
        <p className="text-gray-600">
          Please wait while we analyze your answers...
        </p>
      </div>
    </div>
  );
}

// ============================================
// RESULTS SCREEN
// ============================================

function ResultsScreen({
  userInfo,
  results,
  levelDescription,
  testConfig,
}: {
  userInfo: UserInfo;
  results: ReturnType<typeof calculateCEFRLevel>;
  levelDescription: {
    title: string;
    description: string;
    recommendations: string[];
  };
  testConfig: TestConfig;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const percentage = Math.round((results.score / results.totalPoints) * 100);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-white via-gray-50/30 to-stone-50/20">
      <div className="max-w-3xl mx-auto">
        <div
          className={cn(
            "transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-green-100 text-green-800">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Test Complete!</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Results, {userInfo.name.split(" ")[0]}
            </h1>
            {userInfo.company && (
              <p className="text-gray-600">{userInfo.company}</p>
            )}
          </div>

          {/* Main Result Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-[#5D8C3D] to-[#4A7030] text-white mb-4">
                <div>
                  <p className="text-5xl font-bold">{results.level}</p>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {levelDescription.title}
              </h2>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                {levelDescription.description}
              </p>
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-[#5D8C3D]">{results.score}</p>
                <p className="text-sm text-gray-500">Correct</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-gray-700">{results.totalPoints}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-amber-600">{percentage}%</p>
                <p className="text-sm text-gray-500">Score</p>
              </div>
            </div>

            {/* Level Breakdown */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Level Breakdown</h3>
              <div className="space-y-3">
                {(["A1", "A2", "B1", "B2", "C1"] as CEFRLevel[]).map((level) => {
                  const data = results.levelBreakdown[level];
                  return (
                    <div key={level} className="flex items-center gap-4">
                      <span className="w-10 text-sm font-medium text-gray-600">
                        {level}
                      </span>
                      <div className="flex-1">
                        <Progress value={data.percentage} className="h-3" />
                      </div>
                      <span className="w-16 text-sm text-gray-500 text-right">
                        {data.correct}/{data.total}
                      </span>
                      <span className="w-12 text-sm font-medium text-gray-700 text-right">
                        {data.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-[#5D8C3D]/10 rounded-xl p-6">
              <h3 className="font-semibold text-[#4A7030] mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Recommendations for You
              </h3>
              <ul className="space-y-2">
                {levelDescription.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[#5D8C3D]">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Email Notification */}
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
            <Mail className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              A detailed report has been sent to <strong>{userInfo.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              The assessment coordinator has also been notified of your results.
            </p>
          </div>

          {/* Branding */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm">Cambridge English Assessment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function DynamicPlacementTestPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [phase, setPhase] = useState<TestPhase>("loading");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    startTime: 0,
    questionStartTimes: {},
  });
  const [results, setResults] = useState<ReturnType<typeof calculateCEFRLevel> | null>(
    null
  );

  // Load test data from Convex
  const convexTest = useQuery(api.placementTests.getPublishedBySlug, { slug });

  // Process test config
  const testConfig = useMemo<TestConfig | null>(() => {
    if (convexTest?.config) {
      return {
        title: convexTest.title,
        slug: convexTest.slug,
        companyName: convexTest.companyName,
        companyLogo: convexTest.companyLogo,
        config: convexTest.config as PlacementTestData,
        resultEmails: convexTest.resultEmails,
      };
    }
    return null;
  }, [convexTest]);

  // Update phase based on test data loading
  useEffect(() => {
    if (convexTest === undefined) {
      // Still loading
      setPhase("loading");
    } else if (convexTest === null) {
      // Not found
      setPhase("not-found");
    } else if (phase === "loading") {
      // Found, move to registration
      setPhase("registration");
    }
  }, [convexTest, phase]);

  const questions = testConfig?.config.questions || [];
  const currentQuestion = questions[testState.currentQuestionIndex];

  const handleRegistration = (info: UserInfo) => {
    setUserInfo(info);
    setTestState({
      currentQuestionIndex: 0,
      answers: {},
      startTime: Date.now(),
      questionStartTimes: { [questions[0].id]: Date.now() },
    });
    setPhase("test");
  };

  const handleAnswer = useCallback((answer: number | string | Record<number, number>) => {
    if (!currentQuestion) return;
    setTestState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: answer },
    }));
  }, [currentQuestion?.id]);

  const handleNext = async () => {
    const isLast = testState.currentQuestionIndex === questions.length - 1;

    if (isLast) {
      // Finish test
      setPhase("calculating");

      // Calculate results
      const calculatedResults = calculateCEFRLevel(testState.answers, questions);
      setResults(calculatedResults);

      // Send email
      try {
        await sendResultsEmail(userInfo!, calculatedResults, testState, slug);
      } catch (error) {
        console.error("Failed to send email:", error);
        toast.error("Failed to send results email, but your results have been recorded.");
      }

      // Show results after a brief delay
      setTimeout(() => {
        setPhase("results");
      }, 2000);
    } else {
      // Move to next question
      const nextIndex = testState.currentQuestionIndex + 1;
      setTestState((prev) => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        questionStartTimes: {
          ...prev.questionStartTimes,
          [questions[nextIndex].id]: Date.now(),
        },
      }));
    }
  };

  const handlePrevious = () => {
    if (testState.currentQuestionIndex > 0) {
      setTestState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  // Render based on phase
  switch (phase) {
    case "loading":
      return <LoadingScreen />;

    case "not-found":
      return <NotFoundScreen slug={slug} />;

    case "registration":
      if (!testConfig) return <LoadingScreen />;
      return <RegistrationScreen onSubmit={handleRegistration} testConfig={testConfig} />;

    case "test":
      if (!testConfig || !currentQuestion) return <LoadingScreen />;
      return (
        <QuestionSlide
          question={currentQuestion}
          questionNumber={testState.currentQuestionIndex + 1}
          totalQuestions={questions.length}
          answer={testState.answers[currentQuestion.id]}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={testState.currentQuestionIndex === 0}
          isLast={testState.currentQuestionIndex === questions.length - 1}
          testTitle={testConfig.title}
        />
      );

    case "calculating":
      return <CalculatingScreen />;

    case "results":
      if (!results || !userInfo || !testConfig) return null;
      return (
        <ResultsScreen
          userInfo={userInfo}
          results={results}
          levelDescription={testConfig.config.levelDescriptions[results.level]}
          testConfig={testConfig}
        />
      );
  }
}

// ============================================
// EMAIL FUNCTION
// ============================================

async function sendResultsEmail(
  userInfo: UserInfo,
  results: ReturnType<typeof calculateCEFRLevel>,
  testState: TestState,
  slug: string
) {
  const totalTimeMinutes = Math.round((Date.now() - testState.startTime) / 60000);
  const percentage = Math.round((results.score / results.totalPoints) * 100);

  const response = await fetch(`/api/tests/${slug}/send-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: userInfo.name,
      userEmail: userInfo.email,
      userCompany: userInfo.company,
      level: results.level,
      score: results.score,
      totalPoints: results.totalPoints,
      percentage,
      levelBreakdown: results.levelBreakdown,
      totalTimeMinutes,
      testDate: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send email");
  }

  return response.json();
}
