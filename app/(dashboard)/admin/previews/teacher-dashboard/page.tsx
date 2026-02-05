"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Gamepad2,
  ClipboardCheck,
  Users,
  Bot,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Clock,
  GraduationCap,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getGameTypeDisplayName,
  getGameTypeIcon,
} from "@/types/word-games";

// ============================================
// SAMPLE DATA
// ============================================

const sampleProfile = {
  user: {
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@school.de",
    imageUrl: null,
  },
  company: { name: "Berlitz Language School", slug: "berlitz" },
  avatars: [
    { _id: "av-1", name: "Emma", slug: "emma", profileImage: null, description: "Friendly English teacher, B1-B2 focused" },
    { _id: "av-2", name: "James", slug: "james", profileImage: null, description: "Business English specialist" },
    { _id: "av-3", name: "Sophia", slug: "sophia", profileImage: null, description: "Cambridge exam preparation" },
  ],
};

const sampleStats = {
  practicesCount: 12,
  gamesCount: 8,
  testsCount: 3,
  totalSessions: 47,
  avatarsCount: 3,
};

const samplePractices = [
  {
    _id: "p-1",
    title: "Business Meeting Roleplay",
    description: "Practice professional meeting vocabulary and etiquette",
    mode: "topic_guided",
    avatarName: "Emma",
    shareToken: "abc12345",
    totalSessions: 15,
    isPublic: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    _id: "p-2",
    title: "Team Meeting Transcript Review",
    description: "Review and discuss vocabulary from the Siemens Q4 meeting",
    mode: "transcript_based",
    avatarName: "James",
    shareToken: "def67890",
    totalSessions: 8,
    isPublic: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    _id: "p-3",
    title: "Free Conversation - Daily Life",
    description: null,
    mode: "free_conversation",
    avatarName: "Emma",
    shareToken: "ghi11223",
    totalSessions: 24,
    isPublic: false,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    _id: "p-4",
    title: "Job Interview Preparation",
    description: "Practice common interview questions and confident answers",
    mode: "topic_guided",
    avatarName: "Sophia",
    shareToken: "jkl44556",
    totalSessions: 0,
    isPublic: true,
    createdAt: Date.now() - 86400000 * 1,
  },
];

const sampleGames = [
  {
    _id: "g-1",
    title: "Business Phrasal Verbs",
    type: "matching_pairs" as const,
    level: "B2" as const,
    category: "vocabulary" as const,
    status: "published" as const,
    slug: "business-phrasal-verbs",
    stats: { totalPlays: 34, completionRate: 78, averageStars: 2.4, averageTimeSeconds: 120 },
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    _id: "g-2",
    title: "Present Perfect vs Past Simple",
    type: "fill_in_blank" as const,
    level: "B1" as const,
    category: "grammar" as const,
    status: "published" as const,
    slug: "present-perfect-past-simple",
    stats: { totalPlays: 51, completionRate: 65, averageStars: 2.1, averageTimeSeconds: 180 },
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    _id: "g-3",
    title: "Medical English Vocabulary",
    type: "flashcards" as const,
    level: "C1" as const,
    category: "vocabulary" as const,
    status: "draft" as const,
    slug: "medical-english-vocab",
    stats: undefined,
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    _id: "g-4",
    title: "Email Sentence Builder",
    type: "sentence_builder" as const,
    level: "B1" as const,
    category: "grammar" as const,
    status: "published" as const,
    slug: "email-sentence-builder",
    stats: { totalPlays: 22, completionRate: 88, averageStars: 2.8, averageTimeSeconds: 95 },
    createdAt: Date.now() - 86400000 * 14,
  },
];

const sampleTests = [
  {
    _id: "t-1",
    title: "Berlitz B2 Placement Test",
    slug: "berlitz-b2-placement",
    companyName: "Berlitz Language School",
    status: "published" as const,
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    _id: "t-2",
    title: "General English Level Check",
    slug: "general-english-check",
    companyName: null,
    status: "published" as const,
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    _id: "t-3",
    title: "Siemens Technical English Assessment",
    slug: "siemens-tech-english",
    companyName: "Siemens AG",
    status: "draft" as const,
    createdAt: Date.now() - 86400000 * 2,
  },
];

const levelColors: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-lime-100 text-lime-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-orange-100 text-orange-800",
  C1: "bg-red-100 text-red-800",
  C2: "bg-purple-100 text-purple-800",
};

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

// ============================================
// TAB CONTENT COMPONENTS
// ============================================

function OverviewTab() {
  const statCards = [
    { title: "Active Practices", value: sampleStats.practicesCount, icon: MessageSquare, href: "#", color: "text-blue-500" },
    { title: "Games Created", value: sampleStats.gamesCount, icon: Gamepad2, href: "#", color: "text-green-500" },
    { title: "Entry Tests", value: sampleStats.testsCount, icon: ClipboardCheck, href: "#", color: "text-purple-500" },
    { title: "Total Sessions", value: sampleStats.totalSessions, icon: Users, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-8">
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
                <span className="text-xs text-primary hover:underline mt-2 inline-block cursor-pointer">
                  View all
                </span>
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
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Practice
            </Button>
          </div>
          <div className="space-y-3">
            {samplePractices.slice(0, 4).map((practice) => (
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
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Assigned Avatars + Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Avatars</h2>
          <div className="space-y-3">
            {sampleProfile.avatars.map((avatar) => (
              <Card key={avatar._id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{avatar.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {avatar.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2 pt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                New Practice Session
              </Button>
              <Button variant="outline" className="justify-start">
                <Gamepad2 className="w-4 h-4 mr-2" />
                Create Game
              </Button>
              <Button variant="outline" className="justify-start">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                New Entry Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PracticeTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Practice Sessions</h2>
          <p className="text-muted-foreground">
            Create and manage conversation practice sessions for your students.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Practice
        </Button>
      </div>

      <div className="grid gap-4">
        {samplePractices.map((practice) => (
          <Card key={practice._id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{practice.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {practice.mode.replace(/_/g, " ")}
                    </Badge>
                    {practice.isPublic && (
                      <Badge variant="outline" className="text-xs">Public</Badge>
                    )}
                  </div>
                  {practice.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {practice.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      {practice.avatarName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(practice.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {practice.totalSessions} sessions
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button variant="ghost" size="sm" title="Copy share link">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Open">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GamesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Games</h2>
          <p className="text-muted-foreground">
            Manage your word games and interactive exercises.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Game
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        <Badge variant="outline" className="cursor-pointer hover:bg-muted px-3 py-1">All types</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted px-3 py-1">All levels</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted px-3 py-1">All statuses</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleGames.map((game) => (
          <Card key={game._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getGameTypeIcon(game.type)}</span>
                  <div>
                    <CardTitle className="text-lg">{game.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {getGameTypeDisplayName(game.type)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[game.level]}`}>
                    {game.level}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[game.status]}`}>
                    {game.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {game.stats && game.stats.totalPlays > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                  <div className="bg-muted rounded p-2">
                    <div className="font-semibold">{game.stats.totalPlays}</div>
                    <div className="text-xs text-muted-foreground">Plays</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="font-semibold">{game.stats.completionRate}%</div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="font-semibold">{game.stats.averageStars.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Avg Stars</div>
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mb-3">
                Created {new Date(game.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {game.status === "draft" && (
                  <Button variant="outline" size="sm">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Publish
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EntryTestsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entry Tests</h2>
          <p className="text-muted-foreground">
            Create and manage placement tests for your students.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Entry Test
        </Button>
      </div>

      <div className="flex gap-2">
        <Badge variant="outline" className="cursor-pointer hover:bg-muted px-3 py-1">All statuses</Badge>
      </div>

      <div className="grid gap-4">
        {sampleTests.map((test) => (
          <Card key={test._id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{test.title}</h3>
                    <Badge
                      variant={test.status === "published" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {test.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>/{test.slug}</span>
                    {test.companyName && <span>{test.companyName}</span>}
                    <span>Created {new Date(test.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button variant="ghost" size="sm" title="Preview">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Copy link">
                    <Copy className="w-4 h-4" />
                  </Button>
                  {test.status === "draft" && (
                    <Button variant="ghost" size="sm" title="Publish">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PREVIEW PAGE
// ============================================

const teacherNavItems = [
  { title: "Overview", key: "overview" },
  { title: "Practice", key: "practice" },
  { title: "Games", key: "games" },
  { title: "Entry Tests", key: "entry-tests" },
];

export default function TeacherDashboardPreview() {
  const [activeTab, setActiveTab] = useState("overview");

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

      {/* Teacher Panel Header + Tabs (mirrors actual layout) */}
      <div className="border-b bg-card">
        <div className="px-8 py-4">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Teacher Panel</h1>
            <span className="text-sm text-muted-foreground ml-2">
              — {sampleProfile.user.firstName} {sampleProfile.user.lastName}
              {sampleProfile.company && (
                <span className="ml-1">({sampleProfile.company.name})</span>
              )}
            </span>
          </div>
          <nav className="flex gap-4">
            {teacherNavItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  activeTab === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "practice" && <PracticeTab />}
        {activeTab === "games" && <GamesTab />}
        {activeTab === "entry-tests" && <EntryTestsTab />}
      </div>
    </div>
  );
}
