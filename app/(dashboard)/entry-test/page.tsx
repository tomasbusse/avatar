"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Clock,
  Play,
  RefreshCw,
  Loader2,
  CheckCircle2,
  FileQuestion,
  Trophy,
  AlertCircle,
  Monitor,
  Headphones,
  Video,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type DeliveryMode = "web_only" | "audio_avatar" | "video_avatar";

const DELIVERY_MODE_INFO: Record<
  DeliveryMode,
  { title: string; description: string; icon: React.ReactNode }
> = {
  web_only: {
    title: "Web Only",
    description: "Take the test with text and audio. No avatar.",
    icon: <Monitor className="h-5 w-5" />,
  },
  audio_avatar: {
    title: "Audio Avatar",
    description: "An AI avatar reads questions aloud with audio feedback.",
    icon: <Headphones className="h-5 w-5" />,
  },
  video_avatar: {
    title: "Video Avatar",
    description: "A photorealistic AI avatar guides you through the test.",
    icon: <Video className="h-5 w-5" />,
  },
};

interface Template {
  _id: Id<"entryTestTemplates">;
  title: string;
  description?: string;
  targetLevelRange: { min: CEFRLevel; max: CEFRLevel };
  sections: Array<{
    id: string;
    title: string;
    questionCount: number;
  }>;
  status: string;
}

interface Session {
  _id: Id<"entryTestSessions">;
  templateId: Id<"entryTestTemplates">;
  status: string;
  currentState: {
    currentSectionIndex: number;
    currentQuestionIndex: number;
  };
  overallResult?: {
    cefrLevel: CEFRLevel;
    percentageScore: number;
  };
  createdAt: number;
  completedAt?: number;
}

// ============================================
// TEST CARD COMPONENT
// ============================================

interface TestCardProps {
  template: Template;
  activeSession?: Session;
  completedSession?: Session;
  onStart: () => void;
  onResume: () => void;
  onViewResults: () => void;
  isLoading: boolean;
}

function TestCard({
  template,
  activeSession,
  completedSession,
  onStart,
  onResume,
  onViewResults,
  isLoading,
}: TestCardProps) {
  const totalQuestions = template.sections.reduce(
    (sum, s) => sum + s.questionCount,
    0
  );

  const levelColors: Record<CEFRLevel, string> = {
    A1: "bg-green-100 text-green-800",
    A2: "bg-lime-100 text-lime-800",
    B1: "bg-yellow-100 text-yellow-800",
    B2: "bg-orange-100 text-orange-800",
    C1: "bg-red-100 text-red-800",
    C2: "bg-purple-100 text-purple-800",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{template.title}</CardTitle>
            {template.description && (
              <CardDescription className="mt-1">
                {template.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1">
            <Badge className={levelColors[template.targetLevelRange.min]}>
              {template.targetLevelRange.min}
            </Badge>
            {template.targetLevelRange.min !== template.targetLevelRange.max && (
              <>
                <span className="text-muted-foreground">-</span>
                <Badge className={levelColors[template.targetLevelRange.max]}>
                  {template.targetLevelRange.max}
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileQuestion className="h-4 w-4" />
            <span>{totalQuestions} questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>~{Math.ceil(totalQuestions * 1.5)} min</span>
          </div>
        </div>

        {/* Section breakdown */}
        <div className="mt-4 space-y-1">
          {template.sections.map((section) => (
            <div
              key={section.id}
              className="flex justify-between text-sm text-muted-foreground"
            >
              <span>{section.title}</span>
              <span>{section.questionCount} questions</span>
            </div>
          ))}
        </div>

        {/* Active session indicator */}
        {activeSession && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">Test in progress</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Section {activeSession.currentState.currentSectionIndex + 1},
              Question {activeSession.currentState.currentQuestionIndex + 1}
            </p>
          </div>
        )}

        {/* Completed session indicator */}
        {completedSession && !activeSession && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Trophy className="h-4 w-4" />
              <span className="font-medium">
                Completed - Level: {completedSession.overallResult?.cefrLevel}
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Score: {completedSession.overallResult?.percentageScore}%
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {activeSession ? (
          <Button onClick={onResume} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Resume Test
          </Button>
        ) : completedSession ? (
          <>
            <Button
              variant="outline"
              onClick={onViewResults}
              className="flex-1"
            >
              <Trophy className="h-4 w-4 mr-2" />
              View Results
            </Button>
            <Button onClick={onStart} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </>
        ) : (
          <Button onClick={onStart} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Test
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================
// DELIVERY MODE DIALOG
// ============================================

interface DeliveryModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onStart: (mode: DeliveryMode) => void;
  isLoading: boolean;
}

function DeliveryModeDialog({
  open,
  onOpenChange,
  template,
  onStart,
  isLoading,
}: DeliveryModeDialogProps) {
  const [selectedMode, setSelectedMode] = useState<DeliveryMode>("web_only");

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose How to Take the Test</DialogTitle>
          <DialogDescription>
            Select your preferred test experience for &quot;{template.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedMode}
          onValueChange={(v: string) => setSelectedMode(v as DeliveryMode)}
          className="space-y-3 my-4"
        >
          {(Object.keys(DELIVERY_MODE_INFO) as DeliveryMode[]).map((mode) => {
            const info = DELIVERY_MODE_INFO[mode];
            return (
              <label
                key={mode}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedMode === mode
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <RadioGroupItem value={mode} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {info.icon}
                    <span className="font-medium">{info.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {info.description}
                  </p>
                </div>
              </label>
            );
          })}
        </RadioGroup>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onStart(selectedMode)}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Test
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function EntryTestPage() {
  const router = useRouter();
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [deliveryModeDialogOpen, setDeliveryModeDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Get current student
  const student = useQuery(api.students.getStudent);

  // Get available templates (published only)
  const templates = useQuery(api.entryTests.listTemplates, {
    status: "published",
  }) ?? [];

  // Get student's test sessions
  const sessions = useQuery(
    api.entryTestSessions.listStudentSessions,
    student?._id ? { studentId: student._id } : "skip"
  );

  // Mutations
  const startTest = useMutation(api.entryTestSessions.startTest);

  const handleOpenStartDialog = (template: Template) => {
    setSelectedTemplate(template);
    setDeliveryModeDialogOpen(true);
  };

  const handleStartTest = async (deliveryMode: DeliveryMode) => {
    if (!student || !selectedTemplate) {
      toast.error("Student profile not found");
      return;
    }

    setLoadingTemplateId(selectedTemplate._id);
    try {
      const result = await startTest({
        templateId: selectedTemplate._id,
        deliveryMode,
      });

      setDeliveryModeDialogOpen(false);

      // Navigate based on delivery mode
      if (deliveryMode === "video_avatar" && result.roomName) {
        // Navigate to LiveKit room for video avatar
        router.push(`/entry-test/${result.sessionId}?mode=avatar&room=${result.roomName}`);
      } else {
        router.push(`/entry-test/${result.sessionId}`);
      }
    } catch (error) {
      toast.error("Failed to start test");
      console.error(error);
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const handleResumeTest = (sessionId: Id<"entryTestSessions">) => {
    router.push(`/entry-test/${sessionId}`);
  };

  const handleViewResults = (sessionId: Id<"entryTestSessions">) => {
    router.push(`/entry-test/${sessionId}/results`);
  };

  // Group sessions by template
  const sessionsByTemplate = new Map<string, { active?: Session; completed?: Session }>();
  if (sessions) {
    for (const session of sessions) {
      const key = session.templateId;
      const existing = sessionsByTemplate.get(key) || {};
      if (session.status === "in_progress" || session.status === "paused") {
        existing.active = session as Session;
      } else if (session.status === "completed") {
        if (!existing.completed || session.completedAt! > existing.completed.completedAt!) {
          existing.completed = session as Session;
        }
      }
      sessionsByTemplate.set(key, existing);
    }
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Entry Level Assessment
        </h1>
        <p className="text-muted-foreground mt-2">
          Take an assessment to determine your current English level and get
          personalized lesson recommendations.
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-8 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">How it works</h3>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• Answer questions across different skill areas</li>
                <li>• Take your time - there&apos;s no time limit</li>
                <li>• You can pause and resume at any time</li>
                <li>• Get your CEFR level (A1-C2) at the end</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Tests */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tests available
          </h3>
          <p className="text-gray-500">
            Check back later for available entry assessments.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {templates.map((template) => {
            const sessionInfo = sessionsByTemplate.get(template._id);
            return (
              <TestCard
                key={template._id}
                template={template as Template}
                activeSession={sessionInfo?.active}
                completedSession={sessionInfo?.completed}
                onStart={() => handleOpenStartDialog(template as Template)}
                onResume={() =>
                  sessionInfo?.active && handleResumeTest(sessionInfo.active._id)
                }
                onViewResults={() =>
                  sessionInfo?.completed &&
                  handleViewResults(sessionInfo.completed._id)
                }
                isLoading={loadingTemplateId === template._id}
              />
            );
          })}
        </div>
      )}

      {/* Delivery Mode Dialog */}
      <DeliveryModeDialog
        open={deliveryModeDialogOpen}
        onOpenChange={setDeliveryModeDialogOpen}
        template={selectedTemplate}
        onStart={handleStartTest}
        isLoading={!!loadingTemplateId}
      />
    </div>
  );
}
