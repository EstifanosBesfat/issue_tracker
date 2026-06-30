'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export default function SignInClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAccessDenied = error === 'AccessDenied';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setFormError('Invalid email or password. Please try again.');
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/tele horizontal.png"
            alt="EthioTelecom"
            width={180}
            height={50}
            style={{ objectFit: 'contain', height: '50px', width: 'auto' }}
            priority
          />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            Sign in to Issue Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your credentials to continue
          </p>
        </div>

        {/* Error callouts */}
        {isAccessDenied && (
          <div
            role="alert"
            className="w-full flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            <span>Your account has been deactivated. Please contact an administrator.</span>
          </div>
        )}

        {(formError || (error && !isAccessDenied)) && (
          <div
            role="alert"
            className="w-full flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            <span>{formError ?? 'Sign-in failed. Please try again.'}</span>
          </div>
        )}

        {/* Sign in form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A651]/40 focus:border-[#00A651]"
              placeholder="you@ethiotelecom.et"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A651]/40 focus:border-[#00A651]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00A651] disabled:opacity-60"
            style={{ backgroundColor: '#00A651' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-semibold text-[#00A651] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
