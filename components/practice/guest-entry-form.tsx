"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Mail, MessageSquare } from "lucide-react";
import Image from "next/image";

interface CustomField {
  id: string;
  label: string;
  type: "text" | "select";
  required: boolean;
  options?: string[];
}

interface GuestSettings {
  collectName?: boolean;
  collectEmail?: boolean;
  nameRequired?: boolean;
  emailRequired?: boolean;
  customFields?: CustomField[];
  termsRequired?: boolean;
  termsText?: string;
  welcomeNote?: string;
}

interface GuestFormData {
  name?: string;
  email?: string;
  customFields?: Record<string, string>;
  acceptedTerms?: boolean;
}

interface GuestEntryFormProps {
  settings: GuestSettings;
  avatarName: string;
  avatarImage?: string;
  onSubmit: (data: GuestFormData) => void;
  isLoading?: boolean;
  className?: string;
}

export function GuestEntryForm({
  settings,
  avatarName,
  avatarImage,
  onSubmit,
  isLoading = false,
  className,
}: GuestEntryFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error when user types
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (settings.collectName && settings.nameRequired && !name.trim()) {
      newErrors.name = "Name is required";
    }

    if (settings.collectEmail && settings.emailRequired) {
      if (!email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Please enter a valid email";
      }
    }

    if (settings.customFields) {
      for (const field of settings.customFields) {
        if (field.required && !customFields[field.id]?.trim()) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    }

    if (settings.termsRequired && !acceptedTerms) {
      newErrors.terms = "You must accept the terms to continue";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      customFields:
        Object.keys(customFields).length > 0 ? customFields : undefined,
      acceptedTerms: settings.termsRequired ? acceptedTerms : undefined,
    });
  };

  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8",
        className
      )}
    >
      {/* Avatar header */}
      <div className="flex flex-col items-center mb-6">
        {avatarImage && (
          <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-[#E3C6AB]">
            <Image
              src={avatarImage}
              alt={avatarName}
              fill
              className="object-cover"
            />
          </div>
        )}
        <h2 className="text-xl font-semibold text-[#003F37]">
          Join the conversation
        </h2>
        <p className="text-[#4F5338] text-sm mt-1">with {avatarName}</p>
      </div>

      {/* Welcome note */}
      {settings.welcomeNote && (
        <div className="bg-[#FFE8CD] rounded-lg p-4 mb-6 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-[#003F37] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#003F37]">{settings.welcomeNote}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        {settings.collectName && (
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="flex items-center gap-2 text-[#003F37]"
            >
              <User className="w-4 h-4" />
              Your name
              {settings.nameRequired && (
                <span className="text-[#B25627]">*</span>
              )}
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              className={cn(
                "border-[#E3C6AB] focus:border-[#003F37] focus:ring-[#003F37]",
                errors.name && "border-red-500"
              )}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
        )}

        {/* Email field */}
        {settings.collectEmail && (
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="flex items-center gap-2 text-[#003F37]"
            >
              <Mail className="w-4 h-4" />
              Email address
              {settings.emailRequired && (
                <span className="text-[#B25627]">*</span>
              )}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
              className={cn(
                "border-[#E3C6AB] focus:border-[#003F37] focus:ring-[#003F37]",
                errors.email && "border-red-500"
              )}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        )}

        {/* Custom fields */}
        {settings.customFields?.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-[#003F37]">
              {field.label}
              {field.required && <span className="text-[#B25627]">*</span>}
            </Label>

            {field.type === "text" ? (
              <Input
                id={field.id}
                type="text"
                value={customFields[field.id] || ""}
                onChange={(e) =>
                  handleCustomFieldChange(field.id, e.target.value)
                }
                className={cn(
                  "border-[#E3C6AB] focus:border-[#003F37] focus:ring-[#003F37]",
                  errors[field.id] && "border-red-500"
                )}
              />
            ) : (
              <Select
                value={customFields[field.id] || ""}
                onValueChange={(value) =>
                  handleCustomFieldChange(field.id, value)
                }
              >
                <SelectTrigger
                  className={cn(
                    "border-[#E3C6AB] focus:border-[#003F37] focus:ring-[#003F37]",
                    errors[field.id] && "border-red-500"
                  )}
                >
                  <SelectValue placeholder={`Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {errors[field.id] && (
              <p className="text-sm text-red-500">{errors[field.id]}</p>
            )}
          </div>
        ))}

        {/* Terms checkbox */}
        {settings.termsRequired && (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => {
                  setAcceptedTerms(checked === true);
                  if (errors.terms) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.terms;
                      return next;
                    });
                  }
                }}
                className="mt-1"
              />
              <Label
                htmlFor="terms"
                className="text-sm text-[#4F5338] leading-relaxed cursor-pointer"
              >
                {settings.termsText ||
                  "I agree to the terms and conditions for using this service."}
              </Label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-500">{errors.terms}</p>
            )}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#003F37] hover:bg-[#004a40] text-[#FFE8CD] font-semibold mt-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            "Continue to Practice"
          )}
        </Button>
      </form>
    </div>
  );
}
