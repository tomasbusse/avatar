"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  MapPin,
  Briefcase,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

// Section type definitions with default content structure
const SECTION_TYPES = {
  hero: {
    name: "Hero Section",
    fields: ["badge", "title", "subtitle", "features"],
    defaultContent: {
      badge: "Business Englisch",
      title: "Business Englischkurse in Hannover",
      subtitle: "Professionelle Business Englischkurse für Ihre Mitarbeiter:innen...",
      features: ["Lernen Sie vor Ort in Hannover", "Muttersprachliche Lehrer", "Blended Learning"],
    },
  },
  content: {
    name: "Content Block",
    fields: ["title", "paragraphs"],
    defaultContent: {
      title: "Unsere Leistungen im Überblick",
      paragraphs: ["Paragraph 1...", "Paragraph 2..."],
    },
  },
  services: {
    name: "Services Grid",
    fields: ["badge", "title", "subtitle", "items"],
    defaultContent: {
      badge: "Was wir unterrichten",
      title: "Business Englisch Themen",
      subtitle: "Natürlicher und situationsbezogener Sprachgebrauch",
      items: [
        { title: "Präsentationen", description: "Souveräne Präsentationen auf Englisch" },
        { title: "E-Mails", description: "Professionelle schriftliche Kommunikation" },
      ],
    },
  },
  features: {
    name: "Features/USP",
    fields: ["title", "items"],
    defaultContent: {
      title: "Warum Simmonds Language Services?",
      items: [
        { title: "Firmenunterricht", description: "Flexibles Training vor Ort oder online" },
        { title: "Individuelles Konzept", description: "Maßgeschneiderter Unterricht" },
      ],
    },
  },
  faq: {
    name: "FAQ Section",
    fields: ["title", "items"],
    defaultContent: {
      title: "Fragen & Antworten",
      items: [
        { question: "Wo finde ich einen Business Englisch Kurs?", answer: "..." },
      ],
    },
  },
  contact: {
    name: "Contact Section",
    fields: ["title", "description", "address", "phone", "email", "hours"],
    defaultContent: {
      title: "Kontakt aufnehmen",
      description: "Kontaktieren Sie uns für eine kostenlose Beratung",
      address: "Schaufelder Straße 11, 30167 Hannover",
      phone: "0511-473 9339",
      email: "james@englisch-lehrer.com",
      hours: "Montag - Freitag: 09:00 - 18:00",
    },
  },
  cta: {
    name: "Call to Action",
    fields: ["title", "subtitle", "trustBadge"],
    defaultContent: {
      title: "Bereit für besseres Business Englisch?",
      subtitle: "Kontaktieren Sie uns noch heute für eine kostenlose Beratung",
      trustBadge: "Über 20 Jahre Erfahrung in der Unternehmensfortbildung",
    },
  },
};

export default function CityPagesAdminPage() {
  const [selectedPage, setSelectedPage] = useState<Id<"cityServicePages"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all city pages
  const pages = useQuery(api.cityPages.list, {});

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">City Service Pages</h1>
        <p className="text-muted-foreground mt-2">
          Manage city-specific landing pages (SEO pages like /hannover/business-englisch)
        </p>
      </div>

      {/* Page List or Editor */}
      {selectedPage ? (
        <PageEditor
          pageId={selectedPage}
          onBack={() => setSelectedPage(null)}
        />
      ) : isCreating ? (
        <CreatePageForm
          onCancel={() => setIsCreating(false)}
          onSuccess={() => setIsCreating(false)}
        />
      ) : (
        <PagesList
          pages={pages || []}
          onSelect={setSelectedPage}
          onCreate={() => setIsCreating(true)}
        />
      )}
    </div>
  );
}

// Pages List Component
function PagesList({
  pages,
  onSelect,
  onCreate,
}: {
  pages: any[];
  onSelect: (id: Id<"cityServicePages">) => void;
  onCreate: () => void;
}) {
  const deletePage = useMutation(api.cityPages.deletePage);
  const publish = useMutation(api.cityPages.publish);
  const unpublish = useMutation(api.cityPages.unpublish);

  const handleDelete = async (id: Id<"cityServicePages">, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await deletePage({ id });
      toast.success("Page deleted");
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  const handleTogglePublish = async (page: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (page.status === "published") {
        await unpublish({ id: page._id });
        toast.success("Page unpublished");
      } else {
        await publish({ id: page._id });
        toast.success("Page published");
      }
    } catch (error) {
      toast.error("Failed to update page status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">All Pages</h2>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No City Pages Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first city-specific landing page to improve local SEO.
            </p>
            <Button onClick={onCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <Card
              key={page._id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelect(page._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground capitalize">{page.city}</span>
                  </div>
                  <Badge variant={page.status === "published" ? "default" : "secondary"}>
                    {page.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{page.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span className="font-mono text-xs">/{page.slug}</span>
                  <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {page.sections?.length || 0} sections
                  </span>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleTogglePublish(page, e)}
                    >
                      {page.status === "published" ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(page._id, e)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Create Page Form Component
function CreatePageForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPage = useMutation(api.cityPages.create);

  // Default sections for a new city service page
  const getDefaultSections = () => [
    {
      id: "hero",
      type: "hero" as const,
      order: 0,
      isPublished: true,
      content: SECTION_TYPES.hero.defaultContent,
    },
    {
      id: "content-main",
      type: "content" as const,
      order: 1,
      isPublished: true,
      content: SECTION_TYPES.content.defaultContent,
    },
    {
      id: "services",
      type: "services" as const,
      order: 2,
      isPublished: true,
      content: SECTION_TYPES.services.defaultContent,
    },
    {
      id: "features",
      type: "features" as const,
      order: 3,
      isPublished: true,
      content: SECTION_TYPES.features.defaultContent,
    },
    {
      id: "faq",
      type: "faq" as const,
      order: 4,
      isPublished: true,
      content: SECTION_TYPES.faq.defaultContent,
    },
    {
      id: "contact",
      type: "contact" as const,
      order: 5,
      isPublished: true,
      content: SECTION_TYPES.contact.defaultContent,
    },
    {
      id: "cta",
      type: "cta" as const,
      order: 6,
      isPublished: true,
      content: SECTION_TYPES.cta.defaultContent,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !service || !title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPage({
        city: city.toLowerCase().replace(/\s+/g, "-"),
        service: service.toLowerCase().replace(/\s+/g, "-"),
        title,
        metaDescription: metaDescription || undefined,
        sections: getDefaultSections(),
        status: "draft",
      });
      toast.success("Page created successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create page");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New City Service Page</CardTitle>
        <CardDescription>
          Create a new city-specific landing page for local SEO
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Hannover, Berlin, Munich"
              />
              <p className="text-xs text-muted-foreground">
                Will be used in URL: /{city.toLowerCase().replace(/\s+/g, "-")}/...
              </p>
            </div>
            <div className="space-y-2">
              <Label>Service *</Label>
              <Input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g., business-englisch, firmenkurse"
              />
              <p className="text-xs text-muted-foreground">
                Will be used in URL: /.../{service.toLowerCase().replace(/\s+/g, "-")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Page Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Business Englischkurse in Hannover"
            />
          </div>

          <div className="space-y-2">
            <Label>Meta Description (SEO)</Label>
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Brief description for search engines..."
              rows={3}
            />
          </div>

          {city && service && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Page URL Preview:</p>
              <code className="text-sm">
                /{city.toLowerCase().replace(/\s+/g, "-")}/{service.toLowerCase().replace(/\s+/g, "-")}
              </code>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Page"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Page Editor Component
function PageEditor({
  pageId,
  onBack,
}: {
  pageId: Id<"cityServicePages">;
  onBack: () => void;
}) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);

  const page = useQuery(api.cityPages.getBySlug, { slug: "" }); // We need to get by ID
  const pageById = useQuery(api.cityPages.list, {});
  const currentPage = pageById?.find((p) => p._id === pageId);

  const updateSection = useMutation(api.cityPages.updateSection);
  const addSection = useMutation(api.cityPages.addSection);
  const deleteSection = useMutation(api.cityPages.deleteSection);
  const updatePage = useMutation(api.cityPages.update);

  if (!currentPage) {
    return <div>Loading...</div>;
  }

  const handleSaveSection = async (sectionId: string, content: any) => {
    try {
      await updateSection({
        pageId,
        sectionId,
        content,
      });
      setEditingSectionId(null);
      toast.success("Section saved");
    } catch (error) {
      toast.error("Failed to save section");
    }
  };

  const handleToggleSectionPublish = async (sectionId: string, isPublished: boolean) => {
    try {
      await updateSection({
        pageId,
        sectionId,
        isPublished: !isPublished,
      });
      toast.success(isPublished ? "Section hidden" : "Section visible");
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      await deleteSection({ pageId, sectionId });
      toast.success("Section deleted");
    } catch (error) {
      toast.error("Failed to delete section");
    }
  };

  const handleAddSection = async (type: keyof typeof SECTION_TYPES) => {
    const sectionDef = SECTION_TYPES[type];
    const newSection = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      order: (currentPage.sections?.length || 0) + 1,
      isPublished: true,
      content: sectionDef.defaultContent,
    };

    try {
      await addSection({ pageId, section: newSection });
      setIsAddingSection(false);
      toast.success("Section added");
    } catch (error) {
      toast.error("Failed to add section");
    }
  };

  const sortedSections = [...(currentPage.sections || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{currentPage.title}</h2>
            <p className="text-muted-foreground">/{currentPage.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/${currentPage.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            Preview <ExternalLink className="w-3 h-3" />
          </a>
          <Badge variant={currentPage.status === "published" ? "default" : "secondary"}>
            {currentPage.status}
          </Badge>
        </div>
      </div>

      {/* Page Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <PageMetadataForm page={currentPage} onUpdate={updatePage} />
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Page Sections</h3>
          <Button onClick={() => setIsAddingSection(true)} disabled={isAddingSection}>
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>

        {/* Add Section Panel */}
        {isAddingSection && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">Add New Section</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(SECTION_TYPES).map(([type, def]) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => handleAddSection(type as keyof typeof SECTION_TYPES)}
                  >
                    <span className="font-semibold">{def.name}</span>
                  </Button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setIsAddingSection(false)} className="mt-4">
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Section List */}
        {sortedSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            isEditing={editingSectionId === section.id}
            onEdit={() => setEditingSectionId(section.id)}
            onCancelEdit={() => setEditingSectionId(null)}
            onSave={(content) => handleSaveSection(section.id, content)}
            onTogglePublish={() => handleToggleSectionPublish(section.id, section.isPublished)}
            onDelete={() => handleDeleteSection(section.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Section Card Component
function SectionCard({
  section,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onTogglePublish,
  onDelete,
}: {
  section: any;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (content: any) => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const [editContent, setEditContent] = useState(JSON.stringify(section.content, null, 2));
  const sectionDef = SECTION_TYPES[section.type as keyof typeof SECTION_TYPES];

  const handleSave = () => {
    try {
      const content = JSON.parse(editContent);
      onSave(content);
    } catch (error) {
      toast.error("Invalid JSON content");
    }
  };

  return (
    <Card className={!section.isPublished ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            <div>
              <CardTitle className="text-base">{sectionDef?.name || section.type}</CardTitle>
              <CardDescription>Order: {section.order}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={section.isPublished ? "default" : "secondary"}>
              {section.isPublished ? "Visible" : "Hidden"}
            </Badge>
            {!isEditing && (
              <>
                <Button variant="ghost" size="icon" onClick={onTogglePublish}>
                  {section.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {isEditing && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Content (JSON)</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={onCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Page Metadata Form Component
function PageMetadataForm({
  page,
  onUpdate,
}: {
  page: any;
  onUpdate: (args: any) => Promise<any>;
}) {
  const [title, setTitle] = useState(page.title);
  const [metaTitle, setMetaTitle] = useState(page.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(page.metaDescription || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        id: page._id,
        title,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      });
      toast.success("Page settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Page Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Meta Title (SEO)</Label>
          <Input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Leave empty to use page title"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Meta Description (SEO)</Label>
        <Textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          placeholder="Brief description for search engines..."
        />
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
