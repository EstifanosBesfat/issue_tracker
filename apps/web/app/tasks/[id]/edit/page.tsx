'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/lib/api';
import { patchTaskSchema } from '@/app/validationSchemas';
import type { Division } from '@/app/types/project';
import type { Task } from '@/app/types/task';
import { z } from 'zod';
import ImageUpload from '@/app/components/ImageUpload';

type FormData = z.infer<typeof patchTaskSchema>;

export default function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data } = await api.get<Task>(`/tasks/${id}`);
      return data;
    },
  });

  const existingImages = task?.images?.map((img) => img.url) ?? [];
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (task?.images) {
      setImageUrls(task.images.map((img) => img.url));
    }
  }, [task]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(patchTaskSchema),
    values: task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          category: task.category,
          divisionId: task.divisionId ?? '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          assigneeId: task.assigneeId ?? '',
        }
      : undefined,
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const { data } = await api.get<Division[]>('/divisions');
      return data.filter((d) => d.isActive);
    },
  });

  const { data: project } = useQuery({
    queryKey: ['project', task?.projectId],
    queryFn: async () => {
      if (!task?.projectId) return null;
      const { data } = await api.get<{ members?: { user: { id: string; name: string | null; email: string } }[] }>(
        `/projects/${task.projectId}`,
      );
      return data;
    },
    enabled: !!task?.projectId,
  });

  const members = project?.members ?? [];

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        category: data.category,
        divisionId: data.divisionId || null,
        dueDate: data.dueDate || null,
        assigneeId: data.assigneeId || null,
        imageUrls: imageUrls,
      };
      await api.patch(`/tasks/${id}`, payload);
      router.push(`/tasks/${id}`);
    } catch (err) {
      setError('root', { message: getApiErrorMessage(err, 'Failed to update task') });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  if (!task) {
    return <p className="text-sm text-danger">Task not found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/tasks/${id}`} className="text-sm text-secondary hover:underline">
          ← Back to task
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Task</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg border border-gray-200 p-6 space-y-5"
      >
        {errors.root && (
          <div className="rounded-md bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            {...register('title')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select id="status" {...register('status')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select id="priority" {...register('priority')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select id="category" {...register('category')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="MOBILE_NETWORK">Mobile Network</option>
            <option value="FIBER_BROADBAND">Fiber Broadband</option>
            <option value="TELEBIRR_BILLING">Telebirr Billing</option>
            <option value="CORE_INFRASTRUCTURE">Core Infrastructure</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="divisionId" className="block text-sm font-medium text-gray-700 mb-1">
              Division
            </label>
            <select id="divisionId" {...register('divisionId')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">None</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              {...register('dueDate')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <select id="assigneeId" {...register('assigneeId')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name ?? m.user.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
          <ImageUpload onUpload={setImageUrls} existingCount={imageUrls.length} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
