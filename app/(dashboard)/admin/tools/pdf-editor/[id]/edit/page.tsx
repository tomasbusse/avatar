"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Eye,
  Save,
  Loader2,
  Plus,
  Type,
  ListChecks,
  CheckSquare,
  Link2,
  Move,
  AlignLeft,
  Trash2,
  Download,
  FileText,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { WorksheetEditor } from "@/components/pdf-editor/worksheet-editor";
import { WorksheetContent } from "@/lib/types/worksheet-content";
import { FormField, FormFieldData, FieldType, MultipleChoiceOption, FormFieldConfig } from "@/components/pdf-editor/form-field";

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: "text_input", label: "Text Input", icon: <Type className="h-4 w-4" />, description: "Short text answer" },
  { type: "multiple_choice", label: "Multiple Choice", icon: <ListChecks className="h-4 w-4" />, description: "Radio button options" },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" />, description: "Multiple selections" },
  { type: "matching", label: "Matching", icon: <Link2 className="h-4 w-4" />, description: "Match pairs together" },
  { type: "drag_drop", label: "Drag & Drop", icon: <Move className="h-4 w-4" />, description: "Drag items to place" },
  { type: "long_text", label: "Long Text", icon: <AlignLeft className="h-4 w-4" />, description: "Paragraph answer" },
];

export default function PDFEditorEditPage() {
  const params = useParams();
  const router = useRouter();
  const worksheetId = params.id as Id<"pdfWorksheets">;

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [localContent, setLocalContent] = useState<WorksheetContent | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "fields">("content");

  // Form fields state (for overlay fields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Queries
  const worksheet = useQuery(api.pdfWorksheets.getWorksheet, { worksheetId });

  // Mutations
  const updateWorksheet = useMutation(api.pdfWorksheets.updateWorksheet);
  const updateJsonContent = useMutation(api.pdfWorksheets.updateJsonContent);
  const addField = useMutation(api.pdfWorksheets.addField);
  const updateField = useMutation(api.pdfWorksheets.updateField);
  const deleteField = useMutation(api.pdfWorksheets.deleteField);

  // Initialize local content from worksheet
  useEffect(() => {
    if (worksheet?.jsonContent && !localContent) {
      setLocalContent(worksheet.jsonContent as WorksheetContent);
    }
  }, [worksheet?.jsonContent, localContent]);

  // Handle content changes with debounced auto-save
  const handleContentChange = useCallback(
    (newContent: WorksheetContent) => {
      setLocalContent(newContent);
      setHasUnsavedChanges(true);
    },
    []
  );

  // Save content
  const handleSave = async () => {
    if (!localContent) return;

    setIsSaving(true);
    try {
      await updateJsonContent({
        worksheetId,
        jsonContent: localContent,
      });
      await updateWorksheet({
        worksheetId,
        status: "draft",
      });
      toast.success("Worksheet saved");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to save");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate PDF
  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Save first if there are unsaved changes
      if (hasUnsavedChanges && localContent) {
        await updateJsonContent({
          worksheetId,
          jsonContent: localContent,
        });
      }

      const response = await fetch("/api/pdf-editor/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worksheetId,
          includeAnswerKey: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "PDF generation failed");
      }

      const result = await response.json();
      toast.success(`PDF generated (${Math.round(result.size / 1024)} KB)`);

      // Download the PDF
      window.open(`/api/pdf-editor/generate-pdf?worksheetId=${worksheetId}`, "_blank");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF");
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Add form field overlay
  const handleAddField = async (type: FieldType) => {
    const newField: FormFieldData = {
      id: `field-${Date.now()}`,
      pageIndex: 0,
      type,
      position: {
        x: 0.1,
        y: 0.1,
        width: type === "long_text" ? 0.8 : 0.3,
        height: type === "long_text" ? 0.15 : 0.05,
      },
      correctAnswers: [],
      points: 1,
    };

    try {
      await addField({
        worksheetId,
        field: newField,
      });
      setSelectedFieldId(newField.id);
      toast.success("Field added");
    } catch (error) {
      toast.error("Failed to add field");
      console.error(error);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await deleteField({ worksheetId, fieldId });
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(null);
      }
      toast.success("Field deleted");
    } catch (error) {
      toast.error("Failed to delete field");
      console.error(error);
    }
  };

  // Get processing stage display
  const getProcessingStageDisplay = () => {
    const stage = worksheet?.processingStage;
    if (!stage || stage === "ready") return null;

    const stages: Record<string, { label: string; color: string }> = {
      uploading: { label: "Uploading...", color: "bg-blue-100 text-blue-700" },
      ocr_extracting: { label: "Extracting text...", color: "bg-yellow-100 text-yellow-700" },
      ai_structuring: { label: "AI structuring...", color: "bg-purple-100 text-purple-700" },
      generating_pdf: { label: "Generating PDF...", color: "bg-green-100 text-green-700" },
      failed: { label: "Failed", color: "bg-red-100 text-red-700" },
    };

    return stages[stage] || null;
  };

  const processingStage = getProcessingStageDisplay();
  const selectedField = worksheet?.fields.find((f) => f.id === selectedFieldId) as FormFieldData | undefined;
  const hasJsonContent = !!worksheet?.jsonContent;

  if (!worksheet) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show processing state
  if (processingStage && worksheet.processingStage !== "ready") {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Processing Worksheet</h2>
          <Badge className={processingStage.color}>{processingStage.label}</Badge>
          {worksheet.processingError && (
            <p className="text-red-500 mt-4 max-w-md">{worksheet.processingError}</p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/tools/pdf-editor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Link>
        </Button>
      </div>
    );
  }

  // Show prompt to process if no jsonContent
  if (!hasJsonContent) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <div className="text-center max-w-md">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Worksheet Not Processed</h2>
          <p className="text-muted-foreground mb-4">
            This worksheet hasn&apos;t been processed yet. Process it to extract content and enable editing.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/tools/pdf-editor">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button
            onClick={async () => {
              if (!worksheet.originalPdfStorageId) {
                toast.error("No PDF uploaded for this worksheet");
                return;
              }

              try {
                toast.info("Starting OCR extraction...");

                const ocrResponse = await fetch("/api/pdf-editor/ocr-extract", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    worksheetId,
                    storageId: worksheet.originalPdfStorageId,
                  }),
                });

                if (!ocrResponse.ok) {
                  throw new Error("OCR extraction failed");
                }

                const ocrResult = await ocrResponse.json();
                toast.info("Structuring content with AI...");

                const structureResponse = await fetch("/api/pdf-editor/structure", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    worksheetId,
                    rawText: ocrResult.text,
                    category: worksheet.category,
                    level: worksheet.cefrLevel,
                  }),
                });

                if (!structureResponse.ok) {
                  throw new Error("AI structuring failed");
                }

                toast.success("Processing complete! Refreshing...");
                window.location.reload();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Processing failed");
              }
            }}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Process Worksheet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/tools/pdf-editor">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{worksheet.title}</h1>
                <Badge variant="outline">{worksheet.cefrLevel}</Badge>
                <Badge
                  variant="outline"
                  className={
                    worksheet.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100"
                  }
                >
                  {worksheet.status}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                    Unsaved
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {localContent?.content.sections.length || 0} sections |
                {worksheet.fields.length} form fields
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/admin/tools/pdf-editor/${worksheetId}/preview`)
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "content" | "fields")}>
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content Editor</TabsTrigger>
              <TabsTrigger value="fields">Form Fields ({worksheet.fields.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="m-0">
              {localContent && (
                <WorksheetEditor
                  content={localContent}
                  onChange={handleContentChange}
                  editable={true}
                  className="max-w-4xl mx-auto"
                />
              )}
            </TabsContent>

            <TabsContent value="fields" className="m-0">
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Form Field Overlays</h3>
                  <p className="text-sm text-muted-foreground">
                    Add grading fields that overlay on the exported PDF
                  </p>
                </div>

                {/* Add Field Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {FIELD_TYPES.map((fieldType) => (
                    <button
                      key={fieldType.type}
                      onClick={() => handleAddField(fieldType.type)}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="p-2 rounded bg-primary/10 text-primary">
                        {fieldType.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{fieldType.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {fieldType.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Field List */}
                {worksheet.fields.length > 0 ? (
                  <div className="space-y-2">
                    {(worksheet.fields as FormFieldData[]).map((field, i) => (
                      <div
                        key={field.id}
                        className={`flex items-center justify-between p-3 rounded border ${
                          selectedFieldId === field.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedFieldId(field.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">#{i + 1}</span>
                          <Badge variant="outline">{field.type.replace("_", " ")}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {field.label || "No label"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {field.points || 1} pts
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteField(field.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No form fields added yet.</p>
                    <p className="text-xs mt-1">
                      Click a field type above to add grading fields.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Field Properties */}
        {activeTab === "fields" && selectedField && (
          <div className="w-80 border-l bg-card overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Field Properties</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedField.type.replace("_", " ")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={selectedField.label || ""}
                  onChange={(e) => {
                    updateField({
                      worksheetId,
                      fieldId: selectedField.id,
                      updates: { label: e.target.value },
                    });
                  }}
                  placeholder="Field label..."
                />
              </div>

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={selectedField.placeholder || ""}
                  onChange={(e) => {
                    updateField({
                      worksheetId,
                      fieldId: selectedField.id,
                      updates: { placeholder: e.target.value },
                    });
                  }}
                  placeholder="Placeholder text..."
                />
              </div>

              <div className="space-y-2">
                <Label>Correct Answers</Label>
                <Textarea
                  value={selectedField.correctAnswers.join("\n")}
                  onChange={(e) => {
                    updateField({
                      worksheetId,
                      fieldId: selectedField.id,
                      updates: {
                        correctAnswers: e.target.value
                          .split("\n")
                          .filter((a) => a.trim()),
                      },
                    });
                  }}
                  placeholder="Enter each answer on a new line..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Multiple correct answers allowed (one per line)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  value={selectedField.points || 1}
                  onChange={(e) => {
                    updateField({
                      worksheetId,
                      fieldId: selectedField.id,
                      updates: { points: parseInt(e.target.value) || 1 },
                    });
                  }}
                />
              </div>

              {/* Options Editor for Multiple Choice and Checkbox */}
              {(selectedField.type === "multiple_choice" || selectedField.type === "checkbox") && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentConfig = (selectedField.config as FormFieldConfig) || {};
                        const currentOptions = currentConfig.options || [];
                        const newOption: MultipleChoiceOption = {
                          id: `opt-${Date.now()}`,
                          text: "",
                          isCorrect: false,
                        };
                        updateField({
                          worksheetId,
                          fieldId: selectedField.id,
                          updates: {
                            config: {
                              ...currentConfig,
                              options: [...currentOptions, newOption],
                            },
                          },
                        });
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {((selectedField.config as FormFieldConfig)?.options || []).map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <input
                          type={selectedField.type === "multiple_choice" ? "radio" : "checkbox"}
                          name={`correct-${selectedField.id}`}
                          checked={option.isCorrect || false}
                          onChange={(e) => {
                            const currentConfig = (selectedField.config as FormFieldConfig) || {};
                            const currentOptions = currentConfig.options || [];
                            let updatedOptions: MultipleChoiceOption[];

                            if (selectedField.type === "multiple_choice") {
                              updatedOptions = currentOptions.map((opt) => ({
                                ...opt,
                                isCorrect: opt.id === option.id,
                              }));
                            } else {
                              updatedOptions = currentOptions.map((opt) =>
                                opt.id === option.id
                                  ? { ...opt, isCorrect: e.target.checked }
                                  : opt
                              );
                            }

                            updateField({
                              worksheetId,
                              fieldId: selectedField.id,
                              updates: {
                                config: { ...currentConfig, options: updatedOptions },
                              },
                            });
                          }}
                          className="flex-shrink-0"
                        />
                        <Input
                          value={option.text}
                          onChange={(e) => {
                            const currentConfig = (selectedField.config as FormFieldConfig) || {};
                            const currentOptions = currentConfig.options || [];
                            const updatedOptions = currentOptions.map((opt) =>
                              opt.id === option.id
                                ? { ...opt, text: e.target.value }
                                : opt
                            );
                            updateField({
                              worksheetId,
                              fieldId: selectedField.id,
                              updates: {
                                config: { ...currentConfig, options: updatedOptions },
                              },
                            });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const currentConfig = (selectedField.config as FormFieldConfig) || {};
                            const currentOptions = currentConfig.options || [];
                            const updatedOptions = currentOptions.filter(
                              (opt) => opt.id !== option.id
                            );
                            updateField({
                              worksheetId,
                              fieldId: selectedField.id,
                              updates: {
                                config: { ...currentConfig, options: updatedOptions },
                              },
                            });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={selectedField.required || false}
                  onChange={(e) => {
                    updateField({
                      worksheetId,
                      fieldId: selectedField.id,
                      updates: { required: e.target.checked },
                    });
                  }}
                />
                <Label htmlFor="required">Required field</Label>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => handleDeleteField(selectedField.id)}
              >
                Delete Field
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
