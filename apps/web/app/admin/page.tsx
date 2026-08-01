'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth-context';
import { api, getSwaggerUrl } from '@/lib/api';
import UserTable from './components/UserTable';
import DivisionTable from './components/DivisionTable';
import StatsOverview from './components/StatsOverview';

interface AnalyticsData {
  projects: { active: number; completed: number; total: number };
  byStatus: { status: string; count: number }[];
  byCategory: { name: string; count: number }[];
  overdue: number;
  totalTasks: number;
}

export default function AdminPage() {
  const { user } = useAuth();

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsData>('/analytics');
      return data;
    },
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <h1 className="text-2xl font-bold text-danger mb-2">Access Denied</h1>
        <p className="text-gray-500">You need administrator privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage users, divisions, and view system statistics.
          </p>
        </div>
        <Link
          href={getSwaggerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-secondary hover:underline"
        >
          API Docs (Swagger) →
        </Link>
      </div>

      {analytics && (
        <StatsOverview
          projects={analytics.projects}
          byStatus={analytics.byStatus}
          byCategory={analytics.byCategory}
          overdue={analytics.overdue}
          totalTasks={analytics.totalTasks}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">User Management</h2>
        <UserTable currentUserId={user.id} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Division Management</h2>
        <DivisionTable />
      </div>
    </div>
  );
}
