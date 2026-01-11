"use client";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface WritingSlideProps {
  prompt: string;
  requirements?: string[];
  wordCount?: { min: number; max: number };
  answer: string;
  onAnswer: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function WritingSlide({
  prompt,
  requirements,
  wordCount,
  answer,
  onAnswer,
  onSubmit,
  isSubmitting = false,
}: WritingSlideProps) {
  const currentWordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  const getWordCountStatus = () => {
    if (!wordCount) return null;

    if (currentWordCount < wordCount.min) {
      return { status: "low", message: `${wordCount.min - currentWordCount} more words needed` };
    }
    if (currentWordCount > wordCount.max) {
      return { status: "high", message: `${currentWordCount - wordCount.max} words over limit` };
    }
    return { status: "good", message: "Good length!" };
  };

  const wordStatus = getWordCountStatus();
  const isValidLength = !wordCount || (currentWordCount >= wordCount.min && currentWordCount <= wordCount.max);

  return (
    <div className="h-full flex flex-col px-8 py-6">
      {/* Prompt */}
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-sls-teal leading-relaxed max-w-2xl mx-auto">
          {prompt}
        </h2>
      </div>

      {/* Requirements */}
      {requirements && requirements.length > 0 && (
        <div className="bg-sls-cream/50 rounded-xl p-4 mb-6 max-w-2xl mx-auto w-full">
          <p className="text-xs uppercase tracking-wide text-sls-olive/60 mb-2">Requirements</p>
          <ul className="space-y-1">
            {requirements.map((req, idx) => (
              <li key={idx} className="text-sm text-sls-olive flex items-start gap-2">
                <span className="text-sls-chartreuse mt-0.5">•</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Writing area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <Textarea
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Write your response here..."
          className="flex-1 resize-none text-base p-6 rounded-xl border-gray-200 focus:border-sls-teal focus:ring-sls-teal/20 min-h-[200px]"
        />

        {/* Word count indicator */}
        <div className="flex justify-between items-center mt-3 px-1">
          <span className="text-sm text-sls-olive/60">
            Words: <span className="font-medium text-sls-olive">{currentWordCount}</span>
            {wordCount && (
              <span className="text-sls-olive/40"> / {wordCount.min}-{wordCount.max}</span>
            )}
          </span>

          {wordStatus && (
            <span
              className={cn(
                "text-sm font-medium",
                wordStatus.status === "good" && "text-sls-chartreuse",
                wordStatus.status === "low" && "text-sls-orange/70",
                wordStatus.status === "high" && "text-sls-orange"
              )}
            >
              {wordStatus.message}
            </span>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onSubmit}
          disabled={currentWordCount < 10 || isSubmitting}
          size="lg"
          className="bg-sls-teal hover:bg-sls-teal/90 text-white px-8"
        >
          {isSubmitting ? "Submitting..." : "Submit Response"}
        </Button>
      </div>
    </div>
  );
}
