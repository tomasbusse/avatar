import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Breadcrumbs, BlogCard, CTASection } from "@/components/landing";

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

  // Sample blog posts - these would come from Convex in production
  const posts = [
    {
      slug: "mastering-business-english-presentations",
      title: "Mastering Business English Presentations",
      excerpt:
        "Learn the key techniques for delivering confident and persuasive presentations in English.",
      author: "James Simmonds",
      category: "Business English",
      publishedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      readTimeMinutes: 5,
    },
    {
      slug: "email-etiquette-for-professionals",
      title: "Email Etiquette for International Professionals",
      excerpt:
        "Master the art of professional email communication with these essential tips and templates.",
      author: "James Simmonds",
      category: "Communication",
      publishedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
      readTimeMinutes: 4,
    },
    {
      slug: "german-business-culture",
      title: "Understanding German Business Culture",
      excerpt:
        "Navigate the nuances of German workplace culture and communication styles.",
      author: "James Simmonds",
      category: "Culture",
      publishedAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
      readTimeMinutes: 6,
    },
  ];

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

      {/* Blog Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogCard key={post.slug} {...post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-sls-olive/70">{t("noPosts")}</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <CTASection variant="accent" />
    </div>
  );
}
