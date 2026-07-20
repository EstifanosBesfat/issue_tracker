import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { commentSchema } from '@/app/validationSchemas';
import { auth } from '@/auth';
import { extractMentionHandles, resolveMentionedUserIds } from '@/lib/mentions';
import { createNotifications } from '@/lib/notifications';

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
  const authorId = session.user.id!;

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId,
      issueId,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      issueId,
      actorId: authorId,
      action: 'COMMENT_ADDED',
      newValue: content.slice(0, 100),
    },
  });

  const activeUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
  });

  const mentionHandles = extractMentionHandles(content);
  const mentionedUserIds = resolveMentionedUserIds(mentionHandles, activeUsers, authorId);
  const authorName = session.user.name ?? 'Someone';

  const notifications: Array<{
    userId: string;
    issueId: string;
    type: string;
    message: string;
  }> = [];

  for (const userId of mentionedUserIds) {
    notifications.push({
      userId,
      issueId,
      type: 'MENTIONED',
      message: `${authorName} mentioned you in "${issue.title}"`,
    });
  }

  const notifyOnComment = [issue.assigneeId, issue.reporterId].filter(
    (userId): userId is string =>
      !!userId && userId !== authorId && !mentionedUserIds.includes(userId)
  );

  for (const userId of notifyOnComment) {
    notifications.push({
      userId,
      issueId,
      type: 'COMMENT_ADDED',
      message: `${authorName} commented on "${issue.title}"`,
    });
  }

  await createNotifications(notifications);

  return NextResponse.json(comment, { status: 201 });
}
