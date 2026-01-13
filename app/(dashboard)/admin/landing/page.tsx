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
  Globe
} from "lucide-react";
import { toast } from "sonner";

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
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Site Config
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
        </TabsList>

        <TabsContent value="config">
          <SiteConfigTab />
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
      </Tabs>
    </div>
  );
}

// ============ Site Config Tab ============
function SiteConfigTab() {
  const siteConfig = useQuery(api.landing.getFullSiteConfig);
  const avatars = useQuery(api.avatars.listActiveAvatars);
  const updateConfig = useMutation(api.landing.updateSiteConfig);

  const [selectedAvatar, setSelectedAvatar] = useState<string>("");

  const handleSave = async () => {
    if (!selectedAvatar) return;

    try {
      await updateConfig({
        heroAvatarId: selectedAvatar as Id<"avatars">
      });
      toast.success("Site configuration updated");
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Configuration</CardTitle>
        <CardDescription>
          Configure global settings for your marketing website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Hero Avatar</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select the avatar that appears on the homepage hero section
          </p>
          <Select
            value={selectedAvatar || siteConfig?.heroAvatarId || ""}
            onValueChange={setSelectedAvatar}
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
        </div>

        <Button onClick={handleSave} disabled={!selectedAvatar}>
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ FAQ Tab ============
function FAQTab() {
  const [locale, setLocale] = useState<Locale>("en");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

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

        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>

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
                  </div>
                  <div className="flex gap-2 ml-4">
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
              No FAQs yet. Click "Add FAQ" to create one.
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
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
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
              No testimonials yet. Click "Add Testimonial" to create one.
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

  const posts = useQuery(api.landing.getBlogPosts, { locale });
  const createPost = useMutation(api.landing.createBlogPost);
  const updatePost = useMutation(api.landing.updateBlogPost);
  const deletePost = useMutation(api.landing.deleteBlogPost);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "James Simmonds",
    category: "Business English",
    status: "draft" as "draft" | "published",
  });

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
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        tags: [],
      });
      setFormData({ title: "", slug: "", excerpt: "", content: "", author: "James Simmonds", category: "Business English", status: "draft" });
      setIsAdding(false);
      toast.success("Blog post created");
    } catch (error) {
      toast.error("Failed to create blog post");
    }
  };

  const handleUpdate = async (id: Id<"blogPosts">) => {
    try {
      await updatePost({ id, ...formData });
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
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      category: post.category,
      status: post.status,
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
          New Post
        </Button>
      </div>

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
            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your post content in Markdown..."
                rows={12}
                className="font-mono text-sm"
              />
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
                  <div className="space-y-2">
                    <Label>Content (Markdown)</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={10}
                      className="font-mono text-sm"
                    />
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
                  </div>
                  <div className="flex gap-2 ml-4">
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
              No blog posts yet. Click "New Post" to create one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
