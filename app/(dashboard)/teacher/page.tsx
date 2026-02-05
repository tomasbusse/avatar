"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Gamepad2,
  ClipboardCheck,
  Users,
  Bot,
  Plus,
  Loader2,
  ExternalLink,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function TeacherOverviewPage() {
  const profile = useQuery(api.teachers.getMyTeacherProfile);
  const stats = useQuery(api.teachers.getTeacherDashboardStats);
  const practices = useQuery(api.conversationPractice.list, { limit: 5 });

  if (profile === undefined || stats === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Teacher profile not found.
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Practices",
      value: stats.practicesCount,
      icon: MessageSquare,
      href: "/teacher/practice",
      color: "text-blue-500",
    },
    {
      title: "Games Created",
      value: stats.gamesCount,
      icon: Gamepad2,
      href: "/teacher/games",
      color: "text-green-500",
    },
    {
      title: "Entry Tests",
      value: stats.testsCount,
      icon: ClipboardCheck,
      href: "/teacher/entry-tests",
      color: "text-purple-500",
    },
    {
      title: "Total Sessions",
      value: stats.totalSessions,
      icon: Users,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              {stat.href && (
                <Link
                  href={stat.href}
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  View all
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Practices */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Practices</h2>
            <Button asChild size="sm">
              <Link href="/teacher/practice">
                <Plus className="w-4 h-4 mr-1" />
                New Practice
              </Link>
            </Button>
          </div>

          {!practices || practices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No practice sessions yet.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/teacher/practice">Create your first practice</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {practices.map((practice) => (
                <Card key={practice._id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{practice.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {practice.mode.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {practice.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {practice.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {practice.shareToken && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}/practice/join/${practice.shareToken}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Share link copied");
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/teacher/practice`}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Avatars */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Avatars</h2>
          {profile.avatars.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No avatars assigned yet.</p>
                <p className="text-xs mt-1">Contact an admin to assign avatars.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {profile.avatars.map((avatar) => (
                <Card key={avatar._id}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      {avatar.profileImage ? (
                        <img
                          src={avatar.profileImage}
                          alt={avatar.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{avatar.name}</p>
                        {avatar.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {avatar.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2 pt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/teacher/practice">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  New Practice Session
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/teacher/games">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Create Game
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/teacher/entry-tests">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  New Entry Test
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
