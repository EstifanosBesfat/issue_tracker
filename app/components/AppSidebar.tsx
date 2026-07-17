"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuLabel,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const NotificationBell = dynamic(
  () => import("@/app/components/NotificationBell"),
  { ssr: false },
);

const navItems = [
  {
    label: "Dashboard",
    href: "/",
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
    label: "Issues",
    href: "/issues",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
];

const adminItem = {
  label: "Admin",
  href: "/admin",
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

function UserInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open } = useSidebar();

  const isAdmin = session?.user?.role === "ADMIN";
  const links = isAdmin ? [...navItems, adminItem] : navItems;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Sidebar>
      {/* ---- Header: Logo ---- */}
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="shrink-0">
            <Image
              src="/tele horizontal.png"
              alt="EthioTelecom"
              width={140}
              height={28}
              style={{ height: "28px", width: "auto", objectFit: "contain" }}
              priority
            />
          </div>
        </Link>
      </SidebarHeader>

      {/* ---- Content: Nav links ---- */}
      <SidebarContent>
        <SidebarMenu>
          {links.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link
                href={item.href}
                className={[
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                    : "text-sidebar-foreground",
                  !open && "justify-center px-0",
                ].filter(Boolean).join(" ")}
              >
                <span className="shrink-0">{item.icon}</span>
                <SidebarMenuLabel>{item.label}</SidebarMenuLabel>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* ---- Footer: User + NotificationBell + Sign Out ---- */}
      <SidebarFooter>
        {session ? (
          <div className={`flex items-center gap-2 w-full ${open ? "" : "justify-center"}`}>
            {/* Avatar */}
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={32}
                height={32}
                className="rounded-full shrink-0"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div
                className="flex shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold select-none"
                style={{ width: 32, height: 32, backgroundColor: "#00A651" }}
                aria-label={session.user?.name ?? "User"}
              >
                {UserInitials(session.user?.name)}
              </div>
            )}

            {open && (
              <>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">
                    {session.user?.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isAdmin ? "Admin" : "Staff"}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <NotificationBell />
                  <Separator orientation="vertical" className="h-5" />
                  <button
                    onClick={() => signOut()}
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
            )}
          </div>
        ) : (
          open && (
            <div className="flex gap-2 w-full">
              <Link
                href="/auth/signin"
                className="flex-1 text-center text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="flex-1 text-center text-sm font-semibold rounded-md bg-[#00A651] text-white px-3 py-1 hover:bg-[#007a3d] transition-colors"
              >
                Register
              </Link>
            </div>
          )
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
