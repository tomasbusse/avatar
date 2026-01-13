"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Check, ArrowRight, Clock, Users, MapPin, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingTier {
  titleKey: string;
  icon: React.ReactNode;
  descriptionKey: string;
  prices: { duration: string; price: string }[];
  featuresKey: string;
  isPopular?: boolean;
}

export function PricingTable() {
  const t = useTranslations("pricing");
  const locale = useLocale();

  const tiers: PricingTier[] = [
    {
      titleKey: "online.title",
      icon: <Monitor className="w-6 h-6" />,
      descriptionKey: "online.description",
      prices: [
        { duration: "60 min", price: "€65" },
        { duration: "90 min", price: "€90" },
      ],
      featuresKey: "online.features",
      isPopular: true,
    },
    {
      titleKey: "faceToFace.title",
      icon: <MapPin className="w-6 h-6" />,
      descriptionKey: "faceToFace.description",
      prices: [
        { duration: "60 min", price: "€75" },
        { duration: "90 min", price: "€105" },
      ],
      featuresKey: "faceToFace.features",
    },
    {
      titleKey: "group.title",
      icon: <Users className="w-6 h-6" />,
      descriptionKey: "group.description",
      prices: [
        { duration: t("perPerson"), price: "€35/h" },
      ],
      featuresKey: "group.features",
    },
  ];

  // Get features array from translations
  const getFeatures = (key: string): string[] => {
    try {
      // Assuming features are stored as numbered items
      const features: string[] = [];
      for (let i = 0; i < 5; i++) {
        const feature = t.raw(`${key}.${i}`);
        if (feature) features.push(feature);
      }
      return features;
    } catch {
      return [];
    }
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-chartreuse/10 text-sls-chartreuse text-sm font-semibold mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
            {t("headline")}
          </h2>
          <p className="text-lg text-sls-olive/70 max-w-2xl mx-auto">
            {t("subheadline")}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={cn(
                "relative rounded-3xl p-8 border-2 transition-all hover:shadow-xl",
                tier.isPopular
                  ? "border-sls-orange bg-gradient-to-b from-sls-orange/5 to-transparent"
                  : "border-sls-beige hover:border-sls-teal/30"
              )}
            >
              {/* Popular Badge */}
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-block px-4 py-1 rounded-full bg-sls-orange text-white text-sm font-semibold">
                    {t("popular")}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  tier.isPopular ? "bg-sls-orange/10 text-sls-orange" : "bg-sls-teal/10 text-sls-teal"
                )}>
                  {tier.icon}
                </div>
                <h3 className="text-xl font-bold text-sls-teal">
                  {t(tier.titleKey)}
                </h3>
              </div>

              {/* Description */}
              <p className="text-sls-olive/70 mb-6">
                {t(tier.descriptionKey)}
              </p>

              {/* Prices */}
              <div className="space-y-3 mb-6">
                {tier.prices.map((price, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-sls-cream"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sls-olive/50" />
                      <span className="text-sls-olive">{price.duration}</span>
                    </div>
                    <span className={cn(
                      "text-2xl font-bold",
                      tier.isPopular ? "text-sls-orange" : "text-sls-teal"
                    )}>
                      {price.price}
                    </span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {[0, 1, 2, 3].map((i) => {
                  const feature = t.raw(`${tier.featuresKey}.${i}`);
                  if (!feature) return null;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={cn(
                        "w-5 h-5 flex-shrink-0 mt-0.5",
                        tier.isPopular ? "text-sls-orange" : "text-sls-chartreuse"
                      )} />
                      <span className="text-sls-olive text-sm">{feature}</span>
                    </li>
                  );
                })}
              </ul>

              {/* CTA */}
              <Link
                href={`/${locale}/contact`}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
                  tier.isPopular
                    ? "bg-sls-orange text-white hover:bg-sls-orange/90 hover:shadow-lg hover:shadow-sls-orange/25"
                    : "bg-sls-teal text-white hover:bg-sls-teal/90"
                )}
              >
                {t("getStarted")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-sls-olive/70">
            <span>{t("vatNote")}</span>
            <span>•</span>
            <span>{t("travelNote")}</span>
            <span>•</span>
            <span>{t("cancellationNote")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
