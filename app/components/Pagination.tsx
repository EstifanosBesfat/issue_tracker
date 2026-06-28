'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  currentPage: number;
  totalPages:  number;
}

export default function Pagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.replace(`/issues?${params.toString()}`);
  };

  // Sliding window of up to 5 pages centred on current
  const half  = 2;
  let start = Math.max(1, currentPage - half);
  let end   = Math.min(totalPages, currentPage + half);
  if (end - start < 4) {
    if (start === 1) end   = Math.min(totalPages, start + 4);
    else             start = Math.max(1, end - 4);
  }
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const btn = (active: boolean, disabled?: boolean) =>
    [
      'px-3 py-1 rounded text-sm border transition-colors',
      active   ? 'bg-[#00A651] text-white border-[#00A651]'
               : 'bg-white text-zinc-700 border-zinc-300 hover:border-[#00A651] hover:text-[#00A651]',
      disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
    ].join(' ');

  return (
    <div className="flex items-center gap-1 mt-4 flex-wrap" role="navigation" aria-label="Pagination">
      <button className={btn(false, currentPage === 1)} onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">‹ Prev</button>

      {start > 1 && <>
        <button className={btn(currentPage === 1)} onClick={() => goTo(1)}>1</button>
        {start > 2 && <span className="px-1 text-zinc-400">…</span>}
      </>}

      {pages.map((p) => (
        <button key={p} className={btn(p === currentPage)} onClick={() => goTo(p)}>{p}</button>
      ))}

      {end < totalPages && <>
        {end < totalPages - 1 && <span className="px-1 text-zinc-400">…</span>}
        <button className={btn(currentPage === totalPages)} onClick={() => goTo(totalPages)}>{totalPages}</button>
      </>}

      <button className={btn(false, currentPage === totalPages)} onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">Next ›</button>
    </div>
  );
}
