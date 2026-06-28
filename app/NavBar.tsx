'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import classnames from 'classnames';

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

  // Compute initials from user name for avatar fallback
  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <nav className="flex items-center justify-between border-b mb-5 px-5 h-14 bg-white shadow-sm">
      {/* Logo + Nav links */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/tele horizontal.png"
            alt="EthioTelecom"
            width={160}
            height={32}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        <ul className="flex space-x-6">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={classnames(
                  'text-sm transition-colors',
                  link.href === currentPath
                    ? 'text-[#00A651] font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
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
        {!session ? (
          <button
            onClick={() => signIn('google')}
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Sign In
          </button>
        ) : (
          <>
            {/* Avatar */}
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
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#00A651',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}

            {/* User name */}
            <span className="text-sm text-zinc-700 hidden sm:inline">
              {session.user.name}
            </span>

            {/* Sign out */}
            <button
              onClick={() => signOut()}
              className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
