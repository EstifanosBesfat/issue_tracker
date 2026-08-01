export type ProjectStatus = 'ACTIVE' | 'COMPLETED';
export type ProjectRole = 'OWNER' | 'MEMBER';

export interface ProjectMember {
  id: string;
  role: ProjectRole;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  divisionId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  division?: { id: string; name: string } | null;
  members?: ProjectMember[];
  _count?: { tasks: number };
}

export interface ProjectProgress {
  total: number;
  done: number;
  percent: number;
  status: ProjectStatus;
}

export interface Division {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
