import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { patchDivisionSchema } from '@/app/validationSchemas';
import { auth } from '@/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const validation = patchDivisionSchema.safeParse(body);
  if (!validation.success) return NextResponse.json(validation.error.format(), { status: 400 });

  if (validation.data.name) {
    const existing = await prisma.division.findFirst({
      where: { name: { equals: validation.data.name, mode: 'insensitive' }, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A division with this name already exists.' }, { status: 409 });
    }
  }

  const division = await prisma.division.update({
    where: { id },
    data: validation.data,
  });

  return NextResponse.json(division);
}
