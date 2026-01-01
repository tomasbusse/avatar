"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  BookOpen,
  Volume2,
  RotateCcw,
  Play,
  CheckCircle2,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const practiceTypes = [
  {
    id: "free-conversation",
    title: "Free Conversation",
    description: "Practice natural conversation with Ludwig on any topic",
    icon: MessageSquare,
    color: "text-blue-600 bg-blue-100",
    href: "/lesson/new",
  },
  {
    id: "vocabulary-review",
    title: "Vocabulary Review",
    description: "Review and practice words you've learned",
    icon: BookOpen,
    color: "text-green-600 bg-green-100",
    href: "/lesson/new",
  },
  {
    id: "pronunciation",
    title: "Pronunciation Drill",
    description: "Improve your pronunciation with focused exercises",
    icon: Volume2,
    color: "text-purple-600 bg-purple-100",
    href: "/lesson/new",
  },
];

// Mock vocabulary data - in production this would come from Convex
const mockVocabulary = [
  { id: "1", term_en: "accomplish", term_de: "erreichen", masteryLevel: 3, nextReview: Date.now() - 1000 },
  { id: "2", term_en: "beneficial", term_de: "vorteilhaft", masteryLevel: 2, nextReview: Date.now() - 1000 },
  { id: "3", term_en: "comprehensive", term_de: "umfassend", masteryLevel: 4, nextReview: Date.now() + 86400000 },
  { id: "4", term_en: "determination", term_de: "Entschlossenheit", masteryLevel: 1, nextReview: Date.now() - 1000 },
  { id: "5", term_en: "efficient", term_de: "effizient", masteryLevel: 5, nextReview: Date.now() + 86400000 * 7 },
];

export default function PracticePage() {
  const student = useQuery(api.students.getStudent);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const dueVocabulary = mockVocabulary.filter(v => v.nextReview <= Date.now());
  const currentCard = dueVocabulary[currentCardIndex];

  const handleNextCard = () => {
    setShowAnswer(false);
    if (currentCardIndex < dueVocabulary.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setShowFlashcard(false);
      setCurrentCardIndex(0);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Practice</h1>
          <p className="text-muted-foreground">
            Choose a practice mode to improve your English skills
          </p>
        </div>

        {/* Practice Types */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {practiceTypes.map((type) => (
            <Link key={type.id} href={type.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center mb-4`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Vocabulary Review Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Due for Review */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Due for Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dueVocabulary.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have {dueVocabulary.length} words ready for review
                  </p>
                  
                  {showFlashcard && currentCard ? (
                    <div className="space-y-4">
                      <Card className="bg-muted/50">
                        <CardContent className="p-6 text-center">
                          <p className="text-2xl font-medium mb-4">
                            {currentCard.term_en}
                          </p>
                          {showAnswer ? (
                            <p className="text-lg text-muted-foreground">
                              {currentCard.term_de}
                            </p>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => setShowAnswer(true)}
                            >
                              Show Answer
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                      
                      {showAnswer && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600"
                            onClick={handleNextCard}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Again
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleNextCard}
                          >
                            Good
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={handleNextCard}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Easy
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-center text-muted-foreground">
                        Card {currentCardIndex + 1} of {dueVocabulary.length}
                      </p>
                    </div>
                  ) : (
                    <Button onClick={() => setShowFlashcard(true)} className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Start Review ({dueVocabulary.length} cards)
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium mb-2">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    No vocabulary due for review right now
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Vocabulary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Your Vocabulary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockVocabulary.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{word.term_en}</p>
                      <p className="text-sm text-muted-foreground">
                        {word.term_de}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full mx-0.5 ${
                              i < word.masteryLevel
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  {mockVocabulary.length} words in your vocabulary
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{student?.currentStreak ?? 0}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{mockVocabulary.length}</p>
              <p className="text-sm text-muted-foreground">Words Learned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">
                {mockVocabulary.filter(v => v.masteryLevel >= 4).length}
              </p>
              <p className="text-sm text-muted-foreground">Mastered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{student?.totalLessonsCompleted ?? 0}</p>
              <p className="text-sm text-muted-foreground">Conversations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
