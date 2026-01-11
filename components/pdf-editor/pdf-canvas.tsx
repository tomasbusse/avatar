"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

// PDF.js version to use from CDN
const PDFJS_VERSION = "4.0.379";

// Type definitions for PDF.js loaded from CDN
interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
  destroy(): Promise<void>;
}

interface PDFPageProxy {
  getViewport(options: { scale: number }): PDFPageViewport;
  render(options: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport }): { promise: Promise<void> };
}

interface PDFPageViewport {
  width: number;
  height: number;
}

interface PDFJSLib {
  getDocument(src: string | { url: string }): { promise: Promise<PDFDocumentProxy> };
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
}

// Global reference to pdfjs loaded from CDN
let pdfjsLib: PDFJSLib | null = null;
let pdfjsLoadPromise: Promise<PDFJSLib> | null = null;

/**
 * Load PDF.js from CDN - bypasses webpack bundling issues
 */
async function getPdfjs(): Promise<PDFJSLib> {
  // Return cached instance
  if (pdfjsLib) return pdfjsLib;

  // Return existing load promise to avoid duplicate loads
  if (pdfjsLoadPromise) return pdfjsLoadPromise;

  pdfjsLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded (e.g., from another component)
    if ((window as any).pdfjsLib) {
      pdfjsLib = (window as any).pdfjsLib;
      resolve(pdfjsLib!);
      return;
    }

    // Load PDF.js from CDN
    const script = document.createElement("script");
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    script.async = true;

    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        // Set worker source
        lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
        pdfjsLib = lib;
        resolve(lib);
      } else {
        reject(new Error("PDF.js failed to initialize"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load PDF.js from CDN"));
    };

    document.head.appendChild(script);
  });

  return pdfjsLoadPromise;
}

interface PDFCanvasProps {
  pdfUrl: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageCountChange: (count: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  children?: React.ReactNode; // For overlaying form fields
}

export function PDFCanvas({
  pdfUrl,
  currentPage,
  onPageChange,
  onPageCountChange,
  zoom,
  onZoomChange,
  children,
}: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setPageCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const pdfjs = await getPdfjs();
        const doc = await pdfjs.getDocument(pdfUrl).promise;
        setPdfDoc(doc);
        setPageCount(doc.numPages);
        onPageCountChange(doc.numPages);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF");
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      // Cleanup
    };
  }, [pdfUrl, onPageCountChange]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;

        // Calculate viewport with zoom
        const viewport = page.getViewport({ scale: zoom });

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Store page dimensions for field positioning
        setPageDimensions({
          width: viewport.width,
          height: viewport.height,
        });

        // Render page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
        setError("Failed to render page");
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < pageCount) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, pageCount, onPageChange]);

  const handleZoomIn = useCallback(() => {
    onZoomChange(Math.min(zoom + 0.25, 3));
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(zoom - 0.25, 0.5));
  }, [zoom, onZoomChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No PDF loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[80px] text-center">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/50 flex items-center justify-center p-4"
      >
        <div className="relative shadow-lg">
          <canvas ref={canvasRef} className="bg-white" />
          {/* Overlay container for form fields */}
          <div
            className="absolute top-0 left-0"
            style={{
              width: pageDimensions.width,
              height: pageDimensions.height,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Blank canvas for creating from scratch
export function BlankCanvas({
  zoom,
  onZoomChange,
  children,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  children?: React.ReactNode;
}) {
  // A4 dimensions at 96 DPI
  const A4_WIDTH = 210 * (96 / 25.4); // ~794px
  const A4_HEIGHT = 297 * (96 / 25.4); // ~1123px

  const handleZoomIn = useCallback(() => {
    onZoomChange(Math.min(zoom + 0.25, 3));
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(zoom - 0.25, 0.5));
  }, [zoom, onZoomChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Blank A4 Canvas</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto bg-muted/50 flex items-center justify-center p-4">
        <div
          className="relative shadow-lg bg-white"
          style={{
            width: A4_WIDTH * zoom,
            height: A4_HEIGHT * zoom,
          }}
        >
          {/* Grid lines for alignment */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, #ccc 1px, transparent 1px),
                linear-gradient(to bottom, #ccc 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            }}
          />
          {/* Overlay container for form fields */}
          <div
            className="absolute top-0 left-0"
            style={{
              width: A4_WIDTH * zoom,
              height: A4_HEIGHT * zoom,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
