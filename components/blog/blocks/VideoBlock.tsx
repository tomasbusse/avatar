"use client";

import { useState } from "react";
import type { VideoBlockConfig } from "@/types/blog-blocks";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoBlockProps {
  config: VideoBlockConfig;
}

export function VideoBlock({ config }: VideoBlockProps) {
  const {
    provider,
    videoId,
    embedCode,
    url,
    title,
    thumbnail,
    autoplay = false,
    aspectRatio = "16:9",
  } = config;

  const [isPlaying, setIsPlaying] = useState(autoplay);

  const aspectRatioStyles = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
    "9:16": "aspect-[9/16]",
  };

  // Generate embed URL based on provider
  const getEmbedUrl = () => {
    switch (provider) {
      case "youtube":
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      case "vimeo":
        return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
      case "custom":
        return url;
      default:
        return null;
    }
  };

  // Generate thumbnail URL based on provider
  const getThumbnailUrl = () => {
    if (thumbnail) return thumbnail;
    switch (provider) {
      case "youtube":
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      case "vimeo":
        // Vimeo requires API call for thumbnail, use placeholder
        return null;
      default:
        return null;
    }
  };

  const embedUrl = getEmbedUrl();
  const thumbnailUrl = getThumbnailUrl();

  return (
    <section className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden shadow-xl shadow-sls-teal/10 bg-sls-olive/5",
            aspectRatioStyles[aspectRatio]
          )}
        >
          {/* Custom embed code (iframe) */}
          {provider === "embed" && embedCode ? (
            <div
              className="absolute inset-0 [&_iframe]:w-full [&_iframe]:h-full"
              dangerouslySetInnerHTML={{ __html: embedCode }}
            />
          ) : isPlaying && embedUrl ? (
            // Playing state - show iframe
            <iframe
              src={embedUrl}
              title={title || "Video"}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // Thumbnail state - show play button
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 w-full h-full group"
            >
              {/* Thumbnail or gradient background */}
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={title || "Video thumbnail"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-sls-teal to-sls-olive" />
              )}

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-sls-teal ml-1" fill="currentColor" />
                </div>
              </div>

              {/* Title overlay */}
              {title && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                  <h3 className="text-white font-semibold text-lg">{title}</h3>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Title below video if showing player */}
        {isPlaying && title && (
          <p className="mt-4 text-center text-sm text-sls-olive/60">
            {title}
          </p>
        )}
      </div>
    </section>
  );
}
