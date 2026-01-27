import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import {
  CheckCircle2,
  MessageSquare,
  Mic,
  Briefcase,
  BookOpen,
  Brain,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import {
  Breadcrumbs,
  FAQAccordion,
  CTASection,
  YouTubeAvatarDemo,
} from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aiPractice" });

  return {
    title: `${t("meta.title")} | Simmonds Language Services`,
    description: t("meta.description"),
  };
}

export default async function AIPracticePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "aiPractice" });
  const tServices = await getTranslations({ locale, namespace: "services" });

  const benefits = [
    { key: "availability", icon: <Clock className="w-5 h-5" /> },
    { key: "patience", icon: <Shield className="w-5 h-5" /> },
    { key: "feedback", icon: <Zap className="w-5 h-5" /> },
  ];

  const features = [
    { key: "conversations", icon: <MessageSquare /> },
    { key: "pronunciation", icon: <Mic /> },
    { key: "business", icon: <Briefcase /> },
    { key: "vocabulary", icon: <BookOpen /> },
    { key: "grammar", icon: <Brain /> },
  ];

  const steps = [
    { number: "1", key: "step1" },
    { number: "2", key: "step2" },
    { number: "3", key: "step3" },
  ];

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: tServices("badge"), href: `/${locale}/services` },
            { label: t("title") },
          ]}
        />
      </div>

      {/* Hero Section */}
      <section className="py-12 lg:py-20 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-sls-orange/10 text-sls-orange text-sm font-semibold mb-4">
                {t("badge")}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sls-teal mb-4">
                {t("hero.headline")}
              </h1>
              <p className="text-lg sm:text-xl text-sls-olive/70 mb-8">
                {t("hero.subheadline")}
              </p>

              {/* Key Benefits */}
              <ul className="space-y-4 mb-8">
                {benefits.map((benefit) => (
                  <li key={benefit.key} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sls-chartreuse/20 flex items-center justify-center text-sls-teal flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sls-teal">
                        {t(`benefits.${benefit.key}.title`)}
                      </h3>
                      <p className="text-sm text-sls-olive/70">
                        {t(`benefits.${benefit.key}.description`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: YouTube-style Avatar Demo */}
            <div className="lg:pl-8">
              <YouTubeAvatarDemo
                avatarName="George Patterson"
                avatarTitle={t("george.title")}
                avatarImage="/images/george-avatar-hero.webp"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-sls-teal mb-4">
              {t("features.headline")}
            </h2>
            <p className="text-lg text-sls-olive/70 max-w-2xl mx-auto">
              {t("features.subheadline")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="p-6 rounded-2xl bg-sls-cream border-2 border-sls-beige hover:border-sls-teal/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal mb-4 group-hover:bg-sls-teal group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-sls-teal mb-2">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="text-sls-olive/70">
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-sls-teal mb-4">
              {t("howItWorks.headline")}
            </h2>
            <p className="text-lg text-sls-olive/70 max-w-2xl mx-auto">
              {t("howItWorks.subheadline")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.key} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-0 h-0.5 bg-sls-beige" />
                )}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sls-teal text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-sls-teal mb-2">
                    {t(`howItWorks.${step.key}.title`)}
                  </h3>
                  <p className="text-sls-olive/70">
                    {t(`howItWorks.${step.key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* George's Personality Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-sls-teal to-sls-olive rounded-3xl p-8 lg:p-12 text-white">
            <div className="max-w-3xl">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                {t("george.headline")}
              </h2>
              <p className="text-lg text-white/90 mb-6">
                {t("george.description")}
              </p>
              <ul className="space-y-3">
                {["trait1", "trait2", "trait3", "trait4"].map((trait) => (
                  <li key={trait} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-sls-chartreuse flex-shrink-0" />
                    <span>{t(`george.${trait}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
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
