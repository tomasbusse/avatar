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
  Shield,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  Layers,
  BookOpen,
  UserPlus,
  BarChart3,
  Bot,
  Play,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  company_admin: "bg-orange-100 text-orange-800 border-orange-200",
  teacher: "bg-blue-100 text-blue-800 border-blue-200",
  group_lead: "bg-purple-100 text-purple-800 border-purple-200",
  student: "bg-green-100 text-green-800 border-green-200",
  guest: "bg-gray-100 text-gray-800 border-gray-200",
};

const categoryIcons: Record<string, React.ReactNode> = {
  users: <Users className="w-4 h-4" />,
  companies: <Building2 className="w-4 h-4" />,
  groups: <Layers className="w-4 h-4" />,
  content: <BookOpen className="w-4 h-4" />,
  enrollments: <UserPlus className="w-4 h-4" />,
  analytics: <BarChart3 className="w-4 h-4" />,
  avatars: <Bot className="w-4 h-4" />,
  sessions: <Play className="w-4 h-4" />,
};

export default function RolesPage() {
  const roles = useQuery(api.rbac.listAllRoles, {});
  const permissions = useQuery(api.rbac.listPermissions, {});
  const auditLog = useQuery(api.rbac.listAuditLog, { limit: 20 });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{
    _id: Id<"roles">;
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    inheritsFrom?: string;
    type: "system" | "company_custom";
  } | null>(null);

  const createRole = useMutation(api.rbac.createRole);
  const updateRole = useMutation(api.rbac.updateRole);
  const deleteRole = useMutation(api.rbac.deleteRole);

  // Group permissions by category
  const permissionsByCategory = permissions?.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const handleCreateRole = async (data: {
    id?: string;
    name: string;
    description?: string;
    permissions: string[];
    inheritsFrom?: string;
  }) => {
    if (!data.id) {
      toast.error("Role ID is required");
      return;
    }
    try {
      await createRole({ ...data, id: data.id });
      toast.success("Role created successfully");
      setCreateDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create role");
    }
  };

  const handleUpdateRole = async (data: {
    roleId: Id<"roles">;
    name?: string;
    description?: string;
    permissions?: string[];
    inheritsFrom?: string;
  }) => {
    try {
      await updateRole(data);
      toast.success("Role updated successfully");
      setEditingRole(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  };

  const handleDeleteRole = async (roleId: Id<"roles">) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteRole({ roleId });
      toast.success("Role deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete role");
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Role Management</h1>
            <p className="text-muted-foreground">
              Manage roles and their permissions
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">System Roles</h2>
            {roles?.map((role) => (
              <RoleCard
                key={role._id}
                role={role}
                permissionsByCategory={permissionsByCategory}
                onEdit={() => setEditingRole(role as typeof editingRole)}
                onDelete={() => handleDeleteRole(role._id)}
              />
            ))}
          </div>

          {/* Audit Log */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="border rounded-lg">
              {auditLog?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-auto">
                  {auditLog?.map((log) => (
                    <div key={log._id} className="p-3">
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            log.action === "role_assigned"
                              ? "bg-green-500"
                              : log.action === "role_revoked"
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{log.userName}</span>
                            {" "}
                            {log.action === "role_assigned"
                              ? "was assigned"
                              : log.action === "role_revoked"
                              ? "was revoked from"
                              : "bulk update for"}{" "}
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleColors[log.roleId] || "bg-gray-100"}`}>
                              {log.roleName}
                            </span>
                            {log.scopeName && (
                              <>
                                {" "}in{" "}
                                <span className="font-medium">{log.scopeName}</span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.performedByName && (
                              <>by {log.performedByName} • </>
                            )}
                            {new Date(log.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Permission Reference */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Permission Reference</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {permissionsByCategory &&
              Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {categoryIcons[category] || <Shield className="w-4 h-4" />}
                    <h3 className="font-medium capitalize">{category}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {perms?.length} permissions
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {perms?.map((perm) => (
                      <li
                        key={perm._id}
                        className="text-muted-foreground truncate"
                        title={perm.description}
                      >
                        {perm.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Create Role Dialog */}
      <RoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create New Role"
        permissions={permissions}
        permissionsByCategory={permissionsByCategory}
        roles={roles}
        onSubmit={handleCreateRole}
      />

      {/* Edit Role Dialog */}
      <RoleDialog
        open={!!editingRole}
        onOpenChange={(open) => !open && setEditingRole(null)}
        title={`Edit Role: ${editingRole?.name}`}
        role={editingRole}
        permissions={permissions}
        permissionsByCategory={permissionsByCategory}
        roles={roles}
        onSubmit={(data) => handleUpdateRole({ roleId: editingRole!._id, ...data })}
      />
    </div>
  );
}

function RoleCard({
  role,
  permissionsByCategory,
  onEdit,
  onDelete,
}: {
  role: {
    _id: string;
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    inheritsFrom?: string;
    type: "system" | "company_custom";
  };
  permissionsByCategory?: Record<string, { key: string; name: string; description: string }[]>;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Count permissions by category
  const permissionCounts: Record<string, number> = {};
  if (permissionsByCategory) {
    for (const [category, perms] of Object.entries(permissionsByCategory)) {
      const count = perms?.filter((p) =>
        role.permissions.includes(p.key) || role.permissions.includes("*")
      ).length;
      if (count && count > 0) {
        permissionCounts[category] = count;
      }
    }
  }

  const totalPermissions = role.permissions.includes("*")
    ? "All"
    : role.permissions.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  roleColors[role.id] || "bg-gray-100"
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">{role.name}</div>
                <div className="text-sm text-muted-foreground">
                  {role.description || `${role.id} role`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">
                  {totalPermissions} permissions
                </div>
                {role.inheritsFrom && (
                  <div className="text-xs text-muted-foreground">
                    Inherits from {role.inheritsFrom}
                  </div>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t">
            {role.permissions.includes("*") ? (
              <div className="text-center py-4">
                <Shield className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="font-medium">Full Access</p>
                <p className="text-sm text-muted-foreground">
                  This role has all permissions (wildcard)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(permissionCounts).map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50"
                  >
                    {categoryIcons[category] || <Shield className="w-4 h-4" />}
                    <span className="capitalize">{category}</span>
                    <span className="ml-auto text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {role.permissions.length > 0 && !role.permissions.includes("*") && (
              <details className="mt-4">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  View all {role.permissions.length} permissions
                </summary>
                <div className="mt-2 flex flex-wrap gap-1">
                  {role.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 bg-muted rounded text-xs"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {role.type === "system" ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">System Role</span>
                ) : (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Custom Role</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                {role.type !== "system" && (
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={onDelete}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Role Create/Edit Dialog
function RoleDialog({
  open,
  onOpenChange,
  title,
  role,
  permissions,
  permissionsByCategory,
  roles,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  role?: {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    inheritsFrom?: string;
    type: "system" | "company_custom";
  } | null;
  permissions?: { _id: string; key: string; name: string; description: string; category: string }[];
  permissionsByCategory?: Record<string, { key: string; name: string; description: string }[]>;
  roles?: { id: string; name: string }[];
  onSubmit: (data: {
    id?: string;
    name: string;
    description?: string;
    permissions: string[];
    inheritsFrom?: string;
  }) => Promise<void>;
}) {
  const [id, setId] = useState(role?.id || "");
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role?.permissions || [])
  );
  const [inheritsFrom, setInheritsFrom] = useState(role?.inheritsFrom || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!role;
  const isSystemRole = role?.type === "system";

  // Reset form when role changes
  useState(() => {
    if (role) {
      setId(role.id);
      setName(role.name);
      setDescription(role.description || "");
      setSelectedPermissions(new Set(role.permissions));
      setInheritsFrom(role.inheritsFrom || "");
    } else {
      setId("");
      setName("");
      setDescription("");
      setSelectedPermissions(new Set());
      setInheritsFrom("");
    }
  });

  const togglePermission = (key: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedPermissions(newSet);
  };

  const toggleCategory = (category: string) => {
    const categoryPerms = permissionsByCategory?.[category] || [];
    const allSelected = categoryPerms.every((p) => selectedPermissions.has(p.key));
    const newSet = new Set(selectedPermissions);
    categoryPerms.forEach((p) => {
      if (allSelected) {
        newSet.delete(p.key);
      } else {
        newSet.add(p.key);
      }
    });
    setSelectedPermissions(newSet);
  };

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (!isEditing && !id) {
      toast.error("Role ID is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...(isEditing ? {} : { id }),
        name,
        description: description || undefined,
        permissions: Array.from(selectedPermissions),
        inheritsFrom: inheritsFrom || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? isSystemRole
                ? "You can edit name and description of system roles, but not their permissions."
                : "Update role name, description, and permissions."
              : "Create a new custom role with specific permissions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role ID (only for new roles) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="role-id">Role ID *</Label>
              <Input
                id="role-id"
                placeholder="e.g., content_manager"
                value={id}
                onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this role (lowercase, underscores)
              </p>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="role-name">Name *</Label>
            <Input
              id="role-name"
              placeholder="Content Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              placeholder="Manages content and courses..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Inherits From */}
          <div className="space-y-2">
            <Label>Inherits From</Label>
            <Select
              value={inheritsFrom || "_none"}
              onValueChange={(v) => setInheritsFrom(v === "_none" ? "" : v)}
              disabled={isSystemRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="No inheritance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No inheritance</SelectItem>
                {roles
                  ?.filter((r) => r.id !== role?.id)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          {!isSystemRole && (
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {permissionsByCategory &&
                  Object.entries(permissionsByCategory).map(([category, perms]) => {
                    const categorySelected = perms?.filter((p) =>
                      selectedPermissions.has(p.key)
                    ).length;
                    const allSelected = categorySelected === perms?.length;

                    return (
                      <div key={category} className="border-b last:border-b-0">
                        <div
                          className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleCategory(category)}
                        >
                          <Checkbox checked={allSelected} />
                          <span className="font-medium capitalize">{category}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {categorySelected}/{perms?.length}
                          </span>
                        </div>
                        <div className="px-3 py-2 space-y-1">
                          {perms?.map((perm) => (
                            <div
                              key={perm.key}
                              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/30 px-2 rounded"
                              onClick={() => togglePermission(perm.key)}
                            >
                              <Checkbox checked={selectedPermissions.has(perm.key)} />
                              <div className="flex-1">
                                <div className="text-sm">{perm.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {perm.description}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPermissions.size} permissions selected
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
