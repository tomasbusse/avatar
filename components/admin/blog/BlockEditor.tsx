"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { BlogBlock, BlockConfig, BlogBlockType } from "@/types/blog-blocks";
import { generateBlockId, createBlock, getDefaultConfig, BLOCK_METADATA_BY_TYPE } from "@/types/blog-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Settings,
  Eye,
  X,
  Type,
  Image,
  Video,
  Gamepad2,
  Code,
  AlertCircle,
  HelpCircle,
  Megaphone,
  FileText,
  Quote,
  Minus,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Block type icons
const BLOCK_ICONS: Record<BlogBlockType, React.ElementType> = {
  hero: Type,
  rich_text: FileText,
  image: Image,
  video: Video,
  game: Gamepad2,
  code: Code,
  callout: AlertCircle,
  faq: HelpCircle,
  cta: Megaphone,
  related_posts: FileText,
  quote: Quote,
  divider: Minus,
};

// Block category labels
const BLOCK_CATEGORIES = {
  content: ["hero", "rich_text", "image", "video", "code", "quote"],
  interactive: ["game", "faq"],
  layout: ["callout", "cta", "related_posts", "divider"],
};

interface BlockEditorProps {
  blocks: BlogBlock[];
  onChange: (blocks: BlogBlock[]) => void;
  locale: string;
}

// Individual block editor component
function BlockItem({
  block,
  index,
  totalBlocks,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  locale,
}: {
  block: BlogBlock;
  index: number;
  totalBlocks: number;
  onUpdate: (block: BlogBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  locale: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const Icon = BLOCK_ICONS[block.config.type] || FileText;
  const metadata = BLOCK_METADATA_BY_TYPE[block.config.type];

  const handleConfigChange = (key: string, value: any) => {
    onUpdate({
      ...block,
      config: {
        ...block.config,
        [key]: value,
      } as BlockConfig,
    });
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all",
      isEditing ? "border-l-primary" : "border-l-transparent"
    )}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Icon */}
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>

          {/* Title and type */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{metadata?.label || block.config.type}</span>
              <Badge variant="outline" className="text-xs">
                #{index + 1}
              </Badge>
            </div>
            {block.config.type === "rich_text" && (block.config as any).content && (
              <p className="text-xs text-muted-foreground truncate">
                {((block.config as any).content as string).substring(0, 60)}...
              </p>
            )}
            {block.config.type === "hero" && (block.config as any).title && (
              <p className="text-xs text-muted-foreground truncate">
                {(block.config as any).title}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onMoveUp}
              disabled={index === 0}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onMoveDown}
              disabled={index === totalBlocks - 1}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <span className="sr-only">More</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Block editor form */}
      {isEditing && (
        <CardContent className="pt-0 pb-4 px-4">
          <div className="border-t pt-4 space-y-4">
            <BlockConfigEditor
              block={block}
              onChange={handleConfigChange}
              locale={locale}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Block configuration editor based on block type
function BlockConfigEditor({
  block,
  onChange,
  locale,
}: {
  block: BlogBlock;
  onChange: (key: string, value: any) => void;
  locale: string;
}) {
  const config = block.config;

  switch (config.type) {
    case "hero":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={(config as any).title || ""}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Blog post title"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Textarea
              value={(config as any).subtitle || ""}
              onChange={(e) => onChange("subtitle", e.target.value)}
              placeholder="Brief description"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Badge Text</Label>
            <Input
              value={(config as any).badge || ""}
              onChange={(e) => onChange("badge", e.target.value)}
              placeholder="e.g., New, Featured, Tutorial"
            />
          </div>
          <div className="space-y-2">
            <Label>Featured Image URL</Label>
            <Input
              value={(config as any).featuredImageUrl || ""}
              onChange={(e) => onChange("featuredImageUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Variant</Label>
            <Select
              value={(config as any).variant || "default"}
              onValueChange={(v) => onChange("variant", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="centered">Centered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={(config as any).showAuthor !== false}
                onCheckedChange={(v) => onChange("showAuthor", v)}
              />
              <Label className="text-sm">Show Author</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={(config as any).showDate !== false}
                onCheckedChange={(v) => onChange("showDate", v)}
              />
              <Label className="text-sm">Show Date</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={(config as any).showReadTime !== false}
                onCheckedChange={(v) => onChange("showReadTime", v)}
              />
              <Label className="text-sm">Show Read Time</Label>
            </div>
          </div>
        </div>
      );

    case "rich_text":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Content (Markdown)</Label>
            <Textarea
              value={(config as any).content || ""}
              onChange={(e) => onChange("content", e.target.value)}
              placeholder="Write your content in Markdown..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Variant</Label>
            <Select
              value={(config as any).variant || "default"}
              onValueChange={(v) => onChange("variant", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="lead">Lead (Larger)</SelectItem>
                <SelectItem value="small">Small</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={(config as any).url || ""}
              onChange={(e) => onChange("url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Alt Text</Label>
            <Input
              value={(config as any).alt || ""}
              onChange={(e) => onChange("alt", e.target.value)}
              placeholder="Describe the image"
            />
          </div>
          <div className="space-y-2">
            <Label>Caption</Label>
            <Input
              value={(config as any).caption || ""}
              onChange={(e) => onChange("caption", e.target.value)}
              placeholder="Optional caption"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Select
                value={(config as any).width || "wide"}
                onValueChange={(v) => onChange("width", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={(config as any).alignment || "center"}
                onValueChange={(v) => onChange("alignment", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    case "video":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={(config as any).provider || "youtube"}
              onValueChange={(v) => onChange("provider", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="custom">Custom URL</SelectItem>
                <SelectItem value="embed">Custom Embed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(config as any).provider === "embed" ? (
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <Textarea
                value={(config as any).embedCode || ""}
                onChange={(e) => onChange("embedCode", e.target.value)}
                placeholder="<iframe ...>"
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          ) : (config as any).provider === "custom" ? (
            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input
                value={(config as any).url || ""}
                onChange={(e) => onChange("url", e.target.value)}
                placeholder="https://..."
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Video ID</Label>
              <Input
                value={(config as any).videoId || ""}
                onChange={(e) => onChange("videoId", e.target.value)}
                placeholder={
                  (config as any).provider === "youtube"
                    ? "dQw4w9WgXcQ"
                    : "123456789"
                }
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Title (for accessibility)</Label>
            <Input
              value={(config as any).title || ""}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Video title"
            />
          </div>
          <div className="space-y-2">
            <Label>Custom Thumbnail URL (optional)</Label>
            <Input
              value={(config as any).thumbnail || ""}
              onChange={(e) => onChange("thumbnail", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      );

    case "game":
      return <GameBlockEditor config={config} onChange={onChange} locale={locale} />;

    case "code":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Code</Label>
            <Textarea
              value={(config as any).code || ""}
              onChange={(e) => onChange("code", e.target.value)}
              placeholder="// Your code here..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={(config as any).language || "javascript"}
                onValueChange={(v) => onChange("language", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filename (optional)</Label>
              <Input
                value={(config as any).filename || ""}
                onChange={(e) => onChange("filename", e.target.value)}
                placeholder="example.ts"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={(config as any).showLineNumbers !== false}
              onCheckedChange={(v) => onChange("showLineNumbers", v)}
            />
            <Label className="text-sm">Show Line Numbers</Label>
          </div>
        </div>
      );

    case "callout":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variant</Label>
            <Select
              value={(config as any).variant || "info"}
              onValueChange={(v) => onChange("variant", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tip">Tip (Green)</SelectItem>
                <SelectItem value="warning">Warning (Orange)</SelectItem>
                <SelectItem value="info">Info (Teal)</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              value={(config as any).title || ""}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Callout title"
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={(config as any).content || ""}
              onChange={(e) => onChange("content", e.target.value)}
              placeholder="Callout content (supports markdown)"
              rows={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={(config as any).collapsible || false}
              onCheckedChange={(v) => onChange("collapsible", v)}
            />
            <Label className="text-sm">Collapsible</Label>
          </div>
        </div>
      );

    case "faq":
      return <FAQBlockEditor config={config} onChange={onChange} />;

    case "cta":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variant</Label>
            <Select
              value={(config as any).variant || "default"}
              onValueChange={(v) => onChange("variant", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Light)</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="accent">Accent (Orange)</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={(config as any).headline || ""}
              onChange={(e) => onChange("headline", e.target.value)}
              placeholder="Ready to get started?"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={(config as any).description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Call to action description"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Button Text</Label>
              <Input
                value={(config as any).primaryButtonText || ""}
                onChange={(e) => onChange("primaryButtonText", e.target.value)}
                placeholder="Get Started"
              />
            </div>
            <div className="space-y-2">
              <Label>Primary Button URL</Label>
              <Input
                value={(config as any).primaryButtonUrl || ""}
                onChange={(e) => onChange("primaryButtonUrl", e.target.value)}
                placeholder="/contact"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Secondary Button Text (optional)</Label>
              <Input
                value={(config as any).secondaryButtonText || ""}
                onChange={(e) => onChange("secondaryButtonText", e.target.value)}
                placeholder="Learn More"
              />
            </div>
            <div className="space-y-2">
              <Label>Secondary Button URL</Label>
              <Input
                value={(config as any).secondaryButtonUrl || ""}
                onChange={(e) => onChange("secondaryButtonUrl", e.target.value)}
                placeholder="/about"
              />
            </div>
          </div>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quote</Label>
            <Textarea
              value={(config as any).quote || ""}
              onChange={(e) => onChange("quote", e.target.value)}
              placeholder="The quote text..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                value={(config as any).author || ""}
                onChange={(e) => onChange("author", e.target.value)}
                placeholder="Author name"
              />
            </div>
            <div className="space-y-2">
              <Label>Author Title</Label>
              <Input
                value={(config as any).authorTitle || ""}
                onChange={(e) => onChange("authorTitle", e.target.value)}
                placeholder="CEO, Acme Corp"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Author Image URL (optional)</Label>
            <Input
              value={(config as any).authorImageUrl || ""}
              onChange={(e) => onChange("authorImageUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Variant</Label>
            <Select
              value={(config as any).variant || "default"}
              onValueChange={(v) => onChange("variant", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case "divider":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variant</Label>
            <Select
              value={(config as any).variant || "line"}
              onValueChange={(v) => onChange("variant", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
                <SelectItem value="ornament">Ornament</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="wave">Wave</SelectItem>
                <SelectItem value="space">Space Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Spacing</Label>
            <Select
              value={(config as any).spacing || "medium"}
              onValueChange={(v) => onChange("spacing", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case "related_posts":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={(config as any).title || "Related Articles"}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Related Articles"
            />
          </div>
          <div className="space-y-2">
            <Label>Category Filter (optional)</Label>
            <Input
              value={(config as any).category || ""}
              onChange={(e) => onChange("category", e.target.value)}
              placeholder="e.g., Business English"
            />
          </div>
          <div className="space-y-2">
            <Label>Max Posts</Label>
            <Select
              value={String((config as any).maxPosts || 3)}
              onValueChange={(v) => onChange("maxPosts", parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="6">6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Variant</Label>
            <Select
              value={(config as any).variant || "cards"}
              onValueChange={(v) => onChange("variant", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">Cards (Full)</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="compact">Compact Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          No editor available for this block type
        </div>
      );
  }
}

// Game block editor with game selector
function GameBlockEditor({
  config,
  onChange,
  locale,
}: {
  config: BlockConfig;
  onChange: (key: string, value: any) => void;
  locale: string;
}) {
  const games = useQuery(api.wordGames.listGames, { status: "published" });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Game</Label>
        <Select
          value={(config as any).gameId || ""}
          onValueChange={(v) => onChange("gameId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a game..." />
          </SelectTrigger>
          <SelectContent>
            {games?.map((game) => (
              <SelectItem key={game._id} value={game._id}>
                <div className="flex items-center gap-2">
                  <span>{game.title}</span>
                  {game.level && (
                    <Badge variant="outline" className="text-xs">
                      {game.level}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Display Mode</Label>
        <Select
          value={(config as any).displayMode || "inline"}
          onValueChange={(v) => onChange("displayMode", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inline">Inline (Default)</SelectItem>
            <SelectItem value="modal">Modal (Popup)</SelectItem>
            <SelectItem value="fullwidth">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Height (for inline mode)</Label>
        <Input
          type="number"
          value={(config as any).height || 500}
          onChange={(e) => onChange("height", parseInt(e.target.value))}
          placeholder="500"
        />
      </div>
      <div className="space-y-2">
        <Label>CTA Text (for modal mode)</Label>
        <Input
          value={(config as any).ctaText || ""}
          onChange={(e) => onChange("ctaText", e.target.value)}
          placeholder="Play Game"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={(config as any).showTitle !== false}
            onCheckedChange={(v) => onChange("showTitle", v)}
          />
          <Label className="text-sm">Show Title</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={(config as any).showInstructions !== false}
            onCheckedChange={(v) => onChange("showInstructions", v)}
          />
          <Label className="text-sm">Show Instructions</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={(config as any).showLevel !== false}
            onCheckedChange={(v) => onChange("showLevel", v)}
          />
          <Label className="text-sm">Show Level</Label>
        </div>
      </div>
    </div>
  );
}

// FAQ block editor with item management
function FAQBlockEditor({
  config,
  onChange,
}: {
  config: BlockConfig;
  onChange: (key: string, value: any) => void;
}) {
  const items = ((config as any).items || []) as Array<{ question: string; answer: string }>;

  const addItem = () => {
    onChange("items", [...items, { question: "", answer: "" }]);
  };

  const updateItem = (index: number, field: "question" | "answer", value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange("items", newItems);
  };

  const removeItem = (index: number) => {
    onChange("items", items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title (optional)</Label>
        <Input
          value={(config as any).title || ""}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Frequently Asked Questions"
        />
      </div>
      <div className="space-y-2">
        <Label>Variant</Label>
        <Select
          value={(config as any).variant || "default"}
          onValueChange={(v) => onChange("variant", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="compact">Compact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>FAQ Items</Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {items.map((item, index) => (
          <Card key={index} className="p-3">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline">Q{index + 1}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeItem(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <Input
                value={item.question}
                onChange={(e) => updateItem(index, "question", e.target.value)}
                placeholder="Question..."
              />
              <Textarea
                value={item.answer}
                onChange={(e) => updateItem(index, "answer", e.target.value)}
                placeholder="Answer..."
                rows={2}
              />
            </div>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No FAQ items yet. Click "Add Item" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Main BlockEditor component
export function BlockEditor({ blocks, onChange, locale }: BlockEditorProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const addBlock = useCallback((type: BlogBlockType) => {
    const newBlock = createBlock(type, blocks.length);
    onChange([...blocks, newBlock]);
    setAddMenuOpen(false);
  }, [blocks, onChange]);

  const updateBlock = useCallback((index: number, block: BlogBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    onChange(newBlocks);
  }, [blocks, onChange]);

  const deleteBlock = useCallback((index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    // Re-order
    newBlocks.forEach((block, i) => {
      block.order = i;
    });
    onChange(newBlocks);
  }, [blocks, onChange]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, removed);

    // Re-order
    newBlocks.forEach((block, i) => {
      block.order = i;
    });
    onChange(newBlocks);
  }, [blocks, onChange]);

  const duplicateBlock = useCallback((index: number) => {
    const blockToDuplicate = blocks[index];
    const newBlock: BlogBlock = {
      ...blockToDuplicate,
      id: generateBlockId(),
      order: index + 1,
    };

    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);

    // Re-order
    newBlocks.forEach((block, i) => {
      block.order = i;
    });
    onChange(newBlocks);
  }, [blocks, onChange]);

  return (
    <div className="space-y-4">
      {/* Block list */}
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            index={index}
            totalBlocks={blocks.length}
            onUpdate={(updatedBlock) => updateBlock(index, updatedBlock)}
            onDelete={() => deleteBlock(index)}
            onMoveUp={() => moveBlock(index, index - 1)}
            onMoveDown={() => moveBlock(index, index + 1)}
            onDuplicate={() => duplicateBlock(index)}
            locale={locale}
          />
        ))}
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground mb-4">
              No content blocks yet. Start building your post!
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add block button */}
      <DropdownMenu open={addMenuOpen} onOpenChange={setAddMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" />
            Add Block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Content
          </div>
          {BLOCK_CATEGORIES.content.map((type) => {
            const Icon = BLOCK_ICONS[type as BlogBlockType];
            const meta = BLOCK_METADATA_BY_TYPE[type as BlogBlockType];
            return (
              <DropdownMenuItem key={type} onClick={() => addBlock(type as BlogBlockType)}>
                <Icon className="w-4 h-4 mr-2" />
                <div className="flex-1">
                  <div className="font-medium">{meta?.label || type}</div>
                  <div className="text-xs text-muted-foreground">{meta?.description}</div>
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Interactive
          </div>
          {BLOCK_CATEGORIES.interactive.map((type) => {
            const Icon = BLOCK_ICONS[type as BlogBlockType];
            const meta = BLOCK_METADATA_BY_TYPE[type as BlogBlockType];
            return (
              <DropdownMenuItem key={type} onClick={() => addBlock(type as BlogBlockType)}>
                <Icon className="w-4 h-4 mr-2" />
                <div className="flex-1">
                  <div className="font-medium">{meta?.label || type}</div>
                  <div className="text-xs text-muted-foreground">{meta?.description}</div>
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Layout
          </div>
          {BLOCK_CATEGORIES.layout.map((type) => {
            const Icon = BLOCK_ICONS[type as BlogBlockType];
            const meta = BLOCK_METADATA_BY_TYPE[type as BlogBlockType];
            return (
              <DropdownMenuItem key={type} onClick={() => addBlock(type as BlogBlockType)}>
                <Icon className="w-4 h-4 mr-2" />
                <div className="flex-1">
                  <div className="font-medium">{meta?.label || type}</div>
                  <div className="text-xs text-muted-foreground">{meta?.description}</div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default BlockEditor;
