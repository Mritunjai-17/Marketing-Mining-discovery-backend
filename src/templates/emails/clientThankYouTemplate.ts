/**
 * Client Thank-You Email Template
 * 
 * Tomorrow, when your designer delivers the finalized HTML email design,
 * simply paste their HTML markup inside this render function and map the variables.
 */

export interface ClientThankYouData {
  name: string;
  email: string;
  message?: string;
  date?: string;
}

export function renderClientThankYouHtml(data: ClientThankYouData): string {
  const formattedDate = data.date || new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting Mining Discovery</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111D2A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F0E8; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #09111C; border-radius: 20px; overflow: hidden; border: 1px solid #1E2C3D; box-shadow: 0 12px 30px rgba(0,0,0,0.15);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 36px 24px; text-align: left; border-bottom: 1px solid #182638;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: 1px; text-transform: uppercase;">
                      MINING <span style="color: #D6A84F;">DISCOVERY</span>
                    </div>
                    <div style="font-size: 11px; font-family: 'Courier New', Courier, monospace; color: #D6A84F; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase;">
                      Discovery · Exploration · Operations
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(214, 168, 79, 0.15); border: 1px solid rgba(214, 168, 79, 0.4); border-radius: 20px; font-size: 10px; font-family: 'Courier New', Courier, monospace; color: #E8C068; text-transform: uppercase; font-weight: 600;">
                      Inquiry Received
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px; background-color: #09111C;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #FFFFFF; line-height: 1.3;">
                Thank you for reaching out, <span style="color: #D6A84F;">${escapeHtml(data.name)}</span>.
              </h1>
              
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #B3C2D4;">
                We have received your inquiry submitted on <strong style="color: #FFFFFF;">${formattedDate}</strong>. Our team is reviewing your requirements and will connect with you shortly.
              </p>

              ${
                data.message
                  ? `
              <!-- Echoed message card -->
              <div style="margin: 24px 0; padding: 20px; background: #0E1825; border-radius: 12px; border-left: 3px solid #D6A84F; border: 1px solid #19283B;">
                <div style="font-size: 10px; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; color: #8A9BA8; letter-spacing: 1px; margin-bottom: 8px;">
                  Your Message Summary:
                </div>
                <div style="font-size: 13px; line-height: 1.6; color: #E2E8F0; font-style: italic;">
                  "${escapeHtml(data.message)}"
                </div>
              </div>
              `
                  : ""
              }

              <p style="margin: 20px 0 30px; font-size: 13px; line-height: 1.6; color: #8A9BA8;">
                If your matter requires urgent consultation, you may reply directly to this email or reach us through our official portal.
              </p>

              <!-- CTA / Website Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #D6A84F 0%, #B8860B 100%);">
                    <a href="https://miningdiscovery.com" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #09111C; text-decoration: none; border-radius: 50px;">
                      VISIT MINING DISCOVERY &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #060D17; border-top: 1px solid #182638; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-family: 'Courier New', Courier, monospace; color: #5D6F83;">
                &copy; ${new Date().getFullYear()} Mining Discovery. All rights reserved.
              </p>
              <p style="margin: 6px 0 0; font-size: 10px; color: #435467;">
                This automated confirmation was sent to ${escapeHtml(data.email)}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
