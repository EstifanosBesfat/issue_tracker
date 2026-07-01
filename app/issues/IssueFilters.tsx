'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const statuses = [
  { label: 'All Statuses', value: '' },
  { label: 'Open',         value: 'OPEN' },
  { label: 'In Progress',  value: 'IN_PROGRESS' },
  { label: 'Closed',       value: 'CLOSED' },
];

const priorities = [
  { label: 'All Priorities', value: '' },
  { label: 'Critical',       value: 'CRITICAL' },
  { label: 'High',           value: 'HIGH' },
  { label: 'Medium',         value: 'MEDIUM' },
  { label: 'Low',            value: 'LOW' },
];

const departments = [
  { label: 'All Departments',   value: '' },
  { label: 'Network',           value: 'Network' },
  { label: 'IT',                value: 'IT' },
  { label: 'Customer Service',  value: 'Customer Service' },
  { label: 'Finance',           value: 'Finance' },
  { label: 'HR',                value: 'HR' },
];

const orderByOptions = [
  { label: 'Date Created', value: 'createdAt' },
  { label: 'Title',        value: 'title' },
  { label: 'Status',       value: 'status' },
  { label: 'Priority',     value: 'priority' },
];

interface Props {
  currentStatus?:     string;
  currentPriority?:   string;
  currentDepartment?: string;
  currentOrderBy?:    string;
  currentDirection?:  string;
  currentSearch?:     string;
}

export default function IssueFilters({
  currentStatus     = '',
  currentPriority   = '',
  currentDepartment = '',
  currentOrderBy    = 'createdAt',
  currentDirection  = 'desc',
  currentSearch     = '',
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.replace(`/issues?${params.toString()}`);
  }, [router, searchParams]);

  // Debounce the search input by 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      update('q', searchValue);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, update]);

  const selectClass =
    'text-sm rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#00A651]/40 focus:border-[#00A651]';

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search issues…"
          className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-zinc-300 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#00A651]/40 focus:border-[#00A651]"
        />
      </div>

      <select className={selectClass} value={currentStatus} onChange={(e) => update('status', e.target.value)}>
        {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <select className={selectClass} value={currentPriority} onChange={(e) => update('priority', e.target.value)}>
        {priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>

      <select className={selectClass} value={currentDepartment} onChange={(e) => update('department', e.target.value)}>
        {departments.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>
    </div>
  );
}
