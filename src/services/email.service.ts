import { Resend } from 'resend';
import { renderClientThankYouHtml, ClientThankYouData } from '@/templates/emails/clientThankYouTemplate';
import { renderAdminNotificationHtml, AdminNotificationData } from '@/templates/emails/adminNotificationTemplate';

export interface ContactEmailPayload {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt?: Date;
}

export class EmailService {
  private getResend(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[EmailService] WARNING: RESEND_API_KEY is not set. Emails will not be sent.');
      return null;
    }
    return new Resend(apiKey);
  }

  private get fromEmail(): string {
    return process.env.RESEND_FROM_EMAIL || 'Mining Discovery <onboarding@resend.dev>';
  }

  private get adminEmail(): string {
    return process.env.ADMIN_NOTIFICATION_EMAIL || 'midisofficial@gmail.com';
  }

  private get appUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Send a Thank-You confirmation email to the client who submitted the form
   */
  async sendClientThankYou(data: ClientThankYouData): Promise<{ success: boolean; id?: string; error?: string }> {
    const resend = this.getResend();
    if (!resend) {
      return { success: false, error: 'Resend API key missing' };
    }

    try {
      const html = renderClientThankYouHtml(data);
      const res = await resend.emails.send({
        from: this.fromEmail,
        to: [data.email],
        subject: 'Thank You for Contacting Mining Discovery',
        html,
      });

      if (res.error) {
        console.error('[EmailService] Client Thank-You failed:', res.error);
        return { success: false, error: res.error.message };
      }

      console.log(`[EmailService] Client Thank-You sent to ${data.email} (ID: ${res.data?.id})`);
      return { success: true, id: res.data?.id };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown email error';
      console.error('[EmailService] Exception sending client thank-you:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send an instant alert email to the Admin notification address
   */
  async sendAdminAlert(data: AdminNotificationData): Promise<{ success: boolean; id?: string; error?: string }> {
    const resend = this.getResend();
    if (!resend) {
      return { success: false, error: 'Resend API key missing' };
    }

    try {
      const html = renderAdminNotificationHtml({
        ...data,
        portalUrl: `${this.appUrl}/admin`,
      });

      const res = await resend.emails.send({
        from: this.fromEmail,
        to: [this.adminEmail],
        subject: `New Lead Alert: ${data.name} via Mining Discovery Form`,
        html,
        replyTo: data.email,
      });

      if (res.error) {
        console.error('[EmailService] Admin Alert failed:', res.error);
        return { success: false, error: res.error.message };
      }

      console.log(`[EmailService] Admin Alert sent to ${this.adminEmail} (ID: ${res.data?.id})`);
      return { success: true, id: res.data?.id };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown email error';
      console.error('[EmailService] Exception sending admin alert:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Non-blocking trigger: dispatches both the client thank-you and the admin alert concurrently.
   * Guaranteed never to throw or crash the main request flow.
   */
  async sendContactEmails(payload: ContactEmailPayload): Promise<void> {
    const formattedDate = payload.createdAt
      ? new Date(payload.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString();

    const clientData: ClientThankYouData = {
      name: payload.name,
      email: payload.email,
      message: payload.message,
      date: formattedDate,
    };

    const adminData: AdminNotificationData = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      date: formattedDate,
      inquiryId: payload.id,
      portalUrl: `${this.appUrl}/admin`,
    };

    // Run both email dispatches concurrently without blocking each other
    const results = await Promise.allSettled([
      this.sendClientThankYou(clientData),
      this.sendAdminAlert(adminData),
    ]);

    const [clientResult, adminResult] = results;
    if (clientResult.status === 'fulfilled' && !clientResult.value.success) {
      console.error('[EmailService] Client Thank-You failed:', clientResult.value.error);
    }
    if (adminResult.status === 'fulfilled' && !adminResult.value.success) {
      console.error('[EmailService] Admin Alert failed:', adminResult.value.error);
    }
  }
}

export const emailService = new EmailService();
export default emailService;
