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
import { getLocalBusinessSchema, getOrganizationSchema } from "@/lib/schema";

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
      canonical: `https://simmonds.online/${locale}`,
      languages: {
        de: "https://simmonds.online/de",
        en: "https://simmonds.online/en",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `https://simmonds.online/${locale}`,
      siteName: "Simmonds Language Services",
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // JSON-LD schemas are generated from our own controlled schema functions (no user input)
  const localBusinessSchema = getLocalBusinessSchema(locale);
  const organizationSchema = getOrganizationSchema(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

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
