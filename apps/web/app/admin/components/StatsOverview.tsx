interface Props {
  projects: { active: number; completed: number; total: number };
  byStatus: { status: string; count: number }[];
  byCategory: { name: string; count: number }[];
  overdue: number;
  totalTasks: number;
}

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-gray-50 text-gray-700 border-gray-200',
  IN_PROGRESS: 'bg-warning/15 text-warning-foreground border-warning/30',
  DONE: 'bg-success/10 text-success border-success/20',
};

export default function StatsOverview({
  projects,
  byStatus,
  byCategory,
  overdue,
  totalTasks,
}: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Statistics Overview</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-info/10 text-info border-info/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Active Projects</p>
          <p className="text-3xl font-bold mt-1">{projects.active}</p>
        </div>
        <div className="rounded-lg border bg-success/10 text-success border-success/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Completed</p>
          <p className="text-3xl font-bold mt-1">{projects.completed}</p>
        </div>
        <div className="rounded-lg border bg-gray-50 text-gray-700 border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Total Tasks</p>
          <p className="text-3xl font-bold mt-1">{totalTasks}</p>
        </div>
        <div className="rounded-lg border bg-danger/10 text-danger border-danger/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Overdue Tasks</p>
          <p className="text-3xl font-bold mt-1">{overdue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {byStatus.map((g) => (
          <div
            key={g.status}
            className={`rounded-lg border p-4 ${STATUS_COLORS[g.status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              {STATUS_LABELS[g.status] ?? g.status}
            </p>
            <p className="text-3xl font-bold mt-1">{g.count}</p>
          </div>
        ))}
      </div>

      {byCategory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-600 mb-3">Tasks by Category</p>
          <div className="space-y-2">
            {byCategory.map((g) => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-36 truncate">{g.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-primary rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (g.count / Math.max(...byCategory.map((d) => d.count), 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 w-6 text-right">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
