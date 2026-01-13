"use client";

import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { api } from "@/convex/_generated/api";

interface ContactInfoItem {
  icon: React.ReactNode;
  title: string;
  content: string;
  href?: string;
}

export function ContactInfo() {
  const locale = useLocale();
  const t = useTranslations("contact");
  const contactConfig = useQuery(api.landing.getContactInfo);

  // Build contact info items from config or defaults
  const contactItems: ContactInfoItem[] = [];

  if (contactConfig) {
    // Add locations
    contactConfig.locations?.forEach((loc: { name: { en: string; de: string }; address: string }) => {
      contactItems.push({
        icon: <MapPin className="w-6 h-6" />,
        title: loc.name[locale as "en" | "de"] || loc.name.en,
        content: loc.address,
      });
    });

    // Add phone
    if (contactConfig.phone) {
      contactItems.push({
        icon: <Phone className="w-6 h-6" />,
        title: locale === "de" ? "Telefon" : "Phone",
        content: contactConfig.phone,
        href: `tel:${contactConfig.phone.replace(/\s/g, "")}`,
      });
    }

    // Add email
    if (contactConfig.email) {
      contactItems.push({
        icon: <Mail className="w-6 h-6" />,
        title: "Email",
        content: contactConfig.email,
        href: `mailto:${contactConfig.email}`,
      });
    }

    // Add hours
    if (contactConfig.hours) {
      contactItems.push({
        icon: <Clock className="w-6 h-6" />,
        title: locale === "de" ? "Öffnungszeiten" : "Hours",
        content: contactConfig.hours[locale as "en" | "de"] || contactConfig.hours.en,
      });
    }
  } else {
    // Loading state - show default items
    contactItems.push(
      {
        icon: <MapPin className="w-6 h-6" />,
        title: locale === "de" ? "Büro Hannover" : "Hannover Office",
        content: "Im Werkhof, Schaufelder Straße 11, 30167 Hannover",
      },
      {
        icon: <MapPin className="w-6 h-6" />,
        title: locale === "de" ? "Büro Berlin" : "Berlin Office",
        content: "Friedrichstraße 123, 10117 Berlin",
      },
      {
        icon: <Phone className="w-6 h-6" />,
        title: locale === "de" ? "Telefon" : "Phone",
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
        title: locale === "de" ? "Öffnungszeiten" : "Hours",
        content: locale === "de" ? "Montag – Freitag: 9:00 – 18:00" : "Monday – Friday: 9:00 – 18:00",
      }
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-sls-teal mb-6">
        {t("infoTitle")}
      </h2>
      {contactItems.map((item, index) => (
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
          <p>{locale === "de" ? "Kartenintegration kommt bald" : "Map integration coming soon"}</p>
        </div>
      </div>
    </div>
  );
}
