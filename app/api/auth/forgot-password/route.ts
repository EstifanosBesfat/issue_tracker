import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/prisma/client';
import { sendPasswordResetEmail } from '@/lib/email';
import {
  buildResetPasswordUrl,
  generateResetToken,
  getResetTokenExpiry,
} from '@/lib/passwordReset';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const SUCCESS_MESSAGE =
  'If an account exists for that email, we sent a password reset link.';

// Simple in-memory rate limit: 5 requests per email per 15 minutes
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(email: string) {
  const now = Date.now();
  const entry = rateLimit.get(email);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? 'Validation failed' },
        { status: 400 }
      );
    }

    const email = validation.data.email.toLowerCase();

    if (isRateLimited(email)) {
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.info(`[password-reset] no account found for ${email}`);
    } else if (!user.isActive) {
      console.info(`[password-reset] inactive account for ${email}`);
    } else if (!user.password) {
      console.info(`[password-reset] account has no password for ${email}`);
    }

    if (user?.isActive && user.password) {
      const { rawToken, tokenHash } = generateResetToken();

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      await prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt: getResetTokenExpiry(),
        },
      });

      const resetUrl = buildResetPasswordUrl(rawToken);
      let emailSent = false;

      try {
        const result = await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        });
        emailSent = result.sent;
      } catch (error) {
        console.error('POST /api/auth/forgot-password email error:', error);
      }

      if (!emailSent) {
        console.error(
          `[password-reset] email was NOT sent to ${user.email}. Check RESEND_API_KEY on Railway and Resend dashboard logs.`
        );
      }

      // In local dev without email configured, return the link in the API response
      if (!emailSent && process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          message: SUCCESS_MESSAGE,
          devResetUrl: resetUrl,
        });
      }
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
