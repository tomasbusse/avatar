"use client";

import type { RichTextBlockConfig } from "@/types/blog-blocks";
import { cn } from "@/lib/utils";

interface RichTextBlockProps {
  config: RichTextBlockConfig;
}

// Simple markdown to HTML conversion
function parseMarkdown(markdown: string): string {
  let html = markdown
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-sls-teal mt-8 mb-4">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-sls-teal mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-sls-teal mt-12 mb-6">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-sls-teal">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-sls-orange hover:text-sls-orange/80 underline underline-offset-2 transition-colors">$1</a>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-sls-beige/50 text-sls-teal text-sm font-mono">$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-6 list-disc text-sls-olive/80">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="ml-6 list-disc text-sls-olive/80">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-6 list-decimal text-sls-olive/80">$1</li>')
    // Wrap consecutive list items
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="space-y-2 my-4">${match}</ol>`;
      }
      return `<ul class="space-y-2 my-4">${match}</ul>`;
    })
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-sls-chartreuse pl-4 py-2 my-4 italic text-sls-olive/80">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-8 border-sls-beige" />')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="text-sls-olive/80 leading-relaxed mb-4">')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br />');

  // Wrap in paragraph tags
  html = `<p class="text-sls-olive/80 leading-relaxed mb-4">${html}</p>`;

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
            // Custom prose styles
            "[&_h1]:text-sls-teal [&_h2]:text-sls-teal [&_h3]:text-sls-teal",
            "[&_a]:text-sls-orange [&_a:hover]:text-sls-orange/80",
            "[&_strong]:text-sls-teal [&_strong]:font-semibold",
            "[&_blockquote]:border-sls-chartreuse [&_blockquote]:text-sls-olive/80",
            "[&_code]:bg-sls-beige/50 [&_code]:text-sls-teal",
            "[&_hr]:border-sls-beige"
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
