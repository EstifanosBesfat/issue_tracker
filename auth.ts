// auth.ts — full Node.js auth (with Prisma adapter + bcryptjs)
// Used by server components, API routes, and server actions ONLY (not middleware)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/prisma/client';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;
        if (!user.isActive) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!passwordMatch) return null;

        // Cast to satisfy NextAuth User type
        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          image: user.image,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role:  user.role,
        } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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
