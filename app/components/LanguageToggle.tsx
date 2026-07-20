'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: 'en' | 'am') => {
    if (nextLocale === locale) return;

    startTransition(async () => {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: nextLocale }),
      });
      router.refresh();
    });
  };

  return (
    <div
      className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-medium"
      aria-label="Language toggle"
    >
      <button
        type="button"
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`rounded-md px-2 py-1 transition-colors ${
          locale === 'en'
            ? 'bg-[#00A651] text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale('am')}
        disabled={isPending}
        className={`rounded-md px-2 py-1 transition-colors ${
          locale === 'am'
            ? 'bg-[#00A651] text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        አማ
      </button>
    </div>
  );
}
