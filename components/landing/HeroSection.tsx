"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the avatar wrapper with SSR disabled to prevent hydration errors
const ClientAvatarWrapper = dynamic(
  () => import("./ClientAvatarWrapper").then((mod) => mod.ClientAvatarWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-md aspect-[3/4] rounded-3xl bg-gradient-to-br from-sls-teal/5 to-sls-beige/50 border-2 border-sls-beige flex items-center justify-center animate-pulse">
        <div className="text-center text-sls-olive/60 p-8">
          <div className="w-24 h-24 rounded-full bg-sls-beige/50 mx-auto mb-4 flex items-center justify-center">
            <Play className="w-10 h-10 text-sls-teal/50" />
          </div>
          <p className="text-sm">Loading avatar...</p>
        </div>
      </div>
    ),
  }
);

interface HeroSectionProps {
  avatarId?: string;
  showAvatar?: boolean;
}

export function HeroSection({ avatarId, showAvatar = true }: HeroSectionProps) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const [showContactForm, setShowContactForm] = useState(false);

  // Handle CTA click to show contact form on avatar
  const handleCtaClick = useCallback(() => {
    setShowContactForm(true);
    // On mobile, scroll to the avatar (which shows the contact form)
    setTimeout(() => {
      const avatarEl = document.querySelector('[data-avatar-display]');
      if (avatarEl) {
        avatarEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100); // Small delay to ensure flip animation starts
  }, []);

  // Handle when contact form is closed/reset
  const handleContactFormClose = useCallback(() => {
    setShowContactForm(false);
  }, []);

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
  ];

  return (
    <section className="relative min-h-screen bg-sls-cream overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 63, 55, 0.1) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-sls-chartreuse/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-gradient-to-tr from-sls-teal/10 to-transparent rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
          {/* Left: Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-sls-chartreuse animate-pulse" />
              {t("badge")}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-sls-teal leading-tight mb-6">
              {t("headline")}
              <span className="text-sls-orange block mt-2">{t("headlineAccent")}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-sls-olive/80 leading-relaxed mb-8 max-w-xl">
              {t("subheadline")}
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-10">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sls-chartreuse flex-shrink-0" />
                  <span className="text-sls-olive">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sls-orange text-white font-semibold text-lg transition-all hover:bg-sls-orange/90 hover:shadow-xl hover:shadow-sls-orange/25 hover:-translate-y-0.5 active:scale-95"
              >
                {t("ctaPrimary")}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  // Scroll to avatar and start it
                  const avatarEl = document.querySelector('[data-avatar-display]');
                  avatarEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sls-teal/10 text-sls-teal font-semibold text-lg transition-all hover:bg-sls-teal/20 active:scale-95"
              >
                <Play className="w-5 h-5" />
                {t("ctaSecondary")}
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-sls-beige">
              <div className="flex flex-wrap items-center gap-8">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-teal">20+</span>
                  <span className="text-sm text-sls-olive">{t("years")}</span>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-teal">500+</span>
                  <span className="text-sm text-sls-olive">{t("students")}</span>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-teal">98%</span>
                  <span className="text-sm text-sls-olive">{t("satisfaction")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Avatar */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            {showAvatar ? (
              <ClientAvatarWrapper
                avatarId={avatarId}
                showContactForm={showContactForm}
                onContactFormClose={handleContactFormClose}
              />
            ) : (
              <div className="w-full max-w-md aspect-[3/4] rounded-3xl bg-gradient-to-br from-sls-teal/5 to-sls-beige/50 border-2 border-sls-beige flex items-center justify-center">
                <div className="text-center text-sls-olive/60 p-8">
                  <div className="w-24 h-24 rounded-full bg-sls-beige/50 mx-auto mb-4 flex items-center justify-center">
                    <Play className="w-10 h-10 text-sls-teal/50" />
                  </div>
                  <p className="text-sm">{t("avatarPlaceholder")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-sls-teal/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-sls-teal/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
