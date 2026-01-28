"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  simmondsPlacementTest,
  clozePassages,
  calculateCEFRLevel,
  type Question,
  type CEFRLevel,
} from "./test-data";

// ============================================
// TYPES
// ============================================

type TestPhase = "registration" | "test" | "calculating" | "results";

interface UserInfo {
  name: string;
  email: string;
  company: string;
}

interface TestState {
  currentQuestionIndex: number;
  answers: Record<string, number>;
  startTime: number;
}

// ============================================
// REGISTRATION SCREEN
// ============================================

function RegistrationScreen({
  onSubmit,
}: {
  onSubmit: (info: UserInfo) => void;
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20">
      <div
        className={cn(
          "w-full max-w-lg transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-green-100 text-green-800">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Simmonds Language Services</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business English Placement Test
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
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-green-700" />
              </div>
              <p className="text-sm font-medium text-gray-900">60</p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <p className="text-sm font-medium text-gray-900">~30 min</p>
              <p className="text-xs text-gray-500">Duration</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-5 h-5 text-blue-700" />
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
              className="w-full bg-green-700 hover:bg-green-800 text-white py-6 text-lg"
            >
              Start Test
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Your results will be sent to your email address and to the Simmonds team.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CLOZE PASSAGE DISPLAY
// ============================================

function ClozePassageDisplay({ passageKey, currentGap }: { passageKey: string; currentGap: number }) {
  const passage = clozePassages[passageKey as keyof typeof clozePassages];
  if (!passage) return null;

  // Parse the passage text to highlight the current gap
  // The gaps are in format (N) _____
  const parts = passage.text.split(/(\(\d+\) _____)/g);

  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-6 max-h-[35vh] overflow-y-auto">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
        {passage.title}
      </h3>
      <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
        {parts.map((part, index) => {
          // Check if this part is a gap marker
          const gapMatch = part.match(/\((\d+)\) _____/);
          if (gapMatch) {
            const gapNum = parseInt(gapMatch[1]);
            if (gapNum === currentGap) {
              return (
                <span key={index} className="bg-green-200 px-1 rounded font-semibold">
                  {part}
                </span>
              );
            }
          }
          return <span key={index}>{part}</span>;
        })}
      </p>
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
}: {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  answer: number | undefined;
  onAnswer: (answer: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [slideKey, setSlideKey] = useState(0);

  // Reset animation when question changes
  useEffect(() => {
    setSlideKey((k) => k + 1);
  }, [question.id]);

  const handleAnswer = (index: number) => {
    onAnswer(index);
  };

  // Get passage key for cloze questions
  const getPassageKey = () => {
    if (question.type !== "cloze_passage") return null;

    const gapNum = question.content.gapNumber;
    if (!gapNum) return null;

    if (gapNum >= 6 && gapNum <= 10) return "scotland";
    if (gapNum >= 11 && gapNum <= 15) return "aliceGuyBlache";
    if (gapNum >= 16 && gapNum <= 20) return "ufos";
    if (gapNum >= 41 && gapNum <= 45) return "skyscrapers";
    if (gapNum >= 46 && gapNum <= 50) return "scrabble";

    return null;
  };

  // Render question content
  const renderQuestionContent = () => {
    const { type, content } = question;

    // Notice identification
    if (type === "notice_identification") {
      return (
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-gray-500 mb-4 text-center">
            {content.context}
          </p>

          {/* Notice display */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-8 text-center">
            <p className="text-xl font-medium text-gray-900 italic">
              &ldquo;{content.notice}&rdquo;
            </p>
          </div>

          <div className="space-y-3">
            {content.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  answer === idx
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-green-300 bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      answer === idx
                        ? "bg-green-600 text-white"
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

    // Cloze passage
    if (type === "cloze_passage") {
      const passageKey = getPassageKey();

      return (
        <div className="max-w-3xl mx-auto">
          {/* Show passage context */}
          {passageKey && (
            <ClozePassageDisplay
              passageKey={passageKey}
              currentGap={content.gapNumber || 0}
            />
          )}

          {/* Question */}
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <p className="text-lg text-gray-900 text-center">
              {content.question}
            </p>
          </div>

          <div className="space-y-3">
            {content.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  answer === idx
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-green-300 bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      answer === idx
                        ? "bg-green-600 text-white"
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

    // Sentence completion (default)
    return (
      <div className="max-w-2xl mx-auto">
        {content.context && (
          <p className="text-sm text-gray-500 mb-4 text-center">
            {content.context}
          </p>
        )}
        <h2 className="text-xl md:text-2xl font-medium text-gray-900 text-center mb-8">
          {content.question}
        </h2>
        <div className="space-y-3">
          {content.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all",
                answer === idx
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    answer === idx
                      ? "bg-green-600 text-white"
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

  // Get band label
  const getBandLabel = () => {
    const band = question.band;
    if (band <= 2) return "Band 1-2";
    if (band <= 4) return "Band 3-4";
    if (band === 5) return "Band 5";
    return "Band 6";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-green-50/20 to-emerald-50/10">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-green-700" />
              <span className="font-semibold text-gray-900">Simmonds Placement Test</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {getBandLabel()}
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

      {/* Footer navigation */}
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
            disabled={answer === undefined}
            className="bg-green-700 hover:bg-green-800"
          >
            {isLast ? "Finish Test" : "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </footer>
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20">
      <div
        className={cn(
          "text-center transition-all duration-500",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        <div className="relative w-24 h-24 mx-auto mb-6">
          <Loader2 className="w-24 h-24 text-green-600 animate-spin" />
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
}: {
  userInfo: UserInfo;
  results: ReturnType<typeof calculateCEFRLevel>;
  levelDescription: {
    title: string;
    description: string;
    recommendations: string[];
  };
}) {
  const [isVisible, setIsVisible] = useState(false);
  const percentage = Math.round((results.score / results.totalPoints) * 100);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20">
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
          </div>

          {/* Main Result Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white mb-4">
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
                <p className="text-3xl font-bold text-green-700">{results.score}</p>
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

            {/* Band Breakdown */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Band Performance</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((band) => {
                  const data = results.bandBreakdown[band];
                  const bandLabels: Record<number, string> = {
                    1: "Band 1 (A1)",
                    2: "Band 2 (A2)",
                    3: "Band 3 (B1)",
                    4: "Band 4 (B1+)",
                    5: "Band 5 (B2)",
                    6: "Band 6 (C1)",
                  };
                  return (
                    <div key={band} className="flex items-center gap-4">
                      <span className="w-24 text-sm font-medium text-gray-600">
                        {bandLabels[band]}
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
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Recommendations for You
              </h3>
              <ul className="space-y-2">
                {levelDescription.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-green-800">
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
              The Simmonds team has also been notified of your results.
            </p>
          </div>

          {/* Branding */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm">Powered by Simmonds Language Services</span>
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

export default function SimmondsPlacementTestPage() {
  const [phase, setPhase] = useState<TestPhase>("registration");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    startTime: 0,
  });
  const [results, setResults] = useState<ReturnType<typeof calculateCEFRLevel> | null>(
    null
  );

  const questions = simmondsPlacementTest.questions;
  const currentQuestion = questions[testState.currentQuestionIndex];

  const handleRegistration = (info: UserInfo) => {
    setUserInfo(info);
    setTestState({
      currentQuestionIndex: 0,
      answers: {},
      startTime: Date.now(),
    });
    setPhase("test");
  };

  const handleAnswer = useCallback((answer: number) => {
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
        await sendResultsEmail(userInfo!, calculatedResults, testState);
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
    case "registration":
      return <RegistrationScreen onSubmit={handleRegistration} />;

    case "test":
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
        />
      );

    case "calculating":
      return <CalculatingScreen />;

    case "results":
      if (!results || !userInfo) return null;
      return (
        <ResultsScreen
          userInfo={userInfo}
          results={results}
          levelDescription={simmondsPlacementTest.levelDescriptions[results.level]}
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
  testState: TestState
) {
  const totalTimeMinutes = Math.round((Date.now() - testState.startTime) / 60000);
  const percentage = Math.round((results.score / results.totalPoints) * 100);

  const response = await fetch("/api/tests/simmonds/send-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: userInfo.name,
      userEmail: userInfo.email,
      company: userInfo.company,
      level: results.level,
      score: results.score,
      totalPoints: results.totalPoints,
      percentage,
      bandBreakdown: results.bandBreakdown,
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
