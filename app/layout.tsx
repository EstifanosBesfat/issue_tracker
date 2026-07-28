import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Poppins } from "next/font/google";
import Providers from './providers';
import AppShell from './components/AppShell';

const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans' 
});

export const metadata: Metadata = {
  title: 'EthioTelecom Issue Tracker',
  description: 'Track network infrastructure incidents and service requests.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`font-sans ${poppins.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <SessionProvider>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
