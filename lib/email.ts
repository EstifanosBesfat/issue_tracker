import { Resend } from 'resend';

const DEFAULT_FROM = 'EthioTelecom Issue Tracker <onboarding@resend.dev>';

type SendPasswordResetEmailParams = {
  to: string;
  name: string | null;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<{ sent: boolean }> {
  const subject = 'Reset your EthioTelecom Issue Tracker password';
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
      <p>${greeting}</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #00A651; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">This link expires in 15 minutes. If you did not request a reset, you can ignore this email.</p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${resetUrl}</p>
    </div>
  `.trim();

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    console.info('[password-reset] RESEND_API_KEY not set — reset link logged for development:');
    console.info(`[password-reset] ${to}: ${resetUrl}`);
    return { sent: false };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  return { sent: true };
}
