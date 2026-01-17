"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Brain,
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Upload,
  Wand2,
  Loader2,
  Play,
  Clock,
  MessageCircle,
  User,
} from "lucide-react";

// ============================================
// PERSONALITY TRAITS EDITOR
// ============================================

interface PersonalityTraits {
  warmth: number;
  formality: number;
  patience: number;
  encouragement: number;
  humor: number;
  directness: number;
  empathy: number;
}

interface PersonalityStyle {
  sentenceLength: "short" | "medium" | "long";
  vocabulary: "simple" | "professional" | "academic";
  useAnalogies: boolean;
  askQuestions: "rarely" | "sometimes" | "frequently";
}

interface PersonalityBehaviors {
  greetingStyle: string;
  farewellStyle: string;
  errorHandling: string;
  uncertaintyExpression: string;
  praiseStyle: string;
  correctionStyle: string;
}

interface PersonalityData {
  traits: PersonalityTraits;
  style: PersonalityStyle;
  behaviors: PersonalityBehaviors;
  voiceHints?: {
    pace: "slow" | "medium" | "fast";
    energy: "calm" | "moderate" | "energetic";
    emotionRange: "reserved" | "moderate" | "expressive";
  };
}

const TRAIT_DESCRIPTIONS: Record<keyof PersonalityTraits, { label: string; low: string; high: string }> = {
  warmth: { label: "Warmth", low: "Professional/Reserved", high: "Warm/Friendly" },
  formality: { label: "Formality", low: "Casual", high: "Formal" },
  patience: { label: "Patience", low: "Brisk/Efficient", high: "Very Patient" },
  encouragement: { label: "Encouragement", low: "Neutral", high: "Highly Encouraging" },
  humor: { label: "Humor", low: "Serious", high: "Playful" },
  directness: { label: "Directness", low: "Gentle/Indirect", high: "Direct/Blunt" },
  empathy: { label: "Empathy", low: "Task-Focused", high: "Highly Empathetic" },
};

export function PersonalityTraitsEditor({
  value,
  onChange,
}: {
  value: PersonalityData | undefined;
  onChange: (data: PersonalityData) => void;
}) {
  const defaultPersonality: PersonalityData = {
    traits: { warmth: 7, formality: 5, patience: 8, encouragement: 8, humor: 5, directness: 5, empathy: 7 },
    style: { sentenceLength: "medium", vocabulary: "professional", useAnalogies: true, askQuestions: "frequently" },
    behaviors: {
      greetingStyle: "Warm and friendly greeting",
      farewellStyle: "Encouraging summary with next steps",
      errorHandling: "Gentle correction with explanation",
      uncertaintyExpression: "Honest acknowledgment of limits",
      praiseStyle: "Specific and genuine praise",
      correctionStyle: "Supportive recast",
    },
    voiceHints: { pace: "medium", energy: "moderate", emotionRange: "expressive" },
  };

  const personality = value || defaultPersonality;

  const updateTrait = (trait: keyof PersonalityTraits, val: number) => {
    onChange({
      ...personality,
      traits: { ...personality.traits, [trait]: val },
    });
  };

  const updateStyle = (key: keyof PersonalityStyle, val: any) => {
    onChange({
      ...personality,
      style: { ...personality.style, [key]: val },
    });
  };

  const updateBehavior = (key: keyof PersonalityBehaviors, val: string) => {
    onChange({
      ...personality,
      behaviors: { ...personality.behaviors, [key]: val },
    });
  };

  const updateVoiceHint = (key: string, val: string) => {
    onChange({
      ...personality,
      voiceHints: { ...personality.voiceHints, [key]: val } as any,
    });
  };

  return (
    <div className="space-y-6">
      {/* Personality Traits */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500" />
          Personality Traits (1-10)
        </h4>
        <div className="space-y-4">
          {(Object.keys(TRAIT_DESCRIPTIONS) as Array<keyof PersonalityTraits>).map((trait) => (
            <div key={trait} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{TRAIT_DESCRIPTIONS[trait].label}</span>
                <span className="text-muted-foreground">{personality.traits[trait]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={personality.traits[trait]}
                onChange={(e) => updateTrait(trait, parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{TRAIT_DESCRIPTIONS[trait].low}</span>
                <span>{TRAIT_DESCRIPTIONS[trait].high}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Style */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          Communication Style
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Sentence Length</label>
            <select
              value={personality.style.sentenceLength}
              onChange={(e) => updateStyle("sentenceLength", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            >
              <option value="short">Short & Concise</option>
              <option value="medium">Medium</option>
              <option value="long">Detailed & Long</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Vocabulary</label>
            <select
              value={personality.style.vocabulary}
              onChange={(e) => updateStyle("vocabulary", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            >
              <option value="simple">Simple (A1-A2)</option>
              <option value="professional">Professional (B1-B2)</option>
              <option value="academic">Academic (C1-C2)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Ask Questions</label>
            <select
              value={personality.style.askQuestions}
              onChange={(e) => updateStyle("askQuestions", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            >
              <option value="rarely">Rarely</option>
              <option value="sometimes">Sometimes</option>
              <option value="frequently">Frequently</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="useAnalogies"
              checked={personality.style.useAnalogies}
              onChange={(e) => updateStyle("useAnalogies", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="useAnalogies" className="text-sm">
              Use Analogies & Examples
            </label>
          </div>
        </div>
      </div>

      {/* Behavioral Patterns */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          Behavioral Patterns
        </h4>
        <div className="space-y-3">
          {[
            { key: "greetingStyle", label: "Greeting Style", placeholder: "How does the avatar greet students?" },
            { key: "farewellStyle", label: "Farewell Style", placeholder: "How does the avatar say goodbye?" },
            { key: "errorHandling", label: "Error Handling", placeholder: "How to handle student mistakes?" },
            { key: "praiseStyle", label: "Praise Style", placeholder: "How to praise correct answers?" },
            { key: "correctionStyle", label: "Correction Style", placeholder: "How to correct errors?" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium">{label}</label>
              <input
                type="text"
                value={personality.behaviors[key as keyof PersonalityBehaviors]}
                onChange={(e) => updateBehavior(key as keyof PersonalityBehaviors, e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Voice Hints */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          Voice Hints (TTS Tuning)
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Pace</label>
            <select
              value={personality.voiceHints?.pace || "medium"}
              onChange={(e) => updateVoiceHint("pace", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            >
              <option value="slow">Slow</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Energy</label>
            <select
              value={personality.voiceHints?.energy || "moderate"}
              onChange={(e) => updateVoiceHint("energy", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            >
              <option value="calm">Calm</option>
              <option value="moderate">Moderate</option>
              <option value="energetic">Energetic</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Emotion Range</label>
            <select
              value={personality.voiceHints?.emotionRange || "moderate"}
              onChange={(e) => updateVoiceHint("emotionRange", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            >
              <option value="reserved">Reserved</option>
              <option value="moderate">Moderate</option>
              <option value="expressive">Expressive</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// IDENTITY EDITOR (with AI/Upload/Structured methods)
// ============================================

interface Credential {
  degree: string;
  institution: string;
  year: number;
}

interface CareerEntry {
  role: string;
  organization: string;
  yearStart: number;
  yearEnd?: number;
  highlights: string[];
}

interface Anecdote {
  topic: string;
  story: string;
  context: string;
  emotions: string[];
}

interface IdentityData {
  fullName: string;
  preferredName: string;
  title?: string;
  credentials?: Credential[];
  careerHistory?: CareerEntry[];
  personalBackground?: {
    nationality?: string;
    languages?: Array<{ language: string; proficiency: string; story?: string }>;
    hobbies?: string[];
  };
  anecdotes?: Anecdote[];
  philosophy?: {
    coreBeliefs: string[];
    approachDescription: string;
  };
  shortBio?: string;
  fullBio?: string;
}

type IdentityCreationMethod = "ai" | "upload" | "editor";

export function IdentityEditor({
  value,
  onChange,
  avatarName = "",
}: {
  value: IdentityData | undefined;
  onChange: (data: IdentityData) => void;
  avatarName?: string;
}) {
  const [creationMethod, setCreationMethod] = useState<IdentityCreationMethod>("editor");
  const [expandedSection, setExpandedSection] = useState<string | null>("basic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation form fields
  const [aiForm, setAiForm] = useState({
    name: avatarName,
    role: "English Teacher",
    nationality: "",
    yearsExperience: "",
    specializations: "",
    educationLevel: "masters" as "bachelors" | "masters" | "phd",
    personality: "",
  });

  const identity: IdentityData = value || {
    fullName: "",
    preferredName: "",
    title: "",
    credentials: [],
    careerHistory: [],
    anecdotes: [],
    philosophy: { coreBeliefs: [], approachDescription: "" },
    shortBio: "",
    fullBio: "",
  };

  const updateField = (field: keyof IdentityData, val: any) => {
    onChange({ ...identity, [field]: val });
  };

  // AI Generation handler
  const handleGenerateWithAI = async () => {
    if (!aiForm.name) {
      alert("Please enter a name for the avatar");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/avatar/generate-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm),
      });

      if (!response.ok) {
        throw new Error("Failed to generate identity");
      }

      const result = await response.json();
      onChange(result.identity);
      setCreationMethod("editor");
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate identity. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        onChange(parsed);
        setCreationMethod("editor");
      } catch (error) {
        alert("Invalid JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  // JSON paste handler
  const handleJsonPaste = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      onChange(parsed);
      setCreationMethod("editor");
      setJsonInput("");
    } catch (error) {
      alert("Invalid JSON. Please check the format.");
    }
  };

  // Credential helpers
  const addCredential = () => {
    const newCred: Credential = { degree: "", institution: "", year: new Date().getFullYear() };
    updateField("credentials", [...(identity.credentials || []), newCred]);
  };

  const updateCredential = (index: number, field: keyof Credential, val: any) => {
    const updated = [...(identity.credentials || [])];
    updated[index] = { ...updated[index], [field]: val };
    updateField("credentials", updated);
  };

  const removeCredential = (index: number) => {
    const updated = [...(identity.credentials || [])];
    updated.splice(index, 1);
    updateField("credentials", updated);
  };

  // Career helpers
  const addCareerEntry = () => {
    const entry: CareerEntry = { role: "", organization: "", yearStart: new Date().getFullYear(), highlights: [] };
    updateField("careerHistory", [...(identity.careerHistory || []), entry]);
  };

  const updateCareerEntry = (index: number, field: keyof CareerEntry, val: any) => {
    const updated = [...(identity.careerHistory || [])];
    updated[index] = { ...updated[index], [field]: val };
    updateField("careerHistory", updated);
  };

  const removeCareerEntry = (index: number) => {
    const updated = [...(identity.careerHistory || [])];
    updated.splice(index, 1);
    updateField("careerHistory", updated);
  };

  // Anecdote helpers
  const addAnecdote = () => {
    const anecdote: Anecdote = { topic: "", story: "", context: "", emotions: [] };
    updateField("anecdotes", [...(identity.anecdotes || []), anecdote]);
  };

  const updateAnecdote = (index: number, field: keyof Anecdote, val: any) => {
    const updated = [...(identity.anecdotes || [])];
    updated[index] = { ...updated[index], [field]: val };
    updateField("anecdotes", updated);
  };

  const removeAnecdote = (index: number) => {
    const updated = [...(identity.anecdotes || [])];
    updated.splice(index, 1);
    updateField("anecdotes", updated);
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50"
      >
        {title}
        {expandedSection === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expandedSection === id && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
          <User className="w-4 h-4" />
          Avatar Identity
        </h4>
        <p className="text-sm text-blue-700">
          Create a professional identity for your avatar including credentials, career history,
          and personal anecdotes that make them feel authentic.
        </p>
      </div>

      {/* Creation Method Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setCreationMethod("ai")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
            creationMethod === "ai"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Generate with AI
        </button>
        <button
          type="button"
          onClick={() => setCreationMethod("upload")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
            creationMethod === "upload"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload / Paste JSON
        </button>
        <button
          type="button"
          onClick={() => setCreationMethod("editor")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
            creationMethod === "editor"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Structured Editor
        </button>
      </div>

      {/* AI Generation Panel */}
      {creationMethod === "ai" && (
        <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 space-y-4">
          <p className="text-sm text-muted-foreground">
            Provide key details and let AI create a complete professional identity:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <input
                type="text"
                value={aiForm.name}
                onChange={(e) => setAiForm({ ...aiForm, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="Emma Thompson"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role/Title</label>
              <input
                type="text"
                value={aiForm.role}
                onChange={(e) => setAiForm({ ...aiForm, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="Senior English Teacher"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nationality</label>
              <input
                type="text"
                value={aiForm.nationality}
                onChange={(e) => setAiForm({ ...aiForm, nationality: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="British"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Years of Experience</label>
              <input
                type="text"
                value={aiForm.yearsExperience}
                onChange={(e) => setAiForm({ ...aiForm, yearsExperience: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="12"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Specializations</label>
              <input
                type="text"
                value={aiForm.specializations}
                onChange={(e) => setAiForm({ ...aiForm, specializations: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="Business English, Conversation, Grammar"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Education Level</label>
              <select
                value={aiForm.educationLevel}
                onChange={(e) => setAiForm({ ...aiForm, educationLevel: e.target.value as typeof aiForm.educationLevel })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD / Doctorate</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Personality Traits</label>
            <input
              type="text"
              value={aiForm.personality}
              onChange={(e) => setAiForm({ ...aiForm, personality: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              placeholder="Patient, encouraging, with a good sense of humor"
            />
          </div>
          <Button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Identity...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Professional Identity
              </>
            )}
          </Button>
        </div>
      )}

      {/* Upload/Paste Panel */}
      {creationMethod === "upload" && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">Drop your JSON file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or paste JSON</span>
            </div>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-sm"
            rows={8}
            placeholder={`{
  "fullName": "Emma Thompson",
  "preferredName": "Emma",
  "title": "Senior English Teacher",
  "credentials": [...],
  "careerHistory": [...],
  "philosophy": {...}
}`}
          />
          <Button
            type="button"
            onClick={handleJsonPaste}
            disabled={!jsonInput.trim()}
            className="w-full"
          >
            Import JSON
          </Button>
        </div>
      )}

      {/* Structured Editor Panel */}
      {creationMethod === "editor" && (
        <div className="space-y-4">
          <Section id="basic" title="Basic Identity">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  value={identity.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="Ludwig Alexander Weber"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Preferred Name</label>
                <input
                  type="text"
                  value={identity.preferredName}
                  onChange={(e) => updateField("preferredName", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="Ludwig"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={identity.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="Senior Language Coach"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Short Bio</label>
              <textarea
                value={identity.shortBio || ""}
                onChange={(e) => updateField("shortBio", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                rows={2}
                placeholder="A brief introduction..."
              />
            </div>
          </Section>

          <Section id="credentials" title="Credentials & Education">
            {(identity.credentials || []).map((cred, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Degree</label>
                  <input
                    type="text"
                    value={cred.degree}
                    onChange={(e) => updateCredential(i, "degree", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="M.A. Applied Linguistics"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Institution</label>
                  <input
                    type="text"
                    value={cred.institution}
                    onChange={(e) => updateCredential(i, "institution", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="University Name"
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs text-muted-foreground">Year</label>
                  <input
                    type="number"
                    value={cred.year}
                    onChange={(e) => updateCredential(i, "year", parseInt(e.target.value))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeCredential(i)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addCredential}>
              <Plus className="w-4 h-4 mr-1" /> Add Credential
            </Button>
          </Section>

          <Section id="career" title="Career History">
            {(identity.careerHistory || []).map((entry, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Role</label>
                    <input
                      type="text"
                      value={entry.role}
                      onChange={(e) => updateCareerEntry(i, "role", e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Language Coach"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Organization</label>
                    <input
                      type="text"
                      value={entry.organization}
                      onChange={(e) => updateCareerEntry(i, "organization", e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="BMW Group"
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="w-24">
                    <label className="text-xs text-muted-foreground">Start</label>
                    <input
                      type="number"
                      value={entry.yearStart}
                      onChange={(e) => updateCareerEntry(i, "yearStart", parseInt(e.target.value))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-muted-foreground">End</label>
                    <input
                      type="number"
                      value={entry.yearEnd || ""}
                      onChange={(e) => updateCareerEntry(i, "yearEnd", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Present"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCareerEntry(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Highlights (comma separated)</label>
                  <input
                    type="text"
                    value={(entry.highlights || []).join(", ")}
                    onChange={(e) => updateCareerEntry(i, "highlights", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Trained 200+ executives, Developed curriculum..."
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addCareerEntry}>
              <Plus className="w-4 h-4 mr-1" /> Add Career Entry
            </Button>
          </Section>

          <Section id="anecdotes" title="Personal Anecdotes">
            <p className="text-sm text-muted-foreground mb-4">
              Anecdotes are short personal stories the avatar can share to build rapport.
            </p>
            {(identity.anecdotes || []).map((anecdote, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Topic</label>
                    <input
                      type="text"
                      value={anecdote.topic}
                      onChange={(e) => updateAnecdote(i, "topic", e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="making_mistakes, persistence, business_context"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeAnecdote(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Story</label>
                  <textarea
                    value={anecdote.story}
                    onChange={(e) => updateAnecdote(i, "story", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    rows={2}
                    placeholder="The actual anecdote to tell..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">When to use</label>
                  <input
                    type="text"
                    value={anecdote.context}
                    onChange={(e) => updateAnecdote(i, "context", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Use when student is frustrated with progress"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Emotions (comma separated)</label>
                  <input
                    type="text"
                    value={(anecdote.emotions || []).join(", ")}
                    onChange={(e) => updateAnecdote(i, "emotions", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="empathy, humor, encouragement"
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addAnecdote}>
              <Plus className="w-4 h-4 mr-1" /> Add Anecdote
            </Button>
          </Section>

          <Section id="philosophy" title="Teaching Philosophy">
            <div>
              <label className="text-sm font-medium">Core Beliefs (one per line)</label>
              <textarea
                value={(identity.philosophy?.coreBeliefs || []).join("\n")}
                onChange={(e) => updateField("philosophy", {
                  ...identity.philosophy,
                  coreBeliefs: e.target.value.split("\n").filter(Boolean),
                })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                rows={4}
                placeholder="Every learner has their own pace&#10;Mistakes are stepping stones..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Approach Description</label>
              <textarea
                value={identity.philosophy?.approachDescription || ""}
                onChange={(e) => updateField("philosophy", {
                  ...identity.philosophy,
                  approachDescription: e.target.value,
                })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                rows={3}
                placeholder="Describe the avatar's teaching approach..."
              />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

// ============================================
// KNOWLEDGE BASE EDITOR
// ============================================

interface KnowledgeConfig {
  knowledgeBaseIds?: string[];
  domain: {
    primaryTopic: string;
    subtopics: string[];
    expertise: string[];
    limitations: string[];
  };
  ragSettings: {
    enabled: boolean;
    triggerKeywords: string[];
    maxContextChunks: number;
    similarityThreshold: number;
  };
}

interface KnowledgeBase {
  _id: string;
  name: string;
  description: string;
  status: string;
}

export function KnowledgeBaseEditor({
  value,
  onChange,
  availableKnowledgeBases = [],
}: {
  value: KnowledgeConfig | undefined;
  onChange: (data: KnowledgeConfig) => void;
  availableKnowledgeBases?: KnowledgeBase[];
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>("domain");

  const defaultConfig: KnowledgeConfig = {
    knowledgeBaseIds: [],
    domain: {
      primaryTopic: "English Language Teaching",
      subtopics: [],
      expertise: [],
      limitations: [],
    },
    ragSettings: {
      enabled: true,
      triggerKeywords: ["explain", "what is", "how to", "tell me about", "erklär", "was ist"],
      maxContextChunks: 3,
      similarityThreshold: 0.7,
    },
  };

  const config = value || defaultConfig;

  const updateDomain = (field: keyof KnowledgeConfig["domain"], val: any) => {
    onChange({
      ...config,
      domain: { ...config.domain, [field]: val },
    });
  };

  const updateRAGSettings = (field: keyof KnowledgeConfig["ragSettings"], val: any) => {
    onChange({
      ...config,
      ragSettings: { ...config.ragSettings, [field]: val },
    });
  };

  const toggleKnowledgeBase = (kbId: string) => {
    const currentIds = config.knowledgeBaseIds || [];
    const newIds = currentIds.includes(kbId)
      ? currentIds.filter((id) => id !== kbId)
      : [...currentIds, kbId];
    onChange({ ...config, knowledgeBaseIds: newIds });
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50"
      >
        {title}
        {expandedSection === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expandedSection === id && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      <Section id="domain" title="Domain Expertise">
        <div>
          <label className="text-sm font-medium">Primary Topic</label>
          <input
            type="text"
            value={config.domain.primaryTopic}
            onChange={(e) => updateDomain("primaryTopic", e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            placeholder="English Language Teaching"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Subtopics (comma separated)</label>
          <input
            type="text"
            value={config.domain.subtopics.join(", ")}
            onChange={(e) => updateDomain("subtopics", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            placeholder="Business English, Grammar, Conversation"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Areas of Expertise (comma separated)</label>
          <input
            type="text"
            value={config.domain.expertise.join(", ")}
            onChange={(e) => updateDomain("expertise", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            placeholder="Present Perfect, Business Presentations, Pronunciation"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Limitations (comma separated)</label>
          <input
            type="text"
            value={config.domain.limitations.join(", ")}
            onChange={(e) => updateDomain("limitations", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
            placeholder="Cannot provide legal or medical advice"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Topics the avatar should decline to answer about
          </p>
        </div>
      </Section>

      <Section id="rag" title="RAG Settings (Knowledge Retrieval)">
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <input
            type="checkbox"
            id="ragEnabled"
            checked={config.ragSettings.enabled}
            onChange={(e) => updateRAGSettings("enabled", e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <div>
            <label htmlFor="ragEnabled" className="font-medium cursor-pointer">
              Enable RAG
            </label>
            <p className="text-xs text-muted-foreground">
              Retrieve knowledge from linked knowledge bases when answering questions
            </p>
          </div>
        </div>

        {config.ragSettings.enabled && (
          <>
            <div>
              <label className="text-sm font-medium">Trigger Keywords (comma separated)</label>
              <input
                type="text"
                value={config.ragSettings.triggerKeywords.join(", ")}
                onChange={(e) => updateRAGSettings("triggerKeywords", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                placeholder="explain, what is, how to, tell me about"
              />
              <p className="text-xs text-muted-foreground mt-1">
                RAG is triggered when user input contains these keywords
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Max Context Chunks: {config.ragSettings.maxContextChunks}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.ragSettings.maxContextChunks}
                  onChange={(e) => updateRAGSettings("maxContextChunks", parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Similarity Threshold: {config.ragSettings.similarityThreshold}</label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={config.ragSettings.similarityThreshold}
                  onChange={(e) => updateRAGSettings("similarityThreshold", parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>
          </>
        )}
      </Section>

      <Section id="kbs" title="Linked Knowledge Bases">
        {availableKnowledgeBases.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No knowledge bases available.</p>
            <p className="text-sm mt-1">Create knowledge bases in the Knowledge Management section.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableKnowledgeBases.map((kb) => (
              <div
                key={kb._id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  config.knowledgeBaseIds?.includes(kb._id)
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => toggleKnowledgeBase(kb._id)}
              >
                <input
                  type="checkbox"
                  checked={config.knowledgeBaseIds?.includes(kb._id) || false}
                  onChange={() => toggleKnowledgeBase(kb._id)}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{kb.name}</p>
                  <p className="text-xs text-muted-foreground">{kb.description}</p>
                </div>
                <Badge variant={kb.status === "active" ? "default" : "secondary"}>
                  {kb.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ============================================
// MEMORY CONFIG EDITOR
// ============================================

interface MemoryConfig {
  autoExtractFacts: boolean;
  trackingCategories: string[];
  shortTermRetentionDays: number;
  zepConfig?: {
    userId?: string;
    sessionId?: string;
  };
}

const MEMORY_CATEGORIES = [
  { id: "profile", label: "Profile", description: "Personal facts - job, family, location" },
  { id: "progress", label: "Progress", description: "Skills mastered, achievements" },
  { id: "personal", label: "Personal", description: "Preferences, interests, goals" },
  { id: "emotional", label: "Emotional", description: "Frustrations, motivators" },
  { id: "sessions", label: "Sessions", description: "Session summaries, recent topics" },
];

export function MemoryConfigEditor({
  value,
  onChange,
}: {
  value: MemoryConfig | undefined;
  onChange: (data: MemoryConfig) => void;
}) {
  const defaultConfig: MemoryConfig = {
    autoExtractFacts: true,
    trackingCategories: ["profile", "progress", "personal", "emotional"],
    shortTermRetentionDays: 30,
  };

  const config = value || defaultConfig;

  const toggleCategory = (categoryId: string) => {
    const current = config.trackingCategories || [];
    const updated = current.includes(categoryId)
      ? current.filter((c) => c !== categoryId)
      : [...current, categoryId];
    onChange({ ...config, trackingCategories: updated });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-1">Memory & Personalization</h4>
        <p className="text-sm text-purple-700">
          Configure how the avatar remembers information about students across sessions.
          Memories are stored in Zep Cloud for fast retrieval.
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 border rounded-lg">
        <input
          type="checkbox"
          id="autoExtract"
          checked={config.autoExtractFacts}
          onChange={(e) => onChange({ ...config, autoExtractFacts: e.target.checked })}
          className="w-5 h-5 rounded"
        />
        <div>
          <label htmlFor="autoExtract" className="font-medium cursor-pointer">
            Auto-Extract Facts
          </label>
          <p className="text-sm text-muted-foreground">
            Automatically extract memorable facts from conversations using LLM
          </p>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Tracking Categories</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Select which types of information the avatar should remember about students.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MEMORY_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                config.trackingCategories?.includes(cat.id)
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => toggleCategory(cat.id)}
            >
              <input
                type="checkbox"
                checked={config.trackingCategories?.includes(cat.id) || false}
                onChange={() => toggleCategory(cat.id)}
                className="w-4 h-4 rounded mt-0.5"
              />
              <div>
                <p className="font-medium text-sm">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Short-Term Memory Retention: {config.shortTermRetentionDays} days</label>
        <input
          type="range"
          min="7"
          max="90"
          value={config.shortTermRetentionDays}
          onChange={(e) => onChange({ ...config, shortTermRetentionDays: parseInt(e.target.value) })}
          className="w-full mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          How long to keep short-term memories (session summaries, recent topics).
          Critical memories (personal facts, achievements) are kept indefinitely.
        </p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Memory Types</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Critical:</strong> Never forgotten (name, job, family)</li>
          <li><strong>High:</strong> Reviewed periodically (learning goals, major struggles)</li>
          <li><strong>Medium:</strong> Standard retention (preferences, interests)</li>
          <li><strong>Low:</strong> Expires after retention period (session details)</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// LIFE STORY EDITOR
// ============================================

interface LifeStoryData {
  lifeStoryDocument?: string;
  lifeStorySummary?: string;
}

type CreationMethod = "ai" | "upload" | "editor";

export function LifeStoryEditor({
  value,
  onChange,
  avatarName = "",
}: {
  value: LifeStoryData | undefined;
  onChange: (data: LifeStoryData) => void;
  avatarName?: string;
}) {
  const [creationMethod, setCreationMethod] = useState<CreationMethod>("editor");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation form fields
  const [aiForm, setAiForm] = useState({
    name: avatarName,
    age: "",
    nationality: "",
    personality: "",
    background: "",
    quirk: "",
    style: "balanced" as "detailed" | "balanced" | "concise",
  });

  const data: LifeStoryData = value || {};

  const handleGenerateWithAI = async () => {
    if (!aiForm.name || !aiForm.personality) {
      alert("Please fill in at least the name and personality fields");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/avatar/generate-life-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm),
      });

      if (!response.ok) {
        throw new Error("Failed to generate life story");
      }

      const result = await response.json();
      onChange({
        lifeStoryDocument: result.lifeStory,
        lifeStorySummary: result.summary,
      });

      setCreationMethod("editor");
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate life story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onChange({
        ...data,
        lifeStoryDocument: content,
      });
      setCreationMethod("editor");
    };
    reader.readAsText(file);
  };

  const handleAutoSummarize = async () => {
    if (!data.lifeStoryDocument) {
      alert("Please add a life story document first");
      return;
    }

    setIsSummarizing(true);
    try {
      const response = await fetch("/api/avatar/summarize-life-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifeStoryDocument: data.lifeStoryDocument }),
      });

      if (!response.ok) {
        throw new Error("Failed to summarize");
      }

      const result = await response.json();
      onChange({
        ...data,
        lifeStorySummary: result.summary,
      });
    } catch (error) {
      console.error("Summarization error:", error);
      alert("Failed to summarize. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h4 className="font-medium text-orange-900 mb-1 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Avatar Life Story
        </h4>
        <p className="text-sm text-orange-700">
          Create a comprehensive life story to make your avatar feel authentically human.
          Include history, education, relationships, and personal details.
        </p>
      </div>

      {/* Creation Method Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setCreationMethod("ai")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
            creationMethod === "ai"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Generate with AI
        </button>
        <button
          type="button"
          onClick={() => setCreationMethod("upload")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
            creationMethod === "upload"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload MD File
        </button>
        <button
          type="button"
          onClick={() => setCreationMethod("editor")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
            creationMethod === "editor"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Editor
        </button>
      </div>

      {/* AI Generation Panel */}
      {creationMethod === "ai" && (
        <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 space-y-4">
          <p className="text-sm text-muted-foreground">
            Provide key details and let AI create a comprehensive life story:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input
                type="text"
                value={aiForm.name}
                onChange={(e) => setAiForm({ ...aiForm, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="Emma Thompson"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Age</label>
              <input
                type="text"
                value={aiForm.age}
                onChange={(e) => setAiForm({ ...aiForm, age: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="34"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nationality</label>
              <input
                type="text"
                value={aiForm.nationality}
                onChange={(e) => setAiForm({ ...aiForm, nationality: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="British"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Style</label>
              <select
                value={aiForm.style}
                onChange={(e) => setAiForm({ ...aiForm, style: e.target.value as typeof aiForm.style })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                <option value="detailed">Detailed (2000+ words)</option>
                <option value="balanced">Balanced (1000-1500 words)</option>
                <option value="concise">Concise (500-800 words)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Personality *</label>
            <input
              type="text"
              value={aiForm.personality}
              onChange={(e) => setAiForm({ ...aiForm, personality: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              placeholder="Warm, patient, encouraging, with a good sense of humor"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Background</label>
            <input
              type="text"
              value={aiForm.background}
              onChange={(e) => setAiForm({ ...aiForm, background: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              placeholder="Former journalist turned English teacher"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Interesting Quirk</label>
            <input
              type="text"
              value={aiForm.quirk}
              onChange={(e) => setAiForm({ ...aiForm, quirk: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              placeholder="Collects vintage postcards from places never visited"
            />
          </div>
          <Button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Life Story...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Life Story
              </>
            )}
          </Button>
        </div>
      )}

      {/* Upload Panel */}
      {creationMethod === "upload" && (
        <div className="p-4 border rounded-lg space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">Drop your markdown file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground text-center">
            Accepts .md or .txt files
          </p>
        </div>
      )}

      {/* Editor Panel - Always shown below other methods */}
      {creationMethod === "editor" && (
        <>
          <div>
            <label className="text-sm font-medium">Full Life Story (Markdown)</label>
            <textarea
              value={data.lifeStoryDocument || ""}
              onChange={(e) => onChange({ ...data, lifeStoryDocument: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background font-mono text-sm"
              rows={15}
              placeholder={`# ${avatarName || "Avatar"}'s Life Story

## Early Life & Family
Born in...

## Education
Studied at...

## Career Journey
Started career as...

## Personal Life
Hobbies include...

## Teaching Philosophy
Believes that learning should be...

## Fun Facts
- Interesting fact 1
- Interesting fact 2`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              The full document is stored but not sent to the LLM. Use markdown formatting.
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Summary (for System Prompt)</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoSummarize}
                disabled={isSummarizing || !data.lifeStoryDocument}
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3 mr-1" />
                    Auto-Summarize
                  </>
                )}
              </Button>
            </div>
            <textarea
              value={data.lifeStorySummary || ""}
              onChange={(e) => onChange({ ...data, lifeStorySummary: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
              rows={8}
              placeholder="A condensed version of the life story (300-500 words) that will be included in the system prompt..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              This condensed version is sent to the LLM. Keep it under 500 words for optimal latency.
              {data.lifeStorySummary && (
                <span className="ml-1 font-medium">
                  ({data.lifeStorySummary.split(/\s+/).length} words)
                </span>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// SESSION START EDITOR
// ============================================

interface SessionStartConfig {
  behavior: "speak_first" | "wait_for_student" | "contextual";
  openingGreeting?: string;
  greetingVariations?: string[];
  openingTopics?: string[];
  warmUpDuration?: number;
  mentionPreviousSession?: boolean;
}

export function SessionStartEditor({
  value,
  onChange,
}: {
  value: SessionStartConfig | undefined;
  onChange: (data: SessionStartConfig) => void;
}) {
  const defaultConfig: SessionStartConfig = {
    behavior: "speak_first",
    openingGreeting: "Hello! Great to see you today. How are you doing today?",
    greetingVariations: [],
    openingTopics: [],
    warmUpDuration: 60,
    mentionPreviousSession: true,
  };

  const config = value || defaultConfig;

  const addGreetingVariation = () => {
    const variations = [...(config.greetingVariations || []), ""];
    onChange({ ...config, greetingVariations: variations });
  };

  const updateGreetingVariation = (index: number, val: string) => {
    const variations = [...(config.greetingVariations || [])];
    variations[index] = val;
    onChange({ ...config, greetingVariations: variations });
  };

  const removeGreetingVariation = (index: number) => {
    const variations = [...(config.greetingVariations || [])];
    variations.splice(index, 1);
    onChange({ ...config, greetingVariations: variations });
  };

  const addOpeningTopic = () => {
    const topics = [...(config.openingTopics || []), ""];
    onChange({ ...config, openingTopics: topics });
  };

  const updateOpeningTopic = (index: number, val: string) => {
    const topics = [...(config.openingTopics || [])];
    topics[index] = val;
    onChange({ ...config, openingTopics: topics });
  };

  const removeOpeningTopic = (index: number) => {
    const topics = [...(config.openingTopics || [])];
    topics.splice(index, 1);
    onChange({ ...config, openingTopics: topics });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-900 mb-1 flex items-center gap-2">
          <Play className="w-4 h-4" />
          Session Start Configuration
        </h4>
        <p className="text-sm text-green-700">
          Configure how the avatar begins conversations. A warm, immediate greeting
          helps students feel comfortable and avoids awkward silences.
        </p>
      </div>

      {/* Behavior Selection */}
      <div>
        <h4 className="text-sm font-medium mb-3">Session Start Behavior</h4>
        <div className="grid grid-cols-3 gap-3">
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              config.behavior === "speak_first"
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onChange({ ...config, behavior: "speak_first" })}
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={config.behavior === "speak_first"}
                onChange={() => onChange({ ...config, behavior: "speak_first" })}
                className="w-4 h-4"
              />
              <MessageCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="font-medium text-sm">Speak First</p>
            <p className="text-xs text-muted-foreground">
              Avatar greets immediately (recommended)
            </p>
          </div>

          <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              config.behavior === "wait_for_student"
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onChange({ ...config, behavior: "wait_for_student" })}
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={config.behavior === "wait_for_student"}
                onChange={() => onChange({ ...config, behavior: "wait_for_student" })}
                className="w-4 h-4"
              />
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="font-medium text-sm">Wait for Student</p>
            <p className="text-xs text-muted-foreground">
              Wait for student to speak first
            </p>
          </div>

          <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              config.behavior === "contextual"
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onChange({ ...config, behavior: "contextual" })}
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={config.behavior === "contextual"}
                onChange={() => onChange({ ...config, behavior: "contextual" })}
                className="w-4 h-4"
              />
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <p className="font-medium text-sm">Contextual</p>
            <p className="text-xs text-muted-foreground">
              Adapt based on time, returning student
            </p>
          </div>
        </div>
      </div>

      {/* Opening Greeting Template */}
      <div>
        <label className="text-sm font-medium">Opening Greeting Template</label>
        <textarea
          value={config.openingGreeting || ""}
          onChange={(e) => onChange({ ...config, openingGreeting: e.target.value })}
          className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
          rows={2}
          placeholder="Hello {studentName}! Great to see you. How are you doing today?"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Variables: <code>{"{studentName}"}</code>, <code>{"{timeOfDay}"}</code>, <code>{"{lessonTopic}"}</code>, <code>{"{previousLesson}"}</code>
        </p>
      </div>

      {/* Greeting Variations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Greeting Variations</label>
          <Button type="button" variant="outline" size="sm" onClick={addGreetingVariation}>
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Alternative greetings used randomly for variety
        </p>
        <div className="space-y-2">
          {(config.greetingVariations || []).map((greeting, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={greeting}
                onChange={(e) => updateGreetingVariation(i, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
                placeholder="Hey there! Ready for another English adventure?"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGreetingVariation(i)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Opening Topics */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Opening Topics (Conversation Starters)</label>
          <Button type="button" variant="outline" size="sm" onClick={addOpeningTopic}>
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Topics the avatar can bring up after the initial greeting
        </p>
        <div className="space-y-2">
          {(config.openingTopics || []).map((topic, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => updateOpeningTopic(i, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
                placeholder="How was your week?"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOpeningTopic(i)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">
            Warm-up Duration: {config.warmUpDuration || 60}s
          </label>
          <input
            type="range"
            min="30"
            max="180"
            step="15"
            value={config.warmUpDuration || 60}
            onChange={(e) => onChange({ ...config, warmUpDuration: parseInt(e.target.value) })}
            className="w-full mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Time before transitioning to lesson content
          </p>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="mentionPrevious"
            checked={config.mentionPreviousSession ?? true}
            onChange={(e) => onChange({ ...config, mentionPreviousSession: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <div>
            <label htmlFor="mentionPrevious" className="text-sm font-medium cursor-pointer">
              Reference Previous Sessions
            </label>
            <p className="text-xs text-muted-foreground">
              Mention what was covered last time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
