'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { api } from '@/lib/api';
import type { Project, ProjectProgress } from '@/app/types/project';
import ProgressRing from '@/app/components/ProgressRing';
import ProjectStatusBadge from '@/app/components/ProjectStatusBadge';
import OverdueBadge from '@/app/components/OverdueBadge';
import { getDueDateStatus } from '@/app/lib/dueDateUtils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type ProjectRow = Project & { progress?: ProjectProgress };

const columnHelper = createColumnHelper<ProjectRow>();

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects');
      return data;
    },
  });

  const progressQueries = useQueries({
    queries: projects.map((p) => ({
      queryKey: ['project-progress', p.id],
      queryFn: async () => {
        const { data } = await api.get<ProjectProgress>(`/projects/${p.id}/progress`);
        return data;
      },
      enabled: projects.length > 0,
    })),
  });

  const rows: ProjectRow[] = useMemo(() => {
    return projects.map((p, i) => ({
      ...p,
      progress: progressQueries[i]?.data,
    }));
  }, [projects, progressQueries]);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.division?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, statusFilter, search]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'progress',
        header: '',
        cell: ({ row }) => (
          <ProgressRing percent={row.original.progress?.percent ?? 0} size={40} />
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/projects/${row.original.id}`}
            className="font-medium text-gray-900 hover:text-secondary"
          >
            {row.original.name}
          </Link>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <ProjectStatusBadge status={getValue()} />,
      }),
      columnHelper.display({
        id: 'percent',
        header: 'Progress',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{row.original.progress?.percent ?? 0}%</span>
        ),
      }),
      columnHelper.display({
        id: 'division',
        header: 'Division',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.division?.name ?? '—'}
          </span>
        ),
      }),
      columnHelper.accessor('dueDate', {
        header: 'Due Date',
        cell: ({ row }) => {
          const due = row.original.dueDate;
          if (!due) return <span className="text-gray-400">—</span>;
          const overdue =
            row.original.status !== 'COMPLETED' &&
            getDueDateStatus(due, row.original.status) === 'overdue';
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {new Date(due).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {overdue && <OverdueBadge />}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'members',
        header: 'Members',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.members?.length ?? 0}
          </span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your projects and track progress.</p>
        </div>
        <Link
          href="/projects/new"
          className={buttonVariants({
            className: 'bg-primary text-primary-foreground hover:opacity-90',
          })}
        >
          New Project
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {!isLoading && projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-base font-semibold text-gray-800">No projects yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Create your first project to start assigning tasks.
          </p>
          <Link
            href="/projects/new"
            className={buttonVariants({
              className: 'bg-primary text-primary-foreground',
            })}
          >
            Create project
          </Link>
        </div>
      )}

      {/* Card grid for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:hidden">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading projects…</p>
        ) : filtered.length === 0 && projects.length > 0 ? (
          <p className="text-sm text-gray-500 col-span-full text-center py-8">
            No projects match your filters.
          </p>
        ) : (
          filtered.map((p) => (
            <Card key={p.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ProgressRing percent={p.progress?.percent ?? 0} size={44} />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-semibold text-gray-900 hover:text-secondary block truncate"
                    >
                      {p.name}
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <ProjectStatusBadge status={p.status} />
                      {p.division && (
                        <span className="text-xs text-gray-500">{p.division.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {p.members?.length ?? 0} members · {p.progress?.percent ?? 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Table for desktop */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  Loading projects…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No projects found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
