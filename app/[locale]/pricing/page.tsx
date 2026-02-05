import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Breadcrumbs, PricingTable, FAQAccordion, CTASection } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });

  return {
    title: `${t("headline")} | Simmonds Language Services`,
    description: t("subheadline"),
    alternates: {
      canonical: `https://simmonds.online/${locale}/pricing`,
      languages: {
        de: "https://simmonds.online/de/pricing",
        en: "https://simmonds.online/en/pricing",
      },
    },
    openGraph: {
      title: `${t("headline")} | Simmonds Language Services`,
      description: t("subheadline"),
      url: `https://simmonds.online/${locale}/pricing`,
      siteName: "Simmonds Language Services",
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
  };
}

export default async function PricingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pricing" });

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: t("headline") }]} />
      </div>

      {/* Pricing Table */}
      <PricingTable />

      {/* FAQ */}
      <FAQAccordion maxItems={3} showViewAll={true} />

      {/* CTA */}
      <CTASection variant="dark" />
    </div>
  );
}
