"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { MessageCircle, Sparkles, Play, Bug, Send, ArrowLeft, User, Building2, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import dynamic from "next/dynamic";
import { api } from "@/convex/_generated/api";

// Dynamically import LandingAvatarRoom to avoid SSR issues with LiveKit
const LandingAvatarRoom = dynamic(
  () => import("./LandingAvatarRoom").then((mod) => mod.LandingAvatarRoom),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive rounded-3xl">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-sm opacity-80">Connecting...</p>
        </div>
      </div>
    ),
  }
);

interface DebugLog {
  timestamp: string;
  event: string;
  data?: Record<string, unknown>;
}

interface AvatarDisplayProps {
  avatarId?: string;
  className?: string;
  profileImage?: string;
  avatarName?: string;
  avatarGreeting?: string;
  isLoading?: boolean;
  debug?: boolean;
  locale?: string;
  /** Full avatar object for LiveKit connection */
  avatar?: {
    _id: string;
    name: string;
    profileImage?: string;
    visionConfig?: {
      enabled?: boolean;
      captureWebcam?: boolean;
    };
    [key: string]: any;
  };
}

export function AvatarDisplay({
  avatarId,
  className,
  profileImage,
  avatarName = "Emma",
  avatarGreeting,
  isLoading: dataLoading = false,
  debug: debugProp = false,
  locale = "en",
  avatar,
}: AvatarDisplayProps) {
  const t = useTranslations("hero");
  const tContact = useTranslations("contact");
  const searchParams = useSearchParams();
  const [isActivated, setIsActivated] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

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

  // Get avatar session config
  const avatarConfig = useQuery(api.landing.getLandingAvatarConfig);
  const submitContact = useMutation(api.landing.submitContactForm);

  // Check for debug mode via URL param or prop
  const debugMode = debugProp || searchParams.get("debug") === "true";

  // Debug logging function
  const logDebug = (event: string, data?: Record<string, unknown>) => {
    if (!debugMode) return;
    const log: DebugLog = {
      timestamp: new Date().toISOString().split("T")[1].split(".")[0],
      event,
      data,
    };
    console.log(`[Avatar Debug] ${log.timestamp} - ${event}`, data || "");
    setDebugLogs((prev) => [...prev.slice(-19), log]); // Keep last 20 logs
  };

  // Log initial mount and data changes
  useEffect(() => {
    logDebug("Component mounted", {
      avatarId,
      avatarName,
      hasProfileImage: !!profileImage,
      hasFullAvatar: !!avatar,
      visionEnabled: avatar?.visionConfig?.enabled,
      dataLoading,
    });
  }, []);

  useEffect(() => {
    logDebug("Data loading state changed", { dataLoading });
  }, [dataLoading]);

  useEffect(() => {
    if (profileImage) {
      logDebug("Profile image received", { url: profileImage });
    }
  }, [profileImage]);

  // Greeting text from props (CMS) or fallback to translation
  const greeting = avatarGreeting || t("avatarGreeting");

  // Handle play button click to activate live avatar
  const handleActivate = () => {
    if (!avatar) {
      logDebug("Cannot activate - no avatar data", { avatarId });
      return;
    }
    logDebug("Play button clicked - Starting LiveKit connection", {
      avatarId: avatar._id,
      avatarName: avatar.name,
      visionEnabled: avatar.visionConfig?.enabled,
    });
    setIsFlipped(false);
    setIsActivated(true);
  };

  // Handle closing the LiveKit session - flip to contact form
  const handleClose = (reason?: string) => {
    logDebug("LiveKit session closed", { reason });
    setIsActivated(false);

    // Show contact form if configured or on timeout
    if (avatarConfig?.showContactFormOnStop !== false) {
      setIsFlipped(true);
    }
  };

  // Handle going back to avatar from contact form
  const handleBackToAvatar = () => {
    setIsFlipped(false);
    setSubmitSuccess(false);
  };

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
        source: "avatar_session",
      });
      setSubmitSuccess(true);
      setContactForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build avatar object for LiveKit (use full avatar if available, otherwise construct from props)
  const avatarForLiveKit = avatar || (avatarId ? {
    _id: avatarId,
    name: avatarName,
    profileImage,
  } : null);

  return (
    <div
      className={cn(
        "relative w-full max-w-md",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: "1000px" }}
    >
      {/* Flip Container */}
      <div
        className={cn(
          "relative aspect-[3/4] transition-transform duration-700 ease-in-out",
          "[transform-style:preserve-3d]"
        )}
        style={{
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front Side - Avatar */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-sls-teal to-sls-olive shadow-2xl shadow-sls-teal/20",
            "[backface-visibility:hidden]"
          )}
        >
          {/* Activated State: Real LiveKit Video Stream */}
          {isActivated && avatarForLiveKit && (
            <LandingAvatarRoom
              avatar={avatarForLiveKit}
              onClose={handleClose}
              className="absolute inset-0"
              sessionTimeoutSeconds={avatarConfig?.sessionTimeoutSeconds ?? 300}
              warningAtSeconds={avatarConfig?.warningAtSeconds ?? 60}
            />
          )}

          {/* Initial State: Profile Image with Play Button */}
          {!isActivated && (
            <>
              {/* Profile Image Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal" />

              {/* Avatar Profile Image with Play Button Below */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 pb-28 sm:pb-32">
                {/* Profile Image Container */}
                <div className="relative mb-6">
                  {profileImage ? (
                    <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                      <Image
                        src={profileImage}
                        alt={avatarName}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-sls-cream/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                      <span className="text-5xl sm:text-6xl font-bold text-white/80">
                        {avatarName.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Animated Ring */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full border-4 border-sls-chartreuse/50 transition-all duration-500",
                      isHovered ? "scale-110 opacity-100" : "scale-100 opacity-50"
                    )}
                  />
                </div>

                {/* Play Button - Positioned Below Profile Image */}
                <button
                  onClick={handleActivate}
                  disabled={dataLoading || !avatarForLiveKit}
                  className="group cursor-pointer disabled:cursor-not-allowed"
                >
                  <div className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sls-orange flex items-center justify-center shadow-xl transition-all",
                    "group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-sls-orange/40",
                    "group-active:scale-95",
                    "group-disabled:opacity-50 group-disabled:scale-100"
                  )}>
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
                  </div>
                </button>
              </div>

              {/* Decorative Particles */}
              <div className="absolute top-6 sm:top-8 right-6 sm:right-8 animate-bounce">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-sls-chartreuse/60" />
              </div>
              <div className="absolute bottom-24 sm:bottom-28 left-6 sm:left-8 animate-pulse hidden sm:block">
                <Sparkles className="w-4 h-4 text-white/40" />
              </div>

              {/* Click to Start Badge */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/90 text-sls-teal text-[10px] sm:text-xs font-semibold">
                {dataLoading ? (
                  <>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-sls-teal/30 border-t-sls-teal rounded-full animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">{t("clickToStart") || "Click to Start"}</span>
                    <span className="sm:hidden">Play</span>
                  </>
                )}
              </div>

              {/* Speech Bubble */}
              <div
                className={cn(
                  "absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300",
                  "opacity-100 translate-y-0"
                )}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-sls-teal flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sls-teal font-medium text-xs sm:text-sm">{avatarName}</p>
                    <p className="text-sls-olive text-xs sm:text-sm mt-0.5 line-clamp-2">
                      {greeting}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Back Side - Contact Form */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-sls-cream to-white shadow-2xl shadow-sls-teal/20",
            "[backface-visibility:hidden]",
            "[transform:rotateY(180deg)]"
          )}
        >
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col">
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
                  {locale === "de" ? "Nachricht gesendet!" : "Message Sent!"}
                </h3>
                <p className="text-sm text-sls-olive mb-6">
                  {locale === "de"
                    ? "Wir melden uns innerhalb von 24 Stunden bei Ihnen."
                    : "We'll get back to you within 24 hours."}
                </p>
                <button
                  onClick={handleBackToAvatar}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-sls-orange text-white font-medium hover:bg-sls-orange/90 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>{locale === "de" ? "Nochmal sprechen" : "Talk Again"}</span>
                </button>
              </div>
            ) : (
              /* Contact Form */
              <form onSubmit={handleContactSubmit} className="flex-1 flex flex-col gap-3 overflow-y-auto">
                <p className="text-sm text-sls-olive mb-2">
                  {locale === "de"
                    ? "Interessiert? Hinterlassen Sie uns eine Nachricht!"
                    : "Interested? Leave us a message!"}
                </p>

                {/* Name & Email Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                    <input
                      type="text"
                      required
                      placeholder={locale === "de" ? "Name *" : "Name *"}
                      value={contactForm.name}
                      onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
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
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Phone & Company Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                    <input
                      type="tel"
                      placeholder={locale === "de" ? "Telefon" : "Phone"}
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sls-olive/50" />
                    <input
                      type="text"
                      placeholder={locale === "de" ? "Firma" : "Company"}
                      value={contactForm.company}
                      onChange={(e) => setContactForm((p) => ({ ...p, company: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Message */}
                <textarea
                  required
                  placeholder={locale === "de" ? "Ihre Nachricht *" : "Your message *"}
                  value={contactForm.message}
                  onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-sls-beige bg-white focus:border-sls-teal focus:ring-1 focus:ring-sls-teal/20 outline-none transition-all resize-none flex-1 min-h-[80px]"
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
                      <span>{locale === "de" ? "Wird gesendet..." : "Sending..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{locale === "de" ? "Nachricht senden" : "Send Message"}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-sls-chartreuse/20 -z-10" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-2xl bg-sls-orange/10 -z-10" />

      {/* Debug Mode UI */}
      {debugMode && (
        <>
          {/* Debug Toggle Button */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="absolute -top-2 -right-2 z-50 p-2 rounded-full bg-yellow-500 text-black shadow-lg hover:bg-yellow-400 transition-colors"
            title="Toggle Debug Panel"
          >
            <Bug className="w-4 h-4" />
          </button>

          {/* Debug Panel */}
          {showDebugPanel && (
            <div className="absolute top-8 right-0 z-50 w-80 max-h-96 overflow-auto bg-black/90 text-green-400 text-xs font-mono rounded-lg shadow-2xl p-3">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-400/30">
                <span className="text-yellow-400 font-bold">🐛 Avatar Debug</span>
                <button
                  onClick={() => setDebugLogs([])}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Clear
                </button>
              </div>

              {/* Current State */}
              <div className="mb-3 p-2 bg-green-400/10 rounded">
                <div className="text-yellow-400 font-bold mb-1">Current State:</div>
                <div>avatarId: {avatarId || avatar?._id || "undefined"}</div>
                <div>avatarName: {avatarName}</div>
                <div>profileImage: {profileImage ? "✅ loaded" : "❌ missing"}</div>
                <div>fullAvatar: {avatar ? "✅ available" : "❌ missing"}</div>
                <div>visionEnabled: {avatar?.visionConfig?.enabled ? "✅ true" : "❌ false"}</div>
                <div>dataLoading: {dataLoading ? "⏳ true" : "✅ false"}</div>
                <div>isActivated: {isActivated ? "✅ LIVE" : "false"}</div>
                <div>isFlipped: {isFlipped ? "✅ CONTACT" : "false"}</div>
                <div>timeout: {avatarConfig?.sessionTimeoutSeconds ?? 300}s</div>
              </div>

              {/* Event Log */}
              <div className="text-yellow-400 font-bold mb-1">Event Log:</div>
              <div className="space-y-1">
                {debugLogs.length === 0 ? (
                  <div className="text-gray-500 italic">No events logged yet...</div>
                ) : (
                  debugLogs.map((log, i) => (
                    <div key={i} className="border-l-2 border-green-400/30 pl-2">
                      <span className="text-gray-500">{log.timestamp}</span>{" "}
                      <span className="text-green-300">{log.event}</span>
                      {log.data && (
                        <pre className="text-gray-400 text-[10px] mt-0.5 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Debug Status Indicator */}
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-600 text-xs rounded-full">
              <Bug className="w-3 h-3" />
              Debug Mode Active - Add ?debug=true to URL
            </span>
          </div>
        </>
      )}
    </div>
  );
}
