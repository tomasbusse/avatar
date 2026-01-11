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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FileQuestion,
  Check,
  X,
  Trash2,
  Eye,
  Sparkles,
  Loader2,
  ChevronLeft,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Video,
  Volume2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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
type CurationStatus = "pending" | "approved" | "rejected";
type DeliveryMode = "text" | "audio" | "avatar";

const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  text: "Text",
  audio: "Audio (TTS)",
  avatar: "Video Avatar",
};

const DELIVERY_MODE_DESCRIPTIONS: Record<DeliveryMode, string> = {
  text: "Student reads the question on screen",
  audio: "Question is played as audio (TTS)",
  avatar: "AI avatar presents the question (Beyond Presence)",
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  reading_comprehension: "Reading Comprehension",
  grammar_mcq: "Grammar (MCQ)",
  grammar_fill_blank: "Grammar (Fill Blank)",
  vocabulary_mcq: "Vocabulary (MCQ)",
  vocabulary_matching: "Vocabulary (Matching)",
  listening_mcq: "Listening (MCQ)",
  listening_fill_blank: "Listening (Fill Blank)",
  writing_prompt: "Writing Prompt",
  speaking_prompt: "Speaking Prompt",
};

// ============================================
// QUESTION ROW COMPONENT
// ============================================

interface QuestionRowProps {
  question: {
    _id: Id<"entryTestQuestionBank">;
    type: QuestionType;
    cefrLevel: CEFRLevel;
    tags: string[];
    content: Record<string, unknown>;
    curationStatus: CurationStatus;
    generatedBy: "ai" | "manual";
    usageCount: number;
    createdAt: number;
  };
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

function QuestionRow({
  question,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onDelete,
  onPreview,
}: QuestionRowProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const statusIcons = {
    pending: <Clock className="h-3 w-3" />,
    approved: <CheckCircle2 className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
  };

  const levelColors: Record<CEFRLevel, string> = {
    A1: "bg-green-100 text-green-800",
    A2: "bg-lime-100 text-lime-800",
    B1: "bg-yellow-100 text-yellow-800",
    B2: "bg-orange-100 text-orange-800",
    C1: "bg-red-100 text-red-800",
    C2: "bg-purple-100 text-purple-800",
  };

  // Extract preview text from content
  const getPreviewText = () => {
    const content = question.content as Record<string, unknown>;
    if (content.question) return String(content.question).slice(0, 100);
    if (content.passage) return String(content.passage).slice(0, 100);
    if (content.sentence) return String(content.sentence).slice(0, 100);
    if (content.prompt) return String(content.prompt).slice(0, 100);
    return "No preview available";
  };

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(checked as boolean)}
        />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono text-xs">
          {QUESTION_TYPE_LABELS[question.type]}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={levelColors[question.cefrLevel]}>
          {question.cefrLevel}
        </Badge>
      </TableCell>
      <TableCell className="max-w-md">
        <p className="text-sm truncate">{getPreviewText()}</p>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={statusColors[question.curationStatus]}>
          <span className="flex items-center gap-1">
            {statusIcons[question.curationStatus]}
            {question.curationStatus}
          </span>
        </Badge>
      </TableCell>
      <TableCell>
        {question.generatedBy === "ai" ? (
          <Sparkles className="h-4 w-4 text-purple-500" />
        ) : (
          <span className="text-xs text-muted-foreground">Manual</span>
        )}
      </TableCell>
      <TableCell className="text-center">{question.usageCount}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onPreview}>
            <Eye className="h-4 w-4" />
          </Button>
          {question.curationStatus === "pending" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onApprove}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onReject}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
            disabled={question.usageCount > 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================
// QUESTION PREVIEW/EDIT DIALOG
// ============================================

interface QuestionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: {
    _id: Id<"entryTestQuestionBank">;
    type: QuestionType;
    cefrLevel: CEFRLevel;
    tags: string[];
    content: Record<string, unknown>;
    curationStatus: CurationStatus;
    generatedBy: "ai" | "manual";
    generationModel?: string;
    deliveryMode?: DeliveryMode;
  } | null;
  onSave?: () => void;
}

// Render formatted MCQ question
function MCQPreview({ content }: { content: Record<string, unknown> }) {
  const question = String(content.question || content.sentence || "");
  const options = (content.options as string[]) || [];
  const correctAnswer = content.correctAnswer as number;
  const explanation = String(content.explanation || "");
  const grammarPoint = String(content.grammarPoint || "");

  return (
    <div className="space-y-4">
      {grammarPoint && (
        <div className="text-sm text-muted-foreground">
          <strong>Grammar Point:</strong> {grammarPoint}
        </div>
      )}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="font-medium text-lg">{question}</p>
      </div>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border-2 ${
              idx === correctAnswer
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span className="font-mono mr-2">{String.fromCharCode(65 + idx)})</span>
            {opt}
            {idx === correctAnswer && (
              <CheckCircle2 className="inline-block ml-2 h-4 w-4 text-green-600" />
            )}
          </div>
        ))}
      </div>
      {explanation && (
        <div className="p-3 bg-yellow-50 rounded-lg text-sm">
          <strong>Explanation:</strong> {explanation}
        </div>
      )}
    </div>
  );
}

// Render formatted fill-in-the-blank question
function FillBlankPreview({ content }: { content: Record<string, unknown> }) {
  const sentence = String(content.sentence || content.displayText || "");
  const correctAnswers = (content.correctAnswers as string[]) || [String(content.correctAnswer || "")];
  const hint = String(content.hint || "");
  const explanation = String(content.explanation || "");

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="font-medium text-lg">{sentence}</p>
      </div>
      <div className="p-3 bg-green-50 rounded-lg">
        <strong>Correct Answer(s):</strong>{" "}
        {correctAnswers.map((ans, idx) => (
          <Badge key={idx} variant="outline" className="ml-1 bg-green-100">
            {ans}
          </Badge>
        ))}
      </div>
      {hint && (
        <div className="p-3 bg-yellow-50 rounded-lg text-sm">
          <strong>Hint:</strong> {hint}
        </div>
      )}
      {explanation && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <strong>Explanation:</strong> {explanation}
        </div>
      )}
    </div>
  );
}

// Render reading comprehension
function ReadingPreview({ content }: { content: Record<string, unknown> }) {
  const passage = String(content.passage || "");
  const questions = (content.questions as Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>) || [];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{passage}</p>
      </div>
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="border rounded-lg p-4">
            <p className="font-medium mb-2">{qIdx + 1}. {q.question}</p>
            <div className="space-y-1 ml-4">
              {q.options.map((opt, oIdx) => (
                <div
                  key={oIdx}
                  className={`text-sm ${oIdx === q.correctAnswer ? "text-green-700 font-medium" : ""}`}
                >
                  {String.fromCharCode(65 + oIdx)}) {opt}
                  {oIdx === q.correctAnswer && " ✓"}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Render vocabulary matching
function MatchingPreview({ content }: { content: Record<string, unknown> }) {
  const pairs = (content.pairs as Array<{ term: string; match: string }>) || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Terms</Label>
          <div className="space-y-2 mt-2">
            {pairs.map((pair, idx) => (
              <div key={idx} className="p-2 bg-blue-50 rounded border">
                {idx + 1}. {pair.term}
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Matches</Label>
          <div className="space-y-2 mt-2">
            {pairs.map((pair, idx) => (
              <div key={idx} className="p-2 bg-green-50 rounded border">
                {String.fromCharCode(65 + idx)}. {pair.match}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3 bg-yellow-50 rounded-lg text-sm">
        <strong>Correct Matches:</strong>{" "}
        {pairs.map((_, idx) => `${idx + 1}→${String.fromCharCode(65 + idx)}`).join(", ")}
      </div>
    </div>
  );
}

// Render writing/speaking prompt
function PromptPreview({ content, type }: { content: Record<string, unknown>; type: "writing" | "speaking" }) {
  const prompt = String(content.prompt || "");
  const taskType = String(content.taskType || "");
  const requirements = (content.requirements as string[]) || [];
  const rubric = content.rubric as Record<string, string> | undefined;
  const wordCount = content.wordCount as { min?: number; max?: number } | undefined;
  const duration = content.duration as { min?: number; max?: number } | undefined;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="font-medium text-lg">{prompt}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {taskType && <Badge variant="outline">Task: {taskType}</Badge>}
        {wordCount && (
          <Badge variant="outline">
            {wordCount.min}-{wordCount.max} words
          </Badge>
        )}
        {duration && (
          <Badge variant="outline">
            {duration.min}-{duration.max} seconds
          </Badge>
        )}
      </div>
      {requirements.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Requirements</Label>
          <ul className="list-disc list-inside mt-1 text-sm">
            {requirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}
      {rubric && Object.keys(rubric).length > 0 && (
        <div>
          <Label className="text-sm font-medium">Scoring Rubric</Label>
          <div className="grid gap-2 mt-2">
            {Object.entries(rubric).map(([key, value]) => (
              <div key={key} className="p-2 bg-gray-50 rounded text-sm">
                <strong className="capitalize">{key}:</strong> {value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Render listening question (similar to MCQ but with audio context)
function ListeningPreview({ content }: { content: Record<string, unknown> }) {
  const audioText = String(content.audioText || "");
  const audioContext = String(content.audioContext || "");
  const questions = content.questions as Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }> | undefined;

  // Single question format
  if (!questions) {
    return (
      <div className="space-y-4">
        {audioContext && (
          <div className="p-3 bg-purple-50 rounded-lg text-sm">
            <strong>Context:</strong> {audioContext}
          </div>
        )}
        <div className="p-4 bg-gray-100 rounded-lg border-l-4 border-purple-500">
          <Label className="text-xs text-muted-foreground">Audio Script</Label>
          <p className="mt-1 text-sm italic">{audioText}</p>
        </div>
        <MCQPreview content={content} />
      </div>
    );
  }

  // Multiple questions format
  return (
    <div className="space-y-4">
      {audioContext && (
        <div className="p-3 bg-purple-50 rounded-lg text-sm">
          <strong>Context:</strong> {audioContext}
        </div>
      )}
      <div className="p-4 bg-gray-100 rounded-lg border-l-4 border-purple-500">
        <Label className="text-xs text-muted-foreground">Audio Script</Label>
        <p className="mt-1 text-sm italic">{audioText}</p>
      </div>
      {questions.map((q, idx) => (
        <div key={idx} className="border rounded-lg p-4">
          <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
          <div className="space-y-1 ml-4">
            {q.options.map((opt, oIdx) => (
              <div
                key={oIdx}
                className={`text-sm ${oIdx === q.correctAnswer ? "text-green-700 font-medium" : ""}`}
              >
                {String.fromCharCode(65 + oIdx)}) {opt}
                {oIdx === q.correctAnswer && " ✓"}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main preview component that routes to specific type
function QuestionContentPreview({ type, content }: { type: QuestionType; content: Record<string, unknown> }) {
  switch (type) {
    case "grammar_mcq":
    case "vocabulary_mcq":
      return <MCQPreview content={content} />;
    case "grammar_fill_blank":
      return <FillBlankPreview content={content} />;
    case "reading_comprehension":
      return <ReadingPreview content={content} />;
    case "vocabulary_matching":
      return <MatchingPreview content={content} />;
    case "listening_mcq":
    case "listening_fill_blank":
      return <ListeningPreview content={content} />;
    case "writing_prompt":
      return <PromptPreview content={content} type="writing" />;
    case "speaking_prompt":
      return <PromptPreview content={content} type="speaking" />;
    default:
      return (
        <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}

// ============================================
// STUDENT PREVIEW COMPONENTS (Hide answers)
// ============================================

// Student view MCQ - selectable options, no answer revealed
function MCQStudentPreview({ content }: { content: Record<string, unknown> }) {
  const [selected, setSelected] = useState<number | null>(null);
  const question = String(content.question || content.sentence || "");
  const options = (content.options as string[]) || [];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <p className="font-medium text-lg">{question}</p>
      </div>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => setSelected(idx)}
            className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
              selected === idx
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="font-mono mr-3 text-gray-500">{String.fromCharCode(65 + idx)})</span>
            {opt}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="flex justify-end">
          <Button size="sm" disabled>Submit Answer</Button>
        </div>
      )}
    </div>
  );
}

// Student view fill-in-the-blank
function FillBlankStudentPreview({ content }: { content: Record<string, unknown> }) {
  const [answer, setAnswer] = useState("");
  const sentence = String(content.sentence || content.displayText || "");
  const hint = String(content.hint || "");

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <p className="font-medium text-lg">{sentence}</p>
      </div>
      {hint && (
        <div className="p-2 bg-yellow-50 rounded text-sm text-yellow-800">
          💡 Hint: {hint}
        </div>
      )}
      <div>
        <Label>Your Answer</Label>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="mt-1"
        />
      </div>
      {answer && (
        <div className="flex justify-end">
          <Button size="sm" disabled>Submit Answer</Button>
        </div>
      )}
    </div>
  );
}

// Student view reading comprehension
function ReadingStudentPreview({ content }: { content: Record<string, unknown> }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const passage = String(content.passage || "");
  const questions = (content.questions as Array<{
    question: string;
    options: string[];
  }>) || [];

  const selectAnswer = (qIdx: number, oIdx: number) => {
    setSelectedAnswers({ ...selectedAnswers, [qIdx]: oIdx });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-gray-50">
        <Label className="text-sm text-muted-foreground mb-2 block">Reading Passage</Label>
        <div className="max-h-64 overflow-y-auto">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{passage}</p>
        </div>
      </Card>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <Card key={qIdx} className="p-4">
            <p className="font-medium mb-3">{qIdx + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => selectAnswer(qIdx, oIdx)}
                  className={`w-full p-2 rounded border text-left text-sm transition-colors ${
                    selectedAnswers[qIdx] === oIdx
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-mono mr-2 text-gray-500">{String.fromCharCode(65 + oIdx)})</span>
                  {opt}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Student view vocabulary matching - drag and drop style
function MatchingStudentPreview({ content }: { content: Record<string, unknown> }) {
  const [matches, setMatches] = useState<Record<number, number | null>>({});
  const pairs = (content.pairs as Array<{ term: string; match: string }>) || [];
  const instructions = String(content.instructions || "Match the words with their definitions");

  // Shuffle the matches for display
  const shuffledMatchIndices = Array.from({ length: pairs.length }, (_, i) => i).sort(() => Math.random() - 0.5);

  const selectMatch = (termIdx: number, matchIdx: number) => {
    setMatches({ ...matches, [termIdx]: matchIdx });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{instructions}</p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium mb-2 block">Terms</Label>
          <div className="space-y-2">
            {pairs.map((pair, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-2 ${
                  matches[idx] !== undefined ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <span className="font-mono mr-2">{idx + 1}.</span>
                {pair.term}
                {matches[idx] !== undefined && (
                  <span className="ml-2 text-blue-600">→ {String.fromCharCode(65 + matches[idx]!)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Definitions (click to match)</Label>
          <div className="space-y-2">
            {shuffledMatchIndices.map((originalIdx, displayIdx) => (
              <button
                key={displayIdx}
                onClick={() => {
                  // Find first unmatched term
                  const unmatchedTerm = pairs.findIndex((_, i) => matches[i] === undefined);
                  if (unmatchedTerm !== -1) {
                    selectMatch(unmatchedTerm, originalIdx);
                  }
                }}
                className="w-full p-3 rounded-lg border-2 border-gray-200 text-left hover:border-gray-300 transition-colors"
              >
                <span className="font-mono mr-2">{String.fromCharCode(65 + originalIdx)}.</span>
                {pairs[originalIdx].match}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Student view listening question
function ListeningStudentPreview({ content }: { content: Record<string, unknown> }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContext = String(content.audioContext || "");

  return (
    <div className="space-y-4">
      {audioContext && (
        <div className="p-3 bg-purple-50 rounded-lg text-sm">
          <strong>Context:</strong> {audioContext}
        </div>
      )}

      <Card className="p-6 text-center bg-gray-50">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex gap-1">
                <div className="w-1 h-6 bg-purple-500 animate-pulse" />
                <div className="w-1 h-6 bg-purple-500 animate-pulse delay-75" />
                <div className="w-1 h-6 bg-purple-500 animate-pulse delay-150" />
              </div>
            ) : (
              <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsPlaying(!isPlaying)}
          className="mx-auto"
        >
          {isPlaying ? "Pause Audio" : "Play Audio"}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Click to listen to the audio
        </p>
      </Card>

      <MCQStudentPreview content={content} />
    </div>
  );
}

// Student view writing prompt
function WritingStudentPreview({ content }: { content: Record<string, unknown> }) {
  const [text, setText] = useState("");
  const prompt = String(content.prompt || "");
  const taskType = String(content.taskType || "");
  const requirements = (content.requirements as string[]) || [];
  const wordCount = content.wordCount as { min?: number; max?: number } | undefined;

  const currentWordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-center gap-2 mb-2">
          {taskType && <Badge variant="outline">{taskType}</Badge>}
          {wordCount && (
            <Badge variant="outline">{wordCount.min}-{wordCount.max} words</Badge>
          )}
        </div>
        <p className="font-medium">{prompt}</p>
      </Card>

      {requirements.length > 0 && (
        <div className="p-3 bg-yellow-50 rounded-lg text-sm">
          <strong>Requirements:</strong>
          <ul className="list-disc list-inside mt-1">
            {requirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-1">
          <Label>Your Response</Label>
          <span className={`text-sm ${
            wordCount && currentWordCount >= (wordCount.min || 0) ? "text-green-600" : "text-muted-foreground"
          }`}>
            {currentWordCount} words
          </span>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px]"
          placeholder="Start writing your response here..."
        />
      </div>
    </div>
  );
}

// Student view speaking prompt
function SpeakingStudentPreview({ content }: { content: Record<string, unknown> }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const prompt = String(content.prompt || "");
  const taskType = String(content.taskType || "");
  const duration = content.duration as { min?: number; max?: number } | undefined;
  const followUpQuestions = (content.followUpQuestions as string[]) || [];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-center gap-2 mb-2">
          {taskType && <Badge variant="outline">{taskType}</Badge>}
          {duration && (
            <Badge variant="outline">{duration.min}-{duration.max} seconds</Badge>
          )}
        </div>
        <p className="font-medium">{prompt}</p>
      </Card>

      {followUpQuestions.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <strong>Possible follow-up questions:</strong>
          <ul className="list-disc list-inside mt-1">
            {followUpQuestions.map((q, idx) => (
              <li key={idx}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <Card className="p-6 text-center">
        <div className="mb-4">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            isRecording ? "bg-red-100 animate-pulse" : "bg-gray-100"
          }`}>
            <svg
              className={`w-10 h-10 ${isRecording ? "text-red-500" : "text-gray-400"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          {isRecording && (
            <p className="text-lg font-mono mt-2 text-red-600">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
            </p>
          )}
        </div>
        <Button
          variant={isRecording ? "destructive" : "default"}
          onClick={() => {
            setIsRecording(!isRecording);
            if (!isRecording) setRecordingTime(0);
          }}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          {isRecording ? "Recording in progress..." : "Click to start speaking"}
        </p>
      </Card>
    </div>
  );
}

// Student preview router
function QuestionStudentPreview({ type, content }: { type: QuestionType; content: Record<string, unknown> }) {
  switch (type) {
    case "grammar_mcq":
    case "vocabulary_mcq":
      return <MCQStudentPreview content={content} />;
    case "grammar_fill_blank":
    case "listening_fill_blank":
      return <FillBlankStudentPreview content={content} />;
    case "reading_comprehension":
      return <ReadingStudentPreview content={content} />;
    case "vocabulary_matching":
      return <MatchingStudentPreview content={content} />;
    case "listening_mcq":
      return <ListeningStudentPreview content={content} />;
    case "writing_prompt":
      return <WritingStudentPreview content={content} />;
    case "speaking_prompt":
      return <SpeakingStudentPreview content={content} />;
    default:
      return <MCQStudentPreview content={content} />;
  }
}

// Edit form for MCQ questions
function MCQEditForm({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  const question = String(content.question || content.sentence || "");
  const options = (content.options as string[]) || ["", "", "", ""];
  const correctAnswer = (content.correctAnswer as number) ?? 0;
  const explanation = String(content.explanation || "");
  const grammarPoint = String(content.grammarPoint || "");

  const updateField = (field: string, value: unknown) => {
    onChange({ ...content, [field]: value });
  };

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    onChange({ ...content, options: newOptions });
  };

  return (
    <div className="space-y-4">
      {content.grammarPoint !== undefined && (
        <div>
          <Label>Grammar Point</Label>
          <Input
            value={grammarPoint}
            onChange={(e) => updateField("grammarPoint", e.target.value)}
            className="mt-1"
          />
        </div>
      )}
      <div>
        <Label>Question / Sentence</Label>
        <Textarea
          value={question}
          onChange={(e) => updateField(content.question ? "question" : "sentence", e.target.value)}
          className="mt-1"
          rows={3}
        />
      </div>
      <div>
        <Label>Options</Label>
        <div className="space-y-2 mt-1">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono w-6">{String.fromCharCode(65 + idx)})</span>
              <Input
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant={idx === correctAnswer ? "default" : "outline"}
                size="sm"
                onClick={() => updateField("correctAnswer", idx)}
              >
                {idx === correctAnswer ? "✓ Correct" : "Set Correct"}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Explanation</Label>
        <Textarea
          value={explanation}
          onChange={(e) => updateField("explanation", e.target.value)}
          className="mt-1"
          rows={2}
          placeholder="Explain why this is the correct answer..."
        />
      </div>
    </div>
  );
}

// Edit form for fill-in-the-blank questions
function FillBlankEditForm({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  const sentence = String(content.sentence || content.displayText || "");
  const correctAnswers = (content.correctAnswers as string[]) || [String(content.correctAnswer || "")];
  const hint = String(content.hint || "");
  const explanation = String(content.explanation || "");

  const updateField = (field: string, value: unknown) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Sentence (use _____ for blanks)</Label>
        <Textarea
          value={sentence}
          onChange={(e) => updateField(content.sentence ? "sentence" : "displayText", e.target.value)}
          className="mt-1"
          rows={3}
        />
      </div>
      <div>
        <Label>Correct Answers (comma-separated for multiple acceptable answers)</Label>
        <Input
          value={correctAnswers.join(", ")}
          onChange={(e) => updateField("correctAnswers", e.target.value.split(",").map((s) => s.trim()))}
          className="mt-1"
        />
      </div>
      <div>
        <Label>Hint (optional)</Label>
        <Input
          value={hint}
          onChange={(e) => updateField("hint", e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label>Explanation</Label>
        <Textarea
          value={explanation}
          onChange={(e) => updateField("explanation", e.target.value)}
          className="mt-1"
          rows={2}
        />
      </div>
    </div>
  );
}

// Edit form for reading comprehension
function ReadingEditForm({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  const passage = String(content.passage || "");
  const questions = (content.questions as Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>) || [];
  const vocabulary = (content.vocabulary as string[]) || [];

  const updateField = (field: string, value: unknown) => {
    onChange({ ...content, [field]: value });
  };

  const updateQuestion = (idx: number, field: string, value: unknown) => {
    const newQuestions = [...questions];
    newQuestions[idx] = { ...newQuestions[idx], [field]: value };
    onChange({ ...content, questions: newQuestions });
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[qIdx].options];
    newOptions[oIdx] = value;
    newQuestions[qIdx] = { ...newQuestions[qIdx], options: newOptions };
    onChange({ ...content, questions: newQuestions });
  };

  const addQuestion = () => {
    onChange({
      ...content,
      questions: [...questions, { question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" }],
    });
  };

  const removeQuestion = (idx: number) => {
    onChange({ ...content, questions: questions.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Reading Passage</Label>
        <Textarea
          value={passage}
          onChange={(e) => updateField("passage", e.target.value)}
          className="mt-1"
          rows={6}
          placeholder="Enter the reading passage text..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Comprehension Questions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </div>
        <div className="space-y-4">
          {questions.map((q, qIdx) => (
            <Card key={qIdx} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Label className="text-sm font-medium">Question {qIdx + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-red-500 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                placeholder="Enter question..."
                className="mb-3"
              />
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <span className="font-mono w-6 text-sm">{String.fromCharCode(65 + oIdx)})</span>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant={oIdx === q.correctAnswer ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateQuestion(qIdx, "correctAnswer", oIdx)}
                      className="w-20"
                    >
                      {oIdx === q.correctAnswer ? "✓" : "Correct"}
                    </Button>
                  </div>
                ))}
              </div>
              <Input
                value={q.explanation || ""}
                onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                placeholder="Explanation (optional)..."
                className="mt-3"
              />
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Label>Key Vocabulary (comma-separated)</Label>
        <Input
          value={vocabulary.join(", ")}
          onChange={(e) => updateField("vocabulary", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          className="mt-1"
          placeholder="word1, word2, word3"
        />
      </div>
    </div>
  );
}

// Edit form for vocabulary matching
function MatchingEditForm({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  const instructions = String(content.instructions || "Match the words with their definitions");
  const pairs = (content.pairs as Array<{ term: string; match: string }>) || [];
  const topic = String(content.topic || "");

  const updateField = (field: string, value: unknown) => {
    onChange({ ...content, [field]: value });
  };

  const updatePair = (idx: number, field: "term" | "match", value: string) => {
    const newPairs = [...pairs];
    newPairs[idx] = { ...newPairs[idx], [field]: value };
    onChange({ ...content, pairs: newPairs });
  };

  const addPair = () => {
    onChange({ ...content, pairs: [...pairs, { term: "", match: "" }] });
  };

  const removePair = (idx: number) => {
    onChange({ ...content, pairs: pairs.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Instructions</Label>
        <Input
          value={instructions}
          onChange={(e) => updateField("instructions", e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label>Topic</Label>
        <Input
          value={topic}
          onChange={(e) => updateField("topic", e.target.value)}
          className="mt-1"
          placeholder="e.g., Business vocabulary"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Matching Pairs</Label>
          <Button type="button" variant="outline" size="sm" onClick={addPair}>
            <Plus className="h-4 w-4 mr-1" /> Add Pair
          </Button>
        </div>
        <div className="space-y-2">
          {pairs.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono w-6 text-sm">{idx + 1}.</span>
              <Input
                value={pair.term}
                onChange={(e) => updatePair(idx, "term", e.target.value)}
                className="flex-1"
                placeholder="Term"
              />
              <span className="text-muted-foreground">→</span>
              <Input
                value={pair.match}
                onChange={(e) => updatePair(idx, "match", e.target.value)}
                className="flex-1"
                placeholder="Definition/Match"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePair(idx)}
                className="text-red-500 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Edit form for writing/speaking prompts
function PromptEditForm({
  content,
  onChange,
  type,
}: {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  type: "writing" | "speaking";
}) {
  const prompt = String(content.prompt || "");
  const taskType = String(content.taskType || "");
  const requirements = (content.requirements as string[]) || [];
  const rubric = (content.rubric as Record<string, string>) || {};
  const wordCount = (content.wordCount as { min?: number; max?: number }) || { min: 100, max: 150 };
  const duration = (content.duration as { min?: number; max?: number }) || { min: 60, max: 120 };
  const followUpQuestions = (content.followUpQuestions as string[]) || [];

  const updateField = (field: string, value: unknown) => {
    onChange({ ...content, [field]: value });
  };

  const updateRubric = (key: string, value: string) => {
    onChange({ ...content, rubric: { ...rubric, [key]: value } });
  };

  const rubricFields = type === "writing"
    ? ["content", "organization", "language", "accuracy"]
    : ["fluency", "pronunciation", "vocabulary", "grammar", "interaction"];

  return (
    <div className="space-y-4">
      <div>
        <Label>Prompt</Label>
        <Textarea
          value={prompt}
          onChange={(e) => updateField("prompt", e.target.value)}
          className="mt-1"
          rows={4}
          placeholder={`Enter the ${type} task prompt...`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Task Type</Label>
          <Select value={taskType} onValueChange={(v) => updateField("taskType", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {type === "writing" ? (
                <>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="roleplay">Role Play</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {type === "writing" ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Min Words</Label>
              <Input
                type="number"
                value={wordCount.min || 100}
                onChange={(e) => updateField("wordCount", { ...wordCount, min: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max Words</Label>
              <Input
                type="number"
                value={wordCount.max || 150}
                onChange={(e) => updateField("wordCount", { ...wordCount, max: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Min Duration (sec)</Label>
              <Input
                type="number"
                value={duration.min || 60}
                onChange={(e) => updateField("duration", { ...duration, min: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max Duration (sec)</Label>
              <Input
                type="number"
                value={duration.max || 120}
                onChange={(e) => updateField("duration", { ...duration, max: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <Label>Requirements (one per line)</Label>
        <Textarea
          value={requirements.join("\n")}
          onChange={(e) => updateField("requirements", e.target.value.split("\n").filter(Boolean))}
          className="mt-1"
          rows={3}
          placeholder="• Include a greeting&#10;• Mention three key points&#10;• Use formal language"
        />
      </div>

      {type === "speaking" && (
        <div>
          <Label>Follow-up Questions (one per line)</Label>
          <Textarea
            value={followUpQuestions.join("\n")}
            onChange={(e) => updateField("followUpQuestions", e.target.value.split("\n").filter(Boolean))}
            className="mt-1"
            rows={3}
            placeholder="Can you elaborate on that?&#10;What do you think about...?"
          />
        </div>
      )}

      <div>
        <Label className="mb-2 block">Scoring Rubric</Label>
        <div className="grid gap-3">
          {rubricFields.map((field) => (
            <div key={field} className="flex items-start gap-2">
              <Label className="w-28 pt-2 capitalize text-sm">{field}</Label>
              <Input
                value={rubric[field] || ""}
                onChange={(e) => updateRubric(field, e.target.value)}
                className="flex-1"
                placeholder={`Criteria for ${field}...`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Edit form for listening questions
function ListeningEditForm({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  const audioText = String(content.audioText || "");
  const audioContext = String(content.audioContext || "");
  const questions = (content.questions as Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    timestamp?: string;
  }>) || [];

  // For single question format
  const singleQuestion = String(content.question || content.sentence || "");
  const singleOptions = (content.options as string[]) || [];
  const singleCorrectAnswer = (content.correctAnswer as number) ?? 0;

  const isMultiQuestion = questions.length > 0;

  const updateField = (field: string, value: unknown) => {
    onChange({ ...content, [field]: value });
  };

  const updateQuestion = (idx: number, field: string, value: unknown) => {
    const newQuestions = [...questions];
    newQuestions[idx] = { ...newQuestions[idx], [field]: value };
    onChange({ ...content, questions: newQuestions });
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[qIdx].options];
    newOptions[oIdx] = value;
    newQuestions[qIdx] = { ...newQuestions[qIdx], options: newOptions };
    onChange({ ...content, questions: newQuestions });
  };

  const updateSingleOption = (idx: number, value: string) => {
    const newOptions = [...singleOptions];
    newOptions[idx] = value;
    onChange({ ...content, options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Audio Context / Setting</Label>
        <Input
          value={audioContext}
          onChange={(e) => updateField("audioContext", e.target.value)}
          className="mt-1"
          placeholder="e.g., A conversation at a train station"
        />
      </div>

      <div>
        <Label>Audio Script (Text to be spoken)</Label>
        <Textarea
          value={audioText}
          onChange={(e) => updateField("audioText", e.target.value)}
          className="mt-1"
          rows={5}
          placeholder="Enter the dialogue or monologue text..."
        />
      </div>

      {isMultiQuestion ? (
        <div>
          <Label className="mb-2 block">Questions</Label>
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <Card key={qIdx} className="p-4">
                <Label className="text-sm font-medium mb-2 block">Question {qIdx + 1}</Label>
                <Input
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                  placeholder="Enter question..."
                  className="mb-3"
                />
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="font-mono w-6 text-sm">{String.fromCharCode(65 + oIdx)})</span>
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant={oIdx === q.correctAnswer ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateQuestion(qIdx, "correctAnswer", oIdx)}
                        className="w-20"
                      >
                        {oIdx === q.correctAnswer ? "✓" : "Correct"}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Question</Label>
            <Input
              value={singleQuestion}
              onChange={(e) => updateField(content.question ? "question" : "sentence", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Options</Label>
            <div className="space-y-2 mt-1">
              {(singleOptions.length ? singleOptions : ["", "", "", ""]).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono w-6">{String.fromCharCode(65 + idx)})</span>
                  <Input
                    value={opt}
                    onChange={(e) => updateSingleOption(idx, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={idx === singleCorrectAnswer ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateField("correctAnswer", idx)}
                    className="w-20"
                  >
                    {idx === singleCorrectAnswer ? "✓" : "Correct"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit form router
function QuestionEditForm({
  type,
  content,
  onChange,
}: {
  type: QuestionType;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  switch (type) {
    case "grammar_mcq":
    case "vocabulary_mcq":
      return <MCQEditForm content={content} onChange={onChange} />;
    case "grammar_fill_blank":
      return <FillBlankEditForm content={content} onChange={onChange} />;
    case "reading_comprehension":
      return <ReadingEditForm content={content} onChange={onChange} />;
    case "vocabulary_matching":
      return <MatchingEditForm content={content} onChange={onChange} />;
    case "listening_mcq":
    case "listening_fill_blank":
      return <ListeningEditForm content={content} onChange={onChange} />;
    case "writing_prompt":
      return <PromptEditForm content={content} onChange={onChange} type="writing" />;
    case "speaking_prompt":
      return <PromptEditForm content={content} onChange={onChange} type="speaking" />;
    default:
      return <MCQEditForm content={content} onChange={onChange} />;
  }
}

function QuestionPreviewDialog({
  open,
  onOpenChange,
  question,
  onSave,
}: QuestionPreviewDialogProps) {
  const [mode, setMode] = useState<"admin" | "student" | "edit">("admin");
  const [editedContent, setEditedContent] = useState<Record<string, unknown>>({});
  const [editedTags, setEditedTags] = useState<string>("");
  const [editedLevel, setEditedLevel] = useState<CEFRLevel>("B1");
  const [editedDeliveryMode, setEditedDeliveryMode] = useState<DeliveryMode>("text");
  const [isSaving, setIsSaving] = useState(false);

  const updateQuestion = useMutation(api.entryTestQuestionBank.updateQuestion);

  // Get default delivery mode based on question type
  const getDefaultDeliveryMode = (type: QuestionType): DeliveryMode => {
    switch (type) {
      case "listening_mcq":
      case "listening_fill_blank":
        return "audio";
      case "speaking_prompt":
        return "avatar";
      default:
        return "text";
    }
  };

  // Reset state when question changes
  useEffect(() => {
    if (question) {
      setEditedContent(question.content);
      setEditedTags(question.tags.join(", "));
      setEditedLevel(question.cefrLevel);
      setEditedDeliveryMode(question.deliveryMode || getDefaultDeliveryMode(question.type));
      setMode("admin");
    }
  }, [question]);

  // Also reset when dialog opens with new question
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && question) {
      setEditedContent(question.content);
      setEditedTags(question.tags.join(", "));
      setEditedLevel(question.cefrLevel);
      setEditedDeliveryMode(question.deliveryMode || getDefaultDeliveryMode(question.type));
      setMode("admin");
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!question) return;

    setIsSaving(true);
    try {
      await updateQuestion({
        questionId: question._id,
        content: editedContent,
        tags: editedTags.split(",").map((t) => t.trim()).filter(Boolean),
        cefrLevel: editedLevel,
        deliveryMode: editedDeliveryMode,
      });
      toast.success("Question updated successfully");
      setMode("admin");
      onSave?.();
    } catch (error) {
      toast.error("Failed to update question");
    } finally {
      setIsSaving(false);
    }
  };

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            {QUESTION_TYPE_LABELS[question.type]}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{question.cefrLevel}</Badge>
            <Badge
              variant="outline"
              className={
                question.curationStatus === "approved" ? "bg-green-50 text-green-700" :
                question.curationStatus === "rejected" ? "bg-red-50 text-red-700" :
                "bg-yellow-50 text-yellow-700"
              }
            >
              {question.curationStatus}
            </Badge>
            {question.generatedBy === "ai" && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI
              </Badge>
            )}
            <Badge
              variant="outline"
              className={
                (question.deliveryMode || getDefaultDeliveryMode(question.type)) === "avatar" ? "bg-purple-50 text-purple-700" :
                (question.deliveryMode || getDefaultDeliveryMode(question.type)) === "audio" ? "bg-blue-50 text-blue-700" :
                "bg-gray-50 text-gray-700"
              }
            >
              <span className="flex items-center gap-1">
                {(question.deliveryMode || getDefaultDeliveryMode(question.type)) === "avatar" && <Video className="h-3 w-3" />}
                {(question.deliveryMode || getDefaultDeliveryMode(question.type)) === "audio" && <Volume2 className="h-3 w-3" />}
                {(question.deliveryMode || getDefaultDeliveryMode(question.type)) === "text" && <FileText className="h-3 w-3" />}
                {DELIVERY_MODE_LABELS[question.deliveryMode || getDefaultDeliveryMode(question.type)]}
              </span>
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {/* View Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "admin" | "student" | "edit")} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Admin View
            </TabsTrigger>
            <TabsTrigger value="student" className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              Student View
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </TabsTrigger>
          </TabsList>

          {/* Admin View - Shows answers */}
          <TabsContent value="admin" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              {question.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="border rounded-lg p-4 bg-white">
                <QuestionContentPreview type={question.type} content={question.content} />
              </div>
            </div>
          </TabsContent>

          {/* Student View - Hides answers, interactive */}
          <TabsContent value="student" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                This is how the question appears to students. Correct answers are hidden.
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <QuestionStudentPreview type={question.type} content={question.content} />
              </div>
            </div>
          </TabsContent>

          {/* Edit View */}
          <TabsContent value="edit" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              {/* Metadata editing */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>CEFR Level</Label>
                  <Select value={editedLevel} onValueChange={(v) => setEditedLevel(v as CEFRLevel)}>
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery Mode</Label>
                  <Select value={editedDeliveryMode} onValueChange={(v) => setEditedDeliveryMode(v as DeliveryMode)}>
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["text", "audio", "avatar"] as DeliveryMode[]).map((dm) => (
                        <SelectItem key={dm} value={dm}>
                          {DELIVERY_MODE_LABELS[dm]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {DELIVERY_MODE_DESCRIPTIONS[editedDeliveryMode]}
                  </p>
                </div>
                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={editedTags}
                    onChange={(e) => setEditedTags(e.target.value)}
                    className="mt-1 bg-white"
                    placeholder="grammar, past-tense, intermediate"
                  />
                </div>
              </div>

              {/* Content editing */}
              <div className="border rounded-lg p-4 bg-white">
                <QuestionEditForm
                  type={question.type}
                  content={editedContent}
                  onChange={setEditedContent}
                />
              </div>

              {/* Save button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setMode("admin")}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function QuestionBankPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<Id<"entryTestQuestionBank">>>(
    new Set()
  );
  const [previewQuestion, setPreviewQuestion] = useState<{
    _id: Id<"entryTestQuestionBank">;
    type: QuestionType;
    cefrLevel: CEFRLevel;
    tags: string[];
    content: Record<string, unknown>;
    curationStatus: CurationStatus;
    generatedBy: "ai" | "manual";
    generationModel?: string;
    deliveryMode?: DeliveryMode;
  } | null>(null);

  // Fetch questions
  const { questions, total } = useQuery(api.entryTestQuestionBank.listQuestions, {
    type: filterType !== "all" ? (filterType as QuestionType) : undefined,
    level: filterLevel !== "all" ? (filterLevel as CEFRLevel) : undefined,
    curationStatus: filterStatus !== "all" ? (filterStatus as CurationStatus) : undefined,
    limit: 50,
  }) ?? { questions: [], total: 0 };

  // Fetch all tags for filtering
  const allTags = useQuery(api.entryTestQuestionBank.getAllTags) ?? [];

  // Mutations
  const approveQuestion = useMutation(api.entryTestQuestionBank.approveQuestion);
  const rejectQuestion = useMutation(api.entryTestQuestionBank.rejectQuestion);
  const deleteQuestion = useMutation(api.entryTestQuestionBank.deleteQuestion);
  const bulkApprove = useMutation(api.entryTestQuestionBank.bulkApprove);
  const bulkReject = useMutation(api.entryTestQuestionBank.bulkReject);

  const handleApprove = async (questionId: Id<"entryTestQuestionBank">) => {
    try {
      await approveQuestion({ questionId });
      toast.success("Question approved");
    } catch (error) {
      toast.error("Failed to approve question");
    }
  };

  const handleReject = async (questionId: Id<"entryTestQuestionBank">) => {
    try {
      await rejectQuestion({ questionId });
      toast.success("Question rejected");
    } catch (error) {
      toast.error("Failed to reject question");
    }
  };

  const handleDelete = async (questionId: Id<"entryTestQuestionBank">) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion({ questionId });
      toast.success("Question deleted");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete question";
      toast.error(errorMessage);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      const result = await bulkApprove({
        questionIds: Array.from(selectedIds),
      });
      toast.success(`Approved ${result.approved} questions`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Failed to approve questions");
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    try {
      const result = await bulkReject({
        questionIds: Array.from(selectedIds),
      });
      toast.success(`Rejected ${result.rejected} questions`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Failed to reject questions");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(questions?.map((q) => q._id) ?? []));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (questionId: Id<"entryTestQuestionBank">, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(questionId);
    } else {
      newSelected.delete(questionId);
    }
    setSelectedIds(newSelected);
  };

  // Count pending questions
  const pendingQuestions = questions?.filter((q) => q.curationStatus === "pending") ?? [];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/entry-tests">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileQuestion className="h-8 w-8" />
              Question Bank
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage entry test questions • {total} total questions
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/entry-tests/questions/jobs">
            <Button variant="ghost" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Jobs
            </Button>
          </Link>
          <Link href="/admin/entry-tests/questions/generate">
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate with AI
            </Button>
          </Link>
          <Button onClick={() => (window.location.href = "/admin/entry-tests/questions/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Pending Review Banner */}
      {pendingQuestions.length > 0 && filterStatus === "all" && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {pendingQuestions.length} questions pending review
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterStatus("pending")}
              >
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Question Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
              <SelectItem key={type} value={type}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkApprove}>
            <Check className="h-4 w-4 mr-1" />
            Approve All
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkReject}>
            <X className="h-4 w-4 mr-1" />
            Reject All
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Questions Table */}
      {questions === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No questions found
          </h3>
          <p className="text-gray-500 mb-4">
            {filterType !== "all" || filterLevel !== "all" || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Start by generating questions with AI or adding them manually"}
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/admin/entry-tests/questions/generate">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </Link>
            <Button
              onClick={() => (window.location.href = "/admin/entry-tests/questions/create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={questions.length > 0 && selectedIds.size === questions.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-center">Uses</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <QuestionRow
                  key={question._id}
                  question={question}
                  isSelected={selectedIds.has(question._id)}
                  onSelect={(selected) => handleSelectOne(question._id, selected)}
                  onApprove={() => handleApprove(question._id)}
                  onReject={() => handleReject(question._id)}
                  onDelete={() => handleDelete(question._id)}
                  onPreview={() => setPreviewQuestion(question)}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Preview Dialog */}
      <QuestionPreviewDialog
        open={previewQuestion !== null}
        onOpenChange={(open) => !open && setPreviewQuestion(null)}
        question={previewQuestion}
      />
    </div>
  );
}
