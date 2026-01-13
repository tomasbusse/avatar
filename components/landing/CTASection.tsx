"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Phone } from "lucide-react";

interface CTASectionProps {
  variant?: "default" | "dark" | "accent";
}

export function CTASection({ variant = "default" }: CTASectionProps) {
  const t = useTranslations("cta");
  const locale = useLocale();

  const bgClass = {
    default: "bg-sls-cream",
    dark: "bg-sls-teal",
    accent: "bg-gradient-to-br from-sls-orange to-sls-orange/80",
  }[variant];

  const textClass = {
    default: "text-sls-teal",
    dark: "text-white",
    accent: "text-white",
  }[variant];

  const subtextClass = {
    default: "text-sls-olive/70",
    dark: "text-sls-beige/80",
    accent: "text-white/80",
  }[variant];

  return (
    <section className={`py-20 ${bgClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Content */}
        <h2 className={`text-3xl sm:text-4xl font-bold ${textClass} mb-4`}>
          {t("headline")}
        </h2>
        <p className={`text-lg ${subtextClass} mb-8 max-w-2xl mx-auto`}>
          {t("subheadline")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/${locale}/contact`}
            className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all active:scale-95 ${
              variant === "default"
                ? "bg-sls-orange text-white hover:bg-sls-orange/90 hover:shadow-xl hover:shadow-sls-orange/25"
                : variant === "dark"
                ? "bg-white text-sls-teal hover:bg-sls-cream"
                : "bg-white text-sls-orange hover:bg-sls-cream"
            }`}
          >
            {t("buttonPrimary")}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="tel:+495115555555"
            className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all active:scale-95 ${
              variant === "default"
                ? "bg-sls-teal/10 text-sls-teal hover:bg-sls-teal/20"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Phone className="w-5 h-5" />
            {t("buttonSecondary")}
          </a>
        </div>

        {/* Trust Badge */}
        <p className={`mt-8 text-sm ${subtextClass}`}>
          {t("trustBadge")}
        </p>
      </div>
    </section>
  );
}
