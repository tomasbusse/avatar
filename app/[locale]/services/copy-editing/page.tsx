import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { CheckCircle2, FileText, Check, Layout, Sparkles } from "lucide-react";
import { Breadcrumbs, FAQAccordion, CTASection } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });

  return {
    title: `${t("copyEditing.title")} | Simmonds Language Services`,
    description: t("copyEditing.description"),
  };
}

export default async function CopyEditingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "services" });

  const principles = [
    { icon: <Layout />, title: "Main Clause First", desc: "Key information upfront" },
    { icon: <Check />, title: "Clarity", desc: "Simple, direct language" },
    { icon: <Sparkles />, title: "Impact", desc: "Engaging and persuasive" },
    { icon: <FileText />, title: "Structure", desc: "Logical flow and organization" },
  ];

  const documentTypes = [
    "Reports & Proposals",
    "Marketing Materials",
    "Website Content",
    "Presentations",
    "Emails & Letters",
    "Academic Papers",
  ];

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: t("badge"), href: `/${locale}/services` },
            { label: t("copyEditing.title") },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
                {t("badge")}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-sls-teal mb-4">
                {t("copyEditing.title")}
              </h1>
              <p className="text-xl text-sls-olive/70 mb-8">
                {t("copyEditing.description")}
              </p>
              <ul className="space-y-3">
                {["Professional polish", "Clear communication", "Error-free content"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-sls-chartreuse" />
                      <span className="text-sls-olive">{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-sls-teal/10 to-sls-olive/10" />
          </div>
        </div>
      </section>

      {/* Editing Principles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-sls-teal text-center mb-12">
            Our Editing Principles
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="p-6 rounded-2xl bg-sls-cream border-2 border-sls-beige hover:border-sls-teal/30 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal mb-4 mx-auto">
                  {principle.icon}
                </div>
                <h3 className="text-lg font-bold text-sls-teal mb-2">
                  {principle.title}
                </h3>
                <p className="text-sls-olive/70 text-sm">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Document Types */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-sls-teal text-center mb-12">
            Documents We Edit
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {documentTypes.map((type) => (
              <div
                key={type}
                className="flex items-center gap-3 p-4 rounded-xl bg-white"
              >
                <CheckCircle2 className="w-5 h-5 text-sls-chartreuse flex-shrink-0" />
                <span className="text-sls-olive">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion maxItems={3} showViewAll={true} />

      {/* CTA */}
      <CTASection variant="accent" />
    </div>
  );
}
