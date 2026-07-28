interface StatusGroup   { status: string; _count: { id: number } }
interface DivisionGroup { division: string | null; _count: { id: number } }

interface Props {
  statusGroups: StatusGroup[];
  deptGroups: DivisionGroup[];
  avgResolutionHours: number;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress', CLOSED: 'Closed',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-danger/10 text-danger border-danger/20',
  IN_PROGRESS: 'bg-warning/15 text-warning-foreground border-warning/30',
  CLOSED: 'bg-success/10 text-success border-success/20',
};

export default function StatsOverview({ statusGroups, deptGroups, avgResolutionHours }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Statistics Overview</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusGroups.map((g) => (
          <div key={g.status} className={`rounded-lg border p-4 ${STATUS_COLORS[g.status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              {STATUS_LABELS[g.status] ?? g.status}
            </p>
            <p className="text-3xl font-bold mt-1">{g._count.id}</p>
          </div>
        ))}
        <div className="rounded-lg border bg-info/10 text-info border-info/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Avg Resolution</p>
          <p className="text-3xl font-bold mt-1">{avgResolutionHours}h</p>
        </div>
      </div>

      {deptGroups.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-600 mb-3">Issues by Division</p>
          <div className="space-y-2">
            {deptGroups.map((g) => (
              <div key={g.division ?? 'none'} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-36 truncate">{g.division ?? 'Unspecified'}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-primary rounded-full"
                    style={{ width: `${Math.min(100, (g._count.id / Math.max(...deptGroups.map(d => d._count.id))) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 w-6 text-right">{g._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
