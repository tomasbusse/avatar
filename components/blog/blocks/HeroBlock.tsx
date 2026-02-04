"use client";

import type { HeroBlockConfig } from "@/types/blog-blocks";
import { Calendar, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroBlockProps {
  config: HeroBlockConfig;
  locale: string;
}

export function HeroBlock({ config, locale }: HeroBlockProps) {
  const {
    title,
    subtitle,
    featuredImageUrl,
    badge,
    showAuthor = true,
    showDate = true,
    showReadTime = true,
    author,
    authorImageUrl,
    publishedAt,
    readTimeMinutes,
    variant = "default",
  } = config;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isCentered = variant === "centered";

  return (
    <section className="relative py-16 lg:py-24 bg-sls-cream overflow-hidden">
      {/* Clean background - subtle pattern only */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 63, 55, 0.06) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className={cn(
        "relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8",
        isCentered && "text-center"
      )}>
        {/* Badge - Professional, no animation */}
        {badge && (
          <div className={cn(
            "mb-6",
            isCentered && "flex justify-center"
          )}>
            <span className="inline-flex items-center px-3 py-1.5 bg-sls-teal text-white text-xs font-semibold uppercase tracking-wider">
              {badge}
            </span>
          </div>
        )}

        {/* Title - Serif font for journalistic feel */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-sls-teal leading-tight mb-6 font-serif">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className={cn(
            "text-xl text-sls-olive/70 leading-relaxed mb-8",
            isCentered ? "max-w-2xl mx-auto" : "max-w-2xl"
          )}>
            {subtitle}
          </p>
        )}

        {/* Meta Information */}
        {(showAuthor || showDate || showReadTime) && (
          <div className={cn(
            "flex flex-wrap items-center gap-6 text-sm text-sls-olive/70",
            isCentered && "justify-center"
          )}>
            {/* Author */}
            {showAuthor && author && (
              <div className="flex items-center gap-2">
                {authorImageUrl ? (
                  <img
                    src={authorImageUrl}
                    alt={author}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-sls-beige"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sls-teal/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-sls-teal" />
                  </div>
                )}
                <span className="font-medium text-sls-olive">{author}</span>
              </div>
            )}

            {/* Date */}
            {showDate && publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(publishedAt)}</span>
              </div>
            )}

            {/* Read Time */}
            {showReadTime && readTimeMinutes && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {readTimeMinutes} {locale === "de" ? "Min. Lesezeit" : "min read"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Featured Image - Sharp corners */}
        {featuredImageUrl && (
          <div className="mt-12 rounded-sm overflow-hidden shadow-lg">
            <img
              src={featuredImageUrl}
              alt={title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
