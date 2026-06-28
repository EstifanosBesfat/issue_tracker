// auth.ts — full Node.js auth (with Prisma adapter)
// Used by server components, API routes, and server actions ONLY (not middleware)
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/prisma/client';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  // JWT strategy: token lives in cookie, Edge middleware can read it without DB
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isActive: true },
        });
        if (dbUser && !dbUser.isActive) return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // On first sign-in `user` is populated; persist id and role into the token
      if (user) {
        token.id   = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role ?? 'USER';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role ?? 'USER';
      }
      return session;
    },
  },
});
