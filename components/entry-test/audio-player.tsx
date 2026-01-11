"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Play, Pause, RotateCcw, Loader2 } from "lucide-react";

interface AudioPlayerProps {
  text: string;
  maxReplays?: number;
  onReplayUsed?: () => void;
  voiceId?: string;
}

export function AudioPlayer({
  text,
  maxReplays = 2,
  onReplayUsed,
  voiceId,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [replaysUsed, setReplaysUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Generate audio on first play
  const generateAudio = async () => {
    if (audioUrl) return audioUrl;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/entry-tests/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId,
          speed: 0.9, // Slightly slower for comprehension
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return url;
    } catch (err) {
      setError("Unable to load audio. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    if (!audioRef.current) {
      const url = await generateAudio();
      if (!url) return;

      audioRef.current = new Audio(url);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReplay = async () => {
    if (replaysUsed >= maxReplays) return;

    setReplaysUsed((prev) => prev + 1);
    onReplayUsed?.();

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      await handlePlay();
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);

  const remainingReplays = maxReplays - replaysUsed;

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          size="lg"
          variant={isPlaying ? "secondary" : "default"}
          onClick={handlePlay}
          disabled={isLoading}
          className="h-12 w-12 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <Slider
            value={[progress]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!audioUrl}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Replay Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={handleReplay}
            disabled={remainingReplays <= 0 || isLoading}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {remainingReplays} left
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Volume2 className="h-3 w-3" />
        <span>
          Listen carefully. You can replay {maxReplays} time{maxReplays !== 1 ? "s" : ""}.
        </span>
      </div>
    </div>
  );
}
