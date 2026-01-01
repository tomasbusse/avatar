"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface DocumentUploadProps {
  sessionId: string;
  onComplete: (presentationId: string) => void;
  onClose: () => void;
}

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export function DocumentUpload({
  sessionId,
  onComplete,
  onClose,
}: DocumentUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  const acceptedExtensions = ".pdf,.pptx,.png,.jpg,.jpeg,.webp";

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!acceptedTypes.includes(file.type)) {
      return "Unsupported file type. Please upload PDF, PPTX, or images.";
    }

    if (file.size > maxSize) {
      return "File too large. Maximum size is 50MB.";
    }

    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", selectedFile.name.replace(/\.[^/.]+$/, ""));
      formData.append("sessionId", sessionId);

      setProgress(30);
      setStatus("processing");

      const response = await fetch("/api/presentations/convert", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setProgress(100);
      setStatus("success");

      // Wait a moment to show success, then complete
      setTimeout(() => {
        onComplete(result.presentationId);
      }, 1000);

    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-orange-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6 relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-8 w-8 p-0"
          onClick={onClose}
          disabled={status === "uploading" || status === "processing"}
        >
          <X className="w-4 h-4" />
        </Button>

        <h2 className="text-xl font-semibold mb-4">Upload Presentation</h2>

        {/* Drop zone */}
        {status === "idle" && !selectedFile && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
              }
            `}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">
              {dragActive ? "Drop file here" : "Drag & drop your file"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: PDF, PPTX, PNG, JPG, WebP (max 50MB)
            </p>
          </div>
        )}

        {/* File selected */}
        {status === "idle" && selectedFile && (
          <div className="border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-4">
              {getFileIcon(selectedFile)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Progress */}
        {(status === "uploading" || status === "processing") && (
          <div className="py-8">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
            <p className="text-center font-medium mb-2">
              {status === "uploading" ? "Uploading..." : "Processing document..."}
            </p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {status === "processing"
                ? "Converting pages to images..."
                : "This may take a moment for large files"}
            </p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium text-green-600">Upload Complete!</p>
            <p className="text-sm text-muted-foreground">
              Your presentation is ready
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Upload Failed</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {status === "idle" && (
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={!selectedFile}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={resetUpload}>
              Try Again
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedExtensions}
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>
    </div>
  );
}
