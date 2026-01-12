"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Volume2, Loader2, AlertCircle } from "lucide-react";

interface AudioButtonProps {
  /** The text to pronounce */
  text: string;
  /** Language for pronunciation (default: "en" for English) */
  language?: "en" | "de";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Whether to show text label */
  showLabel?: boolean;
  /** Callback when audio starts playing */
  onPlay?: () => void;
  /** Callback when audio finishes or errors */
  onEnd?: (success: boolean) => void;
}

// Simple in-memory cache for audio URLs
const audioCache = new Map<string, string>();

export function AudioButton({
  text,
  language = "en",
  size = "md",
  className,
  showLabel = false,
  onPlay,
  onEnd,
}: AudioButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sizeClasses = {
    sm: "h-7 w-7 p-1",
    md: "h-9 w-9 p-2",
    lg: "h-11 w-11 p-2.5",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const getCacheKey = useCallback(() => `${language}:${text}`, [language, text]);

  const playAudio = useCallback(async () => {
    if (isLoading || isPlaying) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const cacheKey = getCacheKey();
      let audioUrl = audioCache.get(cacheKey);

      // Generate audio if not cached
      if (!audioUrl) {
        const response = await fetch("/api/tts/pronunciation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate pronunciation");
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        audioCache.set(cacheKey, audioUrl);
      }

      // Play audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        onPlay?.();
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsLoading(false);
        onEnd?.(true);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        setHasError(true);
        onEnd?.(false);
        // Remove from cache on error
        audioCache.delete(cacheKey);
      };

      await audio.play();
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsLoading(false);
      setHasError(true);
      onEnd?.(false);
    }
  }, [text, language, isLoading, isPlaying, getCacheKey, onPlay, onEnd]);

  // Clear error after a few seconds
  React.useEffect(() => {
    if (hasError) {
      const timeout = setTimeout(() => setHasError(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [hasError]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const buttonContent = (
    <>
      {isLoading && !isPlaying ? (
        <Loader2 className={cn(iconSizes[size], "animate-spin")} />
      ) : hasError ? (
        <AlertCircle className={cn(iconSizes[size], "text-red-500")} />
      ) : (
        <Volume2
          className={cn(
            iconSizes[size],
            isPlaying && "animate-pulse text-sls-teal"
          )}
        />
      )}
    </>
  );

  return (
    <button
      type="button"
      onClick={playAudio}
      disabled={isLoading || isPlaying}
      title={hasError ? "Audio failed - click to retry" : `Listen to "${text}"`}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all",
        "focus:outline-none focus:ring-2 focus:ring-sls-teal/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        hasError
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-sls-cream text-sls-olive hover:bg-sls-chartreuse/20 hover:text-sls-teal",
        isPlaying && "bg-sls-teal/10 text-sls-teal",
        !showLabel && sizeClasses[size],
        showLabel && "px-3 py-1.5 gap-1.5",
        className
      )}
    >
      {buttonContent}
      {showLabel && (
        <span className="text-sm font-medium">
          {isLoading ? "Loading..." : isPlaying ? "Playing" : "Listen"}
        </span>
      )}
    </button>
  );
}

// Export a utility to clear the audio cache (useful for testing or memory management)
export function clearAudioCache(): void {
  // Revoke all object URLs to free memory
  audioCache.forEach((url) => URL.revokeObjectURL(url));
  audioCache.clear();
}
