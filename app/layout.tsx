import type { Metadata } from 'next';
import NavBar from './NavBar';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Geist } from "next/font/google";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Issue Tracker',
  description: 'Track project issues',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`font-sans ${geist.variable}`}>
      <body className="min-h-screen bg-white text-neutral-950">
        <SessionProvider>
          <NavBar />
          <main className="p-5">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
