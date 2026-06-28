import prisma from '@/prisma/client';
import Link from 'next/link';
import IssueFilters from './IssueFilters';
import { Pagination, PriorityBadge, OverdueBadge, DueDateDisplay } from '@/app/components';
import { getDueDateStatus } from '@/app/lib/dueDateUtils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

const VALID_STATUSES   = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const VALID_ORDER_BY   = ['title', 'status', 'priority', 'createdAt', 'dueDate'] as const;

type Status   = typeof VALID_STATUSES[number];
type Priority = typeof VALID_PRIORITIES[number];
type OrderBy  = typeof VALID_ORDER_BY[number];

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '');
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const rawStatus     = first(params.status);
  const rawPriority   = first(params.priority);
  const rawDepartment = first(params.department);
  const rawOrderBy    = first(params.orderBy);
  const rawDirection  = first(params.direction);
  const rawPage       = first(params.page);

  const status     = (VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as Status)
    : undefined;
  const priority   = (VALID_PRIORITIES as readonly string[]).includes(rawPriority)
    ? (rawPriority as Priority)
    : undefined;
  const department = rawDepartment || undefined;
  const orderBy    = (VALID_ORDER_BY as readonly string[]).includes(rawOrderBy)
    ? (rawOrderBy as OrderBy)
    : 'createdAt';
  const direction  = rawDirection === 'asc' ? 'asc' : 'desc';
  const page       = Math.max(1, parseInt(rawPage, 10) || 1);

  const where = {
    ...(status     ? { status }     : {}),
    ...(priority   ? { priority }   : {}),
    ...(department ? { department } : {}),
  };

  const [total, issues] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      orderBy: { [orderBy]: direction },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        assignee: { select: { name: true } },
        images:   { select: { url: true }, take: 1 },
      },
    }),
  ]);

  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const statusColor = (s: string) => {
    if (s === 'OPEN')        return 'bg-red-50 text-red-700 ring-red-600/10';
    if (s === 'IN_PROGRESS') return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
    return 'bg-green-50 text-green-700 ring-green-600/20';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage network infrastructure incidents and service requests.
          </p>
        </div>
        <Link
          href="/issues/new"
          className="rounded-md bg-[#00A651] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3d] transition"
        >
          + New Ticket
        </Link>
      </div>

      <IssueFilters
        currentStatus={rawStatus}
        currentPriority={rawPriority}
        currentDepartment={rawDepartment}
        currentOrderBy={orderBy}
        currentDirection={direction}
      />

      {issues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">
            No tickets found. Try adjusting your filters or create a new ticket.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Department
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Due Date
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Assigned To
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {issues.map((issue) => {
                const dueDateStatus = getDueDateStatus(issue.dueDate, issue.status);
                return (
                  <tr key={issue.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-4 pl-6 pr-3 text-sm font-medium text-gray-900 max-w-xs">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/issues/${issue.id}`}
                          className="hover:text-[#00A651] hover:underline font-semibold truncate block"
                        >
                          {issue.title}
                        </Link>
                        {dueDateStatus === 'overdue' && <OverdueBadge />}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${statusColor(issue.status)}`}
                      >
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <PriorityBadge priority={issue.priority} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {issue.department ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm hidden md:table-cell">
                      <DueDateDisplay dueDate={issue.dueDate} status={issue.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                      {issue.assignee?.name ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {issue.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
