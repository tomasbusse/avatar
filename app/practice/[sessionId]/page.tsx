"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";

const LessonRoom = dynamic(() => import("@/components/lesson/lesson-room").then(mod => ({ default: mod.LessonRoom })), { ssr: false });
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, ArrowLeft, Clock, MessageSquare, CheckCircle2, RefreshCw, Mail, Phone, Globe, LayoutDashboard } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PracticeRoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;

  // Check if we're in embed mode
  const isEmbed = searchParams.get("embed") === "true";

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

  // Get monthly usage for the practice (for usage limit badge)
  const monthlyUsage = useQuery(
    api.practiceUsage.getMonthlyUsage,
    session?.conversationPracticeId
      ? { practiceId: session.conversationPracticeId }
      : "skip"
  );

  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const sessionInitializedRef = useRef(false);

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
    if (isEmbed) {
      // In embed mode, notify parent window and don't navigate
      if (typeof window !== "undefined" && window.parent !== window) {
        window.parent.postMessage({ type: "practice-session-ended", sessionId }, "*");
      }
      return;
    }
    setSessionEnded(true);
  };

  // Build restart URL from the practice share token
  const restartUrl = practice?.shareToken
    ? `/practice/join/${practice.shareToken}${isEmbed ? "?embed=true" : ""}`
    : null;

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

  // Session ended - show completion screen with contact info and restart
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-[#FFE8CD] flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6">
          {/* Success card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#003F37]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#003F37]" />
              </div>
              <h1 className="text-2xl font-bold text-[#003F37] mb-2">
                Session Complete
              </h1>
              <p className="text-[#4F5338]">
                Great job, {participantName}! Thank you for practising with {avatar?.name || "us"}.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {restartUrl && (
              <Link href={restartUrl} className="w-full">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-[#003F37] hover:bg-[#004a40] text-[#FFE8CD]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start New Session
                </Button>
              </Link>
            )}
            {isSignedIn && (
              <Link href="/dashboard" className="w-full">
                <Button size="lg" variant="outline" className="w-full gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>

          {/* Contact card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 pb-6">
              <h2 className="font-semibold text-[#003F37] mb-4 text-center">
                Interested in more? Get in touch!
              </h2>
              <div className="space-y-3">
                <a
                  href="mailto:james@englisch-lehrer.com"
                  className="flex items-center gap-3 text-[#4F5338] hover:text-[#003F37] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#003F37]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#003F37]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#003F37]">Email</p>
                    <p className="text-sm">james@englisch-lehrer.com</p>
                  </div>
                </a>
                <a
                  href="tel:+4951147393339"
                  className="flex items-center gap-3 text-[#4F5338] hover:text-[#003F37] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#003F37]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#003F37]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#003F37]">Phone</p>
                    <p className="text-sm">+49 511 47 39 339</p>
                  </div>
                </a>
                <a
                  href="https://simmonds.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#4F5338] hover:text-[#003F37] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#003F37]/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-[#003F37]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#003F37]">Website</p>
                    <p className="text-sm">simmonds.online</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-[#4F5338]/70">
            Simmonds Language Services &middot; Die Simmonds Methode
          </p>
        </div>
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
        {monthlyUsage?.limits?.enabled && monthlyUsage.remainingMinutes !== null && (
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
            <Clock className="w-4 h-4 text-[#003F37]" />
            <span className={cn(
              "text-sm font-medium",
              monthlyUsage.warningReached ? "text-amber-600" : "text-[#003F37]"
            )}>
              {monthlyUsage.remainingMinutes} min left this month
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
        isEmbed={isEmbed}
        durationMinutes={targetDurationMinutes || 15}
      />
    </div>
  );
}
