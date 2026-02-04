"use client";

import { useTranslations } from "next-intl";
import {
  Clock,
  Users,
  Award,
  Target,
  Languages,
  HeartHandshake,
  LucideIcon,
  Presentation,
  Mail,
  MessageSquare,
  Phone,
  Book,
} from "lucide-react";

interface USPItem {
  icon?: string;
  title: string;
  description: string;
}

interface USPContent {
  badge?: string;
  title?: string;
  subtitle?: string;
  items?: USPItem[];
}

interface USPSectionProps {
  content?: USPContent;
}

// Icon mapping for string-based icons from database
const iconMap: Record<string, LucideIcon> = {
  clock: Clock,
  users: Users,
  award: Award,
  target: Target,
  languages: Languages,
  heartHandshake: HeartHandshake,
  presentation: Presentation,
  mail: Mail,
  messageSquare: MessageSquare,
  phone: Phone,
  book: Book,
};

export function USPSection({ content }: USPSectionProps) {
  const t = useTranslations("usp");

  // Default USPs from translations
  const defaultUsps = [
    {
      icon: <Clock className="w-7 h-7" />,
      titleKey: "flexibility.title",
      descriptionKey: "flexibility.description",
    },
    {
      icon: <Users className="w-7 h-7" />,
      titleKey: "personalized.title",
      descriptionKey: "personalized.description",
    },
    {
      icon: <Award className="w-7 h-7" />,
      titleKey: "experience.title",
      descriptionKey: "experience.description",
    },
    {
      icon: <Target className="w-7 h-7" />,
      titleKey: "methodology.title",
      descriptionKey: "methodology.description",
    },
    {
      icon: <Languages className="w-7 h-7" />,
      titleKey: "bilingual.title",
      descriptionKey: "bilingual.description",
    },
    {
      icon: <HeartHandshake className="w-7 h-7" />,
      titleKey: "support.title",
      descriptionKey: "support.description",
    },
  ];

  // Use provided content items or default to translations
  const usps = content?.items?.map((item) => {
    const IconComponent = item.icon ? iconMap[item.icon] || Clock : Clock;
    return {
      icon: <IconComponent className="w-7 h-7" />,
      title: item.title,
      description: item.description,
    };
  }) || defaultUsps.map((usp) => ({
    icon: usp.icon,
    title: t(usp.titleKey),
    description: t(usp.descriptionKey),
  }));

  // Use provided content or fall back to translations
  const badge = content?.badge || t("badge");
  const headline = content?.title || t("headline");
  const subheadline = content?.subtitle || t("subheadline");

  return (
    <section className="py-24 bg-sls-teal relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sls-chartreuse/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sls-orange/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-sls-chartreuse text-sm font-semibold mb-4">
            {badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {headline}
          </h2>
          <p className="text-lg text-sls-beige/80 max-w-2xl mx-auto">
            {subheadline}
          </p>
        </div>

        {/* USP Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {usps.map((usp, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-sls-chartreuse/20 flex items-center justify-center text-sls-chartreuse mb-4 group-hover:scale-110 transition-transform">
                {usp.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-2">
                {usp.title}
              </h3>
              <p className="text-sls-beige/70 leading-relaxed">
                {usp.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
