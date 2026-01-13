"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const locale = useLocale();

  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center gap-2 text-sm">
        {/* Home */}
        <li>
          <Link
            href={`/${locale}`}
            className="text-sls-olive/60 hover:text-sls-teal transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>

        {/* Items */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-sls-olive/40" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-sls-olive/60 hover:text-sls-teal transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sls-teal font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
