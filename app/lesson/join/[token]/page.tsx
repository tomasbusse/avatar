"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Loader2,
  Play,
  GraduationCap,
  Presentation,
  Lock,
  AlertCircle,
  FileText,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function JoinLessonPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { isLoaded, isSignedIn } = useAuth();

  const lesson = useQuery(api.structuredLessons.getByShareToken, { shareToken: token });
  const createSession = useMutation(api.sessions.createFromStructuredLesson);
  const startLessonEnrollment = useMutation(api.lessonEnrollments.startLesson);

  const [isStarting, setIsStarting] = useState(false);
  const [guestName, setGuestName] = useState("");

  // Loading state
  if (!isLoaded || lesson === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Lesson not found
  if (lesson === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-2">Lesson Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This lesson link is invalid or has been removed.
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auth required but not signed in
  if (lesson.requiresAuth && !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>{lesson.title}</CardTitle>
            <CardDescription>
              This lesson requires you to sign in first
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lesson.description && (
              <p className="text-sm text-muted-foreground text-center">
                {lesson.description}
              </p>
            )}
            <div className="flex justify-center">
              <SignInButton mode="modal">
                <Button size="lg">
                  <User className="w-4 h-4 mr-2" />
                  Sign In to Continue
                </Button>
              </SignInButton>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartLesson = async () => {
    if (!isSignedIn && !guestName.trim()) {
      toast.error("Please enter your name to continue");
      return;
    }

    setIsStarting(true);
    try {
      // Track enrollment if user is signed in
      if (isSignedIn) {
        try {
          await startLessonEnrollment({ lessonId: lesson._id });
        } catch (enrollError) {
          // Continue even if enrollment tracking fails (e.g., not enrolled)
          console.log("[JOIN PAGE] Enrollment tracking skipped:", enrollError);
        }
      }

      // Generate a unique room name
      const roomName = `lesson-${token}-${Date.now()}`;

      const result = await createSession({
        structuredLessonId: lesson._id,
        roomName,
        guestName: !isSignedIn ? guestName.trim() : undefined,
      });

      console.log("[JOIN PAGE] Session created:", {
        sessionId: result.sessionId,
        presentationId: result.presentationId,
        hasPresentation: result.hasPresentation,
        avatarId: result.avatarId,
        roomName,
        lessonId: lesson._id,
        lessonPresentationId: lesson.presentationId,
        lessonKnowledgeContentId: lesson.knowledgeContentId,
      });

      // Redirect to the lesson session
      router.push(`/lesson/${result.sessionId}`);
    } catch (error) {
      console.error("Failed to start lesson:", error);
      toast.error("Failed to start lesson. Please try again.");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {/* Avatar Image */}
          {lesson.avatar && (
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 bg-cover bg-center border-4 border-primary/20 flex items-center justify-center bg-primary/10"
              style={lesson.avatar.appearance?.avatarImage ? {
                backgroundImage: `url(${lesson.avatar.appearance.avatarImage})`,
              } : undefined}
            >
              {!lesson.avatar.appearance?.avatarImage && (
                <span className="text-3xl font-bold text-primary">
                  {lesson.avatar.name?.charAt(0).toUpperCase() || "T"}
                </span>
              )}
            </div>
          )}

          {/* Lesson Type Icon */}
          <div className="flex justify-center mb-2">
            {lesson.sessionType === "presentation" ? (
              <Presentation className="w-6 h-6 text-primary" />
            ) : (
              <GraduationCap className="w-6 h-6 text-primary" />
            )}
          </div>

          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
          {lesson.description && (
            <CardDescription className="mt-2">{lesson.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Lesson Info */}
          <div className="space-y-3 text-sm">
            {lesson.avatar && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div
                  className="w-10 h-10 rounded-full bg-cover bg-center flex items-center justify-center bg-primary/10"
                  style={lesson.avatar.appearance?.avatarImage ? {
                    backgroundImage: `url(${lesson.avatar.appearance.avatarImage})`,
                  } : undefined}
                >
                  {!lesson.avatar.appearance?.avatarImage && (
                    <span className="text-sm font-bold text-primary">
                      {lesson.avatar.name?.charAt(0).toUpperCase() || "T"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{lesson.avatar.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lesson.avatar.persona?.role || "Your AI Teacher"}
                  </p>
                </div>
              </div>
            )}

            {(lesson.knowledgeContent || lesson.presentation) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {lesson.knowledgeContent?.title ||
                      lesson.presentation?.name ||
                      "Learning Materials"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lesson.presentation
                      ? `${lesson.presentation.totalSlides} slides`
                      : "Structured lesson content"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Welcome Message */}
          {lesson.welcomeMessage && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm italic">&ldquo;{lesson.welcomeMessage}&rdquo;</p>
            </div>
          )}

          {/* Guest Name Input (if not signed in and no auth required) */}
          {!isSignedIn && !lesson.requiresAuth && (
            <div>
              <label className="text-sm font-medium">Your Name</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="Enter your name"
              />
            </div>
          )}

          {/* Start Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleStartLesson}
            disabled={isStarting || (!isSignedIn && !lesson.requiresAuth && !guestName.trim())}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Lesson...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Lesson
              </>
            )}
          </Button>

          {/* Sign in option for guests */}
          {!isSignedIn && !lesson.requiresAuth && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Already have an account?
              </p>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign in for a better experience
                </Button>
              </SignInButton>
            </div>
          )}

          {/* Session count */}
          <p className="text-xs text-center text-muted-foreground">
            {lesson.totalSessions} student{lesson.totalSessions !== 1 ? "s" : ""} have taken this lesson
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
