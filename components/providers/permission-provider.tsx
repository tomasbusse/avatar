"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PermissionContextType {
  permissions: string[];
  roles: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  legacyRole?: string;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const result = useQuery(api.rbac.getMyPermissions);

  const permissions = result?.permissions ?? [];
  const roles = result?.roles ?? [];
  const isLoading = result === undefined;
  const isAuthenticated = result?.isAuthenticated ?? false;
  const legacyRole = result?.legacyRole;

  const hasPermission = (permission: string) =>
    permissions.includes(permission) || permissions.includes("*");

  const hasAnyPermission = (perms: string[]) =>
    perms.some((p) => hasPermission(p));

  const hasAllPermissions = (perms: string[]) =>
    perms.every((p) => hasPermission(p));

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        roles,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isLoading,
        isAuthenticated,
        legacyRole,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
};

/**
 * Hook to check if user has a specific permission.
 * Returns { allowed: boolean, isLoading: boolean }
 */
export const useHasPermission = (permission: string) => {
  const { hasPermission, isLoading } = usePermissions();
  return { allowed: hasPermission(permission), isLoading };
};

/**
 * Component that only renders children if user has required permission.
 */
export function ProtectedComponent({
  permission,
  children,
  fallback = null,
}: {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) return null;

  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Component that renders when user has any admin role.
 * Uses legacy role check for backwards compatibility.
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { roles, legacyRole, isLoading } = usePermissions();

  if (isLoading) return null;

  // Check both new RBAC roles and legacy role for backwards compatibility
  const isAdmin =
    roles.includes("Super Admin") ||
    roles.includes("Company Admin") ||
    legacyRole === "admin";

  if (!isAdmin) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Component that renders when user has teacher or higher role.
 */
export function TeacherOrAbove({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { roles, legacyRole, isLoading } = usePermissions();

  if (isLoading) return null;

  const allowed =
    roles.includes("Super Admin") ||
    roles.includes("Company Admin") ||
    roles.includes("Teacher / Content Creator") ||
    legacyRole === "admin" ||
    legacyRole === "moderator";

  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}
