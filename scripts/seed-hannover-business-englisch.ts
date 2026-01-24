/**
 * Seed script for /hannover/business-englisch page
 * Run with: npx convex run scripts/seed-hannover-business-englisch
 * Or: npx ts-node scripts/seed-hannover-business-englisch.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Initialize Convex client
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Content scraped from https://englisch-lehrer.com/hannover/business-englisch
const pageContent = {
  city: "hannover",
  service: "business-englisch",
  title: "Business Englischkurse in Hannover",
  metaTitle: "Business Englischkurse in Hannover | Simmonds Language Services",
  metaDescription: "Professionelle Business Englischkurse in Hannover. Muttersprachliche Englischlehrer, Firmenunterricht vor Ort oder online, Blended Learning. Seit über 20 Jahren.",

  sections: [
    {
      id: "hero",
      type: "hero" as const,
      order: 0,
      isPublished: true,
      content: {
        badge: "Business Englisch",
        title: "Business Englischkurse in Hannover",
        subtitle: "Professionelle Business Englischkurse für Ihre Mitarbeiter:innen und eine positive Zukunft: Wenn Sie Englisch für Ihr Berufsleben oder Ihre Karriere benötigen und bei hoch motivierten und muttersprachlichen Englischlehrer:innen trainieren möchten, sind Sie bei uns genau richtig. Lernen Sie vor Ort in Hannover, online oder kombiniert als Blended Learning-Modell.",
        features: [
          "Lernen Sie vor Ort in Hannover oder online",
          "Muttersprachliche Englischlehrer:innen",
          "Blended Learning-Modell verfügbar",
        ],
      },
    },
    {
      id: "content-main",
      type: "content" as const,
      order: 1,
      isPublished: true,
      content: {
        title: "Unsere Leistungen im Überblick",
        paragraphs: [
          "Sind Sie auf der Suche nach einem Englischkurs für Ihre Mitarbeiter? Um Ihren Mitarbeiter den bestmöglichen Lernerfolg in Business Englisch zu garantieren, konzipieren wir unseren Englischunterricht stets entsprechend des spezifischen Sprachbedarfs Ihrer Firma. Alle von uns verwendeten Lehrmaterialien sind aktuell, didaktisch aufbereitet und multimedial.",
          "Firmenunterricht in Hannover und Online: Flexibles Training über Teams oder Zoom mit muttersprachlichen Englischlehrer:innen, die Ihre professionellen Kommunikationsbedürfnisse unterstützen. Sowohl für regelmäßige Verpflichtungen als auch für flexible projektbasierte Vorbereitung.",
          "Firmenspezifischer Englisch Einzelunterricht: Wir bieten Gruppen- und Einzelunterricht vor Ort oder bei Ihnen. Alle unsere Lehrkräfte sind qualifizierte Muttersprachler, die persönlich von James Simmonds betreut werden. Die Dienstleistungen sind über persönliche Treffen, Telefon oder datenschutz gesicherte Online-Meeting-Varianten verfügbar.",
          "Unterrichts Konzepte - Fachspezifisch: Natürlicher und situationsbezogener Sprachgebrauch kombiniert mit Grammatik bildet die Grundlage. Der Unterricht umfasst Redewendungen und Grammatik neben dem natürlichen Sprachgebrauch.",
        ],
      },
    },
    {
      id: "content-business-english",
      type: "content" as const,
      order: 2,
      isPublished: true,
      content: {
        title: "Was ist Business Englisch?",
        paragraphs: [
          "Business Englisch beschreibt die Anwendung der englischen Sprache im Beruf oder im Geschäftsleben. Es ist unverzichtbar für internationale Geschäftstätigkeit und Karriereentwicklung.",
        ],
      },
    },
    {
      id: "services",
      type: "services" as const,
      order: 3,
      isPublished: true,
      content: {
        badge: "Welche Themen behandeln wir",
        title: "Business Englisch Themen",
        subtitle: "Natürlicher und situationsbezogener Sprachgebrauch kombiniert mit Grammatik",
        items: [
          {
            icon: "presentation",
            title: "Präsentationen",
            description: "Souveräne Präsentationen auf Englisch halten",
          },
          {
            icon: "mail",
            title: "E-Mails & Korrespondenz",
            description: "Schriftliche Korrespondenz: E-Mails, Briefe, Newsletter",
          },
          {
            icon: "messageSquare",
            title: "Meetings & Verhandlungen",
            description: "Mündliche Kommunikation in Meetings und Verhandlungen",
          },
          {
            icon: "phone",
            title: "Telefongespräche",
            description: "Selbstsicher am Telefon kommunizieren",
          },
          {
            icon: "users",
            title: "Small Talk & Networking",
            description: "Beziehungen aufbauen und pflegen",
          },
          {
            icon: "book",
            title: "Fachspezifisches Vokabular",
            description: "Branchenspezifische Terminologie für Ihren Geschäftsbereich",
          },
        ],
      },
    },
    {
      id: "features",
      type: "features" as const,
      order: 4,
      isPublished: true,
      content: {
        title: "Warum Simmonds Language Services?",
        items: [
          {
            title: "Firmenunterricht vor Ort & Online",
            description: "Flexibles Training über Teams oder Zoom mit muttersprachlichen Englischlehrer:innen, die Ihre professionellen Kommunikationsbedürfnisse unterstützen.",
          },
          {
            title: "Individuelles Konzept",
            description: "Wir konzipieren unseren Englischunterricht entsprechend des spezifischen Sprachbedarfs Ihrer Firma.",
          },
          {
            title: "Aktuelle Lehrmaterialien",
            description: "Alle verwendeten Lehrmaterialien sind aktuell, didaktisch aufbereitet und multimedial.",
          },
          {
            title: "Qualifizierte Muttersprachler",
            description: "Alle Trainer sind qualifizierte Muttersprachler, persönlich betreut von James Simmonds.",
          },
          {
            title: "Maßgeschneiderte Materialien",
            description: "Wir recherchieren einschlägige Unterrichtsmaterialien oder entwickeln auch Unterrichtsmaterialien spezifisch für den Bedarf des Kunden.",
          },
          {
            title: "Flexible Optionen",
            description: "Gruppenunterricht, Einzelunterricht, Online-Kurse und Vor-Ort-Training. Alle Kurse werden individuell angepasst.",
          },
        ],
      },
    },
    {
      id: "faq",
      type: "faq" as const,
      order: 5,
      isPublished: true,
      content: {
        title: "Fragen & Antworten",
        items: [
          {
            question: "Wo finde ich einen Business Englisch Kurs in Hannover?",
            answer: "Sprachdienste Simmonds ist ein renommierter Anbieter von Business Englisch Kursen in Hannover. Wir bieten Kurse für alle Niveaus an, von Anfänger bis Fortgeschrittene. Unsere erfahrenen Lehrkräfte nutzen vielfältige Methoden. Kostenlose Beratung verfügbar.",
          },
          {
            question: "Welche Themen behandeln Sie in den Business Englisch Kursen?",
            answer: "Wir behandeln schriftliche Korrespondenz (E-Mails, Briefe, Newsletter), mündliche Kommunikation (Meetings, Verhandlungen), Telefonkommunikation, Small Talk und branchenspezifisches Vokabular.",
          },
          {
            question: "Wie kann ich Englisch für meine spezifischen Bedürfnisse lernen?",
            answer: "Wir recherchieren einschlägige Unterrichtsmaterialien oder entwickeln auch Unterrichtsmaterialien spezifisch für den Bedarf des Kunden.",
          },
          {
            question: "Wie kann ich die Englischkenntnisse meiner Mitarbeiter verbessern?",
            answer: "Wir bieten verschiedene Optionen: Gruppenunterricht, Einzelunterricht, Online-Kurse und Vor-Ort-Training. Alle Kurse werden individuell angepasst und von Muttersprachlern unterrichtet.",
          },
          {
            question: "Wie kann ich Kontakt zur Sprachschule Simmonds aufnehmen?",
            answer: "Sie erreichen uns telefonisch unter +49 511 473 9339, per E-Mail an james@englisch-lehrer.com, oder über das Kontaktformular auf unserer Website.",
          },
        ],
      },
    },
    {
      id: "contact",
      type: "contact" as const,
      order: 6,
      isPublished: true,
      content: {
        title: "Kontakt aufnehmen",
        description: "Kontaktieren Sie uns für eine kostenlose Beratung zu Ihren Business Englisch Anforderungen.",
        address: "Schaufelder Straße 11, 30167 Hannover",
        phone: "0511-473-9339",
        email: "james@englisch-lehrer.com",
        hours: "Montag - Freitag: 09:00 - 18:00",
        priceRange: "€60 - €120",
        rating: 5,
        reviewCount: 6,
      },
    },
    {
      id: "cta",
      type: "cta" as const,
      order: 7,
      isPublished: true,
      content: {
        title: "Bereit für besseres Business Englisch?",
        subtitle: "Kontaktieren Sie uns noch heute für eine kostenlose Beratung und erfahren Sie, wie wir Ihrem Team helfen können.",
        trustBadge: "Über 20 Jahre Erfahrung in der Unternehmensfortbildung",
      },
    },
  ],
};

async function seedHannoverBusinessEnglisch() {
  console.log("Seeding /hannover/business-englisch page...");

  try {
    // Check if page already exists
    const existingPage = await client.query(api.cityPages.getBySlug, {
      slug: "hannover/business-englisch",
    });

    if (existingPage) {
      console.log("Page already exists. Skipping creation.");
      console.log("To update content, use the admin interface at /admin/pages");
      return;
    }

    // Create the page
    const result = await client.mutation(api.cityPages.create, {
      city: pageContent.city,
      service: pageContent.service,
      title: pageContent.title,
      metaTitle: pageContent.metaTitle,
      metaDescription: pageContent.metaDescription,
      sections: pageContent.sections,
      status: "published",
    });

    console.log("Page created successfully!");
    console.log("Page ID:", result.id);
    console.log("Page URL:", `/${result.slug}`);
    console.log("\nYou can now view the page at: http://localhost:3000/hannover/business-englisch");
    console.log("Edit sections at: http://localhost:3000/admin/pages");
  } catch (error: any) {
    console.error("Error seeding page:", error.message);
    throw error;
  }
}

// Run the seed function
seedHannoverBusinessEnglisch()
  .then(() => {
    console.log("\nSeeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
