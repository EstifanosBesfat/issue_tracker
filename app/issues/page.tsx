import { Suspense } from 'react';
import IssuesPageClient from './IssuesPageClient';

// Force dynamic rendering so searchParams are always fresh
export const dynamic = 'force-dynamic';

export default function IssuesPage() {
  return (
    // Suspense required because IssuesPageClient uses useSearchParams()
    <Suspense fallback={null}>
      <IssuesPageClient />
    </Suspense>
  );
}
