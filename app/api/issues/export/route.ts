import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { auth } from '@/auth';

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '');
}

function escapeCSV(value: string | null | undefined): string {
  const str = value ?? '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const rawStatus = first(searchParams.get('status') ?? undefined);
  const rawPriority = first(searchParams.get('priority') ?? undefined);
  const rawDivisionId = first(searchParams.get('divisionId') ?? undefined);
  const rawSearch = first(searchParams.get('q') ?? undefined);

  const status = (VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as (typeof VALID_STATUSES)[number])
    : undefined;
  const priority = (VALID_PRIORITIES as readonly string[]).includes(rawPriority)
    ? (rawPriority as (typeof VALID_PRIORITIES)[number])
    : undefined;
  const divisionId = rawDivisionId || undefined;
  const search = rawSearch || undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(divisionId ? { divisionId } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  const issues = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      assignee: { select: { name: true } },
      reporter: { select: { name: true } },
      division: { select: { name: true } },
    },
  });

  const header = [
    'ID',
    'Title',
    'Status',
    'Priority',
    'Division',
    'Category',
    'Due Date',
    'Assignee',
    'Reporter',
    'Created At',
  ].join(',');

  const rows = issues.map((issue) =>
    [
      escapeCSV(issue.id),
      escapeCSV(issue.title),
      escapeCSV(issue.status),
      escapeCSV(issue.priority),
      escapeCSV(issue.division?.name),
      escapeCSV(issue.category),
      escapeCSV(issue.dueDate?.toISOString().split('T')[0] ?? ''),
      escapeCSV(issue.assignee?.name),
      escapeCSV(issue.reporter?.name),
      escapeCSV(issue.createdAt.toISOString().split('T')[0]),
    ].join(',')
  );

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="issues-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
