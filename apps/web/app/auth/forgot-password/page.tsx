'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', {
        email,
      });
      setSuccessMessage(data.message);
      setEmail('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-xl font-bold text-gray-900 leading-snug">Forgot your password?</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="w-full rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="w-full rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success"
          >
            {successMessage}
          </div>
        )}

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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              placeholder="you@ethiotelecom.et"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-60"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {loading ? 'Sending link…' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-sm text-gray-500">
          Remember your password?{' '}
          <Link href="/auth/signin" className="font-semibold text-secondary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
