"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Zap,
  DollarSign,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
type DeliveryMode = "text" | "audio" | "avatar";

interface GenerationResult {
  success: boolean;
  questions?: Array<{
    type: QuestionType;
    cefrLevel: CEFRLevel;
    content: unknown;
    tags: string[];
    deliveryMode: DeliveryMode;
  }>;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
}

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

const QUESTION_TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  reading_comprehension: "Passages with multiple choice comprehension questions",
  grammar_mcq: "Grammar point testing with multiple choice answers",
  grammar_fill_blank: "Fill in the blank with correct grammatical form",
  vocabulary_mcq: "Vocabulary knowledge with context and definitions",
  vocabulary_matching: "Match words with definitions or translations",
  listening_mcq: "Audio comprehension with multiple choice (text generated for TTS)",
  listening_fill_blank: "Fill blanks while listening (text generated for TTS)",
  writing_prompt: "Writing tasks with rubrics and requirements",
  speaking_prompt: "Speaking tasks with evaluation criteria",
};

// Default model - Claude Opus 4.5
const DEFAULT_MODEL = "anthropic/claude-opus-4-5-20251101";

interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
}

// ============================================
// MAIN PAGE
// ============================================

export default function GenerateQuestionsPage() {
  const router = useRouter();

  // Models state
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Form state
  const [questionType, setQuestionType] = useState<QuestionType>("grammar_mcq");
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>("B1");
  const [count, setCount] = useState(5);
  const [topic, setTopic] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Fetch models from OpenRouter
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("/api/llm/models");
        if (!response.ok) throw new Error("Failed to fetch models");
        const data = await response.json();

        // Filter to only show text models and sort by name
        const textModels = (data.data || [])
          .filter((m: OpenRouterModel) =>
            m.id &&
            !m.id.includes("vision") &&
            !m.id.includes("image") &&
            !m.id.includes("audio") &&
            !m.id.includes("tts") &&
            !m.id.includes("whisper")
          )
          .sort((a: OpenRouterModel, b: OpenRouterModel) => a.name.localeCompare(b.name));

        setModels(textModels);
      } catch (error) {
        console.error("Failed to fetch models:", error);
        // Fallback models if API fails
        setModels([
          { id: "anthropic/claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
          { id: "anthropic/claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
          { id: "anthropic/claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
          { id: "openai/gpt-4o", name: "GPT-4o" },
          { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
          { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash" },
        ]);
      } finally {
        setModelsLoading(false);
      }
    }
    fetchModels();
  }, []);

  // Convex mutations
  const createAIQuestion = useMutation(api.entryTestQuestionBank.createAIQuestion);
  const createJob = useMutation(api.entryTestGenerationJobs.createJob);
  const completeJob = useMutation(api.entryTestGenerationJobs.completeJob);
  const addGeneratedQuestions = useMutation(api.entryTestGenerationJobs.addGeneratedQuestions);
  const failJob = useMutation(api.entryTestGenerationJobs.failJob);

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setResult(null);
    setSavedCount(0);

    // Create a job to track this generation
    let jobId;
    try {
      jobId = await createJob({
        type: "question_batch",
        parameters: {
          questionType,
          cefrLevel,
          count,
          topic: topic || undefined,
          customPrompt: customPrompt || undefined,
        },
        model,
      });
    } catch (error) {
      console.error("Failed to create job:", error);
      // Continue without job tracking
    }

    try {
      const response = await fetch("/api/entry-tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionType,
          cefrLevel,
          count,
          topic: topic || undefined,
          customPrompt: customPrompt || undefined,
          model,
        }),
      });

      const data = (await response.json()) as GenerationResult;
      setResult(data);

      if (data.success && data.questions && data.questions.length > 0) {
        toast.success(`Generated ${data.questions.length} questions`);

        // Auto-save questions to the bank (as pending)
        const savedIds = [];
        for (const question of data.questions) {
          try {
            const questionId = await createAIQuestion({
              type: question.type,
              cefrLevel: question.cefrLevel,
              tags: question.tags,
              content: question.content,
              generationModel: model,
              deliveryMode: question.deliveryMode,
            });
            savedIds.push(questionId);
            setSavedCount((prev) => prev + 1);
          } catch (error) {
            console.error("Failed to save question:", error);
          }
        }

        // Update job with generated questions
        if (jobId && savedIds.length > 0) {
          try {
            await addGeneratedQuestions({ jobId, questionIds: savedIds });
            await completeJob({
              jobId,
              tokenUsage: {
                promptTokens: data.usage?.promptTokens || 0,
                completionTokens: data.usage?.completionTokens || 0,
                totalCost: data.usage?.totalCost,
              },
            });
          } catch (error) {
            console.error("Failed to update job:", error);
          }
        }
      } else {
        toast.error(data.error || "Failed to generate questions");
        if (jobId) {
          await failJob({ jobId, error: data.error || "Unknown error" });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error";
      toast.error(errorMsg);
      setResult({ success: false, error: errorMsg });
      if (jobId) {
        await failJob({ jobId, error: errorMsg });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const levelColors: Record<CEFRLevel, string> = {
    A1: "bg-green-100 text-green-800",
    A2: "bg-lime-100 text-lime-800",
    B1: "bg-yellow-100 text-yellow-800",
    B2: "bg-orange-100 text-orange-800",
    C1: "bg-red-100 text-red-800",
    C2: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/entry-tests/questions">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            Generate Questions with AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate high-quality CEFR-aligned test questions using AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Type</CardTitle>
              <CardDescription>
                Select the type of questions to generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setQuestionType(type as QuestionType)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      questionType === type
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {QUESTION_TYPE_DESCRIPTIONS[type as QuestionType]}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Level and Count */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block">CEFR Level</Label>
                <div className="flex gap-2">
                  {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setCefrLevel(level)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        cefrLevel === level
                          ? levelColors[level]
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Number of Questions: {count}</Label>
                <Slider
                  value={[count]}
                  onValueChange={(values) => setCount(values[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Topic (optional)</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Travel, Business, Daily life, Technology..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Focus questions on a specific topic for more relevant content
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Custom Instructions (optional)</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add any specific requirements for the questions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Model</CardTitle>
              <CardDescription>
                Choose from all available OpenRouter models. Default: Claude Opus 4.5
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading models...
                </div>
              ) : (
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          {m.pricing && (
                            <span className="text-xs text-muted-foreground">
                              ${(parseFloat(m.pricing.prompt) * 1000000).toFixed(2)}/M
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Currently selected: {models.find(m => m.id === model)?.name || model}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          {/* Generate Button Card */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-12 text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate {count} Questions
                  </>
                )}
              </Button>

              {/* Summary */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileQuestion className="h-4 w-4" />
                  <span>{QUESTION_TYPE_LABELS[questionType]}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className={levelColors[cefrLevel]}>
                    {cefrLevel}
                  </Badge>
                  <span>{count} questions</span>
                </div>
                {topic && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Topic: {topic}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Result Card */}
          {result && (
            <Card className={result.success ? "border-green-200" : "border-red-200"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Generation Complete
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Generation Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.success && result.questions ? (
                  <>
                    <div className="text-sm space-y-1">
                      <p className="text-green-700">
                        Generated {result.questions.length} questions
                      </p>
                      <p className="text-green-700">
                        Saved {savedCount} to question bank (pending review)
                      </p>
                    </div>
                    {result.usage && (
                      <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {result.usage.promptTokens + result.usage.completionTokens} tokens
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${result.usage.totalCost.toFixed(4)} estimated
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/admin/entry-tests/questions")}
                    >
                      Review Questions
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-red-600">{result.error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                How it works
              </h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Configure question type, level, and count</li>
                <li>Click generate to create questions with AI</li>
                <li>Questions are saved as "pending" review</li>
                <li>Review and approve questions in the Question Bank</li>
                <li>Approved questions can be used in tests</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
