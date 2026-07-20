import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'am'] as const;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const locale = (body as { locale?: string }).locale;

  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}
