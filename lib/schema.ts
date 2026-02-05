// Reusable JSON-LD schema components for SEO

const BASE_URL = "https://simmonds.online";

export function getLocalBusinessSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/#organization`,
    name: "Simmonds Language Services",
    description:
      locale === "de"
        ? "Online Business English Training mit erfahrenen Trainern und KI-Konversationspartner. Maßgeschneidertes Training für Ihren Berufsalltag."
        : "Online Business English training with experienced trainers and AI conversation partner. Tailored training for your real work.",
    url: BASE_URL,
    telephone: "+49 511 47 39 339",
    email: "james@englisch-lehrer.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Im Werkhof, Schaufelder Straße 11",
      addressLocality: "Hannover",
      postalCode: "30167",
      addressCountry: "DE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 52.3876,
      longitude: 9.7317,
    },
    areaServed: [
      { "@type": "City", name: "Hannover" },
      { "@type": "City", name: "Berlin" },
      { "@type": "Country", name: "Germany" },
    ],
    founder: {
      "@type": "Person",
      name: "James Simmonds",
    },
    foundingDate: "2004",
    priceRange: "€€",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    sameAs: [],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name:
        locale === "de"
          ? "Business English Training"
          : "Business English Training",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name:
              locale === "de"
                ? "Online Business English"
                : "Online Business English",
            description:
              locale === "de"
                ? "1:1 Video-Sitzungen mit persönlichem Trainer"
                : "1:1 video sessions with personal trainer",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name:
              locale === "de"
                ? "KI-Konversationstraining"
                : "AI Conversation Practice",
            description:
              locale === "de"
                ? "24/7 Konversationstraining mit George Patterson"
                : "24/7 conversation practice with George Patterson",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name:
              locale === "de" ? "Firmen-Teamtraining" : "Corporate Team Training",
            description:
              locale === "de"
                ? "Online-Gruppentraining für Ihr Team"
                : "Online group training for your team",
          },
        },
      ],
    },
  };
}

export function getOrganizationSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Simmonds Language Services",
    url: BASE_URL,
    logo: `${BASE_URL}/images/sls-logo.png`,
    founder: {
      "@type": "Person",
      name: "James Simmonds",
    },
    foundingDate: "2004",
    description:
      locale === "de"
        ? "Über 20 Jahre Erfahrung im Business English Training für deutsche Fach- und Führungskräfte."
        : "Over 20 years of Business English training for German professionals and executives.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Im Werkhof, Schaufelder Straße 11",
      addressLocality: "Hannover",
      postalCode: "30167",
      addressCountry: "DE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+49 511 47 39 339",
      contactType: "customer service",
      email: "james@englisch-lehrer.com",
      availableLanguage: ["English", "German"],
    },
  };
}

export function getFAQPageSchema(
  items: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function getServiceSchema(
  locale: string,
  service: {
    name: string;
    description: string;
    url: string;
  }
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: service.url,
    provider: {
      "@type": "Organization",
      name: "Simmonds Language Services",
      url: BASE_URL,
    },
    areaServed: {
      "@type": "Country",
      name: "Germany",
    },
    serviceType:
      locale === "de" ? "Sprachtraining" : "Language Training",
  };
}
