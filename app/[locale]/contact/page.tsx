import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Breadcrumbs, ContactForm, FAQAccordion } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: `${t("headline")} | Simmonds Language Services`,
    description: t("subheadline"),
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });

  const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Hannover",
      content: "Im Werkhof, Schaufelder Straße 11, 30167 Hannover",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Berlin",
      content: "Friedrichstraße 123, 10117 Berlin",
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone",
      content: "+49 511 47 39 339",
      href: "tel:+495114739339",
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      content: "james@englisch-lehrer.com",
      href: "mailto:james@englisch-lehrer.com",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Hours",
      content: t("hours"),
    },
  ];

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: t("headline") }]} />
      </div>

      {/* Header */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
            {t("badge")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-sls-teal mb-4">
            {t("headline")}
          </h1>
          <p className="text-xl text-sls-olive/70 max-w-2xl mx-auto">
            {t("subheadline")}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-sls-cream rounded-3xl p-8 sm:p-10">
              <ContactForm />
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-sls-teal mb-6">
                {t("infoTitle")}
              </h2>
              {contactInfo.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-sls-cream hover:bg-sls-beige/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sls-teal mb-1">
                      {item.title}
                    </h3>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sls-olive hover:text-sls-orange transition-colors"
                      >
                        {item.content}
                      </a>
                    ) : (
                      <p className="text-sls-olive">{item.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Map Placeholder */}
              <div className="mt-8 aspect-[4/3] rounded-2xl bg-sls-beige/50 flex items-center justify-center">
                <div className="text-center text-sls-olive/60">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Map integration coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion maxItems={3} showViewAll={true} />
    </div>
  );
}
