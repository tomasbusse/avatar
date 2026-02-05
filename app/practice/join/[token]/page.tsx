"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WaitingScreen, GuestEntryForm } from "@/components/practice";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
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
  const searchParams = useSearchParams();
  const token = params.token;
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();

  // Check if we're in embed mode
  const isEmbed = searchParams.get("embed") === "true";

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

  // Auto-start when reaching "ready" state (no guest form needed)
  useEffect(() => {
    if (state === "ready" && practiceData?.practice) {
      handleStart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Handle guest form submission — auto-start immediately
  const handleGuestFormSubmit = (data: GuestFormData) => {
    setGuestData(data);
    handleStart(data);
  };

  // Handle start conversation
  const handleStart = async (formData?: GuestFormData) => {
    if (!practiceData?.practice) return;

    // Use passed-in data or fall back to state
    const effectiveGuestData = formData ?? guestData;

    setState("connecting");

    try {
      // Generate unique room name
      const roomName = `practice_${token}_${Date.now()}`;

      // Fetch web search results if enabled
      let webSearchResults = undefined;
      if (practiceData.practice.webSearchEnabled) {
        console.log("[Practice Join] Fetching web search results...");
        try {
          const response = await fetch("/api/practice/test-web-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              searchConfig: practiceData.practice.webSearchConfig,
              subject: practiceData.practice.subject,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.webSearchResults) {
              webSearchResults = data.webSearchResults;
              console.log(`[Practice Join] Fetched ${webSearchResults.results.length} results`);
            }
          }
        } catch (err) {
          console.error("[Practice Join] Web search failed:", err);
          // Continue without web search results - non-blocking
        }
      }

      // Create session with web search results
      const session = await createSession({
        practiceId: practiceData.practice._id,
        roomName,
        guestName: effectiveGuestData?.name,
        guestMetadata: effectiveGuestData
          ? {
              email: effectiveGuestData.email,
              customFields: effectiveGuestData.customFields,
              acceptedTermsAt: effectiveGuestData.acceptedTerms ? Date.now() : undefined,
              referrer: typeof window !== "undefined" ? document.referrer : undefined,
            }
          : undefined,
        webSearchResults,
      });

      // Navigate to the practice room (preserve embed mode)
      const embedParam = isEmbed ? "?embed=true" : "";
      router.push(`/practice/${session.sessionId}${embedParam}`);
    } catch (err) {
      console.error("Failed to create session:", err);
      setError(err instanceof Error ? err.message : "Failed to start practice session");
      setState("error");
    }
  };

  // Handle cancel from waiting screen
  const handleCancel = () => {
    const needsGuestForm = !practiceData?.isAuthenticated && (
      practiceData?.practice?.guestSettings?.collectName ||
      practiceData?.practice?.guestSettings?.collectEmail ||
      practiceData?.practice?.guestSettings?.termsRequired
    );
    if (needsGuestForm) {
      setGuestData(null);
      setState("guest_form");
    } else {
      window.location.reload();
    }
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
          {!isEmbed && (
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
          )}
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
        text={waitingConfig?.text || "{avatarName} is getting ready..."}
        subtext={waitingConfig?.subtext}
        animation={waitingConfig?.animation || "pulse"}
        showAvatarImage={waitingConfig?.showAvatarImage !== false}
        avatarImage={practiceData.avatar.profileImage || practiceData.avatar.appearance?.avatarImage}
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
          avatarImage={practiceData.avatar?.profileImage || practiceData.avatar?.appearance?.avatarImage}
          onSubmit={handleGuestFormSubmit}
        />
      </div>
    );
  }

  // Ready state — transient, auto-start kicks in via useEffect
  if (state === "ready" && practiceData) {
    return (
      <div className="min-h-screen bg-[#FFE8CD] flex items-center justify-center">
        <div className="animate-pulse text-[#003F37]">Starting...</div>
      </div>
    );
  }

  // Fallback
  return null;
}
