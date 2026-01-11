"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, FileText, ArrowRight } from "lucide-react";

export default function ToolsPage() {
  const games = useQuery(api.wordGames.listGames, {});
  const worksheets = useQuery(api.pdfWorksheets.listWorksheets, {});
  const worksheetCount = worksheets?.length ?? 0;

  const tools = [
    {
      title: "Word Games",
      description: "Create interactive word games for lessons including sentence builders, fill-in-the-blank, matching pairs, and more.",
      href: "/admin/tools/games",
      icon: Gamepad2,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-100",
      count: games?.length ?? 0,
      countLabel: "games",
    },
    {
      title: "PDF Editor",
      description: "Create assessment worksheets with form fields for evaluating student levels. Supports auto-grading and CEFR assessment.",
      href: "/admin/tools/pdf-editor",
      icon: FileText,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
      count: worksheetCount,
      countLabel: "worksheets",
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Tools</h2>
          <p className="text-muted-foreground">
            Create interactive content for lessons and assessments
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${tool.iconBg}`}>
                      <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="mt-4">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-2xl">{tool.count}</span>
                    <span className="text-muted-foreground">{tool.countLabel}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
