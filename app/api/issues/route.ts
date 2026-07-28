import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { createIssueSchema } from '@/app/validationSchemas';
import { auth } from '@/auth';
import { parseIssueListParams, fetchIssueList } from '@/app/lib/issuesQuery';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const params = parseIssueListParams(searchParams);
    const result = await fetchIssueList(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/issues error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createIssueSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const { imageUrls, ...issueData } = validation.data;

    const newIssue = await prisma.issue.create({
      data: {
        title:       issueData.title,
        description: issueData.description,
        status:      'OPEN',   // always starts open — only admins can change status
        priority:    issueData.priority   ?? 'MEDIUM',
        category:    issueData.category   ?? 'OTHER',
        divisionId:  issueData.divisionId ?? null,
        dueDate:     issueData.dueDate    ? new Date(issueData.dueDate) : null,
        assigneeId:  issueData.assigneeId ?? null,
        reporterId:  session.user.id,
      },
    });

    if (imageUrls && imageUrls.length > 0) {
      await prisma.issueImage.createMany({
        data: imageUrls.map((url) => ({ url, issueId: newIssue.id })),
      });
    }

    await prisma.activityLog.create({
      data: {
        issueId: newIssue.id,
        actorId: session.user.id,
        action:  'ISSUE_CREATED',
      },
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error('POST /api/issues error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
