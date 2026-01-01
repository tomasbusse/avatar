"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, BookOpen, Activity } from "lucide-react";

export default function AdminPage() {
  const users = useQuery(api.users.listUsers, { paginationOpts: { numItems: 100 } });
  const avatars = useQuery(api.avatars.listActiveAvatars);

  const totalUsers = users?.users?.length ?? 0;
  const totalAvatars = avatars?.length ?? 0;
  const activeStudents = users?.users?.filter(u => u.role === "student").length ?? 0;
  const admins = users?.users?.filter(u => u.role === "admin").length ?? 0;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Manage users, avatars, and platform settings
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-500" />
                <span className="text-3xl font-bold">{totalUsers}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Avatars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Bot className="w-8 h-8 text-purple-500" />
                <span className="text-3xl font-bold">{totalAvatars}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-green-500" />
                <span className="text-3xl font-bold">{activeStudents}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-8 h-8 text-orange-500" />
                <span className="text-3xl font-bold">{admins}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction
                href="/admin/users"
                title="Manage Users"
                description="View, edit roles, and manage user accounts"
              />
              <QuickAction
                href="/admin/avatars"
                title="Configure Avatars"
                description="Create, edit, and test AI teaching avatars"
              />
              <QuickAction
                href="/admin/knowledge"
                title="Manage Knowledge"
                description="Create knowledge bases and upload content for RAG"
              />
              <QuickAction
                href="/admin/lessons"
                title="Structured Lessons"
                description="Create shareable lesson links with pre-loaded content"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users?.users?.slice(0, 5).map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === "admin" 
                        ? "bg-orange-100 text-orange-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="block p-4 rounded-lg border hover:bg-muted transition-colors"
    >
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </a>
  );
}
