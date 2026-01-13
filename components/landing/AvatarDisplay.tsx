"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, Volume2, VolumeX, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarDisplayProps {
  avatarId?: string;
  className?: string;
}

export function AvatarDisplay({ avatarId, className }: AvatarDisplayProps) {
  const t = useTranslations("hero");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Simulate avatar loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

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
        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto" />
              <p className="text-sm opacity-80">{t("loadingAvatar")}</p>
            </div>
          </div>
        )}

        {/* Avatar Video/Image Placeholder */}
        {isLoaded && (
          <>
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal" />

            {/* Avatar Image - This would be replaced with actual LiveKit video */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Placeholder Avatar Circle */}
                <div className="w-48 h-48 rounded-full bg-sls-cream/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white/80">E</span>
                </div>

                {/* Animated Ring */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-4 border-sls-chartreuse/50 transition-all duration-500",
                    isHovered ? "scale-110 opacity-100" : "scale-100 opacity-50"
                  )}
                />

                {/* Pulse Effect */}
                <div className="absolute inset-0 rounded-full bg-sls-chartreuse/20 animate-ping opacity-75" />
              </div>
            </div>

            {/* Decorative Particles */}
            <div className="absolute top-8 right-8 animate-float">
              <Sparkles className="w-6 h-6 text-sls-chartreuse/60" />
            </div>
            <div className="absolute bottom-20 left-8 animate-float-delayed">
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>
          </>
        )}

        {/* Speech Bubble */}
        <div
          className={cn(
            "absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300",
            isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-sls-teal flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sls-teal font-medium text-sm">Emma</p>
              <p className="text-sls-olive text-sm mt-0.5">
                {t("avatarGreeting")}
              </p>
            </div>
          </div>
        </div>

        {/* Mute Button */}
        {isLoaded && (
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
        )}

        {/* AI Badge */}
        {isLoaded && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-sls-chartreuse/90 text-sls-teal text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-sls-teal animate-pulse" />
            AI Avatar
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-sls-chartreuse/20 -z-10" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-2xl bg-sls-orange/10 -z-10" />

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 0.5s;
        }
      `}</style>
    </div>
  );
}
