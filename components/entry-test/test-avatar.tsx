"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TestAvatarProps {
  avatarImage?: string;
  name?: string;
  isThinking?: boolean;
  expression?: "neutral" | "encouraging" | "celebrating" | "thinking";
  className?: string;
}

export function TestAvatar({
  avatarImage = "/avatars/ludwig.png",
  name = "Ludwig",
  isThinking = false,
  expression = "neutral",
  className,
}: TestAvatarProps) {
  const [dots, setDots] = useState("");

  // Animated thinking dots
  useEffect(() => {
    if (!isThinking) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, [isThinking]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Avatar container with glow effect */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden transition-all duration-500",
          expression === "celebrating" && "ring-4 ring-sls-chartreuse/50 animate-pulse",
          expression === "thinking" && "ring-2 ring-sls-teal/30"
        )}
      >
        {/* Gradient background ring */}
        <div className="absolute inset-0 bg-gradient-to-br from-sls-teal/20 to-sls-chartreuse/20 rounded-full" />

        {/* Avatar image */}
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <Image
            src={avatarImage}
            alt={name}
            fill
            className="object-cover rounded-full"
            priority
          />
        </div>

        {/* Thinking indicator overlay */}
        {isThinking && (
          <div className="absolute inset-0 bg-white/30 flex items-center justify-center rounded-full">
            <span className="text-2xl font-bold text-sls-teal">{dots}</span>
          </div>
        )}
      </div>

      {/* Avatar name */}
      <span className="mt-2 text-sm font-medium text-sls-olive">{name}</span>

      {/* Status indicator */}
      {isThinking && (
        <span className="text-xs text-sls-olive/60 mt-1">Thinking{dots}</span>
      )}
    </div>
  );
}
