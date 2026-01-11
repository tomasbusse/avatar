"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  Users,
  Loader2,
  GraduationCap,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const levelColors: Record<string, string> = {
  A1: "bg-green-100 text-green-800 border-green-200",
  A2: "bg-emerald-100 text-emerald-800 border-emerald-200",
  B1: "bg-blue-100 text-blue-800 border-blue-200",
  B2: "bg-indigo-100 text-indigo-800 border-indigo-200",
  C1: "bg-purple-100 text-purple-800 border-purple-200",
  C2: "bg-violet-100 text-violet-800 border-violet-200",
};

const statusColors: Record<string, string> = {
  enrolled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

export default function LessonsPage() {
  const student = useQuery(api.students.getStudent);
  const enrollments = useQuery(api.lessonEnrollments.getStudentEnrollments, {});
  const availableLessons = useQuery(api.lessonEnrollments.getAvailableLessons, {});
  const selfEnroll = useMutation(api.lessonEnrollments.selfEnroll);

  const isLoading = enrollments === undefined || availableLessons === undefined;

  // Group enrollments by status
  const assignedLessons = enrollments?.filter(
    (e) => e.status === "enrolled" && (e.type === "admin_assigned" || e.type === "group_assigned")
  ) ?? [];
  const inProgressLessons = enrollments?.filter((e) => e.status === "in_progress") ?? [];
  const completedLessons = enrollments?.filter((e) => e.status === "completed") ?? [];
  const allEnrolled = enrollments?.filter((e) => e.status !== "dropped") ?? [];

  const handleSelfEnroll = async (lessonId: string) => {
    try {
      await selfEnroll({ lessonId: lessonId as any });
      toast.success("Successfully enrolled in lesson!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to enroll";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Lessons</h1>
          <p className="text-muted-foreground">
            View your assigned lessons and track your progress
          </p>
        </div>

        {/* Current Level Indicator */}
        {student?.currentLevel && (
          <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="font-medium">Your current level:</span>
              <Badge className={levelColors[student.currentLevel] || "bg-gray-100"}>
                {student.currentLevel}
              </Badge>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            label="Total Enrolled"
            value={allEnrolled.length}
            icon={<BookOpen className="w-5 h-5" />}
          />
          <StatsCard
            label="In Progress"
            value={inProgressLessons.length}
            icon={<Clock className="w-5 h-5" />}
            highlight
          />
          <StatsCard
            label="Completed"
            value={completedLessons.length}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatsCard
            label="Available"
            value={availableLessons?.length ?? 0}
            icon={<Plus className="w-5 h-5" />}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="assigned">
              Assigned ({assignedLessons.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({inProgressLessons.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedLessons.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available ({availableLessons?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* Assigned Lessons */}
          <TabsContent value="assigned">
            {assignedLessons.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-12 h-12" />}
                title="No assigned lessons"
                description="Your instructor hasn't assigned any lessons yet."
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedLessons.map((enrollment) => (
                  <EnrollmentCard
                    key={enrollment._id}
                    enrollment={enrollment}
                    showDueDate
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* In Progress */}
          <TabsContent value="in_progress">
            {inProgressLessons.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-12 h-12" />}
                title="No lessons in progress"
                description="Start a lesson to see it here."
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressLessons.map((enrollment) => (
                  <EnrollmentCard
                    key={enrollment._id}
                    enrollment={enrollment}
                    showProgress
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed */}
          <TabsContent value="completed">
            {completedLessons.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-12 h-12" />}
                title="No completed lessons yet"
                description="Complete lessons to see them here."
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedLessons.map((enrollment) => (
                  <EnrollmentCard
                    key={enrollment._id}
                    enrollment={enrollment}
                    showCompletedDate
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Available for Self-Enrollment */}
          <TabsContent value="available">
            {!availableLessons || availableLessons.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-12 h-12" />}
                title="No lessons available"
                description="Check back later for new lessons."
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableLessons.map((lesson) => (
                  <AvailableLessonCard
                    key={lesson._id}
                    lesson={lesson}
                    onEnroll={() => handleSelfEnroll(lesson._id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}>
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

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground opacity-50 mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function EnrollmentCard({
  enrollment,
  showDueDate = false,
  showProgress = false,
  showCompletedDate = false,
}: {
  enrollment: any;
  showDueDate?: boolean;
  showProgress?: boolean;
  showCompletedDate?: boolean;
}) {
  const lesson = enrollment.lesson;
  const avatar = enrollment.avatar;

  if (!lesson) return null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge
            variant="outline"
            className={statusColors[enrollment.status] || "bg-gray-100"}
          >
            {enrollment.status.replace("_", " ")}
          </Badge>
          {enrollment.type === "group_assigned" && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="w-3 h-3 mr-1" />
              Group
            </div>
          )}
        </div>
        <CardTitle className="text-lg mt-2">{lesson.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {lesson.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {lesson.description}
          </p>
        )}

        {avatar && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <span>with {avatar.name}</span>
          </div>
        )}

        {showDueDate && enrollment.dueDate && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Due {formatDistanceToNow(enrollment.dueDate, { addSuffix: true })}</span>
          </div>
        )}

        {showProgress && enrollment.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{enrollment.progress}%</span>
            </div>
            <Progress value={enrollment.progress} className="h-2" />
          </div>
        )}

        {showCompletedDate && enrollment.completedAt && (
          <div className="flex items-center gap-2 mb-4 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed {formatDistanceToNow(enrollment.completedAt, { addSuffix: true })}</span>
          </div>
        )}

        <Link href={`/lesson/${lesson.shareToken}`}>
          <Button className="w-full" size="sm">
            <Play className="w-4 h-4 mr-2" />
            {enrollment.status === "completed" ? "Review Lesson" :
             enrollment.status === "in_progress" ? "Continue" : "Start Lesson"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function AvailableLessonCard({
  lesson,
  onEnroll,
}: {
  lesson: any;
  onEnroll: () => void;
}) {
  const avatar = lesson.avatar;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Open Enrollment
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Users className="w-3 h-3 mr-1" />
            {lesson.enrollmentCount} enrolled
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{lesson.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {lesson.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {lesson.description}
          </p>
        )}

        {avatar && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <span>with {avatar.name}</span>
          </div>
        )}

        {lesson.enrollmentSettings?.maxEnrollments && (
          <div className="text-sm text-muted-foreground mb-4">
            {lesson.enrollmentSettings.maxEnrollments - lesson.enrollmentCount} spots remaining
          </div>
        )}

        <Button className="w-full" size="sm" onClick={onEnroll}>
          <Plus className="w-4 h-4 mr-2" />
          Enroll Now
        </Button>
      </CardContent>
    </Card>
  );
}
