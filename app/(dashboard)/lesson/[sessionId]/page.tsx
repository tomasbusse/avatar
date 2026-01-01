"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LessonRoom } from "@/components/lesson/lesson-room";
import { TeachingRoom } from "@/components/lesson/teaching-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { generateRoomName } from "@/lib/utils";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const avatarParam = searchParams.get("avatar");
  const modeParam = searchParams.get("mode");

  const user = useQuery(api.users.getCurrentUser);
  const student = useQuery(api.students.getStudent);
  const defaultAvatar = useQuery(api.avatars.getDefaultAvatar);

  // Query existing session data (for structured lessons with pre-loaded presentations)
  const existingSession = useQuery(
    api.sessions.getSession,
    !isNewSession(sessionId) ? { sessionId: sessionId as Id<"sessions"> } : "skip"
  );

  // Determine which avatar to use
  // For existing sessions with a structuredLessonId, use the session's avatar
  const avatarId = existingSession?.avatarId
    ? existingSession.avatarId
    : avatarParam
      ? (avatarParam as Id<"avatars">)
      : (student?.preferences?.preferredAvatarId ?? defaultAvatar?._id);

  // Query the full avatar with personality, identity, etc.
  const avatar = useQuery(
    api.avatars.getAvatar,
    avatarId ? { avatarId: avatarId as Id<"avatars"> } : "skip"
  );

  // Check if this is a structured lesson with pre-loaded presentation
  const hasPreloadedPresentation = existingSession?.presentationMode?.active === true;
  const isPresentationMode = modeParam === "presentation" || hasPreloadedPresentation;

  const [roomName, setRoomName] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"presentation" | "free_conversation">("free_conversation");

  const createSession = useMutation(api.sessions.createSession);

  // Helper to check if session is new
  function isNewSession(id: string): boolean {
    return id === "new";
  }

  useEffect(() => {
    async function initSession() {
      if (!student || !user) return;

      const isNew = isNewSession(sessionId);

      if (isNew) {
        setIsCreating(true);
        try {
          const newRoomName = generateRoomName();

          if (!avatarId) {
            setError("No avatar available. Please run the seed script first.");
            setIsCreating(false);
            return;
          }

          const type = isPresentationMode ? "presentation" : "free_conversation";
          setSessionType(type);

          await createSession({
            avatarId: avatarId as Id<"avatars">,
            type,
            roomName: newRoomName,
          });

          setRoomName(newRoomName);
        } catch (err) {
          console.error("Failed to create session:", err);
          setError("Failed to start lesson. Please try again.");
        } finally {
          setIsCreating(false);
        }
      } else {
        // Existing session - use the session's room name
        if (existingSession) {
          setRoomName(existingSession.roomName);
          // Set session type based on existing session
          // Handle structured_lesson type - treat it as presentation mode
          if (existingSession.presentationMode?.active ||
              existingSession.type === "presentation" ||
              existingSession.type === "structured_lesson") {
            setSessionType("presentation");
          } else {
            setSessionType("free_conversation");
          }
        }
      }
    }

    initSession();
  }, [student, user, avatarId, sessionId, existingSession, createSession, isPresentationMode]);

  const handleSessionEnd = async () => {
    router.push("/dashboard");
  };

  if (!user || !student) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/dashboard")} variant="outline">
                Back to Dashboard
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wait for room AND avatar to be ready before rendering
  // avatar === undefined means query is still loading
  // avatar === null means avatar not found (error case)
  const isAvatarLoading = avatarId && avatar === undefined;
  const avatarNotFound = avatarId && avatar === null;

  // Debug log
  console.log("[LESSON PAGE] State:", {
    avatarId,
    avatar: avatar ? "loaded" : avatar === null ? "null" : "undefined",
    isAvatarLoading,
    avatarNotFound,
    roomName,
    isCreating,
  });

  if (avatarNotFound) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Avatar Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The selected avatar could not be found. It may have been deleted.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/dashboard")} variant="outline">
                Back to Dashboard
              </Button>
              <Button onClick={() => {
                // Remove avatar param and reload
                router.push(`/lesson/new`);
              }}>
                Use Default Avatar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For existing sessions, wait for session data to load
  const isExistingSessionLoading = !isNewSession(sessionId) && existingSession === undefined;

  if (isCreating || !roomName || isAvatarLoading || isExistingSessionLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Preparing your lesson...</p>
          <p className="text-muted-foreground">
            Setting up your room with {avatar?.name || "your teacher"}
          </p>
        </div>
      </div>
    );
  }

  // Use TeachingRoom for presentation mode or pre-loaded presentations
  const RoomComponent = (sessionType === "presentation" || hasPreloadedPresentation) ? TeachingRoom : LessonRoom;

  return (
    <div className="h-screen">
      <RoomComponent
        sessionId={sessionId}
        roomName={roomName}
        participantName={user.firstName || "Student"}
        avatar={avatar}
        onSessionEnd={handleSessionEnd}
      />
    </div>
  );
}
