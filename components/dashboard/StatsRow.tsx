"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingUp, Clock, BookOpen } from "lucide-react";

interface StatsRowProps {
  streak: number;
  level: string;
  minutesPracticed: number;
  lessonsCompleted: number;
}

export function StatsRow({
  streak,
  level,
  minutesPracticed,
  lessonsCompleted,
}: StatsRowProps) {
  const stats = [
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Streak",
      value: streak,
      unit: streak === 1 ? "day" : "days",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Level",
      value: level,
      unit: "",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Practice",
      value: minutesPracticed,
      unit: "min",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Lessons",
      value: lessonsCompleted,
      unit: "done",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.color}`}
              >
                {stat.icon}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{stat.value}</span>
                  {stat.unit && (
                    <span className="text-xs text-muted-foreground">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
