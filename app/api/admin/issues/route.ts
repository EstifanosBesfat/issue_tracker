import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { bulkStatusSchema } from '@/app/validationSchemas';
import { auth } from '@/auth';

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const validation = bulkStatusSchema.safeParse(body);
  if (!validation.success) return NextResponse.json(validation.error.format(), { status: 400 });

  const { ids, status } = validation.data;
  const result = await prisma.issue.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  return NextResponse.json({ updated: result.count });
}
