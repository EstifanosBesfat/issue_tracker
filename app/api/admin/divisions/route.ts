import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { createDivisionSchema } from '@/app/validationSchemas';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const divisions = await prisma.division.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { issues: true } } },
  });

  return NextResponse.json(divisions);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const validation = createDivisionSchema.safeParse(body);
  if (!validation.success) return NextResponse.json(validation.error.format(), { status: 400 });

  const existing = await prisma.division.findFirst({
    where: { name: { equals: validation.data.name, mode: 'insensitive' } },
  });
  if (existing) {
    return NextResponse.json({ error: 'A division with this name already exists.' }, { status: 409 });
  }

  const division = await prisma.division.create({ data: { name: validation.data.name } });
  return NextResponse.json(division, { status: 201 });
}
