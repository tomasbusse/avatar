"use client";

import type { RichTextBlockConfig } from "@/types/blog-blocks";
import { cn } from "@/lib/utils";

interface RichTextBlockProps {
  config: RichTextBlockConfig;
}

// Simple markdown to HTML conversion - Professional journalistic styling
function parseMarkdown(markdown: string): string {
  let html = markdown
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers - Professional typography with serif font for H2
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-sls-olive uppercase tracking-wide mt-10 mb-4">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold text-sls-teal font-serif mt-12 mb-5">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-semibold text-sls-teal font-serif mt-14 mb-6">$1</h1>')
    // Bold and italic - Subtle, no color change
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-medium"><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-sls-teal hover:text-sls-orange underline underline-offset-2 transition-colors">$1</a>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-sls-beige/30 text-sls-olive text-sm font-mono">$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-6 list-disc text-sls-olive/80">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="ml-6 list-disc text-sls-olive/80">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-6 list-decimal text-sls-olive/80">$1</li>')
    // Wrap consecutive list items
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="space-y-3 my-6">${match}</ol>`;
      }
      return `<ul class="space-y-3 my-6">${match}</ul>`;
    })
    // Blockquotes - Professional with serif font
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-sls-olive/30 pl-6 py-3 my-6 font-serif italic text-sls-olive/80 text-lg">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-10 border-sls-beige" />')
    // Paragraphs (double newlines) - Larger text with generous line height
    .replace(/\n\n/g, '</p><p class="text-sls-olive/80 text-lg leading-loose mb-6">')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br />');

  // Wrap in paragraph tags - Larger text with generous line height
  html = `<p class="text-sls-olive/80 text-lg leading-loose mb-6">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');

  return html;
}

export function RichTextBlock({ config }: RichTextBlockProps) {
  const { content, variant = "default" } = config;

  const variantStyles = {
    default: "text-base",
    lead: "text-lg lg:text-xl leading-relaxed",
    small: "text-sm",
  };

  const html = parseMarkdown(content);

  return (
    <section className="py-4">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "prose prose-sls max-w-none",
            variantStyles[variant],
            // Custom prose styles - Professional journalistic look
            "[&_h1]:text-sls-teal [&_h1]:font-serif [&_h2]:text-sls-teal [&_h2]:font-serif [&_h3]:text-sls-olive [&_h3]:uppercase [&_h3]:tracking-wide",
            "[&_a]:text-sls-teal [&_a:hover]:text-sls-orange",
            "[&_strong]:font-medium",
            "[&_blockquote]:border-sls-olive/30 [&_blockquote]:font-serif [&_blockquote]:text-sls-olive/80",
            "[&_code]:bg-sls-beige/30 [&_code]:text-sls-olive",
            "[&_hr]:border-sls-beige"
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
