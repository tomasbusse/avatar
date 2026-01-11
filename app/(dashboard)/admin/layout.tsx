"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { title: "Overview", href: "/admin" },
  { title: "Users", href: "/admin/users" },
  { title: "Companies", href: "/admin/companies" },
  { title: "Groups", href: "/admin/groups" },
  { title: "Roles", href: "/admin/roles" },
  { title: "Avatars", href: "/admin/avatars" },
  { title: "Knowledge", href: "/admin/knowledge" },
  { title: "Lessons", href: "/admin/lessons" },
  { title: "Entry Tests", href: "/admin/entry-tests" },
  { title: "Tools", href: "/admin/tools" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = useQuery(api.users.isAdmin);
  const pathname = usePathname();

  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You need admin privileges to access this area.
          </p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-card">
        <div className="px-8 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <nav className="flex gap-4">
            {adminNavItems.map((item) => {
              // For tools and entry-tests, also highlight when on sub-routes
              const isActive = item.href === "/admin/tools"
                ? pathname.startsWith("/admin/tools")
                : item.href === "/admin/entry-tests"
                ? pathname.startsWith("/admin/entry-tests")
                : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
