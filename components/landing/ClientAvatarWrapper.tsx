"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { AvatarDisplay } from "./AvatarDisplay";

interface ClientAvatarWrapperProps {
  avatarId?: string;
}

export function ClientAvatarWrapper({ avatarId }: ClientAvatarWrapperProps) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "true";

  // Fetch configured landing avatar from database
  const landingAvatar = useQuery(api.landing.getLandingAvatar);

  // Fetch hero page content from CMS (for avatar greeting)
  const heroContent = useQuery(api.landing.getSectionContent, {
    locale,
    page: "home",
    section: "hero",
  });

  // Debug logging for Convex queries
  useEffect(() => {
    if (!debugMode) return;
    console.log("[Avatar Debug] ClientAvatarWrapper mounted", {
      locale,
      providedAvatarId: avatarId,
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

  // Show avatar display even while loading - it has its own fallback states
  // Pass isLoading to show loading indicator if needed
  const isLoading = landingAvatar === undefined;

  return (
    <AvatarDisplay
      avatarId={avatarId || landingAvatar?._id}
      profileImage={landingAvatar?.profileImage}
      avatarName={landingAvatar?.name || "Helena"}
      avatarGreeting={avatarGreeting}
      isLoading={isLoading}
    />
  );
}
