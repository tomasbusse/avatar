import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { CTASection } from "@/components/landing";
import { BlogHero } from "@/components/blog/BlogHero";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { PopularGamesSection } from "@/components/blog/PopularGamesSection";
import { CategoryFilterTabs } from "@/components/blog/CategoryFilterTabs";
import { BlogContactCard } from "@/components/blog/BlogContactCard";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return {
    title: `${t("headline")} | Simmonds Language Services`,
    description: t("subheadline"),
  };
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  // Fetch blog posts and categories from Convex
  const [dbPosts, categories] = await Promise.all([
    fetchQuery(api.landing.getBlogPosts, {
      locale,
      status: "published",
    }),
    fetchQuery(api.blogCategories.list, {}),
  ]);

  // Transform DB posts to expected format
  const allPosts = dbPosts.map(post => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    author: post.author,
    category: post.category,
    categoryId: post.categoryId,
    featuredImageUrl: post.featuredImageUrl,
    publishedAt: post.publishedAt || post.createdAt,
    readTimeMinutes: post.readTimeMinutes || 5,
  }));

  // Separate featured post (most recent) from other posts
  const featuredPost = allPosts[0];
  const posts = allPosts.slice(1);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <BlogHero
        headline={t("headline")}
        subheadline={t("subheadline")}
      />

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-16 bg-sls-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FeaturedPost
              slug={featuredPost.slug}
              title={featuredPost.title}
              excerpt={featuredPost.excerpt}
              author={featuredPost.author}
              category={featuredPost.category}
              featuredImageUrl={featuredPost.featuredImageUrl}
              readTimeMinutes={featuredPost.readTimeMinutes}
            />
          </div>
        </section>
      )}

      {/* Popular Games Section */}
      <PopularGamesSection className="bg-white" />

      {/* Blog Grid with Category Filter */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryFilterTabs
            categories={categories}
            posts={posts}
            locale={locale}
            allLabel={t("allCategories")}
            noPostsLabel={t("noPosts")}
          />
        </div>
      </section>

      {/* Contact Card */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <BlogContactCard />
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection variant="accent" />
    </div>
  );
}
