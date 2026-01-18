"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { AvatarDisplay } from "./AvatarDisplay";

// Fallback avatar data for when Convex is blocked (Safari ITP, etc.)
// Note: Uses generic name since we can't determine the configured avatar
const FALLBACK_AVATAR = {
  name: "AI Coach",
  profileImage: undefined, // Will show initial letter fallback
};

interface ClientAvatarWrapperProps {
  avatarId?: string;
  showContactForm?: boolean;
  onContactFormClose?: () => void;
  /** Hide the internal play button (for external control) */
  hidePlayButton?: boolean;
  /** External activation trigger - when true, starts the avatar */
  externalActivated?: boolean;
  /** Callback when activation state changes (for external control) */
  onActivationChange?: (activated: boolean) => void;
  /** Hide all LiveKit room controls (close, mute, stop, camera) */
  hideRoomControls?: boolean;
  /** Hide the contact form flip (when parent handles contact form) */
  hideContactForm?: boolean;
}

export function ClientAvatarWrapper({
  avatarId,
  showContactForm,
  onContactFormClose,
  hidePlayButton,
  externalActivated,
  onActivationChange,
  hideRoomControls,
  hideContactForm,
}: ClientAvatarWrapperProps) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "true";
  const [timedOut, setTimedOut] = useState(false);

  // Fetch configured landing avatar from database (locale-aware)
  const landingAvatar = useQuery(api.landing.getLandingAvatar, { locale });

  // Fetch hero page content from CMS (for avatar greeting)
  const heroContent = useQuery(api.landing.getSectionContent, {
    locale,
    page: "home",
    section: "hero",
  });

  // Timeout fallback for Safari ITP blocking Convex WebSocket
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (landingAvatar === undefined) {
        if (debugMode) {
          console.log("[Avatar Debug] Convex query timed out - using fallback");
        }
        setTimedOut(true);
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [landingAvatar, debugMode]);

  // Debug logging for Convex queries
  useEffect(() => {
    if (!debugMode) return;
    console.log("[Avatar Debug] ClientAvatarWrapper mounted", {
      locale,
      providedAvatarId: avatarId,
      fetchingLocaleAvatar: `landing_hero_avatar_${locale}`,
    });
  }, [debugMode, locale, avatarId]);

  useEffect(() => {
    if (!debugMode) return;
    console.log("[Avatar Debug] Convex landingAvatar query result:", {
      status: landingAvatar === undefined ? "loading" : landingAvatar === null ? "no data" : "loaded",
      avatarId: landingAvatar?._id,
      name: landingAvatar?.name,
      hasProfileImage: !!landingAvatar?.profileImage,
      profileImage: landingAvatar?.profileImage,
    });
  }, [debugMode, landingAvatar]);

  useEffect(() => {
    if (!debugMode) return;
    console.log("[Avatar Debug] Convex heroContent query result:", {
      status: heroContent === undefined ? "loading" : heroContent === null ? "no data" : "loaded",
      hasAvatarGreeting: !!(heroContent as { avatarGreeting?: string } | null)?.avatarGreeting,
    });
  }, [debugMode, heroContent]);

  // Extract avatar greeting from hero content
  const avatarGreeting = (heroContent as { avatarGreeting?: string } | null)?.avatarGreeting;

  // Use fallback data if Convex timed out (Safari ITP, etc.)
  const useFallback = timedOut && landingAvatar === undefined;
  const avatarData = useFallback ? FALLBACK_AVATAR : landingAvatar;

  // Show avatar display even while loading - it has its own fallback states
  // Pass isLoading only if not timed out yet
  const isLoading = landingAvatar === undefined && !timedOut;

  // Pass full avatar object for LiveKit connection (only when we have real data)
  // The agent needs all avatar config fields (avatarProvider, voiceProvider, llmConfig, etc.)
  const fullAvatar = landingAvatar && !useFallback ? landingAvatar : undefined;

  return (
    <AvatarDisplay
      avatarId={avatarId || (avatarData as { _id?: string })?._id}
      profileImage={avatarData?.profileImage}
      avatarName={avatarData?.name || "AI Coach"}
      avatarGreeting={avatarGreeting}
      isLoading={isLoading}
      avatar={fullAvatar}
      debug={debugMode}
      locale={locale}
      showContactForm={showContactForm}
      onContactFormClose={onContactFormClose}
      hidePlayButton={hidePlayButton}
      externalActivated={externalActivated}
      onActivationChange={onActivationChange}
      hideRoomControls={hideRoomControls}
      hideContactForm={hideContactForm}
    />
  );
}
