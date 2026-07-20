'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is invalid or missing a token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Unable to reset password. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Invalid reset link</h1>
            <p className="text-sm text-gray-500 mt-2">
              This password reset link is missing or invalid. Request a new one below.
            </p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="w-full text-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            style={{ backgroundColor: '#00A651' }}
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col items-center gap-6">
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

        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            Set a new password
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose a new password for your account
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="w-full rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="w-full rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
          >
            Password updated! Redirecting you to sign in…
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A651]/40 focus:border-[#00A651]"
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A651]/40 focus:border-[#00A651]"
              placeholder="Repeat your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00A651] disabled:opacity-60"
            style={{ backgroundColor: '#00A651' }}
          >
            {loading ? 'Updating password…' : 'Update Password'}
          </button>
        </form>

        <p className="text-sm text-gray-500">
          Need a new link?{' '}
          <Link href="/auth/forgot-password" className="font-semibold text-[#00A651] hover:underline">
            Request again
          </Link>
        </p>
      </div>
    </div>
  );
}
