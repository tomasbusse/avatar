"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const services = [
    { href: `/${locale}/services/business-english`, label: t("businessEnglish") },
    { href: `/${locale}/services/german-courses`, label: t("germanCourses") },
    { href: `/${locale}/services/copy-editing`, label: t("copyEditing") },
  ];

  const navItems = [
    { href: `/${locale}/pricing`, label: t("pricing") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/faq`, label: t("faq") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-sls-cream/95 backdrop-blur-md shadow-lg shadow-sls-teal/5"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-sls-teal flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-sls-cream font-bold text-xl">S</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-sls-teal font-semibold text-lg tracking-tight">
                Simmonds
              </span>
              <span className="text-sls-olive text-sm block -mt-1">
                Language Services
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <button
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "text-sls-olive hover:text-sls-teal hover:bg-sls-beige/50"
                )}
              >
                {t("services")}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isServicesOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              <div
                className={cn(
                  "absolute top-full left-0 pt-2 w-64 transition-all duration-200",
                  isServicesOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                )}
              >
                <div className="bg-white rounded-xl shadow-xl shadow-sls-teal/10 border border-sls-beige overflow-hidden">
                  <div className="p-2">
                    <Link
                      href={`/${locale}/services`}
                      className="block px-4 py-3 rounded-lg text-sm font-medium text-sls-teal hover:bg-sls-cream transition-colors"
                    >
                      {t("allServices")}
                    </Link>
                    <div className="h-px bg-sls-beige my-1" />
                    {services.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        className="block px-4 py-3 rounded-lg text-sm text-sls-olive hover:text-sls-teal hover:bg-sls-cream transition-colors"
                      >
                        {service.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Other Nav Items */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-sls-teal bg-sls-beige/50"
                    : "text-sls-olive hover:text-sls-teal hover:bg-sls-beige/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side: Language Toggle + CTA */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href={`/${locale}/contact`}
              className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-lg bg-sls-orange text-white text-sm font-semibold transition-all hover:bg-sls-orange/90 hover:shadow-lg hover:shadow-sls-orange/25 active:scale-95"
            >
              {t("getStarted")}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-sls-olive hover:bg-sls-beige/50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-x-0 top-20 bg-sls-cream/98 backdrop-blur-lg border-t border-sls-beige transition-all duration-300",
          isMobileMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 py-6 space-y-2">
          <Link
            href={`/${locale}/services`}
            className="block px-4 py-3 rounded-lg text-sls-teal font-medium hover:bg-sls-beige/50 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t("services")}
          </Link>
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="block px-4 py-3 pl-8 rounded-lg text-sm text-sls-olive hover:text-sls-teal hover:bg-sls-beige/50 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {service.label}
            </Link>
          ))}
          <div className="h-px bg-sls-beige my-2" />
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-lg text-sls-olive hover:text-sls-teal hover:bg-sls-beige/50 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4">
            <Link
              href={`/${locale}/contact`}
              className="block w-full text-center px-5 py-3 rounded-lg bg-sls-orange text-white font-semibold transition-all hover:bg-sls-orange/90"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t("getStarted")}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
