import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function addContentSection() {
  console.log("Adding content section...");

  const page = await client.query(api.cityPages.getBySlug, {
    slug: "hannover/business-englisch"
  });

  if (!page) {
    console.error("Page not found!");
    return;
  }

  // Check if content-main already exists
  const hasContent = page.sections?.some((s: any) => s.id === "content-main");
  if (hasContent) {
    console.log("Content section already exists, updating...");
    await client.mutation(api.cityPages.updateSection, {
      pageId: page._id,
      sectionId: "content-main",
      content: {
        title: "Business Englischunterricht für Ihre Mitarbeiter",
        paragraphs: [
          "Sind Sie auf der Suche nach einem Englischkurs für Ihre Mitarbeiter? Um Ihren Mitarbeiter den bestmöglichen Lernerfolg in Business Englisch zu garantieren, konzipieren wir unseren Englischunterricht stets entsprechend des spezifischen Sprachbedarfs Ihrer Firma. Alle von uns verwendeten Lehrmaterialien sind aktuell, didaktisch aufbereitet und multimedial.",
          "Business Englisch beschreibt die Anwendung der englischen Sprache im Beruf oder im Geschäftsleben. Es ist unverzichtbar für internationale Geschäftstätigkeit und Karriereentwicklung in global agierenden Unternehmen.",
          "Firmenunterricht in Hannover und Online: Flexibles Training über Teams oder Zoom mit muttersprachlichen Englischlehrer:innen, die Ihre professionellen Kommunikationsbedürfnisse unterstützen. Sowohl für regelmäßige Verpflichtungen als auch für flexible projektbasierte Vorbereitung.",
        ],
      },
      order: 0.5,
    });
  } else {
    console.log("Adding new content section...");
    await client.mutation(api.cityPages.addSection, {
      pageId: page._id,
      section: {
        id: "content-main",
        type: "content" as const,
        order: 0.5,
        isPublished: true,
        content: {
          title: "Business Englischunterricht für Ihre Mitarbeiter",
          paragraphs: [
            "Sind Sie auf der Suche nach einem Englischkurs für Ihre Mitarbeiter? Um Ihren Mitarbeiter den bestmöglichen Lernerfolg in Business Englisch zu garantieren, konzipieren wir unseren Englischunterricht stets entsprechend des spezifischen Sprachbedarfs Ihrer Firma. Alle von uns verwendeten Lehrmaterialien sind aktuell, didaktisch aufbereitet und multimedial.",
            "Business Englisch beschreibt die Anwendung der englischen Sprache im Beruf oder im Geschäftsleben. Es ist unverzichtbar für internationale Geschäftstätigkeit und Karriereentwicklung in global agierenden Unternehmen.",
            "Firmenunterricht in Hannover und Online: Flexibles Training über Teams oder Zoom mit muttersprachlichen Englischlehrer:innen, die Ihre professionellen Kommunikationsbedürfnisse unterstützen. Sowohl für regelmäßige Verpflichtungen als auch für flexible projektbasierte Vorbereitung.",
          ],
        },
      },
    });
  }

  console.log("Content section added/updated!");
}

addContentSection()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
