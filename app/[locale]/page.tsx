import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import {
  HeroSection,
  ServicesGrid,
  USPSection,
  TestimonialsCarousel,
  FAQAccordion,
  CTASection,
} from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        de: "/de",
        en: "/en",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      {/* Hero Section with Avatar */}
      <HeroSection showAvatar={true} />

      {/* Services Grid */}
      <ServicesGrid />

      {/* Why Choose Us */}
      <USPSection />

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* FAQ Preview */}
      <FAQAccordion maxItems={5} showViewAll={true} />

      {/* CTA Section */}
      <CTASection variant="accent" />
    </>
  );
}
