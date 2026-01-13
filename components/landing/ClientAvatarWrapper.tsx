"use client";

import { useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import { AvatarDisplay } from "./AvatarDisplay";

interface ClientAvatarWrapperProps {
  avatarId?: string;
}

export function ClientAvatarWrapper({ avatarId }: ClientAvatarWrapperProps) {
  const locale = useLocale();

  // Fetch configured landing avatar from database
  const landingAvatar = useQuery(api.landing.getLandingAvatar);

  // Fetch hero page content from CMS (for avatar greeting)
  const heroContent = useQuery(api.landing.getSectionContent, {
    locale,
    page: "home",
    section: "hero",
  });

  // Extract avatar greeting from hero content
  const avatarGreeting = (heroContent as { avatarGreeting?: string } | null)?.avatarGreeting;

  return (
    <AvatarDisplay
      avatarId={avatarId || landingAvatar?._id}
      profileImage={landingAvatar?.profileImage}
      avatarName={landingAvatar?.name}
      avatarGreeting={avatarGreeting}
    />
  );
}
