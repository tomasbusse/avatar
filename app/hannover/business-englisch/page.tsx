"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Presentation,
  Mail,
  Phone,
  Users,
  Briefcase,
  MessageSquare,
  Headphones,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  MapPin,
  Clock,
  Star,
  HelpCircle,
  Quote,
  Target,
  Award,
  Languages,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ReactNode> = {
  presentation: <Presentation className="w-8 h-8" />,
  mail: <Mail className="w-8 h-8" />,
  messageSquare: <MessageSquare className="w-8 h-8" />,
  phone: <Phone className="w-8 h-8" />,
  users: <Users className="w-8 h-8" />,
  book: <BookOpen className="w-8 h-8" />,
  briefcase: <Briefcase className="w-8 h-8" />,
  headphones: <Headphones className="w-8 h-8" />,
  clock: <Clock className="w-7 h-7" />,
  target: <Target className="w-7 h-7" />,
  award: <Award className="w-7 h-7" />,
  languages: <Languages className="w-7 h-7" />,
  heartHandshake: <HeartHandshake className="w-7 h-7" />,
};

// ============================================
// HERO SECTION - Matches home page HeroSection style
// ============================================
function CityHeroSection({ content }: { content: any }) {
  return (
    <section className="flex flex-col lg:flex-row min-h-[90vh] lg:min-h-screen items-center justify-center px-4 py-8 sm:p-6 lg:p-16 xl:p-20 bg-[#f3e9d2] gap-8 lg:gap-16 xl:gap-24 overflow-hidden">
      {/* Image/Visual Section */}
      <div className="relative w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[340px] shrink-0">
        <div
          className="relative rounded-[3rem] border-[12px] border-black overflow-hidden shadow-2xl bg-gray-900"
          style={{ aspectRatio: "9/18" }}
        >
          <div className="absolute inset-0 bg-[#f3e9d2] flex flex-col items-center justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-[#003F37]/20 flex items-center justify-center mb-4">
              <Briefcase className="w-12 h-12 text-[#003F37]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1a3c34] text-center mb-2">
              Business English
            </h3>
            <p className="text-sm text-[#4a4a4a] text-center">
              Hannover
            </p>
            <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-[#003F37]/10">
              <MapPin className="w-4 h-4 text-[#003F37]" />
              <span className="text-sm text-[#003F37] font-medium">Vor Ort & Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Matches home page exactly */}
      <div className="max-w-xl text-center lg:text-left flex flex-col gap-5">
        {/* Brand tagline */}
        <p className="text-[#b3592d] text-sm font-semibold uppercase tracking-widest">
          {content?.badge || "Seit über 20 Jahren"}
        </p>

        <h1 className="text-[#1a3c34] text-4xl lg:text-6xl font-serif leading-tight">
          {content?.title || "Business Englischkurse in Hannover"}
        </h1>

        <p className="text-[#4a4a4a] text-lg leading-relaxed max-w-lg">
          {content?.subtitle || "Professionelle Business Englischkurse für Ihre Mitarbeiter:innen und eine positive Zukunft."}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
          <Link
            href="/de/contact"
            className="bg-[#003F37] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#002a25] transition-all shadow-md active:scale-95"
          >
            Kostenlose Beratung
          </Link>
          <a
            href="tel:+4951147939339"
            className="bg-transparent border-2 border-[#003F37] text-[#003F37] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#003F37]/10 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            0511-473 9339
          </a>
        </div>

        {/* Features list */}
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2 text-sm text-[#4a4a4a]">
          {(content?.features || ["Hannover & Online", "Muttersprachler", "Blended Learning"]).map((feature: string, i: number) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b3592d]" />
              {feature}
            </span>
          ))}
        </div>

        {/* Decorative Separator */}
        <div className="flex items-center gap-4 py-2 justify-center lg:justify-start">
          <div className="h-px bg-gray-300 flex-grow max-w-[100px]" />
          <div className="w-2 h-2 rotate-45 border border-gray-400" />
          <div className="h-px bg-gray-300 flex-grow max-w-[100px]" />
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-1 justify-center lg:justify-start">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-4 h-4 text-orange-400 fill-current" />
          ))}
          <span className="ml-2 text-sm text-[#4a4a4a]">5.0 aus 6 Bewertungen</span>
        </div>
      </div>
    </section>
  );
}

// ============================================
// SERVICES GRID - Matches home page ServicesGrid
// ============================================
function CityServicesGrid({ content }: { content: any }) {
  const defaultServices = [
    { icon: "presentation", title: "Präsentationen", description: "Souveräne Präsentationen auf Englisch" },
    { icon: "mail", title: "E-Mails & Korrespondenz", description: "Professionelle schriftliche Kommunikation" },
    { icon: "messageSquare", title: "Meetings & Verhandlungen", description: "Aktive Teilnahme und Führung" },
    { icon: "phone", title: "Telefongespräche", description: "Selbstsicher kommunizieren" },
    { icon: "users", title: "Small Talk & Networking", description: "Beziehungen aufbauen" },
    { icon: "book", title: "Fachvokabular", description: "Branchenspezifische Terminologie" },
  ];

  const services = content?.items || defaultServices;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
            {content?.badge || "Was wir unterrichten"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
            {content?.title || "Business Englisch Themen"}
          </h2>
          <p className="text-lg text-sls-olive/70 max-w-2xl mx-auto">
            {content?.subtitle || "Natürlicher und situationsbezogener Sprachgebrauch kombiniert mit Grammatik"}
          </p>
        </div>

        {/* Services Grid - Same style as home page */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service: any, index: number) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 border-2 border-sls-beige hover:border-sls-teal/30 transition-all hover:shadow-xl hover:shadow-sls-teal/5 hover:-translate-y-1"
            >
              {/* Gradient Background on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sls-orange/20 to-sls-orange/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-sls-cream flex items-center justify-center text-sls-teal mb-6 group-hover:scale-110 transition-transform">
                  {iconMap[service.icon] || <Briefcase className="w-8 h-8" />}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-sls-teal mb-3 group-hover:text-sls-orange transition-colors">
                  {service.title}
                </h3>
                <p className="text-sls-olive/70 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// USP SECTION - Matches home page USPSection exactly
// ============================================
function CityUSPSection({ content }: { content: any }) {
  const defaultUSPs = [
    { icon: "clock", title: "Flexible Termine", description: "Training vor Ort oder online, angepasst an Ihren Zeitplan" },
    { icon: "users", title: "Maßgeschneidert", description: "Individuell konzipiert für Ihren Sprachbedarf" },
    { icon: "award", title: "20+ Jahre Erfahrung", description: "Renommierter Anbieter seit 1999" },
    { icon: "target", title: "Praxisorientiert", description: "Echte Arbeitssituationen im Fokus" },
    { icon: "languages", title: "Muttersprachler", description: "Qualifizierte native Speaker" },
    { icon: "heartHandshake", title: "Persönliche Betreuung", description: "Direkt von James Simmonds betreut" },
  ];

  const usps = content?.items || defaultUSPs;

  return (
    <section className="py-24 bg-sls-teal relative overflow-hidden">
      {/* Background Pattern - Same as home page */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sls-chartreuse/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sls-orange/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-sls-chartreuse text-sm font-semibold mb-4">
            {content?.badge || "Warum wir"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {content?.title || "Warum Simmonds Language Services?"}
          </h2>
          <p className="text-lg text-sls-beige/80 max-w-2xl mx-auto">
            {content?.subtitle || "Ihre Vorteile bei uns"}
          </p>
        </div>

        {/* USP Grid - Same style as home page */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {usps.map((usp: any, index: number) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-sls-chartreuse/20 flex items-center justify-center text-sls-chartreuse mb-4 group-hover:scale-110 transition-transform">
                {iconMap[usp.icon] || <Award className="w-7 h-7" />}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-2">
                {usp.title}
              </h3>
              <p className="text-sls-beige/70 leading-relaxed">
                {usp.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// TESTIMONIALS - Matches home page TestimonialsCarousel
// ============================================
function CityTestimonials({ content }: { content: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const defaultTestimonials = [
    { name: "Thomas M.", company: "Continental", role: "Project Manager", quote: "Das Training ist genau auf meine Bedürfnisse im Job zugeschnitten. Endlich echte Fortschritte!", rating: 5 },
    { name: "Dr. Sarah Mueller", company: "Volkswagen AG", role: "International Relations", quote: "Professionell, flexibel und effektiv. Die beste Investition in meine Karriere.", rating: 5 },
    { name: "Michael Schmidt", company: "TUI", role: "Senior Manager", quote: "Muttersprachler machen den Unterschied. Ich fühle mich jetzt sicher in Meetings.", rating: 5 },
  ];

  const testimonials = content?.items || defaultTestimonials;

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, testimonials.length]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-orange/10 text-sls-orange text-sm font-semibold mb-4">
            Kundenstimmen
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
            Was unsere Kunden sagen
          </h2>
        </div>

        {/* Testimonial Card - Same style as home page */}
        <div className="relative">
          <div className="bg-sls-cream rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-6 right-6 w-20 h-20 text-sls-teal/10">
              <Quote className="w-full h-full" />
            </div>

            {/* Content */}
            <div className="relative">
              {/* Rating */}
              {current.rating && (
                <div className="flex items-center gap-1 mb-6">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-sls-orange text-sls-orange" />
                  ))}
                </div>
              )}

              {/* Quote */}
              <blockquote className="text-xl sm:text-2xl text-sls-teal leading-relaxed mb-8 font-medium">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-sls-teal flex items-center justify-center text-white text-xl font-bold">
                  {current.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sls-teal">{current.name}</div>
                  {current.role && (
                    <div className="text-sls-olive text-sm">
                      {current.role}
                      {current.company && ` • ${current.company}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={goToPrev}
              className="p-3 rounded-full bg-sls-beige text-sls-teal hover:bg-sls-teal hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {testimonials.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => { setIsAutoPlaying(false); setCurrentIndex(index); }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex ? "w-8 bg-sls-teal" : "bg-sls-beige hover:bg-sls-teal/50"
                  )}
                />
              ))}
            </div>
            <button
              onClick={goToNext}
              className="p-3 rounded-full bg-sls-beige text-sls-teal hover:bg-sls-teal hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FAQ SECTION - Matches home page FAQAccordion
// ============================================
function CityFAQSection({ content }: { content: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const defaultFaqs = [
    { question: "Wo finde ich einen Business Englisch Kurs in Hannover?", answer: "Sprachdienste Simmonds ist ein renommierter Anbieter von Business Englisch Kursen in Hannover. Wir bieten Kurse für alle Niveaus an." },
    { question: "Welche Themen behandeln Sie?", answer: "Wir behandeln E-Mails, Meetings, Verhandlungen, Telefongespräche, Small Talk und branchenspezifisches Vokabular." },
    { question: "Wie kann ich Kontakt aufnehmen?", answer: "Telefonisch unter 0511-473 9339, per E-Mail an james@englisch-lehrer.com oder über unser Kontaktformular." },
  ];

  const faqs = content?.items || defaultFaqs;

  return (
    <section className="py-24 bg-sls-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
            <HelpCircle className="w-4 h-4" />
            Häufige Fragen
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-sls-teal mb-4">
            {content?.title || "Fragen & Antworten"}
          </h2>
          <p className="text-lg text-sls-olive/70">
            Haben Sie Fragen? Wir haben die Antworten.
          </p>
        </div>

        {/* Accordion - Same style as home page */}
        <div className="space-y-4">
          {faqs.map((faq: any, index: number) => (
            <div
              key={index}
              className="bg-white rounded-xl border-2 border-sls-beige overflow-hidden transition-all hover:border-sls-teal/30"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-sls-teal pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-sls-teal flex-shrink-0 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <p className="px-6 pb-6 text-sls-olive/70 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="text-center mt-8">
          <Link
            href="/de/faq"
            className="inline-flex items-center gap-2 text-sls-teal font-semibold hover:text-sls-orange transition-colors"
          >
            Alle Fragen anzeigen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA SECTION - Matches home page CTASection
// ============================================
function CityCTASection({ content }: { content: any }) {
  return (
    <section className="py-20 bg-gradient-to-br from-sls-orange to-sls-orange/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {content?.title || "Bereit für besseres Business Englisch?"}
        </h2>
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          {content?.subtitle || "Kontaktieren Sie uns noch heute für eine kostenlose Beratung."}
        </p>

        {/* CTA Buttons - Same style as home page */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/de/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-sls-orange font-semibold text-lg transition-all hover:bg-sls-cream active:scale-95"
          >
            Jetzt Beratung anfragen
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="tel:+4951147939339"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-lg transition-all hover:bg-white/20 active:scale-95"
          >
            <Phone className="w-5 h-5" />
            0511-473 9339
          </a>
        </div>

        {/* Trust Badge */}
        <p className="mt-8 text-sm text-white/60">
          {content?.trustBadge || "Über 20 Jahre Erfahrung • Muttersprachliche Trainer • Flexible Termine"}
        </p>
      </div>
    </section>
  );
}

// ============================================
// CONTENT SECTION - Text content blocks
// ============================================
function CityContentSection({ content }: { content: any }) {
  if (!content?.paragraphs?.length) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {content?.title && (
          <h2 className="text-3xl font-bold text-sls-teal mb-8 font-serif text-center">
            {content.title}
          </h2>
        )}
        <div className="prose prose-lg max-w-none">
          {content.paragraphs.map((paragraph: string, index: number) => (
            <p key={index} className="text-sls-olive/80 leading-relaxed mb-6 text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function BusinessEnglischHannoverPage() {
  // Fetch page data from Convex
  const page = useQuery(api.cityPages.getPublishedBySlug, {
    slug: "hannover/business-englisch",
  });

  // Build section content map
  const getContent = (sectionId: string) => {
    if (!page?.sections) return {};
    const section = page.sections.find((s) => s.id === sectionId);
    return section?.content || {};
  };

  // Sort sections by order
  const sortedSections = page?.sections
    ? [...page.sections].sort((a, b) => a.order - b.order)
    : [];

  // Render section by type
  const renderSection = (section: any) => {
    const content = section.content || {};

    // Check for testimonials first (can be stored as type "content" with id "testimonials")
    if (section.id === "testimonials") {
      return <CityTestimonials key={section.id} content={content} />;
    }

    switch (section.type) {
      case "hero":
        return <CityHeroSection key={section.id} content={content} />;
      case "content":
        return <CityContentSection key={section.id} content={content} />;
      case "services":
        return <CityServicesGrid key={section.id} content={content} />;
      case "features":
        return <CityUSPSection key={section.id} content={content} />;
      case "faq":
        return <CityFAQSection key={section.id} content={content} />;
      case "cta":
        return <CityCTASection key={section.id} content={content} />;
      default:
        return null;
    }
  };

  // If no sections from DB, render default layout
  if (!page?.sections?.length) {
    return (
      <>
        <CityHeroSection content={{}} />
        <CityContentSection content={{
          title: "Business Englischunterricht für Ihre Mitarbeiter",
          paragraphs: [
            "Sind Sie auf der Suche nach einem Englischkurs für Ihre Mitarbeiter? Um Ihren Mitarbeiter den bestmöglichen Lernerfolg in Business Englisch zu garantieren, konzipieren wir unseren Englischunterricht stets entsprechend des spezifischen Sprachbedarfs Ihrer Firma.",
          ],
        }} />
        <CityServicesGrid content={{}} />
        <CityUSPSection content={{}} />
        <CityTestimonials content={{}} />
        <CityFAQSection content={{}} />
        <CityCTASection content={{}} />
      </>
    );
  }

  return <>{sortedSections.map(renderSection)}</>;
}
