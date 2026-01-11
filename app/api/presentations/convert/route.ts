import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex-client";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import JSZip from "jszip";

// Types for slide content
interface SlideContent {
  index: number;
  title?: string;
  bodyText?: string;
  speakerNotes?: string;
  bulletPoints?: string[];
}

// Extract text content from XML, removing tags
function extractTextFromXml(xml: string): string {
  const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
  const texts = textMatches.map((match) => {
    return match.replace(/<a:t[^>]*>/, "").replace(/<\/a:t>/, "");
  });
  return texts.join(" ").trim();
}

// Extract title from slide XML
function extractTitle(slideXml: string): string | undefined {
  // Look for title placeholder
  const spMatches = slideXml.match(/<p:sp[\s\S]*?<\/p:sp>/g) || [];
  for (const sp of spMatches) {
    if (sp.includes('type="title"') || sp.includes('type="ctrTitle"')) {
      const text = extractTextFromXml(sp);
      if (text) return text;
    }
  }
  return undefined;
}

// Extract body text (non-title content)
function extractBodyText(slideXml: string): string {
  let bodyXml = slideXml
    .replace(/<p:sp[\s\S]*?type="(?:title|ctrTitle)"[\s\S]*?<\/p:sp>/g, "")
    .replace(/<p:sp[\s\S]*?type="subTitle"[\s\S]*?<\/p:sp>/g, "");
  return extractTextFromXml(bodyXml);
}

// Parse PPTX and extract per-slide content
async function extractPptxSlideContent(buffer: Buffer): Promise<SlideContent[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slides: SlideContent[] = [];

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

    const slideXml = await zip.file(slideFile)?.async("string");
    if (!slideXml) continue;

    const title = extractTitle(slideXml);
    const bodyText = extractBodyText(slideXml);

    // Try to find speaker notes
    const notesFile = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    let speakerNotes: string | undefined;

    if (zip.files[notesFile]) {
      const notesXml = await zip.file(notesFile)?.async("string");
      if (notesXml) {
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
      title: title || undefined,
      bodyText: bodyText || undefined,
      speakerNotes: speakerNotes || undefined,
    });
  }

  return slides;
}

export const runtime = "nodejs";
export const maxDuration = 300;

interface ConversionResult {
  success: boolean;
  presentationId?: string;
  totalSlides?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ConversionResult>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const presentationName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const fileType = getFileType(file.name);
    if (!fileType) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload PDF, PPTX, or images." },
        { status: 400 }
      );
    }

    const authResult = await auth();
    const token = await authResult.getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ success: false, error: "Failed to get auth token" }, { status: 401 });
    }

    getConvex().setAuth(token);

    const presentationId = await getConvex().mutation(api.presentations.createPresentation, {
      name: presentationName || file.name.replace(/\.[^/.]+$/, ""),
      originalFileName: file.name,
      originalFileType: fileType,
    });

    await getConvex().mutation(api.presentations.updatePresentationStatus, {
      presentationId,
      status: "processing",
    });

    try {
      let slides: Buffer[];

      if (fileType === "pdf") {
        slides = await convertPdfToImages(file);
      } else if (fileType === "image") {
        const buffer = Buffer.from(await file.arrayBuffer());
        slides = [buffer];
      } else if (["pptx", "docx"].includes(fileType)) {
        try {
          // Create temp file for conversion
          const buffer = Buffer.from(await file.arrayBuffer());
          const tempInput = `/tmp/${file.name}`;
          const fs = await import("fs/promises");
          await fs.writeFile(tempInput, buffer);

          // For PPTX files, extract slide content before conversion
          let slideContent: SlideContent[] = [];
          if (fileType === "pptx") {
            try {
              console.log("Extracting PPTX slide content...");
              slideContent = await extractPptxSlideContent(buffer);
              console.log(`Extracted content from ${slideContent.length} slides`);

              // Save slide content to presentation
              if (slideContent.length > 0) {
                await getConvex().mutation(api.presentations.updateSlideContent, {
                  presentationId,
                  slideContent,
                });
              }
            } catch (extractError) {
              console.error("PPTX text extraction failed (continuing with conversion):", extractError);
              // Continue with conversion even if extraction fails
            }
          }

          // Convert to PDF using LibreOffice
          const { exec } = await import("child_process");
          const util = await import("util");
          const execAsync = util.promisify(exec);

          // Use soffice (standard macOS path for LibreOffice)
          const sofficePath = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
          await execAsync(`"${sofficePath}" --headless --convert-to pdf --outdir /tmp "${tempInput}"`);

          // Read the resulting PDF
          const pdfFilename = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
          const pdfPath = `/tmp/${pdfFilename}`;
          const pdfBuffer = await fs.readFile(pdfPath);
          const pdfFile = new File([pdfBuffer], pdfFilename, { type: "application/pdf" });

          // Convert PDF to images using existing function
          slides = await convertPdfToImages(pdfFile);

          // Cleanup
          await fs.unlink(tempInput).catch(() => { });
          await fs.unlink(pdfPath).catch(() => { });

        } catch (e) {
          console.error("LibreOffice conversion failed:", e);
          throw new Error("Failed to convert presentation. Is LibreOffice installed?");
        }
      } else {
        await getConvex().mutation(api.presentations.updatePresentationStatus, {
          presentationId,
          status: "failed",
          errorMessage: `Unsupported file type: ${fileType}`,
        });
        return NextResponse.json({
          success: false,
          error: `${fileType.toUpperCase()} not supported.`,
        });
      }

      for (let i = 0; i < slides.length; i++) {
        const slideBuffer = slides[i];

        const uploadUrl = await getConvex().mutation(api.presentations.generateUploadUrl, {});

        const slideBlob = new Blob([new Uint8Array(slideBuffer)], { type: "image/png" });

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: slideBlob,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload slide ${i + 1}`);
        }

        const { storageId } = await uploadResponse.json();

        await getConvex().mutation(api.presentations.addSlideToPresentation, {
          presentationId,
          slideIndex: i,
          storageId: storageId as Id<"_storage">,
        });
      }

      await getConvex().mutation(api.presentations.finalizePresentation, {
        presentationId,
        totalSlides: slides.length,
      });

      return NextResponse.json({
        success: true,
        presentationId: presentationId as string,
        totalSlides: slides.length,
      });

    } catch (conversionError) {
      console.error("Conversion error:", conversionError);

      await getConvex().mutation(api.presentations.updatePresentationStatus, {
        presentationId,
        status: "failed",
        errorMessage: conversionError instanceof Error ? conversionError.message : "Unknown conversion error",
      });

      return NextResponse.json({
        success: false,
        error: `Failed to convert document: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`,
      });
    }

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getFileType(filename: string): string | null {
  const ext = filename.toLowerCase().split(".").pop();

  switch (ext) {
    case "pdf":
      return "pdf";
    case "pptx":
    case "ppt":
      return "pptx";
    case "docx":
    case "doc":
      return "docx";
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
      return "image";
    default:
      return null;
  }
}

async function convertPdfToImages(file: File): Promise<Buffer[]> {
  const tempId = Math.random().toString(36).substring(7);
  const tempInput = `/tmp/${tempId}.pdf`;
  const outputPrefix = `/tmp/${tempId}`;

  const fs = await import("fs/promises");
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempInput, buffer);

  try {
    const { exec } = await import("child_process");
    const util = await import("util");
    const execAsync = util.promisify(exec);

    // pdftoppm path from brew
    const pdftoppmPath = "/opt/homebrew/bin/pdftoppm";

    // -png: output png format
    // -r 150: resolution 150 DPI (good quality/size balance)
    await execAsync(`"${pdftoppmPath}" -png -r 150 "${tempInput}" "${outputPrefix}"`);

    // Find generated files
    const files = await fs.readdir("/tmp");
    // Filter for files starting with tempId- and ending in .png
    // pdftoppm generates prefix-1.png, prefix-2.png, or prefix-01.png
    const imageFiles = files.filter(f => f.startsWith(`${tempId}-`) && f.endsWith(".png"));

    if (imageFiles.length === 0) {
      // Fallback check: sometimes if single page it might behave differently, but usually always appends number?
      // Actually pdftoppm always appends page number.
      throw new Error("PDF conversion succeeded but no image files were found.");
    }

    // Sort by page number
    // filenames look like: abc-1.png, abc-10.png
    imageFiles.sort((a, b) => {
      // extract number after last dash and before extension
      const getNum = (name: string) => {
        const match = name.match(/-(\d+)\.png$/);
        return match ? parseInt(match[1]) : 0;
      };
      return getNum(a) - getNum(b);
    });

    const images: Buffer[] = [];
    for (const imgFile of imageFiles) {
      const filePath = `/tmp/${imgFile}`;
      images.push(await fs.readFile(filePath));
      // Cleanup image immediately
      await fs.unlink(filePath).catch(() => { });
    }

    return images;

  } catch (e) {
    console.error("pdftoppm conversion failed:", e);
    throw e;
  } finally {
    // Cleanup input pdf
    await fs.unlink(tempInput).catch(() => { });
  }
}
