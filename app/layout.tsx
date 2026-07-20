import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import Providers from './providers';
import AppSidebar from './components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import CommandPalette from './components/CommandPalette';
import NotificationBell from './components/NotificationBell';
import LanguageToggle from './components/LanguageToggle';

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
              <SidebarProvider>
                <AppSidebar />

                <SidebarInset>
                  <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex-1" />
                    <LanguageToggle />
                    <NotificationBell />
                    <CommandPalette />
                  </header>

                  <main className="flex-1 overflow-y-auto p-5">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
            </Providers>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
