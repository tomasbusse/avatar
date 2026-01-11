import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-client";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import puppeteer from "puppeteer";
import {
  WorksheetContent,
  worksheetToHtml,
  calculateTotalPoints,
} from "@/lib/types/worksheet-content";

export async function POST(request: NextRequest) {
  try {
    const { worksheetId, includeAnswerKey } = await request.json();

    if (!worksheetId) {
      return NextResponse.json(
        { error: "Missing worksheetId" },
        { status: 400 }
      );
    }

    console.log("📄 PDF Generation started for worksheet:", worksheetId);

    // Update processing stage
    await getConvex().mutation(api.pdfWorksheets.updateProcessingStage, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
      processingStage: "generating_pdf",
    });

    // Get worksheet from Convex
    const worksheet = await getConvex().query(api.pdfWorksheets.getWorksheet, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
    });

    if (!worksheet) {
      return NextResponse.json(
        { error: "Worksheet not found" },
        { status: 404 }
      );
    }

    if (!worksheet.jsonContent) {
      return NextResponse.json(
        { error: "No structured content available for PDF generation" },
        { status: 400 }
      );
    }

    const worksheetContent = worksheet.jsonContent as WorksheetContent;

    // Calculate total points and update footer
    const totalPoints = calculateTotalPoints(worksheetContent);
    if (worksheetContent.content.footer) {
      worksheetContent.content.footer.totalPoints = totalPoints;
    }

    // Generate HTML from structured content
    console.log("🎨 Generating HTML from worksheet content...");
    let html = worksheetToHtml(worksheetContent);

    // If answer key is requested, add it to the HTML
    if (includeAnswerKey) {
      html = addAnswerKeyToHtml(html, worksheetContent);
    }

    // Render to PDF with Puppeteer
    console.log("🖨️ Rendering PDF with Puppeteer...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pageSize = worksheetContent.design?.pageSize || "A4";
    const margins = worksheetContent.design?.margins || {
      top: 20,
      right: 15,
      bottom: 25,
      left: 15,
    };

    const pdfBuffer = await page.pdf({
      format: pageSize === "letter" ? "Letter" : "A4",
      printBackground: true,
      margin: {
        top: `${margins.top}mm`,
        bottom: `${margins.bottom}mm`,
        left: `${margins.left}mm`,
        right: `${margins.right}mm`,
      },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #6b7280; padding: 10px 0;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    await browser.close();

    console.log(`✅ PDF generated: ${pdfBuffer.length} bytes`);

    // Upload to Convex storage
    const uploadUrl = await getConvex().mutation(
      api.pdfWorksheets.generateUploadUrl
    );

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: Buffer.from(pdfBuffer),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const { storageId } = await uploadResponse.json();

    // Update worksheet with PDF reference
    await getConvex().mutation(api.pdfWorksheets.saveRenderedPdf, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
      storageId: storageId as Id<"_storage">,
    });

    console.log("✅ PDF stored and linked to worksheet");

    return NextResponse.json({
      success: true,
      storageId,
      size: pdfBuffer.length,
    });
  } catch (error) {
    console.error("PDF generation error:", error);

    // Try to mark as failed
    try {
      const { worksheetId } = await request.json();
      if (worksheetId) {
        await getConvex().mutation(api.pdfWorksheets.updateProcessingStage, {
          worksheetId: worksheetId as Id<"pdfWorksheets">,
          processingStage: "failed",
          processingError:
            error instanceof Error ? error.message : "PDF generation failed",
        });
      }
    } catch {
      // Ignore secondary error
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "PDF generation failed",
      },
      { status: 500 }
    );
  }
}

/**
 * Add answer key section to the HTML
 */
function addAnswerKeyToHtml(
  html: string,
  worksheet: WorksheetContent
): string {
  const answerKeyHtml = generateAnswerKeyHtml(worksheet);

  // Insert answer key before closing body tag
  return html.replace(
    "</body>",
    `
    <div class="page-break"></div>
    <div style="padding: 20px;">
      <h1 style="color: ${worksheet.design?.colors.primary || "#003F37"}; font-family: Merriweather, serif; margin-bottom: 20px; border-bottom: 3px solid ${worksheet.design?.colors.primary || "#003F37"}; padding-bottom: 10px;">
        Answer Key: ${escapeHtml(worksheet.metadata.title)}
      </h1>
      ${answerKeyHtml}
    </div>
    </body>`
  );
}

/**
 * Generate HTML for the answer key
 */
function generateAnswerKeyHtml(worksheet: WorksheetContent): string {
  const lines: string[] = [];
  const colors = worksheet.design?.colors || {
    primary: "#003F37",
    action: "#B25627",
    background: "#E3C6AB",
  };

  let exerciseNum = 0;

  for (const section of worksheet.content.sections) {
    if (section.type === "exercise" && section.exercise) {
      exerciseNum++;
      const ex = section.exercise;

      lines.push(`
        <div style="margin-bottom: 24px; padding: 16px; background: ${colors.background}; border-radius: 8px;">
          <h3 style="color: ${colors.action}; margin-bottom: 12px; font-size: 16px;">
            Exercise ${exerciseNum}${section.title ? `: ${escapeHtml(section.title)}` : ""}
          </h3>
          <div style="display: grid; gap: 8px;">
      `);

      for (let i = 0; i < ex.items.length; i++) {
        const item = ex.items[i];
        lines.push(`
          <div style="display: flex; gap: 8px;">
            <span style="font-weight: 600; min-width: 24px;">${i + 1}.</span>
            <span style="color: #059669; font-weight: 500;">${escapeHtml(item.correctAnswer)}</span>
            ${item.acceptableAnswers && item.acceptableAnswers.length > 0 ? `
              <span style="color: #6b7280; font-size: 0.9em;">
                (Also: ${item.acceptableAnswers.map((a) => escapeHtml(a)).join(", ")})
              </span>
            ` : ""}
          </div>
        `);
      }

      lines.push(`
          </div>
          <div style="text-align: right; margin-top: 12px; font-size: 14px; color: #6b7280;">
            Points: ${ex.points}
          </div>
        </div>
      `);
    }
  }

  // Add total points
  const totalPoints = calculateTotalPoints(worksheet);
  lines.push(`
    <div style="text-align: right; font-weight: 600; font-size: 18px; margin-top: 20px; padding-top: 16px; border-top: 2px solid ${colors.primary};">
      Total Points: ${totalPoints}
    </div>
  `);

  return lines.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// GET endpoint to download PDF directly
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worksheetId = searchParams.get("worksheetId");

    if (!worksheetId) {
      return NextResponse.json(
        { error: "Missing worksheetId" },
        { status: 400 }
      );
    }

    const worksheet = await getConvex().query(api.pdfWorksheets.getWorksheet, {
      worksheetId: worksheetId as Id<"pdfWorksheets">,
    });

    if (!worksheet?.renderedPdfStorageId) {
      return NextResponse.json(
        { error: "PDF not available" },
        { status: 404 }
      );
    }

    // Get the URL from storage
    const pdfUrl = await getConvex().query(api.pdfWorksheets.getStorageUrl, {
      storageId: worksheet.renderedPdfStorageId,
    });

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "PDF URL not found" },
        { status: 404 }
      );
    }

    // Redirect to the PDF URL
    return NextResponse.redirect(pdfUrl);
  } catch (error) {
    console.error("PDF download error:", error);
    return NextResponse.json({ error: "Failed to get PDF" }, { status: 500 });
  }
}
