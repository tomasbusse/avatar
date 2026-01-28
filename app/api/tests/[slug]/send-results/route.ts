import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

interface LevelBreakdown {
  correct: number;
  total: number;
  percentage: number;
}

interface ResultsPayload {
  userName: string;
  userEmail: string;
  userCompany: string;
  level: string;
  score: number;
  totalPoints: number;
  percentage: number;
  levelBreakdown: Record<string, LevelBreakdown>;
  totalTimeMinutes: number;
  testDate: string;
}

// Always CC this email for all tests
const ALWAYS_CC_EMAIL = "james@englisch-lehrer.com";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }
    const resend = new Resend(apiKey);

    // Load test configuration from Convex to get HR emails
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex not configured" },
        { status: 500 }
      );
    }
    const convex = new ConvexHttpClient(convexUrl);
    const testConfig = await convex.query(api.placementTests.getBySlug, { slug });

    if (!testConfig) {
      return NextResponse.json(
        { error: "Test configuration not found" },
        { status: 404 }
      );
    }

    const body: ResultsPayload = await request.json();
    const {
      userName,
      userEmail,
      userCompany,
      level,
      score,
      totalPoints,
      percentage,
      levelBreakdown,
      totalTimeMinutes,
      testDate,
    } = body;

    // Validate required fields
    if (!userName || !userEmail || !level) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const formattedDate = new Date(testDate).toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
    });

    // Level descriptions for email
    const levelDescriptions: Record<string, { title: string; description: string }> = {
      A1: {
        title: "Beginner",
        description: "Basic understanding of everyday expressions and simple phrases.",
      },
      A2: {
        title: "Elementary",
        description: "Can communicate in routine tasks requiring direct exchange of information.",
      },
      B1: {
        title: "Intermediate",
        description: "Can deal with most situations likely to arise in work or travel contexts.",
      },
      B2: {
        title: "Upper-Intermediate",
        description: "Can interact with fluency and spontaneity, producing clear detailed text.",
      },
      C1: {
        title: "Advanced",
        description: "Can express fluently and spontaneously for professional purposes.",
      },
    };

    const levelInfo = levelDescriptions[level] || levelDescriptions.A1;

    // Generate level breakdown HTML
    const breakdownHtml = Object.entries(levelBreakdown)
      .map(([lvl, data]) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${lvl}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${data.correct}/${data.total}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${data.percentage}%</td>
        </tr>
      `)
      .join("");

    // Collect HR emails - always include ALWAYS_CC_EMAIL
    const hrEmails = new Set<string>([ALWAYS_CC_EMAIL]);
    if (testConfig.resultEmails?.hrEmails) {
      testConfig.resultEmails.hrEmails.forEach(email => hrEmails.add(email));
    }

    const testTitle = testConfig.title || "English Placement Test";

    // Email to HR/Coordinator notification
    const hrEmailResult = await resend.emails.send({
      from: `${testTitle} <james@englisch-lehrer.com>`,
      to: Array.from(hrEmails),
      subject: `${testTitle} Result: ${userName} - Level ${level}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${testTitle} Results</h1>
          </div>

          <div style="background: #ffffff; padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #333; margin-top: 0;">New Test Submission</h2>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: bold; width: 140px;">Candidate Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                  <a href="mailto:${userEmail}" style="color: #1e40af;">${userEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: bold;">Company:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${userCompany || "Not specified"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: bold;">Test Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: bold;">Time Taken:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${totalTimeMinutes} minutes</td>
              </tr>
            </table>

            <div style="background: linear-gradient(135deg, #1e40af, #1e3a8a); padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
              <p style="color: rgba(255,255,255,0.8); margin: 0 0 8px 0; font-size: 14px;">CEFR Level Achieved</p>
              <p style="color: white; font-size: 48px; font-weight: bold; margin: 0;">${level}</p>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${levelInfo.title}</p>
            </div>

            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #333;">Score Summary</h3>
              <p style="margin: 0; font-size: 18px;">
                <strong style="color: #1e40af;">${score}</strong> / ${totalPoints} correct
                <span style="color: #666; margin-left: 8px;">(${percentage}%)</span>
              </p>
            </div>

            <h3 style="color: #333; margin-top: 24px;">Level Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #1e40af;">Level</th>
                  <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #1e40af;">Score</th>
                  <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #1e40af;">Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${breakdownHtml}
              </tbody>
            </table>

            <p style="color: #666; font-size: 12px; margin-top: 24px; text-align: center;">
              This is an automated notification from the ${testTitle} system.
            </p>
          </div>
        </div>
      `,
    });

    // Email to the candidate (their results)
    let candidateEmailResult = null;
    if (testConfig.resultEmails?.sendToCandidate !== false) {
      candidateEmailResult = await resend.emails.send({
        from: `${testTitle} <james@englisch-lehrer.com>`,
        to: [userEmail],
        subject: `Your ${testTitle} Results - Level ${level}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations, ${userName.split(" ")[0]}!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Your placement test has been completed</p>
            </div>

            <div style="background: #ffffff; padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">

              <div style="background: linear-gradient(135deg, #1e40af, #1e3a8a); padding: 32px; border-radius: 12px; text-align: center; margin: 0 0 24px 0;">
                <p style="color: rgba(255,255,255,0.8); margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your English Level</p>
                <p style="color: white; font-size: 64px; font-weight: bold; margin: 0; line-height: 1;">${level}</p>
                <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 20px;">${levelInfo.title}</p>
              </div>

              <p style="color: #666; line-height: 1.6; margin-bottom: 24px;">
                ${levelInfo.description}
              </p>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">Your Score Summary</h3>
                <table style="width: 100%; text-align: center;">
                  <tr>
                    <td style="padding: 10px;">
                      <p style="font-size: 32px; font-weight: bold; color: #1e40af; margin: 0;">${score}</p>
                      <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">Correct</p>
                    </td>
                    <td style="padding: 10px;">
                      <p style="font-size: 32px; font-weight: bold; color: #666; margin: 0;">${totalPoints}</p>
                      <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">Total</p>
                    </td>
                    <td style="padding: 10px;">
                      <p style="font-size: 32px; font-weight: bold; color: #f59e0b; margin: 0;">${percentage}%</p>
                      <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">Score</p>
                    </td>
                  </tr>
                </table>
              </div>

              <h3 style="color: #333; margin-top: 24px;">Performance by Level</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                <thead>
                  <tr style="background: #f0f0f0;">
                    <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #1e40af;">Level</th>
                    <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #1e40af;">Score</th>
                    <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #1e40af;">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${breakdownHtml}
                </tbody>
              </table>

              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #1e40af;">
                <h4 style="margin: 0 0 12px 0; color: #1e3a8a;">What happens next?</h4>
                <p style="color: #666; margin: 0; line-height: 1.6;">
                  The assessment coordinator has been notified of your results. They will be in touch shortly to discuss your English training options and next steps.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />

              <div style="text-align: center;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Test completed on ${formattedDate}
                </p>
                <p style="color: #999; font-size: 12px; margin: 8px 0 0 0;">
                  Duration: ${totalTimeMinutes} minutes
                </p>
              </div>

              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0; text-align: center;">
                <p style="color: #1e40af; font-weight: bold; margin: 0;">Cambridge English Assessment</p>
                <p style="color: #999; font-size: 11px; margin: 8px 0 0 0;">
                  This is an automated email from the ${testTitle} system.
                </p>
              </div>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      hrEmailId: hrEmailResult.data?.id,
      candidateEmailId: candidateEmailResult?.data?.id,
    });
  } catch (error) {
    console.error("[Placement Test Email] Error sending email:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
