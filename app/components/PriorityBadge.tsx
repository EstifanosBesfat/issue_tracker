type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const priorityMap: Record<Priority, { label: string; dotClass: string }> = {
  LOW:      { label: 'Low',      dotClass: 'bg-info' },
  MEDIUM:   { label: 'Medium',   dotClass: 'bg-warning' },
  HIGH:     { label: 'High',     dotClass: 'bg-secondary' },
  CRITICAL: { label: 'Critical', dotClass: 'bg-danger' },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, dotClass } = priorityMap[priority];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true"></span>
      {label}
    </span>
  );
}
