"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Edit,
  AlertTriangle,
  BookOpen,
  Pencil,
  FileQuestion,
  Headphones,
  Mic,
  ChevronUp,
  ChevronDown,
  Filter,
  List,
  Search,
  Eye,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type SectionType = "reading" | "grammar" | "vocabulary" | "listening" | "writing" | "speaking";
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

const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const SECTION_TYPES: { value: SectionType; label: string; icon: React.ReactNode }[] = [
  { value: "reading", label: "Reading", icon: <BookOpen className="h-4 w-4" /> },
  { value: "grammar", label: "Grammar", icon: <Pencil className="h-4 w-4" /> },
  { value: "vocabulary", label: "Vocabulary", icon: <FileQuestion className="h-4 w-4" /> },
  { value: "listening", label: "Listening", icon: <Headphones className="h-4 w-4" /> },
  { value: "writing", label: "Writing", icon: <Pencil className="h-4 w-4" /> },
  { value: "speaking", label: "Speaking", icon: <Mic className="h-4 w-4" /> },
];

const QUESTION_TYPES_BY_SECTION: Record<SectionType, { value: QuestionType; label: string }[]> = {
  reading: [{ value: "reading_comprehension", label: "Reading Comprehension" }],
  grammar: [
    { value: "grammar_mcq", label: "Grammar MCQ" },
    { value: "grammar_fill_blank", label: "Grammar Fill-in-the-Blank" },
  ],
  vocabulary: [
    { value: "vocabulary_mcq", label: "Vocabulary MCQ" },
    { value: "vocabulary_matching", label: "Vocabulary Matching" },
  ],
  listening: [
    { value: "listening_mcq", label: "Listening MCQ" },
    { value: "listening_fill_blank", label: "Listening Fill-in-the-Blank" },
  ],
  writing: [{ value: "writing_prompt", label: "Writing Prompt" }],
  speaking: [{ value: "speaking_prompt", label: "Speaking Prompt" }],
};

interface Section {
  id: string;
  type: SectionType;
  title: string;
  instructions_en: string;
  instructions_de?: string;
  questionCount: number;
  questionBankFilter: {
    types: string[];
    levels: string[];
    tags?: string[];
  };
  selectionMode?: "auto" | "manual";
  selectedQuestionIds?: Id<"entryTestQuestionBank">[];
  weight: number;
  order: number;
}

// Question type for picker
interface QuestionBankItem {
  _id: Id<"entryTestQuestionBank">;
  type: QuestionType;
  cefrLevel: CEFRLevel;
  tags: string[];
  content: Record<string, unknown>;
  curationStatus: string;
  createdAt: number;
}

// ============================================
// QUESTION PICKER DIALOG
// ============================================

interface QuestionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionTitle: string;
  questionTypes: string[];
  levels: string[];
  selectedIds: Id<"entryTestQuestionBank">[];
  onSave: (questionIds: Id<"entryTestQuestionBank">[]) => void;
}

function QuestionPickerDialog({
  open,
  onOpenChange,
  sectionTitle,
  questionTypes,
  levels,
  selectedIds,
  onSave,
}: QuestionPickerDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [localSelectedIds, setLocalSelectedIds] = useState<Id<"entryTestQuestionBank">[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionBankItem | null>(null);

  // Fetch available questions
  const availableQuestions = useQuery(
    api.entryTestQuestionBank.getQuestionsForSectionFilter,
    {
      types: questionTypes,
      levels: filterLevel === "all" ? levels : [filterLevel],
      searchText: searchText || undefined,
    }
  );

  // Fetch selected questions details
  const selectedQuestions = useQuery(
    api.entryTestQuestionBank.getQuestionsByIds,
    localSelectedIds.length > 0 ? { questionIds: localSelectedIds } : "skip"
  );

  // Initialize local selection when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelectedIds(selectedIds);
      setSearchText("");
      setFilterLevel("all");
    }
  }, [open, selectedIds]);

  const toggleQuestion = (questionId: Id<"entryTestQuestionBank">) => {
    if (localSelectedIds.includes(questionId)) {
      setLocalSelectedIds(localSelectedIds.filter((id) => id !== questionId));
    } else {
      setLocalSelectedIds([...localSelectedIds, questionId]);
    }
  };

  const removeQuestion = (questionId: Id<"entryTestQuestionBank">) => {
    setLocalSelectedIds(localSelectedIds.filter((id) => id !== questionId));
  };

  const handleSave = () => {
    onSave(localSelectedIds);
    onOpenChange(false);
  };

  const getPreviewText = (content: Record<string, unknown>) => {
    const text = content.question || content.sentence || content.passage || content.prompt || "";
    return String(text).slice(0, 80) + (String(text).length > 80 ? "..." : "");
  };

  const QUESTION_TYPE_LABELS: Record<string, string> = {
    reading_comprehension: "Reading",
    grammar_mcq: "Grammar MCQ",
    grammar_fill_blank: "Grammar Fill",
    vocabulary_mcq: "Vocab MCQ",
    vocabulary_matching: "Vocab Match",
    listening_mcq: "Listen MCQ",
    listening_fill_blank: "Listen Fill",
    writing_prompt: "Writing",
    speaking_prompt: "Speaking",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Select Questions for {sectionTitle}
          </DialogTitle>
          <DialogDescription>
            Choose specific questions from the question bank. Selected: {localSelectedIds.length}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0 mt-4">
          {/* Left: Available Questions */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filters */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search questions..."
                  className="pl-9"
                />
              </div>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {levels.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {!availableQuestions ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <FileQuestion className="h-8 w-8 mb-2" />
                  <p>No matching questions found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {availableQuestions.map((q) => {
                    const isSelected = localSelectedIds.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        className={`p-3 flex items-start gap-3 hover:bg-gray-50 cursor-pointer ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                        onClick={() => toggleQuestion(q._id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleQuestion(q._id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {QUESTION_TYPE_LABELS[q.type] || q.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {q.cefrLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 truncate">
                            {getPreviewText(q.content as Record<string, unknown>)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewQuestion(q as QuestionBankItem);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected Questions */}
          <div className="w-72 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">Selected ({localSelectedIds.length})</Label>
              {localSelectedIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalSelectedIds([])}
                  className="text-xs h-7"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50">
              {localSelectedIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <p>No questions selected</p>
                  <p className="text-xs mt-1">Click questions to select</p>
                </div>
              ) : (
                <div className="divide-y">
                  {selectedQuestions?.filter((q): q is NonNullable<typeof q> => q !== null).map((q, idx) => (
                    <div key={q._id} className="p-2 flex items-center gap-2 bg-white">
                      <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {q.cefrLevel}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {QUESTION_TYPE_LABELS[q.type] || q.type}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeQuestion(q._id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={localSelectedIds.length === 0}>
            <Check className="h-4 w-4 mr-2" />
            Save Selection ({localSelectedIds.length})
          </Button>
        </div>
      </DialogContent>

      {/* Question Preview Dialog */}
      {previewQuestion && (
        <Dialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Question Preview
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="outline">{previewQuestion.type}</Badge>
                <Badge variant="secondary">{previewQuestion.cefrLevel}</Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(previewQuestion.content, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setPreviewQuestion(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  toggleQuestion(previewQuestion._id);
                  setPreviewQuestion(null);
                }}
              >
                {localSelectedIds.includes(previewQuestion._id) ? "Remove" : "Select"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

// ============================================
// SECTION EDITOR DIALOG
// ============================================

interface SectionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: Section | null;
  onSave: (section: Omit<Section, "order">) => void;
  isNew: boolean;
}

function SectionEditorDialog({
  open,
  onOpenChange,
  section,
  onSave,
  isNew,
}: SectionEditorDialogProps) {
  const [type, setType] = useState<SectionType>("grammar");
  const [title, setTitle] = useState("");
  const [instructionsEn, setInstructionsEn] = useState("");
  const [instructionsDe, setInstructionsDe] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [weight, setWeight] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(CEFR_LEVELS);

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState<"auto" | "manual">("auto");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Id<"entryTestQuestionBank">[]>([]);
  const [questionPickerOpen, setQuestionPickerOpen] = useState(false);

  // Fetch selected questions for display
  const selectedQuestionsData = useQuery(
    api.entryTestQuestionBank.getQuestionsByIds,
    selectedQuestionIds.length > 0 ? { questionIds: selectedQuestionIds } : "skip"
  );

  useEffect(() => {
    if (section) {
      setType(section.type);
      setTitle(section.title);
      setInstructionsEn(section.instructions_en);
      setInstructionsDe(section.instructions_de || "");
      setQuestionCount(section.questionCount);
      setWeight(section.weight);
      setSelectedTypes(section.questionBankFilter.types);
      setSelectedLevels(section.questionBankFilter.levels);
      setSelectionMode(section.selectionMode || "auto");
      setSelectedQuestionIds(section.selectedQuestionIds || []);
    } else {
      // Reset for new section
      setType("grammar");
      setTitle("");
      setInstructionsEn("");
      setInstructionsDe("");
      setQuestionCount(5);
      setWeight(1);
      setSelectedTypes([]);
      setSelectedLevels(CEFR_LEVELS);
      setSelectionMode("auto");
      setSelectedQuestionIds([]);
    }
  }, [section, open]);

  // Auto-select question types when section type changes
  useEffect(() => {
    if (isNew) {
      const availableTypes = QUESTION_TYPES_BY_SECTION[type].map((t) => t.value);
      setSelectedTypes(availableTypes);
      // Set default title
      const sectionInfo = SECTION_TYPES.find((s) => s.value === type);
      if (sectionInfo && !title) {
        setTitle(sectionInfo.label);
      }
    }
  }, [type, isNew, title]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a section title");
      return;
    }
    if (!instructionsEn.trim()) {
      toast.error("Please enter instructions");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Please select at least one question type");
      return;
    }
    if (selectedLevels.length === 0) {
      toast.error("Please select at least one CEFR level");
      return;
    }
    if (selectionMode === "manual" && selectedQuestionIds.length === 0) {
      toast.error("Please select at least one question");
      return;
    }

    onSave({
      id: section?.id || `section-${Date.now()}`,
      type,
      title: title.trim(),
      instructions_en: instructionsEn.trim(),
      instructions_de: instructionsDe.trim() || undefined,
      questionCount: selectionMode === "manual" ? selectedQuestionIds.length : questionCount,
      questionBankFilter: {
        types: selectedTypes,
        levels: selectedLevels,
      },
      selectionMode,
      selectedQuestionIds: selectionMode === "manual" ? selectedQuestionIds : undefined,
      weight,
    });
    onOpenChange(false);
  };

  const availableQuestionTypes = QUESTION_TYPES_BY_SECTION[type];

  const QUESTION_TYPE_LABELS: Record<string, string> = {
    reading_comprehension: "Reading",
    grammar_mcq: "Grammar MCQ",
    grammar_fill_blank: "Grammar Fill",
    vocabulary_mcq: "Vocab MCQ",
    vocabulary_matching: "Vocab Match",
    listening_mcq: "Listen MCQ",
    listening_fill_blank: "Listen Fill",
    writing_prompt: "Writing",
    speaking_prompt: "Speaking",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add Section" : "Edit Section"}</DialogTitle>
          <DialogDescription>
            Configure the section settings and question filters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Section Type */}
          <div className="space-y-2">
            <Label>Section Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as SectionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPES.map((st) => (
                  <SelectItem key={st.value} value={st.value}>
                    <span className="flex items-center gap-2">
                      {st.icon}
                      {st.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Grammar Section"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>Instructions (English)</Label>
            <Textarea
              value={instructionsEn}
              onChange={(e) => setInstructionsEn(e.target.value)}
              placeholder="Choose the correct answer for each question..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Instructions (German - Optional)</Label>
            <Textarea
              value={instructionsDe}
              onChange={(e) => setInstructionsDe(e.target.value)}
              placeholder="Wählen Sie die richtige Antwort..."
              rows={3}
            />
          </div>

          {/* Selection Mode Toggle */}
          <div className="space-y-2">
            <Label>Question Selection Mode</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectionMode === "auto" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSelectionMode("auto")}
              >
                <Filter className="h-4 w-4 mr-2" />
                Auto (Filter-based)
              </Button>
              <Button
                type="button"
                variant={selectionMode === "manual" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSelectionMode("manual")}
              >
                <List className="h-4 w-4 mr-2" />
                Manual (Pick Questions)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectionMode === "auto"
                ? "Questions will be randomly selected from the bank based on filters"
                : "Choose specific questions from the question bank"}
            </p>
          </div>

          {/* Question Types Filter - always needed */}
          <div className="space-y-2">
            <Label>Question Types</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
              {availableQuestionTypes.map((qt) => (
                <div key={qt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={qt.value}
                    checked={selectedTypes.includes(qt.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, qt.value]);
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== qt.value));
                      }
                    }}
                  />
                  <Label htmlFor={qt.value} className="text-sm cursor-pointer">
                    {qt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* CEFR Levels Filter - always needed */}
          <div className="space-y-2">
            <Label>CEFR Levels</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
              {CEFR_LEVELS.map((level) => (
                <div key={level} className="flex items-center gap-1">
                  <Checkbox
                    id={`level-${level}`}
                    checked={selectedLevels.includes(level)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLevels([...selectedLevels, level]);
                      } else {
                        setSelectedLevels(selectedLevels.filter((l) => l !== level));
                      }
                    }}
                  />
                  <Label htmlFor={`level-${level}`} className="text-sm cursor-pointer">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Mode: Question Count */}
          {selectionMode === "auto" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (for scoring)</Label>
                <Input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>
          )}

          {/* Manual Mode: Question Picker */}
          {selectionMode === "manual" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Selected Questions ({selectedQuestionIds.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestionPickerOpen(true)}
                  disabled={selectedTypes.length === 0 || selectedLevels.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Select Questions
                </Button>
              </div>

              {selectedTypes.length === 0 || selectedLevels.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  Please select question types and CEFR levels first
                </div>
              ) : selectedQuestionIds.length === 0 ? (
                <div className="p-4 bg-gray-50 border rounded-lg text-center text-muted-foreground text-sm">
                  No questions selected. Click &quot;Select Questions&quot; to choose from the bank.
                </div>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {selectedQuestionsData?.filter((q): q is NonNullable<typeof q> => q !== null).map((q, idx) => (
                    <div key={q._id} className="p-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                      <Badge variant="outline" className="text-xs">
                        {q.cefrLevel}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex-1">
                        {QUESTION_TYPE_LABELS[q.type] || q.type}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q._id))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Weight (for scoring)</Label>
                <Input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isNew ? "Add Section" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Question Picker Dialog */}
      <QuestionPickerDialog
        open={questionPickerOpen}
        onOpenChange={setQuestionPickerOpen}
        sectionTitle={title || "Section"}
        questionTypes={selectedTypes}
        levels={selectedLevels}
        selectedIds={selectedQuestionIds}
        onSave={setSelectedQuestionIds}
      />
    </Dialog>
  );
}

// ============================================
// SECTION CARD
// ============================================

interface SectionCardProps {
  section: Section;
  index: number;
  totalSections: number;
  availableQuestions: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SectionCard({
  section,
  index,
  totalSections,
  availableQuestions,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SectionCardProps) {
  const sectionInfo = SECTION_TYPES.find((s) => s.value === section.type);
  const isManualMode = section.selectionMode === "manual";
  const hasEnoughQuestions = isManualMode || availableQuestions >= section.questionCount;

  return (
    <Card className={!hasEnoughQuestions ? "border-yellow-300" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onMoveUp}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onMoveDown}
                disabled={index === totalSections - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                {sectionInfo?.icon}
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {section.instructions_en.slice(0, 100)}
                {section.instructions_en.length > 100 && "..."}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{section.type}</Badge>
          <Badge variant="secondary">{section.questionCount} questions</Badge>
          <Badge variant="secondary">Weight: {section.weight}</Badge>

          {/* Selection Mode Badge */}
          {isManualMode ? (
            <Badge className="bg-blue-100 text-blue-700">
              <List className="h-3 w-3 mr-1" />
              Manual
            </Badge>
          ) : (
            <Badge className="bg-purple-100 text-purple-700">
              <Filter className="h-3 w-3 mr-1" />
              Auto
            </Badge>
          )}

          {/* Available/Selected Questions */}
          {isManualMode ? (
            <Badge className="bg-green-100 text-green-700">
              {section.selectedQuestionIds?.length || 0} selected
            </Badge>
          ) : (
            <Badge
              variant={hasEnoughQuestions ? "default" : "destructive"}
              className={hasEnoughQuestions ? "bg-green-100 text-green-700" : ""}
            >
              {availableQuestions} available
            </Badge>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <span>Types: {section.questionBankFilter.types.join(", ")}</span>
          <span className="mx-2">•</span>
          <span>Levels: {section.questionBankFilter.levels.join(", ")}</span>
        </div>
        {!hasEnoughQuestions && !isManualMode && (
          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Not enough approved questions
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN EDIT PAGE
// ============================================

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as Id<"entryTestTemplates">;

  // Local state for form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minLevel, setMinLevel] = useState<CEFRLevel>("A1");
  const [maxLevel, setMaxLevel] = useState<CEFRLevel>("C2");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Section editor state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isNewSection, setIsNewSection] = useState(false);

  // Fetch template with question counts
  const templateData = useQuery(api.entryTests.getTemplateWithQuestionCounts, {
    templateId,
  });

  // Mutations
  const updateTemplate = useMutation(api.entryTests.updateTemplate);
  const addSection = useMutation(api.entryTests.addSectionToTemplate);
  const updateSection = useMutation(api.entryTests.updateSection);
  const removeSection = useMutation(api.entryTests.removeSection);
  const reorderSections = useMutation(api.entryTests.reorderSections);

  // Initialize form from template
  useEffect(() => {
    if (templateData) {
      setTitle(templateData.title);
      setDescription(templateData.description || "");
      setMinLevel(templateData.targetLevelRange.min as CEFRLevel);
      setMaxLevel(templateData.targetLevelRange.max as CEFRLevel);
    }
  }, [templateData]);

  if (!templateData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sections = templateData.sections as (Section & { availableQuestionCount: number })[];

  const handleSaveBasicInfo = async () => {
    setIsSaving(true);
    try {
      await updateTemplate({
        templateId,
        title: title.trim(),
        description: description.trim() || undefined,
        targetLevelRange: { min: minLevel, max: maxLevel },
      });
      toast.success("Template updated");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to update template");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = () => {
    setEditingSection(null);
    setIsNewSection(true);
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setIsNewSection(false);
    setSectionDialogOpen(true);
  };

  const handleSaveSection = async (sectionData: Omit<Section, "order">) => {
    try {
      if (isNewSection) {
        await addSection({
          templateId,
          section: {
            ...sectionData,
            instructions_de: sectionData.instructions_de,
            questionBankFilter: {
              ...sectionData.questionBankFilter,
              tags: sectionData.questionBankFilter.tags,
            },
            selectionMode: sectionData.selectionMode,
            selectedQuestionIds: sectionData.selectedQuestionIds,
          },
        });
        toast.success("Section added");
      } else if (editingSection) {
        await updateSection({
          templateId,
          sectionId: editingSection.id,
          updates: {
            title: sectionData.title,
            instructions_en: sectionData.instructions_en,
            instructions_de: sectionData.instructions_de,
            questionCount: sectionData.questionCount,
            questionBankFilter: sectionData.questionBankFilter,
            selectionMode: sectionData.selectionMode,
            selectedQuestionIds: sectionData.selectedQuestionIds,
            weight: sectionData.weight,
          },
        });
        toast.success("Section updated");
      }
    } catch (error) {
      toast.error("Failed to save section");
      console.error(error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      await removeSection({ templateId, sectionId });
      toast.success("Section deleted");
    } catch (error) {
      toast.error("Failed to delete section");
      console.error(error);
    }
  };

  const handleMoveSection = async (sectionId: string, direction: "up" | "down") => {
    const currentIndex = sections.findIndex((s) => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    // Build new order
    const newSectionIds = sections.map((s) => s.id);
    [newSectionIds[currentIndex], newSectionIds[newIndex]] = [
      newSectionIds[newIndex],
      newSectionIds[currentIndex],
    ];

    try {
      await reorderSections({ templateId, sectionIds: newSectionIds });
    } catch (error) {
      toast.error("Failed to reorder sections");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
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
            <h1 className="text-2xl font-bold">Edit Template</h1>
            <p className="text-muted-foreground">{templateData.title}</p>
          </div>
        </div>
        <Badge variant={templateData.status === "published" ? "default" : "secondary"}>
          {templateData.status}
        </Badge>
      </div>

      {/* Basic Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update the template title, description, and target level range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Cambridge English Placement Test"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setHasChanges(true);
              }}
              placeholder="A comprehensive assessment..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Level</Label>
              <Select
                value={minLevel}
                onValueChange={(v) => {
                  setMinLevel(v as CEFRLevel);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Level</Label>
              <Select
                value={maxLevel}
                onValueChange={(v) => {
                  setMaxLevel(v as CEFRLevel);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveBasicInfo} disabled={isSaving || !hasChanges}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sections Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sections</CardTitle>
              <CardDescription>
                Configure the test sections and question filters
              </CardDescription>
            </div>
            <Button onClick={handleAddSection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-2">No sections yet</p>
              <p className="text-sm text-muted-foreground">
                Add sections to define the test structure
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, idx) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  index={idx}
                  totalSections={sections.length}
                  availableQuestions={section.availableQuestionCount}
                  onEdit={() => handleEditSection(section)}
                  onDelete={() => handleDeleteSection(section.id)}
                  onMoveUp={() => handleMoveSection(section.id, "up")}
                  onMoveDown={() => handleMoveSection(section.id, "down")}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Editor Dialog */}
      <SectionEditorDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        section={editingSection}
        onSave={handleSaveSection}
        isNew={isNewSection}
      />
    </div>
  );
}
