export type DueDateStatus = 'overdue' | 'approaching' | 'normal' | null;

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export function getDueDateStatus(
  dueDate: Date | string | null | undefined,
  status: string
): DueDateStatus {
  if (!dueDate) return null;
  if (status === 'CLOSED' || status === 'DONE' || status === 'COMPLETED') return null;

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const msUntilDue = due.getTime() - now.getTime();

  if (msUntilDue < 0) return 'overdue';
  if (msUntilDue <= FORTY_EIGHT_HOURS_MS) return 'approaching';
  return 'normal';
}

export function formatDueDate(dueDate: Date | string): string {
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
