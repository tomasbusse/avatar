"use client";

import { AudioPlayer } from "@/components/entry-test/audio-player";
import { cn } from "@/lib/utils";
import { Headphones } from "lucide-react";

interface ListeningSlideProps {
  audioText: string;
  audioContext?: string;
  maxReplays?: number;
  onReplayUsed: () => void;
  children: React.ReactNode;
}

export function ListeningSlide({
  audioText,
  audioContext,
  maxReplays = 2,
  onReplayUsed,
  children,
}: ListeningSlideProps) {
  return (
    <div className="h-full flex flex-col px-8 py-6">
      {/* Listening header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal mb-3">
          <Headphones className="w-4 h-4" />
          <span className="text-sm font-medium">Listening Exercise</span>
        </div>
        {audioContext && (
          <p className="text-sm text-sls-olive/60">{audioContext}</p>
        )}
      </div>

      {/* Audio player - centered and prominent */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 w-full max-w-lg">
          <AudioPlayer
            text={audioText}
            maxReplays={maxReplays}
            onReplayUsed={onReplayUsed}
          />
        </div>
      </div>

      {/* Question content (MCQ or fill-blank) */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
