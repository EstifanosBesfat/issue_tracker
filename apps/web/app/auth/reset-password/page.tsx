import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col items-center gap-6 animate-pulse">
            <div className="h-12 w-44 rounded-md bg-gray-200" />
            <div className="h-6 w-56 rounded bg-gray-200" />
            <div className="h-11 w-full rounded-lg bg-gray-200" />
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
