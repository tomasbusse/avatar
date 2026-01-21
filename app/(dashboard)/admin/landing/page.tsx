"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  HelpCircle,
  MessageSquareQuote,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  GripVertical,
  Globe,
  Sparkles,
  Loader2,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Layout,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { BlockEditor } from "@/components/admin/blog/BlockEditor";
import { AIReplyDialog } from "@/components/admin/AIReplyDialog";
import type { BlogBlock } from "@/types/blog-blocks";
import type { Doc } from "@/convex/_generated/dataModel";

// AI Content Generation Hook
function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateContent = async (type: string, locale: string, topic?: string, category?: string, context?: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/landing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, locale, topic, category, context }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.content;
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeSEO = async (content: any, type: string, locale: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/landing/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, locale }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.analysis;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { generateContent, analyzeSEO, isGenerating, isAnalyzing };
}

// SEO Score Badge Component
function SEOScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getIcon = () => {
    if (score >= 80) return <CheckCircle className="w-3 h-3" />;
    if (score >= 60) return <AlertCircle className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getColor()}`}>
      {getIcon()}
      SEO: {score}/100
    </span>
  );
}

// SEO Analysis Panel Component
function SEOAnalysisPanel({ analysis, onClose }: { analysis: any; onClose: () => void }) {
  if (!analysis) return null;

  return (
    <Card className="border-primary mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            SEO Analysis
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{analysis.overallScore}</div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{analysis.llmSearchScore}</div>
            <div className="text-xs text-muted-foreground">LLM Search</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{analysis.citabilityScore}</div>
            <div className="text-xs text-muted-foreground">Citability</div>
          </div>
        </div>

        {analysis.strengths?.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-green-700">Strengths</h4>
            <ul className="text-sm space-y-1">
              {analysis.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.improvements?.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-amber-700">Improvements</h4>
            <ul className="text-sm space-y-1">
              {analysis.improvements.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.keywordSuggestions?.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Suggested Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordSuggestions.map((kw: string, i: number) => (
                <Badge key={i} variant="outline">{kw}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type Locale = "de" | "en";

export default function LandingAdminPage() {
  const [activeTab, setActiveTab] = useState("config");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Landing Page CMS</h1>
        <p className="text-muted-foreground mt-2">
          Manage your marketing website content
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4" />
            Testimonials
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Blog
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <PagesTab />
        </TabsContent>
        <TabsContent value="faq">
          <FAQTab />
        </TabsContent>
        <TabsContent value="testimonials">
          <TestimonialsTab />
        </TabsContent>
        <TabsContent value="blog">
          <BlogTab />
        </TabsContent>
        <TabsContent value="email">
          <EmailTab />
        </TabsContent>
        <TabsContent value="config">
          <SiteConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Pages Tab ============

// Page configuration with sections
const PAGE_DEFINITIONS = [
  {
    id: "home",
    name: "Homepage",
    path: "/",
    sections: [
      { id: "hero", name: "Hero Section", fields: ["headline", "subheadline", "ctaText", "ctaLink", "avatarName", "avatarGreeting"] },
      { id: "services", name: "Services Overview", fields: ["headline", "subheadline", "items"] },
      { id: "usps", name: "Why Choose Us", fields: ["headline", "items"] },
      { id: "cta", name: "Call to Action", fields: ["headline", "subheadline", "buttonText", "buttonLink"] },
    ],
  },
  {
    id: "about",
    name: "About Us",
    path: "/about",
    sections: [
      { id: "hero", name: "Hero Section", fields: ["headline", "subheadline"] },
      { id: "story", name: "Our Story", fields: ["headline", "content"] },
      { id: "methodology", name: "Methodology", fields: ["headline", "content", "items"] },
      { id: "locations", name: "Locations", fields: ["headline", "items"] },
    ],
  },
  {
    id: "services",
    name: "Services",
    path: "/services",
    sections: [
      { id: "hero", name: "Hero Section", fields: ["headline", "subheadline"] },
      { id: "overview", name: "Services Overview", fields: ["headline", "items"] },
    ],
  },
  {
    id: "pricing",
    name: "Pricing",
    path: "/pricing",
    sections: [
      { id: "hero", name: "Hero Section", fields: ["headline", "subheadline"] },
      { id: "plans", name: "Pricing Plans", fields: ["headline", "items"] },
      { id: "extras", name: "Additional Info", fields: ["items"] },
    ],
  },
  {
    id: "contact",
    name: "Contact",
    path: "/contact",
    sections: [
      { id: "hero", name: "Hero Section", fields: ["headline", "subheadline"] },
      { id: "form", name: "Contact Form", fields: ["headline", "subheadline"] },
      { id: "info", name: "Contact Info", fields: ["items"] },
    ],
  },
];

function PagesTab() {
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [aiContext, setAiContext] = useState("");

  const { generateContent, isGenerating } = useAIGeneration();

  const pageSections = useQuery(
    api.landing.getPageSectionsAdmin,
    selectedPage ? { locale, page: selectedPage } : "skip"
  );

  const upsertSection = useMutation(api.landing.upsertSectionContent);
  const deleteSection = useMutation(api.landing.deleteSection);
  const updateSectionStatus = useMutation(api.landing.updateSectionStatus);

  const [formData, setFormData] = useState<{
    section: string;
    content: Record<string, any>;
    order: number;
  }>({
    section: "",
    content: {},
    order: 0,
  });

  const selectedPageDef = PAGE_DEFINITIONS.find((p) => p.id === selectedPage);

  const handleSaveSection = async () => {
    if (!selectedPage || !formData.section) return;

    try {
      await upsertSection({
        locale,
        page: selectedPage,
        section: formData.section,
        content: formData.content,
        order: formData.order,
      });
      setEditingSection(null);
      setIsAddingSection(false);
      setFormData({ section: "", content: {}, order: 0 });
      toast.success("Section saved");
    } catch (error) {
      toast.error("Failed to save section");
    }
  };

  const handleDeleteSection = async (id: Id<"landingContent">) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      await deleteSection({ id });
      toast.success("Section deleted");
    } catch (error) {
      toast.error("Failed to delete section");
    }
  };

  const handleTogglePublish = async (id: Id<"landingContent">, currentStatus: boolean) => {
    try {
      await updateSectionStatus({ id, isPublished: !currentStatus });
      toast.success(currentStatus ? "Section unpublished" : "Section published");
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  const startEditSection = (section: any) => {
    setEditingSection(section._id);
    setFormData({
      section: section.section,
      content: section.content || {},
      order: section.order ?? 0,
    });
  };

  const handleAIGenerate = async () => {
    if (!selectedPage || !formData.section) {
      toast.error("Please select a section first");
      return;
    }

    try {
      const content = await generateContent(
        "page_section",
        locale,
        `${selectedPageDef?.name} - ${formData.section}`,
        selectedPage,
        aiContext
      );
      if (content) {
        setFormData((prev) => ({
          ...prev,
          content: content,
        }));
        toast.success("Content generated! Review and save.");
      }
    } catch (error) {
      toast.error("Failed to generate content");
    }
  };

  // Render content fields based on section type
  const renderContentFields = () => {
    const sectionDef = selectedPageDef?.sections.find((s) => s.id === formData.section);
    if (!sectionDef) return null;

    return (
      <div className="space-y-4">
        {sectionDef.fields.map((field) => (
          <div key={field} className="space-y-2">
            <Label className="capitalize">{field.replace(/([A-Z])/g, " $1").trim()}</Label>
            {field === "content" || field === "items" ? (
              <Textarea
                value={
                  typeof formData.content[field] === "object"
                    ? JSON.stringify(formData.content[field], null, 2)
                    : formData.content[field] || ""
                }
                onChange={(e) => {
                  let value: any = e.target.value;
                  try {
                    value = JSON.parse(e.target.value);
                  } catch {
                    // Keep as string if not valid JSON
                  }
                  setFormData({
                    ...formData,
                    content: { ...formData.content, [field]: value },
                  });
                }}
                rows={field === "items" ? 8 : 4}
                className="font-mono text-sm"
                placeholder={field === "items" ? "Enter JSON array of items..." : "Enter content..."}
              />
            ) : (
              <Input
                value={formData.content[field] || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content: { ...formData.content, [field]: e.target.value },
                  })
                }
                placeholder={`Enter ${field}...`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label>Language:</Label>
          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> English
                </span>
              </SelectItem>
              <SelectItem value="de">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Deutsch
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Page Selection Grid */}
      {!selectedPage && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PAGE_DEFINITIONS.map((page) => (
            <Card
              key={page.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedPage(page.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {page.name}
                  <Badge variant="outline">{page.sections.length} sections</Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span className="font-mono text-xs">/{locale}{page.path}</span>
                  <a
                    href={`/${locale}${page.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Page Editor */}
      {selectedPage && selectedPageDef && (
        <>
          {/* Back Button & Add Section */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedPage(null)}>
              ← Back to Pages
            </Button>
            <div className="flex items-center gap-2">
              <a
                href={`/${locale}${selectedPageDef.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                Preview <ExternalLink className="w-3 h-3" />
              </a>
              <Button onClick={() => setIsAddingSection(true)} disabled={isAddingSection}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
          </div>

          {/* Page Title */}
          <div>
            <h2 className="text-2xl font-bold">{selectedPageDef.name}</h2>
            <p className="text-muted-foreground">
              Edit sections for the {selectedPageDef.name.toLowerCase()} page
            </p>
          </div>

          {/* AI Generation Panel */}
          <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                AI Section Generator
              </CardTitle>
              <CardDescription>
                Generate SEO-optimized content for page sections with AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Context (optional)</Label>
                  <Input
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="e.g., 'focus on corporate clients' or 'highlight 20+ years experience'"
                  />
                </div>
                <Button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !formData.section}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Section Form */}
          {isAddingSection && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Add New Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section Type</Label>
                    <Select
                      value={formData.section}
                      onValueChange={(v) =>
                        setFormData({ ...formData, section: v, content: {} })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPageDef.sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                {formData.section && renderContentFields()}

                <div className="flex gap-2">
                  <Button onClick={handleSaveSection} disabled={!formData.section}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Section
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsAddingSection(false);
                    setFormData({ section: "", content: {}, order: 0 });
                  }}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Sections */}
          <div className="space-y-4">
            {pageSections?.map((section) => {
              const sectionDef = selectedPageDef.sections.find((s) => s.id === section.section);

              return (
                <Card key={section._id}>
                  <CardContent className="pt-6">
                    {editingSection === section._id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Section Type</Label>
                            <Input value={sectionDef?.name || section.section} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label>Order</Label>
                            <Input
                              type="number"
                              value={formData.order}
                              onChange={(e) =>
                                setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                        </div>

                        {renderContentFields()}

                        <div className="flex gap-2">
                          <Button onClick={handleSaveSection}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setEditingSection(null);
                            setFormData({ section: "", content: {}, order: 0 });
                          }}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {sectionDef?.name || section.section}
                            </h3>
                            <Badge variant={section.isPublished ? "default" : "secondary"}>
                              {section.isPublished ? "Published" : "Draft"}
                            </Badge>
                            <Badge variant="outline">Order: {section.order ?? 0}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {Object.entries(section.content || {}).slice(0, 3).map(([key, value]) => (
                              <div key={key} className="truncate max-w-xl">
                                <span className="font-medium">{key}:</span>{" "}
                                {typeof value === "string"
                                  ? value.substring(0, 60) + (value.length > 60 ? "..." : "")
                                  : Array.isArray(value)
                                    ? `[${value.length} items]`
                                    : JSON.stringify(value).substring(0, 40)}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Updated: {new Date(section.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePublish(section._id, section.isPublished)}
                            title={section.isPublished ? "Unpublish" : "Publish"}
                          >
                            {section.isPublished ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditSection(section)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSection(section._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {(!pageSections || pageSections.length === 0) && !isAddingSection && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No sections configured for this page yet. Click &quot;Add Section&quot; to create one.
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============ Site Config Tab ============
function SiteConfigTab() {
  const siteConfig = useQuery(api.landing.getFullSiteConfig);
  const avatars = useQuery(api.avatars.listAllAvatars);
  const updateConfig = useMutation(api.landing.updateSiteConfig);
  const upsertSection = useMutation(api.landing.upsertSectionContent);

  // Avatar session config
  const avatarSessionConfig = useQuery(api.landing.getLandingAvatarConfig);
  const updateAvatarSessionConfig = useMutation(api.landing.updateLandingAvatarConfig);

  // Contact info queries and mutations
  const contactInfo = useQuery(api.landing.getContactInfo);
  const updateContactInfo = useMutation(api.landing.updateContactInfo);
  const contactSubmissions = useQuery(api.landing.getContactSubmissions, { limit: 20 });
  const updateContactStatus = useMutation(api.landing.updateContactStatus);

  // Fetch hero content for both locales
  const heroContentEN = useQuery(api.landing.getSectionContent, { locale: "en", page: "home", section: "hero" });
  const heroContentDE = useQuery(api.landing.getSectionContent, { locale: "de", page: "home", section: "hero" });

  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [selectedAvatarEn, setSelectedAvatarEn] = useState<string>("");
  const [selectedAvatarDe, setSelectedAvatarDe] = useState<string>("");
  const [avatarNameEN, setAvatarNameEN] = useState("");
  const [avatarGreetingEN, setAvatarGreetingEN] = useState("");
  const [avatarNameDE, setAvatarNameDE] = useState("");
  const [avatarGreetingDE, setAvatarGreetingDE] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Contact info state
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [hoursEN, setHoursEN] = useState("");
  const [hoursDE, setHoursDE] = useState("");
  const [locations, setLocations] = useState<Array<{ nameEN: string; nameDE: string; address: string }>>([]);
  const [contactLoaded, setContactLoaded] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");

  // AI Reply dialog state
  const [selectedSubmission, setSelectedSubmission] = useState<Doc<"contactSubmissions"> | null>(null);
  const [aiReplyDialogOpen, setAiReplyDialogOpen] = useState(false);

  // Session timeout state
  const [sessionTimeout, setSessionTimeout] = useState<number>(300);
  const [warningAt, setWarningAt] = useState<number>(60);
  const [showContactOnStop, setShowContactOnStop] = useState(true);
  const [preloadAvatar, setPreloadAvatar] = useState(false);
  const [sessionConfigLoaded, setSessionConfigLoaded] = useState(false);

  // Load current values when data is available
  if (!isLoaded && heroContentEN && heroContentDE) {
    const enContent = heroContentEN as Record<string, unknown>;
    const deContent = heroContentDE as Record<string, unknown>;
    setAvatarNameEN((enContent.avatarName as string) || "Emma");
    setAvatarGreetingEN((enContent.avatarGreeting as string) || "");
    setAvatarNameDE((deContent.avatarName as string) || "Emma");
    setAvatarGreetingDE((deContent.avatarGreeting as string) || "");
    setIsLoaded(true);
  }

  // Load contact info
  if (!contactLoaded && contactInfo) {
    setContactEmail(contactInfo.email || "");
    setContactPhone(contactInfo.phone || "");
    setHoursEN(contactInfo.hours?.en || "");
    setHoursDE(contactInfo.hours?.de || "");
    setLocations(
      contactInfo.locations?.map((loc: any) => ({
        nameEN: loc.name?.en || "",
        nameDE: loc.name?.de || "",
        address: loc.address || "",
      })) || []
    );
    setContactLoaded(true);
  }

  // Load session config
  if (!sessionConfigLoaded && avatarSessionConfig) {
    setSessionTimeout(avatarSessionConfig.sessionTimeoutSeconds ?? 300);
    setWarningAt(avatarSessionConfig.warningAtSeconds ?? 60);
    setShowContactOnStop(avatarSessionConfig.showContactFormOnStop ?? true);
    setPreloadAvatar(avatarSessionConfig.preloadAvatar ?? false);
    setSessionConfigLoaded(true);
  }

  const handleSaveAvatar = async () => {
    // Need at least one avatar selected
    if (!selectedAvatarEn && !selectedAvatarDe && !selectedAvatar) return;

    try {
      const updates: Record<string, Id<"avatars">> = {};

      // Update locale-specific avatars if set
      if (selectedAvatarEn) {
        updates.heroAvatarIdEn = selectedAvatarEn as Id<"avatars">;
      }
      if (selectedAvatarDe) {
        updates.heroAvatarIdDe = selectedAvatarDe as Id<"avatars">;
      }
      // Also update generic fallback if set
      if (selectedAvatar) {
        updates.heroAvatarId = selectedAvatar as Id<"avatars">;
      }

      await updateConfig(updates);
      toast.success("Avatar selection updated");
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  const handleSaveGreeting = async () => {
    try {
      // Update English content
      if (heroContentEN) {
        await upsertSection({
          locale: "en",
          page: "home",
          section: "hero",
          content: {
            ...(heroContentEN as Record<string, unknown>),
            avatarName: avatarNameEN,
            avatarGreeting: avatarGreetingEN,
          },
        });
      }
      // Update German content
      if (heroContentDE) {
        await upsertSection({
          locale: "de",
          page: "home",
          section: "hero",
          content: {
            ...(heroContentDE as Record<string, unknown>),
            avatarName: avatarNameDE,
            avatarGreeting: avatarGreetingDE,
          },
        });
      }
      toast.success("Avatar greeting updated for both languages");
    } catch (error) {
      toast.error("Failed to update greeting");
    }
  };

  const handleSaveContactInfo = async () => {
    try {
      await updateContactInfo({
        email: contactEmail,
        phone: contactPhone,
        hours: { en: hoursEN, de: hoursDE },
        locations: locations.map((loc) => ({
          name: { en: loc.nameEN, de: loc.nameDE },
          address: loc.address,
        })),
      });
      toast.success("Contact information updated");
    } catch (error) {
      toast.error("Failed to update contact information");
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const response = await fetch(`/api/email/test?to=${encodeURIComponent(testEmailAddress)}`);
      const data = await response.json();

      if (response.ok) {
        toast.success(`Test email sent to ${testEmailAddress}`);
        setTestEmailAddress("");
      } else {
        toast.error(data.error || "Failed to send test email");
      }
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleUpdateSubmissionStatus = async (id: Id<"contactSubmissions">, status: string) => {
    try {
      await updateContactStatus({ id, status });
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSaveSessionConfig = async () => {
    try {
      await updateAvatarSessionConfig({
        sessionTimeoutSeconds: sessionTimeout,
        warningAtSeconds: warningAt,
        showContactFormOnStop: showContactOnStop,
        preloadAvatar: preloadAvatar,
      });
      toast.success("Avatar session settings updated");
    } catch (error) {
      toast.error("Failed to update session settings");
    }
  };

  const addLocation = () => {
    setLocations([...locations, { nameEN: "", nameDE: "", address: "" }]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocation = (index: number, field: keyof typeof locations[0], value: string) => {
    const newLocations = [...locations];
    newLocations[index][field] = value;
    setLocations(newLocations);
  };

  // Get currently selected avatar details for each locale
  const currentAvatarEn = avatars?.find(a => a._id === (selectedAvatarEn || siteConfig?.heroAvatarIdEn || siteConfig?.heroAvatarId));
  const currentAvatarDe = avatars?.find(a => a._id === (selectedAvatarDe || siteConfig?.heroAvatarIdDe || siteConfig?.heroAvatarId));
  const currentAvatar = avatars?.find(a => a._id === (selectedAvatar || siteConfig?.heroAvatarId));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500">New</Badge>;
      case "read":
        return <Badge variant="secondary">Read</Badge>;
      case "replied":
        return <Badge className="bg-green-500">Replied</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Contact Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            Contact Form Submissions
          </CardTitle>
          <CardDescription>
            View and manage messages received through the contact form
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contactSubmissions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No contact submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {contactSubmissions?.map((submission) => (
                <div
                  key={submission._id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{submission.name}</span>
                        {getStatusBadge(submission.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(submission.createdAt).toLocaleDateString()} {new Date(submission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <a href={`mailto:${submission.email}`} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="w-3 h-3" />
                          {submission.email}
                        </a>
                        {submission.phone && (
                          <a href={`tel:${submission.phone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="w-3 h-3" />
                            {submission.phone}
                          </a>
                        )}
                        {submission.company && (
                          <span className="truncate">{submission.company}</span>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">{submission.message}</p>
                      {submission.repliedAt && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Replied {new Date(submission.repliedAt).toLocaleDateString()} via {submission.replyMethod === "ai" ? "AI" : "manual"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Select
                        value={submission.status}
                        onValueChange={(v) => handleUpdateSubmissionStatus(submission._id, v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setAiReplyDialogOpen(true);
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        Reply with AI
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Reply Dialog */}
      <AIReplyDialog
        submission={selectedSubmission}
        open={aiReplyDialogOpen}
        onOpenChange={setAiReplyDialogOpen}
      />

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Configure your business contact details shown on the contact page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email & Phone */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+49 123 456 789"
              />
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Business Hours
            </Label>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">English</Label>
                <Input
                  value={hoursEN}
                  onChange={(e) => setHoursEN(e.target.value)}
                  placeholder="Monday – Friday: 9:00 – 18:00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Deutsch</Label>
                <Input
                  value={hoursDE}
                  onChange={(e) => setHoursDE(e.target.value)}
                  placeholder="Montag – Freitag: 9:00 – 18:00"
                />
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Office Locations
              </Label>
              <Button variant="outline" size="sm" onClick={addLocation}>
                <Plus className="w-4 h-4 mr-1" />
                Add Location
              </Button>
            </div>
            {locations.map((loc, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Location {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLocation(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Name (English)</Label>
                    <Input
                      value={loc.nameEN}
                      onChange={(e) => updateLocation(index, "nameEN", e.target.value)}
                      placeholder="Hannover Office"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Name (Deutsch)</Label>
                    <Input
                      value={loc.nameDE}
                      onChange={(e) => updateLocation(index, "nameDE", e.target.value)}
                      placeholder="Büro Hannover"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Address</Label>
                  <Input
                    value={loc.address}
                    onChange={(e) => updateLocation(index, "address", e.target.value)}
                    placeholder="Street 123, 12345 City, Germany"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSaveContactInfo}>
            <Save className="w-4 h-4 mr-2" />
            Save Contact Information
          </Button>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Test Email Integration
          </CardTitle>
          <CardDescription>
            Send a test email to verify Resend is configured correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="your@email.com"
              type="email"
              className="max-w-sm"
            />
            <Button
              onClick={handleSendTestEmail}
              disabled={isSendingTestEmail || !testEmailAddress}
            >
              {isSendingTestEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hero Avatar Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Avatar Selection</CardTitle>
          <CardDescription>
            Select different avatars for the English and German versions of the homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* English Avatar */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <Label className="text-base font-semibold">English (EN) Avatar</Label>
            </div>
            <div className="space-y-2">
              <Label>Select Avatar for /en pages</Label>
              <Select
                value={selectedAvatarEn || siteConfig?.heroAvatarIdEn || siteConfig?.heroAvatarId || ""}
                onValueChange={setSelectedAvatarEn}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select an avatar" />
                </SelectTrigger>
                <SelectContent>
                  {avatars?.map((avatar) => (
                    <SelectItem key={avatar._id} value={avatar._id}>
                      {avatar.name} - {avatar.persona?.role || "Teacher"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentAvatarEn && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Currently selected: {currentAvatarEn.name}</p>
                  {currentAvatarEn.profileImage && (
                    <p className="text-xs text-muted-foreground mt-1">Has profile image ✓</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* German Avatar */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <Label className="text-base font-semibold">Deutsch (DE) Avatar</Label>
            </div>
            <div className="space-y-2">
              <Label>Select Avatar for /de pages</Label>
              <Select
                value={selectedAvatarDe || siteConfig?.heroAvatarIdDe || siteConfig?.heroAvatarId || ""}
                onValueChange={setSelectedAvatarDe}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select an avatar" />
                </SelectTrigger>
                <SelectContent>
                  {avatars?.map((avatar) => (
                    <SelectItem key={avatar._id} value={avatar._id}>
                      {avatar.name} - {avatar.persona?.role || "Teacher"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentAvatarDe && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Currently selected: {currentAvatarDe.name}</p>
                  {currentAvatarDe.profileImage && (
                    <p className="text-xs text-muted-foreground mt-1">Has profile image ✓</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSaveAvatar} disabled={!selectedAvatarEn && !selectedAvatarDe}>
            <Save className="w-4 h-4 mr-2" />
            Save Avatar Selection
          </Button>
        </CardContent>
      </Card>

      {/* Avatar Greeting */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar Greeting Text</CardTitle>
          <CardDescription>
            Customize the greeting message shown in the avatar speech bubble on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* English */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <Label className="text-base font-semibold">English (EN)</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarNameEN">Avatar Name</Label>
              <Input
                id="avatarNameEN"
                value={avatarNameEN}
                onChange={(e) => setAvatarNameEN(e.target.value)}
                placeholder="e.g., Emma, Helena"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarGreetingEN">Greeting Message</Label>
              <Textarea
                id="avatarGreetingEN"
                value={avatarGreetingEN}
                onChange={(e) => setAvatarGreetingEN(e.target.value)}
                placeholder="Hi! I'm Emma, your AI language assistant..."
                rows={3}
              />
            </div>
          </div>

          {/* German */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <Label className="text-base font-semibold">Deutsch (DE)</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarNameDE">Avatar Name</Label>
              <Input
                id="avatarNameDE"
                value={avatarNameDE}
                onChange={(e) => setAvatarNameDE(e.target.value)}
                placeholder="z.B. Emma, Helena"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarGreetingDE">Begrüßungstext</Label>
              <Textarea
                id="avatarGreetingDE"
                value={avatarGreetingDE}
                onChange={(e) => setAvatarGreetingDE(e.target.value)}
                placeholder="Hallo! Ich bin Emma, Ihre KI-Sprachassistentin..."
                rows={3}
              />
            </div>
          </div>

          <Button onClick={handleSaveGreeting}>
            <Save className="w-4 h-4 mr-2" />
            Save Greeting Text
          </Button>
        </CardContent>
      </Card>

      {/* Avatar Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Avatar Session Settings
          </CardTitle>
          <CardDescription>
            Control how long visitors can interact with the AI avatar on the homepage to manage costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Timeout */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="sessionTimeout"
                  type="number"
                  min={60}
                  max={1800}
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 300)}
                  className="max-w-32"
                />
                <span className="text-sm text-muted-foreground">
                  = {Math.floor(sessionTimeout / 60)} min {sessionTimeout % 60} sec
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum time a visitor can chat with the avatar before being disconnected (default: 5 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warningAt">Warning Time (seconds before end)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="warningAt"
                  type="number"
                  min={10}
                  max={300}
                  value={warningAt}
                  onChange={(e) => setWarningAt(parseInt(e.target.value) || 60)}
                  className="max-w-32"
                />
                <span className="text-sm text-muted-foreground">
                  Show warning when {warningAt} seconds remain
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                When this many seconds remain, a warning banner will appear (default: 60 seconds)
              </p>
            </div>

            <div className="flex items-center justify-between py-3 px-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="showContactOnStop">Show Contact Form on Stop</Label>
                <p className="text-xs text-muted-foreground">
                  When the session ends (timeout or user closes), flip to show a contact form
                </p>
              </div>
              <Switch
                id="showContactOnStop"
                checked={showContactOnStop}
                onCheckedChange={setShowContactOnStop}
              />
            </div>

            <div className="flex items-center justify-between py-3 px-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="preloadAvatar">Preload Avatar Connection</Label>
                <p className="text-xs text-muted-foreground">
                  Start connecting to LiveKit when page loads (faster start, but uses credits for bounce visitors)
                </p>
              </div>
              <Switch
                id="preloadAvatar"
                checked={preloadAvatar}
                onCheckedChange={setPreloadAvatar}
              />
            </div>
          </div>

          <Button onClick={handleSaveSessionConfig}>
            <Save className="w-4 h-4 mr-2" />
            Save Session Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ FAQ Tab ============
function FAQTab() {
  const [locale, setLocale] = useState<Locale>("en");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [seoAnalysis, setSeoAnalysis] = useState<any>(null);
  const [analyzingFaqId, setAnalyzingFaqId] = useState<string | null>(null);

  const { generateContent, analyzeSEO, isGenerating, isAnalyzing } = useAIGeneration();

  const faqs = useQuery(api.landing.getFaqs, { locale });
  const createFaq = useMutation(api.landing.createFaq);
  const updateFaq = useMutation(api.landing.updateFaq);
  const deleteFaq = useMutation(api.landing.deleteFaq);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
  });

  const categories = [
    { value: "general", label: "General" },
    { value: "services", label: "Services" },
    { value: "pricing", label: "Pricing" },
    { value: "methodology", label: "Methodology" },
    { value: "booking", label: "Booking" },
  ];

  const handleAIGenerate = async () => {
    try {
      const content = await generateContent("faq", locale, aiTopic, formData.category);
      if (content) {
        setFormData({
          question: content.question || "",
          answer: content.answer || "",
          category: content.category || formData.category,
        });
        setIsAdding(true);
        toast.success("FAQ generated with AI! Review and save.");
      }
    } catch (error) {
      toast.error("Failed to generate FAQ");
    }
  };

  const handleAnalyzeFaq = async (faq: any) => {
    setAnalyzingFaqId(faq._id);
    try {
      const analysis = await analyzeSEO(
        { question: faq.question, answer: faq.answer },
        "faq",
        locale
      );
      setSeoAnalysis({ ...analysis, faqId: faq._id });
    } catch (error) {
      toast.error("Failed to analyze FAQ");
    }
    setAnalyzingFaqId(null);
  };

  const handleCreate = async () => {
    try {
      await createFaq({
        locale,
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        order: (faqs?.length || 0) + 1,
      });
      setFormData({ question: "", answer: "", category: "general" });
      setIsAdding(false);
      toast.success("FAQ created");
    } catch (error) {
      toast.error("Failed to create FAQ");
    }
  };

  const handleUpdate = async (id: Id<"landingFaq">) => {
    try {
      await updateFaq({
        id,
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
      });
      setEditingId(null);
      toast.success("FAQ updated");
    } catch (error) {
      toast.error("Failed to update FAQ");
    }
  };

  const handleDelete = async (id: Id<"landingFaq">) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      await deleteFaq({ id });
      toast.success("FAQ deleted");
    } catch (error) {
      toast.error("Failed to delete FAQ");
    }
  };

  const startEdit = (faq: any) => {
    setEditingId(faq._id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label>Language:</Label>
          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> English
                </span>
              </SelectItem>
              <SelectItem value="de">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Deutsch
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="w-4 h-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* AI Generation Panel */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI FAQ Generator
          </CardTitle>
          <CardDescription>
            Generate SEO-optimized FAQs with AI. Optimized for LLM search engines like Perplexity and ChatGPT Search.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Topic (optional)</Label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., 'pricing for group lessons' or 'German courses for beginners'"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate FAQ
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">New FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question..."
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {faqs?.map((faq) => (
          <Card key={faq._id}>
            <CardContent className="pt-6">
              {editingId === faq._id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Input
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <Textarea
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(faq._id)}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{faq.category}</Badge>
                    </div>
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                    {seoAnalysis?.faqId === faq._id && (
                      <SEOAnalysisPanel
                        analysis={seoAnalysis}
                        onClose={() => setSeoAnalysis(null)}
                      />
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAnalyzeFaq(faq)}
                      disabled={analyzingFaqId === faq._id}
                      title="Analyze SEO"
                    >
                      {analyzingFaqId === faq._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <BarChart3 className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(faq)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(faq._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {faqs?.length === 0 && !isAdding && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No FAQs yet. Click &quot;Add FAQ&quot; to create one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============ Testimonials Tab ============
function TestimonialsTab() {
  const [locale, setLocale] = useState<Locale>("en");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [aiContext, setAiContext] = useState("");

  const { generateContent, isGenerating } = useAIGeneration();

  const testimonials = useQuery(api.landing.getTestimonials, { locale });
  const createTestimonial = useMutation(api.landing.createTestimonial);
  const updateTestimonial = useMutation(api.landing.updateTestimonial);
  const deleteTestimonial = useMutation(api.landing.deleteTestimonial);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    role: "",
    quote: "",
    rating: 5,
    featured: false,
  });

  const handleAIGenerate = async () => {
    try {
      const content = await generateContent("testimonial", locale, undefined, undefined, aiContext);
      if (content) {
        setFormData({
          name: content.name || "",
          company: content.company || "",
          role: content.role || "",
          quote: content.quote || "",
          rating: content.rating || 5,
          featured: false,
        });
        setIsAdding(true);
        toast.success("Testimonial generated! Review and save.");
      }
    } catch (error) {
      toast.error("Failed to generate testimonial");
    }
  };

  const handleCreate = async () => {
    try {
      await createTestimonial({
        locale,
        ...formData,
        order: (testimonials?.length || 0) + 1,
      });
      setFormData({ name: "", company: "", role: "", quote: "", rating: 5, featured: false });
      setIsAdding(false);
      toast.success("Testimonial created");
    } catch (error) {
      toast.error("Failed to create testimonial");
    }
  };

  const handleUpdate = async (id: Id<"landingTestimonials">) => {
    try {
      await updateTestimonial({ id, ...formData });
      setEditingId(null);
      toast.success("Testimonial updated");
    } catch (error) {
      toast.error("Failed to update testimonial");
    }
  };

  const handleDelete = async (id: Id<"landingTestimonials">) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      await deleteTestimonial({ id });
      toast.success("Testimonial deleted");
    } catch (error) {
      toast.error("Failed to delete testimonial");
    }
  };

  const startEdit = (testimonial: any) => {
    setEditingId(testimonial._id);
    setFormData({
      name: testimonial.name,
      company: testimonial.company || "",
      role: testimonial.role || "",
      quote: testimonial.quote,
      rating: testimonial.rating || 5,
      featured: testimonial.isFeatured,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label>Language:</Label>
          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      {/* AI Generation Panel */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            AI Testimonial Generator
          </CardTitle>
          <CardDescription>
            Generate realistic testimonials. Review carefully before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Context (optional)</Label>
              <Input
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="e.g., 'corporate client from automotive industry' or 'beginner German learner'"
              />
            </div>
            <Button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Testimonial
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">New Testimonial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Marketing Manager"
                />
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(v) => setFormData({ ...formData, rating: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={r.toString()}>
                        {"★".repeat(r)}{"☆".repeat(5 - r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quote *</Label>
              <Textarea
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                placeholder="What they said about your service..."
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label>Featured testimonial</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!formData.name || !formData.quote}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {testimonials?.map((testimonial) => (
          <Card key={testimonial._id}>
            <CardContent className="pt-6">
              {editingId === testimonial._id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Quote</Label>
                    <Textarea
                      value={formData.quote}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(testimonial._id)}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{testimonial.name}</span>
                        {testimonial.isFeatured && <Badge>Featured</Badge>}
                      </div>
                      {(testimonial.role || testimonial.company) && (
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}{testimonial.role && testimonial.company && " at "}{testimonial.company}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(testimonial)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(testimonial._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">&quot;{testimonial.quote}&quot;</p>
                  {testimonial.rating && (
                    <div className="mt-2 text-yellow-500">
                      {"★".repeat(testimonial.rating)}{"☆".repeat(5 - testimonial.rating)}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {testimonials?.length === 0 && !isAdding && (
          <Card className="col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              No testimonials yet. Click &quot;Add Testimonial&quot; to create one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============ Blog Tab ============
function BlogTab() {
  const [locale, setLocale] = useState<Locale>("en");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [seoAnalysis, setSeoAnalysis] = useState<any>(null);
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"legacy" | "blocks">("blocks");

  const { generateContent, analyzeSEO, isGenerating, isAnalyzing } = useAIGeneration();

  const posts = useQuery(api.landing.getBlogPosts, { locale });
  const createPost = useMutation(api.landing.createBlogPost);
  const updatePost = useMutation(api.landing.updateBlogPost);
  const deletePost = useMutation(api.landing.deleteBlogPost);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    contentBlocks: [] as BlogBlock[],
    contentVersion: 2 as 1 | 2,
    author: "James Simmonds",
    category: "Business English",
    status: "draft" as "draft" | "published",
  });

  const handleAIGenerate = async () => {
    try {
      // Use blocks mode by default, or legacy based on current editor mode
      const generateType = editorMode === "blocks" ? "blog_with_blocks" : "blog";
      const content = await generateContent(generateType, locale, aiTopic, formData.category);

      if (content) {
        if (editorMode === "blocks" && content.contentBlocks) {
          // Block-based content
          setFormData({
            title: content.title || "",
            slug: content.slug || "",
            excerpt: content.excerpt || "",
            content: "", // No legacy content in blocks mode
            contentBlocks: content.contentBlocks || [],
            contentVersion: 2,
            author: content.author || "James Simmonds",
            category: content.category || formData.category,
            status: "draft",
          });
          toast.success("Blog post with blocks generated! Review and customize before publishing.");
        } else {
          // Legacy content
          setFormData({
            title: content.title || "",
            slug: content.slug || "",
            excerpt: content.excerpt || "",
            content: content.content || "",
            contentBlocks: [],
            contentVersion: 1,
            author: content.author || "James Simmonds",
            category: content.category || formData.category,
            status: "draft",
          });
          setEditorMode("legacy"); // Switch to legacy mode for AI-generated content
          toast.success("Blog post generated! Review and edit before publishing.");
        }
        setIsAdding(true);
      }
    } catch (error) {
      toast.error("Failed to generate blog post");
    }
  };

  const handleAnalyzePost = async (post: any) => {
    setAnalyzingPostId(post._id);
    try {
      const analysis = await analyzeSEO(
        { title: post.title, excerpt: post.excerpt, content: post.content },
        "blog",
        locale
      );
      setSeoAnalysis({ ...analysis, postId: post._id });
    } catch (error) {
      toast.error("Failed to analyze blog post");
    }
    setAnalyzingPostId(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleCreate = async () => {
    try {
      await createPost({
        locale,
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt,
        content: formData.contentVersion === 1 ? formData.content : "",
        contentBlocks: formData.contentVersion === 2 ? formData.contentBlocks : undefined,
        contentVersion: formData.contentVersion,
        author: formData.author,
        category: formData.category,
        status: formData.status,
        tags: [],
      });
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        contentBlocks: [],
        contentVersion: 2,
        author: "James Simmonds",
        category: "Business English",
        status: "draft"
      });
      setIsAdding(false);
      toast.success("Blog post created");
    } catch (error) {
      toast.error("Failed to create blog post");
    }
  };

  const handleUpdate = async (id: Id<"blogPosts">) => {
    try {
      await updatePost({
        id,
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.contentVersion === 1 ? formData.content : "",
        contentBlocks: formData.contentVersion === 2 ? formData.contentBlocks : undefined,
        contentVersion: formData.contentVersion,
        author: formData.author,
        category: formData.category,
        status: formData.status,
      });
      setEditingId(null);
      toast.success("Blog post updated");
    } catch (error) {
      toast.error("Failed to update blog post");
    }
  };

  const handleDelete = async (id: Id<"blogPosts">) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      await deletePost({ id });
      toast.success("Blog post deleted");
    } catch (error) {
      toast.error("Failed to delete blog post");
    }
  };

  const startEdit = (post: any) => {
    setEditingId(post._id);
    const version = post.contentVersion || 1;
    setEditorMode(version === 2 ? "blocks" : "legacy");
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content || "",
      contentBlocks: (post.contentBlocks || []) as BlogBlock[],
      contentVersion: version as 1 | 2,
      author: post.author,
      category: post.category,
      status: post.status,
    });
  };

  const blogCategories = [
    { value: "Business English", label: "Business English" },
    { value: "Communication", label: "Communication" },
    { value: "Culture", label: "Culture" },
    { value: "Grammar", label: "Grammar" },
    { value: "Tips", label: "Tips" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label>Language:</Label>
          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* AI Generation Panel */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            AI Blog Post Generator
          </CardTitle>
          <CardDescription>
            Generate SEO-optimized blog posts with AI. Optimized for LLM search engines and traditional SEO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Topic</Label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., '5 tips for business email etiquette' or 'common English grammar mistakes'"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {blogCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Post
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">New Blog Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: formData.slug || generateSlug(e.target.value)
                  })}
                  placeholder="Post title..."
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-friendly-slug"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business English">Business English</SelectItem>
                    <SelectItem value="Communication">Communication</SelectItem>
                    <SelectItem value="Culture">Culture</SelectItem>
                    <SelectItem value="Grammar">Grammar</SelectItem>
                    <SelectItem value="Tips">Tips</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as "draft" | "published" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Excerpt *</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary of the post..."
                rows={2}
              />
            </div>

            {/* Editor Mode Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Content Editor</Label>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${editorMode === "legacy" ? "font-medium" : "text-muted-foreground"}`}>
                    Legacy (Markdown)
                  </span>
                  <Switch
                    checked={editorMode === "blocks"}
                    onCheckedChange={(checked) => {
                      setEditorMode(checked ? "blocks" : "legacy");
                      setFormData({ ...formData, contentVersion: checked ? 2 : 1 });
                    }}
                  />
                  <span className={`text-sm ${editorMode === "blocks" ? "font-medium" : "text-muted-foreground"}`}>
                    Block Editor
                  </span>
                </div>
              </div>

              {editorMode === "legacy" ? (
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your post content in Markdown..."
                  rows={12}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <BlockEditor
                    blocks={formData.contentBlocks}
                    onChange={(blocks) => setFormData({ ...formData, contentBlocks: blocks })}
                    locale={locale}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!formData.title || !formData.excerpt}>
                <Save className="w-4 h-4 mr-2" />
                Save Post
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts?.map((post) => (
          <Card key={post._id}>
            <CardContent className="pt-6">
              {editingId === post._id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v as "draft" | "published" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Excerpt</Label>
                    <Textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={2}
                    />
                  </div>

                  {/* Editor Mode Toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Content Editor</Label>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm ${editorMode === "legacy" ? "font-medium" : "text-muted-foreground"}`}>
                          Legacy (Markdown)
                        </span>
                        <Switch
                          checked={editorMode === "blocks"}
                          onCheckedChange={(checked) => {
                            setEditorMode(checked ? "blocks" : "legacy");
                            setFormData({ ...formData, contentVersion: checked ? 2 : 1 });
                          }}
                        />
                        <span className={`text-sm ${editorMode === "blocks" ? "font-medium" : "text-muted-foreground"}`}>
                          Block Editor
                        </span>
                      </div>
                    </div>

                    {editorMode === "legacy" ? (
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Write your post content in Markdown..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <BlockEditor
                          blocks={formData.contentBlocks}
                          onChange={(blocks) => setFormData({ ...formData, contentBlocks: blocks })}
                          locale={locale}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(post._id)}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{post.title}</h3>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status}
                      </Badge>
                      <Badge variant="outline">{post.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{post.excerpt}</p>
                    <p className="text-xs text-muted-foreground">
                      By {post.author} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    {seoAnalysis?.postId === post._id && (
                      <SEOAnalysisPanel
                        analysis={seoAnalysis}
                        onClose={() => setSeoAnalysis(null)}
                      />
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAnalyzePost(post)}
                      disabled={analyzingPostId === post._id}
                      title="Analyze SEO"
                    >
                      {analyzingPostId === post._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <BarChart3 className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(post)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {posts?.length === 0 && !isAdding && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No blog posts yet. Click &quot;New Post&quot; to create one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============ Email Tab ============

interface EmailConfig {
  replyMode: "disabled" | "manual" | "ai_assisted" | "auto_ai";
  aiSettings: {
    enabled: boolean;
    model: string;
    customPrompt: string;
    temperature: number;
    maxTokens: number;
  };
  knowledgeBase: {
    includeFaqs: boolean;
    defaultKnowledgeBaseIds: string[];
    includeServices: boolean;
  };
  notifications: {
    notifyOnNewSubmission: boolean;
    notificationEmails: string[];
    notifyOnAutoReply: boolean;
  };
  templates: {
    en: {
      subjectPrefix: string;
      greeting: string;
      closing: string;
      signature: string;
    };
    de: {
      subjectPrefix: string;
      greeting: string;
      closing: string;
      signature: string;
    };
  };
  rateLimits: {
    maxAutoRepliesPerHour: number;
    cooldownMinutes: number;
  };
}

const REPLY_MODES = [
  {
    value: "disabled",
    label: "Disabled",
    description: "No autoresponder. Handle all replies manually.",
    icon: "🚫",
  },
  {
    value: "manual",
    label: "Manual First",
    description: "Default to manual reply. AI assist available.",
    icon: "✍️",
  },
  {
    value: "ai_assisted",
    label: "AI Assisted",
    description: "Default to AI reply. Edit before sending.",
    icon: "✨",
  },
  {
    value: "auto_ai",
    label: "Auto AI",
    description: "Automatically send AI-generated replies.",
    icon: "🤖",
  },
] as const;

function EmailTab() {
  const emailConfig = useQuery(api.landing.getEmailConfig);
  const updateEmailConfig = useMutation(api.landing.updateEmailConfig);
  const knowledgeBases = useQuery(api.knowledgeBases.getActive);

  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [templateLocale, setTemplateLocale] = useState<"en" | "de">("en");
  const [expandedSections, setExpandedSections] = useState({
    aiSettings: true,
    knowledgeBase: true,
    notifications: false,
    templates: false,
    rateLimits: false,
  });

  // Load config when data arrives
  useState(() => {
    if (emailConfig && !config) {
      setConfig(emailConfig as EmailConfig);
    }
  });

  // Update local config when query changes
  if (emailConfig && !config) {
    setConfig(emailConfig as EmailConfig);
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await updateEmailConfig({ config });
      toast.success("Email configuration saved!");
    } catch (error) {
      console.error("Failed to save email config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const addNotificationEmail = () => {
    if (!config || !newEmail || !newEmail.includes("@")) return;
    setConfig({
      ...config,
      notifications: {
        ...config.notifications,
        notificationEmails: [...config.notifications.notificationEmails, newEmail],
      },
    });
    setNewEmail("");
  };

  const removeNotificationEmail = (email: string) => {
    if (!config) return;
    setConfig({
      ...config,
      notifications: {
        ...config.notifications,
        notificationEmails: config.notifications.notificationEmails.filter((e) => e !== email),
      },
    });
  };

  const toggleKnowledgeBase = (kbId: string) => {
    if (!config) return;
    const currentIds = config.knowledgeBase.defaultKnowledgeBaseIds;
    const newIds = currentIds.includes(kbId)
      ? currentIds.filter((id) => id !== kbId)
      : [...currentIds, kbId];
    setConfig({
      ...config,
      knowledgeBase: {
        ...config.knowledgeBase,
        defaultKnowledgeBaseIds: newIds,
      },
    });
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Configuration</h2>
          <p className="text-muted-foreground">
            Configure autoresponder settings, AI prompts, and email templates
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </Button>
      </div>

      {/* Reply Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            Reply Mode
          </CardTitle>
          <CardDescription>
            Choose how to handle incoming contact form submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {REPLY_MODES.map((mode) => (
              <div
                key={mode.value}
                onClick={() => setConfig({ ...config, replyMode: mode.value })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config.replyMode === mode.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{mode.icon}</span>
                  <span className="font-medium">{mode.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("aiSettings")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Settings
            </CardTitle>
            {expandedSections.aiSettings ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
          <CardDescription>Configure AI-powered email generation</CardDescription>
        </CardHeader>
        {expandedSections.aiSettings && (
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable AI Replies</Label>
                <p className="text-sm text-muted-foreground">
                  Allow AI to generate email responses
                </p>
              </div>
              <Switch
                checked={config.aiSettings.enabled}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    aiSettings: { ...config.aiSettings, enabled: checked },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select
                value={config.aiSettings.model}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    aiSettings: { ...config.aiSettings, model: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-opus-4-5-20251101">Claude Opus 4.5</SelectItem>
                  <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                  <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom AI Prompt</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Define the persona and style for AI-generated replies
              </p>
              <Textarea
                value={config.aiSettings.customPrompt}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    aiSettings: { ...config.aiSettings, customPrompt: e.target.value },
                  })
                }
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperature ({config.aiSettings.temperature})</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.aiSettings.temperature}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      aiSettings: {
                        ...config.aiSettings,
                        temperature: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more consistent, Higher = more creative
                </p>
              </div>
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={config.aiSettings.maxTokens}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      aiSettings: {
                        ...config.aiSettings,
                        maxTokens: parseInt(e.target.value) || 1024,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Knowledge Base */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("knowledgeBase")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Knowledge Base
            </CardTitle>
            {expandedSections.knowledgeBase ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
          <CardDescription>
            Select default knowledge sources for AI context
          </CardDescription>
        </CardHeader>
        {expandedSections.knowledgeBase && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Include FAQs</Label>
                <p className="text-sm text-muted-foreground">
                  Use website FAQs as context
                </p>
              </div>
              <Switch
                checked={config.knowledgeBase.includeFaqs}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    knowledgeBase: { ...config.knowledgeBase, includeFaqs: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Include Services</Label>
                <p className="text-sm text-muted-foreground">
                  Use services information as context
                </p>
              </div>
              <Switch
                checked={config.knowledgeBase.includeServices}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    knowledgeBase: { ...config.knowledgeBase, includeServices: checked },
                  })
                }
              />
            </div>

            {knowledgeBases && knowledgeBases.length > 0 && (
              <div className="pt-4 border-t">
                <Label className="mb-3 block">Additional Knowledge Bases</Label>
                <div className="space-y-2">
                  {knowledgeBases.map((kb) => (
                    <div
                      key={kb._id}
                      onClick={() => toggleKnowledgeBase(kb._id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        config.knowledgeBase.defaultKnowledgeBaseIds.includes(kb._id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{kb.name}</span>
                          <p className="text-sm text-muted-foreground">
                            {kb.sources?.length || 0} sources
                          </p>
                        </div>
                        {config.knowledgeBase.defaultKnowledgeBaseIds.includes(kb._id) && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("notifications")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Notifications
            </CardTitle>
            {expandedSections.notifications ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
          <CardDescription>Configure email notifications</CardDescription>
        </CardHeader>
        {expandedSections.notifications && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notify on New Submission</Label>
                <p className="text-sm text-muted-foreground">
                  Send email when new contact form is submitted
                </p>
              </div>
              <Switch
                checked={config.notifications.notifyOnNewSubmission}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    notifications: { ...config.notifications, notifyOnNewSubmission: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notify on Auto-Reply</Label>
                <p className="text-sm text-muted-foreground">
                  Send copy when AI auto-reply is sent
                </p>
              </div>
              <Switch
                checked={config.notifications.notifyOnAutoReply}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    notifications: { ...config.notifications, notifyOnAutoReply: checked },
                  })
                }
              />
            </div>

            <div className="pt-4 border-t">
              <Label className="mb-3 block">Notification Emails</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  type="email"
                  placeholder="Add email address..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNotificationEmail()}
                />
                <Button onClick={addNotificationEmail} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.notifications.notificationEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 py-1">
                    {email}
                    <button
                      onClick={() => removeNotificationEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("templates")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Email Templates
            </CardTitle>
            {expandedSections.templates ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
          <CardDescription>
            Configure bilingual email templates
          </CardDescription>
        </CardHeader>
        {expandedSections.templates && (
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={templateLocale === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setTemplateLocale("en")}
              >
                🇬🇧 English
              </Button>
              <Button
                variant={templateLocale === "de" ? "default" : "outline"}
                size="sm"
                onClick={() => setTemplateLocale("de")}
              >
                🇩🇪 Deutsch
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject Prefix</Label>
                <Input
                  value={config.templates[templateLocale].subjectPrefix}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      templates: {
                        ...config.templates,
                        [templateLocale]: {
                          ...config.templates[templateLocale],
                          subjectPrefix: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Re: "
                />
              </div>

              <div className="space-y-2">
                <Label>Greeting</Label>
                <Input
                  value={config.templates[templateLocale].greeting}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      templates: {
                        ...config.templates,
                        [templateLocale]: {
                          ...config.templates[templateLocale],
                          greeting: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Dear {name},"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{name}"} as placeholder for recipient name
                </p>
              </div>

              <div className="space-y-2">
                <Label>Closing</Label>
                <Input
                  value={config.templates[templateLocale].closing}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      templates: {
                        ...config.templates,
                        [templateLocale]: {
                          ...config.templates[templateLocale],
                          closing: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Best regards,"
                />
              </div>

              <div className="space-y-2">
                <Label>Signature</Label>
                <Textarea
                  value={config.templates[templateLocale].signature}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      templates: {
                        ...config.templates,
                        [templateLocale]: {
                          ...config.templates[templateLocale],
                          signature: e.target.value,
                        },
                      },
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("rateLimits")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Rate Limits
            </CardTitle>
            {expandedSections.rateLimits ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
          <CardDescription>
            Configure auto-reply rate limiting
          </CardDescription>
        </CardHeader>
        {expandedSections.rateLimits && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Auto-Replies Per Hour</Label>
                <Input
                  type="number"
                  value={config.rateLimits.maxAutoRepliesPerHour}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rateLimits: {
                        ...config.rateLimits,
                        maxAutoRepliesPerHour: parseInt(e.target.value) || 20,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Limit automatic replies to prevent spam
                </p>
              </div>

              <div className="space-y-2">
                <Label>Cooldown (Minutes)</Label>
                <Input
                  type="number"
                  value={config.rateLimits.cooldownMinutes}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rateLimits: {
                        ...config.rateLimits,
                        cooldownMinutes: parseInt(e.target.value) || 5,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Wait time between replies to same email
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
