import prisma from '@/prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';
import DeleteButton from './DeleteButton';
import {
  Avatar,
  ImageThumbnails,
  DueDateDisplay,
  OverdueBadge,
  PriorityBadge,
  CommentSection,
  ActivityTimeline,
} from '@/app/components';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, image: true } },
      assignee: { select: { id: true, name: true, image: true } },
      division: { select: { id: true, name: true } },
      images: { select: { url: true }, orderBy: { createdAt: 'asc' } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'asc' },
      },
      activityLogs: {
        include: { actor: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!issue) notFound();

  const canEdit = session?.user
    ? issue.reporterId === session.user.id || session.user.role === 'ADMIN'
    : false;

  const canDelete = session?.user
    ? issue.reporterId === session.user.id || session.user.role === 'ADMIN'
    : false;

  const statusColor =
    issue.status === 'OPEN'
      ? 'bg-danger/10 text-danger ring-danger/20'
      : issue.status === 'IN_PROGRESS'
      ? 'bg-warning/15 text-warning-foreground ring-warning/30'
      : 'bg-success/10 text-success ring-success/20';

  return (
    <div className="max-w-3xl mx-auto mt-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-gray-900 break-words">{issue.title}</h1>
              {issue.dueDate && issue.status !== 'CLOSED' && new Date(issue.dueDate) < new Date() && (
                <OverdueBadge />
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${statusColor}`}
              >
                {issue.status.replace('_', ' ')}
              </span>
              <PriorityBadge priority={issue.priority} />
              {issue.division && (
                <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                  {issue.division.name}
                </span>
              )}
            </div>
          </div>

          {(canEdit || canDelete) && (
            <div className="flex gap-2 shrink-0">
              {canEdit && (
                <Link
                  href={`/issues/${issue.id}/edit`}
                  className="rounded-md bg-white border border-gray-300 px-3.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Edit
                </Link>
              )}
              <DeleteButton issueId={issue.id} canDelete={canDelete} />
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border-t pt-4 mt-2">
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Reported by</p>
            {issue.reporter ? (
              <div className="flex items-center gap-2">
                <Avatar image={issue.reporter.image} name={issue.reporter.name ?? 'User'} size={24} />
                <span className="text-gray-700">{issue.reporter.name ?? '—'}</span>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Assigned to</p>
            {issue.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar image={issue.assignee.image} name={issue.assignee.name ?? 'User'} size={24} />
                <span className="text-gray-700">{issue.assignee.name}</span>
              </div>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Created</p>
            <span className="text-gray-700">
              {issue.createdAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Due Date</p>
            <DueDateDisplay dueDate={issue.dueDate} status={issue.status} />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Description
        </h2>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {issue.description}
        </div>

        {issue.images.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Attachments
            </h3>
            <ImageThumbnails urls={issue.images.map((img) => img.url)} />
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
        <CommentSection
          issueId={issue.id}
          initialComments={issue.comments}
          currentUserId={session?.user?.id ?? null}
          userRole={session?.user?.role ?? null}
        />
      </div>

      {/* Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <ActivityTimeline activityLogs={issue.activityLogs} />
      </div>
    </div>
  );
}
