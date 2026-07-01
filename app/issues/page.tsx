import prisma from '@/prisma/client';
import Link from 'next/link';
import IssueFilters from './IssueFilters';
import { Pagination, PriorityBadge, OverdueBadge, DueDateDisplay } from '@/app/components';
import { getDueDateStatus } from '@/app/lib/dueDateUtils';
import ExportButton from './ExportButton';

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
  const rawSearch     = first(params.q);

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
  const search     = rawSearch || undefined;

  const where = {
    ...(status     ? { status }     : {}),
    ...(priority   ? { priority }   : {}),
    ...(department ? { department } : {}),
    ...(search     ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
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

  // Build export URL with current filters (no pagination)
  const exportParams = new URLSearchParams();
  if (rawStatus)     exportParams.set('status',     rawStatus);
  if (rawPriority)   exportParams.set('priority',   rawPriority);
  if (rawDepartment) exportParams.set('department', rawDepartment);
  if (rawSearch)     exportParams.set('q',          rawSearch);

  const statusColor = (s: string) => {
    if (s === 'OPEN')        return 'bg-red-50 text-red-700 border-red-200';
    if (s === 'IN_PROGRESS') return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    return 'bg-white text-zinc-900 border-zinc-200';
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
        <div className="flex items-center gap-3">
          <ExportButton exportUrl={`/api/issues/export?${exportParams.toString()}`} />
          <Link
            href="/issues/new"
            className="rounded-md bg-[#00A651] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3d] transition"
          >
            + New Ticket
          </Link>
        </div>
      </div>

      <IssueFilters
        currentStatus={rawStatus}
        currentPriority={rawPriority}
        currentDepartment={rawDepartment}
        currentOrderBy={orderBy}
        currentDirection={direction}
        currentSearch={rawSearch}
      />

      {issues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">
            No tickets found. Try adjusting your filters or create a new ticket.
          </p>
        </div>
      ) : (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-gray-50/50">
              <tr className="border-b transition-colors hover:bg-gray-50/50">
                {[
                  { label: 'Title', value: 'title' },
                  { label: 'Status', value: 'status' },
                  { label: 'Priority', value: 'priority' },
                  { label: 'Department', value: 'department', className: 'hidden md:table-cell', sortable: false },
                  { label: 'Due Date', value: 'dueDate', className: 'hidden md:table-cell' },
                  { label: 'Assigned To', value: 'assignee', className: 'hidden lg:table-cell', sortable: false },
                  { label: 'Created', value: 'createdAt' },
                ].map((column) => {
                  const isSortable = column.sortable !== false;
                  
                  let nextDirection = 'desc';
                  if (orderBy === column.value) {
                    nextDirection = direction === 'asc' ? 'desc' : 'asc';
                  }

                  const p = new URLSearchParams(exportParams.toString());
                  if (isSortable) {
                    p.set('orderBy', column.value);
                    p.set('direction', nextDirection);
                  }

                  return (
                    <th key={column.value} className={`h-12 px-4 text-left align-middle font-medium text-gray-500 ${column.className || ''}`}>
                      {isSortable ? (
                        <Link
                          href={`/issues?${p.toString()}`}
                          className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
                        >
                          {column.label}
                          {orderBy === column.value && (
                            <span className="text-gray-900">
                              {direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          {orderBy !== column.value && (
                            <span className="text-gray-300">↑↓</span>
                          )}
                        </Link>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {issues.map((issue) => {
                const dueDateStatus = getDueDateStatus(issue.dueDate, issue.status);
                return (
                  <tr key={issue.id} className="border-b transition-colors hover:bg-zinc-50/50">
                    <td className="p-4 align-middle font-medium text-gray-900 max-w-xs">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/issues/${issue.id}`}
                          className="hover:text-[#00A651] hover:underline truncate block"
                        >
                          {issue.title}
                        </Link>
                        {dueDateStatus === 'overdue' && <OverdueBadge />}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${statusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <PriorityBadge priority={issue.priority} />
                    </td>
                    <td className="p-4 align-middle text-gray-500 hidden md:table-cell">
                      {issue.department ?? '—'}
                    </td>
                    <td className="p-4 align-middle hidden md:table-cell">
                      <DueDateDisplay dueDate={issue.dueDate} status={issue.status} />
                    </td>
                    <td className="p-4 align-middle text-gray-500 hidden lg:table-cell">
                      {issue.assignee?.name ?? '—'}
                    </td>
                    <td className="p-4 align-middle text-gray-500 whitespace-nowrap">
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
