/**
 * Shared helper that parses + validates issue list query params.
 * Used by:
 *   - GET /api/issues (React Query data source)
 *   - app/issues/page.tsx (legacy server render, kept for build safety)
 */

import prisma from '@/prisma/client';

export const PAGE_SIZE = 10;

export const VALID_STATUSES   = ['OPEN', 'IN_PROGRESS', 'CLOSED']         as const;
export const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']     as const;
export const VALID_ORDER_BY   = ['title', 'status', 'priority', 'createdAt', 'dueDate'] as const;

type Status   = typeof VALID_STATUSES[number];
type Priority = typeof VALID_PRIORITIES[number];
type OrderBy  = typeof VALID_ORDER_BY[number];

export interface ParsedIssueParams {
  where:      Record<string, unknown>;
  orderBy:    Record<string, string>;
  skip:       number;
  take:       number;
  page:       number;
  status?:    string;
  priority?:  string;
  department?: string;
  search?:    string;
  rawOrderBy: string;
  direction:  'asc' | 'desc';
}

function first(v: string | string[] | undefined | null): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

/**
 * Parse a plain object of search params (supports both Next.js page.tsx
 * searchParams object and URLSearchParams-like objects from Request.url).
 */
export function parseIssueListParams(
  params: Record<string, string | string[] | undefined | null> | URLSearchParams,
): ParsedIssueParams {
  const get = (key: string): string => {
    if (params instanceof URLSearchParams) return params.get(key) ?? '';
    return first(params[key]);
  };

  const rawStatus     = get('status');
  const rawPriority   = get('priority');
  const rawDepartment = get('department');
  const rawOrderBy    = get('orderBy');
  const rawDirection  = get('direction');
  const rawPage       = get('page');
  const rawSearch     = get('q');

  const status     = (VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as Status) : undefined;
  const priority   = (VALID_PRIORITIES as readonly string[]).includes(rawPriority)
    ? (rawPriority as Priority) : undefined;
  const department = rawDepartment || undefined;
  const orderBy    = (VALID_ORDER_BY as readonly string[]).includes(rawOrderBy)
    ? (rawOrderBy as OrderBy) : 'createdAt';
  const direction  = rawDirection === 'asc' ? 'asc' : 'desc';
  const page       = Math.max(1, parseInt(rawPage, 10) || 1);
  const search     = rawSearch || undefined;

  const where = {
    ...(status     ? { status }     : {}),
    ...(priority   ? { priority }   : {}),
    ...(department ? { department } : {}),
    ...(search     ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  const skip = (page - 1) * PAGE_SIZE;

  return { where, orderBy: { [orderBy]: direction }, skip, take: PAGE_SIZE, page, status, priority, department, search, rawOrderBy: orderBy, direction };
}

/**
 * Execute the count + findMany and return totals.
 * Separated so callers (API route) don't need to duplicate Prisma calls.
 */
export async function fetchIssueList(params: ParsedIssueParams) {
  const [total, issues] = await Promise.all([
    prisma.issue.count({ where: params.where }),
    prisma.issue.findMany({
      where:   params.where,
      orderBy: params.orderBy,
      skip:    params.skip,
      take:    params.take,
      include: {
        assignee: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { issues, total, page: params.page, totalPages };
}
