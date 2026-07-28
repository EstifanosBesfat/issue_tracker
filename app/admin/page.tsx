import { auth } from '@/auth';
import prisma from '@/prisma/client';
import { redirect } from 'next/navigation';
import UserTable from './components/UserTable';
import IssueTable from './components/IssueTable';
import StatsOverview from './components/StatsOverview';
import DivisionTable from './components/DivisionTable';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) redirect('/auth/signin');
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <h1 className="text-2xl font-bold text-danger mb-2">Access Denied</h1>
        <p className="text-gray-500">You need administrator privileges to view this page.</p>
      </div>
    );
  }

  let users: any[] = [];
  let issues: any[] = [];
  let closedIssues: any[] = [];
  let statusGroups: any[] = [];
  let divisions: any[] = [];

  try {
    [users, issues, closedIssues, statusGroups, divisions] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.issue.findMany({
        include: {
          assignee: { select: { name: true } },
          reporter: { select: { name: true } },
          division: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.issue.findMany({
        where: { status: 'CLOSED' },
        select: { createdAt: true, updatedAt: true },
      }),
      prisma.issue.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.division.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { issues: true } } },
      }),
    ]);
  } catch {
    // DB not available at build time — use empty fallback
  }

  const deptGroups = divisions
    .filter((d) => d._count.issues > 0)
    .map((d) => ({ division: d.name, _count: { id: d._count.issues } }));

  const avgResolutionHours =
    closedIssues.length === 0
      ? 0
      : Math.round(
          closedIssues.reduce(
            (sum, i) => sum + (i.updatedAt.getTime() - i.createdAt.getTime()) / 3_600_000,
            0
          ) / closedIssues.length
        );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Manage users, issues, and view system statistics.</p>
      </div>

      <StatsOverview
        statusGroups={statusGroups}
        deptGroups={deptGroups}
        avgResolutionHours={avgResolutionHours}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">User Management</h2>
        <UserTable users={users} currentUserId={session.user.id} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Division Management</h2>
        <DivisionTable divisions={divisions} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Issue Management</h2>
        <IssueTable issues={issues} />
      </div>
    </div>
  );
}
