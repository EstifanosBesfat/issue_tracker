type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const priorityMap: Record<Priority, { label: string; className: string }> = {
  LOW:      { label: 'Low',      className: 'bg-info/10 text-info ring-info/20'                         },
  MEDIUM:   { label: 'Medium',   className: 'bg-warning/15 text-warning-foreground ring-warning/30'      },
  HIGH:     { label: 'High',     className: 'bg-secondary text-secondary-foreground ring-secondary/10'   },
  CRITICAL: { label: 'Critical', className: 'bg-danger text-danger-foreground ring-danger/10'             },
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
