"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BlogCard } from "@/components/landing";
import { Id } from "@/convex/_generated/dataModel";

interface Category {
  _id: Id<"blogCategories">;
  slug: string;
  name: {
    en: string;
    de: string;
  };
  icon: string;
  color: string;
  order: number;
}

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  categoryId?: Id<"blogCategories">;
  featuredImageUrl?: string;
  publishedAt?: number;
  readTimeMinutes?: number;
}

interface CategoryFilterTabsProps {
  categories: Category[];
  posts: BlogPost[];
  locale: string;
  allLabel: string;
  noPostsLabel: string;
}

export function CategoryFilterTabs({
  categories,
  posts,
  locale,
  allLabel,
  noPostsLabel,
}: CategoryFilterTabsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredPosts = activeCategory
    ? posts.filter((post) => post.categoryId === activeCategory)
    : posts;

  return (
    <>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {/* All Tab */}
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            activeCategory === null
              ? "bg-sls-teal text-white"
              : "bg-sls-beige/50 text-sls-olive hover:bg-sls-beige"
          )}
        >
          {allLabel}
        </button>

        {/* Category Tabs */}
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => setActiveCategory(category._id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeCategory === category._id
                ? "bg-sls-teal text-white"
                : "bg-sls-beige/50 text-sls-olive hover:bg-sls-beige"
            )}
          >
            {locale === "de" ? category.name.de : category.name.en}
          </button>
        ))}
      </div>

      {/* Blog Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} {...post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-sls-olive/70">{noPostsLabel}</p>
        </div>
      )}
    </>
  );
}
