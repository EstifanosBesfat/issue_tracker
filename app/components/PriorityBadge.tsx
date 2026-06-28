type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const priorityMap: Record<Priority, { label: string; className: string }> = {
  LOW:      { label: 'Low',      className: 'bg-blue-100 text-blue-800 ring-blue-600/20'     },
  MEDIUM:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20' },
  HIGH:     { label: 'High',     className: 'bg-orange-100 text-orange-800 ring-orange-600/20' },
  CRITICAL: { label: 'Critical', className: 'bg-red-600 text-white ring-red-600/10'            },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = priorityMap[priority];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
