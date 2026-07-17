'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Props {
  currentPage: number;
  totalPages:  number;
}

function buildUrl(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set('page', String(page));
  return `/issues?${params.toString()}`;
}

export default function Pagination({ currentPage, totalPages }: Props) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  // Sliding window of up to 5 pages centred on current
  const half = 2;
  let start  = Math.max(1, currentPage - half);
  let end    = Math.min(totalPages, currentPage + half);
  if (end - start < 4) {
    if (start === 1) end   = Math.min(totalPages, start + 4);
    else             start = Math.max(1, end - 4);
  }
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const btnBase   = 'inline-flex items-center justify-center rounded-md border text-sm font-medium h-8 px-3 transition-colors select-none';
  const btnActive = `${btnBase} bg-[#00A651] text-white border-[#00A651]`;
  const btnNormal = `${btnBase} bg-white text-zinc-700 border-zinc-300 hover:border-[#00A651] hover:text-[#00A651]`;
  const btnDisabled = `${btnBase} bg-white text-zinc-300 border-zinc-200 pointer-events-none cursor-default`;

  return (
    <nav
      className="flex items-center gap-1 mt-4 flex-wrap"
      role="navigation"
      aria-label="Pagination"
    >
      {/* Previous */}
      {currentPage === 1 ? (
        <span className={btnDisabled} aria-disabled="true">‹ Prev</span>
      ) : (
        <Link
          href={buildUrl(searchParams, currentPage - 1)}
          className={btnNormal}
          aria-label="Previous page"
          scroll={false}
        >
          ‹ Prev
        </Link>
      )}

      {/* First page if outside window */}
      {start > 1 && (
        <>
          <Link
            href={buildUrl(searchParams, 1)}
            className={currentPage === 1 ? btnActive : btnNormal}
            scroll={false}
          >
            1
          </Link>
          {start > 2 && <span className="px-1 text-zinc-400 text-sm">…</span>}
        </>
      )}

      {/* Page window */}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildUrl(searchParams, p)}
          className={p === currentPage ? btnActive : btnNormal}
          aria-current={p === currentPage ? 'page' : undefined}
          scroll={false}
        >
          {p}
        </Link>
      ))}

      {/* Last page if outside window */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-zinc-400 text-sm">…</span>}
          <Link
            href={buildUrl(searchParams, totalPages)}
            className={currentPage === totalPages ? btnActive : btnNormal}
            scroll={false}
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next */}
      {currentPage === totalPages ? (
        <span className={btnDisabled} aria-disabled="true">Next ›</span>
      ) : (
        <Link
          href={buildUrl(searchParams, currentPage + 1)}
          className={btnNormal}
          aria-label="Next page"
          scroll={false}
        >
          Next ›
        </Link>
      )}
    </nav>
  );
}
