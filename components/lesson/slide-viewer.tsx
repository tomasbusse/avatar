"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut, StickyNote } from "lucide-react";
import { HtmlSlideRenderer } from "./html-slide-renderer";

interface Slide {
  index: number;
  storageId: string;
  url?: string;
  width?: number;
  height?: number;
}

interface SlideContent {
  index: number;
  title?: string;
  bodyText?: string;
  speakerNotes?: string;
  bulletPoints?: string[];
}

// HTML slide type from knowledge content
export interface HtmlSlide {
  index: number;
  html: string;
  title?: string;
  type: "title" | "objectives" | "content" | "grammar" | "vocabulary" | "exercise" | "summary";
  speakerNotes?: string;
  teachingPrompt?: string;
}

interface SlideViewerProps {
  slides: Slide[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
  slideContent?: SlideContent[];
  showSpeakerNotes?: boolean;
  navigationDisabled?: boolean;
  // New props for HTML slide mode
  htmlSlides?: HtmlSlide[];
  renderMode?: "image" | "html";
  onSlideScreenshot?: (imageBase64: string, slideIndex: number) => void;
}

export function SlideViewer({
  slides,
  currentIndex,
  onIndexChange,
  className,
  slideContent,
  showSpeakerNotes,
  navigationDisabled,
  htmlSlides,
  renderMode = "image",
  onSlideScreenshot,
}: SlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [captureScreenshot, setCaptureScreenshot] = useState(false);
  const prevIndexRef = useRef(currentIndex);

  // Determine which slides to use based on render mode
  const isHtmlMode = renderMode === "html" && htmlSlides && htmlSlides.length > 0;
  const currentSlide = slides[currentIndex];
  const currentHtmlSlide = isHtmlMode ? htmlSlides[currentIndex] : undefined;
  const totalSlides = isHtmlMode ? htmlSlides.length : slides.length;

  // Get content for speaker notes (HTML slides have built-in notes)
  const currentContent = isHtmlMode && currentHtmlSlide
    ? {
        index: currentIndex,
        title: currentHtmlSlide.title,
        speakerNotes: currentHtmlSlide.speakerNotes,
        teachingPrompt: currentHtmlSlide.teachingPrompt,
      }
    : slideContent?.find(s => s.index === currentIndex);

  // Trigger screenshot when slide changes OR on initial load (for avatar vision)
  const initialCaptureRef = useRef(false);
  useEffect(() => {
    if (!onSlideScreenshot || !isHtmlMode) return;

    // Capture on initial load OR when slide changes
    const shouldCapture = !initialCaptureRef.current || prevIndexRef.current !== currentIndex;

    if (shouldCapture) {
      console.log(`[SlideViewer] Triggering screenshot capture for slide ${currentIndex} (initial: ${!initialCaptureRef.current})`);
      initialCaptureRef.current = true;
      prevIndexRef.current = currentIndex;

      // Small delay to ensure slide is rendered
      const timer = setTimeout(() => {
        setCaptureScreenshot(true);
        setTimeout(() => setCaptureScreenshot(false), 200);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, onSlideScreenshot, isHtmlMode]);

  // Handle screenshot capture
  const handleScreenshotCapture = useCallback(
    (imageBase64: string, slideIndex: number) => {
      if (onSlideScreenshot) {
        onSlideScreenshot(imageBase64, slideIndex);
      }
    },
    [onSlideScreenshot]
  );

  const goToPrevious = useCallback(() => {
    if (navigationDisabled || currentIndex === 0) return;
    onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange, navigationDisabled]);

  const goToNext = useCallback(() => {
    if (navigationDisabled || currentIndex >= totalSlides - 1) return;
    onIndexChange(currentIndex + 1);
  }, [currentIndex, totalSlides, onIndexChange, navigationDisabled]);

  // Keyboard navigation
  useEffect(() => {
    if (navigationDisabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "Home") {
        e.preventDefault();
        onIndexChange(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onIndexChange(totalSlides - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, onIndexChange, totalSlides, navigationDisabled]);

  // Check if we have slides to show
  const hasSlides = isHtmlMode ? htmlSlides.length > 0 : slides.length > 0;

  if (!hasSlides) {
    return (
      <div className="w-full max-w-5xl aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">No slides available</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-5xl flex flex-col gap-4 ${className || ""}`}>
      {/* Main slide display */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
      >
        {isHtmlMode && currentHtmlSlide ? (
          /* HTML Slide Mode */
          <HtmlSlideRenderer
            html={currentHtmlSlide.html}
            slideIndex={currentIndex}
            onScreenshotCapture={handleScreenshotCapture}
            captureScreenshot={captureScreenshot}
            className="w-full h-full"
          />
        ) : currentSlide?.url ? (
          /* Image Slide Mode */
          <img
            src={currentSlide.url}
            alt={`Slide ${currentIndex + 1}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Loading slide...</p>
          </div>
        )}

        {/* Navigation overlay - left side */}
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="absolute left-0 top-0 bottom-0 w-24 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-0 bg-gradient-to-r from-black/30 to-transparent"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-10 h-10 text-white drop-shadow-lg" />
        </button>

        {/* Navigation overlay - right side */}
        <button
          onClick={goToNext}
          disabled={currentIndex === totalSlides - 1}
          className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-0 bg-gradient-to-l from-black/30 to-transparent"
          aria-label="Next slide"
        >
          <ChevronRight className="w-10 h-10 text-white drop-shadow-lg" />
        </button>

        {/* Slide counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
          {currentIndex + 1} / {totalSlides}
        </div>

        {/* Navigation disabled indicator */}
        {navigationDisabled && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
            Avatar Controlled
          </div>
        )}
      </div>

      {/* Speaker Notes Panel */}
      {showSpeakerNotes && currentContent && (currentContent.speakerNotes || currentContent.title || (currentContent as SlideContent).bodyText || (currentContent as { teachingPrompt?: string }).teachingPrompt) && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="w-4 h-4 text-amber-600" />
            <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-200">
              {isHtmlMode ? "Teaching Notes" : "Speaker Notes"}
            </h4>
            {isHtmlMode && currentHtmlSlide && (
              <span className="text-xs bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded">
                {currentHtmlSlide.type}
              </span>
            )}
          </div>
          {currentContent.title && (
            <p className="text-sm font-medium mb-2 text-amber-900 dark:text-amber-100">
              {currentContent.title}
            </p>
          )}
          {/* Teaching prompt for HTML slides */}
          {isHtmlMode && (currentContent as { teachingPrompt?: string }).teachingPrompt && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Teaching Prompt:</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {(currentContent as { teachingPrompt?: string }).teachingPrompt}
              </p>
            </div>
          )}
          {currentContent.speakerNotes && (
            <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">
              {currentContent.speakerNotes}
            </p>
          )}
          {!currentContent.speakerNotes && (currentContent as SlideContent).bodyText && (
            <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">
              {(currentContent as SlideContent).bodyText}
            </p>
          )}
        </Card>
      )}

      {/* Thumbnail strip */}
      {totalSlides > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {isHtmlMode ? (
            /* HTML slide thumbnails - show type badges */
            htmlSlides.map((slide, index) => (
              <button
                key={`html-${index}`}
                onClick={() => onIndexChange(index)}
                className={`flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent hover:border-muted-foreground/50"
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[10px] font-medium text-primary/80">{slide.type}</span>
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                </div>
              </button>
            ))
          ) : (
            /* Image slide thumbnails */
            slides.map((slide, index) => (
              <button
                key={slide.storageId}
                onClick={() => onIndexChange(index)}
                className={`flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent hover:border-muted-foreground/50"
                }`}
              >
                {slide.url ? (
                  <img
                    src={slide.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          disabled={navigationDisabled || currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {/* Quick page jump */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Slide</span>
          <select
            value={currentIndex}
            onChange={(e) => !navigationDisabled && onIndexChange(Number(e.target.value))}
            disabled={navigationDisabled}
            className="bg-background border rounded px-2 py-1 text-sm disabled:opacity-50"
          >
            {slides.map((_, index) => (
              <option key={index} value={index}>
                {index + 1}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">of {totalSlides}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={navigationDisabled || currentIndex === totalSlides - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
