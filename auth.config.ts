// auth.config.ts — Edge-safe config (no Prisma, no Node.js built-ins)
// Used by middleware.ts only
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  providers: [
    // Credentials provider — actual verification happens in auth.ts
    // We include a stub here so next-auth knows the provider exists at the Edge level
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async () => null, // real logic lives in auth.ts
    }),
  ],
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
