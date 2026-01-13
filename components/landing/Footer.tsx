"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  // Use static year for SSR, update on client to prevent hydration mismatch
  const [currentYear, setCurrentYear] = useState(2026);
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const serviceLinks = [
    { href: `/${locale}/services/business-english`, label: t("businessEnglish") },
    { href: `/${locale}/services/german-courses`, label: t("germanCourses") },
    { href: `/${locale}/services/copy-editing`, label: t("copyEditing") },
  ];

  const companyLinks = [
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/faq`, label: t("faq") },
    { href: `/${locale}/blog`, label: t("blog") },
  ];

  return (
    <footer className="bg-sls-teal text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-sls-cream flex items-center justify-center">
                <span className="text-sls-teal font-bold text-xl">S</span>
              </div>
              <div>
                <span className="text-white font-semibold text-lg">Simmonds</span>
                <span className="text-sls-chartreuse text-sm block -mt-1">
                  Language Services
                </span>
              </div>
            </div>
            <p className="text-sls-beige/80 text-sm leading-relaxed mb-6">
              {t("tagline")}
            </p>
            <div className="flex items-center gap-3 text-sls-chartreuse">
              <span className="text-2xl font-bold">20+</span>
              <span className="text-sm text-sls-beige/80">{t("yearsExperience")}</span>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-sls-chartreuse font-semibold text-sm uppercase tracking-wider mb-4">
              {t("services")}
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sls-beige/80 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/${locale}/pricing`}
                  className="text-sls-beige/80 hover:text-white transition-colors text-sm"
                >
                  {t("pricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sls-chartreuse font-semibold text-sm uppercase tracking-wider mb-4">
              {t("company")}
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sls-beige/80 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-sls-chartreuse font-semibold text-sm uppercase tracking-wider mb-4">
              {t("contact")}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-sls-chartreuse flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="text-white font-medium">{t("hannover")}</span>
                  <br />
                  <span className="text-sls-beige/80">Lister Meile 89</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-sls-chartreuse flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="text-white font-medium">{t("berlin")}</span>
                  <br />
                  <span className="text-sls-beige/80">Friedrichstraße 123</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-sls-chartreuse flex-shrink-0" />
                <a
                  href="tel:+495115555555"
                  className="text-sls-beige/80 hover:text-white transition-colors text-sm"
                >
                  +49 511 555 5555
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-sls-chartreuse flex-shrink-0" />
                <a
                  href="mailto:info@simmonds-language.de"
                  className="text-sls-beige/80 hover:text-white transition-colors text-sm"
                >
                  info@simmonds-language.de
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sls-beige/60 text-sm">
              © {currentYear} Simmonds Language Services. {t("allRightsReserved")}
            </p>
            <div className="flex items-center gap-6">
              <Link
                href={`/${locale}/privacy`}
                className="text-sls-beige/60 hover:text-white transition-colors text-sm"
              >
                {t("privacy")}
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="text-sls-beige/60 hover:text-white transition-colors text-sm"
              >
                {t("terms")}
              </Link>
              <Link
                href={`/${locale}/imprint`}
                className="text-sls-beige/60 hover:text-white transition-colors text-sm"
              >
                {t("imprint")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
