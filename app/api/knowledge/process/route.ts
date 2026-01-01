import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { extractText, getDocumentProxy } from "unpdf";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Clean up and structure OCR text using AI
async function cleanupWithAI(rawText: string, documentType: string): Promise<string> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    console.log("No OPENROUTER_API_KEY, skipping AI cleanup");
    return rawText;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://beethoven.app",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          {
            role: "system",
            content: `You are a document cleanup assistant. Your task is to take messy OCR-extracted text and convert it into clean, well-structured Markdown.

Rules:
1. Fix broken words (e.g., "anim als" → "animals", "hwnans" → "humans")
2. Preserve ALL content - do not summarize or remove anything
3. Add proper Markdown structure (headings, lists, paragraphs)
4. Fix obvious OCR errors while preserving meaning
5. Keep exercises, questions, and numbered items intact
6. Use ## for main sections, ### for subsections
7. Use proper formatting for exercises (numbered lists, blanks as _____)
8. Output ONLY the cleaned markdown, no explanations`
          },
          {
            role: "user",
            content: `Clean up this OCR-extracted ${documentType} text and convert to well-structured Markdown:\n\n${rawText}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("AI cleanup failed:", response.status);
      return rawText;
    }

    const data = await response.json();
    const cleanedText = data.choices?.[0]?.message?.content;

    if (cleanedText && cleanedText.length > rawText.length * 0.5) {
      console.log(`AI cleanup: ${rawText.length} chars → ${cleanedText.length} chars`);
      return cleanedText;
    }

    return rawText;
  } catch (error) {
    console.error("AI cleanup error:", error);
    return rawText;
  }
}

// OCR Server URL (Python FastAPI server)
const OCR_SERVER_URL = process.env.OCR_SERVER_URL || "http://localhost:8765";

// Check if OCR server is available
async function isOcrServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OCR_SERVER_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Call OCR server for scanned documents
async function extractWithOcr(fileUrl: string): Promise<{ text: string; usedOcr: boolean }> {
  try {
    const formData = new FormData();
    formData.append("url", fileUrl);

    const response = await fetch(`${OCR_SERVER_URL}/ocr/url`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR server error: ${response.status}`);
    }

    const result = await response.json();
    return {
      text: result.text || "",
      usedOcr: result.usedOcr || false,
    };
  } catch (error) {
    console.error("OCR extraction error:", error);
    throw new Error("Failed to extract text with OCR");
  }
}

// PDF text extraction using unpdf (Next.js compatible)
async function extractPdfText(buffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return {
      text,
      pageCount: pdf.numPages,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// PowerPoint extraction using officeparser
async function extractPptxText(buffer: ArrayBuffer): Promise<{ text: string; slideCount: number }> {
  try {
    const officeparser = await import("officeparser");
    const text = await officeparser.parseOfficeAsync(Buffer.from(buffer));
    // Estimate slide count from content breaks
    const slideCount = (text.match(/\n\n+/g) || []).length + 1;
    return { text, slideCount: Math.min(slideCount, 100) };
  } catch (error) {
    console.error("PPTX extraction error:", error);
    throw new Error("Failed to extract text from PowerPoint");
  }
}

// Convert text to markdown format
function textToMarkdown(text: string, title: string, metadata: any): string {
  const lines = text.split("\n").filter((line) => line.trim());

  let markdown = `# ${title}\n\n`;

  if (metadata.pageCount) {
    markdown += `*Source: PDF document with ${metadata.pageCount} pages*\n\n`;
  } else if (metadata.slideCount) {
    markdown += `*Source: PowerPoint presentation with ${metadata.slideCount} slides*\n\n`;
  }

  markdown += "---\n\n";

  // Process text into paragraphs
  let currentParagraph = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect headers (short lines followed by longer content)
    if (trimmed.length < 60 && !trimmed.endsWith(".") && !trimmed.endsWith(",")) {
      if (currentParagraph) {
        markdown += currentParagraph + "\n\n";
        currentParagraph = "";
      }
      markdown += `## ${trimmed}\n\n`;
    } else {
      currentParagraph += (currentParagraph ? " " : "") + trimmed;

      // Break paragraphs at sentence endings
      if (trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?")) {
        markdown += currentParagraph + "\n\n";
        currentParagraph = "";
      }
    }
  }

  if (currentParagraph) {
    markdown += currentParagraph + "\n";
  }

  return markdown;
}

export async function POST(request: NextRequest) {
  try {
    const { contentId, storageId, fileType } = await request.json();

    if (!contentId || !storageId) {
      return NextResponse.json(
        { error: "Missing contentId or storageId" },
        { status: 400 }
      );
    }

    // Get file URL from Convex storage
    const fileUrl = await convex.query(api.knowledgeBases.getFileUrl, {
      storageId: storageId as Id<"_storage">,
    });

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 }
      );
    }

    // Download the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const buffer = await response.arrayBuffer();
    let extractedText = "";
    let metadata: any = {};

    // Extract text based on file type
    switch (fileType) {
      case "pdf": {
        const result = await extractPdfText(buffer);
        extractedText = result.text;
        metadata.pageCount = result.pageCount;

        // If very little text extracted, try OCR (likely scanned PDF)
        const wordCount = extractedText.trim().split(/\s+/).length;
        if (wordCount < 50 && metadata.pageCount > 0) {
          console.log(`PDF has only ${wordCount} words, attempting OCR...`);

          const ocrAvailable = await isOcrServerAvailable();
          if (ocrAvailable) {
            try {
              const ocrResult = await extractWithOcr(fileUrl);
              if (ocrResult.text && ocrResult.text.split(/\s+/).length > wordCount) {
                // Clean up OCR text with AI
                console.log("Cleaning up OCR text with AI...");
                extractedText = await cleanupWithAI(ocrResult.text, "PDF document");
                metadata.usedOcr = true;
                metadata.aiCleaned = true;
                console.log(`OCR extracted and cleaned: ${extractedText.split(/\s+/).length} words`);
              }
            } catch (e) {
              console.error("OCR fallback failed:", e);
              // Continue with original text
            }
          } else {
            console.log("OCR server not available, using basic extraction");
          }
        }
        break;
      }
      case "powerpoint": {
        const result = await extractPptxText(buffer);
        extractedText = result.text;
        metadata.slideCount = result.slideCount;
        break;
      }
      case "markdown":
      case "text": {
        extractedText = new TextDecoder().decode(buffer);
        break;
      }
      default:
        return NextResponse.json(
          { error: `Unsupported file type: ${fileType}` },
          { status: 400 }
        );
    }

    // Get content record for title
    const content = await convex.query(api.knowledgeBases.getContentBySource, {
      sourceId: "", // We'll get it another way
    });

    // Convert to markdown
    const markdown = fileType === "markdown"
      ? extractedText
      : textToMarkdown(extractedText, "Extracted Content", metadata);

    metadata.wordCount = markdown.split(/\s+/).length;

    // Update content in Convex
    await convex.mutation(api.knowledgeBases.updateContent, {
      contentId: contentId as Id<"knowledgeContent">,
      content: markdown,
      metadata,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      wordCount: metadata.wordCount,
      metadata,
    });
  } catch (error) {
    console.error("Document processing error:", error);

    // Try to update status to failed using the contentId we already parsed
    try {
      const body = await request.clone().json();
      if (body.contentId) {
        await convex.mutation(api.knowledgeBases.updateContent, {
          contentId: body.contentId as Id<"knowledgeContent">,
          content: "",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (e) {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
