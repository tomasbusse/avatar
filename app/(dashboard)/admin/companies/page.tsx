"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Search,
  Users,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SubscriptionStatus = "active" | "trial" | "suspended" | "cancelled";
type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

const statusColors: Record<SubscriptionStatus, string> = {
  active: "bg-green-100 text-green-800",
  trial: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const tierColors: Record<SubscriptionTier, string> = {
  free: "bg-gray-100 text-gray-800",
  starter: "bg-blue-100 text-blue-800",
  professional: "bg-purple-100 text-purple-800",
  enterprise: "bg-amber-100 text-amber-800",
};

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Id<"companies"> | null>(null);

  const companies = useQuery(api.companies.listCompanies, {
    filters: statusFilter !== "all" ? { subscriptionStatus: statusFilter } : undefined,
  });

  const createCompany = useMutation(api.companies.createCompany);
  const updateCompany = useMutation(api.companies.updateCompany);
  const deleteCompany = useMutation(api.companies.deleteCompany);

  // Filter by search query
  const filteredCompanies = companies?.companies?.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (companyId: Id<"companies">) => {
    if (!confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteCompany({ companyId, force: true });
      toast.success("Company deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete company");
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Company Management</h1>
            <p className="text-muted-foreground">
              Manage organizations and their subscriptions
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Company
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "trial", "suspended", "cancelled"] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Company
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Tier
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Groups
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Users
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies?.map((company) => (
                <CompanyRow
                  key={company._id}
                  company={company}
                  onEdit={() => {
                    setSelectedCompany(company._id);
                    setEditDialogOpen(true);
                  }}
                  onDelete={() => handleDelete(company._id)}
                />
              ))}
              {filteredCompanies?.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No companies found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Dialog */}
        <CreateCompanyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={async (data) => {
            try {
              await createCompany(data);
              toast.success("Company created");
              setCreateDialogOpen(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to create company");
            }
          }}
        />

        {/* Edit Dialog */}
        {selectedCompany && (
          <EditCompanyDialog
            companyId={selectedCompany}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setSelectedCompany(null);
            }}
            onSubmit={async (data) => {
              try {
                await updateCompany({ companyId: selectedCompany, ...data });
                toast.success("Company updated");
                setEditDialogOpen(false);
                setSelectedCompany(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update company");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function CompanyRow({
  company,
  onEdit,
  onDelete,
}: {
  company: {
    _id: Id<"companies">;
    name: string;
    slug: string;
    subscriptionTier: SubscriptionTier;
    subscriptionStatus: SubscriptionStatus;
    maxGroups?: number | null;
    maxStudents?: number | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stats = useQuery(api.companies.getCompanyStats, { companyId: company._id });

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{company.name}</div>
            <div className="text-sm text-muted-foreground">{company.slug}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[company.subscriptionTier]}`}>
          {company.subscriptionTier.charAt(0).toUpperCase() + company.subscriptionTier.slice(1)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[company.subscriptionStatus]}`}>
          {company.subscriptionStatus.charAt(0).toUpperCase() + company.subscriptionStatus.slice(1)}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span>
            {stats?.groupCount ?? 0}
            {company.maxGroups && ` / ${company.maxGroups}`}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>
            {stats?.userCount ?? 0}
            {company.maxStudents && ` / ${company.maxStudents}`}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function CreateCompanyDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    slug: string;
    description?: string;
    subscriptionTier: SubscriptionTier;
    subscriptionStatus: SubscriptionStatus;
    maxStudents?: number;
    maxGroups?: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<SubscriptionTier>("starter");
  const [status, setStatus] = useState<SubscriptionStatus>("trial");
  const [maxStudents, setMaxStudents] = useState("");
  const [maxGroups, setMaxGroups] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleSubmit = async () => {
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        slug,
        description: description || undefined,
        subscriptionTier: tier,
        subscriptionStatus: status,
        maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
        maxGroups: maxGroups ? parseInt(maxGroups) : undefined,
      });
      // Reset form
      setName("");
      setSlug("");
      setDescription("");
      setTier("starter");
      setStatus("trial");
      setMaxStudents("");
      setMaxGroups("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Company</DialogTitle>
          <DialogDescription>
            Add a new organization to the platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Corporation"
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="acme-corp"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subscription Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as SubscriptionTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input
                id="maxStudents"
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                placeholder="Unlimited"
              />
            </div>

            <div>
              <Label htmlFor="maxGroups">Max Groups</Label>
              <Input
                id="maxGroups"
                type="number"
                value={maxGroups}
                onChange={(e) => setMaxGroups(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCompanyDialog({
  companyId,
  open,
  onOpenChange,
  onSubmit,
}: {
  companyId: Id<"companies">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name?: string;
    description?: string;
    subscriptionTier?: SubscriptionTier;
    subscriptionStatus?: SubscriptionStatus;
    maxStudents?: number;
    maxGroups?: number;
  }) => Promise<void>;
}) {
  const company = useQuery(api.companies.getCompany, { companyId });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<SubscriptionTier>("starter");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [maxStudents, setMaxStudents] = useState("");
  const [maxGroups, setMaxGroups] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form when company data loads
  if (company && !initialized) {
    setName(company.name);
    setDescription(company.description || "");
    setTier(company.subscriptionTier);
    setStatus(company.subscriptionStatus);
    setMaxStudents(company.maxStudents?.toString() || "");
    setMaxGroups(company.maxGroups?.toString() || "");
    setInitialized(true);
  }

  // Reset initialized when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInitialized(false);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        description: description || undefined,
        subscriptionTier: tier,
        subscriptionStatus: status,
        maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
        maxGroups: maxGroups ? parseInt(maxGroups) : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update company details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Company Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subscription Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as SubscriptionTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-maxStudents">Max Students</Label>
              <Input
                id="edit-maxStudents"
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                placeholder="Unlimited"
              />
            </div>

            <div>
              <Label htmlFor="edit-maxGroups">Max Groups</Label>
              <Input
                id="edit-maxGroups"
                type="number"
                value={maxGroups}
                onChange={(e) => setMaxGroups(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
