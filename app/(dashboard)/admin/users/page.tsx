"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  Shield,
  MoreHorizontal,
  Loader2,
  Plus,
  Building2,
  Layers,
  CheckSquare,
  Square,
  X,
  UserCog,
  UserPlus,
  Clock,
  Pencil,
  Trash2,
  Ban,
} from "lucide-react";
import { toast } from "sonner";

type UserRole = "admin" | "moderator" | "student" | "guest";

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  company_admin: "bg-orange-100 text-orange-800 border-orange-200",
  teacher: "bg-blue-100 text-blue-800 border-blue-200",
  group_lead: "bg-purple-100 text-purple-800 border-purple-200",
  student: "bg-green-100 text-green-800 border-green-200",
  guest: "bg-gray-100 text-gray-800 border-gray-200",
};

const roleDisplayNames: Record<string, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  teacher: "Teacher",
  group_lead: "Group Lead",
  student: "Student",
  guest: "Guest",
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [legacyRoleFilter, setLegacyRoleFilter] = useState<UserRole | "all">("all");
  const [rbacRoleFilter, setRbacRoleFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<Id<"users">>>(new Set());
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<{
    id: Id<"users">;
    name: string;
  } | null>(null);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);

  // Queries
  const usersData = useQuery(api.users.listUsersWithRoles, {
    paginationOpts: { numItems: 100 },
    filters: {
      ...(legacyRoleFilter !== "all" && { role: legacyRoleFilter }),
      ...(rbacRoleFilter !== "all" && { rbacRoleId: rbacRoleFilter }),
      ...(companyFilter !== "all" && { companyId: companyFilter as Id<"companies"> }),
      ...(groupFilter !== "all" && { groupId: groupFilter as Id<"groups"> }),
    },
  });
  const companies = useQuery(api.companies.listCompanies, {});
  const groups = useQuery(api.groups.listGroups, {});
  const roles = useQuery(api.rbac.listSystemRoles);

  // Edit user dialog state
  const [editingUser, setEditingUser] = useState<{
    _id: Id<"users">;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    status: string;
  } | null>(null);

  // Mutations
  const setUserRole = useMutation(api.users.setUserRole);
  const assignRole = useMutation(api.rbac.assignRoleToUser);
  const revokeRole = useMutation(api.rbac.revokeRoleFromUser);
  const bulkAssign = useMutation(api.rbac.bulkAssignRole);
  const createUserByAdmin = useMutation(api.users.createUserByAdmin);
  const updateUser = useMutation(api.users.updateUser);
  const deleteUser = useMutation(api.users.deleteUser);
  const bulkDeleteUsers = useMutation(api.users.bulkDeleteUsers);

  // Filter users by search
  const filteredUsers = usersData?.users?.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleLegacyRoleChange = async (userId: Id<"users">, newRole: UserRole) => {
    try {
      await setUserRole({ userId, role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleUpdateUser = async (data: {
    userId: Id<"users">;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    status?: "active" | "suspended" | "banned" | "pending";
  }) => {
    try {
      await updateUser(data);
      toast.success("User updated successfully");
      setEditingUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: Id<"users">, hardDelete: boolean = false) => {
    const confirmMessage = hardDelete
      ? "Are you sure you want to permanently delete this user? This cannot be undone."
      : "Are you sure you want to deactivate this user?";
    if (!confirm(confirmMessage)) return;

    try {
      await deleteUser({ userId, hardDelete });
      toast.success(hardDelete ? "User permanently deleted" : "User deactivated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const handleAssignRole = async (
    userId: Id<"users">,
    roleId: string,
    scope: "global" | "company" | "group",
    scopeId?: string
  ) => {
    try {
      await assignRole({
        userId,
        roleId,
        scope,
        scopeId: scopeId as Id<"companies"> | Id<"groups"> | undefined,
      });
      toast.success("Role assigned successfully");
      setAssignRoleDialogOpen(false);
      setSelectedUserForRole(null);
    } catch (error) {
      toast.error("Failed to assign role");
    }
  };

  const handleRevokeRole = async (assignmentId: Id<"userRoleAssignments">) => {
    try {
      await revokeRole({ assignmentId });
      toast.success("Role revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke role");
    }
  };

  const handleBulkAssign = async (
    roleId: string,
    scope: "global" | "company" | "group",
    scopeId?: string
  ) => {
    try {
      await bulkAssign({
        userIds: Array.from(selectedUsers),
        roleId,
        scope,
        scopeId: scopeId as Id<"companies"> | Id<"groups"> | undefined,
      });
      toast.success(`Role assigned to ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      setBulkAssignDialogOpen(false);
    } catch (error) {
      toast.error("Failed to assign roles");
    }
  };

  const handleBulkDelete = async (hardDelete: boolean) => {
    try {
      const result = await bulkDeleteUsers({
        userIds: Array.from(selectedUsers),
        hardDelete,
      });
      if (result.failCount > 0) {
        toast.warning(
          `${result.successCount} users ${hardDelete ? "deleted" : "deactivated"}, ${result.failCount} failed`
        );
      } else {
        toast.success(
          `${result.successCount} users ${hardDelete ? "permanently deleted" : "deactivated"}`
        );
      }
      setSelectedUsers(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete users");
    }
  };

  const toggleUserSelection = (userId: Id<"users">) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedUsers.size === filteredUsers?.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers?.map((u) => u._id)));
    }
  };

  // Extract arrays from paginated results
  const companiesList = companies?.companies;
  const groupsList = groups?.groups;

  // Filter groups by company if company is selected
  const filteredGroups = companyFilter !== "all"
    ? groupsList?.filter((g) => g.companyId === companyFilter)
    : groupsList;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, RBAC roles, and permissions
            </p>
          </div>
          <Button onClick={() => setCreateUserDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            {/* Search and filters */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  {(["all", "admin", "student", "guest"] as const).map((role) => (
                    <Button
                      key={role}
                      variant={legacyRoleFilter === role ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLegacyRoleFilter(role)}
                    >
                      {role === "all" ? "All" : role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* RBAC Filters Row */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <Select value={rbacRoleFilter} onValueChange={setRbacRoleFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="RBAC Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All RBAC Roles</SelectItem>
                      {roles?.map((role) => (
                        <SelectItem key={role._id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={companyFilter}
                    onValueChange={(value) => {
                      setCompanyFilter(value);
                      setGroupFilter("all"); // Reset group when company changes
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companiesList?.map((company) => (
                        <SelectItem key={company._id} value={company._id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {filteredGroups?.map((group) => (
                        <SelectItem key={group._id} value={group._id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk actions */}
                {selectedUsers.size > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-muted-foreground">
                      {selectedUsers.size} selected
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setBulkAssignDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Assign Role
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUsers(new Set())}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!usersData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredUsers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground w-10">
                        <button
                          onClick={toggleAllSelection}
                          className="hover:text-foreground"
                        >
                          {selectedUsers.size === filteredUsers?.length ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Legacy Role</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">RBAC Roles</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers?.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleUserSelection(user._id)}
                            className="hover:text-foreground text-muted-foreground"
                          >
                            {selectedUsers.has(user._id) ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {user.imageUrl ? (
                              <img
                                src={user.imageUrl}
                                alt=""
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {user.firstName?.[0] || user.email[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleLegacyRoleChange(user._id, e.target.value as UserRole)}
                            className="px-2 py-1 rounded border bg-background text-sm"
                          >
                            <option value="guest">Guest</option>
                            <option value="student">Student</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.rbacRoles && user.rbacRoles.length > 0 ? (
                              user.rbacRoles.map((role, idx) => (
                                <RoleBadge
                                  key={idx}
                                  role={role}
                                  onRevoke={() => role.assignmentId && handleRevokeRole(role.assignmentId as Id<"userRoleAssignments">)}
                                />
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No RBAC roles</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            user.status === "active"
                              ? "bg-green-100 text-green-700"
                              : user.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : user.status === "suspended"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {user.status === "pending" && <Clock className="w-3 h-3" />}
                            {user.status === "pending" ? "Pending Signup" : user.status}
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
                              <DropdownMenuItem
                                onClick={() => setEditingUser({
                                  _id: user._id,
                                  email: user.email,
                                  firstName: user.firstName,
                                  lastName: user.lastName,
                                  role: user.role,
                                  status: user.status,
                                })}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUserForRole({
                                    id: user._id,
                                    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
                                  });
                                  setAssignRoleDialogOpen(true);
                                }}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Assign RBAC Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleLegacyRoleChange(user._id, user.role === "admin" ? "student" : "admin")}
                              >
                                <UserCog className="w-4 h-4 mr-2" />
                                {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "active" && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user._id, false)}
                                  className="text-orange-600"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Deactivate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user._id, true)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Permanently
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
          </CardContent>
        </Card>
      </div>

      {/* Assign Role Dialog (Single User) */}
      <AssignRoleDialog
        open={assignRoleDialogOpen}
        onOpenChange={setAssignRoleDialogOpen}
        title={selectedUserForRole ? `Assign Role to ${selectedUserForRole.name}` : "Assign Role"}
        description="Select a role and scope for this user."
        roles={roles}
        companies={companiesList}
        groups={groupsList}
        onAssign={(roleId, scope, scopeId) => {
          if (selectedUserForRole) {
            handleAssignRole(selectedUserForRole.id, roleId, scope, scopeId);
          }
        }}
      />

      {/* Bulk Assign Role Dialog */}
      <AssignRoleDialog
        open={bulkAssignDialogOpen}
        onOpenChange={setBulkAssignDialogOpen}
        title={`Assign Role to ${selectedUsers.size} Users`}
        description="This will assign the selected role to all selected users."
        roles={roles}
        companies={companiesList}
        groups={groupsList}
        onAssign={handleBulkAssign}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
        companies={companiesList}
        groups={groupsList}
        onSubmit={async (data) => {
          try {
            await createUserByAdmin(data);
            toast.success("User created successfully");
            setCreateUserDialogOpen(false);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create user");
          }
        }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        onSubmit={(data) => handleUpdateUser({ userId: editingUser!._id, ...data })}
      />

      {/* Bulk Delete Dialog */}
      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        count={selectedUsers.size}
        onDelete={handleBulkDelete}
      />
    </div>
  );
}

function RoleBadge({
  role,
  onRevoke,
}: {
  role: {
    assignmentId?: Id<"userRoleAssignments">;
    roleId: string;
    roleName: string;
    scope: string;
    scopeName?: string;
  };
  onRevoke?: () => void;
}) {
  const colorClass = roleColors[role.roleId] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colorClass}`}>
      <span className="font-medium">{roleDisplayNames[role.roleId] || role.roleName}</span>
      {role.scope !== "global" && role.scopeName && (
        <span className="text-[10px] opacity-70">
          ({role.scopeName})
        </span>
      )}
      {onRevoke && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRevoke();
          }}
          className="ml-0.5 hover:opacity-70"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function AssignRoleDialog({
  open,
  onOpenChange,
  title,
  description,
  roles,
  companies,
  groups,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  roles?: { _id: string; id: string; name: string }[];
  companies?: { _id: Id<"companies">; name: string }[];
  groups?: { _id: Id<"groups">; name: string; companyId: Id<"companies"> }[];
  onAssign: (roleId: string, scope: "global" | "company" | "group", scopeId?: string) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedScope, setSelectedScope] = useState<"global" | "company" | "group">("global");
  const [selectedScopeId, setSelectedScopeId] = useState<string>("");

  const handleSubmit = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }
    if (selectedScope !== "global" && !selectedScopeId) {
      toast.error(`Please select a ${selectedScope}`);
      return;
    }
    onAssign(selectedRole, selectedScope, selectedScope !== "global" ? selectedScopeId : undefined);
    // Reset form
    setSelectedRole("");
    setSelectedScope("global");
    setSelectedScopeId("");
  };

  // Filter groups by company if company scope is selected
  const availableGroups = selectedScope === "group" && selectedScopeId
    ? groups?.filter((g) => g.companyId === selectedScopeId)
    : groups;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role._id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${roleColors[role.id]?.split(" ")[0] || "bg-gray-400"}`} />
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Scope</label>
            <Select
              value={selectedScope}
              onValueChange={(value: "global" | "company" | "group") => {
                setSelectedScope(value);
                setSelectedScopeId("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (All resources)</SelectItem>
                <SelectItem value="company">Company-specific</SelectItem>
                <SelectItem value="group">Group-specific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company Selection (for company or group scope) */}
          {(selectedScope === "company" || selectedScope === "group") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {selectedScope === "company" ? "Company" : "Company (for group)"}
              </label>
              <Select
                value={selectedScope === "company" ? selectedScopeId : (selectedScopeId ? groups?.find(g => g._id === selectedScopeId)?.companyId : "")}
                onValueChange={(value) => {
                  if (selectedScope === "company") {
                    setSelectedScopeId(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company._id} value={company._id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Group Selection */}
          {selectedScope === "group" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Group</label>
              <Select value={selectedScopeId} onValueChange={setSelectedScopeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Assign Role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  companies,
  groups,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies?: { _id: Id<"companies">; name: string }[];
  groups?: { _id: Id<"groups">; name: string; companyId: Id<"companies"> }[];
  onSubmit: (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    role?: "admin" | "student" | "guest";
    companyId?: Id<"companies">;
    groupId?: Id<"groups">;
    createStudentProfile?: boolean;
    studentConfig?: {
      nativeLanguage?: string;
      currentLevel?: string;
      learningGoal?: "career" | "travel" | "exam" | "personal" | "academic";
    };
  }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"admin" | "student" | "guest">("student");
  const [companyId, setCompanyId] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [createStudentProfile, setCreateStudentProfile] = useState(true);
  const [currentLevel, setCurrentLevel] = useState<string>("a1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter groups by selected company
  const filteredGroups = companyId
    ? groups?.filter((g) => g.companyId === companyId)
    : groups;

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("student");
    setCompanyId("");
    setGroupId("");
    setCreateStudentProfile(true);
    setCurrentLevel("a1");
  };

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role,
        companyId: companyId ? (companyId as Id<"companies">) : undefined,
        groupId: groupId ? (groupId as Id<"groups">) : undefined,
        createStudentProfile: role === "student" ? createStudentProfile : false,
        studentConfig:
          role === "student" && createStudentProfile
            ? {
                nativeLanguage: "de",
                currentLevel,
                learningGoal: "career" as const,
              }
            : undefined,
      });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a user manually. They will receive a &quot;pending&quot; status until
            they sign up via Clerk with this email address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="create-email">Email *</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-firstname">First Name</Label>
              <Input
                id="create-firstname"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-lastname">Last Name</Label>
              <Input
                id="create-lastname"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "student" | "guest")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company Assignment */}
          <div className="space-y-2">
            <Label>Company (Optional)</Label>
            <Select
              value={companyId || "_none"}
              onValueChange={(v) => {
                setCompanyId(v === "_none" ? "" : v);
                setGroupId(""); // Reset group when company changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="No company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No company</SelectItem>
                {companies?.map((company) => (
                  <SelectItem key={company._id} value={company._id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group Assignment */}
          {companyId && (
            <div className="space-y-2">
              <Label>Group (Optional)</Label>
              <Select
                value={groupId || "_none"}
                onValueChange={(v) => setGroupId(v === "_none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No group</SelectItem>
                  {filteredGroups?.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Student Profile Options */}
          {role === "student" && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Create Student Profile</Label>
                  <p className="text-xs text-muted-foreground">
                    Required to enroll in lessons
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={createStudentProfile}
                  onChange={(e) => setCreateStudentProfile(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>

              {createStudentProfile && (
                <div className="space-y-2">
                  <Label>Current Level</Label>
                  <Select value={currentLevel} onValueChange={setCurrentLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a1">A1 - Beginner</SelectItem>
                      <SelectItem value="a2">A2 - Elementary</SelectItem>
                      <SelectItem value="b1">B1 - Intermediate</SelectItem>
                      <SelectItem value="b2">B2 - Upper Intermediate</SelectItem>
                      <SelectItem value="c1">C1 - Advanced</SelectItem>
                      <SelectItem value="c2">C2 - Proficient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    _id: Id<"users">;
    email: string;
    firstName?: string;
    lastName?: string;
    role: "admin" | "moderator" | "student" | "guest";
    status: string;
  } | null;
  onSubmit: (data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: "admin" | "moderator" | "student" | "guest";
    status?: "active" | "suspended" | "banned" | "pending";
  }) => Promise<void>;
}) {
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [role, setRole] = useState<"admin" | "moderator" | "student" | "guest">(user?.role || "student");
  const [status, setStatus] = useState<"active" | "suspended" | "banned" | "pending">(
    (user?.status as "active" | "suspended" | "banned" | "pending") || "active"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when user changes
  useState(() => {
    if (user) {
      setEmail(user.email);
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setRole(user.role);
      setStatus(user.status as "active" | "suspended" | "banned" | "pending");
    }
  });

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role,
        status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstname">First Name</Label>
              <Input
                id="edit-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastname">Last Name</Label>
              <Input
                id="edit-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onDelete: (hardDelete: boolean) => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (hardDelete: boolean) => {
    setIsDeleting(true);
    try {
      await onDelete(hardDelete);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete {count} User{count !== 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription>
            Choose how you want to delete the selected users. This action affects {count} user{count !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Ban className="w-4 h-4 text-orange-500" />
              Deactivate (Soft Delete)
            </h4>
            <p className="text-sm text-muted-foreground">
              Sets user status to &quot;banned&quot; and deactivates their role assignments.
              User data is preserved and can be restored.
            </p>
            <Button
              variant="outline"
              className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => handleDelete(false)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Deactivate {count} User{count !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg border border-red-200 p-4 space-y-2 bg-red-50/50">
            <h4 className="font-medium flex items-center gap-2 text-red-700">
              <Trash2 className="w-4 h-4" />
              Permanent Delete
            </h4>
            <p className="text-sm text-red-600/80">
              Permanently removes users and all related data including student profiles,
              group memberships, and role assignments. This cannot be undone.
            </p>
            <Button
              variant="destructive"
              className="w-full mt-2"
              onClick={() => handleDelete(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Permanently Delete {count} User{count !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
