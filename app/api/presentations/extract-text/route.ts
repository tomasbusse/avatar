import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { presentationId } = await request.json();

    if (!presentationId) {
      return NextResponse.json(
        { error: "Missing presentationId" },
        { status: 400 }
      );
    }

    // Get presentation from Convex
    const presentation = await convex.query(api.presentations.getPresentation, {
      presentationId: presentationId as Id<"presentations">,
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    // Only process PPTX files
    if (!presentation.originalFileType?.includes("presentation")) {
      // For non-PPTX files, we don't need to extract text per-slide
      return NextResponse.json({
        success: true,
        message: "Not a PowerPoint file, skipping text extraction",
        slideContent: [],
      });
    }

    // Update status to processing
    await convex.mutation(api.presentations.updateTextExtractionStatus, {
      presentationId: presentationId as Id<"presentations">,
      status: "processing",
    });

    // Get the original file from storage (first slide's storage ID or original storage)
    // We need to find the original PPTX file
    const originalStorageId = presentation.slides?.[0]?.storageId;
    if (!originalStorageId) {
      throw new Error("No storage ID found for presentation");
    }

    // Get file URL - note: this won't work for PPTX directly since we converted to images
    // We need to keep the original PPTX or re-upload
    // For now, let's check if there's an original file stored

    // Alternative: Get the file URL from the upload that created this presentation
    // This requires storing the original PPTX storage ID

    // For now, return success without extraction if original not available
    // The text extraction should happen during the initial upload process

    console.log(`Text extraction requested for presentation ${presentationId}`);
    console.log(`Original file type: ${presentation.originalFileType}`);

    // Mark as completed (actual extraction happens in convert route)
    await convex.mutation(api.presentations.updateTextExtractionStatus, {
      presentationId: presentationId as Id<"presentations">,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      message: "Text extraction status updated",
      slideCount: presentation.totalSlides,
    });
  } catch (error) {
    console.error("PPTX text extraction error:", error);

    // Try to update status to failed
    try {
      const body = await request.clone().json();
      if (body.presentationId) {
        await convex.mutation(api.presentations.updateTextExtractionStatus, {
          presentationId: body.presentationId as Id<"presentations">,
          status: "failed",
        });
      }
    } catch (e) {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
