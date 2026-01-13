import { internalMutation } from "./_generated/server";

// Seed the landing page CMS with initial content
export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingFaqs = await ctx.db.query("landingFaq").first();
    if (existingFaqs) {
      console.log("Landing content already seeded, skipping...");
      return { status: "already_seeded" };
    }

    const now = Date.now();

    // ========== ENGLISH FAQs ==========
    const englishFaqs = [
      {
        question: "How long does it take to see results?",
        answer: "Most clients notice improved confidence within 4-6 sessions. Significant fluency gains typically occur within 3-6 months of regular training.",
        category: "general",
      },
      {
        question: "Do you offer online training?",
        answer: "Yes! Online training is available via video call and works just as effectively as face-to-face sessions. Many of our clients prefer this format for its flexibility.",
        category: "services",
      },
      {
        question: "What is the Questions Method?",
        answer: "The Questions Method is our unique approach where we build each session around real questions and situations you face at work, making the training immediately applicable.",
        category: "methodology",
      },
      {
        question: "Can you train our whole team?",
        answer: "Absolutely. We offer group training for corporate teams, with content customized to your industry and company needs.",
        category: "services",
      },
      {
        question: "What's your cancellation policy?",
        answer: "We ask for 24 hours notice for cancellations. Lessons cancelled with less notice may be charged at the full rate.",
        category: "booking",
      },
      {
        question: "What are your prices?",
        answer: "Our online 1:1 sessions are €60 for 60 minutes or €80 for 90 minutes. Face-to-face training in Hannover or Berlin is €70 for 60 minutes or €100 for 90 minutes. Group training is available at reduced per-person rates. All language training is VAT-exempt.",
        category: "pricing",
      },
      {
        question: "Where are you located?",
        answer: "We have offices in Hannover and Berlin, and offer online training worldwide. Face-to-face sessions can be held at your office or our locations.",
        category: "general",
      },
      {
        question: "What languages do you teach?",
        answer: "We specialize in Business English for German speakers, and German for international employees. We also offer copy editing and translation services.",
        category: "services",
      },
    ];

    for (let i = 0; i < englishFaqs.length; i++) {
      await ctx.db.insert("landingFaq", {
        locale: "en",
        ...englishFaqs[i],
        order: i + 1,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ========== GERMAN FAQs ==========
    const germanFaqs = [
      {
        question: "Wie lange dauert es, bis man Ergebnisse sieht?",
        answer: "Die meisten Kunden bemerken nach 4-6 Sitzungen ein verbessertes Selbstvertrauen. Deutliche Fortschritte in der Sprachgewandtheit zeigen sich typischerweise nach 3-6 Monaten regelmäßigem Training.",
        category: "general",
      },
      {
        question: "Bieten Sie Online-Training an?",
        answer: "Ja! Online-Training ist per Videoanruf verfügbar und funktioniert genauso effektiv wie persönliche Sitzungen. Viele unserer Kunden bevorzugen dieses Format wegen seiner Flexibilität.",
        category: "services",
      },
      {
        question: "Was ist die Fragen-Methode?",
        answer: "Die Fragen-Methode ist unser einzigartiger Ansatz, bei dem wir jede Sitzung um echte Fragen und Situationen aus Ihrem Arbeitsalltag aufbauen, was das Training sofort anwendbar macht.",
        category: "methodology",
      },
      {
        question: "Können Sie unser gesamtes Team trainieren?",
        answer: "Absolut. Wir bieten Gruppentraining für Unternehmensteams an, mit Inhalten, die auf Ihre Branche und Ihre Unternehmensbedürfnisse zugeschnitten sind.",
        category: "services",
      },
      {
        question: "Wie ist Ihre Stornierungsrichtlinie?",
        answer: "Wir bitten um 24 Stunden Vorankündigung bei Stornierungen. Kurzfristiger abgesagte Unterrichtsstunden können vollständig berechnet werden.",
        category: "booking",
      },
      {
        question: "Was sind Ihre Preise?",
        answer: "Unsere Online 1:1-Sitzungen kosten 60€ für 60 Minuten oder 80€ für 90 Minuten. Präsenztraining in Hannover oder Berlin kostet 70€ für 60 Minuten oder 100€ für 90 Minuten. Gruppentraining ist zu reduzierten Pro-Person-Tarifen verfügbar. Sprachtraining ist umsatzsteuerbefreit.",
        category: "pricing",
      },
      {
        question: "Wo sind Sie ansässig?",
        answer: "Wir haben Büros in Hannover und Berlin und bieten Online-Training weltweit an. Präsenzsitzungen können in Ihrem Büro oder an unseren Standorten stattfinden.",
        category: "general",
      },
      {
        question: "Welche Sprachen unterrichten Sie?",
        answer: "Wir sind spezialisiert auf Business English für deutschsprachige Personen und Deutsch für internationale Mitarbeiter. Wir bieten auch Lektorat und Übersetzungsdienste an.",
        category: "services",
      },
    ];

    for (let i = 0; i < germanFaqs.length; i++) {
      await ctx.db.insert("landingFaq", {
        locale: "de",
        ...germanFaqs[i],
        order: i + 1,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ========== ENGLISH TESTIMONIALS ==========
    const englishTestimonials = [
      {
        name: "Dr. Sarah Mueller",
        company: "Volkswagen AG",
        role: "Head of International Relations",
        quote: "The training completely transformed how I communicate in meetings. I feel confident presenting to international stakeholders now.",
        rating: 5,
        isFeatured: true,
      },
      {
        name: "Michael Schmidt",
        company: "Deutsche Bank",
        role: "Senior Manager",
        quote: "Finally, English training that's actually relevant to my job. James understands what business professionals need.",
        rating: 5,
        isFeatured: true,
      },
      {
        name: "Anna Weber",
        company: "Siemens",
        role: "Marketing Director",
        quote: "The flexibility of online sessions combined with personalized content made all the difference for our team.",
        rating: 5,
        isFeatured: true,
      },
      {
        name: "Thomas Berger",
        company: "Continental AG",
        role: "Project Manager",
        quote: "I went from dreading English calls to leading international meetings with confidence. The Questions Method really works.",
        rating: 5,
        isFeatured: false,
      },
      {
        name: "Lisa Hoffmann",
        company: "TUI Group",
        role: "HR Director",
        quote: "We've trained over 50 employees with Simmonds Language Services. The results speak for themselves - improved communication across all levels.",
        rating: 5,
        isFeatured: false,
      },
    ];

    for (let i = 0; i < englishTestimonials.length; i++) {
      await ctx.db.insert("landingTestimonials", {
        locale: "en",
        ...englishTestimonials[i],
        order: i + 1,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ========== GERMAN TESTIMONIALS ==========
    const germanTestimonials = [
      {
        name: "Dr. Sarah Mueller",
        company: "Volkswagen AG",
        role: "Leiterin Internationale Beziehungen",
        quote: "Das Training hat meine Kommunikation in Meetings komplett transformiert. Ich präsentiere jetzt selbstbewusst vor internationalen Stakeholdern.",
        rating: 5,
        isFeatured: true,
      },
      {
        name: "Michael Schmidt",
        company: "Deutsche Bank",
        role: "Senior Manager",
        quote: "Endlich Englischtraining, das wirklich relevant für meinen Job ist. James versteht, was Business-Profis brauchen.",
        rating: 5,
        isFeatured: true,
      },
      {
        name: "Anna Weber",
        company: "Siemens",
        role: "Marketing-Direktorin",
        quote: "Die Flexibilität der Online-Sitzungen kombiniert mit personalisierten Inhalten hat für unser Team den Unterschied gemacht.",
        rating: 5,
        isFeatured: true,
      },
      {
        name: "Thomas Berger",
        company: "Continental AG",
        role: "Projektmanager",
        quote: "Von der Angst vor englischen Telefonaten zu selbstbewusster Leitung internationaler Meetings. Die Fragen-Methode funktioniert wirklich.",
        rating: 5,
        isFeatured: false,
      },
      {
        name: "Lisa Hoffmann",
        company: "TUI Group",
        role: "HR-Direktorin",
        quote: "Wir haben über 50 Mitarbeiter mit Simmonds Language Services geschult. Die Ergebnisse sprechen für sich - verbesserte Kommunikation auf allen Ebenen.",
        rating: 5,
        isFeatured: false,
      },
    ];

    for (let i = 0; i < germanTestimonials.length; i++) {
      await ctx.db.insert("landingTestimonials", {
        locale: "de",
        ...germanTestimonials[i],
        order: i + 1,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ========== ENGLISH BLOG POSTS ==========
    const englishBlogPosts = [
      {
        slug: "mastering-business-english-presentations",
        title: "Mastering Business English Presentations",
        excerpt: "Learn the key techniques for delivering confident and persuasive presentations in English.",
        content: `## Introduction

Delivering presentations in English can be daunting, especially when it's not your first language. But with the right preparation and techniques, you can present with confidence and impact.

## Key Techniques

### 1. Structure Your Message

A clear structure helps both you and your audience. Use the classic three-part structure:
- **Opening**: Hook your audience and state your purpose
- **Body**: Present your main points with supporting evidence
- **Closing**: Summarize and call to action

### 2. Use Simple, Direct Language

Avoid complex vocabulary and long sentences. Your goal is clarity, not showing off your vocabulary. Simple language is more persuasive and easier for international audiences to follow.

### 3. Practice, Practice, Practice

There's no substitute for rehearsal. Practice out loud, time yourself, and if possible, record yourself to identify areas for improvement.

## Common Phrases for Presentations

Here are some useful phrases to structure your presentation:

- "I'd like to start by..."
- "Let me move on to..."
- "To summarize..."
- "Are there any questions?"

## Conclusion

With these techniques and regular practice, you'll be delivering confident English presentations in no time. Remember, fluency comes with practice, not perfection.`,
        author: "James Simmonds",
        category: "Business English",
        tags: ["presentations", "speaking", "business"],
        readTimeMinutes: 5,
        status: "published" as const,
      },
      {
        slug: "email-etiquette-for-professionals",
        title: "Email Etiquette for International Professionals",
        excerpt: "Master the art of professional email communication with these essential tips and templates.",
        content: `## Why Email Etiquette Matters

In international business, email is often your first impression. A well-written email shows professionalism and builds trust.

## Key Principles

### 1. Clear Subject Lines

Your subject line should tell the recipient exactly what the email is about. Be specific: "Meeting Request: Q3 Budget Review - Thursday 2pm" is better than "Meeting".

### 2. Professional Greetings

- Formal: "Dear Mr./Ms. [Last Name]"
- Semi-formal: "Dear [First Name]"
- For groups: "Dear Team" or "Dear All"

### 3. Get to the Point

Busy professionals appreciate brevity. State your purpose in the first paragraph, then provide supporting details.

### 4. Clear Call to Action

End with a clear request or next step. "Please confirm by Friday" is clearer than "Let me know what you think."

## Templates You Can Use

**Requesting Information:**
"I am writing to inquire about... Could you please provide... I would appreciate receiving this information by [date]."

**Following Up:**
"I am following up on my email from [date] regarding... I would appreciate your response at your earliest convenience."

## Conclusion

Good email communication is a skill that improves with practice. Use these guidelines as a starting point, and adapt them to your company's culture.`,
        author: "James Simmonds",
        category: "Communication",
        tags: ["email", "writing", "professional"],
        readTimeMinutes: 4,
        status: "published" as const,
      },
      {
        slug: "german-business-culture",
        title: "Understanding German Business Culture",
        excerpt: "Navigate the nuances of German workplace culture and communication styles.",
        content: `## Introduction

Working in Germany or with German colleagues? Understanding the cultural context will help you communicate more effectively and build stronger professional relationships.

## Key Cultural Aspects

### 1. Directness

Germans value direct communication. What might seem blunt in other cultures is simply efficient in Germany. Don't take directness personally - it's a sign of respect.

### 2. Punctuality

Being on time is non-negotiable. Arriving late, even by 5 minutes, is considered disrespectful. Plan to arrive a few minutes early.

### 3. Formal Address

Use "Sie" (formal you) until invited to use "du" (informal). Address colleagues by their last name with Herr/Frau unless they suggest otherwise.

### 4. Planning and Structure

Germans appreciate thorough planning. Meetings have agendas, decisions are documented, and projects follow structured timelines.

### 5. Work-Life Separation

Germans typically separate work and personal life clearly. Avoid calling colleagues after hours unless it's urgent.

## Communication Tips

- Be prepared with data and facts to support your points
- Respect hierarchies, especially in traditional companies
- Written communication should be formal and well-structured
- Small talk is brief - get to business relatively quickly

## Conclusion

Understanding these cultural norms will help you succeed in the German business environment. When in doubt, err on the side of formality - it's easier to become less formal than to recover from appearing too casual.`,
        author: "James Simmonds",
        category: "Culture",
        tags: ["germany", "culture", "business"],
        readTimeMinutes: 6,
        status: "published" as const,
      },
    ];

    for (const post of englishBlogPosts) {
      await ctx.db.insert("blogPosts", {
        locale: "en",
        ...post,
        publishedAt: now - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random date in last 30 days
        createdAt: now,
        updatedAt: now,
      });
    }

    // ========== GERMAN BLOG POSTS ==========
    const germanBlogPosts = [
      {
        slug: "business-english-praesentationen-meistern",
        title: "Business English Präsentationen meistern",
        excerpt: "Lernen Sie die wichtigsten Techniken für selbstbewusste und überzeugende Präsentationen auf Englisch.",
        content: `## Einleitung

Präsentationen auf Englisch zu halten kann einschüchternd sein, besonders wenn es nicht Ihre Muttersprache ist. Aber mit der richtigen Vorbereitung und den richtigen Techniken können Sie selbstbewusst und wirkungsvoll präsentieren.

## Wichtige Techniken

### 1. Strukturieren Sie Ihre Botschaft

Eine klare Struktur hilft Ihnen und Ihrem Publikum. Nutzen Sie die klassische Dreiteilung:
- **Eröffnung**: Fesseln Sie Ihr Publikum und nennen Sie Ihr Ziel
- **Hauptteil**: Präsentieren Sie Ihre Hauptpunkte mit Belegen
- **Schluss**: Fassen Sie zusammen und rufen Sie zum Handeln auf

### 2. Verwenden Sie einfache, direkte Sprache

Vermeiden Sie komplexes Vokabular und lange Sätze. Ihr Ziel ist Klarheit, nicht Vokabelangabe. Einfache Sprache ist überzeugender.

### 3. Üben, üben, üben

Es gibt keinen Ersatz für Übung. Sprechen Sie laut, messen Sie die Zeit und nehmen Sie sich wenn möglich auf.

## Fazit

Mit diesen Techniken und regelmäßiger Übung werden Sie bald selbstbewusste englische Präsentationen halten.`,
        author: "James Simmonds",
        category: "Business English",
        tags: ["präsentationen", "sprechen", "business"],
        readTimeMinutes: 5,
        status: "published" as const,
      },
      {
        slug: "email-etikette-fuer-profis",
        title: "E-Mail-Etikette für internationale Fachleute",
        excerpt: "Meistern Sie die Kunst der professionellen E-Mail-Kommunikation mit diesen wichtigen Tipps.",
        content: `## Warum E-Mail-Etikette wichtig ist

Im internationalen Geschäft ist die E-Mail oft Ihr erster Eindruck. Eine gut geschriebene E-Mail zeigt Professionalität und schafft Vertrauen.

## Wichtige Prinzipien

### 1. Klare Betreffzeilen

Ihre Betreffzeile sollte dem Empfänger genau sagen, worum es in der E-Mail geht. Seien Sie spezifisch.

### 2. Professionelle Begrüßungen

- Formell: "Dear Mr./Ms. [Nachname]"
- Semi-formell: "Dear [Vorname]"
- Für Gruppen: "Dear Team" oder "Dear All"

### 3. Kommen Sie zum Punkt

Vielbeschäftigte Fachleute schätzen Kürze. Nennen Sie Ihr Anliegen im ersten Absatz.

## Fazit

Gute E-Mail-Kommunikation ist eine Fähigkeit, die sich mit Übung verbessert.`,
        author: "James Simmonds",
        category: "Kommunikation",
        tags: ["email", "schreiben", "professionell"],
        readTimeMinutes: 4,
        status: "published" as const,
      },
    ];

    for (const post of germanBlogPosts) {
      await ctx.db.insert("blogPosts", {
        locale: "de",
        ...post,
        publishedAt: now - Math.random() * 30 * 24 * 60 * 60 * 1000,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log("Landing content seeded successfully!");
    return {
      status: "seeded",
      counts: {
        faqsEN: englishFaqs.length,
        faqsDE: germanFaqs.length,
        testimonialsEN: englishTestimonials.length,
        testimonialsDE: germanTestimonials.length,
        blogPostsEN: englishBlogPosts.length,
        blogPostsDE: germanBlogPosts.length,
      },
    };
  },
});
