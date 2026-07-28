import { Resend } from 'resend';

// Resend test sender — can only deliver to the email you used to sign up at resend.com
const DEFAULT_FROM = 'onboarding@resend.dev';

type SendPasswordResetEmailParams = {
  to: string;
  name: string | null;
  resetUrl: string;
};

function getResendFromAddress() {
  const configured = process.env.EMAIL_FROM?.trim();
  if (!configured) return DEFAULT_FROM;

  // Accept both "onboarding@resend.dev" and "Name <onboarding@resend.dev>"
  if (configured.includes('@')) return configured;

  return DEFAULT_FROM;
}

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
        <a href="${resetUrl}" style="background-color: #8DC63F; color: #14210b; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">This link expires in 15 minutes. If you did not request a reset, you can ignore this email.</p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${resetUrl}</p>
    </div>
  `.trim();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getResendFromAddress();

  if (!apiKey) {
    const message = `[password-reset] RESEND_API_KEY is not set (${process.env.NODE_ENV ?? 'unknown env'})`;
    console.error(message);
    console.error(`[password-reset] reset link for ${to}: ${resetUrl}`);
    return { sent: false };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error('[password-reset] Resend API error:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  console.info(`[password-reset] email sent to ${to} (id: ${data?.id ?? 'unknown'})`);
  return { sent: true };
}
