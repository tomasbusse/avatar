"use client";

import React from "react";
import { VocabSuiteMode } from "./types";
import Image from "next/image";

interface HeaderProps {
  activeMode: VocabSuiteMode;
  setMode: (mode: VocabSuiteMode) => void;
  title?: string;
}

// Clean up title by removing (Copy) patterns
function cleanTitle(title: string): string {
  return title.replace(/\s*\(Copy\)\s*/gi, " ").trim();
}

const VocabularySuiteHeader: React.FC<HeaderProps> = ({
  activeMode,
  setMode,
  title = "Vocabulary Suite",
}) => {
  const displayTitle = cleanTitle(title);
  const navItems = [
    { mode: VocabSuiteMode.OVERVIEW, label: "Overview", icon: "📋" },
    { mode: VocabSuiteMode.FLASHCARDS, label: "Flashcards", icon: "📇" },
    { mode: VocabSuiteMode.MATCHING, label: "Matching", icon: "🧩" },
    { mode: VocabSuiteMode.QUIZ, label: "Quiz", icon: "📝" },
    { mode: VocabSuiteMode.AI_TUTOR, label: "AI Tutor", icon: "🤖" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setMode(VocabSuiteMode.OVERVIEW)}
        >
          <div className="w-10 h-10 bg-sls-teal rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform overflow-hidden">
            <Image
              src="/sls-logo-white.png"
              alt="SLS"
              width={32}
              height={32}
              className="object-contain"
              onError={(e) => {
                // Fallback to text if image fails
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="text-sm font-bold">SLS</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight text-slate-800">
              {displayTitle}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Vocabulary Suite
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeMode === item.mode
                  ? "bg-sls-teal/10 text-sls-teal"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile dropdown */}
        <div className="md:hidden">
          <select
            value={activeMode}
            onChange={(e) => setMode(e.target.value as VocabSuiteMode)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white"
          >
            {navItems.map((item) => (
              <option key={item.mode} value={item.mode}>
                {item.icon} {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default VocabularySuiteHeader;
