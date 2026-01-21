"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FeaturedPostProps {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  featuredImageUrl?: string;
  readTimeMinutes?: number;
  className?: string;
}

export function FeaturedPost({
  slug,
  title,
  excerpt,
  author,
  category,
  featuredImageUrl,
  readTimeMinutes,
  className,
}: FeaturedPostProps) {
  const locale = useLocale();

  return (
    <article
      className={cn(
        "group relative rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-[1.02]",
        className
      )}
    >
      <Link href={`/${locale}/blog/${slug}`} className="block">
        {/* Image with Gradient Overlay */}
        <div className="aspect-[16/9] md:aspect-[21/9] relative">
          {featuredImageUrl ? (
            <img
              src={featuredImageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sls-teal to-sls-olive flex items-center justify-center">
              <span className="text-6xl font-bold text-white/20">SLS</span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            {/* Category Badge */}
            <span className="inline-flex w-fit px-3 py-1 rounded-full bg-sls-orange text-white text-xs font-semibold mb-3">
              {category}
            </span>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 line-clamp-2">
              {title}
            </h2>

            {/* Author and Read Time */}
            <div className="flex items-center gap-4 text-white/80 text-sm mb-4">
              <span>{author}</span>
              {readTimeMinutes && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/60" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{readTimeMinutes} min read</span>
                  </div>
                </>
              )}
            </div>

            {/* Excerpt */}
            <p className="text-white/70 text-sm md:text-base leading-relaxed mb-6 line-clamp-2 max-w-2xl">
              {excerpt}
            </p>

            {/* Read More Button */}
            <Button
              variant="outline"
              className="w-fit border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50 font-semibold transition-all group-hover:border-white/60"
            >
              Read More
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </Link>
    </article>
  );
}
