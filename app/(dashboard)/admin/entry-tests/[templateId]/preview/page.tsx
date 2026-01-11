"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Eye,
  FileQuestion,
  Clock,
  BookOpen,
  Pencil,
  Mic,
  Volume2,
  Headphones,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

interface Question {
  _id: Id<"entryTestQuestionBank">;
  type: QuestionType;
  cefrLevel: CEFRLevel;
  content: Record<string, unknown>;
  tags: string[];
}

interface Section {
  id: string;
  type: string;
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
  availableQuestionCount: number;
  hasEnoughQuestions: boolean;
}

// ============================================
// QUESTION TYPE ICONS
// ============================================

function getQuestionTypeIcon(type: string) {
  switch (type) {
    case "reading_comprehension":
      return <BookOpen className="h-4 w-4" />;
    case "grammar_mcq":
    case "grammar_fill_blank":
      return <Pencil className="h-4 w-4" />;
    case "vocabulary_mcq":
    case "vocabulary_matching":
      return <FileQuestion className="h-4 w-4" />;
    case "listening_mcq":
    case "listening_fill_blank":
      return <Headphones className="h-4 w-4" />;
    case "writing_prompt":
      return <Pencil className="h-4 w-4" />;
    case "speaking_prompt":
      return <Mic className="h-4 w-4" />;
    default:
      return <FileQuestion className="h-4 w-4" />;
  }
}

// ============================================
// QUESTION PREVIEW COMPONENTS
// ============================================

function MCQPreview({ content }: { content: Record<string, unknown> }) {
  const options = (content.options as string[]) || [];
  const question = (content.question as string) || (content.sentence as string) || "";
  const correctAnswer = content.correctAnswer as number;

  return (
    <div className="space-y-3">
      <p className="font-medium">{question}</p>
      <div className="space-y-2">
        {options.map((option, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 p-2 rounded border ${
              idx === correctAnswer
                ? "border-green-500 bg-green-50"
                : "border-gray-200"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              idx === correctAnswer ? "border-green-500" : "border-gray-300"
            }`}>
              {idx === correctAnswer && (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              )}
            </div>
            <span className={idx === correctAnswer ? "text-green-700" : ""}>{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FillBlankPreview({ content }: { content: Record<string, unknown> }) {
  const sentence = (content.sentence as string) || (content.displayText as string) || "";
  const correctAnswer = content.correctAnswer as string;
  const hint = content.hint as string | undefined;

  return (
    <div className="space-y-3">
      <p className="font-medium">{sentence}</p>
      {hint && <p className="text-sm text-muted-foreground">Hint: {hint}</p>}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Correct answer:</span>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          {correctAnswer}
        </Badge>
      </div>
    </div>
  );
}

function ReadingComprehensionPreview({ content }: { content: Record<string, unknown> }) {
  const passage = content.passage as string;
  const questions = (content.questions as Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>) || [];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
        <p className="text-sm whitespace-pre-wrap">{passage}</p>
      </div>
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={idx} className="p-3 border rounded-lg">
            <p className="font-medium text-sm mb-2">{idx + 1}. {q.question}</p>
            <div className="grid grid-cols-2 gap-1">
              {q.options.map((opt, optIdx) => (
                <div
                  key={optIdx}
                  className={`text-xs p-1.5 rounded ${
                    optIdx === q.correctAnswer
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-50"
                  }`}
                >
                  {String.fromCharCode(65 + optIdx)}. {opt}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VocabularyMatchingPreview({ content }: { content: Record<string, unknown> }) {
  const pairs = (content.pairs as Array<{
    term: string;
    definition: string;
  }>) || [];

  return (
    <div className="space-y-2">
      {pairs.map((pair, idx) => (
        <div key={idx} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
          <Badge variant="outline">{pair.term}</Badge>
          <span className="text-muted-foreground">→</span>
          <span className="text-sm">{pair.definition}</span>
        </div>
      ))}
    </div>
  );
}

function WritingPromptPreview({ content }: { content: Record<string, unknown> }) {
  const prompt = content.prompt as string;
  const wordCountRange = content.wordCountRange as { min: number; max: number } | undefined;
  const rubric = content.rubric as Record<string, unknown> | undefined;

  return (
    <div className="space-y-3">
      <p className="font-medium">{prompt}</p>
      {wordCountRange && (
        <p className="text-sm text-muted-foreground">
          Word count: {wordCountRange.min}-{wordCountRange.max} words
        </p>
      )}
      {rubric && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-blue-700 mb-1">Rubric criteria:</p>
          <ul className="text-xs text-blue-600 space-y-0.5">
            {Object.keys(rubric).map((key) => (
              <li key={key}>• {key}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SpeakingPromptPreview({ content }: { content: Record<string, unknown> }) {
  const prompt = content.prompt as string;
  const prepTime = content.preparationTimeSeconds as number | undefined;
  const responseTime = content.responseTimeSeconds as number | undefined;

  return (
    <div className="space-y-3">
      <p className="font-medium">{prompt}</p>
      <div className="flex gap-4 text-sm text-muted-foreground">
        {prepTime && <span>Prep time: {prepTime}s</span>}
        {responseTime && <span>Response time: {responseTime}s</span>}
      </div>
    </div>
  );
}

function ListeningPreview({ content }: { content: Record<string, unknown> }) {
  const audioScript = content.audioScript as string | undefined;
  const question = (content.question as string) || "";
  const options = (content.options as string[]) || [];
  const correctAnswer = content.correctAnswer as number | string;

  return (
    <div className="space-y-3">
      {audioScript && (
        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs font-medium text-yellow-700 mb-1">Audio Script:</p>
          <p className="text-sm text-yellow-800 italic">&quot;{audioScript}&quot;</p>
        </div>
      )}
      <p className="font-medium">{question}</p>
      {options.length > 0 ? (
        <div className="space-y-2">
          {options.map((option, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2 rounded border ${
                idx === correctAnswer
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <span>{option}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Correct answer:</span>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            {String(correctAnswer)}
          </Badge>
        </div>
      )}
    </div>
  );
}

function QuestionPreview({ question }: { question: Question }) {
  const { type, content, cefrLevel } = question;

  const renderContent = () => {
    switch (type) {
      case "grammar_mcq":
      case "vocabulary_mcq":
        return <MCQPreview content={content} />;
      case "grammar_fill_blank":
        return <FillBlankPreview content={content} />;
      case "reading_comprehension":
        return <ReadingComprehensionPreview content={content} />;
      case "vocabulary_matching":
        return <VocabularyMatchingPreview content={content} />;
      case "writing_prompt":
        return <WritingPromptPreview content={content} />;
      case "speaking_prompt":
        return <SpeakingPromptPreview content={content} />;
      case "listening_mcq":
      case "listening_fill_blank":
        return <ListeningPreview content={content} />;
      default:
        return <pre className="text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getQuestionTypeIcon(type)}
            <span className="text-sm font-medium capitalize">
              {type.replace(/_/g, " ")}
            </span>
          </div>
          <Badge variant="outline">{cefrLevel}</Badge>
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}

// ============================================
// MAIN PREVIEW PAGE
// ============================================

export default function TestPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as Id<"entryTestTemplates">;

  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<"overview" | "walkthrough">("overview");
  const [walkthroughIndex, setWalkthroughIndex] = useState(0);

  // Get template with question counts
  const templateData = useQuery(api.entryTests.getTemplateWithQuestionCounts, {
    templateId,
  });

  // Get questions for preview
  const questionsData = useQuery(api.entryTestQuestionBank.listQuestions, {
    curationStatus: "approved",
    limit: 100,
  });

  if (!templateData || !questionsData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const template = templateData;

  if (!template) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Template Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The test template you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/admin/entry-tests")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = template.sections as Section[];
  const questions = questionsData.questions as Question[];

  // Filter questions for the selected section
  const getQuestionsForSection = (section: Section) => {
    return questions.filter((q) => {
      if (!section.questionBankFilter.types.includes(q.type)) return false;
      if (!section.questionBankFilter.levels.includes(q.cefrLevel)) return false;
      if (section.questionBankFilter.tags && section.questionBankFilter.tags.length > 0) {
        if (!section.questionBankFilter.tags.some((tag) => q.tags.includes(tag))) {
          return false;
        }
      }
      return true;
    });
  };

  const currentSection = sections[selectedSectionIndex];
  const sectionQuestions = currentSection ? getQuestionsForSection(currentSection) : [];

  // For walkthrough mode
  const allQuestions = sections.flatMap((section) =>
    getQuestionsForSection(section).slice(0, section.questionCount)
  );

  const totalQuestions = sections.reduce((sum: number, s: Section) => sum + s.questionCount, 0);
  const availableQuestions = sections.reduce((sum: number, s: Section) => sum + Math.min(s.availableQuestionCount, s.questionCount), 0);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/entry-tests")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Test Preview
            </h1>
            <p className="text-muted-foreground">{template.title}</p>
          </div>
        </div>
        <Badge variant={template.status === "published" ? "default" : "secondary"}>
          {template.status}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Total Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{availableQuestions}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{sections.length}</p>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">~{Math.ceil(totalQuestions * 1.5)}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning if not enough questions */}
      {availableQuestions < totalQuestions && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Not Enough Questions</p>
                <p className="text-sm text-yellow-700">
                  This test requires {totalQuestions} questions but only {availableQuestions} are available.
                  Generate or approve more questions before publishing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Tabs */}
      <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "overview" | "walkthrough")}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Section Overview</TabsTrigger>
          <TabsTrigger value="walkthrough">Question Walkthrough</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-3 gap-6">
            {/* Section List */}
            <div className="space-y-2">
              <h3 className="font-semibold mb-3">Sections</h3>
              {sections.map((section: Section, idx: number) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSectionIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedSectionIndex === idx
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{section.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {section.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
                    <span>{section.questionCount} questions</span>
                    <span className={section.availableQuestionCount >= section.questionCount ? "text-green-600" : "text-yellow-600"}>
                      {section.availableQuestionCount} available
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Section Questions */}
            <div className="col-span-2">
              {currentSection && (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold">{currentSection.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentSection.instructions_en}
                    </p>
                    {currentSection.instructions_de && (
                      <p className="text-sm text-muted-foreground italic">
                        {currentSection.instructions_de}
                      </p>
                    )}
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {sectionQuestions.length === 0 ? (
                      <Card className="bg-gray-50">
                        <CardContent className="pt-6 text-center">
                          <FileQuestion className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-muted-foreground">
                            No approved questions match this section&apos;s filters.
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Types: {currentSection.questionBankFilter.types.join(", ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Levels: {currentSection.questionBankFilter.levels.join(", ")}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      sectionQuestions.slice(0, currentSection.questionCount).map((question, idx) => (
                        <div key={question._id}>
                          <p className="text-xs text-muted-foreground mb-1">
                            Question {idx + 1} of {currentSection.questionCount}
                          </p>
                          <QuestionPreview question={question} />
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="walkthrough">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Test Walkthrough</CardTitle>
                  <CardDescription>
                    Preview questions as students will see them
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Question {walkthroughIndex + 1} of {allQuestions.length}
                </div>
              </div>
              <Progress value={((walkthroughIndex + 1) / allQuestions.length) * 100} className="h-2" />
            </CardHeader>
            <CardContent>
              {allQuestions.length > 0 ? (
                <>
                  <QuestionPreview question={allQuestions[walkthroughIndex]} />
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setWalkthroughIndex(Math.max(0, walkthroughIndex - 1))}
                      disabled={walkthroughIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setWalkthroughIndex(Math.min(allQuestions.length - 1, walkthroughIndex + 1))}
                      disabled={walkthroughIndex === allQuestions.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">
                    No questions available for walkthrough.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate or approve questions first.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
