import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Breadcrumbs, ContactForm, ContactInfo, FAQAccordion } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: `${t("headline")} | Simmonds Language Services`,
    description: t("subheadline"),
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });

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

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-sls-cream rounded-3xl p-8 sm:p-10">
              <ContactForm />
            </div>

            {/* Contact Info - now fetched from Convex siteConfig */}
            <ContactInfo />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion maxItems={3} showViewAll={true} />
    </div>
  );
}
