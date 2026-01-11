"use client";

import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";
import { AudioRecorder } from "@/components/entry-test/audio-recorder";

interface SpeakingSlideProps {
  prompt: string;
  followUpQuestions?: string[];
  duration?: { min: number; max: number };
  onTranscript: (transcript: string) => void;
  onSubmit: () => void;
  hasRecording: boolean;
  isSubmitting?: boolean;
}

export function SpeakingSlide({
  prompt,
  followUpQuestions,
  duration = { min: 30, max: 180 },
  onTranscript,
  onSubmit,
  hasRecording,
  isSubmitting = false,
}: SpeakingSlideProps) {
  return (
    <div className="h-full flex flex-col px-8 py-6">
      {/* Speaking header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-orange/10 text-sls-orange mb-3">
          <Mic className="w-4 h-4" />
          <span className="text-sm font-medium">Speaking Exercise</span>
        </div>
      </div>

      {/* Prompt */}
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-sls-teal leading-relaxed max-w-2xl mx-auto">
          {prompt}
        </h2>
      </div>

      {/* Follow-up questions as guidance */}
      {followUpQuestions && followUpQuestions.length > 0 && (
        <div className="bg-sls-cream/50 rounded-xl p-4 mb-6 max-w-2xl mx-auto w-full">
          <p className="text-xs uppercase tracking-wide text-sls-olive/60 mb-2">
            Consider discussing
          </p>
          <ul className="space-y-1">
            {followUpQuestions.map((q, idx) => (
              <li key={idx} className="text-sm text-sls-olive flex items-start gap-2">
                <span className="text-sls-chartreuse mt-0.5">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recording area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-xl">
          <AudioRecorder
            minDuration={duration.min}
            maxDuration={duration.max}
            onTranscript={onTranscript}
          />
        </div>
      </div>

      {/* Time guidance */}
      <p className="text-center text-sm text-sls-olive/60 mt-4">
        Aim for {Math.floor(duration.min / 60)}-{Math.ceil(duration.max / 60)} minutes
      </p>
    </div>
  );
}
