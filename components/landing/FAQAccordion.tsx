"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

interface FAQAccordionProps {
  items?: FAQItem[];
  showHeader?: boolean;
  showViewAll?: boolean;
  maxItems?: number;
  className?: string;
  category?: string;
}

export function FAQAccordion({
  items,
  showHeader = true,
  showViewAll = true,
  maxItems = 5,
  className,
  category,
}: FAQAccordionProps) {
  const t = useTranslations("faq");
  const locale = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Track if we're on the client to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch FAQs from Convex database (only use after client mount)
  const dbFaqs = useQuery(api.landing.getFaqs, {
    locale: locale as string,
    category: category
  });

  // Fallback FAQs from translations (used for SSR and initial client render)
  const fallbackItems: FAQItem[] = [
    { question: t("items.0.question"), answer: t("items.0.answer") },
    { question: t("items.1.question"), answer: t("items.1.answer") },
    { question: t("items.2.question"), answer: t("items.2.answer") },
    { question: t("items.3.question"), answer: t("items.3.answer") },
    { question: t("items.4.question"), answer: t("items.4.answer") },
  ];

  // Use provided items, then DB (only on client), then fallback to translations
  const faqItems: FAQItem[] = items || (
    isClient && dbFaqs && dbFaqs.length > 0
      ? dbFaqs.map(faq => ({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
        }))
      : fallbackItems
  );

  const displayItems = faqItems.slice(0, maxItems);

  return (
    <section className={cn("py-24 bg-sls-cream", className)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {showHeader && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
              <HelpCircle className="w-4 h-4" />
              {t("badge")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
              {t("headline")}
            </h2>
            <p className="text-lg text-sls-olive/70">
              {t("subheadline")}
            </p>
          </div>
        )}

        {/* Accordion */}
        <div className="space-y-4">
          {displayItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border-2 border-sls-beige overflow-hidden transition-all hover:border-sls-teal/30"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="text-lg font-semibold text-sls-teal pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "w-6 h-6 text-sls-olive flex-shrink-0 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="px-6 pb-6 pt-0">
                  <div className="h-px bg-sls-beige mb-4" />
                  <p className="text-sls-olive leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        {showViewAll && faqItems.length > maxItems && (
          <div className="text-center mt-8">
            <Link
              href={`/${locale}/faq`}
              className="inline-flex items-center gap-2 text-sls-teal font-semibold hover:text-sls-orange transition-colors"
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
