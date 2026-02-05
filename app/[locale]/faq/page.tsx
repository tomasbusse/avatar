import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Breadcrumbs, FAQAccordion, CTASection } from "@/components/landing";
import { FAQAvatarHero } from "./FAQAvatarHero";
import { getFAQPageSchema } from "@/lib/schema";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });

  return {
    title: `${t("headline")} | Simmonds Language Services`,
    description: t("subheadline"),
    alternates: {
      canonical: `https://simmonds.online/${locale}/faq`,
      languages: {
        de: "https://simmonds.online/de/faq",
        en: "https://simmonds.online/en/faq",
      },
    },
    openGraph: {
      title: `${t("headline")} | Simmonds Language Services`,
      description: t("subheadline"),
      url: `https://simmonds.online/${locale}/faq`,
      siteName: "Simmonds Language Services",
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
  };
}

export default async function FAQPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "faq" });

  // Build FAQ items from translations for JSON-LD schema
  // SECURITY NOTE: Content is from controlled translation files, not user input - safe for JSON-LD
  const faqItems: { question: string; answer: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const qKey = `items.${i}.question`;
    const aKey = `items.${i}.answer`;
    if (!t.has(qKey)) break;
    faqItems.push({ question: String(t(qKey as never)), answer: String(t(aKey as never)) });
  }
  const faqSchemaJson = JSON.stringify(getFAQPageSchema(faqItems));

  return (
    <div className="pt-20">
      {/* eslint-disable-next-line -- JSON-LD requires dangerouslySetInnerHTML; content is from controlled translation files */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchemaJson }} />

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: t("headline") }]} />
      </div>

      {/* Hero with Avatar */}
      <section className="py-12 sm:py-16 lg:py-20 bg-sls-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold tracking-wide mb-4">
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-sls-teal mb-4">
              {t("headline")}
            </h1>
            <p className="text-lg text-sls-olive/70 max-w-2xl mx-auto">
              {t("subheadline")}
            </p>
          </div>

          {/* YouTube-style Avatar Screen */}
          <FAQAvatarHero />
        </div>
      </section>

      {/* The Simmonds Method */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-sls-orange/10 text-sls-orange text-sm font-semibold tracking-wide mb-4">
              {t("methodBadge")}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-sls-teal mb-3">
              {t("methodTitle")}
            </h2>
            <p className="text-xl sm:text-2xl font-serif italic text-sls-olive/80 mb-4">
              {t("methodTagline")}
            </p>
            <p className="text-base text-sls-olive/60 max-w-xl mx-auto">
              {t("methodDescription")}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="group relative bg-sls-cream/50 rounded-2xl p-6 sm:p-8 border border-sls-beige/50 hover:border-sls-teal/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-sls-teal/10 flex items-center justify-center mb-5">
                  <span className="text-sls-teal font-serif font-bold text-lg">{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-sls-teal mb-2">
                  {t(`methodPoints.${i}.title`)}
                </h3>
                <p className="text-sm text-sls-olive/70 leading-relaxed">
                  {t(`methodPoints.${i}.description`)}
                </p>
                <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-sls-teal/0 via-sls-teal/20 to-sls-teal/0 group-hover:via-sls-orange/40 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 sm:py-20 bg-sls-cream/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sls-teal mb-2">
              {t("faqSectionTitle")}
            </h2>
            <p className="text-base text-sls-olive/60">
              {t("faqSectionSubtitle")}
            </p>
          </div>
        </div>
        <FAQAccordion showHeader={false} maxItems={20} showViewAll={false} />
      </section>

      {/* CTA */}
      <CTASection variant="accent" />
    </div>
  );
}
