"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Play, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ClientAvatarWrapper = dynamic(
  () =>
    import("@/components/landing/ClientAvatarWrapper").then(
      (mod) => mod.ClientAvatarWrapper
    ),
  { ssr: false }
);

export function FAQAvatarHero() {
  const t = useTranslations("faq");
  const [isActivated, setIsActivated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      {/* YouTube-style 16:9 container */}
      <div
        className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-sls-teal via-[#004a40] to-sls-olive"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar area */}
        <div className="absolute inset-0">
          <ClientAvatarWrapper
            hidePlayButton
            externalActivated={isActivated}
            onActivationChange={setIsActivated}
            hideRoomControls={false}
            hideContactForm
          />
        </div>

        {/* Overlay content — hidden once avatar is active */}
        {!isActivated && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-sls-teal/90 via-sls-teal/70 to-sls-olive/80 z-10">
            {/* Decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-sls-orange/10 blur-3xl" />

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Language Coach</span>
            </div>

            {/* Avatar prompt text */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mb-2 text-center px-4">
              {t("avatarPrompt")}
            </h2>
            <p className="text-sm sm:text-base text-white/70 mb-8 text-center px-4">
              {t("avatarSubtext")}
            </p>

            {/* Play button */}
            <button
              onClick={() => setIsActivated(true)}
              className={cn(
                "group flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl",
                "bg-sls-orange text-white font-semibold text-base sm:text-lg",
                "transition-all duration-300",
                "hover:bg-sls-orange/90 hover:shadow-xl hover:shadow-sls-orange/30",
                "hover:scale-105 active:scale-95"
              )}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" fill="white" />
              </div>
              <span className="hidden sm:inline">{t("avatarName")} — Ask Me</span>
              <span className="sm:hidden">Start</span>
            </button>
          </div>
        )}

        {/* YouTube-style bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Progress bar */}
          <div className="h-1 bg-white/10">
            <div
              className={cn(
                "h-full bg-sls-orange transition-all duration-1000 ease-out",
                isActivated ? "w-full" : isHovered ? "w-[12%]" : "w-[4%]"
              )}
              style={isActivated ? { transition: "width 120s linear" } : undefined}
            />
          </div>
          {/* Controls bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isActivated ? "bg-green-400 animate-pulse" : "bg-white/40"
              )} />
              <span className="text-white/80 text-xs sm:text-sm font-medium">
                {t("avatarName")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">
                {isActivated ? "Live" : "Click to start"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Caption below video */}
      <div className="mt-4 flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-full bg-sls-teal flex items-center justify-center flex-shrink-0">
          <span className="text-white font-serif font-bold text-sm">E</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-sls-teal">{t("avatarName")}</p>
          <p className="text-xs text-sls-olive/60">{t("avatarSubtext")}</p>
        </div>
      </div>
    </div>
  );
}
