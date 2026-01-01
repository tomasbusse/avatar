"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Briefcase,
  Plane,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  { id: "welcome", title: "Welcome" },
  { id: "level", title: "Your Level" },
  { id: "goals", title: "Learning Goals" },
  { id: "preferences", title: "Preferences" },
  { id: "complete", title: "All Set!" },
];

const levels = [
  { id: "A1", name: "Beginner (A1)", description: "I know basic words and phrases" },
  { id: "A2", name: "Elementary (A2)", description: "I can handle simple conversations" },
  { id: "B1", name: "Intermediate (B1)", description: "I can discuss familiar topics" },
  { id: "B2", name: "Upper-Intermediate (B2)", description: "I can speak fluently about many topics" },
  { id: "C1", name: "Advanced (C1)", description: "I can express complex ideas" },
  { id: "C2", name: "Proficient (C2)", description: "I'm nearly native-level" },
];

const goals = [
  { id: "career", icon: Briefcase, label: "Career", description: "For work and professional growth" },
  { id: "travel", icon: Plane, label: "Travel", description: "For traveling abroad" },
  { id: "exam", icon: Trophy, label: "Exam Prep", description: "Preparing for a test" },
  { id: "personal", icon: BookOpen, label: "Personal", description: "Self-improvement and fun" },
  { id: "academic", icon: GraduationCap, label: "Academic", description: "For school or university" },
];

const focusAreas = [
  { id: "speaking", label: "Speaking" },
  { id: "listening", label: "Listening" },
  { id: "grammar", label: "Grammar" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "pronunciation", label: "Pronunciation" },
  { id: "business", label: "Business English" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<string>("A2");
  const [selectedGoal, setSelectedGoal] = useState<string>("personal");
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(["speaking", "grammar"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = useQuery(api.users.getCurrentUser);
  const completeOnboarding = useMutation(api.students.completeOnboarding);

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        currentLevel: selectedLevel,
        learningGoal: selectedGoal as "career" | "travel" | "exam" | "personal" | "academic",
        focusAreas: selectedFocusAreas,
      });
      toast.success("Welcome to Beethoven! Let's start learning.");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              Welcome to Beethoven, {user?.firstName || "there"}!
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Let's personalize your learning experience. We'll ask you a few
              questions to understand your goals and create the perfect learning
              path for you.
            </p>
            <Button onClick={handleNext} size="lg">
              Let's Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="py-6">
            <h2 className="text-xl font-bold mb-2 text-center">
              What's your current English level?
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Don't worry, you can always adjust this later
            </p>
            <div className="grid gap-3 max-w-lg mx-auto">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedLevel === level.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        selectedLevel === level.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {level.id}
                    </div>
                    <div>
                      <p className="font-medium">{level.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {level.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="py-6">
            <h2 className="text-xl font-bold mb-2 text-center">
              Why do you want to learn English?
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              This helps us recommend the right lessons
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedGoal === goal.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <goal.icon
                    className={`w-8 h-8 mb-2 ${
                      selectedGoal === goal.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <p className="font-medium">{goal.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {goal.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="py-6">
            <h2 className="text-xl font-bold mb-2 text-center">
              What would you like to focus on?
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Select all that apply
            </p>
            <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
              {focusAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => toggleFocusArea(area.id)}
                  className={`px-4 py-2 rounded-full border transition-all ${
                    selectedFocusAreas.includes(area.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {selectedFocusAreas.includes(area.id) && (
                    <Check className="w-4 h-4 inline mr-1" />
                  )}
                  {area.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">You're all set!</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Great! We've personalized your learning experience. You can now
              start practicing with Ludwig, your AI English teacher.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 max-w-sm mx-auto mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Level</p>
                  <p className="font-medium">{selectedLevel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Goal</p>
                  <p className="font-medium capitalize">{selectedGoal}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Focus Areas</p>
                  <p className="font-medium capitalize">
                    {selectedFocusAreas.join(", ")}
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleComplete} size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      index < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <CardTitle className="text-center">{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}

          {/* Navigation */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
