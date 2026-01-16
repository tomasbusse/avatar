"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Phone as PhoneIcon, PhoneOff, MessageCircle, Send, ArrowLeft, User, Mail, Phone, Building2 } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Dynamically import the avatar wrapper with SSR disabled to prevent hydration errors
const ClientAvatarWrapper = dynamic(
  () => import("./ClientAvatarWrapper").then((mod) => mod.ClientAvatarWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-sls-beige to-sls-cream flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-sls-teal/10 animate-pulse" />
      </div>
    ),
  }
);

interface HeroSectionProps {
  avatarId?: string;
  showAvatar?: boolean;
}

export function HeroSection({ avatarId, showAvatar = true }: HeroSectionProps) {
  const locale = useLocale();
  const [showContactForm, setShowContactForm] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitContact = useMutation(api.landing.submitContactForm);

  // Handle stop button click to flip to contact form
  const handleStopClick = useCallback(() => {
    setShowContactForm(true);
    // On mobile, scroll to the phone
    setTimeout(() => {
      const phoneEl = document.querySelector('[data-phone-display]');
      if (phoneEl) {
        phoneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;

    setIsSubmitting(true);
    try {
      await submitContact({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone || undefined,
        company: contactForm.company || undefined,
        message: contactForm.message,
        locale,
        source: "hero_cta",
      });

      const emailResponse = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone || undefined,
          company: contactForm.company || undefined,
          message: contactForm.message,
          locale,
        }),
      });

      if (!emailResponse.ok) {
        console.warn("Email send failed, but form was saved");
      }

      setSubmitSuccess(true);
      setContactForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-sls-cream overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle, #003F37 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-8rem)]">

          {/* LEFT SIDE: Mobile Phone with Avatar */}
          <div className="order-1 flex justify-center lg:justify-start">
            <div className="relative" data-phone-display>
              {/* Phone Frame */}
              <div className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a1a] rounded-b-2xl z-10 flex items-center justify-center">
                  <div className="w-16 h-4 bg-black rounded-full" />
                </div>

                {/* Phone screen - Flippable */}
                <div
                  className="relative w-72 h-[520px] rounded-[2.5rem] overflow-hidden bg-sls-cream"
                  style={{ perspective: "1000px" }}
                >
                  <div
                    className={cn(
                      "absolute inset-0 transition-transform duration-700 ease-in-out",
                      "[transform-style:preserve-3d]"
                    )}
                    style={{
                      transform: showContactForm ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front Side - Avatar with call buttons */}
                    <div
                      className="absolute inset-0 rounded-[2.5rem] overflow-hidden flex flex-col"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      {/* Avatar fills most of the screen */}
                      {showAvatar && (
                        <div className="flex-1 w-full bg-gradient-to-b from-sls-beige/50 to-sls-cream">
                          <ClientAvatarWrapper avatarId={avatarId} />
                        </div>
                      )}

                      {/* Call buttons at bottom */}
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8">
                        {/* Red stop button - triggers flip to contact form */}
                        <button
                          onClick={handleStopClick}
                          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors active:scale-95"
                          aria-label="End call and show contact form"
                        >
                          <PhoneOff className="w-7 h-7 text-white" />
                        </button>

                        {/* Green answer button */}
                        <button
                          className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors active:scale-95"
                          aria-label="Start call"
                        >
                          <PhoneIcon className="w-7 h-7 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Back Side - Contact Form */}
                    <div
                      className="absolute inset-0 bg-white rounded-[2.5rem] overflow-hidden p-5"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => {
                            setShowContactForm(false);
                            setSubmitSuccess(false);
                          }}
                          className="flex items-center gap-1 text-sls-teal hover:text-sls-olive transition-colors text-sm font-medium"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>{locale === "de" ? "Zurück" : "Back"}</span>
                        </button>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-sls-teal/10 text-sls-teal text-xs font-semibold">
                          <MessageCircle className="w-3 h-3" />
                          <span>{locale === "de" ? "Kontakt" : "Contact"}</span>
                        </div>
                      </div>

                      {/* Success State */}
                      {submitSuccess ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center h-[400px]">
                          <div className="w-14 h-14 rounded-full bg-sls-teal/10 flex items-center justify-center mb-4">
                            <Send className="w-7 h-7 text-sls-teal" />
                          </div>
                          <h3 className="text-lg font-semibold text-sls-teal mb-2">
                            {locale === "de" ? "Nachricht gesendet!" : "Message sent!"}
                          </h3>
                          <p className="text-sm text-sls-olive mb-6">
                            {locale === "de"
                              ? "Wir melden uns bald bei Ihnen."
                              : "We'll be in touch soon."}
                          </p>
                          <button
                            onClick={() => {
                              setShowContactForm(false);
                              setSubmitSuccess(false);
                            }}
                            className="px-6 py-2.5 rounded-full bg-sls-orange text-white text-sm font-medium hover:bg-sls-orange/90 transition-colors"
                          >
                            {locale === "de" ? "Zurück zu Helena" : "Back to Helena"}
                          </button>
                        </div>
                      ) : (
                        /* Contact Form */
                        <form onSubmit={handleContactSubmit} className="flex flex-col gap-3 h-[420px]">
                          <h3 className="text-lg font-semibold text-sls-teal mb-1">
                            {locale === "de" ? "Kontaktieren Sie uns" : "Get in touch"}
                          </h3>
                          <p className="text-xs text-sls-olive mb-2">
                            {locale === "de"
                              ? "Hinterlassen Sie uns eine Nachricht!"
                              : "Leave us a message!"}
                          </p>

                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                            <input
                              type="text"
                              required
                              placeholder={locale === "de" ? "Name *" : "Name *"}
                              value={contactForm.name}
                              onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-sls-beige bg-sls-cream/50 focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                            />
                          </div>

                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                            <input
                              type="email"
                              required
                              placeholder="Email *"
                              value={contactForm.email}
                              onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-sls-beige bg-sls-cream/50 focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                              <input
                                type="tel"
                                placeholder={locale === "de" ? "Telefon" : "Phone"}
                                value={contactForm.phone}
                                onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                                className="w-full pl-10 pr-2 py-2.5 text-sm rounded-xl border border-sls-beige bg-sls-cream/50 focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                              />
                            </div>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                              <input
                                type="text"
                                placeholder={locale === "de" ? "Firma" : "Company"}
                                value={contactForm.company}
                                onChange={(e) => setContactForm((p) => ({ ...p, company: e.target.value }))}
                                className="w-full pl-10 pr-2 py-2.5 text-sm rounded-xl border border-sls-beige bg-sls-cream/50 focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <textarea
                            required
                            placeholder={locale === "de" ? "Ihre Nachricht *" : "Your message *"}
                            value={contactForm.message}
                            onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-sls-beige bg-sls-cream/50 focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all resize-none flex-1"
                          />

                          <button
                            type="submit"
                            disabled={isSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                            className={cn(
                              "w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2",
                              "bg-sls-orange hover:bg-sls-orange/90",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{locale === "de" ? "Senden..." : "Sending..."}</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>{locale === "de" ? "Nachricht senden" : "Send message"}</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Headline, Subtitle, CTA, Testimonial */}
          <div className="order-2">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-sls-teal leading-[1.1] mb-6">
              Helena, {locale === "de" ? "Ihre" : "your"}
              <br />
              <span className="text-sls-orange">AI/Professional</span>
              <br />
              {locale === "de" ? "Englisch Coach" : "English Coach"}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-sls-olive leading-relaxed mb-8 max-w-lg">
              {locale === "de"
                ? "Erleben Sie maßgeschneidertes Business-Englisch-Training für gehobene Karrieren. Personalisierter, ergebnisorientierter Sprachunterricht für Fachkräfte, weltweit verfügbar. Verbessern Sie Ihre Kommunikation mit Selbstvertrauen."
                : "Experience bespoke Business English training tailored for elevated careers. Personalized, results-driven coaching for professionals, delivered globally. Elevate your communication with confidence."}
            </p>

            {/* CTA Button */}
            <button
              onClick={() => {
                const phoneEl = document.querySelector('[data-phone-display]');
                phoneEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-sls-orange text-white font-semibold text-lg transition-all hover:bg-sls-orange/90 hover:shadow-xl hover:shadow-sls-orange/25 hover:-translate-y-0.5 active:scale-95 mb-12"
            >
              {locale === "de" ? "Lektion mit Helena starten" : "Start Lesson with Helena"}
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Testimonial */}
            <div className="relative">
              {/* Large green quotation mark */}
              <div className="text-sls-teal text-8xl font-serif leading-none absolute -top-4 -left-2 select-none opacity-80">
                "
              </div>

              <blockquote className="pl-8 pt-6">
                <p className="text-xl sm:text-2xl font-medium text-sls-teal leading-relaxed mb-4">
                  {locale === "de"
                    ? "Der personalisierte Ansatz hat mein Selbstvertrauen enorm gestärkt. Sehr empfehlenswert!"
                    : "The personalized approach has boosted my confidence immensely. Highly recommend!"}
                </p>
                <footer className="flex items-center gap-2">
                  <span className="text-sls-orange">★★★★★</span>
                  <cite className="text-sm text-sls-olive not-italic">
                    - Sarah L., Marketing Director
                  </cite>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
