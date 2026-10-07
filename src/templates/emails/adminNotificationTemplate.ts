/**
 * Admin Notification Email Template
 * 
 * Alert sent to the administrator when a new contact inquiry / lead is received.
 * Tomorrow, when your designer delivers the finalized template, you can swap it here.
 */

export interface AdminNotificationData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  date?: string;
  inquiryId?: string;
  portalUrl?: string;
}

export function renderAdminNotificationHtml(data: AdminNotificationData): string {
  const formattedDate = data.date || new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const portalUrl = data.portalUrl || "http://localhost:3000/admin";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead / Contact Inquiry Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111D2A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F0E8; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #09111C; border-radius: 20px; overflow: hidden; border: 1px solid #1E2C3D; box-shadow: 0 12px 30px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px; text-align: left; border-bottom: 1px solid #182638;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 18px; font-weight: 800; color: #FFFFFF; letter-spacing: 1px; text-transform: uppercase;">
                      MINING <span style="color: #D6A84F;">DISCOVERY</span>
                    </div>
                    <div style="font-size: 11px; font-family: 'Courier New', Courier, monospace; color: #D6A84F; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase;">
                      Operations · Lead Notification
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 5px 12px; background: #D6A84F; border-radius: 20px; font-size: 11px; font-family: 'Courier New', Courier, monospace; color: #09111C; text-transform: uppercase; font-weight: 700;">
                      NEW INQUIRY
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px; background-color: #09111C;">
              <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #FFFFFF;">
                A new contact inquiry has arrived
              </h2>
              <p style="margin: 0 0 24px; font-size: 13px; color: #8A9BA8;">
                Submitted via the marketing website contact form on <strong style="color: #FFFFFF;">${formattedDate}</strong>.
              </p>

              <!-- Lead Details Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0E1825; border-radius: 12px; border: 1px solid #19283B; margin-bottom: 24px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #19283B; width: 35%; font-size: 11px; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; color: #8A9BA8;">
                    Lead Name
                  </td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #19283B; font-size: 13px; font-weight: 600; color: #FFFFFF;">
                    ${escapeHtml(data.name)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #19283B; font-size: 11px; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; color: #8A9BA8;">
                    Email Address
                  </td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #19283B; font-size: 13px; font-weight: 600; color: #D6A84F;">
                    <a href="mailto:${escapeHtml(data.email)}" style="color: #D6A84F; text-decoration: none;">${escapeHtml(data.email)}</a>
                  </td>
                </tr>
                ${
                  data.phone
                    ? `
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #19283B; font-size: 11px; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; color: #8A9BA8;">
                    Phone Number
                  </td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #19283B; font-size: 13px; font-weight: 600; color: #FFFFFF;">
                    <a href="tel:${escapeHtml(data.phone)}" style="color: #FFFFFF; text-decoration: none;">${escapeHtml(data.phone)}</a>
                  </td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 14px 20px; vertical-align: top; font-size: 11px; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; color: #8A9BA8;">
                    Message
                  </td>
                  <td style="padding: 14px 20px; font-size: 13px; line-height: 1.6; color: #E2E8F0;">
                    ${escapeHtml(data.message)}
                  </td>
                </tr>
              </table>

              <!-- Call To Action -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #D6A84F 0%, #B8860B 100%);">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #09111C; text-decoration: none; border-radius: 50px;">
                      OPEN IN ADMIN PORTAL &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #060D17; border-top: 1px solid #182638; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-family: 'Courier New', Courier, monospace; color: #5D6F83;">
                Mining Discovery Lead Dispatch System · Automated Internal Notification
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
