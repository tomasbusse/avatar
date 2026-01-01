import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import JSZip from "jszip";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface SlideContent {
  index: number;
  title?: string;
  bodyText?: string;
  speakerNotes?: string;
  bulletPoints?: string[];
}

// Extract text content from XML, removing tags
function extractTextFromXml(xml: string): string {
  // Find all <a:t> tags (PowerPoint text elements)
  const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
  const texts = textMatches.map((match) => {
    const content = match.replace(/<a:t[^>]*>/, "").replace(/<\/a:t>/, "");
    return content;
  });

  // Join with spaces, but preserve paragraph breaks
  let result = "";
  let lastWasParagraph = false;

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i].trim();
    if (!text) continue;

    // Check if this is likely a new paragraph (after </a:p>)
    const xmlUpToThis = xml.substring(0, xml.indexOf(texts[i]));
    const paragraphBreaks = (xmlUpToThis.match(/<\/a:p>/g) || []).length;

    if (paragraphBreaks > 0 && !lastWasParagraph && result) {
      result += "\n";
      lastWasParagraph = true;
    }

    result += (result && !lastWasParagraph ? " " : "") + text;
    lastWasParagraph = false;
  }

  return result.trim();
}

// Extract title from slide XML (look for title placeholder)
function extractTitle(slideXml: string): string | undefined {
  // Look for title placeholder type
  const titleMatch = slideXml.match(
    /<p:ph[^>]*type="(?:title|ctrTitle)"[^>]*>[\s\S]*?<a:t[^>]*>([^<]+)<\/a:t>/
  );
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Alternative: look for the first text frame that's likely a title
  const spMatches = slideXml.match(/<p:sp[\s\S]*?<\/p:sp>/g) || [];
  for (const sp of spMatches) {
    if (sp.includes('type="title"') || sp.includes('type="ctrTitle"')) {
      const text = extractTextFromXml(sp);
      if (text) return text;
    }
  }

  // Last resort: first large text element
  const firstText = slideXml.match(/<a:t[^>]*>([^<]{2,50})<\/a:t>/);
  if (firstText) {
    return firstText[1].trim();
  }

  return undefined;
}

// Extract body text (non-title content)
function extractBodyText(slideXml: string): string {
  // Remove title placeholders first
  let bodyXml = slideXml
    .replace(/<p:sp[\s\S]*?type="(?:title|ctrTitle)"[\s\S]*?<\/p:sp>/g, "")
    .replace(/<p:sp[\s\S]*?type="subTitle"[\s\S]*?<\/p:sp>/g, "");

  return extractTextFromXml(bodyXml);
}

// Extract bullet points
function extractBulletPoints(slideXml: string): string[] {
  const bullets: string[] = [];

  // Find paragraph elements with bullet markers
  const paragraphs = slideXml.match(/<a:p[\s\S]*?<\/a:p>/g) || [];

  for (const p of paragraphs) {
    // Check for bullet marker
    if (p.includes("<a:buChar") || p.includes("<a:buAutoNum")) {
      const text = extractTextFromXml(p);
      if (text && text.length > 0) {
        bullets.push(text);
      }
    }
  }

  return bullets;
}

// Parse PPTX and extract per-slide content
async function extractPptxSlideContent(
  buffer: ArrayBuffer
): Promise<SlideContent[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slides: SlideContent[] = [];

  // Find all slide files
  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0");
      return numA - numB;
    });

  for (let i = 0; i < slideFiles.length; i++) {
    const slideFile = slideFiles[i];
    const slideNum = parseInt(slideFile.match(/slide(\d+)\.xml$/)?.[1] || "1");

    // Read slide XML
    const slideXml = await zip.file(slideFile)?.async("string");
    if (!slideXml) continue;

    // Extract slide content
    const title = extractTitle(slideXml);
    const bodyText = extractBodyText(slideXml);
    const bulletPoints = extractBulletPoints(slideXml);

    // Try to find corresponding notes slide
    const notesFile = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    let speakerNotes: string | undefined;

    if (zip.files[notesFile]) {
      const notesXml = await zip.file(notesFile)?.async("string");
      if (notesXml) {
        // Notes are in the second text frame typically
        // Remove the slide text that gets mirrored in notes
        const notesBodies = notesXml.match(/<p:txBody[\s\S]*?<\/p:txBody>/g) || [];
        if (notesBodies.length >= 2) {
          speakerNotes = extractTextFromXml(notesBodies[1]);
        } else if (notesBodies.length === 1) {
          speakerNotes = extractTextFromXml(notesBodies[0]);
        }
      }
    }

    slides.push({
      index: i,
      title,
      bodyText: bodyText || undefined,
      speakerNotes: speakerNotes || undefined,
      bulletPoints: bulletPoints.length > 0 ? bulletPoints : undefined,
    });
  }

  return slides;
}

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

// Export the extraction function for use in the convert route
export { extractPptxSlideContent };
export type { SlideContent };
