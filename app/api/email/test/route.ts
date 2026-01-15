import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }
    const resend = new Resend(apiKey);

    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Missing required field: to (email address)" },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: "Simmonds Language Services <james@englisch-lehrer.com>",
      to: [to],
      subject: "🧪 Test Email from Simmonds Language Services",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #003F37; margin: 0;">✅ Email Test Successful!</h1>
            <p style="color: #9F9D38; margin: 10px 0;">Simmonds Language Services</p>
          </div>

          <div style="background-color: #FFE8CD; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #4F5338; margin: 0; text-align: center;">
              This is a test email from the Simmonds Language Services contact system.
              <br/><br/>
              If you're receiving this, the Resend integration is working correctly! 🎉
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB; color: #4F5338; font-weight: bold;">
                Sent to:
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB;">
                ${to}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB; color: #4F5338; font-weight: bold;">
                From:
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB;">
                james@englisch-lehrer.com
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB; color: #4F5338; font-weight: bold;">
                Timestamp:
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB;">
                ${new Date().toISOString()}
              </td>
            </tr>
          </table>

          <hr style="border: none; border-top: 1px solid #E3C6AB; margin: 30px 0;" />

          <p style="color: #999; font-size: 11px; text-align: center;">
            This test email was sent via the Resend API integration.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
      sentTo: to,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Email Test API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also allow GET for easy browser testing
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      {
        error: "Missing query parameter: to",
        usage: "GET /api/email/test?to=your@email.com",
      },
      { status: 400 }
    );
  }

  // Reuse POST logic
  return POST(new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ to }),
    headers: { "Content-Type": "application/json" },
  }));
}
