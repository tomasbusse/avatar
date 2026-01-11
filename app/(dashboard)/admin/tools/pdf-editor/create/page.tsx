"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Upload,
  FileText,
  LayoutTemplate,
  Loader2,
  Wand2,
  CheckCircle2,
  AlertCircle,
  ScanSearch,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type WorksheetCategory = "grammar" | "vocabulary" | "reading" | "writing" | "mixed";

type ProcessingStep = "idle" | "uploading" | "ocr" | "structuring" | "complete" | "error";

const TEMPLATES = [
  {
    id: "vocabulary-list",
    name: "Vocabulary List",
    description: "Match words with definitions",
    level: "A1-B1",
    icon: "ABC",
  },
  {
    id: "grammar-exercise",
    name: "Grammar Exercise",
    description: "Fill-in-the-blank sentences",
    level: "A2-B2",
    icon: "Aa",
  },
  {
    id: "reading-comprehension",
    name: "Reading Comprehension",
    description: "Text passage with questions",
    level: "B1-C1",
    icon: "Paragraph",
  },
  {
    id: "multiple-choice",
    name: "Multiple Choice Quiz",
    description: "Question bank with options",
    level: "A1-C2",
    icon: "ABCD",
  },
  {
    id: "mixed-assessment",
    name: "Mixed Assessment",
    description: "Combination of field types",
    level: "A1-C2",
    icon: "Mix",
  },
  {
    id: "cloze-test",
    name: "Cloze Test",
    description: "Passage with blanks",
    level: "B1-C2",
    icon: "___",
  },
];

const PROCESSING_STEPS = {
  idle: { label: "Ready", icon: FileText, progress: 0 },
  uploading: { label: "Uploading PDF...", icon: Upload, progress: 25 },
  ocr: { label: "Extracting text with OCR...", icon: ScanSearch, progress: 50 },
  structuring: { label: "Structuring with AI...", icon: Brain, progress: 75 },
  complete: { label: "Complete!", icon: CheckCircle2, progress: 100 },
  error: { label: "Error", icon: AlertCircle, progress: 0 },
};

export default function CreateWorksheetPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createMode, setCreateMode] = useState<"upload" | "template" | "blank">("upload");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>("B1");
  const [category, setCategory] = useState<WorksheetCategory>("mixed");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [processingError, setProcessingError] = useState<string | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser);
  const createWorksheet = useMutation(api.pdfWorksheets.createWorksheet);
  const generateUploadUrl = useMutation(api.pdfWorksheets.generateUploadUrl);
  const saveUploadedPdf = useMutation(api.pdfWorksheets.saveUploadedPdf);
  const updateProcessingStage = useMutation(api.pdfWorksheets.updateProcessingStage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setUploadedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.pdf$/i, ""));
      }
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (createMode === "upload" && !uploadedFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (createMode === "template" && !selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    if (!currentUser?._id) {
      toast.error("Please sign in to create a worksheet");
      return;
    }

    setIsCreating(true);
    setProcessingStep("uploading");
    setProcessingError(null);

    try {
      // 1. Create worksheet record
      const worksheetId = await createWorksheet({
        title: title.trim(),
        description: description.trim() || undefined,
        cefrLevel,
        category,
        sourceType: createMode,
        templateId: selectedTemplate || undefined,
        createdBy: currentUser._id,
      });

      // 2. Upload PDF if in upload mode
      if (createMode === "upload" && uploadedFile) {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload the file
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": uploadedFile.type },
          body: uploadedFile,
        });

        if (!response.ok) {
          throw new Error("Failed to upload PDF");
        }

        const { storageId } = await response.json();

        // Save PDF reference
        await saveUploadedPdf({
          worksheetId,
          storageId,
          pageCount: 1,
        });

        // 3. Start OCR extraction
        setProcessingStep("ocr");
        await updateProcessingStage({
          worksheetId,
          processingStage: "ocr_extracting",
        });

        const ocrResponse = await fetch("/api/pdf-editor/ocr-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worksheetId,
            storageId,
          }),
        });

        if (!ocrResponse.ok) {
          const error = await ocrResponse.json();
          throw new Error(error.error || "OCR extraction failed");
        }

        const ocrResult = await ocrResponse.json();

        // 4. Structure with AI
        setProcessingStep("structuring");
        await updateProcessingStage({
          worksheetId,
          processingStage: "ai_structuring",
        });

        const structureResponse = await fetch("/api/pdf-editor/structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worksheetId,
            rawText: ocrResult.text,
            category,
            level: cefrLevel,
          }),
        });

        if (!structureResponse.ok) {
          const error = await structureResponse.json();
          throw new Error(error.error || "AI structuring failed");
        }

        setProcessingStep("complete");
        toast.success("Worksheet created and processed!");

        // Small delay to show complete state
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      router.push(`/admin/tools/pdf-editor/${worksheetId}/edit`);
    } catch (error) {
      setProcessingStep("error");
      setProcessingError(error instanceof Error ? error.message : "Failed to create worksheet");
      toast.error(error instanceof Error ? error.message : "Failed to create worksheet");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const currentStepInfo = PROCESSING_STEPS[processingStep];
  const StepIcon = currentStepInfo.icon;

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/tools/pdf-editor">
            <Button variant="ghost" size="sm" disabled={isCreating}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Create Worksheet</h2>
            <p className="text-muted-foreground">
              Start from a PDF, template, or blank canvas
            </p>
          </div>
        </div>

        {/* Processing Status */}
        {isCreating && processingStep !== "idle" && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  processingStep === "error"
                    ? "bg-red-100 text-red-600"
                    : processingStep === "complete"
                    ? "bg-green-100 text-green-600"
                    : "bg-primary/10 text-primary"
                }`}>
                  {["uploading", "ocr", "structuring"].includes(processingStep) ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <StepIcon className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{currentStepInfo.label}</p>
                  {processingError && (
                    <p className="text-sm text-red-600 mt-1">{processingError}</p>
                  )}
                  {["uploading", "ocr", "structuring"].includes(processingStep) && (
                    <Progress value={currentStepInfo.progress} className="mt-2" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creation Mode Tabs */}
        <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as typeof createMode)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2" disabled={isCreating}>
              <Upload className="h-4 w-4" />
              Upload PDF
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2" disabled={isCreating}>
              <LayoutTemplate className="h-4 w-4" />
              Template
            </TabsTrigger>
            <TabsTrigger value="blank" className="flex items-center gap-2" disabled={isCreating}>
              <FileText className="h-4 w-4" />
              Blank
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-purple-500" />
                  Upload & Auto-Process
                </CardTitle>
                <CardDescription>
                  Upload a PDF and our AI will automatically extract and structure the content for editing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isCreating}
                />
                {uploadedFile ? (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      disabled={isCreating}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => !isCreating && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      isCreating ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary"
                    }`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF files only, max 50MB
                    </p>
                  </div>
                )}

                {/* Processing Pipeline Preview */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-3">What happens when you upload:</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Upload className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Upload</span>
                    </div>
                    <div className="h-px w-8 bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <ScanSearch className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span>OCR</span>
                    </div>
                    <div className="h-px w-8 bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>AI Structure</span>
                    </div>
                    <div className="h-px w-8 bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Edit</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template">
            <Card>
              <CardHeader>
                <CardTitle>Choose a Template</CardTitle>
                <CardDescription>
                  Start with a pre-designed worksheet structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => !isCreating && setSelectedTemplate(template.id)}
                      className={`p-4 border rounded-lg transition-all ${
                        isCreating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      } ${
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {template.icon}
                        </div>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.level}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blank Tab */}
          <TabsContent value="blank">
            <Card>
              <CardHeader>
                <CardTitle>Start from Blank</CardTitle>
                <CardDescription>
                  Create a new A4 document and add content from scratch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-12 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="w-24 h-32 mx-auto mb-4 bg-white border-2 rounded shadow-sm flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">A4</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Blank A4 worksheet (210 x 297 mm)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Worksheet Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Worksheet Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Present Perfect Practice"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this worksheet..."
                rows={2}
                disabled={isCreating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CEFR Level</Label>
                <Select
                  value={cefrLevel}
                  onValueChange={(v) => setCefrLevel(v as CEFRLevel)}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as WorksheetCategory)}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="vocabulary">Vocabulary</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-4 mt-6">
          <div className="flex justify-end gap-4">
            <Link href="/admin/tools/pdf-editor">
              <Button variant="outline" disabled={isCreating}>Cancel</Button>
            </Link>
            <Button onClick={handleCreate} disabled={isCreating || !currentUser}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Create Worksheet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
