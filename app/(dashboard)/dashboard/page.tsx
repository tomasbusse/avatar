"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  StatsRow,
  ContinueLearningCard,
  TalkToAvatarCard,
  LessonsSection,
  GamesSection,
} from "@/components/dashboard";

export default function DashboardPage() {
  const user = useQuery(api.users.getCurrentUser);
  const student = useQuery(api.students.getStudent);
  const enrollments = useQuery(api.lessonEnrollments.getStudentEnrollments, {});
  const mostRecentEnrollment = useQuery(
    api.dashboard.getMostRecentInProgressEnrollment
  );
  const games = useQuery(api.dashboard.getGamesFromEnrolledLessons, {
    limit: 4,
  });
  const createAdmin = useMutation(api.users.createCurrentUserAsAdmin);

  const firstName = user?.firstName ?? "there";
  const isLoading = user === undefined || student === undefined;

  // Get active lessons (enrolled or in progress) for the lessons section
  const activeLessons =
    enrollments?.filter(
      (e) =>
        e.status === "enrolled" ||
        e.status === "in_progress" ||
        e.status === "completed"
    ) ?? [];

  const handleSetupAdmin = async () => {
    try {
      const result = await createAdmin();
      toast.success(`Admin ${result.action}! Refresh the page.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed";
      toast.error(message);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {firstName}!
          </h1>
          <p className="text-muted-foreground">
            Ready to practice your English today?
          </p>
        </div>

        {/* Admin Setup Banner */}
        {!user && (
          <Card className="border-amber-500/50 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    Setup Admin Account
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Create your admin account to manage the platform
                  </p>
                </div>
                <Button onClick={handleSetupAdmin} variant="outline">
                  Become Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Onboarding Prompt */}
        {!student?.onboardingCompleted && user && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Complete your profile
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Tell us about your learning goals to get personalized
                    lessons
                  </p>
                </div>
                <Link href="/onboarding">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero Section - Two Cards */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ContinueLearningCard
            enrollment={mostRecentEnrollment ?? null}
            isLoading={mostRecentEnrollment === undefined}
          />
          <TalkToAvatarCard
            avatarName="Emma"
            greeting="Ready to practice your speaking?"
          />
        </div>

        {/* Stats Row */}
        <StatsRow
          streak={student?.currentStreak ?? 0}
          level={student?.currentLevel ?? "A1"}
          minutesPracticed={student?.totalMinutesPracticed ?? 0}
          lessonsCompleted={student?.totalLessonsCompleted ?? 0}
        />

        {/* Main Content - Lessons and Games */}
        <div className="grid lg:grid-cols-2 gap-6">
          <LessonsSection
            enrollments={activeLessons}
            isLoading={enrollments === undefined}
            maxItems={4}
          />
          <GamesSection
            games={games ?? []}
            isLoading={games === undefined}
            maxItems={4}
          />
        </div>
      </div>
    </div>
  );
}
