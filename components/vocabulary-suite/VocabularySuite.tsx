"use client";

import React, { useState } from "react";
import { VocabSuiteMode, VocabGameData } from "./types";
import VocabularySuiteHeader from "./VocabularySuiteHeader";
import VocabularySuiteOverview from "./VocabularySuiteOverview";
import VocabularySuiteFlashcards from "./VocabularySuiteFlashcards";
import VocabularySuiteMatching from "./VocabularySuiteMatching";
import VocabularySuiteQuiz from "./VocabularySuiteQuiz";

interface VocabularySuiteProps {
  gameData: VocabGameData;
}

const VocabularySuite: React.FC<VocabularySuiteProps> = ({ gameData }) => {
  const [mode, setMode] = useState<VocabSuiteMode>(VocabSuiteMode.OVERVIEW);

  const renderContent = () => {
    switch (mode) {
      case VocabSuiteMode.OVERVIEW:
        return (
          <VocabularySuiteOverview
            gameData={gameData}
            onStart={() => setMode(VocabSuiteMode.FLASHCARDS)}
          />
        );
      case VocabSuiteMode.FLASHCARDS:
        return <VocabularySuiteFlashcards gameData={gameData} />;
      case VocabSuiteMode.MATCHING:
        return <VocabularySuiteMatching gameData={gameData} />;
      case VocabSuiteMode.QUIZ:
        return <VocabularySuiteQuiz gameData={gameData} />;
      default:
        return (
          <VocabularySuiteOverview
            gameData={gameData}
            onStart={() => setMode(VocabSuiteMode.FLASHCARDS)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <VocabularySuiteHeader
        activeMode={mode}
        setMode={setMode}
        title={gameData.title}
      />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 min-h-[600px] flex flex-col">
          {renderContent()}
        </div>
      </main>
      <footer className="py-6 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Simmonds Language Services
      </footer>
    </div>
  );
};

export default VocabularySuite;
