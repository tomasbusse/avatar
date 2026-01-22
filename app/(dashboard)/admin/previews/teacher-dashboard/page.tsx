"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Eye,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  Calendar,
  MoreVertical,
  Play,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

// Sample data for teacher view
const sampleStudents = [
  {
    id: "student-1",
    name: "Maria Schmidt",
    email: "maria.schmidt@example.com",
    level: "B1",
    progress: 72,
    lastActive: "2 hours ago",
    lessonsCompleted: 8,
    streak: 5,
    status: "active",
  },
  {
    id: "student-2",
    name: "Hans Weber",
    email: "hans.weber@example.com",
    level: "A2",
    progress: 45,
    lastActive: "1 day ago",
    lessonsCompleted: 4,
    streak: 0,
    status: "inactive",
  },
  {
    id: "student-3",
    name: "Anna Müller",
    email: "anna.mueller@example.com",
    level: "B2",
    progress: 89,
    lastActive: "30 minutes ago",
    lessonsCompleted: 15,
    streak: 12,
    status: "active",
  },
  {
    id: "student-4",
    name: "Peter Braun",
    email: "peter.braun@example.com",
    level: "B1",
    progress: 34,
    lastActive: "3 days ago",
    lessonsCompleted: 3,
    streak: 0,
    status: "needs_attention",
  },
];

const sampleLessons = [
  {
    id: "lesson-1",
    title: "Present Perfect Tense",
    level: "B1",
    enrolledStudents: 12,
    completionRate: 65,
    averageScore: 78,
    status: "active",
  },
  {
    id: "lesson-2",
    title: "Business Email Writing",
    level: "B2",
    enrolledStudents: 8,
    completionRate: 42,
    averageScore: 82,
    status: "active",
  },
  {
    id: "lesson-3",
    title: "Common Phrasal Verbs",
    level: "B1",
    enrolledStudents: 15,
    completionRate: 88,
    averageScore: 75,
    status: "completed",
  },
];

const sampleUpcomingSessions = [
  {
    id: "session-1",
    studentName: "Maria Schmidt",
    lessonTitle: "Present Perfect Practice",
    scheduledFor: "Today, 3:00 PM",
    type: "1-on-1",
  },
  {
    id: "session-2",
    studentName: "Group Session",
    lessonTitle: "Business Communication",
    scheduledFor: "Tomorrow, 10:00 AM",
    type: "group",
  },
];

export default function TeacherDashboardPreview() {
  return (
    <div className="min-h-full bg-background">
      {/* Admin Preview Banner */}
      <div className="bg-purple-50 border-b border-purple-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Admin Preview Mode - Teacher Dashboard
            </span>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Sample Data
            </Badge>
          </div>
          <Link href="/admin/previews">
            <Button variant="ghost" size="sm" className="text-purple-800 hover:text-purple-900">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Exit Preview
            </Button>
          </Link>
        </div>
      </div>

      {/* Teacher Dashboard Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Teacher Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, Dr. Sarah Johnson
              </p>
            </div>
            <Button>
              <Play className="w-4 h-4 mr-2" />
              Start New Session
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-xs text-muted-foreground">Active Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-xs text-muted-foreground">Active Lessons</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">76%</p>
                    <p className="text-xs text-muted-foreground">Avg. Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12h</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Students Section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      My Students
                    </CardTitle>
                    <CardDescription>
                      Monitor student progress and activity
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sampleStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {student.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{student.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {student.level}
                            </Badge>
                            {student.status === "needs_attention" && (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Last active: {student.lastActive}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{student.progress}%</p>
                          <Progress value={student.progress} className="w-20 h-1.5" />
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    Upcoming Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sampleUpcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{session.studentName}</p>
                        <Badge variant="outline" className="text-xs">
                          {session.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {session.lessonTitle}
                      </p>
                      <p className="text-xs font-medium text-primary">
                        {session.scheduledFor}
                      </p>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" size="sm">
                    View Calendar
                  </Button>
                </CardContent>
              </Card>

              {/* Lessons Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5" />
                    My Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sampleLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{lesson.title}</p>
                        {lesson.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {lesson.level}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {lesson.enrolledStudents} students
                        </span>
                        <span>{lesson.completionRate}% complete</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" size="sm">
                    Manage Lessons
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
