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
  Layers,
  Plus,
  Search,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  UserPlus,
  Crown,
  Building2,
  UsersRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GroupStatus = "active" | "archived";
type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const statusColors: Record<GroupStatus, string> = {
  active: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

const levelColors: Record<CEFRLevel, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-lime-100 text-lime-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-orange-100 text-orange-800",
  C1: "bg-red-100 text-red-800",
  C2: "bg-purple-100 text-purple-800",
};

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GroupStatus | "all">("all");
  const [companyFilter, setCompanyFilter] = useState<Id<"companies"> | "all">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [assignCompanyDialogOpen, setAssignCompanyDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Id<"groups"> | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState("");

  const companies = useQuery(api.companies.listCompanies, {});
  const groups = useQuery(api.groups.listGroups, {
    companyId: companyFilter !== "all" ? companyFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const createGroup = useMutation(api.groups.createGroup);
  const updateGroup = useMutation(api.groups.updateGroup);
  const archiveGroup = useMutation(api.groups.archiveGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);

  // Filter by search query
  const filteredGroups = groups?.groups?.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleArchive = async (groupId: Id<"groups">) => {
    try {
      await archiveGroup({ groupId });
      toast.success("Group archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive group");
    }
  };

  const handleDelete = async (groupId: Id<"groups">) => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteGroup({ groupId, force: true });
      toast.success("Group deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete group");
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Group Management</h1>
            <p className="text-muted-foreground">
              Manage learning groups within companies
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={companyFilter === "all" ? "all" : companyFilter}
            onValueChange={(v) => setCompanyFilter(v === "all" ? "all" : v as Id<"companies">)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies?.companies?.map((company) => (
                <SelectItem key={company._id} value={company._id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {(["all", "active", "archived"] as const).map((status) => (
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
                  Group
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Company
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Level
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Members
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Lead
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups?.map((group) => (
                <tr key={group._id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-muted-foreground">{group.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {group.companyName && group.companyName !== "Unknown" ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{group.companyName}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {group.targetLevel ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[group.targetLevel]}`}>
                        {group.targetLevel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {group.memberCount}
                        {group.capacity && ` / ${group.capacity}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {group.leadName ? (
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>{group.leadName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No lead</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[group.status]}`}>
                      {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedGroup(group._id);
                          setMembersDialogOpen(true);
                        }}>
                          <Users className="w-4 h-4 mr-2" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedGroup(group._id);
                          setSelectedGroupName(group.name);
                          setBulkAddDialogOpen(true);
                        }}>
                          <UsersRound className="w-4 h-4 mr-2" />
                          Bulk Add Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedGroup(group._id);
                          setEditDialogOpen(true);
                        }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {(!group.companyName || group.companyName === "Unknown") && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedGroup(group._id);
                            setSelectedGroupName(group.name);
                            setAssignCompanyDialogOpen(true);
                          }}>
                            <Building2 className="w-4 h-4 mr-2" />
                            Assign to Company
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {group.status === "active" && (
                          <DropdownMenuItem onClick={() => handleArchive(group._id)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(group._id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredGroups?.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No groups found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Dialog */}
        <CreateGroupDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          companies={companies?.companies || []}
          onSubmit={async (data) => {
            try {
              await createGroup(data);
              toast.success("Group created");
              setCreateDialogOpen(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to create group");
            }
          }}
        />

        {/* Edit Dialog */}
        {selectedGroup && (
          <EditGroupDialog
            groupId={selectedGroup}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setSelectedGroup(null);
            }}
            onSubmit={async (data) => {
              try {
                await updateGroup({ groupId: selectedGroup, ...data });
                toast.success("Group updated");
                setEditDialogOpen(false);
                setSelectedGroup(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update group");
              }
            }}
          />
        )}

        {/* Members Dialog */}
        {selectedGroup && (
          <GroupMembersDialog
            groupId={selectedGroup}
            open={membersDialogOpen}
            onOpenChange={(open) => {
              setMembersDialogOpen(open);
              if (!open) setSelectedGroup(null);
            }}
          />
        )}

        {/* Bulk Add Members Dialog */}
        {selectedGroup && (
          <BulkAddMembersDialog
            groupId={selectedGroup}
            groupName={selectedGroupName}
            open={bulkAddDialogOpen}
            onOpenChange={(open) => {
              setBulkAddDialogOpen(open);
              if (!open) {
                setSelectedGroup(null);
                setSelectedGroupName("");
              }
            }}
          />
        )}

        {/* Assign to Company Dialog */}
        {selectedGroup && (
          <AssignCompanyDialog
            groupId={selectedGroup}
            groupName={selectedGroupName}
            companies={companies?.companies || []}
            open={assignCompanyDialogOpen}
            onOpenChange={(open) => {
              setAssignCompanyDialogOpen(open);
              if (!open) {
                setSelectedGroup(null);
                setSelectedGroupName("");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function CreateGroupDialog({
  open,
  onOpenChange,
  companies,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: { _id: Id<"companies">; name: string }[];
  onSubmit: (data: {
    companyId: Id<"companies">;
    name: string;
    slug: string;
    description?: string;
    targetLevel?: CEFRLevel;
    capacity?: number;
  }) => Promise<void>;
}) {
  const [companyId, setCompanyId] = useState<Id<"companies"> | "">("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [targetLevel, setTargetLevel] = useState<CEFRLevel | "">("");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleSubmit = async () => {
    if (!companyId || !name || !slug) {
      toast.error("Company, name, and slug are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        companyId,
        name,
        slug,
        description: description || undefined,
        targetLevel: targetLevel || undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
      });
      // Reset form
      setCompanyId("");
      setName("");
      setSlug("");
      setDescription("");
      setTargetLevel("");
      setCapacity("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Add a new learning group to a company
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Company</Label>
            <Select value={companyId} onValueChange={(v) => setCompanyId(v as Id<"companies">)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company._id} value={company._id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Beginner English"
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="beginner-english"
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
              <Label>Target Level</Label>
              <Select value={targetLevel} onValueChange={(v) => setTargetLevel(v as CEFRLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
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
            {isSubmitting ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditGroupDialog({
  groupId,
  open,
  onOpenChange,
  onSubmit,
}: {
  groupId: Id<"groups">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name?: string;
    description?: string;
    targetLevel?: CEFRLevel;
    capacity?: number;
  }) => Promise<void>;
}) {
  const group = useQuery(api.groups.getGroup, { groupId });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetLevel, setTargetLevel] = useState<CEFRLevel | "">("");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (group && !initialized) {
    setName(group.name);
    setDescription(group.description || "");
    setTargetLevel(group.targetLevel || "");
    setCapacity(group.capacity?.toString() || "");
    setInitialized(true);
  }

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
        targetLevel: targetLevel || undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update group details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Group Name</Label>
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
              <Label>Target Level</Label>
              <Select value={targetLevel} onValueChange={(v) => setTargetLevel(v as CEFRLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
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

function GroupMembersDialog({
  groupId,
  open,
  onOpenChange,
}: {
  groupId: Id<"groups">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const members = useQuery(api.groups.getGroupMembers, { groupId });
  const group = useQuery(api.groups.getGroup, { groupId });
  const removeMember = useMutation(api.groups.removeMemberFromGroup);
  const updateMemberRole = useMutation(api.groups.updateMemberRole);

  const handleRemove = async (studentId: Id<"students">) => {
    if (!confirm("Remove this member from the group?")) return;
    try {
      await removeMember({ groupId, studentId, reason: "Removed by admin" });
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  };

  const handlePromote = async (studentId: Id<"students">) => {
    try {
      await updateMemberRole({ groupId, studentId, role: "lead" });
      toast.success("Member promoted to lead");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to promote member");
    }
  };

  const handleDemote = async (studentId: Id<"students">) => {
    try {
      await updateMemberRole({ groupId, studentId, role: "member" });
      toast.success("Member demoted to regular member");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to demote member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
          <DialogDescription>
            {group?.name} - {members?.length ?? 0} members
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-auto">
          {members?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No members in this group</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members?.filter(m => m.status === "active").map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {member.user?.imageUrl ? (
                      <img
                        src={member.user.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.user?.firstName?.[0] || member.user?.email?.[0] || "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {member.user?.firstName} {member.user?.lastName}
                        {member.role === "lead" && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.user?.email}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === "member" ? (
                        <DropdownMenuItem onClick={() => handlePromote(member.studentId)}>
                          <Crown className="w-4 h-4 mr-2" />
                          Promote to Lead
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleDemote(member.studentId)}>
                          <Users className="w-4 h-4 mr-2" />
                          Demote to Member
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRemove(member.studentId)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkAddMembersDialog({
  groupId,
  groupName,
  open,
  onOpenChange,
}: {
  groupId: Id<"groups">;
  groupName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const availableStudents = useQuery(api.groups.getAvailableStudentsForGroup, { groupId });
  const bulkAdd = useMutation(api.groups.bulkAddMembersToGroup);

  const filteredStudents = availableStudents?.filter((student) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      student.user?.email?.toLowerCase().includes(searchLower) ||
      student.user?.firstName?.toLowerCase().includes(searchLower) ||
      student.user?.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const handleAdd = async () => {
    if (selectedStudentIds.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    try {
      const result = await bulkAdd({
        groupId,
        studentIds: Array.from(selectedStudentIds) as Id<"students">[],
      });
      toast.success(`Added ${result.addedCount} student(s) to group`);
      setSelectedStudentIds(new Set());
      setSearch("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add students");
    }
  };

  const toggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const selectAll = () => {
    if (filteredStudents) {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s._id)));
    }
  };

  const selectNone = () => {
    setSelectedStudentIds(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setSelectedStudentIds(new Set());
        setSearch("");
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Add Members</DialogTitle>
          <DialogDescription>
            Add multiple students to <span className="font-medium">{groupName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 text-sm">
            <button onClick={selectAll} className="text-primary hover:underline">
              Select all
            </button>
            <span className="text-muted-foreground">•</span>
            <button onClick={selectNone} className="text-primary hover:underline">
              Clear selection
            </button>
            <span className="ml-auto text-muted-foreground">
              {selectedStudentIds.size} selected
            </span>
          </div>

          {/* Student list */}
          {availableStudents === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredStudents?.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {search ? "No students match your search" : "No available students"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg max-h-64 overflow-auto">
              {filteredStudents?.map((student) => (
                <label
                  key={student._id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.has(student._id)}
                    onChange={() => toggleStudent(student._id)}
                    className="w-4 h-4 rounded"
                  />
                  {student.user?.imageUrl ? (
                    <img src={student.user.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {student.user?.firstName?.[0] || student.user?.email?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {student.user?.firstName} {student.user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{student.user?.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${levelColors[student.currentLevel as CEFRLevel] || "bg-gray-100"}`}>
                    {student.currentLevel}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedStudentIds.size === 0}>
            Add {selectedStudentIds.size > 0 ? `(${selectedStudentIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignCompanyDialog({
  groupId,
  groupName,
  companies,
  open,
  onOpenChange,
}: {
  groupId: Id<"groups">;
  groupName: string;
  companies: { _id: Id<"companies">; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<Id<"companies"> | "">("");

  const assignGroup = useMutation(api.groups.assignGroupToCompany);

  const handleAssign = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    try {
      await assignGroup({
        groupId,
        companyId: selectedCompanyId,
      });
      toast.success(`Group assigned to company`);
      setSelectedCompanyId("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to assign group");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setSelectedCompanyId("");
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Company</DialogTitle>
          <DialogDescription>
            Assign <span className="font-medium">{groupName}</span> to a company
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label>Company</Label>
          <Select value={selectedCompanyId} onValueChange={(v) => setSelectedCompanyId(v as Id<"companies">)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company._id} value={company._id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedCompanyId}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
