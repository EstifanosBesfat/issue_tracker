import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { commentSchema } from '@/app/validationSchemas';
import { auth } from '@/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: issueId } = await params;

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  const body = await request.json();
  const validation = commentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(validation.error.format(), { status: 400 });
  }

  const { content } = validation.data;

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: session.user.id!,
      issueId,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      issueId,
      actorId: session.user.id,
      action: 'COMMENT_ADDED',
      newValue: content.slice(0, 100),
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
