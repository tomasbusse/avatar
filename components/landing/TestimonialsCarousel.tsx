"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  company?: string;
  role?: string;
  quote: string;
  rating?: number;
}

interface TestimonialsCarouselProps {
  testimonials?: Testimonial[];
}

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const t = useTranslations("testimonials");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Default testimonials if none provided
  const items: Testimonial[] = testimonials || [
    {
      name: "Dr. Sarah Mueller",
      company: "Volkswagen AG",
      role: "Head of International Relations",
      quote: t("items.0.quote"),
      rating: 5,
    },
    {
      name: "Michael Schmidt",
      company: "Deutsche Bank",
      role: "Senior Manager",
      quote: t("items.1.quote"),
      rating: 5,
    },
    {
      name: "Anna Weber",
      company: "Siemens",
      role: "Marketing Director",
      quote: t("items.2.quote"),
      rating: 5,
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, items.length]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const current = items[currentIndex];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-orange/10 text-sls-orange text-sm font-semibold mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
            {t("headline")}
          </h2>
        </div>

        {/* Testimonial Card */}
        <div className="relative">
          <div className="bg-sls-cream rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-6 right-6 w-20 h-20 text-sls-teal/10">
              <Quote className="w-full h-full" />
            </div>

            {/* Content */}
            <div className="relative">
              {/* Rating */}
              {current.rating && (
                <div className="flex items-center gap-1 mb-6">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-sls-orange text-sls-orange"
                    />
                  ))}
                </div>
              )}

              {/* Quote */}
              <blockquote className="text-xl sm:text-2xl text-sls-teal leading-relaxed mb-8 font-medium">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                {/* Avatar Placeholder */}
                <div className="w-14 h-14 rounded-full bg-sls-teal flex items-center justify-center text-white text-xl font-bold">
                  {current.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sls-teal">{current.name}</div>
                  {current.role && (
                    <div className="text-sls-olive text-sm">
                      {current.role}
                      {current.company && ` • ${current.company}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={goToPrev}
              className="p-3 rounded-full bg-sls-beige text-sls-teal hover:bg-sls-teal hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "w-8 bg-sls-teal"
                      : "bg-sls-beige hover:bg-sls-teal/50"
                  )}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-3 rounded-full bg-sls-beige text-sls-teal hover:bg-sls-teal hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
