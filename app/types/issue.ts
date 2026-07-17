// Shared types for issue list responses used by GET /api/issues + React Query

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IssueListItem {
  id: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  department: string | null;
  dueDate: string | null;      // ISO string from JSON (Date serialised)
  assignee: { name: string } | null;
  createdAt: string;           // ISO string from JSON
}

export interface IssueListResponse {
  issues: IssueListItem[];
  total: number;
  page: number;
  totalPages: number;
}
