"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Briefcase,
  GraduationCap,
  FileEdit,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  href: string;
  accent: string;
}

export function ServicesGrid() {
  const t = useTranslations("services");
  const locale = useLocale();

  const services: Service[] = [
    {
      icon: <Briefcase className="w-8 h-8" />,
      titleKey: "businessEnglish.title",
      descriptionKey: "businessEnglish.description",
      href: `/${locale}/services/business-english`,
      accent: "from-sls-orange/20 to-sls-orange/5",
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      titleKey: "germanCourses.title",
      descriptionKey: "germanCourses.description",
      href: `/${locale}/services/german-courses`,
      accent: "from-sls-chartreuse/20 to-sls-chartreuse/5",
    },
    {
      icon: <FileEdit className="w-8 h-8" />,
      titleKey: "copyEditing.title",
      descriptionKey: "copyEditing.description",
      href: `/${locale}/services/copy-editing`,
      accent: "from-sls-teal/20 to-sls-teal/5",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
            {t("headline")}
          </h2>
          <p className="text-lg text-sls-olive/70 max-w-2xl mx-auto">
            {t("subheadline")}
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
                  {t(service.titleKey)}
                </h3>
                <p className="text-sls-olive/70 leading-relaxed mb-6">
                  {t(service.descriptionKey)}
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
        <div className="text-center mt-12">
          <Link
            href={`/${locale}/services`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sls-teal text-white font-semibold transition-all hover:bg-sls-teal/90 hover:shadow-lg hover:shadow-sls-teal/25"
          >
            {t("viewAll")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
