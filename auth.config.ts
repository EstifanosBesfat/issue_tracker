// auth.config.ts — Edge-safe config (no Prisma, no Node.js built-ins)
// Used by middleware.ts only
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const PROTECTED_PATTERNS = [
        /^\/issues\/new$/,
        /^\/issues\/[^/]+\/edit$/,
        /^\/admin(\/.*)?$/,
        /^\/profile(\/.*)?$/,
      ];
      const isProtected = PROTECTED_PATTERNS.some((p) =>
        p.test(nextUrl.pathname)
      );
      if (isProtected && !isLoggedIn) {
        const signInUrl = new URL('/auth/signin', nextUrl);
        signInUrl.searchParams.set('callbackUrl', nextUrl.href);
        return Response.redirect(signInUrl);
      }
      return true;
    },
  },
};
