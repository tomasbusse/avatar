"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  ArrowRight,
  Play,
  Calendar,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Enrollment {
  _id: string;
  status: string;
  progress?: number;
  dueDate?: number;
  lesson: {
    _id: string;
    title: string;
    description?: string;
    shareToken: string;
    sessionType?: string;
  };
  avatar?: {
    _id: string;
    name: string;
  } | null;
}

interface LessonsSectionProps {
  enrollments: Enrollment[];
  isLoading?: boolean;
  maxItems?: number;
}

export function LessonsSection({
  enrollments,
  isLoading,
  maxItems = 4,
}: LessonsSectionProps) {
  const displayEnrollments = enrollments.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Your Lessons
          </CardTitle>
          <Link href="/lessons">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayEnrollments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-3">No lessons assigned yet</p>
            <Link href="/lessons">
              <Button variant="outline" size="sm">
                Browse Lessons
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {displayEnrollments.map((enrollment) => (
              <LessonItem key={enrollment._id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LessonItem({ enrollment }: { enrollment: Enrollment }) {
  const { lesson, status, progress, dueDate } = enrollment;
  const isInProgress = status === "in_progress";
  const isCompleted = status === "completed";

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    enrolled: { bg: "bg-blue-100", text: "text-blue-800", label: "Assigned" },
    in_progress: { bg: "bg-yellow-100", text: "text-yellow-800", label: "In Progress" },
    completed: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
  };

  const config = statusConfig[status] || statusConfig.enrolled;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <GraduationCap className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{lesson.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className={`${config.bg} ${config.text} border-transparent text-xs`}
          >
            {config.label}
          </Badge>
          {dueDate && !isCompleted && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Due {formatDistanceToNow(dueDate, { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isInProgress && progress !== undefined && progress > 0 && (
          <div className="w-16 hidden sm:block">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        <Link href={`/lesson/${lesson.shareToken}`}>
          <Button
            size="sm"
            variant={isCompleted ? "outline" : "default"}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="w-3 h-3 mr-1" />
            {isInProgress ? "Continue" : isCompleted ? "Review" : "Start"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
