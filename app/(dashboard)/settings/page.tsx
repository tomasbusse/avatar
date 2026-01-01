"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  User,
  Bell,
  Globe,
  Volume2,
  Clock,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { toast } from "sonner";

const bilingualModes = [
  { id: "adaptive", label: "Adaptive", description: "Adjusts based on your responses" },
  { id: "code_switching", label: "Code Switching", description: "Mix of German and English" },
  { id: "strict_separation", label: "Strict Separation", description: "Clear language boundaries" },
  { id: "target_only", label: "English Only", description: "Maximum immersion" },
];

const lessonDurations = [15, 20, 25, 30, 45, 60];

const voiceSpeeds = [
  { value: 0.8, label: "Slow" },
  { value: 1.0, label: "Normal" },
  { value: 1.2, label: "Fast" },
];

export default function SettingsPage() {
  const { user } = useUser();
  const student = useQuery(api.students.getStudent);
  const updatePreferences = useMutation(api.students.updatePreferences);

  const [bilingualMode, setBilingualMode] = useState<"adaptive" | "code_switching" | "strict_separation" | "target_only">(
    (student?.preferences?.bilingualMode as "adaptive" | "code_switching" | "strict_separation" | "target_only") || "adaptive"
  );
  const [lessonDuration, setLessonDuration] = useState(
    student?.preferences?.lessonDuration || 30
  );
  const [voiceSpeed, setVoiceSpeed] = useState(
    student?.preferences?.voiceSpeed || 1.0
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences({
        bilingualMode: bilingualMode as "adaptive" | "code_switching" | "strict_separation" | "target_only",
        lessonDuration,
        voiceSpeed,
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and learning preferences
          </p>
        </div>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-16 h-16",
                  },
                }}
              />
              <div className="flex-1">
                <p className="font-medium text-lg">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <Badge variant="outline">{student?.currentLevel || "A1"}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Learning Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Learning Preferences
            </CardTitle>
            <CardDescription>
              Customize your learning experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bilingual Mode */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Language Support Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                {bilingualModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setBilingualMode(mode.id as "adaptive" | "code_switching" | "strict_separation" | "target_only")}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      bilingualMode === mode.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{mode.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {mode.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson Duration */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                <Clock className="w-4 h-4 inline mr-2" />
                Default Lesson Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {lessonDurations.map((duration) => (
                  <Button
                    key={duration}
                    variant={lessonDuration === duration ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLessonDuration(duration)}
                  >
                    {duration} min
                  </Button>
                ))}
              </div>
            </div>

            {/* Voice Speed */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                <Volume2 className="w-4 h-4 inline mr-2" />
                Voice Speed
              </label>
              <div className="flex gap-2">
                {voiceSpeeds.map((speed) => (
                  <Button
                    key={speed.value}
                    variant={voiceSpeed === speed.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVoiceSpeed(speed.value)}
                  >
                    {speed.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Adjust how fast Ludwig speaks
              </p>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <NotificationToggle
                title="Daily Reminders"
                description="Get reminded to practice every day"
                defaultChecked={true}
              />
              <NotificationToggle
                title="Progress Updates"
                description="Weekly summary of your learning progress"
                defaultChecked={true}
              />
              <NotificationToggle
                title="New Lessons"
                description="Get notified when new lessons are available"
                defaultChecked={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">Privacy Settings</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">Export Data</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
              <span className="text-sm">Delete Account</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NotificationToggle({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
