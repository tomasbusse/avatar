"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Enrollment {
  _id: string;
  status: string;
  progress?: number;
  lesson: {
    _id: string;
    title: string;
    description?: string;
    shareToken: string;
    sessionType?: string;
  };
}

interface ContinueLearningCardProps {
  enrollment: Enrollment | null;
  isLoading?: boolean;
}

export function ContinueLearningCard({
  enrollment,
  isLoading,
}: ContinueLearningCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div className="animate-pulse">
            <div className="h-6 bg-primary/20 rounded w-3/4 mb-2" />
            <div className="h-4 bg-primary/10 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!enrollment) {
    return (
      <Card className="h-full bg-gradient-to-br from-muted/50 to-muted border-dashed">
        <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No active lessons</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse available lessons to get started
          </p>
          <Link href="/lessons">
            <Button variant="outline" size="sm">
              Browse Lessons
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { lesson, progress = 0, status } = enrollment;
  const isInProgress = status === "in_progress";

  return (
    <Card className="h-full bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-colors">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Continue Learning
              </p>
              <Badge
                variant="outline"
                className={
                  isInProgress
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }
              >
                {isInProgress ? "In Progress" : "Ready to Start"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {lesson.description}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {isInProgress && progress > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Link href={`/lesson/${lesson.shareToken}`} className="block">
            <Button className="w-full" size="lg">
              <Play className="w-4 h-4 mr-2" />
              {isInProgress ? "Continue" : "Start Lesson"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
