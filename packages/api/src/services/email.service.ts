import { Resend } from 'resend';

export class EmailService {
  private static getClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');
    return new Resend(apiKey);
  }

  static async sendDriverInvite(email: string, name: string, inviteUrl: string) {
    const from = process.env.EMAIL_FROM || 'no-reply@zoneflow.app';
    const client = this.getClient();
    const subject = 'You have been invited to ZoneFlow';
    const html = this.renderInviteHtml(name, inviteUrl);
    if (process.env.NODE_ENV !== 'production' && process.env.RESEND_API_KEY === undefined) {
      // Dev preview: log the invite link
      console.log(`[DEV] Invite email to ${email}: ${inviteUrl}`);
      return;
    }
    await client.emails.send({ from, to: email, subject, html });
  }

  static async sendEmail(to: string, subject: string, html: string) {
    const from = process.env.EMAIL_FROM || 'no-reply@zoneflow.app';
    const client = this.getClient();
    
    if (process.env.NODE_ENV !== 'production' && process.env.RESEND_API_KEY === undefined) {
      console.log(`[DEV] Email to ${to}: ${subject}`);
      return;
    }
    
    await client.emails.send({ from, to, subject, html });
  }

  static async sendTemplateEmail(to: string, subject: string, template: string, data: any) {
    // For now, just use the basic sendEmail method
    // In the future, this could be enhanced with proper template rendering
    const html = this.renderTemplate(template, data);
    return this.sendEmail(to, subject, html);
  }

  private static renderTemplate(template: string, data: any): string {
    // Simple template rendering - replace {{key}} with data[key]
    let html = template;
    for (const [key, value] of Object.entries(data)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return html;
  }

  private static renderInviteHtml(name: string, url: string): string {
    return `
<!doctype html>
<html>
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; line-height:1.5; color:#0f172a;">
    <div style="max-width:560px; margin:24px auto; padding:24px; border:1px solid #e2e8f0; border-radius:12px;">
      <h1 style="font-size:20px; margin:0 0 12px;">You're invited to ZoneFlow</h1>
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">You've been invited to join ZoneFlow as a driver. Click the button below to set your password and activate your account.</p>
      <p style="margin:24px 0;">
        <a href="${url}" style="display:inline-block; background:#0ea5e9; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px;">Set your password</a>
      </p>
      <p style="font-size:12px; color:#64748b;">This link will expire in 7 days.</p>
    </div>
  </body>
</html>`;
  }
}


