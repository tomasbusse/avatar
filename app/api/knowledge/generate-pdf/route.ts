import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import puppeteer from "puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LessonContent } from "@/lib/types/lesson-content";
import { SLS_COLORS } from "@/lib/brand-colors";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Generate beautiful HTML for PDF using Gemini
async function generatePdfHTML(lessonContent: LessonContent): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    console.log("No GEMINI_API_KEY, using fallback HTML template");
    return generateFallbackHTML(lessonContent);
  }

  console.log("🎨 Generating PDF design with Gemini...");

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert educational PDF designer. Create a beautiful, print-ready HTML page for this English lesson.

DESIGN REQUIREMENTS:
- Modern, clean textbook aesthetic (Cambridge or Oxford coursebook style)
- Professional typography: Use Google Fonts (Merriweather for headings, Inter for body)
- SLS Brand Color scheme:
  * Primary Teal: ${SLS_COLORS.teal} (headers, titles, key elements)
  * Secondary Olive: ${SLS_COLORS.olive} (subheadings, muted text)
  * Accent Chartreuse: ${SLS_COLORS.chartreuse} (highlights, success indicators)
  * Action Orange: ${SLS_COLORS.orange} (buttons, important callouts, grammar accents)
  * Background Beige: ${SLS_COLORS.beige} (section backgrounds, alternating rows)
  * Light Background Cream: ${SLS_COLORS.cream} (grammar boxes, light sections)
- A4 page format with proper margins (already handled by Puppeteer)
- Elegant grammar boxes with cream background (${SLS_COLORS.cream}) and orange left border (${SLS_COLORS.orange})
- Exercise sections with numbered items and clear answer lines (__________)
- Vocabulary tables with teal headers (${SLS_COLORS.teal}) and alternating cream/white rows
- Learning objectives in a highlighted callout box with chartreuse left border (${SLS_COLORS.chartreuse})
- Clear visual hierarchy with proper spacing
- Page break hints before major sections (use CSS page-break-before: always where appropriate)
- Header with lesson title (teal) and level badge (orange background)

SPECIFIC ELEMENTS TO STYLE:
1. **Title Section**: Large title with CEFR level badge, estimated duration, topic
2. **Learning Objectives**: Green-bordered box with bullet points
3. **Introduction**: Elegant paragraph with drop cap or special first line
4. **Grammar Rules**: Yellow/amber background boxes with formula highlights
5. **Exercises**: Numbered with clear spacing, answer blanks as underlines
6. **Vocabulary Table**: Clean table with English, German, Example columns
7. **Summary**: Gray background box at the end

CSS TIPS:
- Use @import for Google Fonts at the top
- Use CSS Grid or Flexbox for layout
- Add subtle box-shadows for depth
- Use ::before and ::after for decorative elements
- Include print-specific styles (@media print)

OUTPUT:
Return ONLY the complete HTML document (<!DOCTYPE html>...) with embedded CSS in <style> tags.
No markdown code blocks, no explanations, just the raw HTML starting with <!DOCTYPE html>.

LESSON CONTENT:
${JSON.stringify(lessonContent, null, 2)}`;

  try {
    const result = await model.generateContent(prompt);
    let html = result.response.text();

    // Clean up any markdown artifacts
    html = html.trim();
    if (html.startsWith("```html")) {
      html = html.slice(7);
    }
    if (html.startsWith("```")) {
      html = html.slice(3);
    }
    if (html.endsWith("```")) {
      html = html.slice(0, -3);
    }
    html = html.trim();

    // Validate it looks like HTML
    if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) {
      console.log("⚠️ Gemini output doesn't look like HTML, using fallback");
      return generateFallbackHTML(lessonContent);
    }

    console.log("✅ Gemini generated beautiful HTML template");
    return html;
  } catch (error) {
    console.error("Gemini HTML generation failed:", error);
    return generateFallbackHTML(lessonContent);
  }
}

// Fallback HTML template when Gemini is unavailable
function generateFallbackHTML(lesson: LessonContent): string {
  const escapeHtml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(lesson.metadata.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
  <style>
    /* SLS Brand Colors */
    :root {
      --sls-teal: ${SLS_COLORS.teal};
      --sls-olive: ${SLS_COLORS.olive};
      --sls-chartreuse: ${SLS_COLORS.chartreuse};
      --sls-orange: ${SLS_COLORS.orange};
      --sls-beige: ${SLS_COLORS.beige};
      --sls-cream: ${SLS_COLORS.cream};
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3 { font-family: 'Merriweather', serif; color: var(--sls-teal); }
    h1 { font-size: 28px; margin-bottom: 8px; }
    h2 { font-size: 20px; margin: 32px 0 16px; border-bottom: 2px solid var(--sls-beige); padding-bottom: 8px; }
    h3 { font-size: 16px; margin: 24px 0 12px; color: var(--sls-olive); }

    .header { margin-bottom: 32px; }
    .level-badge {
      display: inline-block;
      background: var(--sls-orange);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      margin-right: 12px;
    }
    .meta { color: var(--sls-olive); font-size: 14px; }

    .objectives {
      background: var(--sls-beige);
      border-left: 4px solid var(--sls-chartreuse);
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }
    .objectives h3 { color: var(--sls-teal); margin-bottom: 12px; }
    .objectives ul { padding-left: 20px; }
    .objectives li { margin: 8px 0; }

    .grammar-box {
      background: var(--sls-cream);
      border-left: 4px solid var(--sls-orange);
      border-radius: 0 8px 8px 0;
      padding: 20px;
      margin: 20px 0;
    }
    .grammar-box h3 { color: var(--sls-orange); margin-bottom: 12px; }
    .formula {
      background: white;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      margin: 12px 0;
      color: var(--sls-teal);
      font-weight: 600;
    }

    .exercise {
      background: white;
      border: 2px solid var(--sls-beige);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .exercise h3 { color: var(--sls-teal); margin-bottom: 8px; }
    .exercise-instructions { font-style: italic; color: var(--sls-olive); margin-bottom: 16px; }
    .exercise-item { margin: 12px 0; padding-left: 24px; }
    .answer-line {
      display: inline-block;
      border-bottom: 1px solid var(--sls-olive);
      min-width: 100px;
      margin: 0 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--sls-beige);
    }
    th { background: var(--sls-teal); color: white; font-weight: 600; }
    tr:nth-child(even) { background: var(--sls-cream); }

    .summary {
      background: var(--sls-beige);
      border-radius: 8px;
      padding: 20px;
      margin-top: 32px;
    }
    .summary h2 { border-bottom: none; margin-top: 0; }

    @media print {
      body { padding: 0; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(lesson.metadata.title)}</h1>
    <div>
      <span class="level-badge">${lesson.metadata.level}</span>
      <span class="meta">${lesson.metadata.estimatedMinutes} minutes | ${escapeHtml(lesson.metadata.topic)}</span>
    </div>
  </div>

  ${lesson.content.learningObjectives.length > 0 ? `
  <div class="objectives">
    <h3>Learning Objectives</h3>
    <ul>
      ${lesson.content.learningObjectives.map(obj => `<li>${escapeHtml(obj.objective)}</li>`).join("\n      ")}
    </ul>
  </div>
  ` : ""}

  ${lesson.content.introduction?.content ? `
  <section>
    <h2>Introduction</h2>
    <p>${escapeHtml(lesson.content.introduction.content)}</p>
  </section>
  ` : ""}

  ${lesson.content.sections.map(section => `
  <section>
    <h2>${escapeHtml(section.title)}</h2>
    <p>${escapeHtml(section.content)}</p>
  </section>
  `).join("\n")}

  ${lesson.content.grammarRules.length > 0 ? `
  <h2>Grammar Rules</h2>
  ${lesson.content.grammarRules.map(rule => `
  <div class="grammar-box">
    <h3>${escapeHtml(rule.name)}</h3>
    <p>${escapeHtml(rule.rule)}</p>
    ${rule.formula ? `<div class="formula">${escapeHtml(rule.formula)}</div>` : ""}
    <strong>Examples:</strong>
    <ul>
      ${rule.examples.map(ex => `
        <li>✓ ${escapeHtml(ex.correct)}${ex.incorrect ? ` (Not: ✗ ${escapeHtml(ex.incorrect)})` : ""}</li>
      `).join("")}
    </ul>
  </div>
  `).join("")}
  ` : ""}

  ${lesson.content.exercises.length > 0 ? `
  <h2 class="page-break">Exercises</h2>
  ${lesson.content.exercises.map((ex, i) => `
  <div class="exercise">
    <h3>Exercise ${i + 1}: ${escapeHtml(ex.title)}</h3>
    <p class="exercise-instructions">${escapeHtml(ex.instructions)}</p>
    ${ex.items.map((item, j) => `
      <div class="exercise-item">${j + 1}. ${escapeHtml(item.question)}</div>
    `).join("")}
  </div>
  `).join("")}
  ` : ""}

  ${lesson.content.vocabulary.length > 0 ? `
  <h2 class="page-break">Vocabulary</h2>
  <table>
    <thead>
      <tr>
        <th>English</th>
        <th>German</th>
        <th>Example</th>
      </tr>
    </thead>
    <tbody>
      ${lesson.content.vocabulary.map(v => `
        <tr>
          <td><strong>${escapeHtml(v.term)}</strong></td>
          <td>${escapeHtml(v.termDe)}</td>
          <td>${escapeHtml(v.exampleSentence)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}

  ${lesson.content.summary?.content ? `
  <div class="summary">
    <h2>Summary</h2>
    <p>${escapeHtml(lesson.content.summary.content)}</p>
  </div>
  ` : ""}
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Missing contentId" },
        { status: 400 }
      );
    }

    console.log("📄 PDF Generation started for:", contentId);

    // Get content from Convex
    const content = await convex.query(api.knowledgeBases.getContentById, {
      contentId: contentId as Id<"knowledgeContent">,
    });

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (!content.jsonContent) {
      return NextResponse.json(
        { error: "No structured content available for PDF generation" },
        { status: 400 }
      );
    }

    const lessonContent = content.jsonContent as LessonContent;

    // Step 1: Generate beautiful HTML with Gemini
    const html = await generatePdfHTML(lessonContent);

    // Step 2: Render to PDF with Puppeteer
    console.log("🖨️ Rendering PDF with Puppeteer...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "25mm",
        left: "15mm",
        right: "15mm",
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #6b7280; padding: 10px 0;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    await browser.close();

    console.log(`✅ PDF generated: ${pdfBuffer.length} bytes`);

    // Step 3: Upload to Convex storage
    const uploadUrl = await convex.mutation(api.knowledgeBases.generateUploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: Buffer.from(pdfBuffer),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const { storageId } = await uploadResponse.json();

    // Step 4: Update content with PDF reference
    await convex.mutation(api.knowledgeBases.updatePdfStorage, {
      contentId: contentId as Id<"knowledgeContent">,
      pdfStorageId: storageId as Id<"_storage">,
    });

    console.log("✅ PDF stored and linked to content");

    return NextResponse.json({
      success: true,
      storageId,
      size: pdfBuffer.length,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}

// GET endpoint to download PDF directly
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json(
        { error: "Missing contentId" },
        { status: 400 }
      );
    }

    const content = await convex.query(api.knowledgeBases.getContentById, {
      contentId: contentId as Id<"knowledgeContent">,
    });

    if (!content?.pdfUrl) {
      return NextResponse.json(
        { error: "PDF not available" },
        { status: 404 }
      );
    }

    // Redirect to the PDF URL
    return NextResponse.redirect(content.pdfUrl);
  } catch (error) {
    console.error("PDF download error:", error);
    return NextResponse.json(
      { error: "Failed to get PDF" },
      { status: 500 }
    );
  }
}
