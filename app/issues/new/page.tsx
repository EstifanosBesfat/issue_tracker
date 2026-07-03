import prisma from '@/prisma/client';
import NewIssueForm from './NewIssueForm';

// Force dynamic rendering — this page queries the DB and must not be statically built
export const dynamic = 'force-dynamic';

export default async function NewIssuePage() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return <NewIssueForm users={users} />;
}
