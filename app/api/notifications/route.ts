import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { auth } from '@/auth';

// GET /api/notifications — get current user's notifications
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      issue: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(notifications);
}

// PATCH /api/notifications — mark all as read
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { id } = body as { id?: string };

  if (id) {
    // Mark single notification as read
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
