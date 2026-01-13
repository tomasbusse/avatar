"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, Volume2, VolumeX, Sparkles, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarDisplayProps {
  avatarId?: string;
  className?: string;
  profileImage?: string;
  avatarName?: string;
  avatarGreeting?: string;
  isLoading?: boolean;
}

export function AvatarDisplay({
  avatarId,
  className,
  profileImage,
  avatarName = "Emma",
  avatarGreeting,
  isLoading: dataLoading = false,
}: AvatarDisplayProps) {
  const t = useTranslations("hero");
  const [isActivated, setIsActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Greeting text from props (CMS) or fallback to translation
  const greeting = avatarGreeting || t("avatarGreeting");

  // Handle play button click to activate live avatar
  const handleActivate = () => {
    setIsActivating(true);
    // Simulate avatar loading - in production this would connect to LiveKit
    setTimeout(() => {
      setIsActivating(false);
      setIsActivated(true);
    }, 1500);
  };

  // Show loading state while data is being fetched
  const isLoading = dataLoading || isActivating;

  return (
    <div
      className={cn(
        "relative w-full max-w-md",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Avatar Container */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-sls-teal to-sls-olive shadow-2xl shadow-sls-teal/20">

        {/* Initial State: Profile Image with Play Button */}
        {!isActivated && !isActivating && (
          <>
            {/* Profile Image Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal" />

            {/* Avatar Profile Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {profileImage ? (
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                    <Image
                      src={profileImage}
                      alt={avatarName}
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-full bg-sls-cream/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white/80">
                      {avatarName.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Animated Ring */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-4 border-sls-chartreuse/50 transition-all duration-500",
                    isHovered ? "scale-110 opacity-100" : "scale-100 opacity-50"
                  )}
                />
              </div>
            </div>

            {/* Play Button Overlay */}
            <button
              onClick={handleActivate}
              className="absolute inset-0 flex items-center justify-center group cursor-pointer"
            >
              <div className={cn(
                "w-20 h-20 rounded-full bg-sls-orange flex items-center justify-center shadow-xl transition-all",
                "group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-sls-orange/40",
                "group-active:scale-95"
              )}>
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </button>

            {/* Decorative Particles */}
            <div className="absolute top-8 right-8 animate-bounce">
              <Sparkles className="w-6 h-6 text-sls-chartreuse/60" />
            </div>
            <div className="absolute bottom-20 left-8 animate-pulse">
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>

            {/* Click to Start Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-sls-teal text-xs font-semibold">
              {dataLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-sls-teal/30 border-t-sls-teal rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  {t("clickToStart") || "Click to Start"}
                </>
              )}
            </div>
          </>
        )}

        {/* Loading State (when clicking play to activate) */}
        {isActivating && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto" />
              <p className="text-sm opacity-80">{t("loadingAvatar")}</p>
            </div>
          </div>
        )}

        {/* Activated State: Live Avatar */}
        {isActivated && (
          <>
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal" />

            {/* Avatar Image - This would be replaced with actual LiveKit video */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {profileImage ? (
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                    <Image
                      src={profileImage}
                      alt={avatarName}
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-full bg-sls-cream/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white/80">
                      {avatarName.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Animated Ring - Active state */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-4 border-sls-chartreuse transition-all duration-500",
                    isHovered ? "scale-110 opacity-100" : "scale-105 opacity-80"
                  )}
                />

                {/* Pulse Effect - indicates live */}
                <div className="absolute inset-0 rounded-full bg-sls-chartreuse/20 animate-ping opacity-75" />
              </div>
            </div>

            {/* Decorative Particles */}
            <div className="absolute top-8 right-8 animate-bounce">
              <Sparkles className="w-6 h-6 text-sls-chartreuse/60" />
            </div>
            <div className="absolute bottom-20 left-8 animate-pulse">
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>

            {/* AI Badge - Active */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-sls-chartreuse/90 text-sls-teal text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-sls-teal animate-pulse" />
              AI Avatar Live
            </div>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </>
        )}

        {/* Speech Bubble - Always visible except during activation */}
        {!isActivating && (
          <div
            className={cn(
              "absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300",
              "opacity-100 translate-y-0"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sls-teal flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sls-teal font-medium text-sm">{avatarName}</p>
                <p className="text-sls-olive text-sm mt-0.5">
                  {greeting}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-sls-chartreuse/20 -z-10" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-2xl bg-sls-orange/10 -z-10" />
    </div>
  );
}
