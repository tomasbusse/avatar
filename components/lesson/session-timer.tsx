"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SessionTimerProps {
  /** Duration in minutes for the session */
  durationMinutes: number;
  /** Callback when timer expires */
  onExpired?: () => void;
  /** Callback when entering warning zone (2 min remaining) */
  onWarning?: () => void;
  /** Start time (unix timestamp in ms), defaults to now */
  startTime?: number;
  /** Optional className for positioning */
  className?: string;
}

export function SessionTimer({
  durationMinutes,
  onExpired,
  onWarning,
  startTime,
  className,
}: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const [hasWarned, setHasWarned] = useState(false);
  const [hasExpired, setHasExpired] = useState(false);

  // Calculate initial remaining time based on start time
  useEffect(() => {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, durationMinutes * 60 - elapsed);
      setRemainingSeconds(remaining);
    }
  }, [startTime, durationMinutes]);

  // Countdown effect
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newValue = prev - 1;

        // Warning at 2 minutes
        if (newValue <= 120 && newValue > 0 && !hasWarned) {
          setHasWarned(true);
          onWarning?.();
        }

        // Expired
        if (newValue <= 0 && !hasExpired) {
          setHasExpired(true);
          onExpired?.();
        }

        return Math.max(0, newValue);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, hasWarned, hasExpired, onWarning, onExpired]);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const isWarning = remainingSeconds <= 120 && remainingSeconds > 0;
  const isExpired = remainingSeconds <= 0;

  return (
    <div
      className={cn(
        "font-mono text-lg tracking-wider transition-all duration-300",
        // Normal state: white text
        "text-white/90",
        // Warning state: amber with pulse
        isWarning && "text-amber-400 animate-pulse",
        // Expired state: red
        isExpired && "text-red-400",
        className
      )}
    >
      {formatTime(remainingSeconds)}
    </div>
  );
}
