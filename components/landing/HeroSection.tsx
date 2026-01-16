"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Play, CheckCircle2, MessageCircle, Send, ArrowLeft, User, Mail, Phone, Building2 } from "lucide-react";
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
      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-sls-teal/20 to-sls-olive/20 flex items-center justify-center animate-pulse">
        <div className="text-center text-sls-olive/60 p-4">
          <div className="w-12 h-12 rounded-full bg-sls-teal/10 mx-auto mb-2 flex items-center justify-center">
            <Play className="w-5 h-5 text-sls-teal/50" />
          </div>
          <p className="text-xs">Loading...</p>
        </div>
      </div>
    ),
  }
);

interface HeroSectionProps {
  avatarId?: string;
  showAvatar?: boolean;
}

export function HeroSection({ avatarId, showAvatar = true }: HeroSectionProps) {
  const t = useTranslations("hero");
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

  // Handle CTA click to toggle contact form on avatar
  const handleCtaClick = useCallback(() => {
    const newState = !showContactForm;
    setShowContactForm(newState);

    // On mobile, scroll to the phone (which shows the avatar/contact form)
    if (newState) {
      setTimeout(() => {
        const phoneEl = document.querySelector('[data-phone-display]');
        if (phoneEl) {
          phoneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [showContactForm]);

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

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
  ];

  return (
    <section className="relative min-h-screen bg-sls-cream overflow-hidden">
      {/* Subtle gradient overlays for depth */}
      <div className="absolute inset-0">
        {/* Top-right soft glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-gradient-to-bl from-sls-beige/50 via-transparent to-transparent" />
        {/* Bottom-left soft glow */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-gradient-to-tr from-sls-teal/5 via-transparent to-transparent" />
      </div>

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #003F37 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">

          {/* LEFT SIDE: Call to Action Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-medium mb-6 border border-sls-teal/20">
              <span className="w-2 h-2 rounded-full bg-sls-teal animate-pulse" />
              {t("badge")}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-sls-teal leading-tight mb-6">
              {t("headline")}
              <span className="text-sls-orange block mt-2">{t("headlineAccent")}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-sls-olive leading-relaxed mb-8 max-w-xl">
              {t("subheadline")}
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-10">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sls-teal flex-shrink-0" />
                  <span className="text-sls-olive">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sls-orange text-white font-semibold text-lg transition-all hover:bg-sls-orange/90 hover:shadow-xl hover:shadow-sls-orange/25 hover:-translate-y-0.5 active:scale-95"
              >
                {t("ctaPrimary")}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const phoneEl = document.querySelector('[data-phone-display]');
                  phoneEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sls-teal/10 text-sls-teal font-semibold text-lg transition-all hover:bg-sls-teal/20 active:scale-95 border border-sls-teal/20"
              >
                <Play className="w-5 h-5" />
                {t("ctaSecondary")}
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-sls-olive/10">
              <div className="flex flex-wrap items-center gap-8">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-teal">20+</span>
                  <span className="text-sm text-sls-olive/70">{t("years")}</span>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-teal">500+</span>
                  <span className="text-sm text-sls-olive/70">{t("students")}</span>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-teal">98%</span>
                  <span className="text-sm text-sls-olive/70">{t("satisfaction")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Mobile Phone (with Avatar) + Flashcard Game */}
          <div className="order-1 lg:order-2 flex items-center justify-center lg:justify-end">
            <div className="flex items-center gap-6">

              {/* Mobile Phone Mockup with Avatar inside */}
              <div className="relative" data-phone-display>
                {/* Phone Frame - Dark green border */}
                <div className="relative bg-sls-teal rounded-[3rem] p-4 shadow-2xl shadow-sls-teal/30">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-sls-teal rounded-b-2xl z-10 flex items-center justify-center">
                    <div className="w-20 h-5 bg-black/80 rounded-full" />
                  </div>

                  {/* Phone screen - Flippable Avatar/Contact Form - LARGER */}
                  <div
                    className="relative w-80 h-[580px] rounded-[2.5rem] overflow-hidden"
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
                      {/* Front Side - Avatar (2/3 height) + Bottom section */}
                      <div
                        className="absolute inset-0 rounded-[2.5rem] overflow-hidden flex flex-col bg-gradient-to-b from-sls-cream to-white"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        {/* Avatar area - 2/3 of screen */}
                        {showAvatar && (
                          <div className="w-full flex-1" style={{ height: "66%" }}>
                            <ClientAvatarWrapper avatarId={avatarId} />
                          </div>
                        )}

                        {/* Bottom section - name and status */}
                        <div className="bg-white border-t border-sls-beige px-6 py-4" style={{ height: "34%" }}>
                          <div className="text-center mb-3">
                            <h4 className="text-lg font-bold text-sls-teal">Helena</h4>
                            <p className="text-xs text-sls-olive">
                              {locale === "de" ? "Ihre persönliche Sprachlehrerin" : "Your personal language teacher"}
                            </p>
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={handleCtaClick}
                              className="px-4 py-2 rounded-full bg-sls-orange text-white text-xs font-medium hover:bg-sls-orange/90 transition-colors"
                            >
                              {locale === "de" ? "Nachricht senden" : "Send message"}
                            </button>
                            <button className="px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-xs font-medium hover:bg-sls-teal/20 transition-colors">
                              {locale === "de" ? "Demo starten" : "Start demo"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Back Side - Contact Form */}
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-sls-cream to-white rounded-[2.5rem] overflow-hidden p-6"
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
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sls-teal/10 text-sls-teal text-xs font-semibold">
                            <MessageCircle className="w-3 h-3" />
                            <span>{locale === "de" ? "Kontakt" : "Contact"}</span>
                          </div>
                        </div>

                        {/* Success State */}
                        {submitSuccess ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center h-[480px]">
                            <div className="w-12 h-12 rounded-full bg-sls-teal/10 flex items-center justify-center mb-3">
                              <Send className="w-6 h-6 text-sls-teal" />
                            </div>
                            <h3 className="text-base font-semibold text-sls-teal mb-2">
                              {locale === "de" ? "Gesendet!" : "Sent!"}
                            </h3>
                            <p className="text-xs text-sls-olive mb-4">
                              {locale === "de"
                                ? "Wir melden uns bald."
                                : "We'll be in touch soon."}
                            </p>
                            <button
                              onClick={() => {
                                setShowContactForm(false);
                                setSubmitSuccess(false);
                              }}
                              className="flex items-center gap-1 px-4 py-2 rounded-full bg-sls-orange text-white text-sm font-medium hover:bg-sls-orange/90 transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              <span>{locale === "de" ? "Zurück" : "Back"}</span>
                            </button>
                          </div>
                        ) : (
                          /* Contact Form */
                          <form onSubmit={handleContactSubmit} className="flex flex-col gap-3 h-[480px]">
                            <p className="text-xs text-sls-olive mb-1">
                              {locale === "de"
                                ? "Hinterlassen Sie uns eine Nachricht!"
                                : "Leave us a message!"}
                            </p>

                            <div className="relative">
                              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sls-olive/50" />
                              <input
                                type="text"
                                required
                                placeholder={locale === "de" ? "Name *" : "Name *"}
                                value={contactForm.name}
                                onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                                className="w-full pl-8 pr-2 py-2 text-xs rounded-lg border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                              />
                            </div>

                            <div className="relative">
                              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sls-olive/50" />
                              <input
                                type="email"
                                required
                                placeholder="Email *"
                                value={contactForm.email}
                                onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                                className="w-full pl-8 pr-2 py-2 text-xs rounded-lg border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative">
                                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sls-olive/50" />
                                <input
                                  type="tel"
                                  placeholder={locale === "de" ? "Tel." : "Phone"}
                                  value={contactForm.phone}
                                  onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                                  className="w-full pl-8 pr-2 py-2 text-xs rounded-lg border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                                />
                              </div>
                              <div className="relative">
                                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sls-olive/50" />
                                <input
                                  type="text"
                                  placeholder={locale === "de" ? "Firma" : "Company"}
                                  value={contactForm.company}
                                  onChange={(e) => setContactForm((p) => ({ ...p, company: e.target.value }))}
                                  className="w-full pl-8 pr-2 py-2 text-xs rounded-lg border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                                />
                              </div>
                            </div>

                            <textarea
                              required
                              placeholder={locale === "de" ? "Ihre Nachricht *" : "Your message *"}
                              value={contactForm.message}
                              onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                              rows={3}
                              className="w-full px-2.5 py-2 text-xs rounded-lg border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all resize-none flex-1"
                            />

                            <button
                              type="submit"
                              disabled={isSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                              className={cn(
                                "w-full py-2.5 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-1 text-sm",
                                "bg-sls-orange hover:bg-sls-orange/90",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                              )}
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>{locale === "de" ? "Senden..." : "Sending..."}</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{locale === "de" ? "Senden" : "Send"}</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone glow effect */}
                <div className="absolute -inset-6 bg-gradient-to-br from-sls-teal/20 via-sls-chartreuse/10 to-sls-teal/15 rounded-[4rem] blur-3xl -z-10" />
              </div>

              {/* RIGHT of Phone: Chat-style FAQ */}
              <div className="hidden lg:flex flex-col gap-3 max-w-[320px]">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-sls-teal flex items-center justify-center">
                    <MessageCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sls-olive text-xs font-medium uppercase tracking-wide">
                    {locale === "de" ? "Häufige Fragen" : "Common Questions"}
                  </span>
                </div>

                {/* Q&A 1 */}
                <div className="space-y-2">
                  {/* User question */}
                  <div className="flex justify-end">
                    <div className="bg-sls-teal text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[260px] shadow-sm">
                      <p className="text-sm">
                        {locale === "de"
                          ? "Wie unterscheidet ihr euch von anderen Sprachkursen?"
                          : "How are you different from other language courses?"}
                      </p>
                    </div>
                  </div>
                  {/* Helena answer */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-sls-orange/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sls-orange text-xs font-bold">H</span>
                    </div>
                    <div className="bg-white border border-sls-beige rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[240px] shadow-sm">
                      <p className="text-sm text-sls-olive">
                        {locale === "de"
                          ? "Wir verbinden echte Lehrerexpertise mit KI-Technologie – jede Lektion von Pädagogen gestaltet!"
                          : "We combine real teacher expertise with AI technology – every lesson crafted by educators!"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Q&A 2 */}
                <div className="space-y-2">
                  {/* User question */}
                  <div className="flex justify-end">
                    <div className="bg-sls-teal text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[260px] shadow-sm">
                      <p className="text-sm">
                        {locale === "de"
                          ? "Kann ich jederzeit üben?"
                          : "Can I practice anytime?"}
                      </p>
                    </div>
                  </div>
                  {/* Helena answer */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-sls-orange/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sls-orange text-xs font-bold">H</span>
                    </div>
                    <div className="bg-white border border-sls-beige rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[240px] shadow-sm">
                      <p className="text-sm text-sls-olive">
                        {locale === "de"
                          ? "Ja! Ich bin 24/7 für dich da. Übe wann und wo du willst."
                          : "Yes! I'm available 24/7. Practice whenever and wherever you want."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Q&A 3 */}
                <div className="space-y-2">
                  {/* User question */}
                  <div className="flex justify-end">
                    <div className="bg-sls-teal text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[260px] shadow-sm">
                      <p className="text-sm">
                        {locale === "de"
                          ? "Ist das für Anfänger geeignet?"
                          : "Is this suitable for beginners?"}
                      </p>
                    </div>
                  </div>
                  {/* Helena answer */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-sls-orange/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sls-orange text-xs font-bold">H</span>
                    </div>
                    <div className="bg-white border border-sls-beige rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[240px] shadow-sm">
                      <p className="text-sm text-sls-olive">
                        {locale === "de"
                          ? "Absolut! Ich passe mich deinem Niveau an – von A1 bis C2."
                          : "Absolutely! I adapt to your level – from A1 to C2."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-sls-teal/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-sls-teal animate-pulse" />
        </div>
      </div>
    </section>
  );
}
