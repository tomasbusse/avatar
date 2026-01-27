"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  ClipboardCheck,
  Trash2,
  Eye,
  Save,
  Send,
  FileJson,
  ExternalLink,
  Check,
  X,
  Loader2,
  ChevronRight,
  Image,
  FileText,
  ListChecks,
  Sparkles,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

type QuestionType =
  | "multiple_choice_cloze"
  | "open_cloze"
  | "word_formation"
  | "key_word_transformation"
  | "reading_comprehension"
  | "grammar_mcq"
  | "vocabulary_mcq"
  | "image_based";

interface Question {
  id: string;
  type: QuestionType;
  level: CEFRLevel;
  content: {
    question?: string;
    options?: string[];
    correctAnswer?: number;
    sentence?: string;
    correctAnswers?: string[];
    stemWord?: string;
    originalSentence?: string;
    keyWord?: string;
    gappedSentence?: string;
    passage?: string;
    questions?: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
    imageUrl?: string;
    imageAlt?: string;
    context?: string;
    explanation?: string;
  };
  metadata: {
    topic: string;
    difficulty: number;
    tags: string[];
  };
}

interface PlacementTestConfig {
  id: string;
  title: string;
  company: {
    name: string;
    industry: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  totalQuestions: number;
  questions: Question[];
  levelDescriptions: Record<
    CEFRLevel,
    {
      title: string;
      description: string;
      recommendations: string[];
    }
  >;
}

interface PlacementTest {
  _id: Id<"placementTests">;
  title: string;
  slug: string;
  companyName?: string;
  companyLogo?: string;
  config: PlacementTestConfig;
  status: "draft" | "published";
  resultEmails?: {
    sendToCandidate: boolean;
    hrEmails?: string[];
  };
  createdAt: number;
  updatedAt: number;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode }[] = [
  { value: "grammar_mcq", label: "Grammar MCQ", icon: <ListChecks className="h-4 w-4" /> },
  { value: "vocabulary_mcq", label: "Vocabulary MCQ", icon: <ListChecks className="h-4 w-4" /> },
  { value: "multiple_choice_cloze", label: "Multiple Choice Cloze", icon: <ListChecks className="h-4 w-4" /> },
  { value: "open_cloze", label: "Open Cloze", icon: <FileText className="h-4 w-4" /> },
  { value: "word_formation", label: "Word Formation", icon: <Sparkles className="h-4 w-4" /> },
  { value: "key_word_transformation", label: "Key Word Transformation", icon: <FileText className="h-4 w-4" /> },
  { value: "reading_comprehension", label: "Reading Comprehension", icon: <FileText className="h-4 w-4" /> },
  { value: "image_based", label: "Image Based", icon: <Image className="h-4 w-4" /> },
];

const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];

const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-lime-100 text-lime-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-orange-100 text-orange-800",
  C1: "bg-red-100 text-red-800",
};

// ============================================
// TEST CARD COMPONENT
// ============================================

interface TestCardProps {
  test: PlacementTest;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function TestCard({ test, isSelected, onSelect, onDelete }: TestCardProps) {
  const questionCount = test.config?.questions?.length || 0;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{test.title}</CardTitle>
            <CardDescription className="text-sm">/{test.slug}</CardDescription>
          </div>
          <Badge variant={test.status === "published" ? "default" : "secondary"}>
            {test.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{questionCount} questions</span>
          {test.companyName && <span>{test.companyName}</span>}
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/tests/${test.slug}`, "_blank");
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// QUESTION LIST ITEM
// ============================================

interface QuestionListItemProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function QuestionListItem({ question, index, isSelected, onSelect }: QuestionListItemProps) {
  const typeLabel = QUESTION_TYPES.find((t) => t.value === question.type)?.label || question.type;
  const questionPreview =
    question.content.question ||
    question.content.sentence ||
    question.content.originalSentence ||
    "No content";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs text-muted-foreground font-mono w-6">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs ${LEVEL_COLORS[question.level]}`}>
              {question.level}
            </Badge>
            <span className="text-xs text-muted-foreground truncate">{typeLabel}</span>
          </div>
          <p className="text-sm truncate">{questionPreview}</p>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
      </div>
    </button>
  );
}

// ============================================
// MCQ QUESTION EDITOR
// ============================================

interface MCQEditorProps {
  question: Question;
  onChange: (question: Question) => void;
}

function MCQEditor({ question, onChange }: MCQEditorProps) {
  const options = question.content.options || ["", "", "", ""];
  const correctAnswer = question.content.correctAnswer ?? 0;

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange({
      ...question,
      content: { ...question.content, options: newOptions },
    });
  };

  const addOption = () => {
    onChange({
      ...question,
      content: { ...question.content, options: [...options, ""] },
    });
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    const newCorrect = correctAnswer >= index ? Math.max(0, correctAnswer - 1) : correctAnswer;
    onChange({
      ...question,
      content: {
        ...question.content,
        options: newOptions,
        correctAnswer: Math.min(newCorrect, newOptions.length - 1),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea
          value={question.content.question || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, question: e.target.value },
            })
          }
          placeholder="Enter the question text..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Context (optional)</Label>
        <Input
          value={question.content.context || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, context: e.target.value },
            })
          }
          placeholder="e.g., In a business meeting..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Answer Options</Label>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        </div>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...question,
                    content: { ...question.content, correctAnswer: index },
                  })
                }
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                  correctAnswer === index
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 hover:border-green-300"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </button>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                className="flex-1"
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Click a letter to mark it as the correct answer (currently: {String.fromCharCode(65 + correctAnswer)})
        </p>
      </div>

      <div className="space-y-2">
        <Label>Explanation (optional)</Label>
        <Textarea
          value={question.content.explanation || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, explanation: e.target.value },
            })
          }
          placeholder="Explain why this answer is correct..."
          rows={2}
        />
      </div>
    </div>
  );
}

// ============================================
// WORD FORMATION EDITOR
// ============================================

function WordFormationEditor({ question, onChange }: MCQEditorProps) {
  const options = question.content.options || ["", "", "", ""];
  const correctAnswer = question.content.correctAnswer ?? 0;

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange({
      ...question,
      content: { ...question.content, options: newOptions },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Stem Word</Label>
        <Input
          value={question.content.stemWord || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, stemWord: e.target.value },
            })
          }
          placeholder="e.g., ENVIRONMENT"
          className="font-mono uppercase"
        />
        <p className="text-xs text-muted-foreground">The word students need to transform</p>
      </div>

      <div className="space-y-2">
        <Label>Sentence with Gap</Label>
        <Textarea
          value={question.content.question || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, question: e.target.value },
            })
          }
          placeholder="e.g., Our company is committed to ______ friendly practices."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Context (optional)</Label>
        <Input
          value={question.content.context || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, context: e.target.value },
            })
          }
          placeholder="e.g., In a sustainability report..."
        />
      </div>

      <div className="space-y-2">
        <Label>Answer Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...question,
                    content: { ...question.content, correctAnswer: index },
                  })
                }
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                  correctAnswer === index
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 hover:border-green-300"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </button>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// KEY WORD TRANSFORMATION EDITOR
// ============================================

function KeyWordTransformationEditor({ question, onChange }: MCQEditorProps) {
  const options = question.content.options || ["", "", "", ""];
  const correctAnswer = question.content.correctAnswer ?? 0;

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange({
      ...question,
      content: { ...question.content, options: newOptions },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Original Sentence</Label>
        <Textarea
          value={question.content.originalSentence || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, originalSentence: e.target.value },
            })
          }
          placeholder="e.g., They started the company ten years ago."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Key Word (do not change)</Label>
        <Input
          value={question.content.keyWord || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, keyWord: e.target.value },
            })
          }
          placeholder="e.g., BEEN"
          className="font-mono uppercase"
        />
      </div>

      <div className="space-y-2">
        <Label>Gapped Sentence</Label>
        <Textarea
          value={question.content.gappedSentence || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, gappedSentence: e.target.value },
            })
          }
          placeholder="e.g., The company ______ for ten years."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Answer Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...question,
                    content: { ...question.content, correctAnswer: index },
                  })
                }
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                  correctAnswer === index
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 hover:border-green-300"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </button>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// IMAGE BASED EDITOR
// ============================================

function ImageBasedEditor({ question, onChange }: MCQEditorProps) {
  const options = question.content.options || ["", "", "", ""];
  const correctAnswer = question.content.correctAnswer ?? 0;

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange({
      ...question,
      content: { ...question.content, options: newOptions },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          value={question.content.imageUrl || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, imageUrl: e.target.value },
            })
          }
          placeholder="https://..."
        />
        {question.content.imageUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border">
            <img
              src={question.content.imageUrl}
              alt={question.content.imageAlt || "Question image"}
              className="w-full h-40 object-cover"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Image Alt Text</Label>
        <Input
          value={question.content.imageAlt || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, imageAlt: e.target.value },
            })
          }
          placeholder="Description of the image"
        />
      </div>

      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea
          value={question.content.question || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, question: e.target.value },
            })
          }
          placeholder="What does this image show?"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Context (optional)</Label>
        <Input
          value={question.content.context || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, context: e.target.value },
            })
          }
          placeholder="e.g., Look at the product label..."
        />
      </div>

      <div className="space-y-2">
        <Label>Answer Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...question,
                    content: { ...question.content, correctAnswer: index },
                  })
                }
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                  correctAnswer === index
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 hover:border-green-300"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </button>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// READING COMPREHENSION EDITOR
// ============================================

function ReadingComprehensionEditor({ question, onChange }: MCQEditorProps) {
  const subQuestions = question.content.questions || [];

  const updateSubQuestion = (
    index: number,
    field: "question" | "options" | "correctAnswer",
    value: string | string[] | number
  ) => {
    const newQuestions = [...subQuestions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    onChange({
      ...question,
      content: { ...question.content, questions: newQuestions },
    });
  };

  const addSubQuestion = () => {
    onChange({
      ...question,
      content: {
        ...question.content,
        questions: [
          ...subQuestions,
          { question: "", options: ["", "", "", ""], correctAnswer: 0 },
        ],
      },
    });
  };

  const removeSubQuestion = (index: number) => {
    onChange({
      ...question,
      content: {
        ...question.content,
        questions: subQuestions.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Reading Passage</Label>
        <Textarea
          value={question.content.passage || ""}
          onChange={(e) =>
            onChange({
              ...question,
              content: { ...question.content, passage: e.target.value },
            })
          }
          placeholder="Enter the reading passage here..."
          rows={8}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Comprehension Questions ({subQuestions.length})</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSubQuestion}>
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>

        {subQuestions.map((subQ, qIndex) => (
          <Card key={qIndex} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium">Question {qIndex + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSubQuestion(qIndex)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <Input
                value={subQ.question}
                onChange={(e) => updateSubQuestion(qIndex, "question", e.target.value)}
                placeholder="Enter the question..."
              />

              <div className="space-y-2">
                {subQ.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSubQuestion(qIndex, "correctAnswer", optIndex)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                        subQ.correctAnswer === optIndex
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 hover:border-green-300"
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...subQ.options];
                        newOpts[optIndex] = e.target.value;
                        updateSubQuestion(qIndex, "options", newOpts);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// QUESTION EDITOR
// ============================================

interface QuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function QuestionEditor({ question, onChange, onDelete, onDuplicate }: QuestionEditorProps) {
  const renderContentEditor = () => {
    switch (question.type) {
      case "grammar_mcq":
      case "vocabulary_mcq":
      case "multiple_choice_cloze":
        return <MCQEditor question={question} onChange={onChange} />;
      case "word_formation":
        return <WordFormationEditor question={question} onChange={onChange} />;
      case "key_word_transformation":
        return <KeyWordTransformationEditor question={question} onChange={onChange} />;
      case "image_based":
        return <ImageBasedEditor question={question} onChange={onChange} />;
      case "reading_comprehension":
        return <ReadingComprehensionEditor question={question} onChange={onChange} />;
      case "open_cloze":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sentence with Gap</Label>
              <Textarea
                value={question.content.sentence || ""}
                onChange={(e) =>
                  onChange({
                    ...question,
                    content: { ...question.content, sentence: e.target.value },
                  })
                }
                placeholder="e.g., She has been working ______ this company for five years."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Correct Answers (one per line)</Label>
              <Textarea
                value={(question.content.correctAnswers || []).join("\n")}
                onChange={(e) =>
                  onChange({
                    ...question,
                    content: {
                      ...question.content,
                      correctAnswers: e.target.value.split("\n").filter(Boolean),
                    },
                  })
                }
                placeholder="at&#10;for"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Enter all acceptable answers, one per line
              </p>
            </div>
          </div>
        );
      default:
        return <MCQEditor question={question} onChange={onChange} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Question</h3>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-1" />
            Duplicate
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Type and Level */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Question Type</Label>
          <Select
            value={question.type}
            onValueChange={(value: QuestionType) =>
              onChange({ ...question, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {type.icon}
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>CEFR Level</Label>
          <Select
            value={question.level}
            onValueChange={(value: CEFRLevel) =>
              onChange({ ...question, level: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CEFR_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  <Badge className={LEVEL_COLORS[level]}>{level}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Editor */}
      {renderContentEditor()}

      {/* Metadata */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium">Metadata</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              value={question.metadata.topic}
              onChange={(e) =>
                onChange({
                  ...question,
                  metadata: { ...question.metadata, topic: e.target.value },
                })
              }
              placeholder="e.g., present_perfect, business_vocabulary"
            />
          </div>
          <div className="space-y-2">
            <Label>Difficulty (0-1)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={question.metadata.difficulty}
              onChange={(e) =>
                onChange({
                  ...question,
                  metadata: {
                    ...question.metadata,
                    difficulty: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input
            value={question.metadata.tags.join(", ")}
            onChange={(e) =>
              onChange({
                ...question,
                metadata: {
                  ...question.metadata,
                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                },
              })
            }
            placeholder="grammar, tenses, business"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// VISUAL EDITOR
// ============================================

interface VisualEditorProps {
  test: PlacementTest | null;
  onSave: (updates: {
    title?: string;
    slug?: string;
    companyName?: string;
    config?: PlacementTestConfig;
    status?: "draft" | "published";
  }) => Promise<void>;
  isSaving: boolean;
}

function VisualEditor({ test, onSave, isSaving }: VisualEditorProps) {
  const [config, setConfig] = useState<PlacementTestConfig | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Update local state when test changes
  useEffect(() => {
    if (test) {
      setConfig(test.config);
      setTitle(test.title);
      setSlug(test.slug);
      setCompanyName(test.companyName || "");
      setJsonText(JSON.stringify(test.config, null, 2));
      setJsonError(null);
      setHasChanges(false);
      setSelectedQuestionIndex(null);
    } else {
      setConfig(null);
      setTitle("");
      setSlug("");
      setCompanyName("");
      setJsonText("");
    }
  }, [test]);

  // Sync JSON when config changes
  useEffect(() => {
    if (config && viewMode === "visual") {
      setJsonText(JSON.stringify(config, null, 2));
    }
  }, [config, viewMode]);

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    setHasChanges(true);
    try {
      const parsed = JSON.parse(value);
      setConfig(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const updateQuestion = (index: number, question: Question) => {
    if (!config) return;
    const newQuestions = [...config.questions];
    newQuestions[index] = question;
    setConfig({ ...config, questions: newQuestions });
    setHasChanges(true);
  };

  const deleteQuestion = (index: number) => {
    if (!config) return;
    if (!confirm("Are you sure you want to delete this question?")) return;
    const newQuestions = config.questions.filter((_, i) => i !== index);
    setConfig({ ...config, questions: newQuestions, totalQuestions: newQuestions.length });
    setSelectedQuestionIndex(null);
    setHasChanges(true);
  };

  const duplicateQuestion = (index: number) => {
    if (!config) return;
    const questionToCopy = config.questions[index];
    const newQuestion: Question = {
      ...JSON.parse(JSON.stringify(questionToCopy)),
      id: `q-${Date.now()}`,
    };
    const newQuestions = [
      ...config.questions.slice(0, index + 1),
      newQuestion,
      ...config.questions.slice(index + 1),
    ];
    setConfig({ ...config, questions: newQuestions, totalQuestions: newQuestions.length });
    setSelectedQuestionIndex(index + 1);
    setHasChanges(true);
  };

  const addQuestion = () => {
    if (!config) return;
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: "grammar_mcq",
      level: "B1",
      content: {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
      metadata: {
        topic: "",
        difficulty: 0.5,
        tags: [],
      },
    };
    setConfig({
      ...config,
      questions: [...config.questions, newQuestion],
      totalQuestions: config.questions.length + 1,
    });
    setSelectedQuestionIndex(config.questions.length);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!config || jsonError) {
      toast.error("Please fix errors before saving");
      return;
    }

    try {
      await onSave({
        title,
        slug,
        companyName: companyName || undefined,
        config,
      });
      setHasChanges(false);
      toast.success("Test saved successfully");
    } catch (error) {
      toast.error("Failed to save test");
      console.error(error);
    }
  };

  const handlePublish = async () => {
    if (!test || !config) return;

    try {
      await onSave({
        title,
        slug,
        companyName: companyName || undefined,
        config,
        status: "published",
      });
      setHasChanges(false);
      toast.success("Test published successfully");
    } catch (error) {
      toast.error("Failed to publish test");
      console.error(error);
    }
  };

  if (!test || !config) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-muted-foreground">
          <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a test to edit or create a new one</p>
        </div>
      </div>
    );
  }

  const selectedQuestion =
    selectedQuestionIndex !== null ? config.questions[selectedQuestionIndex] : null;

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold">{test.title}</span>
            <Badge variant="outline">{config.questions.length} questions</Badge>
          </div>
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "visual" | "json")}>
            <TabsList className="h-8">
              <TabsTrigger value="visual" className="text-xs px-3 h-7">
                Visual
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs px-3 h-7">
                JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/tests/${test.slug}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !!jsonError}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
          {test.status === "draft" && (
            <Button size="sm" onClick={handlePublish} disabled={isSaving || !!jsonError}>
              <Send className="h-4 w-4 mr-1" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Metadata fields */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b bg-gray-50">
        <div className="space-y-1">
          <Label htmlFor="title" className="text-xs">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Test title"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug" className="text-xs">
            Slug (URL path)
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setHasChanges(true);
            }}
            placeholder="test-slug"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="companyName" className="text-xs">
            Company Name
          </Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Company name (optional)"
          />
        </div>
      </div>

      {viewMode === "json" ? (
        /* JSON Editor Mode */
        <>
          {jsonError && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-sm border-b">
              <X className="h-4 w-4" />
              <span>JSON Error: {jsonError}</span>
            </div>
          )}
          {!jsonError && jsonText && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm border-b">
              <Check className="h-4 w-4" />
              <span>Valid JSON</span>
            </div>
          )}
          <div className="flex-1 p-4 overflow-hidden">
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full h-full font-mono text-sm p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Test configuration JSON..."
              spellCheck={false}
            />
          </div>
        </>
      ) : (
        /* Visual Editor Mode */
        <div className="flex-1 flex overflow-hidden">
          {/* Question List */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-sm font-medium">Questions</span>
              <Button size="sm" variant="outline" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1">
                {config.questions.map((q, index) => (
                  <QuestionListItem
                    key={q.id}
                    question={q}
                    index={index}
                    isSelected={selectedQuestionIndex === index}
                    onSelect={() => setSelectedQuestionIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Question Editor */}
          <div className="flex-1 overflow-hidden">
            {selectedQuestion ? (
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  <QuestionEditor
                    question={selectedQuestion}
                    onChange={(q) => updateQuestion(selectedQuestionIndex!, q)}
                    onDelete={() => deleteQuestion(selectedQuestionIndex!)}
                    onDuplicate={() => duplicateQuestion(selectedQuestionIndex!)}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a question to edit</p>
                  <p className="text-sm mt-1">or click &quot;Add&quot; to create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// CREATE TEST DIALOG
// ============================================

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateTestDialog({ open, onOpenChange }: CreateTestDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTest = useMutation(api.placementTests.create);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!slug.trim()) {
      toast.error("Please enter a slug");
      return;
    }

    setIsSubmitting(true);

    try {
      const defaultConfig: PlacementTestConfig = {
        id: slug,
        title: title,
        company: {
          name: companyName || "Company",
          industry: "General",
          primaryColor: "#3B82F6",
          secondaryColor: "#6B7280",
        },
        totalQuestions: 0,
        questions: [],
        levelDescriptions: {
          A1: {
            title: "Beginner (A1)",
            description: "Basic understanding of everyday expressions.",
            recommendations: ["Start with foundational courses"],
          },
          A2: {
            title: "Elementary (A2)",
            description: "Can communicate in simple, routine tasks.",
            recommendations: ["Build confidence with intermediate vocabulary"],
          },
          B1: {
            title: "Intermediate (B1)",
            description: "Can deal with most situations while traveling.",
            recommendations: ["Develop business writing skills"],
          },
          B2: {
            title: "Upper-Intermediate (B2)",
            description: "Can interact with fluency and spontaneity.",
            recommendations: ["Focus on advanced communication"],
          },
          C1: {
            title: "Advanced (C1)",
            description: "Can express yourself fluently and spontaneously.",
            recommendations: ["Refine presentation skills"],
          },
        },
      };

      await createTest({
        title: title.trim(),
        slug: slug.trim(),
        companyName: companyName.trim() || undefined,
        config: defaultConfig,
        status: "draft",
      });

      toast.success("Test created successfully!");
      onOpenChange(false);
      setTitle("");
      setSlug("");
      setCompanyName("");
    } catch (error) {
      toast.error((error as Error).message || "Failed to create test");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    const autoSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(autoSlug);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Placement Test</DialogTitle>
          <DialogDescription>
            Create a new placement test. You can add questions after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Test Title</Label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Cambridge English Placement Test"
            />
          </div>

          <div className="space-y-2">
            <Label>URL Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., company-name"
            />
            <p className="text-xs text-muted-foreground">
              Test will be available at: /tests/{slug || "your-slug"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Company Name (optional)</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Lavera"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Test"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AdminEntryTestsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<Id<"placementTests"> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all tests
  const tests = useQuery(api.placementTests.list, {});

  // Fetch selected test
  const selectedTest = useQuery(
    api.placementTests.getById,
    selectedTestId ? { id: selectedTestId } : "skip"
  );

  // Mutations
  const updateTest = useMutation(api.placementTests.update);
  const deleteTest = useMutation(api.placementTests.remove);

  // Auto-select first test if none selected
  useEffect(() => {
    if (tests && tests.length > 0 && !selectedTestId) {
      setSelectedTestId(tests[0]._id);
    }
  }, [tests, selectedTestId]);

  const handleSave = async (updates: {
    title?: string;
    slug?: string;
    companyName?: string;
    config?: PlacementTestConfig;
    status?: "draft" | "published";
  }) => {
    if (!selectedTestId) return;

    setIsSaving(true);
    try {
      await updateTest({
        id: selectedTestId,
        ...updates,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (testId: Id<"placementTests">) => {
    if (!confirm("Are you sure you want to delete this test?")) return;

    try {
      await deleteTest({ id: testId });
      if (selectedTestId === testId) {
        setSelectedTestId(null);
      }
      toast.success("Test deleted");
    } catch (error) {
      toast.error("Failed to delete test");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-7 w-7" />
            Placement Tests
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage Cambridge English placement tests
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Test
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar - Test list */}
        <div className="w-72 flex-shrink-0 overflow-y-auto">
          <div className="space-y-3">
            {tests === undefined ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-32 animate-pulse bg-gray-100" />
                ))}
              </>
            ) : tests.length === 0 ? (
              <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                <ClipboardCheck className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-4">No placement tests yet</p>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Test
                </Button>
              </div>
            ) : (
              tests.map((test) => (
                <TestCard
                  key={test._id}
                  test={test as PlacementTest}
                  isSelected={selectedTestId === test._id}
                  onSelect={() => setSelectedTestId(test._id)}
                  onDelete={() => handleDelete(test._id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Main editor */}
        <VisualEditor
          test={selectedTest as PlacementTest | null}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>

      {/* Create dialog */}
      <CreateTestDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
