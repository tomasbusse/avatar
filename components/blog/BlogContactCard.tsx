"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlogContactCardProps {
  headline?: string;
  email?: string;
  phone?: string;
  address?: string;
  ctaText?: string;
  ctaLink?: string;
  className?: string;
}

export function BlogContactCard({
  headline = "Questions? We're Here to Help",
  email = "james@englisch-lehrer.com",
  phone = "+49 511 47 39 339",
  address = "Im Werkhof Schaufelder Straße 11 30167 Hannover",
  ctaText = "Book Free Consultation",
  ctaLink = "/contact",
  className,
}: BlogContactCardProps) {
  return (
    <div
      className={cn(
        "bg-sls-teal rounded-2xl p-8 text-white",
        className
      )}
    >
      <h3 className="text-xl font-bold mb-6">{headline}</h3>

      <div className="flex flex-col gap-4 mb-8">
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-3 hover:text-sls-chartreuse transition-colors"
        >
          <Mail className="h-5 w-5 flex-shrink-0" />
          <span>{email}</span>
        </a>

        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="flex items-center gap-3 hover:text-sls-chartreuse transition-colors"
        >
          <Phone className="h-5 w-5 flex-shrink-0" />
          <span>{phone}</span>
        </a>

        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{address}</span>
        </div>
      </div>

      <Button
        asChild
        className="w-full bg-sls-orange hover:bg-sls-orange/90 text-white font-semibold py-3 rounded-lg transition-all hover:-translate-y-0.5"
      >
        <Link href={ctaLink}>
          {ctaText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
