'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Search } from 'lucide-react';

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

interface Division {
  id: string;
  name: string;
}

interface Props {
  divisions?:         Division[];
  currentStatus?:     string;
  currentPriority?:   string;
  currentDivisionId?: string;
  currentOrderBy?:    string;
  currentDirection?:  string;
  currentSearch?:     string;
}

export default function IssueFilters({
  divisions         = [],
  currentStatus     = '',
  currentPriority   = '',
  currentDivisionId = '',
  currentSearch     = '',
}: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // always reset to page 1 on filter change
      router.replace(`/issues?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Debounce search input 400 ms
  useEffect(() => {
    if (searchValue === currentSearch) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      update('q', searchValue);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, currentSearch, update]);

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search issues…"
          className="pl-9"
          id="issue-search"
        />
      </div>

      {/* Status */}
      <Select
        id="issue-status"
        value={currentStatus}
        onChange={(e) => update('status', e.target.value)}
        className="w-36"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>

      {/* Priority */}
      <Select
        id="issue-priority"
        value={currentPriority}
        onChange={(e) => update('priority', e.target.value)}
        className="w-36"
      >
        {priorities.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </Select>

      {/* Division */}
      <Select
        id="issue-division"
        value={currentDivisionId}
        onChange={(e) => update('divisionId', e.target.value)}
        className="w-40"
      >
        <option value="">All Divisions</option>
        {divisions.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Select>
    </div>
  );
}
