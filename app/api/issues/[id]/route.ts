import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { patchIssueSchema } from '@/app/validationSchemas';
import { auth } from '@/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const validation = patchIssueSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(validation.error.format(), { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  // Only the reporter or an admin can edit
  if (issue.reporterId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = validation.data;

  // Build update data (only fields present in the request)
  const updateData: Record<string, unknown> = {};
  if (data.title       !== undefined) updateData.title       = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  // Only admins can change status
  if (data.status !== undefined && session.user.role === 'ADMIN') updateData.status = data.status;
  if (data.priority    !== undefined) updateData.priority    = data.priority;
  if (data.category    !== undefined) updateData.category    = data.category;
  if (data.department  !== undefined) updateData.department  = data.department;
  if (data.assigneeId  !== undefined) updateData.assigneeId  = data.assigneeId;
  if (data.dueDate     !== undefined) updateData.dueDate     = data.dueDate ? new Date(data.dueDate) : null;

  const updatedIssue = await prisma.issue.update({ where: { id }, data: updateData });

  // Log changes for auditable fields
  const logs: { action: string; oldValue: string | null; newValue: string | null }[] = [];

  if (data.status !== undefined && data.status !== issue.status) {
    logs.push({ action: 'STATUS_CHANGED', oldValue: issue.status, newValue: data.status });
  }
  if (data.priority !== undefined && data.priority !== issue.priority) {
    logs.push({ action: 'PRIORITY_CHANGED', oldValue: issue.priority, newValue: data.priority });
  }
  if (data.assigneeId !== undefined && data.assigneeId !== issue.assigneeId) {
    // Resolve names for readability
    const [oldUser, newUser] = await Promise.all([
      issue.assigneeId
        ? prisma.user.findUnique({ where: { id: issue.assigneeId }, select: { name: true } })
        : null,
      data.assigneeId
        ? prisma.user.findUnique({ where: { id: data.assigneeId }, select: { name: true } })
        : null,
    ]);
    logs.push({
      action: 'ASSIGNEE_CHANGED',
      oldValue: oldUser?.name ?? null,
      newValue: newUser?.name ?? null,
    });
  }

  if (logs.length > 0) {
    await prisma.activityLog.createMany({
      data: logs.map((log) => ({
        issueId: id,
        actorId: session.user.id,
        ...log,
      })),
    });
  }

  // ── Notifications ────────────────────────────────────────────────────────────

  // 1. New assignee notification — "An issue was assigned to you"
  if (
    data.assigneeId !== undefined &&
    data.assigneeId !== issue.assigneeId &&
    data.assigneeId
  ) {
    await prisma.notification.create({
      data: {
        userId:  data.assigneeId,
        issueId: id,
        type:    'ASSIGNED',
        message: `You have been assigned to issue: "${updatedIssue.title}"`,
      },
    });
  }

  // 2. Status change notification — tell the reporter their issue status changed
  if (
    data.status !== undefined &&
    data.status !== issue.status &&
    issue.reporterId &&
    issue.reporterId !== session.user.id
  ) {
    await prisma.notification.create({
      data: {
        userId:  issue.reporterId,
        issueId: id,
        type:    'STATUS_CHANGED',
        message: `Your issue "${updatedIssue.title}" status changed to ${data.status.replace('_', ' ')}.`,
      },
    });
  }

  return NextResponse.json(updatedIssue);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  // Only the reporter or an admin can delete
  if (issue.reporterId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.issue.delete({ where: { id } });

  return NextResponse.json({ message: 'Issue deleted successfully.' });
}
