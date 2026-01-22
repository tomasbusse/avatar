"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import {
  StatsRow,
  ContinueLearningCard,
  TalkToAvatarCard,
  LessonsSection,
  GamesSection,
} from "@/components/dashboard";

// Sample data for the preview
const sampleEnrollments = [
  {
    _id: "sample-enrollment-1",
    status: "in_progress",
    progress: 65,
    dueDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
    lesson: {
      _id: "sample-lesson-1",
      title: "Present Perfect Tense",
      description: "Learn when and how to use the present perfect tense in everyday conversations.",
      shareToken: "demo-token-1",
      sessionType: "structured_lesson",
    },
    avatar: {
      _id: "sample-avatar-1",
      name: "Emma",
    },
  },
  {
    _id: "sample-enrollment-2",
    status: "enrolled",
    progress: 0,
    dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week from now
    lesson: {
      _id: "sample-lesson-2",
      title: "Business Email Writing",
      description: "Master professional email communication for the workplace.",
      shareToken: "demo-token-2",
      sessionType: "structured_lesson",
    },
    avatar: null,
  },
  {
    _id: "sample-enrollment-3",
    status: "completed",
    progress: 100,
    lesson: {
      _id: "sample-lesson-3",
      title: "Common Phrasal Verbs",
      description: "Essential phrasal verbs for everyday English.",
      shareToken: "demo-token-3",
      sessionType: "structured_lesson",
    },
    avatar: null,
  },
  {
    _id: "sample-enrollment-4",
    status: "enrolled",
    progress: 0,
    lesson: {
      _id: "sample-lesson-4",
      title: "Conditional Sentences",
      description: "Understanding if-clauses and their different forms.",
      shareToken: "demo-token-4",
      sessionType: "structured_lesson",
    },
    avatar: null,
  },
];

const sampleGames = [
  {
    _id: "sample-game-1",
    title: "Present Perfect Practice",
    slug: "present-perfect-practice",
    type: "fill_in_blank",
    level: "B1",
    category: "grammar",
    description: "Fill in the blanks with the correct form",
    bestStars: null,
    bestScore: null,
    timesPlayed: 0,
    lessonTitle: "Present Perfect Tense",
  },
  {
    _id: "sample-game-2",
    title: "Phrasal Verb Matching",
    slug: "phrasal-verb-matching",
    type: "matching_pairs",
    level: "B1",
    category: "vocabulary",
    description: "Match phrasal verbs with their meanings",
    bestStars: 3,
    bestScore: 95,
    timesPlayed: 2,
    lessonTitle: "Common Phrasal Verbs",
  },
  {
    _id: "sample-game-3",
    title: "Email Vocabulary Builder",
    slug: "email-vocabulary",
    type: "vocabulary_matching",
    level: "B2",
    category: "vocabulary",
    description: "Learn professional email vocabulary",
    bestStars: 2,
    bestScore: 78,
    timesPlayed: 1,
    lessonTitle: "Business Email Writing",
  },
  {
    _id: "sample-game-4",
    title: "Sentence Builder Challenge",
    slug: "sentence-builder",
    type: "sentence_builder",
    level: "B1",
    category: "grammar",
    description: "Build correct sentences from word blocks",
    bestStars: null,
    bestScore: null,
    timesPlayed: 0,
    lessonTitle: "Conditional Sentences",
  },
];

const sampleMostRecentEnrollment = {
  _id: "sample-enrollment-1",
  status: "in_progress",
  progress: 65,
  lesson: {
    _id: "sample-lesson-1",
    title: "Present Perfect Tense",
    description: "Learn when and how to use the present perfect tense in everyday conversations.",
    shareToken: "demo-token-1",
    sessionType: "structured_lesson",
  },
};

export default function StudentDashboardPreview() {
  return (
    <div className="min-h-full bg-background">
      {/* Admin Preview Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Admin Preview Mode - Student Dashboard
            </span>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              Sample Data
            </Badge>
          </div>
          <Link href="/admin/previews">
            <Button variant="ghost" size="sm" className="text-amber-800 hover:text-amber-900">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Exit Preview
            </Button>
          </Link>
        </div>
      </div>

      {/* Student Dashboard Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, Thomas!
            </h1>
            <p className="text-muted-foreground">
              Ready to practice your English today?
            </p>
          </div>

          {/* Hero Section - Two Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ContinueLearningCard
              enrollment={sampleMostRecentEnrollment}
              isLoading={false}
            />
            <TalkToAvatarCard
              avatarName="Emma"
              greeting="Ready to practice your speaking?"
            />
          </div>

          {/* Stats Row */}
          <StatsRow
            streak={7}
            level="B1"
            minutesPracticed={245}
            lessonsCompleted={12}
          />

          {/* Main Content - Lessons and Games */}
          <div className="grid lg:grid-cols-2 gap-6">
            <LessonsSection
              enrollments={sampleEnrollments}
              isLoading={false}
              maxItems={4}
            />
            <GamesSection
              games={sampleGames}
              isLoading={false}
              maxItems={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
