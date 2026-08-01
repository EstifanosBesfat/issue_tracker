export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Category =
  | 'MOBILE_NETWORK'
  | 'FIBER_BROADBAND'
  | 'TELEBIRR_BILLING'
  | 'CORE_INFRASTRUCTURE'
  | 'OTHER';

export interface TaskUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

export interface TaskImage {
  id: string;
  url: string;
}

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  author: TaskUser & { image: string | null };
}

export interface ActivityLog {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: { name: string | null; image: string | null } | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  category: Category;
  projectId: string;
  divisionId: string | null;
  dueDate: string | null;
  reporterId: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: TaskUser | null;
  assignee?: TaskUser | null;
  division?: { id: string; name: string } | null;
  project?: { id: string; name: string };
  images?: TaskImage[];
  comments?: TaskComment[];
  activityLogs?: ActivityLog[];
  _count?: { comments: number };
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
