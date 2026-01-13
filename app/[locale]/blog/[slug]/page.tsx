import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Breadcrumbs, CTASection } from "@/components/landing";
import { BlockRenderer } from "@/components/blog/blocks/BlockRenderer";
import type { BlogBlock } from "@/types/blog-blocks";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  const post = await fetchQuery(api.landing.getBlogPost, { locale, slug });

  if (!post) {
    return {
      title: "Blog Post Not Found | Simmonds Language Services",
    };
  }

  return {
    title: `${post.title} | Simmonds Language Services`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: post.featuredImageUrl ? [post.featuredImageUrl] : undefined,
    },
  };
}

// Legacy markdown content renderer
function LegacyContent({ content }: { content: string }) {
  const html = content
    .replace(/## /g, '<h2 class="text-2xl font-bold mt-8 mb-4">')
    .replace(/### /g, '<h3 class="text-xl font-semibold mt-6 mb-3">')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/- /g, '<li class="ml-4">');

  return (
    <div
      className="prose prose-lg max-w-none prose-headings:text-sls-teal prose-p:text-sls-olive/80 prose-strong:text-sls-teal prose-a:text-sls-orange prose-ul:text-sls-olive/80"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  // Fetch blog post from Convex
  const dbPost = await fetchQuery(api.landing.getBlogPost, { locale, slug });

  if (!dbPost) {
    notFound();
  }

  // Check if this is a block-based post (v2) or legacy post (v1)
  const isBlockBased = dbPost.contentVersion === 2 && dbPost.contentBlocks && dbPost.contentBlocks.length > 0;

  const post = {
    title: dbPost.title,
    excerpt: dbPost.excerpt,
    content: dbPost.content || "",
    contentBlocks: dbPost.contentBlocks as BlogBlock[] | undefined,
    author: dbPost.author,
    authorImageUrl: dbPost.authorImageUrl,
    category: dbPost.category,
    featuredImageUrl: dbPost.featuredImageUrl,
    publishedAt: dbPost.publishedAt || dbPost.createdAt,
    readTimeMinutes: dbPost.readTimeMinutes || 5,
  };

  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    locale === "de" ? "de-DE" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Block-based rendering (v2)
  if (isBlockBased && post.contentBlocks) {
    return (
      <div className="pt-20">
        {/* Breadcrumbs */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: t("headline"), href: `/${locale}/blog` },
              { label: post.title },
            ]}
          />
        </div>

        {/* Back Link */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-sls-olive hover:text-sls-teal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToBlog")}
          </Link>
        </div>

        {/* Render content blocks */}
        <article>
          {post.contentBlocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              locale={locale}
              postSlug={slug}
              postTitle={post.title}
              author={post.author}
              authorImageUrl={post.authorImageUrl}
              publishedAt={post.publishedAt}
              readTimeMinutes={post.readTimeMinutes}
            />
          ))}
        </article>

        {/* Footer - Back link */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="pt-8 border-t border-sls-beige">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 text-sls-teal font-semibold hover:text-sls-orange transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t("backToBlog")}
            </Link>
          </div>
        </div>

        {/* CTA (if not in blocks) */}
        {!post.contentBlocks.some(b => b.config.type === "cta") && (
          <CTASection variant="accent" />
        )}
      </div>
    );
  }

  // Legacy rendering (v1)
  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: t("headline"), href: `/${locale}/blog` },
            { label: post.title },
          ]}
        />
      </div>

      {/* Article */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-sls-olive hover:text-sls-teal transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToBlog")}
          </Link>

          {/* Header */}
          <header className="mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
              {post.category}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-sls-teal mb-6">
              {post.title}
            </h1>
            <p className="text-xl text-sls-olive/70 mb-6">{post.excerpt}</p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-sls-olive/70">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {post.readTimeMinutes} {t("minRead")}
                </span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImageUrl && (
            <div className="mb-12 rounded-2xl overflow-hidden shadow-xl shadow-sls-teal/10">
              <img
                src={post.featuredImageUrl}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <LegacyContent content={post.content} />

          {/* Share / Tags */}
          <div className="mt-12 pt-8 border-t border-sls-beige">
            <div className="flex items-center justify-between">
              <Link
                href={`/${locale}/blog`}
                className="inline-flex items-center gap-2 text-sls-teal font-semibold hover:text-sls-orange transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {t("backToBlog")}
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* CTA */}
      <CTASection variant="accent" />
    </div>
  );
}
