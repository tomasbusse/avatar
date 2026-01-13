"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeFlags, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Replace the locale in the current path
    const segments = pathname.split("/");

    // Check if current path starts with a locale
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    const newPath = segments.join("/") || "/";
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-sls-beige/50">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            locale === loc
              ? "bg-white text-sls-teal shadow-sm"
              : "text-sls-olive hover:text-sls-teal"
          )}
        >
          <span className="text-base">{localeFlags[loc]}</span>
          <span className="uppercase">{loc}</span>
        </button>
      ))}
    </div>
  );
}
