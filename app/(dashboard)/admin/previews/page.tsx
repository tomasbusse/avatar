"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, GraduationCap, User, ArrowRight } from "lucide-react";
import Link from "next/link";

const previewPages = [
  {
    title: "Student Dashboard",
    description: "Preview what students see when they log in. Shows lessons, games, stats, and conversation access.",
    href: "/admin/previews/student-dashboard",
    icon: GraduationCap,
    badge: "Student View",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Teacher Dashboard",
    description: "Preview the teacher experience for managing lessons and monitoring student progress.",
    href: "/admin/previews/teacher-dashboard",
    icon: User,
    badge: "Teacher View",
    badgeColor: "bg-purple-100 text-purple-800",
  },
];

export default function PreviewsPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Page Previews</h1>
          </div>
          <p className="text-muted-foreground">
            Preview what different user roles see when using the platform. These views use sample data to demonstrate the user experience.
          </p>
        </div>

        <div className="grid gap-6">
          {previewPages.map((page) => (
            <Card key={page.href} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <page.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {page.title}
                        <Badge variant="outline" className={page.badgeColor}>
                          {page.badge}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {page.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={page.href}>
                  <Button>
                    View Preview
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> These previews use sample data and do not reflect actual user accounts. Use them to understand the user experience and test UI layouts.
          </p>
        </div>
      </div>
    </div>
  );
}
