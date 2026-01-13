"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  featuredImageUrl?: string;
  publishedAt?: number;
  readTimeMinutes?: number;
  className?: string;
}

export function BlogCard({
  slug,
  title,
  excerpt,
  author,
  category,
  featuredImageUrl,
  publishedAt,
  readTimeMinutes,
  className,
}: BlogCardProps) {
  const locale = useLocale();

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className={cn("group", className)}>
      <Link href={`/${locale}/blog/${slug}`} className="block">
        {/* Image */}
        <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-sls-beige mb-4">
          {featuredImageUrl ? (
            <img
              src={featuredImageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sls-teal/10 to-sls-chartreuse/10 flex items-center justify-center">
              <span className="text-4xl font-bold text-sls-teal/20">SLS</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          {/* Category */}
          <span className="inline-block px-3 py-1 rounded-full bg-sls-teal/10 text-sls-teal text-xs font-semibold mb-3">
            {category}
          </span>

          {/* Title */}
          <h3 className="text-xl font-bold text-sls-teal mb-2 group-hover:text-sls-orange transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-sls-olive/70 text-sm leading-relaxed mb-4 line-clamp-2">
            {excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-sls-olive/60">
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            )}
            {readTimeMinutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{readTimeMinutes} min</span>
              </div>
            )}
          </div>

          {/* Read More */}
          <div className="mt-4 flex items-center gap-2 text-sls-teal font-semibold text-sm group-hover:text-sls-orange transition-colors">
            <span>Read more</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </article>
  );
}
