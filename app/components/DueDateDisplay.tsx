import { getDueDateStatus, formatDueDate } from '@/app/lib/dueDateUtils';

interface Props {
  dueDate: Date | string | null | undefined;
  status: string;
}

export default function DueDateDisplay({ dueDate, status }: Props) {
  if (!dueDate) return null;

  const dueDateStatus = getDueDateStatus(dueDate, status);

  if (dueDateStatus === null || status === 'CLOSED') {
    return (
      <span className="text-sm text-zinc-500">
        Due: {formatDueDate(dueDate)}
      </span>
    );
  }

  if (dueDateStatus === 'approaching') {
    return (
      <span className="text-sm font-semibold text-amber-600">
        Due: {formatDueDate(dueDate)}
      </span>
    );
  }

  return (
    <span className="text-sm text-zinc-500">
      Due: {formatDueDate(dueDate)}
    </span>
  );
}
