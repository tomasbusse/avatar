"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Briefcase,
  Users,
  Bot,
  ArrowRight,
  LucideIcon,
  Presentation,
  Mail,
  MessageSquare,
  Phone,
  Book,
  Clock,
  Award,
  Target,
  Languages,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  accent: string;
}

interface ServiceItem {
  icon?: string;
  title: string;
  description: string;
  href?: string;
}

interface ServicesContent {
  badge?: string;
  title?: string;
  subtitle?: string;
  items?: ServiceItem[];
  showCTA?: boolean;
}

interface ServicesGridProps {
  content?: ServicesContent;
}

// Icon mapping for string-based icons from database
const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  users: Users,
  bot: Bot,
  presentation: Presentation,
  mail: Mail,
  messageSquare: MessageSquare,
  phone: Phone,
  book: Book,
  clock: Clock,
  award: Award,
  target: Target,
  languages: Languages,
  heartHandshake: HeartHandshake,
};

// Default accents for services
const accents = [
  "from-sls-orange/20 to-sls-orange/5",
  "from-sls-chartreuse/20 to-sls-chartreuse/5",
  "from-sls-teal/20 to-sls-teal/5",
  "from-sls-orange/20 to-sls-orange/5",
  "from-sls-chartreuse/20 to-sls-chartreuse/5",
  "from-sls-teal/20 to-sls-teal/5",
];

export function ServicesGrid({ content }: ServicesGridProps) {
  const t = useTranslations("services");
  const locale = useLocale();

  // Default services from translations
  const defaultServices = [
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: t("businessEnglish.title"),
      description: t("businessEnglish.description"),
      href: `/${locale}/services/business-english`,
      accent: "from-sls-orange/20 to-sls-orange/5",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t("teamTraining.title"),
      description: t("teamTraining.description"),
      href: `/${locale}/services/team-training`,
      accent: "from-sls-chartreuse/20 to-sls-chartreuse/5",
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: t("aiPractice.title"),
      description: t("aiPractice.description"),
      href: `/${locale}/services/ai-practice`,
      accent: "from-sls-teal/20 to-sls-teal/5",
    },
  ];

  // Use provided content items or default to translations
  const services = content?.items?.map((item, index) => {
    const IconComponent = item.icon ? iconMap[item.icon] || Briefcase : Briefcase;
    return {
      icon: <IconComponent className="w-8 h-8" />,
      title: item.title,
      description: item.description,
      href: item.href || "#",
      accent: accents[index % accents.length],
    };
  }) || defaultServices;

  // Use provided content or fall back to translations
  const badge = content?.badge || t("badge");
  const headline = content?.title || t("headline");
  const subheadline = content?.subtitle || t("subheadline");
  const showCTA = content?.showCTA !== false;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
            {badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
            {headline}
          </h2>
          <p className="text-lg text-sls-olive/70 max-w-2xl mx-auto">
            {subheadline}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Link
              key={service.href}
              href={service.href}
              className="group relative bg-white rounded-2xl p-8 border-2 border-sls-beige hover:border-sls-teal/30 transition-all hover:shadow-xl hover:shadow-sls-teal/5 hover:-translate-y-1"
            >
              {/* Gradient Background */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                  service.accent
                )}
              />

              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-sls-cream flex items-center justify-center text-sls-teal mb-6 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-sls-teal mb-3 group-hover:text-sls-orange transition-colors">
                  {service.title}
                </h3>
                <p className="text-sls-olive/70 leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Link */}
                <span className="inline-flex items-center gap-2 text-sls-teal font-semibold group-hover:text-sls-orange transition-colors">
                  {t("learnMore")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        {showCTA && (
          <div className="text-center mt-12">
            <Link
              href={`/${locale}/services`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sls-teal text-white font-semibold transition-all hover:bg-sls-teal/90 hover:shadow-lg hover:shadow-sls-teal/25"
            >
              {t("viewAll")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
