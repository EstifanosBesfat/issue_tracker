import type { ProjectStatus } from '@/app/types/project';

const statusMap: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-info/10 text-info ring-info/20',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-success/10 text-success ring-success/20',
  },
};

export default function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const mapped = statusMap[status] ?? statusMap.ACTIVE;
  const { label, className } = mapped;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
