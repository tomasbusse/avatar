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

// Brand color
const BRAND_GREEN = "#5D8C3D";
const BRAND_GREEN_DARK = "#4A7030";
const BRAND_GREEN_LIGHT = "#EBF2E7";

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
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${lvl}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${data.correct}/${data.total}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${data.percentage}%</td>
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
          <div style="background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5;">

            <!-- Header -->
            <div style="background: ${BRAND_GREEN}; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">${testTitle}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0 0; font-size: 14px;">New Test Result</p>
            </div>

            <!-- Content -->
            <div style="padding: 24px;">

              <!-- Candidate Info -->
              <table style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${userEmail}" style="color: ${BRAND_GREEN};">${userEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Company:</td>
                  <td style="padding: 8px 0;">${userCompany || "Not specified"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Date:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Duration:</td>
                  <td style="padding: 8px 0;">${totalTimeMinutes} minutes</td>
                </tr>
              </table>

              <!-- Result Box -->
              <div style="background: ${BRAND_GREEN_LIGHT}; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #666; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">CEFR Level</p>
                <p style="color: ${BRAND_GREEN}; font-size: 48px; font-weight: bold; margin: 0; line-height: 1;">${level}</p>
                <p style="color: ${BRAND_GREEN_DARK}; margin: 8px 0 0 0; font-size: 16px;">${levelInfo.title}</p>
              </div>

              <!-- Score -->
              <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 16px; color: #333;">
                  <strong style="color: ${BRAND_GREEN};">${score}</strong> / ${totalPoints} correct
                  <span style="color: #666; margin-left: 8px;">(${percentage}%)</span>
                </p>
              </div>

              <!-- Breakdown -->
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #333;">Level</th>
                    <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #333;">Score</th>
                    <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #333;">%</th>
                  </tr>
                </thead>
                <tbody>
                  ${breakdownHtml}
                </tbody>
              </table>
            </div>

            <!-- Footer -->
            <div style="padding: 16px 24px; background: #f5f5f5; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">Automated notification from ${testTitle}</p>
            </div>
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
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
            <div style="background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5;">

              <!-- Header -->
              <div style="background: ${BRAND_GREEN}; padding: 32px 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Congratulations, ${userName.split(" ")[0]}!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your placement test is complete</p>
              </div>

              <!-- Content -->
              <div style="padding: 24px;">

                <!-- Result Box -->
                <div style="background: ${BRAND_GREEN_LIGHT}; border-radius: 8px; padding: 32px; text-align: center; margin-bottom: 24px;">
                  <p style="color: #666; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your English Level</p>
                  <p style="color: ${BRAND_GREEN}; font-size: 64px; font-weight: bold; margin: 0; line-height: 1;">${level}</p>
                  <p style="color: ${BRAND_GREEN_DARK}; margin: 12px 0 0 0; font-size: 18px; font-weight: 600;">${levelInfo.title}</p>
                </div>

                <p style="color: #666; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                  ${levelInfo.description}
                </p>

                <!-- Score Summary -->
                <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <table style="width: 100%; text-align: center;">
                    <tr>
                      <td style="padding: 8px;">
                        <p style="font-size: 28px; font-weight: bold; color: ${BRAND_GREEN}; margin: 0;">${score}</p>
                        <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">Correct</p>
                      </td>
                      <td style="padding: 8px;">
                        <p style="font-size: 28px; font-weight: bold; color: #666; margin: 0;">${totalPoints}</p>
                        <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">Total</p>
                      </td>
                      <td style="padding: 8px;">
                        <p style="font-size: 28px; font-weight: bold; color: ${BRAND_GREEN_DARK}; margin: 0;">${percentage}%</p>
                        <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">Score</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Breakdown -->
                <p style="font-weight: 600; color: #333; margin-bottom: 12px;">Performance by Level</p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #333;">Level</th>
                      <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #333;">Score</th>
                      <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #333;">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${breakdownHtml}
                  </tbody>
                </table>

                <!-- Next Steps -->
                <div style="background: ${BRAND_GREEN_LIGHT}; border-radius: 8px; padding: 20px; border-left: 4px solid ${BRAND_GREEN};">
                  <p style="font-weight: 600; color: ${BRAND_GREEN_DARK}; margin: 0 0 8px 0;">What happens next?</p>
                  <p style="color: #666; margin: 0; line-height: 1.6; font-size: 14px;">
                    The assessment coordinator has been notified of your results. They will be in touch shortly to discuss your English training options.
                  </p>
                </div>

                <!-- Date -->
                <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #999; font-size: 13px; margin: 0;">
                    Test completed on ${formattedDate}
                  </p>
                  <p style="color: #999; font-size: 12px; margin: 4px 0 0 0;">
                    Duration: ${totalTimeMinutes} minutes
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 16px 24px; background: #f5f5f5; text-align: center;">
                <p style="color: ${BRAND_GREEN}; font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">Cambridge English Assessment</p>
                <p style="color: #999; font-size: 11px; margin: 0;">Automated email from ${testTitle}</p>
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
