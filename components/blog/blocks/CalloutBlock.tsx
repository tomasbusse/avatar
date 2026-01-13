"use client";

import type { CalloutBlockConfig } from "@/types/blog-blocks";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Sparkles,
  BookOpen,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalloutBlockProps {
  config: CalloutBlockConfig;
}

const variantConfig = {
  tip: {
    icon: Lightbulb,
    title: "Tip",
    containerClass: "bg-sls-chartreuse/10 border-sls-chartreuse/50",
    iconClass: "text-sls-chartreuse",
    titleClass: "text-sls-olive",
  },
  warning: {
    icon: AlertTriangle,
    title: "Warning",
    containerClass: "bg-sls-orange/10 border-sls-orange/50",
    iconClass: "text-sls-orange",
    titleClass: "text-sls-orange",
  },
  info: {
    icon: Info,
    title: "Info",
    containerClass: "bg-sls-teal/10 border-sls-teal/30",
    iconClass: "text-sls-teal",
    titleClass: "text-sls-teal",
  },
  success: {
    icon: CheckCircle,
    title: "Success",
    containerClass: "bg-green-50 border-green-300",
    iconClass: "text-green-600",
    titleClass: "text-green-700",
  },
  error: {
    icon: XCircle,
    title: "Error",
    containerClass: "bg-red-50 border-red-300",
    iconClass: "text-red-600",
    titleClass: "text-red-700",
  },
  note: {
    icon: BookOpen,
    title: "Note",
    containerClass: "bg-sls-beige/50 border-sls-beige",
    iconClass: "text-sls-olive",
    titleClass: "text-sls-olive",
  },
  quote: {
    icon: MessageCircle,
    title: "Quote",
    containerClass: "bg-sls-cream border-sls-beige",
    iconClass: "text-sls-olive/70",
    titleClass: "text-sls-olive",
  },
  highlight: {
    icon: Sparkles,
    title: "Highlight",
    containerClass: "bg-gradient-to-br from-sls-chartreuse/10 to-sls-teal/10 border-sls-teal/30",
    iconClass: "text-sls-teal",
    titleClass: "text-sls-teal",
  },
};

export function CalloutBlock({ config }: CalloutBlockProps) {
  const {
    variant = "info",
    title,
    content,
    icon: customIcon,
    collapsible = false,
  } = config;

  const variantInfo = variantConfig[variant] || variantConfig.info;
  const Icon = variantInfo.icon;

  // Parse simple markdown in content
  const parseContent = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-white/50 text-sls-teal text-sm font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-sls-orange hover:underline">$1</a>')
      .replace(/\n/g, '<br />');
  };

  const displayTitle = title || variantInfo.title;

  if (collapsible) {
    return (
      <section className="py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <details className={cn(
            "group rounded-xl border-l-4 overflow-hidden",
            variantInfo.containerClass
          )}>
            <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/30 transition-colors">
              <Icon className={cn("w-5 h-5 flex-shrink-0", variantInfo.iconClass)} />
              <span className={cn("font-semibold", variantInfo.titleClass)}>
                {displayTitle}
              </span>
              <svg
                className="w-5 h-5 ml-auto text-sls-olive/50 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4 pt-0">
              <div
                className="text-sls-olive/80 leading-relaxed pl-8"
                dangerouslySetInnerHTML={{ __html: parseContent(content) }}
              />
            </div>
          </details>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "rounded-xl border-l-4 p-4",
          variantInfo.containerClass
        )}>
          <div className="flex items-start gap-3">
            <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", variantInfo.iconClass)} />
            <div className="flex-1 min-w-0">
              {displayTitle && (
                <p className={cn("font-semibold mb-1", variantInfo.titleClass)}>
                  {displayTitle}
                </p>
              )}
              <div
                className="text-sls-olive/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseContent(content) }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
