"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import {
  Play,
  ArrowLeft,
  Send,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  MessageCircle,
  Clock,
  Mic,
  Volume2,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YouTubeAvatarDemoProps {
  avatarName?: string;
  avatarTitle?: string;
  avatarImage?: string;
  className?: string;
}

export function YouTubeAvatarDemo({
  avatarName = "George Patterson",
  avatarTitle,
  avatarImage = "/images/george-avatar-hero.webp",
  className,
}: YouTubeAvatarDemoProps) {
  const locale = useLocale();
  const t = useTranslations("aiPractice");
  const tContact = useTranslations("contact");
  const submitContact = useMutation(api.landing.submitContactForm);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
  const [imageError, setImageError] = useState(false);

  const handleStartDemo = () => {
    // For now, flip to contact form - in future could start actual demo
    setIsFlipped(true);
  };

  const handleBackToAvatar = () => {
    setIsFlipped(false);
    setSubmitSuccess(false);
  };

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
        source: "ai_practice_demo",
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
        console.warn("Email send failed:", await emailResponse.text());
      }

      setSubmitSuccess(true);
      setContactForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = avatarTitle || t("demo.title");

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ perspective: "1200px" }}
    >
      {/* YouTube-style 16:9 Container */}
      <div
        className={cn(
          "relative w-full aspect-video transition-transform duration-700 ease-in-out",
          "[transform-style:preserve-3d]"
        )}
        style={{
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Front Side - Avatar Demo */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl overflow-hidden shadow-2xl",
            "[backface-visibility:hidden]"
          )}
        >
          {/* Video-style background with avatar */}
          <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal">
            {/* Avatar Image - positioned to right side */}
            <div className="absolute right-0 bottom-0 h-full w-1/2 md:w-2/5">
              {!imageError ? (
                <Image
                  src={avatarImage}
                  alt={avatarName}
                  fill
                  className="object-cover object-top"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                /* Fallback avatar placeholder */
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sls-olive/50 to-sls-teal/50">
                  <div className="text-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    </div>
                    <p className="text-white/80 text-sm font-medium">{avatarName}</p>
                  </div>
                </div>
              )}
              {/* Gradient overlay to blend with left side */}
              <div className="absolute inset-0 bg-gradient-to-r from-sls-teal/90 via-transparent to-transparent" />
            </div>

            {/* Left side content */}
            <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10 lg:p-12">
              <div className="max-w-[55%] md:max-w-[50%]">
                {/* Live badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium mb-4">
                  <span className="w-2 h-2 rounded-full bg-sls-chartreuse animate-pulse" />
                  <span>{t("demo.badge")}</span>
                </div>

                {/* Avatar name and title */}
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
                  {avatarName}
                </h3>
                <p className="text-sm md:text-base text-white/80 mb-6">
                  {title}
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs">
                    <Clock className="w-3 h-3" />
                    <span>24/7</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs">
                    <Mic className="w-3 h-3" />
                    <span>{t("demo.voiceEnabled")}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs">
                    <Volume2 className="w-3 h-3" />
                    <span>{t("demo.instantFeedback")}</span>
                  </div>
                </div>

                {/* Play button */}
                <button
                  onClick={handleStartDemo}
                  className={cn(
                    "group inline-flex items-center gap-3 px-6 py-3 rounded-xl",
                    "bg-sls-orange text-white font-semibold",
                    "transition-all duration-300",
                    "hover:bg-sls-orange/90 hover:shadow-xl hover:shadow-sls-orange/30",
                    "hover:scale-105 active:scale-95"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Play className="w-5 h-5 ml-0.5" fill="white" />
                  </div>
                  <span>{t("demo.startButton")}</span>
                </button>
              </div>
            </div>

            {/* YouTube-style progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className={cn(
                  "h-full bg-sls-orange transition-all duration-1000",
                  isHovered ? "w-[15%]" : "w-[5%]"
                )}
              />
            </div>
          </div>
        </div>

        {/* Back Side - Contact Form */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl overflow-hidden shadow-2xl",
            "bg-gradient-to-br from-sls-cream to-white",
            "[backface-visibility:hidden]",
            "[transform:rotateY(180deg)]"
          )}
        >
          <div className="absolute inset-0 p-4 md:p-6 lg:p-8 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBackToAvatar}
                className="flex items-center gap-2 text-sls-teal hover:text-sls-olive transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{locale === "de" ? "Zurück" : "Back"}</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sls-teal/10 text-sls-teal text-xs font-semibold">
                <MessageCircle className="w-3 h-3" />
                <span>{locale === "de" ? "Kontakt" : "Contact"}</span>
              </div>
            </div>

            {/* Success State */}
            {submitSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-sls-chartreuse/20 flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-sls-teal" />
                </div>
                <h3 className="text-lg font-semibold text-sls-teal mb-2">
                  {tContact("successTitle")}
                </h3>
                <p className="text-sm text-sls-olive mb-6">
                  {tContact("successMessage")}
                </p>
                <button
                  onClick={handleBackToAvatar}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-sls-orange text-white font-medium hover:bg-sls-orange/90 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>{locale === "de" ? "Zurück zu George" : "Back to George"}</span>
                </button>
              </div>
            ) : (
              /* Contact Form */
              <form onSubmit={handleContactSubmit} className="flex-1 flex flex-col gap-3 overflow-y-auto">
                <p className="text-sm text-sls-olive mb-2">
                  {t("demo.contactPrompt")}
                </p>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                    <input
                      type="text"
                      required
                      placeholder={`${tContact("name")} *`}
                      value={contactForm.name}
                      onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                    <input
                      type="email"
                      required
                      placeholder={`${tContact("email")} *`}
                      value={contactForm.email}
                      onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Phone & Company Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                    <input
                      type="tel"
                      placeholder={tContact("phone")}
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                    <input
                      type="text"
                      placeholder={tContact("company")}
                      value={contactForm.company}
                      onChange={(e) => setContactForm((p) => ({ ...p, company: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Message */}
                <textarea
                  required
                  placeholder={`${tContact("message")} *`}
                  value={contactForm.message}
                  onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all resize-none flex-1 min-h-[80px]"
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2",
                    "bg-sls-orange hover:bg-sls-orange/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{tContact("sending")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{tContact("send")}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-3 -right-3 w-20 h-20 rounded-xl bg-sls-chartreuse/20 -z-10" />
      <div className="absolute -bottom-3 -left-3 w-24 h-24 rounded-xl bg-sls-orange/10 -z-10" />
    </div>
  );
}
