'use client';

import { useQuery } from '@tanstack/react-query';
import type { IssueListResponse } from '@/app/types/issue';

export interface IssueQueryParams {
  q?:          string;
  status?:     string;
  priority?:   string;
  divisionId?: string;
  orderBy?:    string;
  direction?:  string;
  page?:       string | number;
}

async function fetchIssues(params: IssueQueryParams): Promise<IssueListResponse> {
  const sp = new URLSearchParams();
  if (params.q)          sp.set('q',          params.q);
  if (params.status)     sp.set('status',     params.status);
  if (params.priority)   sp.set('priority',   params.priority);
  if (params.divisionId) sp.set('divisionId', params.divisionId);
  if (params.orderBy)    sp.set('orderBy',    params.orderBy);
  if (params.direction)  sp.set('direction',  params.direction);
  if (params.page)       sp.set('page',       String(params.page));

  const res = await fetch(`/api/issues?${sp.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch issues: ${res.status}`);
  return res.json();
}

export function useIssuesQuery(params: IssueQueryParams) {
  return useQuery({
    queryKey: ['issues', params],
    queryFn:  () => fetchIssues(params),
  });
}
