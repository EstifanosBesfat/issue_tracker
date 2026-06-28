import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  images: {
    remotePatterns: [
      // Google profile pictures (used for auth avatar)
      new URL('https://lh3.googleusercontent.com/**'),
    ],
    qualities: [75],
  },
};

export default nextConfig;