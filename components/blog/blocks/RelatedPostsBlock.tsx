"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { RelatedPostsBlockConfig } from "@/types/blog-blocks";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type BlogPost = Doc<"blogPosts">;

interface RelatedPostsBlockProps {
  config: RelatedPostsBlockConfig;
  locale: string;
  currentPostSlug?: string;
}

// Loading skeleton
function PostCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-sls-beige overflow-hidden bg-white">
      <div className="aspect-[16/9] bg-sls-beige/50" />
      <div className="p-5">
        <div className="h-4 bg-sls-beige/50 rounded w-1/4 mb-3" />
        <div className="h-6 bg-sls-beige/50 rounded w-3/4 mb-2" />
        <div className="h-4 bg-sls-beige/30 rounded w-full" />
      </div>
    </div>
  );
}

export function RelatedPostsBlock({ config, locale, currentPostSlug }: RelatedPostsBlockProps) {
  const {
    headerTitle = "Related Articles",
    postIds = [],
    category,
    limit: maxPosts = 3,
    showHeader = true,
    variant = "cards",
  } = config;

  // Query for posts - either by specific IDs or by category
  const allPosts = useQuery(api.landing.getBlogPosts, {
    locale,
    status: "published",
    limit: 20,
  });

  // Filter posts based on config
  let relatedPosts: BlogPost[] = allPosts || [];

  if (postIds.length > 0) {
    // Use specific post IDs if provided
    relatedPosts = relatedPosts.filter((post) =>
      postIds.includes(post._id as string)
    );
  } else if (category) {
    // Filter by category
    relatedPosts = relatedPosts.filter((post) =>
      post.category === category
    );
  }

  // Exclude current post
  if (currentPostSlug) {
    relatedPosts = relatedPosts.filter((post) => post.slug !== currentPostSlug);
  }

  // Limit to maxPosts
  relatedPosts = relatedPosts.slice(0, maxPosts);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Show skeleton while loading
  if (!allPosts) {
    return (
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-sls-teal mb-8 text-center">
            {headerTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // No related posts found
  if (relatedPosts.length === 0) {
    return null;
  }

  // List variant - compact horizontal cards
  if (variant === "list") {
    return (
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-sls-teal mb-6">
            {headerTitle}
          </h2>
          <div className="space-y-4">
            {relatedPosts.map((post) => (
              <Link
                key={post._id}
                href={`/${locale}/blog/${post.slug}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-sls-beige bg-white hover:border-sls-teal/30 hover:shadow-md transition-all group"
              >
                {post.featuredImageUrl && (
                  <img
                    src={post.featuredImageUrl}
                    alt={post.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {post.category && (
                    <span className="text-xs font-medium text-sls-orange uppercase tracking-wide">
                      {post.category}
                    </span>
                  )}
                  <h3 className="font-semibold text-sls-olive group-hover:text-sls-teal transition-colors line-clamp-1">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-sls-olive/60 mt-1">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.publishedAt)}
                      </span>
                    )}
                    {post.readTimeMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTimeMinutes} min
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-sls-olive/30 group-hover:text-sls-teal group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Compact variant - smaller grid cards
  if (variant === "compact") {
    return (
      <section className="py-12 bg-sls-cream/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-sls-teal">
              {headerTitle}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedPosts.map((post) => (
              <Link
                key={post._id}
                href={`/${locale}/blog/${post.slug}`}
                className="p-4 rounded-xl bg-white border border-sls-beige hover:border-sls-teal/30 hover:shadow-md transition-all group"
              >
                {post.category && (
                  <span className="text-xs font-medium text-sls-orange uppercase tracking-wide">
                    {post.category}
                  </span>
                )}
                <h3 className="font-semibold text-sls-olive group-hover:text-sls-teal transition-colors mt-1 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-sls-olive/60 mt-2 line-clamp-2">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default variant - full cards with images
  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-medium mb-4">
            Continue Reading
          </span>
          <h2 className="text-3xl font-bold text-sls-teal">
            {headerTitle}
          </h2>
        </div>

        {/* Posts Grid */}
        <div className={cn(
          "grid gap-6",
          relatedPosts.length === 1 && "max-w-md mx-auto",
          relatedPosts.length === 2 && "md:grid-cols-2 max-w-3xl mx-auto",
          relatedPosts.length >= 3 && "md:grid-cols-3"
        )}>
          {relatedPosts.map((post) => (
            <Link
              key={post._id}
              href={`/${locale}/blog/${post.slug}`}
              className="group rounded-2xl overflow-hidden border border-sls-beige bg-white hover:border-sls-teal/30 hover:shadow-xl hover:shadow-sls-teal/5 transition-all"
            >
              {/* Image */}
              {post.featuredImageUrl ? (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={post.featuredImageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-sls-teal/10 to-sls-chartreuse/10" />
              )}

              {/* Content */}
              <div className="p-5">
                {post.category && (
                  <span className="text-xs font-medium text-sls-orange uppercase tracking-wide">
                    {post.category}
                  </span>
                )}
                <h3 className="font-bold text-lg text-sls-olive group-hover:text-sls-teal transition-colors mt-1 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sls-olive/60 text-sm mt-2 line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-sls-olive/50 mt-4 pt-4 border-t border-sls-beige">
                  {post.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.publishedAt)}
                    </span>
                  )}
                  {post.readTimeMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTimeMinutes} min read
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
