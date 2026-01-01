"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  BookOpen,
  Flame,
  Clock,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Presentation,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardPage() {
  const user = useQuery(api.users.getCurrentUser);
  const student = useQuery(api.students.getStudent);
  const createAdmin = useMutation(api.users.createCurrentUserAsAdmin);

  const firstName = user?.firstName ?? "there";

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-muted-foreground">
            Ready to practice your English today?
          </p>
        </div>

        {!user && (
          <Card className="mb-8 border-amber-500/50 bg-amber-50">
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

        {!student?.onboardingCompleted && user && (
          <Card className="mb-8 border-primary/50 bg-primary/5">
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

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <QuickStartCard
                  title="Start a Lesson"
                  description="Practice with Ludwig"
                  href="/lesson/new"
                  primary
                />
                <QuickStartCard
                  title="Free Conversation"
                  description="Practice speaking naturally"
                  href="/lesson/new"
                />
                <QuickStartCard
                  title="Presentation Mode"
                  description="Upload slides and teach"
                  href="/lesson/new?mode=presentation"
                  icon={<Presentation className="w-5 h-5" />}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Your Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-orange-500 mb-2">
                  {student?.currentStreak ?? 0}
                </div>
                <p className="text-muted-foreground text-sm">
                  {student?.currentStreak === 0
                    ? "Start your streak today!"
                    : "days in a row"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Lessons Completed"
            value={student?.totalLessonsCompleted ?? 0}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Minutes Practiced"
            value={student?.totalMinutesPracticed ?? 0}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Current Level"
            value={student?.currentLevel ?? "A1"}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recommended Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Complete onboarding to get personalized recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickStartCard({
  title,
  description,
  href,
  primary = false,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  primary?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block p-4 rounded-lg border transition-colors ${
        primary
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card hover:bg-accent"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={primary ? "text-primary-foreground" : "text-primary"}>{icon}</span>}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p
        className={`text-sm ${
          primary ? "text-primary-foreground/80" : "text-muted-foreground"
        }`}
      >
        {description}
      </p>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
