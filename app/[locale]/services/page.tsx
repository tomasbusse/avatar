import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Briefcase,
  Users,
  Bot,
  GraduationCap,
  FileEdit,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Breadcrumbs, CTASection } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });

  return {
    title: `${t("headline")} | Simmonds Language Services`,
    description: t("subheadline"),
  };
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "services" });

  const services = [
    {
      icon: <Briefcase className="w-12 h-12" />,
      title: t("businessEnglish.title"),
      description: t("businessEnglish.description"),
      href: `/${locale}/services/business-english`,
      image: "/images/business-english-hero.webp",
      features: locale === "de"
        ? ["Meetings & Präsentationen", "E-Mail & Schriftverkehr", "Verhandlungen & Vertrieb", "Telefon- & Videokonferenzen"]
        : ["Meetings & Presentations", "Email & Written Communication", "Negotiations & Sales", "Telephone & Video Calls"],
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: t("teamTraining.title"),
      description: t("teamTraining.description"),
      href: `/${locale}/services/team-training`,
      image: "/images/team-training-hero.webp",
      features: locale === "de"
        ? ["Gruppentraining für Teams", "Branchenspezifische Inhalte", "Flexible Formate", "Fortschrittsverfolgung"]
        : ["Group training for teams", "Industry-specific content", "Flexible formats", "Progress tracking"],
    },
    {
      icon: <Bot className="w-12 h-12" />,
      title: t("aiPractice.title"),
      description: t("aiPractice.description"),
      href: `/${locale}/services/ai-practice`,
      image: "/images/george-avatar-hero.webp",
      features: locale === "de"
        ? ["24/7 verfügbar", "Sofortiges Feedback", "Keine Bewertung", "Individuelles Lerntempo"]
        : ["Available 24/7", "Instant feedback", "No judgment", "Learn at your pace"],
    },
    {
      icon: <GraduationCap className="w-12 h-12" />,
      title: t("germanCourses.title"),
      description: t("germanCourses.description"),
      href: `/${locale}/services/german-courses`,
      image: "/images/german-courses-hero.webp",
      features: locale === "de"
        ? ["Integrationskurse", "Business-Deutsch", "Konversationstraining", "Kulturelles Verständnis"]
        : ["Integration Training", "Business German", "Conversation Skills", "Cultural Understanding"],
    },
    {
      icon: <FileEdit className="w-12 h-12" />,
      title: t("copyEditing.title"),
      description: t("copyEditing.description"),
      href: `/${locale}/services/copy-editing`,
      image: "/images/copy-editing-hero.webp",
      features: locale === "de"
        ? ["Dokumentenbearbeitung", "Berichte & Angebote", "Website-Inhalte", "Marketing-Materialien"]
        : ["Document Editing", "Report & Proposal Review", "Website Content", "Marketing Materials"],
    },
  ];

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: t("headline") }]}
        />
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

      {/* Services List */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {services.map((service, index) => (
              <div
                key={service.href}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="w-20 h-20 rounded-2xl bg-sls-cream flex items-center justify-center text-sls-teal mb-6">
                    {service.icon}
                  </div>
                  <h2 className="text-3xl font-bold text-sls-teal mb-4">
                    {service.title}
                  </h2>
                  <p className="text-lg text-sls-olive/70 mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-sls-chartreuse" />
                        <span className="text-sls-olive">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sls-orange text-white font-semibold transition-all hover:bg-sls-orange/90 hover:shadow-lg"
                  >
                    {t("learnMore")}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div
                  className={`relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ${
                    index % 2 === 1 ? "lg:order-1" : ""
                  }`}
                >
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection variant="dark" />
    </div>
  );
}
