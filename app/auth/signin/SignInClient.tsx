'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function SignInClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const isAccessDenied = error === 'AccessDenied';
  const hasOtherError = error !== null && !isAccessDenied;

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
            Sign in to EthioTelecom
            <br />
            Issue Tracker
          </h1>
        </div>

        {/* Error callouts */}
        {isAccessDenied && (
          <div
            role="alert"
            className="w-full flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {/* Info icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Your account has been deactivated. Please contact an administrator.
            </span>
          </div>
        )}

        {hasOtherError && (
          <div
            role="alert"
            className="w-full flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>Sign-in failed. Please try again.</span>
          </div>
        )}

        {/* Sign in button */}
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00A651]"
          style={{ backgroundColor: '#00A651' }}
        >
          {/* Google logo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <path
              fill="#fff"
              d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.3-.2-2.7-.5-4z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
