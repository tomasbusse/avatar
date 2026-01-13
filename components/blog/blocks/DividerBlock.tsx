"use client";

import type { DividerBlockConfig } from "@/types/blog-blocks";
import { cn } from "@/lib/utils";

interface DividerBlockProps {
  config: DividerBlockConfig;
}

export function DividerBlock({ config }: DividerBlockProps) {
  const { variant = "line", spacing = "medium" } = config;

  const spacingStyles = {
    small: "py-4",
    medium: "py-8",
    large: "py-12",
  };

  // Space only - no visual divider
  if (variant === "space") {
    return <div className={spacingStyles[spacing]} />;
  }

  // Line divider
  if (variant === "line") {
    return (
      <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", spacingStyles[spacing])}>
        <hr className="border-t border-sls-beige" />
      </div>
    );
  }

  // Dots divider
  if (variant === "dots") {
    return (
      <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center gap-3", spacingStyles[spacing])}>
        <span className="w-2 h-2 rounded-full bg-sls-beige" />
        <span className="w-2 h-2 rounded-full bg-sls-chartreuse" />
        <span className="w-2 h-2 rounded-full bg-sls-teal" />
        <span className="w-2 h-2 rounded-full bg-sls-chartreuse" />
        <span className="w-2 h-2 rounded-full bg-sls-beige" />
      </div>
    );
  }

  // Ornament divider
  if (variant === "ornament") {
    return (
      <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center", spacingStyles[spacing])}>
        {/* Left line */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sls-beige to-sls-beige max-w-32" />

        {/* Center ornament */}
        <div className="mx-6 flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 text-sls-chartreuse"
            fill="currentColor"
          >
            <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
          </svg>
        </div>

        {/* Right line */}
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-sls-beige to-sls-beige max-w-32" />
      </div>
    );
  }

  // Gradient divider
  if (variant === "gradient") {
    return (
      <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", spacingStyles[spacing])}>
        <div className="h-1 rounded-full bg-gradient-to-r from-sls-teal via-sls-chartreuse to-sls-orange" />
      </div>
    );
  }

  // Wave divider
  if (variant === "wave") {
    return (
      <div className={cn("w-full overflow-hidden", spacingStyles[spacing])}>
        <svg
          viewBox="0 0 1200 60"
          className="w-full h-8 text-sls-beige"
          preserveAspectRatio="none"
        >
          <path
            d="M0 30 Q 150 0, 300 30 T 600 30 T 900 30 T 1200 30 V60 H0 Z"
            fill="currentColor"
            opacity="0.3"
          />
          <path
            d="M0 35 Q 150 10, 300 35 T 600 35 T 900 35 T 1200 35 V60 H0 Z"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      </div>
    );
  }

  // Default fallback - simple line
  return (
    <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", spacingStyles[spacing])}>
      <hr className="border-t border-sls-beige" />
    </div>
  );
}
