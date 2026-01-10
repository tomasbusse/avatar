"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StartButton, WaitingScreen, GuestEntryForm } from "@/components/practice";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, BookOpen, MessageSquare, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type EntryState = "loading" | "not_found" | "auth_required" | "guest_form" | "ready" | "connecting" | "error";

interface GuestFormData {
  name?: string;
  email?: string;
  customFields?: Record<string, string>;
  acceptedTerms?: boolean;
}

export default function PracticeJoinPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();

  const [state, setState] = useState<EntryState>("loading");
  const [guestData, setGuestData] = useState<GuestFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch practice data by share token
  const practiceData = useQuery(api.conversationPractice.getByShareToken, {
    shareToken: token,
  });

  // Create session mutation
  const createSession = useMutation(api.conversationPractice.createSession);

  // Determine state based on data
  useEffect(() => {
    if (!isUserLoaded) return;

    if (practiceData === undefined) {
      setState("loading");
      return;
    }

    if (practiceData === null) {
      setState("not_found");
      return;
    }

    const { practice, isAuthenticated } = practiceData;

    // Check access mode
    if (practice.accessMode === "authenticated_only" && !isAuthenticated) {
      setState("auth_required");
      return;
    }

    // Check if guest form needed
    if (!isAuthenticated && practice.accessMode !== "authenticated_only") {
      const needsGuestForm =
        practice.guestSettings?.collectName ||
        practice.guestSettings?.collectEmail ||
        practice.guestSettings?.termsRequired;

      if (needsGuestForm && !guestData) {
        setState("guest_form");
        return;
      }
    }

    setState("ready");
  }, [practiceData, isUserLoaded, guestData, user]);

  // Handle guest form submission
  const handleGuestFormSubmit = (data: GuestFormData) => {
    setGuestData(data);
    setState("ready");
  };

  // Handle start conversation
  const handleStart = async () => {
    if (!practiceData?.practice) return;

    setState("connecting");

    try {
      // Generate unique room name
      const roomName = `practice_${token}_${Date.now()}`;

      // Create session
      const session = await createSession({
        practiceId: practiceData.practice._id,
        roomName,
        guestName: guestData?.name,
        guestMetadata: guestData
          ? {
              email: guestData.email,
              customFields: guestData.customFields,
              acceptedTermsAt: guestData.acceptedTerms ? Date.now() : undefined,
              referrer: typeof window !== "undefined" ? document.referrer : undefined,
            }
          : undefined,
      });

      // Navigate to the practice room
      router.push(`/practice/${session.sessionId}`);
    } catch (err) {
      console.error("Failed to create session:", err);
      setError(err instanceof Error ? err.message : "Failed to start practice session");
      setState("error");
    }
  };

  // Handle cancel from waiting screen
  const handleCancel = () => {
    setState("ready");
  };

  // Loading state
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#FFE8CD] flex items-center justify-center">
        <div className="animate-pulse text-[#003F37]">Loading...</div>
      </div>
    );
  }

  // Not found state
  if (state === "not_found") {
    return (
      <div className="min-h-screen bg-[#FFE8CD] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#003F37] mb-4">Practice Not Found</h1>
          <p className="text-[#4F5338] mb-6">
            This practice link may have expired or been removed.
          </p>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Auth required state
  if (state === "auth_required") {
    return (
      <div className="min-h-screen bg-[#FFE8CD] flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="w-16 h-16 rounded-full bg-[#E3C6AB] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#003F37]" />
          </div>
          <h1 className="text-2xl font-bold text-[#003F37] mb-2">Sign In Required</h1>
          <p className="text-[#4F5338] mb-6">
            You need to sign in to access this practice session.
          </p>
          <SignInButton mode="modal">
            <Button className="w-full bg-[#003F37] hover:bg-[#004a40] text-[#FFE8CD]">
              Sign In to Continue
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="min-h-screen bg-[#FFE8CD] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#B25627] mb-4">Something Went Wrong</h1>
          <p className="text-[#4F5338] mb-6">{error || "An error occurred. Please try again."}</p>
          <Button
            onClick={() => {
              setError(null);
              setState("ready");
            }}
            className="bg-[#003F37] hover:bg-[#004a40] text-[#FFE8CD]"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Waiting/connecting state
  if (state === "connecting" && practiceData?.avatar) {
    const waitingConfig = practiceData.practice.entryFlowConfig?.waitingScreen;
    return (
      <WaitingScreen
        text={waitingConfig?.text || "{avatarName} is preparing your session..."}
        subtext={waitingConfig?.subtext}
        animation={waitingConfig?.animation || "pulse"}
        showAvatarImage={waitingConfig?.showAvatarImage !== false}
        avatarImage={practiceData.avatar.appearance?.avatarImage}
        avatarName={practiceData.avatar.name}
        estimatedWaitSeconds={waitingConfig?.estimatedWaitSeconds}
        onCancel={handleCancel}
      />
    );
  }

  // Guest form state
  if (state === "guest_form" && practiceData) {
    return (
      <div className="min-h-screen bg-[#FFE8CD] flex items-center justify-center p-6">
        <GuestEntryForm
          settings={practiceData.practice.guestSettings || {}}
          avatarName={practiceData.avatar?.name || "Avatar"}
          avatarImage={practiceData.avatar?.appearance?.avatarImage}
          onSubmit={handleGuestFormSubmit}
        />
      </div>
    );
  }

  // Ready state - show landing page with start button
  if (state === "ready" && practiceData) {
    const { practice, avatar } = practiceData;
    const startConfig = practice.entryFlowConfig?.startButton;

    return (
      <div className="min-h-screen bg-[#FFE8CD]">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <Link href="/" className="text-[#003F37] hover:text-[#004a40] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {user && (
            <span className="text-sm text-[#4F5338]">
              Signed in as {user.firstName || user.emailAddresses[0]?.emailAddress}
            </span>
          )}
        </header>

        {/* Main content */}
        <main className="flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-80px)]">
          {/* Avatar preview */}
          {avatar && (
            <div className="mb-8">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {avatar.appearance?.avatarImage ? (
                  <Image
                    src={avatar.appearance.avatarImage}
                    alt={avatar.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#E3C6AB] flex items-center justify-center">
                    <span className="text-4xl text-[#003F37] font-bold">
                      {avatar.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-center mt-3 font-medium text-[#003F37]">{avatar.name}</p>
            </div>
          )}

          {/* Title and description */}
          <div className="text-center max-w-lg mb-8">
            <h1 className="text-3xl font-bold text-[#003F37] mb-3">{practice.title}</h1>
            {practice.description && (
              <p className="text-[#4F5338] text-lg">{practice.description}</p>
            )}
          </div>

          {/* Info cards */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {practice.behaviorConfig.targetDurationMinutes && (
              <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-[#003F37]" />
                <span className="text-sm text-[#003F37]">
                  {practice.behaviorConfig.targetDurationMinutes} minutes
                </span>
              </div>
            )}
            {practice.transcriptTopics && practice.transcriptTopics.length > 0 && (
              <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-lg">
                <BookOpen className="w-4 h-4 text-[#003F37]" />
                <span className="text-sm text-[#003F37]">
                  {practice.transcriptTopics.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-lg">
              <MessageSquare className="w-4 h-4 text-[#003F37]" />
              <span className="text-sm text-[#003F37] capitalize">
                {practice.behaviorConfig.conversationStyle} mode
              </span>
            </div>
          </div>

          {/* Transcript summary */}
          {practice.transcriptSummary && (
            <div className="bg-white rounded-xl p-6 max-w-lg mb-8 shadow-sm">
              <h3 className="font-semibold text-[#003F37] mb-2">About this session</h3>
              <p className="text-[#4F5338] text-sm">{practice.transcriptSummary}</p>
            </div>
          )}

          {/* Key points */}
          {practice.transcriptKeyPoints && practice.transcriptKeyPoints.length > 0 && (
            <div className="bg-white rounded-xl p-6 max-w-lg mb-8 shadow-sm">
              <h3 className="font-semibold text-[#003F37] mb-3">Key Topics</h3>
              <ul className="space-y-2">
                {practice.transcriptKeyPoints.slice(0, 5).map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#4F5338]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9F9D38] mt-1.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Start button */}
          <StartButton
            text={startConfig?.text || "Start Conversation"}
            variant={startConfig?.variant || "primary"}
            animation={startConfig?.animation || "breathe"}
            showAvatarPreview={startConfig?.showAvatarPreview}
            avatarImage={avatar?.appearance?.avatarImage}
            avatarName={avatar?.name}
            onClick={handleStart}
          />

          {/* Guest indicator */}
          {!user && guestData?.name && (
            <p className="text-sm text-[#4F5338] mt-4">
              Joining as <span className="font-medium">{guestData.name}</span>
            </p>
          )}
        </main>
      </div>
    );
  }

  // Fallback
  return null;
}
