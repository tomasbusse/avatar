"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { MessageCircle, Send, ArrowLeft, User, Mail, Phone, Building2, X, Play, Square } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Dynamically import the avatar wrapper with SSR disabled to prevent hydration errors
const ClientAvatarWrapper = dynamic(
  () => import("./ClientAvatarWrapper").then((mod) => mod.ClientAvatarWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-b from-sls-beige/30 to-sls-cream flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-sls-teal/10 animate-pulse" />
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
  const [isAvatarActivated, setIsAvatarActivated] = useState(false);

  // Fetch the landing avatar data for display
  const landingAvatar = useQuery(api.landing.getLandingAvatar, { locale });
  const avatarName = landingAvatar?.name || "Helena";
  // Use description or default title based on avatar name
  const avatarTitle = landingAvatar?.description || (locale === "de" ? "KI Englisch Coach" : "AI English Coach");

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

  // Handle stop button click - stop avatar and flip to contact form
  const handleStopClick = useCallback(() => {
    setIsAvatarActivated(false);
    setShowContactForm(true);
    setTimeout(() => {
      const phoneEl = document.querySelector('[data-phone-display]');
      if (phoneEl) {
        phoneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  // Handle start/play button click - start the avatar
  const handleStartClick = useCallback(() => {
    setShowContactForm(false);
    setIsAvatarActivated(true);
    const phoneEl = document.querySelector('[data-phone-display]');
    phoneEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Handle avatar activation state change
  const handleActivationChange = useCallback((activated: boolean) => {
    setIsAvatarActivated(activated);
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
    <section className="flex flex-col lg:flex-row min-h-[90vh] lg:min-h-screen items-center justify-center px-4 py-8 sm:p-6 lg:p-16 xl:p-20 bg-[#f3e9d2] gap-8 lg:gap-16 xl:gap-24 overflow-hidden">
      {/* Phone Mockup Section */}
      <div className="relative w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[340px] shrink-0" data-phone-display>
        {/* Phone Frame with flip animation - reduced height by 50px using max-height */}
        <div
          className="relative rounded-[3rem] border-[12px] border-black overflow-hidden shadow-2xl bg-gray-900"
          style={{
            aspectRatio: "9/18",
            perspective: "1000px"
          }}
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
            {/* Front Side - Avatar + Bottom Panel (no gap) */}
            <div
              className="absolute inset-0 overflow-hidden bg-[#f3e9d2]"
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* Avatar area - absolute positioned to fill top portion */}
              {showAvatar && (
                <div className="absolute top-0 left-0 right-0 bottom-[28%] overflow-hidden">
                  <ClientAvatarWrapper
                    avatarId={avatarId}
                    hidePlayButton={true}
                    externalActivated={isAvatarActivated}
                    onActivationChange={handleActivationChange}
                    hideRoomControls={true}
                  />
                </div>
              )}

              {/* Bottom panel - absolute positioned at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-[#f3e9d2] flex flex-col items-center justify-center px-4 py-2">
                {/* Caller info with intro text */}
                <div className="text-center mb-1.5">
                  <h3 className="text-lg font-serif font-bold text-[#1a3c34]">{avatarName}</h3>
                  <p className="text-[11px] text-[#4a4a4a] mt-0.5">{avatarTitle}</p>
                  <p className="text-[10px] text-[#6a6a6a] mt-1 max-w-[200px] leading-tight">
                    {locale === "de"
                      ? "Klicken Sie auf Play, um Ihre persönliche Lektion zu starten"
                      : "Click play to start your personalized lesson"}
                  </p>
                </div>

                {/* Call buttons - SLS brand colors: orange (#B25627) and teal (#003F37) */}
                <div className="flex items-center justify-center gap-10">
                  {/* Stop button - SLS Orange */}
                  <button
                    onClick={handleStopClick}
                    className="w-12 h-12 bg-[#B25627] rounded-full flex items-center justify-center shadow-lg hover:bg-[#9a4b24] hover:scale-105 transition-all active:scale-95"
                    aria-label={locale === "de" ? "Stoppen" : "Stop"}
                  >
                    <Square className="w-4 h-4 text-white" fill="white" />
                  </button>

                  {/* Play button - SLS Teal */}
                  <button
                    onClick={handleStartClick}
                    className="w-12 h-12 bg-[#003F37] rounded-full flex items-center justify-center shadow-lg hover:bg-[#002a25] hover:scale-105 transition-all active:scale-95"
                    aria-label={locale === "de" ? "Abspielen" : "Play"}
                  >
                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Back Side - Contact Form */}
            <div
              className="absolute inset-0 bg-[#f3e9d2] overflow-hidden p-6"
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
                  className="flex items-center gap-1 text-[#1a3c34] hover:text-[#b3592d] transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{locale === "de" ? "Zurück" : "Back"}</span>
                </button>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#1a3c34]/10 text-[#1a3c34] text-xs font-semibold">
                  <MessageCircle className="w-3 h-3" />
                  <span>{locale === "de" ? "Kontakt" : "Contact"}</span>
                </div>
              </div>

              {/* Success State */}
              {submitSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center h-[85%]">
                  <div className="w-16 h-16 rounded-full bg-[#1a3c34]/10 flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-[#1a3c34]" />
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-[#1a3c34] mb-2">
                    {locale === "de" ? "Nachricht gesendet!" : "Message sent!"}
                  </h3>
                  <p className="text-sm text-[#4a4a4a] mb-6">
                    {locale === "de"
                      ? "Wir melden uns bald bei Ihnen."
                      : "We'll be in touch soon."}
                  </p>
                  <button
                    onClick={() => {
                      setShowContactForm(false);
                      setSubmitSuccess(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#b3592d] text-white text-sm font-semibold hover:bg-[#9a4b24] transition-colors"
                  >
                    {locale === "de" ? `Zurück zu ${avatarName}` : `Back to ${avatarName}`}
                  </button>
                </div>
              ) : (
                /* Contact Form */
                <form onSubmit={handleContactSubmit} className="flex flex-col gap-3 h-[90%]">
                  <h3 className="text-xl font-serif font-semibold text-[#1a3c34] mb-1">
                    {locale === "de" ? "Kontaktieren Sie uns" : "Get in touch"}
                  </h3>
                  <p className="text-xs text-[#4a4a4a] mb-2">
                    {locale === "de"
                      ? "Hinterlassen Sie uns eine Nachricht!"
                      : "Leave us a message!"}
                  </p>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a]/50" />
                    <input
                      type="text"
                      required
                      placeholder={locale === "de" ? "Name *" : "Name *"}
                      value={contactForm.name}
                      onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-[#1a3c34]/20 bg-white/80 focus:border-[#1a3c34] focus:ring-1 focus:ring-[#1a3c34]/20 outline-none transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a]/50" />
                    <input
                      type="email"
                      required
                      placeholder="Email *"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-[#1a3c34]/20 bg-white/80 focus:border-[#1a3c34] focus:ring-1 focus:ring-[#1a3c34]/20 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a]/50" />
                      <input
                        type="tel"
                        placeholder={locale === "de" ? "Telefon" : "Phone"}
                        value={contactForm.phone}
                        onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full pl-10 pr-2 py-2.5 text-sm rounded-xl border border-[#1a3c34]/20 bg-white/80 focus:border-[#1a3c34] focus:ring-1 focus:ring-[#1a3c34]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a]/50" />
                      <input
                        type="text"
                        placeholder={locale === "de" ? "Firma" : "Company"}
                        value={contactForm.company}
                        onChange={(e) => setContactForm((p) => ({ ...p, company: e.target.value }))}
                        className="w-full pl-10 pr-2 py-2.5 text-sm rounded-xl border border-[#1a3c34]/20 bg-white/80 focus:border-[#1a3c34] focus:ring-1 focus:ring-[#1a3c34]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <textarea
                    required
                    placeholder={locale === "de" ? "Ihre Nachricht *" : "Your message *"}
                    value={contactForm.message}
                    onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#1a3c34]/20 bg-white/80 focus:border-[#1a3c34] focus:ring-1 focus:ring-[#1a3c34]/20 outline-none transition-all resize-none flex-1"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2",
                      "bg-[#b3592d] hover:bg-[#9a4b24]",
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

      {/* Content Section */}
      <div className="max-w-xl text-center lg:text-left flex flex-col gap-5">
        {/* Brand tagline */}
        <p className="text-[#b3592d] text-sm font-semibold uppercase tracking-widest">
          {locale === "de" ? "Seit über 20 Jahren" : "Over 20 years of excellence"}
        </p>

        <h1 className="text-[#1a3c34] text-4xl lg:text-6xl font-serif leading-tight">
          {locale === "de" ? "Treffen Sie" : "Meet"} {avatarName}, <br />
          {locale === "de" ? "Ihre" : "your"}{" "}
          <span className="text-[#b3592d]">AI</span>{" "}
          {locale === "de" ? "Sprachpartnerin" : "Practice Partner"}
        </h1>

        <p className="text-[#4a4a4a] text-lg leading-relaxed max-w-lg">
          {locale === "de"
            ? "Business und Professional English für echte Arbeitssituationen. Maßgeschneidertes Training statt Standardprogramme — mit modernster KI-Technologie als digitaler Übungspartner."
            : "Business and Professional English for real workplace situations. Tailored training instead of standard programs — with cutting-edge AI technology as your digital practice partner."}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
          <button
            onClick={handleStartClick}
            className="bg-[#003F37] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#002a25] transition-all shadow-md active:scale-95"
          >
            {locale === "de" ? `Mit ${avatarName} sprechen` : `Talk to ${avatarName}`}
          </button>
          <button
            onClick={() => {
              setShowContactForm(true);
              setTimeout(() => {
                const phoneEl = document.querySelector('[data-phone-display]');
                phoneEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
            className="bg-transparent border-2 border-[#003F37] text-[#003F37] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#003F37]/10 transition-all active:scale-95"
          >
            {locale === "de" ? "Kontakt aufnehmen" : "Get in touch"}
          </button>
        </div>

        {/* Features list */}
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2 text-sm text-[#4a4a4a]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b3592d]" />
            {locale === "de" ? "Hannover & Berlin" : "Hannover & Berlin"}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b3592d]" />
            {locale === "de" ? "Online & Präsenz" : "Online & In-person"}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b3592d]" />
            {locale === "de" ? "Einzel & Gruppen" : "Individual & Groups"}
          </span>
        </div>

        {/* Decorative Separator */}
        <div className="flex items-center gap-4 py-2 justify-center lg:justify-start">
          <div className="h-px bg-gray-300 flex-grow max-w-[100px]" />
          <div className="w-2 h-2 rotate-45 border border-gray-400" />
          <div className="h-px bg-gray-300 flex-grow max-w-[100px]" />
        </div>

        {/* Testimonial */}
        <div className="relative pl-8 pt-2 italic">
          <span className="absolute left-0 top-0 text-5xl text-[#b3592d] opacity-40 font-serif">"</span>
          <div className="flex gap-1 mb-2 justify-center lg:justify-start">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} className="w-4 h-4 text-orange-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-[#1a3c34] text-xl font-serif mb-2 leading-snug">
            {locale === "de"
              ? "Das Training ist genau auf meine Bedürfnisse im Job zugeschnitten. Endlich echte Fortschritte!"
              : "The training is tailored exactly to my job needs. Finally real progress!"}
          </p>
          <p className="text-sm font-bold text-gray-700 uppercase tracking-tighter not-italic">
            — Thomas M., Project Manager
          </p>
        </div>
      </div>
    </section>
  );
}
