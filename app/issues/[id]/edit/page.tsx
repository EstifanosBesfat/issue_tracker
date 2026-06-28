import prisma from '@/prisma/client';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import EditIssueForm from './EditIssueForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditIssuePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) redirect('/auth/signin');

  const [issue, users] = await Promise.all([
    prisma.issue.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!issue) notFound();

  // Only reporter or admin can access the edit page
  if (issue.reporterId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect(`/issues/${id}`);
  }

  const isAdmin = session.user.role === 'ADMIN';

  return <EditIssueForm issue={issue} isAdmin={isAdmin} users={users} />;
}
