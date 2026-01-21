"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Users,
  Layers,
  Shield,
  MoreHorizontal,
  Plus,
  Loader2,
  UserPlus,
  Search,
  UsersRound,
  Link as LinkIcon,
  Unlink,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const tierColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-800",
  starter: "bg-blue-100 text-blue-800",
  professional: "bg-purple-100 text-purple-800",
  enterprise: "bg-amber-100 text-amber-800",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trial: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

const levelColors: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-green-100 text-green-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-yellow-100 text-yellow-800",
  C1: "bg-purple-100 text-purple-800",
  C2: "bg-purple-100 text-purple-800",
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as Id<"companies">;

  const [activeTab, setActiveTab] = useState<"groups" | "students" | "admins">("groups");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);
  const [addExistingGroupOpen, setAddExistingGroupOpen] = useState(false);
  const [bulkAddMembersOpen, setBulkAddMembersOpen] = useState(false);
  const [viewMembersOpen, setViewMembersOpen] = useState(false);

  const company = useQuery(api.companies.getCompanyWithDetails, { companyId });

  if (company === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (company === null) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Company Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This company doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Link href="/admin/companies">
            <Button variant="outline">Back to Companies</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/companies"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <p className="text-muted-foreground">{company.description || company.slug}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierColors[company.subscriptionTier]}`}>
                    {company.subscriptionTier}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[company.subscriptionStatus]}`}>
                    {company.subscriptionStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{company.stats.groupCount}</p>
                  <p className="text-sm text-muted-foreground">Groups</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{company.stats.studentCount}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{company.stats.adminCount}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Layers className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{company.stats.activeGroupCount}</p>
                  <p className="text-sm text-muted-foreground">Active Groups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-4">
            {(["groups", "students", "admins"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "groups" && (
          <GroupsTab
            groups={company.groups}
            companyId={companyId}
            onAddStudent={(groupId) => {
              setSelectedGroupId(groupId);
              setAddStudentOpen(true);
            }}
            onAddExistingGroup={() => setAddExistingGroupOpen(true)}
            onBulkAddMembers={(groupId) => {
              setSelectedGroupId(groupId);
              setBulkAddMembersOpen(true);
            }}
            onViewMembers={(groupId) => {
              setSelectedGroupId(groupId);
              setViewMembersOpen(true);
            }}
          />
        )}

        {activeTab === "students" && (
          <StudentsTab
            students={company.students}
            groups={company.groups}
            onAddStudent={() => {
              setSelectedGroupId(null);
              setAddStudentOpen(true);
            }}
          />
        )}

        {activeTab === "admins" && (
          <AdminsTab admins={company.admins} companyId={companyId} />
        )}
      </div>

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        companyId={companyId}
        groupId={selectedGroupId}
        groups={company.groups}
      />

      {/* Add Existing Group Dialog */}
      <AddExistingGroupDialog
        open={addExistingGroupOpen}
        onOpenChange={setAddExistingGroupOpen}
        companyId={companyId}
      />

      {/* Bulk Add Members Dialog */}
      {selectedGroupId && (
        <BulkAddMembersDialog
          open={bulkAddMembersOpen}
          onOpenChange={setBulkAddMembersOpen}
          groupId={selectedGroupId}
          groupName={company.groups.find((g) => g._id === selectedGroupId)?.name || ""}
        />
      )}

      {/* View Members Dialog */}
      {selectedGroupId && (
        <ViewMembersDialog
          open={viewMembersOpen}
          onOpenChange={setViewMembersOpen}
          groupId={selectedGroupId}
          groupName={company.groups.find((g) => g._id === selectedGroupId)?.name || ""}
        />
      )}
    </div>
  );
}

function GroupsTab({
  groups,
  companyId,
  onAddStudent,
  onAddExistingGroup,
  onBulkAddMembers,
  onViewMembers,
}: {
  groups: Array<{
    _id: Id<"groups">;
    name: string;
    slug: string;
    description?: string;
    targetLevel?: string;
    capacity?: number;
    status: string;
    memberCount: number;
    leadName: string | null;
  }>;
  companyId: Id<"companies">;
  onAddStudent: (groupId: Id<"groups">) => void;
  onAddExistingGroup: () => void;
  onBulkAddMembers: (groupId: Id<"groups">) => void;
  onViewMembers: (groupId: Id<"groups">) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const createGroup = useMutation(api.groups.createGroup);
  const unassignGroup = useMutation(api.groups.unassignGroupFromCompany);

  const handleCreateGroup = async (data: {
    name: string;
    slug: string;
    description?: string;
    targetLevel?: string;
    capacity?: number;
  }) => {
    try {
      await createGroup({
        companyId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        targetLevel: data.targetLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | undefined,
        capacity: data.capacity,
      });
      toast.success("Group created successfully");
      setCreateOpen(false);
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  const handleUnassignGroup = async (groupId: Id<"groups">) => {
    try {
      await unassignGroup({ groupId });
      toast.success("Group removed from company");
    } catch (error) {
      toast.error("Failed to remove group");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Groups ({groups.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onAddExistingGroup}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Add Existing Group
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No groups yet</p>
          <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
            Create First Group
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Group</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Level</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Members</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Lead</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group._id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-muted-foreground">{group.slug}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {group.targetLevel && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[group.targetLevel] || "bg-gray-100"}`}>
                        {group.targetLevel}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">
                      {group.memberCount}
                      {group.capacity && ` / ${group.capacity}`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {group.leadName || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      group.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewMembers(group._id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddStudent(group._id)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Student
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onBulkAddMembers(group._id)}>
                          <UsersRound className="w-4 h-4 mr-2" />
                          Bulk Add Members
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUnassignGroup(group._id)}
                          className="text-destructive"
                        >
                          <Unlink className="w-4 h-4 mr-2" />
                          Remove from Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}

function StudentsTab({
  students,
  groups,
  onAddStudent,
}: {
  students: Array<{
    studentId: Id<"students">;
    userId: Id<"users">;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    status: string;
    currentLevel: string;
    groupIds: Id<"groups">[];
    groupCount: number;
  }>;
  groups: Array<{ _id: Id<"groups">; name: string }>;
  onAddStudent: () => void;
}) {
  const [search, setSearch] = useState("");

  const filteredStudents = students.filter((student) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      student.email.toLowerCase().includes(searchLower) ||
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const getGroupNames = (groupIds: Id<"groups">[]) => {
    return groupIds
      .map((id) => groups.find((g) => g._id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Students ({students.length})</h2>
        <Button onClick={onAddStudent}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
        />
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {search ? "No students match your search" : "No students yet"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Level</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Groups</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.studentId} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {student.imageUrl ? (
                        <img src={student.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {student.firstName?.[0] || student.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">
                        {student.firstName} {student.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{student.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[student.currentLevel] || "bg-gray-100"}`}>
                      {student.currentLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {getGroupNames(student.groupIds) || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      student.status === "active"
                        ? "bg-green-100 text-green-700"
                        : student.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminsTab({
  admins,
  companyId,
}: {
  admins: Array<{
    userId: Id<"users">;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    assignedAt: number;
  }>;
  companyId: Id<"companies">;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Company Admins ({admins.length})</h2>
      </div>

      {admins.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No company admins assigned</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Admin</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.userId} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {admin.imageUrl ? (
                        <img src={admin.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {admin.firstName?.[0] || admin.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">
                        {admin.firstName} {admin.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{admin.email}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(admin.assignedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateGroupDialog({
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
    targetLevel?: string;
    capacity?: number;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [targetLevel, setTargetLevel] = useState("");
  const [capacity, setCapacity] = useState("");

  const handleSubmit = () => {
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }
    onSubmit({
      name,
      slug,
      description: description || undefined,
      targetLevel: targetLevel || undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
    });
    setName("");
    setSlug("");
    setDescription("");
    setTargetLevel("");
    setCapacity("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>Add a new learning group to this company.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Beginner English A1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="beginner-english-a1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Level</label>
              <Select value={targetLevel} onValueChange={setTargetLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Max students"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddStudentDialog({
  open,
  onOpenChange,
  companyId,
  groupId,
  groups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: Id<"companies">;
  groupId: Id<"groups"> | null;
  groups: Array<{ _id: Id<"groups">; name: string; status: string }>;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groupId || "");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);

  // Form fields for new user
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentLevel, setCurrentLevel] = useState("A1");

  // Update selectedGroupId when groupId prop changes
  useState(() => {
    if (groupId) setSelectedGroupId(groupId);
  });

  const availableUsers = useQuery(
    api.users.listUsersAvailableForGroup,
    selectedGroupId ? { groupId: selectedGroupId as Id<"groups">, search: search || undefined } : "skip"
  );

  const addMember = useMutation(api.groups.addMemberToGroup);
  const createAndAdd = useMutation(api.groups.createUserAndAddToGroup);

  const activeGroups = groups.filter((g) => g.status === "active");

  const handleAddExisting = async () => {
    if (!selectedGroupId || !selectedUserId) {
      toast.error("Please select a group and user");
      return;
    }

    const user = availableUsers?.find((u) => u.userId === selectedUserId);
    if (!user) return;

    try {
      await addMember({
        groupId: selectedGroupId as Id<"groups">,
        studentId: user.studentId,
      });
      toast.success("Student added to group");
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add student");
    }
  };

  const handleCreateNew = async () => {
    if (!selectedGroupId || !email) {
      toast.error("Please select a group and enter an email");
      return;
    }

    try {
      await createAndAdd({
        groupId: selectedGroupId as Id<"groups">,
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        studentConfig: { currentLevel },
      });
      toast.success("User created and added to group");
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const resetForm = () => {
    setMode("existing");
    setSearch("");
    setSelectedUserId(null);
    setEmail("");
    setFirstName("");
    setLastName("");
    setCurrentLevel("A1");
    if (!groupId) setSelectedGroupId("");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Student to Group</DialogTitle>
          <DialogDescription>
            Add an existing user or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Group</label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {activeGroups.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode Tabs */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setMode("existing")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                mode === "existing" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              Add Existing
            </button>
            <button
              onClick={() => setMode("new")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                mode === "new" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              Create New
            </button>
          </div>

          {mode === "existing" ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  disabled={!selectedGroupId}
                />
              </div>

              {/* User List */}
              <div className="border rounded-lg max-h-48 overflow-auto">
                {!selectedGroupId ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    Select a group first
                  </p>
                ) : availableUsers === undefined ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    No available users found
                  </p>
                ) : (
                  availableUsers.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => setSelectedUserId(user.userId)}
                      className={`w-full p-3 flex items-center gap-3 hover:bg-muted/50 border-b last:border-b-0 ${
                        selectedUserId === user.userId ? "bg-primary/10" : ""
                      }`}
                    >
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.firstName?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <span className={`ml-auto px-2 py-0.5 rounded text-xs ${levelColors[user.currentLevel] || "bg-gray-100"}`}>
                        {user.currentLevel}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* New User Form */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="student@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Level</label>
                  <Select value={currentLevel} onValueChange={setCurrentLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                User will be created with &quot;pending&quot; status until they sign up.
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={mode === "existing" ? handleAddExisting : handleCreateNew}
            disabled={!selectedGroupId || (mode === "existing" ? !selectedUserId : !email)}
          >
            {mode === "existing" ? "Add to Group" : "Create & Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddExistingGroupDialog({
  open,
  onOpenChange,
  companyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: Id<"companies">;
}) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  const unassignedGroups = useQuery(api.groups.getUnassignedGroups);
  const assignGroup = useMutation(api.groups.assignGroupToCompany);

  const handleAssign = async () => {
    if (selectedGroupIds.size === 0) {
      toast.error("Please select at least one group");
      return;
    }

    try {
      const groupIdArray = Array.from(selectedGroupIds);
      for (const groupId of groupIdArray) {
        await assignGroup({
          groupId: groupId as Id<"groups">,
          companyId,
        });
      }
      toast.success(`${selectedGroupIds.size} group(s) added to company`);
      setSelectedGroupIds(new Set());
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to assign groups");
    }
  };

  const toggleGroup = (groupId: string) => {
    const newSet = new Set(selectedGroupIds);
    if (newSet.has(groupId)) {
      newSet.delete(groupId);
    } else {
      newSet.add(groupId);
    }
    setSelectedGroupIds(newSet);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setSelectedGroupIds(new Set());
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Existing Groups</DialogTitle>
          <DialogDescription>
            Select groups that are not currently assigned to any company.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {unassignedGroups === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : unassignedGroups.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No unassigned groups available</p>
            </div>
          ) : (
            <div className="border rounded-lg max-h-64 overflow-auto">
              {unassignedGroups.map((group) => (
                <label
                  key={group._id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.has(group._id)}
                    onChange={() => toggleGroup(group._id)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                      {group.targetLevel && ` • ${group.targetLevel}`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={selectedGroupIds.size === 0}>
            Add {selectedGroupIds.size > 0 ? `(${selectedGroupIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkAddMembersDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: Id<"groups">;
  groupName: string;
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
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
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
                  <span className={`px-2 py-0.5 rounded text-xs ${levelColors[student.currentLevel] || "bg-gray-100"}`}>
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

function ViewMembersDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: Id<"groups">;
  groupName: string;
}) {
  const members = useQuery(api.groups.getGroupMembers, { groupId });
  const removeMember = useMutation(api.groups.removeMemberFromGroup);

  const handleRemove = async (studentId: Id<"students">) => {
    try {
      await removeMember({ groupId, studentId });
      toast.success("Member removed from group");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
          <DialogDescription>
            Members of <span className="font-medium">{groupName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {members === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No members in this group</p>
            </div>
          ) : (
            <div className="border rounded-lg max-h-80 overflow-auto">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-3 border-b last:border-b-0"
                >
                  {member.user?.imageUrl ? (
                    <img src={member.user.imageUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.user?.firstName?.[0] || member.user?.email?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.user?.firstName} {member.user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === "lead" && (
                      <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">
                        Lead
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs ${levelColors[member.student?.currentLevel ?? ""] || "bg-gray-100"}`}>
                      {member.student?.currentLevel}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRemove(member.studentId)}
                          className="text-destructive"
                        >
                          Remove from Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
