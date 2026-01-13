"use client";

import type { CTABlockConfig, CTAVariant } from "@/types/blog-blocks";
import { ArrowRight, Sparkles, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CTABlockProps {
  config: CTABlockConfig;
}

export function CTABlock({ config }: CTABlockProps) {
  const {
    variant = "default",
    headline,
    subheadline,
    primaryButton,
    secondaryButton,
  } = config;

  const variantStyles: Record<CTAVariant, {
    container: string;
    headline: string;
    description: string;
    primaryButton: string;
    secondaryButton: string;
  }> = {
    default: {
      container: "bg-gradient-to-br from-sls-cream to-sls-beige/30 border border-sls-beige",
      headline: "text-sls-teal",
      description: "text-sls-olive/70",
      primaryButton: "bg-sls-orange hover:bg-sls-orange/90 text-white",
      secondaryButton: "border-sls-teal text-sls-teal hover:bg-sls-teal/5",
    },
    dark: {
      container: "bg-gradient-to-br from-sls-teal to-sls-olive text-white",
      headline: "text-white",
      description: "text-white/80",
      primaryButton: "bg-sls-chartreuse hover:bg-sls-chartreuse/90 text-sls-teal",
      secondaryButton: "border-white/50 text-white hover:bg-white/10",
    },
    accent: {
      container: "bg-gradient-to-br from-sls-orange/10 to-sls-chartreuse/10 border-2 border-sls-orange/20",
      headline: "text-sls-teal",
      description: "text-sls-olive/70",
      primaryButton: "bg-sls-orange hover:bg-sls-orange/90 text-white shadow-lg shadow-sls-orange/20",
      secondaryButton: "border-sls-orange/50 text-sls-orange hover:bg-sls-orange/5",
    },
    gradient: {
      container: "bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal text-white",
      headline: "text-white",
      description: "text-white/80",
      primaryButton: "bg-sls-chartreuse hover:bg-sls-chartreuse/90 text-sls-teal",
      secondaryButton: "border-white/50 text-white hover:bg-white/10",
    },
  };

  const styles = variantStyles[variant];

  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "relative rounded-2xl overflow-hidden p-8 md:p-12",
          styles.container
        )}>
          {/* Background Pattern */}
          <div className="absolute inset-0 pointer-events-none">
            {variant === "dark" || variant === "gradient" ? (
              <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-sls-chartreuse/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              </>
            ) : (
              <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-sls-chartreuse/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-sls-teal/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              </>
            )}
            {/* Dot pattern */}
            <div
              className={cn(
                "absolute inset-0",
                variant === "dark" || variant === "gradient" ? "opacity-10" : "opacity-30"
              )}
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              {variant === "accent" ? (
                <Rocket className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {variant === "dark" ? "Get Started Today" : "Limited Time"}
              </span>
            </div>

            {/* Headline */}
            <h2 className={cn(
              "text-3xl md:text-4xl font-bold mb-4",
              styles.headline
            )}>
              {headline}
            </h2>

            {/* Description */}
            {subheadline && (
              <p className={cn(
                "text-lg mb-8 max-w-2xl mx-auto",
                styles.description
              )}>
                {subheadline}
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {primaryButton?.href && (
                <Link
                  href={primaryButton.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105",
                    styles.primaryButton
                  )}
                >
                  {primaryButton.text}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {secondaryButton?.href && secondaryButton?.text && (
                <Link
                  href={secondaryButton.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold border-2 transition-all",
                    styles.secondaryButton
                  )}
                >
                  {secondaryButton.text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
