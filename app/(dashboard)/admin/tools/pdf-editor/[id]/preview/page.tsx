"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Edit,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PDFCanvas, BlankCanvas } from "@/components/pdf-editor/pdf-canvas";
import { StudentFormField, FormFieldData, FormFieldConfig } from "@/components/pdf-editor/form-field";

interface FieldAnswer {
  fieldId: string;
  value: string | string[];
}

interface GradingResult {
  fieldId: string;
  isCorrect: boolean;
  correctAnswers: string[];
  studentAnswer: string | string[];
  points: number;
  earnedPoints: number;
}

export default function PDFEditorPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const worksheetId = params.id as Id<"pdfWorksheets">;

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gradingResults, setGradingResults] = useState<GradingResult[]>([]);

  // Queries
  const worksheet = useQuery(api.pdfWorksheets.getWorksheet, { worksheetId });
  const pdfUrl = useQuery(
    api.pdfWorksheets.getStorageUrl,
    worksheet?.originalPdfStorageId
      ? { storageId: worksheet.originalPdfStorageId }
      : "skip"
  );

  // Get current page fields
  const currentPageFields = (worksheet?.fields || []).filter(
    (f) => f.pageIndex === currentPage - 1
  ) as FormFieldData[];

  // Get all fields for scoring
  const allFields = (worksheet?.fields || []) as FormFieldData[];

  // Handle answer change
  const handleAnswerChange = useCallback(
    (fieldId: string, value: string | string[]) => {
      if (isSubmitted) return;
      setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    },
    [isSubmitted]
  );

  // Check if answer is correct
  const checkAnswer = (field: FormFieldData, answer: string | string[]): boolean => {
    // For multiple choice and checkbox, check against option IDs marked as correct
    if (field.type === "multiple_choice" || field.type === "checkbox") {
      const config = field.config as FormFieldConfig;
      const options = config?.options || [];
      const correctOptionIds = options.filter((opt) => opt.isCorrect).map((opt) => opt.id);

      if (correctOptionIds.length === 0) return true; // No correct answer defined

      if (field.type === "multiple_choice") {
        // For radio buttons, just check if selected option is correct
        return correctOptionIds.includes(answer as string);
      } else {
        // For checkboxes, all correct options must be selected and no incorrect ones
        const selectedIds = Array.isArray(answer) ? answer : [];
        const allCorrectSelected = correctOptionIds.every((id) => selectedIds.includes(id));
        const noIncorrectSelected = selectedIds.every((id) => correctOptionIds.includes(id));
        return allCorrectSelected && noIncorrectSelected;
      }
    }

    // For text-based fields, check against correctAnswers array
    const studentAnswer = Array.isArray(answer) ? answer : [answer];
    const correctAnswers = field.correctAnswers;

    if (correctAnswers.length === 0) return true; // No correct answer defined

    for (const student of studentAnswer) {
      const normalizedStudent = field.caseSensitive
        ? student.trim()
        : student.trim().toLowerCase();

      for (const correct of correctAnswers) {
        const normalizedCorrect = field.caseSensitive
          ? correct.trim()
          : correct.trim().toLowerCase();

        if (normalizedStudent === normalizedCorrect) {
          return true;
        }
      }
    }

    return false;
  };

  // Handle submission
  const handleSubmit = useCallback(() => {
    const results: GradingResult[] = allFields.map((field) => {
      const answer = answers[field.id] || "";
      const isCorrect = checkAnswer(field, answer);
      const points = field.points || 1;

      return {
        fieldId: field.id,
        isCorrect,
        correctAnswers: field.correctAnswers,
        studentAnswer: answer,
        points,
        earnedPoints: isCorrect ? points : 0,
      };
    });

    setGradingResults(results);
    setIsSubmitted(true);
  }, [allFields, answers]);

  // Reset the form
  const handleReset = useCallback(() => {
    setAnswers({});
    setIsSubmitted(false);
    setGradingResults([]);
  }, []);

  // Calculate score
  const totalPoints = gradingResults.reduce((sum, r) => sum + r.points, 0);
  const earnedPoints = gradingResults.reduce((sum, r) => sum + r.earnedPoints, 0);
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const correctCount = gradingResults.filter((r) => r.isCorrect).length;

  // Get result for a specific field
  const getFieldResult = (fieldId: string) => {
    return gradingResults.find((r) => r.fieldId === fieldId);
  };

  // Check if all required fields are filled
  const requiredFields = allFields.filter((f) => f.required);
  const filledRequiredFields = requiredFields.filter((f) => {
    const answer = answers[f.id];
    return answer && (Array.isArray(answer) ? answer.length > 0 : answer.trim() !== "");
  });
  const canSubmit = requiredFields.length === filledRequiredFields.length;

  if (!worksheet) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isBlankCanvas = worksheet.sourceType === "blank" || !worksheet.originalPdfStorageId;

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
              </div>
              <p className="text-sm text-muted-foreground">
                Preview Mode - {worksheet.fields.length} fields
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSubmitted && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/tools/pdf-editor/${worksheetId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Banner / Score Display */}
      {isSubmitted ? (
        <div
          className={`px-6 py-4 border-b ${
            percentage >= (worksheet.gradingConfig?.passingScore || 70)
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {percentage >= (worksheet.gradingConfig?.passingScore || 70) ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <p className="font-semibold text-lg">
                  {percentage >= (worksheet.gradingConfig?.passingScore || 70)
                    ? "Passed!"
                    : "Keep Practicing"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {correctCount} of {allFields.length} correct ({percentage}%)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {earnedPoints}/{totalPoints}
              </p>
              <p className="text-sm text-muted-foreground">points</p>
            </div>
          </div>
          <Progress value={percentage} className="mt-3" />
        </div>
      ) : (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              Preview Mode - Fill in the fields and submit to check your answers.
            </p>
            <div className="text-sm text-blue-600">
              {filledRequiredFields.length}/{requiredFields.length} required fields filled
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden">
          {isBlankCanvas ? (
            <BlankCanvas zoom={zoom} onZoomChange={setZoom}>
              {currentPageFields.map((field) => {
                const result = getFieldResult(field.id);
                return (
                  <StudentFormField
                    key={field.id}
                    field={field}
                    value={answers[field.id] || ""}
                    onChange={(value) => handleAnswerChange(field.id, value)}
                    zoom={zoom}
                    containerWidth={794 * zoom}
                    containerHeight={1123 * zoom}
                    showResult={isSubmitted}
                    isCorrect={result?.isCorrect}
                  />
                );
              })}
            </BlankCanvas>
          ) : (
            <PDFCanvas
              pdfUrl={pdfUrl || null}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageCountChange={setPageCount}
              zoom={zoom}
              onZoomChange={setZoom}
            >
              {currentPageFields.map((field) => {
                const result = getFieldResult(field.id);
                return (
                  <StudentFormField
                    key={field.id}
                    field={field}
                    value={answers[field.id] || ""}
                    onChange={(value) => handleAnswerChange(field.id, value)}
                    zoom={zoom}
                    containerWidth={794 * zoom}
                    containerHeight={1123 * zoom}
                    showResult={isSubmitted}
                    isCorrect={result?.isCorrect}
                  />
                );
              })}
            </PDFCanvas>
          )}
        </div>

        {/* Right Sidebar - Answers Panel (when submitted) */}
        {isSubmitted && worksheet.gradingConfig?.showCorrectAnswers && (
          <div className="w-80 border-l bg-card overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Answer Key</h3>
              <div className="space-y-3">
                {allFields.map((field, index) => {
                  const result = getFieldResult(field.id);
                  if (!result) return null;

                  return (
                    <div
                      key={field.id}
                      className={`p-3 rounded-lg border ${
                        result.isCorrect
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium">
                          {field.label || `Field ${index + 1}`}
                        </span>
                        {result.isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="mt-2 text-sm">
                        <p className="text-muted-foreground">Your answer:</p>
                        <p
                          className={
                            result.isCorrect ? "text-green-700" : "text-red-700"
                          }
                        >
                          {Array.isArray(result.studentAnswer)
                            ? result.studentAnswer.join(", ")
                            : result.studentAnswer || "(empty)"}
                        </p>
                      </div>
                      {!result.isCorrect && result.correctAnswers.length > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="text-muted-foreground">Correct answer(s):</p>
                          <p className="text-green-700">
                            {result.correctAnswers.join(" or ")}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Submit Button */}
      {!isSubmitted && (
        <div className="border-t bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {requiredFields.length > 0 && (
                <span>
                  {filledRequiredFields.length === requiredFields.length ? (
                    <span className="text-green-600">All required fields filled</span>
                  ) : (
                    `${requiredFields.length - filledRequiredFields.length} required field(s) remaining`
                  )}
                </span>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={!canSubmit} size="lg">
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Answers
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
