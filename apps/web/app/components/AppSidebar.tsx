'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuLabel,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const adminItem = {
  label: 'Admin',
  href: '/admin',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

function UserInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { open, setOpen, isMobile } = useSidebar();

  const isAdmin = user?.role === 'ADMIN';
  const links = isAdmin ? [...navItems, adminItem] : navItems;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleNavClick = () => {
    if (isMobile) setOpen(false);
  };

  useEffect(() => {
    if (isMobile) setOpen(false);
    // Intentionally omit setOpen from deps — sidebar setter identity can churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isMobile]);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 pb-4 mb-2">
        <Link href="/" onClick={handleNavClick} className="flex items-center gap-2 overflow-hidden px-2 pt-2">
          <div className="shrink-0">
            <img
              src="/official-logo.png?v=2"
              alt="Ethio Telecom"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          {open && (
            <span className="text-xs font-semibold text-gray-600 truncate">
              Project Manager
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {links.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link
                href={item.href}
                onClick={handleNavClick}
                className={[
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                  !open && 'justify-center px-0',
                ].filter(Boolean).join(' ')}
              >
                <span className="shrink-0">{item.icon}</span>
                <SidebarMenuLabel>{item.label}</SidebarMenuLabel>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <div className={`flex items-center gap-2 w-full ${open ? '' : 'justify-center flex-col'}`}>
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'User'}
                width={32}
                height={32}
                className="rounded-full shrink-0"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                className="flex shrink-0 items-center justify-center rounded-full text-primary-foreground text-xs font-semibold select-none"
                style={{ width: 32, height: 32, backgroundColor: 'var(--primary)' }}
                aria-label={user.name ?? 'User'}
              >
                {UserInitials(user.name)}
              </div>
            )}

            {open ? (
              <>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isAdmin ? 'Admin' : 'Staff'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Separator orientation="vertical" className="h-5" />
                  <button
                    onClick={() => logout()}
                    title="Sign out"
                    className="rounded p-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Sign out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => logout()}
                title="Sign out"
                className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
          </div>
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
