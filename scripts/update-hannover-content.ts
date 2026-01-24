/**
 * Update script for /hannover/business-englisch page content
 * Run with: source .env.local && npx tsx scripts/update-hannover-content.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Updated content with proper structure for each section
const updatedSections = [
  {
    id: "hero",
    type: "hero" as const,
    order: 0,
    isPublished: true,
    content: {
      badge: "Seit über 20 Jahren",
      title: "Business Englischkurse in Hannover",
      subtitle: "Professionelle Business Englischkurse für Ihre Mitarbeiter:innen und eine positive Zukunft: Wenn Sie Englisch für Ihr Berufsleben oder Ihre Karriere benötigen und bei hoch motivierten und muttersprachlichen Englischlehrer:innen trainieren möchten, sind Sie bei uns genau richtig.",
      features: [
        "Vor Ort in Hannover oder Online",
        "Muttersprachliche Trainer",
        "Blended Learning",
      ],
    },
  },
  {
    id: "services",
    type: "services" as const,
    order: 1,
    isPublished: true,
    content: {
      badge: "Welche Themen behandeln wir",
      title: "Business Englisch Themen",
      subtitle: "Natürlicher und situationsbezogener Sprachgebrauch kombiniert mit Grammatik",
      items: [
        { icon: "presentation", title: "Präsentationen", description: "Souveräne Präsentationen auf Englisch halten und visuelle Hilfsmittel effektiv einsetzen" },
        { icon: "mail", title: "E-Mails & Korrespondenz", description: "Professionelle schriftliche Kommunikation: E-Mails, Briefe, Newsletter" },
        { icon: "messageSquare", title: "Meetings & Verhandlungen", description: "Aktive Teilnahme, Führung von Gesprächen und überzeugende Verhandlungsführung" },
        { icon: "phone", title: "Telefongespräche", description: "Selbstsicher am Telefon kommunizieren und aktiv zuhören" },
        { icon: "users", title: "Small Talk & Networking", description: "Beziehungen aufbauen und pflegen im beruflichen Umfeld" },
        { icon: "book", title: "Fachspezifisches Vokabular", description: "Branchenspezifische Terminologie für Ihren Geschäftsbereich" },
      ],
    },
  },
  {
    id: "features",
    type: "features" as const,
    order: 2,
    isPublished: true,
    content: {
      badge: "Warum wir",
      title: "Unsere Leistungen im Überblick",
      subtitle: "Business Englischunterricht für Ihre Mitarbeiter",
      items: [
        { icon: "clock", title: "Firmenunterricht vor Ort & Online", description: "Flexibles Training über Teams oder Zoom mit muttersprachlichen Englischlehrer:innen. Sowohl für regelmäßige Verpflichtungen als auch für flexible projektbasierte Vorbereitung." },
        { icon: "users", title: "Maßgeschneiderter Unterricht", description: "Wir konzipieren unseren Englischunterricht stets entsprechend des spezifischen Sprachbedarfs Ihrer Firma. Alle Lehrmaterialien sind aktuell und didaktisch aufbereitet." },
        { icon: "award", title: "Über 20 Jahre Erfahrung", description: "Renommierter Anbieter seit 1999 in Hannover. Alle Trainer sind qualifizierte Muttersprachler, persönlich betreut von James Simmonds." },
        { icon: "target", title: "Firmenspezifischer Einzelunterricht", description: "Gruppen- und Einzelunterricht vor Ort oder bei Ihnen. Verfügbar über persönliche Treffen, Telefon oder datenschutz-gesicherte Online-Meetings." },
        { icon: "languages", title: "Fachspezifische Konzepte", description: "Natürlicher und situationsbezogener Sprachgebrauch kombiniert mit Grammatik. Redewendungen und Idiome für echte Arbeitssituationen." },
        { icon: "heartHandshake", title: "Individuelle Materialien", description: "Wir recherchieren einschlägige Unterrichtsmaterialien oder entwickeln auch Materialien spezifisch für den Bedarf des Kunden." },
      ],
    },
  },
  {
    id: "testimonials",
    type: "content" as const,
    order: 3,
    isPublished: true,
    content: {
      items: [
        { name: "Thomas M.", company: "Continental", role: "Project Manager", quote: "Das Training ist genau auf meine Bedürfnisse im Job zugeschnitten. Endlich echte Fortschritte!", rating: 5 },
        { name: "Dr. Sarah Mueller", company: "Volkswagen AG", role: "International Relations", quote: "Professionell, flexibel und effektiv. Die beste Investition in meine Karriere.", rating: 5 },
        { name: "Michael Schmidt", company: "TUI", role: "Senior Manager", quote: "Muttersprachler machen den Unterschied. Ich fühle mich jetzt sicher in internationalen Meetings.", rating: 5 },
      ],
    },
  },
  {
    id: "faq",
    type: "faq" as const,
    order: 4,
    isPublished: true,
    content: {
      title: "Fragen & Antworten",
      items: [
        {
          question: "Wo finde ich einen Business Englisch Kurs in Hannover?",
          answer: "Sprachdienste Simmonds ist ein renommierter Anbieter von Business Englisch Kursen in Hannover. Wir bieten Kurse für alle Niveaus an, von Anfänger bis Fortgeschrittene. Unsere erfahrenen Lehrkräfte nutzen vielfältige Methoden. Kostenlose Beratung verfügbar."
        },
        {
          question: "Welche Themen behandeln Sie in den Business Englisch Kursen?",
          answer: "Wir behandeln schriftliche Korrespondenz (E-Mails, Briefe, Newsletter), mündliche Kommunikation (Meetings, Verhandlungen), Telefonkommunikation, Small Talk und branchenspezifisches Vokabular für Ihren Geschäftsbereich."
        },
        {
          question: "Wie kann ich Englisch für meine spezifischen Bedürfnisse lernen?",
          answer: "Wir recherchieren einschlägige Unterrichtsmaterialien oder entwickeln auch Unterrichtsmaterialien spezifisch für den Bedarf des Kunden. Jedes Training wird individuell auf Ihre Anforderungen zugeschnitten."
        },
        {
          question: "Wie kann ich die Englischkenntnisse meiner Mitarbeiter verbessern?",
          answer: "Wir bieten verschiedene Optionen: Gruppenunterricht, Einzelunterricht, Online-Kurse und Vor-Ort-Training. Alle Kurse werden individuell angepasst und von Muttersprachlern unterrichtet."
        },
        {
          question: "Wie kann ich Kontakt zur Sprachschule Simmonds aufnehmen?",
          answer: "Sie erreichen uns telefonisch unter +49 511 473 9339, per E-Mail an james@englisch-lehrer.com, oder über das Kontaktformular auf unserer Website. Wir bieten kostenlose Erstberatungen an."
        },
      ],
    },
  },
  {
    id: "cta",
    type: "cta" as const,
    order: 5,
    isPublished: true,
    content: {
      title: "Bereit für besseres Business Englisch?",
      subtitle: "Kontaktieren Sie uns noch heute für eine kostenlose Beratung und erfahren Sie, wie wir Ihrem Team helfen können.",
      trustBadge: "Über 20 Jahre Erfahrung • Muttersprachliche Trainer • Flexible Termine",
    },
  },
];

async function updateContent() {
  console.log("Updating /hannover/business-englisch content...");

  try {
    // Get existing page
    const existingPage = await client.query(api.cityPages.getBySlug, {
      slug: "hannover/business-englisch",
    });

    if (!existingPage) {
      console.log("Page not found. Creating new page...");
      await client.mutation(api.cityPages.create, {
        city: "hannover",
        service: "business-englisch",
        title: "Business Englischkurse in Hannover",
        metaTitle: "Business Englischkurse in Hannover | Simmonds Language Services",
        metaDescription: "Professionelle Business Englischkurse in Hannover. Muttersprachliche Trainer, Firmenunterricht vor Ort oder online. Seit über 20 Jahren.",
        sections: updatedSections,
        status: "published",
      });
      console.log("Page created!");
      return;
    }

    console.log("Page found. Updating sections...");

    // Update each section
    for (const section of updatedSections) {
      try {
        await client.mutation(api.cityPages.updateSection, {
          pageId: existingPage._id,
          sectionId: section.id,
          content: section.content,
          isPublished: section.isPublished,
          order: section.order,
        });
        console.log(`  Updated section: ${section.id}`);
      } catch (error: any) {
        // Section doesn't exist, add it
        await client.mutation(api.cityPages.addSection, {
          pageId: existingPage._id,
          section: section,
        });
        console.log(`  Added section: ${section.id}`);
      }
    }

    console.log("\nContent updated successfully!");
    console.log("View the page at: http://localhost:3000/hannover/business-englisch");
    console.log("Edit sections at: http://localhost:3000/admin/pages");
  } catch (error: any) {
    console.error("Error updating content:", error.message);
    throw error;
  }
}

updateContent()
  .then(() => {
    console.log("\nUpdate complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Update failed:", error);
    process.exit(1);
  });
