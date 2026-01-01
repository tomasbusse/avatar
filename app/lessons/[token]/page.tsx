"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import {
  FileDown,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle,
  ListOrdered,
  BookText,
  Lightbulb,
  MessageSquare,
  Loader2,
  FileText,
  Sparkles,
  FileCheck,
} from "lucide-react";
import { LessonContent } from "@/lib/types/lesson-content";

// Processing steps for progress indicator
const PROCESSING_STEPS = [
  { id: "pending", label: "Queued", icon: Clock, progress: 10 },
  { id: "processing", label: "Extracting text with OCR", icon: FileText, progress: 30 },
  { id: "structuring", label: "AI structuring content", icon: Sparkles, progress: 60 },
  { id: "generating_pdf", label: "Generating PDF", icon: FileCheck, progress: 85 },
  { id: "completed", label: "Ready!", icon: CheckCircle, progress: 100 },
];

function ProcessingIndicator({ status, title }: { status: string; title?: string }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Find current step
  const currentStepIndex = PROCESSING_STEPS.findIndex(s => s.id === status);
  const currentStep = PROCESSING_STEPS[currentStepIndex] || PROCESSING_STEPS[0];
  const targetProgress = currentStep.progress;

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animatedProgress < targetProgress) {
        setAnimatedProgress(prev => Math.min(prev + 2, targetProgress));
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [animatedProgress, targetProgress]);

  // Pulse animation for in-progress status
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (status !== "completed") {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            {status === "completed" ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <Loader2 className={`w-10 h-10 text-blue-500 ${pulse ? "animate-spin" : ""}`} />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === "completed" ? "Lesson Ready!" : "Processing Your Lesson"}
          </CardTitle>
          {title && (
            <p className="text-muted-foreground mt-1">{title}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{animatedProgress}%</span>
            </div>
            <Progress value={animatedProgress} className="h-3" />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {PROCESSING_STEPS.map((step, index) => {
              const isActive = step.id === status;
              const isComplete = currentStepIndex > index || status === "completed";
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-50 border border-blue-200"
                      : isComplete
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : isComplete
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isComplete && !isActive ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`flex-1 ${
                      isActive
                        ? "font-medium text-blue-700"
                        : isComplete
                        ? "text-green-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-xs text-blue-500 animate-pulse">In progress...</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info */}
          <p className="text-center text-sm text-muted-foreground">
            {status === "completed"
              ? "The page will refresh automatically."
              : "This page updates automatically. Please wait..."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PublicLessonPage() {
  const params = useParams();
  const token = params.token as string;

  const content = useQuery(api.knowledgeBases.getContentByShareToken, { shareToken: token });

  if (content === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-blue-500 mb-4" />
          <p className="text-gray-500">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Lesson Not Found</h2>
            <p className="text-muted-foreground">
              This lesson link is invalid or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lesson = content.jsonContent as LessonContent | undefined;

  // Show processing indicator if content is still being processed
  if (!lesson && content.processingStatus !== "completed") {
    const status = content.processingStatus || "pending";
    return <ProcessingIndicator status={status} title={content.title} />;
  }

  // Fallback: Show raw markdown content if no structured JSON
  if (!lesson && content.content) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Emma AI</p>
                <p className="text-xs text-muted-foreground">English Learning Platform</p>
              </div>
            </div>
            {content.pdfUrl && (
              <Button asChild>
                <a href={content.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileDown className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Badge variant="outline" className="mb-2">Legacy Content</Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h1>
            <p className="text-sm text-muted-foreground">
              This lesson was processed before structured content was available.
              Ask an admin to reprocess it for enhanced features.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {content.content}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">Emma AI</p>
              <p className="text-xs text-muted-foreground">English Learning Platform</p>
            </div>
          </div>
          {content.pdfUrl && (
            <Button asChild>
              <a href={content.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-blue-600">{lesson.metadata.level}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lesson.metadata.estimatedMinutes} min
            </Badge>
            {lesson.metadata.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {lesson.metadata.title}
          </h1>
          {lesson.metadata.titleDe && (
            <p className="text-lg text-muted-foreground">{lesson.metadata.titleDe}</p>
          )}
        </div>

        {/* Learning Objectives */}
        {lesson.content.learningObjectives.length > 0 && (
          <Card className="mb-6 border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                Learning Objectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {lesson.content.learningObjectives.map((obj) => (
                  <li key={obj.id} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">&#10003;</span>
                    <span>{obj.objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Introduction */}
        {lesson.content.introduction?.content && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {lesson.content.introduction.content}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sections */}
        {lesson.content.sections.map((section) => (
          <Card key={section.id} className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <BookText className="w-5 h-5 text-blue-600" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {section.content}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Grammar Rules */}
        {lesson.content.grammarRules.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Grammar Rules
            </h2>
            <div className="space-y-4">
              {lesson.content.grammarRules.map((rule) => (
                <Card key={rule.id} className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-800 text-lg">{rule.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{rule.rule}</p>
                    {rule.formula && (
                      <div className="bg-white p-3 rounded-lg mb-3 font-mono text-sm border border-amber-200">
                        {rule.formula}
                      </div>
                    )}
                    {rule.examples.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-amber-800">Examples:</p>
                        {rule.examples.map((ex, i) => (
                          <div key={i} className="pl-4 border-l-2 border-amber-300">
                            <p className="text-green-700">&#10003; {ex.correct}</p>
                            {ex.incorrect && (
                              <p className="text-red-600 line-through">&#10007; {ex.incorrect}</p>
                            )}
                            {ex.explanation && (
                              <p className="text-sm text-gray-600 italic mt-1">{ex.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Exercises */}
        {lesson.content.exercises.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-purple-600" />
              Exercises
            </h2>
            <div className="space-y-4">
              {lesson.content.exercises.map((exercise, index) => (
                <Card key={exercise.id} className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-purple-700">
                        Exercise {index + 1}: {exercise.title}
                      </CardTitle>
                      <Badge
                        variant={
                          exercise.difficulty === 1 ? "secondary" :
                          exercise.difficulty === 2 ? "default" : "destructive"
                        }
                      >
                        {exercise.difficulty === 1 ? "Easy" :
                         exercise.difficulty === 2 ? "Medium" : "Hard"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 italic">{exercise.instructions}</p>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3 list-decimal list-inside">
                      {exercise.items.map((item) => (
                        <li key={item.id} className="text-gray-700">
                          <span className="ml-2">{item.question}</span>
                          {item.hint && (
                            <p className="text-xs text-blue-600 mt-1 ml-6">
                              Hint: {item.hint}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Vocabulary */}
        {lesson.content.vocabulary.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Vocabulary
            </h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-teal-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-teal-800">English</th>
                      <th className="text-left p-3 font-medium text-teal-800">German</th>
                      <th className="text-left p-3 font-medium text-teal-800">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lesson.content.vocabulary.map((vocab, i) => (
                      <tr
                        key={vocab.id}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="p-3 font-medium">{vocab.term}</td>
                        <td className="p-3 text-gray-600">{vocab.termDe}</td>
                        <td className="p-3 text-gray-600 text-sm italic">
                          {vocab.exampleSentence}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary */}
        {lesson.content.summary?.content && (
          <Card className="mb-6 bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {lesson.content.summary.content}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-4 border-t">
          <p className="text-sm text-muted-foreground">
            Powered by Emma AI - English Learning Platform
          </p>
          {content.pdfUrl && (
            <Button asChild variant="outline" className="mt-4">
              <a href={content.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileDown className="w-4 h-4 mr-2" />
                Download Lesson as PDF
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
