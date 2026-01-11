"use client";

import { useParams, useRouter } from "next/navigation";
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
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Target,
  BookOpen,
  Headphones,
  Pencil,
  Mic,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const LEVEL_DESCRIPTIONS: Record<CEFRLevel, { title: string; description: string }> = {
  A1: {
    title: "Beginner",
    description:
      "Can understand and use familiar everyday expressions and very basic phrases.",
  },
  A2: {
    title: "Elementary",
    description:
      "Can communicate in simple and routine tasks requiring a simple and direct exchange of information.",
  },
  B1: {
    title: "Intermediate",
    description:
      "Can deal with most situations likely to arise whilst travelling and can describe experiences, events, dreams and ambitions.",
  },
  B2: {
    title: "Upper Intermediate",
    description:
      "Can interact with a degree of fluency and spontaneity that makes regular interaction with native speakers quite possible.",
  },
  C1: {
    title: "Advanced",
    description:
      "Can express ideas fluently and spontaneously without much obvious searching for expressions.",
  },
  C2: {
    title: "Proficient",
    description:
      "Can understand with ease virtually everything heard or read and can express themselves spontaneously and precisely.",
  },
};

const SKILL_ICONS: Record<string, React.ReactNode> = {
  reading: <BookOpen className="h-5 w-5" />,
  listening: <Headphones className="h-5 w-5" />,
  writing: <Pencil className="h-5 w-5" />,
  speaking: <Mic className="h-5 w-5" />,
  grammar: <Target className="h-5 w-5" />,
  vocabulary: <BookOpen className="h-5 w-5" />,
};

// ============================================
// COMPONENTS
// ============================================

interface LevelBadgeProps {
  level: CEFRLevel;
  size?: "sm" | "lg";
}

function LevelBadge({ level, size = "sm" }: LevelBadgeProps) {
  const colors: Record<CEFRLevel, string> = {
    A1: "bg-green-500",
    A2: "bg-lime-500",
    B1: "bg-yellow-500",
    B2: "bg-orange-500",
    C1: "bg-red-500",
    C2: "bg-purple-500",
  };

  if (size === "lg") {
    return (
      <div
        className={`${colors[level]} text-white text-6xl font-bold rounded-2xl w-32 h-32 flex items-center justify-center shadow-lg`}
      >
        {level}
      </div>
    );
  }

  return (
    <Badge className={`${colors[level]} text-white`}>
      {level}
    </Badge>
  );
}

interface SkillScoreCardProps {
  skill: string;
  score: number;
  level: CEFRLevel;
  questionsCorrect: number;
  questionsTotal: number;
}

function SkillScoreCard({
  skill,
  score,
  level,
  questionsCorrect,
  questionsTotal,
}: SkillScoreCardProps) {
  const icon = SKILL_ICONS[skill.toLowerCase()] || <Target className="h-5 w-5" />;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium capitalize">{skill}</span>
          </div>
          <LevelBadge level={level} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Score</span>
            <span className="font-medium">{score}%</span>
          </div>
          <Progress value={score} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {questionsCorrect} / {questionsTotal} correct
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function TestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as Id<"entryTestSessions">;

  // Fetch session results
  const results = useQuery(api.entryTestSessions.getSessionResults, {
    sessionId,
  });

  // Fetch template for context
  const template = useQuery(
    api.entryTests.getTemplate,
    results?.templateId ? { templateId: results.templateId } : "skip"
  );

  // Mutation to apply recommended level
  const applyLevel = useMutation(api.entryTestSessions.applyRecommendedLevel);

  const handleApplyLevel = async () => {
    if (!results?.overallResult) return;
    try {
      await applyLevel({
        sessionId,
      });
      toast.success("Your level has been updated!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to update level");
    }
  };

  // Loading state
  if (!results || !template) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not completed state
  if (results.status !== "completed" || !results.overallResult) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl text-center">
        <Card>
          <CardContent className="pt-6">
            <XCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Test Not Completed</h2>
            <p className="text-muted-foreground mb-4">
              This test hasn&apos;t been completed yet. Please finish all
              questions to see your results.
            </p>
            <Button onClick={() => router.push(`/entry-test/${sessionId}`)}>
              Continue Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overallResult, sectionScores } = results;
  const levelInfo = LEVEL_DESCRIPTIONS[overallResult.cefrLevel as CEFRLevel];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Link */}
      <Link
        href="/entry-test"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Tests
      </Link>

      {/* Main Result Card */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Your Results</CardTitle>
            </div>
            <CardDescription>{template.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Level Badge */}
              <div className="text-center">
                <LevelBadge level={overallResult.cefrLevel as CEFRLevel} size="lg" />
                <h3 className="mt-4 text-2xl font-bold">
                  {levelInfo.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  CEFR {overallResult.cefrLevel}
                </p>
              </div>

              {/* Description & Stats */}
              <div className="flex-1">
                <p className="text-muted-foreground mb-4">
                  {levelInfo.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-3xl font-bold text-primary">
                      {overallResult.percentageScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Overall Score
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-3xl font-bold text-primary">
                      {results.answers?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Questions Answered
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleApplyLevel} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Set {overallResult.cefrLevel} as My Level
            </Button>
            <Link href="/entry-test">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake Test
              </Button>
            </Link>
          </CardFooter>
        </div>
      </Card>

      {/* Section Breakdown */}
      {sectionScores && sectionScores.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Skills Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionScores.map((score) => {
              const section = template.sections?.find(
                (s: { id: string }) => s.id === score.sectionId
              );
              return (
                <SkillScoreCard
                  key={score.sectionId}
                  skill={section?.title || score.sectionId}
                  score={score.percentageScore}
                  level={score.cefrLevel as CEFRLevel}
                  questionsCorrect={score.correctCount}
                  questionsTotal={score.totalQuestions}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">What&apos;s Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
              <span>
                Based on your {overallResult.cefrLevel} level, we&apos;ll recommend
                lessons tailored to your current abilities.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
              <span>
                Focus on areas where you scored lower to improve faster.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
              <span>
                You can retake this test at any time to track your progress.
              </span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard" className="w-full">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
