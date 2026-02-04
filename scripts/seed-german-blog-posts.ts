/**
 * Seed German Blog Posts - Professional Journalistic Content
 *
 * This script creates German translations for all English blog posts
 * with professional, essay-style content following journalistic standards.
 *
 * Run with: npx tsx scripts/seed-german-blog-posts.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface BlogPostData {
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  contentBlocks?: Array<{
    id: string;
    type: string;
    order: number;
    config: Record<string, unknown>;
  }>;
  contentVersion?: number;
  author: string;
  category: string;
  tags: string[];
  featuredImageUrl?: string;
  readTimeMinutes?: number;
  status: string;
}

// German translations with professional journalistic content
const germanPosts: BlogPostData[] = [
  // 1. Interactive Games - Professional version
  // NOTE: Slug must match English version for language switching to work
  {
    locale: "de",
    slug: "interactive-games-learn-english",
    title: "Spielbasierter Spracherwerb: Die Wissenschaft hinter interaktivem Lernen",
    excerpt: "Aktuelle Forschung zur Zweitsprachenerwerbung bestätigt, was Lernende intuitiv erfahren: Engagement beschleunigt den Lernerfolg. Interaktive Spiele nutzen dieses Prinzip durch unmittelbares Feedback und reduzierte Lernangst.",
    author: "Emma AI",
    category: "Interaktives Lernen",
    tags: ["spiele", "interaktiv", "vokabeln", "lerntipps", "motivation"],
    readTimeMinutes: 6,
    status: "published",
    contentVersion: 2,
    contentBlocks: [
      {
        id: `block_de_games_${Date.now()}_hero`,
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          variant: "default",
          title: "Spielbasierter Spracherwerb: Die Wissenschaft hinter interaktivem Lernen",
          subtitle: "Aktuelle Forschung zur Zweitsprachenerwerbung bestätigt, was Lernende intuitiv erfahren: Engagement beschleunigt den Lernerfolg. Interaktive Spiele nutzen dieses Prinzip durch unmittelbares Feedback und reduzierte Lernangst.",
          badge: "Interaktives Lernen",
          author: "Emma AI",
          readTimeMinutes: 6,
          showAuthor: true,
          showDate: true,
          showReadTime: true
        }
      },
      {
        id: `block_de_games_${Date.now()}_content1`,
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Die kognitive Basis interaktiven Lernens

Die Wirksamkeit spielbasierten Lernens gründet auf etablierten Erkenntnissen der Kognitionswissenschaft und Lernpsychologie. Die Forschung belegt konsistent mehrere Vorteile interaktiver Ansätze gegenüber passiven Lernmethoden.

Studien zeigen Verbesserungen der Behaltensleistung von etwa vierzig Prozent im Vergleich zu passivem Lernen, wenn Informationen durch aktives Engagement verarbeitet werden. Spiele reduzieren den affektiven Filter, jene psychologische Barriere, die Ängstlichkeit gegen den Spracherwerb aufbaut. Durch wiederholte aktive Anwendung entwickeln Lernende Automatisierung, also die Fähigkeit, Sprache ohne bewusste Regelanwendung zu produzieren. Unmittelbares Feedback ermöglicht schnelle Fehlerkorrektur und verhindert, dass inkorrekte Muster sich verfestigen.

Bei der Simmonds Language School sind interaktive Spiele direkt in den Konversationsunterricht integriert, wodurch eine nahtlose Verbindung zwischen strukturierter Übung und authentischer Kommunikation entsteht.

---

## Kategorien interaktiver Übungsformen

Vokabel-Zuordnungsübungen erfordern von Lernenden, englische Wörter mit ihren deutschen Übersetzungen, visuellen Darstellungen oder definitorischen Beschreibungen zu verbinden. Dieses Format nutzt Prinzipien des verteilten Wiederholens und bietet unmittelbares Feedback. Korrekte Zuordnungen stärken neuronale Verbindungen, während Fehler sofortige Korrektur auslösen. Dieser Ansatz erweist sich als besonders effektiv für den Wortschatzaufbau, die Prüfungsvorbereitung und die Entwicklung von Wortassoziationen.

Satzbau-Aktivitäten präsentieren Lernenden Wortkacheln, die zu grammatisch korrekten Sequenzen angeordnet werden müssen. Anders als bei erkennungsbasierten Übungen erfordert die Konstruktion produktiven Sprachgebrauch, eine entscheidende Unterscheidung für die Entwicklung von Sprechflüssigkeit. Diese Aktivitäten behandeln Grammatikübung, Wortstellungsherausforderungen und das Verständnis syntaktischer Strukturen.`
        }
      },
      {
        id: `block_de_games_${Date.now()}_quote`,
        type: "quote",
        order: 2,
        config: {
          type: "quote",
          variant: "highlighted",
          text: "Früher bin ich mit Widerstreben an Grammatikübungen herangegangen. Die spielerischen Komponenten meiner Unterrichtsstunden haben das grundlegend verändert. Lernen fühlt sich nicht mehr wie Studieren an.",
          attribution: "Maria K.",
          role: "Studentin",
          company: "B2-Niveau"
        }
      },
      {
        id: `block_de_games_${Date.now()}_content2`,
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          variant: "default",
          content: `Lückentextübungen erfordern das Vervollständigen von Sätzen mit passenden Wörtern, Präpositionen oder Verbformen. Dieses Format spiegelt die Anforderungen realer Kommunikation wider, bei der Sprache im Kontext produziert werden muss, statt sie nur zu erkennen. Besonders wertvoll für Präpositionsübung, Zeitengebrauch und die Beherrschung von Phrasal Verbs.

Buchstabenrätsel erfordern die Rekonstruktion korrekter Schreibweisen aus ungeordneten Buchstaben. Dieses Format entwickelt die Aufmerksamkeit für orthographische Muster und verbessert neben der Erkennung auch die Schreibgenauigkeit. Nützlich für Rechtschreibübung, Vokabelkonsolidierung und visuelles Mustergedächtnis.

---

## Integration im Konversationsunterricht

Beim Lernen mit Emma sind Spiele keine isolierten Aktivitäten, sondern Bestandteile eines Gesprächsflusses. Ein typischer Ablauf beginnt mit der Diskussion eines Themas, geht über zu Emmas Einführung relevanter Vokabeln mit kontextueller Erklärung, präsentiert ein passendes Spiel im Materialien-Panel, ermöglicht das Spielen mit unterstützendem Feedback und schließt mit einer Überprüfung des Gelernten und der Identifikation von Bereichen für weitere Übung.

---

## Forschungsevidenz

Die Kognitionswissenschaft liefert klare Belege für die Wirksamkeit verschiedener Lernansätze. Passive Exposition durch reines Hören oder Lesen erzielt Behaltensraten von etwa zehn bis zwanzig Prozent nach einer Woche. Interaktive Übung verbessert dies auf fünfzig bis siebzig Prozent. Spielbasiertes Lernen mit unmittelbarem Feedback erreicht Behaltensraten von fünfundsiebzig bis neunzig Prozent.

Die Schlüsselfaktoren sind Herausforderung auf angemessenem Niveau, unmittelbares korrigierendes Feedback und Engagement, das Aufmerksamkeit und Motivation aufrechterhält. Spiele bieten alle drei Elemente in Kombination.`
        }
      },
      {
        id: `block_de_games_${Date.now()}_callout`,
        type: "callout",
        order: 4,
        config: {
          type: "callout",
          variant: "success",
          icon: "Gamepad2",
          title: "Erste Schritte",
          content: "Fordern Sie während jeder Unterrichtsstunde mit Emma spielbasierte Übungen an, indem Sie Ihr Interesse bekunden. Das Materialien-Panel zeigt passende Aktivitäten basierend auf Ihrem aktuellen Thema und Niveau."
        }
      },
      {
        id: `block_de_games_${Date.now()}_content3`,
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Maximierung der Lernergebnisse

Mehrere Prinzipien erhöhen die Wirksamkeit spielbasierten Übens. Vermeiden Sie Hast; das Ziel ist Lernen, nicht Geschwindigkeit. Nehmen Sie sich Zeit zu überlegen, warum Antworten richtig oder falsch sind, und bauen Sie so Verständnis auf, statt nur Muster auswendig zu lernen.

Überprüfen Sie Fehler nach jeder Sitzung. Die falsch beantworteten Elemente stellen die wertvollsten Lernmöglichkeiten dar und zeigen Wissenslücken auf, die bereit sind, gefüllt zu werden. Kehren Sie nach Intervallen zu Spielen zurück; verteiltes Wiederholen verbessert das Langzeitbehalten dramatisch.

Sprechen Sie laut während des Spielens. Wörter laut auszusprechen während des Lesens und Reagierens aktiviert mehrere kognitive Kanäle und verbessert das Enkodieren und Abrufen.`
        }
      },
      {
        id: `block_de_games_${Date.now()}_faq`,
        type: "faq",
        order: 6,
        config: {
          type: "faq",
          showHeader: true,
          headerTitle: "Häufige Fragen",
          variant: "default",
          items: [
            {
              id: `faq_de_games_1_${Date.now()}`,
              question: "Sind Spiele auch außerhalb der Unterrichtsstunden zugänglich?",
              answer: "Viele Spielaktivitäten sind über die Unterrichtsmaterialien verfügbar. Während der Stunden kann Emma Spiele direkt öffnen. Eigenständige Übungsmodi für unabhängiges Lernen befinden sich in Entwicklung."
            },
            {
              id: `faq_de_games_2_${Date.now()}`,
              question: "Was, wenn Spiele nicht mein bevorzugter Lernstil sind?",
              answer: "Spiele sind ein Werkzeug unter vielen verfügbaren Ansätzen. Emma passt sich den Präferenzen der Lernenden an. Wenn konversationsbasiertes Lernen ohne Spielelemente Ihnen besser liegt, teilen Sie diese Präferenz einfach mit. Die wichtige Überlegung ist, Ansätze zu finden, die Ihr Engagement und Ihren Fortschritt aufrechterhalten."
            },
            {
              id: `faq_de_games_3_${Date.now()}`,
              question: "Sind die Spiele speziell für deutschsprachige Lernende konzipiert?",
              answer: "Ja. Spiele enthalten wo angemessen deutsche Übersetzungen und sind um die spezifischen Herausforderungen herum gestaltet, denen deutschsprachige Lernende mit Englisch begegnen, einschließlich Präpositionsgebrauch, Artikelsysteme und Wortstellungsunterschiede."
            }
          ]
        }
      },
      {
        id: `block_de_games_${Date.now()}_cta`,
        type: "cta",
        order: 7,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Interaktives Lernen erleben",
          subheadline: "Ihre erste Sitzung mit Emma beinhaltet Zugang zu unserer vollständigen Bibliothek interaktiver Lernaktivitäten.",
          primaryButton: { text: "Erste Sitzung beginnen", href: "/contact" },
          secondaryButton: { text: "Alle Ressourcen ansehen", href: "/lessons" },
          trustBadge: "Über 100 interaktive Aktivitäten verfügbar"
        }
      }
    ]
  },

  // 2. Business English Phrases - Professional version
  // NOTE: Slug must match English version for language switching to work
  {
    locale: "de",
    slug: "business-english-phrases-professionals",
    title: "Die Sprache des internationalen Geschäfts: Wichtige Formulierungen für deutsche Fachkräfte",
    excerpt: "In der internationalen Geschäftskommunikation ist oft ebenso wichtig, wie etwas ausgedrückt wird, wie der Inhalt selbst. Das Verständnis der Konventionen englischer Geschäftssprache hilft deutschen Fachkräften, interkulturelle Erwartungen zu navigieren.",
    author: "Emma AI",
    category: "Business English",
    tags: ["business", "phrasen", "meetings", "kommunikation", "professionell"],
    readTimeMinutes: 8,
    status: "published",
    contentVersion: 2,
    contentBlocks: [
      {
        id: `block_de_phrases_${Date.now()}_hero`,
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          variant: "default",
          title: "Die Sprache des internationalen Geschäfts: Wichtige Formulierungen für deutsche Fachkräfte",
          subtitle: "In der internationalen Geschäftskommunikation ist oft ebenso wichtig, wie etwas ausgedrückt wird, wie der Inhalt selbst. Das Verständnis der Konventionen englischer Geschäftssprache hilft deutschen Fachkräften, interkulturelle Erwartungen zu navigieren.",
          badge: "Business English",
          author: "Emma AI",
          readTimeMinutes: 8,
          showAuthor: true,
          showDate: true,
          showReadTime: true
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_content1`,
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Die Kultur der Unternehmenskommunikation

Deutsche Geschäftskommunikation ist gekennzeichnet durch Direktheit und Effizienz, Qualitäten, die innerhalb der deutschen Berufskultur geschätzt werden. Englischsprachige Geschäftsumgebungen, insbesondere jene, die von anglo-amerikanischen Normen beeinflusst sind, erwarten oft diplomatischere Sprache, die Beziehungspflege neben der Aufgabenerfüllung aufrechterhält. Dieser Unterschied ist keine Frage der Überlegenheit eines Ansatzes, sondern des Verstehens und Anpassens an unterschiedliche kulturelle Erwartungen.

Die folgenden Formulierungen repräsentieren gängige Konventionen in der englischen Geschäftskommunikation. Angemessen eingesetzt, erleichtern sie reibungslosere Interaktionen über kulturelle Grenzen hinweg.

---

## Kontaktaufnahme und Nachfassen

Die Formulierung "I'd like to touch base with you" dient als informelle Art, ein kurzes Gespräch oder einen Check-in anzufragen. Ihr deutsches Äquivalent könnte als der Wunsch, sich kurz über eine Angelegenheit abzustimmen, wiedergegeben werden. Beispielsweise könnte man schreiben: "I'd like to touch base with you about the quarterly projections when you have a moment this week." Der Ausdruck vermittelt freundliche Professionalität ohne übermäßige Förmlichkeit.

Wenn ein Thema erneutes Aufgreifen erfordert, ermöglicht "Could we circle back to that?" eine elegante Navigation zwischen Diskussionspunkten. Dies erweist sich als nützlich in Meetings, wo mehrere Themen um Aufmerksamkeit konkurrieren. Es würdigt den Wert eines Punktes, während es dessen vollständige Diskussion aufschiebt.

Um gegenseitiges Verständnis zu bestätigen, fasst "I think we're on the same page" die erreichte Einigung zusammen. Es schafft einen Moment expliziten Konsenses, der spätere Missverständnisse darüber verhindert, was entschieden wurde.`
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_callout1`,
        type: "callout",
        order: 2,
        config: {
          type: "callout",
          variant: "tip",
          icon: "Lightbulb",
          title: "Zur Direktheit",
          content: "Deutsche Direktheit wird in Deutschland geschätzt, kann aber in anglo-amerikanischen Geschäftskontexten abrupt wirken. Formulierungen wie 'I think' oder 'Perhaps we could' mildern Kommunikation, ohne substanziellen Inhalt zu schwächen. Dies sind rhetorische Konventionen, keine Zeichen von Unsicherheit."
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_content2`,
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Professionell Widerspruch ausdrücken

Diplomatischer Widerspruch repräsentiert vielleicht den größten Unterschied zwischen deutscher und englischer Geschäftskommunikation. Die Formulierung "Let me push back on that a little" führt eine gegenteilige Ansicht ein, während sie einen kollegialen Ton beibehält. Sie signalisiert nachdenkliches Engagement statt Konflikt.

---

## Planung und Koordination

"Going forward, we should..." führt zukunftsorientierte Vorschläge ein. Es behandelt implizit vergangene Probleme als abgeschlossen, während es die Aufmerksamkeit auf Lösungen lenkt. Die Formulierung erweist sich als nützlich bei der Diskussion von Prozessverbesserungen oder Änderungen, die aus gelernten Lektionen entstehen.

Kommunikationsmanagement verwendet Formulierungen wie "I'll loop you in on the email," was anzeigt, dass relevante Parteien in laufende Korrespondenz einbezogen werden. "Let's take this offline" verlagert detaillierte technische Diskussionen elegant aus größeren Meetings, wo sie Zeit verbrauchen könnten, die besser für Angelegenheiten verwendet wird, die für alle Teilnehmer relevant sind.

---

## Verpflichtung und Kapazität

Bei der Übernahme von Verantwortung für eine Aufgabe kombiniert "I'll action that and get back to you" Verpflichtung mit einem Versprechen zur Nachverfolgung. Das Einschließen eines spezifischen Zeitrahmens stärkt die Verpflichtung und unterstützt die Rechenschaftspflicht.

Die Erkundigung nach der Verfügbarkeit von Kollegen erfordert Takt. "What's the bandwidth on your end?" fragt nach Kapazität auf eine Weise, die ehrliche Antworten über konkurrierende Anforderungen einlädt. Es erkennt an, dass Arbeitsbelastungen variieren, und respektiert das Bedürfnis der Kollegen, ihre Zeit zu managen.

Die Abschlussformulierung "Let's align on next steps" stellt sicher, dass Meetings produktiv mit klar zugewiesenen Verantwortlichkeiten enden. Sie verhindert das häufige Problem produktiver Diskussionen, die dennoch ohne Klarheit darüber enden, wer was tun wird.`
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_callout2`,
        type: "callout",
        order: 4,
        config: {
          type: "callout",
          variant: "warning",
          icon: "AlertCircle",
          title: "Ein Wort der Vorsicht",
          content: "Diese Formulierungen sollten strategisch eingesetzt werden, nicht ständig. Übermäßiger Gebrauch von Unternehmenssprache kann den Eindruck von Unaufrichtigkeit oder Substanzlosigkeit erwecken. Die effektivsten Kommunikatoren mischen konventionelle Formulierungen mit unkomplizierter Sprache."
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_content3`,
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Zusammenfassende Referenz

Die folgenden Formulierungen erfüllen die angegebenen Funktionen. "Touch base" initiiert informellen Kontakt oder Check-ins. "Circle back" kehrt die Diskussion zu einem vorherigen Thema zurück. "On the same page" bestätigt gegenseitiges Verständnis. "Push back" führt diplomatischen Widerspruch ein. "Going forward" rahmt zukünftige Planung. "Loop in" zeigt an, dass andere in die Kommunikation einbezogen werden. "Take offline" verlagert Diskussionen in separate Foren. "Action" zeigt die Übernahme von Aufgabenverantwortung an. "Bandwidth" erkundigt sich nach Kapazität. "Align" bedeutet, Einigung über Pläne zu erreichen.

Das Erlernen des angemessenen Gebrauchs dieser Formulierungen entwickelt sich durch Übung in realistischen Kontexten. Viele finden, dass das Einbeziehen einer neuen Formulierung pro Woche in tatsächliche Arbeitskommunikation eine natürliche Integration in ihr professionelles Vokabular ermöglicht.`
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_faq`,
        type: "faq",
        order: 6,
        config: {
          type: "faq",
          showHeader: true,
          headerTitle: "Häufige Fragen",
          variant: "default",
          items: [
            {
              id: `faq_de_phrases_1_${Date.now()}`,
              question: "Werden diese Formulierungen sowohl im britischen als auch im amerikanischen Business English verwendet?",
              answer: "Ja, diese Ausdrücke zirkulieren weit im internationalen Business English und werden sowohl in britischen als auch in amerikanischen Kontexten verstanden. Einige, wie 'touch base', stammen aus dem amerikanischen Englisch, sind aber zum Standard in der globalen Geschäftskommunikation geworden."
            },
            {
              id: `faq_de_phrases_2_${Date.now()}`,
              question: "Sollte deutsche Direktheit in der englischen Geschäftskommunikation gänzlich vermieden werden?",
              answer: "Nicht unbedingt. Das angemessene Register hängt von Ihrem Publikum und Ihrer Beziehung ab. Mit deutschen Kollegen bleibt Direktheit angemessen. Mit amerikanischen oder britischen Kollegen, besonders bei ersten Interaktionen, glätten abschwächende Formulierungen oft die Kommunikation. Erfahrene Fachleute passen ihr Register dem Kontext an."
            },
            {
              id: `faq_de_phrases_3_${Date.now()}`,
              question: "Was ist der beste Weg, diese Formulierungen zu üben?",
              answer: "Aktiver Gebrauch in realen beruflichen Situationen erweist sich als am effektivsten. Erwägen Sie, sich auf eine Formulierung pro Woche zu konzentrieren und sie bewusst in passenden Kontexten zu verwenden. Unsere Business-English-Module bieten auch strukturierte Übungsmöglichkeiten durch szenariobasierte Übungen."
            }
          ]
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_cta`,
        type: "cta",
        order: 7,
        config: {
          type: "cta",
          variant: "gradient",
          headline: "Entwickeln Sie Ihr professionelles Englisch",
          subheadline: "Üben Sie Business English in realistischen Meeting- und E-Mail-Szenarien mit personalisiertem Feedback zu Register und Angemessenheit.",
          primaryButton: { text: "Sitzung vereinbaren", href: "/contact" },
          secondaryButton: { text: "Business-Kurse ansehen", href: "/lessons" }
        }
      }
    ]
  },

  // 3. Master English Prepositions - Professional version
  // NOTE: Slug must match English version for language switching to work
  {
    locale: "de",
    slug: "master-english-prepositions",
    title: "Englische Präpositionen verstehen: Ein Leitfaden für deutschsprachige Lernende",
    excerpt: "Englische Präpositionen stellen für deutschsprachige Lernende eine besondere Herausforderung dar, gerade weil sie sich einer direkten Übersetzung entziehen. Dieser Leitfaden erkundet die systematischen Muster, die ihren Gebrauch regeln.",
    author: "Emma AI",
    category: "Grammatik",
    tags: ["grammatik", "praepositionen", "uebungen", "deutsche-sprecher"],
    readTimeMinutes: 8,
    status: "published",
    contentVersion: 2,
    contentBlocks: [
      {
        id: `block_de_prep_${Date.now()}_hero`,
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          variant: "default",
          title: "Englische Präpositionen verstehen: Ein Leitfaden für deutschsprachige Lernende",
          subtitle: "Englische Präpositionen stellen für deutschsprachige Lernende eine besondere Herausforderung dar, gerade weil sie sich einer direkten Übersetzung entziehen. Dieser Leitfaden erkundet die systematischen Muster, die ihren Gebrauch regeln.",
          badge: "Grammatik",
          author: "Emma AI",
          readTimeMinutes: 8,
          showAuthor: true,
          showDate: true,
          showReadTime: true
        }
      },
      {
        id: `block_de_prep_${Date.now()}_content1`,
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Die Herausforderung des interlingualen Transfers

Deutschsprachige, die Englisch lernen, begegnen einer besonderen Schwierigkeit mit Präpositionen, die aus einem fundamentalen Unterschied in der Art entsteht, wie die beiden Sprachen räumliche und zeitliche Beziehungen konzeptualisieren. Im Deutschen sagt man "Ich bin in der Arbeit", um anzuzeigen, dass man bei der Arbeit ist, doch Englisch erfordert "at work" statt "in work". Diese Diskrepanz entsteht nicht aus willkürlicher Konvention, sondern aus tieferen semantischen Unterscheidungen darin, wie jede Sprache den konzeptuellen Raum aufteilt.

Die ermutigende Nachricht für Lernende ist, dass englische Präpositionen trotz ihrer scheinbaren Unregelmäßigkeit erkennbaren Mustern folgen. Das Verstehen dieser Muster verwandelt, was wie endloses Auswendiglernen erscheint, in einen systematischeren Erwerbsprozess.

## Räumliche und zeitliche Präpositionen

Die drei am häufigsten verwendeten Präpositionen im Englischen sind in, on und at. Jede operiert nach spezifischen semantischen Prinzipien, die, einmal verstanden, konsistent über zahlreiche Kontexte hinweg anwendbar sind.

Betrachten Sie "in" als die Präposition der Einschließung oder Enthaltung. Wir verwenden sie, wenn sich etwas innerhalb von Grenzen befindet, ob physisch oder konzeptuell. Dies gilt für geschlossene Räume wie Zimmer, Gebäude und Fahrzeuge, in denen man sitzt. Es erstreckt sich auf geografische Regionen einschließlich Städte, Länder und Kontinente. Für Zeitausdrücke bezeichnet "in" Perioden mit Dauer, nämlich Tageszeiten, Monate und Jahre.

Die Präposition "on" funktioniert anders und zeigt Kontakt mit einer Oberfläche oder Spezifität der Zeit an. Physisch beschreibt sie Objekte, die auf Tischen, Böden oder Wänden ruhen. Zeitlich markiert "on" bestimmte Tage, ob benannte Wochentage, Feiertage oder persönliche Jahrestage wie Geburtstage.

Während "in" Einschließung impliziert und "on" Oberflächenkontakt nahelegt, bezeichnet "at" einen präzisen Punkt in Raum oder Zeit. Wir verwenden es für bestimmte Orte wie Bushaltestellen, Ecken und Adressen. Für Zeit markiert "at" exakte Momente: at nine o'clock, at noon, at midnight. Die Präposition impliziert Präzision statt Dauer oder Ausdehnung.`
        }
      },
      {
        id: `block_de_prep_${Date.now()}_callout1`,
        type: "callout",
        order: 2,
        config: {
          type: "callout",
          variant: "tip",
          icon: "Lightbulb",
          title: "Zu deutsch-englischen Unterschieden",
          content: "Deutsch verwendet unterschiedliche Präpositionen für Tage (am) und Uhrzeiten (um), während Englisch konsistent 'on' für Tage und 'at' für bestimmte Zeiten verwendet. Diese konsistente Paarung vereinfacht das englische System, sobald das Muster erkannt wird."
        }
      },
      {
        id: `block_de_prep_${Date.now()}_content2`,
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Häufige Transferfehler und ihre Korrekturen

Deutschsprachige produzieren häufig bestimmte charakteristische Fehler bei der Verwendung englischer Präpositionen. Das Verstehen, warum diese Fehler auftreten, hilft dabei, sie zu vermeiden.

Der Ausdruck "I am in the work" repräsentiert eine direkte Übersetzung aus dem Deutschen, die im Englischen scheitert, das "at work" erfordert. Die Unterscheidung liegt darin, dass Englisch "work" als einen Punkt der Aktivität behandelt statt als enthaltenden Raum. Ähnlich reflektiert "on the weekend" versus "at the weekend" dialektale Variation zwischen amerikanischem und britischem Englisch statt einen Fehler, obwohl Lernende sich dieses Unterschieds bewusst sein sollten.

"In Monday" statt "on Monday" zu sagen, wendet das deutsche Muster für Tage auf Englisch an, wo bestimmte Tage konsistent "on" nehmen. Der entgegengesetzte Fehler tritt bei Tageszeiten auf: "at the morning" sollte "in the morning" sein, weil Morgen eine Periode repräsentiert statt einen Punkt in der Zeit.

## Die Transportunterscheidung

Ein Bereich, in dem englische Präpositionen besonders kontraintuitiv erscheinen, betrifft Fahrzeuge. Das regierende Prinzip bezieht sich auf die physische Kapazität: "in" beschreibt Fahrzeuge, in denen Passagiere in sitzender Position eingeschlossen sind, während "on" auf Transportmittel anwendbar ist, in denen man theoretisch stehen und sich bewegen könnte.

So sagen wir "in a car" oder "in a taxi", weil Passagiere eingeschlossen in einem kleinen Raum sitzen. Für Busse, Züge, Flugzeuge und Schiffe bevorzugt Englisch "on", weil diese Fahrzeuge groß genug sind, um darin herumzulaufen. Das gleiche Prinzip erklärt "on a bicycle", wo der Fahrer oben auf dem Rahmen sitzt statt darin eingeschlossen zu sein.`
        }
      },
      {
        id: `block_de_prep_${Date.now()}_callout2`,
        type: "callout",
        order: 4,
        config: {
          type: "callout",
          variant: "info",
          icon: "Gamepad2",
          title: "Automatisierung entwickeln",
          content: "Interaktive Übung beschleunigt die Entwicklung intuitiven Präpositionsgebrauchs. Unsere Präpositions-Zuordnungsaktivitäten, die während der Unterrichtsstunden verfügbar sind, helfen dabei, diese Muster durch aktives Engagement statt passivem Studium zu festigen."
        }
      },
      {
        id: `block_de_prep_${Date.now()}_content3`,
        type: "rich_text",
        order: 5,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Referenzmuster

Für zeitliche Ausdrücke gelten die folgenden Muster konsistent. Verwenden Sie "in" für Tageszeiten wie Morgen, Nachmittag und Abend. Verwenden Sie "in" für Monate, Jahreszeiten und Jahre. Verwenden Sie "on" für bestimmte benannte Tage und Daten. Verwenden Sie "at" für präzise Uhrzeiten, noon, midnight und night.

Für räumliche Ausdrücke bezeichnet "in" geschlossene Orte einschließlich Städte, Länder, Zimmer und Gebäude. "On" zeigt Oberflächen wie Tische, Böden und Straßen sowie Stockwerke von Gebäuden im britischen Gebrauch an. "At" markiert bestimmte Adressen, Institutionen, die als Kontaktpunkte behandelt werden, und präzise Orte wie Ecken und Bushaltestellen.

## Kognitive Strategien zur Behaltung

Drei mentale Modelle erweisen sich als hilfreich für das Erinnern des Präpositionsgebrauchs. Erstens das Container-Modell: wenn der Ort als etwas einschließend konzipiert werden könnte, ist "in" wahrscheinlich anwendbar. Zweitens das Oberflächen-Modell: wenn etwas auf einer Oberfläche ruht oder sie berührt, ist "on" angemessen. Drittens das Punkt-Modell: wenn der Ort oder die Zeit einen präzisen, bestimmten Punkt repräsentiert, passt "at" am besten.

Es ist erwähnenswert, dass selbst englische Muttersprachler gelegentlich über Präpositionswahlen debattieren und regionale Variationen existieren. Das Ziel des Sprachenlernens ist Kommunikation, nicht das Erreichen einer vielleicht unerreichbaren Perfektion. Die Entwicklung eines funktionierenden Verständnisses dieser Kernmuster ermöglicht effektive Kommunikation, während fortgesetzte Exposition die Intuitionen im Laufe der Zeit verfeinert.`
        }
      },
      {
        id: `block_de_prep_${Date.now()}_faq`,
        type: "faq",
        order: 6,
        config: {
          type: "faq",
          showHeader: true,
          headerTitle: "Häufige Fragen",
          variant: "default",
          items: [
            {
              id: `faq_de_prep_1_${Date.now()}`,
              question: "Warum verwendet Englisch 'at night' aber 'in the morning'?",
              answer: "Diese scheinbare Inkonsistenz spiegelt wider, wie Englisch diese Zeitperioden unterschiedlich konzeptualisiert. Night wird als ein Punkt im Tageszyklus behandelt, während morning, afternoon und evening als Perioden mit Dauer konzipiert werden. Diese Unterscheidung muss einfach als ein Merkmal des Englischen gelernt werden."
            },
            {
              id: `faq_de_prep_2_${Date.now()}`,
              question: "Unterscheiden sich britisches und amerikanisches Englisch im Präpositionsgebrauch?",
              answer: "Ja, bestimmte Variationen existieren. Der am häufigsten angetroffene Unterschied betrifft Wochenenden: Britisches Englisch bevorzugt 'at the weekend', während amerikanisches Englisch 'on the weekend' verwendet. Beides ist korrekt innerhalb der jeweiligen Dialekte."
            },
            {
              id: `faq_de_prep_3_${Date.now()}`,
              question: "Was ist der effektivste Ansatz zum Lernen von Präpositionen?",
              answer: "Forschung zum Zweitspracherwerb legt nahe, Präpositionen innerhalb von Phrasen zu lernen statt isoliert. Statt auswendig zu lernen, dass 'at' zu 'work' gehört, lernen Sie die vollständige Phrase 'I am at work.' Phrasen werden effektiver behalten als isolierte grammatische Regeln."
            }
          ]
        }
      },
      {
        id: `block_de_prep_${Date.now()}_cta`,
        type: "cta",
        order: 7,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Entwickeln Sie Ihre Grammatik-Intuition",
          subheadline: "Üben Sie den Präpositionsgebrauch durch Konversation mit Emma, unter Einbeziehung interaktiver Übungen, die für deutschsprachige Lernende konzipiert sind.",
          primaryButton: { text: "Lernen beginnen", href: "/contact" },
          secondaryButton: { text: "Unterricht erkunden", href: "/lessons" },
          trustBadge: "Kostenlose erste Sitzung"
        }
      }
    ]
  },

  // 4. Business Email Tips - Professional version
  // NOTE: Slug must match English version for language switching to work
  {
    locale: "de",
    slug: "business-email-tips",
    title: "Professionelle E-Mail-Korrespondenz auf Englisch: Struktur und Konventionen",
    excerpt: "Im internationalen Geschäftsverkehr ist die E-Mail oft der erste Eindruck. Eine gut formulierte E-Mail zeigt Professionalität und schafft die Grundlage für erfolgreiche Geschäftsbeziehungen.",
    author: "James Simmonds",
    category: "Wirtschaftsenglisch",
    tags: ["email", "schreiben", "business", "professionell"],
    readTimeMinutes: 6,
    status: "published",
    contentVersion: 2,
    contentBlocks: [
      {
        id: `block_de_email_${Date.now()}_hero`,
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          variant: "default",
          title: "Professionelle E-Mail-Korrespondenz auf Englisch: Struktur und Konventionen",
          subtitle: "Im internationalen Geschäftsverkehr ist die E-Mail oft der erste Eindruck. Eine gut formulierte E-Mail zeigt Professionalität und schafft die Grundlage für erfolgreiche Geschäftsbeziehungen.",
          badge: "Wirtschaftsenglisch",
          author: "James Simmonds",
          readTimeMinutes: 6,
          showAuthor: true,
          showDate: true,
          showReadTime: true
        }
      },
      {
        id: `block_de_email_${Date.now()}_content1`,
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Die Bedeutung professioneller E-Mail-Kommunikation

E-Mail-Korrespondenz bildet das Rückgrat moderner Geschäftskommunikation. Für deutschsprachige Fachkräfte, die mit internationalen Partnern arbeiten, erfordert effektive englische E-Mail-Kommunikation sowohl strukturelles Verständnis als auch kulturelle Sensibilität.

Deutsche E-Mail-Konventionen unterscheiden sich in mehreren Aspekten von englischen. Während deutsche Geschäfts-E-Mails traditionell formeller sind und oft detaillierte Einleitungen enthalten, tendieren englische E-Mails zu größerer Direktheit bei gleichzeitiger Wahrung von Höflichkeit. Diese Balance zu finden, ist der Schlüssel zu erfolgreicher interkultureller Kommunikation.

---

## Strukturelle Elemente

Eine effektive Geschäfts-E-Mail auf Englisch folgt einer klaren Struktur, die den Leser durch die Nachricht führt. Die Betreffzeile sollte klar und spezifisch sein und den Zweck der E-Mail sofort vermitteln. Beispiele wie "Meeting Request: Q2 Budget Review" oder "Follow-up: Contract Discussion" kommunizieren präzise, was der Empfänger erwarten kann.

Die Anrede setzt den Ton für die gesamte Nachricht. Formelle Kontexte erfordern "Dear Mr./Ms. Surname", während etablierte Geschäftsbeziehungen oft "Dear First Name" erlauben. Für Gruppenkommunikation sind "Dear Team" oder "Dear All" angemessen.

Die Einleitung sollte den Zweck unmittelbar etablieren. Englische Geschäfts-E-Mails schätzen Direktheit; Formulierungen wie "I'm writing to follow up on our conversation about..." oder "I'm reaching out regarding..." kommen schnell zum Punkt.

Der Hauptteil organisiert Informationen logisch, mit einem Absatz pro Thema. Klare Absatzstrukturen verbessern die Lesbarkeit und ermöglichen dem Empfänger, wichtige Informationen schnell zu erfassen.

Der Abschluss spezifiziert erwartete Aktionen oder nächste Schritte. Formulierungen wie "Please let me know if you have any questions" oder "I look forward to hearing from you" laden zur Antwort ein und schaffen einen positiven Abschluss.`
        }
      },
      {
        id: `block_de_email_${Date.now()}_callout`,
        type: "callout",
        order: 2,
        config: {
          type: "callout",
          variant: "warning",
          icon: "AlertTriangle",
          title: "Häufige Fehler vermeiden",
          content: "Vermeiden Sie Direktübersetzungen deutscher Grußformeln. 'With friendly greetings' für 'Mit freundlichen Grüßen' ist im Englischen ungewöhnlich. Stattdessen verwenden Sie 'Best regards', 'Kind regards' oder 'Sincerely' je nach Formalitätsgrad."
        }
      },
      {
        id: `block_de_email_${Date.now()}_content2`,
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Grußformeln und ihre Anwendung

Die Wahl der Grußformel signalisiert den Formalitätsgrad der Beziehung. "Sincerely" ist sehr formell und eignet sich für erste Kontakte mit unbekannten Empfängern. "Best regards" fungiert als Standard in den meisten Geschäftskontexten. "Kind regards" vermittelt etwas mehr Wärme bei gleichzeitiger Professionalität. "Best" oder "Thanks" sind informeller und für etablierte Arbeitsbeziehungen angemessen.

---

## Register und Ton

Englische Geschäfts-E-Mails bevorzugen aktive Formulierungen und vermeiden übermäßige Indirektheit. Dennoch unterscheiden sich die Erwartungen vom deutschen Direktheitsgrad. Wo eine deutsche E-Mail "Senden Sie mir den Bericht" sagen könnte, würde die englische Entsprechung oft "Could you please send me the report?" oder "I would appreciate it if you could send me the report" lauten.

Diese Abschwächungen sind keine Zeichen von Unsicherheit, sondern kulturelle Konventionen, die Respekt für die Zeit und Autonomie des Empfängers signalisieren. Sie gehören zum Standard englischer Geschäftskommunikation und sollten als rhetorische Werkzeuge verstanden werden, nicht als Ausdruck tatsächlichen Zögerns.`
        }
      },
      {
        id: `block_de_email_${Date.now()}_faq`,
        type: "faq",
        order: 4,
        config: {
          type: "faq",
          showHeader: true,
          headerTitle: "Häufige Fragen",
          variant: "default",
          items: [
            {
              id: `faq_de_email_1_${Date.now()}`,
              question: "Wann sollte ich 'Dear' und wann 'Hi' verwenden?",
              answer: "'Dear' ist für formelle oder erste Kontakte angemessen. 'Hi' kann in etablierten Beziehungen verwendet werden, insbesondere wenn der Korrespondenzstil des anderen dies nahelegt. Im Zweifelsfall beginnen Sie formeller und passen Sie sich dem Stil des anderen an."
            },
            {
              id: `faq_de_email_2_${Date.now()}`,
              question: "Wie lang sollte eine Geschäfts-E-Mail sein?",
              answer: "So kurz wie möglich, so lang wie nötig. Jeder Satz sollte einen Zweck erfüllen. Längere E-Mails sollten durch klare Strukturierung und Absätze lesbar bleiben. Für sehr komplexe Themen kann es besser sein, ein Meeting oder Telefonat vorzuschlagen."
            }
          ]
        }
      },
      {
        id: `block_de_email_${Date.now()}_cta`,
        type: "cta",
        order: 5,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Verbessern Sie Ihre E-Mail-Kommunikation",
          subheadline: "Lernen Sie in persönlichen Sitzungen, wie Sie professionell und selbstbewusst auf Englisch korrespondieren.",
          primaryButton: { text: "Beratung anfragen", href: "/contact" },
          trustBadge: "Praxisnahe Übungen mit echten Beispielen"
        }
      }
    ]
  },

  // 5. Present Perfect Guide - Professional version
  // NOTE: Slug must match English version for language switching to work
  {
    locale: "de",
    slug: "present-perfect-guide",
    title: "Das Present Perfect im Englischen: Ein analytischer Leitfaden",
    excerpt: "Das Present Perfect stellt für deutschsprachige Lernende eine besondere Herausforderung dar, da es keine direkte Entsprechung im Deutschen hat. Dieser Leitfaden analysiert die semantischen Unterschiede systematisch.",
    author: "Emma AI",
    category: "Grammatik",
    tags: ["grammatik", "zeiten", "present-perfect", "uebungen"],
    readTimeMinutes: 9,
    status: "published",
    contentVersion: 2,
    contentBlocks: [
      {
        id: `block_de_pp_${Date.now()}_hero`,
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          variant: "default",
          title: "Das Present Perfect im Englischen: Ein analytischer Leitfaden",
          subtitle: "Das Present Perfect stellt für deutschsprachige Lernende eine besondere Herausforderung dar, da es keine direkte Entsprechung im Deutschen hat. Dieser Leitfaden analysiert die semantischen Unterschiede systematisch.",
          badge: "Grammatik",
          author: "Emma AI",
          readTimeMinutes: 9,
          showAuthor: true,
          showDate: true,
          showReadTime: true
        }
      },
      {
        id: `block_de_pp_${Date.now()}_content1`,
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Die fundamentale Unterscheidung

Deutschsprachige verwenden das Perfekt ("Ich habe gemacht") in der alltäglichen Sprache nahezu ausschließlich für vergangene Handlungen. Das Simple Past ("Ich machte") erscheint überwiegend in geschriebener, formeller Sprache. Im Englischen hingegen kodieren Present Perfect und Simple Past unterschiedliche zeitliche und aspektuelle Bedeutungen, die nicht mit der deutschen Verwendung übereinstimmen.

Die Kernunterscheidung lässt sich folgendermaßen formulieren: Das Present Perfect drückt eine Verbindung zwischen Vergangenheit und Gegenwart aus, während das Simple Past abgeschlossene Vergangenheit ohne Gegenwartsbezug markiert.

---

## Anwendungskontexte des Present Perfect

Das Present Perfect findet Anwendung in mehreren distinkten Kontexten. Bei Erfahrungen ohne spezifische Zeitangabe verwendet Englisch das Present Perfect. Der Satz "I have been to London" drückt aus, dass die Erfahrung des London-Besuchs Teil der Lebensgeschichte des Sprechers ist, ohne zu spezifizieren, wann dies geschah. Sobald eine spezifische Zeit genannt wird, wechselt Englisch zum Simple Past: "I was in London last year."

Bei bis zur Gegenwart andauernden Zuständen markiert das Present Perfect, dass die Situation weiterhin besteht. "I have worked here for five years" impliziert, dass die Person noch dort arbeitet. Im Kontrast dazu signalisiert "I worked there for five years", dass diese Beschäftigung beendet ist.

Für kürzliche Ereignisse mit Gegenwartsbezug verwendet Englisch das Present Perfect, oft mit Signalwörtern wie just, already oder yet. Der Satz "I have just finished the report" betont, dass das Ereignis gerade stattfand und für die gegenwärtige Situation relevant ist.`
        }
      },
      {
        id: `block_de_pp_${Date.now()}_callout`,
        type: "callout",
        order: 2,
        config: {
          type: "callout",
          variant: "info",
          icon: "Lightbulb",
          title: "Gedächtnisstütze",
          content: "Wenn Sie im Deutschen 'schon mal' verwenden würden, ist im Englischen oft das Present Perfect angemessen: 'Have you ever been to Paris?' entspricht 'Waren Sie schon mal in Paris?' Die Frage bezieht sich auf Lebenserfahrung ohne spezifischen Zeitpunkt."
        }
      },
      {
        id: `block_de_pp_${Date.now()}_content2`,
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Signalwörter als Orientierung

Bestimmte Signalwörter korrelieren typischerweise mit dem Present Perfect oder dem Simple Past. Wörter wie ever, never, already, yet, just, recently, so far und until now zeigen oft Present Perfect an, da sie einen Bezug zur Gegenwart implizieren.

Im Gegensatz dazu signalisieren Ausdrücke mit spezifischer Zeitangabe wie yesterday, last week, in 2020 oder ago typischerweise das Simple Past, da sie die Handlung zeitlich fixieren und somit von der Gegenwart trennen.

---

## Praktische Anwendung

Die praktische Beherrschung dieser Unterscheidung entwickelt sich durch bewusste Aufmerksamkeit auf die zugrundeliegenden Bedeutungen. Fragen Sie sich bei jeder Aussage über Vergangenes: Besteht eine Verbindung zur Gegenwart, oder ist die Handlung vollständig abgeschlossen und zeitlich abgegrenzt?

"I have lost my keys" drückt aus, dass das Resultat gegenwärtig relevant ist: Die Schlüssel sind noch verloren. "I lost my keys yesterday" situiert das Ereignis in der abgeschlossenen Vergangenheit, ohne über den aktuellen Status zu informieren.

Diese semantische Unterscheidung existiert im Deutschen nicht in der gleichen Weise, weshalb bewusste Übung erforderlich ist, um die englische Zeitenwahl zu automatisieren. Durch regelmäßige Exposition und reflektierte Praxis entwickelt sich jedoch ein zunehmend intuitives Verständnis.`
        }
      },
      {
        id: `block_de_pp_${Date.now()}_faq`,
        type: "faq",
        order: 4,
        config: {
          type: "faq",
          showHeader: true,
          headerTitle: "Häufige Fragen",
          variant: "default",
          items: [
            {
              id: `faq_de_pp_1_${Date.now()}`,
              question: "Unterscheiden sich amerikanisches und britisches Englisch in der Verwendung des Present Perfect?",
              answer: "Ja, amerikanisches Englisch verwendet in bestimmten Kontexten häufiger das Simple Past, wo britisches Englisch das Present Perfect bevorzugen würde. Dies gilt besonders für Ausdrücke mit just, already und yet. Beide Varianten werden im jeweiligen Dialekt als korrekt angesehen."
            },
            {
              id: `faq_de_pp_2_${Date.now()}`,
              question: "Wann verwende ich 'since' und wann 'for'?",
              answer: "'Since' bezeichnet einen Zeitpunkt, ab dem etwas begann ('since Monday', 'since 2020'). 'For' bezeichnet eine Zeitdauer ('for three days', 'for years'). Beide werden häufig mit dem Present Perfect verwendet, um andauernde Zustände auszudrücken."
            },
            {
              id: `faq_de_pp_3_${Date.now()}`,
              question: "Kann das Present Perfect jemals mit einem spezifischen Zeitpunkt verwendet werden?",
              answer: "Generell nicht mit abgeschlossenen Zeitpunkten in der Vergangenheit. Eine Ausnahme bildet 'today', das als noch nicht abgeschlossen gilt: 'I have had three meetings today' ist korrekt, solange der Tag noch andauert."
            }
          ]
        }
      },
      {
        id: `block_de_pp_${Date.now()}_cta`,
        type: "cta",
        order: 5,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Grammatik systematisch lernen",
          subheadline: "Unsere erfahrenen Trainer helfen Ihnen, englische Grammatik nicht nur zu verstehen, sondern intuitiv anzuwenden.",
          primaryButton: { text: "Probestunde vereinbaren", href: "/contact" },
          trustBadge: "Auf deutschsprachige Lernende spezialisiert"
        }
      }
    ]
  },

  // 6. Essential Phrases for German Meetings - Professional version
  // NOTE: Slug must match English version for language switching to work
  {
    locale: "de",
    slug: "essential-phrases-first-german-meeting",
    title: "Ihr erstes Geschäftstreffen auf Englisch: Professionelle Formulierungen",
    excerpt: "Der erste Eindruck in einem internationalen Geschäftsmeeting ist entscheidend. Diese Formulierungen helfen Ihnen, souverän und professionell aufzutreten.",
    author: "James Simmonds",
    category: "Business English",
    tags: ["meetings", "phrasen", "business", "anfaenger"],
    readTimeMinutes: 5,
    status: "published",
    contentVersion: 2,
    contentBlocks: [
      {
        id: `block_de_meeting_${Date.now()}_hero`,
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          variant: "default",
          title: "Ihr erstes Geschäftstreffen auf Englisch: Professionelle Formulierungen",
          subtitle: "Der erste Eindruck in einem internationalen Geschäftsmeeting ist entscheidend. Diese Formulierungen helfen Ihnen, souverän und professionell aufzutreten.",
          badge: "Business English",
          author: "James Simmonds",
          readTimeMinutes: 5,
          showAuthor: true,
          showDate: true,
          showReadTime: true
        }
      },
      {
        id: `block_de_meeting_${Date.now()}_content1`,
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Vorbereitung auf das Meeting

Der Erfolg eines internationalen Geschäftstreffens beginnt vor dem eigentlichen Meeting. Neben inhaltlicher Vorbereitung ist es hilfreich, Standardformulierungen für verschiedene Phasen des Meetings parat zu haben. Dies reduziert die kognitive Belastung während des Gesprächs und ermöglicht es Ihnen, sich auf den Inhalt zu konzentrieren.

---

## Begrüßung und Vorstellung

Bei der ersten Begegnung etablieren höfliche Formulierungen den professionellen Ton. "Nice to meet you. I'm [Name] from [Abteilung/Unternehmen]" bietet eine klare, freundliche Vorstellung. "I've heard a lot about your work" oder "I've been looking forward to this meeting" zeigen Interesse und schaffen positive Atmosphäre.

Kurzer Small Talk zu Beginn ist in englischsprachigen Geschäftskulturen üblicher als in deutschen Kontexten. Fragen wie "How was your journey?" oder "Did you find the office easily?" dienen dem Beziehungsaufbau, bevor die eigentliche Geschäftsdiskussion beginnt.

---

## Während des Meetings

Um Ihre Meinung zu äußern, bieten Formulierungen wie "In my opinion..." oder "From my perspective..." höfliche Einstiege. Bei Nachfragen ermöglichen "Could you please clarify that?" oder "Could you elaborate on that point?" die Bitte um weitere Information, ohne den Sprecher zu unterbrechen oder in Frage zu stellen.

Zustimmung kann durch "I agree with you on that point" oder "That's a good point" signalisiert werden. Für diplomatischen Widerspruch dienen Formulierungen wie "I see your point, but..." oder "That's an interesting perspective. However..." als höfliche Einleitungen einer abweichenden Meinung.`
        }
      },
      {
        id: `block_de_meeting_${Date.now()}_content2`,
        type: "rich_text",
        order: 2,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Abschluss des Meetings

Ein professioneller Abschluss fasst die wesentlichen Punkte zusammen und klärt die nächsten Schritte. "To summarize the main points..." oder "So, we agreed that..." leiten eine Zusammenfassung ein. "The next steps are..." oder "I'll send you a summary by..." etablieren Verantwortlichkeiten und Zeitrahmen.

Bei der Verabschiedung drücken "Thank you for your time" und "It was a pleasure meeting you" Wertschätzung aus. "I look forward to our next meeting" oder "I look forward to working with you" signalisieren Interesse an fortgesetzter Zusammenarbeit.

---

## Umgang mit Schwierigkeiten

Sollten Sie etwas nicht verstanden haben, ist es professioneller, nachzufragen, als zu nicken und möglicherweise wichtige Information zu verpassen. "I'm sorry, could you repeat that?" oder "I didn't quite catch that, could you say that again?" sind akzeptable Formulierungen, die kein mangelndes Sprachverständnis signalisieren, sondern aufmerksames Zuhören.

Bei technischen Problemen oder wenn Sie Zeit zum Nachdenken benötigen, können "Let me think about that for a moment" oder "That's an interesting point, I'd like to consider it" verwendet werden, um eine kurze Pause zu schaffen.`
        }
      },
      {
        id: `block_de_meeting_${Date.now()}_faq`,
        type: "faq",
        order: 3,
        config: {
          type: "faq",
          showHeader: true,
          headerTitle: "Häufige Fragen",
          variant: "default",
          items: [
            {
              id: `faq_de_meeting_1_${Date.now()}`,
              question: "Wie formal sollte ich in einem englischen Geschäftstreffen sein?",
              answer: "Das hängt vom Kontext und den Teilnehmern ab. Als Faustregel gilt: Beginnen Sie formeller und passen Sie sich dem Stil der anderen an. Beobachten Sie, wie Ihre Gesprächspartner kommunizieren, und orientieren Sie sich daran."
            },
            {
              id: `faq_de_meeting_2_${Date.now()}`,
              question: "Was, wenn ich einen Fehler mache?",
              answer: "Kleinere Fehler werden in internationalen Kontexten erwartet und toleriert. Korrigieren Sie sich kurz, wenn nötig, und fahren Sie fort. Übermäßiges Entschuldigen für Sprachfehler unterbricht den Gesprächsfluss mehr als der ursprüngliche Fehler."
            }
          ]
        }
      },
      {
        id: `block_de_meeting_${Date.now()}_cta`,
        type: "cta",
        order: 4,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Sicher in englischen Meetings",
          subheadline: "Trainieren Sie Meeting-Situationen mit unseren erfahrenen Trainern in realistischen Rollenspielen.",
          primaryButton: { text: "Training anfragen", href: "/contact" },
          trustBadge: "Praktische Übungen inklusive"
        }
      }
    ]
  },

  // 7. Master Business Vocabulary - Professional version
  // NOTE: Slug must match English version for language switching to work
  {
    locale: "de",
    slug: "master-business-vocabulary-interactive-games",
    title: "Fachvokabular durch interaktives Lernen: Ein systematischer Ansatz",
    excerpt: "Der Aufbau eines professionellen Wortschatzes erfordert mehr als Vokabellisten. Interaktive Methoden beschleunigen den Erwerb und verbessern die Anwendungssicherheit.",
    author: "Emma AI",
    category: "Interaktives Lernen",
    tags: ["vokabeln", "business", "spiele", "interaktiv"],
    readTimeMinutes: 6,
    status: "published",
    contentVersion: 2,
    contentBlocks: [
      {
        id: `block_de_vocab_${Date.now()}_hero`,
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          variant: "default",
          title: "Fachvokabular durch interaktives Lernen: Ein systematischer Ansatz",
          subtitle: "Der Aufbau eines professionellen Wortschatzes erfordert mehr als Vokabellisten. Interaktive Methoden beschleunigen den Erwerb und verbessern die Anwendungssicherheit.",
          badge: "Interaktives Lernen",
          author: "Emma AI",
          readTimeMinutes: 6,
          showAuthor: true,
          showDate: true,
          showReadTime: true
        }
      },
      {
        id: `block_de_vocab_${Date.now()}_content1`,
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Warum traditionelles Vokabellernen ineffizient ist

Forschung zur Zweitsprachenerwerbung zeigt konsistent, dass isoliertes Auswendiglernen von Vokabellisten zu geringer Behaltensrate und mangelhafter Anwendungsfähigkeit führt. Wörter, die ohne Kontext gelernt werden, bleiben oft passiv verfügbar, können aber im aktiven Sprachgebrauch nicht abgerufen werden.

Interaktive Lernmethoden adressieren dieses Problem durch mehrere Mechanismen. Sie präsentieren Vokabular im Kontext, was semantische Netzwerke aufbaut. Sie erfordern aktive Produktion statt bloßer Erkennung. Sie bieten unmittelbares Feedback, das Fehlerkorrektur ermöglicht. Sie steigern Engagement und Motivation durch spielerische Elemente.

---

## Effektive Übungsformate

Branchenspezifische Zuordnungsübungen verbinden Fachterminologie mit Definitionen, Kontexten oder Übersetzungen. Dieses Format nutzt die Vorteile des verteilten Wiederholens bei gleichzeitiger Einbettung in relevante Anwendungskontexte.

Lückentextübungen mit authentischen Geschäftsdokumenten trainieren die kontextgerechte Verwendung von Fachvokabular. Die Notwendigkeit, das passende Wort aus dem Gedächtnis abzurufen, stärkt produktive Sprachkompetenz.

Satzbauübungen entwickeln das Verständnis für typische Kollokationen im Geschäftskontext. Welche Wörter zusammen auftreten, wie Sätze strukturiert werden und welches Register angemessen ist, werden durch diese Formate trainiert.`
        }
      },
      {
        id: `block_de_vocab_${Date.now()}_content2`,
        type: "rich_text",
        order: 2,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Themenspezifische Wortfelder

Ein strukturierter Vokabelaufbau organisiert Wörter nach thematischen Feldern, die für die jeweilige berufliche Situation relevant sind. Im Finanzbereich umfasst dies Terminologie wie budget, forecast, quarterly results, revenue und expenditure. Im Marketing sind Begriffe wie campaign, target audience, conversion rate und return on investment zentral.

Personalwesen erfordert Vertrautheit mit Ausdrücken wie onboarding, performance review, compensation package und professional development. Technische Kontexte beinhalten Vokabular wie implementation, deployment, scalability und infrastructure.

Die Aneignung dieser Wortfelder erfolgt am effektivsten nicht durch Listenstudium, sondern durch wiederholte Begegnung und aktive Verwendung in simulierten und realen Geschäftskontexten.

---

## Langfristige Behaltensstrategien

Forschung belegt, dass verteiltes Lernen über Zeit hinweg deutlich effektiver ist als konzentrierte Lerneinheiten. Kurze, regelmäßige Übungssitzungen von zehn bis fünfzehn Minuten erzielen bessere Ergebnisse als sporadische mehrstündige Lernphasen.

Die Verknüpfung neuen Vokabulars mit bereits bekanntem Wissen verbessert die Behaltensleistung. Wo möglich, sollten Verbindungen zu deutschen Äquivalenten, zu bereits bekanntem englischem Vokabular oder zu konkreten beruflichen Erfahrungen hergestellt werden.

Aktive Verwendung in realen Kontexten konsolidiert das Gelernte. Das bewusste Einsetzen neuer Vokabeln in E-Mails, Präsentationen oder Gesprächen beschleunigt den Übergang vom passiven zum aktiven Wortschatz.`
        }
      },
      {
        id: `block_de_vocab_${Date.now()}_cta`,
        type: "cta",
        order: 3,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Erweitern Sie Ihren Fachwortschatz",
          subheadline: "Mit unseren branchenspezifischen Übungen entwickeln Sie Sicherheit im professionellen Sprachgebrauch.",
          primaryButton: { text: "Lernen beginnen", href: "/contact" },
          trustBadge: "Auf Ihre Branche zugeschnitten"
        }
      }
    ]
  },

  // 8. German Business Culture - Professional version
  // NOTE: Slug must match English version for language switching to work
  {
    locale: "de",
    slug: "german-business-culture",
    title: "Deutsche Geschäftskultur im internationalen Kontext: Eine Analyse",
    excerpt: "Für internationale Fachkräfte, die mit deutschen Partnern arbeiten, ist das Verständnis kultureller Kommunikationsmuster entscheidend für erfolgreiche Zusammenarbeit.",
    author: "James Simmonds",
    category: "Lerntipps",
    tags: ["kultur", "business", "deutschland", "tipps"],
    readTimeMinutes: 7,
    status: "published",
    contentVersion: 2,
    contentBlocks: [
      {
        id: `block_de_culture_${Date.now()}_hero`,
        type: "hero",
        order: 0,
        config: {
          type: "hero",
          variant: "default",
          title: "Deutsche Geschäftskultur im internationalen Kontext: Eine Analyse",
          subtitle: "Für internationale Fachkräfte, die mit deutschen Partnern arbeiten, ist das Verständnis kultureller Kommunikationsmuster entscheidend für erfolgreiche Zusammenarbeit.",
          badge: "Lerntipps",
          author: "James Simmonds",
          readTimeMinutes: 7,
          showAuthor: true,
          showDate: true,
          showReadTime: true
        }
      },
      {
        id: `block_de_culture_${Date.now()}_content1`,
        type: "rich_text",
        order: 1,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Grundprinzipien deutscher Geschäftskultur

Die deutsche Geschäftskultur zeichnet sich durch mehrere markante Charakteristiken aus, die im internationalen Kontext sowohl Stärken als auch potenzielle Missverständnisquellen darstellen.

Pünktlichkeit in Deutschland überschreitet bloße Höflichkeit und gilt als Ausdruck von Respekt und Professionalität. Das Sprichwort "Fünf Minuten vor der Zeit ist die deutsche Pünktlichkeit" reflektiert diese kulturelle Norm. Für internationale Partner kann diese Erwartung zunächst streng erscheinen, signalisiert jedoch Zuverlässigkeit und Ernsthaftigkeit.

Direktheit in der Kommunikation stellt einen weiteren Kernaspekt dar. Deutsche Geschäftskommunikation tendiert zu klaren, unverblümten Aussagen, die in indirekteren Kulturen als brüsk empfunden werden können. Diese Direktheit entspringt jedoch einem Werteverständnis, das Ehrlichkeit und Effizienz priorisiert. Ein direktes "Nein" oder konstruktive Kritik ohne Umschweife wird als respektvoll betrachtet, da es die Zeit und Intelligenz des Gegenübers achtet.

Gründlichkeit manifestiert sich in der deutschen Vorliebe für detaillierte Planung und umfassende Dokumentation. Entscheidungen werden typischerweise erst nach sorgfältiger Analyse getroffen, was den Prozess verlangsamen kann, aber zu gut durchdachten Ergebnissen führt.`
        }
      },
      {
        id: `block_de_culture_${Date.now()}_quote`,
        type: "quote",
        order: 2,
        config: {
          type: "quote",
          variant: "highlighted",
          text: "Nach über zwei Jahrzehnten in Deutschland habe ich gelernt: Deutsche Direktheit ist eine Form des Respekts. Man nimmt Sie ernst genug, um ehrlich mit Ihnen zu sein.",
          attribution: "James Simmonds",
          role: "Gründer",
          company: "SLS"
        }
      },
      {
        id: `block_de_culture_${Date.now()}_content2`,
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Formalität und Hierarchie

Der formelle Umgang, insbesondere die Verwendung von "Sie" und akademischen Titeln, prägt deutsche Geschäftsbeziehungen, besonders in deren Anfangsphase. Der Übergang vom "Sie" zum "Du" erfolgt explizit und markiert einen wichtigen Meilenstein in der Beziehungsentwicklung.

Hierarchien werden in deutschen Organisationen oft klar definiert und respektiert. Entscheidungsbefugnisse sind typischerweise eindeutig zugewiesen, was klare Verantwortlichkeiten schafft. Gleichzeitig wird von Mitarbeitern auf allen Ebenen erwartet, dass sie Expertise und fundierte Meinungen einbringen.

---

## Praktische Implikationen

Für Meetings empfiehlt sich sorgfältige Vorbereitung mit allen relevanten Unterlagen und Daten. Agenden werden typischerweise eingehalten, und Zeitpläne ernst genommen. Eine strukturierte Präsentation von Fakten und Analysen wird höher geschätzt als enthusiastische, aber vage Visionen.

In der schriftlichen Kommunikation ist formelle Anrede Standard. E-Mails beginnen mit "Sehr geehrte/r..." und enden mit "Mit freundlichen Grüßen". Titel werden verwendet und korrekt angegeben. Präzision und Vollständigkeit in der Dokumentation werden erwartet.

In Verhandlungen sollten Sie mit gründlicher Vorbereitung, belastbaren Daten und realistischen Zeitrahmen rechnen. Deutsche Verhandlungspartner schätzen Sachlichkeit und fundierte Argumentation. Schnelle Entscheidungen sind selten; gründliche interne Abstimmung ist üblich.`
        }
      },
      {
        id: `block_de_culture_${Date.now()}_content3`,
        type: "rich_text",
        order: 4,
        config: {
          type: "rich_text",
          variant: "default",
          content: `## Generationelle und regionale Variationen

Es wäre vereinfachend, alle deutschen Geschäftsumgebungen als monolithisch zu betrachten. Jüngere Unternehmen, insbesondere im Technologiesektor, tendieren zu informelleren Strukturen mit flacheren Hierarchien und weniger formeller Kommunikation.

Regionale Unterschiede existieren ebenfalls. Süddeutsche Geschäftskultur unterscheidet sich von norddeutscher; Berliner Startups operieren anders als etablierte mittelständische Unternehmen im Ruhrgebiet. Internationale Unternehmen mit deutscher Präsenz bringen wiederum ihre eigenen kulturellen Einflüsse ein.

Diese Variationen machen es umso wichtiger, die spezifische Kultur des jeweiligen Unternehmens und der handelnden Personen zu beobachten und zu verstehen, statt auf Stereotypen zu vertrauen. Die hier beschriebenen Tendenzen bieten einen Orientierungsrahmen, keine rigiden Regeln.`
        }
      },
      {
        id: `block_de_culture_${Date.now()}_cta`,
        type: "cta",
        order: 5,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Interkulturelle Kompetenz entwickeln",
          subheadline: "Verstehen Sie nicht nur die Sprache, sondern auch die kulturellen Nuancen erfolgreicher Geschäftskommunikation.",
          primaryButton: { text: "Beratung anfragen", href: "/contact" },
          trustBadge: "Über 20 Jahre Erfahrung in Deutschland"
        }
      }
    ]
  }
];

// Old German slugs that need to be cleaned up (replaced with English equivalents)
const oldSlugsToDelete = [
  "interaktive-spiele-englisch-lernen",
  "business-english-phrasen-fuer-profis",
  "englische-praepositionen-meistern",
  "tipps-geschaefts-emails-englisch",
  "present-perfect-leitfaden",
  "wichtige-phrasen-erstes-geschaeftstreffen",
  "business-vokabular-interaktive-spiele",
  "deutsche-geschaeftskultur-verstehen",
  "business-english-praesentationen-meistern",
  "email-etikette-fuer-profis",
];

async function cleanupOldSlugs() {
  console.log("Cleaning up old German slugs...\n");

  for (const slug of oldSlugsToDelete) {
    try {
      const existing = await client.query(api.landing.getBlogPost, {
        locale: "de",
        slug
      });

      if (existing) {
        await client.mutation(api.landing.deleteBlogPost, {
          id: existing._id
        });
        console.log(`  Deleted old slug: ${slug}`);
      }
    } catch (error) {
      // Ignore errors - post might not exist
    }
  }

  console.log("");
}

async function seedGermanPosts() {
  console.log("Starting German blog post seeding (Professional content)...\n");

  // First, clean up old slugs
  await cleanupOldSlugs();

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const post of germanPosts) {
    try {
      // Check if post already exists
      const existing = await client.query(api.landing.getBlogPost, {
        locale: post.locale,
        slug: post.slug
      });

      if (existing) {
        // Delete existing post to update with new content
        console.log(`Updating: ${post.slug}`);
        await client.mutation(api.landing.deleteBlogPost, {
          id: existing._id
        });
        updated++;
      }

      // Create the post
      await client.mutation(api.landing.createBlogPost, {
        locale: post.locale,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content || "",
        contentBlocks: post.contentBlocks,
        contentVersion: post.contentVersion || 2,
        author: post.author,
        category: post.category,
        tags: post.tags,
        featuredImageUrl: post.featuredImageUrl,
        readTimeMinutes: post.readTimeMinutes,
        status: post.status
      });

      console.log(`Created: ${post.slug}`);
      created++;
    } catch (error) {
      console.error(`Error creating ${post.slug}:`, error);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log("=".repeat(50));
}

// Run the seeder
seedGermanPosts()
  .then(() => {
    console.log("\nGerman blog post seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
