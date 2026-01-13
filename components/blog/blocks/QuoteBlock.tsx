"use client";

import type { QuoteBlockConfig } from "@/types/blog-blocks";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteBlockProps {
  config: QuoteBlockConfig;
}

export function QuoteBlock({ config }: QuoteBlockProps) {
  const {
    text,
    attribution,
    role,
    company,
    imageUrl,
    variant = "default",
  } = config;

  // Helper to format the attribution line
  const getAttribution = () => {
    const parts = [attribution];
    if (role) parts.push(role);
    if (company) parts.push(company);
    return parts.filter(Boolean).join(", ");
  };

  if (variant === "large") {
    return (
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Large quote mark */}
            <div className="absolute -top-8 -left-4 text-sls-chartreuse/20">
              <Quote className="w-24 h-24" strokeWidth={1} />
            </div>

            <blockquote className="relative z-10 text-center">
              <p className="text-3xl md:text-4xl lg:text-5xl font-serif italic text-sls-teal leading-tight mb-8">
                &ldquo;{text}&rdquo;
              </p>

              {attribution && (
                <footer className="flex items-center justify-center gap-4">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={attribution}
                      className="w-14 h-14 rounded-full object-cover ring-4 ring-sls-beige"
                    />
                  )}
                  <div className="text-left">
                    <cite className="not-italic font-semibold text-sls-olive text-lg">
                      {attribution}
                    </cite>
                    {(role || company) && (
                      <p className="text-sls-olive/60 text-sm">{[role, company].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                </footer>
              )}
            </blockquote>

            {/* Decorative element */}
            <div className="absolute -bottom-4 right-1/4 w-32 h-1 bg-gradient-to-r from-sls-chartreuse to-sls-teal rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  if (variant === "highlighted") {
    return (
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-sls-teal to-sls-olive rounded-2xl p-8 md:p-10 text-white overflow-hidden">
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Quote icon */}
            <div className="absolute top-4 right-4 text-white/20">
              <Quote className="w-16 h-16" strokeWidth={1} />
            </div>

            <blockquote className="relative z-10">
              <p className="text-xl md:text-2xl font-medium leading-relaxed mb-6">
                &ldquo;{text}&rdquo;
              </p>

              {attribution && (
                <footer className="flex items-center gap-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={attribution}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-xl font-bold">{attribution.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <cite className="not-italic font-semibold block">
                      {attribution}
                    </cite>
                    {(role || company) && (
                      <p className="text-white/70 text-sm">{[role, company].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                </footer>
              )}
            </blockquote>
          </div>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <blockquote className="relative pl-6 border-l-4 border-sls-chartreuse">
          {/* Small quote icon */}
          <Quote className="absolute -left-3 -top-2 w-6 h-6 text-sls-chartreuse bg-sls-cream" />

          <p className="text-xl text-sls-olive/80 italic leading-relaxed mb-4">
            &ldquo;{text}&rdquo;
          </p>

          {attribution && (
            <footer className="flex items-center gap-3">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={attribution}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <cite className="not-italic font-semibold text-sls-teal">
                  {attribution}
                </cite>
                {role && (
                  <p className="text-sls-olive/60 text-sm">{role}</p>
                )}
              </div>
            </footer>
          )}
        </blockquote>
      </div>
    </section>
  );
}
