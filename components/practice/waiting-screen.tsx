"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Image from "next/image";

interface WaitingScreenProps {
  text?: string; // Supports {avatarName} variable
  subtext?: string;
  animation?: "pulse" | "dots" | "wave" | "rings";
  showAvatarImage?: boolean;
  avatarImage?: string;
  avatarName: string;
  estimatedWaitSeconds?: number;
  onCancel?: () => void;
}

export function WaitingScreen({
  text = "{avatarName} is preparing your session...",
  subtext,
  animation = "pulse",
  showAvatarImage = true,
  avatarImage,
  avatarName,
  estimatedWaitSeconds,
  onCancel,
}: WaitingScreenProps) {
  const [countdown, setCountdown] = useState(estimatedWaitSeconds);

  // Replace {avatarName} placeholder
  const displayText = text.replace("{avatarName}", avatarName);

  // Countdown timer
  useEffect(() => {
    if (!estimatedWaitSeconds || countdown === undefined) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === undefined || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [estimatedWaitSeconds, countdown]);

  return (
    <div className="fixed inset-0 bg-[#FFE8CD] flex items-center justify-center z-50">
      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/50 hover:bg-white transition-colors"
          aria-label="Cancel"
        >
          <X className="w-5 h-5 text-[#003F37]" />
        </button>
      )}

      <div className="flex flex-col items-center max-w-md text-center px-6">
        {/* Avatar container with animation */}
        <div className="relative mb-8">
          {/* Avatar image or placeholder */}
          <div
            className={cn(
              "relative w-32 h-32 rounded-full overflow-hidden bg-[#E3C6AB] flex items-center justify-center",
              animation === "pulse" && "animate-waiting-pulse"
            )}
          >
            {showAvatarImage && avatarImage ? (
              <Image
                src={avatarImage}
                alt={avatarName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-4xl text-[#003F37] font-semibold">
                {avatarName.charAt(0)}
              </span>
            )}
          </div>

          {/* Rings animation */}
          {animation === "rings" && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-[#003F37]/30 animate-waiting-rings" />
              <div className="absolute inset-0 rounded-full border-2 border-[#003F37]/20 animate-waiting-rings animation-delay-500" />
              <div className="absolute inset-0 rounded-full border-2 border-[#003F37]/10 animate-waiting-rings animation-delay-1000" />
            </>
          )}
        </div>

        {/* Main text */}
        <h2 className="text-xl font-semibold text-[#003F37] mb-2">
          {displayText}
        </h2>

        {/* Subtext */}
        {subtext && <p className="text-[#4F5338] mb-6">{subtext}</p>}

        {/* Animation indicator */}
        <div className="mt-4">
          {animation === "dots" && <DotsAnimation />}
          {animation === "wave" && <WaveAnimation />}
          {(animation === "pulse" || animation === "rings") && (
            <div className="h-6" /> // Spacer
          )}
        </div>

        {/* Countdown */}
        {countdown !== undefined && countdown > 0 && (
          <p className="text-sm text-[#4F5338] mt-4">
            Estimated time: {countdown}s
          </p>
        )}
      </div>
    </div>
  );
}

// Dots animation component
function DotsAnimation() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full bg-[#003F37] animate-waiting-dots"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// Wave animation component
function WaveAnimation() {
  return (
    <div className="flex gap-1 items-end h-8">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1.5 bg-[#003F37] rounded-full animate-waiting-wave"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: "12px",
          }}
        />
      ))}
    </div>
  );
}

// Export animation keyframes for globals.css
export const waitingScreenAnimations = `
@keyframes waiting-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 63, 55, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 20px rgba(0, 63, 55, 0);
  }
}

@keyframes waiting-rings {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes waiting-dots {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes waiting-wave {
  0%, 100% {
    height: 12px;
  }
  50% {
    height: 24px;
  }
}

.animate-waiting-pulse {
  animation: waiting-pulse 2s ease-in-out infinite;
}

.animate-waiting-rings {
  animation: waiting-rings 1.5s ease-out infinite;
}

.animate-waiting-dots {
  animation: waiting-dots 1.4s ease-in-out infinite;
}

.animate-waiting-wave {
  animation: waiting-wave 1s ease-in-out infinite;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.animation-delay-1000 {
  animation-delay: 1s;
}
`;
