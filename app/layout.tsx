import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Geist } from "next/font/google";
import Providers from './providers';
import AppSidebar from './components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import CommandPalette from './components/CommandPalette';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
    <html lang="en" className={`font-sans ${geist.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <SessionProvider>
          <Providers>
            <SidebarProvider>
              {/* Left: collapsible sidebar */}
              <AppSidebar />

              {/* Right: main content inset */}
              <SidebarInset>
                {/* Top bar with hamburger trigger */}
                <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1" />
                  <CommandPalette />
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-5">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
