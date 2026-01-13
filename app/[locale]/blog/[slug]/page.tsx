import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Breadcrumbs, CTASection } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  // In production, fetch the post from Convex
  return {
    title: `Blog Post | Simmonds Language Services`,
    description: "Read our latest insights on language learning",
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  // Sample post data - would come from Convex in production
  const post = {
    title: "Mastering Business English Presentations",
    excerpt:
      "Learn the key techniques for delivering confident and persuasive presentations in English.",
    content: `
## Introduction

Delivering presentations in English can be daunting, especially when it's not your first language. But with the right preparation and techniques, you can present with confidence and impact.

## Key Techniques

### 1. Structure Your Message

A clear structure helps both you and your audience. Use the classic three-part structure:
- **Opening**: Hook your audience and state your purpose
- **Body**: Present your main points with supporting evidence
- **Closing**: Summarize and call to action

### 2. Use Simple, Direct Language

Avoid complex vocabulary and long sentences. Your goal is clarity, not showing off your vocabulary. Simple language is more persuasive and easier for international audiences to follow.

### 3. Practice, Practice, Practice

There's no substitute for rehearsal. Practice out loud, time yourself, and if possible, record yourself to identify areas for improvement.

## Common Phrases for Presentations

Here are some useful phrases to structure your presentation:

- "I'd like to start by..."
- "Let me move on to..."
- "To summarize..."
- "Are there any questions?"

## Conclusion

With these techniques and regular practice, you'll be delivering confident English presentations in no time. Remember, fluency comes with practice, not perfection.
    `,
    author: "James Simmonds",
    category: "Business English",
    publishedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    readTimeMinutes: 5,
  };

  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    locale === "de" ? "de-DE" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

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

          {/* Content */}
          <div className="prose prose-lg max-w-none prose-headings:text-sls-teal prose-p:text-sls-olive/80 prose-strong:text-sls-teal prose-a:text-sls-orange prose-ul:text-sls-olive/80">
            <div
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/## /g, '<h2 class="text-2xl font-bold mt-8 mb-4">')
                  .replace(/### /g, '<h3 class="text-xl font-semibold mt-6 mb-3">')
                  .replace(/\n\n/g, "</p><p>")
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/- /g, '<li class="ml-4">')
              }}
            />
          </div>

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
