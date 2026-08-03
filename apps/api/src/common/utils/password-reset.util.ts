import { createHash, randomBytes } from 'crypto';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 15 * 60 * 1000;

export function generateResetToken() {
  const rawToken = randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashResetToken(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function getResetTokenExpiry() {
  return new Date(Date.now() + TOKEN_TTL_MS);
}

export function getAppUrl() {
  return process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000';
}

export function buildResetPasswordUrl(rawToken: string) {
  const url = new URL('/auth/reset-password', getAppUrl());
  url.searchParams.set('token', rawToken);
  return url.toString();
}
