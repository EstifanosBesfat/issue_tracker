import prisma from '@/prisma/client';
import NewIssueForm from './NewIssueForm';

export default async function NewIssuePage() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return <NewIssueForm users={users} />;
}
