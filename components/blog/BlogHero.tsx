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
      <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-teal/90 to-sls-olive" />

      {/* Decorative Pattern - Dots Grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-sls-chartreuse/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-sls-olive/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-sls-chartreuse animate-pulse" />
              Free Learning Resources
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
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
                className="bg-sls-orange hover:bg-sls-orange/90 text-white font-semibold px-8 py-6 text-base rounded-lg shadow-lg shadow-sls-orange/25 transition-all hover:shadow-xl hover:shadow-sls-orange/30 hover:-translate-y-0.5"
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

          {/* Right Side - Decorative Illustration */}
          <div className="hidden lg:flex items-center justify-center relative">
            {/* Abstract decorative elements */}
            <div className="relative w-full max-w-md aspect-square">
              {/* Main circle with book/learning icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <div className="w-56 h-56 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-sls-chartreuse/30 to-sls-orange/30 flex items-center justify-center">
                      {/* Book/Learning Icon */}
                      <svg
                        className="w-20 h-20 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute top-4 right-8 w-16 h-16 rounded-xl bg-sls-orange/80 shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: "3s" }}>
                <span className="text-2xl font-bold text-white">A+</span>
              </div>

              <div className="absolute bottom-8 left-4 w-14 h-14 rounded-xl bg-sls-chartreuse/80 shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}>
                <svg
                  className="w-7 h-7 text-sls-teal"
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

              <div className="absolute top-1/3 -left-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                <svg
                  className="w-6 h-6 text-white"
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

              <div className="absolute bottom-1/4 -right-2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center animate-pulse" style={{ animationDelay: "1s" }}>
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              {/* Decorative rings */}
              <div className="absolute inset-0 rounded-full border border-white/10 scale-110" />
              <div className="absolute inset-0 rounded-full border border-white/5 scale-125" />
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
