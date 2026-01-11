"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Bot,
  BookOpen,
  Activity,
  Trash2,
  Loader2,
  AlertTriangle,
  Radio,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface LiveKitRoom {
  name: string;
  sid: string;
  numParticipants: number;
  creationTime: number | null;
}

export default function AdminPage() {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<{ count: number; oldest: string | null } | null>(null);
  const [liveKitRooms, setLiveKitRooms] = useState<LiveKitRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);

  const users = useQuery(api.users.listUsers, { paginationOpts: { numItems: 100 } });
  const avatars = useQuery(api.avatars.listActiveAvatars);
  const activeSessions = useQuery(api.sessions.getAllActiveSessions);
  const cleanupSessions = useMutation(api.sessions.cleanupStaleSessions);
  const forceEndSession = useMutation(api.sessions.forceEndSession);

  // Fetch LiveKit rooms
  const fetchLiveKitRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch("/api/livekit/rooms");
      if (res.ok) {
        const data = await res.json();
        setLiveKitRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Failed to fetch LiveKit rooms:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Fetch rooms on mount and every 30 seconds
  useEffect(() => {
    fetchLiveKitRooms();
    const interval = setInterval(fetchLiveKitRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  // Force end a session
  const handleForceEndSession = async (sessionId: string, roomName: string) => {
    setEndingSessionId(sessionId);
    try {
      // End in Convex
      await forceEndSession({ sessionId: sessionId as Id<"sessions">, reason: "admin_force_end" });

      // Delete LiveKit room
      await fetch("/api/livekit/rooms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName }),
      });

      toast.success(`Session ended: ${roomName}`);
      fetchLiveKitRooms(); // Refresh room list
    } catch (error: any) {
      toast.error(error.message || "Failed to end session");
    } finally {
      setEndingSessionId(null);
    }
  };

  // Delete orphaned LiveKit room (no matching Convex session)
  const handleDeleteOrphanedRoom = async (roomName: string) => {
    try {
      await fetch("/api/livekit/rooms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName }),
      });
      toast.success(`Room deleted: ${roomName}`);
      fetchLiveKitRooms();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete room");
    }
  };

  const handlePreviewCleanup = async () => {
    try {
      const result = await cleanupSessions({ dryRun: true, maxAgeHours: 24 });
      setCleanupPreview({
        count: result.staleSessionCount ?? 0,
        oldest: result.oldestSession ?? null,
      });
    } catch (error) {
      toast.error("Failed to check stale sessions");
    }
  };

  const handleCleanupSessions = async () => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupSessions({ maxAgeHours: 24 });
      toast.success(result.message);
      setCleanupPreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cleanup failed");
    } finally {
      setIsCleaningUp(false);
    }
  };

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

        {/* System Maintenance */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              System Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Clean up orphaned sessions that weren&apos;t properly closed.
                  A cron job runs daily at 6am UTC, but you can trigger it manually here.
                </p>
                {cleanupPreview && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-sm">
                    <span className="font-medium text-amber-800 dark:text-amber-200">
                      {cleanupPreview.count} stale session(s) found
                    </span>
                    {cleanupPreview.oldest && (
                      <span className="text-amber-600 dark:text-amber-400 ml-2">
                        (oldest: {new Date(cleanupPreview.oldest).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewCleanup}
                  disabled={isCleaningUp}
                >
                  Check
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCleanupSessions}
                  disabled={isCleaningUp || (cleanupPreview?.count === 0)}
                >
                  {isCleaningUp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Cleanup Sessions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions - LiveKit Rooms */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-green-500" />
                Active Sessions
                {(activeSessions?.length || 0) > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {activeSessions?.length} active
                  </Badge>
                )}
                {liveKitRooms.length > 0 && (
                  <Badge variant="outline" className="ml-1">
                    {liveKitRooms.length} LiveKit rooms
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchLiveKitRooms}
                disabled={isLoadingRooms}
              >
                {isLoadingRooms ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Convex Sessions */}
            {activeSessions && activeSessions.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">
                  Sessions in Database
                </p>
                {activeSessions.map((session) => {
                  const lkRoom = liveKitRooms.find((r) => r.name === session.roomName);
                  return (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs truncate">
                            {session.roomName}
                          </span>
                          <Badge
                            variant={session.status === "active" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {session.status}
                          </Badge>
                          {lkRoom && (
                            <Badge variant="outline" className="text-[10px] text-green-600">
                              LiveKit: {lkRoom.numParticipants} users
                            </Badge>
                          )}
                          {!lkRoom && (
                            <Badge variant="outline" className="text-[10px] text-amber-600">
                              No LiveKit room
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{session.studentName}</span>
                          <span>|</span>
                          <span>{session.avatarName}</span>
                          {session.lessonTitle && (
                            <>
                              <span>|</span>
                              <span className="truncate max-w-40">{session.lessonTitle}</span>
                            </>
                          )}
                          <span>|</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.durationMinutes} min
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleForceEndSession(session._id, session.roomName)}
                        disabled={endingSessionId === session._id}
                        className="ml-2"
                      >
                        {endingSessionId === session._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                No active sessions in database
              </p>
            )}

            {/* Orphaned LiveKit Rooms */}
            {(() => {
              const orphanedRooms = liveKitRooms.filter(
                (room) => !activeSessions?.some((s) => s.roomName === room.name)
              );
              if (orphanedRooms.length === 0) return null;

              return (
                <div className="border-t pt-4">
                  <p className="text-xs text-amber-600 font-medium mb-2">
                    Orphaned LiveKit Rooms (no matching session)
                  </p>
                  <div className="space-y-2">
                    {orphanedRooms.map((room) => (
                      <div
                        key={room.sid}
                        className="flex items-center justify-between p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                      >
                        <div>
                          <span className="font-mono text-xs">{room.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({room.numParticipants} participants)
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOrphanedRoom(room.name)}
                          className="text-amber-700 border-amber-300 hover:bg-amber-100"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete Room
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

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
              <QuickAction
                href="/admin/practice"
                title="Conversation Practice"
                description="Create shareable practice sessions for speaking practice"
              />
              <QuickAction
                href="/admin/tools"
                title="Tools"
                description="Word games, PDF worksheets, and assessment tools"
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
