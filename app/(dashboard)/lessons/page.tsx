"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  Play,
  Search,
  Filter,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const levelColors: Record<string, string> = {
  A1: "bg-green-100 text-green-800 border-green-200",
  A2: "bg-emerald-100 text-emerald-800 border-emerald-200",
  B1: "bg-blue-100 text-blue-800 border-blue-200",
  B2: "bg-indigo-100 text-indigo-800 border-indigo-200",
  C1: "bg-purple-100 text-purple-800 border-purple-200",
  C2: "bg-violet-100 text-violet-800 border-violet-200",
};

const categories = [
  { id: "all", label: "All Lessons" },
  { id: "grammar", label: "Grammar" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "conversation", label: "Conversation" },
  { id: "business", label: "Business English" },
  { id: "pronunciation", label: "Pronunciation" },
];

export default function LessonsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const student = useQuery(api.students.getStudent);

  // Mock lessons data - in production this would come from Convex
  const lessons = [
    {
      id: "1",
      title: "Introduction to Present Perfect",
      description: "Learn when and how to use the present perfect tense in everyday conversation.",
      category: "grammar",
      level: "A2",
      duration: 25,
      objectives: ["Understand present perfect structure", "Practice with common verbs"],
    },
    {
      id: "2",
      title: "Business Email Writing",
      description: "Master professional email communication for the workplace.",
      category: "business",
      level: "B1",
      duration: 30,
      objectives: ["Write formal greetings", "Structure professional emails"],
    },
    {
      id: "3",
      title: "Restaurant Vocabulary",
      description: "Essential words and phrases for dining out in English-speaking countries.",
      category: "vocabulary",
      level: "A1",
      duration: 20,
      objectives: ["Order food confidently", "Understand menu items"],
    },
    {
      id: "4",
      title: "Small Talk Mastery",
      description: "Learn to make casual conversation with native speakers.",
      category: "conversation",
      level: "B1",
      duration: 25,
      objectives: ["Start conversations naturally", "Keep conversations flowing"],
    },
    {
      id: "5",
      title: "English Pronunciation: Vowel Sounds",
      description: "Perfect your vowel pronunciation with targeted exercises.",
      category: "pronunciation",
      level: "A2",
      duration: 20,
      objectives: ["Distinguish similar vowel sounds", "Improve listening accuracy"],
    },
    {
      id: "6",
      title: "Job Interview Preparation",
      description: "Prepare for English job interviews with common questions and answers.",
      category: "business",
      level: "B2",
      duration: 35,
      objectives: ["Answer common interview questions", "Present yourself professionally"],
    },
  ];

  const filteredLessons = lessons.filter((lesson) => {
    const matchesCategory = selectedCategory === "all" || lesson.category === selectedCategory;
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lessons</h1>
          <p className="text-muted-foreground">
            Choose a lesson to practice with Ludwig
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Current Level Indicator */}
        {student?.currentLevel && (
          <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="font-medium">Your current level:</span>
              <Badge className={levelColors[student.currentLevel] || "bg-gray-100"}>
                {student.currentLevel}
              </Badge>
              <span className="text-sm text-muted-foreground">
                — Showing lessons appropriate for your level
              </span>
            </div>
          </div>
        )}

        {/* Lessons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge
                    variant="outline"
                    className={levelColors[lesson.level] || "bg-gray-100"}
                  >
                    {lesson.level}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {lesson.duration} min
                  </div>
                </div>
                <CardTitle className="text-lg mt-2">{lesson.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {lesson.description}
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    You'll learn:
                  </p>
                  <ul className="text-sm space-y-1">
                    {lesson.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/lesson/new">
                  <Button className="w-full" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Start Lesson
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLessons.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No lessons found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
