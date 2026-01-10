"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Play, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";

interface StartButtonProps {
  text?: string;
  variant?: "primary" | "gradient" | "outline" | "glow";
  animation?: "none" | "pulse" | "breathe" | "shimmer";
  showAvatarPreview?: boolean;
  avatarImage?: string;
  avatarName?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function StartButton({
  text = "Start Conversation",
  variant = "primary",
  animation = "none",
  showAvatarPreview = false,
  avatarImage,
  avatarName,
  onClick,
  disabled = false,
  loading = false,
  className,
}: StartButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses =
    "relative flex items-center justify-center gap-3 px-8 py-4 min-h-[64px] min-w-[200px] rounded-xl font-semibold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-[#003F37] text-[#FFE8CD] hover:bg-[#004a40] focus:ring-[#003F37] shadow-lg hover:shadow-xl",
    gradient:
      "bg-gradient-to-r from-[#003F37] to-[#9F9D38] text-white hover:from-[#004a40] hover:to-[#aaaa40] focus:ring-[#003F37] shadow-lg hover:shadow-xl",
    outline:
      "border-2 border-[#003F37] text-[#003F37] hover:bg-[#003F37] hover:text-[#FFE8CD] focus:ring-[#003F37]",
    glow: "bg-[#003F37] text-[#FFE8CD] shadow-[0_0_20px_rgba(0,63,55,0.3)] hover:shadow-[0_0_30px_rgba(0,63,55,0.5)] focus:ring-[#003F37]",
  };

  const animationClasses = {
    none: "",
    pulse: "animate-start-pulse",
    breathe: "animate-start-breathe",
    shimmer: "overflow-hidden",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        isHovered && "scale-[1.02]",
        className
      )}
    >
      {/* Shimmer overlay */}
      {animation === "shimmer" && !loading && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}

      {/* Avatar preview */}
      {showAvatarPreview && avatarImage && (
        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
          <Image
            src={avatarImage}
            alt={avatarName || "Avatar"}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <span>{text}</span>
          {isHovered ? (
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </>
      )}
    </button>
  );
}

// Export animation keyframes for globals.css
export const startButtonAnimations = `
@keyframes start-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
}

@keyframes start-breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.animate-start-pulse {
  animation: start-pulse 2s ease-in-out infinite;
}

.animate-start-breathe {
  animation: start-breathe 3s ease-in-out infinite;
}

.animate-shimmer {
  animation: shimmer 2s linear infinite;
}
`;
