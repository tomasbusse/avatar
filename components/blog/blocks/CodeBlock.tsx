"use client";

import { useState } from "react";
import type { CodeBlockConfig } from "@/types/blog-blocks";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  config: CodeBlockConfig;
}

// Language display names and colors
const languageConfig: Record<string, { name: string; color: string }> = {
  javascript: { name: "JavaScript", color: "bg-yellow-400/20 text-yellow-700" },
  typescript: { name: "TypeScript", color: "bg-blue-400/20 text-blue-700" },
  python: { name: "Python", color: "bg-green-400/20 text-green-700" },
  html: { name: "HTML", color: "bg-orange-400/20 text-orange-700" },
  css: { name: "CSS", color: "bg-purple-400/20 text-purple-700" },
  json: { name: "JSON", color: "bg-gray-400/20 text-gray-700" },
  bash: { name: "Bash", color: "bg-gray-400/20 text-gray-700" },
  sql: { name: "SQL", color: "bg-cyan-400/20 text-cyan-700" },
  markdown: { name: "Markdown", color: "bg-gray-400/20 text-gray-700" },
  yaml: { name: "YAML", color: "bg-red-400/20 text-red-700" },
  go: { name: "Go", color: "bg-cyan-400/20 text-cyan-700" },
  rust: { name: "Rust", color: "bg-orange-400/20 text-orange-700" },
  java: { name: "Java", color: "bg-red-400/20 text-red-700" },
  csharp: { name: "C#", color: "bg-purple-400/20 text-purple-700" },
  php: { name: "PHP", color: "bg-indigo-400/20 text-indigo-700" },
  ruby: { name: "Ruby", color: "bg-red-400/20 text-red-700" },
  swift: { name: "Swift", color: "bg-orange-400/20 text-orange-700" },
  kotlin: { name: "Kotlin", color: "bg-purple-400/20 text-purple-700" },
};

// Basic syntax highlighting (client-side, no external deps)
function highlightCode(code: string, language: string): string {
  // Keywords for various languages
  const keywords: Record<string, string[]> = {
    javascript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "async", "await", "import", "export", "from", "class", "extends", "new", "this", "try", "catch", "throw", "typeof", "instanceof", "null", "undefined", "true", "false"],
    typescript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "async", "await", "import", "export", "from", "class", "extends", "new", "this", "try", "catch", "throw", "typeof", "instanceof", "null", "undefined", "true", "false", "interface", "type", "enum", "implements", "private", "public", "protected", "readonly"],
    python: ["def", "class", "if", "elif", "else", "for", "while", "return", "import", "from", "as", "try", "except", "finally", "with", "lambda", "yield", "None", "True", "False", "and", "or", "not", "in", "is", "pass", "break", "continue", "async", "await"],
  };

  let highlighted = code
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight strings (double and single quotes)
  highlighted = highlighted.replace(
    /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
    '<span class="text-sls-chartreuse">$&</span>'
  );

  // Highlight comments
  highlighted = highlighted.replace(
    /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
    '<span class="text-sls-olive/50 italic">$&</span>'
  );

  // Highlight numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="text-sls-orange">$1</span>'
  );

  // Highlight keywords
  const langKeywords = keywords[language] || keywords.javascript || [];
  langKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\b`, "g");
    highlighted = highlighted.replace(
      regex,
      '<span class="text-sls-teal font-semibold">$1</span>'
    );
  });

  return highlighted;
}

export function CodeBlock({ config }: CodeBlockProps) {
  const {
    code,
    language = "javascript",
    filename,
    showLineNumbers = true,
    highlightLines = [],
  } = config;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");
  const langInfo = languageConfig[language] || { name: language, color: "bg-sls-beige text-sls-olive" };

  return (
    <section className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl overflow-hidden shadow-xl shadow-sls-teal/10 border border-sls-beige">
          {/* Header */}
          <div className="bg-gradient-to-r from-sls-olive/10 to-sls-teal/10 px-4 py-3 flex items-center justify-between border-b border-sls-beige">
            <div className="flex items-center gap-3">
              {/* Window dots */}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
              </div>

              {/* Filename or terminal indicator */}
              {filename ? (
                <span className="text-sm font-medium text-sls-olive flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  {filename}
                </span>
              ) : (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded",
                  langInfo.color
                )}>
                  {langInfo.name}
                </span>
              )}
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm text-sls-olive/70 hover:text-sls-teal transition-colors px-2 py-1 rounded hover:bg-sls-beige/50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Code content */}
          <div className="bg-sls-cream/30 overflow-x-auto">
            <pre className="text-sm font-mono p-4">
              <code>
                {lines.map((line, index) => {
                  const lineNumber = index + 1;
                  const isHighlighted = highlightLines.includes(lineNumber);
                  const highlightedLine = highlightCode(line, language);

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        isHighlighted && "bg-sls-chartreuse/20 -mx-4 px-4"
                      )}
                    >
                      {showLineNumbers && (
                        <span className="select-none text-sls-olive/30 w-10 flex-shrink-0 text-right pr-4">
                          {lineNumber}
                        </span>
                      )}
                      <span
                        className="flex-1 text-sls-olive"
                        dangerouslySetInnerHTML={{ __html: highlightedLine || "&nbsp;" }}
                      />
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
