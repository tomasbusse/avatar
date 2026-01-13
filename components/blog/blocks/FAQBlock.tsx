"use client";

import { useState } from "react";
import type { FAQBlockConfig } from "@/types/blog-blocks";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQBlockProps {
  config: FAQBlockConfig;
}

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  variant: "default" | "cards" | "minimal";
  index: number;
}

function FAQItem({ question, answer, isOpen, onToggle, variant, index }: FAQItemProps) {
  // Parse simple markdown in answer
  const parseContent = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-sls-teal">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-sls-beige/50 text-sls-teal text-sm font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-sls-orange hover:underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="mt-3">')
      .replace(/\n/g, '<br />');
  };

  if (variant === "cards") {
    return (
      <div
        className={cn(
          "rounded-xl border-2 overflow-hidden transition-all duration-300",
          isOpen
            ? "border-sls-teal/30 shadow-lg shadow-sls-teal/5 bg-white"
            : "border-sls-beige bg-white hover:border-sls-beige/70 hover:shadow-md"
        )}
      >
        <button
          onClick={onToggle}
          className="w-full flex items-start gap-4 p-5 text-left"
        >
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isOpen ? "bg-sls-teal text-white" : "bg-sls-teal/10 text-sls-teal"
          )}>
            <span className="font-bold text-sm">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-lg leading-tight transition-colors",
              isOpen ? "text-sls-teal" : "text-sls-olive"
            )}>
              {question}
            </h3>
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 flex-shrink-0 mt-1 transition-transform duration-300 text-sls-olive/50",
            isOpen && "rotate-180"
          )} />
        </button>
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="px-5 pb-5 pl-[4.5rem]">
            <div
              className="text-sls-olive/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: `<p>${parseContent(answer)}</p>` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="border-b border-sls-beige last:border-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-4 py-4 text-left hover:bg-sls-beige/20 transition-colors px-2 -mx-2 rounded"
        >
          <h3 className={cn(
            "font-medium transition-colors",
            isOpen ? "text-sls-teal" : "text-sls-olive"
          )}>
            {question}
          </h3>
          <ChevronDown className={cn(
            "w-4 h-4 flex-shrink-0 transition-transform duration-200 text-sls-olive/50",
            isOpen && "rotate-180"
          )} />
        </button>
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"
        )}>
          <div
            className="text-sls-olive/70 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p>${parseContent(answer)}</p>` }}
          />
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-all duration-300",
      isOpen
        ? "border-sls-chartreuse/50 bg-gradient-to-br from-sls-chartreuse/5 to-sls-teal/5"
        : "border-sls-beige bg-white hover:border-sls-beige/80"
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <MessageCircle className={cn(
          "w-5 h-5 flex-shrink-0 transition-colors",
          isOpen ? "text-sls-teal" : "text-sls-olive/50"
        )} />
        <h3 className={cn(
          "flex-1 font-semibold transition-colors",
          isOpen ? "text-sls-teal" : "text-sls-olive"
        )}>
          {question}
        </h3>
        <ChevronDown className={cn(
          "w-5 h-5 flex-shrink-0 transition-transform duration-300 text-sls-olive/50",
          isOpen && "rotate-180"
        )} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-5 pb-5 pl-14">
          <div
            className="text-sls-olive/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p>${parseContent(answer)}</p>` }}
          />
        </div>
      </div>
    </div>
  );
}

export function FAQBlock({ config }: FAQBlockProps) {
  const {
    items,
    showHeader = true,
    headerTitle = "Frequently Asked Questions",
    headerSubtitle,
    variant = "default",
  } = config;

  const [openIndexes, setOpenIndexes] = useState<number[]>([0]); // First item open by default

  const handleToggle = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? [] : [index]
    );
  };

  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {showHeader && headerTitle && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              <span>FAQ</span>
            </div>
            <h2 className="text-3xl font-bold text-sls-teal">
              {headerTitle}
            </h2>
            {headerSubtitle && (
              <p className="mt-3 text-lg text-sls-olive/70">{headerSubtitle}</p>
            )}
          </div>
        )}

        {/* FAQ Items */}
        <div className={cn(
          variant === "cards" && "grid gap-4",
          variant === "default" && "space-y-3",
          variant === "minimal" && "divide-y-0"
        )}>
          {items.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndexes.includes(index)}
              onToggle={() => handleToggle(index)}
              variant={variant}
              index={index}
            />
          ))}
        </div>

        {/* Schema.org structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": items.map((item) => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.answer,
                },
              })),
            }),
          }}
        />
      </div>
    </section>
  );
}
