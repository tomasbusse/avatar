"use client";

import { useEffect, useState, useRef } from "react";
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
import { useAuth } from "@clerk/nextjs";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const avatarParam = searchParams.get("avatar");
  const modeParam = searchParams.get("mode");

  // Check if user is authenticated
  const { isLoaded: authLoaded, isSignedIn } = useAuth();

  // Only query user/student if signed in
  const user = useQuery(
    api.users.getCurrentUser,
    isSignedIn ? undefined : "skip"
  );
  const student = useQuery(
    api.students.getStudent,
    isSignedIn ? undefined : "skip"
  );
  const fallbackAvatar = useQuery(api.avatars.getFirstActiveAvatar);

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
      : (student?.preferences?.preferredAvatarId ?? fallbackAvatar?._id);

  // Determine if this is a guest session
  const isGuestSession = !isSignedIn && existingSession?.guestName;
  const participantName = isGuestSession
    ? existingSession.guestName || "Guest"
    : user?.firstName || "Student";

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

  // Prevent multiple session initializations
  const sessionInitializedRef = useRef(false);

  const createSession = useMutation(api.sessions.createSession);

  // Helper to check if session is new
  function isNewSession(id: string): boolean {
    return id === "new";
  }

  useEffect(() => {
    async function initSession() {
      // Prevent re-initialization
      if (sessionInitializedRef.current) return;

      // For authenticated users, wait for user/student data
      // For guests with existing sessions, proceed without user data
      if (isSignedIn && (!student || !user)) return;
      if (!isSignedIn && !existingSession) return; // Guests need existing session

      const isNew = isNewSession(sessionId);

      if (isNew) {
        // Mark as initialized BEFORE async work to prevent race conditions
        sessionInitializedRef.current = true;
        setIsCreating(true);
        try {
          const newRoomName = generateRoomName();

          if (!avatarId) {
            setError("No avatar available. Please run the seed script first.");
            setIsCreating(false);
            sessionInitializedRef.current = false; // Reset on error
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
          console.log("[LessonPage] Session created successfully:", newRoomName);
        } catch (err) {
          console.error("Failed to create session:", err);
          setError("Failed to start lesson. Please try again.");
          sessionInitializedRef.current = false; // Reset on error
        } finally {
          setIsCreating(false);
        }
      } else {
        // Existing session - use the session's room name
        if (existingSession && !sessionInitializedRef.current) {
          sessionInitializedRef.current = true;
          setRoomName(existingSession.roomName);
          console.log("[LessonPage] Using existing session:", existingSession.roomName);
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
  }, [student, user, avatarId, sessionId, existingSession, createSession, isPresentationMode, isSignedIn]);

  const handleSessionEnd = async () => {
    // Guests go back to home, authenticated users go to dashboard
    router.push(isSignedIn ? "/dashboard" : "/");
  };

  // Wait for auth to load
  if (!authLoaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // For authenticated users, wait for user/student data
  if (isSignedIn && (!user || !student)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // For guests, verify they have access to this session
  if (!isSignedIn && existingSession && !existingSession.guestName) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This lesson requires you to sign in.
            </p>
            <Button onClick={() => router.push("/sign-in")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
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

  // Debug log - CRITICAL: Log all avatar fields to trace config
  console.log("[LESSON PAGE] State:", {
    avatarId,
    avatar: avatar ? "loaded" : avatar === null ? "null" : "undefined",
    isAvatarLoading,
    avatarNotFound,
    roomName,
    isCreating,
  });

  // CRITICAL DEBUG: Log avatar config fields
  if (avatar) {
    console.log("[LESSON PAGE] Avatar config fields:", {
      name: avatar.name,
      hasLlmConfig: !!avatar.llmConfig,
      llmModel: avatar.llmConfig?.model,
      hasVoiceProvider: !!avatar.voiceProvider,
      voiceModel: avatar.voiceProvider?.model,
      voiceId: avatar.voiceProvider?.voiceId,
      allKeys: Object.keys(avatar),
    });
  }

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
        key={roomName} // Stable key prevents remounting when parent re-renders
        sessionId={sessionId}
        roomName={roomName}
        participantName={participantName}
        avatar={avatar}
        onSessionEnd={handleSessionEnd}
        isGuest={!isSignedIn}
      />
    </div>
  );
}
