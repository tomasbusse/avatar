/**
 * Seed German Blog Posts
 *
 * This script creates German translations for all English blog posts
 * to ensure locale parity and prevent 404 pages.
 *
 * Run with: npx ts-node scripts/seed-german-blog-posts.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

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

// German translations for all missing blog posts
const germanPosts: BlogPostData[] = [
  // 1. Interactive Games (translating interactive-games-learn-english)
  {
    locale: "de",
    slug: "interaktive-spiele-englisch-lernen",
    title: "Interaktive Spiele: Der unterhaltsame Weg Englisch zu lernen",
    excerpt: "Entdecken Sie, wie interaktive Spiele Ihr Englischlernen transformieren können. Von Vokabelzuordnung bis Satzbau – erkunden Sie unsere fesselnden Lerntools.",
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
          title: "Interaktive Spiele: Der unterhaltsame Weg Englisch zu lernen",
          subtitle: "Entdecken Sie, wie interaktive Spiele Ihr Englischlernen transformieren können. Von Vokabelzuordnung bis Satzbau – erkunden Sie unsere fesselnden Lerntools.",
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
          content: `## Warum Spiele beim Sprachenlernen funktionieren

Erinnern Sie sich, wie leicht Sie als Kind gelernt haben? Durch Spielen! Forschung zeigt, dass spielbasiertes Lernen:

- **Die Merkfähigkeit um 40% erhöht** im Vergleich zu passivem Lernen
- **Angst vor Fehlern reduziert**
- **Automatisierung aufbaut** – Sie beginnen Wörter ohne Nachdenken zu verwenden
- **Sofortiges Feedback gibt**, damit Sie schneller lernen

Bei der Simmonds Language School haben wir interaktive Spiele direkt in unseren Unterricht integriert. So funktionieren sie und warum sie so effektiv sind.

---

## Unsere Spieltypen

### 🎯 Vokabelzuordnung

**Was ist das?** Ordnen Sie englische Wörter ihren deutschen Übersetzungen, Bildern oder Definitionen zu.

**Warum es funktioniert**: Dieses klassische Format nutzt verteiltes Wiederholen und sofortiges Feedback. Wenn Sie richtig zuordnen, stärkt Ihr Gehirn die Verbindung. Wenn nicht, lernen Sie sofort.

**Ideal für**: Neues Vokabular lernen, vor Prüfungen wiederholen, Wortassoziationen aufbauen.

---

### 🧩 Satzbaukasten

**Was ist das?** Ordnen Sie Wortkacheln an, um grammatisch korrekte Sätze zu bilden.

**Warum es funktioniert**: Sie konstruieren aktiv Sprache, anstatt sie passiv zu erkennen. Diese "produktive Übung" ist entscheidend für fließendes Sprechen.

**Ideal für**: Grammatikübungen, Wortstellungsherausforderungen, Satzstruktur verstehen.`
        }
      },
      {
        id: `block_de_games_${Date.now()}_quote`,
        type: "quote",
        order: 2,
        config: {
          type: "quote",
          variant: "highlighted",
          text: "Früher habe ich Grammatikübungen gefürchtet. Jetzt freue ich mich sogar auf den Spielteil meiner Stunden. Es fühlt sich nicht wie Lernen an!",
          attribution: "Maria K.",
          role: "Studentin",
          company: "B2 Level"
        }
      },
      {
        id: `block_de_games_${Date.now()}_content2`,
        type: "rich_text",
        order: 3,
        config: {
          type: "rich_text",
          variant: "default",
          content: `### 🔤 Lückentext

**Was ist das?** Vervollständigen Sie Sätze mit dem richtigen Wort, der richtigen Präposition oder Verbform.

**Warum es funktioniert**: Es ahmt echte Kommunikation nach, bei der Sie Sprache im Kontext produzieren müssen. Sie können die Antwort nicht nur erkennen – Sie müssen sie abrufen.

**Ideal für**: Präpositionsübungen, Verbzeiten, Phrasal Verbs.

---

## Tipps zur Maximierung des spielbasierten Lernens

### 1. **Nicht hetzen**
Das Ziel ist nicht, am schnellsten fertig zu sein – es geht ums Lernen. Nehmen Sie sich Zeit, jede Option zu lesen und darüber nachzudenken, warum Antworten richtig oder falsch sind.

### 2. **Fehler überprüfen**
Notieren Sie nach jedem Spiel die Wörter oder Muster, die Sie verpasst haben. Das sind Ihre Lernchancen!

### 3. **Wiederholen**
Verteiltes Wiederholen ist mächtig. Das gleiche Spiel einen Tag später und dann eine Woche später zu spielen, verbessert die Merkfähigkeit dramatisch.`
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
          title: "Bereit es auszuprobieren?",
          content: "In Ihrer nächsten Stunde mit Emma, fragen Sie nach einem Vokabelspiel! Sagen Sie einfach 'Können wir ein Spiel spielen?' oder 'Ich möchte mit Spielen üben' und Emma öffnet das Materialien-Panel mit verfügbaren Spielen."
        }
      },
      {
        id: `block_de_games_${Date.now()}_cta`,
        type: "cta",
        order: 5,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Beginnen Sie spielerisch zu lernen",
          subheadline: "Erleben Sie interaktives Lernen mit Emma. Ihre erste Stunde beinhaltet Zugang zu unserer vollständigen Spielebibliothek.",
          primaryButton: { text: "Erstes Spiel ausprobieren", href: "/contact" },
          secondaryButton: { text: "Alle Spiele ansehen", href: "/lessons" },
          trustBadge: "100+ interaktive Spiele verfügbar"
        }
      }
    ]
  },

  // 2. Business English Phrases (translating business-english-phrases-professionals)
  {
    locale: "de",
    slug: "business-english-phrasen-fuer-profis",
    title: "10 Business English Phrasen, die jeder Profi kennen sollte",
    excerpt: "Meistern Sie die wichtigsten Business English Phrasen für Meetings, E-Mails und Präsentationen. Praktische Beispiele für den Berufsalltag.",
    author: "James Simmonds",
    category: "Business English",
    tags: ["business", "phrasen", "meetings", "kommunikation", "professionell"],
    readTimeMinutes: 7,
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
          title: "10 Business English Phrasen, die jeder Profi kennen sollte",
          subtitle: "Meistern Sie die wichtigsten Business English Phrasen für Meetings, E-Mails und Präsentationen.",
          badge: "Business English",
          author: "James Simmonds",
          readTimeMinutes: 7,
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
          content: `## Warum diese Phrasen wichtig sind

Im internationalen Geschäftsleben ist die richtige Wortwahl entscheidend. Diese 10 Phrasen helfen Ihnen, professioneller und selbstbewusster zu kommunizieren.

---

## Die Top 10 Phrasen

### 1. "I'd like to touch base with you..."
**Bedeutung**: Ich möchte mich mit Ihnen kurz abstimmen.
**Verwendung**: Für informelle Check-ins oder Updates.

### 2. "Going forward..."
**Bedeutung**: In Zukunft, ab jetzt.
**Verwendung**: Um über zukünftige Pläne oder Änderungen zu sprechen.

### 3. "Let's circle back on this..."
**Bedeutung**: Lassen Sie uns später darauf zurückkommen.
**Verwendung**: Wenn ein Thema mehr Zeit braucht oder vertagt werden soll.

### 4. "I'll keep you in the loop."
**Bedeutung**: Ich halte Sie auf dem Laufenden.
**Verwendung**: Um Updates zu versprechen.

### 5. "We're on the same page."
**Bedeutung**: Wir sind einer Meinung / verstehen uns.
**Verwendung**: Um Übereinstimmung zu signalisieren.

### 6. "Could you elaborate on that?"
**Bedeutung**: Könnten Sie das näher erläutern?
**Verwendung**: Um mehr Details zu erfragen.

### 7. "Let's take this offline."
**Bedeutung**: Lassen Sie uns das separat besprechen.
**Verwendung**: Um Diskussionen aus einem Meeting zu verlagern.

### 8. "I'll follow up on this."
**Bedeutung**: Ich kümmere mich darum.
**Verwendung**: Um Verantwortung zu übernehmen.

### 9. "To summarize..."
**Bedeutung**: Zusammenfassend...
**Verwendung**: Um Kernpunkte zu rekapitulieren.

### 10. "Moving forward..."
**Bedeutung**: Was die nächsten Schritte betrifft...
**Verwendung**: Um zum Handeln überzuleiten.`
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_callout`,
        type: "callout",
        order: 2,
        config: {
          type: "callout",
          variant: "info",
          icon: "Lightbulb",
          title: "Tipp",
          content: "Üben Sie diese Phrasen in Ihren nächsten Meetings. Je öfter Sie sie verwenden, desto natürlicher werden sie klingen."
        }
      },
      {
        id: `block_de_phrases_${Date.now()}_cta`,
        type: "cta",
        order: 3,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Verbessern Sie Ihr Business English",
          subheadline: "Buchen Sie eine kostenlose Beratung und erfahren Sie, wie wir Ihr professionelles Englisch auf das nächste Level bringen.",
          primaryButton: { text: "Kostenlose Beratung", href: "/contact" },
          trustBadge: "Über 20 Jahre Erfahrung"
        }
      }
    ]
  },

  // 3. Master English Prepositions (translating master-english-prepositions)
  {
    locale: "de",
    slug: "englische-praepositionen-meistern",
    title: "Englische Präpositionen spielerisch meistern",
    excerpt: "Endlich in/on/at verstehen! Praktische Tipps und interaktive Übungen für deutsche Muttersprachler, um englische Präpositionen zu beherrschen.",
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
          title: "Englische Präpositionen spielerisch meistern",
          subtitle: "Endlich in/on/at verstehen! Praktische Tipps und interaktive Übungen für deutsche Muttersprachler.",
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
          content: `## Warum Präpositionen für Deutsche schwierig sind

Deutsche und englische Präpositionen funktionieren unterschiedlich. Während "im Bus" auf Deutsch mit "in" funktioniert, heißt es auf Englisch "on the bus". Diese Unterschiede verwirren viele Lernende.

---

## Die wichtigsten Regeln

### Zeit-Präpositionen

| Englisch | Deutsch | Beispiel |
|----------|---------|----------|
| at | um (Uhrzeit) | at 3 o'clock |
| on | am (Tag) | on Monday |
| in | im/in (Monat, Jahr) | in January, in 2024 |

### Ort-Präpositionen

| Englisch | Deutsch | Beispiel |
|----------|---------|----------|
| at | an/bei | at the station |
| on | auf | on the table |
| in | in | in the room |

---

## Typische deutsche Fehler

1. **"I'm at home" vs. "I'm in home"** ❌
   → Richtig: "I'm at home" ✓

2. **"on the weekend" vs. "at the weekend"**
   → Beides möglich (US vs. UK)

3. **"in the bus" vs. "on the bus"** ❌
   → Richtig: "on the bus" ✓`
        }
      },
      {
        id: `block_de_prep_${Date.now()}_callout`,
        type: "callout",
        order: 2,
        config: {
          type: "callout",
          variant: "success",
          icon: "Gamepad2",
          title: "Üben Sie mit unserem Spiel!",
          content: "Unser Präpositions-Matching-Spiel hilft Ihnen, die richtigen Kombinationen zu lernen. Probieren Sie es in Ihrer nächsten Stunde mit Emma!"
        }
      },
      {
        id: `block_de_prep_${Date.now()}_cta`,
        type: "cta",
        order: 3,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Präpositionen endlich verstehen",
          subheadline: "Mit interaktiven Übungen und persönlichem Feedback meistern Sie englische Präpositionen schneller.",
          primaryButton: { text: "Jetzt üben", href: "/contact" },
          trustBadge: "Speziell für deutsche Sprecher entwickelt"
        }
      }
    ]
  },

  // 4. Business Email Tips (translating business-email-tips)
  {
    locale: "de",
    slug: "tipps-geschaefts-emails-englisch",
    title: "Professionelle E-Mails auf Englisch schreiben",
    excerpt: "Lernen Sie, wie Sie professionelle Geschäfts-E-Mails auf Englisch verfassen. Von der Betreffzeile bis zur Signatur.",
    author: "James Simmonds",
    category: "Kommunikation",
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
          title: "Professionelle E-Mails auf Englisch schreiben",
          subtitle: "Lernen Sie, wie Sie professionelle Geschäfts-E-Mails auf Englisch verfassen.",
          badge: "Kommunikation",
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
          content: `## Warum professionelle E-Mails wichtig sind

Im internationalen Geschäftsverkehr ist die E-Mail oft Ihr erster Eindruck. Eine gut formulierte E-Mail zeigt Professionalität und schafft Vertrauen.

---

## Die Struktur einer professionellen E-Mail

### 1. Betreffzeile
- Klar und spezifisch
- Beispiel: "Meeting Request: Q2 Budget Review"

### 2. Anrede
- Formell: "Dear Mr./Ms. [Name]"
- Semi-formell: "Dear [Vorname]"
- Für Gruppen: "Dear Team" oder "Dear All"

### 3. Einleitung
- Kommen Sie schnell zum Punkt
- Beispiel: "I'm writing to follow up on our conversation about..."

### 4. Hauptteil
- Ein Absatz pro Thema
- Klar und präzise

### 5. Abschluss
- Nächste Schritte benennen
- "Please let me know if you have any questions."

### 6. Gruß
- "Best regards," (Standard)
- "Kind regards," (Etwas wärmer)
- "Sincerely," (Sehr formell)`
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
          content: "Vermeiden Sie deutsche Direktübersetzungen wie 'With friendly greetings' (Mit freundlichen Grüßen). Im Englischen sagt man einfach 'Best regards' oder 'Kind regards'."
        }
      },
      {
        id: `block_de_email_${Date.now()}_cta`,
        type: "cta",
        order: 3,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Verbessern Sie Ihre E-Mail-Kommunikation",
          subheadline: "Lernen Sie in persönlichen Sitzungen, wie Sie professionell und selbstbewusst auf Englisch kommunizieren.",
          primaryButton: { text: "Kostenlose Beratung", href: "/contact" },
          trustBadge: "Praxisnahe Übungen mit echten Beispielen"
        }
      }
    ]
  },

  // 5. Present Perfect Guide (translating present-perfect-guide)
  {
    locale: "de",
    slug: "present-perfect-leitfaden",
    title: "Das Present Perfect verstehen und richtig anwenden",
    excerpt: "Ein umfassender Leitfaden zum Present Perfect für deutsche Muttersprachler. Wann verwendet man es und wie unterscheidet es sich vom Simple Past?",
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
          title: "Das Present Perfect verstehen und richtig anwenden",
          subtitle: "Ein umfassender Leitfaden zum Present Perfect für deutsche Muttersprachler.",
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
          content: `## Warum das Present Perfect schwierig ist

Im Deutschen verwenden wir das Perfekt ("Ich habe gemacht") fast immer für die Vergangenheit. Im Englischen gibt es einen wichtigen Unterschied zwischen Present Perfect und Simple Past.

---

## Die Grundregel

**Present Perfect**: Verbindung zur Gegenwart
**Simple Past**: Abgeschlossene Vergangenheit

---

## Wann verwendet man das Present Perfect?

### 1. Erfahrungen (ohne Zeitangabe)
- "I have been to London." ✓
- "I was in London last year." (mit Zeitangabe → Simple Past)

### 2. Bis jetzt andauernde Zustände
- "I have worked here for 5 years." (Ich arbeite immer noch hier)
- "I worked there for 5 years." (Ich arbeite dort nicht mehr)

### 3. Kürzliche Ereignisse mit Gegenwartsbezug
- "I have just finished the report." (gerade eben)
- "I have already sent the email." (schon)

---

## Signalwörter

| Present Perfect | Simple Past |
|-----------------|-------------|
| ever, never | yesterday |
| already, yet | last week/month/year |
| just, recently | in 2020 |
| so far, until now | ago |
| for, since | when I was... |`
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
          title: "Eselsbrücke",
          content: "Wenn Sie im Deutschen 'schon mal' sagen würden, verwenden Sie im Englischen oft das Present Perfect: 'Have you ever been to Paris?' (Waren Sie schon mal in Paris?)"
        }
      },
      {
        id: `block_de_pp_${Date.now()}_cta`,
        type: "cta",
        order: 3,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Grammatik mit System lernen",
          subheadline: "Unsere erfahrenen Trainer helfen Ihnen, englische Grammatik zu verstehen und sicher anzuwenden.",
          primaryButton: { text: "Probestunde buchen", href: "/contact" },
          trustBadge: "Auf deutsche Sprecher spezialisiert"
        }
      }
    ]
  },

  // 6. Essential Phrases for German Meetings (translating essential-phrases-first-german-meeting)
  {
    locale: "de",
    slug: "wichtige-phrasen-erstes-geschaeftstreffen",
    title: "10 wichtige Phrasen für Ihr erstes Geschäftstreffen auf Englisch",
    excerpt: "Souverän ins erste englische Meeting: Die wichtigsten Phrasen für einen professionellen Eindruck.",
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
          title: "10 wichtige Phrasen für Ihr erstes Geschäftstreffen auf Englisch",
          subtitle: "Souverän ins erste englische Meeting: Die wichtigsten Phrasen für einen professionellen Eindruck.",
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
          content: `## Vor dem Meeting

### 1. Sich vorstellen
- "Nice to meet you. I'm [Name] from [Abteilung]."
- "I've heard a lot about your work."

### 2. Small Talk
- "How was your journey?"
- "Have you been to [Stadt] before?"

---

## Während des Meetings

### 3. Meinung äußern
- "In my opinion..."
- "From my perspective..."
- "I believe that..."

### 4. Nachfragen
- "Could you please clarify that?"
- "What exactly do you mean by...?"
- "Could you give an example?"

### 5. Zustimmen
- "I agree with you on that point."
- "That's a good point."
- "I see what you mean."

### 6. Höflich widersprechen
- "I see your point, but..."
- "That's an interesting perspective. However..."
- "I understand, but have you considered...?"

---

## Am Ende des Meetings

### 7. Zusammenfassen
- "To summarize the main points..."
- "So, we agreed that..."

### 8. Nächste Schritte
- "The next steps are..."
- "I'll send you a summary by..."

### 9. Verabschiedung
- "Thank you for your time."
- "I look forward to our next meeting."
- "It was a pleasure meeting you."`
        }
      },
      {
        id: `block_de_meeting_${Date.now()}_cta`,
        type: "cta",
        order: 2,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Sicher in englischen Meetings",
          subheadline: "Trainieren Sie Meeting-Situationen mit unseren erfahrenen Trainern.",
          primaryButton: { text: "Meeting-Training anfragen", href: "/contact" },
          trustBadge: "Praktische Rollenspiele inklusive"
        }
      }
    ]
  },

  // 7. Master Business Vocabulary (translating master-business-vocabulary-interactive-games)
  {
    locale: "de",
    slug: "business-vokabular-interaktive-spiele",
    title: "Business-Vokabular mit interaktiven Spielen meistern",
    excerpt: "Lernen Sie wichtiges Business-Vokabular durch spielerische Übungen. Effektiver als Vokabellisten auswendig lernen!",
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
          title: "Business-Vokabular mit interaktiven Spielen meistern",
          subtitle: "Lernen Sie wichtiges Business-Vokabular durch spielerische Übungen.",
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
          content: `## Warum Spiele beim Vokabellernen funktionieren

Studien zeigen: Interaktives Lernen ist 3x effektiver als passives Auswendiglernen. Durch Spiele:

- Bleiben Wörter länger im Gedächtnis
- Lernen Sie Wörter im Kontext
- Macht das Lernen mehr Spaß

---

## Unsere beliebtesten Business-Vokabel-Spiele

### 1. Branchen-Memory
Ordnen Sie Fachbegriffe ihren Definitionen zu. Ideal für branchenspezifisches Vokabular.

### 2. Meeting-Phrasen-Quiz
Welche Phrase passt zur Situation? Trainieren Sie typische Meeting-Ausdrücke.

### 3. E-Mail-Satzbaukasten
Bauen Sie professionelle E-Mail-Sätze aus einzelnen Bausteinen.

---

## Themen, die wir abdecken

- **Finanzen**: Budget, forecast, quarterly results
- **Marketing**: Campaign, target audience, ROI
- **HR**: Onboarding, performance review, compensation
- **IT**: Implementation, deployment, scalability
- **Vertrieb**: Pipeline, conversion, lead generation`
        }
      },
      {
        id: `block_de_vocab_${Date.now()}_cta`,
        type: "cta",
        order: 2,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Erweitern Sie Ihren Business-Wortschatz",
          subheadline: "Mit unseren interaktiven Spielen lernen Sie branchenspezifisches Vokabular schnell und nachhaltig.",
          primaryButton: { text: "Jetzt starten", href: "/contact" },
          trustBadge: "Maßgeschneidert für Ihre Branche"
        }
      }
    ]
  },

  // 8. German Business Culture (translating german-business-culture)
  {
    locale: "de",
    slug: "deutsche-geschaeftskultur-verstehen",
    title: "Deutsche Geschäftskultur für internationale Fachkräfte",
    excerpt: "Verstehen Sie die Besonderheiten der deutschen Geschäftskultur. Tipps für erfolgreiche Zusammenarbeit mit deutschen Kollegen.",
    author: "James Simmonds",
    category: "Kultur",
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
          title: "Deutsche Geschäftskultur für internationale Fachkräfte",
          subtitle: "Verstehen Sie die Besonderheiten der deutschen Geschäftskultur.",
          badge: "Kultur",
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
          content: `## Die Grundpfeiler der deutschen Geschäftskultur

### 1. Pünktlichkeit
In Deutschland ist Pünktlichkeit nicht nur höflich – sie ist ein Muss. "Fünf Minuten vor der Zeit ist die deutsche Pünktlichkeit."

### 2. Direktheit
Deutsche kommunizieren direkt und sachlich. Was in anderen Kulturen als unhöflich gelten könnte, ist hier effizient.

### 3. Gründlichkeit
"Gründlich" ist ein deutsches Prinzip. Projekte werden detailliert geplant und sorgfältig umgesetzt.

### 4. Formalität
Der formelle Umgang (Sie-Form, Titel) ist Standard, besonders am Anfang einer Geschäftsbeziehung.

---

## Praktische Tipps

### Für Meetings
- Kommen Sie vorbereitet und pünktlich
- Bringen Sie alle relevanten Unterlagen mit
- Erwarten Sie strukturierte Agenden

### Für E-Mails
- Verwenden Sie die formelle Anrede (Sehr geehrte/r...)
- Bleiben Sie sachlich und präzise
- Achten Sie auf korrekte Titel

### Für Verhandlungen
- Seien Sie gut vorbereitet mit Fakten und Zahlen
- Erwarten Sie detaillierte Diskussionen
- Geduld ist wichtig – Entscheidungen brauchen Zeit`
        }
      },
      {
        id: `block_de_culture_${Date.now()}_quote`,
        type: "quote",
        order: 2,
        config: {
          type: "quote",
          variant: "highlighted",
          text: "Nach 25 Jahren in Deutschland habe ich gelernt: Deutsche Direktheit ist Respekt. Man nimmt Sie ernst genug, um ehrlich zu sein.",
          attribution: "James Simmonds",
          role: "Gründer",
          company: "SLS"
        }
      },
      {
        id: `block_de_culture_${Date.now()}_cta`,
        type: "cta",
        order: 3,
        config: {
          type: "cta",
          variant: "accent",
          headline: "Interkulturelle Kompetenz entwickeln",
          subheadline: "Verstehen Sie nicht nur die Sprache, sondern auch die Kultur. Unsere Trainer haben jahrzehntelange Erfahrung.",
          primaryButton: { text: "Beratung anfragen", href: "/contact" },
          trustBadge: "Über 20 Jahre Erfahrung in Deutschland"
        }
      }
    ]
  }
];

async function seedGermanPosts() {
  console.log("🇩🇪 Starting German blog post seeding...\n");

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of germanPosts) {
    try {
      // Check if post already exists
      const existing = await client.query(api.landing.getBlogPost, {
        locale: post.locale,
        slug: post.slug
      });

      if (existing) {
        console.log(`⏭️  Skipped (exists): ${post.slug}`);
        skipped++;
        continue;
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

      console.log(`✅ Created: ${post.slug} - "${post.title}"`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${post.slug}:`, error);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log("=".repeat(50));
}

// Run the seeder
seedGermanPosts()
  .then(() => {
    console.log("\n🎉 German blog post seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
