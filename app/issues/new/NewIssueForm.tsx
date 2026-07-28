'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { createIssueSchema } from '@/app/validationSchemas';
import { ImageUpload } from '@/app/components';
import { z } from 'zod';

type IssueFormData = z.infer<typeof createIssueSchema>;

interface User {
  id: string;
  name: string | null;
}

interface Division {
  id: string;
  name: string;
}

interface Props {
  users: User[];
  divisions: Division[];
}

interface WorkloadEntry {
  id: string;
  name: string | null;
  email: string;
  openTickets: number;
  openTicketsInCategory: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  MOBILE_NETWORK: 'Mobile Network',
  FIBER_BROADBAND: 'Fiber Broadband',
  TELEBIRR_BILLING: 'Telebirr & Billing',
  CORE_INFRASTRUCTURE: 'Core Infrastructure',
  OTHER: 'Other',
};

export default function NewIssueForm({ users, divisions }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommended, setRecommended] = useState<WorkloadEntry | null>(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: { priority: 'MEDIUM', category: 'OTHER' },
  });

  const selectedCategory = watch('category');
  const selectedAssigneeId = watch('assigneeId');

  // Technician workload balancing — whenever the category changes, ask the
  // server who currently has the fewest open tickets in that category.
  const fetchRecommendation = useCallback(async (category: string | undefined) => {
    setLoadingWorkload(true);
    try {
      const url = category
        ? `/api/technicians/workload?category=${encodeURIComponent(category)}`
        : '/api/technicians/workload';
      const res = await axios.get(url);
      setRecommended(res.data.recommended ?? null);
    } catch {
      setRecommended(null);
    } finally {
      setLoadingWorkload(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendation(selectedCategory);
    // Re-run only when the category changes, not on every keystroke elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const applyRecommendation = () => {
    if (recommended) {
      setValue('assigneeId', recommended.id, { shouldDirty: true });
    }
  };

  const onSubmit = async (data: IssueFormData) => {
    try {
      setIsSubmitting(true);

      // The schema expects dueDate as an ISO datetime string or null/undefined.
      // The <input type="date"> produces "YYYY-MM-DD", so we convert it here.
      const dueDate =
        data.dueDate && data.dueDate.trim() !== ''
          ? new Date(data.dueDate).toISOString()
          : undefined;

      // Coerce empty assigneeId to null so it passes cuid() | null validation
      const assigneeId =
        data.assigneeId && data.assigneeId.trim() !== ''
          ? data.assigneeId
          : null;

      await axios.post('/api/issues', { ...data, dueDate, assigneeId, imageUrls });
      // Invalidate React Query cache so the issues list refreshes automatically
      await queryClient.invalidateQueries({ queryKey: ['issues'] });
      router.push('/issues');
    } catch {
      setIsSubmitting(false);
      setError('An unexpected error occurred while saving.');
    }
  };

  const cls =
    'mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all';

  const categoryLabel = CATEGORY_LABELS[selectedCategory ?? ''] ?? 'this category';
  const showRecommendation =
    recommended && (!selectedAssigneeId || selectedAssigneeId === '') && !loadingWorkload;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-1 text-gray-900">New Incident Ticket</h1>
      <p className="text-sm text-gray-500 mb-6">File a new issue or service request.</p>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 text-danger rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700">Title</label>
          <input type="text" {...register('title')} className={cls} placeholder="Issue title" />
          {errors.title && (
            <p className="mt-1 text-xs text-danger">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            className={cls}
            placeholder="Describe the problem in detail."
          />
          {errors.description && (
            <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
          )}
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Division</label>
            <select {...register('divisionId')} className={cls}>
              <option value="">— Select —</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Assign To</label>
            <select {...register('assigneeId')} className={cls}>
              <option value="">— Unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.id}
                </option>
              ))}
            </select>
            {showRecommendation && (
              <div className="mt-1.5 flex items-start gap-2 text-xs bg-info/10 border border-info/20 rounded-md px-3 py-2">
                <span className="text-info">💡</span>
                <div className="flex-1">
                  <p className="text-info">
                    <strong>{recommended!.name ?? recommended!.email}</strong> has the lightest load in{' '}
                    {categoryLabel} — {recommended!.openTicketsInCategory} open in this category
                    ({recommended!.openTickets} total).
                  </p>
                  <button
                    type="button"
                    onClick={applyRecommendation}
                    className="mt-1 font-semibold text-info hover:underline"
                  >
                    Assign to {recommended!.name ?? 'them'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="date" {...register('dueDate')} className={cls} />
          {errors.dueDate && (
            <p className="mt-1 text-xs text-danger">{errors.dueDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Attachments</label>
          <ImageUpload onUpload={setImageUrls} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
