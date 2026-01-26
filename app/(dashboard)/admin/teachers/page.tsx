"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  GraduationCap,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  Building2,
  Globe,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TeacherStatus = "active" | "inactive";

const statusColors: Record<TeacherStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
};

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | "all">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignAvatarsDialogOpen, setAssignAvatarsDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Id<"teachers"> | null>(null);

  const teachers = useQuery(api.teachers.listTeachers, {
    filters: statusFilter !== "all" ? { status: statusFilter } : undefined,
  });

  const deleteTeacher = useMutation(api.teachers.deleteTeacher);

  // Filter by search query
  const filteredTeachers = teachers?.filter((teacher: NonNullable<typeof teachers>[number]) => {
    const searchLower = searchQuery.toLowerCase();
    const userName = `${teacher.user?.firstName || ""} ${teacher.user?.lastName || ""}`.toLowerCase();
    const userEmail = teacher.user?.email?.toLowerCase() || "";
    return (
      userName.includes(searchLower) ||
      userEmail.includes(searchLower)
    );
  });

  const handleDelete = async (teacherId: Id<"teachers">) => {
    if (!confirm("Are you sure you want to remove this teacher? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteTeacher({ teacherId });
      toast.success("Teacher removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove teacher");
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Teacher Management</h1>
            <p className="text-muted-foreground">
              Manage teachers and their avatar assignments
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((status) => (
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
                  Teacher
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Scope
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Avatars
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
              {teachers === undefined ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                  </td>
                </tr>
              ) : filteredTeachers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No teachers found</p>
                  </td>
                </tr>
              ) : (
                filteredTeachers?.map((teacher: NonNullable<typeof teachers>[number]) => (
                  <TeacherRow
                    key={teacher._id}
                    teacher={teacher}
                    onEdit={() => {
                      setSelectedTeacher(teacher._id);
                      setEditDialogOpen(true);
                    }}
                    onAssignAvatars={() => {
                      setSelectedTeacher(teacher._id);
                      setAssignAvatarsDialogOpen(true);
                    }}
                    onDelete={() => handleDelete(teacher._id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Dialog */}
        <CreateTeacherDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        {/* Edit Dialog */}
        {selectedTeacher && (
          <EditTeacherDialog
            teacherId={selectedTeacher}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setSelectedTeacher(null);
            }}
          />
        )}

        {/* Assign Avatars Dialog */}
        {selectedTeacher && (
          <AssignAvatarsDialog
            teacherId={selectedTeacher}
            open={assignAvatarsDialogOpen}
            onOpenChange={(open) => {
              setAssignAvatarsDialogOpen(open);
              if (!open) setSelectedTeacher(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function TeacherRow({
  teacher,
  onEdit,
  onAssignAvatars,
  onDelete,
}: {
  teacher: {
    _id: Id<"teachers">;
    status: TeacherStatus;
    user: {
      _id: Id<"users">;
      email: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
    } | null;
    company: {
      _id: Id<"companies">;
      name: string;
      slug: string;
    } | null;
    avatars: {
      _id: Id<"avatars">;
      name: string;
      slug: string;
      profileImage?: string;
    }[];
  };
  onEdit: () => void;
  onAssignAvatars: () => void;
  onDelete: () => void;
}) {
  const userName = teacher.user
    ? `${teacher.user.firstName || ""} ${teacher.user.lastName || ""}`.trim() ||
      teacher.user.email
    : "Unknown User";

  const userInitials = teacher.user
    ? (teacher.user.firstName?.[0] || "") + (teacher.user.lastName?.[0] || "") ||
      teacher.user.email[0].toUpperCase()
    : "?";

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={teacher.user?.imageUrl} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-muted-foreground">{teacher.user?.email}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        {teacher.company ? (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span>{teacher.company.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="text-blue-600 font-medium">Global</span>
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {teacher.avatars.length === 0 ? (
            <span className="text-muted-foreground text-sm">No avatars</span>
          ) : (
            teacher.avatars.slice(0, 3).map((avatar) => (
              <span
                key={avatar._id}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                {avatar.name}
              </span>
            ))
          )}
          {teacher.avatars.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{teacher.avatars.length - 3} more
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[teacher.status]}`}>
          {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
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
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAssignAvatars}>
              <User className="w-4 h-4 mr-2" />
              Assign Avatars
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function CreateTeacherDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("global");
  const [notes, setNotes] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableUsers = useQuery(api.teachers.getAvailableUsersForTeacher, {
    search: userSearch || undefined,
  });

  const companies = useQuery(api.companies.listCompanies, {});

  const createTeacher = useMutation(api.teachers.createTeacher);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTeacher({
        userId: selectedUserId,
        companyId: selectedCompanyId !== "global" ? selectedCompanyId as Id<"companies"> : undefined,
        notes: notes || undefined,
      });
      toast.success("Teacher added successfully");
      onOpenChange(false);
      // Reset form
      setSelectedUserId(null);
      setSelectedCompanyId("global");
      setNotes("");
      setUserSearch("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedUserId(null);
      setSelectedCompanyId("global");
      setNotes("");
      setUserSearch("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Teacher</DialogTitle>
          <DialogDescription>
            Select a user to add as a teacher
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select User</Label>
            <div className="mt-1">
              <Input
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="mb-2"
              />
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {availableUsers === undefined ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No available users found
                  </div>
                ) : (
                  availableUsers.map((user: NonNullable<typeof availableUsers>[number]) => {
                    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
                    const isSelected = selectedUserId === user._id;
                    return (
                      <div
                        key={user._id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                        onClick={() => setSelectedUserId(user._id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.imageUrl} alt={userName} />
                          <AvatarFallback>
                            {(user.firstName?.[0] || "") + (user.lastName?.[0] || "") ||
                              user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{userName}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div>
            <Label>Scope</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Global (All Companies)
                  </div>
                </SelectItem>
                {companies?.companies?.map((company) => (
                  <SelectItem key={company._id} value={company._id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {company.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this teacher..."
              rows={2}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedUserId}>
            {isSubmitting ? "Adding..." : "Add Teacher"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTeacherDialog({
  teacherId,
  open,
  onOpenChange,
}: {
  teacherId: Id<"teachers">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const teacher = useQuery(api.teachers.getTeacher, { teacherId });

  const [status, setStatus] = useState<TeacherStatus>("active");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const updateTeacher = useMutation(api.teachers.updateTeacher);

  // Initialize form when teacher data loads
  if (teacher && !initialized) {
    setStatus(teacher.status);
    setNotes(teacher.notes || "");
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
      await updateTeacher({
        teacherId,
        status,
        notes: notes || undefined,
      });
      toast.success("Teacher updated");
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!teacher) return null;

  const userName = teacher.user
    ? `${teacher.user.firstName || ""} ${teacher.user.lastName || ""}`.trim() ||
      teacher.user.email
    : "Unknown User";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>
            Update teacher details for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TeacherStatus)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this teacher..."
              rows={3}
              className="mt-1"
            />
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

function AssignAvatarsDialog({
  teacherId,
  open,
  onOpenChange,
}: {
  teacherId: Id<"teachers">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const teacher = useQuery(api.teachers.getTeacher, { teacherId });
  const allAvatars = useQuery(api.teachers.getAllAvatarsForAssignment, {});

  const [selectedAvatarIds, setSelectedAvatarIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const updateTeacherAvatars = useMutation(api.teachers.updateTeacherAvatars);

  // Initialize selected avatars when teacher data loads
  if (teacher && !initialized) {
    setSelectedAvatarIds(new Set(teacher.avatarIds.map((id: Id<"avatars">) => id.toString())));
    setInitialized(true);
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInitialized(false);
    }
    onOpenChange(newOpen);
  };

  const toggleAvatar = (avatarId: string) => {
    const newSet = new Set(selectedAvatarIds);
    if (newSet.has(avatarId)) {
      newSet.delete(avatarId);
    } else {
      newSet.add(avatarId);
    }
    setSelectedAvatarIds(newSet);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateTeacherAvatars({
        teacherId,
        avatarIds: Array.from(selectedAvatarIds) as Id<"avatars">[],
      });
      toast.success("Avatars updated");
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update avatars");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!teacher) return null;

  const userName = teacher.user
    ? `${teacher.user.firstName || ""} ${teacher.user.lastName || ""}`.trim() ||
      teacher.user.email
    : "Unknown User";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Avatars</DialogTitle>
          <DialogDescription>
            Select avatars for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg max-h-80 overflow-y-auto">
          {allAvatars === undefined ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin" />
            </div>
          ) : allAvatars.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No avatars available
            </div>
          ) : (
            allAvatars.map((avatar) => {
              const isSelected = selectedAvatarIds.has(avatar._id.toString());
              return (
                <div
                  key={avatar._id}
                  className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleAvatar(avatar._id.toString())}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleAvatar(avatar._id.toString())}
                  />
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                    {avatar.profileImage ? (
                      <img
                        src={avatar.profileImage}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{avatar.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {avatar.description || avatar.slug}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {selectedAvatarIds.size} avatar{selectedAvatarIds.size !== 1 ? "s" : ""} selected
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
