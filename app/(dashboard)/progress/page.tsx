"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Clock,
  BookOpen,
  Flame,
  Target,
  Calendar,
  Trophy,
  Zap,
  BarChart3,
  MessageSquare,
} from "lucide-react";

const levelProgress = {
  A1: { min: 0, max: 100 },
  A2: { min: 100, max: 250 },
  B1: { min: 250, max: 500 },
  B2: { min: 500, max: 800 },
  C1: { min: 800, max: 1200 },
  C2: { min: 1200, max: 1500 },
};

const skillData = [
  { name: "Speaking", level: 65, color: "bg-blue-500" },
  { name: "Listening", level: 72, color: "bg-green-500" },
  { name: "Grammar", level: 58, color: "bg-purple-500" },
  { name: "Vocabulary", level: 70, color: "bg-orange-500" },
  { name: "Pronunciation", level: 45, color: "bg-pink-500" },
];

const recentSessions = [
  { date: "Today", topic: "Business Email Writing", duration: 25, rating: 4 },
  { date: "Yesterday", topic: "Present Perfect Practice", duration: 30, rating: 5 },
  { date: "Dec 28", topic: "Free Conversation", duration: 20, rating: 4 },
  { date: "Dec 27", topic: "Vocabulary Review", duration: 15, rating: 3 },
  { date: "Dec 26", topic: "Job Interview Prep", duration: 35, rating: 5 },
];

const achievements = [
  { id: "first-lesson", name: "First Steps", description: "Complete your first lesson", earned: true, icon: "🎯" },
  { id: "streak-7", name: "Week Warrior", description: "7 day streak", earned: true, icon: "🔥" },
  { id: "vocab-50", name: "Word Collector", description: "Learn 50 vocabulary words", earned: true, icon: "📚" },
  { id: "streak-30", name: "Monthly Master", description: "30 day streak", earned: false, icon: "⭐" },
  { id: "b1-reached", name: "B1 Achiever", description: "Reach B1 level", earned: false, icon: "🏆" },
];

export default function ProgressPage() {
  const student = useQuery(api.students.getStudent);

  const currentLevel = student?.currentLevel || "A1";
  const totalMinutes = student?.totalMinutesPracticed || 0;
  const levelInfo = levelProgress[currentLevel as keyof typeof levelProgress];
  const progressInLevel = Math.min(
    ((totalMinutes - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100,
    100
  );

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
          <p className="text-muted-foreground">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Level Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {currentLevel}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Progress to {getNextLevel(currentLevel)}</span>
                  <span className="text-muted-foreground">
                    {Math.round(progressInLevel)}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressInLevel}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalMinutes} of {levelInfo.max} minutes practiced
                </p>
              </div>
            </div>

            {/* Level badges */}
            <div className="flex gap-2 flex-wrap">
              {Object.keys(levelProgress).map((level) => (
                <Badge
                  key={level}
                  variant={level === currentLevel ? "default" : "outline"}
                  className={
                    level <= currentLevel
                      ? ""
                      : "opacity-50"
                  }
                >
                  {level}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student?.currentStreak ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalMinutes}</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student?.totalLessonsCompleted ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Lessons</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student?.longestStreak ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Skills Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Skills Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillData.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${skill.color} rounded-full transition-all duration-500`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSessions.map((session, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{session.topic}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.date} · {session.duration} min
                      </p>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < session.rating ? "text-yellow-500" : "text-muted"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg text-center ${
                    achievement.earned
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="font-medium text-sm">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getNextLevel(current: string): string {
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const idx = levels.indexOf(current);
  return idx < levels.length - 1 ? levels[idx + 1] : "C2";
}
