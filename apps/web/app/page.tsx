'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { buttonVariants } from '@/components/ui/button';
import AnalyticsCharts from '@/app/components/AnalyticsCharts';
import { api } from '@/lib/api';

interface AnalyticsData {
  projects: { active: number; completed: number; total: number };
  byStatus: { status: string; count: number }[];
  overdue: number;
  totalTasks: number;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data: result } = await api.get<AnalyticsData>('/analytics');
      return result;
    },
  });

  const todoCount =
    data?.byStatus.find((s) => s.status === 'TODO')?.count ?? 0;
  const inProgressCount =
    data?.byStatus.find((s) => s.status === 'IN_PROGRESS')?.count ?? 0;
  const doneCount =
    data?.byStatus.find((s) => s.status === 'DONE')?.count ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            EthioTelecom Project Manager
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Project and task management dashboard.
          </p>
        </div>
        {data && data.overdue > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
            {data.overdue} Overdue
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-none rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-gray-900">
              {isLoading ? '—' : data?.projects.active ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-none rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-gray-900">
              {isLoading ? '—' : data?.projects.completed ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-none rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-gray-900">
              {isLoading ? '—' : data?.totalTasks ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-none rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-gray-900">
              {isLoading ? '—' : data?.overdue ?? 0}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8 shadow-none rounded-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Task Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{todoCount}</p>
              <p className="text-xs text-muted-foreground">To Do</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{doneCount}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </div>
          {data && data.totalTasks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round((doneCount / data.totalTasks) * 100)}% complete</span>
              </div>
              <Progress
                value={(doneCount / data.totalTasks) * 100}
                className="h-2 [&_[data-slot=progress-indicator]]:bg-primary"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AnalyticsCharts />

      <Card className="mt-8 shadow-none rounded-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/projects/new"
              className={buttonVariants({
                variant: 'default',
                className:
                  'bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-none rounded-md',
              })}
            >
              New Project
            </Link>
            <Link
              href="/projects"
              className={buttonVariants({
                variant: 'outline',
                className: 'font-medium shadow-none rounded-md text-gray-700',
              })}
            >
              View All Projects
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
