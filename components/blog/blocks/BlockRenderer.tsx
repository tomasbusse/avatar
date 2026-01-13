"use client";

import { Suspense, lazy } from "react";
import type { BlogBlock } from "@/types/blog-blocks";

// Eager load lightweight components
import { HeroBlock } from "./HeroBlock";
import { RichTextBlock } from "./RichTextBlock";
import { ImageBlock } from "./ImageBlock";
import { CalloutBlock } from "./CalloutBlock";
import { QuoteBlock } from "./QuoteBlock";
import { DividerBlock } from "./DividerBlock";
import { FAQBlock } from "./FAQBlock";
import { CTABlock } from "./CTABlock";

// Lazy load heavy components
const VideoBlock = lazy(() => import("./VideoBlock").then(m => ({ default: m.VideoBlock })));
const GameBlock = lazy(() => import("./GameBlock").then(m => ({ default: m.GameBlock })));
const CodeBlock = lazy(() => import("./CodeBlock").then(m => ({ default: m.CodeBlock })));
const RelatedPostsBlock = lazy(() => import("./RelatedPostsBlock").then(m => ({ default: m.RelatedPostsBlock })));

// Loading skeletons
function BlockSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-sls-beige/30 rounded-2xl"
      style={{ height }}
    />
  );
}

interface BlockRendererProps {
  block: BlogBlock;
  locale: string;
  postSlug?: string;
  postTitle?: string;
  author?: string;
  authorImageUrl?: string;
  publishedAt?: number;
  readTimeMinutes?: number;
}

export function BlockRenderer({
  block,
  locale,
  postSlug,
  postTitle,
  author,
  authorImageUrl,
  publishedAt,
  readTimeMinutes,
}: BlockRendererProps) {
  const config = block.config;

  switch (config.type) {
    case "hero":
      return (
        <HeroBlock
          config={{
            ...config,
            author: config.author || author,
            authorImageUrl: config.authorImageUrl || authorImageUrl,
            publishedAt: config.publishedAt || publishedAt,
            readTimeMinutes: config.readTimeMinutes || readTimeMinutes,
          }}
          locale={locale}
        />
      );

    case "rich_text":
      return <RichTextBlock config={config} />;

    case "image":
      return <ImageBlock config={config} />;

    case "video":
      return (
        <Suspense fallback={<BlockSkeleton height={400} />}>
          <VideoBlock config={config} />
        </Suspense>
      );

    case "game":
      return (
        <Suspense fallback={<BlockSkeleton height={500} />}>
          <GameBlock config={config} postSlug={postSlug} />
        </Suspense>
      );

    case "code":
      return (
        <Suspense fallback={<BlockSkeleton height={200} />}>
          <CodeBlock config={config} />
        </Suspense>
      );

    case "callout":
      return <CalloutBlock config={config} />;

    case "faq":
      return <FAQBlock config={config} />;

    case "cta":
      return <CTABlock config={config} />;

    case "related_posts":
      return (
        <Suspense fallback={<BlockSkeleton height={300} />}>
          <RelatedPostsBlock config={config} locale={locale} currentPostSlug={postSlug} />
        </Suspense>
      );

    case "quote":
      return <QuoteBlock config={config} />;

    case "divider":
      return <DividerBlock config={config} />;

    default:
      console.warn(`Unknown block type: ${(config as any).type}`);
      return null;
  }
}
