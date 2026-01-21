"use client";

import Link from "next/link";
import { Gamepad2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DifficultyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const difficultyColors: Record<DifficultyLevel, string> = {
  A1: "bg-green-100 text-green-800 border-green-200",
  A2: "bg-emerald-100 text-emerald-800 border-emerald-200",
  B1: "bg-yellow-100 text-yellow-800 border-yellow-200",
  B2: "bg-orange-100 text-orange-800 border-orange-200",
  C1: "bg-red-100 text-red-800 border-red-200",
  C2: "bg-purple-100 text-purple-800 border-purple-200",
};

interface GamePreviewCardProps {
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  gameLink: string;
  className?: string;
}

export function GamePreviewCard({
  title,
  description,
  difficulty,
  gameLink,
  className,
}: GamePreviewCardProps) {
  return (
    <div
      className={cn(
        "bg-white border-2 border-sls-beige rounded-xl p-6 transition-all duration-200 hover:border-sls-teal hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-sls-beige/50 rounded-lg flex items-center justify-center">
          <Gamepad2 className="w-6 h-6 text-sls-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-sls-teal truncate">{title}</h3>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                difficultyColors[difficulty]
              )}
            >
              {difficulty}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
      </div>

      <Button
        asChild
        className="w-full bg-sls-orange hover:bg-sls-orange/90 text-white font-semibold py-2.5 rounded-lg transition-all hover:-translate-y-0.5"
      >
        <Link href={gameLink}>
          Play Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
