import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface SendReplyRequest {
  to: string;
  toName: string;
  subject: string;
  body: string;
  locale: string;
  originalMessage?: string;
}

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

    const body: SendReplyRequest = await request.json();
    const { to, toName, subject, body: emailBody, locale, originalMessage } = body;

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, body" },
        { status: 400 }
      );
    }

    const isGerman = locale === "de";

    // Convert plain text body to HTML with proper formatting
    const formattedBody = emailBody
      .split("\n\n")
      .map((paragraph) => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const result = await resend.emails.send({
      from: "James Simmonds <james@englisch-lehrer.com>",
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #4F5338;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E3C6AB;">
            <h1 style="color: #003F37; margin: 0; font-size: 24px; font-weight: 600;">Simmonds Language Services</h1>
            <p style="color: #9F9D38; margin: 8px 0 0 0; font-size: 14px;">Professional Language Training</p>
          </div>

          <!-- Email Body -->
          <div style="margin-bottom: 32px; font-size: 15px; color: #4F5338;">
            ${formattedBody}
          </div>

          <!-- Signature -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #E3C6AB;">
            <table cellpadding="0" cellspacing="0" style="width: 100%;">
              <tr>
                <td style="vertical-align: top;">
                  <p style="margin: 0; font-weight: 600; color: #003F37;">James Simmonds</p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #4F5338;">Founder & Director</p>
                  <p style="margin: 12px 0 0 0; font-size: 13px; color: #4F5338;">
                    <strong>Simmonds Language Services</strong><br>
                    Im Werkhof, Schaufelder Straße 11<br>
                    30167 Hannover, Germany
                  </p>
                  <p style="margin: 12px 0 0 0; font-size: 13px;">
                    <a href="tel:+495114739339" style="color: #B25627; text-decoration: none;">+49 511 47 39 339</a><br>
                    <a href="mailto:james@englisch-lehrer.com" style="color: #B25627; text-decoration: none;">james@englisch-lehrer.com</a><br>
                    <a href="https://englisch-lehrer.com" style="color: #B25627; text-decoration: none;">englisch-lehrer.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </div>

          ${originalMessage ? `
          <!-- Original Message Reference -->
          <div style="margin-top: 32px; padding: 16px; background-color: #f9f6f2; border-radius: 8px; border-left: 4px solid #9F9D38;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; font-weight: 600;">
              ${isGerman ? "Ihre ursprüngliche Nachricht:" : "Your original message:"}
            </p>
            <p style="margin: 0; font-size: 13px; color: #666; font-style: italic;">
              "${originalMessage.length > 300 ? originalMessage.substring(0, 300) + "..." : originalMessage}"
            </p>
          </div>
          ` : ""}

          <!-- Footer -->
          <p style="margin-top: 32px; font-size: 11px; color: #999; text-align: center;">
            ${isGerman
              ? "Sie erhalten diese E-Mail, weil Sie das Kontaktformular auf englisch-lehrer.com ausgefüllt haben."
              : "You are receiving this email because you filled out the contact form on englisch-lehrer.com."
            }
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error("[Send Reply API] Error sending email:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
