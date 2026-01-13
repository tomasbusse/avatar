import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, message, locale = "en" } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, message" },
        { status: 400 }
      );
    }

    // Get personalized message template based on locale
    const isGerman = locale === "de";

    // Email to business (notification of new contact)
    const businessEmailResult = await resend.emails.send({
      from: "Simmonds Language Services <james@englisch-lehrer.com>",
      to: ["james@englisch-lehrer.com"],
      subject: `${isGerman ? "Neue Kontaktanfrage" : "New Contact Request"}: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #003F37; border-bottom: 2px solid #9F9D38; padding-bottom: 10px;">
            ${isGerman ? "Neue Kontaktanfrage" : "New Contact Request"}
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB; color: #4F5338; font-weight: bold; width: 120px;">
                ${isGerman ? "Name" : "Name"}:
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB;">
                ${name}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB; color: #4F5338; font-weight: bold;">
                Email:
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB;">
                <a href="mailto:${email}" style="color: #B25627;">${email}</a>
              </td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB; color: #4F5338; font-weight: bold;">
                ${isGerman ? "Telefon" : "Phone"}:
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB;">
                <a href="tel:${phone}" style="color: #B25627;">${phone}</a>
              </td>
            </tr>
            ` : ""}
            ${company ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB; color: #4F5338; font-weight: bold;">
                ${isGerman ? "Firma" : "Company"}:
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E3C6AB;">
                ${company}
              </td>
            </tr>
            ` : ""}
          </table>

          <div style="background-color: #FFE8CD; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #003F37; margin-top: 0;">
              ${isGerman ? "Nachricht" : "Message"}:
            </h3>
            <p style="color: #4F5338; white-space: pre-wrap; margin: 0;">${message}</p>
          </div>

          <p style="color: #4F5338; font-size: 12px; margin-top: 30px;">
            ${isGerman
              ? `Diese Nachricht wurde über das Kontaktformular auf englisch-lehrer.com gesendet (Sprache: ${locale.toUpperCase()})`
              : `This message was sent via the contact form on englisch-lehrer.com (Language: ${locale.toUpperCase()})`
            }
          </p>
        </div>
      `,
    });

    // Auto-reply to the person who contacted (confirmation email)
    const confirmationEmailResult = await resend.emails.send({
      from: "Simmonds Language Services <james@englisch-lehrer.com>",
      to: [email],
      subject: isGerman
        ? "Danke für Ihre Nachricht – Simmonds Language Services"
        : "Thank you for your message – Simmonds Language Services",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #003F37; margin: 0;">Simmonds Language Services</h1>
            <p style="color: #9F9D38; margin: 5px 0;">Professional Language Training</p>
          </div>

          <h2 style="color: #003F37;">
            ${isGerman ? `Hallo ${name},` : `Hello ${name},`}
          </h2>

          <p style="color: #4F5338; line-height: 1.6;">
            ${isGerman
              ? "Vielen Dank für Ihre Nachricht! Wir haben Ihre Anfrage erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden."
              : "Thank you for your message! We have received your inquiry and will get back to you within 24 hours."
            }
          </p>

          <div style="background-color: #FFE8CD; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #003F37; margin-top: 0;">
              ${isGerman ? "Ihre Nachricht:" : "Your message:"}
            </h3>
            <p style="color: #4F5338; white-space: pre-wrap; font-style: italic;">"${message}"</p>
          </div>

          <p style="color: #4F5338; line-height: 1.6;">
            ${isGerman
              ? "In der Zwischenzeit können Sie mehr über unsere Dienstleistungen auf unserer Website erfahren."
              : "In the meantime, you can learn more about our services on our website."
            }
          </p>

          <div style="margin: 30px 0; text-align: center;">
            <a href="https://englisch-lehrer.com"
               style="background-color: #B25627; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              ${isGerman ? "Website besuchen" : "Visit Website"}
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #E3C6AB; margin: 30px 0;" />

          <div style="color: #4F5338; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Simmonds Language Services</strong></p>
            <p style="margin: 5px 0;">Im Werkhof, Schaufelder Straße 11</p>
            <p style="margin: 5px 0;">30167 Hannover, Germany</p>
            <p style="margin: 5px 0;">
              <a href="tel:+495114739339" style="color: #B25627;">+49 511 47 39 339</a>
            </p>
            <p style="margin: 5px 0;">
              <a href="mailto:james@englisch-lehrer.com" style="color: #B25627;">james@englisch-lehrer.com</a>
            </p>
          </div>

          <p style="color: #999; font-size: 11px; margin-top: 30px; text-align: center;">
            ${isGerman
              ? "Dies ist eine automatische Bestätigung. Bitte antworten Sie nicht auf diese E-Mail."
              : "This is an automated confirmation. Please do not reply to this email."
            }
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      businessEmailId: businessEmailResult.data?.id,
      confirmationEmailId: confirmationEmailResult.data?.id,
    });
  } catch (error) {
    console.error("[Email API] Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
