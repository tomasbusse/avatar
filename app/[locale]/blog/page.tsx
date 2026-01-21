import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Breadcrumbs, CTASection } from "@/components/landing";
import { CategoryFilterTabs } from "@/components/blog/CategoryFilterTabs";

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
  const posts = dbPosts.map(post => ({
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

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: t("headline") }]} />
      </div>

      {/* Header */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
            {t("badge")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-sls-teal mb-4">
            {t("headline")}
          </h1>
          <p className="text-xl text-sls-olive/70 max-w-2xl mx-auto">
            {t("subheadline")}
          </p>
        </div>
      </section>

      {/* Blog Grid with Category Filter */}
      <section className="py-16 bg-white">
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

      {/* CTA */}
      <CTASection variant="accent" />
    </div>
  );
}
