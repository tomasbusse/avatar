"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Play, CheckCircle2, Mic, MessageCircle, Send, ArrowLeft, User, Mail, Phone, Building2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Dynamically import the avatar wrapper with SSR disabled to prevent hydration errors
const ClientAvatarWrapper = dynamic(
  () => import("./ClientAvatarWrapper").then((mod) => mod.ClientAvatarWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-sls-teal/20 to-sls-olive/20 flex items-center justify-center animate-pulse">
        <div className="text-center text-white/60 p-4">
          <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2 flex items-center justify-center">
            <Play className="w-5 h-5 text-white/50" />
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

// Demo flashcard data for the game preview
const demoFlashcards = [
  { front: "Meeting", back: "das Treffen", example: "We have a meeting at 3pm." },
  { front: "Deadline", back: "die Frist", example: "The deadline is next Friday." },
  { front: "Schedule", back: "der Zeitplan", example: "Let me check my schedule." },
];

export function HeroSection({ avatarId, showAvatar = true }: HeroSectionProps) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const [showContactForm, setShowContactForm] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(true);

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

  // Simulate recording timer
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Auto-flip flashcard demo
  useEffect(() => {
    const flipInterval = setInterval(() => {
      setIsFlipped((prev) => {
        if (prev) {
          // After showing back, move to next card
          setTimeout(() => {
            setCurrentCard((c) => (c + 1) % demoFlashcards.length);
          }, 500);
        }
        return !prev;
      });
    }, 3000);
    return () => clearInterval(flipInterval);
  }, []);

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle CTA click to toggle contact form on avatar
  const handleCtaClick = useCallback(() => {
    const newState = !showContactForm;
    setShowContactForm(newState);

    // On mobile, scroll to the avatar (which shows the contact form)
    if (newState) {
      setTimeout(() => {
        const avatarEl = document.querySelector('[data-avatar-display]');
        if (avatarEl) {
          avatarEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [showContactForm]);

  // Handle when contact form is closed/reset
  const handleContactFormClose = useCallback(() => {
    setShowContactForm(false);
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

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
  ];

  const card = demoFlashcards[currentCard];

  return (
    <section className="relative min-h-screen bg-[#0a1628] overflow-hidden">
      {/* Aurora/Gradient Background Effects */}
      <div className="absolute inset-0">
        {/* Top-right aurora glow - green/teal like avaros */}
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-sls-teal/30 via-sls-chartreuse/10 to-transparent blur-3xl" />
        {/* Bottom-left aurora glow */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-gradient-to-tr from-sls-olive/20 via-sls-teal/10 to-transparent blur-3xl" />
        {/* Animated aurora effects */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-sls-chartreuse/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-40 w-80 h-80 bg-sls-teal/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">

          {/* LEFT SIDE: Call to Action Content (like avaros.ai screen 1) */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-chartreuse/20 text-sls-chartreuse text-sm font-medium mb-6 border border-sls-chartreuse/30">
              <span className="w-2 h-2 rounded-full bg-sls-chartreuse animate-pulse" />
              {t("badge")}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t("headline")}
              <span className="text-sls-chartreuse block mt-2">{t("headlineAccent")}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-8 max-w-xl">
              {t("subheadline")}
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-10">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sls-chartreuse flex-shrink-0" />
                  <span className="text-white/80">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sls-chartreuse text-[#0a1628] font-semibold text-lg transition-all hover:bg-sls-chartreuse/90 hover:shadow-xl hover:shadow-sls-chartreuse/25 hover:-translate-y-0.5 active:scale-95"
              >
                {t("ctaPrimary")}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const avatarEl = document.querySelector('[data-avatar-display]');
                  avatarEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-lg transition-all hover:bg-white/20 active:scale-95 border border-white/20"
              >
                <Play className="w-5 h-5" />
                {t("ctaSecondary")}
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-8">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-chartreuse">20+</span>
                  <span className="text-sm text-white/60">{t("years")}</span>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-chartreuse">500+</span>
                  <span className="text-sm text-white/60">{t("students")}</span>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-sls-chartreuse">98%</span>
                  <span className="text-sm text-white/60">{t("satisfaction")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Mobile Phone + Avatar + Game */}
          <div className="order-1 lg:order-2 flex items-center justify-center lg:justify-end">
            <div className="flex items-center gap-6">

              {/* Mobile Phone Mockup (Center element) */}
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative bg-[#1a1a2e] rounded-[3rem] p-3 shadow-2xl shadow-black/50">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1a1a2e] rounded-b-2xl z-10 flex items-center justify-center">
                    <div className="w-16 h-4 bg-black rounded-full" />
                  </div>

                  {/* Phone screen - Flippable */}
                  <div
                    className="relative w-64 h-[440px] rounded-[2.5rem] overflow-hidden"
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
                      {/* Front Side - Recording UI */}
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-sls-teal via-[#0a2f2a] to-sls-olive rounded-[2.5rem] overflow-hidden"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        {/* Top bar with recording indicator */}
                        <div className="absolute top-8 left-0 right-0 flex items-center justify-center">
                          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-white/80 text-xs font-medium">RECORDING</span>
                          </div>
                        </div>

                        {/* Timer with pulsing circles */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                          {/* Pulsing circle animation */}
                          <div className="relative w-36 h-36 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-sls-chartreuse/20 animate-ping" style={{ animationDuration: "2s" }} />
                            <div className="absolute inset-4 rounded-full bg-sls-chartreuse/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
                            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-sls-chartreuse/30 to-sls-teal/30 flex items-center justify-center border-4 border-sls-chartreuse/50">
                              <Mic className="w-10 h-10 text-white" />
                            </div>
                          </div>
                          <span className="text-3xl font-mono text-white mt-4">{formatTime(recordingTime)}</span>
                        </div>

                        {/* Control buttons */}
                        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-5">
                          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                            <span className="w-3.5 h-3.5 bg-white/70 rounded" />
                          </button>
                          <button className="w-14 h-14 rounded-full bg-sls-orange flex items-center justify-center text-white shadow-lg shadow-sls-orange/30">
                            <span className="w-5 h-5 bg-white rounded" />
                          </button>
                          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Back Side - Contact Form */}
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-sls-cream to-white rounded-[2.5rem] overflow-hidden p-5"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
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
                          <div className="flex-1 flex flex-col items-center justify-center text-center h-[340px]">
                            <div className="w-12 h-12 rounded-full bg-sls-chartreuse/20 flex items-center justify-center mb-3">
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
                              <span>{locale === "de" ? "Nochmal" : "Try Again"}</span>
                            </button>
                          </div>
                        ) : (
                          /* Contact Form */
                          <form onSubmit={handleContactSubmit} className="flex flex-col gap-2 h-[340px]">
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
                <div className="absolute -inset-4 bg-gradient-to-r from-sls-chartreuse/20 via-sls-teal/20 to-sls-chartreuse/20 rounded-[4rem] blur-2xl -z-10" />
              </div>

              {/* RIGHT of Phone: Avatar + Game + Chat Bubbles */}
              <div className="hidden lg:flex flex-col gap-4 max-w-[300px]" data-avatar-display>

                {/* Chat bubbles showing conversation */}
                <div className="space-y-2">
                  {/* User message */}
                  <div className="flex items-end gap-2">
                    <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-md px-3 py-2 max-w-[220px]">
                      <p className="text-white/70 text-xs">
                        {locale === "de"
                          ? "Ich bin auf dem Weg zur Arbeit. Ich bin gleich da!"
                          : "Been going for a walk every day. Cut down on my salt. I'm feeling much better!"}
                      </p>
                    </div>
                  </div>

                  {/* Avatar response */}
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-sls-chartreuse/30 flex items-center justify-center flex-shrink-0 text-xs text-sls-chartreuse font-semibold">
                      E
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-md px-3 py-2 max-w-[220px]">
                      <p className="text-sls-chartreuse text-[10px] uppercase tracking-wide mb-1">TEACHER</p>
                      <p className="text-white/80 text-xs">
                        {locale === "de"
                          ? "Sehr gut! Das freut mich zu hören!"
                          : "Any headaches, chest pain, shortness of breath, or numbness?"}
                      </p>
                    </div>
                  </div>

                  {/* Another user response */}
                  <div className="flex items-end gap-2">
                    <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-md px-3 py-2 max-w-[220px]">
                      <p className="text-white/70 text-xs">
                        {locale === "de"
                          ? "Nein, alles ist gut."
                          : "No, everything's been good. Blood pressure readings have all been normal."}
                      </p>
                    </div>
                  </div>

                  {/* Teacher response */}
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-sls-chartreuse/30 flex items-center justify-center flex-shrink-0 text-xs text-sls-chartreuse font-semibold">
                      E
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-md px-3 py-2 max-w-[220px]">
                      <p className="text-sls-chartreuse text-[10px] uppercase tracking-wide mb-1">TEACHER</p>
                      <p className="text-white/80 text-xs">
                        {locale === "de"
                          ? "Sie nehmen 50mg HCTZ einmal am Tag."
                          : "You're taking 50mg of HCTZ once a day?"}
                      </p>
                    </div>
                  </div>

                  {/* Final user message */}
                  <div className="flex items-end gap-2">
                    <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-md px-3 py-2 max-w-[220px]">
                      <p className="text-white/70 text-xs">
                        {locale === "de"
                          ? "Ja, genau."
                          : "Yes, that's it."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Flashcard Game Preview */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-sls-chartreuse/20 flex items-center justify-center">
                      <span className="text-sls-chartreuse text-sm">🎮</span>
                    </div>
                    <span className="text-white/80 font-medium text-xs">Vocabulary Game</span>
                  </div>

                  {/* Flashcard */}
                  <div
                    className="relative h-32 cursor-pointer"
                    style={{ perspective: "1000px" }}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 transition-transform duration-500",
                      )}
                      style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-sls-cream to-white rounded-xl p-4 flex flex-col items-center justify-center"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <span className="text-[10px] uppercase tracking-wide text-sls-olive/60 mb-1">English</span>
                        <p className="text-xl font-bold text-sls-teal text-center">{card.front}</p>
                      </div>

                      {/* Back */}
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-sls-teal to-sls-olive rounded-xl p-4 flex flex-col items-center justify-center"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <span className="text-[10px] uppercase tracking-wide text-white/60 mb-1">Deutsch</span>
                        <p className="text-lg font-bold text-white text-center">{card.back}</p>
                        <p className="text-[10px] text-white/70 mt-2 italic text-center">&quot;{card.example}&quot;</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress indicators */}
                  <div className="flex justify-center gap-1.5 mt-3">
                    {demoFlashcards.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === currentCard ? "bg-sls-chartreuse w-4" : "bg-white/30 w-1.5"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Avatar (smaller version for desktop) */}
                {showAvatar && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                    <div className="w-full aspect-square max-w-[180px] mx-auto">
                      <ClientAvatarWrapper
                        avatarId={avatarId}
                        showContactForm={showContactForm}
                        onContactFormClose={handleContactFormClose}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-sls-chartreuse animate-pulse" />
        </div>
      </div>
    </section>
  );
}
