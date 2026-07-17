'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { patchIssueSchema } from '@/app/validationSchemas';
import { z } from 'zod';

type IssueFormData = z.infer<typeof patchIssueSchema>;

interface Props {
  issue: {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
    category?: 'MOBILE_NETWORK' | 'FIBER_BROADBAND' | 'TELEBIRR_BILLING' | 'CORE_INFRASTRUCTURE' | 'OTHER' | null;
    department?: string | null;
    dueDate?: Date | null;
    assigneeId?: string | null;
  };
  isAdmin?: boolean;
  users?: { id: string; name: string | null }[];
}

export default function EditIssueForm({ issue, isAdmin = false, users = [] }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<IssueFormData>({
    resolver: zodResolver(patchIssueSchema),
    defaultValues: {
      title:       issue.title,
      description: issue.description,
      status:      issue.status,
      priority:    issue.priority    ?? undefined,
      category:    issue.category    ?? undefined,
      department:  issue.department  ?? undefined,
      assigneeId:  issue.assigneeId  ?? undefined,
      dueDate:     issue.dueDate
        ? new Date(issue.dueDate).toISOString().split('T')[0]
        : undefined,
    },
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: IssueFormData) => {
    try {
      setIsSubmitting(true);
      const dueDate =
        data.dueDate && data.dueDate.trim() !== ''
          ? new Date(data.dueDate).toISOString()
          : null;
      const assigneeId =
        data.assigneeId && data.assigneeId.trim() !== ''
          ? data.assigneeId
          : null;
      await axios.patch(`/api/issues/${issue.id}`, { ...data, dueDate, assigneeId });
      // Invalidate React Query cache so the issues list refreshes on navigation back
      await queryClient.invalidateQueries({ queryKey: ['issues'] });
      router.push(`/issues/${issue.id}`);
      router.refresh();
    } catch {
      setIsSubmitting(false);
      setError('An unexpected error occurred while saving your changes.');
    }
  };

  const cls = 'mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] transition-all';

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-1 text-gray-900">Edit Issue</h1>
      <p className="text-sm text-gray-500 mb-6">Update the details of this ticket.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Title</label>
          <input type="text" {...register('title')} className={cls} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Description</label>
          <textarea {...register('description')} rows={5} className={cls} />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        {/* Status — ADMIN only */}
        {isAdmin && (
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Status{' '}
              <span className="text-xs font-normal text-[#00A651]">(Admin only)</span>
            </label>
            <select {...register('status')} className={cls}>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        )}

        {/* Category + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Category</label>
            <select {...register('category')} className={cls}>
              <option value="MOBILE_NETWORK">Mobile Network</option>
              <option value="FIBER_BROADBAND">Fiber Broadband</option>
              <option value="TELEBIRR_BILLING">Telebirr &amp; Billing</option>
              <option value="CORE_INFRASTRUCTURE">Core Infrastructure</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Priority</label>
            <select {...register('priority')} className={cls}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Department + Assignee */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Department</label>
            <select {...register('department')} className={cls}>
              <option value="">— Select —</option>
              <option value="Network">Network</option>
              <option value="IT">IT</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Assign To</label>
            <select {...register('assigneeId')} className={cls}>
              <option value="">— Unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name ?? u.id}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Due date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Due Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input type="date" {...register('dueDate')} className={cls} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[#00A651] py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3d] disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
