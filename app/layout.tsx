import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import Providers from './providers';
import AppShell from './components/AppShell';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'EthioTelecom Issue Tracker',
  description: 'Track network infrastructure incidents and service requests.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`font-sans ${geist.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <Providers>
              <AppShell>{children}</AppShell>
            </Providers>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
