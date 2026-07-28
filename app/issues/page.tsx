import { Suspense } from 'react';
import prisma from '@/prisma/client';
import IssuesPageClient from './IssuesPageClient';

// Force dynamic rendering so searchParams are always fresh
export const dynamic = 'force-dynamic';

export default async function IssuesPage() {
  let divisions: { id: string; name: string }[] = [];
  try {
    divisions = await prisma.division.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  } catch {
    // DB not available at build time — use empty fallback
  }

  return (
    // Suspense required because IssuesPageClient uses useSearchParams()
    <Suspense fallback={null}>
      <IssuesPageClient divisions={divisions} />
    </Suspense>
  );
}
