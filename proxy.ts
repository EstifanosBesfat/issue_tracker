// proxy.ts — uses Edge-safe auth config only (no Prisma)
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
