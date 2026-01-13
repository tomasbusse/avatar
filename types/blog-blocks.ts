/**
 * Blog Content Block Types
 *
 * Multi-modal content block system for the enhanced blog.
 * Supports text, images, videos, embedded games, code, callouts, FAQs, CTAs, and more.
 */

// ============================================
// BLOCK TYPE DEFINITIONS
// ============================================

export type BlogBlockType =
  | "hero"
  | "rich_text"
  | "image"
  | "video"
  | "game"
  | "code"
  | "callout"
  | "faq"
  | "cta"
  | "related_posts"
  | "quote"
  | "divider";

export interface BlogBlock {
  id: string;
  type: BlogBlockType;
  order: number;
  config: BlockConfig;
}

// ============================================
// HERO BLOCK
// ============================================

export interface HeroBlockConfig {
  type: "hero";
  title: string;
  subtitle?: string;
  featuredImageUrl?: string;
  badge?: string;
  badgeIcon?: string;
  showAuthor?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  author?: string;
  authorImageUrl?: string;
  publishedAt?: number;
  readTimeMinutes?: number;
  variant?: "default" | "centered" | "split";
}

// ============================================
// RICH TEXT BLOCK
// ============================================

export interface RichTextBlockConfig {
  type: "rich_text";
  content: string; // Markdown content
  variant?: "default" | "lead" | "small";
}

// ============================================
// IMAGE BLOCK
// ============================================

export interface ImageBlockConfig {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
  width?: "full" | "wide" | "medium" | "small";
  alignment?: "left" | "center" | "right";
  rounded?: boolean;
  shadow?: boolean;
}

// ============================================
// VIDEO BLOCK
// ============================================

export type VideoProvider = "youtube" | "vimeo" | "custom" | "embed";

export interface VideoBlockConfig {
  type: "video";
  provider: VideoProvider;
  videoId?: string;       // For YouTube/Vimeo
  embedCode?: string;     // For custom embeds (iframe HTML)
  url?: string;           // For custom hosted video
  title?: string;
  thumbnail?: string;
  autoplay?: boolean;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "9:16";
}

// ============================================
// GAME BLOCK
// ============================================

export type GameDisplayMode = "inline" | "modal" | "fullwidth";

export interface GameBlockConfig {
  type: "game";
  gameId: string;         // Reference to wordGames table
  displayMode: GameDisplayMode;
  showTitle?: boolean;
  showInstructions?: boolean;
  showLevel?: boolean;
  height?: number;        // For inline mode (pixels)
  ctaText?: string;       // Button text for modal mode
}

// ============================================
// CODE BLOCK
// ============================================

export interface CodeBlockConfig {
  type: "code";
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  theme?: "dark" | "light";
}

// ============================================
// CALLOUT BLOCK
// ============================================

export type CalloutVariant = "tip" | "warning" | "info" | "success" | "error" | "note";

export interface CalloutBlockConfig {
  type: "callout";
  variant: CalloutVariant;
  title?: string;
  content: string;
  icon?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

// ============================================
// FAQ BLOCK
// ============================================

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQBlockConfig {
  type: "faq";
  items: FAQItem[];
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  variant?: "default" | "cards" | "minimal";
}

// ============================================
// CTA BLOCK
// ============================================

export type CTAVariant = "default" | "dark" | "accent" | "gradient";

export interface CTAButton {
  text: string;
  href: string;
  icon?: string;
}

export interface CTABlockConfig {
  type: "cta";
  variant: CTAVariant;
  headline: string;
  subheadline?: string;
  primaryButton: CTAButton;
  secondaryButton?: CTAButton;
  trustBadge?: string;
  backgroundImage?: string;
}

// ============================================
// RELATED POSTS BLOCK
// ============================================

export type RelatedPostsStrategy = "manual" | "category" | "tags" | "ai_suggested";
export type RelatedPostsVariant = "cards" | "list" | "compact";

export interface RelatedPostsBlockConfig {
  type: "related_posts";
  strategy: RelatedPostsStrategy;
  postIds?: string[];     // For manual selection
  postSlugs?: string[];   // Alternative to IDs
  category?: string;      // For category-based
  tags?: string[];        // For tag-based
  limit?: number;
  showHeader?: boolean;
  headerTitle?: string;
  variant?: RelatedPostsVariant;
}

// ============================================
// QUOTE BLOCK
// ============================================

export interface QuoteBlockConfig {
  type: "quote";
  text: string;
  attribution?: string;
  role?: string;
  company?: string;
  imageUrl?: string;
  variant?: "default" | "large" | "highlighted" | "card";
}

// ============================================
// DIVIDER BLOCK
// ============================================

export type DividerVariant = "line" | "dots" | "ornament" | "space" | "gradient";

export interface DividerBlockConfig {
  type: "divider";
  variant: DividerVariant;
  spacing?: "small" | "medium" | "large";
}

// ============================================
// UNION TYPE FOR ALL CONFIGS
// ============================================

export type BlockConfig =
  | HeroBlockConfig
  | RichTextBlockConfig
  | ImageBlockConfig
  | VideoBlockConfig
  | GameBlockConfig
  | CodeBlockConfig
  | CalloutBlockConfig
  | FAQBlockConfig
  | CTABlockConfig
  | RelatedPostsBlockConfig
  | QuoteBlockConfig
  | DividerBlockConfig;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createBlock(type: BlogBlockType, order: number, config?: Partial<BlockConfig>): BlogBlock {
  const defaultConfig = getDefaultConfig(type);
  return {
    id: generateBlockId(),
    type,
    order,
    config: config ? { ...defaultConfig, ...config } as BlockConfig : defaultConfig,
  };
}

export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getDefaultConfig(type: BlogBlockType): BlockConfig {
  switch (type) {
    case "hero":
      return {
        type: "hero",
        title: "",
        showAuthor: true,
        showDate: true,
        showReadTime: true,
        variant: "default",
      };
    case "rich_text":
      return {
        type: "rich_text",
        content: "",
        variant: "default",
      };
    case "image":
      return {
        type: "image",
        url: "",
        alt: "",
        width: "wide",
        alignment: "center",
        rounded: true,
        shadow: true,
      };
    case "video":
      return {
        type: "video",
        provider: "youtube",
        aspectRatio: "16:9",
      };
    case "game":
      return {
        type: "game",
        gameId: "",
        displayMode: "inline",
        showTitle: true,
        showInstructions: true,
        height: 500,
      };
    case "code":
      return {
        type: "code",
        code: "",
        language: "typescript",
        showLineNumbers: true,
        theme: "dark",
      };
    case "callout":
      return {
        type: "callout",
        variant: "tip",
        content: "",
      };
    case "faq":
      return {
        type: "faq",
        items: [],
        showHeader: true,
        headerTitle: "Frequently Asked Questions",
        variant: "default",
      };
    case "cta":
      return {
        type: "cta",
        variant: "accent",
        headline: "",
        primaryButton: { text: "Get Started", href: "/contact" },
      };
    case "related_posts":
      return {
        type: "related_posts",
        strategy: "category",
        limit: 3,
        showHeader: true,
        headerTitle: "Related Articles",
        variant: "cards",
      };
    case "quote":
      return {
        type: "quote",
        text: "",
        variant: "default",
      };
    case "divider":
      return {
        type: "divider",
        variant: "line",
        spacing: "medium",
      };
  }
}

// ============================================
// BLOCK METADATA (for editor UI)
// ============================================

export interface BlockMeta {
  type: BlogBlockType;
  label: string;
  description: string;
  icon: string;
  category: "content" | "media" | "interactive" | "layout";
}

export const BLOCK_METADATA: BlockMeta[] = [
  {
    type: "hero",
    label: "Hero Section",
    description: "Full-width header with title and featured image",
    icon: "Layout",
    category: "layout",
  },
  {
    type: "rich_text",
    label: "Rich Text",
    description: "Markdown text with headings, paragraphs, and lists",
    icon: "Type",
    category: "content",
  },
  {
    type: "image",
    label: "Image",
    description: "Single image with caption and multiple sizes",
    icon: "Image",
    category: "media",
  },
  {
    type: "video",
    label: "Video",
    description: "YouTube, Vimeo, or custom video embed",
    icon: "Play",
    category: "media",
  },
  {
    type: "game",
    label: "Interactive Game",
    description: "Embedded vocabulary or grammar game",
    icon: "Gamepad2",
    category: "interactive",
  },
  {
    type: "code",
    label: "Code Block",
    description: "Syntax-highlighted code snippet",
    icon: "Code",
    category: "content",
  },
  {
    type: "callout",
    label: "Callout",
    description: "Tip, warning, or info box",
    icon: "AlertCircle",
    category: "content",
  },
  {
    type: "faq",
    label: "FAQ Section",
    description: "Accordion-style frequently asked questions",
    icon: "HelpCircle",
    category: "interactive",
  },
  {
    type: "cta",
    label: "Call to Action",
    description: "Conversion-focused section with buttons",
    icon: "MousePointer",
    category: "layout",
  },
  {
    type: "related_posts",
    label: "Related Posts",
    description: "Links to related blog articles",
    icon: "Newspaper",
    category: "content",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Blockquote with attribution",
    icon: "Quote",
    category: "content",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visual separator between sections",
    icon: "Minus",
    category: "layout",
  },
];

// Record for easy lookup by type (for editor UI)
export const BLOCK_METADATA_BY_TYPE: Record<BlogBlockType, BlockMeta> = BLOCK_METADATA.reduce(
  (acc, meta) => ({ ...acc, [meta.type]: meta }),
  {} as Record<BlogBlockType, BlockMeta>
);
