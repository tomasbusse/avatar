import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { CheckCircle2, Users, Building, BookOpen, MessageCircle } from "lucide-react";
import { Breadcrumbs, FAQAccordion, CTASection } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });

  return {
    title: `${t("germanCourses.title")} | Simmonds Language Services`,
    description: t("germanCourses.description"),
  };
}

export default async function GermanCoursesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "services" });

  const features = [
    { icon: <Building />, title: "Corporate Integration", desc: "Helping international employees thrive" },
    { icon: <MessageCircle />, title: "Conversational German", desc: "Everyday communication skills" },
    { icon: <Users />, title: "Cultural Training", desc: "Understanding German workplace culture" },
    { icon: <BookOpen />, title: "Grammar Foundations", desc: "Solid grammatical understanding" },
  ];

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: t("badge"), href: `/${locale}/services` },
            { label: t("germanCourses.title") },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-sls-chartreuse/20 text-sls-teal text-sm font-semibold mb-4">
                {t("badge")}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-sls-teal mb-4">
                {t("germanCourses.title")}
              </h1>
              <p className="text-xl text-sls-olive/70 mb-8">
                {t("germanCourses.description")}
              </p>
              <ul className="space-y-3">
                {["Integration through language", "Cultural understanding", "Practical communication"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-sls-chartreuse" />
                      <span className="text-sls-olive">{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-sls-chartreuse/20 to-sls-teal/10" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-sls-teal text-center mb-12">
            Course Focus Areas
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-sls-cream border-2 border-sls-beige hover:border-sls-teal/30 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-sls-chartreuse/20 flex items-center justify-center text-sls-teal mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-sls-teal mb-2">
                  {feature.title}
                </h3>
                <p className="text-sls-olive/70 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion maxItems={3} showViewAll={true} />

      {/* CTA */}
      <CTASection variant="dark" />
    </div>
  );
}
