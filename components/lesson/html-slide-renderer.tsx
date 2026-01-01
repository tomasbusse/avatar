"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

interface HtmlSlideRendererProps {
  html: string;
  slideIndex: number;
  className?: string;
  onScreenshotCapture?: (imageBase64: string, slideIndex: number) => void;
  captureScreenshot?: boolean; // When true, triggers a screenshot capture
}

/**
 * HtmlSlideRenderer - Renders self-contained HTML slides in an iframe
 *
 * Features:
 * - Sandboxed iframe for security
 * - 16:9 aspect ratio maintained
 * - Screenshot capture via html2canvas
 * - Responsive scaling
 */
export function HtmlSlideRenderer({
  html,
  slideIndex,
  className,
  onScreenshotCapture,
  captureScreenshot = false,
}: HtmlSlideRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Capture screenshot of the rendered slide
  const captureSlideScreenshot = useCallback(async () => {
    if (!iframeRef.current || !onScreenshotCapture) return;

    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc?.body) {
        console.warn("Cannot capture screenshot: iframe body not accessible");
        return;
      }

      // Get the slide element or use body
      const slideElement = iframeDoc.querySelector(".slide") || iframeDoc.body;

      // Use html2canvas to capture the slide
      const canvas = await html2canvas(slideElement as HTMLElement, {
        backgroundColor: "#ffffff",
        scale: 1, // Use 1x scale for faster processing (avatar doesn't need high-res)
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 960,  // Standard 16:9 at 960x540
        height: 540,
      });

      // Convert to base64 (use JPEG for smaller size)
      const base64 = canvas.toDataURL("image/jpeg", 0.85);

      // Remove the data:image/jpeg;base64, prefix
      const base64Data = base64.replace(/^data:image\/jpeg;base64,/, "");

      onScreenshotCapture(base64Data, slideIndex);
    } catch (error) {
      console.error("Failed to capture slide screenshot:", error);
    }
  }, [slideIndex, onScreenshotCapture]);

  // Trigger screenshot when captureScreenshot prop changes to true
  useEffect(() => {
    if (captureScreenshot && isLoaded) {
      // Small delay to ensure iframe content is fully rendered
      const timer = setTimeout(() => {
        captureSlideScreenshot();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [captureScreenshot, isLoaded, captureSlideScreenshot]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoaded(true);
  };

  // Create blob URL for the HTML content
  const blobUrl = useRef<string | null>(null);

  useEffect(() => {
    // Create blob URL for the HTML
    const blob = new Blob([html], { type: "text/html" });
    blobUrl.current = URL.createObjectURL(blob);

    // Set iframe source
    if (iframeRef.current) {
      iframeRef.current.src = blobUrl.current;
    }

    // Cleanup blob URL on unmount or when HTML changes
    return () => {
      if (blobUrl.current) {
        URL.revokeObjectURL(blobUrl.current);
      }
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden bg-white rounded-lg shadow-lg",
        // 16:9 aspect ratio
        "aspect-video",
        className
      )}
    >
      <iframe
        ref={iframeRef}
        title={`Slide ${slideIndex + 1}`}
        onLoad={handleIframeLoad}
        sandbox="allow-same-origin" // Needed for html2canvas to work
        className="absolute inset-0 w-full h-full border-0"
        style={{
          // Scale iframe content to fit container
          transformOrigin: "top left",
        }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <span className="text-muted-foreground text-sm">Loading slide...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage screenshot capture timing
 */
export function useSlideScreenshot(
  onCapture: (imageBase64: string, slideIndex: number) => void
) {
  const [shouldCapture, setShouldCapture] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const requestCapture = useCallback((slideIndex: number) => {
    setCurrentIndex(slideIndex);
    setShouldCapture(true);
    // Reset after a short delay
    setTimeout(() => setShouldCapture(false), 200);
  }, []);

  const handleCapture = useCallback(
    (imageBase64: string, slideIndex: number) => {
      onCapture(imageBase64, slideIndex);
    },
    [onCapture]
  );

  return {
    shouldCapture,
    currentIndex,
    requestCapture,
    handleCapture,
  };
}
