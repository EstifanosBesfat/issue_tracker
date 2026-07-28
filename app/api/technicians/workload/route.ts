import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { auth } from '@/auth';

const ACTIVE_STATUSES: ('OPEN' | 'IN_PROGRESS')[] = ['OPEN', 'IN_PROGRESS'];
const VALID_CATEGORIES = [
  'MOBILE_NETWORK',
  'FIBER_BROADBAND',
  'TELEBIRR_BILLING',
  'CORE_INFRASTRUCTURE',
  'OTHER',
] as const;

type Category = (typeof VALID_CATEGORIES)[number];

// GET /api/technicians/workload?category=FIBER_BROADBAND
// Recommends the technician with the fewest open tickets in the given
// category (tie-broken by total open ticket count) so new issues can be
// routed to whoever has the most capacity right now.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawCategory = request.nextUrl.searchParams.get('category');
  const category = (VALID_CATEGORIES as readonly string[]).includes(rawCategory ?? '')
    ? (rawCategory as Category)
    : undefined;

  const [technicians, totalGroups] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.issue.groupBy({
      by: ['assigneeId'],
      where: { status: { in: ACTIVE_STATUSES }, assigneeId: { not: null } },
      _count: { id: true },
    }),
  ]);

  const categoryGroups = category
    ? await prisma.issue.groupBy({
        by: ['assigneeId'],
        where: { status: { in: ACTIVE_STATUSES }, assigneeId: { not: null }, category },
        _count: { id: true },
      })
    : [];

  const totalMap = new Map(totalGroups.map((g) => [g.assigneeId, g._count?.id ?? 0]));
  const categoryMap = new Map(categoryGroups.map((g) => [g.assigneeId, g._count?.id ?? 0]));

  const workload = technicians
    .map((tech) => ({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      openTickets: totalMap.get(tech.id) ?? 0,
      openTicketsInCategory: categoryMap.get(tech.id) ?? 0,
    }))
    .sort((a, b) => {
      if (a.openTicketsInCategory !== b.openTicketsInCategory) {
        return a.openTicketsInCategory - b.openTicketsInCategory;
      }
      if (a.openTickets !== b.openTickets) {
        return a.openTickets - b.openTickets;
      }
      return (a.name ?? '').localeCompare(b.name ?? '');
    });

  return NextResponse.json({
    category: category ?? null,
    recommended: workload[0] ?? null,
    workload,
  });
}
