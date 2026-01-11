"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TestSlideViewer } from "@/components/entry-test/test-slide-viewer";

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
  questionBankId?: Id<"entryTestQuestionBank">;
  type: QuestionType;
  cefrLevel: CEFRLevel;
  content: Record<string, unknown>;
  sectionId: string;
  orderInSection: number;
}

interface Section {
  id: string;
  type: "reading" | "grammar" | "vocabulary" | "listening" | "writing" | "speaking";
  title: string;
  instructions_en: string;
  instructions_de?: string;
  questionCount: number;
  questionBankFilter: {
    types: string[];
    levels: string[];
    tags?: string[];
  };
  weight: number;
  order: number;
}

// ============================================
// MAIN PAGE
// ============================================

export default function TestTakingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as Id<"entryTestSessions">;

  // State
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Fetch session with questions
  const session = useQuery(api.entryTestSessions.getSessionWithQuestions, {
    sessionId,
  });

  // Fetch template for section info
  const template = useQuery(
    api.entryTests.getTemplate,
    session?.templateId ? { templateId: session.templateId } : "skip"
  );

  // Fetch an avatar to display (use Ludwig by default)
  const avatar = useQuery(api.avatars.getAvatarBySlug, { slug: "ludwig" });

  // Mutations
  const submitAnswer = useMutation(api.entryTestSessions.submitAnswer);
  const pauseTest = useMutation(api.entryTestSessions.pauseTest);
  const completeTest = useMutation(api.entryTestSessions.completeTest);

  // Reset timer when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [session?.currentState?.currentQuestionIndex, session?.currentState?.currentSectionIndex]);

  // Get current question
  const getCurrentQuestion = (): QuestionInstance | null => {
    if (!session?.questionInstances || !template) return null;
    const { currentSectionIndex, currentQuestionIndex } = session.currentState;

    const sections = template.sections as Section[];
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return null;

    const sectionQuestions = session.questionInstances.filter(
      (q) => q.sectionId === currentSection.id
    );
    return sectionQuestions[currentQuestionIndex] || null;
  };

  // Handle answer submission
  const handleSubmitAnswer = async (answer: unknown) => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !session || !template) return;

    try {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

      await submitAnswer({
        sessionId,
        instanceId: currentQuestion.instanceId,
        answer,
        timeSpentSeconds: timeSpent,
      });

      // Check if this was the last question
      const sections = template.sections as Section[];
      const currentSection = sections[session.currentState.currentSectionIndex];
      const sectionQuestions = session.questionInstances.filter(
        (q) => q.sectionId === currentSection?.id
      );
      const isLastQuestionInSection =
        session.currentState.currentQuestionIndex >= sectionQuestions.length - 1;
      const isLastSection =
        session.currentState.currentSectionIndex >= sections.length - 1;

      if (isLastQuestionInSection && isLastSection) {
        // Complete the test
        await completeTest({ sessionId });
        toast.success("Test completed! Calculating your results...");

        // Trigger scoring
        try {
          await fetch("/api/entry-tests/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
        } catch (scoringError) {
          console.error("Scoring error:", scoringError);
        }

        router.push(`/entry-test/${sessionId}/results`);
      }
    } catch (error) {
      toast.error("Failed to submit answer");
      console.error(error);
    }
  };

  // Handle pause
  const handlePause = async () => {
    try {
      await pauseTest({ sessionId });
      toast.success("Test paused. You can resume anytime.");
      router.push("/entry-test");
    } catch (error) {
      toast.error("Failed to pause test");
    }
  };

  // Loading state
  if (!session || !template) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-white to-sls-cream/30">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-sls-teal mx-auto mb-4" />
          <p className="text-sls-olive/60">Loading your test...</p>
        </div>
      </div>
    );
  }

  // Redirect if completed
  if (session.status === "completed") {
    router.push(`/entry-test/${sessionId}/results`);
    return null;
  }

  const currentQuestion = getCurrentQuestion();
  const sections = template.sections as Section[];
  const currentSection = sections[session.currentState.currentSectionIndex];

  // Calculate progress
  const totalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0);
  const answeredQuestions = session.answers?.length || 0;

  // Determine if this is the last question
  const sectionQuestions = session.questionInstances.filter(
    (q) => q.sectionId === currentSection?.id
  );
  const isLastQuestionInSection =
    session.currentState.currentQuestionIndex >= sectionQuestions.length - 1;
  const isLastSection =
    session.currentState.currentSectionIndex >= sections.length - 1;
  const isLastQuestion = isLastQuestionInSection && isLastSection;

  // Avatar config
  const avatarConfig = avatar
    ? {
        name: avatar.name,
        avatarImage: avatar.appearance?.avatarImage || "/avatars/ludwig.png",
      }
    : {
        name: "Ludwig",
        avatarImage: "/avatars/ludwig.png",
      };

  return (
    <TestSlideViewer
      templateTitle={template.title}
      currentQuestion={currentQuestion}
      currentSectionTitle={currentSection?.title || ""}
      totalQuestions={totalQuestions}
      answeredQuestions={answeredQuestions}
      avatar={avatarConfig}
      onSubmitAnswer={handleSubmitAnswer}
      onPause={handlePause}
      isLastQuestion={isLastQuestion}
    />
  );
}
