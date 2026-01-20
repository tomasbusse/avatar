import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Building2, Phone, Mail, Globe, Scale, FileText, Shield } from "lucide-react";
import { Breadcrumbs } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "imprint" });

  return {
    title: `${t("title")} | Simmonds Language Services`,
    description: t("name"),
  };
}

export default async function ImprintPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "imprint" });

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: t("title") }]} />
      </div>

      {/* Header */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-sls-teal mb-4">
            {t("title")}
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Company Information */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-sls-teal">
                {t("responsibleTitle")}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-sls-cream border border-sls-beige space-y-2">
              <p className="text-lg font-semibold text-sls-teal">{t("name")}</p>
              <p className="text-sls-olive">{t("owner")}</p>
              <p className="text-sls-olive">{t("address")}</p>
              <p className="text-sls-olive">{t("city")}</p>
              <p className="text-sls-olive">{t("country")}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal">
                <Phone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-sls-teal">
                {t("contactTitle")}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-sls-cream border border-sls-beige space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-sls-teal" />
                <span className="text-sls-olive">{t("phone")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-sls-teal" />
                <a
                  href="mailto:james@englisch-lehrer.com"
                  className="text-sls-olive hover:text-sls-teal transition-colors"
                >
                  {t("email")}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-sls-teal" />
                <a
                  href="https://www.englisch-lehrer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sls-olive hover:text-sls-teal transition-colors"
                >
                  {t("website")}
                </a>
              </div>
            </div>
          </div>

          {/* VAT Information */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-sls-teal">
                {t("vatTitle")}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-sls-cream border border-sls-beige">
              <p className="text-sls-olive">{t("vatExempt")}</p>
            </div>
          </div>

          {/* Responsible for Content */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-sls-teal">
                {t("contentTitle")}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-sls-cream border border-sls-beige space-y-2">
              <p className="text-lg font-semibold text-sls-teal">{t("name")}</p>
              <p className="text-sls-olive">{t("owner")}</p>
              <p className="text-sls-olive">{t("address")}</p>
              <p className="text-sls-olive">{t("city")}</p>
            </div>
          </div>

          {/* Dispute Resolution */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-sls-teal">
                {t("disputeTitle")}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-sls-cream border border-sls-beige">
              <p className="text-sls-olive leading-relaxed">{t("disputeText")}</p>
            </div>
          </div>

          {/* Copyright */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-sls-teal">
                {t("copyrightTitle")}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-sls-cream border border-sls-beige">
              <p className="text-sls-olive leading-relaxed">{t("copyrightText")}</p>
            </div>
          </div>

          {/* Liability Disclaimer */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-sls-teal">
                {t("liabilityTitle")}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-sls-cream border border-sls-beige">
              <p className="text-sls-olive leading-relaxed">{t("liabilityText")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
