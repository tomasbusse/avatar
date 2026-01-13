"use client";

import type { ImageBlockConfig } from "@/types/blog-blocks";
import { cn } from "@/lib/utils";

interface ImageBlockProps {
  config: ImageBlockConfig;
}

export function ImageBlock({ config }: ImageBlockProps) {
  const {
    url,
    alt,
    caption,
    width = "wide",
    alignment = "center",
    rounded = true,
    shadow = true,
  } = config;

  const widthStyles = {
    full: "w-full",
    wide: "max-w-4xl",
    medium: "max-w-2xl",
    small: "max-w-md",
  };

  const alignmentStyles = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
  };

  return (
    <figure className="py-8">
      <div className={cn(
        "px-4 sm:px-6 lg:px-8",
        width === "full" ? "" : "max-w-7xl mx-auto"
      )}>
        <div className={cn(
          widthStyles[width],
          alignmentStyles[alignment]
        )}>
          <img
            src={url}
            alt={alt}
            className={cn(
              "w-full h-auto object-cover",
              rounded && "rounded-2xl",
              shadow && "shadow-xl shadow-sls-teal/10"
            )}
          />
          {caption && (
            <figcaption className="mt-4 text-center text-sm text-sls-olive/60 italic">
              {caption}
            </figcaption>
          )}
        </div>
      </div>
    </figure>
  );
}
