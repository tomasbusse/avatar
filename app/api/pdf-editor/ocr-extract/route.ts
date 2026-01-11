import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const OCR_SERVER_URL = process.env.OCR_SERVER_URL || "http://localhost:8765";

/**
 * Extract text from PDF using OCR server
 */
async function extractWithOcr(fileUrl: string): Promise<{ text: string; wordCount: number }> {
  console.log("📸 Calling OCR server for PDF...");
  console.log("📸 File URL:", fileUrl);
  console.log("📸 OCR Server:", `${OCR_SERVER_URL}/ocr/url`);

  const formData = new FormData();
  formData.append("url", fileUrl);

  const response = await fetch(`${OCR_SERVER_URL}/ocr/url`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OCR server error response:", errorText);
    throw new Error(`OCR server error: ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ OCR extracted ${result.wordCount} words from PDF`);
  console.log("📸 OCR result preview:", result.text?.substring(0, 200) || "(empty)");

  return {
    text: result.text || "",
    wordCount: result.wordCount || 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { worksheetId, storageId } = await request.json();

    console.log("🔄 OCR Extraction started for worksheet:", worksheetId);

    if (!worksheetId || !storageId) {
      return NextResponse.json(
        { error: "Missing worksheetId or storageId" },
        { status: 400 }
      );
    }

    // Update processing stage to ocr_extracting
    await convex.mutation(api.pdfWorksheets.updateProcessingStage, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
      processingStage: "ocr_extracting",
    });

    // Get file URL from Convex storage
    const fileUrl = await convex.query(api.pdfWorksheets.getStorageUrl, {
      storageId: storageId as Id<"_storage">,
    });

    if (!fileUrl) {
      await convex.mutation(api.pdfWorksheets.updateProcessingStage, {
        worksheetId: worksheetId as Id<"pdfWorksheets">,
        processingStage: "failed",
        processingError: "File not found in storage",
      });
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 }
      );
    }

    console.log("📥 File URL obtained, starting OCR extraction...");

    // Extract text with OCR
    let ocrResult: { text: string; wordCount: number };
    try {
      ocrResult = await extractWithOcr(fileUrl);
    } catch (e) {
      console.error("OCR extraction failed:", e);
      await convex.mutation(api.pdfWorksheets.updateProcessingStage, {
        worksheetId: worksheetId as Id<"pdfWorksheets">,
        processingStage: "failed",
        processingError: "OCR extraction failed. Is the OCR server running?",
      });
      return NextResponse.json(
        { error: "OCR extraction failed. Is the OCR server running at " + OCR_SERVER_URL + "?" },
        { status: 500 }
      );
    }

    if (!ocrResult.text || ocrResult.text.trim().length < 10) {
      await convex.mutation(api.pdfWorksheets.updateProcessingStage, {
        worksheetId: worksheetId as Id<"pdfWorksheets">,
        processingStage: "failed",
        processingError: "OCR extracted no text from document",
      });
      return NextResponse.json(
        { error: "OCR extracted no text from document. Is the PDF readable?" },
        { status: 400 }
      );
    }

    // Save OCR text to worksheet
    await convex.mutation(api.pdfWorksheets.saveOcrText, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
      ocrText: ocrResult.text,
    });

    console.log("✅ OCR extraction complete:", {
      worksheetId,
      wordCount: ocrResult.wordCount,
    });

    return NextResponse.json({
      success: true,
      text: ocrResult.text,
      wordCount: ocrResult.wordCount,
      usedOcr: true,
    });
  } catch (error) {
    console.error("OCR extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OCR extraction failed" },
      { status: 500 }
    );
  }
}
