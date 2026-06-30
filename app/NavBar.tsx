'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import classnames from 'classnames';
import dynamic from 'next/dynamic';

const NotificationBell = dynamic(() => import('./components/NotificationBell'), {
  ssr: false,
});

export default function NavBar() {
  const currentPath = usePathname();
  const { data: session } = useSession();

  const links = [
    { label: 'Dashboard', href: '/' },
    { label: 'Issues', href: '/issues' },
    ...(session?.user?.role === 'ADMIN'
      ? [{ label: 'Admin', href: '/admin' }]
      : []),
  ];

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <nav className="flex items-center justify-between px-5 h-14 bg-white shadow-sm mb-5">
      {/* Logo + Nav links */}
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/tele horizontal.png"
            alt="EthioTelecom"
            width={160}
            height={32}
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        <ul className="flex space-x-6">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={classnames(
                  'text-sm font-medium transition-colors',
                  link.href === currentPath
                    ? 'text-[#00A651] font-semibold'
                    : 'text-gray-600 hover:text-[#00A651]'
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Auth section */}
      <div className="flex items-center space-x-3">
        {session && <NotificationBell />}

        {!session ? (
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-gray-600 hover:text-[#00A651] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-semibold px-4 py-1.5 rounded-md bg-[#00A651] text-white hover:bg-[#007a3d] transition-colors"
            >
              Register
            </Link>
          </div>
        ) : (
          <>
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? 'User avatar'}
                width={32}
                height={32}
                className="rounded-full"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full text-white text-xs font-semibold select-none"
                style={{ width: 32, height: 32, backgroundColor: '#00A651', flexShrink: 0 }}
              >
                {initials}
              </div>
            )}

            <span className="text-sm text-gray-700 hidden sm:inline">
              {session.user.name}
            </span>

            <button
              onClick={() => signOut()}
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
