"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactDialog } from "./ContactDialog";
import { cn } from "@/lib/utils";

interface BlogHeroProps {
  headline?: string;
  subheadline?: string;
  className?: string;
}

/**
 * Lego-style building block component
 */
function LegoBlock({
  className,
  color,
  size = "md",
  studs = 2,
  style,
}: {
  className?: string;
  color: "teal" | "olive" | "chartreuse" | "orange" | "beige" | "cream";
  size?: "sm" | "md" | "lg";
  studs?: 1 | 2 | 4;
  style?: React.CSSProperties;
}) {
  const colorMap = {
    teal: "bg-sls-teal",
    olive: "bg-sls-olive",
    chartreuse: "bg-sls-chartreuse",
    orange: "bg-sls-orange",
    beige: "bg-sls-beige",
    cream: "bg-sls-cream",
  };

  const sizeMap = {
    sm: { block: "w-12 h-8", stud: "w-3 h-2" },
    md: { block: "w-16 h-10", stud: "w-4 h-2.5" },
    lg: { block: "w-24 h-14", stud: "w-5 h-3" },
  };

  const studCount = studs === 1 ? 1 : studs === 4 ? 4 : 2;

  return (
    <div className={cn("relative", className)} style={style}>
      {/* Main block body */}
      <div
        className={cn(
          "rounded-sm shadow-lg relative",
          colorMap[color],
          sizeMap[size].block
        )}
        style={{
          boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15)",
        }}
      >
        {/* Studs on top */}
        <div className="absolute -top-2 left-0 right-0 flex justify-center gap-1">
          {Array.from({ length: studCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full",
                colorMap[color],
                sizeMap[size].stud
              )}
              style={{
                boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BlogHero({
  headline = "Learn English with Interactive Games",
  subheadline = "Master grammar, expand your vocabulary, and excel in business English through engaging articles and interactive exercises designed for German speakers.",
  className,
}: BlogHeroProps) {
  return (
    <section
      className={cn(
        "relative min-h-[500px] lg:min-h-[600px] overflow-hidden",
        className
      )}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-teal/95 to-sls-olive" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-sls-chartreuse" />
              Free Learning Resources
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-serif">
              {headline}
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              {subheadline}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-sls-orange hover:bg-sls-orange/90 text-white font-semibold px-8 py-6 text-base rounded-sm shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                onClick={() => {
                  const articlesSection = document.getElementById("articles-section");
                  if (articlesSection) {
                    articlesSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Browse Articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <ContactDialog triggerText="Free Consultation" />
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-sls-chartreuse"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Cambridge-aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-sls-chartreuse"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>A1-C2 Levels</span>
              </div>
            </div>
          </div>

          {/* Right Side - Lego Building Blocks Illustration */}
          <div className="hidden lg:flex items-center justify-center relative">
            <div className="relative w-full max-w-md aspect-square">
              {/* Stacked Lego blocks - main structure */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Bottom row */}
                <div className="flex gap-1 mb-1">
                  <LegoBlock color="teal" size="lg" studs={2} />
                  <LegoBlock color="olive" size="lg" studs={2} />
                </div>
                {/* Second row */}
                <div className="flex gap-1 mb-1 ml-4">
                  <LegoBlock color="chartreuse" size="lg" studs={2} />
                  <LegoBlock color="orange" size="lg" studs={2} />
                </div>
                {/* Third row */}
                <div className="flex gap-1 mb-1">
                  <LegoBlock color="beige" size="lg" studs={2} />
                  <LegoBlock color="teal" size="lg" studs={2} />
                </div>
                {/* Top row */}
                <div className="flex gap-1 ml-4">
                  <LegoBlock color="olive" size="lg" studs={2} />
                  <LegoBlock color="chartreuse" size="lg" studs={2} />
                </div>
              </div>

              {/* Floating blocks around */}
              <LegoBlock
                color="orange"
                size="md"
                className="absolute top-8 right-12"
                style={{ transform: "rotate(-15deg)" }}
              />
              <LegoBlock
                color="chartreuse"
                size="sm"
                className="absolute top-20 left-8"
                style={{ transform: "rotate(10deg)" }}
              />
              <LegoBlock
                color="teal"
                size="md"
                className="absolute bottom-16 left-12"
                style={{ transform: "rotate(-8deg)" }}
              />
              <LegoBlock
                color="beige"
                size="sm"
                className="absolute bottom-24 right-8"
                style={{ transform: "rotate(20deg)" }}
              />
              <LegoBlock
                color="olive"
                size="sm"
                className="absolute top-1/3 right-4"
                style={{ transform: "rotate(-25deg)" }}
              />

              {/* Decorative elements - icons in circles */}
              <div className="absolute top-4 right-4 w-14 h-14 rounded-sm bg-sls-orange shadow-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">A+</span>
              </div>

              <div className="absolute bottom-8 left-0 w-12 h-12 rounded-sm bg-sls-chartreuse shadow-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-sls-teal"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div className="absolute top-1/4 -left-2 w-10 h-10 rounded-sm bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
              </div>

              <div className="absolute bottom-1/3 -right-2 w-10 h-10 rounded-sm bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-sls-cream"
          />
        </svg>
      </div>
    </section>
  );
}
