"use client";

import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinimalControlsProps {
  /** Whether the session is paused */
  isPaused: boolean;
  /** Whether the session is ending */
  isEnding?: boolean;
  /** Pause the session (mute mic) */
  onPause: () => void;
  /** Resume the session (unmute mic) */
  onResume: () => void;
  /** Restart the session from beginning */
  onRestart: () => void;
  /** Stop and end the session */
  onStop: () => void;
  /** Optional className for positioning */
  className?: string;
}

export function MinimalControls({
  isPaused,
  isEnding = false,
  onPause,
  onResume,
  onRestart,
  onStop,
  className,
}: MinimalControlsProps) {
  return (
    <div
      className={cn(
        // Frosted glass pill container
        "flex items-center gap-2 px-4 py-3 rounded-full",
        "bg-white/10 backdrop-blur-xl",
        "border border-white/20",
        "shadow-2xl shadow-black/20",
        className
      )}
    >
      {/* Pause / Play toggle */}
      <button
        onClick={isPaused ? onResume : onPause}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
          "hover:bg-white/20 active:scale-95",
          isPaused
            ? "bg-white/30 text-white" // Play state - more prominent
            : "text-white/80" // Pause state - subtle
        )}
        aria-label={isPaused ? "Resume" : "Pause"}
      >
        {isPaused ? (
          <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
        ) : (
          <Pause className="w-6 h-6" />
        )}
      </button>

      {/* Restart */}
      <button
        onClick={onRestart}
        disabled={isEnding}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
          "text-white/80 hover:bg-white/20 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label="Restart"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-white/20 mx-1" />

      {/* Stop */}
      <button
        onClick={onStop}
        disabled={isEnding}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
          "text-red-400 hover:bg-red-500/20 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label="Stop"
      >
        <Square className="w-5 h-5" fill="currentColor" />
      </button>
    </div>
  );
}
