import Avatar from './Avatar';

interface ActivityLog {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  actor: { name: string | null; image: string | null } | null;
}

interface Props {
  activityLogs: ActivityLog[];
}

const ACTION_LABELS: Record<string, string> = {
  ISSUE_CREATED:    'created this issue',
  STATUS_CHANGED:   'changed status',
  ASSIGNEE_CHANGED: 'changed assignee',
  PRIORITY_CHANGED: 'changed priority',
  COMMENT_ADDED:    'added a comment',
  COMMENT_DELETED:  'deleted a comment',
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffHours = diffMs / 3_600_000;

  if (diffHours < 24) {
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(diffHours);
    return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  }

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ActivityTimeline({ activityLogs }: Props) {
  if (!activityLogs.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Activity</h3>
      <ol className="relative border-l border-gray-200 space-y-6 ml-3">
        {activityLogs.map((log) => {
          const label = ACTION_LABELS[log.action] ?? log.action.toLowerCase().replace(/_/g, ' ');
          const actorName = log.actor?.name ?? 'System';

          return (
            <li key={log.id} className="ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-gray-200">
                <Avatar image={log.actor?.image} name={actorName} size={22} />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="text-sm font-semibold text-gray-700">{actorName}</span>
                <span className="text-sm text-gray-500">{label}</span>
                {log.oldValue && log.newValue && (
                  <span className="text-xs text-gray-400">
                    <span className="line-through">{log.oldValue}</span>
                    {' → '}
                    <span className="font-medium text-gray-600">{log.newValue}</span>
                  </span>
                )}
              </div>
              <time className="text-xs text-gray-400">{formatTimestamp(log.createdAt)}</time>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
