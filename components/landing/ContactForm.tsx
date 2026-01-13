"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactFormProps {
  source?: string;
  className?: string;
}

export function ContactForm({ source = "website", className }: ContactFormProps) {
  const t = useTranslations("contact");
  const locale = useLocale();
  const submitContact = useMutation(api.landing.submitContactForm);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await submitContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        message: formData.message,
        locale,
        source,
      });

      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: "",
      });
    } catch (err) {
      setError(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-16 h-16 rounded-full bg-sls-chartreuse/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-sls-chartreuse" />
        </div>
        <h3 className="text-2xl font-bold text-sls-teal mb-2">
          {t("successTitle")}
        </h3>
        <p className="text-sls-olive">
          {t("successMessage")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Name & Email */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-sls-teal mb-2">
            {t("name")} *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-sls-beige bg-white text-sls-teal placeholder-sls-olive/50 focus:border-sls-teal focus:outline-none transition-colors"
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-sls-teal mb-2">
            {t("email")} *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-sls-beige bg-white text-sls-teal placeholder-sls-olive/50 focus:border-sls-teal focus:outline-none transition-colors"
            placeholder={t("emailPlaceholder")}
          />
        </div>
      </div>

      {/* Phone & Company */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-sls-teal mb-2">
            {t("phone")}
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-sls-beige bg-white text-sls-teal placeholder-sls-olive/50 focus:border-sls-teal focus:outline-none transition-colors"
            placeholder={t("phonePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-sls-teal mb-2">
            {t("company")}
          </label>
          <input
            type="text"
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-sls-beige bg-white text-sls-teal placeholder-sls-olive/50 focus:border-sls-teal focus:outline-none transition-colors"
            placeholder={t("companyPlaceholder")}
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-sls-teal mb-2">
          {t("message")} *
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border-2 border-sls-beige bg-white text-sls-teal placeholder-sls-olive/50 focus:border-sls-teal focus:outline-none transition-colors resize-none"
          placeholder={t("messagePlaceholder")}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sls-orange text-white font-semibold text-lg transition-all hover:bg-sls-orange/90 hover:shadow-xl hover:shadow-sls-orange/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t("sending")}
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            {t("send")}
          </>
        )}
      </button>
    </form>
  );
}
