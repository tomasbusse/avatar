"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LessonRoom } from "@/components/lesson/lesson-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, ArrowLeft, Clock, MessageSquare } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function PracticeRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // Check if user is authenticated
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  // Query session data
  const session = useQuery(
    api.sessions.getSession,
    sessionId ? { sessionId: sessionId as Id<"sessions"> } : "skip"
  );

  // Get practice data if this is a conversation practice session
  const practice = useQuery(
    api.conversationPractice.getById,
    session?.conversationPracticeId
      ? { practiceId: session.conversationPracticeId }
      : "skip"
  );

  // Only query user/student if signed in
  const user = useQuery(
    api.users.getCurrentUser,
    isSignedIn ? undefined : "skip"
  );
  const student = useQuery(
    api.students.getStudent,
    isSignedIn ? undefined : "skip"
  );

  // Get the avatar for the session
  const avatar = useQuery(
    api.avatars.getAvatar,
    session?.avatarId ? { avatarId: session.avatarId } : "skip"
  );

  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState<number>(Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const sessionInitializedRef = useRef(false);

  // Update elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - startTime) / 60000));
    }, 60000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Initialize session when data is loaded
  useEffect(() => {
    if (sessionInitializedRef.current) return;

    if (session && session.roomName) {
      sessionInitializedRef.current = true;
      setRoomName(session.roomName);
      console.log("[PracticeRoomPage] Session loaded:", session.roomName);
    }
  }, [session]);

  // Determine participant name
  const isGuestSession = !isSignedIn && session?.isGuest;
  const participantName = isGuestSession
    ? session?.guestName || "Guest"
    : user?.firstName || clerkUser?.firstName || "Student";

  // Get target duration from practice config
  const targetDurationMinutes = practice?.behaviorConfig?.targetDurationMinutes;

  const handleSessionEnd = async () => {
    // Guests go back to home, authenticated users go to dashboard
    router.push(isSignedIn ? "/dashboard" : "/");
  };

  // Wait for auth to load
  if (!authLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFE8CD]">
        <Loader2 className="w-8 h-8 animate-spin text-[#003F37]" />
      </div>
    );
  }

  // Wait for session to load
  if (session === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFE8CD]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#003F37]" />
          <p className="text-lg font-medium text-[#003F37]">Loading session...</p>
        </div>
      </div>
    );
  }

  // Session not found
  if (session === null) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-[#FFE8CD]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#B25627]">
              <AlertCircle className="w-5 h-5" />
              Session Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#4F5338] mb-4">
              This practice session could not be found. It may have expired or been removed.
            </p>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For authenticated users, wait for user/student data
  if (isSignedIn && (!user || !student)) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFE8CD]">
        <Loader2 className="w-8 h-8 animate-spin text-[#003F37]" />
      </div>
    );
  }

  // For guests, verify they have access to this session
  if (!isSignedIn && session && !session.isGuest) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-[#FFE8CD]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#B25627]">
              <AlertCircle className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#4F5338] mb-4">
              This practice session requires you to sign in.
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
      <div className="h-screen flex items-center justify-center p-4 bg-[#FFE8CD]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#B25627]">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#4F5338] mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/")} variant="outline">
                Go Home
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

  // Wait for room and avatar
  const isAvatarLoading = session.avatarId && avatar === undefined;

  if (!roomName || isAvatarLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFE8CD]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#003F37]" />
          <p className="text-lg font-medium text-[#003F37]">
            Connecting to {avatar?.name || "your practice partner"}...
          </p>
          <p className="text-[#4F5338]">
            Getting everything ready
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative">
      {/* Practice info overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        {targetDurationMinutes && (
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
            <Clock className="w-4 h-4 text-[#003F37]" />
            <span className="text-sm font-medium text-[#003F37]">
              {elapsedMinutes} / {targetDurationMinutes} min
            </span>
          </div>
        )}
        {practice?.behaviorConfig?.conversationStyle && (
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
            <MessageSquare className="w-4 h-4 text-[#003F37]" />
            <span className="text-sm font-medium text-[#003F37] capitalize">
              {practice.behaviorConfig.conversationStyle}
            </span>
          </div>
        )}
      </div>

      <LessonRoom
        key={roomName}
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
